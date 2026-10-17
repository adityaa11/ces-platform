import { atlasCapabilities, type AtlasCapability } from "./route-registry.js";

/**
 * Process kinds are server-registered identifiers.  The legacy parser below
 * remains intentionally conservative, while the registry is the only path
 * that can introduce an additional identifier.
 */
export type ProcessKind = string;
export type ServiceClass = "interactive" | "background";
export type WorkloadProfileReference = Readonly<{ workloadId: string; profileVersion: string }>;
export type RequestResourceEnvelope = Readonly<{
  requestUnits: number;
  tokenUnits: number;
  dayUnits: number;
  concurrencyUnits: number;
}>;

export type ProviderProcessProfile = Readonly<{
  processId: string;
  profileVersion: string;
  processKind: ProcessKind;
  capability: AtlasCapability;
  serviceClass: ServiceClass;
  fairnessScope: Readonly<{ kind: "bundle" | "project" | "conversation" | "global"; identityVersion: string }>;
  allocationPolicy: Readonly<{
    background?: Readonly<{ weight: number; mayBorrowIdleCapacity: boolean; capPolicyId: string }>;
    hardInteractiveProtection: Readonly<{ policyId: string; policyVersion: string }>;
  }>;
  active: boolean;
  eligibleRouteIds: readonly string[];
  workloadProfile: WorkloadProfileReference;
}>;

export type WorkloadEnvelopeProfile = Readonly<{
  workloadId: string;
  profileVersion: string;
  active: boolean;
  compatibleProcessKinds: readonly ProcessKind[];
  structuralBound: Readonly<{ identity: string; version: string; maxRequestBytes: number; maxInputTokens: number }>;
  estimator: Readonly<{ identity: string; version: string }>;
  quotaAccountingPolicyId: string;
  outputReservation: Readonly<{ policyId: string; policyVersion: string; maxOutputTokens: number }>;
  safetyPolicy: Readonly<{ policyId: string; policyVersion: string }>;
}>;

export type RegisteredProcessPolicy = Readonly<{
  registryId: string;
  registryVersion: string;
  quotaDomainId: string;
  process: ProviderProcessProfile;
}>;

export type ServerProcessRegistry = Readonly<{
  registryId: string;
  registryVersion: string;
  policies: readonly RegisteredProcessPolicy[];
}>;

export type RegisteredProcessReference = Readonly<{
  registryId: string;
  registryVersion: string;
  quotaDomainId: string;
  processId: string;
  profileVersion: string;
}>;

export type RegisteredProcessAuthorities = Readonly<{
  qualifiedQuotaDomainIds: ReadonlySet<string>;
  qualifiedRouteIds: ReadonlySet<string>;
  workloads: readonly WorkloadEnvelopeProfile[];
  quotaAccountingPolicyIds: ReadonlySet<string>;
}>;

export class ProcessWorkloadCatalogueError extends Error {}

const legacyProcessKinds = new Set<ProcessKind>(["semantic", "reconciliation", "chat", "ces", "addendum"]);
const serviceClasses = new Set<ServiceClass>(["interactive", "background"]);
const scopeKinds = new Set(["bundle", "project", "conversation", "global"]);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const object = (value: unknown, name: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProcessWorkloadCatalogueError(`${name} must be an object.`);
  return value as Record<string, unknown>;
};
const rejectUnexpected = (value: Record<string, unknown>, allowed: readonly string[], name: string): void => {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new ProcessWorkloadCatalogueError(`${name} contains unsupported field ${key}.`);
};
const requiredString = (value: unknown, name: string): string => {
  if (!nonEmpty(value)) throw new ProcessWorkloadCatalogueError(`${name} must be non-empty.`);
  return value;
};
const positiveSafeInteger = (value: unknown, name: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) throw new ProcessWorkloadCatalogueError(`${name} must be a positive safe integer.`);
  return value as number;
};
const nonNegativeSafeInteger = (value: unknown, name: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new ProcessWorkloadCatalogueError(`${name} must be a non-negative safe integer.`);
  return value as number;
};

