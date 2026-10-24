import { parseRequestResourceEnvelope, type RequestResourceEnvelope } from "./process-workload-catalogue.js";
import type { CapacityPlanningSnapshot, CapacityPlanningSnapshotRead } from "./capacity-planning-snapshot.js";

type JsonRecord = Record<string, unknown>;
type BssEligibleDimension = "rpm" | "tpm" | "rpd" | "concurrency";

export class IdserCapacityPlanningSnapshotV2Error extends Error {
  constructor(message: string, readonly disposition: "structurally_unfit" | "blocked" = "blocked") {
    super(`IDSER CapacityPlanningSnapshot/v2 rejected: ${message}`);
  }
}

export type IdserCapacityPlanningSnapshotV2Read = Readonly<{
  requestBytes: number;
  inputTokens: number;
  reservedOutputTokens: number;
  requestResourceEnvelope: RequestResourceEnvelope;
}>;

/**
 * A deliberately small, server-owned identity pin.  IDSER never selects a
 * BSS route/model; composition pins the identity that its credential is
 * allowed to read and the response must repeat it exactly.
 */
export type IdserCapacityPlanningSnapshotV2ExpectedIdentity = Readonly<{
  quotaDomainId: string;
  processId: string;
  processProfileVersion: string;
  routeId: string;
  serviceClass: "background" | "interactive";
}>;

/**
 * The normalized v2 snapshot deliberately retains the existing structural
 * planner shape while carrying all v2 authority evidence.  It contains no
 * payload bytes and exposes no admission, reservation, or persistence API.
 */
export type IdserCapacityPlanningSnapshotV2 = Readonly<{
  apiVersion: "CapacityPlanningSnapshot/v2";
  status: "qualified";
  readIsNotAdmissionPermit: true;
  identity: JsonRecord;
  revisions: JsonRecord;
  allocation: JsonRecord;
  sizing: JsonRecord;
  policyProvenance: JsonRecord;
  canonicalFingerprint: string;
  qualification: JsonRecord;
  source: JsonRecord;
  enforcement: JsonRecord;
  process: JsonRecord;
  workload: JsonRecord;
  eligibleDimensions: readonly BssEligibleDimension[];
  requestResourceEnvelope: RequestResourceEnvelope;
}>;

type CapacityPlanningSnapshotReader = Readonly<{
  read(credential: string, request?: CapacityPlanningSnapshotRead): Promise<CapacityPlanningSnapshot>;
}>;

const requiredDimensions = ["rpm", "tpm", "concurrency"] as const;
const knownDimensions = ["rpm", "tpm", "rpd", "concurrency"] as const;
const md5 = /^[a-f0-9]{32}$/;

function fail(message: string): never { throw new IdserCapacityPlanningSnapshotV2Error(message); }
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
  if (Object.keys(value).length !== keys.length || keys.some((key) => !(key in value))) fail(`${name} has an unsupported shape`);
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
function sameIdentity(identity: JsonRecord, expected: IdserCapacityPlanningSnapshotV2ExpectedIdentity): void {
  for (const [key, value] of Object.entries(expected)) if (identity[key] !== value) fail(`authenticated identity ${key} does not match the server-owned composition pin`);
}
function policyProvenance(value: unknown): JsonRecord {
  const policy = object(value, "policy provenance");
  const dimensions = object(policy.dimensions, "policy provenance dimensions");
  for (const dimension of requiredDimensions) {
    const entry = object(dimensions[dimension], `policy ${dimension}`);
    if (entry.mode !== "enforced" || entry.providerState !== "known" || entry.limitSource !== "provider") fail(`${dimension} is not an enforced known provider dimension`);
    positive(entry.limit, `policy ${dimension} limit`);
  }
  const rpd = object(dimensions.rpd, "policy rpd");
  const authorizedUnknown = rpd.mode === "not_enforced" && rpd.providerState === "unknown";
  const known = rpd.mode === "enforced" && rpd.providerState === "known" && rpd.limitSource === "provider";
  if (!authorizedUnknown && !known) fail("rpd is neither enforced known capacity nor approved unknown/not-enforced provenance");
  if (known) positive(rpd.limit, "policy rpd limit");
  if (authorizedUnknown) {
    if (typeof rpd.limit === "number") fail("unknown/not-enforced rpd must not contain a numeric limit");
    nonEmpty(rpd.approvalRef, "unknown/not-enforced rpd approvalRef");
  }
  return policy;
}

/**
 * The sole initial IDSER capacity consumer.  It reuses the BSS authenticated
 * reader, reads only v2, and passes IDSER's reserved output to BSS as part of
 * one complete request.  This is planning-only: it cannot enlarge a batch via
 * borrowing or make an admission decision.
 */
