import { createBridgeApp } from "./app.js";
import { loadBridgeConfig } from "./config.js";
import { createMistralCapabilities } from "./providers/mistral.js";
import { createGeminiCapabilities } from "./providers/gemini.js";
import { QualifiedRouteRuntime, TestRuntime } from "./runtime.js";
import { assertConfiguredRouteAdapter, createRouteRegistry } from "./route-registry.js";
import postgres from "postgres";
import { createRuntimeCapacityConstraintReader } from "./runtime-capacity-constraint.js";
import { createProviderWorkAdmissionService } from "./provider-work-admission.js";
import { createCapacityPlanningSnapshotReader } from "./capacity-planning-snapshot.js";
import { createIdserCapacityPlanningSnapshotV2ProductionComposition } from "./idser-capacity-planning-snapshot-v2-composition.js";
import { createPostgresSemanticBatchPlanAcceptanceStore } from "./idser-semantic-batch-plan-job.js";

const config = loadBridgeConfig();
const availableAdapters = new Set<string>();
if (config.mistral.apiKey) availableAdapters.add("mistral");
if (config.gemini.apiKey) availableAdapters.add("gemini");
if (config.anoman.apiKey) availableAdapters.add("anoman");
if (config.qualifiedRoutes.some((route) => route.enabled && route.providerId === "docling")) availableAdapters.add("docling");
const registry = createRouteRegistry(config.qualifiedRoutes, config.deploymentProfile, availableAdapters);
for (const route of config.qualifiedRoutes.filter((candidate) => candidate.enabled)) assertConfiguredRouteAdapter(route, config);
const mistral = createMistralCapabilities(config.mistral);
const gemini = createGeminiCapabilities(config.gemini);
const runtime = config.deploymentProfile === "test"
  ? new TestRuntime()
  : new QualifiedRouteRuntime((capability) => registry.resolve(capability), { mistral: mistral.streaming, gemini: gemini.streaming });
const capacityReadDatabaseUrl = config.runtimeCapacityConstraint?.databaseUrl ?? config.capacityPlanningSnapshot?.databaseUrl ?? config.semanticBatchPlanPlanning?.databaseUrl;
const runtimeConstraintDatabase = capacityReadDatabaseUrl ? postgres(capacityReadDatabaseUrl, { max: 2 }) : undefined;
const runtimeCapacityConstraintReader = config.runtimeCapacityConstraint && runtimeConstraintDatabase
  ? createRuntimeCapacityConstraintReader(
    { executeSql: async (statement, values) => ({ rows: await runtimeConstraintDatabase.unsafe(statement, values as never[]) }) },
    { authenticate: (credential) => config.runtimeCapacityConstraint?.bindings.find((binding) => binding.credential === credential) ?? null },
  )
  : undefined;
const capacityPlanningSnapshotReader = config.capacityPlanningSnapshot && runtimeConstraintDatabase
  ? createCapacityPlanningSnapshotReader(
    { executeSql: async (statement, values) => ({ rows: await runtimeConstraintDatabase.unsafe(statement, values as never[]) }) },
    { authenticate: (credential) => config.capacityPlanningSnapshot?.bindings.find((binding) => binding.credential === credential) ?? null },
  )
  : undefined;
const idserCapacityPlanningSnapshotV2Consumer = capacityPlanningSnapshotReader && config.capacityPlanningSnapshot
  ? createIdserCapacityPlanningSnapshotV2ProductionComposition({ reader: capacityPlanningSnapshotReader, bindings: config.capacityPlanningSnapshot.bindings })
  : undefined;
// The v2 binding is assembled at the production entrypoint but intentionally
// has no execution/activation sink in this ticket.
void idserCapacityPlanningSnapshotV2Consumer;
const providerWorkAdmissionService = config.runtimeCapacityConstraint && runtimeConstraintDatabase
  ? createProviderWorkAdmissionService(
    { executeSql: async (statement, values) => ({ rows: await runtimeConstraintDatabase.unsafe(statement, values as never[]) }) },
    { authenticate: (credential) => config.runtimeCapacityConstraint?.bindings.find((binding) => binding.credential === credential) ?? null },
  )
  : undefined;
const batchPlanAcceptance = config.semanticBatchPlanPlanning && runtimeConstraintDatabase
  ? createPostgresSemanticBatchPlanAcceptanceStore({ executeSql: async (statement, values) => ({ rows: await runtimeConstraintDatabase.unsafe(statement, values as never[]) }) })
  : undefined;
const app = createBridgeApp({ runtime, version: config.version, ready: () => registry.ready, runtimeCapacityConstraintReader, capacityPlanningSnapshotReader, providerWorkAdmissionService, batchPlanAcceptance, genericHandoffHttpTransport: config.genericHandoffHttpTransport });
const stop = async () => { await app.close(); await runtimeConstraintDatabase?.end(); process.exit(0); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await app.listen({ host: config.host, port: config.port });
