import assert from "node:assert/strict";
import test from "node:test";
import { parseDocumentPerceptionJob } from "../src/perception-job.ts";

const request = { version: "v1", executionId: "exec-1", artifact: { id: "artifact-1", mimeType: "application/pdf", byteSize: 42, sourceSha256: "a".repeat(64) }, source: { grant: `123e4567-e89b-12d3-a456-426614174000.${"a".repeat(43)}` }, perception: { capability: "atlas.document.perceive", contractVersion: "v1" } };

test("perception queue payload contains an opaque request only", () => {
  assert.equal(parseDocumentPerceptionJob({ idempotencyKey: "perception:exec-1", request }).request.executionId, "exec-1");
  assert.throws(() => parseDocumentPerceptionJob({ idempotencyKey: "perception:exec-1", request, pdfBytes: "base64" }), /Document perception job/);
  assert.throws(() => parseDocumentPerceptionJob({ idempotencyKey: "perception:exec-1", request: { ...request, storagePath: "C:\\source.pdf" } }), /Invalid document perception request/);
  assert.throws(() => parseDocumentPerceptionJob({ idempotencyKey: "perception:exec-1", request: { ...request, artifact: { ...request.artifact, id: "/etc/passwd" } } }), /Invalid document perception request/);
});
