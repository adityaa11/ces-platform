import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { buildRepresentativeExtractionCorpus,
  buildTargetedExtractionSuccessor, CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1,
  CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2 } from "./representative-corpus.js";

describe("POL-006 representative extraction corpus", () => {
  it("covers exactly the four governed machine inputs and excludes ISO", () => {
    const releases = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies
      .map(({ source_release_id }) => source_release_id);
    expect(releases).toEqual(["nist.csf.2-0", "nist.sp-800-53.r5-2-0",
      "owasp.asvs.5-0-0", "owasp.wstg.4-2"]);
    expect(JSON.stringify(releases)).not.toContain("iso.iec");
  });

  it("preserves artifact hashes and source provenance on every concept", () => {
    const corpus = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1;
    const hashes = new Map(corpus.artifacts.map(({ release_id, sha256 }) => [release_id, sha256]));
    for (const vocabulary of corpus.vocabularies) for (const item of vocabulary.concepts) {
      expect(item.provenance.extraction_input.hash).toBe(hashes.get(vocabulary.source_release_id));
      expect(item.source_locator.source_uri).toMatch(/^https:\/\//u);
    }
  });

  it("reproduces the CSF hash from committed normalized UTF-8 content", () => {
    const artifact = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.artifacts
      .find(({ release_id }) => release_id === "nist.csf.2-0");
    expect(artifact?.artifact_format).toBe("normalized_utf8");
    expect(artifact?.normalized_content).toBeTruthy();
    expect(`sha256:${createHash("sha256").update(artifact!.normalized_content!, "utf8").digest("hex")}`)
      .toBe(artifact?.sha256);
  });

  it("records confidence plus human ambiguity and per-release coverage review", () => {
    const corpus = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1;
    const concepts = corpus.vocabularies.flatMap(({ concepts }) => concepts);
    expect(concepts.every(({ confidence }) => ["high", "medium", "low"].includes(confidence)))
      .toBe(true);
    expect(new Set(corpus.human_classification_reviews.map(({ concept_id }) => concept_id)))
      .toEqual(new Set(concepts.filter(({ scope_disposition }) =>
        scope_disposition === "review_required").map(({ concept_id }) => concept_id)));
    expect(new Set(corpus.coverage_reviews.map(({ release_id }) => release_id)))
      .toEqual(new Set(corpus.vocabularies.map(({ source_release_id }) => source_release_id)));
    expect(corpus.human_classification_reviews.every(({ reviewer_evidence_id }) =>
      reviewer_evidence_id === "CES-GF-POL-006-H01")).toBe(true);
    expect(corpus.coverage_reviews.every(({ reviewer_evidence_id }) =>
      reviewer_evidence_id === "CES-GF-POL-006-H01")).toBe(true);
    expect(corpus.coverage_reviews.every(({ non_exhaustive, covered_locators }) =>
      non_exhaustive && covered_locators.length > 0)).toBe(true);
  });

  it("preserves NIST boundaries and OWASP ShareAlike notices", () => {
    const artifacts = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.artifacts;
    expect(artifacts.filter(({ release_id }) => release_id.startsWith("nist."))
      .every(({ reuse_notice }) => reuse_notice.includes("foreign-rights") &&
        reuse_notice.includes("third-party") && reuse_notice.includes("endorsement"))).toBe(true);
    expect(artifacts.filter(({ release_id }) => release_id.startsWith("owasp."))
      .every(({ reuse_notice }) => reuse_notice.includes("CC BY-SA 4.0") &&
        reuse_notice.includes("ShareAlike"))).toBe(true);
  });

  it("covers required raw semantic perspectives without canonicalization", () => {
    const roles = new Set(CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies
      .flatMap(({ concepts }) => concepts.map(({ semantic_role }) => semantic_role)));
    expect(roles).toEqual(new Set(["objective", "control", "requirement",
      "verification_context", "risk_concern"]));
    expect(JSON.stringify(CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1))
      .not.toContain("canonical_policy");
  });

  it("records bounded SP 800-53 evaluation evidence", () => {
    const evaluations = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.sp800_53_evaluation;
    expect(evaluations).toHaveLength(5);
    expect(new Set(evaluations.map(({ contribution }) => contribution)))
      .toEqual(new Set(["UNIQUE_VALUE", "REINFORCES_EXISTING_CONCEPT",
        "OUT_OF_SCOPE_ORGANIZATIONAL"]));
  });

  it("is deterministic for the same pinned inputs", () => {
    expect(buildRepresentativeExtractionCorpus()).toEqual(buildRepresentativeExtractionCorpus());
  });
});

describe("POL-006-R02 targeted ASVS extraction successor", () => {
  it("pins its predecessor and remains candidate pending human semantic review", () => {
    expect(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2.predecessor).toEqual({
      corpus_id: CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.corpus_id,
      extraction_contract_revision:
        CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.extraction_contract_revision,
    });
    expect(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2.successor_review.review_status)
      .toBe("candidate");
    expect(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2.successor_review.demand_evidence)
      .toEqual({ artifact_id: "safara-buyer-business-prd.manual-facts.v1",
        fact_ids: ["0024", "0027", "0035", "0045"], role: "qualification_only" });
  });

  it("adds only the two exact targeted ASVS concepts", () => {
    const previous = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies
      .find(({ source_release_id }) => source_release_id === "owasp.asvs.5-0-0")!;
    const successor = CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2.vocabularies
      .find(({ source_release_id }) => source_release_id === "owasp.asvs.5-0-0")!;
    expect(successor.concepts.slice(previous.concepts.length).map(({ concept_id,
      source_locator: { locator }, source_term }) => ({ concept_id, locator, source_term })))
      .toEqual([
        { concept_id: "raw.asvs.v14-1-1", locator: "v5.0.0-V14.1.1",
          source_term: "Data Protection Documentation" },
        { concept_id: "raw.asvs.v14-2-6", locator: "v5.0.0-V14.2.6",
          source_term: "General Data Protection" },
      ]);
    expect(successor.concepts.find(({ concept_id }) => concept_id === "raw.asvs.v14-2-1"))
      .toEqual(previous.concepts.find(({ concept_id }) => concept_id === "raw.asvs.v14-2-1"));
  });

  it("preserves every predecessor governance field and concept", () => {
    const successor = CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2;
    for (const field of ["artifacts", "human_classification_reviews", "coverage_reviews",
      "sp800_53_evaluation"] as const) expect(successor[field])
        .toEqual(CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1[field]);
    for (const previous of CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies) {
      const current = successor.vocabularies.find(({ source_release_id }) =>
        source_release_id === previous.source_release_id)!;
      expect(current.concepts.slice(0, previous.concepts.length)).toEqual(previous.concepts);
    }
  });

  it("fails closed on an unknown locator or altered bounded meaning", () => {
    const value = structuredClone(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2);
    const asvs = value.vocabularies.find(({ source_release_id }) =>
      source_release_id === "owasp.asvs.5-0-0")!;
    asvs.concepts.at(-1)!.source_locator.locator = "v5.0.0-V14.2.999";
    expect(() => buildTargetedExtractionSuccessor(value)).toThrow(/altered or unknown concepts/u);
    const altered = structuredClone(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2);
    altered.vocabularies.find(({ source_release_id }) =>
      source_release_id === "owasp.asvs.5-0-0")!.concepts.at(-1)!.bounded_description =
        "Return any sensitive data requested.";
    expect(() => buildTargetedExtractionSuccessor(altered)).toThrow(/altered or unknown concepts/u);
  });

  it("fails closed on missing provenance, duplicate identity, and same-revision mutation", () => {
    const missing = structuredClone(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2) as any;
    delete missing.vocabularies[2].concepts.at(-1).provenance;
    expect(() => buildTargetedExtractionSuccessor(missing)).toThrow();

    const duplicate = structuredClone(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2);
    duplicate.vocabularies[2]!.concepts.at(-1)!.concept_id = "raw.asvs.v14-1-1";
    expect(() => buildTargetedExtractionSuccessor(duplicate)).toThrow(/unique/u);

    const mutated = structuredClone(CES_POLICY_TARGETED_EXTRACTION_CORPUS_V1_2);
    mutated.artifacts[2]!.reuse_notice = "changed rights boundary";
    expect(() => buildTargetedExtractionSuccessor(mutated)).toThrow(/preserve predecessor/u);
  });
});
