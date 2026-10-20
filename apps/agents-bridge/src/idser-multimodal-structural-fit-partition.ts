import { createHash } from "node:crypto";
import type { StepwiseSourceLocator } from "@atlas/skills";
import type { RequestResourceEnvelope } from "./process-workload-catalogue.js";
import type { IdserProspectiveCapacitySnapshot, IdserProspectiveCapacitySnapshotRead } from "./idser-prospective-capacity-snapshot.js";
import { IdserProspectiveCapacitySnapshotError } from "./idser-prospective-capacity-snapshot.js";
import type { MultimodalInventoryAndCandidates, TransientMultimodalCandidate } from "./idser-multimodal-inventory-candidates.js";
import type { MultimodalRequestProfile } from "./provider-capabilities.js";

/** The BSS boundary remains a prospective read; this interface has no write or admission capability. */
export type MultimodalStructuralFitCapacityConsumer = Readonly<{
  read(input: IdserProspectiveCapacitySnapshotRead): Promise<IdserProspectiveCapacitySnapshot>;
}>;

export type MultimodalStructuralFitReason =
  | "BSS_CAPACITY_CONSUMER_READ_GAP"
  | "CANDIDATE_INTEGRITY_REJECTED"
  | "EFFECTIVE_ROUTE_REJECTED"
  | "STRUCTURAL_REVISION_CHANGED"
  | "STRUCTURALLY_UNAVAILABLE"
  | "NO_ELIGIBLE_CANDIDATE";

export type MultimodalStructuralFitBatch = Readonly<{
  batchId: string;
  candidateId: string;
  ownedLocators: readonly StepwiseSourceLocator[];
  contextOnlyLocators: readonly StepwiseSourceLocator[];
  selectedMedia: readonly TransientMultimodalCandidate["selectedMedia"][number][];
  requestBytes: number;
  inputTokens: number;
  reservedOutputTokens: number;
  requestResourceEnvelope: RequestResourceEnvelope;
}>;

export type MultimodalStructuralFitProposal = Readonly<{
  disposition: "READY" | "REPLAN";
  proposalId: string;
  proposalHash: string;
  candidateHash: string;
  routeHash: string;
  policyHash: string;
  structuralBound: Readonly<{
    identity: string;
    version: string;
    maxRequestBytes: number;
    maxInputTokens: number;
    maxPromptBytes: number;
    maxContextTokens: number;
  }>;
  batches: readonly MultimodalStructuralFitBatch[];
  rejected: readonly Readonly<{ candidateId: string; reason: "STRUCTURALLY_UNAVAILABLE" }>[];
  replanPredecessor?: Readonly<{ proposalId: string; proposalHash: string }>;
}>;

export type MultimodalStructuralFitBlocked = Readonly<{
  disposition: "BLOCKED" | "NO_ELIGIBLE_CANDIDATE";
  reason: MultimodalStructuralFitReason;
  rejected: readonly Readonly<{ candidateId: string; reason: "STRUCTURALLY_UNAVAILABLE" }>[];
}>;

export type MultimodalStructuralFitPartitionResult = MultimodalStructuralFitProposal | MultimodalStructuralFitBlocked;

const frozen = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) frozen(child);
  }
  return value;
};
const stable = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`).join(",")}}`;
  throw new Error("value is not JSON-serializable");
};
const hash = (value: unknown): string => createHash("sha256").update(stable(value)).digest("hex");
const positive = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const nonNegative = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const opaque = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const same = (left: unknown, right: unknown): boolean => stable(left) === stable(right);
const locatorKey = (locator: StepwiseSourceLocator): string => `${locator.pageNumber}\u0000${locator.locatorType}\u0000${locator.locatorId}`;

function structural(snapshot: IdserProspectiveCapacitySnapshot): MultimodalStructuralFitProposal["structuralBound"] | undefined {
  const bound = snapshot.workload.structuralBound;
  if (!bound || typeof bound !== "object" || Array.isArray(bound)) return undefined;
  const value = bound as Record<string, unknown>;
  if (!opaque(value.identity) || !opaque(value.version) || !positive(value.maxRequestBytes) || !positive(value.maxInputTokens) || !positive(value.maxPromptBytes) || !positive(value.maxContextTokens)) return undefined;
  return { identity: value.identity, version: value.version, maxRequestBytes: value.maxRequestBytes, maxInputTokens: value.maxInputTokens, maxPromptBytes: value.maxPromptBytes, maxContextTokens: value.maxContextTokens };
}

function policyIdentity(snapshot: IdserProspectiveCapacitySnapshot): unknown {
  return { source: snapshot.source, enforcement: snapshot.enforcement, process: snapshot.process, workload: snapshot.workload, eligibleDimensions: snapshot.eligibleDimensions };
}

