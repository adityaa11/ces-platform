import { describe, expect, it } from "vitest";
import { createFinalPolicyTaxonomyApprovalCandidate,
  CES_POLICY_FINAL_APPROVAL_CANDIDATE_V1, CES_POLICY_FINAL_APPROVAL_REVIEW_HANDOFF_V1,
  FinalPolicyTaxonomyApprovalCandidateSchema, FinalPolicyTaxonomyReviewHandoffSchema } from "./final-approval.js";

const coverage = { evidence_id: "CES-GF-POL-008-V01-H01",
  evidence_path: "project's goal/feedback/CES_POLICIES_REVIEW_94b50d8.md", terminal_outcome: "ACCEPTED" as const,
  reviewed_commit: "94b50d84fb2fa693d1dc78d58353ea0585755626",
  artifact_hash: "3e0e7253279437cd5c76780d11acccacd81290d80b74c7e135bc3cdb7591b3a3" };
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("POL-008 final approval gate candidate", () => {
  it("binds the exact six-Policy candidate and remains non-authoritative", () => {
    const candidate = CES_POLICY_FINAL_APPROVAL_CANDIDATE_V1;
    expect(candidate.taxonomy.policies).toHaveLength(6);
    expect(candidate.taxonomy_revision).toBe("1.2.0");
    expect(candidate.proposed_successor_revision).toBe("1.3.0");
    expect(candidate.taxonomy.policies.every(({ lifecycle, approval }) =>
      lifecycle === "candidate" && approval.status === "proposed")).toBe(true);
    expect(candidate.downstream_authority).toEqual({ final_pol_008_approval: false, pol_009_authorized: false });
  });
  it("fails closed on semantic, evidence, or authority mutation", () => {
    const semantic: any = clone(createFinalPolicyTaxonomyApprovalCandidate({ coverage_v4: coverage }));
    semantic.taxonomy.policies[0].obligation = "Changed";
    expect(() => FinalPolicyTaxonomyApprovalCandidateSchema.parse(semantic)).toThrow();
    const evidence: any = clone(createFinalPolicyTaxonomyApprovalCandidate({ coverage_v4: coverage }));
    evidence.gate_evidence.coverage_v4.artifact_hash = "a".repeat(64);
    expect(() => FinalPolicyTaxonomyApprovalCandidateSchema.parse(evidence)).toThrow();
    const authority: any = clone(createFinalPolicyTaxonomyApprovalCandidate({ coverage_v4: coverage }));
    authority.downstream_authority.pol_009_authorized = true;
    expect(() => FinalPolicyTaxonomyApprovalCandidateSchema.parse(authority)).toThrow();
  });
  it("creates a content-addressed human handoff without publishing authority", () => {
    const handoff = CES_POLICY_FINAL_APPROVAL_REVIEW_HANDOFF_V1;
    expect(handoff.allowed_terminal_outcomes).toEqual(["ACCEPTED", "NOT ACCEPTED",
      "ACCEPTED WITH DEFERRED ITEMS"]);
    expect(handoff.authority).toEqual({ publishes_successor: false, final_pol_008_approval: false,
      pol_009_authorized: false, requires_separate_closure_commit: true });
    const changed: any = clone(handoff); changed.review_questions[0] = "Approve everything?";
    expect(() => FinalPolicyTaxonomyReviewHandoffSchema.parse(changed)).toThrow(/hash/u);
  });
});
