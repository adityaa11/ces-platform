import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { buildRepresentativeExtractionCorpus,
  CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1 } from "./representative-corpus.js";

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
