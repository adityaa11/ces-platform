import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseNormalizedDocument } from "@atlas/contracts";
import { DoclingProvider, doclingRun003OptionProfile, doclingServeVersion, doclingSlimVersion } from "../src/providers/docling.ts";

const sourcePath = process.env.RUN003_QUALIFICATION_PDF ?? "/fixture/Safara_Buyer_Business_PRD_Professional.pdf";
const evidencePath = process.env.RUN003_QUALIFICATION_EVIDENCE;
const bytes = await readFile(sourcePath);
const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
const frozenMapping = JSON.parse(await readFile(new URL("./fixtures/idser-012-01-03-01-safara-run003-mapping.json", import.meta.url), "utf8")) as { sourceSha256: string; profile: string; pages: readonly unknown[] };
const config = {
  baseUrl: process.env.DOCLING_BASE_URL ?? "http://docling-serve:5001",
  timeoutMilliseconds: 120_000,
  maxDocumentBytes: 20 * 1024 * 1024,
  maxResponseBytes: 10 * 1024 * 1024,
  serviceVersion: doclingServeVersion,
  doclingSlimVersion,
  optionProfile: doclingRun003OptionProfile,
} as const;
const fixtureHash = "2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df";
const invoke = async (label: string) => {
  const started = performance.now();
  const result = await new DoclingProvider(config).perceive({ bytes, mimeType: "application/pdf", sourceSha256 }, new AbortController().signal);
  const pages = result.providerResult.pages as readonly { page_number: number; blocks?: readonly { id: string; text: string; type: string }[]; tables?: readonly { id: string; content: string }[]; visual_regions?: readonly { id: string; bbox: { x: number; y: number; width: number; height: number } }[] }[];
  const descriptors = result.providerResult.transientVisualDescriptors as readonly { sourceReference: string; locatorId: string; pageNumber: number; width: number; height: number; byteLength: number; sha256: string }[];
  const gridCells = pages.flatMap((page) => page.tables ?? []).flatMap((table) => {
    const suffix = table.content.match(/<!-- atlas-docling-grid-v1:(.+) -->/u)?.[1];
    assert.ok(suffix, `${label}: table ${table.id} retains structural metadata`);
    return JSON.parse(suffix) as readonly unknown[];
  }).flat().length;
  const textOrder = pages.flatMap((page) => page.blocks ?? []).map(({ id, text, type }) => ({ id, text, type }));
  const tableOrder = pages.flatMap((page) => page.tables ?? []).map(({ id, content }) => ({ id, content }));
  const visuals = pages.flatMap((page) => (page.visual_regions ?? []).map((visual) => ({ page: page.page_number, ...visual })));
  return {
    label,
    elapsedMilliseconds: Math.round(performance.now() - started),
    doclingProcessingMilliseconds: result.provenance.usage?.raw?.doclingReportedProcessingMilliseconds,
    responseBytes: result.provenance.usage?.raw?.responseBytes,
    responseTransferMilliseconds: result.provenance.usage?.raw?.responseBodyTransferMilliseconds,
    mappingMilliseconds: result.provenance.usage?.raw?.mappingSerializationMilliseconds,
    textCount: textOrder.length,
    tableCount: tableOrder.length,
    cellCount: gridCells,
    visualCount: visuals.length,
    descriptorCount: descriptors.length,
    figurePages: visuals.map((visual) => visual.page).sort((a, b) => a - b),
    figureCorrespondence: descriptors.map(({ sourceReference, locatorId, pageNumber, width, height, byteLength, sha256 }) => ({ sourceReference, locatorId, pageNumber, width, height, byteLength, sha256 })),
    mappedPages: pages,
    textOrder,
    tableOrder,
    requiresAssetHandoff: result.requiresAssetHandoff === true,
    noDurablePointer: !JSON.stringify(result.providerResult.pages).includes("derived/"),
  };
};

