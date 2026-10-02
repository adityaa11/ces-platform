import { parseSemanticExtractionResult } from "../../packages/atlas-contracts/src/index.ts";
import { fixtureSources, type Slot } from "./fixture.mts";
import { validateIntermediate, type IntermediateResult } from "./intermediate-schema.mts";

const sourceFor = (slot: Slot) => fixtureSources[Number(slot.slice(1)) - 1]!;
const evidence = (slot: Slot) => { const source = sourceFor(slot); return { page_number: 1, locator_type: "text_block", locator_id: source.locator_id, excerpt: source.text }; };

export function finalize(proposal: unknown) {
  const parsed: IntermediateResult = validateIntermediate(proposal);
  const ordered = [...parsed.source_results].sort((a, b) => a.slot - b.slot);
  const candidates: object[] = [];
  const inventory: object[] = [];
  const questions: object[] = [];
  for (const result of ordered) {
    const slot = `S${result.slot}` as Slot;
    const source = sourceFor(slot);
    const ids: string[] = [];
    for (const [index, candidate] of result.candidates.entries()) {
      const local_candidate_id = `spike.s${result.slot}.c${index + 1}`;
      ids.push(local_candidate_id);
      candidates.push({ local_candidate_id, semantic_key: candidate.semantic_key, kind: candidate.kind, payload: {}, normalized_meaning: candidate.normalized_meaning, source_wording: source.text, needs_resolution: candidate.needs_resolution, evidence_refs: [evidence(slot)] });
    }
    inventory.push({ source_unit_id: source.locator_id, page_number: 1, locator_type: "text_block", locator_id: source.locator_id, classification: result.disposition === "non_fact" ? "non_fact" : "candidate", destination_local_candidate_ids: ids, ...(result.disposition === "non_fact" ? { non_fact_reason: result.non_fact_reason } : {}) });
    if (result.disposition === "uncertain") questions.push({ question: result.question, reason: result.question_reason, evidence_refs: [evidence(slot)] });
  }
  const finalResult = { version: "v1", candidate_assertions: candidates, source_statement_inventory: inventory, questions };
  return parseSemanticExtractionResult(finalResult);
}
