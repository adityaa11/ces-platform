import { describe, expect, it } from "vitest";
import {
  assertPipelineCoverageComplete,
  assertPublishableCoverage,
  calculateCoverage,
  calculatePipelineCoverage,
  createCompletenessCriticReport,
  createTargetedRetry,
} from "./index.js";

const units = ["safara.unit.00001.aaaa1111", "safara.unit.00002.bbbb2222"];
const candidates = ["safara.semantic.rule-one"];
const base = {
  source_revision_id: "safara.rev.0123456789ab",
  semantic_collection_id: "safara.semantics.0123456789ab",
  source_unit_ids: units,
  candidate_ids: candidates,
  candidate_evidence: [{
    candidate_id: candidates[0]!,
    source_unit_ids: [units[0]!],
    supported: true,
    distortion_detected: false,
  }],
};

describe("DAPE-005 Atlas coverage gate", () => {
  it("creates deterministic source-validated completeness findings", () => {
    const coverage = calculatePipelineCoverage({
      source_revision_id: base.source_revision_id,
      semantic_kind_registry_id: "ces.semantic-kinds.0123456789ab",
      source_unit_ids: units,
      candidate_sources: { "project.candidate.one": [units[0]!] },
      normalized_record_ids: ["project.record.one"],
      workflow_node_ids: [],
      graph_node_ids: [],
      source_coverage: [
        { source_unit_id: units[0]!, normative: true, current_stage: "normalized",
          candidate_ids: ["project.candidate.one"], normalized_record_ids: ["project.record.one"],
          workflow_node_ids: [], graph_node_ids: [],
          stage_history: [{ stage: "normalized", status: "included" }] },
        { source_unit_id: units[1]!, normative: true, current_stage: "unmapped",
          candidate_ids: [], normalized_record_ids: [], workflow_node_ids: [], graph_node_ids: [],
          stage_history: [{ stage: "candidate", status: "lost", reason: "No candidate" }] },
      ],
      record_coverage: [{ record_id: "project.record.one",
        semantic_kind_id: "ces.kind.unknown", candidate_ids: ["project.candidate.one"],
        source_unit_ids: [units[0]!] }],
    });
    const finding = {
      finding_type: "uncovered_normative_source" as const,
      pipeline_stage: "candidate" as const,
      source_unit_ids: [units[1]!],
      candidate_ids: [],
      record_ids: [],
      semantic_kind_ids: ["ces.kind.unknown"],
      severity: "blocking" as const,
      statement: "Normative source produced no candidate.",
      recommended_action: "targeted_retry" as const,
      resolution_history: [],
    };
    const first = createCompletenessCriticReport({ coverage, findings: [finding] });
    const second = createCompletenessCriticReport({ coverage, findings: [finding] });
    expect(first).toEqual(second);
    expect(first.findings[0]).toMatchObject({ status: "open", pipeline_stage: "candidate" });
    expect(first.counts.blocking_open).toBe(1);
    const resolved = createCompletenessCriticReport({
      coverage,
      findings: [{ ...finding, resolution_history: [{
        sequence: 1, actor_type: "human" as const, actor_id: "reviewer-1",
        action: "resolved" as const, note: "Created missing record.",
      }] }],
    });
    expect(resolved.findings[0]?.status).toBe("resolved");
    expect(resolved.findings).toHaveLength(1);
    expect(() => createCompletenessCriticReport({
      coverage,
      findings: [{ ...finding, source_unit_ids: ["invented.unit"] }],
    })).toThrow("Unknown finding source unit");
  });

  it("tracks deterministic stage lineage for built-in, unknown, and organization kinds", () => {
    const recordIds = ["project.record.unknown", "project.record.temperature"];
    const input = {
      source_revision_id: base.source_revision_id,
      semantic_kind_registry_id: "project.semantic-kinds.0123456789ab",
      source_unit_ids: units,
      candidate_sources: {
        "project.candidate.unknown": [units[0]!],
        "project.candidate.temperature": [units[0]!, units[1]!],
      },
      normalized_record_ids: recordIds,
      workflow_node_ids: ["project.workflow.release"],
      graph_node_ids: ["project.graph.release"],
      source_coverage: [
        {
          source_unit_id: units[1]!, normative: true, current_stage: "unmapped" as const,
          candidate_ids: ["project.candidate.temperature"], normalized_record_ids: [],
          workflow_node_ids: [], graph_node_ids: [],
          stage_history: [
            { stage: "candidate" as const, status: "included" as const },
            { stage: "assigned" as const, status: "lost" as const, reason: "No workflow assignment" },
          ],
        },
        {
          source_unit_id: units[0]!, normative: true, current_stage: "projected" as const,
          candidate_ids: ["project.candidate.unknown", "project.candidate.temperature"],
          normalized_record_ids: recordIds,
          workflow_node_ids: ["project.workflow.release"],
          graph_node_ids: ["project.graph.release"],
          stage_history: [{ stage: "projected" as const, status: "included" as const }],
        },
      ],
      record_coverage: [
        { record_id: recordIds[0]!, semantic_kind_id: "ces.kind.unknown",
          candidate_ids: ["project.candidate.unknown"], source_unit_ids: [units[0]!] },
        { record_id: recordIds[1]!, semantic_kind_id: "cold-chain.kind.temperature-release",
          candidate_ids: ["project.candidate.temperature"], source_unit_ids: units },
      ],
    };
    const first = calculatePipelineCoverage(input);
    const second = calculatePipelineCoverage({
      ...input,
      source_coverage: [...input.source_coverage].reverse(),
      record_coverage: [...input.record_coverage].reverse(),
    });
    expect(first).toEqual(second);
    expect(first.counts).toMatchObject({
      unmapped_normative: 1, unknown_records: 1, organization_records: 1,
    });
    expect(first.loss_by_stage.assigned).toBe(1);
    expect(() => assertPipelineCoverageComplete(first)).toThrow("unmapped normative");
  });

  it("rejects missing links and attach-all provenance", () => {
    expect(() => calculatePipelineCoverage({
      source_revision_id: base.source_revision_id,
      semantic_kind_registry_id: "ces.semantic-kinds.0123456789ab",
      source_unit_ids: units,
      candidate_sources: { "project.candidate.one": [units[0]!] },
      normalized_record_ids: ["project.record.one"],
      workflow_node_ids: [],
      graph_node_ids: [],
      source_coverage: units.map((source_unit_id) => ({
        source_unit_id, normative: true, current_stage: "normalized" as const,
        candidate_ids: source_unit_id === units[0] ? ["project.candidate.one"] : [],
        normalized_record_ids: source_unit_id === units[0] ? ["project.record.one"] : [],
        workflow_node_ids: [], graph_node_ids: [],
        stage_history: [{ stage: "normalized" as const, status: "included" as const }],
      })),
      record_coverage: [{
        record_id: "project.record.one", semantic_kind_id: "ces.kind.business-rule",
        candidate_ids: ["project.candidate.one"], source_unit_ids: units,
      }],
    })).toThrow("not inherited");
  });

  it("publishes only complete and supported coverage", () => {
    const report = calculateCoverage({
      ...base,
      entries: [
        { source_unit_id: units[0]!, normative: true, disposition: "covered",
          candidate_ids: candidates },
        { source_unit_id: units[1]!, normative: false, disposition: "context_only",
          candidate_ids: [], reason: "Document heading" },
      ],
    });
    expect(report.status).toBe("success");
    expect(() => assertPublishableCoverage(report)).not.toThrow();
  });

  it("distinguishes incomplete recall from unsupported precision", () => {
    const incomplete = calculateCoverage({
      ...base,
      entries: [
        { source_unit_id: units[0]!, normative: true, disposition: "covered",
          candidate_ids: candidates },
        { source_unit_id: units[1]!, normative: true, disposition: "uncovered",
          candidate_ids: [] },
      ],
    });
    expect(incomplete.status).toBe("incomplete_coverage");
    const unsupported = calculateCoverage({
      ...base,
      candidate_evidence: [{ ...base.candidate_evidence[0]!, supported: false,
        diagnostic: "Citation does not support the claim" }],
      entries: [
        { source_unit_id: units[0]!, normative: true, disposition: "covered",
          candidate_ids: candidates },
        { source_unit_id: units[1]!, normative: false, disposition: "context_only",
          candidate_ids: [], reason: "Heading" },
      ],
    });
    expect(unsupported.status).toBe("unsupported_candidate");
    expect(() => assertPublishableCoverage(unsupported)).toThrow("unsupported_candidate");
  });

  it("creates bounded retries for only blocking units", () => {
    const report = calculateCoverage({
      ...base,
      entries: [
        { source_unit_id: units[0]!, normative: true, disposition: "covered",
          candidate_ids: candidates },
        { source_unit_id: units[1]!, normative: true, disposition: "uncovered",
          candidate_ids: [] },
      ],
      critic_findings: [{
        id: "atlas.finding.omission",
        kind: "likely_omission",
        source_unit_ids: [units[1]!],
        candidate_ids: [],
        severity: "blocking",
        statement: "Likely missing rule",
      }],
    });
    const retry = createTargetedRetry({ report, maximum_attempts: 2 });
    expect(retry?.source_unit_ids).toEqual([units[1]]);
    expect(createTargetedRetry({
      report: calculateCoverage({ ...base, entries: report.entries,
        critic_findings: report.critic_findings,
        retry_history: [retry!] }),
      maximum_attempts: 1,
    })).toBeUndefined();
  });

  it("rejects silent exclusions, attach-all provenance and incomplete maps", () => {
    expect(() => calculateCoverage({
      ...base,
      entries: [
        { source_unit_id: units[0]!, normative: true, disposition: "excluded_with_reason",
          candidate_ids: [] },
        { source_unit_id: units[1]!, normative: false, disposition: "context_only",
          candidate_ids: [], reason: "Heading" },
      ],
    })).toThrow("requires a reason");
    expect(() => calculateCoverage({
      ...base,
      entries: [{ source_unit_id: units[0]!, normative: true, disposition: "covered",
        candidate_ids: candidates }],
    })).toThrow("every source unit");
    expect(() => calculateCoverage({
      ...base,
      candidate_evidence: [{ ...base.candidate_evidence[0]!,
        source_unit_ids: [...units, "safara.unit.invented"] }],
      entries: [
        { source_unit_id: units[0]!, normative: true, disposition: "covered",
          candidate_ids: candidates },
        { source_unit_id: units[1]!, normative: false, disposition: "context_only",
          candidate_ids: [], reason: "Heading" },
      ],
    })).toThrow("Unknown source unit");
  });
});
