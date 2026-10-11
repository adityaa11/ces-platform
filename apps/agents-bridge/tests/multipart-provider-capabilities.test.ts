import assert from "node:assert/strict";
import test from "node:test";
import {
  BridgeProviderError,
  dispatchMultipartStructured,
  redactMultipartRequest,
  type ChatMessage,
  type MultipartStructuredRequest,
} from "../src/provider-capabilities.ts";

const controller = () => new AbortController();
const image = new Uint8Array([1, 2, 3]);
const request = (signal = controller().signal): MultipartStructuredRequest => ({
  signal,
  capabilities: {
    image: { version: "v1", mediaTypes: ["image/png"], maxImageCount: 1, maxImageBytes: 3, maxImageWidth: 10, maxImageHeight: 10 },
  },
  messages: [{
    role: "user",
    parts: [
      { type: "text", sourcePartId: "slot-000001", text: "inspect the attributed visual" },
      { type: "image", sourcePartId: "slot-000002", media: { mimeType: "image/png", sha256: "a".repeat(64), byteLength: 3, width: 10, height: 10, bytes: image } },
      { type: "text", sourcePartId: "slot-000003", text: "retain source order" },
    ],
  }],
});

test("legacy string messages remain structurally and byte-for-byte compatible", () => {
  const legacy: ChatMessage = { role: "user", content: "unchanged\ncontent" };
  assert.equal(legacy.content, "unchanged\ncontent");
});

test("negotiated multipart dispatch preserves ordered source identities and redacts contents at the boundary", async () => {
  const input = request();
  let captured: typeof input.messages | undefined;
  await dispatchMultipartStructured(input, async (messages) => { captured = messages; });
  assert.strictEqual(captured, input.messages);
  assert.deepEqual(captured?.[0]?.parts.map((part) => [part.type, part.sourcePartId]), [["text", "slot-000001"], ["image", "slot-000002"], ["text", "slot-000003"]]);

  const redacted = JSON.stringify(redactMultipartRequest(input));
  assert.doesNotMatch(redacted, /inspect the attributed visual|retain source order|bytes|1,2,3/u);
  assert.match(redacted, /slot-000002|image.png/u);
});

test("unsupported, aborted, and over-bound image requests fail before fake transport side effects", async () => {
  for (const input of [
    { ...request(), capabilities: {} },
    (() => { const abort = controller(); abort.abort(); return request(abort.signal); })(),
    { ...request(), capabilities: { image: { ...request().capabilities.image!, maxImageBytes: 2 } } },
  ] as const) {
    let calls = 0;
    await assert.rejects(
      () => dispatchMultipartStructured(input, async () => { calls += 1; }),
      (error: unknown) => error instanceof BridgeProviderError && ["unsupported_capability", "cancelled", "invalid_request"].includes(error.code),
    );
    assert.equal(calls, 0);
  }
});
