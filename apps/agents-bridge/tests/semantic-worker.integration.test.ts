import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import test from "node:test";
import Fastify from "fastify";
import postgres from "postgres";
import { createSemanticInternalRoutes } from "@atlas/core";
import { PostgresSemanticAuthority } from "@atlas/db";
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
    const result = await reply("context", request.headers.authorization, request.body);
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  atlasApp.post("/internal/semantic/result", async (request, response) => {
    const executionId = (request.body as { scope?: { executionId?: string } })?.scope?.executionId;
    if (executionId === executions.outage && deliveryOutage) {
      deliveryOutage = false;
      return response.code(503).send({ error: "synthetic result delivery outage" });
    }
    if (executionId === executions.timeout && deliveryTimeout) {
      deliveryTimeout = false;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return response.code(503).send({ error: "synthetic result delivery timeout" });
    }
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
  mistralApp.post("/v1/chat/completions", async (request) => {
    const body = request.body as { messages?: Array<{ content?: string }>; response_format?: { json_schema?: { schema?: Record<string, unknown> } } };
    providerCallCount += 1;
    const schema = body.response_format?.json_schema?.schema;
    const reconciliation = Boolean(schema?.properties && "relationships" in schema.properties);
    const value = reconciliation
      ? { version: "v1", relationships: [], questions: [] }
      : { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] };
    return { model: "semantic-integration-model", choices: [{ message: { content: JSON.stringify(value) } }] };
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
    const provider = new MistralProvider({ apiKey: "synthetic-provider-key", baseUrl: `http://127.0.0.1:${mistralPort}`, structuredModel: "semantic-integration-model", chatModel: "unused", ocrModel: "unused", maxDocumentBytes: 1, zeroDataRetentionApproved: false, timeoutMilliseconds: 2_000, retryMaxAttempts: 1 });
    const client = createAtlasSemanticClient({ baseUrl: `http://127.0.0.1:${atlasPort}`, contextPath: "/internal/semantic/context", resultPath: "/internal/semantic/result", failurePath: "/internal/semantic/failure", serviceCredential: credential, timeoutMilliseconds: 100 });
    const config: WorkerConfig = { databaseUrl: bridgeUrl.toString(), concurrency: 1, timeoutSeconds: 5, retryLimit: 3, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 };
    worker = createBackgroundWorker(config, new TestRuntime(), queueName, undefined, undefined, async (job, signal, context) => {
      await runSemanticJob(job, provider, client, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
    });
    await worker.start();
    const enqueue = async (label: keyof typeof executions, skill: "atlas.semantic.extract" | "atlas.semantic.reconcile") => worker!.boss.send(queueName, { idempotencyKey: keys[label], execution: { version: "v1", executionId: executions[label], mode: "background", skill: { id: skill, version: "v1" }, input: { contextCapability: capability }, context: { boundary: "semantic-worker-integration", items: [] } } }, { singletonKey: `${keys[label]}-${randomUUID()}` });

    await enqueue("extract", "atlas.semantic.extract");
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
    await bridge.unsafe("DELETE FROM bridge.semantic_result_delivery WHERE idempotency_key = ANY($1::text[])", [Object.values(keys)]).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key = ANY($1::text[])", [Object.values(keys)]).catch(() => undefined);
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
