import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadManualSafaraDemandFacts } from "@company/ces-policy-manual-demand-adapter";
import { evaluateSafaraBootstrapCoverage, evaluateSafaraBootstrapCoverageV2,
  evaluateSafaraBootstrapCoverageV3, evaluateSafaraBootstrapCoverageV4 } from
  "@company/ces-policy-safara-bootstrap";
import { consumeAcceptedAuthority, executeGapToReviewSuspension, routeCompleteCoverage,
  acceptedPolicySupport, governedSafaraFactSupport, retainMaterialFactSupport, runGovernedKnowledgeReplay,
  safaraSemanticFingerprint, safaraSemanticProjection, semanticCoverageFingerprint } from "./index.js";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { recordAcceptedPublication, recordKnowledgeReview } from "@company/ces-policy-knowledge-workflow";
import { createGovernedNormalizedMeaningArtifact, createNonConvergenceLedger,
  evaluatePostPublicationRerun, governedSurfaceHash, recordReplayAttempt } from "./index.js";
const root = resolve(import.meta.dirname, "../../.."); const fixture = resolve(root, "fixtures/policies/safara-v1.1-cycle-01");
function facts() { const inventoryBytes = readFileSync(resolve(fixture, "manual-facts.json")); return loadManualSafaraDemandFacts({
  sourceManifest: JSON.parse(readFileSync(resolve(fixture, "source-manifest.json"), "utf8")),
  inventory: JSON.parse(inventoryBytes.toString("utf8")), inventoryBytes,
  reviewRecord: JSON.parse(readFileSync(resolve(fixture, "human-review-record.json"), "utf8")),
  sourcePdfBytes: readFileSync(resolve(root, "docs/prd/Safara_Buyer_Business_PRD.pdf")) }); }
function workflowCoverage(result: any) { return {
  coverage_result_id: result.result_id, status: "valid" as const, completeness: "complete" as const,
  revisions: { source_glossary_revision: "1.1.0", raw_vocabulary_revision: result.raw_corpus_id.endsWith("1-1") ? "1.1.0" : "1.2.0",
    canonical_vocabulary_revision: result.canonical_vocabulary_revision,
    policy_taxonomy_revision: result.candidate_taxonomy_revision }, entries: result.entries.map(({ demand_fact_id,
      disposition, gap_route }: any) => ({ fact_id: demand_fact_id, disposition,
      earliest_incomplete_layer: disposition !== "SOURCE_OR_POLICY_GAP" ? null : gap_route === "EXTRACTION_GAP"
        ? "raw_source_vocabulary" as const : gap_route === "CANONICALIZATION_GAP"
          ? "canonical_vocabulary" as const : "policy_taxonomy" as const })) }; }
function routingEvidence(workflow: any, sourceCoverage?: any) { return { occurred_at: "2026-08-13T00:00:00+00:00",
  expected_fact_count: 111, fact_support: governedSafaraFactSupport(sourceCoverage ?? workflow) }; }
