export type EvidenceRegion = { x: number; y: number; width: number; height: number };
export type BrowserEvidence = { evidence_id: string; exact_text: string; language: string;
  extraction_method: string; extraction_confidence: number; review_status?: string;
  location: { document_id: string; page_number: number; text_span: { start: number; end: number };
    coordinates: { coordinate_status: "available" | "unavailable";
      bounding_boxes: EvidenceRegion[] } } };
export function selectEvidence(items: BrowserEvidence[], evidenceId?: string) {
  return items.find(({ evidence_id }) => evidence_id === evidenceId) ?? items[0];
}
export function moveEvidence(items: BrowserEvidence[], activeId: string | undefined,
  direction: -1 | 1) {
  if (!items.length) return undefined;
  const current = Math.max(0, items.findIndex(({ evidence_id }) => evidence_id === activeId));
  return items[(current + direction + items.length) % items.length];
}
export function regionsForEvidence(item: BrowserEvidence | undefined): EvidenceRegion[] {
  return item?.location.coordinates.coordinate_status === "available"
    ? item.location.coordinates.bounding_boxes : [];
}
