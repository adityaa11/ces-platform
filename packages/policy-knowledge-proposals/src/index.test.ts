import { describe, expect, it } from "vitest";
import {
  PolicyKnowledgeExecutionEvidenceSchema,
  PolicyKnowledgeProposalSchema,
  createPolicyKnowledgeExecutionEvidence,
  createPolicyKnowledgeProposal,
  governedContextHash,
} from "./index.js";

const hash = "a".repeat(64);
const context = {
  gap_id: "gap.safara.0027",
  gap_fingerprint: hash,
  demand_fact_ids: ["safara.manual.fact.0027"],
  source_glossary_revision: "1.1.0",
  raw_vocabulary_revision: "1.2.0",
  canonical_vocabulary_revision: "1.5.0",
  policy_taxonomy_revision: "1.1.0",
  predecessor_artifact_id: "ces.policy.taxonomy.representative.v1.1",
  predecessor_artifact_hash: "b".repeat(64),
};

function policyProposal() {
  return createPolicyKnowledgeProposal({
    schema_version: "1.0.0",
    proposal_id: "proposal.policy.sensitive.data.v1",
    lifecycle: "proposed",
    governed_context: context,
    proposal: {
      layer: "policy_taxonomy",
      gap_route: "POLICY_GAP",
      decisions: [{ canonical_concept_id: "ces.sensitive.data.classification",
        decision: "ADD", target_policy_id: "policy.sensitive.data.protection",
        rationale: "No predecessor Policy represents this obligation." }],
      proposed_policy: { policy_id: "policy.sensitive.data.protection",
        title: "Sensitive Data Protection",
        obligation: "Sensitive data must be identified and protected throughout its use.",
        canonical_support_ids: ["ces.sensitive.data.classification"],
        lifecycle: "candidate", approval_status: "proposed" },
      semantic_comparisons: [{
        subject_canonical_concept_id: "ces.sensitive.data.classification",
        comparison_target_id: "policy.access.control",
        relationship: "distinct",
        rationale: "Data classification is distinct from access authorization.",
      }],
    },
  });
}

describe("AGB-006 Policy knowledge proposal contracts", () => {
  it("creates a content-addressed candidate Policy proposal", () => {
    const proposal = policyProposal();
    expect(proposal).toMatchObject({ lifecycle: "proposed",
      proposal: { layer: "policy_taxonomy", gap_route: "POLICY_GAP",
        proposed_policy: { lifecycle: "candidate", approval_status: "proposed" } } });
    expect(proposal.proposal_hash).toHaveLength(64);
  });

  it("supports distinct raw and canonical proposal layers", () => {
    const raw = createPolicyKnowledgeProposal({ schema_version: "1.0.0",
      proposal_id: "proposal.raw.asvs.v14.2.6", lifecycle: "proposed",
      governed_context: context, proposal: { layer: "raw_source_vocabulary",
        gap_route: "EXTRACTION_GAP", decision: "ADD",
        proposed_raw_concept_id: "raw.asvs.v14.2.6",
        bounded_meaning: "Limit sensitive data returned or displayed.",
        source_release_id: "source.asvs.v5", source_locator: "v5.0.0-V14.2.6",
        semantic_rationale: "The governed source directly supports the bounded meaning." } });
    const canonical = createPolicyKnowledgeProposal({ schema_version: "1.0.0",
      proposal_id: "proposal.canonical.disclosure.v1", lifecycle: "proposed",
      governed_context: context, proposal: { layer: "canonical_vocabulary",
        gap_route: "CANONICALIZATION_GAP", decision: "ADD",
        proposed_canonical_concept_id: "ces.sensitive.data.disclosure.minimization",
        preferred_term: "Sensitive data disclosure minimization",
        definition: "Limit sensitive data disclosure to what is necessary.",
        raw_support: [{ source_release_id: "source.asvs.v5",
          source_locator: "v5.0.0-V14.2.6", raw_concept_id: "raw.asvs.v14.2.6" }],
        semantic_rationale: "The raw concept supports a reusable obligation." } });
    expect(raw.proposal.layer).toBe("raw_source_vocabulary");
    expect(canonical.proposal.layer).toBe("canonical_vocabulary");
  });

  it("rejects altered contents, unknown authority fields, and duplicate demand facts", () => {
    const proposal = policyProposal();
    expect(() => PolicyKnowledgeProposalSchema.parse({ ...proposal,
      governed_context: { ...proposal.governed_context,
        policy_taxonomy_revision: "1.2.0" } })).toThrow(/hash/u);
    expect(() => PolicyKnowledgeProposalSchema.parse({ ...proposal,
      publication_status: "accepted" })).toThrow();
    expect(() => createPolicyKnowledgeProposal({ ...proposal,
      governed_context: { ...context,
        demand_fact_ids: [context.demand_fact_ids[0]!, context.demand_fact_ids[0]!] } }))
      .toThrow(/unique/u);
  });

  it("creates redacted, content-addressed evidence with no authority", () => {
    const proposal = policyProposal();
    const evidence = createPolicyKnowledgeExecutionEvidence({ schema_version: "1.0.0",
      evidence_id: "evidence.execution.policy.001", request_id: "request.policy.001",
      attempt_id: "attempt.policy.001", agent_id: "ces.policy.taxonomy.agent",
      agent_version: "1.0.0", provider_id: "fixture", model_alias: "policy.default",
      resolved_model: "fixture-model-1", governed_context_hash: governedContextHash(context),
      proposal_id: proposal.proposal_id, proposal_hash: proposal.proposal_hash,
      validation: { status: "valid", validator_id: "ces.policy.proposal.validator",
        validator_version: "1.0.0", result_hash: "c".repeat(64) },
      executed_at: "2026-08-12T12:00:00+07:00",
      authority: { proposal_lifecycle: "proposed", review_status: "not_submitted",
        publication_status: "not_published", grants_policy_authority: false } });
    expect(evidence.authority.grants_policy_authority).toBe(false);
    expect(JSON.stringify(evidence)).not.toMatch(/prompt|document|credential|response/u);
    expect(() => PolicyKnowledgeExecutionEvidenceSchema.parse({ ...evidence,
      provider_id: "changed" })).toThrow(/hash/u);
  });
});
