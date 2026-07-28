import { describe, expect, it } from "vitest";
import {
  calculateAtlasQualityEvidence,
  calculateSafaraHardeningGate,
  type AtlasQualityEvidenceInput,
} from "./index.js";

const hash = (character: string) => `sha256:${character.repeat(64)}`;
const ruleKeys = Array.from({ length: 10 }, (_, index) =>
  `rule.primary.${String(index + 1).padStart(2, "0")}`);

function input(
  stages: readonly AtlasQualityEvidenceInput["mappings"][number]["stage"][]
    = ruleKeys.map(() => "direct_extraction"),
): AtlasQualityEvidenceInput {
  return {
    schema_version: "1.0.0",
    run_id: "safara.live.20260728",
    versions: {
      provider_id: "gemini",
      model_id: "gemini-2.5-flash",
      model_alias: "atlas-default",
      agent_version: "1.0.0",
      prompt_contract_version: "1.0.0",
      source_revision_id: "safara.rev.0123456789ab",
      source_content_hash: hash("a"),
      lexicon_revision_id: "safara.lexicon.0123456789ab",
      lexicon_content_hash: hash("b"),
      semantic_schema_version: "1.0.0",
      oracle_id: "safara.oracle.20260727",
      oracle_content_hash: hash("c"),
    },
    reviewer: {
      identity: "product-owner",
      reviewed_at: "2026-07-28T00:00:00+07:00",
    },
    mappings: ruleKeys.map((oracleKey, index) => ({
      oracle_key: oracleKey,
      mandatory: true,
      normative: true,
      stage: stages[index] ?? "missing",
      candidate_ids: stages[index] === "human_created"
        ? [] : [`safara.candidate.${String(index + 1).padStart(2, "0")}`],
      approved_record_ids: stages[index] === "missing"
        ? [] : [`safara.record.${String(index + 1).padStart(2, "0")}`],
      supported: true,
      distorted: false,
    })),
    required_primary_rule_keys: ruleKeys,
    artifact_hashes: {
      "candidate-analysis": hash("d"),
      "coverage-report": hash("e"),
      "approved-project-model": hash("f"),
    },
  };
}

describe("DAPE-008R real-provider quality evidence", () => {
  it("evaluates the complete Safara lifecycle gate with stage attribution", () => {
    const gateInput = {
      schema_version: "1.0.0" as const,
      qualification_id: "safara.qualification.20260728",
      oracle_id: "safara-atlas-hardening-2026-07-28",
      fixture_evidence_hash: hash("1"),
      real_provider_evidence_hash: hash("2"),
      reviewer: { kind: "human" as const, identity: "product-owner",
        reviewed_at: "2026-07-28T19:00:00+07:00" },
      metrics: {
        primary_rules_total: 10 as const, primary_rules_after_retry: 10,
        workflow_areas_total: 10 as const, workflow_areas_represented: 10,
        broader_normative_recall_before_review: 0.9,
        final_reviewed_normative_coverage: 1,
        unsupported_approved_records: 0, distorted_approved_records: 0,
        approved_records_total: 48, approved_records_with_source: 48,
        exact_text_available_total: 48, exact_text_preserved: 48,
        ambiguities_total: 2, ambiguities_surfaced: 2,
        conflicts_total: 1, conflicts_surfaced: 1,
      },
      lifecycle_checks: {
        deterministic_artifacts: true, proposed_graph_available: true,
        proposal_authoritative: false, preapproval_downstream_execution_allowed: false,
        proposed_artifacts_valid: true, approved_artifacts_valid: true,
      },
      artifact_hashes: { "proposed-model": hash("3"), "approved-model": hash("4") },
      claim_scope: "safara_fixture_and_atlas_lifecycle_only" as const,
      general_domain_coverage_claimed: false as const,
    };
    expect(calculateSafaraHardeningGate(gateInput).decision).toBe("pass");
    const failed = calculateSafaraHardeningGate({
      ...gateInput,
      metrics: { ...gateInput.metrics, workflow_areas_represented: 9 },
    });
    expect(failed.decision).toBe("failed");
    expect(failed.gates).toContainEqual({
      id: "safara.gate.workflow-areas", passed: false, failure_stage: "assignment",
    });
  });

  it("calculates direct, retry, critic, and human attribution honestly", () => {
    const evidence = calculateAtlasQualityEvidence(input([
      "direct_extraction", "direct_extraction", "direct_extraction",
      "critic_detection", "targeted_retry", "targeted_retry",
      "human_created", "human_created", "human_corrected", "human_corrected",
    ]));
    expect(evidence.metrics).toMatchObject({
      direct_recall: 0.3,
      post_retry_recall: 0.6,
      final_normative_coverage: 1,
      critic_detected_keys: 1,
      human_created_keys: 2,
      human_corrected_keys: 2,
    });
    expect(evidence.release_decision).toBe("pass");
    expect(Object.isFrozen(evidence)).toBe(true);
  });

  it("does not hide poor direct recall behind final human coverage", () => {
    const evidence = calculateAtlasQualityEvidence(input(
      ruleKeys.map(() => "human_created"),
    ));
    expect(evidence.metrics.direct_recall).toBe(0);
    expect(evidence.metrics.final_normative_coverage).toBe(1);
    expect(evidence.metrics.human_created_keys).toBe(10);
  });

  it("requires every primary rule to be directly found or explicitly missing", () => {
    const value = input();
    value.mappings = value.mappings.slice(1);
    expect(() => calculateAtlasQualityEvidence(value)).toThrow("lack explicit");
    const missing = input([
      "missing", ...ruleKeys.slice(1).map(() => "direct_extraction" as const),
    ]);
    const evidence = calculateAtlasQualityEvidence(missing);
    expect(evidence.release_decision).toBe("review_required");
    expect(evidence.metrics.final_normative_coverage).toBe(0.9);
  });

  it("fails quality for unsupported approval and rejects version/evidence fraud", () => {
    const unsupported = input();
    unsupported.mappings[0] = { ...unsupported.mappings[0]!, supported: false };
    expect(calculateAtlasQualityEvidence(unsupported).release_decision)
      .toBe("quality_gate_failed");
    const fixture = input();
    fixture.versions.provider_id = "fixture";
    expect(() => calculateAtlasQualityEvidence(fixture)).toThrow("Fixture providers");
    expect(() => calculateAtlasQualityEvidence({
      ...input(),
      api_key: "must-not-appear",
    } as never)).toThrow("Forbidden evidence field");
    expect(() => calculateAtlasQualityEvidence({
      ...input(),
      reviewer: { identity: "Bearer leaked-token", reviewed_at: "2026-07-28T00:00:00+07:00" },
    })).toThrow("Unredacted");
  });
});
