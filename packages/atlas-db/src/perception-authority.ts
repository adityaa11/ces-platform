import { createHash, randomUUID } from "node:crypto";
import { documentPerceptionContractVersion, parseDocumentPerceptionRequest, parseNormalizedDocument, type DocumentPerceptionRequest, type NormalizedDocument } from "@atlas/core";
import type { DocumentPerceptionTechnicalFailure } from "@atlas/contracts";
import type { PerceptionAuthority, PerceptionExecutionInput, AuthorityRedeemedPerceptionSource, DerivedAssetAuthority, DerivedAssetDescriptor } from "@atlas/core";
import type { DerivedAssetStore } from "@atlas/document-store";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };
type GrantSigner = { issue(input: PerceptionExecutionInput): string; verify(grant: string): string; format(grantId: string): string };
type SemanticKickoffQueue = { enqueue(transaction: Sql, job: { readonly idempotencyKey: string; readonly execution: { readonly version: "v1"; readonly executionId: string; readonly mode: "background"; readonly skill: { readonly id: "atlas.semantic.extract"; readonly version: "v1" }; readonly input: { readonly contextCapability: string }; readonly context: { readonly boundary: string; readonly items: readonly [] } } }): Promise<string | null> };
type PerceptionKickoffQueue = { enqueue(transaction: Sql, job: { readonly idempotencyKey: string; readonly request: DocumentPerceptionRequest }): Promise<string | null> };
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
export class PostgresPerceptionAuthority implements PerceptionAuthority, DerivedAssetAuthority {
  constructor(private readonly sql: Sql, private readonly grants: GrantSigner, private readonly semanticQueue?: SemanticKickoffQueue, private readonly terminalCapabilityIdentity?: string, private readonly stagedQueue?: PerceptionKickoffQueue, private readonly derivedStore?: DerivedAssetStore) {}

  async handoffDerived(request: DocumentPerceptionRequest, descriptor: DerivedAssetDescriptor, bytes: Uint8Array): Promise<{ readonly assetRef: string }> {
    if (!this.derivedStore) throw new Error("Derived asset persistence is unavailable.");
    if (descriptor.sourceSha256 !== request.artifact.sourceSha256 || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(descriptor.profile) || descriptor.mediaType !== "image/png" || !Number.isInteger(descriptor.pageNumber) || descriptor.pageNumber < 1 || !Number.isInteger(descriptor.width) || descriptor.width < 1 || !Number.isInteger(descriptor.height) || descriptor.height < 1 || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(descriptor.locatorId) || !/^[a-f0-9]{64}$/.test(descriptor.sha256) || descriptor.byteLength !== bytes.byteLength || bytes.byteLength < 1 || bytes.byteLength > 10 * 1024 * 1024) throw new Error("Derived asset handoff metadata is invalid.");
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    if (actualHash !== descriptor.sha256) throw new Error("Derived asset handoff integrity check failed.");
    const grantId = this.grants.verify(request.source.grant);
    return this.sql.begin(async (sql) => {
      const authorized = await sql.unsafe("SELECT e.id FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE g.grant_id=$1 AND g.execution_id=$2 AND g.artifact_id=$3 AND g.source_sha256=$4 AND g.mime_type=$5 AND g.byte_size=$6 AND g.expires_at>now() AND e.state NOT IN ('completed','cancelled','failed') FOR UPDATE OF e", [grantId, request.executionId, request.artifact.id, request.artifact.sourceSha256, request.artifact.mimeType, request.artifact.byteSize]);
      if (!authorized.length) throw new Error("Derived asset handoff is stale or unauthorized.");
      const existing = await sql.unsafe("SELECT asset_ref, source_sha256, profile, page_number, media_type, width, height, byte_size, sha256 FROM atlas.document_perception_derived_manifest WHERE execution_id=$1 AND locator_id=$2 FOR UPDATE", [request.executionId, descriptor.locatorId]);
      if (existing.length) {
        const prior = existing[0];
        if (prior.source_sha256 !== descriptor.sourceSha256 || prior.profile !== descriptor.profile || Number(prior.page_number) !== descriptor.pageNumber || prior.media_type !== descriptor.mediaType || Number(prior.width) !== descriptor.width || Number(prior.height) !== descriptor.height || Number(prior.byte_size) !== descriptor.byteLength || prior.sha256 !== descriptor.sha256) throw new Error("Derived asset identity conflicts with a prior handoff.");
        const persisted = await this.derivedStore!.readDerived(String(prior.asset_ref));
        if (createHash("sha256").update(persisted).digest("hex") !== descriptor.sha256 || persisted.byteLength !== descriptor.byteLength) throw new Error("Persisted derived asset integrity check failed.");
        return { assetRef: String(prior.asset_ref) };
      }
      const stored = await this.derivedStore!.putDerived({ bytes, mediaType: descriptor.mediaType });
      if (stored.byteSize !== descriptor.byteLength || stored.contentHash !== `sha256:${descriptor.sha256}`) throw new Error("Derived asset persistence metadata conflicts with the handoff.");
      const readback = await this.derivedStore!.readDerived(stored.storageKey);
      if (readback.byteLength !== descriptor.byteLength || createHash("sha256").update(readback).digest("hex") !== descriptor.sha256) throw new Error("Derived asset readback integrity check failed.");
      await sql.unsafe("INSERT INTO atlas.document_perception_derived_manifest (id,execution_id,artifact_id,source_sha256,profile,page_number,locator_id,asset_ref,media_type,width,height,byte_size,sha256,verified_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())", [randomUUID(), request.executionId, request.artifact.id, descriptor.sourceSha256, descriptor.profile, descriptor.pageNumber, descriptor.locatorId, stored.storageKey, descriptor.mediaType, descriptor.width, descriptor.height, descriptor.byteLength, descriptor.sha256]);
      return { assetRef: stored.storageKey };
    });
  }

