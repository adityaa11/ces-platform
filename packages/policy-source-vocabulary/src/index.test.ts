import { describe, expect, it } from "vitest";
import {
  CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
  CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1,
} from
  "@company/ces-policy-source-glossary/core-sources";
import {
  RawSourceConceptSchema,
  RawSourceVocabularySchema,
  validateGovernedRawSourceVocabulary,
  validateRawSourceVocabulary,
} from "./index.js";

const inputHash = `sha256:${"a".repeat(64)}`;
const releaseIds = CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases.map(({ release_id }) => release_id);
const concept = (releaseId: string, index: number) => ({
  concept_id: `raw.concept-${index}`,
  source_release_id: releaseId,
  source_locator: {
    locator_type: "section" as const,
    locator: `Section ${index}`,
    source_uri: `https://example.test/source/${index}`,
    language: "en",
  },
  source_term: `Source term ${index}`,
  bounded_description: `Source-faithful description ${index}`,
  semantic_role: "requirement" as const,
  scope_disposition: "software_relevant" as const,
  provenance: {
    extraction_method: "manual" as const,
    extracted_at: "2026-08-11T14:00:00+00:00",
    extractor_id: "reviewer.1",
    extraction_input: { hash: inputHash, hash_scope: "licensed section text" },
  },
  review_status: "candidate" as const,
});
const vocabulary = (releaseId: string) => ({
  schema_version: "1.0.0" as const,
  vocabulary_id: `raw-vocabulary.${releaseId}`,
  source_release_id: releaseId,
  concepts: [concept(releaseId, 1)],
});

describe("raw source vocabulary contract", () => {
  it("represents every frozen source family without source-specific fields", () => {
    for (const releaseId of releaseIds) {
      const parsed = validateRawSourceVocabulary(
        CES_POLICY_CORE_SOURCE_GLOSSARY_V1, vocabulary(releaseId));
      expect(parsed.source_release_id).toBe(releaseId);
      expect(JSON.stringify(parsed)).not.toContain("canonical_policy");
    }
  });

  it("keeps semantic role separate from software-scope disposition", () => {
    const organizationalControl = { ...concept(releaseIds[0]!, 2),
      semantic_role: "control" as const,
      scope_disposition: "out_of_scope_organizational" as const };
    expect(RawSourceConceptSchema.parse(organizationalControl)).toMatchObject({
      semantic_role: "control",
      scope_disposition: "out_of_scope_organizational",
    });
  });

  it("preserves exact source terminology without trimming it", () => {
    const exact = { ...concept(releaseIds[0]!, 4), source_term: "  Access control  " };
    expect(RawSourceConceptSchema.parse(exact).source_term).toBe("  Access control  ");
  });

  it("rejects missing provenance and canonical-policy leakage", () => {
    const { provenance: _provenance, ...withoutProvenance } = concept(releaseIds[0]!, 3);
    expect(() => RawSourceConceptSchema.parse(withoutProvenance)).toThrow();
    expect(() => RawSourceConceptSchema.parse({ ...concept(releaseIds[0]!, 3),
      canonical_policy_id: "access-control" })).toThrow();
  });

  it("rejects duplicate identities and mixed releases while allowing shared locators", () => {
    const first = concept(releaseIds[0]!, 1);
    expect(() => RawSourceVocabularySchema.parse({ ...vocabulary(releaseIds[0]!),
      concepts: [first, first] })).toThrow(/unique/u);
    expect(RawSourceVocabularySchema.parse({ ...vocabulary(releaseIds[0]!),
      concepts: [first, { ...concept(releaseIds[0]!, 2),
        source_locator: first.source_locator }] }).concepts).toHaveLength(2);
    expect(() => RawSourceVocabularySchema.parse({ ...vocabulary(releaseIds[0]!),
      concepts: [{ ...first, source_release_id: releaseIds[1] }] }))
      .toThrow(/another source release/u);
  });

  it("rejects vocabulary for an unknown source release", () => {
    expect(() => validateRawSourceVocabulary(CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
      vocabulary("unknown.release"))).toThrow(/unknown release/u);
  });

  it("accepts governed core and evaluation inputs without changing the raw shape", () => {
    for (const releaseId of ["nist.csf.2-0", "nist.sp-800-53.r5-2-0",
      "owasp.asvs.5-0-0", "owasp.wstg.4-2"]) {
      const parsed = validateGovernedRawSourceVocabulary(
        CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1, vocabulary(releaseId));
      expect(parsed).toEqual(vocabulary(releaseId));
    }
  });

  it("rejects raw vocabulary from governed reference-only releases", () => {
    for (const releaseId of ["iso.iec-27001.2022-amd1-2024", "iso.iec-27002.2022"]) {
      expect(() => validateGovernedRawSourceVocabulary(
        CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1, vocabulary(releaseId)))
        .toThrow(/not an active machine corpus input/u);
    }
  });
});
