import { parseSemanticExtractionResult } from "../../packages/atlas-contracts/src/index.ts";
import { fixtureSources, type Slot } from "./fixture.mts";
import { parseProposal, type SemanticQualificationProposal } from "./schema.mts";

const sourceFor = (slot: Slot) => fixtureSources.find((source) => source.slot === slot)!;
const evidence = (slot: Slot) => { const source = sourceFor(slot); return { page_number: 1, locator_type: "text_block", locator_id: source.locatorId, excerpt: source.text }; };
const normalizedMeaning = (extraction: SemanticQualificationProposal["sourceResults"][number]["extraction"]) => extraction.kind === "workflow_step" ? [extraction.actor, extraction.action, extraction.object, extraction.target, extraction.temporalConstraint].filter(Boolean).join(" ") : extraction.kind === "constraint" ? [extraction.subject, extraction.restriction, extraction.quantity, extraction.unit, extraction.scope].filter((part) => part !== null).join(" ") : extraction.kind === "rule" ? [extraction.subject, extraction.modality, extraction.temporalConstraint, extraction.applicabilityCondition].filter(Boolean).join(" ") : extraction.reason;

export function finalize(value: unknown) {
  const proposal = parseProposal(value), candidateAssertions: object[] = [], sourceStatementInventory: object[] = [], questions: object[] = [];
  for (const { sourceSlot, extraction } of proposal.sourceResults) {
    const source = sourceFor(sourceSlot);
    if (extraction.kind === "non_fact") { sourceStatementInventory.push({ source_unit_id: source.locatorId, page_number: 1, locator_type: "text_block", locator_id: source.locatorId, classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: extraction.reason }); continue; }
    const localCandidateId = `anoman-spike.${sourceSlot.toLowerCase()}.${extraction.kind}`;
    const needsResolution = extraction.kind === "rule" && (extraction.modality === "possible" || extraction.missingInformation.length > 0);
    candidateAssertions.push({ local_candidate_id: localCandidateId, semantic_key: `anoman-spike.${sourceSlot.toLowerCase()}.${extraction.kind}`, kind: extraction.kind, payload: extraction, normalized_meaning: normalizedMeaning(extraction), source_wording: source.text, needs_resolution: needsResolution, evidence_refs: [evidence(sourceSlot)] });
    sourceStatementInventory.push({ source_unit_id: source.locatorId, page_number: 1, locator_type: "text_block", locator_id: source.locatorId, classification: "candidate", destination_local_candidate_ids: [localCandidateId] });
    if (needsResolution) questions.push({ question: "Under what condition is approval required before processing?", reason: extraction.missingInformation.join("; "), evidence_refs: [evidence(sourceSlot)] });
  }
  return parseSemanticExtractionResult({ version: "v1", candidate_assertions: candidateAssertions, source_statement_inventory: sourceStatementInventory, questions });
}
