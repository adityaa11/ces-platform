import { describe, expect, it } from "vitest";
import { CanonicalVocabularySchema, validateCanonicalVocabularyAgainstRawConcepts,
  validateCanonicalVocabularySuccessor } from "./index.js";
import { CES_POLICY_CANONICAL_VOCABULARY_V1,
  CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
  SEQUENTIAL_FLOW_APPROVAL_EVIDENCE,
  approveSequentialBusinessFlowCanonicalSuccessor,
  buildSequentialBusinessFlowCanonicalSuccessor,
  changeCanonicalConceptLifecycle,
  replaceRawMappingForSourceRenumbering,
  resolveCanonicalSourceLineage } from "./representative-catalog.js";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

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

  it("publishes the human-approved vocabulary as a linked successor", () => {
    const candidate = CES_POLICY_CANONICAL_VOCABULARY_V1;
    const approved = CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1;
    expect(approved.vocabulary_revision).toBe("1.1.0");
    expect(approved.predecessor_revision).toBe("1.0.0");
    expect(approved.vocabulary_status).toBe("approved");
    expect(approved.concepts.every(({ lifecycle }) => lifecycle === "approved")).toBe(true);
    expect(approved.decisions.every(({ status, reviewer_evidence_id }) =>
      status === "approved" && reviewer_evidence_id === "CES-GF-POL-007-H01")).toBe(true);
    expect(approved.mappings).toEqual(candidate.mappings);
  });

  it("resolves every supporting source and exact locator without flattening", () => {
    const lineage = resolveCanonicalSourceLineage("ces.access-authorization");
    expect(lineage).toHaveLength(2);
    expect(new Set(lineage.map(({ raw_concept }) => raw_concept.source_release_id)))
      .toEqual(new Set(["nist.csf.2-0", "nist.sp-800-53.r5-2-0"]));
    expect(new Set(lineage.map(({ raw_concept }) => raw_concept.source_locator.locator)))
      .toEqual(new Set(["PR.AA-05", "AC-3"]));
  });
});

describe("POL-007-R01 sequential business-flow canonicalization", () => {
  it("publishes a candidate successor linked to approved revision 1.1.0", () => {
    const successor = CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2;
    expect(successor).toMatchObject({ vocabulary_revision: "1.2.0",
      predecessor_revision: "1.1.0", vocabulary_status: "candidate" });
    expect(successor.concepts.at(-1)).toMatchObject({
      concept_id: "ces.sequential-business-flow", semantic_kind: "obligation",
      lifecycle: "candidate" });
    expect(successor.decisions.at(-1)).toMatchObject({ decision_kind: "addition",
      status: "proposed", reviewed_at: null, reviewer_evidence_id: null });
  });

  it("maps only to accepted ASVS V2.3.1 with exact raw lineage", () => {
    const mapping = CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2.mappings.at(-1);
    expect(mapping).toMatchObject({ canonical_concept_id: "ces.sequential-business-flow",
      raw_concept_id: "raw.asvs.v2-3-1", raw_source_release_id: "owasp.asvs.5-0-0",
      relationship: "supports" });
  });

  it("keeps sequence integrity distinct from transaction atomicity", () => {
    const concepts = CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2.concepts;
    expect(concepts.find(({ concept_id }) => concept_id === "ces.transaction-integrity"))
      .toEqual(CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1.concepts
        .find(({ concept_id }) => concept_id === "ces.transaction-integrity"));
    expect(concepts.find(({ concept_id }) => concept_id === "ces.sequential-business-flow")
      ?.definition).toContain("sequential step order without skipped steps");
  });

  it("preserves every predecessor concept, mapping, decision, and approval", () => {
    const predecessor = CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1;
    const successor = CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2;
    expect(successor.concepts.slice(0, predecessor.concepts.length)).toEqual(predecessor.concepts);
    expect(successor.mappings.slice(0, predecessor.mappings.length)).toEqual(predecessor.mappings);
    expect(successor.decisions.slice(0, predecessor.decisions.length)).toEqual(predecessor.decisions);
  });

  it("fails closed on same-revision mutation, unsupported mapping, or erased lineage", () => {
    const current = clone(CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2);
    current.vocabulary_revision = "1.1.0";
    expect(() => buildSequentialBusinessFlowCanonicalSuccessor(current)).toThrow(/distinct/u);

    const unsupported = clone(CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2);
    unsupported.mappings.at(-1)!.raw_concept_id = "raw.asvs.unknown";
    expect(() => buildSequentialBusinessFlowCanonicalSuccessor(unsupported)).toThrow(/missing/u);

    const erased = clone(CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2);
    erased.mappings.shift();
    expect(() => buildSequentialBusinessFlowCanonicalSuccessor(erased)).toThrow(/lineage|bounded/u);
  });

  it("fails closed on Safara-specific or broadened canonical meaning", () => {
    const specific = clone(CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2);
    specific.concepts.at(-1)!.definition = "A Safara package proceeds to its manifest.";
    expect(() => buildSequentialBusinessFlowCanonicalSuccessor(specific)).toThrow(/reusable/u);

    const broadened = clone(CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2);
    broadened.concepts.at(-1)!.definition = "Every operation must always succeed.";
    expect(() => buildSequentialBusinessFlowCanonicalSuccessor(broadened)).toThrow(/altered/u);
  });
});

describe("POL-007-R01 accepted authority publication", () => {
  it("publishes approval as an immutable successor of the reviewed candidate", () => {
    const candidate = CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2;
    const approved = CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3;
    expect(approved).toMatchObject({ vocabulary_revision: "1.3.0",
      predecessor_revision: candidate.vocabulary_revision, vocabulary_status: "approved" });
    expect(approved.concepts.find(({ concept_id }) =>
      concept_id === "ces.sequential-business-flow")?.lifecycle).toBe("approved");
  });

  it("records project-owner approval bound to the reviewed commit", () => {
    expect(SEQUENTIAL_FLOW_APPROVAL_EVIDENCE).toMatchObject({
      evidence_id: "CES-GF-POL-007-R01-H01",
      evidence_type: "project_owner_confirmation", terminal_outcome: "ACCEPTED",
      reviewed_commit: "8e42e032a6e3995c89b80befdf5a6b7f77af267c" });
    expect(CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3.decisions.at(-1))
      .toMatchObject({ status: "approved",
        reviewer_evidence_id: SEQUENTIAL_FLOW_APPROVAL_EVIDENCE.evidence_id });
  });

  it("changes only the new lifecycle and decision review fields", () => {
    const candidate = CES_POLICY_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_2;
    const approved = CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3;
    expect(approved.mappings).toEqual(candidate.mappings);
    expect(approved.concepts.slice(0, -1)).toEqual(candidate.concepts.slice(0, -1));
    expect(approved.decisions.slice(0, -1)).toEqual(candidate.decisions.slice(0, -1));
  });

  it("deterministically reproduces the accepted successor", () => {
    expect(approveSequentialBusinessFlowCanonicalSuccessor())
      .toEqual(CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3);
  });
});
