import { readFile, rm, writeFile } from "node:fs/promises";
import { createMistralCapabilities } from "./providers/mistral.js";
import { createGeminiCapabilities } from "./providers/gemini.js";
import { createAnomanCapabilities } from "./providers/anoman.js";
import { DoclingProvider } from "./providers/docling.js";
import { QualifiedRouteRuntime, TestRuntime } from "./runtime.js";
import { loadWorkerConfig } from "./worker-config.js";
import { createAtlasPerceptionClients, loadAtlasPerceptionClientConfig } from "./atlas-perception-client.js";
import { runDocumentPerception } from "./document-perception-worker.js";
import { createPerceptionResultReplay } from "./perception-result-replay.js";
import { loadBridgeConfig } from "./config.js";
import { createAtlasSemanticClient, loadAtlasSemanticClientConfig } from "./atlas-semantic-client.js";
import { createSemanticResultReplay } from "./semantic-result-replay.js";
import { runSemanticJob } from "./semantic-worker.js";
import { assertConfiguredRouteAdapter, capabilityForSkill, createRouteRegistry } from "./route-registry.js";
import type { ProviderAdmittedPayloadAdapter, ProviderOutboundTransport } from "./provider-operational-runtime.js";
import { createProductionBridgeWorker } from "./production-worker-composition.js";
import { PostgresAcceptedSemanticBatchPlanDocumentResolver } from "@atlas/db";
import { createCapacityPlanningSnapshotReader } from "./capacity-planning-snapshot.js";
import { createIdserCapacityPlanningSnapshotV2ProductionComposition } from "./idser-capacity-planning-snapshot-v2-composition.js";
import { runSemanticBatchPlanJob } from "./idser-semantic-batch-plan-job.js";

const readinessPath = "/tmp/agents-bridge-worker.ready";
// A container can be restarted without its writable layer being discarded.
// Remove an earlier marker before the asynchronous broker startup begins.
await rm(readinessPath, { force: true });
const clients = createAtlasPerceptionClients(loadAtlasPerceptionClientConfig());
const config = loadBridgeConfig();
const availableAdapters = new Set<string>();
if (config.mistral.apiKey) availableAdapters.add("mistral");
if (config.gemini.apiKey) availableAdapters.add("gemini");
if (config.anoman.apiKey) availableAdapters.add("anoman");
if (config.qualifiedRoutes.some((route) => route.enabled && route.providerId === "docling")) availableAdapters.add("docling");
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, availableAdapters);
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertConfiguredRouteAdapter(route, config);
if (config.deploymentProfile === "live" && !registry.ready) throw new Error("Agents Bridge worker live deployment profile is not ready.");
const mistral = createMistralCapabilities(config.mistral);
const gemini = createGeminiCapabilities(config.gemini);
const anoman = createAnomanCapabilities(config.anoman);
const docling = new DoclingProvider(config.docling);
const capabilities = { mistral, gemini, anoman, docling: { perception: docling } };
if (config.qualifiedRoutes.some((route) => route.enabled && route.providerId === "docling")) {
  // This repository-owned, non-confidential PDF initializes precisely the
  // fixed no-OCR request profile before the worker publishes its ready marker.
  const warmupPath = process.env.DOCLING_WARMUP_PDF_PATH ?? "docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf";
  const warmupBytes = new Uint8Array(await readFile(warmupPath));
  await docling.perceive({ bytes: warmupBytes, mimeType: "application/pdf" }, new AbortController().signal);
}
const semanticClient = createAtlasSemanticClient(loadAtlasSemanticClientConfig());
const runtime = config.deploymentProfile === "test" ? new TestRuntime() : new QualifiedRouteRuntime((capability) => registry.resolve(capability), { mistral: mistral.streaming, gemini: gemini.streaming });
// This vertical slice owns the durable claim and feedback boundary, but not a
// provider-specific payload contract. Keep the production port fail-closed
// until a later ticket supplies that separately-qualified transport; tests
// replace only this port to exercise the real worker composition.
const providerOutboundTransport: ProviderOutboundTransport = async () => {
  throw new Error("No qualified provider outbound transport is configured for the admitted-execution slice.");
};
const providerPayloadAdapter: ProviderAdmittedPayloadAdapter = {
  hydrate: async () => { throw new Error("No qualified provider-work payload adapter is configured for the admitted-execution slice."); },
};
const semanticBatchPlan = config.semanticBatchPlanPlanning && config.capacityPlanningSnapshot
  ? async (handoffId: string, database: { executeSql(statement: string, values?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> }) => {
    const databaseAdapter = { executeSql: database.executeSql.bind(database) };
    const snapshotReader = createCapacityPlanningSnapshotReader(databaseAdapter, { authenticate: (credential) => config.capacityPlanningSnapshot?.bindings.find((binding) => binding.credential === credential) ?? null });
    const capacityConsumer = createIdserCapacityPlanningSnapshotV2ProductionComposition({ reader: snapshotReader, bindings: config.capacityPlanningSnapshot.bindings });
    if (!capacityConsumer) throw new Error("IDSER semantic batch-planning capacity consumer is unavailable.");
    const resolver = new PostgresAcceptedSemanticBatchPlanDocumentResolver({ unsafe: async (statement, values) => (await database.executeSql(statement, values)).rows as Record<string, unknown>[] });
    await runSemanticBatchPlanJob({ database, handoffId, planning: { acceptedDocumentResolver: resolver, estimatorConfiguration: config.semanticBatchPlanPlanning!.estimatorConfiguration, capacityConsumer } });
  }
  : undefined;
const worker = createProductionBridgeWorker({ config: loadWorkerConfig(), runtime, documentPerception: async (request, signal, context) => {
  const route = registry.resolve("atlas.document.perceive");
  assertConfiguredRouteAdapter(route, config);
  const store = createPerceptionResultReplay(context.database);
  await runDocumentPerception(request, capabilities[route.providerId as "mistral" | "gemini" | "docling"].perception, clients.source, clients.results, signal, { idempotencyKey: context.idempotencyKey, store, finalAttempt: context.finalAttempt });
}, semantic: async (job, signal, context) => {
  const route = registry.resolve(capabilityForSkill(job.skill.id));
  assertConfiguredRouteAdapter(route, config);
  const stepwise = job.skill.id !== "atlas.semantic.extract" ? undefined : {
    dependencies: {
      database: context.database,
      routes: [{ version: "v1" as const, routeId: route.routeId, profileId: "atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0", profileVersion: route.qualificationVersion, maxPromptBytes: 1024 * 1024, maxDeadlineMilliseconds: 30_000, imageTpm: { state: "unknown" as const } }],
      routeId: route.routeId,
      profileId: "atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0",
      deadlineEpochMilliseconds: context.deadlineEpochMilliseconds,
    },
  };
  await runSemanticJob(job, capabilities[route.providerId as "mistral" | "gemini" | "anoman"].structured, semanticClient, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration }, undefined, stepwise);
}, providerOutboundTransport, providerPayloadAdapter, genericHandoffHttpTransport: config.genericHandoffHttpTransport, semanticBatchPlan });
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
