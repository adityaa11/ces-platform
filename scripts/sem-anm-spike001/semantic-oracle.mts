import { parseProposal, type SemanticQualificationProposal } from "./schema.mts";

export function assertSemanticOracle(value: unknown): SemanticQualificationProposal {
  const proposal = parseProposal(value), bySlot = new Map(proposal.sourceResults.map((entry) => [entry.sourceSlot, entry.extraction]));
  const s1 = bySlot.get("S1"); if (!s1 || s1.kind !== "workflow_step" || !/customer/i.test(s1.actor ?? "") || !/submit/i.test(s1.action) || !/order/i.test(s1.object ?? "")) throw new Error("Semantic oracle failed S1: expected customer submit order workflow step.");
  const s2 = bySlot.get("S2"); if (!s2 || s2.kind !== "constraint" || s2.quantity !== 2 || !/customer|pelanggan/i.test(s2.subject) || !/product|produk/i.test(s2.unit ?? "") || !/per order|satu pesanan/i.test(s2.scope ?? "")) throw new Error("Semantic oracle failed S2: expected customer maximum 2 products per-order constraint.");
  const s3 = bySlot.get("S3"); if (!s3 || s3.kind !== "non_fact") throw new Error("Semantic oracle failed S3: expected structural non_fact.");
  const s4 = bySlot.get("S4"); if (!s4 || s4.kind !== "rule" || s4.modality !== "possible" || !/approval/i.test(s4.subject ?? "") || !/before processing/i.test(s4.temporalConstraint ?? "") || s4.applicabilityCondition !== null || !s4.missingInformation.some((item) => /condition|applicab/i.test(item))) throw new Error("Semantic oracle failed S4: expected possible approval rule with missing applicability condition.");
  return proposal;
}

export const semanticDecisionSignature = (proposal: SemanticQualificationProposal) => proposal.sourceResults.map(({ sourceSlot, extraction }) => ({ sourceSlot, kind: extraction.kind, modality: extraction.kind === "rule" ? extraction.modality : undefined }));
