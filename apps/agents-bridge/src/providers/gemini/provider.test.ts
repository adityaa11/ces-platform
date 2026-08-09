import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  GeminiStructuredGenerationProvider,
  geminiConfigFromEnvironment,
  sanitizeJsonSchema,
  type GeminiProviderDependencies,
  type ProviderExecutionContext,
  type StructuredGenerationRequest,
} from "../../index.js";

const apiKey = "gemini-secret-sentinel";
const request: StructuredGenerationRequest = {
  system_instructions: "Return a structured result",
  messages: [
    { role: "user", content: "source sentinel" },
    { role: "assistant", content: "acknowledged" },
  ],
  response_json_schema: {
    type: "object",
    properties: {
      value: { type: "string", pattern: "^unsupported$" },
    },
    required: ["value"],
    additionalProperties: false,
  },
  model_alias: "atlas-default",
  max_output_tokens: 50,
};
const outputSchema = z.object({ value: z.string() }).strict();

function context(overrides: Partial<ProviderExecutionContext> = {}): ProviderExecutionContext {
  return {
    request_id: "request-1",
    client_id: "fixture-client",
    agent_id: "fixture.agent",
    agent_version: "1.0.0",
    model_alias: "atlas-default",
    provider_id: "gemini",
    resolved_model: "gemini-2.5-flash",
    max_attempts: 3,
    max_response_bytes: 4096,
    signal: new AbortController().signal,
    ...overrides,
  };
}

function success(value: unknown = { value: "ok" }, additions: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    candidates: [{
      content: { parts: [{ text: JSON.stringify(value).slice(0, 5) }, { text: JSON.stringify(value).slice(5) }] },
      finishReason: "STOP",
    }],
    modelVersion: "gemini-2.5-flash-001",
    usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 7 },
    ...additions,
  }), { status: 200, headers: { "content-type": "application/json" } });
}

function adapter(
  responses: Array<Response | Error>,
  overrides: Partial<GeminiProviderDependencies> = {},
) {
  const fetchMock = vi.fn(async (
    _input: Parameters<typeof fetch>[0],
    _init?: Parameters<typeof fetch>[1],
  ): Promise<Response> => {
    const next = responses.shift();
    if (next instanceof Error) throw next;
    if (!next) throw new Error("Unexpected mock fetch");
    return next;
  });
  const delays: number[] = [];
  const dependencies: GeminiProviderDependencies = {
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async (milliseconds) => { delays.push(milliseconds); },
    random: () => 0,
    now: () => Date.parse("2026-01-01T00:00:00Z"),
    ...overrides,
  };
  const provider = new GeminiStructuredGenerationProvider({
    api_key: apiKey,
    models: { "atlas-default": "gemini-2.5-flash" },
    retry_base_delay_ms: 100,
    retry_max_delay_ms: 1000,
    retry_after_max_ms: 5000,
  }, dependencies);
  return { provider, fetchMock, delays };
}

