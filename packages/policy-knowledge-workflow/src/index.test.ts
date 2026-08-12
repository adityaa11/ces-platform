import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { gapFingerprint, recordKnowledgeAttempt, recordKnowledgeProposal,
  recordKnowledgeValidation, startPolicyKnowledgeWorkflow,
  PolicyKnowledgeWorkflowSchema, recordKnowledgeReview, recordAcceptedPublication,
  resumeKnowledgeWorkflow } from "./index.js";
const revisions = { source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
  canonical_vocabulary_revision: "1.5.0", policy_taxonomy_revision: "1.1.0" };
const evidence = (n: number) => ({ event_id: `event.workflow.${n}`, evidence_id: `evidence.${n}`,
  occurred_at: `2026-08-12T0${n}:00:00+00:00` });
const coverage = (disposition: "SOURCE_OR_POLICY_GAP" | "DECISION_REQUIRED" | "AWARENESS_EMITTED") => ({
  coverage_result_id: "coverage.result.1", status: "valid", completeness: "complete",
  revisions, entries: [{ fact_id: "safara.manual.fact.0027", disposition,
    earliest_incomplete_layer: disposition === "SOURCE_OR_POLICY_GAP" ? "policy_taxonomy" : null }] });
describe("AGB-009 Policy knowledge workflow", () => {
  it("routes only a bounded source-or-policy gap and fingerprints governed state", () => {
    const workflow = startPolicyKnowledgeWorkflow({ workflow_id: "workflow.1", gap_id: "gap.1",
      coverage_result: coverage("SOURCE_OR_POLICY_GAP"), ...evidence(1) });
    expect(workflow).toMatchObject({ state: "AGENT_EXECUTION_PENDING",
      gap: { earliest_incomplete_layer: "policy_taxonomy" } });
    expect(workflow.gap!.gap_fingerprint).toBe(gapFingerprint({
      fact_id: "safara.manual.fact.0027", earliest_incomplete_layer: "policy_taxonomy", revisions }));
    expect(() => startPolicyKnowledgeWorkflow({ workflow_id: "workflow.2",
      coverage_result: { ...coverage("SOURCE_OR_POLICY_GAP"), status: "invalid" },
      ...evidence(1) })).toThrow();
  });
  it("separates convergence, full resolution, and governed suspension", () => {
    expect(startPolicyKnowledgeWorkflow({ workflow_id: "workflow.decision",
      coverage_result: coverage("DECISION_REQUIRED"), ...evidence(1) }).state)
      .toBe("KNOWLEDGE_CONVERGED");
    expect(startPolicyKnowledgeWorkflow({ workflow_id: "workflow.resolved",
      coverage_result: coverage("AWARENESS_EMITTED"), ...evidence(1) }).state)
      .toBe("FULLY_RESOLVED");
    let workflow = startPolicyKnowledgeWorkflow({ workflow_id: "workflow.gap", gap_id: "gap.1",
      coverage_result: coverage("SOURCE_OR_POLICY_GAP"), ...evidence(1) });
    workflow = recordKnowledgeAttempt(workflow, { attempt_id: "attempt.1", ...evidence(2) });
    workflow = recordKnowledgeProposal(workflow, { attempt_id: "attempt.1",
      proposal_id: "proposal.1", proposal_hash: "a".repeat(64), ...evidence(3) });
    workflow = recordKnowledgeValidation(workflow, { proposal_id: "proposal.1",
      proposal_hash: "a".repeat(64), validation_id: "validation.1", status: "valid", ...evidence(4) });
    expect(workflow).toMatchObject({ state: "GOVERNED_SUSPENSION",
      suspension_reason: "REVIEW_REQUIRED", review_id: null, publication_id: null, resume_id: null });
    expect(workflow.events).toHaveLength(4);
  });
  it("rejects skipped, duplicated, stale, and cross-workflow transitions", () => {
    const workflow = startPolicyKnowledgeWorkflow({ workflow_id: "workflow.1", gap_id: "gap.1",
      coverage_result: coverage("SOURCE_OR_POLICY_GAP"), ...evidence(1) });
    expect(() => recordKnowledgeProposal(workflow, { attempt_id: "attempt.1",
      proposal_id: "proposal.1", proposal_hash: "a".repeat(64), ...evidence(2) })).toThrow(/Illegal/u);
    const attempted = recordKnowledgeAttempt(workflow, { attempt_id: "attempt.1", ...evidence(2) });
    expect(() => recordKnowledgeAttempt(attempted, { attempt_id: "attempt.2", ...evidence(3) }))
      .toThrow(/Illegal/u);
    expect(() => recordKnowledgeProposal(attempted, { attempt_id: "attempt.stale",
      proposal_id: "proposal.1", proposal_hash: "a".repeat(64), ...evidence(3) }))
      .toThrow(/mismatch/u);
    expect(() => recordKnowledgeAttempt({ ...workflow, workflow_id: "workflow.other" },
      { attempt_id: "attempt.1", ...evidence(2) })).toThrow(/history/u);
  });
  it("rejects every forged snapshot field while preserving the legitimate replay", () => {
    const started = startPolicyKnowledgeWorkflow({ workflow_id: "workflow.forgery", gap_id: "gap.1",
      coverage_result: coverage("SOURCE_OR_POLICY_GAP"), ...evidence(1) });
    const attempted = recordKnowledgeAttempt(started, { attempt_id: "attempt.1", ...evidence(2) });
    const proposed = recordKnowledgeProposal(attempted, { attempt_id: "attempt.1",
      proposal_id: "proposal.1", proposal_hash: "a".repeat(64), ...evidence(3) });
    const validated = recordKnowledgeValidation(proposed, { proposal_id: "proposal.1",
      proposal_hash: "a".repeat(64), validation_id: "validation.1", status: "valid", ...evidence(4) });
    const forgeries = [{ ...started, state: "AGENT_EXECUTION_COMPLETE", attempt_id: "attempt.forged" },
      { ...attempted, attempt_id: "attempt.forged" },
      { ...proposed, proposal_id: "proposal.forged" },
      { ...proposed, proposal_hash: "b".repeat(64) },
      { ...validated, validation_id: "validation.forged" },
      { ...validated, suspension_reason: "VALIDATION_FAILED" }];
    for (const forged of forgeries) expect(() => PolicyKnowledgeWorkflowSchema.parse(forged))
      .toThrow(/snapshot does not match event history/u);
    expect(() => recordKnowledgeProposal(forgeries[0], { attempt_id: "attempt.forged",
      proposal_id: "proposal.forged", proposal_hash: "b".repeat(64), ...evidence(2) }))
      .toThrow(/snapshot does not match event history/u);
    expect(PolicyKnowledgeWorkflowSchema.parse(validated)).toEqual(validated);
  });
  it("resumes only from an exact externally accepted publication", () => {
    let workflow = startPolicyKnowledgeWorkflow({ workflow_id: "workflow.authority", gap_id: "gap.1",
      coverage_result: coverage("SOURCE_OR_POLICY_GAP"), ...evidence(1) });
    workflow = recordKnowledgeAttempt(workflow, { attempt_id: "attempt.1", ...evidence(2) });
    workflow = recordKnowledgeProposal(workflow, { attempt_id: "attempt.1",
      proposal_id: "proposal.1", proposal_hash: "a".repeat(64), ...evidence(3) });
    workflow = recordKnowledgeValidation(workflow, { proposal_id: "proposal.1",
      proposal_hash: "a".repeat(64), validation_id: "validation.1", status: "valid", ...evidence(4) });
    workflow = recordKnowledgeReview(workflow, { review_id: "review.1", outcome: "ACCEPTED",
      review_round: 1, predecessor_review_id: null, reviewed_finding_ids: [],
      qualifying_regression: false,
      reviewed_commit: "c".repeat(40), reviewed_artifact_hash: "a".repeat(64),
      required_finding_ids: [], ...evidence(5) });
    expect(workflow.state).toBe("GOVERNED_SUSPENSION");
    expect(() => resumeKnowledgeWorkflow(workflow, { resume_id: "resume.early",
      publication_id: "publication.missing", artifact_hash: "a".repeat(64), ...evidence(6) }))
      .toThrow(/publication/u);
    workflow = recordAcceptedPublication(workflow, { publication_id: "publication.1",
      review_id: "review.1", reviewed_commit: "c".repeat(40), artifact_hash: "a".repeat(64),
      authority_evidence_id: "authority.project-owner.1", ...evidence(6) });
    expect(workflow.state).toBe("GOVERNED_SUSPENSION");
    const resumed = resumeKnowledgeWorkflow(workflow, { resume_id: "resume.1",
      publication_id: "publication.1", artifact_hash: "a".repeat(64), ...evidence(7) });
    expect(resumed).toMatchObject({ state: "COVERAGE_RERUN_PENDING",
      publication_id: "publication.1", resume_id: "resume.1", suspension_reason: null });
    expect(() => resumeKnowledgeWorkflow(resumed, { resume_id: "resume.duplicate",
      publication_id: "publication.1", artifact_hash: "a".repeat(64), ...evidence(7) }))
      .toThrow(/Illegal/u);
  });
  it("keeps NOT ACCEPTED suspended with bounded findings and forbids publication", () => {
    let workflow = startPolicyKnowledgeWorkflow({ workflow_id: "workflow.rejected", gap_id: "gap.1",
      coverage_result: coverage("SOURCE_OR_POLICY_GAP"), ...evidence(1) });
    workflow = recordKnowledgeAttempt(workflow, { attempt_id: "attempt.1", ...evidence(2) });
    workflow = recordKnowledgeProposal(workflow, { attempt_id: "attempt.1",
      proposal_id: "proposal.1", proposal_hash: "a".repeat(64), ...evidence(3) });
    workflow = recordKnowledgeValidation(workflow, { proposal_id: "proposal.1",
      proposal_hash: "a".repeat(64), validation_id: "validation.1", status: "valid", ...evidence(4) });
    expect(() => recordKnowledgeReview(workflow, { review_id: "review.empty",
      outcome: "NOT ACCEPTED", reviewed_commit: "c".repeat(40),
      review_round: 1, predecessor_review_id: null, reviewed_finding_ids: [],
      qualifying_regression: false, reviewed_artifact_hash: "a".repeat(64),
      required_finding_ids: [], ...evidence(5) }))
      .toThrow(/bounded terminal outcome/u);
    const rejected = recordKnowledgeReview(workflow, { review_id: "review.1",
      outcome: "NOT ACCEPTED", reviewed_commit: "c".repeat(40),
      review_round: 1, predecessor_review_id: null, reviewed_finding_ids: [],
      qualifying_regression: false,
      reviewed_artifact_hash: "a".repeat(64), required_finding_ids: ["required.1"], ...evidence(5) });
    expect(rejected).toMatchObject({ state: "GOVERNED_SUSPENSION",
      review_outcome: "NOT ACCEPTED", required_finding_ids: ["required.1"] });
    expect(() => recordAcceptedPublication(rejected, { publication_id: "publication.invalid",
      review_id: "review.1", reviewed_commit: "c".repeat(40), artifact_hash: "a".repeat(64),
      authority_evidence_id: "authority.1", ...evidence(6) })).toThrow(/accepted reviewed/u);
  });
  it("enforces closure accounting and distinct provenance hash types", () => {
    let workflow = reviewReady("workflow.closure");
    expect(() => recordKnowledgeReview(workflow, { review_id: "review.bad-commit",
      outcome: "ACCEPTED", review_round: 1, predecessor_review_id: null,
      reviewed_commit: "c".repeat(64), reviewed_artifact_hash: "a".repeat(64),
      required_finding_ids: [], reviewed_finding_ids: [], qualifying_regression: false,
      ...evidence(5) })).toThrow();
    const rejected = recordKnowledgeReview(workflow, { review_id: "review.1",
      outcome: "NOT ACCEPTED", review_round: 1, predecessor_review_id: null,
      reviewed_commit: "6bce2a30c5b76bb4698487c9184a280b9c8c5b53",
      reviewed_artifact_hash: "a".repeat(64), required_finding_ids: ["required.1"],
      reviewed_finding_ids: [], qualifying_regression: false, ...evidence(5) });
    expect(() => recordKnowledgeReview(rejected, { review_id: "review.2", outcome: "ACCEPTED",
      review_round: 2, predecessor_review_id: "review.1", reviewed_commit: "d".repeat(40),
      reviewed_artifact_hash: "a".repeat(64), required_finding_ids: [], reviewed_finding_ids: [],
      qualifying_regression: false, ...evidence(6) })).toThrow(/bounded terminal outcome/u);
    const accepted = recordKnowledgeReview(rejected, { review_id: "review.2", outcome: "ACCEPTED",
      review_round: 2, predecessor_review_id: "review.1", reviewed_commit: "d".repeat(40),
      reviewed_artifact_hash: "a".repeat(64), required_finding_ids: [],
      reviewed_finding_ids: ["required.1"], qualifying_regression: false, ...evidence(6) });
    expect(accepted.reviewed_commit).toHaveLength(40);
  });

  it("rejects rehashed unauthorized authority histories", () => {
    const failed = reviewReady("workflow.failed", "invalid");
    const forgedReview = appendForged(failed, "REVIEW_RECORDED", {
      review_id: "review.forged", review_outcome: "ACCEPTED", review_round: 1,
      predecessor_review_id: null, reviewed_commit: "c".repeat(40),
      reviewed_artifact_hash: "a".repeat(64), required_finding_ids: [],
      reviewed_finding_ids: [], qualifying_regression: false });
    expect(() => PolicyKnowledgeWorkflowSchema.parse(forgedReview)).toThrow(/history/u);
    let rejected = reviewReady("workflow.rehashed-rejected");
    rejected = recordKnowledgeReview(rejected, { review_id: "review.1", outcome: "NOT ACCEPTED",
      review_round: 1, predecessor_review_id: null, reviewed_commit: "c".repeat(40),
      reviewed_artifact_hash: "a".repeat(64), required_finding_ids: ["required.1"],
      reviewed_finding_ids: [], qualifying_regression: false, ...evidence(5) });
    const forgedPublication = appendForged(rejected, "PUBLICATION_RECORDED", {
      publication_id: "publication.forged", publication_artifact_hash: "a".repeat(64),
      publication_authority_evidence_id: "authority.forged" });
    expect(() => PolicyKnowledgeWorkflowSchema.parse(forgedPublication)).toThrow(/history/u);
    const forgedResume = appendForged(rejected, "WORKFLOW_RESUMED", {
      state: "COVERAGE_RERUN_PENDING", suspension_reason: null,
      publication_id: "publication.forged", publication_artifact_hash: "a".repeat(64),
      publication_authority_evidence_id: "authority.forged", resume_id: "resume.forged" });
    expect(() => PolicyKnowledgeWorkflowSchema.parse(forgedResume)).toThrow(/history/u);
    const accepted = recordKnowledgeReview(reviewReady("workflow.no-authority"), {
      review_id: "review.1", outcome: "ACCEPTED", review_round: 1, predecessor_review_id: null,
      reviewed_commit: "c".repeat(40), reviewed_artifact_hash: "a".repeat(64),
      required_finding_ids: [], reviewed_finding_ids: [], qualifying_regression: false,
      ...evidence(5) });
    const noAuthority = appendForged(accepted, "PUBLICATION_RECORDED", {
      publication_id: "publication.no-authority", publication_artifact_hash: "a".repeat(64),
      publication_authority_evidence_id: null });
    expect(() => PolicyKnowledgeWorkflowSchema.parse(noAuthority)).toThrow(/history/u);
  });
});

