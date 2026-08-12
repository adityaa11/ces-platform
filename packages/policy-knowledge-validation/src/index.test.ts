import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { createPolicyKnowledgeProposal } from "@company/ces-policy-knowledge-proposals";
import { CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1,
  CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2 } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { PolicyProposalValidationResultSchema, validatePolicyTaxonomyProposal } from "./index.js";

const predecessor = CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy;
const canonical = CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5;
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const knowledge = {
  source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
  raw_concepts: canonical.mappings.map(({ raw_concept_id: concept_id,
    raw_source_release_id: source_release_id }) => ({ concept_id, source_release_id })),
  canonical_vocabulary: canonical, predecessor_taxonomy: predecessor,
};

function goldenProposal() {
  const artifact = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2;
  const policy = artifact.taxonomy.policies.at(-1)!;
  return createPolicyKnowledgeProposal({ schema_version: "1.0.0",
    proposal_id: "proposal.pol.008.r02.replay", lifecycle: "proposed",
    governed_context: { gap_id: "gap.data.protection", gap_fingerprint: "a".repeat(64),
      demand_fact_ids: ["safara.manual.fact.0024", "safara.manual.fact.0027",
        "safara.manual.fact.0035", "safara.manual.fact.0045"],
      source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
      canonical_vocabulary_revision: canonical.vocabulary_revision,
      policy_taxonomy_revision: predecessor.taxonomy_revision,
      predecessor_artifact_id: predecessor.taxonomy_id,
      predecessor_artifact_hash: sha(predecessor) },
    proposal: { layer: "policy_taxonomy", gap_route: "POLICY_GAP",
      decisions: artifact.decisions.map(({ canonical_concept_id, decision, policy_id,
        rationale }) => ({ canonical_concept_id, decision: decision.toUpperCase() as
          "ADD" | "MERGE" | "REJECT", target_policy_id: policy_id, rationale })),
      proposed_policy: { policy_id: policy.policy_id, title: policy.title,
        obligation: policy.obligation,
        canonical_support_ids: policy.canonical_support.map(({ canonical_concept_id }) =>
          canonical_concept_id), lifecycle: "candidate", approval_status: "proposed" },
      semantic_comparisons: artifact.semantic_comparisons.map(({ canonical_concept_id,
        comparison_target_id, semantic_overlap, rationale }) => ({
        subject_canonical_concept_id: canonical_concept_id, comparison_target_id,
        relationship: semantic_overlap === "none" ? "distinct" as const : "overlaps" as const,
        rationale })) } });
}

describe("AGB-008 deterministic Policy proposal validation", () => {
  it("accepts the historical POL-008-R02 semantic fixture deterministically", () => {
    const first = validatePolicyTaxonomyProposal(goldenProposal(), knowledge);
    expect(first).toMatchObject({ status: "valid", review_eligibility: "reviewable_proposal",
      issue_codes: [], grants_policy_authority: false });
    expect(first).toEqual(validatePolicyTaxonomyProposal(goldenProposal(), knowledge));
    expect(() => PolicyProposalValidationResultSchema.parse({ ...first,
      grants_policy_authority: true })).toThrow();
    expect(() => PolicyProposalValidationResultSchema.parse({ ...first,
      status: "invalid" })).toThrow(/hash/u);
  });

  it("rejects stale context, broken raw lineage, and incomplete comparisons", () => {
    const proposal = goldenProposal();
    const stale = { ...knowledge, raw_vocabulary_revision: "1.3.0" };
    expect(validatePolicyTaxonomyProposal(proposal, stale).issue_codes)
      .toContain("CONTEXT_MISMATCH");
    const broken = { ...knowledge, raw_concepts: knowledge.raw_concepts.filter(({ concept_id }) =>
      concept_id !== "raw.asvs.v14-1-1" && concept_id !== "raw.asvs.v14-2-6") };
    expect(validatePolicyTaxonomyProposal(proposal, broken).issue_codes)
      .toContain("RAW_LINEAGE_INVALID");
    const body = proposal.proposal;
    if (body.layer !== "policy_taxonomy") throw new Error("fixture layer");
    const { proposal_hash: _proposalHash, ...proposalWithoutHash } = proposal;
    const incomplete = createPolicyKnowledgeProposal({ ...proposalWithoutHash,
      proposal: { ...body, semantic_comparisons: body.semantic_comparisons.slice(1) } });
    expect(validatePolicyTaxonomyProposal(incomplete, knowledge).issue_codes)
      .toContain("COMPARISON_INCOMPLETE");
  });

  it("rejects project and technology leakage before review", () => {
    const proposal = goldenProposal();
    const body = proposal.proposal;
    if (body.layer !== "policy_taxonomy" || !body.proposed_policy) throw new Error("fixture");
    const { proposal_hash: _proposalHash, ...proposalWithoutHash } = proposal;
    const leaked = createPolicyKnowledgeProposal({ ...proposalWithoutHash, proposal: { ...body,
      proposed_policy: { ...body.proposed_policy,
        obligation: "Safara must store passport data in PostgreSQL." } } });
    const result = validatePolicyTaxonomyProposal(leaked, knowledge);
    expect(result).toMatchObject({ status: "invalid",
      review_eligibility: "rejected_before_review", grants_policy_authority: false });
    expect(result.issue_codes).toEqual(expect.arrayContaining([
      "PROJECT_LEAKAGE", "TECHNOLOGY_LEAKAGE",
    ]));
  });
});
