import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { createPolicyKnowledgeAgentRequest } from "@company/ces-policy-knowledge-proposals";
import { validatePolicyTaxonomyProposal } from "@company/ces-policy-knowledge-validation";
import { CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1,
  CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2 } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { createPolicyTaxonomyAgent, PolicyTaxonomyAgentInputSchema } from "./agent.js";

const canonical = CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5;
const predecessor = CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy;
const replay = CES_POLICY_DATA_PROTECTION_TAXONOMY_V1_2;
const ids = ["ces.sensitive-data-classification",
  "ces.sensitive-data-disclosure-minimization"];
const stableHash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

function input() {
  const request = createPolicyKnowledgeAgentRequest({ schema_version: "1.0.0",
    request_id: "request.pol-008-r02.golden-replay", lifecycle: "proposed",
    governed_context: { gap_id: "gap.data-protection", gap_fingerprint: "a".repeat(64),
      demand_fact_ids: ["safara.manual.fact.0024", "safara.manual.fact.0027",
        "safara.manual.fact.0035", "safara.manual.fact.0045"],
      source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
      canonical_vocabulary_revision: canonical.vocabulary_revision,
      policy_taxonomy_revision: predecessor.taxonomy_revision,
      predecessor_artifact_id: predecessor.taxonomy_id,
      predecessor_artifact_hash: stableHash(predecessor) },
    request: { layer: "policy_taxonomy", gap_route: "POLICY_GAP",
      bounded_task: "Evaluate the two approved data-protection obligations against the accepted predecessor taxonomy.",
      approved_canonical_concept_ids: ids,
      predecessor_policy_ids: predecessor.policies.map(({ policy_id }) => policy_id) } });
  return PolicyTaxonomyAgentInputSchema.parse({ request,
    approved_canonical_obligations: ids.map((conceptId) => {
      const concept = canonical.concepts.find(({ concept_id }) => concept_id === conceptId)!;
      const mappings = canonical.mappings.filter(({ canonical_concept_id }) =>
        canonical_concept_id === conceptId);
      return { concept_id: concept.concept_id, preferred_term: concept.preferred_term,
        definition: concept.definition, raw_lineage: mappings.map((mapping) => ({
          canonical_concept_id: concept.concept_id, raw_concept_id: mapping.raw_concept_id,
          source_release_id: mapping.raw_source_release_id,
          source_locator: mapping.raw_concept_id === "raw.asvs.v14-1-1"
            ? "v5.0.0-V14.1.1" : "v5.0.0-V14.2.6" })) };
    }),
    predecessor_policies: predecessor.policies.map((policy) => ({ policy_id: policy.policy_id,
      title: policy.title, obligation: policy.obligation,
      canonical_support_ids: policy.canonical_support.map(({ canonical_concept_id }) =>
        canonical_concept_id) })) });
}

function semanticReplay() {
  const policy = replay.taxonomy.policies.at(-1)!;
  return { decisions: replay.decisions.map(({ canonical_concept_id, decision, policy_id }) => ({
    canonical_concept_id, decision: decision.toUpperCase() as "ADD" | "MERGE",
    target_policy_id: policy_id,
    rationale: `The accepted predecessor comparison supports ${decision} while preserving this obligation independently.` })),
  proposed_policy: { policy_id: policy.policy_id, title: policy.title,
    obligation: policy.obligation,
    canonical_support_ids: policy.canonical_support.map(({ canonical_concept_id }) =>
      canonical_concept_id), lifecycle: "candidate" as const, approval_status: "proposed" as const },
  semantic_comparisons: replay.semantic_comparisons.map(({ canonical_concept_id,
    comparison_target_id, semantic_overlap }) => ({
    subject_canonical_concept_id: canonical_concept_id, comparison_target_id,
    relationship: semantic_overlap === "none" ? "distinct" as const : "overlaps" as const,
    rationale: semantic_overlap === "none"
      ? "The compared meanings impose different enduring outcomes."
      : "The obligations share a protection domain but retain distinct required outcomes." })) };
}

describe("AGB-007 Policy Taxonomy Agent golden replay", () => {
  it("registers a proposal-only provider-neutral agent", () => {
    const agent = createPolicyTaxonomyAgent({ model_alias: "policy-default",
      provider_id: "gemini", policy: {} });
    expect(agent).toMatchObject({ id: "ces.policy-taxonomy-agent", version: "1.0.0" });
    expect(agent.execution_policy).toMatchObject({ allowed_tools: [],
      requires_structured_output: true, requires_human_review: true });
    const execution = agent.buildExecutionRequest(input(), {} as never);
    expect(execution.model_alias).toBe("policy-default");
    expect(execution.system_instructions).toContain("Do not claim acceptance");
  });

  it("replays POL-008-R02 semantically and passes the accepted AGB-008 validator", async () => {
    const agent = createPolicyTaxonomyAgent({ model_alias: "policy-default",
      provider_id: "gemini", policy: {} });
    const governedInput = input();
    const intermediate = agent.intermediate_schema.parse(semanticReplay());
    const proposal = await agent.transformResult(intermediate, governedInput, {} as never);
    const validation = validatePolicyTaxonomyProposal(proposal, {
      source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
      raw_concepts: canonical.mappings.map(({ raw_concept_id: concept_id,
        raw_source_release_id: source_release_id }) => ({ concept_id, source_release_id })),
      canonical_vocabulary: canonical, predecessor_taxonomy: predecessor });
    expect(proposal.proposal).toMatchObject({ layer: "policy_taxonomy",
      decisions: [{ decision: "ADD" }, { decision: "MERGE" }],
      proposed_policy: { lifecycle: "candidate", approval_status: "proposed" } });
    expect(validation).toMatchObject({ status: "valid",
      review_eligibility: "reviewable_proposal", grants_policy_authority: false,
      issue_codes: [] });
    expect(JSON.stringify(proposal)).not.toEqual(JSON.stringify(replay));
  });

  it("rejects mismatched governed inputs and authority-escalating output", () => {
    const governedInput = input();
    expect(() => PolicyTaxonomyAgentInputSchema.parse({ ...governedInput,
      approved_canonical_obligations: governedInput.approved_canonical_obligations.slice(1) }))
      .toThrow(/must match requested concepts/u);
    const agent = createPolicyTaxonomyAgent({ model_alias: "policy-default",
      provider_id: "gemini", policy: {} });
    expect(() => agent.intermediate_schema.parse({ ...semanticReplay(),
      proposed_policy: { ...semanticReplay().proposed_policy,
        approval_status: "accepted" } })).toThrow();
  });
});
