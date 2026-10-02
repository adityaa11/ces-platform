import { rm, writeFile } from "node:fs/promises";
import { createMistralCapabilities } from "./providers/mistral.js";
import { createGeminiCapabilities } from "./providers/gemini.js";
import { QualifiedRouteRuntime, TestRuntime } from "./runtime.js";
import { loadWorkerConfig } from "./worker-config.js";
import { createBackgroundWorker } from "./worker.js";
import { createAtlasPerceptionClients, loadAtlasPerceptionClientConfig } from "./atlas-perception-client.js";
import { runDocumentPerception } from "./document-perception-worker.js";
import { createPerceptionResultReplay } from "./perception-result-replay.js";
import { loadBridgeConfig } from "./config.js";
import { createAtlasSemanticClient, loadAtlasSemanticClientConfig } from "./atlas-semantic-client.js";
import { createSemanticResultReplay } from "./semantic-result-replay.js";
import { runSemanticJob } from "./semantic-worker.js";
import { assertConfiguredRouteAdapter, capabilityForSkill, createRouteRegistry } from "./route-registry.js";

const readinessPath = "/tmp/agents-bridge-worker.ready";
// A container can be restarted without its writable layer being discarded.
// Remove an earlier marker before the asynchronous broker startup begins.
await rm(readinessPath, { force: true });
const clients = createAtlasPerceptionClients(loadAtlasPerceptionClientConfig());
const config = loadBridgeConfig();
const availableAdapters = new Set<string>();
if (config.mistral.apiKey) availableAdapters.add("mistral");
if (config.gemini.apiKey) availableAdapters.add("gemini");
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, availableAdapters);
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertConfiguredRouteAdapter(route, config);
if (config.deploymentProfile === "live" && !registry.ready) throw new Error("Agents Bridge worker live deployment profile is not ready.");
const mistral = createMistralCapabilities(config.mistral);
const gemini = createGeminiCapabilities(config.gemini);
const capabilities = { mistral, gemini };
const semanticClient = createAtlasSemanticClient(loadAtlasSemanticClientConfig());
const runtime = config.deploymentProfile === "test" ? new TestRuntime() : new QualifiedRouteRuntime((capability) => registry.resolve(capability), { mistral: mistral.streaming, gemini: gemini.streaming });
const worker = createBackgroundWorker(loadWorkerConfig(), runtime, undefined, async (request, signal, context) => {
  const route = registry.resolve("atlas.document.perceive");
  assertConfiguredRouteAdapter(route, config);
  const store = createPerceptionResultReplay(context.database);
  await runDocumentPerception(request, capabilities[route.providerId as "mistral" | "gemini"].perception, clients.source, clients.results, signal, { idempotencyKey: context.idempotencyKey, store, finalAttempt: context.finalAttempt });
}, undefined, async (job, signal, context) => {
  const route = registry.resolve(capabilityForSkill(job.skill.id));
  assertConfiguredRouteAdapter(route, config);
  await runSemanticJob(job, capabilities[route.providerId as "mistral" | "gemini"].structured, semanticClient, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
});
await worker.start();
await writeFile(readinessPath, "ready\n");

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  await rm(readinessPath, { force: true });
  await worker.stop();
  process.exit(0);
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
