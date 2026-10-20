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

/**
 * The v2 wire shape intentionally has no source packet, source text, table
 * content, media bytes, or provider body.  It is the immutable locator-only
 * bridge between the structural partitioner and later consumers.
 */
export type SemanticCorpusLocatorV2 = SemanticCorpusLocatorV1;
export type ImmutableSemanticCorpusPlanInputV2 = Readonly<{
  version: "ImmutableSemanticCorpusPlan/v2";
  scope: Readonly<{ projectId: string; workspaceId: string; bundleId: string; documentId: string }>;
  source: Readonly<{ sourceSha256: string; normalizedDocumentRef: string; perceptionExecutionId: string; normalizedDocumentFingerprint: string; normalizedDocumentVersion: "v1"; perceptionCapability: string; perceptionContractVersion: "v1"; rel: Readonly<{ state: "unavailable" }> }>;
  proposal: Readonly<{
    proposalId: string; proposalHash: string; sourceHash: string; policyHash: string; estimatorHash: string;
    structuralBound: Readonly<{ identity: string; version: string; maxRequestBytes: number; maxInputTokens: number; maxPromptBytes: number; maxContextTokens: number }>;
    bssSnapshot: BssProvenanceSnapshotV1;
    packetProfile: Readonly<{ identity: string; version: string }>;
    estimator: Readonly<{ identity: string; version: string }>;
    configuration: Readonly<{ identity: string; version: string }>;
    eligibleDimensions: readonly ("rpm" | "tpm" | "rpd" | "concurrency")[];
    requestResourceEnvelope: Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }>;
    inventory: readonly Readonly<{ locator: SemanticCorpusLocatorV2; classification: "eligible" | "deferred" | "unexamined"; reason?: string }>[];
    batches: readonly Readonly<{
      batchId: string; ownedLocators: readonly SemanticCorpusLocatorV2[]; contextOnlyLocators: readonly SemanticCorpusLocatorV2[];
      sourceSpecificationSha256: string; packetProfile: Readonly<{ identity: string; version: string }>;
      estimator: Readonly<{ identity: string; version: string }>; configuration: Readonly<{ identity: string; version: string }>;
      conservativeLogicalRequestBytes: Readonly<{ version: "ConservativeLogicalRequestBytes/v1"; value: number }>;
      requestBytes: number; inputTokens: number; reservedOutputTokens: number;
      requestResourceEnvelope: Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }>;
      fitTrace: readonly Readonly<{ sourceSpecificationSha256: string; requestBytes: number; inputTokens: number; reservedOutputTokens: number; outcome: "fit" | "unfit" }> [];
    }>[];
    replanPredecessor?: Readonly<{ planId: string; planHash: string }>;
  }>;
}>;
export type PersistedSemanticCorpusPlanV2 = PersistedSemanticCorpusPlanV1;

/**
 * v3 is deliberately a references-and-commitments record.  In particular,
 * `acceptedMedia` is an authenticated asset reference, never a hydrated media
 * payload, and the prompt/schema/adapter values are pinned identities only.
 */
