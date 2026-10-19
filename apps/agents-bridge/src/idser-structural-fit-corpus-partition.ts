import { createHash } from "node:crypto";
import type { AcceptedDocumentPlannerResultV1 } from "@atlas/db";
import { parseRequestResourceEnvelope, type RequestResourceEnvelope } from "./process-workload-catalogue.js";
import {
  estimateAcceptedCorpusDemand,
  type CorpusDemandEstimate,
  type CorpusDemandEstimatorConfiguration,
  type CorpusDemandUnit,
  type CorpusSourceLocator,
} from "./idser-corpus-demand-estimator.js";
import {
  IdserProspectiveCapacitySnapshotError,
  type IdserProspectiveCapacitySnapshot,
  type IdserProspectiveCapacitySnapshotRead,
} from "./idser-prospective-capacity-snapshot.js";

export class IdserStructuralFitCorpusPartitionError extends Error {}

export type StructuralFitCapacityConsumer = Readonly<{
  read(input: IdserProspectiveCapacitySnapshotRead): Promise<IdserProspectiveCapacitySnapshot>;
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
  units: readonly CorpusDemandUnit[];
  fitTrace: readonly Readonly<{ requestBytes: number; inputTokens: number; outcome: "fit" | "unfit" }>[];
  batches: readonly Readonly<{
    batchId: string;
    ownedLocators: readonly CorpusSourceLocator[];
    contextOnlyLocators: readonly CorpusSourceLocator[];
    requestBytes: number;
    inputTokens: number;
    requestResourceEnvelope: RequestResourceEnvelope;
    fitTrace: readonly Readonly<{ requestBytes: number; inputTokens: number; outcome: "fit" | "unfit" }>[];
  }>[];
  replanPredecessor?: Readonly<{ proposalId: string; proposalHash: string }>;
}>;

export type StructuralFitBlockedResult = Readonly<{
  disposition: "BLOCKED" | "NO_ELIGIBLE_SOURCE";
  reason: "SEM_BATCH_ESTIMATOR_GAP" | "BSS_CAPACITY_CONSUMER_READ_GAP" | "STRUCTURAL_REVISION_CHANGED" | "INDIVISIBLE_STRUCTURAL_UNIT" | "NO_ELIGIBLE_SOURCE";
  units: readonly CorpusDemandUnit[];
  fitTrace: readonly Readonly<{ requestBytes: number; inputTokens: number; outcome: "fit" | "unfit" }>[];
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
  const workload = object(snapshot.workload);
  const bound = workload && object(workload.structuralBound);
  const identity = bound && typeof bound.identity === "string" ? bound.identity : undefined;
  const version = bound && typeof bound.version === "string" ? bound.version : undefined;
  const maxRequestBytes = bound && positive(bound.maxRequestBytes);
  const maxInputTokens = bound && positive(bound.maxInputTokens);
  return identity && version && maxRequestBytes && maxInputTokens ? { identity, version, maxRequestBytes, maxInputTokens } : undefined;
}

function estimator(snapshot: IdserProspectiveCapacitySnapshot): Readonly<{ identity: string; version: string }> | undefined {
  const workload = object(snapshot.workload);
  const value = workload && object(workload.estimator);
  return value && typeof value.identity === "string" && typeof value.version === "string" ? { identity: value.identity, version: value.version } : undefined;
}

function aggregate(units: readonly CorpusDemandUnit[]): Readonly<{ requestBytes: number; inputTokens: number; envelope: RequestResourceEnvelope }> {
  const requestBytes = units.reduce((total, unit) => total + (unit.demand?.requestBytes ?? 0), 0);
  const inputTokens = units.reduce((total, unit) => total + (unit.demand?.inputTokens ?? 0), 0);
  const envelope = parseRequestResourceEnvelope({
    requestUnits: 1,
    tokenUnits: inputTokens,
    dayUnits: 1,
    concurrencyUnits: 1,
  });
  if (!Number.isSafeInteger(requestBytes) || !Number.isSafeInteger(inputTokens)) throw new IdserStructuralFitCorpusPartitionError("candidate demand exceeds safe integer bounds");
  return { requestBytes, inputTokens, envelope };
}

