import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentPerception } from "../src/document-perception-worker.ts";

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
