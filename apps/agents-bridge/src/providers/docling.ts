import { BridgeProviderError, type DocumentPerceptionProvider, type ProviderProvenance } from "../provider-capabilities.js";
import { performance } from "node:perf_hooks";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";

export const doclingServeVersion = "1.36.0";
export const doclingSlimVersion = "2.132.0";
export const doclingAdapterVersion = "docling-serve-adapter-v1";
export const doclingOptionProfile = "atlas-digital-pdf-no-ocr-v1";
/** Capture-only identity. It is deliberately not a normal staged-admission route
 * until IDSER-012-01-03-02 can issue an Atlas-owned asset manifest. */
export const doclingRun003OptionProfile = "atlas-digital-pdf-run-003-capture-v1";
export function doclingCapabilityIdentity(profile: string): string {
  if (profile === doclingOptionProfile) return "docling-digital-pdf";
  if (profile === doclingRun003OptionProfile) return "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1";
  throw new Error("Docling cache identity requires a qualified option profile.");
}

export type DoclingProviderConfig = {
  readonly baseUrl: string;
  readonly timeoutMilliseconds: number;
  readonly maxDocumentBytes: number;
  readonly maxResponseBytes: number;
  readonly serviceVersion: string;
  readonly doclingSlimVersion: string;
  readonly optionProfile: string;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;
const record = (value: unknown): Record<string, unknown> | undefined => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const array = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : [];
const collection = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : record(value) ? Object.values(record(value)!) : [];
const text = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value : undefined;
const number = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;

type AtlasBox = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
export type TransientVisualCapture = {
  readonly sourceReference: string;
  readonly locatorId: string;
  readonly sourceSha256: string;
  readonly profile: typeof doclingRun003OptionProfile;
  readonly pageNumber: number;
  readonly boundingBox: AtlasBox;
  readonly mediaType: "image/png";
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
  readonly sha256: string;
  readonly bytes: Uint8Array;
};

function reportedProcessingMilliseconds(value: unknown): number | undefined {
  const envelope = record(value);
  const directMilliseconds = number(envelope?.processing_time_ms) ?? number(envelope?.processingTimeMs);
  if (directMilliseconds !== undefined) return directMilliseconds;
  const seconds = number(envelope?.processing_time) ?? number(envelope?.processingTime);
  return seconds === undefined ? undefined : Math.round(seconds * 1_000);
}

function errorFor(status: number): BridgeProviderError {
  if (status === 408 || status === 504) return new BridgeProviderError("timeout", "Docling conversion timed out.");
  if (status === 400 || status === 404 || status === 422) return new BridgeProviderError("invalid_request", "Docling rejected the bounded PDF conversion request.");
  if (status === 429 || status >= 500) return new BridgeProviderError("provider_unavailable", "Docling is unavailable or not ready.");
  return new BridgeProviderError("provider_unavailable", "Docling conversion failed.");
}

/** Maps only document structure from Docling's JSON export; no semantic or visual claims are inferred. */
const profileId = (kind: "text" | "table" | "visual", page: number, index: number): string => `docling-${kind}-p${page}-${index + 1}`;
const sourceReference = (candidate: Record<string, unknown>, kind: "texts" | "tables" | "pictures", index: number): string => text(candidate.self_ref) ?? `#/${kind}/${index}`;
function tableContent(candidate: Record<string, unknown>): string {
  const data = record(candidate.data); const grid = array(data?.grid); const cells = array(data?.table_cells);
  if (!grid.length || !cells.length) throw new BridgeProviderError("malformed_response", "Docling table has no complete grid and cell metadata.");
  const normalized = grid.map((rawRow, rowIndex) => {
    const row = array(rawRow); if (!row.length) throw new BridgeProviderError("malformed_response", "Docling table has an empty grid row.");
    return row.map((rawCell, columnIndex) => {
      const cell = record(rawCell); const value = text(cell?.text); const rowSpan = number(cell?.row_span); const columnSpan = number(cell?.col_span);
      if (!cell || value === undefined || !Number.isInteger(rowSpan) || !Number.isInteger(columnSpan) || rowSpan! < 1 || columnSpan! < 1) throw new BridgeProviderError("malformed_response", "Docling table has malformed cell structure.");
      return { row: rowIndex, column: columnIndex, text: value, rowSpan, columnSpan, columnHeader: cell.column_header === true, rowHeader: cell.row_header === true, rowSection: cell.row_section === true };
    });
  });
  const markdown = normalized.map((row) => `| ${row.map((cell) => cell.text.replaceAll("|", "\\|")).join(" | ")} |`).join("\n");
  // V1 has a string-only table field. The human-readable grid remains first;
  // a deterministic source-structure suffix preserves spans/headers without a
  // V2 contract or lossy flattening.
  return `${markdown}\n\n<!-- atlas-docling-grid-v1:${JSON.stringify(normalized)} -->`;
}
const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
};

