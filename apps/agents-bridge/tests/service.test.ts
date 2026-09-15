import assert from "node:assert/strict";
import test from "node:test";
import type { ReasoningRuntime } from "@atlas/contracts";
import { createBridgeApp } from "../src/app.ts";
import { TestRuntime } from "../src/runtime.ts";

const request = { version: "v1", executionId: "run-1", mode: "interactive", skill: { id: "example.skill", version: "1" }, input: { prompt: "hello" }, context: { boundary: "workspace:ws-1", items: [] } };

test("health and readiness are available without the Atlas UI", async () => {
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "test" });
  try {
    assert.deepEqual(JSON.parse((await app.inject({ method: "GET", url: "/healthz" })).body), { status: "ok" });
    assert.deepEqual(JSON.parse((await app.inject({ method: "GET", url: "/readyz" })).body), { status: "ready", version: "test" });
  } finally { await app.close(); }
});

test("interactive execution emits ordered SSE events and closes", async () => {
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "test" });
  try {
    const response = await app.inject({ method: "POST", url: "/v1/interactive/execute", payload: request });
    assert.match(response.headers["content-type"] ?? "", /^text\/event-stream/);
    assert.match(response.body, /event: text/);
    assert.match(response.body, /event: complete/);
    assert.ok(response.body.indexOf("event: text") < response.body.indexOf("event: complete"));
  } finally { await app.close(); }
});

test("the interactive route rejects background and malformed work", async () => {
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "test" });
  try {
    assert.equal((await app.inject({ method: "POST", url: "/v1/interactive/execute", payload: { ...request, mode: "background" } })).statusCode, 400);
    assert.equal((await app.inject({ method: "POST", url: "/v1/interactive/execute", payload: { ...request, context: { items: [] } } })).statusCode, 400);
  } finally { await app.close(); }
});

test("client cancellation aborts the shared runtime and closes the SSE stream", async () => {
  let cancellationObserved: (() => void) | undefined;
  const cancelled = new Promise<void>((resolve) => { cancellationObserved = resolve; });
  const runtime: ReasoningRuntime = {
    async *execute(_request, { signal }) {
      yield { type: "text", text: "first chunk" };
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => { cancellationObserved?.(); resolve(); }, { once: true }));
      yield { type: "complete" };
    }
  };
  const app = createBridgeApp({ runtime, version: "test" });
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  const controller = new AbortController();
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/interactive/execute`, { method: "POST", body: JSON.stringify(request), headers: { "content-type": "application/json" }, signal: controller.signal });
    const reader = response.body?.getReader();
    assert.ok(reader);
    const decoder = new TextDecoder();
    let content = "";
    while (!content.includes("first chunk")) {
      const chunk = await reader.read();
      if (chunk.done) break;
      content += decoder.decode(chunk.value, { stream: true });
    }
    assert.match(content, /first chunk/);
    controller.abort();
    await Promise.race([cancelled, new Promise((_, reject) => setTimeout(() => reject(new Error("runtime was not cancelled")), 1000))]);
  } finally { await app.close(); }
});
