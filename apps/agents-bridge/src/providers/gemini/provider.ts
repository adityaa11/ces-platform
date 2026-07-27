import type { ZodType } from "zod";
import { z } from "zod";
import { BridgeExecutionError } from "../../core/executor.js";
import type {
  AgentProvider,
  ProviderExecutionContext,
  StructuredGenerationResponse,
} from "../../core/registry.js";
import type { StructuredGenerationRequest } from "../../core/contracts.js";
import { parseGeminiProviderConfig, type GeminiProviderConfig } from "./config.js";

const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const retryableStatuses = new Set([429, 500, 502, 503, 504]);
const supportedSchemaKeys = new Set([
  "$id", "$defs", "$ref", "$anchor", "type", "format", "title", "description",
  "enum", "items", "prefixItems", "minItems", "maxItems", "minimum", "maximum",
  "anyOf", "oneOf", "properties", "additionalProperties", "required",
]);

const GeminiResponseSchema = z.object({
  candidates: z.array(z.object({
    content: z.object({
      parts: z.array(z.object({ text: z.string().optional() }).passthrough()).min(1),
    }).passthrough(),
    finishReason: z.string(),
  }).passthrough()).length(1),
  promptFeedback: z.object({ blockReason: z.string().optional() }).passthrough().optional(),
  modelVersion: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u).optional(),
  usageMetadata: z.object({
    promptTokenCount: z.number().int().nonnegative().max(2_147_483_647).optional(),
    candidatesTokenCount: z.number().int().nonnegative().max(2_147_483_647).optional(),
  }).passthrough().optional(),
}).passthrough();

export interface GeminiProviderDependencies {
  readonly fetch: typeof fetch;
  readonly sleep: (milliseconds: number, signal: AbortSignal) => Promise<void>;
  readonly random: () => number;
  readonly now: () => number;
}

const defaultDependencies: GeminiProviderDependencies = {
  fetch,
  sleep: abortableDelay,
  random: Math.random,
  now: Date.now,
};

export class GeminiStructuredGenerationProvider implements AgentProvider {
  readonly provider_id = "gemini";
  readonly capabilities = ["structured-output"] as const;
  private readonly config: GeminiProviderConfig;

  constructor(
    configValue: unknown,
    private readonly dependencies: GeminiProviderDependencies = defaultDependencies,
  ) {
    this.config = parseGeminiProviderConfig(configValue);
  }

  async executeStructured<TOutput>(
    request: StructuredGenerationRequest,
    outputSchema: ZodType<TOutput>,
    context: ProviderExecutionContext,
  ): Promise<StructuredGenerationResponse<TOutput>> {
    const configuredModel = this.config.models[request.model_alias];
    if (!configuredModel || configuredModel !== context.resolved_model) {
      throw providerError("PROVIDER_REQUEST_FAILED", "The configured Gemini model is unavailable.");
    }
    const endpoint = `${GEMINI_API_ROOT}/${encodeURIComponent(configuredModel)}:generateContent`;
    const body = JSON.stringify(toGeminiRequest(request));
    for (let attempt = 1; attempt <= context.max_attempts; attempt += 1) {
      let response: Response;
      try {
        response = await this.dependencies.fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": this.config.api_key,
          },
          body,
          redirect: "error",
          signal: context.signal,
        });
      } catch (caught) {
        if (context.signal.aborted || isAbortError(caught)) {
          throw providerError("PROVIDER_TIMEOUT", "The Gemini request timed out.", 504);
        }
        if (attempt === context.max_attempts) {
          throw providerError("PROVIDER_REQUEST_FAILED", "The Gemini request failed.");
        }
        await this.delay(attempt, undefined, context.signal);
        continue;
      }
      if (!response.ok) {
        if (!retryableStatuses.has(response.status) || attempt === context.max_attempts) {
          if (response.status === 429) {
            throw providerError("PROVIDER_RATE_LIMITED", "The Gemini provider rate limit was reached.", 429);
          }
          throw providerError("PROVIDER_REQUEST_FAILED", "The Gemini request failed.");
        }
        await this.delay(attempt, response.headers.get("retry-after"), context.signal);
        continue;
      }
      const bytes = Math.min(context.max_response_bytes, Number.MAX_SAFE_INTEGER);
      const responseText = await readBoundedResponse(response, bytes, context.signal);
      return parseGeminiResult(
        responseText,
        request.model_alias,
        configuredModel,
        outputSchema,
      );
    }
    throw providerError("PROVIDER_REQUEST_FAILED", "The Gemini request failed.");
  }

  private async delay(
    attempt: number,
    retryAfter: string | null | undefined,
    signal: AbortSignal,
  ): Promise<void> {
    const retryAfterMs = parseRetryAfter(retryAfter, this.dependencies.now());
    const boundedRetryAfter = retryAfterMs !== undefined
      && retryAfterMs <= this.config.retry_after_max_ms
      ? retryAfterMs
      : undefined;
    const exponential = Math.min(
      this.config.retry_max_delay_ms,
      this.config.retry_base_delay_ms * (2 ** (attempt - 1)),
    );
    const jittered = Math.floor(exponential * (0.5 + this.dependencies.random() * 0.5));
    await this.dependencies.sleep(boundedRetryAfter ?? jittered, signal);
  }
}

