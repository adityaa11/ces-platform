import { createHash } from "node:crypto";
import { parseNormalizedDocument, parseQualifiedStepwiseAcceptance, parseSemanticExtractionContext, parseSemanticReconciliationContext, semanticContractVersion, type QualifiedStepwiseAcceptanceInput, type SemanticSkillId } from "@atlas/contracts";
import { createDerivedImageManifestSha256, type AuthorizedSemanticContext, type DerivedImageAssetReader, type DerivedImageGrantAuthority, type DerivedImageGrantScope, type DerivedImageManifest, type QualifiedStepwiseAcceptanceHandler, type SemanticAcceptanceHandler, type SemanticAuthority, type SemanticExecutionRequest, type SemanticReconciliationSelectionPort } from "@atlas/core";
import type { DerivedAssetStore } from "@atlas/document-store";

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

/**
 * Atlas-only service authority for ephemeral semantic media reads.  It uses
 * the accepted derived manifest as the one source of asset truth and never
 * exposes a storage key to Bridge.
 */
export class PostgresSemanticDerivedImageAuthority implements DerivedImageGrantAuthority, DerivedImageAssetReader {
  constructor(private readonly sql: Sql, private readonly store: DerivedAssetStore) {}

  async assertAuthorized(scope: DerivedImageGrantScope): Promise<void> {
    if (scope.authorization.kind !== "semantic_execution") throw new Error("Derived media authority requires a semantic execution.");
    const rows = await this.sql.unsafe(`SELECT 1
      FROM atlas.semantic_execution semantic
      JOIN atlas.extraction_bundle_document member
        ON member.bundle_id=semantic.bundle_id AND member.document_id=semantic.document_id
        AND member.semantic_extraction_execution_id=semantic.id
      JOIN atlas.document_perception_execution perception ON perception.id=member.perception_execution_id
      JOIN atlas.document_perception_derived_manifest manifest
        ON manifest.execution_id=perception.id AND manifest.artifact_id=semantic.document_id
      WHERE semantic.id=$1
        AND semantic.id=$2
        AND semantic.project_id=$3 AND semantic.workspace_id=$4
        AND semantic.document_id=$5
        AND semantic.lifecycle IN ('queued','running')
        AND perception.id=$6
        AND manifest.asset_ref=$7 AND manifest.source_sha256=$8 AND manifest.profile=$9
        AND manifest.page_number=$10 AND manifest.locator_id=$11 AND manifest.media_type=$12
        AND manifest.sha256=$13 AND manifest.width=$14 AND manifest.height=$15 AND manifest.byte_size=$16
        AND manifest.accepted_at IS NOT NULL`, [scope.authorization.executionId, scope.authorization.executionId, scope.projectId, scope.workspaceId, scope.documentId, scope.perceptionExecutionId, scope.assetRef, scope.sourceSha256, scope.profile, scope.pageNumber, scope.locatorId, scope.mediaType, scope.imageSha256, scope.width, scope.height, scope.byteLength]);
    if (rows.length !== 1) throw new Error("Derived media grant is stale or unauthorized.");
  }

  async read(scope: DerivedImageGrantScope, signal: AbortSignal): Promise<{ readonly manifest: DerivedImageManifest; readonly bytes: Uint8Array }> {
    if (signal.aborted) throw new Error("Derived media read was cancelled.");
    await this.assertAuthorized(scope);
    const rows = await this.sql.unsafe(`SELECT manifest.asset_ref, manifest.source_sha256, manifest.profile, manifest.page_number, manifest.locator_id, manifest.media_type, manifest.width, manifest.height, manifest.byte_size, manifest.sha256
      FROM atlas.document_perception_derived_manifest manifest
      WHERE manifest.execution_id=$1 AND manifest.artifact_id=$2 AND manifest.asset_ref=$3
        AND manifest.source_sha256=$4 AND manifest.profile=$5 AND manifest.page_number=$6
        AND manifest.locator_id=$7 AND manifest.media_type=$8 AND manifest.sha256=$9
        AND manifest.width=$10 AND manifest.height=$11 AND manifest.byte_size=$12 AND manifest.accepted_at IS NOT NULL`, [scope.perceptionExecutionId, scope.documentId, scope.assetRef, scope.sourceSha256, scope.profile, scope.pageNumber, scope.locatorId, scope.mediaType, scope.imageSha256, scope.width, scope.height, scope.byteLength]);
    if (rows.length !== 1 || signal.aborted) throw new Error("Derived media is unavailable.");
    const row = rows[0];
    const identity = { projectId: scope.projectId, workspaceId: scope.workspaceId, documentId: scope.documentId, perceptionExecutionId: scope.perceptionExecutionId, sourceSha256: String(row.source_sha256), profile: String(row.profile), pageNumber: Number(row.page_number), locatorId: String(row.locator_id), assetRef: String(row.asset_ref), mediaType: "image/png" as const, width: Number(row.width), height: Number(row.height), byteLength: Number(row.byte_size), sha256: String(row.sha256) };
    const manifest: DerivedImageManifest = { ...identity, manifestSha256: createDerivedImageManifestSha256(identity) };
    if (manifest.manifestSha256 !== scope.manifestSha256) throw new Error("Derived media manifest binding is invalid.");
    const bytes = await this.store.readDerived(manifest.assetRef);
    if (signal.aborted) throw new Error("Derived media read was cancelled.");
    return { manifest, bytes };
  }
}

