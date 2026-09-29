import { createHash } from "node:crypto";
import { parseNormalizedDocument, parseSemanticExtractionContext, parseSemanticReconciliationContext, semanticContractVersion, type SemanticSkillId } from "@atlas/contracts";
import type { AuthorizedSemanticContext, SemanticAcceptanceHandler, SemanticAuthority, SemanticExecutionRequest, SemanticReconciliationSelectionPort } from "@atlas/core";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]));
  return value;
};
export const canonicalSemanticFingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const digest = canonicalSemanticFingerprint;
const stageSkill = (stage: unknown): SemanticSkillId => stage === "extraction" ? "atlas.semantic.extract" : "atlas.semantic.reconcile";
const json = (value: unknown) => typeof value === "string" ? JSON.parse(value) : value;

/** Atlas-only SQL adapter. Bridge receives contexts, never this connection. */
export class PostgresSemanticAuthority implements SemanticAuthority {
  constructor(private readonly sql: Sql, private readonly reconciliationSelection?: SemanticReconciliationSelectionPort) {}

  async redeem(request: SemanticExecutionRequest): Promise<AuthorizedSemanticContext> {
    return this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT e.*, d.source_sha256 FROM atlas.semantic_execution e JOIN atlas.document d ON d.id=e.document_id AND d.project_id=e.project_id AND d.workspace_id=e.workspace_id WHERE e.id=$1 FOR UPDATE OF e", [request.executionId]);
      if (!rows.length) throw new Error("Semantic execution is unavailable.");
      const row = rows[0];
      if (row.lifecycle === "completed" || row.lifecycle === "failed" || row.lifecycle === "cancelled" || new Date(String(row.capability_valid_until)).getTime() <= Date.now()) throw new Error("Semantic execution is stale.");
      if (stageSkill(row.stage) !== request.skill.id || row.skill_version !== request.skill.version || row.contract_version !== semanticContractVersion || digest(request.contextCapability) !== row.authorized_context_fingerprint) throw new Error("Semantic execution authorization failed.");
      const scope = { projectId: String(row.project_id), workspaceId: String(row.workspace_id), bundleId: String(row.bundle_id), documentId: String(row.document_id), executionId: String(row.id), contractVersion: semanticContractVersion } as const;
      const context = row.stage === "extraction"
        ? await this.extractionContext(sql, row, scope)
        : await this.reconciliationContext(sql, row, scope);
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='running' WHERE id=$1 AND lifecycle='queued'", [request.executionId]);
      return { executionId: scope.executionId, skill: request.skill, scope, context };
    });
  }

  private async extractionContext(sql: Sql, row: Row, scope: AuthorizedSemanticContext["scope"]): Promise<unknown> {
    const cached = await sql.unsafe("SELECT p.id AS perception_execution_id, c.normalized_document FROM atlas.extraction_bundle_document m JOIN atlas.document_perception_execution p ON p.id=m.perception_execution_id JOIN atlas.normalized_document_cache c ON c.source_sha256=$2 AND c.capability_identity=p.capability_identity AND c.invalidated_at IS NULL WHERE m.bundle_id=$1 AND m.document_id=$3 AND m.project_id=$4 AND m.workspace_id=$5 FOR UPDATE OF p", [scope.bundleId, row.source_sha256, scope.documentId, scope.projectId, scope.workspaceId]);
    if (!cached.length) throw new Error("Normalized document is unavailable.");
    const normalized = parseNormalizedDocument(json(cached[0].normalized_document));
    if (normalized.executionId !== cached[0].perception_execution_id || normalized.artifactId !== scope.documentId || normalized.sourceSha256 !== row.source_sha256) throw new Error("Normalized document binding failed.");
    return parseSemanticExtractionContext({ version: semanticContractVersion, skill: "atlas.semantic.extract", scope, normalizedDocument: normalized });
  }

  private async reconciliationContext(sql: Sql, row: Row, scope: AuthorizedSemanticContext["scope"]): Promise<unknown> {
    const prior = await sql.unsafe("SELECT context_json, context_fingerprint FROM atlas.semantic_execution_context WHERE execution_id=$1 FOR UPDATE", [scope.executionId]);
    if (prior.length) {
      const context = parseSemanticReconciliationContext(json(prior[0].context_json));
      if (String(prior[0].context_fingerprint) !== digest(context)) throw new Error("Persisted reconciliation context is invalid.");
      return context;
    }
    if (!this.reconciliationSelection) throw new Error("Reconciliation selection authority is unavailable.");
    const context = parseSemanticReconciliationContext(await this.reconciliationSelection.select(scope));
    if (context.scope.projectId !== scope.projectId || context.scope.workspaceId !== scope.workspaceId || context.scope.bundleId !== scope.bundleId || context.scope.documentId !== scope.documentId || context.scope.executionId !== scope.executionId) throw new Error("Reconciliation selection scope mismatch.");
    const fingerprint = digest(context);
    await sql.unsafe("INSERT INTO atlas.semantic_execution_context (execution_id, context_json, context_fingerprint) VALUES ($1,$2::jsonb,$3)", [scope.executionId, context, fingerprint]);
    return context;
  }

  async deliver(envelope: unknown, handler: SemanticAcceptanceHandler): Promise<void> {
    const value = envelope as { scope?: Record<string, unknown>; skill?: { id?: unknown; version?: unknown } };
    const scope = value.scope; if (!scope || !value.skill) throw new Error("Invalid semantic envelope.");
    const completionFingerprint = digest(envelope);
    await this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT * FROM atlas.semantic_execution WHERE id=$1 FOR UPDATE", [scope.executionId]);
      if (!rows.length) throw new Error("Semantic execution is unavailable.");
      const row = rows[0];
      if (String(row.project_id) !== scope.projectId || String(row.workspace_id) !== scope.workspaceId || String(row.bundle_id) !== scope.bundleId || String(row.document_id) !== scope.documentId || stageSkill(row.stage) !== value.skill!.id || row.skill_version !== value.skill!.version) throw new Error("Semantic result scope mismatch.");
      if (row.lifecycle === "completed") { if (row.completion_fingerprint === completionFingerprint) return; throw new Error("Semantic result conflicts with completed execution."); }
      if (row.lifecycle === "failed" || row.lifecycle === "cancelled") throw new Error("Semantic execution is not accepting results.");
      await handler.accept({ executionId: String(row.id), completionFingerprint, envelope }, sql);
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='completed', completion_fingerprint=$2, completed_at=now() WHERE id=$1 AND lifecycle IN ('queued','running')", [row.id, completionFingerprint]);
    });
  }

  async fail(failure: unknown): Promise<void> {
    const scope = (failure as { scope?: Record<string, unknown> }).scope; if (!scope) throw new Error("Invalid semantic failure.");
    await this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT lifecycle, project_id, workspace_id, bundle_id, document_id FROM atlas.semantic_execution WHERE id=$1 FOR UPDATE", [scope.executionId]);
      if (!rows.length || rows[0].lifecycle === "completed" || rows[0].lifecycle === "cancelled" || String(rows[0].project_id) !== scope.projectId || String(rows[0].workspace_id) !== scope.workspaceId || String(rows[0].bundle_id) !== scope.bundleId || String(rows[0].document_id) !== scope.documentId) throw new Error("Semantic failure is unauthorized.");
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='failed', failure_code=$2 WHERE id=$1 AND lifecycle <> 'failed'", [scope.executionId, (failure as { code: string }).code]);
    });
  }
}
