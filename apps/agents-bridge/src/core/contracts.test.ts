import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  CANONICAL_AGENT_ROUTE,
  AgentRegistry,
  GenericAgentExecutionRequestSchema,
  ModelRegistry,
  ProviderRegistry,
  StructuredGenerationRequestSchema,
  ToolRegistry,
  assertPolicyWithinCeilings,
  authorizeAgent,
  validateRegistries,
  type AgentProvider,
  type StructuredGenerationPolicy,
  type StructuredGenerationAgentDefinition,
} from "../index.js";

const ceilings = {
  max_request_bytes: 1000,
  max_source_documents: 2,
  max_total_source_characters: 800,
  max_single_source_characters: 500,
  max_provider_response_bytes: 500,
  max_output_tokens: 100,
  max_provider_attempts: 2,
  max_timeout_ms: 1000,
};
const policy: StructuredGenerationPolicy = {
  allowed_providers: ["fixture"],
  allowed_model_aliases: ["atlas-default"],
  allowed_tools: [],
  timeout_ms: 500,
  max_attempts: 2,
  max_input_bytes: 900,
  max_output_bytes: 400,
  max_output_tokens: 80,
  requires_structured_output: true,
  requires_human_review: true,
};

function agent(): StructuredGenerationAgentDefinition<string, string, string> {
  return {
    id: "fixture.requirement-extractor",
    version: "1.0.0",
    description: "fixture",
    mode: "structured-generation",
    input_schema: z.string(),
    intermediate_schema: z.string(),
    output_schema: z.string(),
    execution_policy: policy,
    buildExecutionRequest: () => ({
      system_instructions: "extract",
      messages: [{ role: "user", content: "input" }],
      response_json_schema: { type: "string" },
      model_alias: "atlas-default",
      max_output_tokens: 80,
    }),
    transformResult: async (result) => result,
  };
}

const provider: AgentProvider = {
  provider_id: "fixture",
  capabilities: ["structured-output"],
  executeStructured: async (request, outputSchema) => ({
    output: outputSchema.parse("result"),
    provider_id: "fixture",
    requested_model_alias: request.model_alias,
    resolved_model: "fixture-1",
    finish_reason: "completed",
  }),
};

describe("Agents Bridge contracts and registries", () => {
  it("rejects caller-controlled execution configuration", () => {
    expect(GenericAgentExecutionRequestSchema.parse({
      agent_version: "1.0.0",
      input: {},
    })).toBeTruthy();
    expect(() => GenericAgentExecutionRequestSchema.parse({
      agent_version: "1.0.0",
    })).toThrow("Agent input is required");
    for (const field of ["system_prompt", "provider_url", "api_key", "model", "tools"]) {
      expect(() => GenericAgentExecutionRequestSchema.parse({
        agent_version: "1.0.0",
        input: {},
        [field]: "untrusted",
      })).toThrow();
    }
    expect(() => StructuredGenerationRequestSchema.parse({
      system_instructions: "x",
      messages: [{ role: "user", content: "x" }],
      response_json_schema: {},
      model_alias: "atlas-default",
      max_output_tokens: 1,
      provider_url: "https://untrusted.invalid",
    })).toThrow();
  });

  it("enforces service ceilings and per-client agent authorization", () => {
    expect(assertPolicyWithinCeilings(policy, ceilings)).toEqual(policy);
    expect(() => assertPolicyWithinCeilings(
      { ...policy, max_output_tokens: 101 },
      ceilings,
    )).toThrow("max_output_tokens");
    const client = {
      client_id: "atlas-cli",
      audit_identity: "Atlas CLI",
      allowed_agents: ["fixture.requirement-extractor"],
      allowed_routes: [CANONICAL_AGENT_ROUTE],
      max_concurrency: 2,
      requests_per_minute: 10,
    };
    expect(authorizeAgent(
      client,
      "fixture.requirement-extractor",
      CANONICAL_AGENT_ROUTE,
    )).toEqual(client);
    expect(() => authorizeAgent(client, "other.agent", CANONICAL_AGENT_ROUTE))
      .toThrow("not authorized");
  });

  it("rejects duplicate and unresolved registrations", () => {
    const agents = new AgentRegistry();
    const providers = new ProviderRegistry();
    const models = new ModelRegistry();
    const tools = new ToolRegistry();
    agents.register(agent());
    expect(() => agents.register(agent())).toThrow("Duplicate agent");
    providers.register(provider);
    expect(() => providers.register(provider)).toThrow("Duplicate provider");
    models.register({
      alias: "atlas-default",
      provider_id: "fixture",
      physical_model: "fixture-1",
      capabilities: ["structured-output"],
    });
    expect(() => models.register({
      alias: "atlas-default",
      provider_id: "fixture",
      physical_model: "fixture-2",
      capabilities: ["structured-output"],
    })).toThrow("Duplicate model alias");
    expect(() => validateRegistries({ agents, providers, models, tools })).not.toThrow();

    const unresolvedModels = new ModelRegistry();
    expect(() => validateRegistries({
      agents,
      providers,
      models: unresolvedModels,
      tools,
    })).toThrow("unavailable model alias");
    expect(agents.get("fixture.requirement-extractor", "2.0.0")).toBeUndefined();

    const unavailableAgents = new AgentRegistry();
    unavailableAgents.register({
      ...agent(),
      id: "fixture.unresolved",
      execution_policy: {
        ...policy,
        allowed_providers: ["missing-provider"],
        allowed_model_aliases: ["missing-model"],
      },
    });
    const unavailableModels = new ModelRegistry();
    unavailableModels.register({
      alias: "missing-model",
      provider_id: "missing-provider",
      physical_model: "missing-1",
      capabilities: ["structured-output"],
    });
    expect(() => validateRegistries({
      agents: unavailableAgents,
      providers,
      models: unavailableModels,
      tools,
    })).toThrow("unavailable provider");
  });

  it("supports additional registered agents and providers without changing contracts", () => {
    const agents = new AgentRegistry();
    const providers = new ProviderRegistry();
    const models = new ModelRegistry();
    const tools = new ToolRegistry();
    agents.register(agent());
    agents.register({ ...agent(), id: "fixture.second-agent" });
    providers.register(provider);
    providers.register({ ...provider, provider_id: "fixture-second" });
    models.register({
      alias: "atlas-default",
      provider_id: "fixture",
      physical_model: "fixture-1",
      capabilities: ["structured-output"],
    });
    expect(() => validateRegistries({ agents, providers, models, tools })).not.toThrow();
    expect(agents.get("fixture.second-agent", "1.0.0")).toBeTruthy();
    expect(providers.get("fixture-second")).toBeTruthy();
  });

  it("fails invalid identifiers while leaving review policy to each registered agent", () => {
    const agents = new AgentRegistry();
    expect(() => agents.register({
      ...agent(),
      id: "Invalid Agent",
    })).toThrow();
    expect(() => agents.register({
      ...agent(),
      execution_policy: { ...policy, requires_human_review: false },
    })).not.toThrow();
    const models = new ModelRegistry();
    expect(() => models.register({
      alias: "atlas-default",
      provider_id: "fixture",
      physical_model: "../unsafe?key=value",
      capabilities: ["structured-output"],
    })).toThrow();
  });
});
