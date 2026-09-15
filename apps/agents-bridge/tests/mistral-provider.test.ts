import assert from "node:assert/strict";
import test from "node:test";
import { BridgeProviderError, MistralProvider, type MistralProviderConfig } from "../src/providers/mistral.ts";
import { MistralChatRuntime } from "../src/runtime.ts";

const config: MistralProviderConfig = { apiKey: "test-secret", baseUrl: "https://mistral.test", structuredModel: "large-qualified", chatModel: "small-qualified", ocrModel: "ocr-qualified", maxDocumentBytes: 32, zeroDataRetentionApproved: false };
const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });

test("structured execution maps a configured model and revalidates the complete schema", async () => {
  let body: Record<string, unknown> | undefined;
  const provider = new MistralProvider(config, async (_url, init) => { body = JSON.parse(String(init.body)) as Record<string, unknown>; return response({ model: "large-qualified", choices: [{ message: { content: '{"answer":"ok"}' } }], usage: { prompt_tokens: 2, completion_tokens: 3 } }); });
  const result = await provider.structured({ messages: [{ role: "user", content: "test" }], schema: { type: "object", additionalProperties: false, required: ["answer"], properties: { answer: { type: "string" } } }, signal: new AbortController().signal });
  assert.deepEqual(result.value, { answer: "ok" });
  assert.equal(body?.model, "large-qualified");
  assert.equal((body?.response_format as { type: string }).type, "json_schema");
  assert.equal(result.provenance.usage?.inputTokens, 2);
});

test("OCR receives only bounded explicit PDF bytes and preserves provider result without storage access", async () => {
  let body: Record<string, unknown> | undefined;
  const provider = new MistralProvider(config, async (_url, init) => { body = JSON.parse(String(init.body)) as Record<string, unknown>; return response({ model: "ocr-qualified", pages: [{ index: 0, markdown: "# PDF", blocks: [], dimensions: { dpi: 72 } }], usage_info: { processed_pages: 1 } }); });
  const result = await provider.perceive({ bytes: new Uint8Array([1, 2, 3]), mimeType: "application/pdf" }, new AbortController().signal);
  assert.equal((body?.document as { type: string }).type, "document_url");
  assert.match((body?.document as { document_url: string }).document_url, /^data:application\/pdf;base64,/);
  assert.equal(result.provenance.usage?.processedPages, 1);
  await assert.rejects(() => provider.perceive({ bytes: new Uint8Array(33), mimeType: "application/pdf" }, new AbortController().signal), (error: unknown) => error instanceof BridgeProviderError && error.code === "invalid_request");
});

test("privacy policy fails closed and stream events are provider-neutral", async () => {
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"hello"}}]}\n\ndata: {"choices":[{"delta":{"tool_calls":[{"id":"call-1","function":{"name":"lookup","arguments":"{}"}}]}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
  const provider = new MistralProvider(config, async () => new Response(stream, { status: 200 }));
  await assert.rejects(() => provider.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal, requireZeroDataRetention: true }), (error: unknown) => error instanceof BridgeProviderError && error.code === "privacy_policy");
  const events = []; for await (const event of provider.streamChat({ messages: [{ role: "user", content: "test" }], signal: new AbortController().signal })) events.push(event);
  assert.deepEqual(events.slice(0, 2), [{ type: "text", text: "hello" }, { type: "tool_call", id: "call-1", name: "lookup", arguments: "{}" }]);
});

test("the Bridge forwards tool-call proposals but never executes them", async () => {
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"tool_calls":[{"id":"call-2","function":{"name":"proposed_action","arguments":"{\\"x\\":1}"}}]}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
  const runtime = new MistralChatRuntime(new MistralProvider(config, async () => new Response(stream, { status: 200 })));
  const events = []; for await (const event of runtime.execute({ version: "v1", executionId: "test", mode: "interactive", skill: { id: "skill", version: "1" }, input: { prompt: "hello" }, context: { boundary: "test", items: [] } }, { signal: new AbortController().signal })) events.push(event);
  assert.deepEqual(events[0], { type: "tool_call", id: "call-2", name: "proposed_action", arguments: "{\"x\":1}" });
  assert.deepEqual(events[1], { type: "complete" });
});

