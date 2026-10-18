import type { CapacityDimension, ProviderCapacityProfile } from "./capacity-catalogue.js";
import type { ProviderProcessProfile, WorkloadEnvelopeProfile } from "./process-workload-catalogue.js";

type ResourceVector = Readonly<Record<CapacityDimension, number>>;
type EligibleResourceVector = Readonly<Partial<Record<CapacityDimension, number>>>;

export type EffectiveEnforcementPolicy = Readonly<{
  apiVersion: "EffectiveEnforcementPolicy/v1";
  quotaDomainId: string;
  providerCapacityProfileVersion: string;
  routeId: string;
  policyId: string;
  policyVersion: string;
  effectiveFrom: string;
  dimensions: Readonly<Record<CapacityDimension, Readonly<{
    mode: "enforced" | "not_enforced";
    providerState: "known" | "unknown";
    limit?: number;
    approvalRef?: string;
  }>>>;
}>;

export type PlannerPolicy = Readonly<{
  plannerVersion: string;
  effectiveFrom: string;
  headroomPolicy: Readonly<{ policyId: string; policyVersion: string; reserve: ResourceVector }>;
  interactiveReserveTargets: ReadonlyArray<Readonly<{
    processId: string;
    profileVersion: string;
    serviceTargetId: string;
    reserve: ResourceVector;
  }>>;
  backgroundCaps?: ReadonlyArray<Readonly<{
    processId: string;
    profileVersion: string;
    cap: ResourceVector;
  }>>;
}>;

export type DesiredAdmissionProfile = Readonly<{
  quotaDomainId: string;
  providerCapacityProfileVersion: string;
  plannerVersion: string;
  effectiveFrom: string;
  /** Only policy-enforced dimensions are materialized as numeric bounds. */
  eligibleDimensions: readonly CapacityDimension[];
  effectiveEnforcementPolicy: EffectiveEnforcementPolicy;
  usableGlobalCapacity: EligibleResourceVector;
  hardInteractiveReserve: EligibleResourceVector;
  backgroundCapacity: EligibleResourceVector;
  backgroundLanes: ReadonlyArray<Readonly<{
    processId: string;
    profileVersion: string;
    workloadProfile: Readonly<{ workloadId: string; profileVersion: string }>;
    normalizedWeight: number;
    mayBorrowIdleCapacity: boolean;
    capPolicyId: string;
    cap?: EligibleResourceVector;
    planningCost: EligibleResourceVector;
    dominantResourceCost: number;
  }>>;
}>;

export class CapacityPlannerError extends Error {}

const dimensions: readonly CapacityDimension[] = ["rpm", "tpm", "rpd", "concurrency"];
const nonEmpty = (value: string): boolean => value.trim().length > 0;
const finiteNonNegative = (value: number): boolean => Number.isFinite(value) && value >= 0;
const key = (value: { processId: string; profileVersion: string }): string => `${value.processId}:${value.profileVersion}`;
const compareProcess = (a: { processId: string; profileVersion: string }, b: { processId: string; profileVersion: string }): number => key(a).localeCompare(key(b));

function assertVector(vector: ResourceVector, name: string): void {
  for (const dimension of dimensions) if (!finiteNonNegative(vector[dimension])) throw new CapacityPlannerError(`${name} ${dimension} must be a finite non-negative number.`);
}

function subtract(left: EligibleResourceVector, right: EligibleResourceVector, eligible: readonly CapacityDimension[], name: string): EligibleResourceVector {
  const result: Partial<Record<CapacityDimension, number>> = {};
  for (const dimension of eligible) {
    if (left[dimension] === undefined || right[dimension] === undefined) throw new CapacityPlannerError(`${name} lacks eligible ${dimension}.`);
    result[dimension] = left[dimension] - right[dimension];
    if (result[dimension] < 0) throw new CapacityPlannerError(`${name} oversubscribes ${dimension}.`);
  }
  return result;
}

function add(left: EligibleResourceVector, right: EligibleResourceVector, eligible: readonly CapacityDimension[]): EligibleResourceVector {
  const result: Partial<Record<CapacityDimension, number>> = {};
  for (const dimension of eligible) {
    if (left[dimension] === undefined || right[dimension] === undefined) throw new CapacityPlannerError(`eligible resource vector lacks ${dimension}.`);
    result[dimension] = left[dimension]! + right[dimension]!;
  }
  return result;
}

