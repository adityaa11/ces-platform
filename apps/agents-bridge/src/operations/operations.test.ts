import { describe, expect, it, vi } from "vitest";
import { z, type ZodType } from "zod";
import {
  AgentRegistry,
  ModelRegistry,
  ProviderRegistry,
  ToolRegistry,
  executeRegisteredAgent,
  validateRegistries,
  type AgentProvider,
  type StructuredGenerationRequest,
} from "../index.js";

describe("bridge operational extension boundary", () => {
  it("executes a second registered agent and provider without shared-executor changes", async () => {
    const firstExecute = vi.fn();
    const secondExecute = vi.fn();
    const provider = (providerId: string, execute: (request: StructuredGenerationRequest) => void): AgentProvider => ({
      provider_id: providerId,
      capabilities: ["structured-output"],
      async executeStructured<TOutput>(
        request: StructuredGenerationRequest,
        schema: ZodType<TOutput>,
      ) {
        execute(request);
        return {
          output: schema.parse(`${providerId} result`) as TOutput,
          provider_id: providerId,
          requested_model_alias: request.model_alias,
          resolved_model: `${providerId}-model`,
          finish_reason: "completed",
        };
      },
    });
    const agents = new AgentRegistry();
    for (const [id, alias] of [["fixture.first", "first-default"], ["fixture.second", "second-default"]] as const) {
      agents.register({
        id,
        version: "1.0.0",
        description: `${id} deterministic fixture`,
        mode: "structured-generation",
        input_schema: z.object({ value: z.string() }).strict(),
        intermediate_schema: z.string(),
        output_schema: z.object({ result: z.string() }).strict(),
        execution_policy: {
          allowed_providers: [alias.replace("-default", "")],
          allowed_model_aliases: [alias],
          allowed_tools: [],
          timeout_ms: 500,
          max_attempts: 1,
          max_input_bytes: 512,
          max_output_bytes: 512,
          max_output_tokens: 50,
          requires_structured_output: true,
          requires_human_review: false,
        },
        buildExecutionRequest: (input) => ({
          system_instructions: "Deterministic fixture",
          messages: [{ role: "user", content: input.value }],
          response_json_schema: { type: "string" },
          model_alias: alias,
          max_output_tokens: 50,
        }),
        transformResult: async (result) => ({ result }),
      });
    }
    const providers = new ProviderRegistry();
    providers.register(provider("first", firstExecute));
    providers.register(provider("second", secondExecute));
    const models = new ModelRegistry();
    models.register({
      alias: "first-default",
      provider_id: "first",
      physical_model: "first-model",
      capabilities: ["structured-output"],
    });
    models.register({
      alias: "second-default",
      provider_id: "second",
      physical_model: "second-model",
      capabilities: ["structured-output"],
    });
    const registries = { agents, providers, models, tools: new ToolRegistry() };
    validateRegistries(registries);

    await expect(executeRegisteredAgent({
      agent_id: "fixture.second",
      agent_version: "1.0.0",
      value: { value: "input" },
      client: {
        client_id: "fixture-client",
        audit_identity: "Fixture Client",
        allowed_agents: ["fixture.second"],
        allowed_routes: ["agent"],
        max_concurrency: 1,
        requests_per_minute: 10,
      },
      ceilings: {
        max_request_bytes: 1024,
        max_source_documents: 2,
        max_total_source_characters: 1000,
        max_single_source_characters: 800,
        max_provider_response_bytes: 1024,
        max_output_tokens: 100,
        max_provider_attempts: 2,
        max_timeout_ms: 1000,
      },
      registries,
      signal: new AbortController().signal,
    })).resolves.toEqual({ result: "second result" });
    expect(secondExecute).toHaveBeenCalledOnce();
    expect(firstExecute).not.toHaveBeenCalled();
  });
});
