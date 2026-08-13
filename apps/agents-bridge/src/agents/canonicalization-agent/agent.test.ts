import { describe, expect, it } from "vitest";
import { createPolicyKnowledgeAgentRequest } from "@company/ces-policy-knowledge-proposals";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { executeRegisteredAgent } from "../../core/executor.js";
import { AgentRegistry, ModelRegistry, ProviderRegistry, ToolRegistry, type AgentProvider } from
  "../../core/registry.js";
import { createCanonicalizationAgent } from "./agent.js";
import { canonicalPredecessorHash, resolveAcceptedCanonicalizationKnowledge } from
  "./governed-knowledge.js";
const cases = [
  { raw: "raw.asvs.v2-3-1", locator: "v5.0.0-V2.3.1", predecessor: CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
    id: "ces.sequential-business-flow", term: "Sequential business flow",
    definition: "A user's required business flow proceeds in its expected sequential step order without skipped steps." },
  { raw: "raw.asvs.v14-1-1", locator: "v5.0.0-V14.1.1", predecessor: CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
    id: "ces.sensitive-data-classification", term: "Sensitive-data classification",
    definition: "Sensitive data created and processed by software is identified and classified into protection levels that account for applicable data-protection and privacy requirements, including easily decoded data." },
  { raw: "raw.asvs.v14-2-6", locator: "v5.0.0-V14.2.6", predecessor: CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
    id: "ces.sensitive-data-disclosure-minimization", term: "Sensitive-data disclosure minimization",
    definition: "Software returns only the minimum sensitive data required for its functionality and masks complete values in the user interface unless the user specifically views them." },
] as const;
function envelope(value: typeof cases[number]) { return createPolicyKnowledgeAgentRequest({ schema_version: "1.0.0",
  request_id: `request.canonical.${value.raw.replaceAll(".", "-")}`, lifecycle: "proposed",
  governed_context: { gap_id: "gap.canonical", gap_fingerprint: "a".repeat(64), demand_fact_ids: ["safara.manual.fact.0016"],
    source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
    canonical_vocabulary_revision: value.predecessor.vocabulary_revision, policy_taxonomy_revision: "1.1.0",
    predecessor_artifact_id: value.predecessor.vocabulary_id,
    predecessor_artifact_hash: canonicalPredecessorHash(value.predecessor) },
  request: { layer: "canonical_vocabulary", gap_route: "CANONICALIZATION_GAP",
    bounded_task: "Canonicalize accepted raw support.", accepted_raw_support: [{ source_release_id: "owasp.asvs.5-0-0",
      source_locator: value.locator, raw_concept_id: value.raw }], existing_canonical_concept_ids: [] } }); }
async function execute(value: typeof cases[number], incomplete = false) {
  const request = envelope(value); const knowledge = resolveAcceptedCanonicalizationKnowledge(request);
  const agents = new AgentRegistry(); agents.register(createCanonicalizationAgent({ model_alias: "policy-default",
    provider_id: "fixture", resolve_knowledge: resolveAcceptedCanonicalizationKnowledge, policy: {} }));
  const provider: AgentProvider = { provider_id: "fixture", capabilities: ["structured-output"],
    async executeStructured(_request, schema) { return { output: schema.parse({ decision: "ADD",
      proposed_canonical_concept_id: value.id, preferred_term: value.term, definition: value.definition,
      raw_support: knowledge.raw_support, semantic_rationale: "The accepted raw meaning supports a distinct reusable obligation.",
      predecessor_comparisons: knowledge.predecessor_concepts.slice(incomplete ? 1 : 0).map(({ concept_id }) =>
        ({ target_canonical_concept_id: concept_id, relationship: "distinct", rationale: "The governed meanings differ." })) }),
      provider_id: "fixture", requested_model_alias: "policy-default", resolved_model: "fixture", finish_reason: "completed" }; } };
  const providers = new ProviderRegistry(); providers.register(provider); const models = new ModelRegistry();
  models.register({ alias: "policy-default", provider_id: "fixture", physical_model: "fixture", capabilities: ["structured-output"] });
  return executeRegisteredAgent({ agent_id: "ces.canonicalization-agent", agent_version: "1.0.0", value: { request },
    client: { client_id: "policy-client", audit_identity: "Policy test", allowed_agents: ["ces.canonicalization-agent"],
      allowed_routes: ["agent"], max_concurrency: 1, requests_per_minute: 10 },
    ceilings: { max_request_bytes: 2_000_000, max_source_documents: 20, max_total_source_characters: 5_000_000,
      max_single_source_characters: 1_000_000, max_provider_response_bytes: 2_000_000, max_output_tokens: 20_000,
      max_provider_attempts: 3, max_timeout_ms: 100_000 }, registries: { agents, providers, models, tools: new ToolRegistry() },
    signal: new AbortController().signal });
}
describe("AGB-013 canonicalization agent", () => {
  it.each(cases)("replays $id with complete lineage and comparisons", async (value) => {
    const output: any = await execute(value); expect(output).toMatchObject({ lifecycle: "proposed",
      proposal: { decision: "ADD", proposed_canonical_concept_id: value.id,
        raw_support: [{ raw_concept_id: value.raw }] } });
    expect(output.proposal.predecessor_comparisons).toHaveLength(value.predecessor.concepts.length);
  });
  it("fails closed when a predecessor comparison is missing", async () => {
    await expect(execute(cases[0], true)).rejects.toMatchObject({ code: "INVALID_AGENT_RESULT" });
  });
});
