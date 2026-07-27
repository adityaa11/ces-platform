import { calculateCoverage } from "@company/ces-atlas-coverage";
import { createSemanticCollection } from "@company/ces-semantic-record-schema";
import { describe, expect, it } from "vitest";
import {
  projectApprovedModel,
  publishApprovedProjectModel,
} from "./index.js";

const hash = (character: string) => `sha256:${character.repeat(64)}`;
const sourceRevision = "safara.rev.0123456789ab";
const lexiconRevision = "safara.lexicon.0123456789ab";
const conceptId = "safara.concept.entity.payment.01234567";
const unitId = "safara.unit.00001.01234567";
const common = {
  schema_version: "1.0.0" as const,
  project_id: "safara",
  source_revision_id: sourceRevision,
  lexicon_revision_id: lexiconRevision,
  title: "Remaining payment",
  statement: "Only accepted payments reduce the remaining payment.",
  source_unit_ids: [unitId],
  concept_ids: [conceptId],
  origin: "explicit" as const,
  review_state: "candidate" as const,
};
const semantic = createSemanticCollection({
  project_id: "safara",
  source_revision_id: sourceRevision,
  lexicon_revision_id: lexiconRevision,
  source_unit_ids: [unitId],
  concept_ids: [conceptId],
  records: [{
    ...common,
    id: "safara.semantic.accepted-payment",
    kind: "business_rule",
    constraint: "Pending and rejected payments do not reduce balance.",
  }, {
    ...common,
    id: "safara.semantic.remaining-calculation",
    kind: "calculation",
    output_concept_id: conceptId,
    formula: "invoice - accepted payments",
    input_concept_ids: [conceptId],
  }],
});
const coverage = calculateCoverage({
  source_revision_id: sourceRevision,
  semantic_collection_id: semantic.id,
  source_unit_ids: [unitId],
  candidate_ids: semantic.records.map(({ id }) => id),
  entries: [{
    source_unit_id: unitId,
    normative: true,
    disposition: "covered",
    candidate_ids: semantic.records.map(({ id }) => id),
  }],
  candidate_evidence: semantic.records.map(({ id }) => ({
    candidate_id: id,
    source_unit_ids: [unitId],
    supported: true,
    distortion_detected: false,
  })),
});
const review = {
  status: "reviewed" as const,
  source_revision_id: sourceRevision,
  lexicon_revision_id: lexiconRevision,
  semantic_revision_id: semantic.id,
  decision_hash: hash("d"),
  approved_by: ["product-owner"],
  approved_at: "2026-07-27T23:00:00+07:00",
  reviewed_payloads: {
    "safara.semantic.accepted-payment": {
      constraint: "Pending and rejected payments do not reduce balance.",
    },
    "safara.semantic.remaining-calculation": {
      output_concept_id: conceptId,
      formula: "invoice - accepted payments",
      input_concept_ids: [conceptId],
    },
  },
};
const base = {
  project_id: "safara",
  source_revision_id: sourceRevision,
  source_content_hash: hash("a"),
  lexicon_revision_id: lexiconRevision,
  lexicon_content_hash: hash("b"),
  concepts: [{
    id: conceptId,
    kind: "entity" as const,
    canonical_label: "Payment",
    aliases: ["Pembayaran"],
    source_unit_ids: [unitId],
  }],
  semantic_collection: semantic,
  coverage_report: coverage,
  review,
};

describe("DAPE-007 ApprovedProjectModel", () => {
  it("publishes an immutable deterministic canonical model", () => {
    const first = publishApprovedProjectModel(base);
    const second = publishApprovedProjectModel(base);
    expect(first).toEqual(second);
    expect(first.records).toHaveLength(2);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("publishes canonically while reporting consumer projection gaps", () => {
    const model = publishApprovedProjectModel(base);
    const projection = projectApprovedModel(model, "legacy-core");
    expect(projection.status).toBe("partial");
    expect(projection.projected_record_ids).toEqual(["safara.semantic.accepted-payment"]);
    expect(projection.gaps).toEqual([{
      semantic_record_id: "safara.semantic.remaining-calculation",
      classification: "projection_gap",
      reason: "No faithful legacy projection for calculation",
    }]);
  });

  it("fails on incomplete coverage, mixed revisions, missing review and agent metadata", () => {
    const blockedCoverage = calculateCoverage({
      source_revision_id: sourceRevision,
      semantic_collection_id: semantic.id,
      source_unit_ids: [unitId, "safara.unit.00002.abcdefgh"],
      candidate_ids: semantic.records.map(({ id }) => id),
      entries: [{
        source_unit_id: unitId, normative: true, disposition: "covered",
        candidate_ids: semantic.records.map(({ id }) => id),
      }, {
        source_unit_id: "safara.unit.00002.abcdefgh", normative: true,
        disposition: "uncovered", candidate_ids: [],
      }],
      candidate_evidence: coverage.candidate_evidence,
    });
    expect(() => publishApprovedProjectModel({ ...base, coverage_report: blockedCoverage }))
      .toThrow("incomplete_coverage");
    expect(() => publishApprovedProjectModel({
      ...base, review: { ...review, source_revision_id: "safara.rev.stale" },
    })).toThrow("Mixed revision");
    expect(() => publishApprovedProjectModel({
      ...base, review: { ...review, status: "review_required" },
    })).toThrow("requires completed review");
    expect(() => publishApprovedProjectModel({
      ...base,
      review: {
        ...review,
        reviewed_payloads: {
          ...review.reviewed_payloads,
          "safara.semantic.accepted-payment": {
            constraint: "Valid rule",
            provider: "agent-provider",
          },
        },
      },
    })).toThrow("Agent metadata");
  });
});
