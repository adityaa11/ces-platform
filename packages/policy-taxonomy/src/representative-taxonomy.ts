import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
  CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5,
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

export const AcceptedSequentialFlowDecisionPublicationSchema = z.object({
  publication_id: z.literal("ces-policy-taxonomy.sequential-flow-decision.accepted-v1"),
  publication_status: z.literal("accepted"),
  artifact: SequentialFlowTaxonomyArtifactSchema,
  approval: z.object({
    terminal_outcome: z.literal("ACCEPTED"),
    reviewed_implementation_commit: z.literal(
      "8ab40952ca9bb980fab1388d9ecc5037ca0ab5d7"),
    reviewed_closure_commit: z.literal(
      "21ee03cebc394c726028c83767d04029b51e5fc9"),
    reviewer_evidence_id: z.literal("CES-GF-POL-008-R01-H01"),
    evidence_type: z.literal("project_owner_confirmation"),
    recorded_on: z.literal("2026-08-12"),
    approved_scope: z.literal("POL-008-R01 bounded add decision"),
    final_pol_008_approval: z.literal(false),
  }).strict(),
}).strict().superRefine((publication, context) => {
  if (JSON.stringify(publication.artifact) !==
      JSON.stringify(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1)) {
    context.addIssue({ code: "custom",
      message: "Accepted decision publication must preserve the reviewed candidate artifact" });
  }
  if (publication.artifact.taxonomy.lifecycle !== "candidate" ||
      publication.artifact.taxonomy.policies.some(({ lifecycle, approval }) =>
        lifecycle !== "candidate" || approval.status !== "proposed") ||
      publication.artifact.decision.status !== "proposed") {
    context.addIssue({ code: "custom",
      message: "POL-008-R01 publication cannot claim final POL-008 authority" });
  }
});

const acceptedSequentialFlowDecisionValue = {
  publication_id: "ces-policy-taxonomy.sequential-flow-decision.accepted-v1",
  publication_status: "accepted",
  artifact: CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1,
  approval: { terminal_outcome: "ACCEPTED",
    reviewed_implementation_commit: "8ab40952ca9bb980fab1388d9ecc5037ca0ab5d7",
    reviewed_closure_commit: "21ee03cebc394c726028c83767d04029b51e5fc9",
    reviewer_evidence_id: "CES-GF-POL-008-R01-H01",
    evidence_type: "project_owner_confirmation", recorded_on: "2026-08-12",
    approved_scope: "POL-008-R01 bounded add decision",
    final_pol_008_approval: false },
} as const;

export function publishAcceptedSequentialFlowDecision(
  value: unknown = acceptedSequentialFlowDecisionValue,
) {
  return AcceptedSequentialFlowDecisionPublicationSchema.parse(value);
}

export const CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1 =
  publishAcceptedSequentialFlowDecision();

const SENSITIVE_DATA_PROTECTION_POLICY = {
  policy_id: "policy.sensitive-data-protection", policy_version: "1.0.0",
  title: "Sensitive-data protection", lifecycle: "candidate", approval: proposed,
  obligation: "Sensitive data must be identified and classified into appropriate protection levels; its disclosure must be limited to what functionality requires, and complete values must remain concealed unless specifically viewed.",
  technology_independence: independence("Defines classification and disclosure outcomes without prescribing inventories, classification schemes, storage, interface components, or masking mechanisms."),
  canonical_support: [
    support("ces.sensitive-data-classification",
      "Supplies the enduring obligation to identify sensitive data and classify it into protection levels that account for applicable requirements."),
    support("ces.sensitive-data-disclosure-minimization",
      "Supplies the distinct enduring obligation to minimize sensitive-data disclosure and conceal complete values unless specifically viewed."),
  ],
} as const;

const DataProtectionPolicyDecisionSchema = z.object({
  decision_id: z.string().min(1), decision: z.enum(["add", "merge", "reject"]),
  status: z.literal("proposed"),
  canonical_concept_id: z.enum(["ces.sensitive-data-classification",
    "ces.sensitive-data-disclosure-minimization"]),
  policy_id: z.literal("policy.sensitive-data-protection"), rationale: z.string().min(1),
  proposed_at: z.literal("2026-08-12T12:00:00+00:00"), reviewed_at: z.null(),
  reviewer_evidence_id: z.null(),
}).strict();

