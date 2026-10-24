import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Fastify from "fastify";
import postgres from "postgres";
import { PgBoss } from "pg-boss";
import { TestRuntime } from "../src/runtime.ts";
import { createBackgroundWorker } from "../src/worker.ts";
import { genericHandoffQueue } from "../src/queue.ts";
import { canonicalSemanticBatchPlanInputV1 } from "@atlas/db";
import { deliverGenericHandoffJob } from "../src/ghr/delivery-worker.ts";
import { createBridgeApp } from "../src/app.ts";

const databaseUrl = process.env.DATABASE_URL;
const enabled = process.env.GHR03B_REAL_E2E === "1";
const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const credential = "g".repeat(32);

async function startReceiver(options: Readonly<{ delayFirstAcknowledgementMilliseconds?: number }> = {}) {
  const app = createBridgeApp({
    runtime: new TestRuntime(),
    version: "ghr-04c-test",
    genericHandoffHttpTransport: { origin: "http://127.0.0.1:3002", credential, timeoutMilliseconds: 1_000, maximumResponseBytes: 8_192 },
  });
  let acknowledgements = 0;
  app.addHook("onSend", async (_request, reply, payload) => {
    if (reply.statusCode === 200) {
      acknowledgements += 1;
      if (acknowledgements === 1 && options.delayFirstAcknowledgementMilliseconds) {
        await pause(options.delayFirstAcknowledgementMilliseconds);
      }
    }
    return payload;
  });
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  return {
    configuration: { origin: `http://127.0.0.1:${address.port}`, credential, timeoutMilliseconds: 1_000, maximumResponseBytes: 8_192 },
    acknowledgements: () => acknowledgements,
    close: () => app.close(),
  };
}

async function startFaultReceiver(mode: "422" | "403" | "404" | "405" | "redirect" | "timeout" | "server_error" | "malformed_acknowledgement" | "mismatched_acknowledgement" | "oversized_acknowledgement") {
  const app = Fastify({ logger: false });
  app.post("/internal/semantic/batch-plan", async (_request, reply) => {
    if (mode === "422" || mode === "403" || mode === "404" || mode === "405" || mode === "server_error") {
      return reply.code(Number(mode)).send({ error: "transport_fault" });
    }
    if (mode === "redirect") return reply.code(302).header("location", "/untrusted").send();
    if (mode === "timeout") {
      await pause(100);
      return reply.code(200).send({ handoffId: "late", bodySha256: "late", disposition: "parsed_only" });
    }
    if (mode === "malformed_acknowledgement") return reply.code(200).type("application/json").send("{");
    if (mode === "mismatched_acknowledgement") return reply.code(200).send({ handoffId: "mismatched", bodySha256: "mismatched", disposition: "parsed_only" });
    return reply.code(200).header("content-length", "8193").type("application/json").send("{}".padEnd(8_193, " "));
  });
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  return {
    configuration: { origin: `http://127.0.0.1:${address.port}`, credential, timeoutMilliseconds: 25, maximumResponseBytes: 8_192 },
    close: () => app.close(),
  };
}

