import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../apps/cli/src/index.js";
import {
  AgentRegistry,
  ModelRegistry,
  ProviderRegistry,
  ToolRegistry,
  createAtlasRequirementExtractor,
  createBridgeHandler,
  parseRuntimeConfig,
  type AgentProvider,
  type OutputSchema,
  type StructuredGenerationRequest,
} from "../apps/agents-bridge/src/index.js";

const credential = "atlas-cli-integration-secret";
const originalAtlasApiKey = process.env.CES_ATLAS_API_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalAtlasApiKey === undefined) delete process.env.CES_ATLAS_API_KEY;
  else process.env.CES_ATLAS_API_KEY = originalAtlasApiKey;
});

describe("Atlas CLI to Agents Bridge integration", () => {
  it("uses the existing HTTPS provider contract and pauses for human review", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-agents-bridge-atlas-"));
    try {
      const prd = join(directory, "prd.md");
      const intent = join(directory, "intent.json");
      const output = join(directory, "output");
      await writeFile(prd, "# Projects\nA project manager can create a project.");
      await writeFile(intent, JSON.stringify(projectIntent()));
      const handle = bridgeHandler();
      vi.stubGlobal("fetch", async (
        _url: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) => {
        const headers = Object.fromEntries(new Headers(init?.headers).entries());
        const response = await handle({
          ...(init?.method ? { method: init.method } : {}),
          url: "/v1/atlas/analyze",
          headers,
          body: (async function* () { yield String(init?.body ?? ""); })(),
        });
        return new Response(response.body, {
          status: response.status,
          headers: response.headers,
        });
      });
      process.env.CES_ATLAS_API_KEY = credential;
      const stdout: string[] = [];
      const stderr: string[] = [];
      const exitCode = await runCli([
        "atlas", "run",
        "--prd", prd,
        "--project-intent", intent,
        "--output", output,
        "--provider-endpoint", "https://bridge.example/v1/atlas/analyze",
        "--provider", "gemini",
        "--model", "gemini-2.5-flash",
      ], {
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      });
      expect(exitCode).toBe(7);
      expect(stderr).toEqual([]);
      expect(stdout.join("")).toContain("review artifacts");
      const analysis = JSON.parse(await readFile(join(output, "candidate-analysis.json"), "utf8"));
      expect(analysis).toMatchObject({
        schema_version: "1.0.0",
        candidate_requirements: [{
          candidate_id: "REQ-CAND-001",
          inference: {
            agent: { provider: "gemini", model: "gemini-2.5-flash" },
            review: { status: "candidate" },
          },
        }],
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

function bridgeHandler() {
  const provider: AgentProvider = {
    provider_id: "gemini",
    capabilities: ["structured-output"],
    async executeStructured<TOutput>(
      request: StructuredGenerationRequest,
      schema: OutputSchema<TOutput>,
    ) {
      expect(request.messages[0]?.content).toContain("[L0002]");
      return {
        output: schema.parse({
          candidate_requirements: [{
            temporary_id: "TMP-REQ-1",
            proposed_logical_id: "REQ-PROJECT-CREATE",
            title: "Create project",
            actor: { type: "project_manager" },
            operation: { action: "create", resource: "project" },
            source: { document_id: "PRD-MAIN", line_start: 2, line_end: 2 },
            inference: { origin: "explicit", confidence: 0.95, review_status: "candidate" },
          }],
          candidate_business_rules: [],
          uncertainties: [],
          conflicts: [],
          clarification_questions: [],
        }) as TOutput,
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
  return createBridgeHandler({
    config: parseRuntimeConfig({
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
        credentials: [credential],
        identity: {
          client_id: "atlas-cli",
          audit_identity: "Atlas CLI",
          allowed_agents: ["atlas.requirement-extractor"],
          allowed_routes: ["/v1/atlas/analyze"],
          max_concurrency: 2,
          requests_per_minute: 10,
        },
      }],
      atlas: { legacy_model: "gemini-2.5-flash", agent_version: "1.0.0" },
    }),
    registries: { agents, providers, models, tools: new ToolRegistry() },
    logger: { log: () => undefined },
  });
}

function projectIntent() {
  return {
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
  };
}
