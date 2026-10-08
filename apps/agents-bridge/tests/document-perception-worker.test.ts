import assert from "node:assert/strict";
import test from "node:test";
import { AtlasPerceptionClientError } from "../src/atlas-perception-client.js";
import { runDocumentPerception } from "../src/document-perception-worker.ts";
import { BridgeProviderError } from "../src/providers/mistral.js";

const request = { version: "v1", executionId: "exec-1", artifact: { id: "artifact-1", mimeType: "application/pdf" as const, byteSize: 4, sourceSha256: "a".repeat(64) }, source: { grant: `123e4567-e89b-12d3-a456-426614174000.${"a".repeat(43)}` }, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const } };

test("perception worker receives bounded source bytes and delivers only normalized output", async () => {
  let delivered = false;
  const provider = { perceive: async () => ({ providerResult: { pages: [{ index: 1, blocks: [{ text: "PDF text" }] }] }, provenance: { provider: "mistral" as const, model: "ocr-qualified", endpoint: "/v1/ocr" as const, latencyMilliseconds: 1, attempt: 1 } }) };
  await runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1, 2, 3, 4]), mimeType: "application/pdf" as const }) }, { deliver: async (_request, result) => { delivered = true; assert.equal(result.pages[0]?.textBlocks[0]?.text, "PDF text"); assert.equal("storageKey" in result, false); } }, new AbortController().signal);
  assert.equal(delivered, true);
});

test("perception worker never delivers a provider result returned after cancellation", async () => {
  const controller = new AbortController(); let delivered = false;
  const provider = {
    perceive: async () => {
      controller.abort();
      return { providerResult: { pages: [{ index: 0, markdown: "late" }] }, provenance: { provider: "mistral" as const, model: "ocr-qualified", endpoint: "/v1/ocr" as const, latencyMilliseconds: 1, attempt: 1 } };
    },
  };
  await assert.rejects(() => runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1, 2, 3, 4]), mimeType: "application/pdf" as const }) }, { deliver: async () => { delivered = true; } }, controller.signal), /cancelled/);
  assert.equal(delivered, false);
});

test("a lost result acknowledgement replays staged normalized output without a second provider call", async () => {
  let providerCalls = 0;
  let deliveryCalls = 0;
  let staged: import("@atlas/contracts").NormalizedDocument | undefined;
  const store = {
    load: async () => staged,
    stage: async (_key: string, _execution: string, result: import("@atlas/contracts").NormalizedDocument) => { staged = result; },
    acknowledge: async () => { staged = undefined; },
  };
  const provider = { perceive: async () => { providerCalls += 1; return { providerResult: { pages: [{ index: 0, markdown: "replay" }] }, provenance: { provider: "mistral" as const, model: "ocr-qualified", endpoint: "/v1/ocr" as const, latencyMilliseconds: 1, attempt: 1 } }; } };
  const source = { redeem: async () => ({ bytes: new Uint8Array([1, 2, 3, 4]), mimeType: "application/pdf" as const }) };
  const results = { deliver: async () => { deliveryCalls += 1; if (deliveryCalls === 1) throw new Error("acknowledgement lost after Atlas commit"); } };
  const replay = { idempotencyKey: "perception:exec-1", store };
  await runDocumentPerception(request, provider as never, source, results, new AbortController().signal, replay);
  assert.equal(providerCalls, 1);
  assert.equal(deliveryCalls, 2);
  assert.ok(staged, "the replay row must survive until the worker durably completes its effect");
  await store.acknowledge();
  assert.equal(staged, undefined);
});

