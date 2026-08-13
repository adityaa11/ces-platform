import { CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1 } from "@company/ces-policy-source-glossary/core-sources";
import { CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import type { GovernedSourceResolver } from "./agent.js";
export const resolveAcceptedGovernedSource: GovernedSourceResolver = (envelope) => {
  if (envelope.request.layer !== "raw_source_vocabulary" ||
      envelope.governed_context.source_glossary_revision !== "1.1.0" ||
      envelope.governed_context.raw_vocabulary_revision !== "1.2.0")
    throw new Error("No governed source registry matches request revisions");
  if (envelope.request.governed_source_release_ids.length !== 1 ||
      envelope.request.source_locator_candidates.length !== 1) throw new Error("Source extraction must be bounded to one locator");
  const releaseId = envelope.request.governed_source_release_ids[0]!;
  const locator = envelope.request.source_locator_candidates[0]!;
  const governance = CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1.governance.find(({ release_id }) =>
    release_id === releaseId);
  if (!governance || governance.corpus_activation !== "ACTIVE" ||
      governance.processing.structured_extraction !== "AUTHORIZED" ||
      governance.processing.ai_assisted_analysis !== "AUTHORIZED")
    throw new Error("Source release is not authorized for agent-assisted extraction");
  const concepts = CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.corpus.vocabularies
    .flatMap(({ concepts: values }) => values);
  const concept = concepts.find(({ source_release_id, source_locator }) =>
    source_release_id === releaseId && source_locator.locator === locator);
  if (!concept) throw new Error("Exact governed source material is unavailable");
  return { source_release_id: releaseId, source_locator: locator,
    raw_concept_id: concept.concept_id, source_term: concept.source_term,
    exact_meaning: concept.bounded_description,
    rights_notice: governance.rights.additional_conditions.join("; "),
    existing_equivalent: envelope.request.existing_raw_concept_ids.includes(concept.concept_id) };
};
