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
  dimensions: Readonly<Record<CapacityDimension, Readonly<{ mode: "enforced" | "not_enforced"; providerState: "known" | "unknown"; limit?: number; approvalRef?: string }>>>;
}>;

export type ClassAllocationPolicy = Readonly<{
  apiVersion: "ClassAllocationPolicy/v1";
  policyId: string;
  policyVersion: string;
  effectiveFrom: string;
  headroomBps: 1000;
  interactiveBps: 2000;
  backgroundBps: 7000;
}>;

export type CalculatedClassProcessAllocation = Readonly<{
  apiVersion: "CalculatedClassProcessAllocation/v1";
  classAllocationPolicy: ClassAllocationPolicy;
  effectiveDimensions: readonly CapacityDimension[];
  classTotals: Readonly<{ headroom: EligibleResourceVector; interactive: EligibleResourceVector; background: EligibleResourceVector }>;
  processes: readonly Readonly<{
    processId: string;
    profileVersion: string;
    serviceClass: "interactive" | "background";
    normalizedWeight: Readonly<{ numerator: number; denominator: number }>;
    baseline: EligibleResourceVector;
    status: "qualified" | "unfit";
    unfitDimensions: readonly CapacityDimension[];
    cap?: EligibleResourceVector;
  }>[];
  /** Capacity intentionally left unused because a background hard cap cut a calculated baseline. */
  unallocatedRemainder: EligibleResourceVector;
}>;

export type PlannerPolicy = Readonly<{
  plannerVersion: string;
  effectiveFrom: string;
  headroomPolicy: Readonly<{ policyId: string; policyVersion: string; reserve: ResourceVector }>;
  interactiveReserveTargets: ReadonlyArray<Readonly<{ processId: string; profileVersion: string; serviceTargetId: string; reserve: ResourceVector }>>;
  backgroundCaps?: ReadonlyArray<Readonly<{ processId: string; profileVersion: string; cap: ResourceVector }>>;
  /** Opts a new desired-profile revision into the frozen weighted-allocation contract. */
  classAllocationPolicy?: ClassAllocationPolicy;
}>;

export type DesiredAdmissionProfile = Readonly<{
  quotaDomainId: string;
  providerCapacityProfileVersion: string;
  plannerVersion: string;
  effectiveFrom: string;
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
  /** Immutable successor data only; publication and runtime enforcement remain later-ticket work. */
  calculatedClassProcessAllocation?: CalculatedClassProcessAllocation;
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
    result[dimension] = left[dimension]! - right[dimension]!;
    if (result[dimension]! < 0) throw new CapacityPlannerError(`${name} oversubscribes ${dimension}.`);
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
  return { apiVersion: "EffectiveEnforcementPolicy/v1", quotaDomainId: profile.quotaDomainId, providerCapacityProfileVersion: profile.profileVersion, routeId: "four-known-dimension-compatibility", policyId: "four-known-dimension-compatibility", policyVersion: "v1", effectiveFrom: profile.effectiveFrom, dimensions: dimensionsPolicy };
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
    } else if (providerLimit.state !== "unknown" || decision.providerState !== "unknown" || typeof decision.approvalRef !== "string" || !nonEmpty(decision.approvalRef) || decision.limit !== undefined) {
      throw new CapacityPlannerError(`not-enforced ${dimension} is not an authorized unknown exclusion.`);
    }
  }
  if (eligible.length === 0) throw new CapacityPlannerError("effective enforcement policy has no usable dimensions.");
  return { dimensions: eligible, capacity };
}

