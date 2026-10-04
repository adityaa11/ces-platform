import { providerInput } from "./fixture.mts";
import { SYSTEM_INSTRUCTION } from "./prompt.mts";
import { providerSchema } from "./schema.mts";

export const GROQ_MODEL = "openai/gpt-oss-120b";
export class EnvironmentBlockedError extends Error { constructor(message: string, readonly httpStatus: number | null = null) { super(message); } }

export async function invokeGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new EnvironmentBlockedError("GROQ_API_KEY is not configured; no authenticated live inference was attempted.");
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(60_000), body: JSON.stringify({ model: GROQ_MODEL, stream: false, reasoning_effort: "medium", messages: [{ role: "system", content: SYSTEM_INSTRUCTION }, { role: "user", content: JSON.stringify(providerInput()) }], response_format: { type: "json_schema", json_schema: { name: "atlas_schema_driven_semantics", strict: true, schema: providerSchema } } }) });
  } catch { throw new EnvironmentBlockedError("Groq network request failed."); }
  const latencyMs = Math.round(performance.now() - started);
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new EnvironmentBlockedError(`Groq request was rejected before model output (HTTP ${response.status}).`, response.status);
  const content = (body?.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") throw new Error("Groq returned no terminal structured message content.");
  let proposal: unknown;
  try { proposal = JSON.parse(content); } catch { throw new Error("Groq terminal content was not JSON."); }
  const usage = body?.usage as Record<string, unknown> | undefined;
  return { rawResponse: content, proposal, metrics: { provider: "Groq", model: GROQ_MODEL, http_status: response.status, latency_ms: latencyMs, input_tokens: typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : null, output_tokens: typeof usage?.completion_tokens === "number" ? usage.completion_tokens : null, reasoning_effort: "medium", structured_output: "strict JSON Schema", source_count: 4 } };
}
