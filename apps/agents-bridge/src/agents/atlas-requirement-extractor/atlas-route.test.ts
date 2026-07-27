import { describe, expect, it, vi } from "vitest";
import type { ZodType } from "zod";
import {
  AgentRegistry,
  ModelRegistry,
  ProviderRegistry,
  ToolRegistry,
  createAtlasRequirementExtractor,
  createBridgeHandler,
  parseRuntimeConfig,
  type AgentProvider,
  type BridgeRequest,
  type StructuredGenerationRequest,
} from "../../index.js";

const credential = "atlas-bridge-test-secret";
const hash = `sha256:${"a".repeat(64)}`;
const atlasRequest = {
  schema_version: "1.0.0",
  prompt_contract_version: "1.0.0",
  source_documents: [{
    document_id: "PRD-MAIN",
    path: "docs/prd.md",
    content_hash: hash,
    content: "A project manager can create a project.",
  }],
  project_intent: {
    schema_version: "1.0.0",
    project: {
      id: "example",
      lifecycle: "greenfield",
      application_type: "transactional_web_application",
      business_domain: "project management",
    },
    delivery: {
      team_size: 2,
      expected_delivery_months: 3,
      deployment_preference: "managed_cloud",
    },
    constraints: {
      expected_users: 10,
      data_sensitivity: "internal",
      multi_tenant: false,
    },
    skills: { preferred_languages: [], preferred_databases: [] },
  },
} as const;
const intermediate = {
  candidate_requirements: [{
    temporary_id: "TMP-REQ-1",
    proposed_logical_id: "REQ-PROJECT-CREATE",
    title: "Create project",
    actor: { type: "project_manager" },
    operation: { action: "create", resource: "project" },
    source: { document_id: "PRD-MAIN", line_start: 1, line_end: 1 },
    inference: { origin: "explicit", confidence: 0.95, review_status: "candidate" },
  }],
  candidate_business_rules: [],
  uncertainties: [],
  conflicts: [],
  clarification_questions: [],
} as const;

function setup() {
  const execute = vi.fn((_request: unknown) => undefined);
  const provider: AgentProvider = {
    provider_id: "gemini",
    capabilities: ["structured-output"],
    async executeStructured<TOutput>(
      request: StructuredGenerationRequest,
      schema: ZodType<TOutput>,
    ) {
      execute(request);
      return {
        output: schema.parse(intermediate) as TOutput,
        provider_id: "gemini",
        requested_model_alias: request.model_alias,
        resolved_model: "gemini-2.5-flash",
        finish_reason: "completed",
      };
    },
  };
  const agents = new AgentRegistry();
  agents.register(createAtlasRequirementExtractor({
    model_alias: "atlas-default",
    provider_id: "gemini",
  }));
  const providers = new ProviderRegistry();
  providers.register(provider);
  const models = new ModelRegistry();
  models.register({
    alias: "atlas-default",
    provider_id: "gemini",
    physical_model: "gemini-2.5-flash",
    capabilities: ["structured-output"],
  });
  const config = parseRuntimeConfig({
    host: "127.0.0.1",
    port: 0,
    request_timeout_ms: 90_000,
    ceilings: {
      max_request_bytes: 10_485_760,
      max_source_documents: 20,
      max_total_source_characters: 5_000_000,
      max_single_source_characters: 1_000_000,
      max_provider_response_bytes: 4_194_304,
      max_output_tokens: 32_768,
      max_provider_attempts: 3,
      max_timeout_ms: 90_000,
    },
    clients: [{
      credential,
      identity: {
        client_id: "atlas-cli",
        audit_identity: "Atlas CLI",
        allowed_agents: ["atlas.requirement-extractor"],
        allowed_routes: ["/v1/atlas/analyze", "/v1/agents/:agentId/execute"],
        max_concurrency: 2,
        requests_per_minute: 10,
      },
    }],
    atlas: { legacy_model: "gemini-2.5-flash", agent_version: "1.0.0" },
  });
  const handle = createBridgeHandler({
    config,
    registries: { agents, providers, models, tools: new ToolRegistry() },
    logger: { log: () => undefined },
  });
  return { handle, execute };
}

function post(url: string, value: unknown): BridgeRequest {
  return {
    method: "POST",
    url,
    headers: { authorization: `Bearer ${credential}` },
    body: (async function* () { yield JSON.stringify(value); })(),
  };
}

describe("Atlas compatibility and generic routes", () => {
  it("returns identical direct Atlas results through both routes", async () => {
    const { handle } = setup();
    const compatibility = await handle(post("/v1/atlas/analyze", {
      contract: "1.0.0",
      model: "gemini-2.5-flash",
      request: atlasRequest,
    }));
    const generic = await handle(post(
      "/v1/agents/atlas.requirement-extractor/execute",
      { agent_version: "1.0.0", input: atlasRequest },
    ));
    expect(compatibility.status).toBe(200);
    expect(generic.status).toBe(200);
    expect(JSON.parse(compatibility.body)).toEqual(JSON.parse(generic.body));
    expect(JSON.parse(compatibility.body)).toMatchObject({
      schema_version: "1.0.0",
      candidate_requirements: [{
        candidate_id: "REQ-CAND-001",
        source: { path: "docs/prd.md", content_hash: hash },
        inference: {
          agent: {
            provider: "gemini",
            model: "gemini-2.5-flash",
            prompt_contract_version: "1.0.0",
          },
          review: { status: "candidate" },
        },
      }],
    });
  });

  it("rejects invalid envelopes, contracts, models, and nested Atlas input before execution", async () => {
    const { handle, execute } = setup();
    const invalid = [
      {},
      { contract: "2.0.0", model: "gemini-2.5-flash", request: atlasRequest },
      { contract: "1.0.0", model: "arbitrary-model", request: atlasRequest },
      { contract: "1.0.0", model: "gemini-2.5-flash", request: {} },
      { contract: "1.0.0", model: "gemini-2.5-flash", request: atlasRequest, prompt: "override" },
    ];
    for (const value of invalid) {
      const response = await handle(post("/v1/atlas/analyze", value));
      expect(response.status).toBe(400);
      expect(JSON.parse(response.body).error.code).toBe("INVALID_ATLAS_REQUEST");
    }
    expect(execute).not.toHaveBeenCalled();
  });
});