function eligibleVector(vector: ResourceVector, eligible: readonly CapacityDimension[], name: string): EligibleResourceVector {
  assertVector(vector, name);
  for (const dimension of dimensions) if (!eligible.includes(dimension) && vector[dimension] !== 0) throw new CapacityPlannerError(`${name} must not fabricate a ${dimension} bound outside the effective policy.`);
  return Object.fromEntries(eligible.map((dimension) => [dimension, vector[dimension]]));
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function ceilingBasisPoints(capacity: number, basisPoints: number): number {
  const whole = Math.floor(capacity / 10_000);
  return whole * basisPoints + Math.ceil(((capacity % 10_000) * basisPoints) / 10_000);
}

function assertClassAllocationPolicy(value: ClassAllocationPolicy): ClassAllocationPolicy {
  if (value.apiVersion !== "ClassAllocationPolicy/v1" || !nonEmpty(value.policyId) || !nonEmpty(value.policyVersion) || !nonEmpty(value.effectiveFrom) || value.headroomBps !== 1000 || value.interactiveBps !== 2000 || value.backgroundBps !== 7000) throw new CapacityPlannerError("class allocation policy must be the versioned 1000/2000/7000 contract.");
  return { apiVersion: "ClassAllocationPolicy/v1", policyId: value.policyId, policyVersion: value.policyVersion, effectiveFrom: value.effectiveFrom, headroomBps: 1000, interactiveBps: 2000, backgroundBps: 7000 };
}

function allocationWeight(process: ProviderProcessProfile): number {
  const weight = process.serviceClass === "background" ? process.allocationPolicy.background?.weight : process.allocationPolicy.interactive?.weight;
  if (typeof weight !== "number" || !Number.isSafeInteger(weight) || weight <= 0) throw new CapacityPlannerError(`${process.serviceClass} process ${key(process)} requires a positive safe-integer registered allocation weight.`);
  return weight;
}

function vectorFor(eligible: readonly CapacityDimension[], value: (dimension: CapacityDimension) => number): EligibleResourceVector {
  return Object.fromEntries(eligible.map((dimension) => [dimension, value(dimension)]));
}

function allocateDimension(total: number, members: readonly { process: ProviderProcessProfile; weight: number }[]): Map<string, number> {
  const denominator = members.reduce((sum, member) => sum + member.weight, 0);
  if (!Number.isSafeInteger(denominator) || denominator <= 0) throw new CapacityPlannerError("class allocation requires positive safe-integer weights.");
  const totalUnits = BigInt(total);
  const totalWeight = BigInt(denominator);
  const shares = members.map((member) => {
    const numerator = totalUnits * BigInt(member.weight);
    return { member, allocation: Number(numerator / totalWeight), remainder: numerator % totalWeight };
  }).sort((left, right) => right.remainder === left.remainder ? compareProcess(left.member.process, right.member.process) : right.remainder > left.remainder ? 1 : -1);
  let remaining = total - shares.reduce((sum, share) => sum + share.allocation, 0);
  for (const share of shares) {
    if (remaining === 0) break;
    share.allocation += 1;
    remaining -= 1;
  }
  if (remaining !== 0) throw new CapacityPlannerError("integer allocation did not conserve its class total.");
  return new Map(shares.map((share) => [key(share.member.process), share.allocation]));
}

function calculateClassProcessAllocation(capacity: EligibleResourceVector, eligible: readonly CapacityDimension[], active: readonly ProviderProcessProfile[], policy: ClassAllocationPolicy, caps: ReadonlyMap<string, EligibleResourceVector>): CalculatedClassProcessAllocation {
  const classTotals: { headroom: EligibleResourceVector; interactive: EligibleResourceVector; background: EligibleResourceVector } = {
    headroom: vectorFor(eligible, (dimension) => ceilingBasisPoints(capacity[dimension]!, policy.headroomBps)),
    interactive: vectorFor(eligible, (dimension) => ceilingBasisPoints(capacity[dimension]!, policy.interactiveBps)),
    background: {},
  };
  classTotals.background = vectorFor(eligible, (dimension) => {
    const result = capacity[dimension]! - classTotals.headroom[dimension]! - classTotals.interactive[dimension]!;
    if (result < 0 || classTotals.headroom[dimension]! + classTotals.interactive[dimension]! + result !== capacity[dimension]) throw new CapacityPlannerError(`class allocation does not conserve ${dimension}.`);
    return result;
  });
  const output: CalculatedClassProcessAllocation["processes"][number][] = [];
  const unallocated: Partial<Record<CapacityDimension, number>> = Object.fromEntries(eligible.map((dimension) => [dimension, 0]));
  for (const serviceClass of ["interactive", "background"] as const) {
    const members = active.filter((process) => process.serviceClass === serviceClass).map((process) => ({ process, weight: allocationWeight(process) }));
    if (members.length === 0) continue;
    const denominator = members.reduce((sum, member) => sum + member.weight, 0);
    const allocatedByDimension = new Map(eligible.map((dimension) => [dimension, allocateDimension(classTotals[serviceClass][dimension]!, members)]));
    for (const member of members.slice().sort((left, right) => compareProcess(left.process, right.process))) {
      const cap = serviceClass === "background" ? caps.get(key(member.process)) : undefined;
      const baseline: Partial<Record<CapacityDimension, number>> = {};
      for (const dimension of eligible) {
        const allocated = allocatedByDimension.get(dimension)!.get(key(member.process))!;
        const capped = cap?.[dimension] === undefined ? allocated : Math.min(allocated, cap[dimension]!);
        baseline[dimension] = capped;
        unallocated[dimension]! += allocated - capped;
      }
      const unfitDimensions = eligible.filter((dimension) => baseline[dimension] === 0);
      output.push({ processId: member.process.processId, profileVersion: member.process.profileVersion, serviceClass, normalizedWeight: { numerator: member.weight, denominator }, baseline, status: unfitDimensions.length === 0 ? "qualified" : "unfit", unfitDimensions, ...(cap ? { cap: vectorFor(eligible, (dimension) => cap[dimension]!) } : {}) });
    }
  }
  return freeze({ apiVersion: "CalculatedClassProcessAllocation/v1", classAllocationPolicy: policy, effectiveDimensions: [...eligible], classTotals, processes: output, unallocatedRemainder: unallocated });
}

/** Purely derives policy ceilings. It has no runtime counters, clocks, provider clients, persistence, or worker allocation authority. */
export function planDesiredAdmissionProfile(capacityProfile: ProviderCapacityProfile, processes: readonly ProviderProcessProfile[], workloads: readonly WorkloadEnvelopeProfile[], policy: PlannerPolicy): DesiredAdmissionProfile {
  return planEffectiveDesiredAdmissionProfile(capacityProfile, processes, workloads, policy, effectivePolicyForKnownCapacity(capacityProfile));
}

/** Derives a plan solely from a server-derived effective policy. Unknown excluded dimensions remain provenance metadata, never numeric capacity. */
export function planEffectiveDesiredAdmissionProfile(capacityProfile: ProviderCapacityProfile, processes: readonly ProviderProcessProfile[], workloads: readonly WorkloadEnvelopeProfile[], policy: PlannerPolicy, effectiveEnforcementPolicy: EffectiveEnforcementPolicy): DesiredAdmissionProfile {
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
    const planningCost: EligibleResourceVector = Object.fromEntries(eligibleDimensions.map((dimension) => [dimension, fullPlanningCost[dimension]]));
    const dominantResourceCost = Math.max(...eligibleDimensions.map((dimension) => planningCost[dimension]! / backgroundCapacity[dimension]!));
    return { processId: process.processId, profileVersion: process.profileVersion, workloadProfile: { workloadId: workload.workloadId, profileVersion: workload.profileVersion }, normalizedWeight: allocation.weight / totalWeight, mayBorrowIdleCapacity: allocation.mayBorrowIdleCapacity, capPolicyId: allocation.capPolicyId, ...(caps.has(key(process)) ? { cap: caps.get(key(process))! } : {}), planningCost, dominantResourceCost };
  });
  const calculatedClassProcessAllocation = policy.classAllocationPolicy ? calculateClassProcessAllocation(capacity, eligibleDimensions, active, assertClassAllocationPolicy(policy.classAllocationPolicy), caps) : undefined;
  return { quotaDomainId: capacityProfile.quotaDomainId, providerCapacityProfileVersion: capacityProfile.profileVersion, plannerVersion: policy.plannerVersion, effectiveFrom: policy.effectiveFrom, eligibleDimensions, effectiveEnforcementPolicy, usableGlobalCapacity, hardInteractiveReserve, backgroundCapacity, backgroundLanes, ...(calculatedClassProcessAllocation ? { calculatedClassProcessAllocation } : {}) };
}
