import { atlasCapabilities, type AtlasCapability } from "./route-registry.js";

export type ProcessKind = "semantic" | "reconciliation" | "chat" | "ces" | "addendum";
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

export class ProcessWorkloadCatalogueError extends Error {}

const processKinds = new Set<ProcessKind>(["semantic", "reconciliation", "chat", "ces", "addendum"]);
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
export function parseProviderProcessProfile(value: unknown): ProviderProcessProfile {
  const input = object(value, "process profile");
  rejectUnexpected(input, ["processId", "profileVersion", "processKind", "capability", "serviceClass", "fairnessScope", "allocationPolicy", "active", "eligibleRouteIds", "workloadProfile"], "process profile");
  const processKind = input.processKind;
  const capability = input.capability;
  const serviceClass = input.serviceClass;
  if (!processKinds.has(processKind as ProcessKind) || !atlasCapabilities.includes(capability as AtlasCapability) || !serviceClasses.has(serviceClass as ServiceClass)) throw new ProcessWorkloadCatalogueError("process profile has an unknown process kind, capability, or service class.");
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
export function parseWorkloadEnvelopeProfile(value: unknown): WorkloadEnvelopeProfile {
  const input = object(value, "workload envelope profile");
  rejectUnexpected(input, ["workloadId", "profileVersion", "active", "compatibleProcessKinds", "structuralBound", "estimator", "quotaAccountingPolicyId", "outputReservation", "safetyPolicy"], "workload envelope profile");
  if (typeof input.active !== "boolean" || !Array.isArray(input.compatibleProcessKinds) || input.compatibleProcessKinds.length === 0 || input.compatibleProcessKinds.some((kind) => !processKinds.has(kind as ProcessKind)) || new Set(input.compatibleProcessKinds).size !== input.compatibleProcessKinds.length) throw new ProcessWorkloadCatalogueError("workload profile requires known compatible process kinds.");
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