export function createIdserCapacityPlanningSnapshotV2Consumer(options: Readonly<{
  reader: CapacityPlanningSnapshotReader;
  serverCredential: string;
  expectedIdentity: IdserCapacityPlanningSnapshotV2ExpectedIdentity;
}>): Readonly<{ read(input: IdserCapacityPlanningSnapshotV2Read): Promise<IdserCapacityPlanningSnapshotV2> }> {
  if (typeof options.serverCredential !== "string" || options.serverCredential.length === 0) throw new IdserCapacityPlanningSnapshotV2Error("a server-owned credential is required");
  for (const [key, value] of Object.entries(options.expectedIdentity)) if (typeof value !== "string" || value.length === 0) throw new IdserCapacityPlanningSnapshotV2Error(`expected identity ${key} is invalid`);
  return {
    async read(input) {
      const requestBytes = nonNegative(input.requestBytes, "requestBytes");
      const inputTokens = nonNegative(input.inputTokens, "inputTokens");
      const reservedOutputTokens = nonNegative(input.reservedOutputTokens, "reservedOutputTokens");
      const requestResourceEnvelope = parseRequestResourceEnvelope(input.requestResourceEnvelope);
      const raw = await options.reader.read(options.serverCredential, { requestBytes, inputTokens, outputTokens: reservedOutputTokens });
      return validate(raw, { requestBytes, inputTokens, reservedOutputTokens, requestResourceEnvelope }, options.expectedIdentity);
    },
  };
}

