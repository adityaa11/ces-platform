import { createHash } from "node:crypto";
import { posix, win32 } from "node:path";
import {
  ingestMarkdownDocuments,
  type SourceIndex,
} from "@company/ces-document-ingestion";
import { getDocument, version as pdfjsVersion } from "pdfjs-dist/legacy/build/pdf.mjs";
import { z } from "zod";

export const PDF_INGESTION_VERSION = "1.0.0" as const;
export const PDF_PARSER_ID = "mozilla-pdfjs" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const PdfIngestionLimitsSchema = z.object({
  maximum_bytes: z.number().int().positive().default(20 * 1024 * 1024),
  maximum_pages: z.number().int().positive().default(200),
  maximum_characters: z.number().int().positive().default(2_000_000),
  timeout_ms: z.number().int().positive().default(30_000),
  minimum_native_characters_per_page: z.number().int().nonnegative().default(1),
  minimum_ocr_confidence: z.number().min(0).max(1).default(0.8),
}).strict();

export const OcrPageResultSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  engine: NonEmptyString,
  engine_version: NonEmptyString,
  language_data_version: NonEmptyString.optional(),
}).strict();

export interface PdfOcrAdapter {
  recognize(input: {
    readonly pdf_bytes: Uint8Array;
    readonly page_number: number;
    readonly timeout_ms: number;
  }): Promise<unknown>;
}

export interface PdfDocumentInput {
  readonly document_id: string;
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly virtual_markdown_path?: string;
}

export interface PdfPageProvenance {
  readonly page_number: number;
  readonly line_start: number;
  readonly line_end: number;
  readonly extraction_method: "native_text" | "ocr";
  readonly page_revision_hash: string;
  readonly confidence?: number;
  readonly ocr_engine?: string;
  readonly ocr_version?: string;
  readonly language_data_version?: string;
}

export interface PdfIngestionWarning {
  readonly code: "low_ocr_confidence";
  readonly page_number: number;
  readonly message: string;
  readonly confidence: number;
}

export interface PdfIngestionResult {
  readonly schema_version: typeof PDF_INGESTION_VERSION;
  readonly original: {
    readonly document_id: string;
    readonly path: string;
    readonly content_hash: string;
    readonly byte_length: number;
  };
  readonly normalized_document: {
    readonly document_id: string;
    readonly path: string;
    readonly content: string;
    readonly content_hash: string;
  };
  readonly source_index: SourceIndex;
  readonly pages: readonly PdfPageProvenance[];
  readonly warnings: readonly PdfIngestionWarning[];
  readonly parser: {
    readonly id: typeof PDF_PARSER_ID;
    readonly version: string;
  };
}

export type PdfIngestionErrorCode =
  | "invalid_path"
  | "invalid_pdf"
  | "encrypted_pdf"
  | "empty_pdf"
  | "file_size_limit"
  | "page_count_limit"
  | "character_limit"
  | "timeout"
  | "ocr_required"
  | "ocr_failed";

export class PdfIngestionError extends Error {
  public constructor(
    public readonly code: PdfIngestionErrorCode,
    message: string,
    public readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "PdfIngestionError";
  }
}

export async function ingestPdfDocument(
  input: PdfDocumentInput,
  options: {
    readonly limits?: z.input<typeof PdfIngestionLimitsSchema>;
    readonly ocr?: PdfOcrAdapter;
  } = {},
): Promise<PdfIngestionResult> {
  const limits = PdfIngestionLimitsSchema.parse(options.limits ?? {});
  const documentId = NonEmptyString.parse(input.document_id);
  validatePdfPath(input.path);
  if (input.bytes.byteLength > limits.maximum_bytes) {
    throw new PdfIngestionError("file_size_limit", "PDF exceeds configured byte limit", {
      actual_bytes: input.bytes.byteLength,
      maximum_bytes: limits.maximum_bytes,
    });
  }
  const pdfBytes = Uint8Array.from(input.bytes);
  if (!hasPdfHeader(pdfBytes)) {
    throw new PdfIngestionError("invalid_pdf", "Input does not contain a PDF header");
  }
  if (containsEncryptionMarker(pdfBytes)) {
    throw new PdfIngestionError("encrypted_pdf", "Encrypted PDFs are not supported");
  }
  const originalHash = sha256Bytes(pdfBytes);
  const virtualPath = input.virtual_markdown_path
    ?? `${input.path.slice(0, -4)}.pdf.md`;
  validateVirtualPath(virtualPath);

  return withTimeout(runPdfIngestion({
    documentId,
    originalPath: input.path,
    virtualPath,
    bytes: pdfBytes,
    originalHash,
    limits,
    ...(options.ocr ? { ocr: options.ocr } : {}),
  }), limits.timeout_ms);
}

