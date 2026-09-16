import { createHash, randomUUID } from "node:crypto";
import { documentPerceptionContractVersion, parseDocumentPerceptionRequest, parseNormalizedDocument, type DocumentPerceptionRequest, type NormalizedDocument, type PerceptionAuthority, type PerceptionExecutionInput, type AuthorityRedeemedPerceptionSource } from "@atlas/core";

type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Record<string, unknown>[]> };
const cacheKey = (sourceSha256: string, version: string, capability: string, identity: string) => createHash("sha256").update(`${sourceSha256}:${version}:${capability}:${identity}`).digest("hex");
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** PostgreSQL adapter; only the Atlas process is given this connection. */
export class PostgresPerceptionAuthority implements PerceptionAuthority {
  constructor(private readonly sql: Sql, private readonly grants: { issue(input: PerceptionExecutionInput): string; redeem(grant: string, expected: { executionId: string; artifactId: string }): unknown }) {}

  async create(input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest> {
    const prior = await this.sql.unsafe("SELECT id, artifact_id, source_sha256, idempotency_key FROM atlas.document_perception_execution WHERE idempotency_key = $1 OR id = $2", [input.idempotencyKey, input.executionId]);
    if (prior.length) {
      const row = prior[0];
      if (row.id !== input.executionId || row.artifact_id !== input.artifactId || row.source_sha256 !== input.sourceSha256 || row.idempotency_key !== input.idempotencyKey) throw new Error("Perception execution identity conflicts with an existing operation.");
    } else await this.sql.unsafe("INSERT INTO atlas.document_perception_execution (id, artifact_id, document_storage_key, source_sha256, mime_type, byte_size, contract_version, state, idempotency_key, capability_identity) VALUES ($1,$2,$3,$4,$5,$6,$7,'queued',$8,$9)", [input.executionId, input.artifactId, input.storageKey, input.sourceSha256, input.mimeType, input.byteSize, documentPerceptionContractVersion, input.idempotencyKey, input.capabilityIdentity]);
    const grant = this.grants.issue(input);
    const grantId = grant.split(".")[0];
    await this.sql.unsafe("INSERT INTO atlas.document_perception_source_grant (grant_id, execution_id, artifact_id, source_sha256, mime_type, byte_size, expires_at) VALUES ($1,$2,$3,$4,$5,$6,now() + interval '5 minutes') ON CONFLICT (grant_id) DO NOTHING", [grantId, input.executionId, input.artifactId, input.sourceSha256, input.mimeType, input.byteSize]);
    return parseDocumentPerceptionRequest({ version: documentPerceptionContractVersion, executionId: input.executionId, artifact: { id: input.artifactId, sourceSha256: input.sourceSha256, mimeType: input.mimeType, byteSize: input.byteSize }, source: { grant }, perception: { capability: "atlas.document.perceive", contractVersion: documentPerceptionContractVersion } });
  }

  async redeem(request: Pick<DocumentPerceptionRequest, "executionId" | "artifact" | "source">): Promise<AuthorityRedeemedPerceptionSource> {
    const grantId = request.source.grant.split(".")[0];
    this.grants.redeem(request.source.grant, { executionId: request.executionId, artifactId: request.artifact.id });
    const rows = await this.sql.unsafe("SELECT e.id, e.artifact_id, e.document_storage_key, e.source_sha256, e.mime_type, e.byte_size FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id = g.execution_id WHERE g.grant_id=$1 AND g.execution_id=$2 AND g.artifact_id=$3 AND g.source_sha256=$4 AND g.expires_at > now() AND e.state NOT IN ('completed','cancelled')", [grantId, request.executionId, request.artifact.id, request.artifact.sourceSha256]);
    if (!rows.length) throw new Error("Perception source redemption is stale or unauthorized.");
    await this.sql.unsafe("UPDATE atlas.document_perception_execution SET state='fetching_source', updated_at=now() WHERE id=$1", [request.executionId]);
    const row = rows[0];
    return { executionId: String(row.id), artifactId: String(row.artifact_id), storageKey: String(row.document_storage_key), sourceSha256: String(row.source_sha256), mimeType: "application/pdf", byteSize: Number(row.byte_size) };
  }

  async deliver(request: DocumentPerceptionRequest, result: NormalizedDocument): Promise<void> {
    if (result.executionId !== request.executionId || result.provider.executionId !== request.executionId || result.artifactId !== request.artifact.id || result.sourceSha256 !== request.artifact.sourceSha256 || result.perception.capability !== request.perception.capability || result.perception.contractVersion !== request.perception.contractVersion) throw new Error("Perception result does not match its execution identity.");
    const rows = await this.sql.unsafe("SELECT state, capability_identity, completion_fingerprint FROM atlas.document_perception_execution WHERE id=$1 AND artifact_id=$2 AND source_sha256=$3", [request.executionId, request.artifact.id, request.artifact.sourceSha256]);
    if (!rows.length || rows[0].state === "cancelled" || rows[0].state === "failed") throw new Error("Perception result is stale or unauthorized.");
    const digest = fingerprint(result);
    if (rows[0].state === "completed") { if (rows[0].completion_fingerprint === digest) return; throw new Error("Perception result conflicts with completed execution."); }
    const identity = String(rows[0].capability_identity);
    const key = cacheKey(result.sourceSha256, result.perception.contractVersion, result.perception.capability, identity);
    const assets = result.pages.flatMap((page) => page.visualRegions.flatMap((region) => region.assetRef ? [region.assetRef] : []));
    await this.sql.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key, source_sha256, contract_version, capability, capability_identity, normalized_document, derived_assets) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb) ON CONFLICT (cache_key) DO UPDATE SET normalized_document=EXCLUDED.normalized_document, derived_assets=EXCLUDED.derived_assets, invalidated_at=NULL", [key, result.sourceSha256, result.perception.contractVersion, result.perception.capability, identity, JSON.stringify(result), JSON.stringify(assets)]);
    for (const asset of assets) await this.sql.unsafe("INSERT INTO atlas.document_perception_derived_asset (id, cache_key, asset_ref) VALUES ($1,$2,$3) ON CONFLICT (cache_key, asset_ref) DO NOTHING", [randomUUID(), key, asset]);
    await this.sql.unsafe("UPDATE atlas.document_perception_execution SET state='completed', completion_fingerprint=$2, updated_at=now() WHERE id=$1", [request.executionId, digest]);
  }

  async getCached(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<NormalizedDocument | undefined> {
    const rows = await this.sql.unsafe("SELECT normalized_document FROM atlas.normalized_document_cache WHERE cache_key=$1 AND invalidated_at IS NULL", [cacheKey(input.sourceSha256, input.perception.contractVersion, input.perception.capability, input.capabilityIdentity)]);
    if (!rows.length) return undefined;
    const stored = rows[0].normalized_document;
    return parseNormalizedDocument(typeof stored === "string" ? JSON.parse(stored) : stored);
  }
  async invalidateCache(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<void> {
    const key = cacheKey(input.sourceSha256, input.perception.contractVersion, input.perception.capability, input.capabilityIdentity);
    await this.sql.unsafe("UPDATE atlas.normalized_document_cache SET invalidated_at=now() WHERE cache_key=$1 AND invalidated_at IS NULL", [key]);
    await this.sql.unsafe("UPDATE atlas.document_perception_derived_asset SET deleted_at=now() WHERE cache_key=$1 AND deleted_at IS NULL", [key]);
  }
}
