import assert from "node:assert/strict";
import test from "node:test";
import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { DoclingProvider, doclingAdapterVersion, doclingCapabilityIdentity, doclingOptionProfile, doclingRun003OptionProfile, doclingServeVersion, doclingSlimVersion, mapDoclingCapture, mapDoclingDocument } from "../src/providers/docling.ts";
import { assertConfiguredRouteAdapter } from "../src/route-registry.ts";
import { parseNormalizedDocument } from "@atlas/contracts";
import { PostgresPerceptionAuthority } from "@atlas/db";

function crc32(bytes: Uint8Array): number { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function pngFixture(): Buffer {
  const chunk = (type: string, body: Buffer) => { const head = Buffer.alloc(4); head.writeUInt32BE(body.length); const name = Buffer.from(type); const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, body]))); return Buffer.concat([head, name, body, checksum]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.from([0,255,0,0,255]))), chunk("IEND", Buffer.alloc(0))]);
}

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
  const png = pngFixture().toString("base64");
  const source = "a".repeat(64);
  const raw = { status: "success", document: { json_content: { pages: [{ page_no: 3, size: { width: 100, height: 100 } }], texts: [{ text: "Caption from source", prov: [{ page_no: 3 }] }], pictures: [{ self_ref: "#/pictures/0", prov: [{ page_no: 3, bbox: { l: 1, t: 2, r: 11, b: 22, coord_origin: "TOPLEFT" } }], data: { image: png, mime_type: "image/png", dimensions: { width: 1, height: 1 } } }] } } };
  const mapped = mapDoclingCapture(raw, source, doclingRun003OptionProfile);
  assert.deepEqual(mapped.pages[0], { page_number: 3, width: 100, height: 100, blocks: [{ id: "docling-text-p3-1", text: "Caption from source", type: "text" }], tables: [], visual_regions: [{ id: "docling-visual-p3-1", bbox: { x: 1, y: 2, width: 10, height: 20 } }] });
  assert.equal(mapped.transientVisualDescriptors.length, 1);
  assert.equal(mapped.transientVisualDescriptors[0]?.sourceReference, "#/pictures/0");
  assert.equal(JSON.stringify(mapped.pages).includes("derived/"), false);
  assert.throws(() => mapDoclingCapture({ ...raw, document: { json_content: { ...raw.document.json_content, pictures: [{ ...raw.document.json_content.pictures[0], data: { ...raw.document.json_content.pictures[0].data, mime_type: "image/jpeg" } }] } } }, source, doclingRun003OptionProfile), /unsupported image metadata/u);
  assert.throws(() => mapDoclingCapture({ ...raw, document: { json_content: { ...raw.document.json_content, pictures: [{ ...raw.document.json_content.pictures[0], prov: [{ page_no: 3, bbox: { l: -1, t: 2, r: 11, b: 22 } }] }] } } }, source, doclingRun003OptionProfile), /lacks qualified page, geometry/u);
  assert.throws(() => mapDoclingCapture({ ...raw, document: { json_content: { ...raw.document.json_content, pictures: [{ ...raw.document.json_content.pictures[0], data: { ...raw.document.json_content.pictures[0].data, image: "not-base64" } }] } } }, source, doclingRun003OptionProfile), /PNG/u);
  assert.throws(() => mapDoclingCapture(raw, source, doclingOptionProfile), /capture profile/u);
});

test("RUN-003 rejects unsupported, inverted, and page-overflow geometry while converting both known origins", () => {
  const source = (bbox: Record<string, unknown>) => ({ status: "success", document: { json_content: { pages: [{ page_no: 1, size: { width: 100, height: 80 } }], texts: [{ text: "bounded", prov: [{ page_no: 1, bbox }] }], tables: [] } } });
  const top = mapDoclingCapture(source({ l: 10, t: 20, r: 30, b: 40, coord_origin: "TOPLEFT" }), "a".repeat(64));
  assert.deepEqual((top.pages[0] as { blocks: { bbox: unknown }[] }).blocks[0]?.bbox, { x: 10, y: 20, width: 20, height: 20 });
  const bottom = mapDoclingCapture(source({ l: 10, t: 60, r: 30, b: 40, coord_origin: "BOTTOMLEFT" }), "a".repeat(64));
  assert.deepEqual((bottom.pages[0] as { blocks: { bbox: unknown }[] }).blocks[0]?.bbox, { x: 10, y: 20, width: 20, height: 20 });
  for (const bbox of [
    { l: 10, t: 20, r: 30, b: 40 },
    { l: 10, t: 20, r: 30, b: 40, coord_origin: "UNKNOWN" },
    { l: 10, t: 40, r: 30, b: 20, coord_origin: "TOPLEFT" },
    { l: 10, t: 60, r: 30, b: 80, coord_origin: "BOTTOMLEFT" },
    { l: 90, t: 70, r: 110, b: 90, coord_origin: "TOPLEFT" },
    { l: 10, t: 70, r: 30, b: 90, coord_origin: "TOPLEFT" },
  ]) assert.throws(() => mapDoclingCapture(source(bbox), "a".repeat(64)), /geometry is invalid/u);
});

