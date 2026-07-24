import { describe, expect, it } from "vitest";
import {
  ingestMarkdownDocuments,
  sourceContentHash,
} from "./index.js";

describe("Markdown document ingestion", () => {
  it("normalizes line endings, paths, and document order deterministically", () => {
    const first = ingestMarkdownDocuments([
      { document_id: "PRD-B", path: "docs\\b.md", content: "# B\r\nBody" },
      { document_id: "PRD-A", path: "./docs/a.md", content: "# A\nBody" },
    ]);
    const second = ingestMarkdownDocuments([
      { document_id: "PRD-A", path: "docs/a.md", content: "# A\r\nBody" },
      { document_id: "PRD-B", path: "docs/b.md", content: "# B\nBody" },
    ]);

    expect(first).toEqual(second);
    expect(first.documents.map(({ document_id }) => document_id)).toEqual([
      "PRD-A",
      "PRD-B",
    ]);
    expect(first.documents[0]?.line_count).toBe(2);
  });

  it("produces stable content hashes", () => {
    expect(sourceContentHash("# PRD\r\nText")).toBe(
      sourceContentHash("# PRD\nText"),
    );
  });

  it.each([
    "C:\\outside\\prd.md",
    "../outside.md",
    "/outside.md",
    "docs/prd.pdf",
  ])("rejects unsafe or non-Markdown path %s", (path) => {
    expect(() => ingestMarkdownDocuments([
      { document_id: "PRD", path, content: "# PRD" },
    ])).toThrow();
  });

  it("rejects duplicate document IDs and paths", () => {
    expect(() => ingestMarkdownDocuments([
      { document_id: "PRD", path: "docs/a.md", content: "# A" },
      { document_id: "PRD", path: "docs/b.md", content: "# B" },
    ])).toThrow("Duplicate document ID");
    expect(() => ingestMarkdownDocuments([
      { document_id: "PRD-A", path: "docs/a.md", content: "# A" },
      { document_id: "PRD-B", path: "docs/a.md", content: "# B" },
    ])).toThrow("Duplicate document path");
  });
});
