export type CapacityState =
  | { readonly state: "known"; readonly value: number }
  | { readonly state: "zero" }
  | { readonly state: "unknown" };

export type CapacityDimension = "rpm" | "tpm" | "rpd" | "concurrency";
export type WindowedDimension = Exclude<CapacityDimension, "concurrency">;
export type CapacitySource = "provider_api" | "provider_docs" | "operator_config" | "qualified_observation";

export type QuotaWindowPolicy = Readonly<{
  policyId: string;
  policyVersion: string;
  source: CapacitySource;
  kind: "fixed_window" | "rolling_window" | "token_bucket" | "provider_reset_observation" | "daily_calendar" | "conservative_fallback" | "unknown";
  parameters?: Readonly<Record<string, unknown>>;
}>;

export type ProviderCapacityProfile = Readonly<{
  quotaDomainId: string;
  profileVersion: string;
  nonSecretProviderAccountAlias: string;
  associatedRoutes: readonly Readonly<{ routeId: string; providerId: string }>[];
  limits: Readonly<Record<CapacityDimension, CapacityState>>;
  windowPolicies: Readonly<Record<WindowedDimension, QuotaWindowPolicy>>;
  quotaAccountingPolicyId: string;
  capacitySource: CapacitySource;
  sourceRef: string;
  sourceVersion: string;
  observedAt: string;
  effectiveFrom: string;
}>;

export class CapacityCatalogueError extends Error {}

const sources = new Set<CapacitySource>(["provider_api", "provider_docs", "operator_config", "qualified_observation"]);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const credentialShapedAlias = /^(?:sk|pk|rk|ak)[_-]/iu;
const resetTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;
const object = (value: unknown, name: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CapacityCatalogueError(`${name} must be an object.`);
  return value as Record<string, unknown>;
};
const finiteTimestamp = (value: unknown, name: string): string => {
  if (!nonEmpty(value) || !Number.isFinite(Date.parse(value))) throw new CapacityCatalogueError(`${name} must be an ISO timestamp.`);
  return value;
};
const requiredString = (value: unknown, name: string): string => {
  if (!nonEmpty(value)) throw new CapacityCatalogueError(`${name} must be non-empty.`);
  return value;
};
const rejectUnexpected = (value: Record<string, unknown>, allowed: readonly string[], name: string): void => {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new CapacityCatalogueError(`${name} contains unsupported field ${key}.`);
};

function parseCapacity(value: unknown, dimension: CapacityDimension): CapacityState {
  const input = object(value, `${dimension} limit`);
  rejectUnexpected(input, ["state", "value"], `${dimension} limit`);
  if (input.state === "known") {
    if (typeof input.value !== "number" || !Number.isFinite(input.value) || input.value <= 0) throw new CapacityCatalogueError(`${dimension} known limit must be a positive finite number.`);
    return { state: "known", value: input.value };
  }
  if (input.state === "zero" || input.state === "unknown") {
    if (input.value !== undefined) throw new CapacityCatalogueError(`${dimension} ${input.state} limit must not carry a value.`);
    return { state: input.state };
  }
  throw new CapacityCatalogueError(`${dimension} limit must be known, zero, or unknown.`);
}

function parseWindowPolicy(value: unknown, dimension: WindowedDimension): QuotaWindowPolicy {
  const input = object(value, `${dimension} window policy`);
  rejectUnexpected(input, ["policyId", "policyVersion", "source", "kind", "parameters"], `${dimension} window policy`);
  if (!nonEmpty(input.policyId) || !nonEmpty(input.policyVersion) || !sources.has(input.source as CapacitySource)) throw new CapacityCatalogueError(`${dimension} window policy needs an identity, version, and recognized source.`);
  const kind = input.kind;
  const parameters = input.parameters === undefined ? undefined : object(input.parameters, `${dimension} window policy parameters`);
  const positive = (key: string) => typeof parameters?.[key] === "number" && Number.isFinite(parameters[key]) && (parameters[key] as number) > 0;
  if ((kind === "fixed_window" || kind === "rolling_window") && !positive("windowSeconds")) throw new CapacityCatalogueError(`${dimension} ${kind} policy requires positive windowSeconds.`);
  if (kind === "token_bucket" && (!positive("refillUnitsPerSecond") || !positive("burstUnits"))) throw new CapacityCatalogueError(`${dimension} token_bucket policy requires positive refillUnitsPerSecond and burstUnits.`);
  if (kind === "provider_reset_observation" && !nonEmpty(parameters?.resetObservationIdentity)) throw new CapacityCatalogueError(`${dimension} provider_reset_observation policy requires resetObservationIdentity.`);
  if (kind === "daily_calendar") {
    if (!nonEmpty(parameters?.timeZone) || !nonEmpty(parameters?.resetTime)) throw new CapacityCatalogueError(`${dimension} daily_calendar policy requires timeZone and resetTime.`);
    try {
      Intl.DateTimeFormat("en-US", { timeZone: parameters.timeZone });
    } catch {
      throw new CapacityCatalogueError(`${dimension} daily_calendar policy requires a recognized IANA timeZone.`);
    }
    if (!resetTime.test(parameters.resetTime)) throw new CapacityCatalogueError(`${dimension} daily_calendar policy requires resetTime in HH:mm format.`);
  }
  if (kind === "conservative_fallback" && !nonEmpty(parameters?.fallbackReason)) throw new CapacityCatalogueError(`${dimension} conservative_fallback policy requires fallbackReason.`);
  if (kind !== "fixed_window" && kind !== "rolling_window" && kind !== "token_bucket" && kind !== "provider_reset_observation" && kind !== "daily_calendar" && kind !== "conservative_fallback" && kind !== "unknown") throw new CapacityCatalogueError(`${dimension} window policy kind is unsupported.`);
  return { policyId: input.policyId, policyVersion: input.policyVersion, source: input.source as CapacitySource, kind, ...(parameters ? { parameters } : {}) } as QuotaWindowPolicy;
}

