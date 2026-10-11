import assert from "node:assert/strict";
import test from "node:test";
import {
  BridgeProviderError,
  dispatchMultipartStructured,
  preflightMultimodalRequest,
  redactMultipartRequest,
  type ChatMessage,
  type MultimodalRequestProfile,
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

const profile = (imageTpm: MultimodalRequestProfile["imageTpm"] = { state: "qualified", tokensPerImage: 85 }): MultimodalRequestProfile => ({
  version: "v1",
  routeId: "fake-semantic-route",
  profileId: "fake-image-profile",
  profileVersion: "2026-10-12",
  image: { version: "v1", mediaTypes: ["image/png"], maxImageCount: 1, maxImageBytes: 3, maxImageWidth: 10, maxImageHeight: 10 },
  maxPromptBytes: 128,
  maxDeadlineMilliseconds: 1_000,
  imageTpm,
});

const preflight = (overrides: Partial<Parameters<typeof preflightMultimodalRequest>[0]> = {}) => preflightMultimodalRequest({
  routes: [profile()],
  routeId: "fake-semantic-route",
  profileId: "fake-image-profile",
  messages: request().messages,
  schema: { type: "object", properties: { answer: { type: "string" } } },
  signal: controller().signal,
  nowEpochMilliseconds: 10_000,
  deadlineEpochMilliseconds: 10_500,
  ...overrides,
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

test("preflight emits a deterministic redacted request spec and bounded estimator input", () => {
  const first = preflight();
  const second = preflight({ schema: { properties: { answer: { type: "string" } }, type: "object" } });
  assert.deepEqual(first, second);
  assert.equal(first.requestSpec.version, "v1");
  assert.match(first.requestSpec.identity, /^[a-f0-9]{64}$/u);
  assert.equal(first.requestSpec.parts[0]?.type, "text");
  assert.equal(first.requestSpec.parts[1]?.type, "image");
  const persistedShape = JSON.stringify(first);
  assert.doesNotMatch(persistedShape, /inspect the attributed visual|retain source order|1,2,3|base64|secret/iu);
  assert.deepEqual(first.resourceEstimatorInput, {
    version: "v1",
    requestSpecIdentity: first.requestSpec.identity,
    routeId: "fake-semantic-route",
    profileId: "fake-image-profile",
    promptBytes: Buffer.byteLength("inspect the attributed visualretain source order"),
    imageCount: 1,
    imageBytes: 3,
    imagePixels: 100,
    imageTpm: { state: "qualified", tokensPerImage: 85 },
  });
});

test("preflight rejects unknown identity, deadline, media and bounds before authorization or transport", async () => {
  const assertPreflightStops = async (invalid: Partial<Parameters<typeof preflightMultimodalRequest>[0]>) => {
    let authorizations = 0;
    let calls = 0;
    await assert.rejects(async () => {
      preflight(invalid);
      authorizations += 1;
      await dispatchMultipartStructured(request(), async () => { calls += 1; });
    }, BridgeProviderError);
    assert.equal(authorizations, 0);
    assert.equal(calls, 0);
  };
  await assertPreflightStops({ routeId: "unknown-route" });
  await assertPreflightStops({ profileId: "unknown-profile" });
  await assertPreflightStops({ deadlineEpochMilliseconds: 10_000 });
  await assertPreflightStops({ deadlineEpochMilliseconds: 11_001 });
  await assertPreflightStops({ messages: [{ role: "user", parts: [{ type: "image", sourcePartId: "unsupported", media: { mimeType: "image/jpeg" as "image/png", sha256: "b".repeat(64), byteLength: 1, width: 1, height: 1, bytes: new Uint8Array([1]) } }] }] });
  await assertPreflightStops({ messages: [{ role: "user", parts: [{ type: "text", sourcePartId: "too-long", text: "x".repeat(129) }] }] });
});

test("unknown image TPM blocks resource-envelope construction without inventing zero token accounting", () => {
  const result = preflight({ routes: [profile({ state: "unknown" })] });
  assert.deepEqual(result.resourceEstimatorInput, {
    code: "RESOURCE_ENVELOPE_BLOCKED",
    routeId: "fake-semantic-route",
    profileId: "fake-image-profile",
    reason: "unknown_image_tpm",
  });
});

test("aborted, duplicate, restart and cancellation preflight cases stay replay-safe at observable fake boundaries", () => {
  const fakeBoundary = {
    semanticExecutions: [] as string[],
    perceptionJobs: [] as string[],
    permits: [] as string[],
    reservations: [] as string[],
    externalProviderAttempts: [] as string[],
    persistedOrLoggableMetadata: [] as string[],
    observePreflight(overrides: Partial<Parameters<typeof preflightMultimodalRequest>[0]> = {}) {
      const result = preflight(overrides);
      this.persistedOrLoggableMetadata.push(JSON.stringify(result));
      return result;
    },
  };
  const aborted = controller();
  aborted.abort();
  assert.throws(() => fakeBoundary.observePreflight({ signal: aborted.signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "cancelled");
  assert.equal(fakeBoundary.persistedOrLoggableMetadata.length, 0);

  const first = fakeBoundary.observePreflight();
  const duplicate = fakeBoundary.observePreflight();
  const afterRestart = fakeBoundary.observePreflight();
  assert.equal(first.requestSpec.identity, duplicate.requestSpec.identity);
  assert.equal(first.requestSpec.identity, afterRestart.requestSpec.identity);

  const cancelled = controller();
  cancelled.abort();
  assert.throws(() => fakeBoundary.observePreflight({ signal: cancelled.signal }), (error: unknown) => error instanceof BridgeProviderError && error.code === "cancelled");
  assert.equal(fakeBoundary.persistedOrLoggableMetadata.length, 3);

  assert.deepEqual({
    semanticExecutions: fakeBoundary.semanticExecutions.length,
    perceptionJobs: fakeBoundary.perceptionJobs.length,
    permits: fakeBoundary.permits.length,
    reservations: fakeBoundary.reservations.length,
    externalProviderAttemptCount: fakeBoundary.externalProviderAttempts.length,
  }, {
    semanticExecutions: 0,
    perceptionJobs: 0,
    permits: 0,
    reservations: 0,
    externalProviderAttemptCount: 0,
  });
  const capturedMetadata = fakeBoundary.persistedOrLoggableMetadata.join("\n");
  assert.doesNotMatch(capturedMetadata, /inspect the attributed visual|retain source order|1,2,3|base64|credential|secret/iu);
});
