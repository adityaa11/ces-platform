import { describe, expect, it } from "vitest";
import { moveEvidence, regionsForEvidence, selectEvidence,
  type BrowserEvidence } from "./evidence-browser";

const evidence: BrowserEvidence[] = [{ evidence_id: "sample.evidence.text",
  exact_text: "First source region and second source region", language: "en",
  extraction_method: "text_layer", extraction_confidence: 1, review_status: "accepted",
  location: { document_id: "sample.document", page_number: 2,
    text_span: { start: 0, end: 44 }, coordinates: { coordinate_status: "available",
      bounding_boxes: [{ x: .1, y: .2, width: .3, height: .04 },
        { x: .1, y: .4, width: .35, height: .04 }] } } },
{ evidence_id: "sample.evidence.ocr", exact_text: "Scanned wording", language: "en",
  extraction_method: "ocr", extraction_confidence: .82, review_status: "unreviewed",
  location: { document_id: "sample.document", page_number: 4,
    text_span: { start: 0, end: 15 }, coordinates: { coordinate_status: "available",
      bounding_boxes: [{ x: .2, y: .3, width: .4, height: .05 }] } } },
{ evidence_id: "sample.evidence.no-coordinates", exact_text: "Exact wording remains visible",
  language: "en", extraction_method: "text_layer", extraction_confidence: .95,
  location: { document_id: "sample.document", page_number: 5,
    text_span: { start: 0, end: 29 }, coordinates: { coordinate_status: "unavailable",
      bounding_boxes: [] } } }];

describe("PDF evidence browser state", () => {
  it("keeps card, page, and multiple non-contiguous highlights synchronized", () => {
    const selected = selectEvidence(evidence, "sample.evidence.text");
    expect(selected?.location.page_number).toBe(2);
    expect(regionsForEvidence(selected)).toHaveLength(2);
    expect(moveEvidence(evidence, selected?.evidence_id, 1)?.evidence_id)
      .toBe("sample.evidence.ocr");
    expect(moveEvidence(evidence, evidence[0]!.evidence_id, -1)?.location.page_number).toBe(5);
  });
  it("preserves OCR confidence and never invents unavailable coordinates", () => {
    expect(selectEvidence(evidence, "sample.evidence.ocr")?.extraction_confidence).toBe(.82);
    expect(regionsForEvidence(selectEvidence(evidence,
      "sample.evidence.no-coordinates"))).toEqual([]);
  });
});
