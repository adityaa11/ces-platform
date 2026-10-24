import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test from "node:test";
import { loadBridgeConfig } from "../src/config.ts";
import { createGenericHandoffHttpDispatcher, GenericHandoffHttpDispatcherConfigurationError } from "../src/ghr/http-dispatcher.ts";
import { resolveMainRouteBinding } from "../src/ghr/main-route-index.ts";
import { semanticBatchPlanRoute } from "../src/ghr/routes/semantic/index.ts";

const credential = "g".repeat(32);
const request = Object.freeze({
  serializedEnvelopeBytes: new TextEncoder().encode('{"header":{"handoffId":"ghr-handoff-1"},"body":{"can_continue":false}}'),
  handoffId: "ghr-handoff-1",
  bodySha256: "a".repeat(64),
});
const registration = resolveMainRouteBinding({ ...semanticBatchPlanRoute, main: "semantic" });

async function withListener(run: (origin: string, state: { mode: string; requests: number; method?: string; url?: string; authorization?: string; body?: Uint8Array }) => Promise<void>): Promise<void> {
  const state: { mode: string; requests: number; method?: string; url?: string; authorization?: string; body?: Uint8Array } = { mode: "success", requests: 0 };
  const server: Server = createServer((incoming, outgoing) => {
    state.requests += 1;
    state.method = incoming.method;
    state.url = incoming.url;
    state.authorization = incoming.headers.authorization;
    const chunks: Buffer[] = [];
    incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
    incoming.on("end", () => {
      state.body = Buffer.concat(chunks);
      if (state.mode === "timeout") return void setTimeout(() => outgoing.end(), 100);
      if (state.mode === "redirect") { outgoing.writeHead(302, { location: "/other" }); return void outgoing.end(); }
      if (state.mode === "oversized") { outgoing.writeHead(200, { "content-length": "8193", "content-type": "application/json" }); return void outgoing.end("{}"); }
      if (state.mode === "malformed") { outgoing.writeHead(200, { "content-type": "application/json" }); return void outgoing.end("{"); }
      if (state.mode === "mismatch") { outgoing.writeHead(200, { "content-type": "application/json" }); return void outgoing.end(JSON.stringify({ handoffId: "other", bodySha256: request.bodySha256, disposition: "parsed_only" })); }
      if (state.mode === "server_error") { outgoing.writeHead(503); return void outgoing.end(); }
      outgoing.writeHead(200, { "content-type": "application/json" });
      outgoing.end(JSON.stringify({ handoffId: request.handoffId, bodySha256: request.bodySha256, disposition: "parsed_only" }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP listener.");
  try { await run(`http://127.0.0.1:${address.port}`, state); } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("GHR-04A exposes only the single registered HTTP receiver through exact resolution", () => {
  assert.deepEqual(registration.receiver, { transport: "http", method: "POST", path: "/internal/semantic/batch-plan" });
  for (const mismatch of [{ main: "unknown" }, { branch: "other" }, { handlerVersion: "v2" }]) {
    assert.throws(() => resolveMainRouteBinding({ ...semanticBatchPlanRoute, ...mismatch } as never));
  }
});

test("GHR-04A configuration is deployment-owned, private-origin-only, and fails closed", () => {
  assert.equal(loadBridgeConfig({}).genericHandoffHttpTransport, undefined);
  assert.throws(() => loadBridgeConfig({ AGENTS_BRIDGE_GHR_HTTP_ORIGIN: "https://public.example", AGENTS_BRIDGE_SERVICE_CREDENTIAL: credential }), /private HTTP origin/u);
  assert.throws(() => loadBridgeConfig({ AGENTS_BRIDGE_GHR_HTTP_ORIGIN: "http://agents-bridge", AGENTS_BRIDGE_SERVICE_CREDENTIAL: "short" }), /at least 32 bytes/u);
  const config = loadBridgeConfig({ AGENTS_BRIDGE_GHR_HTTP_ORIGIN: "http://agents-bridge", AGENTS_BRIDGE_SERVICE_CREDENTIAL: credential }).genericHandoffHttpTransport;
  assert.deepEqual({ origin: config?.origin, timeoutMilliseconds: config?.timeoutMilliseconds, maximumResponseBytes: config?.maximumResponseBytes }, { origin: "http://agents-bridge", timeoutMilliseconds: 30_000, maximumResponseBytes: 8_192 });
});

test("GHR-04A dispatcher rejects untrusted receiver data before it can perform I/O", () => {
  const configuration = { origin: "http://127.0.0.1:3002", credential, timeoutMilliseconds: 25, maximumResponseBytes: 8_192 } as const;
  assert.throws(() => createGenericHandoffHttpDispatcher({ origin: "https://public.example", credential, timeoutMilliseconds: 25, maximumResponseBytes: 8_192 } as never, registration), GenericHandoffHttpDispatcherConfigurationError);
  assert.throws(() => createGenericHandoffHttpDispatcher({ origin: "http://127.0.0.1:3002", credential: "short", timeoutMilliseconds: 25, maximumResponseBytes: 8_192 } as never, registration), GenericHandoffHttpDispatcherConfigurationError);
  assert.throws(() => createGenericHandoffHttpDispatcher({ origin: "http://127.0.0.1:3002", credential, timeoutMilliseconds: 0, maximumResponseBytes: 0 } as never, registration), GenericHandoffHttpDispatcherConfigurationError);
  assert.throws(
    () => createGenericHandoffHttpDispatcher(configuration, { ...registration, receiver: { ...registration.receiver } }),
    GenericHandoffHttpDispatcherConfigurationError,
  );
  assert.throws(() => createGenericHandoffHttpDispatcher(undefined, registration), GenericHandoffHttpDispatcherConfigurationError);
});

test("GHR-04A dispatcher preserves verified bytes and accepts only a matching bounded acknowledgement", async () => {
  await withListener(async (origin, state) => {
    const dispatcher = createGenericHandoffHttpDispatcher({ origin, credential, timeoutMilliseconds: 250, maximumResponseBytes: 8_192 }, registration);
    assert.deepEqual(await dispatcher.dispatch(request), { status: "acknowledged", acknowledgement: { handoffId: request.handoffId, bodySha256: request.bodySha256, disposition: "parsed_only" } });
    assert.equal(state.requests, 1);
    assert.equal(state.method, "POST");
    assert.equal(state.url, "/internal/semantic/batch-plan");
    assert.equal(state.authorization, `Bearer ${credential}`);
    assert.deepEqual(state.body, Buffer.from(request.serializedEnvelopeBytes));

    for (const [mode, expected] of [["redirect", "failed_closed"], ["oversized", "invalid_acknowledgement"], ["malformed", "invalid_acknowledgement"], ["mismatch", "invalid_acknowledgement"], ["server_error", "unavailable"]] as const) {
      state.mode = mode;
      assert.deepEqual(await dispatcher.dispatch(request), { status: expected });
    }
    state.mode = "timeout";
    const timeoutDispatcher = createGenericHandoffHttpDispatcher({ origin, credential, timeoutMilliseconds: 25, maximumResponseBytes: 8_192 }, registration);
    assert.deepEqual(await timeoutDispatcher.dispatch(request), { status: "unavailable" });
  });
});
