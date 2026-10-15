import type { CapacityDimension, ProviderCapacityProfile } from "./capacity-catalogue.js";
import type { ProviderProcessProfile, WorkloadEnvelopeProfile } from "./process-workload-catalogue.js";

type ResourceVector = Readonly<Record<CapacityDimension, number>>;

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
  usableGlobalCapacity: ResourceVector;
  hardInteractiveReserve: ResourceVector;
  backgroundCapacity: ResourceVector;
  backgroundLanes: ReadonlyArray<Readonly<{
    processId: string;
    profileVersion: string;
    workloadProfile: Readonly<{ workloadId: string; profileVersion: string }>;
    normalizedWeight: number;
    mayBorrowIdleCapacity: boolean;
    capPolicyId: string;
    cap?: ResourceVector;
    planningCost: ResourceVector;
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

function subtract(left: ResourceVector, right: ResourceVector, name: string): ResourceVector {
  const result = {} as Record<CapacityDimension, number>;
  for (const dimension of dimensions) {
    result[dimension] = left[dimension] - right[dimension];
    if (result[dimension] < 0) throw new CapacityPlannerError(`${name} oversubscribes ${dimension}.`);
  }
  return result;
}

function add(left: ResourceVector, right: ResourceVector): ResourceVector {
  const result = {} as Record<CapacityDimension, number>;
  for (const dimension of dimensions) result[dimension] = left[dimension] + right[dimension];
  return result;
}

function knownCapacity(profile: ProviderCapacityProfile): ResourceVector {
  const result = {} as Record<CapacityDimension, number>;
  for (const dimension of dimensions) {
    const limit = profile.limits[dimension];
    if (limit.state !== "known") throw new CapacityPlannerError(`capacity profile ${profile.quotaDomainId} has ${limit.state} ${dimension}; planner fails closed.`);
    result[dimension] = limit.value;
  }
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
  if (!nonEmpty(policy.plannerVersion) || !nonEmpty(policy.effectiveFrom) || !nonEmpty(policy.headroomPolicy.policyId) || !nonEmpty(policy.headroomPolicy.policyVersion)) throw new CapacityPlannerError("planner policy requires explicit versioned identity and effective metadata.");
  assertVector(policy.headroomPolicy.reserve, "headroom reserve");
  const capacity = knownCapacity(capacityProfile);
  const usableGlobalCapacity = subtract(capacity, policy.headroomPolicy.reserve, "headroom");
  const active = processes.filter((process) => process.active).slice().sort(compareProcess);
  const workloadByKey = new Map(workloads.map((workload) => [`${workload.workloadId}:${workload.profileVersion}`, workload]));
  for (const process of active) if (!workloadByKey.get(`${process.workloadProfile.workloadId}:${process.workloadProfile.profileVersion}`)?.active) throw new CapacityPlannerError(`active process ${key(process)} has no active workload.`);

  const interactive = new Map(active.filter((process) => process.serviceClass === "interactive").map((process) => [key(process), process]));
  const targetKeys = new Set<string>();
  let hardInteractiveReserve: ResourceVector = { rpm: 0, tpm: 0, rpd: 0, concurrency: 0 };
  for (const target of policy.interactiveReserveTargets.slice().sort(compareProcess)) {
    const targetKey = key(target);
    if (!interactive.has(targetKey) || targetKeys.has(targetKey) || !nonEmpty(target.serviceTargetId)) throw new CapacityPlannerError(`interactive reserve target ${targetKey} is invalid or duplicated.`);
    assertVector(target.reserve, `interactive reserve target ${targetKey}`);
    targetKeys.add(targetKey);
    hardInteractiveReserve = add(hardInteractiveReserve, target.reserve);
  }
  if (interactive.size !== targetKeys.size) throw new CapacityPlannerError("every active interactive process requires an explicit hard reserve target.");
  const backgroundCapacity = subtract(usableGlobalCapacity, hardInteractiveReserve, "hard interactive reserve");

  const caps = new Map<string, ResourceVector>();
  for (const entry of policy.backgroundCaps ?? []) {
    const entryKey = key(entry);
    if (caps.has(entryKey)) throw new CapacityPlannerError(`duplicate background cap ${entryKey}.`);
    assertVector(entry.cap, `background cap ${entryKey}`);
    subtract(backgroundCapacity, entry.cap, `background cap ${entryKey}`);
    caps.set(entryKey, entry.cap);
  }
  const background = active.filter((process) => process.serviceClass === "background");
  if (background.length > 0) for (const dimension of dimensions) if (backgroundCapacity[dimension] <= 0) throw new CapacityPlannerError(`background capacity has no usable ${dimension} for active background processes.`);
  for (const capKey of caps.keys()) if (!background.some((process) => key(process) === capKey)) throw new CapacityPlannerError(`background cap ${capKey} does not reference an active background process.`);
  const totalWeight = background.reduce((sum, process) => sum + (process.allocationPolicy.background?.weight ?? 0), 0);
  if (background.length > 0 && totalWeight <= 0) throw new CapacityPlannerError("background processes require positive configured weights.");
  const backgroundLanes = background.map((process) => {
    const allocation = process.allocationPolicy.background;
    if (!allocation) throw new CapacityPlannerError(`background process ${key(process)} lacks background policy.`);
    const workload = workloadByKey.get(`${process.workloadProfile.workloadId}:${process.workloadProfile.profileVersion}`);
    if (!workload) throw new CapacityPlannerError(`background process ${key(process)} has an unknown workload.`);
    const planningCost: ResourceVector = { rpm: 1, tpm: workload.structuralBound.maxInputTokens + workload.outputReservation.maxOutputTokens, rpd: 1, concurrency: 1 };
    const dominantResourceCost = Math.max(...dimensions.map((dimension) => planningCost[dimension] / backgroundCapacity[dimension]));
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
    usableGlobalCapacity,
    hardInteractiveReserve,
    backgroundCapacity,
    backgroundLanes,
  };
}