describe("AGB-014 Safara governed replay", () => {
  it("produces an independent final coverage state from accepted registered-agent publications", async () => {
    const input = facts(); const initial = evaluateSafaraBootstrapCoverage(input); let publication = 0;
    const replay = await runGovernedKnowledgeReplay({ initial_coverage: initial, max_cycles: 20,
      execute_registered_agent: async (route) => ({ agent_id: route.agent_id, agent_version: "1.0.0",
        support_evidence_hash: route.support_evidence_hash, proposal_hash: route.support_evidence_hash }),
      consume_external_publication: async (route, execution) => {
        publication++; const support: any = route.support_branch.support[0];
        const common = { publication_id: `publication.replay.${publication}`, authority_evidence_id: `authority.replay.${publication}`,
          proposal_hash: execution.proposal_hash, agent_id: route.agent_id, layer: route.earliest_incomplete_layer };
        if (route.earliest_incomplete_layer === "raw_source_vocabulary") { const source: any = support.evidence;
          return { ...common, source_locator: source.source_locator, raw_concept_id:
            source.source_locator.endsWith("V14.2.6") ? "raw.asvs.v14-2-6" : "raw.asvs.v14-1-1" }; }
        if (route.earliest_incomplete_layer === "canonical_vocabulary") { const raw: any = support.evidence;
          const mapping = CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.mappings.find(({ raw_concept_id }) =>
            raw_concept_id === raw.concept_id)!; return { ...common, raw_concept_id: raw.concept_id,
            canonical_concept_id: mapping.canonical_concept_id }; }
        const canonical: any = support.evidence.concept; return { ...common,
          policy_support: acceptedPolicySupport(canonical.concept_id) };
      } });
    const oracle = evaluateSafaraBootstrapCoverageV4(input);
    expect(replay.executions.length).toBeGreaterThan(0);
    expect(new Set(replay.executions.map(({ agent_id }) => agent_id))).toEqual(new Set([
      "ces.source-knowledge-agent", "ces.canonicalization-agent", "ces.policy-taxonomy-agent"]));
    expect(safaraSemanticProjection(replay.coverage)).toEqual(safaraSemanticProjection(oracle));
    await expect(runGovernedKnowledgeReplay({ initial_coverage: initial, max_cycles: 1,
      execute_registered_agent: async (route) => ({ agent_id: route.agent_id, agent_version: "1.0.0",
        support_evidence_hash: "f".repeat(64), proposal_hash: route.support_evidence_hash }),
      consume_external_publication: async () => ({}) })).rejects.toThrow(/execution evidence/u);
  });
  it("routes each historical gap by earliest incomplete layer and converges to v4 semantics", () => {
    const input = facts(); const versions = [evaluateSafaraBootstrapCoverage(input), evaluateSafaraBootstrapCoverageV2(input),
      evaluateSafaraBootstrapCoverageV3(input), evaluateSafaraBootstrapCoverageV4(input)];
    const routed = versions.map((version) => { const coverage = workflowCoverage(version); return routeCompleteCoverage(
      coverage as any, routingEvidence(coverage, version)); });
    expect(new Set(routed.flat().map(({ agent_id }) => agent_id))).toEqual(new Set([
      "ces.source-knowledge-agent", "ces.canonicalization-agent", "ces.policy-taxonomy-agent"]));
    expect(routed.at(-1)).toEqual([]);
    const final = versions.at(-1)!; const counts = Object.fromEntries(["AWARENESS_EMITTED",
      "NO_SECURITY_AWARENESS_REQUIRED", "OUTSIDE_SOFTWARE_SCOPE", "DECISION_REQUIRED", "SOURCE_OR_POLICY_GAP"]
      .map((key) => [key, final.entries.filter(({ disposition }) => disposition === key).length]));
    expect(counts).toEqual({ AWARENESS_EMITTED: 82, NO_SECURITY_AWARENESS_REQUIRED: 24,
      OUTSIDE_SOFTWARE_SCOPE: 5, DECISION_REQUIRED: 0, SOURCE_OR_POLICY_GAP: 0 });
    expect(final.entries).toHaveLength(111); expect(semanticCoverageFingerprint(workflowCoverage(final) as any)).toHaveLength(64);
    expect(safaraSemanticFingerprint(final)).toBe(safaraSemanticFingerprint(evaluateSafaraBootstrapCoverageV4(input)));
    const mutated: any = structuredClone(final); const awareness = mutated.entries.find((entry: any) =>
      entry.disposition === "AWARENESS_EMITTED"); const noAwareness = mutated.entries.find((entry: any) =>
      entry.disposition === "NO_SECURITY_AWARENESS_REQUIRED");
    [awareness.disposition, noAwareness.disposition] = [noAwareness.disposition, awareness.disposition];
    expect(safaraSemanticFingerprint(mutated)).not.toBe(safaraSemanticFingerprint(final));
    const lineage: any = structuredClone(final); lineage.entries.find((entry: any) => entry.policy_support.length)!
      .policy_support[0].source_lineage[0].raw_concept_id = "raw.invented";
    expect(safaraSemanticFingerprint(lineage)).not.toBe(safaraSemanticFingerprint(final));
  });
  it("fails incomplete accounting, never routes decisions, and retains fact-local support", () => {
    const coverage = workflowCoverage(evaluateSafaraBootstrapCoverage(facts())) as any;
    expect(() => routeCompleteCoverage({ ...coverage, entries: coverage.entries.slice(1) },
      routingEvidence(coverage, evaluateSafaraBootstrapCoverage(facts())))).toThrow();
    const decisions = { ...coverage, entries: coverage.entries.map((entry: any) => ({ ...entry,
      disposition: "DECISION_REQUIRED", earliest_incomplete_layer: null })) };
    expect(routeCompleteCoverage(decisions, { ...routingEvidence(coverage,
      evaluateSafaraBootstrapCoverage(facts())), fact_support: [] })).toEqual([]);
    expect(retainMaterialFactSupport("fact.1", [{ fact_id: "fact.1", support: "canonical.a" },
      { fact_id: "fact.2", support: "canonical.b" }])).toEqual([{ fact_id: "fact.1", support: "canonical.a" }]);
    const gap = coverage.entries.find((entry: any) => entry.disposition === "SOURCE_OR_POLICY_GAP");
    const evidence = routingEvidence(coverage, evaluateSafaraBootstrapCoverage(facts()));
    expect(() => routeCompleteCoverage(coverage, { ...evidence,
      fact_support: evidence.fact_support.filter((branch: any) => branch.fact_id !== gap.fact_id) })).toThrow(/support/u);
    expect(() => routeCompleteCoverage(coverage, { ...evidence,
      fact_support: [...evidence.fact_support, evidence.fact_support[0]] })).toThrow(/support/u);
    expect(() => routeCompleteCoverage(coverage, { ...evidence, fact_support: evidence.fact_support.map((branch: any,
      index: number) => index ? branch : { ...branch, support: [{ ...branch.support[0], kind: "policy" }] }) })).toThrow(/support/u);
  });
  it("executes a bounded route, suspends for review, and resumes only from external acceptance", async () => {
    const coverage = workflowCoverage(evaluateSafaraBootstrapCoverage(facts()));
    const routes = routeCompleteCoverage(coverage as any, routingEvidence(coverage,
      evaluateSafaraBootstrapCoverage(facts())));
    const route = routes[0]!; const hash = "a".repeat(64); const called: string[] = [];
    const suspended: any = await executeGapToReviewSuspension(route, async (agentId, factId, support) => {
      called.push(agentId); expect(factId).toBe(route.fact_id); expect(support).toEqual(route.support_branch); return {
      attempt_id: "attempt.one", proposal_id: "proposal.one", proposal_hash: hash,
      validation_id: "validation.one", validation_status: "valid" }; });
    expect(called).toEqual([route.agent_id]); expect(suspended).toMatchObject({ state: "GOVERNED_SUSPENSION",
      suspension_reason: "REVIEW_REQUIRED", publication_id: null });
    let authority: any = recordKnowledgeReview(suspended, { review_id: "review.one", outcome: "ACCEPTED",
      review_round: 1, predecessor_review_id: null, reviewed_commit: "a".repeat(40), reviewed_artifact_hash: hash,
      required_finding_ids: [], reviewed_finding_ids: [], qualifying_regression: false,
      event_id: "event.review.external", evidence_id: "review.one", occurred_at: "2026-08-13T00:00:00+00:00" });
    authority = recordAcceptedPublication(authority, { publication_id: "publication.one", review_id: "review.one",
      reviewed_commit: "a".repeat(40), artifact_hash: hash, authority_evidence_id: "authority.one",
      event_id: "event.publication.external", evidence_id: "authority.one", occurred_at: "2026-08-13T00:00:00+00:00" });
    expect(() => consumeAcceptedAuthority(suspended, { publication_id: "publication.fake" },
      { resume_id: "resume.one" })).toThrow();
    const resumed: any = consumeAcceptedAuthority(suspended, authority, { resume_id: "resume.one" });
    expect(resumed.state).toBe("COVERAGE_RERUN_PENDING");
  });
  it("suspends duplicate proposals and no-progress reruns without another execution", async () => {
    const wording = "Sensitive data must be classified.";
    const meaning = createGovernedNormalizedMeaningArtifact({ artifact_id: "meaning.replay.1", lifecycle: "accepted",
      meaning_id: "meaning.replay", semantic_atoms: [{ atom_id: "atom.classify", modality: "require",
        predicate: "classify", object: "sensitive-data", qualifier_ids: [] }],
      evidence_surface_hashes: [governedSurfaceHash(wording)], reviewer_evidence_id: "evidence.meaning.replay" });
    const semantics = { layer: "policy_taxonomy", decisions: [{ subject_id: "ces.data", decision: "ADD", target_id: "policy.data" }],
      resulting_concept_or_policy: { id: "policy.data", obligation_or_definition: wording,
        normalized_meaning_artifact_id: meaning.artifact_id, support_ids: ["ces.data"] },
      lineage: [{ subject_id: "ces.data", source_release_id: "owasp.asvs.5-0-0", raw_concept_id: "raw.asvs.v14-1-1" }],
      comparisons: [{ subject_id: "ces.data", target_id: "policy.access", relationship: "distinct" }] };
    const coverage = workflowCoverage(evaluateSafaraBootstrapCoverageV3(facts()));
    const route = routeCompleteCoverage(coverage, routingEvidence(coverage,
      evaluateSafaraBootstrapCoverageV3(facts())))[0]!;
    const suspended: any = await executeGapToReviewSuspension(route, async () => ({ attempt_id: "attempt.replay.1",
      proposal_id: "proposal.replay.1", proposal_hash: "b".repeat(64), validation_id: "validation.replay.1",
      validation_status: "valid" }));
    const rejected: any = recordKnowledgeReview(suspended, { review_id: "review.replay.reject",
      outcome: "NOT ACCEPTED", review_round: 1, predecessor_review_id: null, reviewed_commit: "d".repeat(40),
      reviewed_artifact_hash: "b".repeat(64), required_finding_ids: ["required.replay.1"], reviewed_finding_ids: [],
      qualifying_regression: false, event_id: "event.review.replay.reject", evidence_id: "review.replay.reject",
      occurred_at: "2026-08-13T00:00:00+00:00" });
    let ledger: any = createNonConvergenceLedger({ ledger_id: "ledger.replay",
      gap_fingerprint: rejected.gap.gap_fingerprint, fact_id: rejected.gap.fact_id,
      earliest_incomplete_layer: rejected.gap.earliest_incomplete_layer,
      attempt_policy: { policy_id: "policy.attempts", policy_version: "1.0.0", max_attempts: 2,
        reviewer_evidence_id: "evidence.attempts" } });
    ledger = recordReplayAttempt(ledger, { attempt_id: "attempt.replay.1", proposal_id: "proposal.replay.1",
      proposal_hash: "b".repeat(64), proposal_semantics: semantics, resolve_meaning: () => meaning,
      authorization: { kind: "INITIAL" } });
    const duplicate: any = recordReplayAttempt(ledger, { attempt_id: "attempt.replay.2", proposal_id: "proposal.replay.2",
      proposal_hash: "c".repeat(64), proposal_semantics: semantics, resolve_meaning: () => meaning,
      authorization: { kind: "NOT_ACCEPTED_REMEDIATION", workflow: rejected,
        review_id: "review.replay.reject" } });
    expect(duplicate.suspension_reason).toBe("DUPLICATE_PROPOSAL");
    const noProgress: any = evaluatePostPublicationRerun(ledger, { fact_id: rejected.gap.fact_id,
      earliest_incomplete_layer: rejected.gap.earliest_incomplete_layer,
      gap_fingerprint: rejected.gap.gap_fingerprint });
    expect(noProgress).toMatchObject({ outcome: "GOVERNED_SUSPENSION", should_execute_agent: false,
      ledger: { suspension_reason: "NO_PROGRESS" } });
  });
});