/** Parses operational policy only; entitlement, billing, and customer-plan fields are intentionally not accepted. */
export function parseProviderProcessProfile(value: unknown, registeredProcessKinds: ReadonlySet<ProcessKind> = legacyProcessKinds): ProviderProcessProfile {
  const input = object(value, "process profile");
  rejectUnexpected(input, ["processId", "profileVersion", "processKind", "capability", "serviceClass", "fairnessScope", "allocationPolicy", "active", "eligibleRouteIds", "workloadProfile"], "process profile");
  const processKind = input.processKind;
  const capability = input.capability;
  const serviceClass = input.serviceClass;
  if (!registeredProcessKinds.has(processKind as ProcessKind) || !atlasCapabilities.includes(capability as AtlasCapability) || !serviceClasses.has(serviceClass as ServiceClass)) throw new ProcessWorkloadCatalogueError("process profile has an unknown process kind, capability, or service class.");
  if (typeof input.active !== "boolean") throw new ProcessWorkloadCatalogueError("process profile active must be boolean.");
  const scope = object(input.fairnessScope, "fairnessScope");
  rejectUnexpected(scope, ["kind", "identityVersion"], "fairnessScope");
  if (!scopeKinds.has(scope.kind as string)) throw new ProcessWorkloadCatalogueError("fairnessScope kind is unsupported.");
  const allocation = object(input.allocationPolicy, "allocationPolicy");
  rejectUnexpected(allocation, ["background", "hardInteractiveProtection"], "allocationPolicy");
  const protection = object(allocation.hardInteractiveProtection, "hardInteractiveProtection");
  rejectUnexpected(protection, ["policyId", "policyVersion"], "hardInteractiveProtection");
  let background: ProviderProcessProfile["allocationPolicy"]["background"];
  if (serviceClass === "background") {
    const raw = object(allocation.background, "background allocation policy");
    rejectUnexpected(raw, ["weight", "mayBorrowIdleCapacity", "capPolicyId"], "background allocation policy");
    if (typeof raw.weight !== "number" || !Number.isFinite(raw.weight) || raw.weight <= 0 || typeof raw.mayBorrowIdleCapacity !== "boolean") throw new ProcessWorkloadCatalogueError("background allocation policy needs a positive weight and borrow flag.");
    background = { weight: raw.weight, mayBorrowIdleCapacity: raw.mayBorrowIdleCapacity, capPolicyId: requiredString(raw.capPolicyId, "background capPolicyId") };
  } else if (allocation.background !== undefined) throw new ProcessWorkloadCatalogueError("interactive profiles cannot declare background allocation policy.");
  const eligibleRouteIds = input.eligibleRouteIds;
  if (!Array.isArray(eligibleRouteIds) || eligibleRouteIds.some((route) => !nonEmpty(route)) || new Set(eligibleRouteIds).size !== eligibleRouteIds.length) throw new ProcessWorkloadCatalogueError("eligibleRouteIds must contain unique non-empty route IDs.");
  if (input.active === true && eligibleRouteIds.length === 0) throw new ProcessWorkloadCatalogueError("an active process profile needs an eligible route.");
  const workload = object(input.workloadProfile, "workloadProfile");
  rejectUnexpected(workload, ["workloadId", "profileVersion"], "workloadProfile");
  return { processId: requiredString(input.processId, "processId"), profileVersion: requiredString(input.profileVersion, "profileVersion"), processKind: processKind as ProcessKind, capability: capability as AtlasCapability, serviceClass: serviceClass as ServiceClass, fairnessScope: { kind: scope.kind as ProviderProcessProfile["fairnessScope"]["kind"], identityVersion: requiredString(scope.identityVersion, "fairnessScope identityVersion") }, allocationPolicy: { ...(background ? { background } : {}), hardInteractiveProtection: { policyId: requiredString(protection.policyId, "hardInteractiveProtection policyId"), policyVersion: requiredString(protection.policyVersion, "hardInteractiveProtection policyVersion") } }, active: input.active, eligibleRouteIds, workloadProfile: { workloadId: requiredString(workload.workloadId, "workloadProfile workloadId"), profileVersion: requiredString(workload.profileVersion, "workloadProfile profileVersion") } };
}

