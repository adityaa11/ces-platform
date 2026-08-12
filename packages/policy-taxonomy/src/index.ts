import { z } from "zod";

export const POLICY_TAXONOMY_SCHEMA_VERSION = "1.0.0" as const;

const IdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const RevisionSchema = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const NonEmptyStringSchema = z.string().trim().min(1);
const PROHIBITED_TECHNOLOGY_TERMS = [
  "angular", "docker", "django", "express", "http", "jwt", "kafka",
  "kubernetes", "laravel", "mongodb", "mysql", "oauth", "postgresql",
  "rabbitmq", "react", "redis", "sql", "vue",
] as const;

export function findProhibitedTechnologyTerms(value: string): string[] {
  const normalized = value.toLowerCase();
  return PROHIBITED_TECHNOLOGY_TERMS.filter((term) =>
    new RegExp(`(?:^|[^a-z0-9])${term}(?:$|[^a-z0-9])`, "u").test(normalized));
}

export const CanonicalPolicyCandidateSchema = z.object({
  policy_id: IdSchema,
  policy_version: RevisionSchema,
  title: NonEmptyStringSchema,
  obligation: NonEmptyStringSchema,
  lifecycle: z.enum(["candidate", "approved", "retired"]),
  technology_independence: z.object({
    what_not_how: z.literal(true),
    prohibited_term_matches: z.array(z.string()).length(0),
    rationale: NonEmptyStringSchema,
  }).strict(),
  canonical_support: z.array(z.object({
    canonical_concept_id: IdSchema,
    rationale: NonEmptyStringSchema,
  }).strict()).min(1),
  approval: z.object({
    status: z.enum(["proposed", "approved", "rejected"]),
    reviewed_at: z.iso.datetime({ offset: true }).nullable(),
    reviewer_evidence_id: NonEmptyStringSchema.nullable(),
  }).strict(),
}).strict().superRefine((policy, context) => {
  const detected = findProhibitedTechnologyTerms(`${policy.title} ${policy.obligation}`);
  if (detected.length > 0) {
    context.addIssue({ code: "custom",
      message: `Policy contains prohibited technology terms: ${detected.join(", ")}` });
  }
  const reviewed = policy.approval.reviewed_at !== null &&
    policy.approval.reviewer_evidence_id !== null;
  if (policy.approval.status === "proposed" &&
      (policy.approval.reviewed_at !== null || policy.approval.reviewer_evidence_id !== null)) {
    context.addIssue({ code: "custom", message: "Proposed Policies cannot claim review evidence" });
  }
  if (policy.approval.status !== "proposed" && !reviewed) {
    context.addIssue({ code: "custom", message: "Reviewed Policies require human review evidence" });
  }
  if (policy.lifecycle === "approved" && policy.approval.status !== "approved") {
    context.addIssue({ code: "custom", message: "Approved Policy lifecycle requires approval" });
  }
});

export const CanonicalPolicyTaxonomySchema = z.object({
  schema_version: z.literal(POLICY_TAXONOMY_SCHEMA_VERSION),
  taxonomy_id: IdSchema,
  taxonomy_revision: RevisionSchema,
  predecessor_revision: RevisionSchema.nullable(),
  canonical_vocabulary_id: IdSchema,
  canonical_vocabulary_revision: RevisionSchema,
  lifecycle: z.enum(["candidate", "approved", "retired"]),
  policies: z.array(CanonicalPolicyCandidateSchema).min(1),
}).strict().superRefine((taxonomy, context) => {
  const ids = taxonomy.policies.map(({ policy_id }) => policy_id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", message: "Canonical Policy IDs must be unique" });
  }
  if (taxonomy.lifecycle === "approved" &&
      taxonomy.policies.some(({ lifecycle }) => lifecycle !== "approved")) {
    context.addIssue({ code: "custom", message: "Approved taxonomy requires approved Policies" });
  }
});

export function validatePolicyTaxonomyAgainstCanonicalVocabulary(
  taxonomyValue: unknown,
  vocabularyValue: unknown,
) {
  const taxonomy = CanonicalPolicyTaxonomySchema.parse(taxonomyValue);
  const vocabulary = z.object({ vocabulary_id: IdSchema, vocabulary_revision: RevisionSchema,
    vocabulary_status: z.literal("approved"), concepts: z.array(z.object({
      concept_id: IdSchema, semantic_kind: z.string(), lifecycle: z.string(),
    }).passthrough()) }).passthrough().parse(vocabularyValue);
  if (taxonomy.canonical_vocabulary_id !== vocabulary.vocabulary_id ||
      taxonomy.canonical_vocabulary_revision !== vocabulary.vocabulary_revision) {
    throw new Error("Policy taxonomy must pin the exact approved canonical vocabulary revision");
  }
  const concepts = new Map(vocabulary.concepts.map((concept) => [concept.concept_id, concept]));
  for (const policy of taxonomy.policies) for (const support of policy.canonical_support) {
    const concept = concepts.get(support.canonical_concept_id);
    if (!concept || concept.lifecycle !== "approved" || concept.semantic_kind !== "obligation") {
      throw new Error(`Policy support ${support.canonical_concept_id} is not an approved obligation`);
    }
  }
  return taxonomy;
}

export type CanonicalPolicyCandidate = z.infer<typeof CanonicalPolicyCandidateSchema>;
export type CanonicalPolicyTaxonomy = z.infer<typeof CanonicalPolicyTaxonomySchema>;
