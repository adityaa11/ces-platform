import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canonicalSemanticBatchPlanInputV1,
  parseSemanticBatchPlanInputV1,
} from "@atlas/db";
import { resolveMainRouteBinding } from "../src/ghr/main-route-index.ts";
import {
  BatchPlanReceiverError,
  receiveVerifiedBatchPlan,
  semanticBatchPlanRoute,
} from "../src/ghr/routes/semantic/index.ts";

const input = Object.freeze({
  normalizedDocumentRef: "a".repeat(64),
  perceptionExecutionId: "accepted-execution-1",
  sourceSha256: "b".repeat(64),
  normalizedDocumentVersion: "v1" as const,
  normalizedDocumentFingerprint: "c".repeat(64),
});
const payload = canonicalSemanticBatchPlanInputV1(input);
const command = Object.freeze({ selector: semanticBatchPlanRoute, canContinue: false as const, payload });

test("GHR-03A composes only the exact Test-1 semantic branch", () => {
  assert.deepEqual(resolveMainRouteBinding({ ...semanticBatchPlanRoute, main: "semantic" }), semanticBatchPlanRoute);
  assert.equal(semanticBatchPlanRoute.payloadByteLimit, 2_048);
  assert.equal(semanticBatchPlanRoute.wrappedBodyByteLimit, 2_081);
  for (const mismatch of [
    { branch: "other" },
    { producerProcessKey: "forged.producer" },
    { policyVersion: "v2" },
    { handlerVersion: "v2" },
    { bodyContractType: "OtherInput" },
    { bodyContractVersion: "v2" },
  ]) assert.throws(() => resolveMainRouteBinding({ ...semanticBatchPlanRoute, ...mismatch, main: "semantic" } as never), /No exact branch registration/u);
});

test("GHR-03A delegates the unchanged canonical five-field body", () => {
  assert.deepEqual(receiveVerifiedBatchPlan(command), { disposition: "parsed_only", input });
  assert.deepEqual(parseSemanticBatchPlanInputV1(payload), input);
  for (const invalid of [
    "{",
    JSON.stringify({ ...input, extra: "forbidden" }),
    JSON.stringify({ ...input, sourceSha256: "not-a-hash" }),
    ` ${payload}`,
  ]) assert.throws(() => receiveVerifiedBatchPlan({ ...command, payload: invalid }));
});

test("GHR-03A rejects all non-explicit-false modes and mismatched pins", () => {
  for (const mode of [undefined, null, 0, "false", true]) {
    assert.throws(() => receiveVerifiedBatchPlan({ ...command, canContinue: mode } as never), BatchPlanReceiverError);
  }
  assert.throws(() => receiveVerifiedBatchPlan({ ...command, selector: { ...semanticBatchPlanRoute, handlerVersion: "v2" } }), BatchPlanReceiverError);
});

test("GHR-03A stays a pure parser/decision seam", async () => {
  const receiver = await readFile(new URL("../src/ghr/routes/semantic/receivers/batch-plan.receiver.ts", import.meta.url), "utf8");
  const body = await readFile(new URL("../src/ghr/routes/semantic/bodies/semantic-batch-plan-input.v1.ts", import.meta.url), "utf8");
  assert.match(body, /parseSemanticBatchPlanInputV1/);
  assert.match(body, /canonicalSemanticBatchPlanInputV1/);
  assert.doesNotMatch(body, /JSON\.parse|z\.object|safeParse/);
  assert.doesNotMatch(receiver, /\b(resolveBackground|createDatabase|createTransactionRunner|PgBoss|executeSql|genericHandoffQueue|backgroundExecutionQueue)\b/u);
});
