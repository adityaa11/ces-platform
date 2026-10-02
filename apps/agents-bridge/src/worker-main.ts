import { rm, writeFile } from "node:fs/promises";
import { createMistralCapabilities } from "./providers/mistral.js";
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
import { assertRouteAdapter, capabilityForSkill, createRouteRegistry } from "./route-registry.js";

const readinessPath = "/tmp/agents-bridge-worker.ready";
// A container can be restarted without its writable layer being discarded.
// Remove an earlier marker before the asynchronous broker startup begins.
await rm(readinessPath, { force: true });
const clients = createAtlasPerceptionClients(loadAtlasPerceptionClientConfig());
const config = loadBridgeConfig();
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, config.mistral.apiKey ? new Set(["mistral"]) : new Set());
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertRouteAdapter(route, config.mistral);
if (config.deploymentProfile === "live" && !registry.ready) throw new Error("Agents Bridge worker live deployment profile is not ready.");
const capabilities = createMistralCapabilities(config.mistral);
const semanticClient = createAtlasSemanticClient(loadAtlasSemanticClientConfig());
const runtime = config.deploymentProfile === "test" ? new TestRuntime() : new QualifiedRouteRuntime((capability) => registry.resolve(capability), capabilities.streaming);
const worker = createBackgroundWorker(loadWorkerConfig(), runtime, undefined, async (request, signal, context) => {
  const route = registry.resolve("atlas.document.perceive");
  assertRouteAdapter(route, config.mistral);
  const store = createPerceptionResultReplay(context.database);
  await runDocumentPerception(request, capabilities.perception, clients.source, clients.results, signal, { idempotencyKey: context.idempotencyKey, store, finalAttempt: context.finalAttempt });
}, undefined, async (job, signal, context) => {
  const route = registry.resolve(capabilityForSkill(job.skill.id));
  assertRouteAdapter(route, config.mistral);
  await runSemanticJob(job, capabilities.structured, semanticClient, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
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