function policyIdentity(snapshot: IdserProspectiveCapacitySnapshot): unknown {
  return { source: snapshot.source, enforcement: snapshot.enforcement, process: snapshot.process, workload: snapshot.workload, eligibleDimensions: snapshot.eligibleDimensions };
}

function proposalIdentity(input: Readonly<{ acceptedDocument: AcceptedDocumentPlannerResultV1; estimatorConfiguration: CorpusDemandEstimatorConfiguration }>, snapshot: IdserProspectiveCapacitySnapshot, estimate: CorpusDemandEstimate): Readonly<{ sourceHash: string; policyHash: string; estimatorHash: string }> {
  return {
    sourceHash: hash({ source: input.acceptedDocument.source, normalizedDocument: input.acceptedDocument.normalizedDocument, media: input.acceptedDocument.media, units: estimate.units }),
    policyHash: hash(policyIdentity(snapshot)),
    estimatorHash: hash({ estimator: estimate.estimator, modelRoute: estimate.modelRoute, overheads: input.estimatorConfiguration.overheads }),
  };
}

/**
 * Composes only the approved prospective BSS reader and pure corpus estimator.
 * It builds an immutable proposal; it has no storage, queue, SEM, GHR, provider,
 * BSS mutation, or runtime-capacity dependency.
 */
