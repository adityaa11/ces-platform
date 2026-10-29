import { doclingCapabilityIdentity, doclingRun003OptionProfile } from "./providers/docling.js";

export const atlasCapabilities = [
  "atlas.document.perceive",
] as const;

export type AtlasCapability = typeof atlasCapabilities[number];
export type DeploymentProfile = "test" | "development" | "live";

export type QualifiedRoute = {
  readonly routeId: string;
  readonly capability: AtlasCapability;
  readonly providerId: string;
  readonly modelOrProcessorId: string;
  readonly adapterVersion: string;
  readonly qualificationVersion: string;
  readonly qualificationRef: string;
  readonly qualificationPolicyRef?: string;
  readonly workClass: string;
  readonly enabled: boolean;
  readonly effectiveFrom?: string;
  readonly effectiveUntil?: string;
  readonly extensions?: Readonly<Record<string, unknown>>;
};

export class RouteResolutionError extends Error {
  constructor(readonly code: "route_unavailable" | "invalid_profile" | "invalid_route", message: string) { super(message); }
}

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function parseDeploymentProfile(value: string | undefined): DeploymentProfile {
  const profile = value ?? "development";
  if (profile !== "test" && profile !== "development" && profile !== "live") {
    throw new RouteResolutionError("invalid_profile", "AGENTS_BRIDGE_DEPLOYMENT_PROFILE must be test, development, or live.");
  }
  return profile;
}

export function parseQualifiedRoutes(value: string | undefined): readonly QualifiedRoute[] {
  if (!value?.trim()) return [];
  let input: unknown;
  try { input = JSON.parse(value); } catch { throw new RouteResolutionError("invalid_route", "AGENTS_BRIDGE_QUALIFIED_ROUTES must be valid JSON."); }
  if (!Array.isArray(input)) throw new RouteResolutionError("invalid_route", "AGENTS_BRIDGE_QUALIFIED_ROUTES must be a JSON array.");
  const known = new Set<string>(atlasCapabilities);
  const routes = input.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new RouteResolutionError("invalid_route", `Qualified route ${index} must be an object.`);
    const r = item as Record<string, unknown>;
    if (!nonEmpty(r.routeId) || !nonEmpty(r.capability) || !known.has(r.capability) || !nonEmpty(r.providerId) || !nonEmpty(r.modelOrProcessorId) || !nonEmpty(r.adapterVersion) || !nonEmpty(r.qualificationVersion) || !nonEmpty(r.qualificationRef) || !nonEmpty(r.workClass) || typeof r.enabled !== "boolean") {
      throw new RouteResolutionError("invalid_route", `Qualified route ${index} is missing a required pinned identity, qualification reference, work class, capability, or enabled state.`);
    }
    if (/-latest$/u.test(r.modelOrProcessorId) && !nonEmpty(r.qualificationPolicyRef)) {
      throw new RouteResolutionError("invalid_route", `Qualified route ${index} uses a mutable *-latest alias without an explicit qualifying policy reference.`);
    }
    if (r.qualificationPolicyRef !== undefined && !nonEmpty(r.qualificationPolicyRef)) {
      throw new RouteResolutionError("invalid_route", `Qualified route ${index} has an invalid qualification policy reference.`);
    }
    for (const key of ["effectiveFrom", "effectiveUntil"] as const) {
      if (r[key] !== undefined && (!nonEmpty(r[key]) || !Number.isFinite(Date.parse(r[key])))) throw new RouteResolutionError("invalid_route", `Qualified route ${index} has an invalid ${key}.`);
    }
    return { ...r, capability: r.capability as AtlasCapability } as QualifiedRoute;
  });
  const routeIds = new Set<string>();
  const capabilities = new Set<string>();
  for (const route of routes) {
    if (routeIds.has(route.routeId)) throw new RouteResolutionError("invalid_route", `Duplicate route ID: ${route.routeId}.`);
    routeIds.add(route.routeId);
    if (capabilities.has(route.capability)) throw new RouteResolutionError("invalid_route", `Duplicate capability mapping: ${route.capability}.`);
    capabilities.add(route.capability);
  }
  return routes;
}

export function createRouteRegistry(routes: readonly QualifiedRoute[], profile: DeploymentProfile, availableAdapters: ReadonlySet<string>, now = Date.now()) {
  const active = new Map<AtlasCapability, QualifiedRoute>();
  const errors: string[] = [];
  for (const route of routes) {
    if (!route.enabled) continue;
    const from = route.effectiveFrom ? Date.parse(route.effectiveFrom) : Number.NEGATIVE_INFINITY;
    const until = route.effectiveUntil ? Date.parse(route.effectiveUntil) : Number.POSITIVE_INFINITY;
    if (from > now || until <= now) { errors.push(`Route ${route.routeId} is outside its effective window.`); continue; }
    if (!route.qualificationRef.trim() || !route.qualificationVersion.trim()) { errors.push(`Route ${route.routeId} lacks qualification identity.`); continue; }
    if (!availableAdapters.has(route.providerId)) { errors.push(`Route ${route.routeId} requires an unavailable adapter.`); continue; }
    active.set(route.capability, route);
  }
  if (profile === "live") {
    for (const capability of ["atlas.document.perceive"] as const) {
      if (!active.has(capability)) errors.push(`Live profile is missing an enabled qualified route for ${capability}.`);
    }
  }
  return {
    profile,
    ready: profile !== "live" || errors.length === 0,
    errors: Object.freeze(errors),
    resolve(capability: AtlasCapability): QualifiedRoute {
      if (profile === "test") throw new RouteResolutionError("route_unavailable", "Test profile does not resolve live routes.");
      const route = active.get(capability);
      if (!route) throw new RouteResolutionError("route_unavailable", `No enabled qualified route is available for ${capability}.`);
      if (profile === "live" && errors.length) throw new RouteResolutionError("invalid_profile", "Live deployment profile is not ready.");
      return route;
    },
  };
}

export function assertConfiguredRouteAdapter(route: QualifiedRoute, config: { readonly docling: { readonly serviceVersion: string; readonly doclingSlimVersion: string; readonly optionProfile: string }; readonly qualificationOnly?: boolean }): void {
  if (route.providerId === "docling") {
    if (route.capability !== "atlas.document.perceive" || route.adapterVersion !== "docling-serve-adapter-v1" || route.modelOrProcessorId !== `docling-slim-${config.docling.doclingSlimVersion}` || route.extensions?.serviceVersion !== config.docling.serviceVersion || route.extensions?.optionProfile !== config.docling.optionProfile || route.extensions?.capabilityIdentity !== doclingCapabilityIdentity(config.docling.optionProfile) || route.extensions?.imageDigest !== "sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7") throw new RouteResolutionError("invalid_route", `Route ${route.routeId} does not name the pinned qualified Docling service profile and cache identity.`);
    if (config.qualificationOnly !== true && (route.qualificationVersion !== "idser-012-01-03-02-local" || route.qualificationRef !== "qualification://idser-012-01-03-02-local")) throw new RouteResolutionError("invalid_route", `Route ${route.routeId} does not name the approved RUN-003 qualification.`);
    return;
  }
  throw new RouteResolutionError("invalid_route", `Route ${route.routeId} names an unavailable adapter.`);
}
