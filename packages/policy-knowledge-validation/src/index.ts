import { createHash } from "node:crypto";
import { CanonicalVocabularySchema } from "@company/ces-policy-canonical-vocabulary";
import { PolicyKnowledgeProposalSchema } from "@company/ces-policy-knowledge-proposals";
import { CanonicalPolicyTaxonomySchema, findProhibitedTechnologyTerms } from
  "@company/ces-policy-taxonomy";
import { z } from "zod";

export const POLICY_KNOWLEDGE_VALIDATOR_VERSION = "1.0.0" as const;
const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Revision = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const PROJECT_TERMS = ["safara", "pilgrim", "nik", "passport", "atlas"] as const;

export const GovernedPolicyValidationInputSchema = z.object({
  source_glossary_revision: Revision,
  raw_vocabulary_revision: Revision,
  raw_concepts: z.array(z.object({ concept_id: Id, source_release_id: Id }).strict()).min(1),
  canonical_vocabulary: CanonicalVocabularySchema,
  predecessor_taxonomy: CanonicalPolicyTaxonomySchema,
}).strict();

export const PolicyProposalValidationResultSchema = z.object({
  schema_version: z.literal("1.0.0"),
  validator_id: z.literal("ces.policy.knowledge.proposal.validator"),
  validator_version: z.literal(POLICY_KNOWLEDGE_VALIDATOR_VERSION),
  proposal_id: Id,
  proposal_hash: Hash,
  status: z.enum(["valid", "invalid"]),
  review_eligibility: z.enum(["reviewable_proposal", "rejected_before_review"]),
  issue_codes: z.array(z.enum([
    "CONTEXT_MISMATCH", "PREDECESSOR_MISMATCH", "CANONICAL_SUPPORT_INVALID",
    "RAW_LINEAGE_INVALID", "DECISION_INVALID", "COMPARISON_INCOMPLETE",
    "PROJECT_LEAKAGE", "TECHNOLOGY_LEAKAGE", "AUTHORITY_INVALID",
  ])),
  grants_policy_authority: z.literal(false),
  result_hash: Hash,
}).strict().superRefine((value, context) => {
  const { result_hash: resultHash, ...withoutHash } = value;
  if (stableHash(withoutHash) !== resultHash) {
    context.addIssue({ code: "custom", message: "Validation result hash does not match contents" });
  }
});