export async function proposeStructuralFitCorpusPartition(input: Readonly<{
  acceptedDocument: AcceptedDocumentPlannerResultV1;
  estimatorConfiguration: CorpusDemandEstimatorConfiguration;
  capacityConsumer: StructuralFitCapacityConsumer;
  previousProposal?: Pick<StructuralFitProposal, "proposalId" | "proposalHash" | "sourceHash" | "policyHash" | "estimatorHash">;
}>): Promise<StructuralFitCorpusPartitionResult> {
  const zeroEnvelope = parseRequestResourceEnvelope({ requestUnits: 0, tokenUnits: 0, dayUnits: 0, concurrencyUnits: 0 });
  let pinned: IdserProspectiveCapacitySnapshot;
  try {
    pinned = await input.capacityConsumer.read({ requestBytes: 0, inputTokens: 0, requestResourceEnvelope: zeroEnvelope });
  } catch {
    return frozen({ disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", units: [], fitTrace: [] });
  }
  const pinnedEstimator = estimator(pinned);
  const pinnedStructuralBound = structural(pinned);
  if (!pinnedEstimator || !pinnedStructuralBound || !same(pinnedEstimator, input.estimatorConfiguration.estimator)) {
    return frozen({ disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", units: [], fitTrace: [] });
  }

  const estimate = estimateAcceptedCorpusDemand({
    acceptedDocument: input.acceptedDocument,
    configuration: { ...input.estimatorConfiguration, bssRegisteredEstimator: pinnedEstimator },
  });
  if (estimate.disposition === "SEM_BATCH_ESTIMATOR_GAP") return frozen({ disposition: "BLOCKED", reason: "SEM_BATCH_ESTIMATOR_GAP", units: estimate.units, fitTrace: [] });
  if (estimate.disposition === "NO_ELIGIBLE_SOURCE") return frozen({ disposition: "NO_ELIGIBLE_SOURCE", reason: "NO_ELIGIBLE_SOURCE", units: estimate.units, fitTrace: [] });

  const trace: { requestBytes: number; inputTokens: number; outcome: "fit" | "unfit" }[] = [];
  const batches: StructuralFitProposal["batches"][number][] = [];
  let working: CorpusDemandUnit[] = [];
  const eligible = estimate.units.filter((unit) => unit.classification === "eligible");
  const initialPolicy = policyIdentity(pinned);

  const verifyFit = async (units: readonly CorpusDemandUnit[]): Promise<"fit" | "unfit" | "blocked"> => {
    const candidate = aggregate(units);
    try {
      const result = await input.capacityConsumer.read({ requestBytes: candidate.requestBytes, inputTokens: candidate.inputTokens, requestResourceEnvelope: candidate.envelope });
      trace.push({ requestBytes: candidate.requestBytes, inputTokens: candidate.inputTokens, outcome: "fit" });
      if (!same(initialPolicy, policyIdentity(result))) return "blocked";
      return "fit";
    } catch (error) {
      if ((error instanceof IdserProspectiveCapacitySnapshotError || (error && typeof error === "object" && "disposition" in error))
        && (error as { disposition?: unknown }).disposition === "structurally_unfit") {
        trace.push({ requestBytes: candidate.requestBytes, inputTokens: candidate.inputTokens, outcome: "unfit" });
        return "unfit";
      }
      return "blocked";
    }
  };
  const addBatch = (units: readonly CorpusDemandUnit[]) => {
    const candidate = aggregate(units);
    const batchId = `batch-${String(batches.length + 1).padStart(4, "0")}`;
    const fitTrace = trace.filter((entry) => entry.requestBytes === candidate.requestBytes && entry.inputTokens === candidate.inputTokens);
    batches.push({ batchId, ownedLocators: units.map((unit) => unit.locator), contextOnlyLocators: [], requestBytes: candidate.requestBytes, inputTokens: candidate.inputTokens, requestResourceEnvelope: candidate.envelope, fitTrace });
  };

  for (const unit of eligible) {
    const candidate = [...working, unit];
    const outcome = await verifyFit(candidate);
    if (outcome === "fit") { working = candidate; continue; }
    if (outcome === "blocked") return frozen({ disposition: "BLOCKED", reason: "STRUCTURAL_REVISION_CHANGED", units: estimate.units, fitTrace: trace });
    if (working.length === 0) return frozen({ disposition: "BLOCKED", reason: "INDIVISIBLE_STRUCTURAL_UNIT", units: estimate.units, fitTrace: trace });
    addBatch(working);
    working = [unit];
    const retry = await verifyFit(working);
    if (retry === "fit") continue;
    return frozen({ disposition: "BLOCKED", reason: retry === "unfit" ? "INDIVISIBLE_STRUCTURAL_UNIT" : "STRUCTURAL_REVISION_CHANGED", units: estimate.units, fitTrace: trace });
  }
  if (working.length > 0) addBatch(working);

  const identities = proposalIdentity(input, pinned, estimate);
  const totalEnvelope = parseRequestResourceEnvelope({
    requestUnits: batches.length,
    tokenUnits: batches.reduce((total, batch) => total + batch.requestResourceEnvelope.tokenUnits, 0),
    dayUnits: batches.length,
    concurrencyUnits: batches.reduce((total, batch) => total + batch.requestResourceEnvelope.concurrencyUnits, 0),
  });
  const base = {
    ...identities,
    structuralBound: pinnedStructuralBound,
    eligibleDimensions: [...pinned.eligibleDimensions],
    bssSnapshot: { source: pinned.source, enforcement: pinned.enforcement, process: pinned.process, workload: pinned.workload },
    requestResourceEnvelope: totalEnvelope,
    units: estimate.units,
    fitTrace: trace,
    batches,
  };
  const changed = input.previousProposal && (input.previousProposal.sourceHash !== base.sourceHash || input.previousProposal.policyHash !== base.policyHash || input.previousProposal.estimatorHash !== base.estimatorHash);
  const replanPredecessor = changed ? { proposalId: input.previousProposal!.proposalId, proposalHash: input.previousProposal!.proposalHash } : undefined;
  const proposalHash = hash({ ...base, ...(replanPredecessor ? { replanPredecessor } : {}) });
  return frozen({
    disposition: changed ? "REPLAN" : "READY",
    proposalId: `structural-fit-${proposalHash.slice(0, 16)}`,
    proposalHash,
    ...base,
    ...(replanPredecessor ? { replanPredecessor } : {}),
  });
}
