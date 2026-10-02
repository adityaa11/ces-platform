import { createBridgeApp } from "./app.js";
import { loadBridgeConfig } from "./config.js";
import { createMistralCapabilities } from "./providers/mistral.js";
import { QualifiedRouteRuntime, TestRuntime } from "./runtime.js";
import { assertRouteAdapter, createRouteRegistry } from "./route-registry.js";

const config = loadBridgeConfig();
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, config.mistral.apiKey ? new Set(["mistral"]) : new Set());
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertRouteAdapter(route, config.mistral);
const runtime = config.deploymentProfile === "test"
  ? new TestRuntime()
  : new QualifiedRouteRuntime((capability) => registry.resolve(capability), createMistralCapabilities(config.mistral).streaming);
const app = createBridgeApp({ runtime, version: config.version, ready: () => registry.ready });
const stop = async () => { await app.close(); process.exit(0); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await app.listen({ host: config.host, port: config.port });