function validate(raw: CapacityPlanningSnapshot, request: IdserCapacityPlanningSnapshotV2Read, expectedIdentity: IdserCapacityPlanningSnapshotV2ExpectedIdentity): IdserCapacityPlanningSnapshotV2 {
  const snapshot = object(raw, "snapshot");
  if (snapshot.status === "unfit") throw new IdserCapacityPlanningSnapshotV2Error("BSS rejected the complete structural candidate as unfit", "structurally_unfit");
  if (snapshot.apiVersion !== "CapacityPlanningSnapshot/v2" || snapshot.status !== "qualified" || snapshot.readIsNotAdmissionPermit !== true) fail("it is not an authenticated qualified CapacityPlanningSnapshot/v2 read");

  const identity = object(snapshot.identity, "identity");
  sameIdentity(identity, expectedIdentity);
  for (const key of ["processKind", "capability", "providerId", "modelOrProcessorId", "adapterVersion", "qualificationRef", "qualificationVersion"] as const) nonEmpty(identity[key], `identity ${key}`);
  positive(identity.authorityVersion, "identity authorityVersion");
  const revisions = object(snapshot.revisions, "revisions");
  for (const key of ["providerCapacityProfileVersion", "policyId", "policyVersion", "desiredProfileVersion", "processProfileVersion", "workloadProfileVersion"] as const) nonEmpty(revisions[key], `revision ${key}`);
  positive(revisions.candidateActivationRevision, "revision candidateActivationRevision");
  if (revisions.processProfileVersion !== identity.processProfileVersion) fail("process profile revision does not match authenticated identity");

  const allocation = object(snapshot.allocation, "allocation");
  for (const key of ["allocationVersion", "allocationFingerprint"] as const) nonEmpty(allocation[key], `allocation ${key}`);
  const effectiveMask = allocation.effectiveMask;
  if (!Array.isArray(effectiveMask) || effectiveMask.length === 0 || effectiveMask.some((dimension) => typeof dimension !== "string" || !knownDimensions.includes(dimension as BssEligibleDimension)) || new Set(effectiveMask).size !== effectiveMask.length) fail("allocation effective mask is malformed");
  const baseline = object(allocation.baseline, "allocation baseline");
  for (const dimension of requiredDimensions) {
    if (!effectiveMask.includes(dimension) || positive(baseline[dimension], `allocation baseline ${dimension}`) < 1) fail(`allocation baseline ${dimension} is unavailable`);
  }
  const normalizedWeight = object(allocation.normalizedWeight, "allocation normalizedWeight");
  positive(normalizedWeight.numerator, "allocation normalizedWeight numerator");
  positive(normalizedWeight.denominator, "allocation normalizedWeight denominator");
  object(allocation.cap, "allocation cap");

  const sizing = object(snapshot.sizing, "sizing");
  exactKeys(sizing, ["maxEligibleCompleteRequestTokens", "maxEligibleInputTokens", "maxRequestBytes", "maxContextTokens", "maxOutputTokens", "structuralBound", "outputReservation", "estimator", "safetyPolicy"], "sizing");
  const maxEligibleCompleteRequestTokens = positive(sizing.maxEligibleCompleteRequestTokens, "sizing maxEligibleCompleteRequestTokens");
  const maxEligibleInputTokens = positive(sizing.maxEligibleInputTokens, "sizing maxEligibleInputTokens");
  const maxRequestBytes = positive(sizing.maxRequestBytes, "sizing maxRequestBytes");
  const maxContextTokens = positive(sizing.maxContextTokens, "sizing maxContextTokens");
  const maxOutputTokens = positive(sizing.maxOutputTokens, "sizing maxOutputTokens");
  const structuralBound = object(sizing.structuralBound, "sizing structuralBound");
  for (const key of ["identity", "version"] as const) nonEmpty(structuralBound[key], `structural bound ${key}`);
  const maxPromptBytes = positive(structuralBound.maxPromptBytes, "structural bound maxPromptBytes");
  if (positive(structuralBound.maxRequestBytes, "structural bound maxRequestBytes") !== maxRequestBytes
    || positive(structuralBound.maxInputTokens, "structural bound maxInputTokens") !== maxEligibleInputTokens
    || positive(structuralBound.maxContextTokens, "structural bound maxContextTokens") !== maxContextTokens) fail("sizing values do not match the qualified structural bound");
  const outputReservation = object(sizing.outputReservation, "sizing outputReservation");
  if (positive(outputReservation.maxOutputTokens, "output reservation maxOutputTokens") !== maxOutputTokens) fail("output reservation does not match the qualified output bound");
  for (const key of ["policyId", "policyVersion"] as const) nonEmpty(outputReservation[key], `output reservation ${key}`);
  const estimator = object(sizing.estimator, "sizing estimator");
  if (nonEmpty(estimator.identity, "estimator identity") !== nonEmpty(object(revisions.estimator, "revision estimator").identity, "revision estimator identity")
    || nonEmpty(estimator.version, "estimator version") !== nonEmpty(object(revisions.estimator, "revision estimator").version, "revision estimator version")) fail("estimator revision does not match sizing estimator");
  const safetyPolicy = object(sizing.safetyPolicy, "sizing safetyPolicy");
  if (nonEmpty(safetyPolicy.policyId, "safety policy id") !== nonEmpty(object(revisions.safetyPolicy, "revision safetyPolicy").policyId, "revision safety policy id")
    || nonEmpty(safetyPolicy.policyVersion, "safety policy version") !== nonEmpty(object(revisions.safetyPolicy, "revision safetyPolicy").policyVersion, "revision safety policy version")) fail("safety policy revision does not match sizing policy");
  if (maxEligibleCompleteRequestTokens !== Math.min(positive(baseline.tpm, "allocation baseline tpm"), maxContextTokens)) fail("complete-request ceiling is not the qualified TPM/context minimum");
  if (request.requestBytes > maxRequestBytes || request.requestBytes > maxPromptBytes || request.inputTokens > maxEligibleInputTokens
    || request.reservedOutputTokens > maxOutputTokens || request.inputTokens + request.reservedOutputTokens > maxContextTokens
    || request.inputTokens + request.reservedOutputTokens > maxEligibleCompleteRequestTokens) throw new IdserCapacityPlanningSnapshotV2Error("complete request exceeds a qualified structural bound", "structurally_unfit");

  const policy = policyProvenance(snapshot.policyProvenance);
  if (policy.policyId !== revisions.policyId || policy.policyVersion !== revisions.policyVersion || policy.routeId !== identity.routeId) fail("policy provenance does not match the authenticated identity and revisions");
  const canonicalFingerprint = nonEmpty(snapshot.canonicalFingerprint, "canonicalFingerprint");
  if (!md5.test(canonicalFingerprint)) fail("canonicalFingerprint is malformed");
  const qualification = object(snapshot.qualification, "qualification");
  if (positive(qualification.candidateActivationRevision, "qualification candidateActivationRevision") !== revisions.candidateActivationRevision
    || typeof qualification.productionActive !== "boolean"
    || qualification.isolated !== !qualification.productionActive
    || (qualification.productionActive === true && positive(qualification.activationRevision, "qualification activationRevision") < 1)
    || (qualification.productionActive === false && "activationRevision" in qualification)) fail("qualification provenance is malformed");
  const borrowing = object(snapshot.borrowing, "borrowing");
  if (borrowing.runtimeOnly !== true || typeof borrowing.mayBorrowIdleCapacity !== "boolean" || typeof borrowing.sameBackgroundClass !== "boolean") fail("borrowing metadata is malformed");

  const source = object(policy.providerProfileProvenance, "policy providerProfileProvenance");
  for (const key of ["capacitySource", "sourceRef", "sourceVersion"] as const) nonEmpty(source[key], `policy provider provenance ${key}`);
  const process = { id: identity.processId, profileVersion: identity.processProfileVersion, serviceClass: identity.serviceClass, active: true };
  const workload = { id: identity.capability, profileVersion: revisions.workloadProfileVersion, active: true, structuralBound, estimator, outputReservation, safetyPolicy };
  return deepFreeze({
    apiVersion: "CapacityPlanningSnapshot/v2", status: "qualified", readIsNotAdmissionPermit: true,
    identity: structuredClone(identity), revisions: structuredClone(revisions), allocation: structuredClone(allocation), sizing: structuredClone(sizing), policyProvenance: structuredClone(policy), canonicalFingerprint, qualification: structuredClone(qualification),
    source: structuredClone({ quotaDomainId: identity.quotaDomainId, providerCapacityProfileVersion: revisions.providerCapacityProfileVersion, ...source }), enforcement: structuredClone(policy), process, workload,
    eligibleDimensions: effectiveMask as BssEligibleDimension[], requestResourceEnvelope: structuredClone(request.requestResourceEnvelope),
  });
}