interface RunInput {
  readonly documentId: string;
  readonly originalPath: string;
  readonly virtualPath: string;
  readonly bytes: Uint8Array;
  readonly originalHash: string;
  readonly limits: z.output<typeof PdfIngestionLimitsSchema>;
  readonly ocr?: PdfOcrAdapter;
}

async function runPdfIngestion(input: RunInput): Promise<PdfIngestionResult> {
  let loadingTask: ReturnType<typeof getDocument> | undefined;
  try {
    loadingTask = getDocument({
      data: input.bytes.slice(),
      stopAtErrors: true,
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0,
    });
    const pdf = await loadingTask.promise;
    if (pdf.numPages === 0) {
      throw new PdfIngestionError("empty_pdf", "PDF contains no pages");
    }
    if (pdf.numPages > input.limits.maximum_pages) {
      throw new PdfIngestionError("page_count_limit", "PDF exceeds configured page limit", {
        actual_pages: pdf.numPages,
        maximum_pages: input.limits.maximum_pages,
      });
    }

    const pageSections: string[] = [];
    const pages: PdfPageProvenance[] = [];
    const warnings: PdfIngestionWarning[] = [];
    let lineCursor = 1;
    let characterCount = 0;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent({ disableNormalization: false });
      const nativeText = normalizePageText(textContent.items);
      let text = nativeText;
      let method: "native_text" | "ocr" = "native_text";
      let ocrResult: z.infer<typeof OcrPageResultSchema> | undefined;
      if (nativeText.replace(/\s/gu, "").length
        < input.limits.minimum_native_characters_per_page) {
        if (!input.ocr) {
          throw new PdfIngestionError(
            "ocr_required",
            `PDF page ${pageNumber} has no usable native text and OCR is disabled`,
            { page_number: pageNumber },
          );
        }
        try {
          ocrResult = OcrPageResultSchema.parse(await input.ocr.recognize({
            pdf_bytes: input.bytes.slice(),
            page_number: pageNumber,
            timeout_ms: input.limits.timeout_ms,
          }));
        } catch (error) {
          throw new PdfIngestionError(
            "ocr_failed",
            `OCR failed for PDF page ${pageNumber}`,
            { page_number: pageNumber, cause: errorMessage(error) },
          );
        }
        text = normalizeText(ocrResult.text);
        method = "ocr";
        if (ocrResult.confidence < input.limits.minimum_ocr_confidence) {
          warnings.push({
            code: "low_ocr_confidence",
            page_number: pageNumber,
            confidence: ocrResult.confidence,
            message: `OCR confidence ${ocrResult.confidence} is below configured threshold ${input.limits.minimum_ocr_confidence}`,
          });
        }
      }
      if (text.length === 0) {
        throw new PdfIngestionError("empty_pdf", `PDF page ${pageNumber} produced no text`, {
          page_number: pageNumber,
        });
      }
      const confidenceMarker = ocrResult
        ? ` [OCR confidence=${formatConfidence(ocrResult.confidence)}]`
        : "";
      const section = "# PDF page " + pageNumber + confidenceMarker + "\n\n" + text;
      characterCount += section.length;
      if (characterCount > input.limits.maximum_characters) {
        throw new PdfIngestionError(
          "character_limit",
          "Extracted PDF text exceeds configured character limit",
          {
            actual_characters: characterCount,
            maximum_characters: input.limits.maximum_characters,
          },
        );
      }
      const lineCount = section.split("\n").length;
      const pageRevisionHash = sha256Json({
        original_pdf_hash: input.originalHash,
        page_number: pageNumber,
        parser: PDF_PARSER_ID,
        parser_version: pdfjsVersion,
        extraction_method: method,
        ocr_engine: ocrResult?.engine,
        ocr_version: ocrResult?.engine_version,
        language_data_version: ocrResult?.language_data_version,
        confidence: ocrResult?.confidence,
        normalized_text: text,
      });
      pages.push({
        page_number: pageNumber,
        line_start: lineCursor,
        line_end: lineCursor + lineCount - 1,
        extraction_method: method,
        page_revision_hash: pageRevisionHash,
        ...(ocrResult ? {
          confidence: ocrResult.confidence,
          ocr_engine: ocrResult.engine,
          ocr_version: ocrResult.engine_version,
          ...(ocrResult.language_data_version
            ? { language_data_version: ocrResult.language_data_version }
            : {}),
        } : {}),
      });
      pageSections.push(section);
      lineCursor += lineCount + 1;
    }
    const content = `${pageSections.join("\n\n")}\n`;
    const sourceIndex = ingestMarkdownDocuments([{
      document_id: input.documentId,
      path: input.virtualPath,
      content,
    }]);
    const normalized = sourceIndex.documents[0]!;
    return {
      schema_version: PDF_INGESTION_VERSION,
      original: {
        document_id: input.documentId,
        path: input.originalPath,
        content_hash: input.originalHash,
        byte_length: input.bytes.byteLength,
      },
      normalized_document: {
        document_id: normalized.document_id,
        path: normalized.path,
        content: normalized.content,
        content_hash: normalized.content_hash,
      },
      source_index: sourceIndex,
      pages,
      warnings,
      parser: { id: PDF_PARSER_ID, version: pdfjsVersion },
    };
  } catch (error) {
    if (error instanceof PdfIngestionError) throw error;
    const message = errorMessage(error);
    if (/password|encrypted/iu.test(message)) {
      throw new PdfIngestionError("encrypted_pdf", "Encrypted PDFs are not supported");
    }
    throw new PdfIngestionError("invalid_pdf", "PDF parsing failed", { cause: message });
  } finally {
    await loadingTask?.destroy();
  }
}

