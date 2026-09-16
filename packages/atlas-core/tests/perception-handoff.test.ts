import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { AtlasPerceptionHandoff, PerceptionSourceGrantIssuer } from "../src/index.ts";

const bytes = new TextEncoder().encode("%PDF-synthetic");
const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
const operation = { executionId: "exec-1", artifactId: "artifact-1", storageKey: "documents/opaque-key", sourceSha256, mimeType: "application/pdf" as const, byteSize: bytes.byteLength, idempotencyKey: "perception:exec-1" };
const result = { version: "v1", executionId: operation.executionId, artifactId: operation.artifactId, sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "mistral", processor: "qualified-ocr", executionId: operation.executionId, processedAt: "2026-09-16T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "block-1", text: "source text" }], tables: [], visualRegions: [] }] } as const;

test("Atlas handoff scopes source redemption and persists an idempotent derived result", async () => {
  const handoff = new AtlasPerceptionHandoff(new PerceptionSourceGrantIssuer("s".repeat(32)), { read: async (storageKey) => { assert.equal(storageKey, operation.storageKey); return bytes; } });
  const request = handoff.start(operation);
  assert.equal(request.source.grant.includes(operation.storageKey), false);
  assert.deepEqual((await handoff.redeem(request)).bytes, bytes);
  handoff.deliver(request, result);
  handoff.deliver(request, result);
  assert.equal(handoff.getOperation(operation.executionId)?.state, "completed");
  assert.deepEqual(handoff.getCached(result), result);
  assert.throws(() => handoff.deliver(request, { ...result, pages: [{ ...result.pages[0], textBlocks: [{ id: "block-1", text: "changed" }] }] }), /stale|conflicts/);
});

test("Atlas handoff rejects a stale or mismatched completion", () => {
  const handoff = new AtlasPerceptionHandoff(new PerceptionSourceGrantIssuer("s".repeat(32)), { read: async () => bytes });
  const request = handoff.start(operation);
  assert.throws(() => handoff.deliver({ ...request, executionId: "exec-2" }, result), /stale|unauthorized/);
  assert.throws(() => handoff.deliver(request, { ...result, artifactId: "other" }), /does not match/);
});

test("Atlas handoff rejects conflicting idempotency-key reuse before issuing a second operation", () => {
  const handoff = new AtlasPerceptionHandoff(new PerceptionSourceGrantIssuer("s".repeat(32)), { read: async () => bytes });
  handoff.start(operation);
  assert.throws(() => handoff.start({ ...operation, executionId: "exec-2" }), /idempotency key conflicts/);
});