test("RUN-003 hands raw descriptors to Atlas before staging an opaque asset reference", async () => {
  let staged: import("@atlas/contracts").NormalizedDocument | undefined;
  const descriptor = { sourceSha256: request.artifact.sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 3, locatorId: "docling-visual-p3-1", mediaType: "image/png" as const, width: 1, height: 1, byteLength: 4, sha256: "b".repeat(64), bytes: new Uint8Array([1, 2, 3, 4]) };
  const provider = { perceive: async () => ({ providerResult: { pages: [{ page_number: 3, blocks: [], tables: [], visual_regions: [{ id: descriptor.locatorId, bbox: { x: 0, y: 0, width: 1, height: 1 } }] }] }, transientVisualDescriptors: [descriptor], requiresAssetHandoff: true, provenance: { provider: "docling", model: "capture", endpoint: "/v1/convert/file", latencyMilliseconds: 1, attempt: 1 } }) };
  await runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1]), mimeType: "application/pdf" as const }) }, { handoffDerived: async (_request, actual) => { assert.equal(actual.bytes, descriptor.bytes); return { assetRef: "derived/123e4567-e89b-12d3-a456-426614174000" }; }, deliver: async (_request, result) => { staged = result; } }, new AbortController().signal);
  assert.equal(staged?.pages[0]?.visualRegions[0]?.assetRef, "derived/123e4567-e89b-12d3-a456-426614174000");
  assert.equal(JSON.stringify(staged).includes("AQIDBA"), false, "replayable output contains no image bytes");
});

test("transient Atlas source and replay-store faults remain with the queue instead of reporting terminal failure", async () => {
  let failures = 0;
  const results = { deliver: async () => undefined, fail: async () => { failures += 1; } };
  await assert.rejects(
    () => runDocumentPerception(request, {} as never, { redeem: async () => { throw new AtlasPerceptionClientError("source", "Atlas source handoff was unavailable."); } }, results, new AbortController().signal, { idempotencyKey: "perception:exec-1", store: { load: async () => { throw new Error("temporary replay read failure"); }, stage: async () => undefined, acknowledge: async () => undefined }, finalAttempt: true }),
    /replay load is temporarily unavailable/,
  );
  await assert.rejects(
    () => runDocumentPerception(request, {} as never, { redeem: async () => { throw new AtlasPerceptionClientError("source", "Atlas source handoff was unavailable."); } }, results, new AbortController().signal),
    /Atlas source handoff was unavailable/,
  );
  assert.equal(failures, 0);
});

test("retryable provider failures become bounded terminal failures only on the final queue attempt", async () => {
  const failures: string[] = [];
  const results = { deliver: async () => undefined, fail: async (failure: { code: string }) => { failures.push(failure.code); } };
  const provider = { perceive: async () => { throw new BridgeProviderError("timeout", "synthetic timeout"); } };
  const replay = { idempotencyKey: "perception:exec-1", store: { load: async () => undefined, stage: async () => undefined, acknowledge: async () => undefined } };
  await assert.rejects(() => runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1]), mimeType: "application/pdf" as const }) }, results, new AbortController().signal, { ...replay, finalAttempt: false }), /synthetic timeout/);
  await runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1]), mimeType: "application/pdf" as const }) }, results, new AbortController().signal, { ...replay, finalAttempt: true });
  assert.deepEqual(failures, ["provider_timeout"]);
});

test("a rejected derived handoff fails the execution instead of stranding its admission slot", async () => {
  const failures: string[] = [];
  const descriptor = { sourceSha256: request.artifact.sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 3, locatorId: "docling-visual-p3-1", mediaType: "image/png" as const, width: 1, height: 1, byteLength: 1, sha256: "b".repeat(64), bytes: new Uint8Array([1]) };
  const provider = { perceive: async () => ({ providerResult: { pages: [{ page_number: 3, blocks: [], tables: [], visual_regions: [{ id: descriptor.locatorId }] }] }, transientVisualDescriptors: [descriptor], requiresAssetHandoff: true, provenance: { provider: "docling", model: "capture", endpoint: "/v1", latencyMilliseconds: 1, attempt: 1 } }) };
  await runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1]), mimeType: "application/pdf" as const }) }, { handoffDerived: async () => { throw new AtlasPerceptionClientError("derived", "Atlas derived handoff was rejected."); }, deliver: async () => undefined, fail: async (failure) => { failures.push(failure.code); } }, new AbortController().signal, { idempotencyKey: "perception:exec-1", store: { load: async () => undefined, stage: async () => undefined, acknowledge: async () => undefined }, finalAttempt: true });
  assert.deepEqual(failures, ["integrity_validation"]);
});

