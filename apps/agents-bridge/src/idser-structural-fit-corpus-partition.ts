import { createHash } from "node:crypto";
import { buildStepwiseSourcePacket, type StepwiseSourceAssetIdentity, type StepwiseSourceLocator } from "@atlas/skills";
import type { AcceptedDocumentPlannerResultV1 } from "@atlas/db";
import {
  CompleteSemCandidateRequestEstimatorError,
  estimateCompleteSemCandidateRequest,
  type CompleteSemCandidateRequestEstimate,
  type CompleteSemCandidateRequestEstimatorConfiguration,
} from "./complete-sem-candidate-request-estimator.js";
import type { RequestResourceEnvelope } from "./process-workload-catalogue.js";
import {
  IdserProspectiveCapacitySnapshotError,
  type IdserProspectiveCapacitySnapshot,
  type IdserProspectiveCapacitySnapshotRead,
} from "./idser-prospective-capacity-snapshot.js";

export class IdserStructuralFitCorpusPartitionError extends Error {}

export type StructuralFitCapacityConsumer = Readonly<{
  read(input: IdserProspectiveCapacitySnapshotRead): Promise<IdserProspectiveCapacitySnapshot>;
}>;

export type StructuralFitCorpusUnit = Readonly<{
  locator: StepwiseSourceLocator;
  classification: "eligible" | "deferred" | "unexamined";
  reason?: "empty_content" | "image_accounting_unavailable";
}>;

type FitTrace = Readonly<{
  requestBytes: number;
  inputTokens: number;
  sourceSpecificationSha256: string;
  outcome: "fit" | "unfit";
}>;

export type StructuralFitProposal = Readonly<{
  disposition: "READY" | "REPLAN";
  proposalId: string;
  proposalHash: string;
  sourceHash: string;
  policyHash: string;
  estimatorHash: string;
  structuralBound: Readonly<{ identity: string; version: string; maxRequestBytes: number; maxInputTokens: number }>;
  eligibleDimensions: readonly ("rpm" | "tpm" | "rpd" | "concurrency")[];
  bssSnapshot: Readonly<{
    source: IdserProspectiveCapacitySnapshot["source"];
    enforcement: IdserProspectiveCapacitySnapshot["enforcement"];
    process: IdserProspectiveCapacitySnapshot["process"];
    workload: IdserProspectiveCapacitySnapshot["workload"];
  }>;
  requestResourceEnvelope: RequestResourceEnvelope;
  units: readonly StructuralFitCorpusUnit[];
  fitTrace: readonly FitTrace[];
  batches: readonly Readonly<{
    batchId: string;
    ownedLocators: readonly StepwiseSourceLocator[];
    contextOnlyLocators: readonly StepwiseSourceLocator[];
    sourceSpecificationSha256: string;
    requestBytes: number;
    inputTokens: number;
    requestResourceEnvelope: RequestResourceEnvelope;
    fitTrace: readonly FitTrace[];
  }>[];
  replanPredecessor?: Readonly<{ proposalId: string; proposalHash: string }>;
}>;

export type StructuralFitBlockedResult = Readonly<{
  disposition: "BLOCKED" | "NO_ELIGIBLE_SOURCE";
  reason: "SEM_BATCH_ESTIMATOR_GAP" | "BSS_CAPACITY_CONSUMER_READ_GAP" | "STRUCTURAL_REVISION_CHANGED" | "INDIVISIBLE_STRUCTURAL_UNIT" | "NO_ELIGIBLE_SOURCE";
  units: readonly StructuralFitCorpusUnit[];
  fitTrace: readonly FitTrace[];
}>;

export type StructuralFitCorpusPartitionResult = StructuralFitProposal | StructuralFitBlockedResult;

const frozen = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) frozen(child);
  }
  return value;
};
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const hash = (value: unknown): string => createHash("sha256").update(stable(value)).digest("hex");
const object = (value: unknown): Record<string, unknown> | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const positive = (value: unknown): number | undefined => Number.isSafeInteger(value) && (value as number) > 0 ? value as number : undefined;
const same = (left: unknown, right: unknown): boolean => stable(left) === stable(right);

