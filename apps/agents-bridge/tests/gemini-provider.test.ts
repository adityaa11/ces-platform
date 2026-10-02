import assert from "node:assert/strict";
import test from "node:test";
import { normalizePerceptionResult } from "@atlas/core";
import { assertGeminiRouteAdapter } from "../src/route-registry.ts";
import { QualifiedRouteRuntime } from "../src/runtime.ts";
import { GeminiProvider, type GeminiProviderConfig } from "../src/providers/gemini.ts";

const config: GeminiProviderConfig = { apiKey: "gemini-secret-test", baseUrl: "https://gemini.test", structuredModel: "model-structured", chatModel: "model-chat", perceptionModel: "model-pdf", maxDocumentBytes: 32, maxRequestBytes: 100_000, maxResponseBytes: 50_000, maxStreamBytes: 50_000, timeoutMilliseconds: 1000, zeroDataRetentionApproved: false };
const response = (payload: unknown) => new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
const envelope = (text: string, extra: Record<string, unknown> = {}) => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }], ...extra });
const bridgeError = (error: unknown, code: string): error is Error & { readonly code: string } => error instanceof Error && typeof (error as { readonly code?: unknown }).code === "string" && (error as { readonly code: string }).code === code;

test("structured request maps bounded neutral messages and revalidates Atlas schema", async () => {
  let url = ""; let init: RequestInit | undefined;
  const provider = new GeminiProvider(config, async (input, request) => { url = input; init = request; return response(envelope('{"answer":"ok"}', { usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 3 } })); });
  const schema = { type: "object", additionalProperties: false, required: ["answer"], properties: { answer: { type: "string" } } };
  const result = await provider.structured({ messages: [{ role: "system", content: "follow rules" }, { role: "user", content: "hello" }], schema, signal: new AbortController().signal });
  assert.deepEqual(result.value, { answer: "ok" }); assert.match(url, /models\/model-structured:generateContent$/u);
  assert.equal((init?.headers as Record<string, string>)["x-goog-api-key"], config.apiKey);
  const body = JSON.parse(String(init?.body)) as { contents: { role: string; parts: { text: string }[] }[]; systemInstruction: { parts: { text: string }[] } };
  assert.equal(body.contents[0]?.role, "user"); assert.equal(body.contents[0]?.parts[0]?.text, "hello"); assert.equal(body.systemInstruction.parts[0]?.text, "follow rules");
  assert.equal(result.provenance.usage?.inputTokens, 2);
  const bad = new GeminiProvider(config, async () => response(envelope('{"answer":"ok","extra":true}')));
  await assert.rejects(() => bad.structured({ messages: [], schema, signal: new AbortController().signal }), (error: unknown) => bridgeError(error, "malformed_response"));
  const invalidJson = new GeminiProvider(config, async () => response(envelope("not-json")));
  await assert.rejects(() => invalidJson.structured({ messages: [], schema, signal: new AbortController().signal }), (error: unknown) => bridgeError(error, "malformed_response"));
});

test("PDF perception sends only bounded inline bytes and normalizes without invented optional metadata", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const provider = new GeminiProvider(config, async (_url, init) => { requestBody = JSON.parse(String(init.body)) as Record<string, unknown>; return response(envelope('{"pages":[{"page_number":1,"markdown":"Synthetic PDF text"}]}', { usageMetadata: { promptTokenCount: 20 } })); });
  const result = await provider.perceive({ bytes: new Uint8Array([1, 2, 3]), mimeType: "application/pdf" }, new AbortController().signal);
  const parts = ((((requestBody?.contents as Record<string, unknown>[])[0]?.parts) as Record<string, unknown>[]));
  assert.equal((parts[1]?.inlineData as { mimeType: string }).mimeType, "application/pdf");
  assert.equal((parts[1]?.inlineData as { data: string }).data, "AQID");
  const normalized = normalizePerceptionResult({ executionId: "exec", artifactId: "doc", sourceSha256: "a".repeat(64), provider: { provider: result.provenance.provider, processor: result.provenance.model, executionId: "exec", processedAt: "2026-10-01T00:00:00.000Z" }, result: result.providerResult as { pages: readonly unknown[] } });
  assert.equal(normalized.pages[0]?.textBlocks[0]?.text, "Synthetic PDF text");
  assert.equal("boundingBox" in normalized.pages[0]!.textBlocks[0]!, false); assert.equal("confidence" in normalized.pages[0]!.textBlocks[0]!, false);
  await assert.rejects(() => provider.perceive({ bytes: new Uint8Array(33), mimeType: "application/pdf" }, new AbortController().signal), (error: unknown) => bridgeError(error, "invalid_request"));
  await assert.rejects(() => provider.perceive({ bytes: new Uint8Array([1]), mimeType: "text/plain" }, new AbortController().signal), (error: unknown) => bridgeError(error, "invalid_request"));
});

