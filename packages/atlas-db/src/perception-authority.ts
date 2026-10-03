import { createHash, randomUUID } from "node:crypto";
import { documentPerceptionContractVersion, parseDocumentPerceptionRequest, parseNormalizedDocument, type DocumentPerceptionRequest, type NormalizedDocument } from "@atlas/core";
import type { DocumentPerceptionTechnicalFailure } from "@atlas/contracts";
import type { PerceptionAuthority, PerceptionExecutionInput, AuthorityRedeemedPerceptionSource } from "@atlas/core";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };
type GrantSigner = { issue(input: PerceptionExecutionInput): string; verify(grant: string): string; format(grantId: string): string };
type SemanticKickoffQueue = { enqueue(transaction: Sql, job: { readonly idempotencyKey: string; readonly execution: { readonly version: "v1"; readonly executionId: string; readonly mode: "background"; readonly skill: { readonly id: "atlas.semantic.extract"; readonly version: "v1" }; readonly input: { readonly contextCapability: string }; readonly context: { readonly boundary: string; readonly items: readonly [] } } }): Promise<string | null> };
const cacheKey = (sourceSha256: string, version: string, capability: string, identity: string) => createHash("sha256").update(`${sourceSha256}:${version}:${capability}:${identity}`).digest("hex");
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
};
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const requestFrom = (input: PerceptionExecutionInput, grant: string): DocumentPerceptionRequest => parseDocumentPerceptionRequest({ version: documentPerceptionContractVersion, executionId: input.executionId, artifact: { id: input.artifactId, sourceSha256: input.sourceSha256, mimeType: input.mimeType, byteSize: input.byteSize }, source: { grant }, perception: { capability: "atlas.document.perceive", contractVersion: documentPerceptionContractVersion } });

/** PostgreSQL adapter; only the Atlas process is given this connection. */
export class PostgresPerceptionAuthority implements PerceptionAuthority {
  constructor(private readonly sql: Sql, private readonly grants: GrantSigner, private readonly semanticQueue?: SemanticKickoffQueue, private readonly terminalCapabilityIdentity?: string) {}