/** Checks a complete, non-interlaced PNG stream and its decoded scanline size. */
function validatedPng(bytes: Uint8Array): { readonly width: number; readonly height: number } | undefined {
  const data = Buffer.from(bytes);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (data.length < 45 || !data.subarray(0, 8).equals(signature)) return undefined;
  let offset = 8; let width = 0; let height = 0; let bitDepth = 0; let colorType = -1; let sawHeader = false; let sawData = false; let sawPalette = false; let sawEnd = false;
  const imageData: Buffer[] = [];
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset); const end = offset + 12 + length;
    if (end > data.length) return undefined;
    const type = data.toString("ascii", offset + 4, offset + 8); const chunk = data.subarray(offset + 8, offset + 8 + length); const expectedCrc = data.readUInt32BE(offset + 8 + length);
    if (crc32(data.subarray(offset + 4, offset + 8 + length)) !== expectedCrc) return undefined;
    if (!sawHeader && type !== "IHDR") return undefined;
    if (type === "IHDR") {
      if (sawHeader || length !== 13) return undefined;
      width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4); bitDepth = chunk[8]!; colorType = chunk[9]!;
      if (!width || !height || chunk[10] !== 0 || chunk[11] !== 0 || chunk[12] !== 0) return undefined;
      const allowedDepths: Readonly<Record<number, readonly number[]>> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
      if (!allowedDepths[colorType]?.includes(bitDepth)) return undefined;
      sawHeader = true;
    } else if (type === "PLTE") { if (sawData || length === 0 || length % 3 !== 0 || length > 768) return undefined; sawPalette = true; }
    else if (type === "IDAT") { if (sawEnd) return undefined; sawData = true; imageData.push(chunk); }
    else if (type === "IEND") { if (length !== 0 || !sawData) return undefined; sawEnd = true; offset = end; break; }
    else if ((data[offset + 4]! & 0x20) === 0) return undefined;
    offset = end;
  }
  if (!sawHeader || !sawData || !sawEnd || offset !== data.length || (colorType === 3 && !sawPalette)) return undefined;
  const channels: Readonly<Record<number, number>> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const bytesPerPixel = Math.max(1, Math.ceil((channels[colorType]! * bitDepth) / 8)); const rowBytes = Math.ceil((width * channels[colorType]! * bitDepth) / 8);
  try {
    const decoded = inflateSync(Buffer.concat(imageData), { maxOutputLength: (rowBytes + 1) * height });
    if (decoded.length !== (rowBytes + 1) * height) return undefined;
    for (let row = 0; row < height; row += 1) if (decoded[row * (rowBytes + 1)]! > 4) return undefined;
    return { width, height };
  } catch { return undefined; }
}

const validBox = (candidate: Record<string, unknown>, pageSizes: ReadonlyMap<number, { readonly width: number; readonly height: number }>): AtlasBox | undefined => {
  const prov = record(array(candidate.prov)[0]); const box = record(prov?.bbox) ?? record(candidate.bbox);
  const left = number(box?.l ?? box?.left ?? box?.x); const top = number(box?.t ?? box?.top ?? box?.y);
  const right = number(box?.r ?? box?.right); const bottom = number(box?.b ?? box?.bottom);
  const page = number(prov?.page_no); const origin = text(box?.coord_origin); const size = page === undefined ? undefined : pageSizes.get(page);
  if (!size || (origin !== "TOPLEFT" && origin !== "BOTTOMLEFT") || left === undefined || top === undefined) return undefined;
  const width = number(box?.width) ?? (right !== undefined ? right - left : undefined);
  const rawHeight = number(box?.height) ?? (bottom !== undefined ? (origin === "BOTTOMLEFT" ? top - bottom : bottom - top) : undefined);
  if (width === undefined || rawHeight === undefined || left < 0 || width <= 0 || rawHeight <= 0 || left + width > size.width) return undefined;
  // Atlas stores PDF-point coordinates from TOPLEFT. TOPLEFT uses y=top and
  // height=bottom-top. BOTTOMLEFT uses y=pageHeight-top and height=top-bottom.
  // Quantize all coordinates to 0.001 point to remove tiny inference jitter.
  const y = origin === "BOTTOMLEFT" ? size.height - top : top;
  if (y < 0 || y + rawHeight > size.height) return undefined;
  const stable = (coordinate: number) => Number(coordinate.toFixed(3));
  const normalized = { x: stable(left), y: stable(y), width: stable(width), height: stable(rawHeight) };
  return normalized.x >= 0 && normalized.y >= 0 && normalized.width > 0 && normalized.height > 0 && normalized.x + normalized.width <= size.width && normalized.y + normalized.height <= size.height ? normalized : undefined;
};