/** Atlas-only SQL adapter. Bridge receives contexts, never this connection. */
export class PostgresSemanticAuthority implements SemanticAuthority {
  constructor(private readonly sql: Sql, private readonly reconciliationSelection?: SemanticReconciliationSelectionPort, private readonly stepwiseMedia?: { readonly serviceIdentity: string; issue(scope: DerivedImageGrantScope): Promise<{ readonly grant: string; readonly replayFenceId: string; readonly expiresAt: number }> }) {}

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
    const referencedAssets = new Set(normalized.pages.flatMap((page) => page.visualRegions.map((region) => region.assetRef).filter((asset): asset is string => Boolean(asset))));
    // This legacy-shaped projection is retained only for direct historical
    // authority tests that do not compose the media capability. The production
    // internal plugin always supplies `stepwiseMedia`, including text-only
    // executions, so it cannot select the old worker path.
    if (!this.stepwiseMedia && referencedAssets.size === 0) return parseSemanticExtractionContext({ version: semanticContractVersion, skill: "atlas.semantic.extract", scope, normalizedDocument: normalized });
    if (referencedAssets.size && !this.stepwiseMedia) throw new Error("Stepwise semantic media authority is unavailable.");
    const manifests = referencedAssets.size
      ? await sql.unsafe("SELECT asset_ref, source_sha256, profile, page_number, locator_id, media_type, width, height, byte_size, sha256 FROM atlas.document_perception_derived_manifest WHERE execution_id=$1 AND artifact_id=$2 AND accepted_at IS NOT NULL AND asset_ref = ANY($3::text[]) FOR UPDATE", [cached[0].perception_execution_id, scope.documentId, [...referencedAssets]])
      : [];
    if (manifests.length !== referencedAssets.size) throw new Error("Accepted derived media is unavailable.");
    const assets = await Promise.all(manifests.map(async (manifest) => {
      if (manifest.media_type !== "image/png" || manifest.source_sha256 !== row.source_sha256) throw new Error("Accepted derived media binding failed.");
      const identity = { projectId: scope.projectId, workspaceId: scope.workspaceId, documentId: scope.documentId, perceptionExecutionId: String(cached[0].perception_execution_id), sourceSha256: String(manifest.source_sha256), profile: String(manifest.profile), pageNumber: Number(manifest.page_number), locatorId: String(manifest.locator_id), assetRef: String(manifest.asset_ref), mediaType: "image/png" as const, width: Number(manifest.width), height: Number(manifest.height), byteLength: Number(manifest.byte_size), sha256: String(manifest.sha256) };
      const manifestSha256 = createDerivedImageManifestSha256(identity);
      const { sha256: imageSha256, ...grantIdentity } = identity;
      const grantScope: DerivedImageGrantScope = { serviceIdentity: this.stepwiseMedia!.serviceIdentity, ...grantIdentity, manifestSha256, imageSha256, authorization: { kind: "semantic_execution", executionId: scope.executionId } };
      const media = await this.stepwiseMedia!.issue(grantScope);
      return { assetRef: identity.assetRef, sourceSha256: identity.sourceSha256, profile: identity.profile, pageNumber: identity.pageNumber, locatorId: identity.locatorId, mimeType: identity.mediaType, width: identity.width, height: identity.height, byteLength: identity.byteLength, sha256: identity.sha256, manifestSha256, media: { ...media, scope: grantScope } };
    }));
    return parseSemanticExtractionContext({ version: semanticContractVersion, skill: "atlas.semantic.extract", scope, normalizedDocument: normalized, stepwise: { profileId: "atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0", perceptionExecutionId: String(cached[0].perception_execution_id), assets } });
  }

  private async reconciliationContext(sql: Sql, row: Row, scope: AuthorizedSemanticContext["scope"]): Promise<unknown> {
    const prior = await sql.unsafe("SELECT context_json, context_fingerprint FROM atlas.semantic_execution_context WHERE execution_id=$1 FOR UPDATE", [scope.executionId]);
    if (prior.length) {
      const context = parseSemanticReconciliationContext(json(prior[0].context_json));
      if (String(prior[0].context_fingerprint) !== digest(context)) throw new Error("Persisted reconciliation context is invalid.");
      return context;
    }
    if (!this.reconciliationSelection) throw new Error("Reconciliation selection authority is unavailable.");
    const context = parseSemanticReconciliationContext(await this.reconciliationSelection.select(scope, sql));
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

  async deliverQualified(value: QualifiedStepwiseAcceptanceInput, handler: QualifiedStepwiseAcceptanceHandler): Promise<void> {
    const acceptance = parseQualifiedStepwiseAcceptance(value);
    const completionFingerprint = digest(acceptance);
    await this.sql.begin(async (sql) => {
      const scope = acceptance.scope;
      const rows = await sql.unsafe("SELECT id,project_id,workspace_id,bundle_id,document_id,stage,skill_version,lifecycle,completion_fingerprint,capability_valid_until FROM atlas.semantic_execution WHERE id=$1 FOR UPDATE", [scope.executionId]);
      if (rows.length !== 1) throw new Error("Qualified acceptance execution is unavailable.");
      const row = rows[0];
      if (String(row.project_id) !== scope.projectId || String(row.workspace_id) !== scope.workspaceId || String(row.bundle_id) !== scope.bundleId || String(row.document_id) !== scope.documentId || row.stage !== "extraction" || row.skill_version !== "v1") throw new Error("Qualified acceptance scope mismatch.");
      if (row.lifecycle === "completed") { if (row.completion_fingerprint === completionFingerprint) return; throw new Error("Qualified acceptance conflicts with completed execution."); }
      if (row.lifecycle === "failed" || row.lifecycle === "cancelled" || new Date(String(row.capability_valid_until)).getTime() <= Date.now()) throw new Error("Qualified acceptance execution is not accepting results.");
      await handler.acceptQualified({ executionId: scope.executionId, completionFingerprint, acceptance }, sql);
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='completed', completion_fingerprint=$2, completed_at=now() WHERE id=$1 AND lifecycle IN ('queued','running')", [scope.executionId, completionFingerprint]);
    });
  }

  async fail(failure: unknown): Promise<void> {
    const scope = (failure as { scope?: Record<string, unknown> }).scope; if (!scope) throw new Error("Invalid semantic failure.");
    await this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT lifecycle, project_id, workspace_id, bundle_id, document_id FROM atlas.semantic_execution WHERE id=$1 FOR UPDATE", [scope.executionId]);
      if (!rows.length || rows[0].lifecycle === "completed" || rows[0].lifecycle === "cancelled" || String(rows[0].project_id) !== scope.projectId || String(rows[0].workspace_id) !== scope.workspaceId || String(rows[0].bundle_id) !== scope.bundleId || String(rows[0].document_id) !== scope.documentId) throw new Error("Semantic failure is unauthorized.");
      const code = (failure as { code: string }).code;
      await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='failed', failure_code=$2 WHERE id=$1 AND lifecycle <> 'failed'", [scope.executionId, code]);
      // A terminal authenticated technical failure is lifecycle truth.  The
      // bridge retains its retry/effect ledger if this transaction cannot
      // commit, so an outage is never misrepresented as persisted attention.
      await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='needs_attention', last_failure_code=$3, last_failure_at=now() WHERE bundle_id=$1 AND document_id=$2 AND state NOT IN ('completed','qualified_deferred')", [rows[0].bundle_id, rows[0].document_id, code]);
      await sql.unsafe("UPDATE atlas.extraction_bundle SET state='needs_attention', last_failure_code=$2, last_failure_at=now() WHERE id=$1 AND state NOT IN ('ready_for_review','qualified_deferred')", [rows[0].bundle_id, code]);
    });
  }
}
