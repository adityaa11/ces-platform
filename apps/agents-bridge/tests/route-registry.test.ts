import assert from "node:assert/strict";
import test from "node:test";
import { assertRouteAdapter, createRouteRegistry, parseDeploymentProfile, parseQualifiedRoutes, RouteResolutionError, type QualifiedRoute } from "../src/route-registry.ts";
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
