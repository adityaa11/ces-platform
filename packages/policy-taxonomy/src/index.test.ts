import { describe, expect, it } from "vitest";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CanonicalPolicyCandidateSchema,
  validatePolicyTaxonomyAgainstCanonicalVocabulary } from "./index.js";
import { CES_POLICY_REPRESENTATIVE_TAXONOMY_V1,
  resolvePolicySourceLineage } from "./representative-taxonomy.js";

describe("POL-008 representative Policy taxonomy", () => {
  it("pins and consumes only the approved canonical vocabulary revision", () => {
    const taxonomy = CES_POLICY_REPRESENTATIVE_TAXONOMY_V1;
    expect(taxonomy.canonical_vocabulary_revision).toBe("1.1.0");
    expect(() => validatePolicyTaxonomyAgainstCanonicalVocabulary({ ...taxonomy,
      canonical_vocabulary_revision: "1.0.0" },
    CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1)).toThrow(/exact approved/u);
  });

  it("derives a small set of broad candidate obligations", () => {
    expect(CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies).toHaveLength(4);
    expect(CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies
      .every(({ lifecycle, approval }) => lifecycle === "candidate" &&
        approval.status === "proposed")).toBe(true);
  });

  it("rejects concerns and verification contexts as Policy support", () => {
    const taxonomy = CES_POLICY_REPRESENTATIVE_TAXONOMY_V1;
    for (const conceptId of ["ces.object-authorization-bypass",
      "ces.object-authorization-testing", "ces.session-expiration-testing"]) {
      const policies = [{ ...taxonomy.policies[0]!, canonical_support: [
        { canonical_concept_id: conceptId, rationale: "Invalid promotion." }] }];
      expect(() => validatePolicyTaxonomyAgainstCanonicalVocabulary({ ...taxonomy, policies },
        CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1)).toThrow(/approved obligation/u);
    }
  });

  it("requires WHAT-not-HOW evidence and no prohibited matches", () => {
    for (const policy of CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies) {
      expect(policy.technology_independence.what_not_how).toBe(true);
      expect(policy.technology_independence.prohibited_term_matches).toEqual([]);
    }
    expect(() => CanonicalPolicyCandidateSchema.parse({
      ...CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies[0],
      technology_independence: { what_not_how: true,
        prohibited_term_matches: ["framework"], rationale: "Contains implementation detail." },
    })).toThrow();
    expect(() => CanonicalPolicyCandidateSchema.parse({
      ...CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies[0],
      obligation: "Access must use PostgreSQL row policies.",
    })).toThrow(/prohibited technology terms/u);
  });

  it("requires human evidence before Policy approval", () => {
    const policy = CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies[0]!;
    expect(() => CanonicalPolicyCandidateSchema.parse({ ...policy,
      lifecycle: "approved", approval: { ...policy.approval, status: "approved" } }))
      .toThrow(/review evidence/u);
  });

  it("retains every source behind consolidated canonical support", () => {
    const lineage = resolvePolicySourceLineage("policy.access-authorization");
    expect(lineage).toHaveLength(1);
    expect(lineage[0]?.source_lineage).toHaveLength(2);
    expect(new Set(lineage[0]?.source_lineage.map(({ raw_concept }) =>
      raw_concept.source_locator.locator))).toEqual(new Set(["PR.AA-05", "AC-3"]));
  });

  it("contains no project applicability or implementation prescriptions", () => {
    const serialized = JSON.stringify(CES_POLICY_REPRESENTATIVE_TAXONOMY_V1).toLowerCase();
    for (const forbidden of ["safara", "atlas_revision", "context_binding", "postgres",
      "laravel", "react", "oauth", "redis", "kubernetes"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
