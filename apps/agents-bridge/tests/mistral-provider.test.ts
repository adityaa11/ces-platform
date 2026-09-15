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
