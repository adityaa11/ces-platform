import assert from "node:assert/strict";
import test from "node:test";
import { AnomanProvider, type AnomanProviderConfig } from "../src/providers/anoman.ts";
import type { StructuredReasoningProvider } from "../src/provider-capabilities.ts";

const config: AnomanProviderConfig = { apiKey: "anoman-test-secret", baseUrl: "https://api.anoman.io", structuredModel: "gemini-2.5-flash", maxRequestBytes: 100_000, maxResponseBytes: 50_000, timeoutMilliseconds: 1_000, zeroDataRetentionApproved: false };
const response = (payload: unknown) => new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
const bridgeError = (error: unknown, code: string): error is Error & { readonly code: string } => error instanceof Error && (error as { readonly code?: unknown }).code === code;

test("Anoman conforms to the neutral structured reasoning seam", () => {
  const adapter: StructuredReasoningProvider = new AnomanProvider(config);
  assert.ok(adapter);
});

test("Anoman captures only frozen object-mode transport and normalizes bounded provenance", async () => {
  let url = "";
  let init: RequestInit | undefined;
  const provider = new AnomanProvider(config, async (input, request) => {
    url = input;
    init = request;
    return response({ model: "gemini-2.5-flash", system_fingerprint: "fp_test", service_tier: "default", usage: { prompt_tokens: 2, completion_tokens: 3, cached_tokens: 1 }, choices: [{ message: { content: '{"answer":"ok"}' } }] });
  });
  const result = await provider.structured({ messages: [{ role: "system", content: "prepared instructions" }, { role: "user", content: "prepared packet" }], schema: { type: "object", properties: { answer: { type: "string" } } }, signal: new AbortController().signal });
  assert.equal(url, "https://api.anoman.io/v1/chat/completions");
  assert.equal((init?.headers as Record<string, string>).authorization, "Bearer anoman-test-secret");
  const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
  assert.deepEqual(body, { model: "gemini-2.5-flash", messages: [{ role: "system", content: "prepared instructions" }, { role: "user", content: "prepared packet" }], temperature: 0, stream: false, response_format: { type: "json_object" } });
  assert.equal("schema" in body, false);
  assert.deepEqual(result.value, { answer: "ok" });
  assert.deepEqual(result.provenance.usage, { inputTokens: 2, outputTokens: 3, cachedTokens: 1 });
  assert.deepEqual(result.provenance.metadata, { requestedModel: "gemini-2.5-flash", servedModel: "gemini-2.5-flash", system_fingerprint: "fp_test", service_tier: "default", cachedTokens: 1 });
  assert.doesNotMatch(JSON.stringify(result.provenance), /prepared packet|anoman-test-secret/u);
});

test("Anoman maps malformed, oversized, authentication, rate-limit, and provider failures without response-body leakage", async () => {
  const schema = { type: "object" };
  const signal = new AbortController().signal;
  for (const [status, code] of [[401, "authentication"], [429, "rate_limited"], [500, "provider_unavailable"], [504, "timeout"]] as const) {
    const provider = new AnomanProvider(config, async () => new Response("private response anoman-test-secret", { status }));
    await assert.rejects(() => provider.structured({ messages: [], schema, signal }), (error: unknown) => bridgeError(error, code) && !error.message.includes("secret") && !error.message.includes("private"));
  }
  const invalid = new AnomanProvider(config, async () => response({ choices: [{ message: { content: "not-json" } }] }));
  await assert.rejects(() => invalid.structured({ messages: [], schema, signal }), (error: unknown) => bridgeError(error, "malformed_response"));
  const missing = new AnomanProvider(config, async () => response({ choices: [{ message: {} }] }));
  await assert.rejects(() => missing.structured({ messages: [], schema, signal }), (error: unknown) => bridgeError(error, "malformed_response"));
  const oversized = new AnomanProvider({ ...config, maxResponseBytes: 10 }, async () => response({ choices: [{ message: { content: "{}" } }], padding: "too large" }));
  await assert.rejects(() => oversized.structured({ messages: [], schema, signal }), (error: unknown) => bridgeError(error, "response_bound"));
  const bounded = new AnomanProvider({ ...config, maxRequestBytes: 10 }, async () => response({}));
  await assert.rejects(() => bounded.structured({ messages: [{ role: "user", content: "too large" }], schema, signal }), (error: unknown) => bridgeError(error, "invalid_request"));
  const unauthenticated = new AnomanProvider({ ...config, apiKey: undefined });
  await assert.rejects(() => unauthenticated.structured({ messages: [], schema, signal }), (error: unknown) => bridgeError(error, "authentication"));
});

test("Anoman propagates caller cancellation and retention requirements before a provider result", async () => {
  let fetchSignal: AbortSignal | undefined;
  const pending = new AnomanProvider(config, async (_url, init) => new Promise((_resolve, reject) => {
    fetchSignal = init.signal as AbortSignal;
    fetchSignal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  }));
  const controller = new AbortController();
  const operation = pending.structured({ messages: [], schema: {}, signal: controller.signal });
  controller.abort();
  await assert.rejects(() => operation, (error: unknown) => bridgeError(error, "cancelled"));
  assert.equal(fetchSignal?.aborted, true);
  await assert.rejects(() => pending.structured({ messages: [], schema: {}, signal: new AbortController().signal, requireZeroDataRetention: true }), (error: unknown) => bridgeError(error, "privacy_policy"));
});
