import { describe, expect, it } from "vitest";
import {
  BUILT_IN_SEMANTIC_KIND_DEFINITIONS,
  classifyLegacyProjection,
  createMultilingualStatement,
  createSemanticKindRegistry,
  createSemanticCollection,
  createTerminologyProposal,
  createTranslationEquivalenceProposal,
  detectLanguage,
  resolveSemanticKind,
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
  it("preserves multilingual source wording and governs equivalence proposals", () => {
    expect(detectLanguage("Pengguna harus menyetujui pembayaran.")).toMatchObject({
      detected_language: "id",
      language_detection_method: "deterministic",
    });
    const representation = createMultilingualStatement({
      original_statement: "Pengguna harus menyetujui pembayaran.",
      canonical_statement: "The user must approve the payment.",
      canonical_language: "en",
    });
    expect(representation).toMatchObject({
      original_language: { detected_language: "id" },
      translation_status: "review_required",
      translation_source_unit_ids: [],
    });
    expect(createTranslationEquivalenceProposal({
      from_record_id: "project.record.id",
      to_record_id: "project.record.en",
      confidence: 0.9,
      rationale: "Statements express the same governed obligation.",
    })).toMatchObject({ review_status: "pending", source_unit_ids: [] });
    expect(createTerminologyProposal({
      source_terms: [{ language: "id", value: "Terhambat" }],
      canonical_concept: "project.concept.readiness-blocked",
      source_unit_ids: ["project.unit.00001.aaaaaaaa"],
    })).toMatchObject({ status: "pending" });
  });

  it("registers all hardening categories with deterministic unknown fallback", () => {
    const registry = createSemanticKindRegistry();
    expect(BUILT_IN_SEMANTIC_KIND_DEFINITIONS).toHaveLength(17);
    expect(registry.definitions.map(({ id }) => id)).toContain("ces.kind.capability");
    expect(resolveSemanticKind(registry, "ces.kind.validation-constraint"))
      .toMatchObject({ classification_status: "classified" });
    expect(resolveSemanticKind(registry, "provider.kind.temperature-excursion"))
      .toMatchObject({
        requested_kind: "provider.kind.temperature-excursion",
        semantic_kind_id: "ces.kind.unknown",
        classification_status: "classification_required",
      });
  });

  it("pins organization-specific kinds without changing built-ins", () => {
    const registry = createSemanticKindRegistry({
      organization_id: "cold-chain-co",
      organization_definitions: [{
        id: "cold-chain.kind.temperature-release",
        schema_version: "1.0.0",
        registered_by: "organization",
        description: "Temperature-history release restriction.",
        representation_kind: "extensible_record",
        representation_status: "structured_extension",
      }],
    });
    expect(resolveSemanticKind(registry, "cold-chain.kind.temperature-release"))
      .toMatchObject({
        semantic_kind_id: "cold-chain.kind.temperature-release",
        classification_status: "classified",
      });
    expect(() => createSemanticKindRegistry({
      organization_definitions: [{
        id: "unowned.kind.example",
        schema_version: "1.0.0",
        registered_by: "organization",
        description: "Invalid unowned extension.",
        representation_kind: "extensible_record",
        representation_status: "structured_extension",
      }],
    })).toThrow("organization_id");
  });

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
