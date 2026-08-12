import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  resolveCanonicalSourceLineage } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { validatePolicyTaxonomyAgainstCanonicalVocabulary } from "./index.js";

const support = (canonicalConceptId: string, rationale: string) =>
  ({ canonical_concept_id: canonicalConceptId, rationale });
const independence = (rationale: string) => ({ what_not_how: true as const,
  prohibited_term_matches: [] as never[], rationale });
const proposed = { status: "proposed" as const, reviewed_at: null,
  reviewer_evidence_id: null };

const taxonomyValue = {
  schema_version: "1.0.0",
  taxonomy_id: "ces-policy-taxonomy.representative-v1-1",
  taxonomy_revision: "1.0.0",
  predecessor_revision: null,
  canonical_vocabulary_id: "ces-policy-canonical-vocabulary",
  canonical_vocabulary_revision: "1.1.0",
  lifecycle: "candidate",
  policies: [
    { policy_id: "policy.access-authorization", policy_version: "1.0.0",
      title: "Authorized access", lifecycle: "candidate", approval: proposed,
      obligation: "Access to software resources must remain restricted according to approved authorization.",
      technology_independence: independence("States the required access outcome without naming an enforcement mechanism."),
      canonical_support: [support("ces.access-authorization",
        "Directly derives the enduring authorization obligation from the approved normalized meaning.")] },
    { policy_id: "policy.security-event-traceability", policy_version: "1.0.0",
      title: "Security event traceability", lifecycle: "candidate", approval: proposed,
      obligation: "Security-relevant activity must remain traceable for monitoring and investigation.",
      technology_independence: independence("Requires traceability without prescribing storage, transport, or monitoring products."),
      canonical_support: [support("ces.security-event-logging",
        "Generalizes the approved event-recording meaning into an enduring traceability obligation.")] },
    { policy_id: "policy.recoverable-trustworthy-state", policy_version: "1.0.0",
      title: "Recoverable trustworthy state", lifecycle: "candidate", approval: proposed,
      obligation: "Software and its restoration assets must support verified recovery to a known trustworthy state.",
      technology_independence: independence("Defines a recovery outcome without selecting backup or deployment technology."),
      canonical_support: [support("ces.recoverable-known-state",
        "Directly derives the recovery obligation from the approved normalized meaning.")] },
    { policy_id: "policy.transaction-integrity", policy_version: "1.0.0",
      title: "Transaction integrity", lifecycle: "candidate", approval: proposed,
      obligation: "Security-relevant business operations must complete consistently or return to their prior correct state.",
      technology_independence: independence("Defines state integrity without prescribing transaction or persistence mechanisms."),
      canonical_support: [support("ces.transaction-integrity",
        "Directly derives the complete-or-restore obligation from the approved normalized meaning.")] },
  ],
} as const;

export function buildRepresentativePolicyTaxonomy() {
  return validatePolicyTaxonomyAgainstCanonicalVocabulary(taxonomyValue,
    CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1);
}

export const CES_POLICY_REPRESENTATIVE_TAXONOMY_V1 = buildRepresentativePolicyTaxonomy();

export function resolvePolicySourceLineage(policyId: string) {
  const policy = CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies
    .find(({ policy_id }) => policy_id === policyId);
  if (!policy) throw new Error(`Unknown candidate Policy ${policyId}`);
  return policy.canonical_support.map((canonicalSupport) => ({ canonical_support: canonicalSupport,
    source_lineage: resolveCanonicalSourceLineage(canonicalSupport.canonical_concept_id) }));
}
