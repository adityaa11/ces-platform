import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canonicalSemanticBatchPlanInputV1 } from "@atlas/db";
import { createBridgeApp } from "../src/app.ts";
import { semanticBatchPlanRoute } from "../src/ghr/routes/semantic/branches/batch-plan.route.ts";

const credential = "r".repeat(32);
const input = Object.freeze({
  normalizedDocumentRef: "a".repeat(64),
  perceptionExecutionId: "accepted-execution-1",
  sourceSha256: "b".repeat(64),
  normalizedDocumentVersion: "v1" as const,
  normalizedDocumentFingerprint: "c".repeat(64),
});
const payload = canonicalSemanticBatchPlanInputV1(input);

function envelope(body: string, override: Record<string, unknown> = {}): string {
  const header = {
    protocol: "GenericHandoffEnvelope/v1",
    handoffId: "ghr-http-handoff-1",
    idempotencyKey: "ghr-http-idempotency-1",
    producer: { processKey: "perception.acceptance", executionId: "accepted-execution-1" },
    route: { main: "semantic", branch: "batch-plan", policyVersion: "v1", handlerVersion: "v1" },
    bodyContract: { type: "SemanticBatchPlanInput", version: "v1" },
    scope: { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1" },
    correlation: { workflowId: "workflow-1" },
    integrity: { bodyEncoding: "canonical-json-v1", bodySha256: createHash("sha256").update(body).digest("hex") },
    issuedAt: "2026-10-25T09:30:00+07:00",
    ...override,
  };
  return `{"header":${JSON.stringify(header)},"body":${body}}`;
}

async function withReceiver(run: (origin: string) => Promise<void>): Promise<void> {
  const app = createBridgeApp({
    version: "test",
    genericHandoffHttpTransport: { origin: "http://127.0.0.1:3002", credential, timeoutMilliseconds: 1_000, maximumResponseBytes: 8_192 },
  });
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  try { await run(`http://127.0.0.1:${address.port}`); } finally { await app.close(); }
}

async function post(origin: string, body: string, authorization = `Bearer ${credential}`): Promise<Response> {
  return fetch(`${origin}${semanticBatchPlanRoute.receiver.path}`, { method: "POST", headers: { authorization, "content-type": "application/json" }, body });
}

test("GHR-04B accepts authenticated original bytes through the existing Fastify listener", async () => {
  const body = `{"can_continue":false,"payload":${payload}}`;
  await withReceiver(async (origin) => {
    const response = await post(origin, envelope(body));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      handoffId: "ghr-http-handoff-1",
      bodySha256: createHash("sha256").update(body).digest("hex"),
      disposition: "parsed_only",
    });
    assert.equal((await fetch(`${origin}${semanticBatchPlanRoute.receiver.path}`, { method: "GET" })).status, 404);
    assert.equal((await fetch(`${origin}/internal/semantic/unknown`, { method: "POST" })).status, 404);
  });
});

test("GHR-04B fails closed before parsing without a valid service credential", async () => {
  const body = `{"can_continue":false,"payload":${payload}}`;
  await withReceiver(async (origin) => {
    for (const authorization of [undefined, "Bearer forged-credential-that-is-long-enough"]) {
      const response = await fetch(`${origin}${semanticBatchPlanRoute.receiver.path}`, { method: "POST", headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) }, body: envelope(body) });
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: "unauthorized" });
    }
  });
});

test("GHR-04B rejects forged integrity or pins and all noncanonical or true-mode bodies", async () => {
  const validBody = `{"can_continue":false,"payload":${payload}}`;
  const changedBody = `{"can_continue":false,"payload":${payload.replace("accepted-execution-1", "altered-execution")}}`;
  const duplicatePayloadBody = `{"can_continue":false,"payload":{"normalizedDocumentRef":"${"a".repeat(64)}","normalizedDocumentRef":"${"a".repeat(64)}"}}`;
  const noncanonicalPayload = JSON.stringify({ ...input, normalizedDocumentVersion: "v1" });
  const noncanonicalBody = `{"can_continue":false,"payload":${noncanonicalPayload.replace(/^\{/, "{ ")}}`;
  const trueBody = `{"can_continue":true,"payload":${payload}}`;
  await withReceiver(async (origin) => {
    const malformed = [
      envelope(changedBody, { integrity: { bodyEncoding: "canonical-json-v1", bodySha256: createHash("sha256").update(validBody).digest("hex") } }),
      envelope(validBody, { route: { main: "semantic", branch: "batch-plan", policyVersion: "v1", handlerVersion: "forged" } }),
      envelope(duplicatePayloadBody),
      envelope(noncanonicalBody),
      envelope(trueBody),
    ];
    for (const requestBody of malformed) {
      const response = await post(origin, requestBody);
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "invalid_handoff" });
    }
  });
});

test("GHR-04B remains raw-byte/parser-only after GHR-04C retires the local delivery boundary", async () => {
  const receiver = await readFile(new URL("../src/ghr/authenticated-batch-plan-http-receiver.ts", import.meta.url), "utf8");
  const worker = await readFile(new URL("../src/ghr/delivery-worker.ts", import.meta.url), "utf8");
  assert.match(receiver, /semanticBatchPlanRoute\.receiver\.path/);
  assert.match(receiver, /parseGenericHandoffEnvelopeV1/);
  assert.match(receiver, /rawPayloadBytes/);
  assert.doesNotMatch(receiver, /\b(resolveBackground|PgBoss|executeSql|resolveMainRouteBinding\([^)]*\)\.receiver|createHash|console\.)\b/u);
  assert.doesNotMatch(worker, /receiveVerifiedBatchPlan/);
  assert.match(worker, /createGenericHandoffHttpDispatcher/);
});