test("stream normalizes text and tools, completes once, and normalizes stable secret-safe errors", async () => {
  const streamBody = [
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "hello" }] } }] })}`,
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ functionCall: { id: "f1", name: "lookup", args: { q: 1 } } }] }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 1 } })}`,
    "",
  ].join("\n");
  const streamProvider = new GeminiProvider(config, async () => new Response(streamBody, { status: 200, headers: { "content-type": "text/event-stream" } }));
  const events = []; for await (const event of streamProvider.streamChat({ messages: [{ role: "user", content: "hi" }], tools: [{ name: "lookup", parameters: { type: "object" } }], signal: new AbortController().signal })) events.push(event);
  assert.deepEqual(events.map((event) => event.type), ["text", "tool_call", "complete"]);
  assert.equal(events.filter((event) => event.type === "complete").length, 1);
  const errorProvider = new GeminiProvider(config, async () => new Response("secret provider body", { status: 401 }));
  await assert.rejects(() => errorProvider.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => bridgeError(error, "authentication") && !error.message.includes("secret"));
});

test("safety refusal finish reason becomes a stable secret-safe Bridge error without successful completion", async () => {
  const payload = { candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }], blockedDetail: "provider-private-body gemini-secret-test" };
  const provider = new GeminiProvider(config, async () => new Response(`data: ${JSON.stringify(payload)}\n\n`, { status: 200, headers: { "content-type": "text/event-stream" } }));
  const events: string[] = [];
  let observedError: unknown;
  try {
    for await (const event of provider.streamChat({ messages: [{ role: "user", content: "hi" }], signal: new AbortController().signal })) events.push(event.type);
  } catch (error) { observedError = error; }
  assert.deepEqual(events, []);
  assert.ok(bridgeError(observedError, "provider_unavailable"));
  assert.equal(observedError.message, "Gemini declined to complete the requested response.");
  assert.doesNotMatch(observedError.message, /provider-private-body|gemini-secret-test/u);
  assert.equal(events.includes("complete"), false);
});

test("cancellation, request bounds, credentials and SDK boundary fail safely", async () => {
  let fetchSignal: AbortSignal | undefined;
  const pending = new GeminiProvider(config, (_url, init) => new Promise((_resolve, reject) => { fetchSignal = init.signal as AbortSignal; fetchSignal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }); }));
  const controller = new AbortController(); const operation = pending.structured({ messages: [], schema: { type: "object" }, signal: controller.signal }); controller.abort();
  await assert.rejects(operation, (error: unknown) => bridgeError(error, "cancelled")); assert.equal(fetchSignal?.aborted, true);
  const bounded = new GeminiProvider({ ...config, maxRequestBytes: 20 }, async () => response(envelope("{}")));
  await assert.rejects(() => bounded.structured({ messages: [{ role: "user", content: "x".repeat(100) }], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => bridgeError(error, "invalid_request"));
  const noCredential = new GeminiProvider({ ...config, apiKey: undefined });
  await assert.rejects(() => noCredential.structured({ messages: [], schema: {}, signal: new AbortController().signal }), (error: unknown) => bridgeError(error, "authentication"));
  const { readFile } = await import("node:fs/promises"); const source = await readFile(new URL("../src/providers/gemini.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from ["']@google\/genai/u);
});

test("stream cancellation after emitted output stops without completion or provider replay", async () => {
  let calls = 0;
  const provider = new GeminiProvider(config, async () => {
    calls += 1;
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "first" }] } }] })}\n`)); } });
    return new Response(body, { status: 200 });
  });
  const controller = new AbortController(); const iterator = provider.streamChat({ messages: [{ role: "user", content: "hi" }], signal: controller.signal })[Symbol.asyncIterator]();
  assert.equal((await iterator.next()).value?.type, "text"); controller.abort();
  await assert.rejects(() => iterator.next(), (error: unknown) => bridgeError(error, "cancelled"));
  assert.equal(calls, 1);
});

test("Gemini route identity resolves only pinned models and dispatches to its neutral streaming capability", async () => {
  const route = { routeId: "gemini-chat-dev", capability: "atlas.chat.default" as const, providerId: "gemini", modelOrProcessorId: "model-chat", adapterVersion: "gemini-adapter-v1", qualificationVersion: "qualification-v1", qualificationRef: "qualification://chat", workClass: "interactive", enabled: true };
  assert.doesNotThrow(() => assertGeminiRouteAdapter(route, { structuredModel: "model-structured", chatModel: "model-chat", perceptionModel: "model-pdf" }));
  assert.throws(() => assertGeminiRouteAdapter({ ...route, modelOrProcessorId: "other-model" }, { structuredModel: "model-structured", chatModel: "model-chat", perceptionModel: "model-pdf" }), /does not match pinned Gemini/u);
  let calls = 0;
  const runtime = new QualifiedRouteRuntime(() => route, {
    gemini: { async *streamChat() { calls += 1; yield { type: "complete", provenance: { provider: "gemini", model: "model-chat", endpoint: "streamGenerateContent", latencyMilliseconds: 1, attempt: 1 } }; } },
  });
  const events = [];
  for await (const event of runtime.execute({ version: "v1", executionId: "run", mode: "interactive", skill: { id: "atlas.chat.default", version: "1" }, input: { prompt: "synthetic" }, context: { boundary: "workspace:test", items: [] } }, { signal: new AbortController().signal })) events.push(event);
  assert.equal(calls, 1); assert.deepEqual(events, [{ type: "complete" }]);
});
