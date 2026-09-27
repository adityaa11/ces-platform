import { createHash } from "node:crypto";
import { parseNormalizedDocument, parseSemanticExtractionContext, semanticContractVersion, type SemanticBackgroundJob, type SemanticSkillId } from "@atlas/contracts";
import type { AuthorizedSemanticContext, SemanticAcceptanceHandler, SemanticAuthority, SemanticExecutionRequest } from "@atlas/core";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value, Object.keys(value as object).sort())).digest("hex");
const stageSkill = (stage: unknown): SemanticSkillId => stage === "extraction" ? "atlas.semantic.extract" : "atlas.semantic.reconcile";

/** Atlas-only SQL adapter. Bridge receives contexts, never this connection. */
export class PostgresSemanticAuthority implements SemanticAuthority {
  constructor(private readonly sql: Sql) {}

  async redeem(request: SemanticExecutionRequest): Promise<AuthorizedSemanticContext> {
    return this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT e.*, d.source_sha256, p.capability_identity, c.normalized_document FROM atlas.semantic_execution e JOIN atlas.document d ON d.id=e.document_id AND d.project_id=e.project_id AND d.workspace_id=e.workspace_id JOIN atlas.extraction_bundle_document m ON m.bundle_id=e.bundle_id AND m.document_id=e.document_id AND m.project_id=e.project_id AND m.workspace_id=e.workspace_id JOIN atlas.document_perception_execution p ON p.id=m.perception_execution_id JOIN atlas.normalized_document_cache c ON c.source_sha256=d.source_sha256 AND c.capability_identity=p.capability_identity AND c.invalidated_at IS NULL WHERE e.id=$1 FOR UPDATE OF e", [request.executionId]);
      if (!rows.length) throw new Error("Semantic execution is unavailable.");
      const row = rows[0];
      if (row.lifecycle === "completed" || row.lifecycle === "failed" || new Date(String(row.capability_valid_until)).getTime() <= Date.now()) throw new Error("Semantic execution is stale.");
      if (stageSkill(row.stage) !== request.skill.id || row.skill_version !== request.skill.version || row.contract_version !== semanticContractVersion || digest(request.contextCapability) !== row.authorized_context_fingerprint) throw new Error("Semantic execution authorization failed.");
      if (row.stage !== "extraction") throw new Error("Reconciliation context is unavailable until IDSER-007 selection authority is implemented.");
      const normalized = parseNormalizedDocument(typeof row.normalized_document === "string" ? JSON.parse(row.normalized_document) : row.normalized_document);
      if (normalized.artifactId !== row.document_id || normalized.sourceSha256 !== row.source_sha256) throw new Error("Normalized document binding failed.");
      const scope = { projectId: String(row.project_id), workspaceId: String(row.workspace_id), bundleId: String(row.bundle_id), documentId: String(row.document_id), executionId: String(row.id), contractVersion: semanticContractVersion } as const;
      const context = parseSemanticExtractionContext({ version: semanticContractVersion, skill: "atlas.semantic.extract", scope, normalizedDocument: normalized });
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='running' WHERE id=$1 AND lifecycle='queued'", [request.executionId]);
      return { executionId: scope.executionId, skill: request.skill, scope, context };
    });
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
      if (row.lifecycle === "failed") throw new Error("Semantic execution is failed.");
      await handler.accept({ executionId: String(row.id), completionFingerprint, envelope });
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='completed', completion_fingerprint=$2, completed_at=now() WHERE id=$1 AND lifecycle IN ('queued','running')", [row.id, completionFingerprint]);
    });
  }

  async fail(failure: unknown): Promise<void> {
    const scope = (failure as { scope?: Record<string, unknown> }).scope; if (!scope) throw new Error("Invalid semantic failure.");
    await this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT lifecycle, project_id, workspace_id, bundle_id, document_id FROM atlas.semantic_execution WHERE id=$1 FOR UPDATE", [scope.executionId]);
      if (!rows.length || rows[0].lifecycle === "completed" || String(rows[0].project_id) !== scope.projectId || String(rows[0].workspace_id) !== scope.workspaceId || String(rows[0].bundle_id) !== scope.bundleId || String(rows[0].document_id) !== scope.documentId) throw new Error("Semantic failure is unauthorized.");
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='failed', failure_code=$2 WHERE id=$1 AND lifecycle <> 'failed'", [scope.executionId, (failure as { code: string }).code]);
    });
  }
}