/** Parses only secret-free, server-controlled planning input; it never resolves credentials or provider routes. */
export function parseProviderCapacityProfile(value: unknown): ProviderCapacityProfile {
  const input = object(value, "capacity profile");
  rejectUnexpected(input, ["quotaDomainId", "profileVersion", "nonSecretProviderAccountAlias", "associatedRoutes", "limits", "windowPolicies", "quotaAccountingPolicyId", "capacitySource", "sourceRef", "sourceVersion", "observedAt", "effectiveFrom"], "capacity profile");
  const quotaDomainId = requiredString(input.quotaDomainId, "quotaDomainId");
  const profileVersion = requiredString(input.profileVersion, "profileVersion");
  const nonSecretProviderAccountAlias = requiredString(input.nonSecretProviderAccountAlias, "nonSecretProviderAccountAlias");
  const quotaAccountingPolicyId = requiredString(input.quotaAccountingPolicyId, "quotaAccountingPolicyId");
  const sourceRef = requiredString(input.sourceRef, "sourceRef");
  const sourceVersion = requiredString(input.sourceVersion, "sourceVersion");
  if (credentialShapedAlias.test(nonSecretProviderAccountAlias) || /api.?key|secret|credential|authorization|bearer|token/iu.test(nonSecretProviderAccountAlias)) throw new CapacityCatalogueError("nonSecretProviderAccountAlias must be an opaque non-secret alias.");
  if (!sources.has(input.capacitySource as CapacitySource)) throw new CapacityCatalogueError("capacitySource is not recognized.");
  const routesInput = input.associatedRoutes;
  if (!Array.isArray(routesInput) || routesInput.length === 0) throw new CapacityCatalogueError("associatedRoutes must contain at least one qualified external route.");
  const routeIds = new Set<string>();
  const associatedRoutes = routesInput.map((route, index) => {
    const parsed = object(route, `associatedRoutes[${index}]`); rejectUnexpected(parsed, ["routeId", "providerId"], `associatedRoutes[${index}]`);
    if (!nonEmpty(parsed.routeId) || !nonEmpty(parsed.providerId) || parsed.providerId === "docling") throw new CapacityCatalogueError("associatedRoutes must identify a non-Docling qualified route.");
    if (routeIds.has(parsed.routeId)) throw new CapacityCatalogueError(`duplicate associated route ${parsed.routeId}.`);
    routeIds.add(parsed.routeId); return { routeId: parsed.routeId, providerId: parsed.providerId };
  });
  const limitsInput = object(input.limits, "limits"); rejectUnexpected(limitsInput, ["rpm", "tpm", "rpd", "concurrency"], "limits");
  const limits = { rpm: parseCapacity(limitsInput.rpm, "rpm"), tpm: parseCapacity(limitsInput.tpm, "tpm"), rpd: parseCapacity(limitsInput.rpd, "rpd"), concurrency: parseCapacity(limitsInput.concurrency, "concurrency") };
  const windowsInput = object(input.windowPolicies, "windowPolicies"); rejectUnexpected(windowsInput, ["rpm", "tpm", "rpd"], "windowPolicies");
  const windowPolicies = { rpm: parseWindowPolicy(windowsInput.rpm, "rpm"), tpm: parseWindowPolicy(windowsInput.tpm, "tpm"), rpd: parseWindowPolicy(windowsInput.rpd, "rpd") };
  return { quotaDomainId, profileVersion, nonSecretProviderAccountAlias, associatedRoutes, limits, windowPolicies, quotaAccountingPolicyId, capacitySource: input.capacitySource as CapacitySource, sourceRef, sourceVersion, observedAt: finiteTimestamp(input.observedAt, "observedAt"), effectiveFrom: finiteTimestamp(input.effectiveFrom, "effectiveFrom") };
}

/** Ensures a configured route maps to one domain while allowing many routes to share that domain. */
export function validateCapacityCatalogue(profiles: readonly ProviderCapacityProfile[]): void {
  const routeDomains = new Map<string, string>();
  for (const profile of profiles) for (const route of profile.associatedRoutes) {
    const existing = routeDomains.get(route.routeId);
    if (existing && existing !== profile.quotaDomainId) throw new CapacityCatalogueError(`route ${route.routeId} is assigned to multiple quota domains.`);
    routeDomains.set(route.routeId, profile.quotaDomainId);
  }
}

/** A known zero is an explicit no-capacity signal, never a value to infer from or refill. */
export function isStructurallyUnavailable(profile: ProviderCapacityProfile): boolean {
  return Object.values(profile.limits).some((limit) => limit.state === "zero");
}
