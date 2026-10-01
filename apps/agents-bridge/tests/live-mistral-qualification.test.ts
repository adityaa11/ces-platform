import assert from "node:assert/strict";
import test from "node:test";
import { loadBridgeConfig } from "../src/config.ts";
import { configuredQualificationRecord, qualifyLiveMistral } from "../src/live-mistral-qualification-core.ts";
import { BridgeProviderError, type ProviderProvenance } from "../src/providers/mistral.ts";

const config = loadBridgeConfig({
  MISTRAL_API_KEY: "must-not-appear-in-record",
  MISTRAL_API_BASE_URL: "https://credential-in-url@api.mistral.ai/v1/",
  MISTRAL_STRUCTURED_MODEL: "structured-qualified",
  MISTRAL_CHAT_MODEL: "chat-qualified",
  MISTRAL_OCR_MODEL: "ocr-qualified",
  MISTRAL_ZDR_APPROVED: "true",
});

test("live qualification record is identity-rich but secret-safe", () => {
  const record = configuredQualificationRecord(config);
  const serialized = JSON.stringify(record);
  assert.equal(record.baseUrlOrigin, "https://api.mistral.ai");
  assert.equal(record.structuredModel, "structured-qualified");
  assert.equal(record.zeroDataRetentionApproved, true);
  assert.equal(serialized.includes("must-not-appear-in-record"), false);
  assert.equal(serialized.includes("credential-in-url"), false);
});

test("live qualification records adapter provenance without response content", async () => {
  const provenance: ProviderProvenance = { provider: "mistral", model: "actual-model", endpoint: "/v1/chat/completions", latencyMilliseconds: 1, attempt: 1 };
  const record = await qualifyLiveMistral(config, {
    async structured() { return { value: { qualified: true }, provenance }; },
  });
  assert.deepEqual(record, {
    qualification: "idser-011-01",
    outcome: "success",
    credentialPresent: true,
    configured: configuredQualificationRecord(config),
    actual: { provider: "mistral", model: "actual-model", endpoint: "/v1/chat/completions", attempt: 1 },
  });
});

test("live qualification classifies provider failure without exposing an error message", async () => {
  const record = await qualifyLiveMistral(config, {
    async structured() { throw new BridgeProviderError("authentication", "private provider response"); },
  });
  assert.equal(record.outcome, "failure");
  assert.equal(record.errorCode, "authentication");
  assert.equal(JSON.stringify(record).includes("private provider response"), false);
});