export type ImmutableSemanticCorpusPlanInputV3 = Readonly<{
  version: "ImmutableSemanticCorpusPlan/v3";
  scope: ImmutableSemanticCorpusPlanInputV2["scope"];
  source: ImmutableSemanticCorpusPlanInputV2["source"] & Readonly<{ acceptedMedia: readonly Readonly<{ assetRef: string; locator: SemanticCorpusLocatorV2; sha256: string; mediaType: "image/png"; byteLength: number }>[] }>;
  proposal: ImmutableSemanticCorpusPlanInputV2["proposal"] & Readonly<{
    manifestSha256: string;
    promptIdentity: Readonly<{ identity: string; version: string }>;
    schema: Readonly<{ identity: string; version: string }>;
    composer: Readonly<{ identity: string; version: string }>;
    route: Readonly<{ identity: string; version: string }>;
    adapter: Readonly<{ identity: string; version: string }>;
    replanPredecessor?: Readonly<{ planId: string; planHash: string; cancellationPlanId: string }>;
    batches: readonly (ImmutableSemanticCorpusPlanInputV2["proposal"]["batches"][number] & Readonly<{ requestSha256: string; manifestSha256: string }>)[];
  }>;
}>;
export type PersistedSemanticCorpusPlanV3 = PersistedSemanticCorpusPlanV1;

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const digest = (value: unknown) => createHash("sha256").update(stable(value)).digest("hex");
const immutable = <T>(value: T): T => JSON.parse(stable(value)) as T;
const opaque = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value);
const canonicalDerivedAssetRef = (value: unknown): value is string =>
  typeof value === "string"
  && /^derived\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
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
  if (source.media.some((media) => !canonicalDerivedAssetRef(media.assetRef) || !opaque(media.locatorId) || !positive(media.pageNumber) || media.mediaType !== "image/png" || !sha(media.sha256) || !positive(media.byteLength))) throw new ImmutableSemanticCorpusPlanError("Semantic corpus media metadata is invalid.");
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

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => isRecord(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const boundedReason = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 200 && !/[\r\n]/.test(value);
const sameCanonical = (left: unknown, right: unknown): boolean => stable(left) === stable(right);

function validV2Locator(value: unknown, documentId: string): value is SemanticCorpusLocatorV2 {
  return exactKeys(value, ["documentId", "pageNumber", "sourceKind", "localId"])
    && value.documentId === documentId && positive(value.pageNumber) && opaque(value.localId)
    && (value.sourceKind === "text_block" || value.sourceKind === "table" || value.sourceKind === "visual_region");
}
function validV2Identity(value: unknown): value is Readonly<{ identity: string; version: string }> {
  return exactKeys(value, ["identity", "version"]) && opaque(value.identity) && opaque(value.version);
}
function validV2Envelope(value: unknown): value is ImmutableSemanticCorpusPlanInputV2["proposal"]["requestResourceEnvelope"] {
  return exactKeys(value, ["requestUnits", "tokenUnits", "dayUnits", "concurrencyUnits"])
    && nonNegative(value.requestUnits) && nonNegative(value.tokenUnits) && nonNegative(value.dayUnits) && nonNegative(value.concurrencyUnits);
}
function validV2BssProvenance(value: unknown): value is BssProvenanceSnapshotV1 {
  return isRecord(value) && validBssProvenance(value as BssProvenanceSnapshotV1);
}
function v2Input(value: unknown): value is ImmutableSemanticCorpusPlanInputV2 {
  if (!exactKeys(value, ["version", "scope", "source", "proposal"]) || value.version !== "ImmutableSemanticCorpusPlan/v2") return false;
  const scope = value.scope;
  if (!exactKeys(scope, ["projectId", "workspaceId", "bundleId", "documentId"]) || !Object.values(scope).every(opaque)) return false;
  const documentId = scope.documentId as string;
  const source = value.source;
  if (!exactKeys(source, ["sourceSha256", "normalizedDocumentRef", "perceptionExecutionId", "normalizedDocumentFingerprint", "normalizedDocumentVersion", "perceptionCapability", "perceptionContractVersion", "rel"])
    || !sha(source.sourceSha256) || !opaque(source.normalizedDocumentRef) || !opaque(source.perceptionExecutionId) || !sha(source.normalizedDocumentFingerprint)
    || source.normalizedDocumentVersion !== "v1" || !opaque(source.perceptionCapability) || source.perceptionContractVersion !== "v1"
    || !exactKeys(source.rel, ["state"]) || source.rel.state !== "unavailable") return false;
  const proposal = value.proposal;
  if (!isRecord(proposal) || !["proposalId", "proposalHash", "sourceHash", "policyHash", "estimatorHash", "structuralBound", "bssSnapshot", "packetProfile", "estimator", "configuration", "eligibleDimensions", "requestResourceEnvelope", "inventory", "batches"].every((key) => Object.prototype.hasOwnProperty.call(proposal, key))
    || !Object.keys(proposal).every((key) => ["proposalId", "proposalHash", "sourceHash", "policyHash", "estimatorHash", "structuralBound", "bssSnapshot", "packetProfile", "estimator", "configuration", "eligibleDimensions", "requestResourceEnvelope", "inventory", "batches", "replanPredecessor"].includes(key))) return false;
  if (!opaque(proposal.proposalId) || ![proposal.proposalHash, proposal.sourceHash, proposal.policyHash, proposal.estimatorHash].every(sha)
    || !exactKeys(proposal.structuralBound, ["identity", "version", "maxRequestBytes", "maxInputTokens", "maxPromptBytes", "maxContextTokens"])
    || !opaque(proposal.structuralBound.identity) || !opaque(proposal.structuralBound.version) || !positive(proposal.structuralBound.maxRequestBytes) || !positive(proposal.structuralBound.maxInputTokens) || !positive(proposal.structuralBound.maxPromptBytes) || !positive(proposal.structuralBound.maxContextTokens)
    || !validV2BssProvenance(proposal.bssSnapshot) || !validV2Identity(proposal.packetProfile) || !validV2Identity(proposal.estimator) || !validV2Identity(proposal.configuration)
    || !Array.isArray(proposal.eligibleDimensions) || new Set(proposal.eligibleDimensions).size !== proposal.eligibleDimensions.length || proposal.eligibleDimensions.some((dimension) => !["rpm", "tpm", "rpd", "concurrency"].includes(String(dimension)))
    || !validV2Envelope(proposal.requestResourceEnvelope) || !Array.isArray(proposal.inventory) || !Array.isArray(proposal.batches) || proposal.batches.length < 1) return false;
  if (proposal.replanPredecessor !== undefined && (!exactKeys(proposal.replanPredecessor, ["planId", "planHash"]) || !opaque(proposal.replanPredecessor.planId) || !sha(proposal.replanPredecessor.planHash))) return false;
  for (const entry of proposal.inventory) {
    if (!isRecord(entry) || !["locator", "classification"].every((key) => Object.prototype.hasOwnProperty.call(entry, key)) || !Object.keys(entry).every((key) => ["locator", "classification", "reason"].includes(key))
      || !validV2Locator(entry.locator, documentId) || !["eligible", "deferred", "unexamined"].includes(String(entry.classification)) || (entry.reason !== undefined && !boundedReason(entry.reason))) return false;
  }
  const inventoryKeys = proposal.inventory.map((entry) => locatorKey(entry.locator as SemanticCorpusLocatorV2));
  if (new Set(inventoryKeys).size !== inventoryKeys.length) return false;
  for (let index = 0; index < proposal.batches.length; index += 1) {
    const batch = proposal.batches[index];
    if (!isRecord(batch) || !["batchId", "ownedLocators", "contextOnlyLocators", "sourceSpecificationSha256", "packetProfile", "estimator", "configuration", "conservativeLogicalRequestBytes", "requestBytes", "inputTokens", "reservedOutputTokens", "requestResourceEnvelope", "fitTrace"].every((key) => Object.prototype.hasOwnProperty.call(batch, key))
      || !Object.keys(batch).every((key) => ["batchId", "ownedLocators", "contextOnlyLocators", "sourceSpecificationSha256", "packetProfile", "estimator", "configuration", "conservativeLogicalRequestBytes", "requestBytes", "inputTokens", "reservedOutputTokens", "requestResourceEnvelope", "fitTrace"].includes(key))
      || !opaque(batch.batchId) || batch.batchId !== `batch-${String(index + 1).padStart(4, "0")}` || !Array.isArray(batch.ownedLocators) || batch.ownedLocators.length < 1 || !Array.isArray(batch.contextOnlyLocators)
      || !sha(batch.sourceSpecificationSha256) || !validV2Identity(batch.packetProfile) || !validV2Identity(batch.estimator) || !validV2Identity(batch.configuration)
      || !exactKeys(batch.conservativeLogicalRequestBytes, ["version", "value"]) || batch.conservativeLogicalRequestBytes.version !== "ConservativeLogicalRequestBytes/v1" || !positive(batch.conservativeLogicalRequestBytes.value)
      || !positive(batch.requestBytes) || batch.conservativeLogicalRequestBytes.value !== batch.requestBytes || !positive(batch.inputTokens) || !positive(batch.reservedOutputTokens) || !validV2Envelope(batch.requestResourceEnvelope) || !Array.isArray(batch.fitTrace) || batch.fitTrace.length < 1 || batch.fitTrace.length > 32) return false;
    const local = [...batch.ownedLocators, ...batch.contextOnlyLocators];
    if (local.some((locator) => !validV2Locator(locator, documentId)) || new Set(local.map((locator) => locatorKey(locator as SemanticCorpusLocatorV2))).size !== local.length) return false;
    if (!batch.ownedLocators.every((locator) => inventoryKeys.includes(locatorKey(locator as SemanticCorpusLocatorV2))) || !batch.contextOnlyLocators.every((locator) => inventoryKeys.includes(locatorKey(locator as SemanticCorpusLocatorV2)))) return false;
    if (!batch.fitTrace.every((trace) => exactKeys(trace, ["sourceSpecificationSha256", "requestBytes", "inputTokens", "reservedOutputTokens", "outcome"])
      && trace.sourceSpecificationSha256 === batch.sourceSpecificationSha256 && positive(trace.requestBytes) && positive(trace.inputTokens) && positive(trace.reservedOutputTokens) && (trace.outcome === "fit" || trace.outcome === "unfit"))) return false;
    const last = batch.fitTrace[batch.fitTrace.length - 1] as Record<string, unknown>;
    if (last.outcome !== "fit" || last.requestBytes !== batch.requestBytes || last.inputTokens !== batch.inputTokens || last.reservedOutputTokens !== batch.reservedOutputTokens) return false;
  }
  const eligible = proposal.inventory.filter((entry) => entry.classification === "eligible").map((entry) => locatorKey(entry.locator as SemanticCorpusLocatorV2));
  const owned = proposal.batches.flatMap((batch) => (batch as { ownedLocators: SemanticCorpusLocatorV2[] }).ownedLocators.map(locatorKey));
  return new Set(eligible).size === eligible.length && owned.length === eligible.length && new Set(owned).size === owned.length && [...owned].sort().join("\n") === [...eligible].sort().join("\n");
}

/** Strictly parses a v2 persistence proposal; unknown keys are never retained. */
export function parseImmutableSemanticCorpusPlanInputV2(value: unknown): ImmutableSemanticCorpusPlanInputV2 {
  if (!v2Input(value)) throw new ImmutableSemanticCorpusPlanError("ImmutableSemanticCorpusPlan/v2 is invalid or contains unapproved fields.");
  return immutable(value);
}

export function canonicalImmutableSemanticCorpusPlanV2(input: ImmutableSemanticCorpusPlanInputV2): Readonly<{ planContent: unknown; planHash: string; idempotencyKey: string; handoffContents: readonly unknown[] }> {
  const parsed = parseImmutableSemanticCorpusPlanInputV2(input);
  const { scope, source, proposal } = parsed;
  const parentProposal = {
    proposalId: proposal.proposalId, proposalHash: proposal.proposalHash, sourceHash: proposal.sourceHash, policyHash: proposal.policyHash, estimatorHash: proposal.estimatorHash,
    structuralBound: proposal.structuralBound, bssSnapshot: proposal.bssSnapshot, packetProfile: proposal.packetProfile, estimator: proposal.estimator, configuration: proposal.configuration,
    eligibleDimensions: proposal.eligibleDimensions, requestResourceEnvelope: proposal.requestResourceEnvelope, inventory: proposal.inventory, batchIds: proposal.batches.map((batch) => batch.batchId),
    ...(proposal.replanPredecessor ? { replanPredecessor: proposal.replanPredecessor } : {}),
  };
  const planContent = immutable({ version: "ImmutableSemanticCorpusPlan/v2", scope, source, proposal: parentProposal });
  assertReferenceMetadata(planContent);
  const planHash = digest(planContent);
  const idempotencyKey = `semantic-corpus-plan/v2:${digest({ scope, source, proposalHash: proposal.proposalHash })}`;
  const handoffContents = proposal.batches.map((batch, index) => immutable({ version: "PlannedSemanticCorpusHandoff/v2", planHash, batchId: batch.batchId, batchSlot: index + 1, ownedLocators: batch.ownedLocators, contextOnlyLocators: batch.contextOnlyLocators, sourceSpecificationSha256: batch.sourceSpecificationSha256, packetProfile: batch.packetProfile, estimator: batch.estimator, configuration: batch.configuration, conservativeLogicalRequestBytes: batch.conservativeLogicalRequestBytes, requestBytes: batch.requestBytes, inputTokens: batch.inputTokens, reservedOutputTokens: batch.reservedOutputTokens, requestResourceEnvelope: batch.requestResourceEnvelope, fitTrace: batch.fitTrace }));
  return { planContent, planHash, idempotencyKey, handoffContents };
}

export function replayImmutableSemanticCorpusPlanHashV2(content: unknown): string { return digest(content); }

const v3IdentityNames = ["promptIdentity", "schema", "composer", "route", "adapter"] as const;
const v3ProposalKeys = ["proposalId", "proposalHash", "sourceHash", "policyHash", "estimatorHash", "structuralBound", "bssSnapshot", "packetProfile", "estimator", "configuration", "eligibleDimensions", "requestResourceEnvelope", "inventory", "batches", "replanPredecessor", "manifestSha256", ...v3IdentityNames] as const;
const v3ParentProposalKeys = v3ProposalKeys.map((key) => key === "batches" ? "batchIds" : key);
const v3SourceKeys = ["sourceSha256", "normalizedDocumentRef", "perceptionExecutionId", "normalizedDocumentFingerprint", "normalizedDocumentVersion", "perceptionCapability", "perceptionContractVersion", "rel", "acceptedMedia"] as const;

function validV3Media(value: unknown, documentId: string): boolean {
  return Array.isArray(value) && value.every((media) => isRecord(media)
    && exactKeys(media, ["assetRef", "locator", "sha256", "mediaType", "byteLength"])
    && canonicalDerivedAssetRef(media.assetRef) && validV2Locator(media.locator, documentId)
    && sha(media.sha256) && media.mediaType === "image/png" && positive(media.byteLength));
}

function v3BaseInput(value: unknown): value is ImmutableSemanticCorpusPlanInputV3 {
  if (!isRecord(value) || value.version !== "ImmutableSemanticCorpusPlan/v3" || !exactKeys(value, ["version", "scope", "source", "proposal"])) return false;
  const source = value.source;
  const proposal = value.proposal;
  if (!isRecord(source) || !Object.keys(source).every((key) => v3SourceKeys.includes(key as typeof v3SourceKeys[number])) || Object.keys(source).length !== v3SourceKeys.length
    || !validV3Media(source.acceptedMedia, String((value.scope as Record<string, unknown>)?.documentId))) return false;
  if (!isRecord(proposal) || !Object.keys(proposal).every((key) => v3ProposalKeys.includes(key as typeof v3ProposalKeys[number]))
    || !v3ProposalKeys.filter((key) => key !== "replanPredecessor").every((key) => Object.prototype.hasOwnProperty.call(proposal, key))
    || !sha(proposal.manifestSha256) || !v3IdentityNames.every((name) => validV2Identity(proposal[name]))) return false;
  const base = { version: "ImmutableSemanticCorpusPlan/v2", scope: value.scope, source: Object.fromEntries(Object.entries(source).filter(([key]) => key !== "acceptedMedia")), proposal: { ...Object.fromEntries(Object.entries(proposal).filter(([key]) => !["manifestSha256", ...v3IdentityNames, "replanPredecessor", "batches"].includes(key))), batches: Array.isArray(proposal.batches) ? proposal.batches.map((batch) => isRecord(batch) ? Object.fromEntries(Object.entries(batch).filter(([key]) => key !== "requestSha256" && key !== "manifestSha256")) : batch) : proposal.batches, ...(proposal.replanPredecessor ? { replanPredecessor: { planId: (proposal.replanPredecessor as Record<string, unknown>).planId, planHash: (proposal.replanPredecessor as Record<string, unknown>).planHash } } : {}) } };
  if (!v2Input(base)) return false;
  if (proposal.replanPredecessor !== undefined && (!exactKeys(proposal.replanPredecessor, ["planId", "planHash", "cancellationPlanId"])
    || !opaque(proposal.replanPredecessor.planId) || !sha(proposal.replanPredecessor.planHash) || proposal.replanPredecessor.cancellationPlanId !== proposal.replanPredecessor.planId)) return false;
  const inventory = proposal.inventory as readonly Record<string, unknown>[];
  const inventoryKeys = new Set(inventory.map((entry) => locatorKey(entry.locator as SemanticCorpusLocatorV2)));
  const mediaKeys = new Set((source.acceptedMedia as readonly Record<string, unknown>[]).map((media) => locatorKey(media.locator as SemanticCorpusLocatorV2)));
  if (mediaKeys.size !== (source.acceptedMedia as readonly unknown[]).length || [...mediaKeys].some((key) => !inventoryKeys.has(key))) return false;
  return (proposal.batches as readonly Record<string, unknown>[]).every((batch) => sha(batch.requestSha256) && batch.manifestSha256 === proposal.manifestSha256);
}

/** Strictly parses v3 before any transaction can begin. */
export function parseImmutableSemanticCorpusPlanInputV3(value: unknown): ImmutableSemanticCorpusPlanInputV3 {
  if (!v3BaseInput(value)) throw new ImmutableSemanticCorpusPlanError("ImmutableSemanticCorpusPlan/v3 is invalid or contains unapproved fields.");
  return immutable(value);
}

export function canonicalImmutableSemanticCorpusPlanV3(input: ImmutableSemanticCorpusPlanInputV3): Readonly<{ planContent: unknown; planHash: string; idempotencyKey: string; handoffContents: readonly unknown[] }> {
  const parsed = parseImmutableSemanticCorpusPlanInputV3(input);
  const { scope, source, proposal } = parsed;
  const parentProposal = {
    proposalId: proposal.proposalId, proposalHash: proposal.proposalHash, sourceHash: proposal.sourceHash, policyHash: proposal.policyHash, estimatorHash: proposal.estimatorHash,
    structuralBound: proposal.structuralBound, bssSnapshot: proposal.bssSnapshot, packetProfile: proposal.packetProfile, estimator: proposal.estimator, configuration: proposal.configuration,
    eligibleDimensions: proposal.eligibleDimensions, requestResourceEnvelope: proposal.requestResourceEnvelope, inventory: proposal.inventory, batchIds: proposal.batches.map((batch) => batch.batchId),
    manifestSha256: proposal.manifestSha256, promptIdentity: proposal.promptIdentity, schema: proposal.schema, composer: proposal.composer, route: proposal.route, adapter: proposal.adapter,
    ...(proposal.replanPredecessor ? { replanPredecessor: proposal.replanPredecessor } : {}),
  };
  const planContent = immutable({ version: "ImmutableSemanticCorpusPlan/v3", scope, source, proposal: parentProposal });
  assertReferenceMetadata(planContent);
  const planHash = digest(planContent);
  const idempotencyKey = `semantic-corpus-plan/v3:${digest({ scope, source, proposalHash: proposal.proposalHash, manifestSha256: proposal.manifestSha256 })}`;
  const handoffContents = proposal.batches.map((batch, index) => {
    const commitment = batch as typeof batch & Readonly<{ requestSha256: string; manifestSha256: string }>;
    return immutable({ version: "PlannedSemanticCorpusHandoff/v3", planHash, batchId: commitment.batchId, batchSlot: index + 1, ownedLocators: commitment.ownedLocators, contextOnlyLocators: commitment.contextOnlyLocators, sourceSpecificationSha256: commitment.sourceSpecificationSha256, requestSha256: commitment.requestSha256, manifestSha256: commitment.manifestSha256, packetProfile: commitment.packetProfile, estimator: commitment.estimator, configuration: commitment.configuration, conservativeLogicalRequestBytes: commitment.conservativeLogicalRequestBytes, requestBytes: commitment.requestBytes, inputTokens: commitment.inputTokens, reservedOutputTokens: commitment.reservedOutputTokens, requestResourceEnvelope: commitment.requestResourceEnvelope, fitTrace: commitment.fitTrace });
  });
  return { planContent, planHash, idempotencyKey, handoffContents };
}

export function replayImmutableSemanticCorpusPlanHashV3(content: unknown): string { return digest(content); }

function validV3ParentRecord(content: Record<string, unknown>): boolean {
  if (!exactKeys(content, ["version", "scope", "source", "proposal"]) || !exactKeys(content.scope, ["projectId", "workspaceId", "bundleId", "documentId"]) || !Object.values(content.scope).every(opaque)
    || !isRecord(content.source) || !Object.keys(content.source).every((key) => v3SourceKeys.includes(key as typeof v3SourceKeys[number])) || Object.keys(content.source).length !== v3SourceKeys.length
    || !sha(content.source.sourceSha256) || !opaque(content.source.normalizedDocumentRef) || !opaque(content.source.perceptionExecutionId) || !sha(content.source.normalizedDocumentFingerprint) || content.source.normalizedDocumentVersion !== "v1" || !opaque(content.source.perceptionCapability) || content.source.perceptionContractVersion !== "v1" || !exactKeys(content.source.rel, ["state"]) || content.source.rel.state !== "unavailable" || !validV3Media(content.source.acceptedMedia, content.scope.documentId as string)) return false;
  const proposal = content.proposal;
  if (!isRecord(proposal) || !Object.keys(proposal).every((key) => v3ParentProposalKeys.includes(key as typeof v3ParentProposalKeys[number])) || !v3ParentProposalKeys.filter((key) => key !== "replanPredecessor").every((key) => Object.prototype.hasOwnProperty.call(proposal, key))
    || !opaque(proposal.proposalId) || ![proposal.proposalHash, proposal.sourceHash, proposal.policyHash, proposal.estimatorHash, proposal.manifestSha256].every(sha)
    || !exactKeys(proposal.structuralBound, ["identity", "version", "maxRequestBytes", "maxInputTokens", "maxPromptBytes", "maxContextTokens"]) || !opaque(proposal.structuralBound.identity) || !opaque(proposal.structuralBound.version) || !positive(proposal.structuralBound.maxRequestBytes) || !positive(proposal.structuralBound.maxInputTokens) || !positive(proposal.structuralBound.maxPromptBytes) || !positive(proposal.structuralBound.maxContextTokens)
    || !validV2BssProvenance(proposal.bssSnapshot) || !validV2Identity(proposal.packetProfile) || !validV2Identity(proposal.estimator) || !validV2Identity(proposal.configuration) || !v3IdentityNames.every((name) => validV2Identity(proposal[name]))
    || !Array.isArray(proposal.eligibleDimensions) || new Set(proposal.eligibleDimensions).size !== proposal.eligibleDimensions.length || proposal.eligibleDimensions.some((dimension) => !["rpm", "tpm", "rpd", "concurrency"].includes(String(dimension))) || !validV2Envelope(proposal.requestResourceEnvelope)
    || !Array.isArray(proposal.inventory) || !Array.isArray(proposal.batchIds) || proposal.batchIds.length < 1 || proposal.batchIds.some((batchId, index) => !opaque(batchId) || batchId !== `batch-${String(index + 1).padStart(4, "0")}`) || new Set(proposal.batchIds).size !== proposal.batchIds.length
    || (proposal.replanPredecessor !== undefined && (!exactKeys(proposal.replanPredecessor, ["planId", "planHash", "cancellationPlanId"]) || !opaque(proposal.replanPredecessor.planId) || !sha(proposal.replanPredecessor.planHash) || proposal.replanPredecessor.cancellationPlanId !== proposal.replanPredecessor.planId))) return false;
  const documentId = content.scope.documentId as string;
  if (proposal.inventory.some((entry) => !isRecord(entry) || !["locator", "classification"].every((key) => Object.prototype.hasOwnProperty.call(entry, key)) || !Object.keys(entry).every((key) => ["locator", "classification", "reason"].includes(key)) || !validV2Locator(entry.locator, documentId) || !["eligible", "deferred", "unexamined"].includes(String(entry.classification)) || (entry.reason !== undefined && !boundedReason(entry.reason)))) return false;
  const inventoryKeys = new Set(proposal.inventory.map((entry) => locatorKey((entry as Record<string, unknown>).locator as SemanticCorpusLocatorV2)));
  const media = content.source.acceptedMedia as readonly Record<string, unknown>[];
  return inventoryKeys.size === proposal.inventory.length && new Set(media.map((entry) => locatorKey(entry.locator as SemanticCorpusLocatorV2))).size === media.length && media.every((entry) => inventoryKeys.has(locatorKey(entry.locator as SemanticCorpusLocatorV2)));
}

/** Accepts only established immutable record versions; a future record fails closed. */
export function parseImmutableSemanticCorpusPlanRecord(content: unknown): Readonly<{ version: "ImmutableSemanticCorpusPlan/v1" | "ImmutableSemanticCorpusPlan/v2" | "ImmutableSemanticCorpusPlan/v3"; content: unknown }> {
  if (!isRecord(content) || typeof content.version !== "string") throw new ImmutableSemanticCorpusPlanError("Immutable semantic corpus plan version is missing.");
  if (content.version !== "ImmutableSemanticCorpusPlan/v1" && content.version !== "ImmutableSemanticCorpusPlan/v2" && content.version !== "ImmutableSemanticCorpusPlan/v3") throw new ImmutableSemanticCorpusPlanError("Immutable semantic corpus plan version is unsupported.");
  if (content.version === "ImmutableSemanticCorpusPlan/v3" && !validV3ParentRecord(content)) throw new ImmutableSemanticCorpusPlanError("ImmutableSemanticCorpusPlan/v3 record is invalid.");
  if (content.version === "ImmutableSemanticCorpusPlan/v2") {
    if (!exactKeys(content, ["version", "scope", "source", "proposal"]) || !exactKeys(content.scope, ["projectId", "workspaceId", "bundleId", "documentId"])
      || !Object.values(content.scope).every(opaque) || !exactKeys(content.source, ["sourceSha256", "normalizedDocumentRef", "perceptionExecutionId", "normalizedDocumentFingerprint", "normalizedDocumentVersion", "perceptionCapability", "perceptionContractVersion", "rel"])
      || !sha(content.source.sourceSha256) || !opaque(content.source.normalizedDocumentRef) || !opaque(content.source.perceptionExecutionId) || !sha(content.source.normalizedDocumentFingerprint) || content.source.normalizedDocumentVersion !== "v1" || !opaque(content.source.perceptionCapability) || content.source.perceptionContractVersion !== "v1" || !exactKeys(content.source.rel, ["state"]) || content.source.rel.state !== "unavailable") throw new ImmutableSemanticCorpusPlanError("ImmutableSemanticCorpusPlan/v2 record is invalid.");
    const proposal = content.proposal;
    if (!isRecord(proposal) || !["proposalId", "proposalHash", "sourceHash", "policyHash", "estimatorHash", "structuralBound", "bssSnapshot", "packetProfile", "estimator", "configuration", "eligibleDimensions", "requestResourceEnvelope", "inventory", "batchIds"].every((key) => Object.prototype.hasOwnProperty.call(proposal, key)) || !Object.keys(proposal).every((key) => ["proposalId", "proposalHash", "sourceHash", "policyHash", "estimatorHash", "structuralBound", "bssSnapshot", "packetProfile", "estimator", "configuration", "eligibleDimensions", "requestResourceEnvelope", "inventory", "batchIds", "replanPredecessor"].includes(key)) || !opaque(proposal.proposalId) || ![proposal.proposalHash, proposal.sourceHash, proposal.policyHash, proposal.estimatorHash].every(sha) || !exactKeys(proposal.structuralBound, ["identity", "version", "maxRequestBytes", "maxInputTokens", "maxPromptBytes", "maxContextTokens"]) || !opaque(proposal.structuralBound.identity) || !opaque(proposal.structuralBound.version) || !positive(proposal.structuralBound.maxRequestBytes) || !positive(proposal.structuralBound.maxInputTokens) || !positive(proposal.structuralBound.maxPromptBytes) || !positive(proposal.structuralBound.maxContextTokens) || !validV2BssProvenance(proposal.bssSnapshot) || !validV2Identity(proposal.packetProfile) || !validV2Identity(proposal.estimator) || !validV2Identity(proposal.configuration) || !Array.isArray(proposal.eligibleDimensions) || new Set(proposal.eligibleDimensions).size !== proposal.eligibleDimensions.length || proposal.eligibleDimensions.some((dimension) => !["rpm", "tpm", "rpd", "concurrency"].includes(String(dimension))) || !validV2Envelope(proposal.requestResourceEnvelope) || !Array.isArray(proposal.inventory) || !Array.isArray(proposal.batchIds) || proposal.batchIds.length < 1 || proposal.batchIds.some((batchId, index) => !opaque(batchId) || batchId !== `batch-${String(index + 1).padStart(4, "0")}`) || new Set(proposal.batchIds).size !== proposal.batchIds.length || (proposal.replanPredecessor !== undefined && (!exactKeys(proposal.replanPredecessor, ["planId", "planHash"]) || !opaque(proposal.replanPredecessor.planId) || !sha(proposal.replanPredecessor.planHash)))) throw new ImmutableSemanticCorpusPlanError("ImmutableSemanticCorpusPlan/v2 record is invalid.");
    const documentId = content.scope.documentId as string;
    if (proposal.inventory.some((entry) => !isRecord(entry) || !["locator", "classification"].every((key) => Object.prototype.hasOwnProperty.call(entry, key)) || !Object.keys(entry).every((key) => ["locator", "classification", "reason"].includes(key)) || !validV2Locator(entry.locator, documentId) || !["eligible", "deferred", "unexamined"].includes(String(entry.classification)) || (entry.reason !== undefined && !boundedReason(entry.reason)))) throw new ImmutableSemanticCorpusPlanError("ImmutableSemanticCorpusPlan/v2 record is invalid.");
    const inventoryKeys = proposal.inventory.map((entry) => locatorKey(entry.locator as SemanticCorpusLocatorV2));
    if (new Set(inventoryKeys).size !== inventoryKeys.length || !proposal.inventory.some((entry) => entry.classification === "eligible")) throw new ImmutableSemanticCorpusPlanError("ImmutableSemanticCorpusPlan/v2 record is invalid.");
  }
  return immutable({ version: content.version, content });
}

/** Strict child-record dispatch; v1 remains opaque to preserve historical meaning. */
export function parsePlannedSemanticCorpusHandoffRecord(content: unknown): Readonly<{ version: "PlannedSemanticCorpusHandoff/v1" | "PlannedSemanticCorpusHandoff/v2" | "PlannedSemanticCorpusHandoff/v3"; content: unknown }> {
  if (!isRecord(content) || typeof content.version !== "string") throw new ImmutableSemanticCorpusPlanError("Planned semantic corpus handoff version is missing.");
  if (content.version !== "PlannedSemanticCorpusHandoff/v1" && content.version !== "PlannedSemanticCorpusHandoff/v2" && content.version !== "PlannedSemanticCorpusHandoff/v3") throw new ImmutableSemanticCorpusPlanError("Planned semantic corpus handoff version is unsupported.");
  if (content.version === "PlannedSemanticCorpusHandoff/v3") {
    const keys = ["version", "planHash", "batchId", "batchSlot", "ownedLocators", "contextOnlyLocators", "sourceSpecificationSha256", "requestSha256", "manifestSha256", "packetProfile", "estimator", "configuration", "conservativeLogicalRequestBytes", "requestBytes", "inputTokens", "reservedOutputTokens", "requestResourceEnvelope", "fitTrace"];
    if (!exactKeys(content, keys) || !sha(content.planHash) || !opaque(content.batchId) || !positive(content.batchSlot) || content.batchId !== `batch-${String(content.batchSlot).padStart(4, "0")}` || !Array.isArray(content.ownedLocators) || content.ownedLocators.length < 1 || !Array.isArray(content.contextOnlyLocators) || !sha(content.sourceSpecificationSha256) || !sha(content.requestSha256) || !sha(content.manifestSha256) || !validV2Identity(content.packetProfile) || !validV2Identity(content.estimator) || !validV2Identity(content.configuration) || !exactKeys(content.conservativeLogicalRequestBytes, ["version", "value"]) || content.conservativeLogicalRequestBytes.version !== "ConservativeLogicalRequestBytes/v1" || !positive(content.conservativeLogicalRequestBytes.value) || !positive(content.requestBytes) || content.conservativeLogicalRequestBytes.value !== content.requestBytes || !positive(content.inputTokens) || !positive(content.reservedOutputTokens) || !validV2Envelope(content.requestResourceEnvelope) || !Array.isArray(content.fitTrace) || content.fitTrace.length < 1 || content.fitTrace.length > 32) throw new ImmutableSemanticCorpusPlanError("PlannedSemanticCorpusHandoff/v3 record is invalid.");
    const locators = [...content.ownedLocators, ...content.contextOnlyLocators];
    if (locators.some((locator) => !isRecord(locator) || !exactKeys(locator, ["documentId", "pageNumber", "sourceKind", "localId"]) || !opaque(locator.documentId) || !positive(locator.pageNumber) || !opaque(locator.localId) || !["text_block", "table", "visual_region"].includes(String(locator.sourceKind))) || new Set(locators.map((locator) => `${locator.documentId}\u0000${locator.pageNumber}\u0000${locator.sourceKind}\u0000${locator.localId}`)).size !== locators.length || !content.fitTrace.every((trace) => exactKeys(trace, ["sourceSpecificationSha256", "requestBytes", "inputTokens", "reservedOutputTokens", "outcome"]) && trace.sourceSpecificationSha256 === content.sourceSpecificationSha256 && positive(trace.requestBytes) && positive(trace.inputTokens) && positive(trace.reservedOutputTokens) && (trace.outcome === "fit" || trace.outcome === "unfit"))) throw new ImmutableSemanticCorpusPlanError("PlannedSemanticCorpusHandoff/v3 record is invalid.");
    const last = content.fitTrace[content.fitTrace.length - 1] as Record<string, unknown>;
    if (last.outcome !== "fit" || last.requestBytes !== content.requestBytes || last.inputTokens !== content.inputTokens || last.reservedOutputTokens !== content.reservedOutputTokens) throw new ImmutableSemanticCorpusPlanError("PlannedSemanticCorpusHandoff/v3 record is invalid.");
  }
  if (content.version === "PlannedSemanticCorpusHandoff/v2") {
    const keys = ["version", "planHash", "batchId", "batchSlot", "ownedLocators", "contextOnlyLocators", "sourceSpecificationSha256", "packetProfile", "estimator", "configuration", "conservativeLogicalRequestBytes", "requestBytes", "inputTokens", "reservedOutputTokens", "requestResourceEnvelope", "fitTrace"];
    if (!exactKeys(content, keys) || !sha(content.planHash) || !opaque(content.batchId) || !positive(content.batchSlot) || content.batchId !== `batch-${String(content.batchSlot).padStart(4, "0")}` || !Array.isArray(content.ownedLocators) || content.ownedLocators.length < 1 || !Array.isArray(content.contextOnlyLocators) || !sha(content.sourceSpecificationSha256) || !validV2Identity(content.packetProfile) || !validV2Identity(content.estimator) || !validV2Identity(content.configuration) || !exactKeys(content.conservativeLogicalRequestBytes, ["version", "value"]) || content.conservativeLogicalRequestBytes.version !== "ConservativeLogicalRequestBytes/v1" || !positive(content.conservativeLogicalRequestBytes.value) || !positive(content.requestBytes) || content.conservativeLogicalRequestBytes.value !== content.requestBytes || !positive(content.inputTokens) || !positive(content.reservedOutputTokens) || !validV2Envelope(content.requestResourceEnvelope) || !Array.isArray(content.fitTrace) || content.fitTrace.length < 1 || content.fitTrace.length > 32) throw new ImmutableSemanticCorpusPlanError("PlannedSemanticCorpusHandoff/v2 record is invalid.");
    const locators = [...content.ownedLocators, ...content.contextOnlyLocators];
    if (locators.some((locator) => !isRecord(locator) || !exactKeys(locator, ["documentId", "pageNumber", "sourceKind", "localId"]) || !opaque(locator.documentId) || !positive(locator.pageNumber) || !opaque(locator.localId) || !["text_block", "table", "visual_region"].includes(String(locator.sourceKind))) || new Set(locators.map((locator) => `${locator.documentId}\u0000${locator.pageNumber}\u0000${locator.sourceKind}\u0000${locator.localId}`)).size !== locators.length || !content.fitTrace.every((trace) => exactKeys(trace, ["sourceSpecificationSha256", "requestBytes", "inputTokens", "reservedOutputTokens", "outcome"]) && trace.sourceSpecificationSha256 === content.sourceSpecificationSha256 && positive(trace.requestBytes) && positive(trace.inputTokens) && positive(trace.reservedOutputTokens) && (trace.outcome === "fit" || trace.outcome === "unfit"))) throw new ImmutableSemanticCorpusPlanError("PlannedSemanticCorpusHandoff/v2 record is invalid.");
    const last = content.fitTrace[content.fitTrace.length - 1] as Record<string, unknown>;
    if (last.outcome !== "fit" || last.requestBytes !== content.requestBytes || last.inputTokens !== content.inputTokens || last.reservedOutputTokens !== content.reservedOutputTokens) throw new ImmutableSemanticCorpusPlanError("PlannedSemanticCorpusHandoff/v2 record is invalid.");
  }
  return immutable({ version: content.version, content });
}

export class PostgresImmutableSemanticCorpusPlanRepository {
  constructor(private readonly sql: Sql) {}

  /** Historical v1/v2 rows cannot be resumed or replayed through this v3-only persistence boundary. */
  async persist(input: ImmutableSemanticCorpusPlanInputV3): Promise<PersistedSemanticCorpusPlanV3> {
    if (!input || typeof input !== "object") throw new ImmutableSemanticCorpusPlanError("Immutable semantic corpus plan input is invalid.");
    const version = (input as { version?: unknown }).version;
    if (version === "ImmutableSemanticCorpusPlan/v3") return this.persistV3(input as ImmutableSemanticCorpusPlanInputV3);
    throw new ImmutableSemanticCorpusPlanError("Only ImmutableSemanticCorpusPlan/v3 is accepted at the active persistence boundary.");
  }

  /** Persists v3 commitments atomically; this method has no dispatch, grant, or resolver side effect. */
  async persistV3(input: ImmutableSemanticCorpusPlanInputV3): Promise<PersistedSemanticCorpusPlanV3> {
    const canonical = canonicalImmutableSemanticCorpusPlanV3(input);
    const planId = `semantic-plan-${canonical.planHash}`;
    const handoffs = canonical.handoffContents.map((content, index) => ({ batchId: input.proposal.batches[index]!.batchId, handoffHash: digest(content), handoffId: `semantic-handoff-${digest(content)}` }));
    return this.sql.begin(async (sql) => {
      await sql.unsafe("SELECT pg_advisory_xact_lock(hashtext($1))", [`${input.scope.projectId}:${input.scope.workspaceId}:${input.scope.bundleId}:${input.scope.documentId}:${canonical.idempotencyKey}`]);
      const accepted = await sql.unsafe("SELECT 1 FROM atlas.extraction_bundle_document member JOIN atlas.extraction_bundle bundle ON bundle.id=member.bundle_id AND bundle.project_id=member.project_id AND bundle.workspace_id=member.workspace_id JOIN atlas.document document ON document.id=member.document_id AND document.project_id=member.project_id AND document.workspace_id=member.workspace_id JOIN atlas.document_perception_execution execution ON execution.id=member.perception_execution_id AND execution.artifact_id=member.document_id AND execution.source_sha256=document.source_sha256 JOIN atlas.normalized_document_cache cache ON cache.cache_key=$8 AND cache.source_sha256=document.source_sha256 AND cache.contract_version=$9 AND cache.capability=$10 AND cache.invalidated_at IS NULL WHERE member.bundle_id=$1 AND member.document_id=$2 AND member.project_id=$3 AND member.workspace_id=$4 AND document.source_sha256=$5 AND execution.id=$6 AND execution.state='completed' AND execution.completion_fingerprint=$7 AND execution.contract_version=$11 AND member.state='perceived' AND bundle.state='processing' AND cache.capability_identity=execution.capability_identity FOR UPDATE OF member, bundle, document, execution, cache", [input.scope.bundleId, input.scope.documentId, input.scope.projectId, input.scope.workspaceId, input.source.sourceSha256, input.source.perceptionExecutionId, input.source.normalizedDocumentFingerprint, input.source.normalizedDocumentRef, input.source.normalizedDocumentVersion, input.source.perceptionCapability, input.source.perceptionContractVersion]);
      if (accepted.length !== 1) throw new ImmutableSemanticCorpusPlanError("Semantic corpus plan source is foreign, stale, or no longer accepted.");
      const prior = await sql.unsafe("SELECT id, plan_hash, immutable_content FROM atlas.semantic_corpus_plan WHERE (project_id=$1 AND workspace_id=$2 AND bundle_id=$3 AND document_id=$4 AND idempotency_key=$5) OR (project_id=$1 AND workspace_id=$2 AND bundle_id=$3 AND document_id=$4 AND proposal_id=$6) FOR UPDATE", [input.scope.projectId, input.scope.workspaceId, input.scope.bundleId, input.scope.documentId, canonical.idempotencyKey, input.proposal.proposalId]);
      if (prior.length) {
        const row = prior[0]!;
        if (String(row.plan_hash) !== canonical.planHash || !sameCanonical(row.immutable_content, canonical.planContent)) throw new ImmutableSemanticCorpusPlanError("Semantic corpus plan conflicts with an immutable prior version.");
        const stored = await sql.unsafe("SELECT id, batch_id, handoff_hash, immutable_content FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1 ORDER BY batch_slot", [String(row.id)]);
        if (stored.length !== handoffs.length || stored.some((value, index) => value.batch_id !== handoffs[index]!.batchId || value.handoff_hash !== handoffs[index]!.handoffHash || !sameCanonical(value.immutable_content, canonical.handoffContents[index]))) throw new ImmutableSemanticCorpusPlanError("Persisted semantic corpus plan is incomplete or conflicts with its handoffs.");
        return { planId: String(row.id), planHash: canonical.planHash, handoffs: stored.map((row) => ({ batchId: String(row.batch_id), handoffId: String(row.id), handoffHash: String(row.handoff_hash) })) };
      }
      if (input.proposal.replanPredecessor) {
        const predecessor = await sql.unsafe("SELECT plan_hash, immutable_content FROM atlas.semantic_corpus_plan WHERE id=$1 AND project_id=$2 AND workspace_id=$3 AND bundle_id=$4 AND document_id=$5 FOR UPDATE", [input.proposal.replanPredecessor.planId, input.scope.projectId, input.scope.workspaceId, input.scope.bundleId, input.scope.documentId]);
        if (predecessor.length !== 1 || String(predecessor[0]!.plan_hash) !== input.proposal.replanPredecessor.planHash || !isRecord(predecessor[0]!.immutable_content) || predecessor[0]!.immutable_content.version !== "ImmutableSemanticCorpusPlan/v3") throw new ImmutableSemanticCorpusPlanError("Semantic corpus replan predecessor is foreign, stale, or a different version.");
        const cancelled = await sql.unsafe("SELECT 1 FROM atlas.semantic_corpus_plan_cancellation WHERE plan_id=$1", [input.proposal.replanPredecessor.cancellationPlanId]);
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