export function validatePolicyTaxonomyProposal(
  proposalValue: unknown,
  knowledgeValue: unknown,
) {
  const proposal = PolicyKnowledgeProposalSchema.parse(proposalValue);
  const knowledge = GovernedPolicyValidationInputSchema.parse(knowledgeValue);
  if (proposal.proposal.layer !== "policy_taxonomy") {
    throw new Error("Policy validator accepts only policy_taxonomy proposals");
  }
  const issues = new Set<z.infer<typeof PolicyProposalValidationResultSchema>["issue_codes"][number]>();
  const context = proposal.governed_context;
  if (context.source_glossary_revision !== knowledge.source_glossary_revision ||
      context.raw_vocabulary_revision !== knowledge.raw_vocabulary_revision ||
      context.canonical_vocabulary_revision !== knowledge.canonical_vocabulary.vocabulary_revision ||
      context.policy_taxonomy_revision !== knowledge.predecessor_taxonomy.taxonomy_revision) {
    issues.add("CONTEXT_MISMATCH");
  }
  if (context.predecessor_artifact_id !== knowledge.predecessor_taxonomy.taxonomy_id ||
      context.predecessor_artifact_hash !== stableHash(knowledge.predecessor_taxonomy)) {
    issues.add("PREDECESSOR_MISMATCH");
  }
  const canonical = new Map(knowledge.canonical_vocabulary.concepts.map((item) =>
    [item.concept_id, item]));
  const raw = new Set(knowledge.raw_concepts.map(({ concept_id, source_release_id }) =>
    `${source_release_id}:${concept_id}`));
  const decisionIds = proposal.proposal.decisions.map(({ canonical_concept_id }) =>
    canonical_concept_id);
  const supportIds = proposal.proposal.proposed_policy?.canonical_support_ids ?? [];
  for (const id of decisionIds) {
    const concept = canonical.get(id);
    if (!concept || concept.lifecycle !== "approved" || concept.semantic_kind !== "obligation") {
      issues.add("CANONICAL_SUPPORT_INVALID");
    }
    const mappings = knowledge.canonical_vocabulary.mappings.filter((mapping) =>
      mapping.canonical_concept_id === id);
    if (mappings.length === 0 || mappings.some((mapping) =>
      !raw.has(`${mapping.raw_source_release_id}:${mapping.raw_concept_id}`))) {
      issues.add("RAW_LINEAGE_INVALID");
    }
  }
  const acceptedDecisionIds = proposal.proposal.decisions
    .filter(({ decision }) => decision !== "REJECT")
    .map(({ canonical_concept_id }) => canonical_concept_id);
  const rejectedDecisionIds = proposal.proposal.decisions
    .filter(({ decision }) => decision === "REJECT")
    .map(({ canonical_concept_id }) => canonical_concept_id);
  const resultingPolicyId = proposal.proposal.proposed_policy?.policy_id;
  const decisionTargetsCoherent = proposal.proposal.decisions.every(({ decision,
    target_policy_id }) => decision === "REJECT" ? target_policy_id === null :
    target_policy_id === resultingPolicyId);
  const policyPresenceCoherent = acceptedDecisionIds.length === 0
    ? proposal.proposal.proposed_policy === null
    : proposal.proposal.proposed_policy !== null;
  if (new Set(decisionIds).size !== decisionIds.length ||
      new Set(supportIds).size !== supportIds.length ||
      acceptedDecisionIds.some((id) => !supportIds.includes(id)) ||
      supportIds.some((id) => !acceptedDecisionIds.includes(id)) ||
      rejectedDecisionIds.some((id) => supportIds.includes(id)) ||
      !decisionTargetsCoherent || !policyPresenceCoherent) {
    issues.add("DECISION_INVALID");
  }
  const targets = [...knowledge.predecessor_taxonomy.policies.map(({ policy_id }) => policy_id),
    ...decisionIds];
  const expected = decisionIds.flatMap((subject) => targets.filter((target) => target !== subject)
    .map((target) => `${subject}:${target}`));
  const actual = proposal.proposal.semantic_comparisons.map(({ subject_canonical_concept_id,
    comparison_target_id }) => `${subject_canonical_concept_id}:${comparison_target_id}`);
  if (new Set(actual).size !== actual.length || expected.length !== actual.length ||
      expected.some((key) => !actual.includes(key))) issues.add("COMPARISON_INCOMPLETE");
  const semanticText = JSON.stringify(proposal.proposal).toLowerCase();
  if (PROJECT_TERMS.some((term) => semanticText.includes(term))) issues.add("PROJECT_LEAKAGE");
  if (findProhibitedTechnologyTerms(semanticText).length > 0) issues.add("TECHNOLOGY_LEAKAGE");
  const proposedPolicy = proposal.proposal.proposed_policy;
  if (proposal.lifecycle !== "proposed" || (proposedPolicy !== null &&
      (proposedPolicy.lifecycle !== "candidate" ||
       proposedPolicy.approval_status !== "proposed"))) {
    issues.add("AUTHORITY_INVALID");
  }
  const issue_codes = [...issues].sort();
  const value = { schema_version: "1.0.0" as const,
    validator_id: "ces.policy.knowledge.proposal.validator" as const,
    validator_version: POLICY_KNOWLEDGE_VALIDATOR_VERSION,
    proposal_id: proposal.proposal_id, proposal_hash: proposal.proposal_hash,
    status: issue_codes.length === 0 ? "valid" as const : "invalid" as const,
    review_eligibility: issue_codes.length === 0 ? "reviewable_proposal" as const :
      "rejected_before_review" as const, issue_codes, grants_policy_authority: false as const };
  return PolicyProposalValidationResultSchema.parse({ ...value, result_hash: stableHash(value) });
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
