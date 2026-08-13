import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadManualSafaraDemandFacts } from "@company/ces-policy-manual-demand-adapter";
import { evaluateSafaraBootstrapCoverage, evaluateSafaraBootstrapCoverageV4 } from "@company/ces-policy-safara-bootstrap";
import { acceptedPolicySupport, runGovernedKnowledgeReplay, safaraSemanticProjection } from
  "@company/ces-policy-knowledge-orchestration";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { AgentRegistry, ModelRegistry, ProviderRegistry, ToolRegistry, type AgentProvider } from "../core/registry.js";
import { createSourceKnowledgeAgent } from "./source-knowledge-agent/agent.js";
import { resolveAcceptedGovernedSource } from "./source-knowledge-agent/governed-source.js";
import { createCanonicalizationAgent } from "./canonicalization-agent/agent.js";
import { resolveAcceptedCanonicalizationKnowledge } from "./canonicalization-agent/governed-knowledge.js";
import { createPolicyTaxonomyAgent } from "./policy-taxonomy-agent/agent.js";
import { resolveAcceptedPolicyTaxonomyKnowledge } from "./policy-taxonomy-agent/governed-knowledge.js";
import { acceptedSafaraAgentValue } from "./accepted-safara-replay-invocation.js";
import { createPolicyKnowledgeReplayExecutor } from "./policy-knowledge-replay-executor.js";
const root = resolve(import.meta.dirname, "../../../.."); const fixture = resolve(root, "fixtures/policies/safara-v1.1-cycle-01");
function facts() { const bytes = readFileSync(resolve(fixture, "manual-facts.json")); return loadManualSafaraDemandFacts({
  sourceManifest: JSON.parse(readFileSync(resolve(fixture, "source-manifest.json"), "utf8")), inventory: JSON.parse(bytes.toString()),
  inventoryBytes: bytes, reviewRecord: JSON.parse(readFileSync(resolve(fixture, "human-review-record.json"), "utf8")),
  sourcePdfBytes: readFileSync(resolve(root, "docs/prd/Safara_Buyer_Business_PRD.pdf")) }); }