function validEnvelope(value: RequestResourceEnvelope): boolean {
  return positive(value.requestUnits) && positive(value.tokenUnits) && positive(value.dayUnits) && positive(value.concurrencyUnits);
}

function candidateMatchesRoute(candidate: TransientMultimodalCandidate, route: MultimodalRequestProfile): boolean {
  const estimate = candidate.estimate;
  const demand = estimate.estimate;
  if (!opaque(candidate.candidateId) || !opaque(candidate.descriptorManifestSha256) || !opaque(candidate.requestCompositionSha256)
    || !positive(demand.requestBytes) || !positive(demand.inputTokens) || !nonNegative(demand.reservedOutputTokens)
    || demand.prospectiveTokenDemand !== demand.inputTokens + demand.reservedOutputTokens
    || demand.requestResourceEnvelope.tokenUnits !== demand.prospectiveTokenDemand || !validEnvelope(demand.requestResourceEnvelope)
    || !opaque(estimate.provenance.route.routeId) || !opaque(estimate.provenance.route.profileId) || !opaque(estimate.provenance.route.profileVersion)
    || estimate.provenance.route.routeId !== route.routeId || estimate.provenance.route.profileId !== route.profileId || estimate.provenance.route.profileVersion !== route.profileVersion) return false;

  const owned = new Set<string>();
  const context = new Set<string>();
  for (const locator of candidate.ownedLocators) {
    const key = locatorKey(locator);
    if (!positive(locator.pageNumber) || !opaque(locator.locatorId) || owned.has(key)) return false;
    owned.add(key);
  }
  if (owned.size === 0) return false;
  for (const locator of candidate.contextOnlyLocators) {
    const key = locatorKey(locator);
    if (!positive(locator.pageNumber) || !opaque(locator.locatorId) || owned.has(key) || context.has(key)) return false;
    context.add(key);
  }
  const media = route.image;
  if (candidate.selectedMedia.length === 0) return estimate.selectedImageCount === 0 && estimate.selectedImageBytes === 0;
  if (!media || media.version !== "v1" || !positive(media.maxImageCount) || !positive(media.maxImageBytes) || !positive(media.maxImageWidth) || !positive(media.maxImageHeight) || !media.mediaTypes.includes("image/png")) return false;
  const mediaSlots = new Set<string>();
  let totalBytes = 0;
  for (const item of candidate.selectedMedia) {
    if (!opaque(item.sourceSlot) || !opaque(item.locatorId) || !opaque(item.assetRef) || item.mediaType !== "image/png"
      || !positive(item.pageNumber) || !positive(item.byteLength) || !positive(item.width) || !positive(item.height)
      || mediaSlots.has(item.sourceSlot) || item.width > media.maxImageWidth || item.height > media.maxImageHeight) return false;
    mediaSlots.add(item.sourceSlot);
    totalBytes += item.byteLength;
  }
  return Number.isSafeInteger(totalBytes) && candidate.selectedMedia.length === estimate.selectedImageCount
    && totalBytes === estimate.selectedImageBytes && candidate.selectedMedia.length <= media.maxImageCount && totalBytes <= media.maxImageBytes;
}

function candidateCoverageIsValid(input: MultimodalInventoryAndCandidates): boolean {
  const candidateIds = new Set(input.candidates.map((candidate) => candidate.candidateId));
  const inventoryKeys = new Set<string>();
  for (const item of input.inventory) {
    const key = locatorKey(item.locator);
    if (inventoryKeys.has(key) || !positive(item.locator.pageNumber) || !opaque(item.locator.locatorId)) return false;
    inventoryKeys.add(key);
    if (item.disposition === "eligible" && (!item.candidateId || !candidateIds.has(item.candidateId))) return false;
    if (item.disposition === "rejected" && item.candidateId !== undefined) return false;
  }
  const owned = new Set<string>();
  const contextCounts = new Map<string, number>();
  for (const candidate of input.candidates) {
    for (const locator of candidate.ownedLocators) {
      const key = locatorKey(locator);
      if (!inventoryKeys.has(key) || owned.has(key)) return false;
      owned.add(key);
    }
    for (const locator of candidate.contextOnlyLocators) {
      const key = locatorKey(locator);
      if (!inventoryKeys.has(key)) return false;
      contextCounts.set(key, (contextCounts.get(key) ?? 0) + 1);
    }
  }
  return [...contextCounts.values()].every((count) => count <= input.candidates.length)
    && input.inventory.filter((item) => item.disposition === "eligible").every((item) => owned.has(locatorKey(item.locator)));
}

/**
 * Consumes only already-complete transient candidates. It does not rebuild a
 * request or estimate, reserve BSS capacity, or reach any durable/execution
 * surface. A candidate is one complete logical request and therefore one
 * prospective batch when it fits.
 */
