import { rm, writeFile } from "node:fs/promises";
import { MistralProvider } from "./providers/mistral.js";
import { TestRuntime } from "./runtime.js";
import { loadWorkerConfig } from "./worker-config.js";
import { createBackgroundWorker } from "./worker.js";
import { createAtlasPerceptionClients, loadAtlasPerceptionClientConfig } from "./atlas-perception-client.js";
import { runDocumentPerception } from "./document-perception-worker.js";
import { createPerceptionResultReplay } from "./perception-result-replay.js";
import { loadBridgeConfig } from "./config.js";
import { createAtlasSemanticClient, loadAtlasSemanticClientConfig } from "./atlas-semantic-client.js";
import { createSemanticResultReplay } from "./semantic-result-replay.js";
import { runSemanticJob } from "./semantic-worker.js";

const readinessPath = "/tmp/agents-bridge-worker.ready";
// A container can be restarted without its writable layer being discarded.
// Remove an earlier marker before the asynchronous broker startup begins.
await rm(readinessPath, { force: true });
const clients = createAtlasPerceptionClients(loadAtlasPerceptionClientConfig());
const provider = new MistralProvider(loadBridgeConfig().mistral);
const semanticClient = createAtlasSemanticClient(loadAtlasSemanticClientConfig());
const worker = createBackgroundWorker(loadWorkerConfig(), new TestRuntime(), undefined, async (request, signal, context) => {
  const store = createPerceptionResultReplay(context.database);
  await runDocumentPerception(request, provider, clients.source, clients.results, signal, { idempotencyKey: context.idempotencyKey, store });
}, undefined, async (job, signal, context) => {
  await runSemanticJob(job, provider, semanticClient, createSemanticResultReplay(context.database), context.idempotencyKey, signal);
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
