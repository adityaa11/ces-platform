import assert from "node:assert/strict";
import test from "node:test";
import { parseDocumentPerceptionRequest, parseNormalizedDocument } from "../src/index.ts";

const hash = "a".repeat(64);
const grant = `123e4567-e89b-12d3-a456-426614174000.${"a".repeat(43)}`;

test("perception request is bounded, opaque, and path-free", () => {
  const request = { version: "v1", executionId: "exec-1", artifact: { id: "artifact-1", mimeType: "application/pdf", byteSize: 42, sourceSha256: hash }, source: { grant }, perception: { capability: "atlas.document.perceive", contractVersion: "v1" } };
  assert.deepEqual(parseDocumentPerceptionRequest(request), request);
  assert.throws(() => parseDocumentPerceptionRequest({ ...request, storagePath: "C:\\private.pdf" }), /Invalid document perception request/);
  assert.throws(() => parseDocumentPerceptionRequest({ ...request, artifact: { ...request.artifact, mimeType: "image/png" } }), /Invalid document perception request/);
  assert.throws(() => parseDocumentPerceptionRequest({ ...request, source: { grant: "C:\\private.pdf" } }), /Invalid document perception request/);
  assert.throws(() => parseDocumentPerceptionRequest({ ...request, source: { grant: "file:///private.pdf" } }), /Invalid document perception request/);
  assert.throws(() => parseDocumentPerceptionRequest({ ...request, artifact: { ...request.artifact, id: "/etc/passwd" } }), /Invalid document perception request/);
});

test("normalized document preserves perception structure but rejects semantic leakage", () => {
  const normalized = { version: "v1", executionId: "exec-1", artifactId: "artifact-1", sourceSha256: hash, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "mistral", processor: "mistral-ocr", executionId: "provider-1", processedAt: "2026-09-16T00:00:00.000Z" }, pages: [{ number: 1, width: 612, height: 792, textBlocks: [{ id: "block-1", text: "Approved?", boundingBox: { x: 1, y: 2, width: 3, height: 4 }, confidence: 0.99 }], tables: [], visualRegions: [{ id: "region-1", assetRef: "derived/exec-1/region-1.png" }] }] };
  assert.deepEqual(parseNormalizedDocument(normalized), normalized);
  assert.throws(() => parseNormalizedDocument({ ...normalized, semanticCandidates: [] }), /Invalid normalized document/);
});