function structural(snapshot: IdserProspectiveCapacitySnapshot): StructuralFitProposal["structuralBound"] | undefined {
  const bound = object(object(snapshot.workload)?.structuralBound);
  const identity = bound && typeof bound.identity === "string" ? bound.identity : undefined;
  const version = bound && typeof bound.version === "string" ? bound.version : undefined;
  const maxRequestBytes = bound && positive(bound.maxRequestBytes);
  const maxInputTokens = bound && positive(bound.maxInputTokens);
  return identity && version && maxRequestBytes && maxInputTokens ? { identity, version, maxRequestBytes, maxInputTokens } : undefined;
}
function estimator(snapshot: IdserProspectiveCapacitySnapshot): Readonly<{ identity: string; version: string }> | undefined {
  const value = object(object(snapshot.workload)?.estimator);
  return value && typeof value.identity === "string" && typeof value.version === "string" ? { identity: value.identity, version: value.version } : undefined;
}
function unitsFor(acceptedDocument: AcceptedDocumentPlannerResultV1): readonly StructuralFitCorpusUnit[] {
  if (acceptedDocument.normalizedDocument.artifactId !== acceptedDocument.source.documentId || acceptedDocument.normalizedDocument.sourceSha256 !== acceptedDocument.source.sourceSha256 || acceptedDocument.rel.state !== "unavailable") throw new IdserStructuralFitCorpusPartitionError("accepted document binding is invalid");
  const units: StructuralFitCorpusUnit[] = [];
  for (const page of [...acceptedDocument.normalizedDocument.pages].sort((left, right) => left.number - right.number)) {
    for (const text of [...page.textBlocks].sort((left, right) => left.id.localeCompare(right.id))) units.push({ locator: { pageNumber: page.number, locatorType: "text_block", locatorId: text.id }, classification: text.text.trim() ? "eligible" : "deferred", ...(text.text.trim() ? {} : { reason: "empty_content" as const }) });
    for (const table of [...page.tables].sort((left, right) => left.id.localeCompare(right.id))) units.push({ locator: { pageNumber: page.number, locatorType: "table", locatorId: table.id }, classification: table.content.trim() ? "eligible" : "deferred", ...(table.content.trim() ? {} : { reason: "empty_content" as const }) });
    for (const visual of [...page.visualRegions].sort((left, right) => left.id.localeCompare(right.id))) {
      // The current BSS snapshot has no authorized image-token accounting.
      units.push({ locator: { pageNumber: page.number, locatorType: "visual_region", locatorId: visual.id }, classification: "unexamined", reason: "image_accounting_unavailable" });
    }
  }
  return units;
}
function verifiedAssetIdentities(acceptedDocument: AcceptedDocumentPlannerResultV1): readonly StepwiseSourceAssetIdentity[] {
  const expected = new Map<string, string>();
  for (const page of acceptedDocument.normalizedDocument.pages) for (const visual of page.visualRegions) if (visual.assetRef) expected.set(`${page.number}\u0000${visual.id}`, visual.assetRef);
  const identities: StepwiseSourceAssetIdentity[] = [];
  const seen = new Set<string>();
  for (const media of acceptedDocument.media) {
    const key = `${media.pageNumber}\u0000${media.locatorId}`;
    if (seen.has(key) || expected.get(key) !== media.assetRef || media.mediaType !== "image/png" || !/^[a-f0-9]{64}$/.test(media.sha256) || !Number.isSafeInteger(media.byteLength) || media.byteLength <= 0) throw new IdserStructuralFitCorpusPartitionError("accepted media identity is foreign, duplicate, or malformed");
    seen.add(key);
    identities.push({ pageNumber: media.pageNumber, locatorId: media.locatorId, assetRef: media.assetRef, sha256: media.sha256, sourceSha256: acceptedDocument.source.sourceSha256 });
  }
  return identities;
}
function policyIdentity(snapshot: IdserProspectiveCapacitySnapshot): unknown {
  return { source: snapshot.source, enforcement: snapshot.enforcement, process: snapshot.process, workload: snapshot.workload, eligibleDimensions: snapshot.eligibleDimensions };
}
function proposalIdentity(input: Readonly<{ acceptedDocument: AcceptedDocumentPlannerResultV1; estimatorConfiguration: CompleteSemCandidateRequestEstimatorConfiguration }>, snapshot: IdserProspectiveCapacitySnapshot, units: readonly StructuralFitCorpusUnit[]) {
  return { sourceHash: hash({ source: input.acceptedDocument.source, normalizedDocument: input.acceptedDocument.normalizedDocument, media: input.acceptedDocument.media, units }), policyHash: hash(policyIdentity(snapshot)), estimatorHash: hash(input.estimatorConfiguration) };
}

