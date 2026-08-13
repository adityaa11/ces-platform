import { createHash } from "node:crypto";
import { z } from "zod";
import { CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1,
  CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1,
  CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2 } from "./representative-taxonomy.js";

const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const Evidence = z.object({ publication_id: z.string().min(1), evidence_id: z.string().min(1), evidence_path: z.string().min(1),
  terminal_outcome: z.literal("ACCEPTED"), reviewed_commit: z.string().regex(/^[0-9a-f]{40}$/u),
  artifact_hash: Hash, publication_content_hash: Hash, evidence_content_hash: Hash }).strict();
const COVERAGE_V4_RESULT_HASH = "3e0e7253279437cd5c76780d11acccacd81290d80b74c7e135bc3cdb7591b3a3";
const COVERAGE_ACCEPTANCE_PUBLICATION = { publication_id: "ces-policies.safara-bootstrap.coverage-v4.accepted-v1",
  publication_status: "accepted", artifact_result_hash: COVERAGE_V4_RESULT_HASH,
  terminal_outcome: "ACCEPTED", reviewed_implementation_commit: "16d83db1657f40450f704881d1c2e5d11e558dc3",
  reviewed_closure_commit: "94b50d84fb2fa693d1dc78d58353ea0585755626",
  reviewer_evidence_id: "CES-GF-POL-008-V01-H01", final_pol_008_approval: false } as const;
const COVERAGE_V4_EVIDENCE = { publication_id: "ces-policies.safara-bootstrap.coverage-v4.accepted-v1",
  evidence_id: "CES-GF-POL-008-V01-H01",
  evidence_path: "project's goal/feedback/CES_POLICIES_REVIEW_94b50d8.md",
  terminal_outcome: "ACCEPTED", reviewed_commit: "94b50d84fb2fa693d1dc78d58353ea0585755626",
  artifact_hash: COVERAGE_V4_RESULT_HASH,
  publication_content_hash: hash(COVERAGE_ACCEPTANCE_PUBLICATION),
  evidence_content_hash: "81ad082f2c63a47d900e49e29b54528434214153aa0c5dcc04338d99415dd53f" } as const;
const AGB_014_EVIDENCE = { publication_id: "ces-agents-bridge.agb-014.accepted-v1",
  evidence_id: "CES-GF-AGB-014-H01",
  evidence_path: "project's goal/feedback/CES_AGENTS_BRIDGE_FINAL_CLOSURE_REVIEW_d19166f.md",
  terminal_outcome: "ACCEPTED", reviewed_commit: "d19166fcf718bb9d16c15e975f4367c60db344b3",
  artifact_hash: "6aaa37d5708972dd0e59bc17b1f7f53dba52fdd7b37169ac5859c248b244c9c8",
  publication_content_hash: hash({ publication_id: "ces-agents-bridge.agb-014.accepted-v1",
    publication_status: "accepted", terminal_outcome: "ACCEPTED",
    reviewed_commit: "d19166fcf718bb9d16c15e975f4367c60db344b3",
    reviewer_evidence_id: "CES-GF-AGB-014-H01", final_pol_008_approval: false }),
  evidence_content_hash: "6aaa37d5708972dd0e59bc17b1f7f53dba52fdd7b37169ac5859c248b244c9c8" } as const;
export const CES_POLICY_FINAL_GATE_EVIDENCE_REGISTRY = {
  [COVERAGE_V4_EVIDENCE.evidence_path]: COVERAGE_V4_EVIDENCE.evidence_content_hash,
  [AGB_014_EVIDENCE.evidence_path]: AGB_014_EVIDENCE.evidence_content_hash,
} as const;

export const FinalPolicyTaxonomyApprovalCandidateSchema = z.object({
  schema_version: z.literal("1.0.0"), candidate_id: z.literal("ces-policy-taxonomy.final-approval-candidate-v1"),
  lifecycle: z.literal("candidate"), authority_status: z.literal("not_approved"),
  taxonomy_revision: z.literal("1.2.0"), canonical_vocabulary_revision: z.literal("1.5.0"),
  proposed_successor_revision: z.literal("1.3.0"), policy_count: z.literal(6),
  taxonomy: z.custom<typeof CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy>(),
  bounded_decision_publications: z.tuple([z.custom<typeof CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1>(),
    z.custom<typeof CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1>()]),
  gate_evidence: z.object({ coverage_v4: Evidence, agents_bridge_replay: Evidence }).strict(),
  downstream_authority: z.object({ final_pol_008_approval: z.literal(false),
    pol_009_authorized: z.literal(false) }).strict(), candidate_hash: Hash,
}).strict().superRefine((value, context) => {
  const { candidate_hash: candidateHash, ...withoutHash } = value;
  if (hash(withoutHash) !== candidateHash) issue(context, "Candidate hash does not match contents");
  if (JSON.stringify(value.taxonomy) !== JSON.stringify(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy))
    issue(context, "Candidate must preserve taxonomy 1.2.0 exactly");
  if (JSON.stringify(value.bounded_decision_publications) !== JSON.stringify([
    CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1, CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1]))
    issue(context, "Candidate must preserve accepted bounded decisions");
  if (value.taxonomy.lifecycle !== "candidate" || value.taxonomy.policies.some(
    ({ lifecycle, approval }) => lifecycle !== "candidate" || approval.status !== "proposed"))
    issue(context, "Final approval candidate cannot invent Policy authority");
  if (JSON.stringify(value.gate_evidence.coverage_v4) !== JSON.stringify(COVERAGE_V4_EVIDENCE) ||
      JSON.stringify(value.gate_evidence.agents_bridge_replay) !== JSON.stringify(AGB_014_EVIDENCE) ||
      !resolvesEvidence(value.gate_evidence.coverage_v4) ||
      !resolvesEvidence(value.gate_evidence.agents_bridge_replay))
    issue(context, "Final approval candidate requires exact accepted gate evidence");
});

