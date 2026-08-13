import { createHash } from "node:crypto";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import type { CanonicalizationResolver } from "./agent.js";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const canonicalPredecessorHash = hash;
export const resolveAcceptedCanonicalizationKnowledge: CanonicalizationResolver = (envelope) => {
  if (envelope.request.layer !== "canonical_vocabulary") throw new Error("Canonical request required");
  const predecessor = envelope.governed_context.canonical_vocabulary_revision === "1.1.0"
    ? CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1
    : envelope.governed_context.canonical_vocabulary_revision === "1.3.0"
      ? CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3 : null;
  if (!predecessor || envelope.governed_context.predecessor_artifact_id !== predecessor.vocabulary_id ||
      envelope.governed_context.predecessor_artifact_hash !== hash(predecessor) ||
      envelope.governed_context.raw_vocabulary_revision !== "1.2.0")
    throw new Error("Canonical predecessor is stale or unavailable");
  const ids = new Set(envelope.request.accepted_raw_support.map(({ raw_concept_id }) => raw_concept_id));
  const raws = CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.corpus.vocabularies
    .flatMap(({ concepts }) => concepts).filter(({ concept_id }) => ids.has(concept_id));
  if (raws.length !== ids.size) throw new Error("Accepted raw support is unavailable");
  const raw_support = envelope.request.accepted_raw_support;
  for (const support of raw_support) { const raw = raws.find(({ concept_id }) => concept_id === support.raw_concept_id);
    if (!raw || raw.source_release_id !== support.source_release_id || raw.source_locator.locator !== support.source_locator)
      throw new Error("Raw lineage does not match accepted knowledge"); }
  return { raw_support, raw_meanings: raws.map(({ concept_id, bounded_description }) =>
    ({ raw_concept_id: concept_id, bounded_meaning: bounded_description })),
  predecessor_concepts: predecessor.concepts.map(({ concept_id, preferred_term, definition }) =>
    ({ concept_id, preferred_term, definition })) };
};
