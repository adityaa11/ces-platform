import { describe, expect, it } from "vitest";
import { buildSourceArtifacts } from "./index.js";

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
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.source_units[0])).toBe(true);
  });

  it("rejects invalid identity, empty content and stale original hashes", () => {
    expect(() => buildSourceArtifacts({ ...input, document_id: "INVALID ID" })).toThrow();
    expect(() => buildSourceArtifacts({ ...input, content: " \n" })).toThrow();
    expect(() => buildSourceArtifacts({ ...input, original_content_hash: "stale" })).toThrow();
  });
});