function toGeminiRequest(request: StructuredGenerationRequest): unknown {
  return {
    systemInstruction: { parts: [{ text: request.system_instructions }] },
    contents: request.messages.map(({ role, content }) => ({
      role: role === "assistant" ? "model" : "user",
      parts: [{ text: content }],
    })),
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: sanitizeJsonSchema(request.response_json_schema),
      candidateCount: 1,
      maxOutputTokens: request.max_output_tokens,
    },
  };
}

export function sanitizeJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeJsonSchema);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => supportedSchemaKeys.has(key))
    .map(([key, child]) => {
      if (key === "properties" || key === "$defs") {
        const record = z.record(z.string(), z.unknown()).parse(child);
        return [key, Object.fromEntries(
          Object.entries(record).map(([name, schema]) => [name, sanitizeJsonSchema(schema)]),
        )];
      }
      return [key, sanitizeJsonSchema(child)];
    }));
}

function parseGeminiResult<TOutput>(
  text: string,
  alias: string,
  configuredModel: string,
  outputSchema: ZodType<TOutput>,
): StructuredGenerationResponse<TOutput> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw providerInvalid();
  }
  const parsed = GeminiResponseSchema.safeParse(raw);
  if (!parsed.success || parsed.data.promptFeedback?.blockReason) throw providerInvalid();
  const candidate = parsed.data.candidates[0]!;
  if (candidate.finishReason !== "STOP") throw providerInvalid();
  const content = candidate.content.parts.map(({ text: part }) => part ?? "").join("");
  if (content.trim().length === 0) throw providerInvalid();
  let outputValue: unknown;
  try {
    outputValue = JSON.parse(content);
  } catch {
    throw providerInvalid();
  }
  const output = outputSchema.safeParse(outputValue);
  if (!output.success) throw providerInvalid();
  const usage = parsed.data.usageMetadata;
  return {
    output: output.data,
    provider_id: "gemini",
    requested_model_alias: alias,
    resolved_model: parsed.data.modelVersion ?? configuredModel,
    finish_reason: "completed",
    ...(usage ? {
      usage: {
        ...(usage.promptTokenCount === undefined ? {} : { input_tokens: usage.promptTokenCount }),
        ...(usage.candidatesTokenCount === undefined ? {} : { output_tokens: usage.candidatesTokenCount }),
      },
    } : {}),
  };
}

async function readBoundedResponse(
  response: Response,
  maximum: number,
  signal: AbortSignal,
): Promise<string> {
  if (!response.body) throw providerInvalid();
  const reader = response.body.getReader();
  const abortReader = () => { void reader.cancel(); };
  signal.addEventListener("abort", abortReader, { once: true });
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      if (signal.aborted) throw providerError("PROVIDER_TIMEOUT", "The Gemini request timed out.", 504);
      const item = await reader.read();
      if (item.done) break;
      length += item.value.byteLength;
      if (length > maximum) throw providerInvalid();
      chunks.push(item.value);
    }
  } finally {
    signal.removeEventListener("abort", abortReader);
    reader.releaseLock();
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(output);
}

function parseRetryAfter(value: string | null | undefined, now: number): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/u.test(value)) return Number(value) * 1000;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return Math.max(0, timestamp - now);
}

function providerInvalid(): BridgeExecutionError {
  return providerError("PROVIDER_RESPONSE_INVALID", "The Gemini response is invalid.");
}

function providerError(code: string, message: string, status = 502): BridgeExecutionError {
  return new BridgeExecutionError(status, code, message);
}

function isAbortError(caught: unknown): boolean {
  return caught instanceof DOMException && caught.name === "AbortError";
}

async function abortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw providerError("PROVIDER_TIMEOUT", "The Gemini request timed out.", 504);
  await new Promise<void>((resolve, reject) => {
    const completed = () => {
      signal.removeEventListener("abort", aborted);
      resolve();
    };
    const timeout = setTimeout(completed, milliseconds);
    const aborted = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", aborted);
      reject(providerError("PROVIDER_TIMEOUT", "The Gemini request timed out.", 504));
    };
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
  });
}