test("RUN-003 rejects truncated and corrupt PNG streams", () => {
  const validPng = pngFixture(); const source = "a".repeat(64); const makeRaw = (bytes: Buffer) => ({ status: "success", document: { json_content: { pages: [{ page_no: 1, size: { width: 10, height: 10 } }], pictures: [{ self_ref: "#/pictures/0", prov: [{ page_no: 1, bbox: { l: 1, t: 1, r: 2, b: 2, coord_origin: "TOPLEFT" } }], data: { image: bytes.toString("base64"), mime_type: "image/png", dimensions: { width: 1, height: 1 } } }] } } });
  const corruptPng = Buffer.from(validPng); corruptPng[corruptPng.length - 1] = corruptPng[corruptPng.length - 1]! ^ 0xff;
  for (const bytes of [validPng.subarray(0, -8), corruptPng]) assert.throws(() => mapDoclingCapture(makeRaw(bytes), source, doclingRun003OptionProfile), /complete decodable PNG/u);
  const mapped = mapDoclingCapture(makeRaw(validPng), source, doclingRun003OptionProfile); const descriptor = mapped.transientVisualDescriptors[0]!;
  assert.equal(descriptor.width, 1); assert.equal(descriptor.height, 1); assert.equal(descriptor.byteLength, validPng.byteLength);
  assert.equal(descriptor.sha256, createHash("sha256").update(validPng).digest("hex"));
});

test("mapped V1 IDs parse and exact text/table excerpts remain resolvable", () => {
  const cell = { text: "Exact table value", row_span: 1, col_span: 1, column_header: true, row_header: false, row_section: false };
  const raw = { status: "success", document: { json_content: { pages: [{ page_no: 1, size: { width: 100, height: 100 } }], texts: [{ text: "Exact source sentence.", prov: [{ page_no: 1 }] }], tables: [{ prov: [{ page_no: 1 }], data: { grid: [[cell]], table_cells: [cell] } }] } } };
  const sourceSha256 = "b".repeat(64); const first = mapDoclingCapture(raw, sourceSha256); const second = mapDoclingCapture(raw, sourceSha256);
  assert.deepEqual(first.pages, second.pages);
  const mapped = first.pages as { page_number: number; blocks: { id: string; text: string; type: string }[]; tables: { id: string; content: string }[]; visual_regions: { id: string; bbox: unknown }[] }[]; const page = mapped[0]!;
  const ids = [...page.blocks.map((item) => item.id), ...page.tables.map((item) => item.id)];
  assert.equal(new Set(ids).size, ids.length); assert.ok(ids.every((id) => /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u.test(id)));
  const normalized = parseNormalizedDocument({ version: "v1", executionId: "fixture-run", artifactId: "fixture-doc", sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "docling", executionId: "fixture-run", processedAt: "2026-10-09T00:00:00Z" }, pages: mapped.map((item) => ({ number: item.page_number, textBlocks: item.blocks.map(({ id, text, type }) => ({ id, text, kind: type })), tables: item.tables.map(({ id, content }) => ({ id, content })), visualRegions: item.visual_regions.map(({ id, bbox }) => ({ id, boundingBox: bbox as never })) })) });
  assert.equal(normalized.pages[0]?.textBlocks[0]?.text, "Exact source sentence.");
  const table = normalized.pages[0]?.tables[0]; assert.ok(table?.content.includes("Exact table value")); assert.ok(table?.content.includes('"columnHeader":true'));
  assert.ok(ids.every((id) => id.length <= 200));
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
  const route = { routeId: "docling-digital-pdf", capability: "atlas.document.perceive" as const, providerId: "docling", modelOrProcessorId: `docling-slim-${doclingSlimVersion}`, adapterVersion: doclingAdapterVersion, qualificationVersion: "bss-v2-004-01", qualificationRef: "qualification://bss-v2-004-01", workClass: "local_processor", enabled: true, extensions: { serviceVersion: doclingServeVersion, optionProfile: doclingOptionProfile, capabilityIdentity: doclingCapabilityIdentity(doclingOptionProfile), imageDigest: "sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7" } };
  const all = { mistral: { structuredModel: "s", chatModel: "c", ocrModel: "o" }, gemini: { structuredModel: "s", chatModel: "c", perceptionModel: "p" }, docling: config };
  assert.doesNotThrow(() => assertConfiguredRouteAdapter(route, all));
  assert.throws(() => assertConfiguredRouteAdapter({ ...route, extensions: { ...route.extensions, imageDigest: "latest" } }, all), /pinned qualified/u);
  assert.throws(() => assertConfiguredRouteAdapter({ ...route, extensions: { ...route.extensions, capabilityIdentity: doclingCapabilityIdentity(doclingRun003OptionProfile) } }, all), /cache identity/u);
  assert.notEqual(doclingCapabilityIdentity(doclingRun003OptionProfile), doclingCapabilityIdentity(doclingOptionProfile));
  assert.throws(() => assertConfiguredRouteAdapter(route, { ...all, docling: { ...config, optionProfile: doclingRun003OptionProfile } }), /gated pending/u);
});

