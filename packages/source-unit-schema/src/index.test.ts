import { describe, expect, it } from "vitest";
import { buildSourceArtifacts, sourceSpansFromPdfPages } from "./index.js";

const input = {
  document_id: "safara",
  path: "docs/prd/safara.pdf.md",
  content: "# PDF page 1\r\n\r\n# Kebutuhan\r\n\r\nIntro text.\r\n\r\n- First rule\r\n1. First step\r\n| A | B |\r\n",
};

describe("DAPE-001 deterministic source units", () => {
  it("normalizes newlines and produces stable identities and ordering", () => {
    const first = buildSourceArtifacts(input);
    const second = buildSourceArtifacts({ ...input, content: input.content.replaceAll("\r\n", "\n") });
    expect(first).toEqual(second);
    expect(first.source_units.map(({ kind }) => kind)).toEqual([
      "heading", "heading", "paragraph", "bullet", "numbered_item", "table_row",
    ]);
    expect(first.source_units.map(({ order }) => order)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(first.source_units[2]?.location.page_start).toBe(1);
  });

  it("preserves hierarchy, source text and immutable results", () => {
    const result = buildSourceArtifacts(input);
    expect(result.source_units[2]?.parent_id).toBe(result.source_units[1]?.id);
    expect(result.source_units.map(({ text }) => text)).toContain("First rule");
    expect(result.source_units.find(({ text }) => text === "First rule")?.exact_text)
      .toBe("- First rule");
    expect(result.source_units[2]?.exact_content_hash).toMatch(/^sha256:/u);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.source_units[0])).toBe(true);
    expect(result.source_units[0]?.source_kind).toBe("markdown_text");
    expect(result.source_units[0]?.revision_hash).toMatch(/^sha256:/u);
    expect(result.document_revision.revision_hash).toMatch(/^sha256:/u);
  });

  it("retains PDF and OCR provenance on canonical units", () => {
    const result = buildSourceArtifacts({
      ...input,
      original_content_hash: `sha256:${"a".repeat(64)}`,
      parser: {
        id: "mozilla-pdfjs",
        version: "5.4.296",
        configuration_hash: `sha256:${"b".repeat(64)}`,
      },
      source_spans: [
        { line_start: 1, line_end: 4, source_kind: "pdf_text" },
        {
          line_start: 5,
          line_end: 9,
          source_kind: "pdf_ocr",
          ocr_confidence: 0.83,
          bounding_box: { x: 0.1, y: 0.2, width: 0.6, height: 0.1 },
        },
      ],
    });
    expect(result.source_units[0]?.source_kind).toBe("pdf_text");
    expect(result.source_units[2]).toMatchObject({
      source_kind: "pdf_ocr",
      ocr_confidence: 0.83,
      bounding_box: { x: 0.1, y: 0.2, width: 0.6, height: 0.1 },
    });
  });

  it("converts existing PDF page provenance without a duplicate contract", () => {
    expect(sourceSpansFromPdfPages([
      { line_start: 1, line_end: 4, extraction_method: "native_text" },
      { line_start: 5, line_end: 9, extraction_method: "ocr", confidence: 0.72 },
    ])).toEqual([
      { line_start: 1, line_end: 4, source_kind: "pdf_text" },
      {
        line_start: 5,
        line_end: 9,
        source_kind: "pdf_ocr",
        ocr_confidence: 0.72,
      },
    ]);
  });

  it("binds revision identity to original bytes and parser configuration", () => {
    const base = {
      ...input,
      original_content_hash: `sha256:${"a".repeat(64)}`,
    };
    const first = buildSourceArtifacts(base);
    const changedBytes = buildSourceArtifacts({
      ...base,
      original_content_hash: `sha256:${"b".repeat(64)}`,
    });
    const changedParser = buildSourceArtifacts({
      ...base,
      parser: {
        id: "source-unit-mechanical",
        version: "1.0.0",
        configuration_hash: `sha256:${"c".repeat(64)}`,
      },
    });
    expect(changedBytes.document_revision.id).not.toBe(first.document_revision.id);
    expect(changedParser.document_revision.id).not.toBe(first.document_revision.id);
    expect(changedBytes.source_units[0]?.id).not.toBe(first.source_units[0]?.id);
  });

  it("segments unrelated domains without domain-specific structure", () => {
    const result = buildSourceArtifacts({
      document_id: "cold-chain",
      path: "docs/cold-chain.md",
      content: [
        "# Temperature Release",
        "",
        "Release requires an in-range temperature history.",
        "A supervisor reviews excursions before release.",
      ].join("\n"),
    });
    expect(result.source_units.map(({ text }) => text)).toEqual([
      "Temperature Release",
      "Release requires an in-range temperature history. A supervisor reviews excursions before release.",
    ]);
    expect(result.source_units[1]?.section_path).toEqual(["Temperature Release"]);
  });

  it("rejects invalid identity, empty content and invalid provenance", () => {
    expect(() => buildSourceArtifacts({ ...input, document_id: "INVALID ID" })).toThrow();
    expect(() => buildSourceArtifacts({ ...input, content: " \n" })).toThrow();
    expect(() => buildSourceArtifacts({ ...input, original_content_hash: "stale" })).toThrow();
    expect(() => buildSourceArtifacts({
      ...input,
      source_spans: [{
        line_start: 1,
        line_end: 2,
        source_kind: "pdf_text",
        ocr_confidence: 0.5,
      }],
    })).toThrow("OCR confidence");
    expect(() => buildSourceArtifacts({
      ...input,
      source_spans: [{
        line_start: 1,
        line_end: 2,
        source_kind: "pdf_ocr",
        bounding_box: { x: 0.9, y: 0, width: 0.2, height: 0.1 },
      }],
    })).toThrow("Bounding box");
  });
});
