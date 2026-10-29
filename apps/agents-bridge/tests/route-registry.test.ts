import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assertConfiguredRouteAdapter, createRouteRegistry, parseDeploymentProfile, parseQualifiedRoutes, RouteResolutionError, type QualifiedRoute } from "../src/route-registry.ts";

const route = (overrides: Record<string, unknown> = {}): QualifiedRoute => ({
  routeId: "docling-run-003-capture", capability: "atlas.document.perceive", providerId: "docling", modelOrProcessorId: "docling-slim-2.132.0",
  adapterVersion: "docling-serve-adapter-v1", qualificationVersion: "idser-012-01-03-02-local", qualificationRef: "qualification://idser-012-01-03-02-local",
  workClass: "local_processor", enabled: true,
  extensions: { serviceVersion: "1.36.0", optionProfile: "atlas-digital-pdf-run-003-capture-v1", capabilityIdentity: "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1", imageDigest: "sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7" },
  ...overrides,
} as QualifiedRoute);

const config = { docling: { serviceVersion: "1.36.0", doclingSlimVersion: "2.132.0", optionProfile: "atlas-digital-pdf-run-003-capture-v1" }, qualificationOnly: false };

test("profile selection rejects unknown runtime modes", () => {
  assert.equal(parseDeploymentProfile(undefined), "development");
  assert.equal(parseDeploymentProfile("test"), "test");
  assert.throws(() => parseDeploymentProfile("production"), RouteResolutionError);
});

test("route matrix blocks unknown, disabled, expired, duplicate, and unqualified mappings", () => {
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([{ ...route(), capability: "vendor.document" }])), /missing a required pinned identity/);
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([{ ...route(), qualificationRef: "" }])), /qualification reference/);
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([route(), { ...route(), routeId: "docling-run-003-v2" }])), /Duplicate capability mapping/);
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([{ ...route(), modelOrProcessorId: "docling-slim-latest" }])), /without an explicit qualifying policy/);
  assert.doesNotThrow(() => parseQualifiedRoutes(JSON.stringify([{ ...route(), modelOrProcessorId: "docling-slim-latest", qualificationPolicyRef: "policy://docling-rollout-v1" }])));
  const disabledRegistry = createRouteRegistry(parseQualifiedRoutes(JSON.stringify([{ ...route(), enabled: false }])), "development", new Set(["docling"]));
  assert.throws(() => disabledRegistry.resolve("atlas.document.perceive"), /No enabled qualified route/);
  const expiredRegistry = createRouteRegistry(parseQualifiedRoutes(JSON.stringify([{ ...route(), routeId: "expired", effectiveUntil: "2000-01-01T00:00:00.000Z" }])), "development", new Set(["docling"]), Date.parse("2026-10-02T00:00:00.000Z"));
  assert.throws(() => expiredRegistry.resolve("atlas.document.perceive"), /No enabled qualified route/);
});

test("live profile readiness requires the active perception route and adapter availability", () => {
  const registry = createRouteRegistry([route()], "live", new Set(["docling"]));
  assert.equal(registry.ready, true);
  const unavailable = createRouteRegistry([route()], "live", new Set());
  assert.equal(unavailable.ready, false);
  assert.throws(() => unavailable.resolve("atlas.document.perceive"), /No enabled qualified route/);
});

test("canonical Compose exposes only the approved normal RUN-003 perception route", async () => {
  const compose = await readFile(fileURLToPath(new URL("../../../docker-compose.yml", import.meta.url)), "utf8");
  const routeMatch = compose.match(/x-docling-qualified-route:\s*&docling-qualified-route\s*>-\s*\r?\n\s*(\[[^\r\n]+\])/u);
  assert.ok(routeMatch, "normal Compose must define its qualified perception route");
  const routes = parseQualifiedRoutes(routeMatch[1]);
  assert.equal(routes.length, 1);
  const [run003] = routes;
  assert.equal(run003?.routeId, "docling-run-003-capture");
  assert.equal(run003?.capability, "atlas.document.perceive");
  assert.equal(run003?.providerId, "docling");
  assert.equal(run003?.qualificationRef, "qualification://idser-012-01-03-02-local");
  assert.equal(run003?.extensions?.optionProfile, "atlas-digital-pdf-run-003-capture-v1");
  assert.equal(run003?.extensions?.capabilityIdentity, "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1");
  assert.match(compose, /ATLAS_D1_PERCEPTION_CAPABILITY_IDENTITY:\s*docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1/u);
  assert.equal((compose.match(/AGENTS_BRIDGE_QUALIFIED_ROUTES:\s*\*docling-qualified-route/gu) ?? []).length, 2);
});

test("normal RUN-003 admission permits only its exact pinned route identity", () => {
  assert.doesNotThrow(() => assertConfiguredRouteAdapter(route(), config));
  assert.throws(() => assertConfiguredRouteAdapter({ ...route(), qualificationVersion: "idser-012-01-03-01-local" }, config), (error: unknown) => error instanceof RouteResolutionError && error.code === "invalid_route");
  assert.throws(() => assertConfiguredRouteAdapter({ ...route(), qualificationRef: "qualification://idser-012-01-03-01-local" }, config), (error: unknown) => error instanceof RouteResolutionError && error.code === "invalid_route");
  assert.throws(() => assertConfiguredRouteAdapter({ ...route(), extensions: { ...route().extensions, capabilityIdentity: "docling-digital-pdf" } }, config), /cache identity/u);
  assert.throws(() => assertConfiguredRouteAdapter({ ...route(), extensions: { ...route().extensions, optionProfile: "atlas-digital-pdf-no-ocr-v1" } }, config), /cache identity/u);
  assert.throws(() => assertConfiguredRouteAdapter({ ...route(), extensions: { ...route().extensions, imageDigest: "sha256:latest" } }, config), /pinned qualified Docling/u);
});