function reviewReady(workflowId: string, status: "valid" | "invalid" = "valid") {
  let workflow = startPolicyKnowledgeWorkflow({ workflow_id: workflowId, gap_id: "gap.1",
    coverage_result: coverage("SOURCE_OR_POLICY_GAP"), ...evidence(1) });
  workflow = recordKnowledgeAttempt(workflow, { attempt_id: "attempt.1", ...evidence(2) });
  workflow = recordKnowledgeProposal(workflow, { attempt_id: "attempt.1", proposal_id: "proposal.1",
    proposal_hash: "a".repeat(64), ...evidence(3) });
  return recordKnowledgeValidation(workflow, { proposal_id: "proposal.1",
    proposal_hash: "a".repeat(64), validation_id: "validation.1", status, ...evidence(4) });
}
function digest(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function appendForged(workflow: any, kind: string, changed: Record<string, unknown>) {
  const snapshot = { ...workflow.events.at(-1).snapshot, ...changed };
  const body = { event_id: `event.forged.${workflow.events.length + 1}`,
    workflow_id: workflow.workflow_id, sequence: workflow.events.length + 1, kind,
    occurred_at: "2026-08-12T09:00:00+00:00",
    previous_event_hash: workflow.events.at(-1).event_hash, evidence_id: "evidence.forged",
    snapshot, transition_payload_hash: digest(snapshot) };
  return { ...workflow, ...snapshot, events: [...workflow.events, { ...body, event_hash: digest(body) }] };
}