/** Composes only the canonical packet builder, complete estimator, and authenticated prospective BSS reader. */
export async function proposeStructuralFitCorpusPartition(input: Readonly<{
  acceptedDocument: AcceptedDocumentPlannerResultV1;
  estimatorConfiguration: CompleteSemCandidateRequestEstimatorConfiguration;
  capacityConsumer: StructuralFitCapacityConsumer;
  previousProposal?: Pick<StructuralFitProposal, "proposalId" | "proposalHash" | "sourceHash" | "policyHash" | "estimatorHash">;
}>): Promise<StructuralFitCorpusPartitionResult> {
  let units: readonly StructuralFitCorpusUnit[];
  let assetIdentities: readonly StepwiseSourceAssetIdentity[];
  try { units = unitsFor(input.acceptedDocument); assetIdentities = verifiedAssetIdentities(input.acceptedDocument); }
  catch { return frozen({ disposition: "BLOCKED", reason: "SEM_BATCH_ESTIMATOR_GAP", units: [], fitTrace: [] }); }
  let pinned: IdserProspectiveCapacitySnapshot;
  try { pinned = await input.capacityConsumer.read({ requestBytes: 0, inputTokens: 0, requestResourceEnvelope: { requestUnits: 0, tokenUnits: 0, dayUnits: 0, concurrencyUnits: 0 } }); }
  catch { return frozen({ disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", units, fitTrace: [] }); }
  const pinnedEstimator = estimator(pinned);
  const pinnedStructuralBound = structural(pinned);
  if (!pinnedEstimator || !pinnedStructuralBound || !same(pinnedEstimator, input.estimatorConfiguration.estimator)) return frozen({ disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", units, fitTrace: [] });
  const eligible = units.filter((unit) => unit.classification === "eligible");
  if (eligible.length === 0) return frozen({ disposition: "NO_ELIGIBLE_SOURCE", reason: "NO_ELIGIBLE_SOURCE", units, fitTrace: [] });

  const trace: FitTrace[] = [];
  const batches: StructuralFitProposal["batches"][number][] = [];
  const initialPolicy = policyIdentity(pinned);
  let working: StructuralFitCorpusUnit[] = [];
  const candidate = (candidateUnits: readonly StructuralFitCorpusUnit[]): CompleteSemCandidateRequestEstimate => estimateCompleteSemCandidateRequest({ candidatePacket: buildStepwiseSourcePacket({ document: input.acceptedDocument.normalizedDocument, ownedLocators: candidateUnits.map((unit) => unit.locator), contextOnlyLocators: [], assetIdentities }), configuration: input.estimatorConfiguration });
  const verifyFit = async (candidateUnits: readonly StructuralFitCorpusUnit[]): Promise<Readonly<{ outcome: "fit" | "unfit" | "blocked"; reason?: "SEM_BATCH_ESTIMATOR_GAP" | "STRUCTURAL_REVISION_CHANGED"; estimate?: CompleteSemCandidateRequestEstimate }>> => {
    let estimate: CompleteSemCandidateRequestEstimate;
    try { estimate = candidate(candidateUnits); } catch { return { outcome: "blocked", reason: "SEM_BATCH_ESTIMATOR_GAP" }; }
    try {
      const result = await input.capacityConsumer.read({ requestBytes: estimate.requestBytes, inputTokens: estimate.inputTokens, requestResourceEnvelope: estimate.requestResourceEnvelope });
      if (!same(initialPolicy, policyIdentity(result))) return { outcome: "blocked", reason: "STRUCTURAL_REVISION_CHANGED" };
      trace.push({ requestBytes: estimate.requestBytes, inputTokens: estimate.inputTokens, sourceSpecificationSha256: estimate.provenance.sourcePacket.sourceSpecificationSha256, outcome: "fit" });
      return { outcome: "fit", estimate };
    } catch (error) {
      if ((error instanceof IdserProspectiveCapacitySnapshotError || (error && typeof error === "object" && "disposition" in error)) && (error as { disposition?: unknown }).disposition === "structurally_unfit") {
        trace.push({ requestBytes: estimate.requestBytes, inputTokens: estimate.inputTokens, sourceSpecificationSha256: estimate.provenance.sourcePacket.sourceSpecificationSha256, outcome: "unfit" });
        return { outcome: "unfit", estimate };
      }
      return { outcome: "blocked", reason: "STRUCTURAL_REVISION_CHANGED" };
    }
  };
  const addBatch = (batchUnits: readonly StructuralFitCorpusUnit[], estimate: CompleteSemCandidateRequestEstimate) => {
    const sourceSpecificationSha256 = estimate.provenance.sourcePacket.sourceSpecificationSha256;
    batches.push({ batchId: `batch-${String(batches.length + 1).padStart(4, "0")}`, ownedLocators: batchUnits.map((unit) => unit.locator), contextOnlyLocators: [], sourceSpecificationSha256, requestBytes: estimate.requestBytes, inputTokens: estimate.inputTokens, requestResourceEnvelope: estimate.requestResourceEnvelope, fitTrace: trace.filter((entry) => entry.sourceSpecificationSha256 === sourceSpecificationSha256) });
  };
  for (const unit of eligible) {
    const outcome = await verifyFit([...working, unit]);
    if (outcome.outcome === "fit") { working = [...working, unit]; continue; }
    if (outcome.outcome === "blocked") return frozen({ disposition: "BLOCKED", reason: outcome.reason ?? "STRUCTURAL_REVISION_CHANGED", units, fitTrace: trace });
    if (working.length === 0) return frozen({ disposition: "BLOCKED", reason: "INDIVISIBLE_STRUCTURAL_UNIT", units, fitTrace: trace });
    const finalized = await verifyFit(working);
    if (finalized.outcome !== "fit" || !finalized.estimate) return frozen({ disposition: "BLOCKED", reason: finalized.reason ?? "STRUCTURAL_REVISION_CHANGED", units, fitTrace: trace });
    addBatch(working, finalized.estimate);
    working = [unit];
    const retry = await verifyFit(working);
    if (retry.outcome === "fit") continue;
    return frozen({ disposition: "BLOCKED", reason: retry.outcome === "unfit" ? "INDIVISIBLE_STRUCTURAL_UNIT" : retry.reason ?? "STRUCTURAL_REVISION_CHANGED", units, fitTrace: trace });
  }
  const final = await verifyFit(working);
  if (final.outcome !== "fit" || !final.estimate) return frozen({ disposition: "BLOCKED", reason: final.outcome === "unfit" ? "INDIVISIBLE_STRUCTURAL_UNIT" : final.reason ?? "STRUCTURAL_REVISION_CHANGED", units, fitTrace: trace });
  addBatch(working, final.estimate);
  const identities = proposalIdentity(input, pinned, units);
  const totalEnvelope = { requestUnits: batches.reduce((total, batch) => total + batch.requestResourceEnvelope.requestUnits, 0), tokenUnits: batches.reduce((total, batch) => total + batch.requestResourceEnvelope.tokenUnits, 0), dayUnits: batches.reduce((total, batch) => total + batch.requestResourceEnvelope.dayUnits, 0), concurrencyUnits: batches.reduce((total, batch) => total + batch.requestResourceEnvelope.concurrencyUnits, 0) } as RequestResourceEnvelope;
  const base = { ...identities, structuralBound: pinnedStructuralBound, eligibleDimensions: [...pinned.eligibleDimensions], bssSnapshot: { source: pinned.source, enforcement: pinned.enforcement, process: pinned.process, workload: pinned.workload }, requestResourceEnvelope: totalEnvelope, units, fitTrace: trace, batches };
  const changed = input.previousProposal && (input.previousProposal.sourceHash !== base.sourceHash || input.previousProposal.policyHash !== base.policyHash || input.previousProposal.estimatorHash !== base.estimatorHash);
  const replanPredecessor = changed ? { proposalId: input.previousProposal!.proposalId, proposalHash: input.previousProposal!.proposalHash } : undefined;
  const proposalHash = hash({ ...base, ...(replanPredecessor ? { replanPredecessor } : {}) });
  return frozen({ disposition: changed ? "REPLAN" : "READY", proposalId: `structural-fit-${proposalHash.slice(0, 16)}`, proposalHash, ...base, ...(replanPredecessor ? { replanPredecessor } : {}) });
}
