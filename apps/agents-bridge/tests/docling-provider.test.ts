import assert from "node:assert/strict";
import test from "node:test";
import { DoclingProvider, doclingAdapterVersion, doclingOptionProfile, doclingRun003OptionProfile, doclingServeVersion, doclingSlimVersion, mapDoclingCapture, mapDoclingDocument } from "../src/providers/docling.ts";
import { assertConfiguredRouteAdapter } from "../src/route-registry.ts";

const config = { baseUrl: "http://docling-serve:5001", timeoutMilliseconds: 1_000, maxDocumentBytes: 32, maxResponseBytes: 10_000, serviceVersion: doclingServeVersion, doclingSlimVersion, optionProfile: doclingOptionProfile };

test("Docling maps only source-grounded structural JSON with deterministic order", () => {
  const cell = { text: "A", row_span: 1, col_span: 1, column_header: true, row_header: false, row_section: false };
  const mapped = mapDoclingDocument({ status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/2", label: "text", text: "Second", prov: [{ page_no: 2 }] }, { self_ref: "#/texts/1", label: "section_header", text: "First", prov: [{ page_no: 1 }] }], tables: [{ self_ref: "#/tables/0", prov: [{ page_no: 2 }], data: { grid: [[cell]], table_cells: [cell] } }] } } });
  assert.deepEqual(mapped.pages, [{ page_number: 1, blocks: [{ id: "docling-text-p1-2", text: "First", type: "section_header" }], tables: [], visual_regions: [] }, { page_number: 2, blocks: [{ id: "docling-text-p2-1", text: "Second", type: "text" }], tables: [{ id: "docling-table-p2-1", content: "| A |\n\n<!-- atlas-docling-grid-v1:[[{\"row\":0,\"column\":0,\"text\":\"A\",\"rowSpan\":1,\"columnSpan\":1,\"columnHeader\":true,\"rowHeader\":false,\"rowSection\":false}]] -->" }], visual_regions: [] }]);
  assert.throws(() => mapDoclingDocument({ status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/missing", text: "No page", prov: [] }] } } }), /invalid page provenance/u);
  assert.throws(() => mapDoclingDocument({ status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/same", text: "One", prov: [{ page_no: 2 }] }, { self_ref: "#/texts/same", text: "Two", prov: [{ page_no: 2 }] }] } } }), /duplicate source identity/u);
  assert.throws(() => mapDoclingDocument({ status: "success", document: { json_content: { texts: [{ text: "No source page", prov: [] }] } } }), /invalid page provenance/u);
  assert.throws(() => mapDoclingDocument({ status: "partial_success", document: { json_content: {} } }), /successful JSON/u);
});

test("RUN-003 capture validates a transient PNG descriptor without an asset pointer", () => {
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1]), Buffer.alloc(8)]).toString("base64");
  const source = "a".repeat(64);
  const raw = { status: "success", document: { json_content: { texts: [{ text: "Caption from source", prov: [{ page_no: 3 }] }], pictures: [{ self_ref: "#/pictures/0", prov: [{ page_no: 3, bbox: { l: 1, t: 2, r: 11, b: 22 } }], data: { image: png, mime_type: "image/png", dimensions: { width: 1, height: 1 } } }] } } };
  const mapped = mapDoclingCapture(raw, source, doclingRun003OptionProfile);
  assert.deepEqual(mapped.pages[0], { page_number: 3, blocks: [{ id: "docling-text-p3-1", text: "Caption from source", type: "text" }], tables: [], visual_regions: [{ id: "docling-visual-p3-1", bbox: { x: 1, y: 2, width: 10, height: 20 } }] });
  assert.equal(mapped.transientVisualDescriptors.length, 1);
  assert.equal(mapped.transientVisualDescriptors[0]?.sourceReference, "#/pictures/0");
  assert.equal(JSON.stringify(mapped.pages).includes("derived/"), false);
  assert.throws(() => mapDoclingCapture({ ...raw, document: { json_content: { ...raw.document.json_content, pictures: [{ ...raw.document.json_content.pictures[0], data: { ...raw.document.json_content.pictures[0].data, mime_type: "image/jpeg" } }] } } }, source, doclingRun003OptionProfile), /unsupported image metadata/u);
  assert.throws(() => mapDoclingCapture({ ...raw, document: { json_content: { ...raw.document.json_content, pictures: [{ ...raw.document.json_content.pictures[0], prov: [{ page_no: 3, bbox: { l: -1, t: 2, r: 11, b: 22 } }] }] } } }, source, doclingRun003OptionProfile), /lacks qualified page, geometry/u);
  assert.throws(() => mapDoclingCapture({ ...raw, document: { json_content: { ...raw.document.json_content, pictures: [{ ...raw.document.json_content.pictures[0], data: { ...raw.document.json_content.pictures[0].data, image: "not-base64" } }] } } }, source, doclingRun003OptionProfile), /PNG/u);
  assert.throws(() => mapDoclingCapture(raw, source, doclingOptionProfile), /capture profile/u);
});

test("RUN-003 mapping fails closed for nonrepresentable table structures", () => {
  const table = { self_ref: "#/tables/0", prov: [{ page_no: 1 }], data: { grid: [[{ text: "A", row_span: 1, col_span: 1 }]], table_cells: [{ text: "A", row_span: 1, col_span: 1 }] } };
  const document = (candidate: unknown) => ({ status: "success", document: { json_content: { tables: [candidate] } } });
  assert.throws(() => mapDoclingDocument(document({ ...table, data: { ...table.data, grid: [] } })), /no complete grid/u);
  assert.throws(() => mapDoclingDocument(document({ ...table, data: { ...table.data, grid: [[{ text: "A", row_span: 0, col_span: 1 }]] } })), /malformed cell/u);
  assert.throws(() => mapDoclingDocument(document({ ...table, data: { ...table.data, table_cells: [] } })), /no complete grid/u);
});

test("Docling adapter sends only PDF bytes and a fixed no-OCR JSON profile", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const provider = new DoclingProvider(config, async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/version")) return new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion }));
    if (url.endsWith("/v1/convert/file")) return new Response(JSON.stringify({ status: "success", processing_time: 0.001, document: { json_content: { texts: [{ self_ref: "#/texts/0", text: "PDF text", prov: [{ page_no: 1 }] }] } } }));
    return new Response("{}", { status: 200 });
  });
  const result = await provider.perceive({ bytes: new Uint8Array([1, 2, 3]), mimeType: "application/pdf" }, new AbortController().signal);
  assert.equal(result.providerResult.pages[0]?.page_number, 1);
  assert.equal(result.provenance.usage?.raw?.doclingReportedProcessingMilliseconds, 1);
  assert.equal(typeof result.provenance.usage?.raw?.httpRequestTransferMilliseconds, "number");
  assert.equal(typeof result.provenance.usage?.raw?.mappingSerializationMilliseconds, "number");
  assert.equal(calls.map((call) => call.url).join(" "), "http://docling-serve:5001/health http://docling-serve:5001/ready http://docling-serve:5001/version http://docling-serve:5001/v1/convert/file");
  const form = calls[3]?.init?.body as FormData; assert.equal(form.get("pipeline"), "standard"); assert.equal(form.get("do_ocr"), "false"); assert.equal(form.get("force_ocr"), "false"); assert.equal(form.get("do_table_structure"), "true"); assert.equal(form.get("include_images"), "false"); assert.equal(form.get("include_page_images"), "false"); assert.equal(form.get("do_picture_description"), "false"); assert.equal(form.get("do_picture_classification"), "false"); assert.equal(form.get("do_chart_extraction"), "false"); assert.equal(form.get("do_code_enrichment"), "false"); assert.equal(form.get("do_formula_enrichment"), "false"); assert.equal(form.get("to_formats"), "json"); assert.ok(form.get("files") instanceof Blob);
  await assert.rejects(() => provider.perceive({ bytes: new Uint8Array([1]), mimeType: "text/plain" }, new AbortController().signal), /bounded PDF/u);
});

test("Docling route requires its immutable service, runtime, adapter, and profile identity", () => {
  const route = { routeId: "docling-digital-pdf", capability: "atlas.document.perceive" as const, providerId: "docling", modelOrProcessorId: `docling-slim-${doclingSlimVersion}`, adapterVersion: doclingAdapterVersion, qualificationVersion: "bss-v2-004-01", qualificationRef: "qualification://bss-v2-004-01", workClass: "local_processor", enabled: true, extensions: { serviceVersion: doclingServeVersion, optionProfile: doclingOptionProfile, imageDigest: "sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7" } };
  const all = { mistral: { structuredModel: "s", chatModel: "c", ocrModel: "o" }, gemini: { structuredModel: "s", chatModel: "c", perceptionModel: "p" }, docling: config };
  assert.doesNotThrow(() => assertConfiguredRouteAdapter(route, all));
  assert.throws(() => assertConfiguredRouteAdapter({ ...route, extensions: { ...route.extensions, imageDigest: "latest" } }, all), /pinned qualified/u);
  assert.throws(() => assertConfiguredRouteAdapter(route, { ...all, docling: { ...config, optionProfile: doclingRun003OptionProfile } }), /gated pending/u);
});

test("Docling fails closed for readiness loss, timeout, cancellation, malformed responses, and mapper rejection", async () => {
  const baseResponse = () => new Response(JSON.stringify({ status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/0", text: "PDF text", prov: [{ page_no: 1 }] }] } } }));
  const withFetcher = (fetcher: (url: string, init?: RequestInit) => Promise<Response>) => new DoclingProvider(config, fetcher);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/ready") ? new Response("not ready", { status: 503 }) : new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion }))).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /unavailable/u);
  await assert.rejects(() => withFetcher(async () => { throw new Error("network lost"); }).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /could not be reached/u);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/version") ? new Response(JSON.stringify({ docling_serve: "wrong", docling: doclingSlimVersion })) : new Response("{}" )).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /runtime identity/u);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/v1/convert/file") ? new Response("not-json") : url.endsWith("/version") ? new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion })) : new Response("{}")).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /invalid JSON/u);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/v1/convert/file") ? new Response("x".repeat(10_001)) : url.endsWith("/version") ? new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion })) : new Response("{}")).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /response exceeded/u);
  await assert.rejects(() => withFetcher(async (url) => url.endsWith("/v1/convert/file") ? new Response(JSON.stringify({ status: "success", document: { json_content: {} } })) : url.endsWith("/version") ? new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion })) : new Response("{}")).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /no source-grounded/u);
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(() => withFetcher(async () => { throw new Error("aborted"); }).perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, aborted.signal), /cancelled/u);
  let conversionStarted = false;
  const shortTimeout = new DoclingProvider({ ...config, timeoutMilliseconds: 25 }, async (url, init) => {
    if (url.endsWith("/version")) return new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion }));
    if (!url.endsWith("/v1/convert/file")) return new Response("{}");
    conversionStarted = true;
    return await new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("stalled request aborted")), { once: true }));
  });
  const started = Date.now();
  await assert.rejects(() => shortTimeout.perceive({ bytes: new Uint8Array([1]), mimeType: "application/pdf" }, new AbortController().signal), /configured timeout/u);
  assert.ok(conversionStarted);
  assert.ok(Date.now() - started < 500, "the stalled request must be bounded by the configured deadline");
  void baseResponse;
});
