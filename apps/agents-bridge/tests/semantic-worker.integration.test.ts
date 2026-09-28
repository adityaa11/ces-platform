import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import test from "node:test";
import Fastify from "fastify";
import postgres from "postgres";
import { createSemanticInternalRoutes } from "@atlas/core";
import { PostgresSemanticAuthority } from "@atlas/db";
import { semanticLimits } from "@atlas/contracts";
import { MistralProvider } from "../src/providers/mistral.ts";
import { createAtlasSemanticClient } from "../src/atlas-semantic-client.ts";
import { createSemanticResultReplay } from "../src/semantic-result-replay.ts";
import { runSemanticJob } from "../src/semantic-worker.ts";
import { TestRuntime } from "../src/runtime.ts";
import { createBackgroundWorker } from "../src/worker.ts";
import type { WorkerConfig } from "../src/worker-config.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const credential = "semantic-integration-service-credential-32-bytes";
const capability = "semantic-integration-capability";
const capabilityFingerprint = createHash("sha256").update(JSON.stringify(capability)).digest("hex");

const waitFor = async (predicate: () => Promise<boolean>, label: string, timeoutMs = 30_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}.`);
};

const normalized = (executionId: string, documentId: string, sourceSha256: string) => ({
  version: "v1" as const,
  executionId,
  artifactId: documentId,
  sourceSha256,
  perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const },
  provider: { name: "test", processor: "test", executionId, processedAt: "2026-09-28T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }],
});

test("the production semantic worker uses pg-boss, Bridge replay, configured HTTP Mistral, and Atlas routes", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 4 });
  const bridge = postgres(bridgeUrl.toString(), { max: 4 });
  const suffix = randomUUID();
  const owner = `semantic-worker-owner-${suffix}`;
  const project = `semantic-worker-project-${suffix}`;
  const workspace = `semantic-worker-workspace-${suffix}`;
  const executions = {
    extract: `semantic-worker-extract-${suffix}`,
    unavailable: `semantic-worker-unavailable-${suffix}`,
    outage: `semantic-worker-outage-${suffix}`,
    timeout: `semantic-worker-timeout-${suffix}`,
    duplicate: `semantic-worker-duplicate-${suffix}`,
    rejected: `semantic-worker-rejected-${suffix}`,
    malformed: `semantic-worker-malformed-${suffix}`,
    schemaInvalid: `semantic-worker-schema-invalid-${suffix}`,
    providerTimeout: `semantic-worker-provider-timeout-${suffix}`,
    missingCredential: `semantic-worker-missing-credential-${suffix}`,
    requestBound: `semantic-worker-request-bound-${suffix}`,
    responseBound: `semantic-worker-response-bound-${suffix}`,
    contextBound: `semantic-worker-context-bound-${suffix}`,
    resultBound: `semantic-worker-result-bound-${suffix}`,
    cancellation: `semantic-worker-cancellation-${suffix}`,
    stopPostStage: `semantic-worker-stop-post-stage-${suffix}`,
    conflictWinner: `semantic-worker-conflict-winner-${suffix}`,
    conflictLoser: `semantic-worker-conflict-loser-${suffix}`,
  };
  const resources = Object.fromEntries(Object.keys(executions).map((label) => [label, {
    bundle: `semantic-worker-bundle-${label}-${suffix}`,
    document: `semantic-worker-document-${label}-${suffix}`,
    perception: `semantic-worker-perception-${label}-${suffix}`,
    cache: `semantic-worker-cache-${label}-${suffix}`,
    sourceSha256: createHash("sha256").update(`semantic-worker-source-${label}-${suffix}`).digest("hex"),
    capabilityIdentity: `semantic-worker-test-${label}`,
  }])) as Record<keyof typeof executions, { readonly bundle: string; readonly document: string; readonly perception: string; readonly cache: string; readonly sourceSha256: string; readonly capabilityIdentity: string }>;
  const keys = Object.fromEntries(Object.entries(executions).map(([label]) => [label, `semantic-worker-key-${label}-${suffix}`])) as Record<keyof typeof executions, string>;
  const conflictKey = `semantic-worker-conflict-key-${suffix}`;
  const queueName = `semantic-worker-integration-${suffix}`;
  const completionFault = `swc_${randomUUID().replace(/-/gu, "").slice(0, 16)}`;
  const cleanupFault = `swc_${randomUUID().replace(/-/gu, "").slice(0, 16)}`;
  const accepted = new Map<string, number>();
  const failed = new Map<string, number>();
  let providerCallCount = 0;
  let loseAcknowledgement = true;
  let handlerUnavailable = false;
  let deliveryOutage = true;
  let deliveryTimeout = true;
  let stopPostStageDelivery = true;
  let stopPostStageDeliveryStarted = false;
  let contextBoundRequests = 0;
  let resultDeliveryAttempts = 0;
  let cancellationProviderStarted = false;
  let conflictDeliveryUnavailable = true;
  const authority = new PostgresSemanticAuthority(atlas, {
    select: async (scope) => ({ version: "v1" as const, skill: "atlas.semantic.reconcile" as const, scope, currentCandidates: [], priorCandidates: [], selection: { policy: "semantic-worker-integration", overflow: false, selectedCount: 0 } }),
  });
  const routes = createSemanticInternalRoutes({
    serviceCredential: credential,
    authority,
    handler: {
      accept: async ({ executionId }) => {
        if (handlerUnavailable && executionId === executions.unavailable) throw new Error("synthetic acceptance handler unavailable");
        accepted.set(executionId, (accepted.get(executionId) ?? 0) + 1);
      },
    },
  });
  const atlasApp = Fastify();
  const reply = async (operation: "context" | "deliver" | "fail", authorization: string | undefined, body: unknown) => {
    const response = await routes[operation](authorization?.replace(/^Bearer /u, ""), body);
    return response;
  };
  atlasApp.post("/internal/semantic/context", async (request, response) => {
    const executionId = (request.body as { executionId?: string })?.executionId;
    if (executionId === executions.contextBound) {
      contextBoundRequests += 1;
      return response.code(200).type("application/json").send(`\"${"x".repeat(semanticLimits.contextBytes + 1)}\"`);
    }
    const result = await reply("context", request.headers.authorization, request.body);
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  atlasApp.post("/internal/semantic/result", async (request, response) => {
    const executionId = (request.body as { scope?: { executionId?: string } })?.scope?.executionId;
    if (executionId === executions.outage && deliveryOutage) {
      deliveryOutage = false;
      return response.code(503).send({ error: "synthetic result delivery outage" });
    }
    if (executionId === executions.conflictWinner && conflictDeliveryUnavailable) {
      return response.code(503).send({ error: "synthetic conflicting-stage delivery outage" });
    }
    if (executionId === executions.timeout && deliveryTimeout) {
      deliveryTimeout = false;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return response.code(503).send({ error: "synthetic result delivery timeout" });
    }
    if (executionId === executions.stopPostStage && stopPostStageDelivery) {
      stopPostStageDelivery = false;
      stopPostStageDeliveryStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    if (executionId === executions.resultBound) resultDeliveryAttempts += 1;
    const result = await reply("deliver", request.headers.authorization, request.body);
    if (executionId === executions.extract && loseAcknowledgement && result.status === 204) {
      loseAcknowledgement = false;
      return response.code(503).send({ error: "synthetic acknowledgement loss" });
    }
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  atlasApp.post("/internal/semantic/failure", async (request, response) => {
    const executionId = (request.body as { scope?: { executionId?: string } })?.scope?.executionId;
    if (executionId) failed.set(executionId, (failed.get(executionId) ?? 0) + 1);
    const result = await reply("fail", request.headers.authorization, request.body);
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  const mistralApp = Fastify();
  mistralApp.post("/v1/chat/completions", async (request, response) => {
    const body = request.body as { messages?: Array<{ content?: string }>; response_format?: { json_schema?: { schema?: Record<string, unknown> } } };
    providerCallCount += 1;
    const requested = JSON.parse(body.messages?.at(-1)?.content ?? "{}") as { scope?: { executionId?: string } };
    if (requested.scope?.executionId === executions.rejected) return response.code(401).send({ error: "credential rejected" });
    if (requested.scope?.executionId === executions.malformed) return { model: "semantic-integration-model", choices: [{ message: { content: "{" } }] };
    if (requested.scope?.executionId === executions.schemaInvalid) return { model: "semantic-integration-model", choices: [{ message: { content: JSON.stringify({ version: "v1", candidate_assertions: "not-an-array" }) } }] };
    if (requested.scope?.executionId === executions.providerTimeout) return response.code(504).send({ error: "synthetic provider timeout" });
    if (requested.scope?.executionId === executions.cancellation) {
      cancellationProviderStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    const schema = body.response_format?.json_schema?.schema;
    const reconciliation = Boolean(schema?.properties && "relationships" in schema.properties);
    const value = requested.scope?.executionId === executions.resultBound
      ? {
          version: "v1",
          candidate_assertions: Array.from({ length: 20 }, (_, index) => ({ local_candidate_id: `bound-${index}`, semantic_key: `bound-${index}`, kind: "rule", payload: "x".repeat(16_384), normalized_meaning: "y".repeat(8_000), needs_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: `bound-${index}`, excerpt: "z" }] })),
          source_statement_inventory: Array.from({ length: 20 }, (_, index) => ({ source_unit_id: `source-${index}`, page_number: 1, locator_type: "text_block", locator_id: `bound-${index}`, classification: "candidate", destination_local_candidate_ids: [`bound-${index}`] })),
          questions: [],
        }
      : reconciliation
      ? { version: "v1", relationships: [], questions: [] }
      : { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] };
    const usage = requested.scope?.executionId === executions.resultBound
      ? Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`usage-${index}`, "u".repeat(16_384)]))
      : undefined;
    return { model: "semantic-integration-model", ...(usage ? { usage } : {}), choices: [{ message: { content: JSON.stringify(value) } }] };
  });
  let worker: ReturnType<typeof createBackgroundWorker> | undefined;
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'semantic worker integration',$3)", [project, `semantic-worker-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
    for (const [label, executionId] of Object.entries(executions)) {
      const resource = resources[label as keyof typeof executions];
      const stage = label === "unavailable" ? "reconciliation" : "extraction";
      await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'semantic-worker.pdf','private/semantic-worker',$4,1,'application/pdf',$5)", [resource.document, project, workspace, resource.sourceSha256, owner]);
      await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [resource.bundle, project, workspace]);
      await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'pending',$5)", [resource.bundle, resource.document, project, workspace, resource.perception]);
      await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/semantic-worker',$3,'application/pdf',1,'v1','completed',$4,$5)", [resource.perception, resource.document, resource.sourceSha256, `semantic-worker-perception-key-${label}-${suffix}`, resource.capabilityIdentity]);
      await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb)", [resource.cache, resource.sourceSha256, resource.capabilityIdentity, JSON.stringify(normalized(resource.perception, resource.document, resource.sourceSha256))]);
      await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,$6,'v1','v1',$1,'queued','context',$7,now()+interval '1 hour')", [executionId, project, workspace, resource.bundle, resource.document, stage, capabilityFingerprint]);
    }
    await admin.unsafe(`CREATE SEQUENCE ${completionFault} START 1`);
    await admin.unsafe(`CREATE FUNCTION ${completionFault}_fn() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$ BEGIN IF NEW.status = 'completed' AND nextval('atlas.${completionFault}') = 1 THEN RAISE EXCEPTION 'synthetic completion acknowledgement loss'; END IF; RETURN NEW; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${completionFault}_trigger BEFORE UPDATE ON bridge.background_effects FOR EACH ROW EXECUTE FUNCTION ${completionFault}_fn()`);
    await admin.unsafe(`CREATE SEQUENCE ${cleanupFault} START 1`);
    await admin.unsafe(`CREATE FUNCTION ${cleanupFault}_fn() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$ BEGIN IF nextval('atlas.${cleanupFault}') = 1 THEN RAISE EXCEPTION 'synthetic fenced cleanup loss'; END IF; RETURN OLD; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${cleanupFault}_trigger BEFORE DELETE ON bridge.semantic_result_delivery FOR EACH ROW EXECUTE FUNCTION ${cleanupFault}_fn()`);
    await atlasApp.listen({ host: "127.0.0.1", port: 0 });
    await mistralApp.listen({ host: "127.0.0.1", port: 0 });
    const atlasPort = (atlasApp.server.address() as AddressInfo).port;
    const mistralPort = (mistralApp.server.address() as AddressInfo).port;
    const provider = new MistralProvider({ apiKey: "synthetic-provider-key", baseUrl: `http://127.0.0.1:${mistralPort}`, structuredModel: "semantic-integration-model", chatModel: "unused", ocrModel: "unused", maxDocumentBytes: 1, zeroDataRetentionApproved: false, timeoutMilliseconds: 10_000, retryMaxAttempts: 1 });
    const client = createAtlasSemanticClient({ baseUrl: `http://127.0.0.1:${atlasPort}`, contextPath: "/internal/semantic/context", resultPath: "/internal/semantic/result", failurePath: "/internal/semantic/failure", serviceCredential: credential, timeoutMilliseconds: 100 });
    const config: WorkerConfig = { databaseUrl: bridgeUrl.toString(), concurrency: 1, timeoutSeconds: 5, retryLimit: 3, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 };
    const createWorker = () => createBackgroundWorker(config, new TestRuntime(), queueName, undefined, undefined, async (job, signal, context) => {
      await runSemanticJob(job, provider, client, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
    });
    worker = createWorker();
    await worker.start();
    const enqueue = async (label: keyof typeof executions, skill: "atlas.semantic.extract" | "atlas.semantic.reconcile", idempotencyKey = keys[label]) => worker!.boss.send(queueName, { idempotencyKey, execution: { version: "v1", executionId: executions[label], mode: "background", skill: { id: skill, version: "v1" }, input: { contextCapability: capability }, context: { boundary: "semantic-worker-integration", items: [] } } }, { singletonKey: `${idempotencyKey}-${randomUUID()}` });

    await enqueue("extract", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.extract]))[0]?.status === "pending", "Atlas acceptance before completion restart boundary");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.extract]))[0]?.status === "completed", "extraction completion");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.extract]))[0]?.count === 0, "fenced replay cleanup");
    assert.equal(providerCallCount, 1, "acknowledgement loss, completion retry, and cleanup retry replay one immutable provider result");
    assert.equal(accepted.get(executions.extract), 1, "Atlas accepts one logical effect despite the lost acknowledgement");
    assert.ok(Number((await bridge.unsafe("SELECT lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [keys.extract]))[0]?.lease_generation) >= 2, "completion retry acquires a later fenced lease");
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.extract]))[0]?.lifecycle, "completed");

    handlerUnavailable = true;
    await enqueue("unavailable", "atlas.semantic.reconcile");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.unavailable]))[0]?.count === 1, "retryable unavailable handler replay");
    await waitFor(async () => providerCallCount === 2, "single provider call before retryable handler failure");
    assert.notEqual((await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.unavailable]))[0]?.status, "completed", "an unavailable Atlas acceptance handler cannot complete Bridge work");
    assert.notEqual((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.unavailable]))[0]?.lifecycle, "completed");
    handlerUnavailable = false;

    await bridge.unsafe("UPDATE bridge.background_effects SET status='running', lease_owner='expired-worker', lease_generation=lease_generation+1, lease_expires_at=now()-interval '1 second' WHERE idempotency_key=$1", [keys.unavailable]);
    await enqueue("unavailable", "atlas.semantic.reconcile");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.unavailable]))[0]?.status === "completed", "stale claimant delivery");
    assert.equal(providerCallCount, 2, "a real stale successor redelivers the stored winner without Mistral");
    assert.equal(accepted.get(executions.unavailable), 1, "the stored winner reaches one Atlas logical effect");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.unavailable]))[0]?.count, 0, "only the completed successor fence cleans the winner replay row");

    // A result delivery outage occurs after immutable staging. The subsequent
    // worker attempt must replay that exact envelope instead of failing it.
    await enqueue("outage", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.outage]))[0]?.count === 1, "durable replay after delivery outage");
    await worker.stop(); worker = createWorker(); await worker.start();
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.outage]))[0]?.status === "completed", "outage replay completion");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.outage]))[0]?.count === 0, "outage replay cleanup");
    assert.equal(accepted.get(executions.outage), 1, "delivery outage reaches one Atlas logical effect after replay");
    assert.equal(failed.get(executions.outage) ?? 0, 0, "a staged outage is never terminally failed");
    assert.equal(providerCallCount, 3, "delivery outage reuses one staged provider result");

    // This timeout reaches the post-stage delivery catch boundary. It is the
    // regression for preserving a durable envelope when Atlas transport cancels.
    await enqueue("timeout", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.timeout]))[0]?.count === 1, "durable replay after Atlas timeout");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.timeout]))[0]?.status === "completed", "timeout replay completion");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.timeout]))[0]?.count === 0, "timeout replay cleanup");
    assert.equal(accepted.get(executions.timeout), 1, "Atlas timeout reaches one logical effect after staged replay");
    assert.equal(failed.get(executions.timeout) ?? 0, 0, "a timed-out staged result is never terminally failed");
    assert.equal(providerCallCount, 4, "Atlas timeout reuses one staged provider result");

    // Separate duplicate queue messages share one Bridge idempotency record.
    await Promise.all([enqueue("duplicate", "atlas.semantic.extract"), enqueue("duplicate", "atlas.semantic.extract")]);
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.duplicate]))[0]?.status === "completed", "duplicate job completion");
    assert.equal(accepted.get(executions.duplicate), 1, "duplicate queue jobs create one Atlas logical effect");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.duplicate]))[0]?.count, 0, "duplicate completion leaves no replay row");
    assert.equal(providerCallCount, 5, "duplicate jobs invoke Mistral once for their shared execution");

    // Pre-stage provider failures use the real worker, HTTP adapter, Atlas
    // failure route, and Bridge effect ledger; none creates a trusted replay.
    for (const label of ["rejected", "malformed", "schemaInvalid", "providerTimeout"] as const) {
      await enqueue(label, "atlas.semantic.extract");
      await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions[label]]))[0]?.lifecycle === "failed", `${label} bounded Atlas failure`);
      assert.equal(accepted.get(executions[label]) ?? 0, 0, `${label} creates no accepted effect`);
      assert.equal(failed.get(executions[label]), 1, `${label} reaches one bounded failure handoff`);
      assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys[label]]))[0]?.count, 0, `${label} creates no trusted replay`);
      const effect = (await bridge.unsafe("SELECT status, last_error FROM bridge.background_effects WHERE idempotency_key=$1", [keys[label]]))[0];
      assert.equal(effect?.status, "completed", `${label} records one completed bounded failure effect`);
      assert.doesNotMatch(String(effect?.last_error ?? ""), /synthetic-provider-key|semantic-integration-capability|private\/semantic-worker/u);
    }

    const missingQueue = `${queueName}-missing`;
    const missingWorker = createBackgroundWorker(config, new TestRuntime(), missingQueue, undefined, undefined, async (job, signal, context) => {
      const missingProvider = new MistralProvider({ apiKey: undefined, baseUrl: `http://127.0.0.1:${mistralPort}`, structuredModel: "semantic-integration-model", chatModel: "unused", ocrModel: "unused", maxDocumentBytes: 1, zeroDataRetentionApproved: false, timeoutMilliseconds: 100, retryMaxAttempts: 1 });
      await runSemanticJob(job, missingProvider, client, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
    });
    try {
      await missingWorker.start();
      await missingWorker.boss.send(missingQueue, { idempotencyKey: keys.missingCredential, execution: { version: "v1", executionId: executions.missingCredential, mode: "background", skill: { id: "atlas.semantic.extract", version: "v1" }, input: { contextCapability: capability }, context: { boundary: "semantic-worker-integration", items: [] } } }, { singletonKey: `${keys.missingCredential}-${randomUUID()}` });
      await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.missingCredential]))[0]?.lifecycle === "failed", "missing credential bounded failure");
      assert.equal(accepted.get(executions.missingCredential) ?? 0, 0);
      assert.equal(failed.get(executions.missingCredential), 1);
      assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.missingCredential]))[0]?.count, 0);
    } finally { await missingWorker.stop().catch(() => undefined); }

    for (const [label, bounds] of [["requestBound", { maxRequestBytes: 1 }], ["responseBound", { maxResponseBytes: 1 }]] as const) {
      const boundedQueue = `${queueName}-${label}`;
      const boundedWorker = createBackgroundWorker(config, new TestRuntime(), boundedQueue, undefined, undefined, async (job, signal, context) => {
        const boundedProvider = new MistralProvider({ apiKey: "synthetic-provider-key", baseUrl: `http://127.0.0.1:${mistralPort}`, structuredModel: "semantic-integration-model", chatModel: "unused", ocrModel: "unused", maxDocumentBytes: 1, zeroDataRetentionApproved: false, timeoutMilliseconds: 100, retryMaxAttempts: 1, ...bounds });
        await runSemanticJob(job, boundedProvider, client, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
      });
      try {
        await boundedWorker.start();
        await boundedWorker.boss.send(boundedQueue, { idempotencyKey: keys[label], execution: { version: "v1", executionId: executions[label], mode: "background", skill: { id: "atlas.semantic.extract", version: "v1" }, input: { contextCapability: capability }, context: { boundary: "semantic-worker-integration", items: [] } } }, { singletonKey: `${keys[label]}-${randomUUID()}` });
        await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions[label]]))[0]?.lifecycle === "failed", `${label} bounded failure`);
        assert.equal(accepted.get(executions[label]) ?? 0, 0);
        assert.equal(failed.get(executions[label]), 1);
        assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys[label]]))[0]?.count, 0);
      } finally { await boundedWorker.stop().catch(() => undefined); }
    }

    // The context response is bounded by the real Atlas HTTP client before a
    // provider request or replay write can occur.
    await enqueue("contextBound", "atlas.semantic.extract");
    await waitFor(async () => contextBoundRequests > 0, "oversized Atlas context request");
    await waitFor(async () => Boolean((await bridge.unsafe("SELECT last_error FROM bridge.background_effects WHERE idempotency_key=$1", [keys.contextBound]))[0]?.last_error), "bounded context failure ledger entry");
    assert.equal(accepted.get(executions.contextBound) ?? 0, 0);
    assert.equal(failed.get(executions.contextBound) ?? 0, 0);
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.contextBound]))[0]?.count, 0);
    assert.doesNotMatch(String((await bridge.unsafe("SELECT last_error FROM bridge.background_effects WHERE idempotency_key=$1", [keys.contextBound]))[0]?.last_error ?? ""), /semantic-integration-capability|private\/semantic-worker|synthetic-provider-key/u);

    // A schema-valid result can still exceed the result-envelope transport
    // limit because provenance is preserved. It stages before the bounded
    // handoff rejects it, and remains immutable/retryable rather than being
    // converted into a terminal Atlas failure.
    const providerBeforeResultBound = providerCallCount;
    await enqueue("resultBound", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.resultBound]))[0]?.count === 1, "oversized immutable result replay");
    assert.equal(accepted.get(executions.resultBound) ?? 0, 0);
    assert.equal(failed.get(executions.resultBound) ?? 0, 0, "a staged oversized result is never terminally failed");
    assert.equal(providerCallCount, providerBeforeResultBound + 1, "the oversized retry retains one provider result");
    const oversizedEffect = (await bridge.unsafe("SELECT status, lease_owner, lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [keys.resultBound]))[0];
    assert.notEqual(oversizedEffect?.status, "completed", "Atlas transport rejection cannot complete the Bridge effect");
    assert.ok(Number(oversizedEffect?.lease_generation) >= 1, "the staged oversized result retains a fenced Bridge lease record");

    // Stopping a real worker while its configured provider request is active
    // must leave no trusted result. A successor is then free to retry.
    const providerBeforeCancellation = providerCallCount;
    await enqueue("cancellation", "atlas.semantic.extract");
    await waitFor(async () => cancellationProviderStarted, "in-flight semantic provider request");
    await worker.stop();
    // Observe the cancelled claimant before a successor can claim the job.
    // Starting the successor first would let it legitimately complete the
    // same execution and erase the pre-stage cancellation boundary.
    assert.equal(accepted.get(executions.cancellation) ?? 0, 0);
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.cancellation]))[0]?.count, 0);
    const cancellationEffect = (await bridge.unsafe("SELECT status, lease_owner, lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [keys.cancellation]))[0];
    assert.ok(cancellationEffect, "in-flight cancellation is represented in the Bridge lease ledger");
    assert.equal(cancellationEffect?.status, "pending", "pre-stage cancellation remains retryable rather than completing a trusted effect");
    assert.doesNotMatch(String((await bridge.unsafe("SELECT last_error FROM bridge.background_effects WHERE idempotency_key=$1", [keys.cancellation]))[0]?.last_error ?? ""), /semantic-integration-capability|private\/semantic-worker|synthetic-provider-key/u);
    worker = createWorker(); await worker.start();
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.cancellation]))[0]?.status === "completed", "fresh worker pre-stage retry");
    assert.equal(accepted.get(executions.cancellation), 1, "only the fresh worker may accept a pre-stage-cancelled execution");
    assert.ok(providerCallCount >= providerBeforeCancellation + 2, "pre-stage cancellation permits at-least-once provider execution by the fresh worker");

    // This stop happens while the real result route is in flight, after the
    // immutable replay row exists. The fresh worker must redeliver that row
    // rather than invoke Mistral a second time.
    const providerBeforePostStageStop = providerCallCount;
    await enqueue("stopPostStage", "atlas.semantic.extract");
    await waitFor(async () => stopPostStageDeliveryStarted && (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.stopPostStage]))[0]?.count === 1, "active post-stage delivery boundary");
    await worker.stop(); worker = createWorker(); await worker.start();
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.stopPostStage]))[0]?.status === "completed", "fresh worker post-stage replay completion");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.stopPostStage]))[0]?.count === 0, "fresh worker post-stage replay cleanup");
    assert.equal(providerCallCount, providerBeforePostStageStop + 1, "post-stage stop reuses the immutable provider result");
    assert.equal(accepted.get(executions.stopPostStage), 1, "post-stage stop creates one Atlas logical effect");

    // A second execution may not replace a staged winner that owns the same
    // Bridge idempotency identity. The real pg-boss path records the conflict
    // without a loser provider call or a stale cleanup of the winner.
    const callsBeforeConflict = providerCallCount;
    await enqueue("conflictWinner", "atlas.semantic.extract", conflictKey);
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [conflictKey]))[0]?.count === 1, "immutable conflicting-stage winner");
    const winner = (await bridge.unsafe("SELECT validated_envelope FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [conflictKey]))[0]?.validated_envelope;
    await enqueue("conflictLoser", "atlas.semantic.extract", conflictKey);
    await waitFor(async () => Boolean((await bridge.unsafe("SELECT last_error FROM bridge.background_effects WHERE idempotency_key=$1", [conflictKey]))[0]?.last_error), "conflicting idempotency rejection");
    assert.equal(providerCallCount, callsBeforeConflict + 1, "only the staged winner reaches Mistral");
    assert.deepEqual((await bridge.unsafe("SELECT validated_envelope FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [conflictKey]))[0]?.validated_envelope, winner, "the losing execution cannot replace the immutable envelope");
    assert.equal(accepted.get(executions.conflictLoser) ?? 0, 0, "the losing execution has no logical Atlas effect");
    conflictDeliveryUnavailable = false;
    await enqueue("conflictWinner", "atlas.semantic.extract", conflictKey);
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [conflictKey]))[0]?.status === "completed", "winner-only conflict recovery");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [conflictKey]))[0]?.count === 0, "winner-only conflict cleanup");
    assert.equal(accepted.get(executions.conflictWinner), 1, "only the immutable winner completes");
  } finally {
    await worker?.stop().catch(() => undefined);
    await atlasApp.close().catch(() => undefined);
    await mistralApp.close().catch(() => undefined);
    await admin.unsafe(`DROP TRIGGER IF EXISTS ${completionFault}_trigger ON bridge.background_effects`).catch(() => undefined);
    await admin.unsafe(`DROP FUNCTION IF EXISTS ${completionFault}_fn()`).catch(() => undefined);
    await admin.unsafe(`DROP SEQUENCE IF EXISTS ${completionFault}`).catch(() => undefined);
    await admin.unsafe(`DROP TRIGGER IF EXISTS ${cleanupFault}_trigger ON bridge.semantic_result_delivery`).catch(() => undefined);
    await admin.unsafe(`DROP FUNCTION IF EXISTS ${cleanupFault}_fn()`).catch(() => undefined);
    await admin.unsafe(`DROP SEQUENCE IF EXISTS ${cleanupFault}`).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.semantic_result_delivery WHERE idempotency_key = ANY($1::text[])", [[...Object.values(keys), conflictKey]]).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key = ANY($1::text[])", [[...Object.values(keys), conflictKey]]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.semantic_execution_context WHERE execution_id = ANY($1::text[])", [Object.values(executions)]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.semantic_execution WHERE id = ANY($1::text[])", [Object.values(executions)]).catch(() => undefined);
    for (const resource of Object.values(resources)) {
      await atlas.unsafe("DELETE FROM atlas.normalized_document_cache WHERE cache_key=$1", [resource.cache]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [resource.perception]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1", [resource.bundle]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1", [resource.bundle]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.document WHERE id=$1", [resource.document]).catch(() => undefined);
    }
    await atlas.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [workspace]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined);
    await Promise.all([admin.end(), atlas.end(), bridge.end()]);
  }
});
