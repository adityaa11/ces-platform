import assert from "node:assert/strict";
import test from "node:test";
import { parseProviderAdmittedJob } from "../src/provider-admitted-worker.ts";

test("provider admitted queue payload accepts only durable identity metadata", () => {
  assert.deepEqual(parseProviderAdmittedJob({ logicalWorkId: "work-1", attemptNumber: 1, reservationId: "00000000-0000-4000-8000-000000000001" }), {
    logicalWorkId: "work-1", attemptNumber: 1, reservationId: "00000000-0000-4000-8000-000000000001",
  });
  for (const value of [null, {}, { logicalWorkId: "", attemptNumber: 1, reservationId: "x" }, { logicalWorkId: "work", attemptNumber: 0, reservationId: "x" }, { logicalWorkId: "work", attemptNumber: 1, reservationId: "" }]) {
    assert.throws(() => parseProviderAdmittedJob(value));
  }
});