  async resolveDerived(input: { readonly callerUserId: string; readonly artifactId: string; readonly sourceSha256: string; readonly locatorId: string; readonly assetRef: string }): Promise<{ readonly bytes: Uint8Array; readonly mediaType: "image/png"; readonly byteLength: number; readonly sha256: string }> {
    if (!this.derivedStore || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(input.artifactId) || !/^[a-f0-9]{64}$/.test(input.sourceSha256) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(input.locatorId) || !/^derived\/[0-9a-f-]{36}$/i.test(input.assetRef)) throw new Error("Derived asset reference is invalid.");
    const rows = await this.sql.unsafe("SELECT manifest.media_type, manifest.byte_size, manifest.sha256 FROM atlas.document_perception_derived_manifest manifest JOIN atlas.document document ON document.id=manifest.artifact_id AND document.source_sha256=manifest.source_sha256 JOIN atlas.project_member membership ON membership.project_id=document.project_id AND membership.user_id=$1 WHERE manifest.artifact_id=$2 AND manifest.source_sha256=$3 AND manifest.locator_id=$4 AND manifest.asset_ref=$5 AND manifest.accepted_at IS NOT NULL", [input.callerUserId, input.artifactId, input.sourceSha256, input.locatorId, input.assetRef]);
    if (rows.length !== 1 || rows[0].media_type !== "image/png") throw new Error("Derived asset is unavailable or unauthorized.");
    const bytes = await this.derivedStore.readDerived(input.assetRef);
    if (bytes.byteLength !== Number(rows[0].byte_size) || createHash("sha256").update(bytes).digest("hex") !== rows[0].sha256) throw new Error("Derived asset integrity check failed.");
    return { bytes, mediaType: "image/png", byteLength: bytes.byteLength, sha256: String(rows[0].sha256) };
  }

