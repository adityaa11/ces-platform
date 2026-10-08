import assert from "node:assert/strict";
import test from "node:test";
import type { DocumentPerceptionRequest, NormalizedDocument } from "@atlas/contracts";
import { createAtlasPerceptionClients, loadAtlasPerceptionClientConfig } from "../src/atlas-perception-client.ts";

const credential = "service-credential-that-is-at-least-32-bytes-long";
const request: DocumentPerceptionRequest = {
  version: "v1",
  executionId: "exec-client",
  artifact: { id: "artifact-client", mimeType: "application/pdf", byteSize: 4, sourceSha256: "a".repeat(64) },
  source: { grant: "123e4567-e89b-12d3-a456-426614174000." + "a".repeat(43) },
  perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
};
const result: NormalizedDocument = {
  version: "v1",
  executionId: request.executionId,
  artifactId: request.artifact.id,
  sourceSha256: request.artifact.sourceSha256,
  perception: request.perception,
  provider: { name: "mistral", processor: "ocr-qualified", executionId: request.executionId, processedAt: "2026-09-16T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }],
};

test("Atlas perception client config requires a bounded internal URL and service credential", () => {
  assert.deepEqual(loadAtlasPerceptionClientConfig({ AGENTS_BRIDGE_SERVICE_CREDENTIAL: credential }), {
    baseUrl: "http://localhost:3001",
    sourcePath: "/internal/perception/source",
    resultPath: "/internal/perception/result",
    failurePath: "/internal/perception/failure",
    derivedAssetPath: "/internal/perception/derived",
    serviceCredential: credential,
    maximumSourceBytes: 20 * 1024 * 1024,
    maximumResultBytes: 10 * 1024 * 1024,
    timeoutMilliseconds: 30_000,
  });
  assert.throws(() => loadAtlasPerceptionClientConfig({ AGENTS_BRIDGE_SERVICE_CREDENTIAL: "short" }), /SERVICE_CREDENTIAL/);
  assert.throws(() => loadAtlasPerceptionClientConfig({ AGENTS_BRIDGE_SERVICE_CREDENTIAL: credential, AGENTS_BRIDGE_ATLAS_URL: "https://user:pass@example.test" }), /without credentials/);
  assert.throws(() => loadAtlasPerceptionClientConfig({ AGENTS_BRIDGE_SERVICE_CREDENTIAL: credential, AGENTS_BRIDGE_ATLAS_SOURCE_PATH: "/internal/.." }), /bounded absolute/);
});

test("Atlas perception clients keep credentials in headers and enforce bounded, typed handoffs", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url, init });
    if (url.endsWith("/source")) return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "content-type": "application/pdf", "content-length": "4" } });
    assert.equal(url, "http://atlas.test/internal/perception/result");
    assert.equal(init?.headers && (init.headers as Record<string, string>).authorization, `Bearer ${credential}`);
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body, { request, result });
    return new Response(null, { status: 204 });
  };
  const clients = createAtlasPerceptionClients({ baseUrl: "http://atlas.test", sourcePath: "/internal/perception/source", resultPath: "/internal/perception/result", failurePath: "/internal/perception/failure", derivedAssetPath: "/internal/perception/derived", serviceCredential: credential, maximumSourceBytes: 4, maximumResultBytes: 10_000, timeoutMilliseconds: 1_000 }, fetcher);
  const source = await clients.source.redeem(request, new AbortController().signal);
  assert.deepEqual([...source.bytes], [1, 2, 3, 4]);
  await clients.results.deliver(request, result, new AbortController().signal);
  assert.equal(calls.length, 2);
  assert.equal((calls[0]?.init?.headers as Record<string, string>).authorization, `Bearer ${credential}`);
});

test("Atlas perception client rejects an oversized source before returning bytes", async () => {
  const clients = createAtlasPerceptionClients({ baseUrl: "http://atlas.test", sourcePath: "/source", resultPath: "/result", failurePath: "/failure", derivedAssetPath: "/derived", serviceCredential: credential, maximumSourceBytes: 3, maximumResultBytes: 10_000, timeoutMilliseconds: 1_000 }, async () => new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "content-type": "application/pdf", "content-length": "4" } }));
  await assert.rejects(() => clients.source.redeem(request, new AbortController().signal), /exceeded its configured byte limit/);
});

test("derived handoff sends raw PNG bytes and bounded metadata, never JSON-encoded image data", async () => {
  let headers: HeadersInit | undefined; let body: BodyInit | null | undefined;
  const clients = createAtlasPerceptionClients({ baseUrl: "http://atlas.test", sourcePath: "/source", resultPath: "/result", failurePath: "/failure", derivedAssetPath: "/derived", serviceCredential: credential, maximumSourceBytes: 4, maximumResultBytes: 10_000, timeoutMilliseconds: 1_000 }, async (url, init) => {
    assert.equal(url, "http://atlas.test/derived"); headers = init?.headers; body = init?.body; return new Response(JSON.stringify({ assetRef: "derived/123e4567-e89b-12d3-a456-426614174000" }), { status: 200, headers: { "content-type": "application/json" } });
  });
  const descriptor = { sourceSha256: request.artifact.sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 3, locatorId: "docling-visual-p3-1", mediaType: "image/png" as const, width: 1, height: 1, byteLength: 4, sha256: "b".repeat(64), bytes: new Uint8Array([1, 2, 3, 4]) };
  assert.deepEqual(await clients.results.handoffDerived(request, descriptor, new AbortController().signal), { assetRef: "derived/123e4567-e89b-12d3-a456-426614174000" });
  assert.equal((headers as Record<string, string>)["content-type"], "image/png");
  assert.deepEqual([...Buffer.from(body as Buffer)], [1, 2, 3, 4]);
  assert.equal((headers as Record<string, string>)["x-atlas-derived-metadata"].includes("AQIDBA"), false);
});

test("Atlas perception clients classify a 5xx handoff as retryable unavailability", async () => {
  const clients = createAtlasPerceptionClients({ baseUrl: "http://atlas.test", sourcePath: "/source", resultPath: "/result", failurePath: "/failure", derivedAssetPath: "/derived", serviceCredential: credential, maximumSourceBytes: 4, maximumResultBytes: 10_000, timeoutMilliseconds: 1_000 }, async () => new Response("temporary outage", { status: 503 }));
  await assert.rejects(() => clients.source.redeem(request, new AbortController().signal), /unavailable/);
});

test("a broken raw derived-asset transfer is retryable, while an actual cancellation remains distinct", async () => {
  const clients = createAtlasPerceptionClients({ baseUrl: "http://atlas.test", sourcePath: "/source", resultPath: "/result", failurePath: "/failure", derivedAssetPath: "/derived", serviceCredential: credential, maximumSourceBytes: 4, maximumResultBytes: 10_000, timeoutMilliseconds: 1_000 }, async () => { throw new TypeError("socket closed mid-upload"); });
  const descriptor = { sourceSha256: request.artifact.sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 1, locatorId: "partial-upload", mediaType: "image/png" as const, width: 1, height: 1, byteLength: 4, sha256: "b".repeat(64), bytes: new Uint8Array([1, 2, 3, 4]) };
  await assert.rejects(() => clients.results.handoffDerived(request, descriptor, new AbortController().signal), /unavailable/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(() => clients.results.handoffDerived(request, descriptor, controller.signal), /cancelled/);
});