function normalizePageText(items: readonly unknown[]): string {
  const parts: string[] = [];
  for (const item of items) {
    if (
      item !== null
      && typeof item === "object"
      && "str" in item
      && typeof item.str === "string"
    ) {
      parts.push(item.str);
      if ("hasEOL" in item && item.hasEOL === true) parts.push("\n");
      else parts.push(" ");
    }
  }
  return normalizeText(parts.join(""));
}

function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/gu, " ").trim())
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function validatePdfPath(path: string): void {
  if (
    path.trim() !== path
    || !path.toLowerCase().endsWith(".pdf")
    || isUnsafePath(path)
  ) {
    throw new PdfIngestionError("invalid_path", `Unsafe or non-PDF source path: ${path}`);
  }
}

function validateVirtualPath(path: string): void {
  if (
    path.trim() !== path
    || !path.toLowerCase().endsWith(".md")
    || isUnsafePath(path)
  ) {
    throw new PdfIngestionError("invalid_path", `Unsafe virtual Markdown path: ${path}`);
  }
}

function isUnsafePath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return posix.isAbsolute(path)
    || win32.isAbsolute(path)
    || /^[a-z]:/iu.test(path)
    || normalized.split("/").includes("..");
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 5
    && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

function containsEncryptionMarker(bytes: Uint8Array): boolean {
  return new TextDecoder("latin1")
    .decode(bytes)
    .slice(-65_536)
    .includes("/Encrypt");
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(
      new PdfIngestionError("timeout", "PDF ingestion exceeded configured timeout", {
        timeout_ms: timeoutMs,
      }),
    ), timeoutMs);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function sha256Bytes(value: Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function sha256Json(value: unknown): string {
  return sha256Bytes(new TextEncoder().encode(canonicalJson(value)));
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    );
  }
  return value;
}

function formatConfidence(value: number): string {
  return value.toFixed(4).replace(/0+$/u, "").replace(/\.$/u, "");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export { Sha256Schema };
