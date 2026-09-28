import assert from "node:assert/strict";
import test from "node:test";
import { runSemanticJob } from "../src/semantic-worker.ts";
import { SemanticReplayLeaseLostError } from "../src/semantic-result-replay.ts";
import type { SemanticBackgroundJob } from "@atlas/contracts";

const job: SemanticBackgroundJob = { version: "v1", executionId: "semantic-execution", skill: { id: "atlas.semantic.extract", version: "v1" }, contextCapability: "capability" };
const scope = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: job.executionId, contractVersion: "v1" };
const context = { version: "v1", skill: "atlas.semantic.extract", scope, normalizedDocument: { version: "v1", executionId: "perception", artifactId: "document", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "mistral", processor: "ocr", executionId: "perception", processedAt: "2026-09-28T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] } } as const;
const result = { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] } as const;

test("semantic worker invokes the production structured boundary, stages before delivery, and replays without another provider call", async () => {
  let calls = 0; const staged: unknown[] = []; const delivered: unknown[] = [];
  const replay = { load: async () => staged[0], stage: async (_key: string, _execution: string, value: unknown) => { staged.push(value); }, acknowledge: async () => {} };
  const client = { context: async () => context, deliver: async (value: unknown) => { delivered.push(value); }, fail: async () => { throw new Error("unexpected failure"); } };
  const provider = { structured: async () => { calls += 1; return { value: result, provenance: { provider: "mistral" as const, model: "configured", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }; } };
  await runSemanticJob(job, provider as never, client, replay, "semantic-key", new AbortController().signal);
  assert.equal(calls, 1); assert.equal(staged.length, 1); assert.equal(delivered.length, 1);
  await runSemanticJob(job, provider as never, client, replay, "semantic-key", new AbortController().signal);
  assert.equal(calls, 1, "a durable staged envelope is delivered unchanged without a second provider call");
  assert.equal(delivered.length, 2);
});

test("semantic worker fails closed for unavailable and malformed production work", async () => {
  const provider = { structured: async () => ({ value: { malformed: true }, provenance: { provider: "mistral" as const, model: "configured", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }) };
  const failures: unknown[] = [];
  await runSemanticJob(job, provider as never, { context: async () => context, deliver: async () => { throw new Error("must not deliver malformed output"); }, fail: async (failure: unknown) => { failures.push(failure); } }, { load: async () => undefined, stage: async () => { throw new Error("must not stage malformed output"); }, acknowledge: async () => {} }, "semantic-key-invalid", new AbortController().signal);
  assert.equal(failures.length, 1);
  await assert.rejects(() => runSemanticJob({ ...job, skill: { id: "atlas.semantic.unknown", version: "v1" } } as never, provider as never, { context: async () => context, deliver: async () => {}, fail: async () => {} }, { load: async () => undefined, stage: async () => {}, acknowledge: async () => {} }, "semantic-key-unknown", new AbortController().signal));
});

test("a stale semantic claimant redelivers an immutable winning stage instead of reporting a terminal failure", async () => {
  const winning = { version: "v1", scope, skill: job.skill, provider: { provider: "mistral", model: "winning", endpoint: "/v1/chat/completions", latencyMilliseconds: 1, attempt: 1 }, result };
  const delivered: unknown[] = []; const failures: unknown[] = [];
  let loads = 0;
  await runSemanticJob(job, { structured: async () => ({ value: result, provenance: { provider: "mistral" as const, model: "stale", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }) } as never, { context: async () => context, deliver: async (value: unknown) => { delivered.push(value); }, fail: async (value: unknown) => { failures.push(value); } }, { load: async () => (++loads === 1 ? undefined : winning), stage: async () => { throw new SemanticReplayLeaseLostError("superseded"); }, acknowledge: async () => {} }, "semantic-key-race", new AbortController().signal, { owner: "stale-worker", generation: 2 });
  assert.deepEqual(delivered, [winning]); assert.equal(failures.length, 0);
});

test("a post-stage delivery failure remains retryable and never reports the durable result as failed", async () => {
  const failures: unknown[] = [];
  await assert.rejects(() => runSemanticJob(
    job,
    { structured: async () => ({ value: result, provenance: { provider: "mistral" as const, model: "configured", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }) } as never,
    { context: async () => context, deliver: async () => { throw new Error("Atlas result transport timed out"); }, fail: async (failure: unknown) => { failures.push(failure); } },
    { load: async () => undefined, stage: async (_key: string, _execution: string, value: unknown) => value, acknowledge: async () => {} },
    "semantic-key-post-stage-timeout",
    new AbortController().signal,
  ));
  assert.equal(failures.length, 0);
});