/**
 * Maps only source-grounded capture material.  Atlas coordinates are Docling
 * PDF coordinates (one-based page, x/y from the reported page origin); no
 * semantic interpretation or derived asset reference is emitted here.
 */
export function mapDoclingCapture(value: unknown, sourceSha256 = "0".repeat(64), profile: string = doclingOptionProfile): { readonly pages: readonly unknown[]; readonly transientVisualDescriptors: readonly TransientVisualCapture[] } {
  const envelope = record(value); const document = record(envelope?.document); const json = record(document?.json_content);
  if (envelope?.status !== "success" || !json) throw new BridgeProviderError("malformed_response", "Docling did not return a successful JSON document.");
  const pageSizes = new Map<number, { width: number; height: number }>();
  for (const item of collection(json.pages)) { const page = record(item); const size = record(page?.size); const pageNo = number(page?.page_no); const width = number(size?.width); const height = number(size?.height); if (!Number.isInteger(pageNo) || !width || !height || width <= 0 || height <= 0) throw new BridgeProviderError("malformed_response", "Docling page dimensions are invalid."); pageSizes.set(pageNo!, { width, height }); }
  const pages = new Map<number, { blocks: Record<string, unknown>[]; tables: Record<string, unknown>[]; visuals: Record<string, unknown>[] }>();
  const descriptors: TransientVisualCapture[] = [];
  const seenSourceReferences = new Set<string>();
  const pageFor = (candidate: Record<string, unknown>, kind: "text" | "table" | "picture", index: number) => {
    const page = number(record(array(candidate.prov)[0])?.page_no);
    if (page === undefined || !Number.isInteger(page) || page < 1 || (pageSizes.size && !pageSizes.has(page))) throw new BridgeProviderError("malformed_response", `Docling ${kind} has invalid page provenance.`);
    const reference = sourceReference(candidate, `${kind}s` as "texts" | "tables" | "pictures", index);
    if (seenSourceReferences.has(reference)) throw new BridgeProviderError("malformed_response", `Docling ${kind} has duplicate source identity.`);
    seenSourceReferences.add(reference);
    return page;
  };
  const add = (candidate: Record<string, unknown>, type: "text" | "table", index: number) => {
    const page = pageFor(candidate, type, index);
    const target = pages.get(page) ?? { blocks: [], tables: [], visuals: [] }; pages.set(page, target);
    const id = profileId(type, page, index);
    if (type === "table") {
      const content = tableContent(candidate);
      const boundingBox = validBox(candidate, pageSizes); if (!boundingBox && (record(array(candidate.prov)[0])?.bbox || candidate.bbox)) throw new BridgeProviderError("malformed_response", "Docling table geometry is invalid.");
      target.tables.push({ id, content, ...(boundingBox ? { bbox: boundingBox } : {}) });
    } else {
      const content = text(candidate.text) ?? text(candidate.orig); if (!content) throw new BridgeProviderError("malformed_response", "Docling text has no source content.");
      const boundingBox = validBox(candidate, pageSizes); if (!boundingBox && (record(array(candidate.prov)[0])?.bbox || candidate.bbox)) throw new BridgeProviderError("malformed_response", "Docling text geometry is invalid.");
      target.blocks.push({ id, text: content, type: text(candidate.label) ?? "text", ...(boundingBox ? { bbox: boundingBox } : {}) });
    }
  };
  for (const [index, item] of array(json.texts).entries()) { const candidate = record(item); if (!candidate) throw new BridgeProviderError("malformed_response", "Docling text metadata is malformed."); add(candidate, "text", index); }
  for (const [index, item] of array(json.tables).entries()) { const candidate = record(item); if (!candidate) throw new BridgeProviderError("malformed_response", "Docling table metadata is malformed."); add(candidate, "table", index); }
  for (const [index, item] of array(json.pictures).entries()) {
    const candidate = record(item); const page = candidate && pageFor(candidate, "picture", index); const box = candidate && validBox(candidate, pageSizes);
    if (!candidate || page === undefined || !box || profile !== doclingRun003OptionProfile) throw new BridgeProviderError("malformed_response", "Docling picture lacks qualified page, geometry, or capture profile.");
    const data = record(candidate.data); const image = record(candidate.image); const encoded = text(data?.image ?? image?.uri ?? candidate.image); const mediaType = text(data?.mime_type ?? data?.media_type ?? image?.mimetype ?? candidate.mime_type);
    if (!encoded || mediaType !== "image/png") throw new BridgeProviderError("malformed_response", "Docling picture has unsupported image metadata.");
    let bytes: Uint8Array; try { bytes = Buffer.from(encoded.replace(/^data:[^,]+,/u, ""), "base64"); } catch { throw new BridgeProviderError("malformed_response", "Docling picture bytes are invalid."); }
    if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) throw new BridgeProviderError("response_bound", "Docling picture bytes exceed the qualified bound.");
    const decoded = validatedPng(bytes);
    if (!decoded) throw new BridgeProviderError("malformed_response", "Docling picture bytes are not a complete decodable PNG.");
    const decodedWidth = decoded.width; const decodedHeight = decoded.height;
    const dimensions = record(data?.dimensions) ?? record(image?.size); const width = number(dimensions?.width ?? data?.width); const height = number(dimensions?.height ?? data?.height);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width! < 1 || height! < 1 || width !== decodedWidth || height !== decodedHeight) throw new BridgeProviderError("malformed_response", "Docling picture dimensions are invalid.");
    const target = pages.get(page) ?? { blocks: [], tables: [], visuals: [] }; pages.set(page, target); const id = profileId("visual", page, index);
    target.visuals.push({ id, bbox: box });
    const sha256 = awaitableHash(bytes); descriptors.push({ sourceReference: sourceReference(candidate, "pictures", index), locatorId: id, sourceSha256, profile: doclingRun003OptionProfile, pageNumber: page, boundingBox: box, mediaType, width, height, byteLength: bytes.byteLength, sha256, bytes });
  }
  if (!pages.size) throw new BridgeProviderError("malformed_response", "Docling JSON contained no source-grounded text or tables.");
  const compareIds = (left: Record<string, unknown>, right: Record<string, unknown>) => String(left.id).localeCompare(String(right.id), "en", { numeric: true });
  return { pages: [...pages.entries()].sort(([a], [b]) => a - b).map(([page, content]) => ({ page_number: page, ...(pageSizes.get(page) ? { width: pageSizes.get(page)!.width, height: pageSizes.get(page)!.height } : {}), blocks: content.blocks.sort(compareIds), tables: content.tables.sort(compareIds), visual_regions: content.visuals.sort(compareIds) })), transientVisualDescriptors: descriptors };
}

