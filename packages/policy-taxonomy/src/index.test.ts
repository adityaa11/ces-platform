import { describe, expect, it } from "vitest";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CanonicalPolicyCandidateSchema,
  validatePolicyTaxonomyAgainstCanonicalVocabulary } from "./index.js";
import { CES_POLICY_REPRESENTATIVE_TAXONOMY_V1,
  CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1,
  buildSequentialBusinessFlowPolicySuccessor,
  CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1,
  publishAcceptedSequentialFlowDecision,
  CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2,
  buildDataProtectionPolicySuccessor,
  resolveDataProtectionPolicySourceLineage,
  CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1,
  publishAcceptedDataProtectionDecision,
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

describe("POL-008-R01 accepted decision publication", () => {
  it("binds acceptance to the implementation and closure commits", () => {
    expect(CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.approval).toMatchObject({
      terminal_outcome: "ACCEPTED",
      reviewed_implementation_commit: "8ab40952ca9bb980fab1388d9ecc5037ca0ab5d7",
      reviewed_closure_commit: "21ee03cebc394c726028c83767d04029b51e5fc9",
      reviewer_evidence_id: "CES-GF-POL-008-R01-H01",
      final_pol_008_approval: false });
  });

  it("publishes the exact candidate taxonomy and proposed decision", () => {
    const publication = CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1;
    expect(publication.artifact).toEqual(CES_POLICY_SEQUENTIAL_FLOW_TAXONOMY_V1_1);
    expect(publication.artifact.taxonomy.lifecycle).toBe("candidate");
    expect(publication.artifact.taxonomy.policies.every(({ lifecycle, approval }) =>
      lifecycle === "candidate" && approval.status === "proposed")).toBe(true);
    expect(publication.artifact.decision.status).toBe("proposed");
  });

  it("fails closed on artifact mutation or false final authority", () => {
    const changed = clone(CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1);
    changed.artifact.taxonomy.policies.at(-1)!.obligation = "Altered obligation.";
    expect(() => publishAcceptedSequentialFlowDecision(changed)).toThrow(/preserve|hash/u);

    const falseAuthority = clone(CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1);
    falseAuthority.artifact.taxonomy.policies.at(-1)!.lifecycle = "approved";
    falseAuthority.artifact.taxonomy.policies.at(-1)!.approval = { status: "approved",
      reviewed_at: "2026-08-12T00:00:00+00:00", reviewer_evidence_id: "invented" };
    expect(() => publishAcceptedSequentialFlowDecision(falseAuthority))
      .toThrow(/preserve|final POL-008 authority/u);
  });
});

describe("POL-008-R02 data-protection Policy decisions", () => {
  it("publishes a candidate successor pinned to taxonomy v1.1 and canonical v1.5", () => {
    const { taxonomy } = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2;
    expect(taxonomy).toMatchObject({ taxonomy_revision: "1.2.0",
      predecessor_revision: "1.1.0", canonical_vocabulary_revision: "1.5.0",
      lifecycle: "candidate" });
    expect(taxonomy.policies.at(-1)).toMatchObject({
      policy_id: "policy.sensitive-data-protection", lifecycle: "candidate",
      approval: { status: "proposed", reviewed_at: null, reviewer_evidence_id: null } });
  });

  it("records independent add and merge decisions without one-to-one promotion", () => {
    expect(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.decisions.map(({ decision,
      canonical_concept_id, policy_id }) => ({ decision, canonical_concept_id, policy_id })))
      .toEqual([
        { decision: "add", canonical_concept_id: "ces.sensitive-data-classification",
          policy_id: "policy.sensitive-data-protection" },
        { decision: "merge",
          canonical_concept_id: "ces.sensitive-data-disclosure-minimization",
          policy_id: "policy.sensitive-data-protection" },
      ]);
    expect(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy.policies).toHaveLength(6);
  });

  it("durably compares each obligation with all predecessor Policies", () => {
    const comparisons = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.semantic_comparisons;
    const predecessorIds = ["policy.access-authorization",
      "policy.security-event-traceability", "policy.recoverable-trustworthy-state",
      "policy.transaction-integrity", "policy.sequential-business-flow"];
    for (const conceptId of ["ces.sensitive-data-classification",
      "ces.sensitive-data-disclosure-minimization"]) {
      const rows = comparisons.filter(({ canonical_concept_id, comparison_target_id }) =>
        canonical_concept_id === conceptId && predecessorIds.includes(comparison_target_id));
      expect(rows.map(({ comparison_target_id }) => comparison_target_id)).toEqual(predecessorIds);
      expect(rows.every(({ semantic_overlap, decision_consequence, rationale }) =>
        semantic_overlap === "none" &&
        decision_consequence === "distinct_from_predecessor_policy" &&
        rationale.length > 0)).toBe(true);
    }
  });

  it("compares the two obligations to one another in both directions", () => {
    const mutual = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.semantic_comparisons
      .filter(({ comparison_target_id }) => comparison_target_id.startsWith("ces."));
    expect(mutual).toHaveLength(2);
    expect(mutual.every(({ semantic_overlap, decision_consequence, rationale }) =>
      semantic_overlap === "bounded_shared_domain" &&
      decision_consequence === "coexist_in_consolidated_policy" &&
      rationale.includes("classification") &&
      (rationale.includes("Disclosure") || rationale.includes("disclosure")))).toBe(true);
  });

  it("preserves both meanings as separate canonical support", () => {
    const policy = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy.policies.at(-1)!;
    expect(policy.canonical_support.map(({ canonical_concept_id }) => canonical_concept_id))
      .toEqual(["ces.sensitive-data-classification",
        "ces.sensitive-data-disclosure-minimization"]);
    expect(policy.obligation).toContain("classified into appropriate protection levels");
    expect(policy.obligation).toContain("disclosure must be limited");
    expect(policy.obligation).toContain("complete values must remain concealed");
  });

  it("resolves both independent ASVS lineages", () => {
    expect(resolveDataProtectionPolicySourceLineage().map(({ canonical_support,
      source_lineage }) => ({ canonical: canonical_support.canonical_concept_id,
      raw: source_lineage.map(({ raw_concept }) => raw_concept.concept_id),
      locator: source_lineage.map(({ raw_concept }) => raw_concept.source_locator.locator) })))
      .toEqual([
        { canonical: "ces.sensitive-data-classification", raw: ["raw.asvs.v14-1-1"],
          locator: ["v5.0.0-V14.1.1"] },
        { canonical: "ces.sensitive-data-disclosure-minimization",
          raw: ["raw.asvs.v14-2-6"], locator: ["v5.0.0-V14.2.6"] },
      ]);
  });

  it("preserves every predecessor Policy and approval", () => {
    const predecessor = CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy;
    expect(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2.taxonomy.policies
      .slice(0, predecessor.policies.length)).toEqual(predecessor.policies);
  });

  it("fails closed on wrong revision, unsupported support, or lost predecessor", () => {
    const wrong = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    wrong.taxonomy.canonical_vocabulary_revision = "1.3.0";
    expect(() => buildDataProtectionPolicySuccessor(wrong)).toThrow(/exact approved/u);
    const unsupported = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    unsupported.taxonomy.policies.at(-1)!.canonical_support[0]!.canonical_concept_id =
      "ces.object-authorization-bypass";
    expect(() => buildDataProtectionPolicySuccessor(unsupported))
      .toThrow(/approved obligation/u);
    const lost = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    lost.taxonomy.policies.shift();
    expect(() => buildDataProtectionPolicySuccessor(lost)).toThrow(/preserve|bounded/u);
  });

  it("fails closed on altered meaning, invented approval, or project terminology", () => {
    const altered = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    altered.taxonomy.policies.at(-1)!.obligation = "Encrypt everything forever.";
    expect(() => buildDataProtectionPolicySuccessor(altered)).toThrow(/altered/u);
    const approved = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    approved.taxonomy.policies.at(-1)!.approval.status = "approved";
    expect(() => buildDataProtectionPolicySuccessor(approved)).toThrow(/review evidence/u);
    const specific = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    specific.taxonomy.policies.at(-1)!.obligation = "Mask each Safara pilgrim passport.";
    expect(() => buildDataProtectionPolicySuccessor(specific)).toThrow(/reusable|altered/u);
  });

  it("fails closed on missing, duplicate, or altered comparison evidence", () => {
    const missing = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    missing.semantic_comparisons.pop();
    expect(() => buildDataProtectionPolicySuccessor(missing)).toThrow();
    const duplicate = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    duplicate.semantic_comparisons[11] = duplicate.semantic_comparisons[0]!;
    expect(() => buildDataProtectionPolicySuccessor(duplicate)).toThrow(/altered|pair/u);
    const altered = clone(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    altered.semantic_comparisons[0]!.rationale = "Demand count says add it.";
    expect(() => buildDataProtectionPolicySuccessor(altered)).toThrow(/altered/u);
  });
});

describe("POL-008-R02 accepted decision publication", () => {
  it("binds acceptance to implementation, closure, and review evidence", () => {
    expect(CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1.approval).toMatchObject({
      terminal_outcome: "ACCEPTED",
      reviewed_implementation_commit: "270e59af09d2fce82e7346f90c9700742c19b741",
      reviewed_closure_commit: "10aed9f2d629ec096580ace6d86309ab29ff3926",
      reviewer_evidence_id: "CES-GF-POL-008-R02-H01",
      reviewer_evidence_path: "project's goal/feedback/CES_POLICIES_REVIEW_10aed9f.md",
      review_class: "REVIEW_GATE", review_round: 2,
      evidence_type: "project_owner_confirmation",
      final_pol_008_approval: false });
  });

  it("publishes the exact candidate artifact including all 12 comparisons", () => {
    const publication = CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1;
    expect(publication.artifact).toEqual(CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2);
    expect(publication.artifact.semantic_comparisons).toHaveLength(12);
    expect(publication.artifact.taxonomy.lifecycle).toBe("candidate");
    expect(publication.artifact.taxonomy.policies.every(({ lifecycle, approval }) =>
      lifecycle === "candidate" && approval.status === "proposed")).toBe(true);
  });

  it("fails closed on artifact mutation or false final authority", () => {
    const changed = clone(CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1);
    changed.artifact.semantic_comparisons[0]!.rationale = "Changed after review.";
    expect(() => publishAcceptedDataProtectionDecision(changed)).toThrow(/preserve/u);
    const falseAuthority = clone(CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1);
    falseAuthority.artifact.taxonomy.policies.at(-1)!.lifecycle = "approved";
    falseAuthority.artifact.taxonomy.policies.at(-1)!.approval = { status: "approved",
      reviewed_at: "2026-08-12T00:00:00+00:00", reviewer_evidence_id: "invented" };
    expect(() => publishAcceptedDataProtectionDecision(falseAuthority))
      .toThrow(/preserve|final POL-008 authority/u);
  });
});