  async create(input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest> {
    return this.sql.begin((sql) => this.createWithSql(sql, input));
  }

  /** Bounded composition seam for IDSER-003. The caller owns the surrounding
   * Atlas transaction; this method never opens a nested transaction. */
  async createInTransaction(sql: Sql, input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest> {
    return this.createWithSql(sql, input);
  }

  private async createWithSql(sql: Sql, input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest> {
      const prior = await sql.unsafe("SELECT id, artifact_id, document_storage_key, source_sha256, mime_type, byte_size, contract_version, idempotency_key, capability_identity FROM atlas.document_perception_execution WHERE idempotency_key=$1 OR id=$2 FOR UPDATE", [input.idempotencyKey, input.executionId]);
      if (prior.length) {
        const row = prior[0];
        if (row.id !== input.executionId || row.artifact_id !== input.artifactId || row.document_storage_key !== input.storageKey || row.source_sha256 !== input.sourceSha256 || row.mime_type !== input.mimeType || Number(row.byte_size) !== input.byteSize || row.contract_version !== documentPerceptionContractVersion || row.idempotency_key !== input.idempotencyKey || row.capability_identity !== input.capabilityIdentity) throw new Error("Perception execution identity conflicts with an existing operation.");
        const grants = await sql.unsafe("SELECT grant_id FROM atlas.document_perception_source_grant WHERE execution_id=$1 AND artifact_id=$2 AND source_sha256=$3 AND mime_type=$4 AND byte_size=$5 ORDER BY expires_at DESC LIMIT 1", [input.executionId, input.artifactId, input.sourceSha256, input.mimeType, input.byteSize]);
        if (!grants.length) throw new Error("Persisted perception operation has no source grant.");
        return requestFrom(input, this.grants.format(String(grants[0].grant_id)));
      }
      const grant = this.grants.issue(input);
      const grantId = this.grants.verify(grant);
      await sql.unsafe("INSERT INTO atlas.document_perception_execution (id, artifact_id, document_storage_key, source_sha256, mime_type, byte_size, contract_version, state, idempotency_key, capability_identity) VALUES ($1,$2,$3,$4,$5,$6,$7,'queued',$8,$9)", [input.executionId, input.artifactId, input.storageKey, input.sourceSha256, input.mimeType, input.byteSize, documentPerceptionContractVersion, input.idempotencyKey, input.capabilityIdentity]);
      await sql.unsafe("INSERT INTO atlas.document_perception_source_grant (grant_id, execution_id, artifact_id, source_sha256, mime_type, byte_size, expires_at) VALUES ($1,$2,$3,$4,$5,$6,now() + interval '5 minutes')", [grantId, input.executionId, input.artifactId, input.sourceSha256, input.mimeType, input.byteSize]);
      return requestFrom(input, grant);
  }

  async redeem(request: Pick<DocumentPerceptionRequest, "executionId" | "artifact" | "source">): Promise<AuthorityRedeemedPerceptionSource> {
    const grantId = this.grants.verify(request.source.grant);
    return this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT e.id, e.artifact_id, e.document_storage_key, e.source_sha256, e.mime_type, e.byte_size, member.bundle_id, member.document_id, member.state AS member_state, bundle.state AS bundle_state FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id JOIN atlas.extraction_bundle_document member ON member.perception_execution_id=e.id AND member.document_id=e.artifact_id JOIN atlas.extraction_bundle bundle ON bundle.id=member.bundle_id AND bundle.project_id=member.project_id AND bundle.workspace_id=member.workspace_id WHERE g.grant_id=$1 AND g.execution_id=$2 AND g.artifact_id=$3 AND g.source_sha256=$4 AND g.mime_type=$5 AND g.byte_size=$6 AND g.expires_at>now() AND e.state NOT IN ('completed','cancelled','failed') AND bundle.state NOT IN ('ready_for_review','needs_attention') FOR UPDATE OF e, member, bundle", [grantId, request.executionId, request.artifact.id, request.artifact.sourceSha256, request.artifact.mimeType, request.artifact.byteSize]);
      if (!rows.length) throw new Error("Perception source redemption is stale or unauthorized.");
      const row = rows[0];
      if (row.member_state === "perception_queued" && ["waiting", "processing"].includes(String(row.bundle_state))) {
        // The first document moves a waiting bundle into processing. Every
        // later document is queued by reconciliation while that same bundle is
        // already processing, so both transitions are authorized here.
        await sql.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=COALESCE(started_at, now()) WHERE id=$1 AND state='waiting'", [row.bundle_id]);
        await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='perceiving', started_at=COALESCE(started_at, now()) WHERE bundle_id=$1 AND document_id=$2 AND state='perception_queued'", [row.bundle_id, row.document_id]);
      } else if (row.bundle_state !== "processing" || !["perceiving", "extracting", "reconciling", "completed"].includes(String(row.member_state))) throw new Error("Perception source redemption is stale or unauthorized.");
      await sql.unsafe("UPDATE atlas.document_perception_execution SET state='fetching_source', updated_at=now() WHERE id=$1 AND state NOT IN ('completed','cancelled','failed')", [request.executionId]);
      return { executionId: String(row.id), artifactId: String(row.artifact_id), storageKey: String(row.document_storage_key), sourceSha256: String(row.source_sha256), mimeType: "application/pdf", byteSize: Number(row.byte_size) };
    });
  }

  async deliver(request: DocumentPerceptionRequest, result: NormalizedDocument): Promise<void> {
    if (result.executionId !== request.executionId || result.provider.executionId !== request.executionId || result.artifactId !== request.artifact.id || result.sourceSha256 !== request.artifact.sourceSha256 || result.perception.capability !== request.perception.capability || result.perception.contractVersion !== request.perception.contractVersion) throw new Error("Perception result does not match its execution identity.");
    const grantId = this.grants.verify(request.source.grant);
    const digest = fingerprint(result);
    await this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT e.state, e.capability_identity, e.completion_fingerprint FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE g.grant_id=$1 AND g.execution_id=$2 AND g.artifact_id=$3 AND g.source_sha256=$4 AND g.mime_type=$5 AND g.byte_size=$6 AND g.expires_at>now() FOR UPDATE OF e", [grantId, request.executionId, request.artifact.id, request.artifact.sourceSha256, request.artifact.mimeType, request.artifact.byteSize]);
      if (!rows.length || rows[0].state === "cancelled" || rows[0].state === "failed") throw new Error("Perception result is stale or unauthorized.");
      if (rows[0].state === "completed") { if (rows[0].completion_fingerprint === digest) return; throw new Error("Perception result conflicts with completed execution."); }
      const identity = String(rows[0].capability_identity);
      const key = cacheKey(result.sourceSha256, result.perception.contractVersion, result.perception.capability, identity);
      const assets = result.pages.flatMap((page) => page.visualRegions.flatMap((region) => region.assetRef ? [region.assetRef] : []));
      await sql.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key, source_sha256, contract_version, capability, capability_identity, normalized_document, derived_assets) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb) ON CONFLICT (cache_key) DO UPDATE SET normalized_document=EXCLUDED.normalized_document, derived_assets=EXCLUDED.derived_assets, invalidated_at=NULL", [key, result.sourceSha256, result.perception.contractVersion, result.perception.capability, identity, JSON.stringify(result), JSON.stringify(assets)]);
      for (const asset of assets) await sql.unsafe("INSERT INTO atlas.document_perception_derived_asset (id, cache_key, asset_ref) VALUES ($1,$2,$3) ON CONFLICT (cache_key, asset_ref) DO NOTHING", [randomUUID(), key, asset]);
      // IDSER-006 couples accepted perception, the extraction authority record,
      // and its pg-boss handoff in this one transaction.
      const bundleRows = await sql.unsafe("SELECT bundle_id, project_id, workspace_id FROM atlas.extraction_bundle_document WHERE document_id=$1 AND perception_execution_id=$2 FOR UPDATE", [request.artifact.id, request.executionId]);
      if (bundleRows.length) {
        const bundle = bundleRows[0];
        // BSS-V2-004-02 is a deliberately terminal D1 perception checkpoint.
        // Its qualified identity may accept one normalized document, but it
        // must not create an extraction execution or advance project truth.
        if (identity === this.terminalCapabilityIdentity) {
          await sql.unsafe("UPDATE atlas.document_perception_execution SET state='completed', completion_fingerprint=$2, updated_at=now() WHERE id=$1 AND state NOT IN ('completed','cancelled','failed')", [request.executionId, digest]);
          return;
        }
        const executionId = randomUUID();
        const capability = randomUUID();
        const capabilityFingerprint = fingerprint(capability);
        const logicalIdentity = `extract:${String(bundle.bundle_id)}:${request.artifact.id}:${documentPerceptionContractVersion}`;
        const priorExecution = await sql.unsafe("SELECT id FROM atlas.semantic_execution WHERE logical_identity=$1 FOR UPDATE", [logicalIdentity]);
        const semanticExecutionId = priorExecution.length ? String(priorExecution[0].id) : executionId;
        if (!priorExecution.length) await sql.unsafe("INSERT INTO atlas.semantic_execution (id, project_id, workspace_id, bundle_id, document_id, stage, contract_version, skill_version, logical_identity, lifecycle, authorized_context_identity, authorized_context_fingerprint, capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$6,'queued',$7,$8,now()+interval '1 hour')", [semanticExecutionId, bundle.project_id, bundle.workspace_id, bundle.bundle_id, request.artifact.id, logicalIdentity, `perception:${request.executionId}`, capabilityFingerprint]);
        if (!priorExecution.length) {
          if (!this.semanticQueue) throw new Error("Semantic extraction queue is unavailable.");
          const idempotencyKey = `semantic:${semanticExecutionId}`;
          const queued = await this.semanticQueue.enqueue(sql, { idempotencyKey, execution: { version: "v1", executionId: semanticExecutionId, mode: "background", skill: { id: "atlas.semantic.extract", version: "v1" }, input: { contextCapability: capability }, context: { boundary: "atlas.semantic.internal/v1", items: [] } } });
          if (queued === null) throw new Error("Semantic extraction queue was deduplicated before perception committed.");
        }
        await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='extracting', semantic_extraction_execution_id=$3 WHERE bundle_id=$1 AND document_id=$2", [bundle.bundle_id, request.artifact.id, semanticExecutionId]);
      }
      await sql.unsafe("UPDATE atlas.document_perception_execution SET state='completed', completion_fingerprint=$2, updated_at=now() WHERE id=$1 AND state NOT IN ('completed','cancelled','failed')", [request.executionId, digest]);
    });
  }

  async getCached(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<NormalizedDocument | undefined> {
    const rows = await this.sql.unsafe("SELECT normalized_document FROM atlas.normalized_document_cache WHERE cache_key=$1 AND invalidated_at IS NULL", [cacheKey(input.sourceSha256, input.perception.contractVersion, input.perception.capability, input.capabilityIdentity)]);
    if (!rows.length) return undefined;
    const stored = rows[0].normalized_document;
    return parseNormalizedDocument(typeof stored === "string" ? JSON.parse(stored) : stored);
  }
  async invalidateCache(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<void> {
    const key = cacheKey(input.sourceSha256, input.perception.contractVersion, input.perception.capability, input.capabilityIdentity);
    await this.sql.begin(async (sql) => {
      await sql.unsafe("UPDATE atlas.normalized_document_cache SET invalidated_at=now() WHERE cache_key=$1 AND invalidated_at IS NULL", [key]);
      await sql.unsafe("UPDATE atlas.document_perception_derived_asset SET deleted_at=now() WHERE cache_key=$1 AND deleted_at IS NULL", [key]);
    });
  }

  async fail(failure: DocumentPerceptionTechnicalFailure): Promise<void> {
    const { request, code } = failure;
    await this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT e.state, m.bundle_id, m.document_id FROM atlas.document_perception_execution e JOIN atlas.extraction_bundle_document m ON m.perception_execution_id=e.id WHERE e.id=$1 AND e.artifact_id=$2 AND e.source_sha256=$3 AND e.mime_type=$4 AND e.byte_size=$5 FOR UPDATE OF e,m", [request.executionId, request.artifact.id, request.artifact.sourceSha256, request.artifact.mimeType, request.artifact.byteSize]);
      if (rows.length !== 1 || rows[0].state === "completed" || rows[0].state === "cancelled") throw new Error("Perception failure is stale or unauthorized.");
      await sql.unsafe("UPDATE atlas.document_perception_execution SET state='failed', updated_at=now() WHERE id=$1 AND state NOT IN ('completed','cancelled')", [request.executionId]);
      await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='needs_attention', last_failure_code=$3, last_failure_at=now() WHERE bundle_id=$1 AND document_id=$2 AND state <> 'completed'", [rows[0].bundle_id, rows[0].document_id, code]);
      await sql.unsafe("UPDATE atlas.extraction_bundle SET state='needs_attention', last_failure_code=$2, last_failure_at=now() WHERE id=$1 AND state <> 'ready_for_review'", [rows[0].bundle_id, code]);
    });
  }
}
