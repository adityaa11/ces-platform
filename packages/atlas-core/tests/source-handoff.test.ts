import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readVerifiedPerceptionSource } from "../src/index.ts";

const bytes = new TextEncoder().encode("%PDF-synthetic");
const source = { storageKey: "documents/private", sourceSha256: createHash("sha256").update(bytes).digest("hex"), mimeType: "application/pdf" as const, byteSize: bytes.byteLength };

test("Atlas verifies bounded source bytes before handoff", async () => {
  const result = await readVerifiedPerceptionSource({ read: async () => bytes }, source, 1024);
  assert.deepEqual(result.bytes, bytes);
  assert.equal("storageKey" in result, false);
});

test("Atlas rejects source mismatch before provider submission", async () => {
  await assert.rejects(() => readVerifiedPerceptionSource({ read: async () => new Uint8Array([1]) }, source, 1024), /byte-size mismatch/);
  await assert.rejects(() => readVerifiedPerceptionSource({ read: async () => bytes }, { ...source, sourceSha256: "0".repeat(64) }, 1024), /SHA-256 mismatch/);
});
