import { createBridgeApp } from "./app.js";
import { loadBridgeConfig } from "./config.js";
import { assertConfiguredRouteAdapter, createRouteRegistry } from "./route-registry.js";

const config = loadBridgeConfig();
const availableAdapters = new Set<string>();
if (config.qualifiedRoutes.some((route) => route.enabled && route.providerId === "docling")) availableAdapters.add("docling");
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, availableAdapters);
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertConfiguredRouteAdapter(route, config);
const app = createBridgeApp({ version: config.version, ready: () => registry.ready, genericHandoffHttpTransport: config.genericHandoffHttpTransport });
const stop = async () => { await app.close(); process.exit(0); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await app.listen({ host: config.host, port: config.port });
