import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { createFinalPolicyTaxonomyApprovalCandidate,
  CES_POLICY_FINAL_APPROVAL_CANDIDATE_V1, CES_POLICY_FINAL_APPROVAL_REVIEW_HANDOFF_V1,
  FinalPolicyTaxonomyApprovalCandidateSchema, FinalPolicyTaxonomyReviewHandoffSchema } from "./final-approval.js";

const coverage = { publication_id: "ces-policies.safara-bootstrap.coverage-v4.accepted-v1",
  evidence_id: "CES-GF-POL-008-V01-H01",
  evidence_path: "project's goal/feedback/CES_POLICIES_REVIEW_94b50d8.md", terminal_outcome: "ACCEPTED" as const,
  reviewed_commit: "94b50d84fb2fa693d1dc78d58353ea0585755626",
  artifact_hash: "3e0e7253279437cd5c76780d11acccacd81290d80b74c7e135bc3cdb7591b3a3",
  publication_content_hash: "b80d4e68f2fa57495eb812ec08d69acf8505db6535821efddaa31491d03e7e3b",
  evidence_content_hash: "81ad082f2c63a47d900e49e29b54528434214153aa0c5dcc04338d99415dd53f" };
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function rehashCandidate(value: any) { const { candidate_hash: _ignored, ...body } = value;
  return { ...body, candidate_hash: digest(body) }; }

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
  it("rejects unresolved or altered accepted prerequisite evidence", () => {
    const base: any = clone(CES_POLICY_FINAL_APPROVAL_CANDIDATE_V1);
    for (const mutate of [
      (value: any) => { value.gate_evidence.coverage_v4.evidence_content_hash = "a".repeat(64); },
      (value: any) => { value.gate_evidence.coverage_v4.artifact_hash = "b".repeat(64); },
      (value: any) => { value.gate_evidence.coverage_v4.evidence_path = "missing.md"; },
      (value: any) => { value.gate_evidence.coverage_v4.reviewed_commit = "c".repeat(40); },
      (value: any) => { value.gate_evidence.coverage_v4.terminal_outcome = "NOT ACCEPTED"; },
      (value: any) => { value.gate_evidence.coverage_v4.publication_id = "internally-consistent.fake"; },
    ]) { const changed = clone(base); mutate(changed);
      expect(() => FinalPolicyTaxonomyApprovalCandidateSchema.parse(rehashCandidate(changed))).toThrow(); }
  });
  it("creates a content-addressed human handoff without publishing authority", () => {
    const handoff = CES_POLICY_FINAL_APPROVAL_REVIEW_HANDOFF_V1;
    expect(handoff.allowed_terminal_outcomes).toEqual(["ACCEPTED", "NOT ACCEPTED",
      "ACCEPTED WITH DEFERRED ITEMS"]);
    expect(handoff.authority).toEqual({ publishes_successor: false, final_pol_008_approval: false,
      pol_009_authorized: false, requires_separate_closure_commit: true });
    const changed: any = clone(handoff); changed.review_questions[0] = "Approve everything?";
    expect(() => FinalPolicyTaxonomyReviewHandoffSchema.parse(changed)).toThrow();
    const { handoff_hash: _ignored, ...changedBody } = changed;
    expect(() => FinalPolicyTaxonomyReviewHandoffSchema.parse({ ...changedBody,
      handoff_hash: digest(changedBody) })).toThrow();
  });
});
