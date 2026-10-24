import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import Fastify from "fastify";
import postgres from "postgres";
import { PostgresGenericHandoffIssuer } from "@atlas/db";
import { createBridgeApp } from "../src/app.ts";
import { createPostgresSemanticBatchPlanAcceptanceStore, runSemanticBatchPlanJob } from "../src/idser-semantic-batch-plan-job.ts";
import { genericHandoffQueue } from "../src/queue.ts";
import { TestRuntime } from "../src/runtime.ts";
import { createBackgroundWorker } from "../src/worker.ts";

const databaseUrl = process.env.DATABASE_URL;
const enabled = process.env.GHR04C_REAL_E2E === "1";
const credential = "g".repeat(32);
const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

async function eventually<T>(read: () => Promise<T | undefined>, message: string): Promise<T> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const value = await read();
    if (value !== undefined) return value;
    await pause(100);
  }
  throw new Error(message);
}

test("GHR v2 issuance reaches HTTP 202, durable pg-boss acceptance, and the IDSER planner", { skip: !enabled || !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = randomUUID();
  let releasePlanner: (() => void) | undefined;
  const plannerGate = new Promise<void>((resolve) => { releasePlanner = resolve; });
  let resolverCalls = 0;
  let capacityReads = 0;
  let worker: ReturnType<typeof createBackgroundWorker> | undefined;
  let receiver: ReturnType<typeof Fastify> | undefined;

  try {
    receiver = createBridgeApp({
      runtime: new TestRuntime(),
      version: "ghr-04c-e2e",
      batchPlanAcceptance: createPostgresSemanticBatchPlanAcceptanceStore({
        executeSql: async (statement, values) => ({ rows: await bridge.unsafe(statement, values as never[]) }),
      }),
      genericHandoffHttpTransport: { origin: "http://127.0.0.1:3002", credential, timeoutMilliseconds: 1_000, maximumResponseBytes: 8_192 },
    });
    await receiver.listen({ host: "127.0.0.1", port: 0 });
    const address = receiver.server.address();
    assert.ok(address && typeof address !== "string");

    worker = createBackgroundWorker(
      { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 10, retryLimit: 1, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
      new TestRuntime(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { origin: `http://127.0.0.1:${address.port}`, credential, timeoutMilliseconds: 1_000, maximumResponseBytes: 8_192 },
      async (handoffId, database) => {
        await plannerGate;
        await runSemanticBatchPlanJob({
          database,
          handoffId,
          planning: {
            acceptedDocumentResolver: {
              resolveBackground: async (input) => {
                resolverCalls += 1;
                assert.equal(input.perceptionExecutionId, `ghr-v2-execution-${suffix}`);
                return {
                  scope: { projectId: `ghr-v2-project-${suffix}`, workspaceId: `ghr-v2-workspace-${suffix}`, bundleId: `ghr-v2-bundle-${suffix}`, documentId: `ghr-v2-document-${suffix}` },
                  source: { documentId: `ghr-v2-document-${suffix}`, sourceSha256: sha256(`source-${suffix}`) },
                  normalizedDocument: {
                    version: "v1", executionId: `ghr-v2-execution-${suffix}`, artifactId: `ghr-v2-document-${suffix}`, sourceSha256: sha256(`source-${suffix}`),
                    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
                    provider: { name: "integration", processor: "fixture", executionId: `ghr-v2-execution-${suffix}`, processedAt: "2026-10-25T00:00:00.000Z" },
                    pages: [],
                  },
                  media: [],
                  rel: { state: "unavailable" },
                };
              },
            },
            estimatorConfiguration: {
              estimator: { identity: "integration-estimator", version: "v1" },
              configuration: { identity: "integration-configuration", version: "v1" },
              inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: 1,
              requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 },
            },
            capacityConsumer: {
              read: async () => {
                capacityReads += 1;
                throw new Error("integration proves planner invocation at its capacity-read boundary");
              },
            },
          },
        });
      },
    );
    await worker.start();

    const issued = await atlas.begin((transaction) => new PostgresGenericHandoffIssuer().issue(transaction, {
      producer: { processKey: "perception.acceptance", event: "NormalizedDocumentAccepted/v1", executionId: `ghr-v2-execution-${suffix}` },
      scope: { projectId: `ghr-v2-project-${suffix}`, workspaceId: `ghr-v2-workspace-${suffix}`, bundleId: `ghr-v2-bundle-${suffix}`, documentId: `ghr-v2-document-${suffix}` },
      payload: { normalizedDocumentRef: sha256(`cache-${suffix}`), perceptionExecutionId: `ghr-v2-execution-${suffix}`, sourceSha256: sha256(`source-${suffix}`), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: sha256(`fingerprint-${suffix}`) },
      idempotencyKey: `ghr-v2-idempotency-${suffix}`,
      handoffId: `ghr-v2-handoff-${suffix}`,
      workflowId: `ghr-v2-workflow-${suffix}`,
      issuedAt: "2026-10-25T00:00:00.000Z",
    }));
    assert.match(Buffer.from(issued.bodyBytes).toString("utf8"), /^\{"can_continue":true,/u, "v2 issuance persists the true continuation wrapper");
    assert.deepEqual((await admin.unsafe("SELECT policy_version,handler_version,can_continue FROM atlas.generic_handoff_intent WHERE handoff_id=$1", [issued.handoffId]))[0], { policy_version: "v2", handler_version: "v2", can_continue: true }, "the corrected transition constraint admits the v2 intent");

    await worker.boss.send(genericHandoffQueue, { type: "GenericHandoffJob/v1", handoffId: issued.handoffId });
    await eventually(async () => {
      const [delivery] = await admin.unsafe("SELECT disposition FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [issued.handoffId]);
      return delivery?.disposition === "accepted" ? delivery : undefined;
    }, "GHR delivery did not obtain the HTTP 202 acknowledgement.");
    const accepted = await eventually(async () => {
      const [job] = await admin.unsafe("SELECT state,attempt_count FROM bridge.semantic_batch_plan_job WHERE handoff_id=$1", [issued.handoffId]);
      return job?.state === "PENDING" ? job : undefined;
    }, "HTTP receiver did not durably accept the planner job before returning 202.");
    assert.equal(accepted.attempt_count, 0, "the HTTP 202 is returned before the planner claims the job");
    assert.equal(resolverCalls, 0, "the receiver did not resolve an accepted document");
    assert.equal(capacityReads, 0, "the receiver did not invoke the IDSER planner");

    releasePlanner!();
    const completed = await eventually(async () => {
      const [job] = await admin.unsafe("SELECT state,attempt_count,outcome FROM bridge.semantic_batch_plan_job WHERE handoff_id=$1", [issued.handoffId]);
      return job?.state === "BLOCKED" ? job : undefined;
    }, "pg-boss did not invoke and complete the IDSER planner job.");
    assert.equal(completed.attempt_count, 1);
    assert.equal(resolverCalls, 1, "the pg-boss consumer invoked the accepted-document planner resolver exactly once");
    assert.equal(capacityReads, 1, "the IDSER structural planner reached its capacity-read boundary exactly once");
    assert.deepEqual(typeof completed.outcome === "string" ? JSON.parse(completed.outcome) : completed.outcome, {
      disposition: "BLOCKED", reason: "BSS_CAPACITY_CONSUMER_READ_GAP", units: [], fitTrace: [],
    });
  } finally {
    releasePlanner?.();
    await worker?.stop().catch(() => undefined);
    await Promise.all([admin.end(), atlas.end(), bridge.end(), receiver?.close().catch(() => undefined)]);
  }
});
