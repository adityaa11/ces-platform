import { intermediateSchema } from "./intermediate-schema.mts";
import { providerInput } from "./fixture.mts";

export const GROQ_MODEL = "openai/gpt-oss-120b";
export class EnvironmentBlockedError extends Error {}
const instructions = `You receive only authorized source slots. Interpret only supplied text. Do not invent omitted business meaning. Do not treat headings as business facts merely because their words sound semantic. Preserve numbers, modality, negation, conditions, actors, objects, and scope. Preserve uncertainty. Every supplied source slot must receive exactly one disposition. Do not omit a source. Do not manufacture Atlas IDs. Do not infer accepted truth. Do not perform reconciliation, supersession, or ambiguity resolution.`;

export async function invokeGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new EnvironmentBlockedError("GROQ_API_KEY is not configured; no authenticated live inference was attempted.");
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: GROQ_MODEL, stream: false, reasoning_effort: "medium", messages: [{ role: "system", content: instructions }, { role: "user", content: JSON.stringify(providerInput()) }], response_format: { type: "json_schema", json_schema: { name: "atlas_semantic_spike_intermediate", strict: true, schema: intermediateSchema } } }) });
  } catch (error) { throw new EnvironmentBlockedError(`Groq network request failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  const latencyMilliseconds = Math.round(performance.now() - started);
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new EnvironmentBlockedError(`Groq request was rejected (${response.status}); exact frozen route was not qualified.`);
  const content = (body.choices as { message?: { content?: unknown } }[] | undefined)?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Groq returned no terminal structured message content.");
  let proposal: unknown;
  try { proposal = JSON.parse(content); } catch { throw new Error("Groq terminal content was not JSON."); }
  return { proposal, metrics: { provider: "Groq", model: GROQ_MODEL, http_status: response.status, latency_ms: latencyMilliseconds, input_tokens: (body.usage as Record<string, unknown> | undefined)?.prompt_tokens ?? null, output_tokens: (body.usage as Record<string, unknown> | undefined)?.completion_tokens ?? null, reasoning_effort: "medium", structured_output: "strict JSON Schema", source_count: 4 } };
}
