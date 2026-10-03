import { validateIntermediate, type IntermediateResult } from "./intermediate-schema.mts";

export function assertSemanticOracle(value: unknown): IntermediateResult {
  const result = validateIntermediate(value), bySlot = new Map(result.source_results.map((source) => [source.slot, source]));
  const s1 = bySlot.get(1)!; if (s1.disposition !== "candidate" || !s1.candidates.some((candidate) => candidate.kind === "workflow_step" && !candidate.needs_resolution)) throw new Error("Semantic oracle failed S1: expected a non-resolution workflow_step.");
  const s2 = bySlot.get(2)!; const s2Meaning = s2.candidates.map((candidate) => candidate.normalized_meaning).join(" ").toLowerCase(); if (s2.disposition !== "candidate" || !s2.candidates.some((candidate) => candidate.kind === "constraint" && !candidate.needs_resolution) || !/(^|\D)2(\D|$)|\btwo\b/.test(s2Meaning) || !/per order|one order|single order/.test(s2Meaning) || !/customer/.test(s2Meaning)) throw new Error("Semantic oracle failed S2: expected customer maximum 2 products per order constraint.");
  const s3 = bySlot.get(3)!; if (s3.disposition !== "non_fact") throw new Error("Semantic oracle failed S3: expected heading non_fact.");
  const s4 = bySlot.get(4)!; if (s4.disposition !== "uncertain" || !s4.candidates.some((candidate) => candidate.kind === "unresolved" && candidate.needs_resolution) || !/approval/i.test(s4.question) || !s4.question_reason) throw new Error("Semantic oracle failed S4: expected question-bearing unresolved approval uncertainty.");
  return result;
}

export const semanticDecisionSignature = (proposal: IntermediateResult) => proposal.source_results.map((result) => ({ slot: result.slot, disposition: result.disposition, kinds: result.candidates.map((candidate) => candidate.kind).sort(), needs_resolution: result.candidates.map((candidate) => candidate.needs_resolution).sort() }));
