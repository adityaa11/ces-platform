import assert from "node:assert/strict";
import test from "node:test";
import { AnomanProvider, anomanMultipartImageCapability, type AnomanProviderConfig } from "../src/providers/anoman.ts";
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

test("Anoman serializes authorized multipart parts in order through bounded fake transport", async () => {
  let calls = 0;
  let init: RequestInit | undefined;
  const provider = new AnomanProvider(config, async (_input, request) => {
    calls += 1;
    init = request;
    return response({ choices: [{ message: { content: "{}" } }] });
  });
  const image = new Uint8Array([1, 2, 3]);
  await provider.structuredMultipart({
    messages: [
      { role: "system", parts: [{ type: "text", sourcePartId: "system-1", text: "prepared instructions" }] },
      { role: "user", parts: [
        { type: "text", sourcePartId: "source-1", text: "inspect this visual" },
        { type: "image", sourcePartId: "source-2", media: { mimeType: "image/png", sha256: "a".repeat(64), byteLength: image.byteLength, width: 1, height: 1, bytes: image } },
        { type: "text", sourcePartId: "source-3", text: "retain source order" },
      ] },
    ],
    schema: { type: "object" },
    signal: new AbortController().signal,
  });
  assert.equal(calls, 1);
  const body = JSON.parse(String(init?.body)) as { readonly messages: readonly { readonly role: string; readonly content: readonly Record<string, unknown>[] }[]; readonly response_format: unknown; readonly temperature: unknown; readonly stream: unknown };
  assert.deepEqual(body.messages.map((message) => [message.role, message.content.map((part) => part.type)]), [["system", ["text"]], ["user", ["text", "image_url", "text"]]]);
  assert.equal(body.messages[1]?.content[0]?.text, "inspect this visual");
  assert.equal((body.messages[1]?.content[1]?.image_url as { readonly url: string }).url, `data:image/png;base64,${Buffer.from(image).toString("base64")}`);
  assert.equal(body.messages[1]?.content[2]?.text, "retain source order");
  assert.deepEqual({ temperature: body.temperature, stream: body.stream, response_format: body.response_format }, { temperature: 0, stream: false, response_format: { type: "json_object" } });
  assert.doesNotMatch(JSON.stringify(body), /sourcePartId|"schema"/u);
});

test("Anoman multipart capability rejects invalid media and cancellation before HTTP side effects", async () => {
  assert.deepEqual(anomanMultipartImageCapability, { version: "v1", mediaTypes: ["image/png"], maxImageCount: 4, maxImageBytes: 512_000, maxImageWidth: 4_096, maxImageHeight: 4_096 });
  for (const message of [
    { role: "user" as const, parts: [{ type: "image" as const, sourcePartId: "bad-type", media: { mimeType: "image/jpeg" as "image/png", sha256: "b".repeat(64), byteLength: 1, width: 1, height: 1, bytes: new Uint8Array([1]) } }] },
    { role: "user" as const, parts: [{ type: "image" as const, sourcePartId: "bad-length", media: { mimeType: "image/png" as const, sha256: "c".repeat(64), byteLength: 2, width: 1, height: 1, bytes: new Uint8Array([1]) } }] },
  ]) {
    let calls = 0;
    const provider = new AnomanProvider(config, async () => { calls += 1; return response({}); });
    await assert.rejects(() => provider.structuredMultipart({ messages: [message], schema: {}, signal: new AbortController().signal }), (error: unknown) => bridgeError(error, "invalid_request"));
    assert.equal(calls, 0);
  }

  let calls = 0;
  const provider = new AnomanProvider(config, async () => { calls += 1; return response({}); });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => provider.structuredMultipart({ messages: [], schema: {}, signal: controller.signal }), (error: unknown) => bridgeError(error, "cancelled"));
  assert.equal(calls, 0);
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
