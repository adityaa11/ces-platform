import { describe, expect, it } from "vitest";
import {
  PdfIngestionError,
  ingestPdfDocument,
  type PdfOcrAdapter,
} from "./index.js";
import { createPdf } from "./test-fixtures.js";

describe("PDF document ingestion", () => {
  it("extracts native text deterministically with page provenance", async () => {
    const bytes = createPdf(["Administrators create projects.", "Members view projects."]);
    const input = { document_id: "PRD", path: "docs/prd.pdf", bytes } as const;
    const first = await ingestPdfDocument(input);
    const second = await ingestPdfDocument(input);

    expect(first).toEqual(second);
    expect(first.normalized_document.path).toBe("docs/prd.pdf.md");
    expect(first.normalized_document.content).toContain("# PDF page 1");
    expect(first.normalized_document.content).toContain("Administrators create projects.");
    expect(first.pages).toHaveLength(2);
    expect(first.pages[0]).toMatchObject({
      page_number: 1,
      line_start: 1,
      line_end: 3,
      extraction_method: "native_text",
    });
    expect(first.pages[0]?.page_revision_hash).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(first.original.content_hash).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  it("uses an explicitly configured OCR adapter and reports low confidence", async () => {
    const bytes = createPdf(["Native text page", ""]);
    const ocr: PdfOcrAdapter = {
      async recognize({ page_number }) {
        return {
          text: `Scanned requirement on page ${page_number}`,
          confidence: 0.62,
          engine: "fixture-ocr",
          engine_version: "1.0.0",
          language_data_version: "eng-1",
        };
      },
    };
    const result = await ingestPdfDocument(
      { document_id: "SCAN", path: "docs/scan.pdf", bytes },
      { ocr, limits: { minimum_ocr_confidence: 0.8 } },
    );

    expect(result.pages[0]).toMatchObject({
      extraction_method: "native_text",
    });
    expect(result.pages[1]).toMatchObject({
      extraction_method: "ocr",
      confidence: 0.62,
      ocr_engine: "fixture-ocr",
      ocr_version: "1.0.0",
    });
    expect(result.normalized_document.content).toContain("[OCR confidence=0.62]");
    expect(result.warnings).toEqual([expect.objectContaining({
      code: "low_ocr_confidence",
      page_number: 2,
      confidence: 0.62,
    })]);
  });

  it("fails explicitly when OCR is required, unavailable, or fails", async () => {
    const input = {
      document_id: "SCAN",
      path: "docs/scan.pdf",
      bytes: createPdf([""]),
    };
    await expect(ingestPdfDocument(input)).rejects.toMatchObject({
      code: "ocr_required",
    });
    await expect(ingestPdfDocument(input, {
      ocr: { async recognize() { throw new Error("fixture unavailable"); } },
    })).rejects.toMatchObject({
      code: "ocr_failed",
      details: expect.objectContaining({ cause: "fixture unavailable" }),
    });
    await expect(ingestPdfDocument(input, {
      ocr: {
        async recognize() {
          return {
            text: "",
            confidence: 1,
            engine: "fixture-ocr",
            engine_version: "1.0.0",
          };
        },
      },
    })).rejects.toMatchObject({ code: "empty_pdf" });
  });

  it("enforces byte, page, character, and timeout limits", async () => {
    const onePage = createPdf(["A sufficiently long requirement"]);
    await expect(ingestPdfDocument(
      { document_id: "PRD", path: "docs/prd.pdf", bytes: onePage },
      { limits: { maximum_bytes: 10 } },
    )).rejects.toMatchObject({ code: "file_size_limit" });
    await expect(ingestPdfDocument(
      { document_id: "PRD", path: "docs/prd.pdf", bytes: createPdf(["One", "Two"]) },
      { limits: { maximum_pages: 1 } },
    )).rejects.toMatchObject({ code: "page_count_limit" });
    await expect(ingestPdfDocument(
      { document_id: "PRD", path: "docs/prd.pdf", bytes: onePage },
      { limits: { maximum_characters: 10 } },
    )).rejects.toMatchObject({ code: "character_limit" });
    await expect(ingestPdfDocument(
      { document_id: "SCAN", path: "docs/scan.pdf", bytes: createPdf([""]) },
      {
        limits: { timeout_ms: 20 },
        ocr: { async recognize() { return new Promise(() => undefined); } },
      },
    )).rejects.toMatchObject({ code: "timeout" });
  });

  it.each([
    ["unsafe source path", { document_id: "PRD", path: "../prd.pdf", bytes: createPdf(["Text"]) }, "invalid_path"],
    ["non-PDF extension", { document_id: "PRD", path: "docs/prd.md", bytes: createPdf(["Text"]) }, "invalid_path"],
    ["invalid header", { document_id: "PRD", path: "docs/prd.pdf", bytes: new TextEncoder().encode("not pdf") }, "invalid_pdf"],
    ["malformed PDF", { document_id: "PRD", path: "docs/prd.pdf", bytes: new TextEncoder().encode("%PDF-1.7 broken") }, "invalid_pdf"],
    ["encrypted PDF", { document_id: "PRD", path: "docs/prd.pdf", bytes: new TextEncoder().encode("%PDF-1.7\n/Encrypt 1 0 R") }, "encrypted_pdf"],
  ])("rejects %s with a structured diagnostic", async (_label, input, code) => {
    try {
      await ingestPdfDocument(input);
      throw new Error("Expected ingestion failure");
    } catch (error) {
      expect(error).toBeInstanceOf(PdfIngestionError);
      expect((error as PdfIngestionError).code).toBe(code);
    }
  });
});
