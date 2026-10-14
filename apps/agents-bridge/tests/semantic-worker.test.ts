import assert from "node:assert/strict";
import test from "node:test";
import { runSemanticJob } from "../src/semantic-worker.ts";
import { finalizeExtractionProposal } from "../src/semantic-extraction-finalizer.ts";
import { SemanticReplayLeaseLostError } from "../src/semantic-result-replay.ts";
import { AtlasSemanticClientError } from "../src/atlas-semantic-client.js";
import { runOfflineStepwiseComposition } from "../src/semantic-offline-stepwise-composition.ts";
import type { SemanticBackgroundJob } from "@atlas/contracts";

const job: SemanticBackgroundJob = { version: "v1", executionId: "semantic-execution", skill: { id: "atlas.semantic.extract", version: "v1" }, contextCapability: "capability" };
const scope = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: job.executionId, contractVersion: "v1" };
const context = { version: "v1", skill: "atlas.semantic.extract", scope, normalizedDocument: { version: "v1", executionId: "perception", artifactId: "document", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "mistral", processor: "ocr", executionId: "perception", processedAt: "2026-09-28T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] } } as const;
const proposal = { version: "v1", source_results: [] } as const;
const result = { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] } as const;

const sourceSlots = [
  { slot: "slot-000001", pageNumber: 1, locatorType: "table" as const, locatorId: "table-1", content: "Account must be active." },
  { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region" as const, locatorId: "legend-1", content: "Legend: active accounts are green.", role: "reference_context" as const },
] as const;
const candidate = { semantic_key: "account activation", kind: "rule", payload: { status: "active" }, normalized_meaning: "An account must be active.", needs_resolution: false } as const;

test("deterministic extraction finalizer derives Atlas-owned IDs and source evidence without mutating proposal meaning", () => {
  const input = { version: "v1", source_results: [{ slot: "slot-000001", classification: "candidate", candidates: [candidate], non_fact_reason: null, questions: [{ question: "Which accounts?", reason: "The scope is not specified." }] }] };
  const first = finalizeExtractionProposal({ proposal: input, sourceSlots });
  const second = finalizeExtractionProposal({ proposal: input, sourceSlots });
  assert.deepEqual(first, second);
  assert.deepEqual(first.candidate_assertions[0], {
    local_candidate_id: "candidate-slot-000001-001", semantic_key: candidate.semantic_key, kind: candidate.kind, payload: candidate.payload,
    normalized_meaning: candidate.normalized_meaning, source_wording: sourceSlots[0].content, needs_resolution: false,
    evidence_refs: [
      { page_number: 1, locator_type: "table", locator_id: "table-1", excerpt: sourceSlots[0].content },
    ],
  });
  assert.equal(first.source_statement_inventory[0]?.source_unit_id, "source-unit-slot-000001");
  assert.deepEqual(first.questions[0]?.evidence_refs, [{ page_number: 1, locator_type: "table", locator_id: "table-1", excerpt: sourceSlots[0].content }]);
});

test("deterministic extraction finalizer rejects malformed, foreign, missing, duplicate, and context-only proposal slots", () => {
  const validSource = { classification: "candidate", candidates: [candidate], non_fact_reason: null, questions: [] };
  assert.throws(() => finalizeExtractionProposal({ proposal: { version: "v1", source_results: [{ slot: "slot-000001", ...validSource, evidence_refs: [] }] }, sourceSlots }), /unrecognized key/i);
  assert.throws(() => finalizeExtractionProposal({ proposal: { version: "v1", source_results: [] }, sourceSlots }), /omitted owned source slot/);
  assert.throws(() => finalizeExtractionProposal({ proposal: { version: "v1", source_results: [{ slot: "slot-000001", ...validSource }, { slot: "slot-000001", ...validSource }] }, sourceSlots }), /duplicate source result/);
  assert.throws(() => finalizeExtractionProposal({ proposal: { version: "v1", source_results: [{ slot: "slot-000002", ...validSource }] }, sourceSlots }), /non-owned, foreign, or dangling/);
  assert.throws(() => finalizeExtractionProposal({ proposal: { version: "v1", source_results: [{ slot: "slot-000001", ...validSource, candidates: [{ ...candidate, kind: "RULE" }] }] }, sourceSlots }), /invalid|expected/i);
  assert.throws(() => finalizeExtractionProposal({ proposal: { version: "v1", source_results: [{ slot: "slot-000001", ...validSource }] }, sourceSlots, acceptedContextEvidence: [] } as never), /caller-supplied contextual slot pairs/);
});

test("semantic worker invokes the production structured boundary, stages before delivery, and replays without another provider call", async () => {
  let calls = 0; const staged: unknown[] = []; const delivered: unknown[] = [];
  const replay = { load: async () => staged[0], stage: async (_key: string, _execution: string, value: unknown) => { staged.push(value); }, acknowledge: async () => {} };
  const client = { context: async () => context, deliver: async (value: unknown) => { delivered.push(value); }, fail: async () => { throw new Error("unexpected failure"); } };
  const provider = { structured: async () => { calls += 1; return { value: proposal, provenance: { provider: "mistral" as const, model: "configured", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }; } };
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
  await runSemanticJob(job, { structured: async () => ({ value: proposal, provenance: { provider: "mistral" as const, model: "stale", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }) } as never, { context: async () => context, deliver: async (value: unknown) => { delivered.push(value); }, fail: async (value: unknown) => { failures.push(value); } }, { load: async () => (++loads === 1 ? undefined : winning), stage: async () => { throw new SemanticReplayLeaseLostError("superseded"); }, acknowledge: async () => {} }, "semantic-key-race", new AbortController().signal, { owner: "stale-worker", generation: 2 });
  assert.deepEqual(delivered, [winning]); assert.equal(failures.length, 0);
});

test("a post-stage delivery failure remains retryable and never reports the durable result as failed", async () => {
  const failures: unknown[] = [];
  await assert.rejects(() => runSemanticJob(
    job,
    { structured: async () => ({ value: proposal, provenance: { provider: "mistral" as const, model: "configured", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }) } as never,
    { context: async () => context, deliver: async () => { throw new Error("Atlas result transport timed out"); }, fail: async (failure: unknown) => { failures.push(failure); } },
    { load: async () => undefined, stage: async (_key: string, _execution: string, value: unknown) => value, acknowledge: async () => {} },
    "semantic-key-post-stage-timeout",
    new AbortController().signal,
  ));
  assert.equal(failures.length, 0);
});

test("a deterministic post-stage validation rejection uses the existing terminal failure path", async () => {
  const failures: unknown[] = [];
  await runSemanticJob(job, { structured: async () => ({ value: proposal, provenance: { provider: "mistral" as const, model: "configured", endpoint: "/v1/chat/completions" as const, latencyMilliseconds: 1, attempt: 1 } }) } as never, { context: async () => context, deliver: async () => { throw new AtlasSemanticClientError("result", "Atlas semantic result handoff was rejected.", 422); }, fail: async (failure: unknown) => { failures.push(failure); } }, { load: async () => undefined, stage: async (_key: string, _execution: string, value: unknown) => value, acknowledge: async () => {} }, "semantic-key-validation-rejection", new AbortController().signal);
  assert.deepEqual(failures, [{ version: "v1", scope, code: "integrity_validation", message: "Semantic execution failed before a trusted result was delivered." }]);
});

test("offline stepwise composition rejects a forged media grant before provider or SQL effects", async () => {
  let dispatches = 0; let sqlCalls = 0;
  const bytes = new Uint8Array([1, 2, 3]);
  await assert.rejects(() => runOfflineStepwiseComposition({
    scope: { projectId: "offline-project", workspaceId: "offline-workspace", bundleId: "offline-bundle", documentId: "offline-document", executionId: "semantic-offline", sourceSha256: "a".repeat(64) },
    normalizedDocument: { version: "v1", executionId: "perception-offline", artifactId: "offline-document", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "pdf", executionId: "perception-offline", processedAt: "2026-10-14T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "owned", text: "A fact." }], tables: [], visualRegions: [{ id: "visual", assetRef: "asset-1" }] }] },
    assetIdentities: [{ pageNumber: 1, locatorId: "visual", assetRef: "asset-1", sha256: "b".repeat(64), sourceSha256: "a".repeat(64) }],
    media: new Map([["asset-1", { assetRef: "asset-1", sha256: "b".repeat(64), sourceSha256: "a".repeat(64), mimeType: "image/png" as const, width: 1, height: 1, bytes }]]),
    relationshipScope: { projectId: "offline-project", workspaceId: "offline-workspace", bundleId: "offline-bundle", documentId: "offline-document", executionId: "perception-offline", artifactId: "offline-document", sourceSha256: "a".repeat(64) },
    trustedPriorRevisions: [], rawResponse: {}, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", latencyMilliseconds: 1, attempt: 1 },
  }, {
    database: { executeSql: async () => { sqlCalls += 1; return { rows: [] }; } }, idempotencyKey: "offline-media-forgery", lease: { owner: "offline-test", generation: 1 },
    routes: [], routeId: "offline", profileId: "offline", nowEpochMilliseconds: 0,
    dispatch: async () => { dispatches += 1; return {}; },
  }), /OFFLINE_CONTEXT_BLOCKED/);
  assert.equal(dispatches, 0); assert.equal(sqlCalls, 0);
});
