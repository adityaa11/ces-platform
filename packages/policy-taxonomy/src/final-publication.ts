import { createHash } from "node:crypto";
import { z } from "zod";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { validatePolicyTaxonomyAgainstCanonicalVocabulary } from "./index.js";
import { CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2 } from "./representative-taxonomy.js";

const REVIEWED_COMMIT = "692d37cc96cc8bccb212b7430308fe133f37ccbd";
const REVIEW_PATH = "project's goal/feedback/CES_POL_008_FINAL_GATE_CLOSURE_REVIEW_692d37c.md";
const REVIEW_HASH = "7c151d7579c88a3fab5d2d5800307e1fc38bf7e3202318b7deb774629a81232b";
const REVIEWED_AT = "2026-08-13T17:40:00+07:00";
const approval = { status: "approved" as const, reviewed_at: REVIEWED_AT,
  reviewer_evidence_id: "CES-GF-POL-008-H01" };

function approvedTaxonomyValue() {
  const predecessor = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy;
  return { ...predecessor, taxonomy_revision: "1.3.0", predecessor_revision: "1.2.0",
    lifecycle: "approved", policies: predecessor.policies.map((policy) => ({ ...policy,
      lifecycle: "approved" as const, approval })) };
}

export const FinalPolicyTaxonomyPublicationSchema = z.object({
  schema_version: z.literal("1.0.0"), publication_id: z.literal(
    "ces-policy-taxonomy.final-pol-008.accepted-v1"), publication_status: z.literal("accepted"),
  artifact: z.custom<ReturnType<typeof validatePolicyTaxonomyAgainstCanonicalVocabulary>>(),
  authority: z.object({ terminal_outcome: z.literal("ACCEPTED"), review_class: z.literal("REVIEW_GATE"),
    reviewed_candidate_commit: z.literal(REVIEWED_COMMIT), reviewer_evidence_id: z.literal("CES-GF-POL-008-H01"),
    reviewer_evidence_path: z.literal(REVIEW_PATH), reviewer_evidence_sha256: z.literal(REVIEW_HASH),
    final_pol_008_approval: z.literal(true), pol_009_authorized: z.literal(true) }).strict(),
  publication_hash: z.string().regex(/^[0-9a-f]{64}$/u),
}).strict().superRefine((value, context) => {
  const { publication_hash: publicationHash, ...body } = value;
  if (hash(body) !== publicationHash) context.addIssue({ code: "custom",
    message: "Final POL-008 publication hash does not match contents" });
  const predecessor = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy;
  if (value.artifact.taxonomy_revision !== "1.3.0" || value.artifact.predecessor_revision !== "1.2.0" ||
      value.artifact.lifecycle !== "approved" || value.artifact.policies.some(({ lifecycle, approval: policyApproval }) =>
        lifecycle !== "approved" || policyApproval.status !== "approved" ||
        policyApproval.reviewer_evidence_id !== "CES-GF-POL-008-H01")) context.addIssue({
    code: "custom", message: "Final POL-008 successor requires exact approved lifecycle and provenance" });
  if (JSON.stringify(semanticProjection(value.artifact)) !== JSON.stringify(semanticProjection(predecessor)))
    context.addIssue({ code: "custom", message: "Final POL-008 successor must preserve candidate semantics exactly" });
});

export function publishFinalPolicyTaxonomy(value: unknown = buildPublication()) {
  return FinalPolicyTaxonomyPublicationSchema.parse(value);
}
function buildPublication() {
  const artifact = validatePolicyTaxonomyAgainstCanonicalVocabulary(approvedTaxonomyValue(),
    CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5);
  const body = { schema_version: "1.0.0", publication_id: "ces-policy-taxonomy.final-pol-008.accepted-v1",
    publication_status: "accepted", artifact, authority: { terminal_outcome: "ACCEPTED",
      review_class: "REVIEW_GATE", reviewed_candidate_commit: REVIEWED_COMMIT,
      reviewer_evidence_id: "CES-GF-POL-008-H01", reviewer_evidence_path: REVIEW_PATH,
      reviewer_evidence_sha256: REVIEW_HASH, final_pol_008_approval: true, pol_009_authorized: true } } as const;
  return { ...body, publication_hash: hash(body) };
}
function semanticProjection(taxonomy: any) { return { taxonomy_id: taxonomy.taxonomy_id,
  canonical_vocabulary_id: taxonomy.canonical_vocabulary_id,
  canonical_vocabulary_revision: taxonomy.canonical_vocabulary_revision,
  policies: taxonomy.policies.map(({ lifecycle: _lifecycle, approval: _approval, ...policy }: any) => policy) }; }
function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

export const CES_POLICY_APPROVED_TAXONOMY_V1_3 = publishFinalPolicyTaxonomy();
