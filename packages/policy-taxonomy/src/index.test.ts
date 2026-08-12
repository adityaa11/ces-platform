import { describe, expect, it } from "vitest";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CanonicalPolicyCandidateSchema,
  validatePolicyTaxonomyAgainstCanonicalVocabulary } from "./index.js";
import { CES_POLICY_REPRESENTATIVE_TAXONOMY_V1,
  CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1,
  buildSequentialBusinessFlowPolicySuccessor,
  resolvePolicySourceLineage,
  resolveSequentialFlowPolicySourceLineage } from "./representative-taxonomy.js";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

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

describe("POL-008-R01 sequential business-flow Policy decision", () => {
  it("publishes a candidate taxonomy successor pinned to canonical revision 1.3.0", () => {
    const { taxonomy } = CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1;
    expect(taxonomy).toMatchObject({ taxonomy_revision: "1.1.0",
      predecessor_revision: "1.0.0", canonical_vocabulary_revision: "1.3.0",
      lifecycle: "candidate" });
    expect(taxonomy.policies.at(-1)).toMatchObject({
      policy_id: "policy.sequential-business-flow", lifecycle: "candidate",
      approval: { status: "proposed", reviewed_at: null, reviewer_evidence_id: null } });
  });

  it("records an explicit add decision after transaction-integrity comparison", () => {
    expect(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1.decision).toMatchObject({
      decision: "add", status: "proposed",
      canonical_concept_id: "ces.sequential-business-flow",
      policy_id: "policy.sequential-business-flow",
      comparison_policy_id: "policy.transaction-integrity",
      reviewed_at: null, reviewer_evidence_id: null });
    expect(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1.decision.rationale)
      .toContain("Merging would erase");
  });

  it("keeps sequential ordering distinct from transaction atomicity", () => {
    const policies = CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1.taxonomy.policies;
    expect(policies.find(({ policy_id }) => policy_id === "policy.transaction-integrity"))
      .toEqual(CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies
        .find(({ policy_id }) => policy_id === "policy.transaction-integrity"));
    expect(policies.at(-1)?.obligation).toContain("sequential step order without skipped steps");
  });

  it("resolves complete Policy-to-ASVS lineage", () => {
    const lineage = resolveSequentialFlowPolicySourceLineage();
    expect(lineage).toHaveLength(1);
    expect(lineage[0]?.canonical_support.canonical_concept_id)
      .toBe("ces.sequential-business-flow");
    expect(lineage[0]?.source_lineage.map(({ raw_concept }) => ({
      release: raw_concept.source_release_id, id: raw_concept.concept_id,
      locator: raw_concept.source_locator.locator }))).toEqual([{
        release: "owasp.asvs.5-0-0", id: "raw.asvs.v2-3-1",
        locator: "v5.0.0-V2.3.1" }]);
  });

  it("preserves every predecessor Policy and approval field", () => {
    const policies = CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1.taxonomy.policies;
    expect(policies.slice(0, CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies.length))
      .toEqual(CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.policies);
  });

  it("fails closed on same revision, unsupported support, or lost predecessor", () => {
    const same = clone(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1);
    same.taxonomy.taxonomy_revision = "1.0.0";
    expect(() => buildSequentialBusinessFlowPolicySuccessor(same)).toThrow(/distinct/u);

    const unsupported = clone(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1);
    unsupported.taxonomy.policies.at(-1)!.canonical_support[0]!.canonical_concept_id =
      "ces.object-authorization-bypass";
    expect(() => buildSequentialBusinessFlowPolicySuccessor(unsupported))
      .toThrow(/approved obligation/u);

    const lost = clone(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1);
    lost.taxonomy.policies.shift();
    expect(() => buildSequentialBusinessFlowPolicySuccessor(lost))
      .toThrow(/preserve|bounded/u);
  });

  it("fails closed on invented review evidence or project-specific meaning", () => {
    const reviewed = clone(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1);
    reviewed.taxonomy.policies.at(-1)!.approval = { status: "approved",
      reviewed_at: null, reviewer_evidence_id: null };
    expect(() => buildSequentialBusinessFlowPolicySuccessor(reviewed))
      .toThrow(/review evidence/u);

    const specific = clone(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1);
    specific.taxonomy.policies.at(-1)!.obligation =
      "Every Safara package must enter a pilgrim manifest.";
    expect(() => buildSequentialBusinessFlowPolicySuccessor(specific))
      .toThrow(/reusable|altered/u);
  });
});