const sequential = [await invoke("sequential-1"), await invoke("sequential-2")];
assert.equal(sourceSha256, fixtureHash, "qualification must use the frozen Safara source fixture");
for (const observation of sequential) {
  assert.equal(observation.textCount, 254);
  assert.equal(observation.tableCount, 4);
  assert.equal(observation.cellCount, 69);
  assert.equal(observation.visualCount, 5);
  assert.equal(observation.descriptorCount, 5);
  assert.deepEqual(observation.figurePages, [3, 5, 7, 8, 10]);
  const locatorIds = [...observation.textOrder, ...observation.tableOrder, ...observation.mappedPages.flatMap((page) => page.visual_regions ?? [])].map((item) => item.id);
  assert.equal(new Set(locatorIds).size, 263);
  assert.ok(locatorIds.every((id) => id.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u.test(id)), "all fixture text/table/visual IDs satisfy both V1 identifier patterns");
  assert.ok(observation.figureCorrespondence.every((figure) => figure.sourceReference && figure.locatorId && figure.width > 0 && figure.height > 0 && figure.byteLength > 0 && /^[a-f0-9]{64}$/u.test(figure.sha256)));
  assert.equal(observation.requiresAssetHandoff, true);
  assert.equal(observation.noDurablePointer, true);
}
assert.deepEqual(sequential[0].mappedPages, sequential[1].mappedPages, "frozen source produces identical mapped content, order, and structural table metadata on repeated runs");
assert.equal(frozenMapping.sourceSha256, fixtureHash);
assert.equal(frozenMapping.profile, doclingRun003OptionProfile);
assert.deepEqual(sequential[0].mappedPages, frozenMapping.pages, "the frozen source reproduces the committed exact mapped fixture");
const normalizedFixture = parseNormalizedDocument({ version: "v1", executionId: "run003-qualification", artifactId: "safara-frozen-fixture", sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: `${doclingSlimVersion}/${doclingServeVersion}/${doclingRun003OptionProfile}`, executionId: "run003-qualification", processedAt: "2026-10-09T00:00:00Z" }, pages: (sequential[0].mappedPages as readonly { page_number: number; width?: number; height?: number; blocks: readonly { id: string; text: string; type: string; bbox?: unknown }[]; tables: readonly { id: string; content: string; bbox?: unknown }[]; visual_regions: readonly { id: string; bbox: unknown }[] }[]).map((page) => ({ number: page.page_number, ...(page.width ? { width: page.width } : {}), ...(page.height ? { height: page.height } : {}), textBlocks: page.blocks.map(({ id, text, type, bbox }) => ({ id, text, kind: type, ...(bbox ? { boundingBox: bbox } : {}) })), tables: page.tables.map(({ id, content, bbox }) => ({ id, content, ...(bbox ? { boundingBox: bbox } : {}) })), visualRegions: page.visual_regions.map(({ id, bbox }) => ({ id, boundingBox: bbox })) })) });
const resolvedLocators = normalizedFixture.pages.flatMap((page) => [...page.textBlocks.map((item) => ({ id: item.id, content: item.text })), ...page.tables.map((item) => ({ id: item.id, content: item.content })), ...page.visualRegions.map((item) => ({ id: item.id, content: undefined }))]);
const sourceLocators = (sequential[0].mappedPages as readonly { blocks: readonly { id: string; text: string }[]; tables: readonly { id: string; content: string }[]; visual_regions: readonly { id: string }[] }[]).flatMap((page) => [...page.blocks.map((item) => ({ id: item.id, content: item.text })), ...page.tables.map((item) => ({ id: item.id, content: item.content })), ...page.visual_regions.map((item) => ({ id: item.id, content: undefined }))]);
assert.deepEqual(resolvedLocators, sourceLocators, "NormalizedDocument V1 retains source-exact text/table excerpts and picture locator correspondence");
assert.equal(new Set(resolvedLocators.map((item) => item.id)).size, 263);
assert.ok(resolvedLocators.every(({ id }) => id.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u.test(id) && !id.startsWith("#/")));
assert.deepEqual(sequential[0].figureCorrespondence.map(({ sourceReference, locatorId, pageNumber }) => ({ sourceReference, locatorId, pageNumber })), sequential[1].figureCorrespondence.map(({ sourceReference, locatorId, pageNumber }) => ({ sourceReference, locatorId, pageNumber })), "frozen source produces stable picture references and locators on repeated runs");
const figureCaptions = new Map([[3, "Gambar 1. Alur operasional administrasi jemaah umrah"], [5, "Gambar 2. Perbandingan kuota dan pendaftaran aktif"], [7, "Gambar 3. Perubahan status pemeriksaan pembayaran"], [8, "Gambar 4. Rancangan tampilan pemeriksaan dokumen jemaah"], [10, "Gambar 5. Keputusan masuk ke manifest final"]]);
for (const [pageNumber, caption] of figureCaptions) {
  const page = (sequential[0].mappedPages as readonly { page_number: number; blocks: readonly { text: string }[]; visual_regions: readonly { id: string; bbox: unknown }[] }[]).find((candidate) => candidate.page_number === pageNumber);
  assert.ok(page?.blocks.some((block) => block.text === caption), `figure page ${pageNumber} preserves its source caption as text`);
  assert.ok(page?.blocks.some((block) => block.text.startsWith("Sumber:")), `figure page ${pageNumber} preserves its source label as text`);
  assert.equal(Object.keys(page?.visual_regions[0] ?? {}).some((key) => /caption|description|label/u.test(key)), false, `figure page ${pageNumber} contains no inferred visual meaning`);
}
const mappingSha256 = createHash("sha256").update(JSON.stringify(sequential[0].mappedPages)).digest("hex");
const concurrentStarted = performance.now();
const firstTwoPending = Promise.all([invoke("concurrent-1"), invoke("concurrent-2")]);
await new Promise((resolve) => setTimeout(resolve, 100));
const heldThirdStarted = performance.now();
const third = invoke("held-third");
const heldProbe = await Promise.race([third.then(() => "completed"), new Promise<"held">((resolve) => setTimeout(() => resolve("held"), 250))]);
const firstTwo = await firstTwoPending;
const concurrentWallMilliseconds = Math.round(performance.now() - concurrentStarted);
const heldThird = await third;
const report = {
  ticket: "IDSER-012-01-03-01",
  profile: doclingRun003OptionProfile,
  source: { sha256: sourceSha256, byteLength: bytes.byteLength },
  frozenRuntime: { doclingServeVersion, doclingSlimVersion, timeoutMilliseconds: config.timeoutMilliseconds, maxResponseBytes: config.maxResponseBytes, localConversionConcurrency: 2, workers: 1, cpuThreads: 4 },
  frozenFixture: { sourcePath, sourceSha256, mappingSha256, textCount: 254, tableCount: 4, cellCount: 69, figurePages: [3, 5, 7, 8, 10], captions: Object.fromEntries(figureCaptions), normalizedDocumentV1: true, resolvedLocatorCount: resolvedLocators.length, exactTextAndTableResolution: true, repeatedMappedOutputEqual: true, matchesCommittedFixture: true },
  sequential: sequential.map(({ mappedPages: _mappedPages, textOrder: _textOrder, tableOrder: _tableOrder, ...observation }) => observation),
  concurrent: { observations: firstTwo.map(({ mappedPages: _mappedPages, textOrder: _textOrder, tableOrder: _tableOrder, ...observation }) => observation), wallMilliseconds: concurrentWallMilliseconds },
  heldThird: { observation: (({ mappedPages: _mappedPages, textOrder: _textOrder, tableOrder: _tableOrder, ...observation }) => observation)(heldThird), probeAfter250Milliseconds: heldProbe, elapsedMilliseconds: Math.round(performance.now() - heldThirdStarted) },
  scope: { atlasResultAcceptance: false, perceptionJobsCreated: false, semanticJobsCreated: false, durableAssetsCreated: false },
};
assert.equal(heldProbe, "held", "the third real conversion must remain pending while two are active");
assert.equal(heldThird.textCount, 254);
if (evidencePath) await (await import("node:fs/promises")).writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`IDSER-012-01-03-01 qualification evidence: ${JSON.stringify(report)}\n`);
