import { calculateCoverage } from "@company/ces-atlas-coverage";
import { describe, expect, it } from "vitest";
import {
  compileCoverageAwareReview,
  coverageReviewCandidateHash,
} from "./index.js";

const sourceRevision = "safara.rev.0123456789ab";
const lexiconRevision = "safara.lexicon.0123456789ab";
const semanticRevision = "safara.semantics.0123456789ab";
const units = ["safara.unit.00001.aaaa1111", "safara.unit.00002.bbbb2222"];
const candidateCore = {
  id: "safara.candidate.rule-one",
  source_revision_id: sourceRevision,
  lexicon_revision_id: lexiconRevision,
  semantic_revision_id: semanticRevision,
  source_unit_ids: [units[0]!],
  payload: { kind: "business_rule", statement: "Quota cannot be exceeded" },
};
const candidate = {
  ...candidateCore,
  candidate_hash: coverageReviewCandidateHash(candidateCore),
};
const coverage = calculateCoverage({
  source_revision_id: sourceRevision,
  semantic_collection_id: semanticRevision,
  source_unit_ids: units,
  candidate_ids: [candidate.id],
  entries: [
    { source_unit_id: units[0]!, normative: true, disposition: "covered",
      candidate_ids: [candidate.id] },
    { source_unit_id: units[1]!, normative: true, disposition: "uncovered",
      candidate_ids: [] },
  ],
  candidate_evidence: [{
    candidate_id: candidate.id, source_unit_ids: [units[0]!],
    supported: true, distortion_detected: false,
  }],
});
const base = {
  source_revision_id: sourceRevision,
  lexicon_revision_id: lexiconRevision,
  semantic_revision_id: semanticRevision,
  source_unit_ids: units,
  candidates: [candidate],
  coverage_report: coverage,
};
const reviewer = { kind: "human" as const, identity: "product-owner" };

describe("DAPE-006 coverage-aware review", () => {
  it("approves candidates and creates omitted records from source", () => {
    const result = compileCoverageAwareReview({
      ...base,
      decisions: [{
        id: "review.approve.rule-one",
        action: "approve",
        candidate_ids: [candidate.id],
        source_unit_ids: [units[0]!],
        expected_candidate_hashes: { [candidate.id]: candidate.candidate_hash },
        reviewer,
      }, {
        id: "review.create.missing-rule",
        action: "create_from_source",
        candidate_ids: [],
        source_unit_ids: [units[1]!],
        expected_candidate_hashes: {},
        replacement_payloads: [{
          kind: "validation", statement: "Rejected payment requires a reason",
        }],
        reviewer,
      }],
    });
    expect(result.status).toBe("reviewed");
    expect(result.records.map(({ review_action }) => review_action).sort())
      .toEqual(["approved", "created"]);
    expect(result.source_dispositions[units[1]!]).toBe("represented");
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("supports split and deterministic remapping", () => {
    const result = compileCoverageAwareReview({
      ...base,
      coverage_report: calculateCoverage({
        source_revision_id: sourceRevision,
        semantic_collection_id: semanticRevision,
        source_unit_ids: units,
        candidate_ids: [candidate.id],
        entries: [
          { source_unit_id: units[0]!, normative: true, disposition: "covered",
            candidate_ids: [candidate.id] },
          { source_unit_id: units[1]!, normative: false, disposition: "context_only",
            candidate_ids: [], reason: "Heading" },
        ],
        candidate_evidence: [{
          candidate_id: candidate.id, source_unit_ids: [units[0]!],
          supported: true, distortion_detected: false,
        }],
      }),
      decisions: [{
        id: "review.split.rule-one",
        action: "split",
        candidate_ids: [candidate.id],
        source_unit_ids: [units[0]!],
        expected_candidate_hashes: { [candidate.id]: candidate.candidate_hash },
        replacement_payloads: [{ statement: "Rule A" }, { statement: "Rule B" }],
        reviewer,
      }],
    });
    expect(result.remapping[candidate.id]).toHaveLength(2);
    expect(result.records.every(({ review_action }) => review_action === "split")).toBe(true);
  });

  it("fails closed on stale, agent, unrelated-source, and missing decisions", () => {
    expect(() => compileCoverageAwareReview({
      ...base,
      decisions: [],
    })).toThrow("require coverage-aware review");
    expect(() => compileCoverageAwareReview({
      ...base,
      decisions: [{
        id: "review.stale",
        action: "approve",
        candidate_ids: [candidate.id],
        source_unit_ids: [units[0]!],
        expected_candidate_hashes: { [candidate.id]: `sha256:${"f".repeat(64)}` },
        reviewer,
      }],
    })).toThrow("Stale review decision");
    expect(() => compileCoverageAwareReview({
      ...base,
      decisions: [{
        id: "review.agent",
        action: "approve",
        candidate_ids: [candidate.id],
        source_unit_ids: [units[0]!],
        expected_candidate_hashes: { [candidate.id]: candidate.candidate_hash },
        reviewer: { kind: "agent", identity: "critic" } as never,
      }],
    })).toThrow();
    expect(() => compileCoverageAwareReview({
      ...base,
      decisions: [{
        id: "review.unrelated",
        action: "approve",
        candidate_ids: [candidate.id],
        source_unit_ids: ["other.unit.00001"],
        expected_candidate_hashes: { [candidate.id]: candidate.candidate_hash },
        reviewer,
      }],
    })).toThrow("unknown source unit");
  });
});