test("streaming joins fragmented tool calls and enforces configured request and response bounds", async () => {
  const fragmented = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call-3","function":{"name":"lookup","arguments":"{\\"q\\":"}}]}}]}\n\ndata: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"atlas\\"}"}}]}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
  const provider = new MistralProvider(config, async () => new Response(fragmented, { status: 200 }));
  const events = []; for await (const event of provider.streamChat({ messages: [{ role: "user", content: "test" }], signal: new AbortController().signal })) events.push(event);
  assert.deepEqual(events[0], { type: "tool_call", id: "call-3", name: "lookup", arguments: "{\"q\":\"atlas\"}" });
  let calls = 0;
  const limited = new MistralProvider({ ...config, maxRequestBytes: 20, maxResponseBytes: 20 }, async () => { calls += 1; return response({}); });
  await assert.rejects(() => limited.structured({ messages: [{ role: "user", content: "this request is deliberately too long" }], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "invalid_request");
  assert.equal(calls, 0);
  const oversized = new MistralProvider({ ...config, maxResponseBytes: 10 }, async () => response({ choices: [{ message: { content: "{}" } }], padding: "too much" }));
  await assert.rejects(() => oversized.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "response_bound");
});

test("provider failures are stable, retried only before output, and never expose credentials", async () => {
  for (const [status, code] of [[401, "authentication"], [400, "invalid_request"], [429, "rate_limited"], [500, "provider_unavailable"]] as const) {
    const provider = new MistralProvider(config, async () => new Response("private provider body test-secret", { status }));
    await assert.rejects(() => provider.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === code && !error.message.includes("test-secret"));
  }
  let attempts = 0;
  const retried = new MistralProvider(config, async () => { attempts += 1; return attempts === 1 ? new Response("", { status: 503 }) : response({ choices: [{ message: { content: "{}" } }] }); });
  await retried.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal });
  assert.equal(attempts, 2);
});

test("capability validation, OCR localization, and stream bounds are enforced before observable provider leakage", async () => {
  let calls = 0;
  const provider = new MistralProvider({ ...config, maxStreamBytes: 1 }, async () => { calls += 1; return new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"hello"}}]}\n\n')); controller.close(); } }), { status: 200 }); });
  assert.throws(() => provider.capabilityModel("not-an-atlas-capability" as never), (error: unknown) => error instanceof BridgeProviderError && error.code === "unsupported_capability");
  await assert.rejects(async () => { for await (const _event of provider.streamChat({ messages: [{ role: "user", content: "test" }], signal: new AbortController().signal })) { /* consume */ } }, (error: unknown) => error instanceof BridgeProviderError && error.code === "response_bound");
  assert.equal(calls, 1);
  const ocr = new MistralProvider(config, async () => response({ model: "ocr-qualified", pages: [{ index: 0, markdown: "text", tables: [{ id: "t" }], images: [{ id: "i", bbox: [1, 2, 3, 4] }], dimensions: { width: 10 }, blocks: [{ top_left_x: 1, confidence_scores: { average_content_confidence_score: 0.9 } }] }], usage_info: { processed_pages: 1 } }));
  const result = await ocr.perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal);
  const page = (result.providerResult.pages as Array<Record<string, unknown>>)[0];
  assert.deepEqual(page.tables, [{ id: "t" }]); assert.deepEqual(page.images, [{ id: "i", bbox: [1, 2, 3, 4] }]); assert.deepEqual(page.dimensions, { width: 10 }); assert.ok(Array.isArray(page.blocks));
});