describe("Gemini structured-generation provider", () => {
  it("builds only the trusted endpoint, credential header, and structured request", async () => {
    const { provider, fetchMock } = adapter([success()]);
    const result = await provider.executeStructured(request, outputSchema, context());
    expect(result).toEqual({
      output: { value: "ok" },
      provider_id: "gemini",
      requested_model_alias: "atlas-default",
      resolved_model: "gemini-2.5-flash-001",
      finish_reason: "completed",
      usage: { input_tokens: 12, output_tokens: 7 },
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect(init).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      redirect: "error",
    });
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body).toMatchObject({
      systemInstruction: { parts: [{ text: request.system_instructions }] },
      contents: [
        { role: "user", parts: [{ text: "source sentinel" }] },
        { role: "model", parts: [{ text: "acknowledged" }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        candidateCount: 1,
        maxOutputTokens: 50,
      },
    });
    expect(body.generationConfig.responseJsonSchema.properties.value.pattern).toBeUndefined();
  });

  it("ignores Gemini thinking parts when parsing structured output", async () => {
    const response = new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [
            { thought: true, text: "internal reasoning that is not JSON" },
            { text: JSON.stringify({ value: "ok" }) },
          ],
        },
        finishReason: "STOP",
      }],
    }));
    const { provider } = adapter([response]);
    await expect(provider.executeStructured(request, outputSchema, context()))
      .resolves.toMatchObject({ output: { value: "ok" } });
  });

  it("rejects an unknown or mismatched controlled model before fetch", async () => {
    const { provider, fetchMock } = adapter([success()]);
    await expect(provider.executeStructured(
      { ...request, model_alias: "unknown-alias" },
      outputSchema,
      context(),
    )).rejects.toMatchObject({ code: "PROVIDER_REQUEST_FAILED" });
    await expect(provider.executeStructured(
      request,
      outputSchema,
      context({ resolved_model: "gemini-untrusted" }),
    )).rejects.toMatchObject({ code: "PROVIDER_REQUEST_FAILED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries transient statuses and honors only bounded Retry-After", async () => {
    const responses = [
      new Response("limited", { status: 429, headers: { "retry-after": "2" } }),
      new Response("unavailable", { status: 503, headers: { "retry-after": "120" } }),
      success(),
    ];
    const { provider, fetchMock, delays } = adapter(responses);
    await expect(provider.executeStructured(request, outputSchema, context())).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([2000, 100]);
  });

  it("emits bounded provider metrics without request or credential content", async () => {
    const metrics: unknown[] = [];
    const { provider } = adapter([
      new Response("unavailable", { status: 503 }),
      success(),
    ], { observe: (event) => metrics.push(event) });
    await provider.executeStructured(request, outputSchema, context());
    expect(metrics).toEqual([{
      provider_id: "gemini",
      status: 200,
      retry_count: 1,
      duration_ms: 0,
    }]);
    const serialized = JSON.stringify(metrics);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain("source sentinel");
    expect(serialized).not.toContain(request.system_instructions);
  });

  it("retries temporary network failures but not non-transient HTTP failures", async () => {
    const network = adapter([new TypeError("temporary network failure"), success()]);
    await expect(network.provider.executeStructured(request, outputSchema, context()))
      .resolves.toBeTruthy();
    expect(network.fetchMock).toHaveBeenCalledTimes(2);

    for (const status of [400, 401, 403, 404]) {
      const failure = adapter([new Response("sensitive provider body", { status })]);
      await expect(failure.provider.executeStructured(request, outputSchema, context()))
        .rejects.toMatchObject({ code: "PROVIDER_REQUEST_FAILED" });
      expect(failure.fetchMock).toHaveBeenCalledOnce();
    }
  });

  it("returns rate-limited after the final 429 and timeout for aborts", async () => {
    const limited = adapter([
      new Response("", { status: 429 }),
      new Response("", { status: 429 }),
      new Response("", { status: 429 }),
    ]);
    await expect(limited.provider.executeStructured(request, outputSchema, context()))
      .rejects.toMatchObject({ status: 429, code: "PROVIDER_RATE_LIMITED" });

    const aborted = adapter([new DOMException("aborted", "AbortError")]);
    await expect(aborted.provider.executeStructured(request, outputSchema, context()))
      .rejects.toMatchObject({ status: 504, code: "PROVIDER_TIMEOUT" });
  });

  it("rejects malformed, blocked, empty, truncated, multiple, and schema-invalid output", async () => {
    const invalidResponses = [
      new Response("{", { status: 200 }),
      new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" }, candidates: [] })),
      new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "" }] }, finishReason: "STOP" }],
      })),
      new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "{}" }] }, finishReason: "MAX_TOKENS" }],
      })),
      new Response(JSON.stringify({
        candidates: [
          { content: { parts: [{ text: "{}" }] }, finishReason: "STOP" },
          { content: { parts: [{ text: "{}" }] }, finishReason: "STOP" },
        ],
      })),
      success({ wrong: true }),
      success("{not-json"),
    ];
    for (const response of invalidResponses) {
      const fixture = adapter([response]);
      await expect(fixture.provider.executeStructured(request, outputSchema, context()))
        .rejects.toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
      expect(fixture.fetchMock).toHaveBeenCalledOnce();
    }
  });

  it("bounds provider response bytes and sanitizes errors", async () => {
    const fixture = adapter([success({ value: "a".repeat(100) })]);
    let caught: unknown;
    try {
      await fixture.provider.executeStructured(
        request,
        outputSchema,
        context({ max_response_bytes: 10 }),
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
    const serialized = JSON.stringify(caught);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain("source sentinel");
    expect(serialized).not.toContain("a".repeat(20));
  });

  it("validates environment configuration and sanitizes JSON Schema recursively", () => {
    expect(() => geminiConfigFromEnvironment({})).toThrow("GEMINI_API_KEY");
    expect(geminiConfigFromEnvironment({ GEMINI_API_KEY: apiKey })).toMatchObject({
      models: { "atlas-default": "gemini-2.5-flash" },
    });
    expect(sanitizeJsonSchema({
      type: "object",
      properties: { item: { type: "string", minLength: 1 },
        schema_version: { type: "string", const: "2.0.0" } },
      patternProperties: {},
    })).toEqual({
      type: "object",
      properties: { item: { type: "string" },
        schema_version: { type: "string", enum: ["2.0.0"] } },
    });
  });
});
