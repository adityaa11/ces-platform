import { describe, expect, it } from "vitest";
import { gapFingerprint, recordKnowledgeAttempt, recordKnowledgeProposal,
  recordKnowledgeValidation, startPolicyKnowledgeWorkflow,
  PolicyKnowledgeWorkflowSchema } from "./index.js";
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
});
