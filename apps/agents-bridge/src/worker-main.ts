import { readFile, rm, writeFile } from "node:fs/promises";
import { DoclingProvider } from "./providers/docling.js";
import { loadWorkerConfig } from "./worker-config.js";
import { createAtlasPerceptionClients, loadAtlasPerceptionClientConfig } from "./atlas-perception-client.js";
import { runDocumentPerception } from "./document-perception-worker.js";
import { createPerceptionResultReplay } from "./perception-result-replay.js";
import { loadBridgeConfig } from "./config.js";
import { assertConfiguredRouteAdapter, createRouteRegistry } from "./route-registry.js";
import { createProductionBridgeWorker } from "./production-worker-composition.js";

const readinessPath = "/tmp/agents-bridge-worker.ready";
// A container can be restarted without its writable layer being discarded.
// Remove an earlier marker before the asynchronous broker startup begins.
await rm(readinessPath, { force: true });
const clients = createAtlasPerceptionClients(loadAtlasPerceptionClientConfig());
const config = loadBridgeConfig();
const availableAdapters = new Set<string>();
if (config.qualifiedRoutes.some((route) => route.enabled && route.providerId === "docling")) availableAdapters.add("docling");
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, availableAdapters);
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertConfiguredRouteAdapter(route, config);
if (config.deploymentProfile === "live" && !registry.ready) throw new Error("Agents Bridge worker live deployment profile is not ready.");
const docling = new DoclingProvider(config.docling);
if (config.qualifiedRoutes.some((route) => route.enabled && route.providerId === "docling")) {
  // This repository-owned, non-confidential PDF initializes precisely the
  // fixed no-OCR request profile before the worker publishes its ready marker.
  const warmupPath = process.env.DOCLING_WARMUP_PDF_PATH ?? "docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf";
  const warmupBytes = new Uint8Array(await readFile(warmupPath));
  await docling.perceive({ bytes: warmupBytes, mimeType: "application/pdf" }, new AbortController().signal);
}
const worker = createProductionBridgeWorker({ config: loadWorkerConfig(), documentPerception: async (request, signal, context) => {
  const route = registry.resolve("atlas.document.perceive");
  assertConfiguredRouteAdapter(route, config);
  if (route.providerId !== "docling") throw new Error("The active perception route must use Docling.");
  const store = createPerceptionResultReplay(context.database);
  await runDocumentPerception(request, docling, clients.source, clients.results, signal, { idempotencyKey: context.idempotencyKey, store, finalAttempt: context.finalAttempt });
}, genericHandoffHttpTransport: config.genericHandoffHttpTransport });
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
