import { describe, expect, it } from "vitest";
import { recordKnowledgeAttempt, recordKnowledgeProposal, recordKnowledgeReview,
  recordKnowledgeValidation, startPolicyKnowledgeWorkflow } from "./index.js";
import { createGovernedNormalizedMeaningArtifact, createNonConvergenceLedger,
  createSuccessorConvergenceLedger, evaluateCoverageProgress, governedSurfaceHash,
  proposalSemanticFingerprint, recordBoundedAttempt, suspendForExternalCondition } from
  "./non-convergence.js";
const policy = { policy_id: "policy.attempts.reviewed", policy_version: "1.0.0",
  max_attempts: 2, reviewer_evidence_id: "evidence.attempt-policy.1" };
const wording = "Sensitive data must be classified.";
const paraphrase = "Protection tiers shall be assigned after identifying sensitive information.";
const meaning = createGovernedNormalizedMeaningArtifact({ artifact_id: "meaning.data-classification.1",
  lifecycle: "accepted", meaning_id: "meaning.data-classification",
  semantic_atoms: [{ atom_id: "atom.identify-sensitive-data", modality: "require",
    predicate: "identify", object: "sensitive-data", qualifier_ids: [] },
  { atom_id: "atom.assign-protection-level", modality: "require", predicate: "classify",
    object: "sensitive-data", qualifier_ids: ["qualifier.protection-level"] }],
  evidence_surface_hashes: [governedSurfaceHash(wording), governedSurfaceHash(paraphrase)],
  reviewer_evidence_id: "evidence.meaning.1" });
const disclosureMeaning = createGovernedNormalizedMeaningArtifact({
  artifact_id: "meaning.disclosure-minimization.1", lifecycle: "accepted",
  meaning_id: "meaning.disclosure-minimization", semantic_atoms: [{
    atom_id: "atom.minimize-disclosure", modality: "require", predicate: "minimize",
    object: "sensitive-data-disclosure", qualifier_ids: [] }],
  evidence_surface_hashes: [governedSurfaceHash("Sensitive disclosure must be minimized.")],
  reviewer_evidence_id: "evidence.meaning.2" });
const registry = new Map([[meaning.artifact_id, meaning], [disclosureMeaning.artifact_id,
  disclosureMeaning]]);
const resolveMeaning = (id: string) => registry.get(id);
const semantics = (text = wording, target = "policy.data",
  artifactId = meaning.artifact_id) => ({ layer: "policy_taxonomy",
  decisions: [{ subject_id: "ces.data-classification", decision: "ADD", target_id: target }],
  resulting_concept_or_policy: { id: target, obligation_or_definition: text,
    normalized_meaning_artifact_id: artifactId, support_ids: ["ces.data-classification"] },
  lineage: [{ subject_id: "ces.data-classification", source_release_id: "owasp.asvs.5-0-0",
    raw_concept_id: "raw.asvs.v14-1-1" }], comparisons: [{ subject_id: "ces.data-classification",
    target_id: "policy.access", relationship: "distinct" }] });
function ledger(id = "ledger.gap.1", fingerprint = "a".repeat(64)) {
  return createNonConvergenceLedger({ ledger_id: id, gap_fingerprint: fingerprint,
    fact_id: "safara.manual.fact.0027", earliest_incomplete_layer: "policy_taxonomy",
    attempt_policy: policy });
}
const initial = { kind: "INITIAL" as const };
const revisions = { source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
  canonical_vocabulary_revision: "1.5.0", policy_taxonomy_revision: "1.1.0" };
const ev = (n: number) => ({ event_id: `event.retry.${n}`, evidence_id: `evidence.retry.${n}`,
  occurred_at: `2026-08-12T0${n}:00:00+00:00` });
function rejectedWorkflow() {
  let workflow = startPolicyKnowledgeWorkflow({ workflow_id: "workflow.retry", gap_id: "gap.1",
    coverage_result: { coverage_result_id: "coverage.retry", status: "valid",
      completeness: "complete", revisions, entries: [{ fact_id: "safara.manual.fact.0027",
        disposition: "SOURCE_OR_POLICY_GAP", earliest_incomplete_layer: "policy_taxonomy" }] }, ...ev(1) });
  workflow = recordKnowledgeAttempt(workflow, { attempt_id: "attempt.workflow.1", ...ev(2) });
  workflow = recordKnowledgeProposal(workflow, { attempt_id: "attempt.workflow.1",
    proposal_id: "proposal.workflow.1", proposal_hash: "b".repeat(64), ...ev(3) });
  workflow = recordKnowledgeValidation(workflow, { proposal_id: "proposal.workflow.1",
    proposal_hash: "b".repeat(64), validation_id: "validation.workflow.1", status: "valid", ...ev(4) });
  return recordKnowledgeReview(workflow, { review_id: "review.retry.1", outcome: "NOT ACCEPTED",
    review_round: 1, predecessor_review_id: null, reviewed_commit: "c".repeat(40),
    reviewed_artifact_hash: "b".repeat(64), required_finding_ids: ["required.retry.1"],
    reviewed_finding_ids: [], qualifying_regression: false, ...ev(5) });
}
const retryAuthority = rejectedWorkflow();
const retryFingerprint = retryAuthority.gap!.gap_fingerprint;
const remediation = () => ({ kind: "NOT_ACCEPTED_REMEDIATION" as const,
  workflow: retryAuthority, review_id: "review.retry.1" });
