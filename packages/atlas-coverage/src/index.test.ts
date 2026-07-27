import { describe, expect, it } from "vitest";
import {
  assertPublishableCoverage,
  calculateCoverage,
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