  async create(input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest> {
    return this.sql.begin(async (sql) => {
      // Preserve the established idempotent replay contract before applying
      // the cutover guard to a new admission attempt.
      const existing = await sql.unsafe("SELECT 1 FROM atlas.document_perception_execution WHERE idempotency_key=$1 OR id=$2 LIMIT 1 FOR UPDATE", [input.idempotencyKey, input.executionId]);
      if (existing.length) return this.createWithSql(sql, input);
      // Once a document belongs to an explicitly legacy bundle it cannot use
      // this historical direct-admission entry point.  The staged gate is the
      // sole local-capacity authority during cutover; silently letting an old
      // scheduler call `create` here would create a second permit path.
      const legacy = await sql.unsafe(`SELECT 1
        FROM atlas.extraction_bundle_document member
        JOIN atlas.extraction_bundle bundle ON bundle.id=member.bundle_id
        WHERE member.document_id=$1 AND bundle.perception_admission_policy IS NULL
        LIMIT 1 FOR UPDATE`, [input.artifactId]);
      if (legacy.length) throw new Error("Legacy perception admission is disabled while staged local admission is active.");
      return this.createWithSql(sql, input);
    });
  }

  /** Bounded composition seam for IDSER-003. The caller owns the surrounding
   * Atlas transaction; this method never opens a nested transaction. */
  async createInTransaction(sql: Sql, input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest> {
    return this.createWithSql(sql, input);
  }

  /**
   * The only local-perception admission seam for staged bundles.  The singleton
   * gate row serializes capacity and fair-turn changes across Atlas processes.
   * Legacy bundles have a null policy and are intentionally invisible here.
   */
  async admitStagedInTransaction(sql: Sql, queue: PerceptionKickoffQueue, capabilityIdentity?: string): Promise<number> {
    const gate = await sql.unsafe("SELECT next_turn FROM atlas.perception_admission_gate WHERE gate_key='staged-fair-local-v1' FOR UPDATE");
    if (gate.length !== 1) throw new Error("Staged perception admission gate is unavailable.");
    let admitted = 0;
    while (true) {
      const occupied = await sql.unsafe("SELECT count(*)::integer AS count FROM atlas.document_perception_execution WHERE state NOT IN ('completed','cancelled','failed')");
      if (Number(occupied[0]?.count ?? 0) >= 2) return admitted;
      const candidate = await sql.unsafe(`SELECT b.id AS bundle_id, m.document_id, d.storage_key, d.source_sha256, d.media_type, d.byte_size
        FROM atlas.extraction_bundle b
        JOIN LATERAL (SELECT document_id FROM atlas.extraction_bundle_document WHERE bundle_id=b.id AND state='pending' ORDER BY sequence LIMIT 1) m ON true
        JOIN atlas.document d ON d.id=m.document_id AND d.project_id=b.project_id AND d.workspace_id=b.workspace_id
        WHERE b.perception_admission_policy='staged-fair-local-v1' AND b.state IN ('waiting','processing')
        ORDER BY b.last_perception_admission_turn NULLS FIRST, b.id
        LIMIT 1 FOR UPDATE OF b`);
      if (!candidate.length) return admitted;
      const row = candidate[0];
      const turn = Number(gate[0].next_turn);
      const executionId = randomUUID();
      const documentId = String(row.document_id);
      const bundleId = String(row.bundle_id);
      const idempotencyKey = `staged-perception:${bundleId}:${documentId}:${documentPerceptionContractVersion}`;
      const request = await this.createWithSql(sql, { executionId, artifactId: documentId, storageKey: String(row.storage_key), sourceSha256: String(row.source_sha256), mimeType: "application/pdf", byteSize: Number(row.byte_size), idempotencyKey, capabilityIdentity: capabilityIdentity ?? `staged-bundle:${bundleId}:document:${documentId}:perception:${documentPerceptionContractVersion}` });
      const transactionClient = sql as unknown as { options?: unknown };
      transactionClient.options ??= (this.sql as unknown as { options?: unknown }).options;
      const queued = await queue.enqueue(sql, { idempotencyKey, request });
      if (queued === null) throw new Error("Staged perception admission was deduplicated before commit.");
      await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='perception_queued', perception_execution_id=$3 WHERE bundle_id=$1 AND document_id=$2 AND state='pending'", [bundleId, documentId, executionId]);
      await sql.unsafe("UPDATE atlas.extraction_bundle SET last_perception_admission_turn=$2 WHERE id=$1", [bundleId, turn]);
      await sql.unsafe("UPDATE atlas.perception_admission_gate SET next_turn=$1 WHERE gate_key='staged-fair-local-v1'", [turn + 1]);
      admitted += 1;
    }
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
    // The Compose route is untrusted at this boundary. Re-parse even when the
    // TypeScript caller claims this is a NormalizedDocument so persistence can
    // never accept a structurally invalid result through an internal caller.
    const accepted = parseNormalizedDocument(result);
    if (accepted.executionId !== request.executionId || accepted.provider.executionId !== request.executionId || accepted.artifactId !== request.artifact.id || accepted.sourceSha256 !== request.artifact.sourceSha256 || accepted.perception.capability !== request.perception.capability || accepted.perception.contractVersion !== request.perception.contractVersion) throw new Error("Perception result does not match its execution identity.");
    const grantId = this.grants.verify(request.source.grant);
    const digest = fingerprint(accepted);
    await this.sql.begin(async (sql) => {
      const rows = await sql.unsafe("SELECT e.state, e.capability_identity, e.completion_fingerprint FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE g.grant_id=$1 AND g.execution_id=$2 AND g.artifact_id=$3 AND g.source_sha256=$4 AND g.mime_type=$5 AND g.byte_size=$6 AND g.expires_at>now() FOR UPDATE OF e", [grantId, request.executionId, request.artifact.id, request.artifact.sourceSha256, request.artifact.mimeType, request.artifact.byteSize]);
      if (!rows.length || rows[0].state === "cancelled" || rows[0].state === "failed") throw new Error("Perception result is stale or unauthorized.");
      if (rows[0].state === "completed") { if (rows[0].completion_fingerprint === digest) return; throw new Error("Perception result conflicts with completed execution."); }
      const identity = String(rows[0].capability_identity);
      const key = cacheKey(accepted.sourceSha256, accepted.perception.contractVersion, accepted.perception.capability, identity);
      const assets = accepted.pages.flatMap((page) => page.visualRegions.flatMap((region) => region.assetRef ? [{ assetRef: region.assetRef, locatorId: region.id, pageNumber: page.number }] : []));
      if (identity.includes("atlas-digital-pdf-run-003-capture-v1")) {
        if (!this.derivedStore || !assets.length) throw new Error("RUN-003 acceptance requires verified derived assets.");
        const uniqueAssets = [...new Set(assets.map((asset) => asset.assetRef))];
        if (uniqueAssets.length !== assets.length) throw new Error("Accepted normalized document reuses a derived asset reference.");
        const manifests = await sql.unsafe("SELECT asset_ref, locator_id, page_number, byte_size, sha256, media_type FROM atlas.document_perception_derived_manifest WHERE execution_id=$1 AND artifact_id=$2 AND asset_ref = ANY($3::text[]) FOR UPDATE", [request.executionId, request.artifact.id, uniqueAssets]);
        const manifestByReference = new Map(manifests.map((manifest) => [String(manifest.asset_ref), manifest]));
        if (manifests.length !== uniqueAssets.length || manifests.some((manifest) => manifest.media_type !== "image/png") || assets.some((asset) => { const manifest = manifestByReference.get(asset.assetRef); return !manifest || manifest.locator_id !== asset.locatorId || Number(manifest.page_number) !== asset.pageNumber; })) throw new Error("Accepted normalized document has a dangling or misbound derived asset reference.");
        for (const manifest of manifests) {
          const persisted = await this.derivedStore.readDerived(String(manifest.asset_ref));
          if (persisted.byteLength !== Number(manifest.byte_size) || createHash("sha256").update(persisted).digest("hex") !== manifest.sha256) throw new Error("Accepted derived asset failed storage-integrity verification.");
        }
        await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET accepted_at=now() WHERE execution_id=$1 AND artifact_id=$2 AND asset_ref = ANY($3::text[])", [request.executionId, request.artifact.id, uniqueAssets]);
      }
      const assetReferences = assets.map((asset) => asset.assetRef);
      await sql.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key, source_sha256, contract_version, capability, capability_identity, normalized_document, derived_assets) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb) ON CONFLICT (cache_key) DO UPDATE SET normalized_document=EXCLUDED.normalized_document, derived_assets=EXCLUDED.derived_assets, invalidated_at=NULL", [key, accepted.sourceSha256, accepted.perception.contractVersion, accepted.perception.capability, identity, JSON.stringify(accepted), JSON.stringify(assetReferences)]);
      for (const asset of assetReferences) await sql.unsafe("INSERT INTO atlas.document_perception_derived_asset (id, cache_key, asset_ref) VALUES ($1,$2,$3) ON CONFLICT (cache_key, asset_ref) DO NOTHING", [randomUUID(), key, asset]);
      // IDSER-006 couples accepted perception, the extraction authority record,
      // and its pg-boss handoff in this one transaction.
      const bundleRows = await sql.unsafe("SELECT bundle_id, project_id, workspace_id FROM atlas.extraction_bundle_document WHERE document_id=$1 AND perception_execution_id=$2 FOR UPDATE", [request.artifact.id, request.executionId]);
      if (bundleRows.length) {
        const bundle = bundleRows[0];
        const policy = await sql.unsafe("SELECT perception_admission_policy FROM atlas.extraction_bundle WHERE id=$1 FOR UPDATE", [bundle.bundle_id]);
        // IDSER-012-01-01 owns admission only.  A staged execution must not
        // enter the historical semantic continuation; the next ticket owns
        // the accepted `perceived` terminal state and worker composition.
        if (policy[0]?.perception_admission_policy === "staged-fair-local-v1") {
          // This child is the terminal local-perception composition.  The
          // normalized cache and execution complete atomically, but member
          // lifecycle stops at perceived; semantic execution is explicitly a
          // later-ticket concern.
          await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='perceived', completed_at=now() WHERE bundle_id=$1 AND document_id=$2 AND perception_execution_id=$3 AND state IN ('perception_queued','perceiving')", [bundle.bundle_id, request.artifact.id, request.executionId]);
          await sql.unsafe("UPDATE atlas.document_perception_execution SET state='completed', completion_fingerprint=$2, updated_at=now() WHERE id=$1 AND state NOT IN ('completed','cancelled','failed')", [request.executionId, digest]);
          return;
        }
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
    const stagedQueue = this.stagedQueue;
    if (stagedQueue) await this.sql.begin((sql) => this.admitStagedInTransaction(sql, stagedQueue, this.terminalCapabilityIdentity));
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
      // Cache invalidation is not evidence retention.  Accepted RUN-003
      // references stay reachable through their manifest; only unaccepted
      // linkage may become an orphan candidate for a separately authorized
      // cleanup process.
      await sql.unsafe("UPDATE atlas.document_perception_derived_asset link SET deleted_at=now() WHERE cache_key=$1 AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM atlas.document_perception_derived_manifest manifest WHERE manifest.asset_ref=link.asset_ref AND manifest.accepted_at IS NOT NULL)", [key]);
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
    const stagedQueue = this.stagedQueue;
    if (stagedQueue) await this.sql.begin((sql) => this.admitStagedInTransaction(sql, stagedQueue, this.terminalCapabilityIdentity));
  }
}
