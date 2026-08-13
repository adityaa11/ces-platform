import { createHash } from "node:crypto";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { GovernedPolicyValidationInputSchema } from "@company/ces-policy-knowledge-validation";
import { CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import { CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1,
  CES_POLICY_REPRESENTATIVE_TAXONOMY_V1 } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import type { PolicyTaxonomyKnowledgeResolver } from "./agent.js";

const rawConcepts = CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.corpus.vocabularies
  .flatMap(({ concepts }) => concepts);
const hash = (value: unknown) => createHash("sha256")
  .update(JSON.stringify(value)).digest("hex");

/** Fail-closed registry for the accepted AGB-007 golden knowledge tuple. */
export const resolveAcceptedPolicyTaxonomyKnowledge: PolicyTaxonomyKnowledgeResolver =
  (request) => {
    const context = request.governed_context;
    const tuple = context.canonical_vocabulary_revision === "1.3.0" &&
      context.policy_taxonomy_revision === "1.0.0" ? { canonical:
        CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
        predecessor: CES_POLICY_REPRESENTATIVE_TAXONOMY_V1 } : { canonical:
        CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5,
        predecessor: CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy };
    const { canonical, predecessor } = tuple;
    if (context.source_glossary_revision !== "1.1.0" ||
        context.raw_vocabulary_revision !== "1.2.0" ||
        context.canonical_vocabulary_revision !== canonical.vocabulary_revision ||
        context.policy_taxonomy_revision !== predecessor.taxonomy_revision ||
        context.predecessor_artifact_id !== predecessor.taxonomy_id ||
        context.predecessor_artifact_hash !== hash(predecessor)) {
      throw new Error("No accepted governed Policy knowledge matches the pinned request revisions");
    }
    const requestedConcepts = new Set(request.request.layer === "policy_taxonomy"
      ? request.request.approved_canonical_concept_ids : []);
    const requestedPolicies = new Set(request.request.layer === "policy_taxonomy"
      ? request.request.predecessor_policy_ids : []);
    const approved_canonical_obligations = canonical.concepts
      .filter(({ concept_id }) => requestedConcepts.has(concept_id))
      .map((concept) => ({ concept_id: concept.concept_id,
        preferred_term: concept.preferred_term, definition: concept.definition,
        raw_lineage: canonical.mappings
          .filter(({ canonical_concept_id }) => canonical_concept_id === concept.concept_id)
          .map((mapping) => {
            const raw = rawConcepts.find(({ concept_id, source_release_id }) =>
              concept_id === mapping.raw_concept_id &&
              source_release_id === mapping.raw_source_release_id);
            if (!raw) throw new Error(`Accepted raw lineage is unavailable: ${mapping.raw_concept_id}`);
            return { canonical_concept_id: concept.concept_id,
              raw_concept_id: mapping.raw_concept_id,
              source_release_id: mapping.raw_source_release_id,
              source_locator: raw.source_locator.locator };
          }) }));
    const predecessor_policies = predecessor.policies
      .filter(({ policy_id }) => requestedPolicies.has(policy_id))
      .map((policy) => ({ policy_id: policy.policy_id, title: policy.title,
        obligation: policy.obligation,
        canonical_support_ids: policy.canonical_support.map(({ canonical_concept_id }) =>
          canonical_concept_id) }));
    if (approved_canonical_obligations.length !== requestedConcepts.size ||
        predecessor_policies.length !== requestedPolicies.size) {
      throw new Error("Pinned request references knowledge outside the accepted registry");
    }
    return { validation_input: GovernedPolicyValidationInputSchema.parse({
      source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
      raw_concepts: rawConcepts.map(({ concept_id, source_release_id }) =>
        ({ concept_id, source_release_id })), canonical_vocabulary: canonical,
      predecessor_taxonomy: predecessor }),
    approved_canonical_obligations, predecessor_policies };
  };
