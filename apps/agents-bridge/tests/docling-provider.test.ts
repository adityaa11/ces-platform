import assert from "node:assert/strict";
import test from "node:test";
import { DoclingProvider, doclingAdapterVersion, doclingOptionProfile, doclingServeVersion, doclingSlimVersion, mapDoclingDocument } from "../src/providers/docling.ts";
import { assertConfiguredRouteAdapter } from "../src/route-registry.ts";

const config = { baseUrl: "http://docling-serve:5001", timeoutMilliseconds: 1_000, maxDocumentBytes: 32, maxResponseBytes: 10_000, serviceVersion: doclingServeVersion, doclingSlimVersion, optionProfile: doclingOptionProfile };

test("Docling maps only source-grounded structural JSON with deterministic order", () => {
  const mapped = mapDoclingDocument({ status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/2", label: "text", text: "Second", prov: [{ page_no: 2 }] }, { self_ref: "#/texts/1", label: "section_header", text: "First", prov: [{ page_no: 1 }] }], tables: [{ self_ref: "#/tables/0", markdown: "| A |", prov: [{ page_no: 2 }] }] } } });
  assert.deepEqual(mapped.pages, [{ page_number: 1, blocks: [{ id: "#/texts/1", text: "First", type: "section_header" }], tables: [] }, { page_number: 2, blocks: [{ id: "#/texts/2", text: "Second", type: "text" }], tables: [{ id: "#/tables/0", content: "| A |" }] }]);
  assert.throws(() => mapDoclingDocument({ status: "partial_success", document: { json_content: {} } }), /successful JSON/u);
});

test("Docling adapter sends only PDF bytes and a fixed no-OCR JSON profile", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const provider = new DoclingProvider(config, async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/version")) return new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion }));
    if (url.endsWith("/v1/convert/file")) return new Response(JSON.stringify({ status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/0", text: "PDF text", prov: [{ page_no: 1 }] }] } } }));
    return new Response("{}", { status: 200 });
  });
  const result = await provider.perceive({ bytes: new Uint8Array([1, 2, 3]), mimeType: "application/pdf" }, new AbortController().signal);
  assert.equal(result.providerResult.pages[0]?.page_number, 1);
  assert.equal(calls.map((call) => call.url).join(" "), "http://docling-serve:5001/health http://docling-serve:5001/ready http://docling-serve:5001/version http://docling-serve:5001/v1/convert/file");
  const form = calls[3]?.init?.body as FormData; assert.equal(form.get("pipeline"), "standard"); assert.equal(form.get("do_ocr"), "false"); assert.equal(form.get("force_ocr"), "false"); assert.equal(form.get("do_table_structure"), "true"); assert.equal(form.get("include_images"), "false"); assert.equal(form.get("include_page_images"), "false"); assert.equal(form.get("do_picture_description"), "false"); assert.equal(form.get("do_picture_classification"), "false"); assert.equal(form.get("do_chart_extraction"), "false"); assert.equal(form.get("do_code_enrichment"), "false"); assert.equal(form.get("do_formula_enrichment"), "false"); assert.equal(form.get("to_formats"), "json"); assert.ok(form.get("files") instanceof Blob);
  await assert.rejects(() => provider.perceive({ bytes: new Uint8Array([1]), mimeType: "text/plain" }, new AbortController().signal), /bounded PDF/u);
});

test("Docling route requires its immutable service, runtime, adapter, and profile identity", () => {
  const route = { routeId: "docling-digital-pdf", capability: "atlas.document.perceive" as const, providerId: "docling", modelOrProcessorId: `docling-slim-${doclingSlimVersion}`, adapterVersion: doclingAdapterVersion, qualificationVersion: "bss-v2-004-01", qualificationRef: "qualification://bss-v2-004-01", workClass: "local_processor", enabled: true, extensions: { serviceVersion: doclingServeVersion, optionProfile: doclingOptionProfile, imageDigest: "sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7" } };
  const all = { mistral: { structuredModel: "s", chatModel: "c", ocrModel: "o" }, gemini: { structuredModel: "s", chatModel: "c", perceptionModel: "p" }, docling: config };
  assert.doesNotThrow(() => assertConfiguredRouteAdapter(route, all));
  assert.throws(() => assertConfiguredRouteAdapter({ ...route, extensions: { ...route.extensions, imageDigest: "latest" } }, all), /pinned qualified/u);
});

test("Docling fails closed for readiness loss, timeout, cancellation, malformed responses, and mapper rejection", async () => {
  const baseResponse = () => new Response(JSON.stringify({ status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/0", text: "PDF text", prov: [{ page_no: 1 }] }] } } }));
  const withFetcher = (fetcher: (url: string, init?: RequestInit) => Promise<Response>) => new DoclingProvider(config, fetcher);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/ready") ? new Response("not ready", { status: 503 }) : new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion }))).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /unavailable/u);
  await assert.rejects(() => withFetcher(async () => { throw new Error("network lost"); }).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /could not be reached/u);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/version") ? new Response(JSON.stringify({ docling_serve: "wrong", docling: doclingSlimVersion })) : new Response("{}" )).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /runtime identity/u);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/v1/convert/file") ? new Response("not-json") : url.endsWith("/version") ? new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion })) : new Response("{}")).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /invalid JSON/u);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/v1/convert/file") ? new Response(JSON.stringify({ status: "success", document: { json_content: {} } })) : url.endsWith("/version") ? new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion })) : new Response("{}")).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /no source-grounded/u);
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(() => withFetcher(async () => { throw new Error("aborted"); }).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, aborted.signal), /cancelled/u);
  void baseResponse;
});
