import { parseSemanticExtractionResult, type NormalizedDocument } from "@atlas/contracts";
import type { SourceSlot } from "./prepare-source-slots.mts";
import type { Proposal, SemanticUnit } from "./semantic-oracle.mts";

export function finalizeProposal(proposal: Proposal, slots: readonly SourceSlot[], document: NormalizedDocument) {
  const slotMap = new Map(slots.map((item) => [item.slot, item]));
  const candidates = proposal.source_results.flatMap(({ slot, semantic_units }) => semantic_units.map((unit, index) => ({
    local_candidate_id: `${slot.toLowerCase()}-${index + 1}`,
    semantic_key: `${slot.toLowerCase()}:${index + 1}`,
    kind: unit.semantic_kind,
    payload: unit as unknown as Record<string, unknown>,
    normalized_meaning: JSON.stringify(unit),
    source_wording: slotMap.get(slot)!.text,
    needs_resolution: unit.resolution_status === "needs_resolution",
    evidence_refs: [evidence(slotMap.get(slot)!)],
  })));
  const destinationMap = new Map<string, string[]>();
  for (const { slot, semantic_units } of proposal.source_results) destinationMap.set(slot, semantic_units.map((_, index) => `${slot.toLowerCase()}-${index + 1}`));
  const result = {
    version: "v1",
    candidate_assertions: candidates,
    source_statement_inventory: slots.map((slot) => {
      const destinations = destinationMap.get(slot.slot)!;
      return {
        source_unit_id: slot.locatorId,
        page_number: slot.pageNumber,
        locator_type: "text_block",
        locator_id: slot.locatorId,
        classification: destinations.length ? "candidate" : "non_fact",
        destination_local_candidate_ids: destinations,
        ...(destinations.length ? {} : { non_fact_reason: "Source is a structural heading without a semantic proposition." }),
      };
    }),
    questions: proposal.source_results.flatMap(({ slot, semantic_units }) => semantic_units.filter((unit) => unit.resolution_status === "needs_resolution").map((unit) => ({
      question: unit.clarification_question!,
      reason: "The validated provider proposal marks material information as unresolved.",
      evidence_refs: [evidence(slotMap.get(slot)!)],
    }))),
  };
  void document;
  return parseSemanticExtractionResult(result);
}

function evidence(slot: SourceSlot) {
  return { page_number: slot.pageNumber, locator_type: "text_block", locator_id: slot.locatorId, excerpt: slot.text };
}

export function snapshotProposal(proposal: Proposal): string { return JSON.stringify(proposal); }
export function proposalUnits(proposal: Proposal): readonly SemanticUnit[] { return proposal.source_results.flatMap(({ semantic_units }) => semantic_units); }