function effectivePolicyForKnownCapacity(profile: ProviderCapacityProfile): EffectiveEnforcementPolicy {
  const dimensionsPolicy = {} as Record<CapacityDimension, { mode: "enforced"; providerState: "known"; limit: number }>;
  for (const dimension of dimensions) {
    const limit = profile.limits[dimension];
    if (limit.state !== "known") throw new CapacityPlannerError(`capacity profile ${profile.quotaDomainId} has ${limit.state} ${dimension}; planner fails closed.`);
    dimensionsPolicy[dimension] = { mode: "enforced", providerState: "known", limit: limit.value };
  }
  return {
    apiVersion: "EffectiveEnforcementPolicy/v1", quotaDomainId: profile.quotaDomainId,
    providerCapacityProfileVersion: profile.profileVersion, routeId: "four-known-dimension-compatibility",
    policyId: "four-known-dimension-compatibility", policyVersion: "v1", effectiveFrom: profile.effectiveFrom,
    dimensions: dimensionsPolicy,
  };
}

function eligibleCapacity(profile: ProviderCapacityProfile, policy: EffectiveEnforcementPolicy): { dimensions: CapacityDimension[]; capacity: EligibleResourceVector } {
  if (policy.apiVersion !== "EffectiveEnforcementPolicy/v1" || policy.quotaDomainId !== profile.quotaDomainId || policy.providerCapacityProfileVersion !== profile.profileVersion || !nonEmpty(policy.routeId) || !nonEmpty(policy.policyId) || !nonEmpty(policy.policyVersion)) throw new CapacityPlannerError("effective enforcement policy is not bound to this capacity profile.");
  const eligible: CapacityDimension[] = [];
  const capacity: Partial<Record<CapacityDimension, number>> = {};
  for (const dimension of dimensions) {
    const providerLimit = profile.limits[dimension];
    const decision = policy.dimensions[dimension];
    if (!decision) throw new CapacityPlannerError(`effective enforcement policy lacks ${dimension}.`);
    if (decision.mode === "enforced") {
      if (providerLimit.state !== "known" || decision.providerState !== "known" || decision.limit !== providerLimit.value) throw new CapacityPlannerError(`enforced ${dimension} is not an exact known provider bound.`);
      eligible.push(dimension); capacity[dimension] = providerLimit.value;
    } else {
      if (providerLimit.state !== "unknown" || decision.providerState !== "unknown" || typeof decision.approvalRef !== "string" || !nonEmpty(decision.approvalRef) || decision.limit !== undefined) throw new CapacityPlannerError(`not-enforced ${dimension} is not an authorized unknown exclusion.`);
    }
  }
  if (eligible.length === 0) throw new CapacityPlannerError("effective enforcement policy has no usable dimensions.");
  return { dimensions: eligible, capacity };
}

function eligibleVector(vector: ResourceVector, eligible: readonly CapacityDimension[], name: string): EligibleResourceVector {
  assertVector(vector, name);
  for (const dimension of dimensions) if (!eligible.includes(dimension) && vector[dimension] !== 0) throw new CapacityPlannerError(`${name} must not fabricate a ${dimension} bound outside the effective policy.`);
  const result: Partial<Record<CapacityDimension, number>> = {};
  for (const dimension of eligible) result[dimension] = vector[dimension];
  return result;
}

/**
 * Purely derives policy ceilings. It intentionally has no runtime counters,
 * clocks, provider clients, persistence, or worker allocation authority.
 */
export function planDesiredAdmissionProfile(
  capacityProfile: ProviderCapacityProfile,
  processes: readonly ProviderProcessProfile[],
  workloads: readonly WorkloadEnvelopeProfile[],
  policy: PlannerPolicy,
): DesiredAdmissionProfile {
  return planEffectiveDesiredAdmissionProfile(capacityProfile, processes, workloads, policy, effectivePolicyForKnownCapacity(capacityProfile));
}

/**
 * Derives a plan solely from a server-derived effective policy. Unknown
 * excluded dimensions remain provenance metadata, never numeric capacity.
 */
