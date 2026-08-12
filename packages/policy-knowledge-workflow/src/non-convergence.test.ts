import { describe, expect, it } from "vitest";
import { createNonConvergenceLedger, createSuccessorConvergenceLedger, evaluateCoverageProgress, proposalSemanticFingerprint,
  recordBoundedAttempt, suspendForExternalCondition } from "./non-convergence.js";
const policy = { policy_id: "policy.attempts.reviewed", policy_version: "1.0.0",
  max_attempts: 2, reviewer_evidence_id: "evidence.attempt-policy.1" };
const semantics = (meaning = "Sensitive data must be classified.", target = "policy.data") => ({
  layer: "policy_taxonomy", decisions: [{ subject_id: "ces.data-classification",
    decision: "ADD", target_id: target }], resulting_concept_or_policy: { id: target,
    obligation_or_definition: meaning, semantic_atom_ids: target === "policy.data"
      ? ["semantic.identify-sensitive-data", "semantic.assign-protection-level"]
      : ["semantic.minimize-sensitive-disclosure"], support_ids: ["ces.data-classification"] },
  lineage: [{ subject_id: "ces.data-classification", source_release_id: "owasp.asvs.5-0-0",
    raw_concept_id: "raw.asvs.v14-1-1" }], comparisons: [{
    subject_id: "ces.data-classification", target_id: "policy.access",
    relationship: "distinct" }] });
function ledger(id = "ledger.gap.1", fingerprint = "a".repeat(64)) {
  return createNonConvergenceLedger({ ledger_id: id, gap_fingerprint: fingerprint,
    fact_id: "safara.manual.fact.0027", earliest_incomplete_layer: "policy_taxonomy",
    attempt_policy: policy });
}
describe("AGB-011 non-convergence controls", () => {
  it("detects semantic duplicates despite ordering, case, punctuation, and whitespace changes", () => {
    const reordered = { ...semantics("Protection tiers shall be assigned after identifying sensitive information."),
      lineage: [...semantics().lineage].reverse(), comparisons: [...semantics().comparisons].reverse() };
    expect(proposalSemanticFingerprint(reordered)).toBe(proposalSemanticFingerprint(semantics()));
    const first = recordBoundedAttempt(ledger(), { attempt_id: "attempt.1",
      proposal_semantics: semantics() });
    const duplicate = recordBoundedAttempt(first, { attempt_id: "attempt.2",
      proposal_semantics: reordered });
    expect(duplicate).toMatchObject({ suspension_reason: "DUPLICATE_PROPOSAL",
      attempts: [{ attempt_id: "attempt.1" }] });
  });
  it("does not collapse materially distinct target or obligation semantics", () => {
    expect(proposalSemanticFingerprint(semantics())).not.toBe(
      proposalSemanticFingerprint(semantics("Sensitive disclosure must be minimized.",
        "policy.disclosure")));
  });
  it("uses an injected reviewed attempt policy and suspends rather than exceeding it", () => {
    let current = recordBoundedAttempt(ledger(), { attempt_id: "attempt.1",
      proposal_semantics: semantics() });
    current = recordBoundedAttempt(current, { attempt_id: "attempt.2",
      proposal_semantics: semantics("Sensitive disclosure must be minimized.", "policy.disclosure") });
    const exhausted = recordBoundedAttempt(current, { attempt_id: "attempt.3",
      proposal_semantics: semantics("Sensitive data must be protected.", "policy.protection") });
    expect(exhausted).toMatchObject({ suspension_reason: "ATTEMPT_EXHAUSTED",
      attempts: [{ attempt_id: "attempt.1" }, { attempt_id: "attempt.2" }] });
    expect(() => recordBoundedAttempt(exhausted, { attempt_id: "attempt.4",
      proposal_semantics: semantics("Another meaning.", "policy.another") })).toThrow(/Suspended/u);
  });
  it("requires bounded REQUIRED authority for a retry after NOT ACCEPTED", () => {
    expect(() => recordBoundedAttempt(ledger(), { attempt_id: "attempt.1",
      proposal_semantics: semantics(), prior_review: { outcome: "NOT ACCEPTED",
        required_finding_ids: [] } })).toThrow(/bounded REQUIRED/u);
    expect(recordBoundedAttempt(ledger(), { attempt_id: "attempt.1",
      proposal_semantics: semantics(), prior_review: { outcome: "NOT ACCEPTED",
        required_finding_ids: ["required.1"] } }).attempts).toHaveLength(1);
  });
  it("stops an accepted successor that leaves the same semantic gap", () => {
    const result = evaluateCoverageProgress(ledger(), { source_or_policy_gap: {
      fact_id: "safara.manual.fact.0027", earliest_incomplete_layer: "policy_taxonomy",
      gap_fingerprint: "b".repeat(64) } });
    expect(result).toMatchObject({ outcome: "GOVERNED_SUSPENSION",
      ledger: { suspension_reason: "NO_PROGRESS" } });
    expect(evaluateCoverageProgress(ledger(), { source_or_policy_gap: null }).outcome)
      .toBe("KNOWLEDGE_CONVERGED");
  });
  it("permits changed governed gap identity without mutating prior history", () => {
    const previous = ledger();
    const result = evaluateCoverageProgress(previous, { source_or_policy_gap: {
      fact_id: "safara.manual.fact.0027", earliest_incomplete_layer: "canonical_vocabulary",
      gap_fingerprint: "b".repeat(64) } });
    expect(result).toMatchObject({ outcome: "PROGRESS", next_gap_fingerprint: "b".repeat(64) });
    expect(previous).toMatchObject({ gap_fingerprint: "a".repeat(64), suspension_reason: null });
    const successor = createSuccessorConvergenceLedger(previous, { ledger_id: "ledger.gap.2",
      gap_fingerprint: "b".repeat(64), fact_id: "safara.manual.fact.0027",
      earliest_incomplete_layer: "canonical_vocabulary", attempt_policy: policy });
    expect(successor).toMatchObject({ supersedes_ledger_id: "ledger.gap.1", attempts: [] });
    expect(() => createSuccessorConvergenceLedger(previous, { ledger_id: "ledger.invalid",
      gap_fingerprint: "a".repeat(64), fact_id: "safara.manual.fact.0027",
      earliest_incomplete_layer: "policy_taxonomy", attempt_policy: policy })).toThrow(/changed/u);
  });
  it("represents external stop conditions without inventing DECISION_REQUIRED", () => {
    expect(suspendForExternalCondition(ledger(), "AUTHORITY_UNAVAILABLE").suspension_reason)
      .toBe("AUTHORITY_UNAVAILABLE");
    expect(suspendForExternalCondition(ledger(), "GOVERNED_SOURCE_UNAVAILABLE").suspension_reason)
      .toBe("GOVERNED_SOURCE_UNAVAILABLE");
  });
});
