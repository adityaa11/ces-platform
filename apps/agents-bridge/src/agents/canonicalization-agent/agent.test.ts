import { describe, expect, it } from "vitest";
import { CanonicalKnowledgeRequestSchema, createPolicyKnowledgeAgentRequest } from
  "@company/ces-policy-knowledge-proposals";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
  CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { executeRegisteredAgent } from "../../core/executor.js";
import { AgentRegistry, ModelRegistry, ProviderRegistry, ToolRegistry, type AgentProvider } from
  "../../core/registry.js";
import { createCanonicalizationAgent } from "./agent.js";
import { canonicalPredecessorHash, resolveAcceptedCanonicalizationKnowledge } from "./governed-knowledge.js";
type Decision = "ADD" | "MERGE" | "ALIAS" | "REJECT";
const oracleCases = [
  { raw: "raw.asvs.v2-3-1", locator: "v5.0.0-V2.3.1",
    predecessor: CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
    oracle: CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3 },
  { raw: "raw.asvs.v14-1-1", locator: "v5.0.0-V14.1.1",
    predecessor: CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
    oracle: CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 },
  { raw: "raw.asvs.v14-2-6", locator: "v5.0.0-V14.2.6",
    predecessor: CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3,
    oracle: CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 },
].map((value) => { const mapping = value.oracle.mappings.find(({ raw_concept_id }) => raw_concept_id === value.raw)!;
  const concept = value.oracle.concepts.find(({ concept_id }) => concept_id === mapping.canonical_concept_id)!;
  const decision = value.oracle.decisions.find(({ affected_raw_concept_ids }) => affected_raw_concept_ids.includes(value.raw as never))!;
  return { ...value, concept, mapping, decision }; });
function envelope(value: typeof oracleCases[number]) { return createPolicyKnowledgeAgentRequest({ schema_version: "1.0.0",
  request_id: `request.canonical.${value.raw.replaceAll(".", "-")}`, lifecycle: "proposed",
  governed_context: { gap_id: "gap.canonical", gap_fingerprint: "a".repeat(64), demand_fact_ids: ["safara.manual.fact.0016"],
    source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
    canonical_vocabulary_revision: value.predecessor.vocabulary_revision, policy_taxonomy_revision: "1.1.0",
    predecessor_artifact_id: value.predecessor.vocabulary_id, predecessor_artifact_hash: canonicalPredecessorHash(value.predecessor) },
  request: { layer: "canonical_vocabulary", gap_route: "CANONICALIZATION_GAP", bounded_task: "Canonicalize accepted raw support.",
    accepted_raw_support: [{ source_release_id: value.mapping.raw_source_release_id,
      source_locator: value.locator, raw_concept_id: value.raw }], existing_canonical_concept_ids: [] } }); }
