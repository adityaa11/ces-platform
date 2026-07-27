import { describe, expect, it, vi } from "vitest";
import { z, type ZodType } from "zod";
import {
  AgentRegistry,
  ModelRegistry,
  ProviderRegistry,
  ToolRegistry,
  closeBridgeServer,
  createBridgeHandler,
  createBridgeServer,
  parseRuntimeConfig,
  runtimeConfigFromEnvironment,
  type AgentProvider,
  type BridgeLogger,
  type BridgeRequest,
  type StructuredGenerationRequest,
} from "./index.js";

const credential = "bridge-secret-at-least-sixteen";
const ceilings = {
  max_request_bytes: 1024,
  max_source_documents: 2,
  max_total_source_characters: 1000,
  max_single_source_characters: 800,
  max_provider_response_bytes: 1024,
  max_output_tokens: 100,
  max_provider_attempts: 2,
  max_timeout_ms: 1000,
};

function setup(options: {
  allowed?: boolean;
  timeout?: number;
  pending?: boolean;
  maxRequestBytes?: number;
  requestsPerMinute?: number;
  clientConcurrency?: number;
  providerConcurrency?: number;
} = {}) {
  let releasePending: () => void = () => {};
  const pendingGate = new Promise<void>((resolve) => { releasePending = resolve; });
  const execute = vi.fn((_request: unknown) => undefined);
  const provider: AgentProvider = {
    provider_id: "fixture",
    capabilities: ["structured-output"],
    async executeStructured<TOutput>(
      generationRequest: StructuredGenerationRequest,
      outputSchema: ZodType<TOutput>,
    ) {
      execute(generationRequest);
      if (options.pending) await pendingGate;
      return {
        output: outputSchema.parse("provider result") as TOutput,
        provider_id: "fixture",
        requested_model_alias: generationRequest.model_alias,
        resolved_model: "fixture-1",
        finish_reason: "completed",
      };
    },
  };
  const agents = new AgentRegistry();
  agents.register({
    id: "fixture.agent",
    version: "1.0.0",
    description: "Runtime fixture agent",
    mode: "structured-generation",
    input_schema: z.object({ value: z.string() }).strict(),
    intermediate_schema: z.string(),
    output_schema: z.object({ result: z.string(), client: z.string() }).strict(),
    execution_policy: {
      allowed_providers: ["fixture"],
      allowed_model_aliases: ["fixture-default"],
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
      system_instructions: "Fixture instructions",
      messages: [{ role: "user", content: input.value }],
      response_json_schema: { type: "string" },
      model_alias: "fixture-default",
      max_output_tokens: 50,
    }),
    transformResult: async (result, _input, context) => ({
      result,
      client: context.client_id,
    }),
  });
  const providers = new ProviderRegistry();
  providers.register(provider);
  const models = new ModelRegistry();
  models.register({
    alias: "fixture-default",
    provider_id: "fixture",
    physical_model: "fixture-1",
    capabilities: ["structured-output"],
  });
  const tools = new ToolRegistry();
  const events: unknown[] = [];
  const metrics: unknown[] = [];
  const logger: BridgeLogger = { log: (event) => events.push(event) };
  const config = parseRuntimeConfig({
    host: "127.0.0.1",
    port: 0,
    request_timeout_ms: options.timeout ?? 1000,
    ceilings: {
      ...ceilings,
      max_request_bytes: options.maxRequestBytes ?? ceilings.max_request_bytes,
    },
    clients: [{
      credentials: [credential],
      identity: {
        client_id: "fixture-client",
        audit_identity: "Fixture Client",
        allowed_agents: options.allowed === false ? ["other.agent"] : ["fixture.agent"],
        allowed_routes: ["/v1/agents/:agentId/execute"],
        max_concurrency: options.clientConcurrency ?? 2,
        requests_per_minute: options.requestsPerMinute ?? 10,
      },
    }],
    provider_max_concurrency: options.providerConcurrency ?? 16,
  });
  const runtime = {
    config,
    registries: { agents, providers, models, tools },
    logger,
    metrics: { record: (event: unknown) => metrics.push(event) },
  };
  return { handle: createBridgeHandler(runtime), runtime, execute, events, metrics, releasePending };
}

function request(input: Partial<BridgeRequest> & { json?: unknown } = {}): BridgeRequest {
  const content = input.json === undefined ? "" : JSON.stringify(input.json);
  return {
    method: input.method ?? "POST",
    url: input.url ?? "/v1/agents/fixture.agent/execute",
    headers: input.headers ?? { authorization: `Bearer ${credential}` },
    body: input.body ?? (async function* () { yield content; })(),
  };
}