function attempt(current: ReturnType<typeof ledger>, id: string, proposal: unknown,
  authorization: typeof initial | ReturnType<typeof remediation> = initial) {
  return recordBoundedAttempt(current, { attempt_id: id, proposal_semantics: proposal,
    resolve_meaning: resolveMeaning, authorization });
}
describe("AGB-011 non-convergence controls", () => {
  it("uses governed meaning to identify paraphrased and reordered duplicates", () => {
    const reordered = { ...semantics(paraphrase), lineage: [...semantics().lineage].reverse() };
    expect(proposalSemanticFingerprint(reordered, resolveMeaning)).toBe(
      proposalSemanticFingerprint(semantics(), resolveMeaning));
    const first = attempt(ledger("ledger.retry-duplicate", retryFingerprint), "attempt.1", semantics());
    const duplicate = attempt(first, "attempt.2", reordered, remediation());
    expect(duplicate).toMatchObject({ suspension_reason: "DUPLICATE_PROPOSAL",
      attempts: [{ attempt_id: "attempt.1" }] });
  });
  it("rejects spoofed atom reuse and distinguishes materially different meaning", () => {
    expect(() => proposalSemanticFingerprint(
      semantics("Sensitive data may be publicly disclosed."), resolveMeaning)).toThrow(/not bound/u);
    expect(proposalSemanticFingerprint(semantics(), resolveMeaning)).not.toBe(
      proposalSemanticFingerprint(semantics("Sensitive disclosure must be minimized.",
        "policy.disclosure", disclosureMeaning.artifact_id), resolveMeaning));
  });
  it("uses reviewed attempt policy and authoritative retry state", () => {
    const first = attempt(ledger("ledger.retry-policy", retryFingerprint), "attempt.1", semantics());
    expect(() => attempt(first, "attempt.2", semantics("Sensitive disclosure must be minimized.",
      "policy.disclosure", disclosureMeaning.artifact_id))).toThrow(/initial authority/u);
    const forged = { ...retryAuthority, review_outcome: "ACCEPTED" as const };
    expect(() => attempt(first, "attempt.2", semantics("Sensitive disclosure must be minimized.",
      "policy.disclosure", disclosureMeaning.artifact_id), { kind: "NOT_ACCEPTED_REMEDIATION",
      workflow: forged, review_id: "review.retry.1" })).toThrow();
    const second = attempt(first, "attempt.2", semantics("Sensitive disclosure must be minimized.",
      "policy.disclosure", disclosureMeaning.artifact_id), remediation());
    const exhausted = recordBoundedAttempt(second, { attempt_id: "attempt.3",
      proposal_semantics: semantics(paraphrase), resolve_meaning: resolveMeaning,
      authorization: remediation() });
    expect(exhausted).toMatchObject({ suspension_reason: "ATTEMPT_EXHAUSTED",
      attempts: [{ attempt_id: "attempt.1" }, { attempt_id: "attempt.2" }] });
  });
  it("uses exact governed fingerprint for progress", () => {
    const unchanged = evaluateCoverageProgress(ledger(), { source_or_policy_gap: {
      fact_id: "safara.manual.fact.0027", earliest_incomplete_layer: "policy_taxonomy",
      gap_fingerprint: "a".repeat(64) } });
    expect(unchanged).toMatchObject({ outcome: "GOVERNED_SUSPENSION",
      ledger: { suspension_reason: "NO_PROGRESS" } });
    const changed = evaluateCoverageProgress(ledger(), { source_or_policy_gap: {
      fact_id: "safara.manual.fact.0027", earliest_incomplete_layer: "policy_taxonomy",
      gap_fingerprint: "b".repeat(64) } });
    expect(changed).toMatchObject({ outcome: "PROGRESS", next_gap_fingerprint: "b".repeat(64) });
    expect(evaluateCoverageProgress(ledger(), { source_or_policy_gap: null }).outcome)
      .toBe("KNOWLEDGE_CONVERGED");
  });
  it("links changed governed histories without mutation", () => {
    const previous = ledger();
    const successor = createSuccessorConvergenceLedger(previous, { ledger_id: "ledger.gap.2",
      gap_fingerprint: "b".repeat(64), fact_id: "safara.manual.fact.0027",
      earliest_incomplete_layer: "policy_taxonomy", attempt_policy: policy });
    expect(successor).toMatchObject({ supersedes_ledger_id: "ledger.gap.1",
      gap_fingerprint: "b".repeat(64), attempts: [] });
    expect(previous).toMatchObject({ gap_fingerprint: "a".repeat(64), attempts: [] });
  });
  it("represents external stops without inventing DECISION_REQUIRED", () => {
    expect(suspendForExternalCondition(ledger(), "AUTHORITY_UNAVAILABLE").suspension_reason)
      .toBe("AUTHORITY_UNAVAILABLE");
    expect(suspendForExternalCondition(ledger(), "GOVERNED_SOURCE_UNAVAILABLE").suspension_reason)
      .toBe("GOVERNED_SOURCE_UNAVAILABLE");
  });
});
