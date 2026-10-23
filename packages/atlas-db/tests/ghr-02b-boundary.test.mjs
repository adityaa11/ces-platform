import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("GHR-02B stays an accepted-source publisher without a consumer or domain work", async () => {
  const authority = await readFile(new URL("../src/perception-authority.ts", import.meta.url), "utf8");
  const queue = await readFile(new URL("../../../apps/agents-bridge/src/queue.ts", import.meta.url), "utf8");
  assert.match(authority, /perception_admission_policy === "staged-fair-local-v1"/);
  assert.match(authority, /new PostgresGenericHandoffIssuer\(\)\.issue/);
  assert.match(authority, /genericHandoffQueue\.enqueue/);
  for (const prohibited of ["parseSemanticBatchPlanInputV1", "resolveBackground", "generic_handoff_delivery", "receipt", "lease"]) assert.equal(authority.includes(prohibited), false, `acceptance integration must not own ${prohibited}`);
  const genericProducer = queue.slice(queue.indexOf("export async function createTransactionalGenericHandoffQueueProducer"), queue.indexOf("export async function createTransactionalPerceptionQueueProducer"));
  assert.match(genericProducer, /type: "GenericHandoffJob\/v1", handoffId: job\.handoffId/);
  assert.doesNotMatch(genericProducer, /bodyBytes|sourceSha256|credential|destination/);
});