export async function partitionMultimodalStructuralFit(input: Readonly<{
  inventory: MultimodalInventoryAndCandidates;
  effectiveRoute: MultimodalRequestProfile;
  capacityConsumer: MultimodalStructuralFitCapacityConsumer;
  previousProposal?: Pick<MultimodalStructuralFitProposal, "proposalId" | "proposalHash" | "candidateHash" | "routeHash" | "policyHash">;
}>): Promise<MultimodalStructuralFitPartitionResult> {
  if (input.inventory.version !== "atlas.idser.multimodal-inventory-candidates/v1" || !candidateCoverageIsValid(input.inventory)) return frozen({ disposition: "BLOCKED", reason: "CANDIDATE_INTEGRITY_REJECTED", rejected: [] });
  const candidates = [...input.inventory.candidates].sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  if (new Set(candidates.map((candidate) => candidate.candidateId)).size !== candidates.length || candidates.some((candidate) => !candidateMatchesRoute(candidate, input.effectiveRoute))) return frozen({ disposition: "BLOCKED", reason: "EFFECTIVE_ROUTE_REJECTED", rejected: [] });
  if (candidates.length === 0) return frozen({ disposition: "NO_ELIGIBLE_CANDIDATE", reason: "NO_ELIGIBLE_CANDIDATE", rejected: [] });

  let pinned: IdserProspectiveCapacitySnapshot;
  try { pinned = await input.capacityConsumer.read({ requestBytes: 0, inputTokens: 0, requestResourceEnvelope: { requestUnits: 0, tokenUnits: 0, dayUnits: 0, concurrencyUnits: 0 } }); }
  catch { return frozen({ disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", rejected: [] }); }
  const bound = structural(pinned);
  if (!bound) return frozen({ disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", rejected: [] });
  const initialPolicy = policyIdentity(pinned);
  const batches: MultimodalStructuralFitBatch[] = [];
  const rejected: { candidateId: string; reason: "STRUCTURALLY_UNAVAILABLE" }[] = [];

  for (const candidate of candidates) {
    const demand = candidate.estimate.estimate;
    const localUnfit = demand.requestBytes > bound.maxRequestBytes
      || demand.requestBytes > bound.maxPromptBytes
      || demand.inputTokens > bound.maxInputTokens
      || demand.inputTokens + demand.reservedOutputTokens > bound.maxContextTokens;
    if (localUnfit) { rejected.push({ candidateId: candidate.candidateId, reason: "STRUCTURALLY_UNAVAILABLE" }); continue; }
    try {
      const result = await input.capacityConsumer.read({ requestBytes: demand.requestBytes, inputTokens: demand.inputTokens, requestResourceEnvelope: demand.requestResourceEnvelope });
      if (!same(initialPolicy, policyIdentity(result))) return frozen({ disposition: "BLOCKED", reason: "STRUCTURAL_REVISION_CHANGED", rejected });
    } catch (error) {
      if ((error instanceof IdserProspectiveCapacitySnapshotError || (error && typeof error === "object" && "disposition" in error)) && (error as { disposition?: unknown }).disposition === "structurally_unfit") { rejected.push({ candidateId: candidate.candidateId, reason: "STRUCTURALLY_UNAVAILABLE" }); continue; }
      return frozen({ disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", rejected });
    }
    batches.push({ batchId: `batch-${String(batches.length + 1).padStart(4, "0")}`, candidateId: candidate.candidateId, ownedLocators: [...candidate.ownedLocators], contextOnlyLocators: [...candidate.contextOnlyLocators], selectedMedia: candidate.selectedMedia.map((item) => ({ ...item })), requestBytes: demand.requestBytes, inputTokens: demand.inputTokens, reservedOutputTokens: demand.reservedOutputTokens, requestResourceEnvelope: { ...demand.requestResourceEnvelope } });
  }
  if (batches.length === 0) return frozen({ disposition: "BLOCKED", reason: "STRUCTURALLY_UNAVAILABLE", rejected });
  const candidateHash = hash(input.inventory);
  const routeHash = hash(input.effectiveRoute);
  const policyHash = hash(initialPolicy);
  const changed = input.previousProposal && (input.previousProposal.candidateHash !== candidateHash || input.previousProposal.routeHash !== routeHash || input.previousProposal.policyHash !== policyHash);
  const replanPredecessor = changed ? { proposalId: input.previousProposal!.proposalId, proposalHash: input.previousProposal!.proposalHash } : undefined;
  const base = { candidateHash, routeHash, policyHash, structuralBound: bound, batches, rejected };
  const proposalHash = hash({ ...base, ...(replanPredecessor ? { replanPredecessor } : {}) });
  return frozen({ disposition: changed ? "REPLAN" : "READY", proposalId: `multimodal-structural-fit-${proposalHash.slice(0, 16)}`, proposalHash, ...base, ...(replanPredecessor ? { replanPredecessor } : {}) });
}
