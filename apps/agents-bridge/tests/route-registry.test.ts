import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assertAnomanRouteAdapter, assertConfiguredRouteAdapter, assertRouteAdapter, createRouteRegistry, parseDeploymentProfile, parseQualifiedRoutes, RouteResolutionError, type QualifiedRoute } from "../src/route-registry.ts";
import { QualifiedRouteRuntime } from "../src/runtime.ts";

const route = (overrides: Record<string, unknown> = {}): QualifiedRoute => ({
  routeId: "chat-dev-v1", capability: "atlas.chat.default", providerId: "mistral", modelOrProcessorId: "mistral-small-4-0-26-03",
  adapterVersion: "mistral-adapter-v1", qualificationVersion: "qualification-v1", qualificationRef: "qualification://chat-dev-v1",
  workClass: "interactive", enabled: true, ...overrides,
} as QualifiedRoute);

test("profile selection rejects unknown and non-explicit runtime modes", () => {
  assert.equal(parseDeploymentProfile(undefined), "development");
  assert.equal(parseDeploymentProfile("test"), "test");
  assert.throws(() => parseDeploymentProfile("production"), RouteResolutionError);
});

test("route matrix blocks unknown, disabled, expired, duplicate, and unqualified mappings", () => {
  const unknown = route({ capability: "vendor.chat" });
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([unknown])), /missing a required pinned identity/);
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([route({ qualificationRef: "" })])), /qualification reference/);
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([route(), route({ routeId: "chat-dev-v2" })])), /Duplicate capability mapping/);
  assert.throws(() => parseQualifiedRoutes(JSON.stringify([route({ modelOrProcessorId: "mistral-small-latest" })])), /without an explicit qualifying policy/);
  assert.doesNotThrow(() => parseQualifiedRoutes(JSON.stringify([route({ modelOrProcessorId: "mistral-small-latest", qualificationPolicyRef: "policy://chat-rollout-v1" })])));
  const routes = parseQualifiedRoutes(JSON.stringify([
    route({ enabled: false }),
    route({ routeId: "expired", capability: "atlas.chat.deep", effectiveUntil: "2000-01-01T00:00:00.000Z" }),
    route({ routeId: "available", capability: "atlas.semantic.extract", modelOrProcessorId: "mistral-large-3-25-12" }),
  ]));
  const registry = createRouteRegistry(routes, "development", new Set(["mistral"]), Date.parse("2026-10-02T00:00:00.000Z"));
  assert.throws(() => registry.resolve("atlas.chat.default"), /No enabled qualified route/);
  assert.throws(() => registry.resolve("atlas.chat.deep"), /No enabled qualified route/);
  assert.equal(registry.resolve("atlas.semantic.extract").routeId, "available");
});

test("live profile readiness requires qualified routes and adapter availability", () => {
  const registry = createRouteRegistry([route()], "live", new Set(["mistral"]));
  assert.equal(registry.ready, false);
  assert.match(registry.errors.join(" "), /missing an enabled qualified route/);
  assert.throws(() => registry.resolve("atlas.chat.default"), /Live deployment profile is not ready/);
  const unavailable = createRouteRegistry([route()], "live", new Set());
  assert.equal(unavailable.ready, false);
  assert.throws(() => unavailable.resolve("atlas.chat.default"), /No enabled qualified route/);
});

test("pinned route identity must match an available adapter and configured model", () => {
  const models = { structuredModel: "mistral-large-3-25-12", chatModel: "mistral-small-4-0-26-03", ocrModel: "mistral-ocr-4-1" };
  assert.doesNotThrow(() => assertRouteAdapter(route(), models));
  assert.throws(() => assertRouteAdapter(route({ providerId: "unknown" }), models), /unavailable adapter/);
  assert.throws(() => assertRouteAdapter(route({ adapterVersion: "mistral-adapter-latest" }), models), /unavailable adapter version/);
  assert.throws(() => assertRouteAdapter(route({ modelOrProcessorId: "mistral-small-latest" }), models), /does not match pinned adapter configuration/);
});