export function planEffectiveDesiredAdmissionProfile(
  capacityProfile: ProviderCapacityProfile,
  processes: readonly ProviderProcessProfile[],
  workloads: readonly WorkloadEnvelopeProfile[],
  policy: PlannerPolicy,
  effectiveEnforcementPolicy: EffectiveEnforcementPolicy,
): DesiredAdmissionProfile {
  if (!nonEmpty(policy.plannerVersion) || !nonEmpty(policy.effectiveFrom) || !nonEmpty(policy.headroomPolicy.policyId) || !nonEmpty(policy.headroomPolicy.policyVersion)) throw new CapacityPlannerError("planner policy requires explicit versioned identity and effective metadata.");
  const { dimensions: eligibleDimensions, capacity } = eligibleCapacity(capacityProfile, effectiveEnforcementPolicy);
  const headroom = eligibleVector(policy.headroomPolicy.reserve, eligibleDimensions, "headroom reserve");
  const usableGlobalCapacity = subtract(capacity, headroom, eligibleDimensions, "headroom");
  const active = processes.filter((process) => process.active).slice().sort(compareProcess);
  const workloadByKey = new Map(workloads.map((workload) => [`${workload.workloadId}:${workload.profileVersion}`, workload]));
  for (const process of active) if (!workloadByKey.get(`${process.workloadProfile.workloadId}:${process.workloadProfile.profileVersion}`)?.active) throw new CapacityPlannerError(`active process ${key(process)} has no active workload.`);

  const interactive = new Map(active.filter((process) => process.serviceClass === "interactive").map((process) => [key(process), process]));
  const targetKeys = new Set<string>();
  let hardInteractiveReserve: EligibleResourceVector = Object.fromEntries(eligibleDimensions.map((dimension) => [dimension, 0]));
  for (const target of policy.interactiveReserveTargets.slice().sort(compareProcess)) {
    const targetKey = key(target);
    if (!interactive.has(targetKey) || targetKeys.has(targetKey) || !nonEmpty(target.serviceTargetId)) throw new CapacityPlannerError(`interactive reserve target ${targetKey} is invalid or duplicated.`);
    const reserve = eligibleVector(target.reserve, eligibleDimensions, `interactive reserve target ${targetKey}`);
    targetKeys.add(targetKey);
    hardInteractiveReserve = add(hardInteractiveReserve, reserve, eligibleDimensions);
  }
  if (interactive.size !== targetKeys.size) throw new CapacityPlannerError("every active interactive process requires an explicit hard reserve target.");
  const backgroundCapacity = subtract(usableGlobalCapacity, hardInteractiveReserve, eligibleDimensions, "hard interactive reserve");

  const caps = new Map<string, EligibleResourceVector>();
  for (const entry of policy.backgroundCaps ?? []) {
    const entryKey = key(entry);
    if (caps.has(entryKey)) throw new CapacityPlannerError(`duplicate background cap ${entryKey}.`);
    const cap = eligibleVector(entry.cap, eligibleDimensions, `background cap ${entryKey}`);
    subtract(backgroundCapacity, cap, eligibleDimensions, `background cap ${entryKey}`);
    caps.set(entryKey, cap);
  }
  const background = active.filter((process) => process.serviceClass === "background");
  if (background.length > 0) for (const dimension of eligibleDimensions) if (backgroundCapacity[dimension]! <= 0) throw new CapacityPlannerError(`background capacity has no usable ${dimension} for active background processes.`);
  for (const capKey of caps.keys()) if (!background.some((process) => key(process) === capKey)) throw new CapacityPlannerError(`background cap ${capKey} does not reference an active background process.`);
  const totalWeight = background.reduce((sum, process) => sum + (process.allocationPolicy.background?.weight ?? 0), 0);
  if (background.length > 0 && totalWeight <= 0) throw new CapacityPlannerError("background processes require positive configured weights.");
  const backgroundLanes = background.map((process) => {
    const allocation = process.allocationPolicy.background;
    if (!allocation) throw new CapacityPlannerError(`background process ${key(process)} lacks background policy.`);
    const workload = workloadByKey.get(`${process.workloadProfile.workloadId}:${process.workloadProfile.profileVersion}`);
    if (!workload) throw new CapacityPlannerError(`background process ${key(process)} has an unknown workload.`);
    const fullPlanningCost: ResourceVector = { rpm: 1, tpm: workload.structuralBound.maxInputTokens + workload.outputReservation.maxOutputTokens, rpd: 1, concurrency: 1 };
    // Cost is an internal planning measure, not a provider bound.  Restrict
    // it to eligible dimensions without assigning a value to an exclusion.
    const planningCost: EligibleResourceVector = Object.fromEntries(eligibleDimensions.map((dimension) => [dimension, fullPlanningCost[dimension]]));
    const dominantResourceCost = Math.max(...eligibleDimensions.map((dimension) => planningCost[dimension]! / backgroundCapacity[dimension]!));
    return {
      processId: process.processId,
      profileVersion: process.profileVersion,
      workloadProfile: { workloadId: workload.workloadId, profileVersion: workload.profileVersion },
      normalizedWeight: allocation.weight / totalWeight,
      mayBorrowIdleCapacity: allocation.mayBorrowIdleCapacity,
      capPolicyId: allocation.capPolicyId,
      ...(caps.has(key(process)) ? { cap: caps.get(key(process))! } : {}),
      planningCost,
      dominantResourceCost,
    };
  });
  // Map predecessor naming onto the four provider dimensions at the boundary.
  return {
    quotaDomainId: capacityProfile.quotaDomainId,
    providerCapacityProfileVersion: capacityProfile.profileVersion,
    plannerVersion: policy.plannerVersion,
    effectiveFrom: policy.effectiveFrom,
    eligibleDimensions,
    effectiveEnforcementPolicy,
    usableGlobalCapacity,
    hardInteractiveReserve,
    backgroundCapacity,
    backgroundLanes,
  };
}