describe("AGB-014 accepted-agent integrated replay", () => {
  it("drives V1 to the golden projection through all three accepted registered agents", async () => {
    const agents = new AgentRegistry(); agents.register(createSourceKnowledgeAgent({ model_alias: "policy-default",
      provider_id: "fixture", resolve_governed_source: resolveAcceptedGovernedSource, policy: {} }));
    agents.register(createCanonicalizationAgent({ model_alias: "policy-default", provider_id: "fixture",
      resolve_knowledge: resolveAcceptedCanonicalizationKnowledge, policy: {} }));
    agents.register(createPolicyTaxonomyAgent({ model_alias: "policy-default", provider_id: "fixture",
      resolve_governed_knowledge: resolveAcceptedPolicyTaxonomyKnowledge, policy: {} }));
    const provider: AgentProvider = { provider_id: "fixture", capabilities: ["structured-output"],
      async executeStructured(_request: any, schema: any) { const request: any = _request; const body = JSON.parse(request.messages[0].content);
        return { output: schema.parse(providerOutput(body)), provider_id: "fixture", requested_model_alias: "policy-default",
          resolved_model: "fixture", finish_reason: "completed" } as any; } };
    const providers = new ProviderRegistry(); providers.register(provider); const models = new ModelRegistry();
    models.register({ alias: "policy-default", provider_id: "fixture", physical_model: "fixture", capabilities: ["structured-output"] });
    const registries = { agents, providers, models, tools: new ToolRegistry() }; const executed: string[] = [];
    const executor = createPolicyKnowledgeReplayExecutor({ resolve_invocation: (route) => ({ value: acceptedSafaraAgentValue(route),
      client: { client_id: "policy-client", audit_identity: "Integrated replay", allowed_agents: [route.agent_id],
        allowed_routes: ["agent"], max_concurrency: 1, requests_per_minute: 100 }, ceilings: { max_request_bytes: 2_000_000,
        max_source_documents: 20, max_total_source_characters: 5_000_000, max_single_source_characters: 1_000_000,
        max_provider_response_bytes: 2_000_000, max_output_tokens: 20_000, max_provider_attempts: 3, max_timeout_ms: 90_000 },
      registries, signal: new AbortController().signal }) });
    let publication = 0; const input = facts(); const replay = await runGovernedKnowledgeReplay({
      initial_coverage: evaluateSafaraBootstrapCoverage(input), max_cycles: 20,
      execute_registered_agent: async (route) => { executed.push(route.agent_id); return executor(route); },
      consume_external_publication: async (route, execution) => { publication++; const proposal: any = execution.proposal;
        const common = { publication_id: `publication.integrated.${publication}`, authority_evidence_id: `authority.integrated.${publication}`,
          proposal_hash: execution.proposal_hash, agent_id: route.agent_id, layer: route.earliest_incomplete_layer };
        if (route.earliest_incomplete_layer === "raw_source_vocabulary") return { ...common,
          source_locator: proposal.proposal.source_locator, raw_concept_id: proposal.proposal.proposed_raw_concept_id };
        if (route.earliest_incomplete_layer === "canonical_vocabulary") return { ...common,
          raw_concept_id: proposal.proposal.raw_support[0].raw_concept_id,
          canonical_concept_id: proposal.proposal.proposed_canonical_concept_id };
        return { ...common, policy_support: acceptedPolicySupport(
          proposal.proposal.decisions[0].canonical_concept_id) }; } });
    expect(new Set(executed)).toEqual(new Set(["ces.source-knowledge-agent", "ces.canonicalization-agent",
      "ces.policy-taxonomy-agent"]));
    expect(safaraSemanticProjection(replay.coverage)).toEqual(safaraSemanticProjection(evaluateSafaraBootstrapCoverageV4(input)));
  });
});
function providerOutput(body: any) {
  if (body.governed_source) { const source = body.governed_source; return { decision: "ADD",
    proposed_raw_concept_id: source.source_locator.endsWith("V14.2.6") ? "raw.asvs.v14-2-6" : "raw.asvs.v14-1-1",
    bounded_meaning: source.exact_source_excerpt, source_release_id: source.source_release_id,
    source_locator: source.source_locator, semantic_rationale: "The authorized fact-local row supports this bounded concept." }; }
  if (body.raw_semantic_evidence) { const raw = body.raw_semantic_evidence[0]; const mapping =
    CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.mappings.find(({ raw_concept_id }) => raw_concept_id === raw.raw_concept_id)!;
    const concept = CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.concepts.find(({ concept_id }) =>
      concept_id === mapping.canonical_concept_id)!; return { decision: "ADD", target_canonical_concept_id: null,
      proposed_canonical_concept_id: concept.concept_id, preferred_term: concept.preferred_term, definition: concept.definition,
      raw_support: body.raw_support, semantic_rationale: mapping.rationale, raw_distinction_justifications: [],
      proposed_raw_mappings: [{ raw_concept_id: raw.raw_concept_id, relationship: "supports", rationale: mapping.rationale }],
      predecessor_comparisons: body.predecessor_concepts.map(({ concept_id }: any) => ({ target_canonical_concept_id: concept_id,
        relationship: "distinct", rationale: "The governed predecessor meaning is distinct." })) }; }
  const obligation = body.approved_canonical_obligations[0]; const sequential = obligation.concept_id === "ces.sequential-business-flow";
  const policy = acceptedPolicySupport(obligation.concept_id); return { decisions: [{ canonical_concept_id: obligation.concept_id,
    decision: "ADD", target_policy_id: policy.policy_id, rationale: "The obligation is distinct from the predecessor taxonomy." }],
  proposed_policy: { policy_id: policy.policy_id, title: sequential ? "Sequential Business Flow" : "Sensitive Data Protection",
    obligation: obligation.definition, canonical_support_ids: [obligation.concept_id], lifecycle: "candidate", approval_status: "proposed" },
  semantic_comparisons: body.predecessor_policies.map(({ policy_id }: any) => ({ subject_canonical_concept_id: obligation.concept_id,
    comparison_target_id: policy_id, relationship: "distinct", rationale: "The governed obligations are distinct." })) };
}
