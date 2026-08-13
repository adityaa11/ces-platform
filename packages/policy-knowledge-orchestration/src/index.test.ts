import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadManualSafaraDemandFacts } from "@company/ces-policy-manual-demand-adapter";
import { evaluateSafaraBootstrapCoverage, evaluateSafaraBootstrapCoverageV2,
  evaluateSafaraBootstrapCoverageV3, evaluateSafaraBootstrapCoverageV4 } from
  "@company/ces-policy-safara-bootstrap";
import { consumeAcceptedAuthority, executeGapToReviewSuspension, routeCompleteCoverage,
  retainMaterialFactSupport, semanticCoverageFingerprint } from "./index.js";
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
describe("AGB-014 Safara governed replay", () => {
  it("routes each historical gap by earliest incomplete layer and converges to v4 semantics", () => {
    const input = facts(); const versions = [evaluateSafaraBootstrapCoverage(input), evaluateSafaraBootstrapCoverageV2(input),
      evaluateSafaraBootstrapCoverageV3(input), evaluateSafaraBootstrapCoverageV4(input)];
    const routed = versions.map((version) => routeCompleteCoverage(workflowCoverage(version) as any,
      { occurred_at: "2026-08-13T00:00:00+00:00", expected_fact_count: 111 }));
    expect(new Set(routed.flat().map(({ agent_id }) => agent_id))).toEqual(new Set([
      "ces.source-knowledge-agent", "ces.canonicalization-agent", "ces.policy-taxonomy-agent"]));
    expect(routed.at(-1)).toEqual([]);
    const final = versions.at(-1)!; const counts = Object.fromEntries(["AWARENESS_EMITTED",
      "NO_SECURITY_AWARENESS_REQUIRED", "OUTSIDE_SOFTWARE_SCOPE", "DECISION_REQUIRED", "SOURCE_OR_POLICY_GAP"]
      .map((key) => [key, final.entries.filter(({ disposition }) => disposition === key).length]));
    expect(counts).toEqual({ AWARENESS_EMITTED: 82, NO_SECURITY_AWARENESS_REQUIRED: 24,
      OUTSIDE_SOFTWARE_SCOPE: 5, DECISION_REQUIRED: 0, SOURCE_OR_POLICY_GAP: 0 });
    expect(final.entries).toHaveLength(111); expect(semanticCoverageFingerprint(workflowCoverage(final) as any)).toHaveLength(64);
  });
  it("fails incomplete accounting, never routes decisions, and retains fact-local support", () => {
    const coverage = workflowCoverage(evaluateSafaraBootstrapCoverage(facts())) as any;
    expect(() => routeCompleteCoverage({ ...coverage, entries: coverage.entries.slice(1) },
      { occurred_at: "2026-08-13T00:00:00+00:00", expected_fact_count: 111 })).toThrow();
    const decisions = { ...coverage, entries: coverage.entries.map((entry: any) => ({ ...entry,
      disposition: "DECISION_REQUIRED", earliest_incomplete_layer: null })) };
    expect(routeCompleteCoverage(decisions, { occurred_at: "2026-08-13T00:00:00+00:00",
      expected_fact_count: 111 })).toEqual([]);
    expect(retainMaterialFactSupport("fact.1", [{ fact_id: "fact.1", support: "canonical.a" },
      { fact_id: "fact.2", support: "canonical.b" }])).toEqual([{ fact_id: "fact.1", support: "canonical.a" }]);
  });
  it("executes a bounded route, suspends for review, and resumes only from external acceptance", async () => {
    const routes = routeCompleteCoverage(workflowCoverage(evaluateSafaraBootstrapCoverage(facts())) as any,
      { occurred_at: "2026-08-13T00:00:00+00:00", expected_fact_count: 111 });
    const route = routes[0]!; const hash = "a".repeat(64); const called: string[] = [];
    const suspended: any = await executeGapToReviewSuspension(route, async (agentId) => { called.push(agentId); return {
      attempt_id: "attempt.one", proposal_id: "proposal.one", proposal_hash: hash,
      validation_id: "validation.one", validation_status: "valid" }; });
    expect(called).toEqual([route.agent_id]); expect(suspended).toMatchObject({ state: "GOVERNED_SUSPENSION",
      suspension_reason: "REVIEW_REQUIRED", publication_id: null });
    const resumed: any = consumeAcceptedAuthority(suspended, { review_id: "review.one",
      reviewed_commit: "a".repeat(40), artifact_hash: hash, publication_id: "publication.one",
      authority_evidence_id: "authority.one", resume_id: "resume.one" });
    expect(resumed.state).toBe("COVERAGE_RERUN_PENDING");
  });
});