/** Requires an actual structural bound and versioned estimator/accounting/safety identities; averages are not a bound. */
export function parseWorkloadEnvelopeProfile(value: unknown, registeredProcessKinds: ReadonlySet<ProcessKind> = legacyProcessKinds): WorkloadEnvelopeProfile {
  const input = object(value, "workload envelope profile");
  rejectUnexpected(input, ["workloadId", "profileVersion", "active", "compatibleProcessKinds", "structuralBound", "estimator", "quotaAccountingPolicyId", "outputReservation", "safetyPolicy"], "workload envelope profile");
  if (typeof input.active !== "boolean" || !Array.isArray(input.compatibleProcessKinds) || input.compatibleProcessKinds.length === 0 || input.compatibleProcessKinds.some((kind) => !registeredProcessKinds.has(kind as ProcessKind)) || new Set(input.compatibleProcessKinds).size !== input.compatibleProcessKinds.length) throw new ProcessWorkloadCatalogueError("workload profile requires known compatible process kinds.");
  const bound = object(input.structuralBound, "structuralBound"); rejectUnexpected(bound, ["identity", "version", "maxRequestBytes", "maxInputTokens"], "structuralBound");
  const estimator = object(input.estimator, "estimator"); rejectUnexpected(estimator, ["identity", "version"], "estimator");
  const output = object(input.outputReservation, "outputReservation"); rejectUnexpected(output, ["policyId", "policyVersion", "maxOutputTokens"], "outputReservation");
  const safety = object(input.safetyPolicy, "safetyPolicy"); rejectUnexpected(safety, ["policyId", "policyVersion"], "safetyPolicy");
  return { workloadId: requiredString(input.workloadId, "workloadId"), profileVersion: requiredString(input.profileVersion, "profileVersion"), active: input.active, compatibleProcessKinds: input.compatibleProcessKinds as ProcessKind[], structuralBound: { identity: requiredString(bound.identity, "structuralBound identity"), version: requiredString(bound.version, "structuralBound version"), maxRequestBytes: positiveSafeInteger(bound.maxRequestBytes, "structuralBound maxRequestBytes"), maxInputTokens: positiveSafeInteger(bound.maxInputTokens, "structuralBound maxInputTokens") }, estimator: { identity: requiredString(estimator.identity, "estimator identity"), version: requiredString(estimator.version, "estimator version") }, quotaAccountingPolicyId: requiredString(input.quotaAccountingPolicyId, "quotaAccountingPolicyId"), outputReservation: { policyId: requiredString(output.policyId, "outputReservation policyId"), policyVersion: requiredString(output.policyVersion, "outputReservation policyVersion"), maxOutputTokens: positiveSafeInteger(output.maxOutputTokens, "outputReservation maxOutputTokens") }, safetyPolicy: { policyId: requiredString(safety.policyId, "safetyPolicy policyId"), policyVersion: requiredString(safety.policyVersion, "safetyPolicy policyVersion") } };
}

/** Validates the four admission dimensions independently; no scalar capacity surrogate is representable. */
export function parseRequestResourceEnvelope(value: unknown): RequestResourceEnvelope {
  const input = object(value, "request resource envelope");
  rejectUnexpected(input, ["requestUnits", "tokenUnits", "dayUnits", "concurrencyUnits"], "request resource envelope");
  return { requestUnits: nonNegativeSafeInteger(input.requestUnits, "requestUnits"), tokenUnits: nonNegativeSafeInteger(input.tokenUnits, "tokenUnits"), dayUnits: nonNegativeSafeInteger(input.dayUnits, "dayUnits"), concurrencyUnits: nonNegativeSafeInteger(input.concurrencyUnits, "concurrencyUnits") };
}

/** Resolves only active, compatible, versioned operational profiles. Unknown and placeholder profiles fail closed. */
export function validateProcessWorkloadCatalogue(processes: readonly ProviderProcessProfile[], workloads: readonly WorkloadEnvelopeProfile[], qualifiedRouteIds: ReadonlySet<string>, quotaAccountingPolicyIds: ReadonlySet<string>): void {
  const workloadIndex = new Map(workloads.map((profile) => [`${profile.workloadId}:${profile.profileVersion}`, profile]));
  const processKeys = new Set<string>();
  for (const process of processes) {
    const key = `${process.processId}:${process.profileVersion}`;
    if (processKeys.has(key)) throw new ProcessWorkloadCatalogueError(`duplicate process profile ${key}.`);
    processKeys.add(key);
    const workload = workloadIndex.get(`${process.workloadProfile.workloadId}:${process.workloadProfile.profileVersion}`);
    if (!workload) throw new ProcessWorkloadCatalogueError(`process ${key} references an unknown workload profile.`);
    if (!workload.compatibleProcessKinds.includes(process.processKind)) throw new ProcessWorkloadCatalogueError(`process ${key} is incompatible with its workload profile.`);
    if (process.active && (!workload.active || process.eligibleRouteIds.some((routeId) => !qualifiedRouteIds.has(routeId)))) throw new ProcessWorkloadCatalogueError(`active process ${key} has an inactive workload or unknown route.`);
  }
  for (const workload of workloads) if (!quotaAccountingPolicyIds.has(workload.quotaAccountingPolicyId)) throw new ProcessWorkloadCatalogueError(`workload ${workload.workloadId}:${workload.profileVersion} has no explicit quota-accounting authority.`);
}