test("the distinct Anoman semantic adapter is pinned but cannot activate before its live qualification", () => {
  const anoman = route({ routeId: "anoman-semantic-extract-v1", capability: "atlas.semantic.extract", providerId: "anoman", modelOrProcessorId: "gemini-2.5-flash", adapterVersion: "anoman-adapter-v1", enabled: false });
  assert.doesNotThrow(() => assertAnomanRouteAdapter(anoman, "gemini-2.5-flash"));
  assert.throws(() => assertAnomanRouteAdapter({ ...anoman, enabled: true }, "gemini-2.5-flash"), /before BSS-V2-004-03-06 qualification/u);
  assert.throws(() => assertAnomanRouteAdapter({ ...anoman, modelOrProcessorId: "other" }, "gemini-2.5-flash"), /pinned Anoman semantic adapter/u);
  const registry = createRouteRegistry([anoman], "development", new Set(["anoman"]));
  assert.throws(() => registry.resolve("atlas.semantic.extract"), /No enabled qualified route/u);
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
  assert.match(compose, /DOCLING_OPTION_PROFILE:\s*atlas-digital-pdf-run-003-capture-v1/u);
  assert.equal((compose.match(/AGENTS_BRIDGE_QUALIFIED_ROUTES:\s*\*docling-qualified-route/gu) ?? []).length, 2);
  assert.equal(compose.includes("AGENTS_BRIDGE_QUALIFICATION_ONLY"), false);
  assert.equal(compose.includes("atlas-digital-pdf-no-ocr-v1"), false);
});

test("normal RUN-003 admission permits only its exact pinned route identity", () => {
  const run003 = route({
    routeId: "docling-run-003-capture",
    capability: "atlas.document.perceive",
    providerId: "docling",
    modelOrProcessorId: "docling-slim-2.132.0",
    adapterVersion: "docling-serve-adapter-v1",
    qualificationVersion: "idser-012-01-03-02-local",
    qualificationRef: "qualification://idser-012-01-03-02-local",
    workClass: "local_processor",
    extensions: { serviceVersion: "1.36.0", optionProfile: "atlas-digital-pdf-run-003-capture-v1", capabilityIdentity: "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1", imageDigest: "sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7" },
  });
  const config = { mistral: { structuredModel: "s", chatModel: "c", ocrModel: "o" }, gemini: { structuredModel: "s", chatModel: "c", perceptionModel: "p" }, anoman: { structuredModel: "gemini-2.5-flash" as const }, docling: { serviceVersion: "1.36.0", doclingSlimVersion: "2.132.0", optionProfile: "atlas-digital-pdf-run-003-capture-v1" } };
  assert.doesNotThrow(() => assertConfiguredRouteAdapter(run003, config));
  assert.throws(() => assertConfiguredRouteAdapter({ ...run003, extensions: { ...run003.extensions, capabilityIdentity: "docling-digital-pdf" } }, config), /cache identity/u);
  assert.throws(() => assertConfiguredRouteAdapter({ ...run003, extensions: { ...run003.extensions, optionProfile: "atlas-digital-pdf-no-ocr-v1" } }, config), /cache identity/u);
});

test("interactive route selection comes from the server capability mapping, not caller vendor fields", async () => {
  let selected = "";
  let sentModel = "";
  const runtime = new QualifiedRouteRuntime((capability) => {
    selected = capability;
    return { capability, providerId: "mistral" };
  }, {
    async *streamChat(input) {
      sentModel = String((input as unknown as Record<string, unknown>).model ?? "");
      yield { type: "complete", provenance: { provider: "mistral", model: "server-model", endpoint: "https://provider.invalid", latencyMilliseconds: 1, attempt: 1 } };
    },
  });
  const events = [];
  for await (const event of runtime.execute({
    version: "v1", executionId: "run", mode: "interactive", skill: { id: "atlas.chat.default", version: "1" },
    input: { prompt: "hello", provider: "attacker", model: "attacker-model", endpoint: "https://attacker.invalid" }, context: { boundary: "workspace:w", items: [] },
  }, { signal: new AbortController().signal })) events.push(event);
  assert.equal(selected, "atlas.chat.default");
  assert.equal(sentModel, "");
  assert.deepEqual(events, [{ type: "complete" }]);
});

test("a development profile without a live route returns unavailable instead of a test response", async () => {
  const registry = createRouteRegistry([], "development", new Set());
  let providerCalls = 0;
  const runtime = new QualifiedRouteRuntime((capability) => registry.resolve(capability), {
    async *streamChat() { providerCalls += 1; yield { type: "complete", provenance: { provider: "mistral", model: "unused", endpoint: "unused", latencyMilliseconds: 0, attempt: 1 } }; },
  });
  const events = [];
  for await (const event of runtime.execute({
    version: "v1", executionId: "run", mode: "interactive", skill: { id: "atlas.chat.default", version: "1" },
    input: { prompt: "hello" }, context: { boundary: "workspace:w", items: [] },
  }, { signal: new AbortController().signal })) events.push(event);
  assert.deepEqual(events, [{ type: "error", code: "provider_unavailable", message: "No enabled qualified route is available for atlas.chat.default." }]);
  assert.equal(providerCalls, 0);
});