// Node's built-in crypto avoids accepting provider-declared integrity metadata.
function awaitableHash(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
export function mapDoclingDocument(value: unknown): { readonly pages: readonly unknown[] } { return { pages: mapDoclingCapture(value).pages }; }

/** Compose-private Docling Serve client. It uploads only bytes supplied by Atlas and owns a fixed no-OCR option profile. */
export class DoclingProvider implements DocumentPerceptionProvider {
  constructor(private readonly config: DoclingProviderConfig, private readonly fetcher: FetchLike = fetch) {}
  private async request(path: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
    const deadline = AbortSignal.timeout(this.config.timeoutMilliseconds); const combined = AbortSignal.any([signal, deadline]);
    try { const response = await this.fetcher(`${this.config.baseUrl}${path}`, { ...init, signal: combined }); if (!response.ok) throw errorFor(response.status); return response; }
    catch (error) {
      if (error instanceof BridgeProviderError) throw error;
      if (signal.aborted) throw new BridgeProviderError("cancelled", "Docling request was cancelled.");
      if (deadline.aborted) throw new BridgeProviderError("timeout", "Docling request exceeded the configured timeout.");
      throw new BridgeProviderError("provider_unavailable", "Docling could not be reached.");
    }
  }
  private async verifyReady(signal: AbortSignal): Promise<void> {
    await this.request("/health", { method: "GET" }, signal);
    await this.request("/ready", { method: "GET" }, signal);
    const versions = record(await this.request("/version", { method: "GET" }, signal).then((response) => response.json()));
    const service = text(versions?.docling_serve) ?? text(versions?.["docling-serve"]); const runtime = text(versions?.docling) ?? text(versions?.docling_slim) ?? text(versions?.["docling-slim"]);
    if (service !== this.config.serviceVersion || runtime !== this.config.doclingSlimVersion) throw new BridgeProviderError("provider_unavailable", "Docling runtime identity does not match the qualified route.");
  }
  async perceive(input: Parameters<DocumentPerceptionProvider["perceive"]>[0], signal: AbortSignal): ReturnType<DocumentPerceptionProvider["perceive"]> {
    if (input.mimeType !== "application/pdf" || input.bytes.byteLength === 0 || input.bytes.byteLength > this.config.maxDocumentBytes) throw new BridgeProviderError("invalid_request", "Docling accepts only bounded PDF bytes.");
    await this.verifyReady(signal); const started = Date.now(); const formStarted = performance.now(); const form = new FormData();
    if (this.config.optionProfile !== doclingOptionProfile && this.config.optionProfile !== doclingRun003OptionProfile) throw new BridgeProviderError("invalid_request", "Docling option profile is not qualified.");
    form.set("files", new Blob([Buffer.from(input.bytes)], { type: "application/pdf" }), "authorized.pdf");
    const capture = this.config.optionProfile === doclingRun003OptionProfile;
    form.set("from_formats", "pdf"); form.set("to_formats", "json"); form.set("pipeline", "standard"); form.set("do_ocr", "false"); form.set("force_ocr", "false"); form.set("do_table_structure", "true"); form.set("table_mode", "accurate"); form.set("include_images", capture ? "true" : "false"); form.set("include_page_images", "false"); form.set("do_picture_description", "false"); form.set("do_picture_classification", "false"); form.set("do_chart_extraction", "false"); form.set("do_code_enrichment", "false"); form.set("do_formula_enrichment", "false"); form.set("image_export_mode", capture ? "embedded" : "placeholder");
    const requestSerializationMilliseconds = performance.now() - formStarted;
    const requestStarted = performance.now(); const response = await this.request("/v1/convert/file", { method: "POST", body: form }, signal); const responseHeadersReceived = performance.now();
    const raw = await response.text(); const responseBodyReceived = performance.now(); if (Buffer.byteLength(raw) > this.config.maxResponseBytes) throw new BridgeProviderError("response_bound", "Docling response exceeded the configured byte limit.");
    let payload: unknown; try { payload = JSON.parse(raw); } catch { throw new BridgeProviderError("malformed_response", "Docling returned invalid JSON."); } const payloadParsed = performance.now();
    const mapped = mapDoclingCapture(payload, input.sourceSha256 ?? "0".repeat(64), this.config.optionProfile);
    const mappedAt = performance.now();
    const processingMilliseconds = reportedProcessingMilliseconds(payload);
    const httpRoundTripMilliseconds = responseHeadersReceived - requestStarted;
    const provenance = {
      provider: "docling", model: `docling-slim-${this.config.doclingSlimVersion}/docling-serve-${this.config.serviceVersion}/${this.config.optionProfile}`, endpoint: "compose-private:/v1/convert/file", latencyMilliseconds: Date.now() - started, attempt: 1,
      usage: { raw: { requestSerializationMilliseconds: Math.round(requestSerializationMilliseconds), httpRequestRoundTripMilliseconds: Math.round(httpRoundTripMilliseconds), doclingReportedProcessingMilliseconds: processingMilliseconds ?? null, httpRequestTransferMilliseconds: processingMilliseconds === undefined ? null : Math.max(0, Math.round(httpRoundTripMilliseconds) - processingMilliseconds), responseBytes: Buffer.byteLength(raw), responseBodyTransferMilliseconds: Math.round(responseBodyReceived - responseHeadersReceived), mappingSerializationMilliseconds: Math.round(mappedAt - payloadParsed) } },
    } satisfies ProviderProvenance;
    // Descriptors never enter replay JSON. Until -03-02, the worker rejects
    // this result before normalization/acceptance; the in-process mapping seam
    // is intentionally exposed only to the later Atlas-owned handoff.
    return { providerResult: mapped, provenance, ...(capture ? { requiresAssetHandoff: true } : {}) };
  }
}