/**
 * Parses the server-owned registration document.  It is policy data, not a
 * consumer request: every process kind in the document becomes known only in
 * this particular versioned registry and all other fields stay within the
 * already-approved process/workload vocabulary.
 */
export function parseServerProcessRegistry(value: unknown): ServerProcessRegistry {
  const input = object(value, "server process registry");
  rejectUnexpected(input, ["registryId", "registryVersion", "policies"], "server process registry");
  const registryId = requiredString(input.registryId, "registryId");
  const registryVersion = requiredString(input.registryVersion, "registryVersion");
  if (!Array.isArray(input.policies) || input.policies.length === 0) throw new ProcessWorkloadCatalogueError("server process registry requires policies.");
  const kinds = new Set<ProcessKind>();
  for (const rawPolicy of input.policies) {
    const policy = object(rawPolicy, "registered process policy");
    const process = object(policy.process, "registered process policy process");
    const kind = requiredString(process.processKind, "registered process policy processKind");
    kinds.add(kind);
  }
  const policyKeys = new Set<string>();
  const policies = input.policies.map((rawPolicy) => {
    const policy = object(rawPolicy, "registered process policy");
    rejectUnexpected(policy, ["quotaDomainId", "process"], "registered process policy");
    const process = parseProviderProcessProfile(policy.process, kinds);
    const policyKey = `${requiredString(policy.quotaDomainId, "quotaDomainId")}:${process.processId}:${process.profileVersion}`;
    if (policyKeys.has(policyKey)) throw new ProcessWorkloadCatalogueError(`duplicate registered process policy ${policyKey}.`);
    policyKeys.add(policyKey);
    return { registryId, registryVersion, quotaDomainId: requiredString(policy.quotaDomainId, "quotaDomainId"), process };
  });
  return { registryId, registryVersion, policies };
}

/** Parses a consumer-supplied identity without permitting it to select a route or service class. */
export function parseRegisteredProcessReference(value: unknown): RegisteredProcessReference {
  const input = object(value, "registered process reference");
  rejectUnexpected(input, ["registryId", "registryVersion", "quotaDomainId", "processId", "profileVersion"], "registered process reference");
  return {
    registryId: requiredString(input.registryId, "registryId"),
    registryVersion: requiredString(input.registryVersion, "registryVersion"),
    quotaDomainId: requiredString(input.quotaDomainId, "quotaDomainId"),
    processId: requiredString(input.processId, "processId"),
    profileVersion: requiredString(input.profileVersion, "profileVersion"),
  };
}

/** Resolves a registered process only against the server-supplied registry and already-qualified authority sets. */
export function resolveRegisteredProcessPolicy(registry: ServerProcessRegistry, reference: RegisteredProcessReference, authorities: RegisteredProcessAuthorities): ProviderProcessProfile {
  if (reference.registryId !== registry.registryId || reference.registryVersion !== registry.registryVersion) throw new ProcessWorkloadCatalogueError("foreign or stale process registry identity.");
  const policy = registry.policies.find((candidate) => candidate.quotaDomainId === reference.quotaDomainId && candidate.process.processId === reference.processId && candidate.process.profileVersion === reference.profileVersion);
  if (!policy) throw new ProcessWorkloadCatalogueError("registered process policy is unknown for the quota domain.");
  if (!authorities.qualifiedQuotaDomainIds.has(policy.quotaDomainId)) throw new ProcessWorkloadCatalogueError("registered process policy has an unqualified quota domain.");
  validateProcessWorkloadCatalogue([policy.process], authorities.workloads, authorities.qualifiedRouteIds, authorities.quotaAccountingPolicyIds);
  return policy.process;
}
