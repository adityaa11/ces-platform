import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createHash } from "node:crypto";
import { AgentRegistry, ModelRegistry, ProviderRegistry, ToolRegistry, type AgentProvider } from "../core/registry.js";
import { createPolicyKnowledgeReplayExecutor } from "./policy-knowledge-replay-executor.js";
describe("AGB-014 canonical registered replay adapter", () => {
  it("executes the route-selected registered agent and binds support evidence", async () => {
    const agents = new AgentRegistry(); const input = z.object({ fact_id: z.string() }).strict();
    const output = z.object({ proposal_hash: z.string().length(64) }).strict();
    agents.register({ id: "ces.source-knowledge-agent", version: "1.0.0", description: "fixture",
      mode: "structured-generation", input_schema: input, intermediate_schema: output, output_schema: output,
      execution_policy: { allowed_providers: ["fixture"], allowed_model_aliases: ["policy-default"], allowed_tools: [],
        timeout_ms: 1_000, max_attempts: 1, max_input_bytes: 10_000, max_output_bytes: 10_000,
        max_output_tokens: 1_000, requires_structured_output: true, requires_human_review: true },
      buildExecutionRequest: () => ({ system_instructions: "Return bounded proposal evidence.", messages: [{ role: "user",
        content: "bounded" }], response_json_schema: z.toJSONSchema(output), model_alias: "policy-default", max_output_tokens: 1_000 }),
      transformResult: async (value) => value });
    const provider: AgentProvider = { provider_id: "fixture", capabilities: ["structured-output"],
      async executeStructured<TOutput>(_request: unknown, schema: z.ZodType<TOutput>) { return { output: schema.parse({ proposal_hash: "b".repeat(64) }), provider_id: "fixture",
        requested_model_alias: "policy-default", resolved_model: "fixture", finish_reason: "completed" }; } };
    const providers = new ProviderRegistry(); providers.register(provider); const models = new ModelRegistry();
    models.register({ alias: "policy-default", provider_id: "fixture", physical_model: "fixture",
      capabilities: ["structured-output"] }); const tools = new ToolRegistry();
    const executor = createPolicyKnowledgeReplayExecutor({ resolve_invocation: (route) => ({ value: { fact_id: route.fact_id },
      client: { client_id: "policy-client", audit_identity: "Replay test", allowed_agents: [route.agent_id],
        allowed_routes: ["agent"], max_concurrency: 1, requests_per_minute: 10 }, ceilings: { max_request_bytes: 10_000,
        max_source_documents: 1, max_total_source_characters: 10_000, max_single_source_characters: 10_000,
        max_provider_response_bytes: 10_000, max_output_tokens: 1_000, max_provider_attempts: 1, max_timeout_ms: 1_000 },
      registries: { agents, providers, models, tools }, signal: new AbortController().signal }) });
    const evidence = "candidate"; const evidenceHash = createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
    const support = { fact_id: "safara.manual.fact.0024", support: [{ support_id: "source.one",
      kind: "source_candidate" as const, evidence_hash: evidenceHash, evidence }] };
    const supportHash = createHash("sha256").update(JSON.stringify(support)).digest("hex");
    const result = await executor({ fact_id: support.fact_id, gap_id: "gap.fact.0024",
      earliest_incomplete_layer: "raw_source_vocabulary", agent_id: "ces.source-knowledge-agent",
      support_branch: support as any, support_evidence_hash: supportHash, workflow: {} } as any);
    expect(result).toEqual({ agent_id: "ces.source-knowledge-agent", agent_version: "1.0.0",
      support_evidence_hash: supportHash, proposal_hash: "b".repeat(64),
      proposal: { proposal_hash: "b".repeat(64) } });
  });
});
