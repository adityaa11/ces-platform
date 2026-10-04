import { parseSemanticExtractionResult } from "../../packages/atlas-contracts/src/index.ts";
import { fixtureSources, type Slot } from "./fixture.mts";
import { parseProposal, type AtlasSemanticSpikeProposal } from "./schema.mts";

const sourceFor = (slot: Slot) => fixtureSources.find((source) => source.slot === slot)!;
const evidence = (slot: Slot) => { const source = sourceFor(slot); return { page_number: 1, locator_type: "text_block", locator_id: source.locatorId, excerpt: source.text }; };
const meaning = (extraction: AtlasSemanticSpikeProposal["sourceResults"][number]["extraction"]) => extraction.kind === "workflow_step" ? [extraction.actor, extraction.action, extraction.object, extraction.condition].filter(Boolean).join(" ") : extraction.kind === "constraint" ? [extraction.subject, extraction.restriction, extraction.quantity, extraction.unit, extraction.scope].filter((part) => part !== null).join(" ") : extraction.kind === "rule" ? [extraction.subject, extraction.rule].filter(Boolean).join(" ") : extraction.kind === "condition" ? extraction.condition : extraction.kind === "unresolved" ? extraction.knownMeaning : extraction.reason;

export function finalize(value: unknown) {
  const proposal = parseProposal(value), candidateAssertions: object[] = [], sourceStatementInventory: object[] = [], questions: object[] = [];
  for (const { sourceSlot, extraction } of proposal.sourceResults) {
    const source = sourceFor(sourceSlot);
    if (extraction.kind === "non_fact") {
      sourceStatementInventory.push({ source_unit_id: source.locatorId, page_number: 1, locator_type: "text_block", locator_id: source.locatorId, classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: extraction.reason });
      continue;
    }
    const localCandidateId = `spike.${sourceSlot.toLowerCase()}.${extraction.kind}`;
    candidateAssertions.push({ local_candidate_id: localCandidateId, semantic_key: `spike.${sourceSlot.toLowerCase()}.${extraction.kind}`, kind: extraction.kind, payload: extraction, normalized_meaning: meaning(extraction), source_wording: source.text, needs_resolution: extraction.kind === "unresolved", evidence_refs: [evidence(sourceSlot)] });
    sourceStatementInventory.push({ source_unit_id: source.locatorId, page_number: 1, locator_type: "text_block", locator_id: source.locatorId, classification: "candidate", destination_local_candidate_ids: [localCandidateId] });
    if (extraction.kind === "unresolved") questions.push({ question: extraction.clarificationQuestion, reason: extraction.missingInformation, evidence_refs: [evidence(sourceSlot)] });
  }
  return parseSemanticExtractionResult({ version: "v1", candidate_assertions: candidateAssertions, source_statement_inventory: sourceStatementInventory, questions });
}