test("a partial or unavailable raw derived transfer stays replayable and never stages a dangling asset reference", async () => {
  let stages = 0; let failures = 0;
  const descriptor = { sourceSha256: request.artifact.sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 3, locatorId: "partial-upload", mediaType: "image/png" as const, width: 1, height: 1, byteLength: 1, sha256: "b".repeat(64), bytes: new Uint8Array([1]) };
  const provider = { perceive: async () => ({ providerResult: { pages: [{ page_number: 3, visual_regions: [{ id: descriptor.locatorId }] }] }, transientVisualDescriptors: [descriptor], requiresAssetHandoff: true, provenance: { provider: "docling" as const, model: "capture", endpoint: "/v1", latencyMilliseconds: 1, attempt: 1 } }) };
  await assert.rejects(() => runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1]), mimeType: "application/pdf" as const }) }, { handoffDerived: async () => { throw new AtlasPerceptionClientError("derived", "Atlas derived handoff was unavailable."); }, deliver: async () => undefined, fail: async () => { failures += 1; } }, new AbortController().signal, { idempotencyKey: "perception:exec-1", store: { load: async () => undefined, stage: async () => { stages += 1; }, acknowledge: async () => undefined }, finalAttempt: true }), /unavailable/);
  assert.equal(stages, 0, "an interrupted binary transfer cannot stage normalized output");
  assert.equal(failures, 0, "a transport outage remains owned by retry/replay");
});

test("a staged RUN-003 result survives an Atlas acceptance outage and replays without another conversion or asset upload", async () => {
  let staged: import("@atlas/contracts").NormalizedDocument | undefined;
  let providerCalls = 0; let handoffs = 0; let deliveries = 0;
  const descriptor = { sourceSha256: request.artifact.sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 3, locatorId: "replay-upload", mediaType: "image/png" as const, width: 1, height: 1, byteLength: 1, sha256: "b".repeat(64), bytes: new Uint8Array([1]) };
  const provider = { perceive: async () => { providerCalls += 1; return { providerResult: { pages: [{ page_number: 3, visual_regions: [{ id: descriptor.locatorId }] }] }, transientVisualDescriptors: [descriptor], requiresAssetHandoff: true, provenance: { provider: "docling" as const, model: "capture", endpoint: "/v1", latencyMilliseconds: 1, attempt: 1 } }; } };
  const replay = { idempotencyKey: "perception:exec-1", store: { load: async () => staged, stage: async (_key: string, _execution: string, value: import("@atlas/contracts").NormalizedDocument) => { staged = value; }, acknowledge: async () => { staged = undefined; } } };
  const results = { handoffDerived: async () => { handoffs += 1; return { assetRef: "derived/123e4567-e89b-12d3-a456-426614174000" }; }, deliver: async () => { deliveries += 1; if (deliveries <= 2) throw new AtlasPerceptionClientError("result", "Atlas result handoff was unavailable."); } };
  await assert.rejects(() => runDocumentPerception(request, provider as never, { redeem: async () => ({ bytes: new Uint8Array([1]), mimeType: "application/pdf" as const }) }, results, new AbortController().signal, replay), /unavailable/);
  assert.ok(staged, "the verified reference is durably staged before an unavailable Atlas acceptance");
  await runDocumentPerception(request, provider as never, { redeem: async () => { throw new Error("replay must not redeem source"); } }, results, new AbortController().signal, replay);
  assert.equal(providerCalls, 1); assert.equal(handoffs, 1); assert.equal(deliveries, 3);
  assert.equal(JSON.stringify(staged).includes("AQIDBA"), false, "Bridge replay retains only the opaque reference, never raw PNG bytes");
});