export const FinalPolicyTaxonomyReviewHandoffSchema = z.object({
  schema_version: z.literal("1.0.0"), review_class: z.literal("REVIEW_GATE"),
  ticket_id: z.literal("CES-GF-POL-008"), candidate_id: z.literal("ces-policy-taxonomy.final-approval-candidate-v1"),
  candidate_hash: Hash, allowed_terminal_outcomes: z.tuple([z.literal("ACCEPTED"),
    z.literal("NOT ACCEPTED"), z.literal("ACCEPTED WITH DEFERRED ITEMS")]),
  review_questions: z.tuple([z.literal("Do the six obligations remain broad, enduring, and technology-independent?"),
    z.literal("Do the sequential-flow and sensitive-data consolidation boundaries preserve the accepted meanings?"),
    z.literal("Does the exact lineage and accepted gate evidence justify final POL-008 authority?")]),
  authority: z.object({ publishes_successor: z.literal(false), final_pol_008_approval: z.literal(false),
    pol_009_authorized: z.literal(false), requires_separate_closure_commit: z.literal(true) }).strict(),
  handoff_hash: Hash,
}).strict().superRefine((value, context) => { const { handoff_hash, ...body } = value;
  if (hash(body) !== handoff_hash) issue(context, "Review handoff hash does not match contents"); });

export function createFinalPolicyTaxonomyApprovalCandidate(input: { coverage_v4: z.input<typeof Evidence>;
  agents_bridge_replay?: z.input<typeof Evidence> }) {
  const body = { schema_version: "1.0.0", candidate_id: "ces-policy-taxonomy.final-approval-candidate-v1",
    lifecycle: "candidate", authority_status: "not_approved", taxonomy_revision: "1.2.0",
    canonical_vocabulary_revision: "1.5.0", proposed_successor_revision: "1.3.0", policy_count: 6,
    taxonomy: CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy,
    bounded_decision_publications: [CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1,
      CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1], gate_evidence: { coverage_v4: input.coverage_v4,
      agents_bridge_replay: input.agents_bridge_replay ?? AGB_014_EVIDENCE },
    downstream_authority: { final_pol_008_approval: false, pol_009_authorized: false } } as const;
  return FinalPolicyTaxonomyApprovalCandidateSchema.parse({ ...body, candidate_hash: hash(body) });
}

export function createFinalPolicyTaxonomyReviewHandoff(candidate: z.infer<
  typeof FinalPolicyTaxonomyApprovalCandidateSchema>) {
  const checked = FinalPolicyTaxonomyApprovalCandidateSchema.parse(candidate);
  const body = { schema_version: "1.0.0", review_class: "REVIEW_GATE", ticket_id: "CES-GF-POL-008",
    candidate_id: checked.candidate_id, candidate_hash: checked.candidate_hash,
    allowed_terminal_outcomes: ["ACCEPTED", "NOT ACCEPTED", "ACCEPTED WITH DEFERRED ITEMS"],
    review_questions: ["Do the six obligations remain broad, enduring, and technology-independent?",
      "Do the sequential-flow and sensitive-data consolidation boundaries preserve the accepted meanings?",
      "Does the exact lineage and accepted gate evidence justify final POL-008 authority?"],
    authority: { publishes_successor: false, final_pol_008_approval: false,
      pol_009_authorized: false, requires_separate_closure_commit: true } } as const;
  return FinalPolicyTaxonomyReviewHandoffSchema.parse({ ...body, handoff_hash: hash(body) });
}

export const CES_POLICY_FINAL_APPROVAL_CANDIDATE_V1 = createFinalPolicyTaxonomyApprovalCandidate({
  coverage_v4: COVERAGE_V4_EVIDENCE,
});
export const CES_POLICY_FINAL_APPROVAL_REVIEW_HANDOFF_V1 =
  createFinalPolicyTaxonomyReviewHandoff(CES_POLICY_FINAL_APPROVAL_CANDIDATE_V1);

function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function issue(context: z.RefinementCtx, message: string) { context.addIssue({ code: "custom", message }); }
function resolvesEvidence(evidence: z.infer<typeof Evidence>) {
  return CES_POLICY_FINAL_GATE_EVIDENCE_REGISTRY[evidence.evidence_path as
    keyof typeof CES_POLICY_FINAL_GATE_EVIDENCE_REGISTRY] === evidence.evidence_content_hash;
}