const DATA_PROTECTION_POLICY_DECISIONS = [
  { decision_id: "decision.pol-008-r02.add.sensitive-data-classification",
    decision: "add", status: "proposed",
    canonical_concept_id: "ces.sensitive-data-classification",
    policy_id: "policy.sensitive-data-protection",
    rationale: "Add one broad sensitive-data protection Policy grounded in approved ces.sensitive-data-classification and raw ASVS identity owasp.asvs.5-0-0/raw.asvs.v14-1-1 at v5.0.0-V14.1.1. No existing candidate Policy governs identification and protection-level classification.",
    proposed_at: "2026-08-12T12:00:00+00:00", reviewed_at: null,
    reviewer_evidence_id: null },
  { decision_id: "decision.pol-008-r02.merge.sensitive-data-disclosure-minimization",
    decision: "merge", status: "proposed",
    canonical_concept_id: "ces.sensitive-data-disclosure-minimization",
    policy_id: "policy.sensitive-data-protection",
    rationale: "Merge support from approved ces.sensitive-data-disclosure-minimization and raw ASVS identity owasp.asvs.5-0-0/raw.asvs.v14-2-6 at v5.0.0-V14.2.6 into the new broad Policy. The combined obligation preserves minimum disclosure and conditional concealment as a distinct clause while avoiding a one-concept-per-Policy taxonomy.",
    proposed_at: "2026-08-12T12:00:00+00:00", reviewed_at: null,
    reviewer_evidence_id: null },
] as const;

const DataProtectionTaxonomyArtifactSchema = z.object({
  taxonomy: z.custom<ReturnType<typeof validatePolicyTaxonomyAgainstCanonicalVocabulary>>(),
  decisions: z.array(DataProtectionPolicyDecisionSchema).length(2),
}).strict();

function buildDataProtectionTaxonomyValue() {
  const predecessor = CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy;
  return { ...predecessor, taxonomy_revision: "1.2.0",
    predecessor_revision: predecessor.taxonomy_revision,
    canonical_vocabulary_revision: "1.5.0",
    policies: [...predecessor.policies, SENSITIVE_DATA_PROTECTION_POLICY] } as const;
}

export function buildDataProtectionPolicySuccessor(
  value: unknown = { taxonomy: buildDataProtectionTaxonomyValue(),
    decisions: DATA_PROTECTION_POLICY_DECISIONS },
) {
  const parsed = DataProtectionTaxonomyArtifactSchema.parse(value);
  const taxonomy = validatePolicyTaxonomyAgainstCanonicalVocabulary(parsed.taxonomy,
    CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5);
  const predecessor = CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy;
  if (taxonomy.taxonomy_id !== predecessor.taxonomy_id ||
      taxonomy.taxonomy_revision === predecessor.taxonomy_revision) {
    throw new Error("POL-008-R02 successor requires preserved identity and a distinct revision");
  }
  if (taxonomy.predecessor_revision !== predecessor.taxonomy_revision) {
    throw new Error("POL-008-R02 successor must link to the exact predecessor revision");
  }
  if (JSON.stringify(taxonomy.policies.slice(0, predecessor.policies.length)) !==
      JSON.stringify(predecessor.policies)) {
    throw new Error("POL-008-R02 successor must preserve every predecessor Policy and approval");
  }
  if (taxonomy.policies.length !== predecessor.policies.length + 1) {
    throw new Error("POL-008-R02 successor may add only its bounded consolidated Policy");
  }
  const expectedTaxonomy = validatePolicyTaxonomyAgainstCanonicalVocabulary(
    buildDataProtectionTaxonomyValue(),
    CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5);
  const expectedDecisions = DATA_PROTECTION_POLICY_DECISIONS.map((decision) =>
    DataProtectionPolicyDecisionSchema.parse(decision));
  if (JSON.stringify(taxonomy.policies.at(-1)) !==
      JSON.stringify(expectedTaxonomy.policies.at(-1)) ||
      JSON.stringify(parsed.decisions) !== JSON.stringify(expectedDecisions)) {
    throw new Error("POL-008-R02 successor contains altered or unsupported Policy meaning");
  }
  if (new Set(parsed.decisions.map(({ canonical_concept_id }) => canonical_concept_id)).size !== 2 ||
      !parsed.decisions.some(({ decision }) => decision === "add") ||
      !parsed.decisions.some(({ decision }) => decision === "merge")) {
    throw new Error("POL-008-R02 requires explicit independent treatment of both obligations");
  }
  const bounded = JSON.stringify({ policy: taxonomy.policies.at(-1),
    decisions: parsed.decisions }).toLowerCase();
  if (["safara", "pilgrim", "nik", "passport", "payment", "health document", "package",
    "manifest", "framework", "database", "ui component", "atlas"].some((term) =>
    bounded.includes(term))) {
    throw new Error("POL-008-R02 Policy meaning must remain reusable and technology-independent");
  }
  return { taxonomy, decisions: parsed.decisions } as const;
}

export const CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2 =
  buildDataProtectionPolicySuccessor();

export function resolveDataProtectionPolicySourceLineage() {
  return CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy.policies
    .find(({ policy_id }) => policy_id === "policy.sensitive-data-protection")!
    .canonical_support.map((canonicalSupport) => ({ canonical_support: canonicalSupport,
      source_lineage: resolveCanonicalSourceLineage(canonicalSupport.canonical_concept_id) }));
}