test("GHR-03B consumes the real pointer job through pg-boss and records one parsed-only receipt", { skip: !enabled || !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  let worker: ReturnType<typeof createBackgroundWorker> | undefined;
  const receiver = await startReceiver();
  try {
    const [selected] = await admin.unsafe(`
      SELECT intent.handoff_id, intent.trusted_header, intent.body_sha256, delivery.disposition,
        header.value #>> '{producer,executionId}' AS producer_execution_id,
        header.value #>> '{scope,projectId}' AS project_id,
        header.value #>> '{scope,workspaceId}' AS workspace_id,
        header.value #>> '{scope,bundleId}' AS bundle_id,
        header.value #>> '{scope,documentId}' AS document_id
      FROM atlas.generic_handoff_intent intent
      CROSS JOIN LATERAL (SELECT CASE WHEN jsonb_typeof(intent.trusted_header)='string' THEN (intent.trusted_header #>> '{}')::jsonb ELSE intent.trusted_header END AS value) header
      LEFT JOIN bridge.generic_handoff_delivery delivery ON delivery.handoff_id=intent.handoff_id
      WHERE intent.handoff_id LIKE 'ghr-handoff-v1-%'
      ORDER BY intent.created_at ASC LIMIT 1`);
    let candidate: any = selected;
    let createdCandidate = false;
    if (!candidate) {
      // A fresh local Compose database has no protected predecessor fixture.
      // Seed only the verified immutable persistence record and use pg-boss for
      // the actual worker entrypoint below; no receiver/parser shortcut exists.
      const handoffId = `ghr-handoff-v1-http-cutover-${randomUUID()}`;
      const payload = canonicalSemanticBatchPlanInputV1({ normalizedDocumentRef: "a".repeat(64), perceptionExecutionId: `execution-${handoffId}`, sourceSha256: "b".repeat(64), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: "c".repeat(64) });
      const body = `{"can_continue":false,"payload":${payload}}`;
      const bodySha256 = createHash("sha256").update(body).digest("hex");
      const header = {
        protocol: "GenericHandoffEnvelope/v1", handoffId, idempotencyKey: `key-${handoffId}`,
        producer: { processKey: "perception.acceptance", executionId: `execution-${handoffId}` },
        route: { main: "semantic", branch: "batch-plan", policyVersion: "v1", handlerVersion: "v1" },
        bodyContract: { type: "SemanticBatchPlanInput", version: "v1" },
        scope: { projectId: `project-${handoffId}`, workspaceId: `workspace-${handoffId}`, bundleId: `bundle-${handoffId}`, documentId: `document-${handoffId}` },
        correlation: { workflowId: `workflow-${handoffId}` }, integrity: { bodyEncoding: "canonical-json-v1", bodySha256 }, issuedAt: "2026-10-25T00:00:00.000Z",
      };
      await admin.unsafe("INSERT INTO atlas.generic_handoff_intent(handoff_id,idempotency_key,producer_execution_id,project_id,workspace_id,bundle_id,document_id,policy_version,handler_version,body_contract_type,body_contract_version,route_main,route_branch,can_continue,body_encoding,body_bytes,body_sha256,trusted_header,issued_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'v1','v1','SemanticBatchPlanInput','v1','semantic','batch-plan',false,'canonical-json-v1',$8,$9,$10::jsonb,now())", [handoffId, header.idempotencyKey, header.producer.executionId, header.scope.projectId, header.scope.workspaceId, header.scope.bundleId, header.scope.documentId, Buffer.from(body), bodySha256, JSON.stringify(header)]);
      candidate = { handoff_id: handoffId, body_sha256: bodySha256, producer_execution_id: header.producer.executionId, project_id: header.scope.projectId, workspace_id: header.scope.workspaceId, bundle_id: header.scope.bundleId, document_id: header.scope.documentId, disposition: null };
      createdCandidate = true;
    }
    const [before] = await admin.unsafe(`SELECT
      (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic,
      (SELECT count(*)::int FROM atlas.semantic_candidate) AS candidates,
      (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss,
      (SELECT count(*)::int FROM pgboss.job WHERE name<>$1 AND state IN ('created','active','retry')) AS downstream`, [genericHandoffQueue]);
    if (!candidate.disposition) {
      worker = createBackgroundWorker({ databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 10, retryLimit: 2, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 }, new TestRuntime(), undefined, undefined, undefined, undefined, undefined, undefined, receiver.configuration);
      await worker.start();
      if (createdCandidate) {
        await worker.boss.send(genericHandoffQueue, { type: "GenericHandoffJob/v1", handoffId: candidate.handoff_id });
      } else {
        const [job] = await admin.unsafe("SELECT data FROM pgboss.job WHERE name=$1 AND data->>'handoffId'=$2 AND state IN ('created','retry')", [genericHandoffQueue, candidate.handoff_id]);
        assert.ok(job, "the undelivered real handoff has its normal pg-boss pointer job");
        assert.deepEqual(typeof job!.data === "string" ? JSON.parse(job!.data) : job!.data, { type: "GenericHandoffJob/v1", handoffId: candidate.handoff_id }, "the real queue message remains pointer-only");
      }
    }
    let receipt: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      [receipt] = await admin.unsafe("SELECT handoff_id,idempotency_key,body_sha256,producer_execution_id,route_main,route_branch,policy_version,handler_version,body_contract_type,body_contract_version,disposition,error_class,lease_generation FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [candidate.handoff_id]);
      if (receipt?.disposition) break;
      await pause(200);
    }
    assert.ok(receipt, "Bridge persists one delivery row for the known immutable handoff");
    assert.deepEqual({ disposition: receipt!.disposition, errorClass: receipt!.error_class, route: `${receipt!.route_main}/${receipt!.route_branch}`, policy: receipt!.policy_version, handler: receipt!.handler_version, contract: `${receipt!.body_contract_type}/${receipt!.body_contract_version}` }, { disposition: "parsed_only", errorClass: null, route: "semantic/batch-plan", policy: "v1", handler: "v1", contract: "SemanticBatchPlanInput/v1" });
    assert.equal(receipt!.body_sha256, candidate.body_sha256, "receipt retains the issued immutable body hash");
    assert.ok(Number(receipt!.lease_generation) >= 1, "receipt was claimed through a generated lease fence");
    const [after] = await admin.unsafe(`SELECT
      (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic,
      (SELECT count(*)::int FROM atlas.semantic_candidate) AS candidates,
      (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss,
      (SELECT count(*)::int FROM pgboss.job WHERE name<>$1 AND state IN ('created','active','retry')) AS downstream`, [genericHandoffQueue]);
    assert.deepEqual(after, before, "false-only receipt creates no semantic, BSS, or downstream queue effect");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.generic_handoff_delivery WHERE handoff_id=$1 AND disposition='parsed_only'", [candidate.handoff_id]))[0]!.count, 1, "one terminal logical receipt exists");
    await assert.rejects(() => atlas.unsafe("INSERT INTO bridge.generic_handoff_delivery(handoff_id,body_sha256) VALUES ('forbidden-atlas-write','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')"), /permission denied|must be owner/u, "atlas_app has no Bridge receipt write authority");
    console.log(JSON.stringify({ projectId: candidate.project_id, workspaceId: candidate.workspace_id, bundleId: candidate.bundle_id, documentId: candidate.document_id, executionId: candidate.producer_execution_id, handoffId: candidate.handoff_id, receipt: receipt!.disposition }));
  } finally {
    await worker?.stop().catch(() => undefined);
    await Promise.all([admin.end(), atlas.end(), receiver.close()]);
  }
});

