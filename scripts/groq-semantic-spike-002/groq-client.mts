import { intermediateSchema } from "./intermediate-schema.mts";
import { providerInput } from "./fixture.mts";
export const GROQ_MODEL = "openai/gpt-oss-120b";
export class EnvironmentBlockedError extends Error {}
const instructions = `You are performing bounded semantic extraction for Atlas. This is semantic extraction, NOT summarization. Tell Atlas exactly what supplied text says semantically, without deciding what Atlas should believe.

Interpret only supplied source-slot text. Extract only business meaning explicitly supported by that text. Preserve actor, action, object, condition, scope, modality, negation, quantities, units, temporal constraints, exceptions, and uncertainty. Do not strengthen or weaken modality; never convert possibility into obligation, examples into requirements, or descriptive statements into normative rules. Do not repair vague, incomplete, conditional, or ambiguous meaning: preserve the uncertainty.

Keep independently meaningful assertions separate where the schema permits, but never split a qualifier, condition, negation, or scope from the statement it governs. Headings, titles, labels, numbering, navigation, and structural text are not business facts merely because their wording appears semantic. If a slot has no extractable business meaning, use non_fact rather than inventing a fact.

Every supplied source slot must receive exactly one disposition. Do not omit, duplicate, or invent a slot. Every extracted statement must be traceable to its explicit supporting slot. Do not manufacture Atlas IDs, infer accepted truth, reconcile statements, detect or resolve winners/supersession, canonicalize, use existing Atlas knowledge, or perform downstream Atlas projection.

Output requirements: candidate means one or more candidates and empty non_fact_reason/question/question_reason. non_fact means no candidates, a non-empty non_fact_reason, and empty question fields. uncertain means one or more candidates all marked needs_resolution=true, a non-empty question and question_reason, and empty non_fact_reason. For S4-style uncertain approval meaning, use kind unresolved and ask the condition that triggers approval. Use the most precise existing kind: an explicit maximum/limit on allowed purchases is constraint, not rule. Return only output that conforms to the supplied strict JSON Schema.`;
export async function invokeGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new EnvironmentBlockedError("GROQ_API_KEY is not configured; no authenticated live inference was attempted.");
  const started = performance.now(); let response: Response;
  try { response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: GROQ_MODEL, stream: false, reasoning_effort: "medium", messages: [{ role: "system", content: instructions }, { role: "user", content: JSON.stringify(providerInput()) }], response_format: { type: "json_schema", json_schema: { name: "atlas_semantic_spike_intermediate", strict: true, schema: intermediateSchema } } }) }); } catch (error) { throw new EnvironmentBlockedError(`Groq network request failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  const latencyMilliseconds = Math.round(performance.now() - started), body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new EnvironmentBlockedError(`Groq request was rejected (${response.status}); exact frozen route was not qualified.`);
  const content = (body.choices as { message?: { content?: unknown } }[] | undefined)?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Groq returned no terminal structured message content.");
  let proposal: unknown; try { proposal = JSON.parse(content); } catch { throw new Error("Groq terminal content was not JSON."); }
  return { proposal, metrics: { provider: "Groq", model: GROQ_MODEL, http_status: response.status, latency_ms: latencyMilliseconds, input_tokens: (body.usage as Record<string, unknown> | undefined)?.prompt_tokens ?? null, output_tokens: (body.usage as Record<string, unknown> | undefined)?.completion_tokens ?? null, reasoning_effort: "medium", structured_output: "strict JSON Schema", source_count: 4 } };
}
