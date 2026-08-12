import { describe, expect, it } from "vitest";
import { CanonicalVocabularySchema } from "./index.js";
import { CES_POLICY_CANONICAL_VOCABULARY_V1,
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
    const next = replaceRawMappingForSourceRenumbering(current, "raw.nist-sp800-53.ac-3",
      { raw_concept_id: "raw.nist-sp800-53.ac-03", raw_source_release_id: "nist.sp-800-53.r5-2-0" },
      "1.0.1");
    expect(next.predecessor_revision).toBe("1.0.0");
    expect(next.concepts).toEqual(current.concepts);
    expect(next.mappings.some(({ raw_concept_id }) =>
      raw_concept_id === "raw.nist-sp800-53.ac-03")).toBe(true);
  });
});