test("RUN-003 adapter sends the complete pinned capture request and records the profile identity", async () => {
  const captureConfig = { ...config, optionProfile: doclingRun003OptionProfile };
  const calls: { url: string; init?: RequestInit }[] = [];
  const provider = new DoclingProvider(captureConfig, async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/version")) return new Response(JSON.stringify({ docling_serve: doclingServeVersion, docling: doclingSlimVersion }));
    if (url.endsWith("/v1/convert/file")) return new Response(JSON.stringify({ status: "success", document: { json_content: { pages: [{ page_no: 1, size: { width: 100, height: 100 } }], texts: [{ text: "Source text", prov: [{ page_no: 1 }] }] } } }));
    return new Response("{}");
  });
  const result = await provider.perceive({ bytes: new Uint8Array([1, 2, 3]), mimeType: "application/pdf", sourceSha256: "c".repeat(64) }, new AbortController().signal);
  const form = calls.at(-1)?.init?.body as FormData;
  const expected = { from_formats: "pdf", to_formats: "json", pipeline: "standard", do_ocr: "false", force_ocr: "false", do_table_structure: "true", table_mode: "accurate", include_images: "true", include_page_images: "false", do_picture_description: "false", do_picture_classification: "false", do_chart_extraction: "false", do_code_enrichment: "false", do_formula_enrichment: "false", image_export_mode: "embedded" };
  for (const [key, value] of Object.entries(expected)) assert.equal(form.get(key), value, `effective Docling request option ${key}`);
  assert.equal(result.provenance.model, `docling-slim-${doclingSlimVersion}/docling-serve-${doclingServeVersion}/${doclingRun003OptionProfile}`);
  assert.equal(result.requiresAssetHandoff, true);
  assert.equal(doclingCapabilityIdentity(captureConfig.optionProfile), "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1");
});

test("profile cache identities isolate lookup and invalidation while retaining the image-disabled result", async () => {
  const sourceSha256 = "d".repeat(64); const perception = { contractVersion: "v1" as const, capability: "atlas.document.perceive" as const };
  const legacyIdentity = doclingCapabilityIdentity(doclingOptionProfile); const captureIdentity = doclingCapabilityIdentity(doclingRun003OptionProfile);
  const keyFor = (identity: string) => createHash("sha256").update(`${sourceSha256}:v1:atlas.document.perceive:${identity}`).digest("hex");
  const normalized = (profile: string) => ({ version: "v1", executionId: profile, artifactId: "same-source", sourceSha256, perception, provider: { name: "docling", processor: profile, executionId: profile, processedAt: "2026-10-09T00:00:00Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] });
  const records = new Map([[keyFor(legacyIdentity), { result: normalized(doclingOptionProfile), invalidated: false }], [keyFor(captureIdentity), { result: normalized(doclingRun003OptionProfile), invalidated: false }]]);
  const statements: { query: string; parameters: readonly unknown[] }[] = [];
  const sql = { unsafe: async (query: string, parameters: readonly unknown[] = []) => {
    statements.push({ query, parameters }); const row = records.get(String(parameters[0]));
    if (query.startsWith("SELECT normalized_document")) return row && !row.invalidated ? [{ normalized_document: row.result }] : [];
    if (query.startsWith("UPDATE atlas.normalized_document_cache")) { if (row) row.invalidated = true; return []; }
    if (query.startsWith("UPDATE atlas.document_perception_derived_asset")) return [];
    throw new Error(`Unexpected cache query: ${query}`);
  } };
  Object.assign(sql, { begin: async (work: (transaction: unknown) => Promise<unknown>) => work(sql) });
  const authority = new PostgresPerceptionAuthority(sql as never, {} as never);
  const legacyInput = { sourceSha256, perception, capabilityIdentity: legacyIdentity }; const captureInput = { sourceSha256, perception, capabilityIdentity: captureIdentity };
  assert.equal((await authority.getCached(legacyInput))?.provider.processor, doclingOptionProfile);
  assert.equal((await authority.getCached(captureInput))?.provider.processor, doclingRun003OptionProfile);
  await authority.invalidateCache(captureInput);
  assert.equal(await authority.getCached(captureInput), undefined);
  assert.equal((await authority.getCached(legacyInput))?.provider.processor, doclingOptionProfile);
  assert.ok(statements.some(({ query, parameters }) => query.startsWith("UPDATE atlas.normalized_document_cache") && parameters[0] === keyFor(captureIdentity)));
  assert.notEqual(keyFor(legacyIdentity), keyFor(captureIdentity));
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
