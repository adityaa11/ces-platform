import { describe, expect, it } from "vitest";
import { createAtlasProjectRelationshipExtractor } from "./agent.js";

const hash = (character: string) => `sha256:${character.repeat(64)}`;
function unit(id: string, kind: "heading" | "paragraph", text: string, order: number) {
  return { schema_version: "1.1.0" as const, id, document_revision_id: "sample.revision",
    kind, text, exact_text: kind === "heading" ? `${order}. ${text}` : text,
    location: { line_start: order, line_end: order, page_start: 1, page_end: 1 },
    section_path: kind === "heading" ? [text] : [], order,
    content_hash: hash("b"), exact_content_hash: hash("b"), revision_hash: hash("c"),
    source_kind: "pdf_text" as const, language_detection: { detected_language: "en",
      language_detection_method: "deterministic" as const, language_confidence: 1 } };
}

describe("Atlas project relationship extractor", () => {
  it("constructs exact semantic facts from selected heading and evidence unit IDs", async () => {
    const source = unit("sample.source.orders", "heading", "Orders", 1);
    const target = unit("sample.source.payment", "heading", "Payment", 2);
    const evidence = unit("sample.source.sequence", "paragraph",
      "Orders proceed to payment after confirmation.", 3);
    const input = { schema_version: "2.0.0" as const, project_id: "sample",
      extraction_focus: "relationships" as const,
      documents: [{ document_id: "sample.document", document_revision_id: "sample.revision",
        revision: 1, content_hash: hash("a"), media_type: "application/pdf",
        original_name: "sample.pdf" }], source_units: [source, target, evidence] };
    const agent = createAtlasProjectRelationshipExtractor({ model_alias: "atlas-default",
      provider_id: "gemini", policy: {} });
    const output = await agent.transformResult({ schema_version: "2.0.0", relations: [{
      candidate_id: "sample.candidate.sequence", kind: "activity_order",
      source_heading_unit_id: source.id, target_heading_unit_id: target.id,
      evidence_source_unit_id: evidence.id, relation_kind: "enables", confidence: 0.9,
    }] }, input, {} as never);
    expect(output.facts[0]).toMatchObject({ exact_statement: evidence.exact_text,
      terms: [{ role_id: "source", exact_text: "Orders" },
        { role_id: "target", exact_text: "Payment" }] });
    expect(output.rejections).toEqual([]);
  });
});
