import { parseRequestResourceEnvelope, type RequestResourceEnvelope } from "./process-workload-catalogue.js";
import type { CapacityPlanningSnapshot, CapacityPlanningSnapshotRead } from "./capacity-planning-snapshot.js";

type JsonRecord = Record<string, unknown>;

export class IdserProspectiveCapacitySnapshotError extends Error {}

export type IdserProspectiveCapacitySnapshotRead = Readonly<{
  requestBytes: number;
  inputTokens: number;
  requestResourceEnvelope: RequestResourceEnvelope;
}>;

export type IdserProspectiveCapacitySnapshot = Readonly<{
  apiVersion: "CapacityPlanningSnapshot/v1";
  status: "inactive";
  reason: "prospective_planning_only";
  view: "prospective-planning-only";
  readIsNotAdmissionPermit: true;
  plan: null;
  source: JsonRecord;
  enforcement: JsonRecord;
  process: JsonRecord;
  workload: JsonRecord;
  /** BSS dimensions remain separate from the request-demand envelope. */
  eligibleDimensions: readonly ["requestUnits", "tokenUnits", "dayUnits", "concurrencyUnits"];
  requestResourceEnvelope: RequestResourceEnvelope;
}>;

type CapacityPlanningSnapshotReader = Readonly<{
  read(credential: string, request?: CapacityPlanningSnapshotRead): Promise<CapacityPlanningSnapshot>;
}>;

const requiredDimensions = ["rpm", "tpm", "rpd", "concurrency"] as const;
const eligibleDimensions = ["requestUnits", "tokenUnits", "dayUnits", "concurrencyUnits"] as const;

