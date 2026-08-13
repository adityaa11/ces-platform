import { describe, expect, it } from "vitest";
import { createPolicyKnowledgeAgentRequest } from "@company/ces-policy-knowledge-proposals";
import { CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import { executeRegisteredAgent } from "../../core/executor.js";
import { AgentRegistry, ModelRegistry, ProviderRegistry, ToolRegistry,
  type AgentProvider } from "../../core/registry.js";
import { createSourceKnowledgeAgent } from "./agent.js";
import { RAW_V1_1_ARTIFACT_HASH, RAW_V1_1_ARTIFACT_ID,
  resolveAcceptedGovernedSource } from "./governed-source.js";
function request(locator: string, hints: string[] = []) { return createPolicyKnowledgeAgentRequest({
  schema_version: "1.0.0", request_id: `request.extract.${locator.endsWith("1.1") ? "classification" : "disclosure"}`,
  lifecycle: "proposed", governed_context: { gap_id: "gap.extraction", gap_fingerprint: "a".repeat(64),
    demand_fact_ids: ["safara.manual.fact.0027"], source_glossary_revision: "1.1.0",
    raw_vocabulary_revision: "1.1.0", canonical_vocabulary_revision: "1.5.0",
    policy_taxonomy_revision: "1.1.0", predecessor_artifact_id: RAW_V1_1_ARTIFACT_ID,
    predecessor_artifact_hash: RAW_V1_1_ARTIFACT_HASH }, request: { layer: "raw_source_vocabulary",
    gap_route: "EXTRACTION_GAP", bounded_task: "Extract this exact authorized ASVS row.",
    governed_source_release_ids: ["owasp.asvs.5-0-0"], source_locator_candidates: [locator],
    existing_raw_concept_ids: hints } }); }
async function execute(locator: string, proposedId: string, decision: "ADD" | "REJECT" = "ADD") {
  const envelope = request(locator); const source = resolveAcceptedGovernedSource(envelope);
  const agents = new AgentRegistry(); agents.register(createSourceKnowledgeAgent({ model_alias: "policy-default",
    provider_id: "fixture", resolve_governed_source: resolveAcceptedGovernedSource, policy: {} }));
  const provider: AgentProvider = { provider_id: "fixture", capabilities: ["structured-output"],
    async executeStructured(_request, schema) { return { output: schema.parse({ decision,
      proposed_raw_concept_id: proposedId, bounded_meaning: source.exact_source_excerpt,
      source_release_id: source.source_release_id, source_locator: source.source_locator,
      semantic_rationale: "The authorized source row supplies one bounded software requirement." }),
    provider_id: "fixture", requested_model_alias: "policy-default", resolved_model: "fixture",
    finish_reason: "completed" }; } };
  const providers = new ProviderRegistry(); providers.register(provider); const models = new ModelRegistry();
  models.register({ alias: "policy-default", provider_id: "fixture", physical_model: "fixture",
    capabilities: ["structured-output"] });
  return executeRegisteredAgent({ agent_id: "ces.source-knowledge-agent", agent_version: "1.0.0",
    value: { request: envelope }, client: { client_id: "policy-client", audit_identity: "Policy test",
      allowed_agents: ["ces.source-knowledge-agent"], allowed_routes: ["agent"], max_concurrency: 1,
      requests_per_minute: 10 }, ceilings: { max_request_bytes: 2_000_000, max_source_documents: 20,
      max_total_source_characters: 5_000_000, max_single_source_characters: 1_000_000,
      max_provider_response_bytes: 2_000_000, max_output_tokens: 20_000, max_provider_attempts: 3,
      max_timeout_ms: 100_000 }, registries: { agents, providers, models, tools: new ToolRegistry() },
    signal: new AbortController().signal });
}
describe("AGB-012 governed extraction production path", () => {
  it.each([["v5.0.0-V14.1.1", "raw.asvs.v14-1-1"], ["v5.0.0-V14.2.6",
    "raw.asvs.v14-2-6"]])("derives %s and matches the v1.2 oracle semantically", async (locator, id) => {
    const output: any = await execute(locator, id); const oracle =
      CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.corpus.vocabularies.flatMap(({ concepts }) => concepts)
        .find(({ concept_id }) => concept_id === id)!;
    expect(output.proposal).toMatchObject({ decision: "ADD", source_locator: locator,
      bounded_meaning: oracle.bounded_description, extraction_evidence: { semantic_role: oracle.semantic_role,
        scope_disposition: oracle.scope_disposition, predecessor_artifact_id: RAW_V1_1_ARTIFACT_ID } });
    expect(output.proposal.extraction_evidence.governed_source_content_hash).toMatch(/^sha256:/u);
  });
  it("ignores caller duplicate hints and detects predecessor meaning", () => {
    const fresh = resolveAcceptedGovernedSource(request("v5.0.0-V14.1.1", ["raw.fake"]));
    expect(fresh.equivalent_predecessor_concept_id).toBeNull();
    const duplicate = resolveAcceptedGovernedSource(request("v5.0.0-V14.2.1", []));
    expect(duplicate.equivalent_predecessor_concept_id).toBe("raw.asvs.v14-2-1");
    expect(() => resolveAcceptedGovernedSource({ ...request("v5.0.0-V14.1.1"),
      governed_context: { ...request("v5.0.0-V14.1.1").governed_context,
        predecessor_artifact_hash: "f".repeat(64) } })).toThrow(/predecessor/u);
  });
  it("rejects an equivalent predecessor even under a different proposed ID", async () => {
    const output: any = await execute("v5.0.0-V14.2.1", "raw.alternate.same-meaning", "REJECT");
    expect(output.proposal).toMatchObject({ decision: "REJECT",
      proposed_raw_concept_id: "raw.alternate.same-meaning" });
  });
});