test("cancellation and timeout map consistently before headers, during JSON, and during SSE without retries after output", async () => {
  const waitForAbort = async (_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true }));
  const before = new AbortController(); const beforeProvider = new MistralProvider(config, waitForAbort); const beforeRun = beforeProvider.structured({ messages: [], schema: { type: "object" }, signal: before.signal }); before.abort();
  await assert.rejects(() => beforeRun, (error: unknown) => error instanceof BridgeProviderError && error.code === "cancelled");
  const timeout = new MistralProvider({ ...config, timeoutMilliseconds: 1 }, waitForAbort);
  await assert.rejects(() => timeout.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "timeout");
  const after = new AbortController();
  const jsonProvider = new MistralProvider(config, async (_url, init) => new Response(new ReadableStream<Uint8Array>({ start(controller) { init.signal?.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")), { once: true }); } }), { status: 200 }));
  const afterRun = jsonProvider.structured({ messages: [], schema: { type: "object" }, signal: after.signal }); setTimeout(() => after.abort(), 0);
  await assert.rejects(() => afterRun, (error: unknown) => error instanceof BridgeProviderError && error.code === "cancelled");
  let attempts = 0;
  const sseProvider = new MistralProvider(config, async () => { attempts += 1; return new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"first"}}]}\n\n')); controller.error(new Error("lost after output")); } }), { status: 200 }); });
  await assert.rejects(async () => { for await (const _event of sseProvider.streamChat({ messages: [{ role: "user", content: "test" }], signal: new AbortController().signal })) { /* consume */ } }, (error: unknown) => error instanceof BridgeProviderError && error.code === "provider_unavailable");
  assert.equal(attempts, 1);
});

test("Bridge-configured retry limits and bounded backoff are honored", async () => {
  let attempts = 0; const waits: number[] = [];
  const provider = new MistralProvider({ ...config, retryMaxAttempts: 3, retryDelayMilliseconds: 7 }, async () => { attempts += 1; return attempts < 3 ? new Response("", { status: 503 }) : response({ choices: [{ message: { content: "{}" } }] }); }, async (milliseconds) => { waits.push(milliseconds); });
  await provider.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal });
  assert.equal(attempts, 3); assert.deepEqual(waits, [7, 14]);
  let limitedAttempts = 0;
  const limited = new MistralProvider({ ...config, retryMaxAttempts: 1 }, async () => { limitedAttempts += 1; return new Response("", { status: 503 }); });
  await assert.rejects(() => limited.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "provider_unavailable");
  assert.equal(limitedAttempts, 1);
});

test("timeout, malformed payloads, and active SSE cancellation use stable error codes", async () => {
  for (const status of [408, 504]) {
    const provider = new MistralProvider(config, async () => new Response("", { status }));
    await assert.rejects(() => provider.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "timeout");
  }
  const malformedJson = new MistralProvider(config, async () => new Response("{", { status: 200 }));
  await assert.rejects(() => malformedJson.structured({ messages: [], schema: { type: "object" }, signal: new AbortController().signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "malformed_response");
  const malformedSse = new MistralProvider(config, async () => new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode("data: {bad}\n\n")); controller.close(); } }), { status: 200 }));
  await assert.rejects(async () => { for await (const _event of malformedSse.streamChat({ messages: [], signal: new AbortController().signal })) { /* consume */ } }, (error: unknown) => error instanceof BridgeProviderError && error.code === "malformed_response");
  const controller = new AbortController();
  const active = new MistralProvider(config, async () => new Response(new ReadableStream<Uint8Array>({ start() { /* blocked until cancellation */ } }), { status: 200 }));
  const run = (async () => { for await (const _event of active.streamChat({ messages: [], signal: controller.signal })) { /* consume */ } })();
  setTimeout(() => controller.abort(), 0);
  await assert.rejects(() => run, (error: unknown) => error instanceof BridgeProviderError && error.code === "cancelled");
});
