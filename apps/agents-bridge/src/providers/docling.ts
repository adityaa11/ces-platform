import { BridgeProviderError, type DocumentPerceptionProvider, type ProviderProvenance } from "../provider-capabilities.js";
import { performance } from "node:perf_hooks";

export const doclingServeVersion = "1.36.0";
export const doclingSlimVersion = "2.132.0";
export const doclingAdapterVersion = "docling-serve-adapter-v1";
export const doclingOptionProfile = "atlas-digital-pdf-no-ocr-v1";

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
const text = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value : undefined;
const number = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;

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
export function mapDoclingDocument(value: unknown): { readonly pages: readonly unknown[] } {
  const envelope = record(value); const document = record(envelope?.document); const json = record(document?.json_content);
  if (envelope?.status !== "success" || !json) throw new BridgeProviderError("malformed_response", "Docling did not return a successful JSON document.");
  const pages = new Map<number, { blocks: Record<string, unknown>[]; tables: Record<string, unknown>[] }>();
  const pageFor = (candidate: Record<string, unknown>) => {
    const page = number(record(array(candidate.prov)[0])?.page_no);
    return page !== undefined && Number.isInteger(page) && page > 0 ? page : undefined;
  };
  const add = (candidate: Record<string, unknown>, type: "text" | "table") => {
    const page = pageFor(candidate);
    // Source page provenance is mandatory for an Atlas page assignment. Never
    // invent page 1 (or another page) for malformed or absent Docling metadata.
    if (page === undefined) return;
    const target = pages.get(page) ?? { blocks: [], tables: [] }; pages.set(page, target);
    const id = text(candidate.self_ref) ?? `${type}-${page}-${type === "text" ? target.blocks.length + 1 : target.tables.length + 1}`;
    if (type === "table") { const content = text(candidate.markdown) ?? text(candidate.text) ?? ""; if (content) target.tables.push({ id, content }); }
    else { const content = text(candidate.text) ?? text(candidate.orig) ?? ""; if (content) target.blocks.push({ id, text: content, type: text(candidate.label) ?? "text" }); }
  };
  for (const item of array(json.texts)) { const candidate = record(item); if (candidate) add(candidate, "text"); }
  for (const item of array(json.tables)) { const candidate = record(item); if (candidate) add(candidate, "table"); }
  if (!pages.size) throw new BridgeProviderError("malformed_response", "Docling JSON contained no source-grounded text or tables.");
  const compareIds = (left: Record<string, unknown>, right: Record<string, unknown>) => String(left.id).localeCompare(String(right.id), "en", { numeric: true });
  return { pages: [...pages.entries()].sort(([a], [b]) => a - b).map(([page, content]) => ({ page_number: page, blocks: content.blocks.sort(compareIds), tables: content.tables.sort(compareIds) })) };
}

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
    form.set("files", new Blob([Buffer.from(input.bytes)], { type: "application/pdf" }), "authorized.pdf");
    form.set("from_formats", "pdf"); form.set("to_formats", "json"); form.set("pipeline", "standard"); form.set("do_ocr", "false"); form.set("force_ocr", "false"); form.set("do_table_structure", "true"); form.set("table_mode", "accurate"); form.set("include_images", "false"); form.set("include_page_images", "false"); form.set("do_picture_description", "false"); form.set("do_picture_classification", "false"); form.set("do_chart_extraction", "false"); form.set("do_code_enrichment", "false"); form.set("do_formula_enrichment", "false"); form.set("image_export_mode", "placeholder");
    const requestSerializationMilliseconds = performance.now() - formStarted;
    const requestStarted = performance.now(); const response = await this.request("/v1/convert/file", { method: "POST", body: form }, signal); const responseHeadersReceived = performance.now();
    const raw = await response.text(); const responseBodyReceived = performance.now(); if (Buffer.byteLength(raw) > this.config.maxResponseBytes) throw new BridgeProviderError("response_bound", "Docling response exceeded the configured byte limit.");
    let payload: unknown; try { payload = JSON.parse(raw); } catch { throw new BridgeProviderError("malformed_response", "Docling returned invalid JSON."); } const payloadParsed = performance.now();
    const mapped = mapDoclingDocument(payload);
    const mappedAt = performance.now();
    const processingMilliseconds = reportedProcessingMilliseconds(payload);
    const httpRoundTripMilliseconds = responseHeadersReceived - requestStarted;
    const provenance = {
      provider: "docling", model: `docling-slim-${this.config.doclingSlimVersion}/docling-serve-${this.config.serviceVersion}/${this.config.optionProfile}`, endpoint: "compose-private:/v1/convert/file", latencyMilliseconds: Date.now() - started, attempt: 1,
      usage: { raw: { requestSerializationMilliseconds: Math.round(requestSerializationMilliseconds), httpRequestRoundTripMilliseconds: Math.round(httpRoundTripMilliseconds), doclingReportedProcessingMilliseconds: processingMilliseconds ?? null, httpRequestTransferMilliseconds: processingMilliseconds === undefined ? null : Math.max(0, Math.round(httpRoundTripMilliseconds) - processingMilliseconds), responseBodyTransferMilliseconds: Math.round(responseBodyReceived - responseHeadersReceived), mappingSerializationMilliseconds: Math.round(mappedAt - payloadParsed) } },
    } satisfies ProviderProvenance;
    return { providerResult: mapped, provenance };
  }
}
