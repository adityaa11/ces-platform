import { parseProposal, type AtlasSemanticSpikeProposal } from "./schema.mts";

export function assertSemanticOracle(value: unknown): AtlasSemanticSpikeProposal {
  const proposal = parseProposal(value), bySlot = new Map(proposal.sourceResults.map((result) => [result.sourceSlot, result.extraction]));
  const s1 = bySlot.get("S1"); if (!s1 || s1.kind !== "workflow_step" || !/customer/i.test(s1.actor ?? "") || !/submit/i.test(s1.action) || !/order/i.test(s1.object ?? "")) throw new Error("Semantic oracle failed S1: expected customer submit order workflow_step.");
  const s2 = bySlot.get("S2"); if (!s2 || s2.kind !== "constraint" || s2.quantity !== 2 || !/customer|pelanggan/i.test(s2.subject) || !/product|produk/i.test(s2.unit ?? "") || !/per order|satu pesanan/i.test(s2.scope ?? "")) throw new Error("Semantic oracle failed S2: expected customer maximum 2 products per-order constraint.");
  const s3 = bySlot.get("S3"); if (!s3 || s3.kind !== "non_fact") throw new Error("Semantic oracle failed S3: expected structural non_fact.");
  const s4 = bySlot.get("S4"); if (!s4 || s4.kind !== "unresolved" || !/approval/i.test(s4.knownMeaning) || !/condition|when/i.test(s4.missingInformation) || !s4.clarificationQuestion.trim()) throw new Error("Semantic oracle failed S4: expected unresolved approval with condition and clarification question.");
  return proposal;
}

export const semanticDecisionSignature = (proposal: AtlasSemanticSpikeProposal) => proposal.sourceResults.map(({ sourceSlot, extraction }) => ({ sourceSlot, kind: extraction.kind }));
