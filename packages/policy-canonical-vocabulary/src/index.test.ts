import { describe, expect, it } from "vitest";
import { CanonicalVocabularySchema, validateCanonicalVocabularyAgainstRawConcepts,
  validateCanonicalVocabularySuccessor } from "./index.js";
import { CES_POLICY_CANONICAL_VOCABULARY_V1,
  changeCanonicalConceptLifecycle,
  replaceRawMappingForSourceRenumbering } from "./representative-catalog.js";

describe("POL-007 canonical vocabulary", () => {
  it("requires raw support and rationale for every canonical concept", () => {
    const vocabulary = CES_POLICY_CANONICAL_VOCABULARY_V1;
    for (const concept of vocabulary.concepts) {
      const mappings = vocabulary.mappings.filter(({ canonical_concept_id }) =>
        canonical_concept_id === concept.concept_id);
      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.every(({ rationale }) => rationale.length > 0)).toBe(true);
    }
  });

  it("normalizes synonyms without duplicating canonical concepts", () => {
    const access = CES_POLICY_CANONICAL_VOCABULARY_V1.concepts
      .filter(({ concept_id }) => concept_id === "ces.access-authorization");
    expect(access).toHaveLength(1);
    expect(CES_POLICY_CANONICAL_VOCABULARY_V1.mappings.filter(({ canonical_concept_id }) =>
      canonical_concept_id === "ces.access-authorization")).toHaveLength(2);
  });

  it("keeps concerns and verification contexts semantically separate", () => {
    const concepts = CES_POLICY_CANONICAL_VOCABULARY_V1.concepts;
    expect(concepts.find(({ concept_id }) => concept_id === "ces.object-authorization-bypass")
      ?.semantic_kind).toBe("concern");
    expect(concepts.find(({ concept_id }) => concept_id === "ces.object-authorization-testing")
      ?.semantic_kind).toBe("verification_context");
  });

  it("records governed merge, split, and alias decisions", () => {
    expect(new Set(CES_POLICY_CANONICAL_VOCABULARY_V1.decisions.map(({ decision_kind }) =>
      decision_kind))).toEqual(new Set(["merge", "split", "alias"]));
    expect(CES_POLICY_CANONICAL_VOCABULARY_V1.decisions.every(({ status,
      reviewed_at, reviewer_evidence_id }) => status === "proposed" &&
      reviewed_at === null && reviewer_evidence_id === null)).toBe(true);
  });

  it("does not allow decision approval without human review evidence", () => {
    const decision = CES_POLICY_CANONICAL_VOCABULARY_V1.decisions[0]!;
    expect(() => CanonicalVocabularySchema.parse({ ...CES_POLICY_CANONICAL_VOCABULARY_V1,
      decisions: [{ ...decision, status: "approved" }] })).toThrow(/review evidence/u);
  });

  it("rejects unsupported canonical concepts and invalid raw mappings", () => {
    expect(() => CanonicalVocabularySchema.parse({ ...CES_POLICY_CANONICAL_VOCABULARY_V1,
      concepts: [...CES_POLICY_CANONICAL_VOCABULARY_V1.concepts,
        { concept_id: "ces.unsupported", meaning_version: "1.0.0", preferred_term: "Unsupported",
          definition: "No raw support.", semantic_kind: "obligation", lifecycle: "candidate",
          aliases: [] }] })).toThrow(/requires raw-source support/u);
  });

  it("updates a renumbered raw mapping without changing canonical meaning", () => {
    const current = CES_POLICY_CANONICAL_VOCABULARY_V1;
    const next = replaceRawMappingForSourceRenumbering(current,
      { raw_concept_id: "raw.nist-sp800-53.ac-3",
        raw_source_release_id: "nist.sp-800-53.r5-2-0" },
      { raw_concept_id: "raw.nist-sp800-53.ac-03", raw_source_release_id: "nist.sp-800-53.r5-2-0" },
      "1.0.1");
    expect(next.predecessor_revision).toBe("1.0.0");
    expect(next.concepts).toEqual(current.concepts);
    expect(next.mappings.some(({ raw_concept_id }) =>
      raw_concept_id === "raw.nist-sp800-53.ac-03")).toBe(true);
  });

  it("preserves composite raw identity across releases", () => {
    const current = CES_POLICY_CANONICAL_VOCABULARY_V1;
    const duplicateLocalId = "raw.shared-control";
    const rawConcepts = [
      { concept_id: duplicateLocalId, source_release_id: "source.release-a" },
      { concept_id: duplicateLocalId, source_release_id: "source.release-b" },
    ];
    const mappings = [
      { ...current.mappings[0]!, raw_concept_id: duplicateLocalId,
        raw_source_release_id: "source.release-a" },
      { ...current.mappings[0]!, raw_concept_id: duplicateLocalId,
        raw_source_release_id: "source.release-b" },
      ...current.mappings.slice(1),
    ];
    const supportedConcepts = current.concepts.filter(({ concept_id }) =>
      mappings.some(({ canonical_concept_id }) => canonical_concept_id === concept_id));
    expect(() => validateCanonicalVocabularyAgainstRawConcepts({ ...current,
      concepts: supportedConcepts, mappings }, [...rawConcepts,
      ...current.mappings.slice(1).map(({ raw_concept_id, raw_source_release_id }) =>
        ({ concept_id: raw_concept_id, source_release_id: raw_source_release_id }))])).not.toThrow();
  });

  it("renumbers only the targeted composite raw identity", () => {
    const current = CES_POLICY_CANONICAL_VOCABULARY_V1;
    const shared = "raw.shared-control";
    const mappings = current.mappings.map((mapping, index) => index < 2
      ? { ...mapping, raw_concept_id: shared,
        raw_source_release_id: index === 0 ? "source.release-a" : "source.release-b" }
      : mapping);
    const next = replaceRawMappingForSourceRenumbering({ ...current, mappings },
      { raw_concept_id: shared, raw_source_release_id: "source.release-a" },
      { raw_concept_id: "raw.renumbered", raw_source_release_id: "source.release-a" }, "1.0.1");
    expect(next.mappings.some(({ raw_concept_id, raw_source_release_id }) =>
      raw_concept_id === shared && raw_source_release_id === "source.release-b")).toBe(true);
  });

  it("rejects same-revision successors and incorrect predecessor linkage", () => {
    const current = CES_POLICY_CANONICAL_VOCABULARY_V1;
    const changed = { ...current, concepts: current.concepts.map((concept, index) => index === 0
      ? { ...concept, lifecycle: "approved" as const } : concept) };
    expect(() => validateCanonicalVocabularySuccessor(current,
      { ...changed, predecessor_revision: "1.0.0" })).toThrow(/must be distinct/u);
    expect(() => validateCanonicalVocabularySuccessor(current,
      { ...changed, vocabulary_revision: "1.0.1", predecessor_revision: null }))
      .toThrow(/exact predecessor/u);
  });

  it("versions lifecycle changes through an explicit successor", () => {
    const current = CES_POLICY_CANONICAL_VOCABULARY_V1;
    const next = changeCanonicalConceptLifecycle(current, "ces.access-authorization",
      "approved", "1.1.0");
    expect(next.predecessor_revision).toBe("1.0.0");
    expect(next.concepts.find(({ concept_id }) => concept_id === "ces.access-authorization")
      ?.lifecycle).toBe("approved");
    expect(validateCanonicalVocabularySuccessor(current, next).lifecycle_changed).toBe(true);
  });
});