function fail(message: string): never { throw new IdserProspectiveCapacitySnapshotError(`IDSER prospective capacity snapshot rejected: ${message}`); }
function object(value: unknown, name: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${name} is missing or malformed`);
  return value as JsonRecord;
}
function nonEmpty(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) fail(`${name} is missing`);
  return value;
}
function positive(value: unknown, name: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) fail(`${name} is not a positive safe integer`);
  return value as number;
}
function nonNegative(value: unknown, name: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail(`${name} is not a non-negative safe integer`);
  return value as number;
}
function exactKeys(value: JsonRecord, keys: readonly string[], name: string): void {
  if (Object.keys(value).length !== keys.length || keys.some((key) => !(key in value))) fail(`${name} has an unsupported dimension shape`);
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

/**
 * Consumes the BSS-owned planning projection with a credential supplied by
 * trusted server composition. It deliberately has no route, persistence, or
 * admission surface: later IDSER tickets may use this immutable read only for
 * structural planning.
 */
export function createIdserProspectiveCapacitySnapshotConsumer(options: Readonly<{
  reader: CapacityPlanningSnapshotReader;
  serverCredential: string;
}>): Readonly<{ read(input: IdserProspectiveCapacitySnapshotRead): Promise<IdserProspectiveCapacitySnapshot> }> {
  if (typeof options.serverCredential !== "string" || options.serverCredential.length === 0) throw new IdserProspectiveCapacitySnapshotError("IDSER prospective capacity snapshot needs a server-owned credential.");
  return {
    async read(input) {
      const requestBytes = nonNegative(input.requestBytes, "requestBytes");
      const inputTokens = nonNegative(input.inputTokens, "inputTokens");
      const requestResourceEnvelope = parseRequestResourceEnvelope(input.requestResourceEnvelope);
      const raw = await options.reader.read(options.serverCredential, { prospective: true, requestBytes, inputTokens });
      return validate(raw, requestResourceEnvelope);
    },
  };
}

function validate(raw: CapacityPlanningSnapshot, requestResourceEnvelope: RequestResourceEnvelope): IdserProspectiveCapacitySnapshot {
  const snapshot = object(raw, "snapshot");
  if (snapshot.apiVersion !== "CapacityPlanningSnapshot/v1" || snapshot.status !== "inactive" || snapshot.reason !== "prospective_planning_only"
    || snapshot.view !== "prospective-planning-only" || snapshot.readIsNotAdmissionPermit !== true || snapshot.plan !== null) {
    fail("it is not the exact prospective-planning-only inactive view");
  }

  const source = object(snapshot.source, "source");
  const enforcement = object(snapshot.enforcement, "enforcement");
  const process = object(snapshot.process, "process");
  const workload = object(snapshot.workload, "workload");
  const limits = object(source.limits, "source limits");
  const dimensions = object(enforcement.dimensions, "enforcement dimensions");
  exactKeys(limits, requiredDimensions, "source limits");
  exactKeys(dimensions, requiredDimensions, "enforcement");

  const quotaDomainId = nonEmpty(source.quotaDomainId, "source quotaDomainId");
  const profileVersion = nonEmpty(source.providerCapacityProfileVersion, "source providerCapacityProfileVersion");
  nonEmpty(source.capacitySource, "source capacitySource");
  nonEmpty(source.sourceRef, "source sourceRef");
  nonEmpty(source.sourceVersion, "source sourceVersion");
  if (enforcement.apiVersion !== "EffectiveEnforcementPolicy/v1" || enforcement.quotaDomainId !== quotaDomainId
    || enforcement.providerCapacityProfileVersion !== profileVersion) fail("enforcement provenance is foreign or unpinned");
  nonEmpty(enforcement.routeId, "enforcement routeId");
  nonEmpty(enforcement.policyId, "enforcement policyId");
  nonEmpty(enforcement.policyVersion, "enforcement policyVersion");
  const enforcementProvenance = object(enforcement.providerProfileProvenance, "enforcement providerProfileProvenance");
  if (enforcementProvenance.capacitySource !== source.capacitySource || enforcementProvenance.sourceRef !== source.sourceRef
    || enforcementProvenance.sourceVersion !== source.sourceVersion) fail("enforcement source provenance does not match");

  for (const dimension of ["rpm", "tpm", "concurrency"] as const) {
    const limit = object(limits[dimension], `source ${dimension}`);
    const policy = object(dimensions[dimension], `enforcement ${dimension}`);
    if (limit.state !== "known" || policy.mode !== "enforced" || policy.providerState !== "known" || policy.limitSource !== "provider") fail(`${dimension} is not an enforced known provider dimension`);
    positive(limit.value, `source ${dimension} limit`);
    if (policy.limit !== limit.value) fail(`${dimension} enforcement limit does not match source`);
  }
  const rpdLimit = object(limits.rpd, "source rpd");
  const rpdPolicy = object(dimensions.rpd, "enforcement rpd");
  const knownRpd = rpdLimit.state === "known" && rpdPolicy.mode === "enforced" && rpdPolicy.providerState === "known" && rpdPolicy.limitSource === "provider";
  const authorizedUnknownRpd = rpdLimit.state === "unknown" && rpdPolicy.mode === "not_enforced" && rpdPolicy.providerState === "unknown";
  if (!knownRpd && !authorizedUnknownRpd) fail("rpd is neither enforced known capacity nor authorized unknown/not-enforced capacity");
  if (knownRpd && rpdPolicy.limit !== positive(rpdLimit.value, "source rpd limit")) fail("rpd enforcement limit does not match source");
  if (authorizedUnknownRpd) nonEmpty(rpdPolicy.approvalRef, "not-enforced rpd approvalRef");

  nonEmpty(process.id, "process id");
  nonEmpty(process.profileVersion, "process profileVersion");
  if (process.serviceClass !== "background" || typeof process.active !== "boolean") fail("process identity is not the server-authorized background process");
  nonEmpty(workload.id, "workload id");
  nonEmpty(workload.profileVersion, "workload profileVersion");
  if (typeof workload.active !== "boolean") fail("workload active state is missing");
  const structuralBound = object(workload.structuralBound, "workload structuralBound");
  nonEmpty(structuralBound.identity, "structuralBound identity");
  nonEmpty(structuralBound.version, "structuralBound version");
  positive(structuralBound.maxRequestBytes, "structuralBound maxRequestBytes");
  positive(structuralBound.maxInputTokens, "structuralBound maxInputTokens");
  const estimator = object(workload.estimator, "workload estimator");
  nonEmpty(estimator.identity, "estimator identity");
  nonEmpty(estimator.version, "estimator version");
  const outputReservation = object(workload.outputReservation, "workload outputReservation");
  nonEmpty(outputReservation.policyId, "outputReservation policyId");
  nonEmpty(outputReservation.policyVersion, "outputReservation policyVersion");
  positive(outputReservation.maxOutputTokens, "outputReservation maxOutputTokens");
  const safetyPolicy = object(workload.safetyPolicy, "workload safetyPolicy");
  nonEmpty(safetyPolicy.policyId, "safetyPolicy policyId");
  nonEmpty(safetyPolicy.policyVersion, "safetyPolicy policyVersion");

  return deepFreeze({
    apiVersion: "CapacityPlanningSnapshot/v1",
    status: "inactive",
    reason: "prospective_planning_only",
    view: "prospective-planning-only",
    readIsNotAdmissionPermit: true,
    plan: null,
    source: structuredClone(source),
    enforcement: structuredClone(enforcement),
    process: structuredClone(process),
    workload: structuredClone(workload),
    eligibleDimensions,
    requestResourceEnvelope: structuredClone(requestResourceEnvelope),
  });
}
