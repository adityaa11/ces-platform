import { createHash } from "node:crypto";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };

export class ImmutableSemanticCorpusPlanError extends Error {}

export type SemanticCorpusLocatorV1 = Readonly<{ documentId: string; pageNumber: number; sourceKind: "text_block" | "table" | "visual_region"; localId: string }>;
export type SemanticCorpusUnitV1 = Readonly<{ locator: SemanticCorpusLocatorV1; classification: "eligible" | "deferred" | "unexamined"; reason?: string; demand?: Readonly<{ requestBytes: number; inputTokens: number; envelope: Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }> }> }>;
export type BssProvenanceSnapshotV1 = Readonly<{
  source: Readonly<{ sourceId: string; sourceVersion: string }>;
  enforcement: Readonly<{ policyId: string; policyVersion: string }>;
  process: Readonly<{ profileId: string; profileVersion: string }>;
  workload: Readonly<{ planId: string; planVersion: string; estimator: Readonly<{ identity: string; version: string }> }>;
}>;
export type ImmutableSemanticCorpusPlanInputV1 = Readonly<{
  scope: Readonly<{ projectId: string; workspaceId: string; bundleId: string; documentId: string }>;
  source: Readonly<{ sourceSha256: string; normalizedDocumentRef: string; perceptionExecutionId: string; normalizedDocumentFingerprint: string; normalizedDocumentVersion: "v1"; perceptionCapability: string; perceptionContractVersion: "v1"; media: readonly Readonly<{ assetRef: string; locatorId: string; pageNumber: number; mediaType: "image/png"; sha256: string; byteLength: number }>[]; rel: Readonly<{ state: "unavailable" }> }>;
  proposal: Readonly<{
    proposalId: string; proposalHash: string; sourceHash: string; policyHash: string; estimatorHash: string;
    structuralBound: Readonly<{ identity: string; version: string; maxRequestBytes: number; maxInputTokens: number }>;
    bssSnapshot: BssProvenanceSnapshotV1;
    eligibleDimensions: readonly ("rpm" | "tpm" | "rpd" | "concurrency")[];
    requestResourceEnvelope: Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }>;
    units: readonly SemanticCorpusUnitV1[];
    batches: readonly Readonly<{ batchId: string; ownedLocators: readonly SemanticCorpusLocatorV1[]; contextOnlyLocators: readonly SemanticCorpusLocatorV1[]; requestBytes: number; inputTokens: number; requestResourceEnvelope: Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }>; fitTrace: readonly Readonly<{ requestBytes: number; inputTokens: number; outcome: "fit" | "unfit" }>[] }> [];
    replanPredecessor?: Readonly<{ planId: string; planHash: string }>;
  }>;
}>;
export type PersistedSemanticCorpusPlanV1 = Readonly<{ planId: string; planHash: string; handoffs: readonly Readonly<{ batchId: string; handoffId: string; handoffHash: string }>[] }>;

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const digest = (value: unknown) => createHash("sha256").update(stable(value)).digest("hex");
const immutable = <T>(value: T): T => JSON.parse(stable(value)) as T;
const opaque = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value);
const sha = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;
const nonNegative = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const locatorKey = (locator: SemanticCorpusLocatorV1) => `${locator.documentId}\u0000${locator.pageNumber}\u0000${locator.sourceKind}\u0000${locator.localId}`;
const prohibitedMetadataKeys = new Set(["raw", "text", "bytes", "prompt", "storagekey", "credential", "secret", "response", "body"]);
function assertReferenceMetadata(value: unknown, depth = 0): void {
  if (depth > 20 || value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  if (Array.isArray(value)) { value.forEach((item) => assertReferenceMetadata(item, depth + 1)); return; }
  if (!value || typeof value !== "object") throw new ImmutableSemanticCorpusPlanError("Semantic corpus plan metadata is not serializable.");
  for (const [key, item] of Object.entries(value)) {
    if (prohibitedMetadataKeys.has(key.toLowerCase())) throw new ImmutableSemanticCorpusPlanError("Semantic corpus routing metadata must contain references and hashes only.");
    assertReferenceMetadata(item, depth + 1);
  }
}

function validEnvelope(value: ImmutableSemanticCorpusPlanInputV1["proposal"]["requestResourceEnvelope"]): boolean {
  return nonNegative(value.requestUnits) && nonNegative(value.tokenUnits) && nonNegative(value.dayUnits) && nonNegative(value.concurrencyUnits);
}

function validBssProvenance(value: BssProvenanceSnapshotV1): boolean {
  const snapshot = value as Record<string, unknown>;
  const source = snapshot.source as Record<string, unknown>;
  const enforcement = snapshot.enforcement as Record<string, unknown>;
  const process = snapshot.process as Record<string, unknown>;
  const workload = snapshot.workload as Record<string, unknown>;
  const estimator = workload?.estimator as Record<string, unknown>;
  return !!source && !!enforcement && !!process && !!workload && !!estimator
    && Object.keys(snapshot).length === 4
    && Object.keys(source).length === 2 && opaque(source.sourceId) && opaque(source.sourceVersion)
    && Object.keys(enforcement).length === 2 && opaque(enforcement.policyId) && opaque(enforcement.policyVersion)
    && Object.keys(process).length === 2 && opaque(process.profileId) && opaque(process.profileVersion)
    && Object.keys(workload).length === 3 && opaque(workload.planId) && opaque(workload.planVersion)
    && Object.keys(estimator).length === 2 && opaque(estimator.identity) && opaque(estimator.version);
}

/** Builds the parent before its child hashes, preventing a plan/handoff hash cycle. */
export function canonicalImmutableSemanticCorpusPlanV1(input: ImmutableSemanticCorpusPlanInputV1): Readonly<{ planContent: unknown; planHash: string; idempotencyKey: string; handoffContents: readonly unknown[] }> {
  const { scope, source, proposal } = input;
  if (!Object.values(scope).every(opaque) || source.sourceSha256.length !== 64 || !sha(source.sourceSha256) || !opaque(source.normalizedDocumentRef) || !opaque(source.perceptionExecutionId) || !sha(source.normalizedDocumentFingerprint) || source.normalizedDocumentVersion !== "v1" || source.perceptionContractVersion !== "v1" || !opaque(source.perceptionCapability) || source.rel.state !== "unavailable") throw new ImmutableSemanticCorpusPlanError("Semantic corpus plan source binding is invalid.");
  if (!opaque(proposal.proposalId) || ![proposal.proposalHash, proposal.sourceHash, proposal.policyHash, proposal.estimatorHash].every(sha) || !positive(proposal.structuralBound.maxRequestBytes) || !positive(proposal.structuralBound.maxInputTokens) || !opaque(proposal.structuralBound.identity) || !opaque(proposal.structuralBound.version) || !validEnvelope(proposal.requestResourceEnvelope) || proposal.batches.length < 1) throw new ImmutableSemanticCorpusPlanError("Semantic corpus proposal is invalid.");
  if (!validBssProvenance(proposal.bssSnapshot)) throw new ImmutableSemanticCorpusPlanError("Semantic corpus BSS provenance must contain only complete versioned references.");
  if (proposal.batches.some((batch, index) => !opaque(batch.batchId) || batch.batchId !== `batch-${String(index + 1).padStart(4, "0")}` || !positive(batch.requestBytes) || !positive(batch.inputTokens) || !validEnvelope(batch.requestResourceEnvelope))) throw new ImmutableSemanticCorpusPlanError("Semantic corpus batch identity is invalid.");
  if (new Set(proposal.batches.map((batch) => batch.batchId)).size !== proposal.batches.length || new Set(proposal.eligibleDimensions).size !== proposal.eligibleDimensions.length) throw new ImmutableSemanticCorpusPlanError("Semantic corpus proposal has duplicate identities.");
  if (source.media.some((media) => !opaque(media.assetRef) || !opaque(media.locatorId) || !positive(media.pageNumber) || media.mediaType !== "image/png" || !sha(media.sha256) || !positive(media.byteLength))) throw new ImmutableSemanticCorpusPlanError("Semantic corpus media metadata is invalid.");
  const units = proposal.units.map((unit) => ({ ...unit, locator: { ...unit.locator }, ...(unit.demand ? { demand: { ...unit.demand, envelope: { ...unit.demand.envelope } } } : {}) }));
  if (units.some((unit) => !opaque(unit.locator.documentId) || unit.locator.documentId !== scope.documentId || !positive(unit.locator.pageNumber) || !opaque(unit.locator.localId) || !["text_block", "table", "visual_region"].includes(unit.locator.sourceKind) || !["eligible", "deferred", "unexamined"].includes(unit.classification) || (unit.classification === "eligible" && (!unit.demand || !positive(unit.demand.requestBytes) || !positive(unit.demand.inputTokens) || !validEnvelope(unit.demand.envelope))))) throw new ImmutableSemanticCorpusPlanError("Semantic corpus locator metadata is invalid.");
  const eligible = units.filter((unit) => unit.classification === "eligible").map((unit) => locatorKey(unit.locator));
  if (new Set(eligible).size !== eligible.length) throw new ImmutableSemanticCorpusPlanError("Semantic corpus proposal has duplicate eligible ownership.");
  const owned = proposal.batches.flatMap((batch) => batch.ownedLocators.map(locatorKey));
  if (owned.length !== eligible.length || new Set(owned).size !== owned.length || [...owned].sort().join("\n") !== [...eligible].sort().join("\n")) throw new ImmutableSemanticCorpusPlanError("Semantic corpus batches must own every eligible locator exactly once.");
  if (proposal.batches.flatMap((batch) => batch.contextOnlyLocators).some((locator) => locator.documentId !== scope.documentId || !positive(locator.pageNumber) || !opaque(locator.localId))) throw new ImmutableSemanticCorpusPlanError("Semantic corpus context locator is invalid.");
  if (proposal.replanPredecessor && (!opaque(proposal.replanPredecessor.planId) || !sha(proposal.replanPredecessor.planHash))) throw new ImmutableSemanticCorpusPlanError("Semantic corpus replan predecessor is invalid.");
  const planContent = immutable({ version: "ImmutableSemanticCorpusPlan/v1", scope, source, proposal: { proposalId: proposal.proposalId, proposalHash: proposal.proposalHash, sourceHash: proposal.sourceHash, policyHash: proposal.policyHash, estimatorHash: proposal.estimatorHash, structuralBound: proposal.structuralBound, bssSnapshot: proposal.bssSnapshot, eligibleDimensions: proposal.eligibleDimensions, requestResourceEnvelope: proposal.requestResourceEnvelope, units, batchIds: proposal.batches.map((batch) => batch.batchId), ...(proposal.replanPredecessor ? { replanPredecessor: proposal.replanPredecessor } : {}) } });
  assertReferenceMetadata(planContent);
  const planHash = digest(planContent);
  const idempotencyKey = `semantic-corpus-plan/v1:${digest({ scope, source: { sourceSha256: source.sourceSha256, normalizedDocumentRef: source.normalizedDocumentRef, perceptionExecutionId: source.perceptionExecutionId, normalizedDocumentFingerprint: source.normalizedDocumentFingerprint }, proposalHash: proposal.proposalHash })}`;
  const handoffContents = proposal.batches.map((batch, index) => immutable({ version: "PlannedSemanticCorpusHandoff/v1", planHash, batchId: batch.batchId, batchSlot: index + 1, ownedLocators: batch.ownedLocators, contextOnlyLocators: batch.contextOnlyLocators, requestBytes: batch.requestBytes, inputTokens: batch.inputTokens, requestResourceEnvelope: batch.requestResourceEnvelope, fitTrace: batch.fitTrace }));
  return { planContent, planHash, idempotencyKey, handoffContents };
}

export function replayImmutableSemanticCorpusPlanHashV1(content: unknown): string { return digest(content); }

export class PostgresImmutableSemanticCorpusPlanRepository {
  constructor(private readonly sql: Sql) {}

  async persist(input: ImmutableSemanticCorpusPlanInputV1): Promise<PersistedSemanticCorpusPlanV1> {
    const canonical = canonicalImmutableSemanticCorpusPlanV1(input);
    const planId = `semantic-plan-${canonical.planHash}`;
    const handoffs = canonical.handoffContents.map((content, index) => ({ batchId: input.proposal.batches[index]!.batchId, handoffHash: digest(content), handoffId: `semantic-handoff-${digest(content)}` }));
    return this.sql.begin(async (sql) => {
      // One scoped identity lock makes simultaneous retries observe either the
      // complete immutable plan or the same idempotent replay, never a partial
      // parent/child set.
      await sql.unsafe("SELECT pg_advisory_xact_lock(hashtext($1))", [`${input.scope.projectId}:${input.scope.workspaceId}:${input.scope.bundleId}:${input.scope.documentId}:${canonical.idempotencyKey}`]);
      const accepted = await sql.unsafe("SELECT 1 FROM atlas.extraction_bundle_document member JOIN atlas.extraction_bundle bundle ON bundle.id=member.bundle_id AND bundle.project_id=member.project_id AND bundle.workspace_id=member.workspace_id JOIN atlas.document document ON document.id=member.document_id AND document.project_id=member.project_id AND document.workspace_id=member.workspace_id JOIN atlas.document_perception_execution execution ON execution.id=member.perception_execution_id AND execution.artifact_id=member.document_id AND execution.source_sha256=document.source_sha256 JOIN atlas.normalized_document_cache cache ON cache.cache_key=$8 AND cache.source_sha256=document.source_sha256 AND cache.contract_version=$9 AND cache.capability=$10 AND cache.invalidated_at IS NULL WHERE member.bundle_id=$1 AND member.document_id=$2 AND member.project_id=$3 AND member.workspace_id=$4 AND document.source_sha256=$5 AND execution.id=$6 AND execution.state='completed' AND execution.completion_fingerprint=$7 AND execution.contract_version=$11 AND member.state='perceived' AND bundle.state='processing' AND cache.capability_identity=execution.capability_identity FOR UPDATE OF member, bundle, document, execution, cache", [input.scope.bundleId, input.scope.documentId, input.scope.projectId, input.scope.workspaceId, input.source.sourceSha256, input.source.perceptionExecutionId, input.source.normalizedDocumentFingerprint, input.source.normalizedDocumentRef, input.source.normalizedDocumentVersion, input.source.perceptionCapability, input.source.perceptionContractVersion]);
      if (accepted.length !== 1) throw new ImmutableSemanticCorpusPlanError("Semantic corpus plan source is foreign, stale, or no longer accepted.");
      const prior = await sql.unsafe("SELECT id, plan_hash, immutable_content FROM atlas.semantic_corpus_plan WHERE (project_id=$1 AND workspace_id=$2 AND bundle_id=$3 AND document_id=$4 AND idempotency_key=$5) OR (project_id=$1 AND workspace_id=$2 AND bundle_id=$3 AND document_id=$4 AND proposal_id=$6) FOR UPDATE", [input.scope.projectId, input.scope.workspaceId, input.scope.bundleId, input.scope.documentId, canonical.idempotencyKey, input.proposal.proposalId]);
      if (prior.length) {
        const row = prior[0]!;
        if (String(row.plan_hash) !== canonical.planHash || stable(row.immutable_content) !== stable(canonical.planContent)) throw new ImmutableSemanticCorpusPlanError("Semantic corpus plan conflicts with an immutable prior version.");
        const stored = await sql.unsafe("SELECT id, batch_id, handoff_hash FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1 ORDER BY batch_slot", [String(row.id)]);
        if (stored.length !== handoffs.length || stored.some((value, index) => value.batch_id !== handoffs[index]!.batchId || value.handoff_hash !== handoffs[index]!.handoffHash)) throw new ImmutableSemanticCorpusPlanError("Persisted semantic corpus plan is incomplete or conflicts with its handoffs.");
        return { planId: String(row.id), planHash: canonical.planHash, handoffs: stored.map((row) => ({ batchId: String(row.batch_id), handoffId: String(row.id), handoffHash: String(row.handoff_hash) })) };
      }
      if (input.proposal.replanPredecessor) {
        const predecessor = await sql.unsafe("SELECT plan_hash FROM atlas.semantic_corpus_plan WHERE id=$1 AND project_id=$2 AND workspace_id=$3 AND bundle_id=$4 AND document_id=$5 FOR UPDATE", [input.proposal.replanPredecessor.planId, input.scope.projectId, input.scope.workspaceId, input.scope.bundleId, input.scope.documentId]);
        if (predecessor.length !== 1 || String(predecessor[0]!.plan_hash) !== input.proposal.replanPredecessor.planHash) throw new ImmutableSemanticCorpusPlanError("Semantic corpus replan predecessor is foreign or stale.");
        const cancelled = await sql.unsafe("SELECT 1 FROM atlas.semantic_corpus_plan_cancellation WHERE plan_id=$1", [input.proposal.replanPredecessor.planId]);
        if (cancelled.length !== 1) throw new ImmutableSemanticCorpusPlanError("Semantic corpus replan predecessor is not cancelled.");
      }
      await sql.unsafe("INSERT INTO atlas.semantic_corpus_plan (id,project_id,workspace_id,bundle_id,document_id,proposal_id,idempotency_key,plan_hash,source_sha256,source_fingerprint,predecessor_plan_id,predecessor_plan_hash,immutable_content) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)", [planId, input.scope.projectId, input.scope.workspaceId, input.scope.bundleId, input.scope.documentId, input.proposal.proposalId, canonical.idempotencyKey, canonical.planHash, input.source.sourceSha256, input.source.normalizedDocumentFingerprint, input.proposal.replanPredecessor?.planId ?? null, input.proposal.replanPredecessor?.planHash ?? null, canonical.planContent]);
      for (let index = 0; index < handoffs.length; index += 1) await sql.unsafe("INSERT INTO atlas.planned_semantic_corpus_handoff (id,plan_id,batch_id,batch_slot,handoff_hash,immutable_content) VALUES ($1,$2,$3,$4,$5,$6::jsonb)", [handoffs[index]!.handoffId, planId, handoffs[index]!.batchId, index + 1, handoffs[index]!.handoffHash, canonical.handoffContents[index]]);
      return { planId, planHash: canonical.planHash, handoffs };
    });
  }

  async cancel(planId: string, reason: string): Promise<void> {
    if (!opaque(planId) || typeof reason !== "string" || reason.length < 1 || reason.length > 200) throw new ImmutableSemanticCorpusPlanError("Semantic corpus cancellation is invalid.");
    await this.sql.begin(async (sql) => {
      const plan = await sql.unsafe("SELECT id FROM atlas.semantic_corpus_plan WHERE id=$1 FOR UPDATE", [planId]);
      if (plan.length !== 1) throw new ImmutableSemanticCorpusPlanError("Semantic corpus plan is unavailable.");
      await sql.unsafe("INSERT INTO atlas.semantic_corpus_plan_cancellation (plan_id,reason) VALUES ($1,$2) ON CONFLICT (plan_id) DO NOTHING", [planId, reason]);
    });
  }
}
