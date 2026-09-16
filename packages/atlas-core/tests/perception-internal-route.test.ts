import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { createPerceptionInternalRoutes } from "../src/index.ts";

const bytes = new TextEncoder().encode("%PDF-route-test");
const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
const request = { version: "v1", executionId: "exec-route", artifact: { id: "artifact-route", sourceSha256, mimeType: "application/pdf", byteSize: bytes.byteLength }, source: { grant: "11111111-1111-4111-8111-111111111111.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }, perception: { capability: "atlas.document.perceive", contractVersion: "v1" } } as const;
const result = { version: "v1", executionId: request.executionId, artifactId: request.artifact.id, sourceSha256, perception: request.perception, provider: { name: "test", processor: "test", executionId: "exec-route", processedAt: "2026-09-16T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] } as const;
test("internal routes authenticate, redact failures, and never expose storage keys", async () => {
  const calls: string[] = [];
  const authority = { create: async () => request, redeem: async () => ({ executionId: request.executionId, artifactId: request.artifact.id, sourceSha256, mimeType: "application/pdf" as const, byteSize: bytes.byteLength, storageKey: "documents/private" }), deliver: async () => { calls.push("deliver"); }, getCached: async () => undefined, invalidateCache: async () => {} };
  const routes = createPerceptionInternalRoutes({ authority, sources: { read: async (key) => { assert.equal(key, "documents/private"); return bytes; } }, serviceCredential: "s".repeat(32) });
  assert.equal((await routes.redeem("wrong", request)).status, 401);
  const redeemed = await routes.redeem("s".repeat(32), request);
  assert.equal(redeemed.status, 200); assert.equal(redeemed.contentType, "application/pdf"); assert.equal(JSON.stringify(redeemed.body).includes("documents/private"), false);
  assert.equal((await routes.deliver("s".repeat(32), request, result)).status, 204); assert.deepEqual(calls, ["deliver"]);
  assert.equal((await routes.deliver("s".repeat(32), request, { ...result, provider: { ...result.provider, executionId: "wrong-execution" } })).status, 400);
  assert.equal((await routes.redeem("s".repeat(32), { ...request, extra: "x".repeat(16 * 1024) })).status, 400);
  assert.deepEqual(calls, ["deliver"]);
});