async function execute(value: typeof oracleCases[number], decision: Decision = "ADD", target: string | null = null,
  targetRelationship: "distinct" | "overlaps" | "subsumes" | "equivalent" | "unsupported" = "distinct",
  omitComparison = false, requestOverride?: ReturnType<typeof envelope>, distinctions: any[] = []) {
  const request = requestOverride ?? envelope(value); const knowledge = resolveAcceptedCanonicalizationKnowledge(request);
  const agents = new AgentRegistry(); agents.register(createCanonicalizationAgent({ model_alias: "policy-default",
    provider_id: "fixture", resolve_knowledge: resolveAcceptedCanonicalizationKnowledge, policy: {} }));
  const provider: AgentProvider = { provider_id: "fixture", capabilities: ["structured-output"],
    async executeStructured(_request, schema) { return { output: schema.parse({ decision,
      target_canonical_concept_id: target, proposed_canonical_concept_id: value.concept.concept_id,
      preferred_term: value.concept.preferred_term, definition: value.concept.definition,
      raw_support: knowledge.raw_support, semantic_rationale: value.decision.rationale,
      raw_distinction_justifications: distinctions,
      predecessor_comparisons: knowledge.predecessor_concepts.slice(omitComparison ? 1 : 0).map(({ concept_id }, index) =>
        ({ target_canonical_concept_id: concept_id,
          relationship: concept_id === target || (!target && index === 0) ? targetRelationship : "distinct",
          rationale: "The governed meanings were compared explicitly." })) }), provider_id: "fixture",
      requested_model_alias: "policy-default", resolved_model: "fixture", finish_reason: "completed" }; } };
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
describe("AGB-013 governed canonicalization", () => {
  it.each(oracleCases)("replays accepted oracle for $raw without runtime successor input", async (value) => {
    const output: any = await execute(value); expect(output.proposal).toMatchObject({ decision: "ADD",
      proposed_canonical_concept_id: value.concept.concept_id, preferred_term: value.concept.preferred_term,
      definition: value.concept.definition, raw_support: [{ raw_concept_id: value.mapping.raw_concept_id }],
      raw_semantic_evidence: [{ raw_concept_id: value.raw, semantic_role: "requirement",
        extraction_input_hash: expect.stringMatching(/^sha256:/u) }] });
  });
  it.each([["ADD", null, "distinct"], ["MERGE", null, "overlaps"], ["ALIAS", null, "equivalent"],
    ["REJECT", null, "equivalent"]] as const)("accepts consistent %s and rejects contradiction", async (decision, _unused, relation) => {
    const target = decision === "ADD" ? null : oracleCases[0]!.predecessor.concepts[0]!.concept_id;
    await expect(execute(oracleCases[0]!, decision, target, relation)).resolves.toBeTruthy();
    const badRelation = decision === "ADD" ? "equivalent" : "distinct";
    await expect(execute(oracleCases[0]!, decision, target, badRelation)).rejects
      .toMatchObject({ code: "INVALID_AGENT_RESULT" });
  });
  it("fails closed on incomplete comparisons and invented targets", async () => {
    await expect(execute(oracleCases[0]!, "ADD", null, "distinct", true)).rejects
      .toMatchObject({ code: "INVALID_AGENT_RESULT" });
    await expect(execute(oracleCases[0]!, "ALIAS", "ces.invented", "equivalent")).rejects
      .toMatchObject({ code: "INVALID_AGENT_RESULT" });
  });
  it("preserves related raw concepts with different semantic roles", async () => {
    const predecessor = CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1;
    const base = envelope(oracleCases[0]!);
    const related = createPolicyKnowledgeAgentRequest({ schema_version: "1.0.0",
      request_id: "request.canonical.role-distinction", lifecycle: "proposed",
      governed_context: { ...base.governed_context, canonical_vocabulary_revision: predecessor.vocabulary_revision,
        predecessor_artifact_id: predecessor.vocabulary_id, predecessor_artifact_hash: canonicalPredecessorHash(predecessor) },
      request: CanonicalKnowledgeRequestSchema.parse({ layer: "canonical_vocabulary", gap_route: "CANONICALIZATION_GAP",
        bounded_task: "Preserve related WSTG role distinctions.", existing_canonical_concept_ids: [],
        accepted_raw_support: [
          { source_release_id: "owasp.wstg.4-2", source_locator: "WSTG-v42-ATHZ-04",
            raw_concept_id: "raw.wstg.athz-04.context" },
          { source_release_id: "owasp.wstg.4-2", source_locator: "WSTG-v42-ATHZ-04",
            raw_concept_id: "raw.wstg.athz-04.concern" }] }) });
    await expect(execute(oracleCases[0]!, "ADD", null, "distinct", false, related)).rejects
      .toMatchObject({ code: "INVALID_AGENT_RESULT" });
    const output: any = await execute(oracleCases[0]!, "ADD", null, "distinct", false, related,
      [{ first_raw_concept_id: "raw.wstg.athz-04.context", second_raw_concept_id: "raw.wstg.athz-04.concern",
        relationship: "distinct", rationale: "Verification context and risk concern remain distinct semantic roles." }]);
    expect(output.proposal.raw_semantic_evidence.map(({ semantic_role }: any) => semantic_role).sort())
      .toEqual(["risk_concern", "verification_context"]);
  });
});
