import { createBridgeApp } from "./app.js";
import { loadBridgeConfig } from "./config.js";
import { createMistralCapabilities } from "./providers/mistral.js";
import { createGeminiCapabilities } from "./providers/gemini.js";
import { QualifiedRouteRuntime, TestRuntime } from "./runtime.js";
import { assertConfiguredRouteAdapter, createRouteRegistry } from "./route-registry.js";

const config = loadBridgeConfig();
const availableAdapters = new Set<string>();
if (config.mistral.apiKey) availableAdapters.add("mistral");
if (config.gemini.apiKey) availableAdapters.add("gemini");
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, availableAdapters);
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertConfiguredRouteAdapter(route, config);
const mistral = createMistralCapabilities(config.mistral);
const gemini = createGeminiCapabilities(config.gemini);
const runtime = config.deploymentProfile === "test"
  ? new TestRuntime()
  : new QualifiedRouteRuntime((capability) => registry.resolve(capability), { mistral: mistral.streaming, gemini: gemini.streaming });
const app = createBridgeApp({ runtime, version: config.version, ready: () => registry.ready });
const stop = async () => { await app.close(); process.exit(0); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await app.listen({ host: config.host, port: config.port });
