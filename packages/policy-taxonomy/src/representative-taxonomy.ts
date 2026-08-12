import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
  resolveCanonicalSourceLineage } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { z } from "zod";
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

const SEQUENTIAL_FLOW_POLICY = {
  policy_id: "policy.sequential-business-flow", policy_version: "1.0.0",
  title: "Sequential business-flow integrity", lifecycle: "candidate",
  approval: proposed,
  obligation: "Security-relevant business flows must proceed in their required sequential step order without skipped steps.",
  technology_independence: independence("Defines the required ordering outcome without prescribing workflow, orchestration, state, or execution mechanisms."),
  canonical_support: [support("ces.sequential-business-flow",
    "Directly derives the non-skipped sequential-flow obligation from the approved normalized meaning.")],
} as const;

const SequentialFlowPolicyDecisionSchema = z.object({
  decision_id: z.literal("decision.pol-008-r01.add.sequential-business-flow"),
  decision: z.literal("add"),
  status: z.literal("proposed"),
  canonical_concept_id: z.literal("ces.sequential-business-flow"),
  policy_id: z.literal("policy.sequential-business-flow"),
  comparison_policy_id: z.literal("policy.transaction-integrity"),
  rationale: z.string().min(1),
  proposed_at: z.literal("2026-08-12T11:00:00+00:00"),
  reviewed_at: z.null(),
  reviewer_evidence_id: z.null(),
}).strict();

const SEQUENTIAL_FLOW_POLICY_DECISION = {
  decision_id: "decision.pol-008-r01.add.sequential-business-flow",
  decision: "add", status: "proposed",
  canonical_concept_id: "ces.sequential-business-flow",
  policy_id: "policy.sequential-business-flow",
  comparison_policy_id: "policy.transaction-integrity",
  rationale: "Add a distinct candidate Policy because required sequential step order prevents skipped or reordered flow stages, while policy.transaction-integrity governs complete-or-restore atomicity. Merging would erase these independently actionable obligations.",
  proposed_at: "2026-08-12T11:00:00+00:00", reviewed_at: null,
  reviewer_evidence_id: null,
} as const;

const SequentialFlowTaxonomyArtifactSchema = z.object({
  taxonomy: z.custom<ReturnType<typeof validatePolicyTaxonomyAgainstCanonicalVocabulary>>(),
  decision: SequentialFlowPolicyDecisionSchema,
}).strict();

function buildSequentialFlowTaxonomyValue() {
  const predecessor = CES_POLICY_REPRESENTATIVE_TAXONOMY_V1;
  return { ...predecessor, taxonomy_revision: "1.1.0",
    predecessor_revision: predecessor.taxonomy_revision,
    canonical_vocabulary_revision: "1.3.0",
    policies: [...predecessor.policies, SEQUENTIAL_FLOW_POLICY] } as const;
}

export function buildSequentialBusinessFlowPolicySuccessor(
  value: unknown = { taxonomy: buildSequentialFlowTaxonomyValue(),
    decision: SEQUENTIAL_FLOW_POLICY_DECISION },
) {
  const parsed = SequentialFlowTaxonomyArtifactSchema.parse(value);
  const taxonomy = validatePolicyTaxonomyAgainstCanonicalVocabulary(parsed.taxonomy,
    CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3);
  const predecessor = CES_POLICY_REPRESENTATIVE_TAXONOMY_V1;
  if (taxonomy.taxonomy_id !== predecessor.taxonomy_id ||
      taxonomy.taxonomy_revision === predecessor.taxonomy_revision) {
    throw new Error("POL-008-R01 successor requires preserved identity and a distinct revision");
  }
  if (taxonomy.predecessor_revision !== predecessor.taxonomy_revision) {
    throw new Error("POL-008-R01 successor must link to the exact predecessor revision");
  }
  if (JSON.stringify(taxonomy.policies.slice(0, predecessor.policies.length)) !==
      JSON.stringify(predecessor.policies)) {
    throw new Error("POL-008-R01 successor must preserve every predecessor Policy and approval");
  }
  if (taxonomy.policies.length !== predecessor.policies.length + 1) {
    throw new Error("POL-008-R01 successor may add only its bounded Policy decision");
  }
  const expected = validatePolicyTaxonomyAgainstCanonicalVocabulary(
    buildSequentialFlowTaxonomyValue(),
    CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3);
  if (JSON.stringify(taxonomy.policies.at(-1)) !== JSON.stringify(expected.policies.at(-1)) ||
      JSON.stringify(parsed.decision) !== JSON.stringify(
        SequentialFlowPolicyDecisionSchema.parse(SEQUENTIAL_FLOW_POLICY_DECISION))) {
    throw new Error("POL-008-R01 successor contains altered or unsupported Policy meaning");
  }
  const bounded = JSON.stringify({ policy: taxonomy.policies.at(-1),
    decision: parsed.decision }).toLowerCase();
  if (["safara", "package", "pilgrim", "manifest", "workflow-engine", "state-machine",
    "framework", "atlas"].some((term) => bounded.includes(term))) {
    throw new Error("POL-008-R01 Policy meaning must remain reusable and technology-independent");
  }
  return { taxonomy, decision: parsed.decision } as const;
}

export const CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1 =
  buildSequentialBusinessFlowPolicySuccessor();

export function resolveSequentialFlowPolicySourceLineage() {
  return CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1.taxonomy.policies
    .find(({ policy_id }) => policy_id === "policy.sequential-business-flow")!
    .canonical_support.map((canonicalSupport) => ({ canonical_support: canonicalSupport,
      source_lineage: resolveCanonicalSourceLineage(canonicalSupport.canonical_concept_id) }));
}
