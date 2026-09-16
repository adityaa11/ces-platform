import assert from "node:assert/strict";
import test from "node:test";
import { normalizePerceptionResult } from "../src/index.ts";

test("normalization preserves localized perception without creating semantics", () => {
  const normalized = normalizePerceptionResult({
    executionId: "exec-1", artifactId: "artifact-1", sourceSha256: "b".repeat(64),
    provider: { provider: "mistral", processor: "mistral-ocr-4-1", executionId: "provider-exec-1", processedAt: "2026-09-16T00:00:00.000Z" },
    result: { pages: [{ index: 0, markdown: "Fallback page markdown", dimensions: { width: 612, height: 792 }, blocks: [{ id: "block-1", text: "Approved?", type: "text", bbox: { x: 2, y: 3, width: 40, height: 10 }, confidence_scores: { average_content_confidence_score: 0.8 } }], tables: [{ markdown: "| A | B |" }], images: [{ id: "image-1", label: "diagram", bbox: [1, 2, 31, 42], assetRef: "derived/exec-1/image-1.png" }] }] },
  });
  assert.equal(normalized.pages[0]?.textBlocks[0]?.text, "Approved?");
  assert.equal(normalized.pages[0]?.number, 1);
  assert.equal(normalized.pages[0]?.textBlocks[0]?.confidence, 0.8);
  assert.equal(normalized.pages[0]?.tables[0]?.content, "| A | B |");
  assert.deepEqual(normalized.pages[0]?.visualRegions[0]?.boundingBox, { x: 1, y: 2, width: 30, height: 40 });
  assert.equal(normalized.pages[0]?.visualRegions[0]?.assetRef, "derived/exec-1/image-1.png");
  assert.equal("semanticCandidates" in normalized, false);
});

test("normalization retains page markdown when OCR blocks contain no text", () => {
  const normalized = normalizePerceptionResult({
    executionId: "exec-1", artifactId: "artifact-1", sourceSha256: "b".repeat(64),
    provider: { provider: "mistral", processor: "mistral-ocr-4-1", executionId: "provider-exec-1", processedAt: "2026-09-16T00:00:00.000Z" },
    result: { pages: [{ index: 0, markdown: "Localized page text", blocks: [{ type: "image" }] }] },
  });
  assert.equal(normalized.pages[0]?.textBlocks[0]?.text, "Localized page text");
});

test("normalization rejects provider regions that would leak non-derived asset URLs", () => {
  assert.throws(() => normalizePerceptionResult({
    executionId: "exec-1", artifactId: "artifact-1", sourceSha256: "b".repeat(64),
    provider: { provider: "mistral", processor: "mistral-ocr-4-1", executionId: "provider-exec-1", processedAt: "2026-09-16T00:00:00.000Z" },
    result: { pages: [{ images: [{ assetRef: "https://provider.example/image.png" }] }] },
  }), /Invalid normalized document/);
});
