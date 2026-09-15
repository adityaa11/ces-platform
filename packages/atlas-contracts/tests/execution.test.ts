import assert from "node:assert/strict";
import test from "node:test";
import { parseExecutionRequest } from "../src/index.ts";

const request = { version: "v1", executionId: "run-1", mode: "interactive", skill: { id: "example.skill", version: "1" }, input: { prompt: "hello" }, context: { boundary: "workspace:ws-1", items: [{ id: "fact-1" }] } };

test("accepts a bounded provider-neutral execution request", () => {
  assert.deepEqual(parseExecutionRequest(request), request);
});

test("rejects unbounded or unsupported request fields", () => {
  assert.throws(() => parseExecutionRequest({ ...request, context: { items: [] } }), /Invalid execution request/);
  assert.throws(() => parseExecutionRequest({ ...request, commitTrustedState: true }), /Invalid execution request/);
});
