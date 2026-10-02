import assert from "node:assert/strict";
import test from "node:test";
import { loadBridgeConfig } from "../src/config.ts";
import { configuredGeminiQualificationRecord, qualifyLiveGemini } from "../src/live-gemini-qualification-core.ts";
import { BridgeProviderError, type ProviderProvenance } from "../src/provider-capabilities.ts";

const config = loadBridgeConfig({ GEMINI_API_KEY: "must-not-appear-in-record", GEMINI_API_BASE_URL: "https://generativelanguage.googleapis.com/v1", GEMINI_STRUCTURED_MODEL: "gemini-structured-pinned", GEMINI_PERCEPTION_MODEL: "gemini-perception-pinned" });
const provenance: ProviderProvenance = { provider: "gemini", model: "gemini-pinned", endpoint: "generateContent", latencyMilliseconds: 12, attempt: 1, usage: { inputTokens: 2 } };

test("Gemini qualification record is identity-rich and secret-safe", () => {
  const record = configuredGeminiQualificationRecord(config); const serialized = JSON.stringify(record);
  assert.equal(record.baseUrlOrigin, "https://generativelanguage.googleapis.com");
  assert.equal(serialized.includes("must-not-appear-in-record"), false);
});

test("Gemini qualification requires real adapter calls and records only observations", async () => {
  let structuredCalls = 0; let perceptionCalls = 0;
  const record = await qualifyLiveGemini(config, {
    async structured(input) { structuredCalls += 1; return { value: structuredCalls === 1 ? { qualified: true } : structuredCalls === 2 ? { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] } : { version: "v1", relationships: [], questions: [] }, provenance }; },
    async perceive() { perceptionCalls += 1; return { providerResult: { pages: [{ page_number: 1, markdown: "Synthetic qualification content" }] }, provenance }; },
    async *streamChat() {},
  });
  assert.equal(structuredCalls, 3); assert.equal(perceptionCalls, 1); assert.equal(record.outcome, "success");
  assert.equal(record.observations?.minimalInference.usagePresent, true);
  assert.equal(JSON.stringify(record).includes("Synthetic qualification content"), false);
});

test("Gemini qualification records an external credential/provider failure without an error body", async () => {
  const missing = loadBridgeConfig({ GEMINI_STRUCTURED_MODEL: "pinned", GEMINI_PERCEPTION_MODEL: "pinned" });
  const record = await qualifyLiveGemini(missing, {} as never);
  assert.deepEqual(record.outcome, "failure"); assert.equal(record.errorCode, "authentication");
  const failed = await qualifyLiveGemini(config, { async structured() { throw new BridgeProviderError("rate_limited", "private provider response"); }, async perceive() { throw new Error("unreachable"); }, async *streamChat() {} });
  assert.equal(failed.errorCode, "rate_limited"); assert.equal(JSON.stringify(failed).includes("private provider response"), false);
});
