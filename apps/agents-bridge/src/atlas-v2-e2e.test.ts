import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createAtlasSemanticFactExtractor } from
  "./agents/atlas-semantic-fact-extractor/agent.js";
import { parseRuntimeConfig } from "./config/environment.js";
import { AgentRegistry, ModelRegistry, ProviderRegistry, ToolRegistry,
  type AgentProvider } from "./core/registry.js";
import { createBridgeHandler } from "./server.js";

describe("Atlas V2 generic bridge qualification", () => {
  it("routes and validates semantic facts through the shared agent endpoint", async () => {
    const source = "# Orders\n\nOrders enables Payment.\n";
    const digest = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
    const revisionId = "bridge.document.prd.revision.one";
    const statement = { schema_version: "1.1.0", id: "bridge.document.prd.unit.one",
      document_revision_id: revisionId, kind: "paragraph", text: "Orders enables Payment.",
      exact_text: "Orders enables Payment.", location: { line_start: 3, line_end: 3 },
      section_path: ["Orders"], order: 0, content_hash: digest("Orders enables Payment."),
      exact_content_hash: digest("Orders enables Payment."), revision_hash: digest(source),
      source_kind: "markdown_text", language_detection: { detected_language: "en",
        language_detection_method: "deterministic", language_confidence: 1 } };
    const intermediate = { schema_version: "2.0.0" as const, facts: [{
      candidate_id: "bridge.candidate.sequence", kind: "activity_order" as const,
      exact_statement: "Orders enables Payment.", source_unit_ids: [statement.id],
      terms: [{ role_id: "source", exact_text: "Orders" },
        { role_id: "target", exact_text: "Payment" }],
      relation_kind: "enables", confidence: 1,
    }] };
    const providers = new ProviderRegistry();
    providers.register({ provider_id: "fixture", capabilities: ["structured-output"],
      async executeStructured(request, outputSchema) {
        expect(request.model_alias).toBe("atlas-fixture");
        return { output: outputSchema.parse(intermediate), provider_id: "fixture",
          requested_model_alias: request.model_alias, resolved_model: "fixture-model",
          finish_reason: "completed" };
      } } as AgentProvider);
    const agents = new AgentRegistry();
    agents.register(createAtlasSemanticFactExtractor({ model_alias: "atlas-fixture",
      provider_id: "fixture", policy: { timeout_ms: 1000, max_attempts: 2,
        max_input_bytes: 100000, max_output_bytes: 100000, max_output_tokens: 1000 } }));
    const models = new ModelRegistry();
    models.register({ alias: "atlas-fixture", provider_id: "fixture",
      physical_model: "fixture-model", capabilities: ["structured-output"] });
    const credential = "atlas-qualification-secret";
    const config = parseRuntimeConfig({ host: "127.0.0.1", port: 0,
      request_timeout_ms: 1000, provider_max_concurrency: 2,
      ceilings: { max_request_bytes: 100000, max_source_documents: 2,
        max_total_source_characters: 10000, max_single_source_characters: 10000,
        max_provider_response_bytes: 100000, max_output_tokens: 1000,
        max_provider_attempts: 2, max_timeout_ms: 2000 }, clients: [{
          credentials: [credential], identity: { client_id: "qualification",
            audit_identity: "Qualification", allowed_agents: ["atlas.semantic-fact-extractor"],
            allowed_routes: ["/v1/agents/:agentId/execute"], max_concurrency: 1,
            requests_per_minute: 10 } }] });
    const handle = createBridgeHandler({ config,
      registries: { agents, providers, models, tools: new ToolRegistry() },
      logger: { log: () => undefined } });
    const hash = digest(source);
    const input = { schema_version: "2.0.0", project_id: "bridge",
      documents: [{ document_id: "bridge.document.prd",
        document_revision_id: revisionId, revision: 1,
        content_hash: hash, media_type: "text/markdown", original_name: "orders.md" }],
      source_units: [statement] };
    const response = await handle({ method: "POST",
      url: "/v1/agents/atlas.semantic-fact-extractor/execute",
      headers: { authorization: `Bearer ${credential}` }, body: (async function* () {
        yield JSON.stringify({ agent_version: "2.0.0", input });
      })() });
    expect(response.status).toBe(200);
    const output = JSON.parse(response.body);
    expect(output.facts[0].exact_statement).toBe("Orders enables Payment.");
    expect(output.evidence[0].exact_text).toContain("Orders enables Payment.");
  });
});
