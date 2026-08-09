import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { finalizeSemanticFacts } from "./index.js";

const hash = (value: string): string => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const unit = (input: { id: string; text: string; sourceKind: "pdf_text" | "pdf_ocr";
  box?: { x: number; y: number; width: number; height: number } }) => ({
  schema_version: "1.1.0", id: input.id, document_revision_id: "project.document.revision",
  kind: "paragraph", text: input.text, exact_text: input.text,
  location: { line_start: 1, line_end: 1, page_start: 2, page_end: 2 },
  section_path: ["Orders"], order: 0, content_hash: hash(input.text),
  exact_content_hash: hash(input.text), revision_hash: hash(`${input.id}:${input.text}`),
  source_kind: input.sourceKind, ...(input.sourceKind === "pdf_ocr" ? { ocr_confidence: 0.86 } : {}),
  ...(input.box ? { bounding_box: input.box } : {}),
  language_detection: { detected_language: "en", language_detection_method: "deterministic",
    language_confidence: 1 },
});
const input = (sourceUnit: ReturnType<typeof unit>) => ({
  schema_version: "2.0.0", project_id: "project",
  documents: [{ document_id: "project.document", document_revision_id: "project.document.revision",
    revision: 1, content_hash: hash("pdf"), media_type: "application/pdf", original_name: "Orders.pdf" }],
  source_units: [sourceUnit],
});

describe("Atlas semantic fact extraction", () => {
  it("preserves a text-PDF quote and trustworthy highlight coordinates", () => {
    const source = unit({ id: "project.source.order", text: "The system creates an invoice after checkout.",
      sourceKind: "pdf_text", box: { x: 0.1, y: 0.2, width: 0.5, height: 0.04 } });
    const output = finalizeSemanticFacts(input(source), { schema_version: "2.0.0", facts: [{
      candidate_id: "candidate.invoice", kind: "activity_order",
      exact_statement: source.exact_text, source_unit_ids: [source.id], confidence: 0.95,
      relation_kind: "atlas.relation.after", terms: [
        { role_id: "activity", exact_text: "creates an invoice" },
        { role_id: "predecessor", exact_text: "checkout" },
      ],
    }] });
    expect(output.facts[0]?.exact_statement).toBe(source.exact_text);
    expect(output.evidence[0]?.location.coordinates.coordinate_status).toBe("available");
  });

  it("preserves OCR uncertainty and never guesses a highlight", () => {
    const source = unit({ id: "project.source.scan", text: "Approved orders enter Fulfilled state.",
      sourceKind: "pdf_ocr" });
    const output = finalizeSemanticFacts(input(source), { schema_version: "2.0.0", facts: [{
      candidate_id: "candidate.state", kind: "state_transition",
      exact_statement: source.exact_text, source_unit_ids: [source.id], confidence: 0.8,
      terms: [{ role_id: "to_state", exact_text: "Fulfilled" }],
    }] });
    expect(output.evidence[0]?.extraction_method).toBe("ocr");
    expect(output.evidence[0]?.extraction_confidence).toBe(0.86);
    expect(output.evidence[0]?.location.coordinates).toEqual({ coordinate_status: "unavailable",
      bounding_boxes: [], reason: "source_has_no_coordinates" });
  });

  it("rejects paraphrases and source-free terms", () => {
    const source = unit({ id: "project.source.rule", text: "Only managers may cancel orders.",
      sourceKind: "pdf_text" });
    expect(() => finalizeSemanticFacts(input(source), { schema_version: "2.0.0", facts: [{
      candidate_id: "candidate.paraphrase", kind: "permission",
      exact_statement: "Managers can cancel an order.", source_unit_ids: [source.id],
      confidence: 1, terms: [{ role_id: "actor", exact_text: "managers" }],
    }] })).toThrow(/exact source quote/u);
    expect(() => finalizeSemanticFacts(input(source), { schema_version: "2.0.0", facts: [{
      candidate_id: "candidate.rule", kind: "permission",
      exact_statement: source.exact_text, source_unit_ids: [source.id],
      confidence: 1, terms: [{ role_id: "actor", exact_text: "Administrators" }],
    }] })).toThrow(/not present in cited source text/u);
  });

  it("gives distinct identities to different relationships from one exact sentence", () => {
    const source = unit({ id: "project.source.sequence",
      text: "Registration creates Billing and requires Documents.", sourceKind: "pdf_text" });
    const common = { kind: "activity_order" as const, exact_statement: source.exact_text,
      source_unit_ids: [source.id], confidence: 1 };
    const output = finalizeSemanticFacts(input(source), { schema_version: "2.0.0", facts: [{
      ...common, candidate_id: "candidate.billing", relation_kind: "creates", terms: [
        { role_id: "source", exact_text: "Registration" },
        { role_id: "target", exact_text: "Billing" }],
    }, { ...common, candidate_id: "candidate.documents", relation_kind: "requires", terms: [
      { role_id: "source", exact_text: "Registration" },
      { role_id: "target", exact_text: "Documents" }],
    }] });
    expect(output.facts).toHaveLength(2);
    expect(new Set(output.facts.map(({ fact_id }) => fact_id)).size).toBe(2);
  });
});
