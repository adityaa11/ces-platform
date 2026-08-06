import { describe, expect, it } from "vitest";
import { createAtlasSemanticFactExtractor } from "./agent.js";

describe("Atlas V2 semantic fact registered agent", () => {
  it("uses the generic bridge contract without parsing PDFs or selecting graphs", () => {
    const agent = createAtlasSemanticFactExtractor({ model_alias: "atlas-default",
      provider_id: "gemini", policy: {} });
    expect(agent.id).toBe("atlas.semantic-fact-extractor");
    expect(agent.version).toBe("2.0.0");
    expect(agent.execution_policy.requires_human_review).toBe(true);
    const source = agent.buildExecutionRequest({ schema_version: "2.0.0", project_id: "project",
      documents: [{ document_id: "project.document", document_revision_id: "project.revision",
        revision: 1, content_hash: `sha256:${"a".repeat(64)}`, media_type: "application/pdf",
        original_name: "PRD.pdf" }], source_units: [{ schema_version: "1.1.0",
        id: "project.source", document_revision_id: "project.revision", kind: "paragraph",
        text: "Orders move to Paid.", exact_text: "Orders move to Paid.",
        location: { line_start: 1, line_end: 1, page_start: 1, page_end: 1 },
        section_path: [], order: 0, content_hash: `sha256:${"b".repeat(64)}`,
        exact_content_hash: `sha256:${"b".repeat(64)}`, revision_hash: `sha256:${"c".repeat(64)}`,
        source_kind: "pdf_text", language_detection: { detected_language: "en",
          language_detection_method: "deterministic", language_confidence: 1 } }] }, {} as never);
    expect(source.system_instructions).toContain("Never assume the document supports a workflow");
    expect(source.system_instructions).toContain("Do not choose graph types");
  });
});