test("GHR-03B delivery code has no downstream domain dependency", async () => {
  const delivery = await readFile(new URL("../src/ghr/delivery-worker.ts", import.meta.url), "utf8");
  assert.doesNotMatch(delivery, /resolveBackground|PostgresAcceptedSemanticBatchPlanDocumentResolver|provider|reconciliation|projection|semantic-worker|backgroundExecutionQueue/u);
  assert.match(delivery, /createGenericHandoffHttpDispatcher/);
  assert.doesNotMatch(delivery, /receiveVerifiedBatchPlan/);
  assert.match(delivery, /read_generic_handoff_dispatch_v1/);
});

test("GHR-03B proves the complete RC-02 negative matrix without downstream effects", { skip: !enabled || !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const boss = new PgBoss({ connectionString: bridgeUrl.toString(), schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false });
  const suffix = randomUUID();
  const receiver = await startReceiver();
  const makeIssued = async (label: string, options: {
    readonly body?: string;
    readonly hashBody?: string;
    readonly alterHeader?: (header: any) => void;
    readonly trustedHeader?: unknown;
  } = {}) => {
    const handoffId = `ghr-03b-${label}-${suffix}-${randomUUID()}`;
    const payload = canonicalSemanticBatchPlanInputV1({ normalizedDocumentRef: "a".repeat(64), perceptionExecutionId: `execution-${suffix}`, sourceSha256: "b".repeat(64), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: "c".repeat(64) });
    const canonicalBody = `{"can_continue":false,"payload":${payload}}`;
    const body = options.body ?? canonicalBody;
    const bodyBytes = Buffer.from(body, "utf8");
    const expectedHash = createHash("sha256").update(Buffer.from(options.hashBody ?? body, "utf8")).digest("hex");
    const header = {
      protocol: "GenericHandoffEnvelope/v1", handoffId, idempotencyKey: `key-${handoffId}`,
      producer: { processKey: "perception.acceptance", executionId: `execution-${suffix}` },
      route: { main: "semantic", branch: "batch-plan", policyVersion: "v1", handlerVersion: "v1" },
      bodyContract: { type: "SemanticBatchPlanInput", version: "v1" },
      scope: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}` },
      correlation: { workflowId: `workflow-${suffix}` }, integrity: { bodyEncoding: "canonical-json-v1", bodySha256: expectedHash }, issuedAt: "2026-10-24T00:00:00.000Z",
    };
    options.alterHeader?.(header);
    await admin.unsafe(`INSERT INTO atlas.generic_handoff_intent(
      handoff_id,idempotency_key,producer_execution_id,project_id,workspace_id,bundle_id,document_id,policy_version,handler_version,body_contract_type,body_contract_version,route_main,route_branch,can_continue,body_encoding,body_bytes,body_sha256,trusted_header,issued_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'v1','v1','SemanticBatchPlanInput','v1','semantic','batch-plan',false,'canonical-json-v1',$8,$9,$10::jsonb,now())`, [handoffId, header.idempotencyKey, header.producer.executionId, header.scope.projectId ?? `project-${suffix}`, header.scope.workspaceId ?? `workspace-${suffix}`, header.scope.bundleId ?? `bundle-${suffix}`, header.scope.documentId ?? `document-${suffix}`, bodyBytes, expectedHash, JSON.stringify(options.trustedHeader ?? header)]);
    return handoffId;
  };
  try {
    await boss.start();
    const database = boss.getDb();
    const [effectsBefore] = await admin.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic, (SELECT count(*)::int FROM atlas.semantic_candidate) AS candidates, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss");
    const valid = await makeIssued("valid");
    assert.equal(await deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: valid }, leaseSeconds: 10, finalAttempt: false, httpTransportConfiguration: receiver.configuration }), "parsed_only");
    assert.equal(await deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: valid }, leaseSeconds: 10, finalAttempt: false, httpTransportConfiguration: receiver.configuration }), "parsed_only", "a duplicate observes the terminal receipt without a second receiver dispatch");
    assert.equal(receiver.acknowledgements(), 1, "the duplicate does not execute a local or HTTP compatibility delivery path");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.generic_handoff_delivery WHERE handoff_id=$1 AND disposition='parsed_only'", [valid]))[0]!.count, 1);

    const negativeCases = [
      { name: "forged-producer", expected: "blocked", errorClass: "invalid_policy", options: { alterHeader: (header: any) => { header.producer.processKey = "forged.producer"; } } },
      { name: "wrong-route", expected: "quarantined", errorClass: "corrupt_envelope", options: { alterHeader: (header: any) => { header.route.main = "forged"; } } },
      { name: "wrong-policy", expected: "blocked", errorClass: "invalid_policy", options: { alterHeader: (header: any) => { header.route.policyVersion = "v999"; } } },
      { name: "wrong-handler", expected: "blocked", errorClass: "invalid_policy", options: { alterHeader: (header: any) => { header.route.handlerVersion = "v999"; } } },
      { name: "wrong-contract", expected: "blocked", errorClass: "invalid_policy", options: { alterHeader: (header: any) => { header.bodyContract.version = "v999"; } } },
      { name: "missing-scope", expected: "quarantined", errorClass: "corrupt_envelope", options: { alterHeader: (header: any) => { delete header.scope.bundleId; } } },
      { name: "invalid-header", expected: "quarantined", errorClass: "corrupt_envelope", options: { trustedHeader: {} } },
      { name: "invalid-wrapper", expected: "quarantined", errorClass: "corrupt_envelope", options: { body: "{\"can_continue\":false}" } },
      { name: "duplicate-key", expected: "quarantined", errorClass: "corrupt_envelope", options: { body: `{"can_continue":false,"can_continue":false,"payload":${canonicalSemanticBatchPlanInputV1({ normalizedDocumentRef: "a".repeat(64), perceptionExecutionId: `execution-${suffix}`, sourceSha256: "b".repeat(64), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: "c".repeat(64) })}` } },
      { name: "changed-bytes", expected: "quarantined", errorClass: "corrupt_envelope", options: { body: `{"can_continue":false,"payload":${canonicalSemanticBatchPlanInputV1({ normalizedDocumentRef: "a".repeat(64), perceptionExecutionId: `execution-${suffix}`, sourceSha256: "b".repeat(64), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: "c".repeat(64) })} `, hashBody: `{"can_continue":false,"payload":${canonicalSemanticBatchPlanInputV1({ normalizedDocumentRef: "a".repeat(64), perceptionExecutionId: `execution-${suffix}`, sourceSha256: "b".repeat(64), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: "c".repeat(64) })}` } },
      { name: "receiver-rejection", expected: "quarantined", errorClass: "receiver_rejected", options: { body: "{\"can_continue\":false,\"payload\":{\"normalizedDocumentRef\":\"not-a-hash\"}}" } },
    ] as const;
    for (const scenario of negativeCases) {
      const handoffId = await makeIssued(scenario.name, scenario.options);
      assert.equal(await deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId }, leaseSeconds: 10, finalAttempt: false, httpTransportConfiguration: receiver.configuration }), scenario.expected, scenario.name);
      assert.deepEqual((await admin.unsafe("SELECT disposition,error_class FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [handoffId]))[0], { disposition: scenario.expected, error_class: scenario.errorClass }, `${scenario.name} is sanitized and terminal`);
    }

    const invalidCredential = await makeIssued("invalid-credential");
    assert.equal(await deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: invalidCredential }, leaseSeconds: 10, finalAttempt: false, httpTransportConfiguration: { ...receiver.configuration, credential: "x".repeat(32) } }), "blocked");
    assert.deepEqual((await admin.unsafe("SELECT disposition,error_class FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [invalidCredential]))[0], { disposition: "blocked", error_class: "invalid_route" }, "a Fastify authentication rejection cannot create a successful receipt");

    for (const fault of [
      { mode: "422", disposition: "quarantined", errorClass: "receiver_rejected", transient: false },
      { mode: "403", disposition: "blocked", errorClass: "invalid_route", transient: false },
      { mode: "404", disposition: "blocked", errorClass: "invalid_route", transient: false },
      { mode: "405", disposition: "blocked", errorClass: "invalid_route", transient: false },
      { mode: "redirect", disposition: "blocked", errorClass: "invalid_route", transient: false },
      { mode: "malformed_acknowledgement", disposition: "quarantined", errorClass: "corrupt_envelope", transient: false },
      { mode: "mismatched_acknowledgement", disposition: "quarantined", errorClass: "corrupt_envelope", transient: false },
      { mode: "oversized_acknowledgement", disposition: "quarantined", errorClass: "corrupt_envelope", transient: false },
      { mode: "timeout", disposition: "retry_exhausted", errorClass: "transient_delivery", transient: true },
      { mode: "server_error", disposition: "retry_exhausted", errorClass: "transient_delivery", transient: true },
    ] as const) {
      const faultReceiver = await startFaultReceiver(fault.mode);
      const handoffId = await makeIssued(`http-${fault.mode}`);
      try {
        const input = { database, job: { type: "GenericHandoffJob/v1" as const, handoffId }, leaseSeconds: 1, finalAttempt: false, httpTransportConfiguration: faultReceiver.configuration };
        if (fault.transient) {
          await assert.rejects(() => deliverGenericHandoffJob(input), /HTTP delivery is unavailable/u, `${fault.mode} retains the pointer for a bounded retry`);
          await admin.unsafe("UPDATE bridge.generic_handoff_delivery SET lease_expires_at=now()-interval '1 second' WHERE handoff_id=$1", [handoffId]);
          assert.equal(await deliverGenericHandoffJob({ ...input, finalAttempt: true }), fault.disposition, `${fault.mode} terminalizes only at the fenced final attempt`);
        } else {
          assert.equal(await deliverGenericHandoffJob(input), fault.disposition, `${fault.mode} follows the frozen worker transport classification`);
        }
        assert.deepEqual((await admin.unsafe("SELECT disposition,error_class FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [handoffId]))[0], { disposition: fault.disposition, error_class: fault.errorClass }, `${fault.mode} records only its sanitized durable outcome`);
        assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.generic_handoff_delivery WHERE handoff_id=$1 AND disposition='parsed_only'", [handoffId]))[0]!.count, 0, `${fault.mode} cannot create a parsed-only receipt`);
        assert.deepEqual((await admin.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic, (SELECT count(*)::int FROM atlas.semantic_candidate) AS candidates, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss"))[0], effectsBefore, `${fault.mode} cannot create downstream work`);
      } finally {
        await faultReceiver.close();
      }
    }

    const unavailable = await makeIssued("unavailable");
    const unavailableTransport = { ...receiver.configuration, origin: "http://127.0.0.1:1" };
    await assert.rejects(() => deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: unavailable }, leaseSeconds: 1, finalAttempt: false, httpTransportConfiguration: unavailableTransport }), /HTTP delivery is unavailable/u);
    await admin.unsafe("UPDATE bridge.generic_handoff_delivery SET lease_expires_at=now()-interval '1 second' WHERE handoff_id=$1", [unavailable]);
    assert.equal(await deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: unavailable }, leaseSeconds: 1, finalAttempt: true, httpTransportConfiguration: unavailableTransport }), "retry_exhausted");
    assert.deepEqual((await admin.unsafe("SELECT disposition,error_class FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [unavailable]))[0], { disposition: "retry_exhausted", error_class: "transient_delivery" }, "network failure stays retryable until the fenced final attempt");

    const blocked = await makeIssued("valid");
    await admin.unsafe("UPDATE atlas.generic_handoff_route_policy SET enabled=false WHERE policy_version='v1' AND producer_process_key='perception.acceptance' AND producer_event='NormalizedDocumentAccepted/v1' AND route_main='semantic' AND route_branch='batch-plan' AND handler_version='v1' AND body_contract_type='SemanticBatchPlanInput' AND body_contract_version='v1'");
    try {
      assert.equal(await deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: blocked }, leaseSeconds: 10, finalAttempt: false, httpTransportConfiguration: receiver.configuration }), "blocked");
      assert.deepEqual((await admin.unsafe("SELECT disposition,error_class FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [blocked]))[0], { disposition: "blocked", error_class: "invalid_policy" });
    } finally {
      await admin.unsafe("UPDATE atlas.generic_handoff_route_policy SET enabled=true WHERE policy_version='v1' AND producer_process_key='perception.acceptance' AND producer_event='NormalizedDocumentAccepted/v1' AND route_main='semantic' AND route_branch='batch-plan' AND handler_version='v1' AND body_contract_type='SemanticBatchPlanInput' AND body_contract_version='v1'");
    }
    const [effectsAfter] = await admin.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic, (SELECT count(*)::int FROM atlas.semantic_candidate) AS candidates, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss");
    assert.deepEqual(effectsAfter, effectsBefore, "every positive and classified negative delivery stays parse-only with zero downstream effects");
  } finally {
    await boss.stop({ graceful: false }).catch(() => undefined);
    await Promise.all([admin.end(), receiver.close()]);
  }
});

test("GHR-04C retries a receiver-accepted acknowledgement loss without changing the durable receipt identity", { skip: !enabled || !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const boss = new PgBoss({ connectionString: bridgeUrl.toString(), schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false });
  const receiver = await startReceiver({ delayFirstAcknowledgementMilliseconds: 100 });
  const suffix = randomUUID();
  const handoffId = `ghr-04c-lost-ack-${suffix}`;
  const idempotencyKey = `key-${handoffId}`;
  const body = `{"can_continue":false,"payload":${canonicalSemanticBatchPlanInputV1({ normalizedDocumentRef: "a".repeat(64), perceptionExecutionId: `execution-${suffix}`, sourceSha256: "b".repeat(64), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: "c".repeat(64) })}}`;
  const bodySha256 = createHash("sha256").update(body).digest("hex");
  const header = {
    protocol: "GenericHandoffEnvelope/v1", handoffId, idempotencyKey,
    producer: { processKey: "perception.acceptance", executionId: `execution-${suffix}` },
    route: { main: "semantic", branch: "batch-plan", policyVersion: "v1", handlerVersion: "v1" },
    bodyContract: { type: "SemanticBatchPlanInput", version: "v1" },
    scope: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}` },
    correlation: { workflowId: `workflow-${suffix}` }, integrity: { bodyEncoding: "canonical-json-v1", bodySha256 }, issuedAt: "2026-10-25T00:00:00.000Z",
  };
  try {
    await boss.start();
    const database = boss.getDb();
    const [effectsBefore] = await admin.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic, (SELECT count(*)::int FROM atlas.semantic_candidate) AS candidates, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss");
    await admin.unsafe("INSERT INTO atlas.generic_handoff_intent(handoff_id,idempotency_key,producer_execution_id,project_id,workspace_id,bundle_id,document_id,policy_version,handler_version,body_contract_type,body_contract_version,route_main,route_branch,can_continue,body_encoding,body_bytes,body_sha256,trusted_header,issued_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'v1','v1','SemanticBatchPlanInput','v1','semantic','batch-plan',false,'canonical-json-v1',$8,$9,$10::jsonb,now())", [handoffId, idempotencyKey, header.producer.executionId, header.scope.projectId, header.scope.workspaceId, header.scope.bundleId, header.scope.documentId, Buffer.from(body), bodySha256, JSON.stringify(header)]);
    const retryingInput = { database, job: { type: "GenericHandoffJob/v1" as const, handoffId }, leaseSeconds: 1, finalAttempt: false, httpTransportConfiguration: { ...receiver.configuration, timeoutMilliseconds: 25 } };
    await assert.rejects(() => deliverGenericHandoffJob(retryingInput), /HTTP delivery is unavailable/u, "the worker loses the accepted acknowledgement before receipt terminalization");
    await pause(125);
    assert.equal(receiver.acknowledgements(), 1, "the existing Fastify receiver accepted the first original immutable request");
    assert.deepEqual((await admin.unsafe("SELECT handoff_id,idempotency_key,body_sha256,disposition FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [handoffId]))[0], { handoff_id: handoffId, idempotency_key: idempotencyKey, body_sha256: bodySha256, disposition: null }, "the lost acknowledgement cannot terminalize a receipt");
    await admin.unsafe("UPDATE bridge.generic_handoff_delivery SET lease_expires_at=now()-interval '1 second' WHERE handoff_id=$1", [handoffId]);
    assert.equal(await deliverGenericHandoffJob({ ...retryingInput, httpTransportConfiguration: receiver.configuration }), "parsed_only", "the fenced retry sends the original verified pointer to the same receiver");
    assert.equal(receiver.acknowledgements(), 2, "the only retry is a second real HTTP request to the Fastify receiver");
    assert.deepEqual((await admin.unsafe("SELECT handoff_id,idempotency_key,body_sha256,disposition,error_class,lease_generation FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [handoffId]))[0], { handoff_id: handoffId, idempotency_key: idempotencyKey, body_sha256: bodySha256, disposition: "parsed_only", error_class: null, lease_generation: 2 }, "the retry preserves the immutable identity and writes one fenced terminal receipt");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.generic_handoff_delivery WHERE handoff_id=$1 AND disposition='parsed_only'", [handoffId]))[0]!.count, 1, "exactly one logical parsed-only receipt exists after acknowledgement loss");
    assert.deepEqual((await admin.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic, (SELECT count(*)::int FROM atlas.semantic_candidate) AS candidates, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss"))[0], effectsBefore, "acknowledgement-loss recovery remains false-only");
  } finally {
    await boss.stop({ graceful: false }).catch(() => undefined);
    await Promise.all([admin.end(), receiver.close()]);
  }
});

test("GHR-03B proves restart, concurrent fencing, and classified retry exhaustion", { skip: !enabled || !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const boss = new PgBoss({ connectionString: bridgeUrl.toString(), schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false });
  const receiver = await startReceiver();
  let worker: ReturnType<typeof createBackgroundWorker> | undefined;
  const suffix = randomUUID();
  const makeIssued = async (label: string) => {
    const handoffId = `ghr-03b-${label}-${suffix}-${randomUUID()}`;
    const payload = canonicalSemanticBatchPlanInputV1({ normalizedDocumentRef: "a".repeat(64), perceptionExecutionId: `execution-${suffix}`, sourceSha256: "b".repeat(64), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: "c".repeat(64) });
    const body = `{"can_continue":false,"payload":${payload}}`;
    const bodySha256 = createHash("sha256").update(body).digest("hex");
    const header = { protocol: "GenericHandoffEnvelope/v1", handoffId, idempotencyKey: `key-${handoffId}`, producer: { processKey: "perception.acceptance", executionId: `execution-${suffix}` }, route: { main: "semantic", branch: "batch-plan", policyVersion: "v1", handlerVersion: "v1" }, bodyContract: { type: "SemanticBatchPlanInput", version: "v1" }, scope: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}` }, correlation: { workflowId: `workflow-${suffix}` }, integrity: { bodyEncoding: "canonical-json-v1", bodySha256 }, issuedAt: "2026-10-24T00:00:00.000Z" };
    await admin.unsafe("INSERT INTO atlas.generic_handoff_intent(handoff_id,idempotency_key,producer_execution_id,project_id,workspace_id,bundle_id,document_id,policy_version,handler_version,body_contract_type,body_contract_version,route_main,route_branch,can_continue,body_encoding,body_bytes,body_sha256,trusted_header,issued_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'v1','v1','SemanticBatchPlanInput','v1','semantic','batch-plan',false,'canonical-json-v1',$8,$9,$10::jsonb,now())", [handoffId, header.idempotencyKey, header.producer.executionId, header.scope.projectId, header.scope.workspaceId, header.scope.bundleId, header.scope.documentId, Buffer.from(body), bodySha256, JSON.stringify(header)]);
    return handoffId;
  };
  try {
    await boss.start();
    const database = boss.getDb();
    const awaitTerminal = async (handoffId: string) => {
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const [receipt] = await admin.unsafe("SELECT disposition FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [handoffId]);
        if (receipt?.disposition) return receipt;
        await pause(100);
      }
      throw new Error("Bridge worker did not persist the expected terminal receipt.");
    };
    const queued = await makeIssued("queue-restart");
    worker = createBackgroundWorker({ databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 2, perceptionConcurrency: 1, timeoutSeconds: 1, retryLimit: 1, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 }, new TestRuntime(), undefined, undefined, undefined, undefined, undefined, undefined, receiver.configuration);
    await worker.start();
    const firstJobId = await boss.send(genericHandoffQueue, { type: "GenericHandoffJob/v1", handoffId: queued });
    assert.equal((await awaitTerminal(queued)).disposition, "parsed_only", "the normal pg-boss worker consumes the pointer-only job");
    assert.equal((await admin.unsafe("SELECT state FROM pgboss.job WHERE id=$1", [firstJobId]))[0]!.state, "completed");
    await worker.stop();
    worker = undefined;
    const secondJobId = await boss.send(genericHandoffQueue, { type: "GenericHandoffJob/v1", handoffId: queued });
    worker = createBackgroundWorker({ databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 2, perceptionConcurrency: 1, timeoutSeconds: 1, retryLimit: 1, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 }, new TestRuntime(), undefined, undefined, undefined, undefined, undefined, undefined, receiver.configuration);
    await worker.start();
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const [job] = await admin.unsafe("SELECT state FROM pgboss.job WHERE id=$1", [secondJobId]);
      if (job?.state === "completed") break;
      await pause(100);
    }
    assert.equal((await admin.unsafe("SELECT state FROM pgboss.job WHERE id=$1", [secondJobId]))[0]!.state, "completed", "a restarted worker acknowledges the duplicate pointer job");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.generic_handoff_delivery WHERE handoff_id=$1 AND disposition='parsed_only'", [queued]))[0]!.count, 1, "restart and lost acknowledgement retain one logical receipt");
    await worker.stop();
    worker = undefined;

    const stale = await makeIssued("restart");
    await admin.unsafe("INSERT INTO bridge.generic_handoff_delivery(handoff_id,idempotency_key,body_sha256,producer_execution_id,route_main,route_branch,policy_version,handler_version,body_contract_type,body_contract_version,lease_owner,lease_generation,lease_expires_at,claimed_at) SELECT handoff_id,idempotency_key,body_sha256,producer_execution_id,route_main,route_branch,policy_version,handler_version,body_contract_type,body_contract_version,'00000000-0000-0000-0000-000000000001',1,now()-interval '1 second',now()-interval '11 seconds' FROM atlas.generic_handoff_intent WHERE handoff_id=$1", [stale]);
    assert.equal(await deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: stale }, leaseSeconds: 1, finalAttempt: false, httpTransportConfiguration: receiver.configuration }), "parsed_only", "a restart reclaims only an expired fenced lease");
    assert.equal((await admin.unsafe("SELECT lease_generation FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [stale]))[0]!.lease_generation, 2);

    const concurrent = await makeIssued("concurrent");
    const results = await Promise.allSettled([1, 2].map(() => deliverGenericHandoffJob({ database, job: { type: "GenericHandoffJob/v1", handoffId: concurrent }, leaseSeconds: 10, finalAttempt: false, httpTransportConfiguration: receiver.configuration })));
    assert.ok(results.some((result) => result.status === "fulfilled" && result.value === "parsed_only"), "one claimant reaches the real receiver");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.generic_handoff_delivery WHERE handoff_id=$1 AND disposition='parsed_only'", [concurrent]))[0]!.count, 1, "concurrent delivery has one terminal logical receipt");

    const exhausted = await makeIssued("retry-exhausted");
    let remainingTerminalFaults = 2;
    const faultingDatabase = {
      async executeSql(statement: string, values?: readonly unknown[]) {
        if (remainingTerminalFaults > 0 && statement.startsWith("UPDATE bridge.generic_handoff_delivery SET disposition=")) {
          remainingTerminalFaults -= 1;
          throw new Error("simulated transient receipt persistence fault");
        }
        return database.executeSql(statement, values);
      },
    };
    await assert.rejects(() => deliverGenericHandoffJob({ database: faultingDatabase, job: { type: "GenericHandoffJob/v1", handoffId: exhausted }, leaseSeconds: 1, finalAttempt: false, httpTransportConfiguration: receiver.configuration }), /receipt persistence failed/, "a classified transient leaves the pointer job retryable");
    await admin.unsafe("UPDATE bridge.generic_handoff_delivery SET lease_expires_at=now()-interval '1 second' WHERE handoff_id=$1", [exhausted]);
    assert.equal(await deliverGenericHandoffJob({ database: faultingDatabase, job: { type: "GenericHandoffJob/v1", handoffId: exhausted }, leaseSeconds: 1, finalAttempt: true, httpTransportConfiguration: receiver.configuration }), "retry_exhausted");
    assert.deepEqual((await admin.unsafe("SELECT disposition,error_class FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [exhausted]))[0], { disposition: "retry_exhausted", error_class: "transient_delivery" });
  } finally {
    await worker?.stop().catch(() => undefined);
    await boss.stop({ graceful: false }).catch(() => undefined);
    await Promise.all([admin.end(), receiver.close()]);
  }
});

test("GHR-03B exposes neither delivery replay controls nor sensitive Bridge state", { skip: !enabled || !databaseUrl }, async () => {
  const delivery = await readFile(new URL("../src/ghr/delivery-worker.ts", import.meta.url), "utf8");
  assert.doesNotMatch(delivery, /replay|reissue|promotion|route migration|fallback/iu, "delivery exposes no manual recovery or route-migration surface");
  const admin = postgres(databaseUrl!, { max: 1 });
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  try {
    await assert.rejects(() => bridge.unsafe("SELECT * FROM atlas.generic_handoff_intent LIMIT 1"), /permission denied|must be owner/u, "Bridge cannot read raw Atlas issuance rows");
    await assert.rejects(() => bridge.unsafe("UPDATE atlas.generic_handoff_route_policy SET enabled=false"), /permission denied|must be owner/u, "Bridge cannot mutate Atlas policy");
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.generic_handoff_delivery LIMIT 1"), /permission denied|must be owner/u, "Atlas cannot read Bridge receipt state");
    const columns = await admin.unsafe("SELECT column_name FROM information_schema.columns WHERE table_schema='bridge' AND table_name='generic_handoff_delivery'");
    const names = new Set(columns.map((column) => String(column.column_name)));
    for (const sensitive of ["body_bytes", "trusted_header", "payload", "diagnostic", "error_detail"]) assert.equal(names.has(sensitive), false, `receipt has no ${sensitive} surface`);
  } finally {
    await Promise.all([admin.end(), bridge.end(), atlas.end()]);
  }
});
