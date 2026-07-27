import { describe, expect, it } from "vitest";
import {
  classifyLegacyProjection,
  createSemanticCollection,
  SemanticRecordSchema,
} from "./index.js";

const tuple = {
  schema_version: "1.0.0" as const,
  project_id: "safara",
  source_revision_id: "safara.rev.0123456789ab",
  lexicon_revision_id: "safara.lexicon.0123456789ab",
  title: "Accepted payments",
  statement: "Only accepted payments reduce the remaining balance.",
  source_unit_ids: ["safara.unit.00001.01234567"],
  concept_ids: ["safara.concept.entity.payment.01234567"],
  origin: "explicit" as const,
  review_state: "candidate" as const,
};

const rule = {
  ...tuple,
  id: "safara.semantic.accepted-payment",
  kind: "business_rule" as const,
  constraint: "Pending and rejected payments do not reduce balance.",
};

describe("DAPE-003 semantic records", () => {
  it.each([
    ["functional_requirement", { action: "register", outcomes: ["Registration saved"] }],
    ["business_rule", { constraint: "Quota cannot be exceeded" }],
    ["permission", { actor_concept_id: tuple.concept_ids[0], action: "view",
      resource_concept_id: tuple.concept_ids[0], effect: "allow" }],
    ["validation", { subject_concept_id: tuple.concept_ids[0], predicate: "is valid",
      failure_behavior: "reject" }],
    ["calculation", { output_concept_id: tuple.concept_ids[0], formula: "a-b",
      input_concept_ids: tuple.concept_ids }],
    ["state_model", { subject_concept_id: tuple.concept_ids[0], states: ["a", "b"],
      transitions: [{ from: "a", to: "b", trigger: "accept" }] }],
    ["workflow", { steps: [{ order: 1, action: "submit" }, { order: 2, action: "review" }] }],
    ["data", { subject_concept_id: tuple.concept_ids[0],
      fields: [{ name: "reference", required: true }] }],
    ["report", { fields: ["balance"] }],
    ["acceptance_criterion", { scenario: "Accept payment", expected_result: "Balance decreases" }],
    ["deliverable", { deliverable: "Web application" }],
    ["nonfunctional_requirement", { quality_attribute: "confidentiality",
      constraint: "Authorized users only" }],
  ] as const)("validates %s records", (kind, detail) => {
    expect(SemanticRecordSchema.parse({ ...tuple, id: `safara.semantic.${kind}`,
      kind, ...detail }).kind).toBe(kind);
  });

  it("orders, hashes, and validates relationships deterministically", () => {
    const functional = SemanticRecordSchema.parse({
      ...tuple, id: "safara.semantic.register", kind: "functional_requirement",
      action: "register", outcomes: ["Registration saved"],
    });
    const input = {
      project_id: tuple.project_id,
      source_revision_id: tuple.source_revision_id,
      lexicon_revision_id: tuple.lexicon_revision_id,
      source_unit_ids: tuple.source_unit_ids,
      concept_ids: tuple.concept_ids,
      records: [rule, functional],
      relationships: [{
        id: "safara.relationship.governs",
        from_record_id: rule.id,
        to_record_id: functional.id,
        kind: "governs" as const,
        source_unit_ids: tuple.source_unit_ids,
      }],
    };
    const first = createSemanticCollection(input);
    const second = createSemanticCollection({ ...input, records: [...input.records].reverse() });
    expect(first).toEqual(second);
    expect(first.records.map(({ id }) => id)).toEqual([
      "safara.semantic.accepted-payment", "safara.semantic.register",
    ]);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("fails on unsupported provenance, references, revisions, and self relationships", () => {
    expect(() => SemanticRecordSchema.parse({
      ...rule, origin: "inferred",
    })).toThrow("rationale");
    expect(() => createSemanticCollection({
      project_id: tuple.project_id,
      source_revision_id: tuple.source_revision_id,
      lexicon_revision_id: tuple.lexicon_revision_id,
      source_unit_ids: tuple.source_unit_ids,
      concept_ids: [],
      records: [rule],
    })).toThrow("Unknown concept");
    expect(() => createSemanticCollection({
      project_id: tuple.project_id,
      source_revision_id: "safara.rev.other",
      lexicon_revision_id: tuple.lexicon_revision_id,
      source_unit_ids: tuple.source_unit_ids,
      concept_ids: tuple.concept_ids,
      records: [rule],
    })).toThrow("Revision tuple mismatch");
    expect(() => createSemanticCollection({
      project_id: tuple.project_id,
      source_revision_id: tuple.source_revision_id,
      lexicon_revision_id: tuple.lexicon_revision_id,
      source_unit_ids: tuple.source_unit_ids,
      concept_ids: tuple.concept_ids,
      records: [rule],
      relationships: [{
        id: "safara.relationship.self",
        from_record_id: rule.id, to_record_id: rule.id, kind: "depends_on",
        source_unit_ids: tuple.source_unit_ids,
      }],
    })).toThrow("Self relationship");
  });

  it("classifies legacy compatibility without silent loss", () => {
    expect(classifyLegacyProjection(SemanticRecordSchema.parse(rule)).classification)
      .toBe("lossless");
    const calculation = SemanticRecordSchema.parse({
      ...tuple, id: "safara.semantic.balance", kind: "calculation",
      output_concept_id: tuple.concept_ids[0], formula: "invoice-accepted",
      input_concept_ids: tuple.concept_ids,
    });
    expect(classifyLegacyProjection(calculation).classification).toBe("projection_gap");
  });
});