describe("Agents Bridge shared runtime", () => {
  it("serves non-sensitive health and readiness without authentication", async () => {
    const { handle } = setup();
    for (const path of ["/healthz", "/readyz"]) {
      const response = await handle(request({ method: "GET", url: path, headers: {} }));
      expect(response.status).toBe(200);
      expect(response.body).toContain("ces-agents-bridge");
      expect(response.body).not.toContain("fixture-default");
      expect(response.body).not.toContain(credential);
    }
  });

  it("distinguishes missing, malformed, incorrect, and unauthorized credentials", async () => {
    const { handle } = setup();
    expect((await handle(request({ headers: {} }))).status).toBe(401);
    expect((await handle(request({ headers: { authorization: "Basic value" } }))).status).toBe(401);
    expect((await handle(request({ headers: { authorization: "Bearer wrong-value" } }))).status).toBe(403);
    expect((await handle(request({
      headers: { Authorization: `Bearer ${credential}` },
      json: { agent_version: "1.0.0", input: { value: "case-insensitive" } },
    }))).status).toBe(200);
    const unauthorized = setup({ allowed: false });
    const response = await unauthorized.handle(request({ json: {
      agent_version: "1.0.0", input: { value: "safe" },
    } }));
    expect(response.status).toBe(403);
    expect(unauthorized.execute).not.toHaveBeenCalled();
  });

  it("routes validated input through the registered agent and provider", async () => {
    const { handle, execute } = setup();
    const response = await handle(request({ json: {
      agent_version: "1.0.0",
      input: { value: "hello" },
      correlation: { request_id: "caller-request-1" },
    } }));
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      result: "provider result",
      client: "fixture-client",
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0]?.[0]).toMatchObject({
      model_alias: "fixture-default",
      system_instructions: "Fixture instructions",
    });
  });

  it("rejects unknown agents, versions, invalid JSON, methods, and extra execution controls", async () => {
    const { handle, execute } = setup();
    expect((await handle(request({ url: "/v1/agents/unknown.agent/execute" }))).status).toBe(403);
    expect((await handle(request({ json: {
      agent_version: "2.0.0", input: { value: "x" },
    } }))).status).toBe(409);
    expect((await handle(request({ body: (async function* () { yield "{"; })() }))).status).toBe(400);
    expect((await handle(request({ method: "PUT" }))).status).toBe(405);
    expect((await handle(request({ json: {
      agent_version: "1.0.0",
      input: { value: "x" },
      provider_url: "https://untrusted.invalid",
    } }))).status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it("stops reading an oversized streaming body", async () => {
    const { runtime } = setup({ maxRequestBytes: 5 });
    let consumed = 0;
    const response = await createBridgeHandler(runtime)(request({
      body: (async function* () {
        consumed += 1;
        yield "123456";
        consumed += 1;
        yield "never-read";
      })(),
    }));
    expect(response.status).toBe(413);
    expect(consumed).toBe(1);
  });

  it("applies a deadline and emits only bounded redacted log fields", async () => {
    const sentinel = "CONFIDENTIAL-PRD-SENTINEL";
    const { handle, events, metrics } = setup({ pending: true, timeout: 5 });
    const response = await handle(request({
      headers: {
        authorization: `Bearer ${credential}`,
        "x-request-id": "deadline-request",
      },
      json: { agent_version: "1.0.0", input: { value: sentinel } },
    }));
    expect(response.status).toBe(504);
    expect(metrics).toEqual([expect.objectContaining({
      route: "/v1/agents/:agentId/execute",
      status: 504,
      input_bytes: expect.any(Number),
      source_documents: 0,
      agent_id: "fixture.agent",
      provider_id: "fixture",
    })]);
    const serialized = JSON.stringify({ response, events, metrics });
    expect(serialized).not.toContain(credential);
    expect(serialized).not.toContain(sentinel);
    expect(serialized).not.toContain("authorization");
  });

  it("enforces per-client rate, client concurrency, and provider concurrency limits", async () => {
    const rateLimited = setup({ requestsPerMinute: 1 });
    const payload = { agent_version: "1.0.0", input: { value: "limited" } };
    expect((await rateLimited.handle(request({ json: payload }))).status).toBe(200);
    expect((await rateLimited.handle(request({ json: payload }))).status).toBe(429);

    const concurrent = setup({
      pending: true,
      timeout: 1000,
      clientConcurrency: 2,
      providerConcurrency: 1,
    });
    const first = concurrent.handle(request({ json: payload }));
    await vi.waitFor(() => expect(concurrent.execute).toHaveBeenCalledOnce());
    expect((await concurrent.handle(request({ json: payload }))).status).toBe(429);
    concurrent.releasePending();
    expect((await first).status).toBe(200);
  });

  it("validates configuration and constructs or closes a server without listening", async () => {
    expect(() => runtimeConfigFromEnvironment({})).toThrow("AGENTS_BRIDGE_API_KEY");
    expect(runtimeConfigFromEnvironment({ AGENTS_BRIDGE_API_KEY: credential }).port).toBe(8787);
    const rotated = runtimeConfigFromEnvironment({
      AGENTS_BRIDGE_CLIENTS_JSON: JSON.stringify([{
        credentials: [credential, "replacement-secret-value"],
        identity: {
          client_id: "rotating-client",
          audit_identity: "Rotating Client",
          allowed_agents: ["fixture.agent"],
          allowed_routes: ["/v1/agents/:agentId/execute"],
          max_concurrency: 1,
          requests_per_minute: 1,
        },
      }]),
    });
    expect(rotated.clients[0]?.credentials).toHaveLength(2);
    expect(() => parseRuntimeConfig({
      host: "localhost",
      port: 1,
      request_timeout_ms: 1,
      ceilings,
      clients: [],
    })).toThrow();
    const server = createBridgeServer(setup().runtime);
    expect(server.listening).toBe(false);
    await expect(closeBridgeServer(server)).resolves.toBeUndefined();
  });

  it("keeps concurrent runtime instances stateless", async () => {
    const first = setup();
    const second = setup();
    const payload = { agent_version: "1.0.0", input: { value: "concurrent" } };
    const responses = await Promise.all([
      first.handle(request({ json: payload })),
      second.handle(request({ json: payload })),
    ]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(first.execute).toHaveBeenCalledOnce();
    expect(second.execute).toHaveBeenCalledOnce();
  });
});
