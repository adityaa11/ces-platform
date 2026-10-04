import { instructionSha256, SYSTEM_INSTRUCTION, FROZEN_INSTRUCTION_SHA256 } from "./prompt.mts";
import { userMessage } from "./fixture.mts";

export const PROVIDER = "Groq";
export const MODEL = "openai/gpt-oss-120b";

export type RunMetrics = {
  provider: string;
  model: string;
  http_status: number;
  latency_ms: number;
  input_tokens: number | null;
  output_tokens: number | null;
  reasoning_effort: "medium";
  instruction_sha256: string;
  source_count: 4;
  structured_output_mode: "none";
};

export class EnvironmentBlockedError extends Error {
  constructor(message: string, readonly httpStatus: number | null = null, readonly latencyMs: number | null = null) {
    super(message);
  }
}

export async function invokeGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new EnvironmentBlockedError("GROQ_API_KEY is not configured.");
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        reasoning_effort: "medium",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch {
    throw new EnvironmentBlockedError("Groq network request failed.", null, Math.round(performance.now() - started));
  }
  const latencyMs = Math.round(performance.now() - started);
  if (!response.ok) {
    throw new EnvironmentBlockedError(`Groq request was rejected before model output (HTTP ${response.status}).`, response.status, latencyMs);
  }

  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  const content = (body?.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    return {
      rawResponse: typeof content === "string" ? content : "",
      packagingFailure: "Provider returned HTTP success without non-empty model text.",
      metrics: metrics(response.status, latencyMs, body),
    };
  }
  return { rawResponse: content, packagingFailure: null, metrics: metrics(response.status, latencyMs, body) };
}

function metrics(status: number, latencyMs: number, body: Record<string, unknown> | null): RunMetrics {
  const usage = body?.usage as Record<string, unknown> | undefined;
  return {
    provider: PROVIDER,
    model: MODEL,
    http_status: status,
    latency_ms: latencyMs,
    input_tokens: typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : null,
    output_tokens: typeof usage?.completion_tokens === "number" ? usage.completion_tokens : null,
    reasoning_effort: "medium",
    instruction_sha256: instructionSha256(),
    source_count: 4,
    structured_output_mode: "none",
  };
}
