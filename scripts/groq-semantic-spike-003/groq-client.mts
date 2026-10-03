import { intermediateSchema } from "../groq-semantic-spike-002/intermediate-schema.mts";
import { providerInput } from "../groq-semantic-spike-002/fixture.mts";
export const GROQ_MODEL = "openai/gpt-oss-120b";
export class EnvironmentBlockedError extends Error {}
const instructions = `You are performing bounded semantic extraction for Atlas.

Your task is to identify the business meaning explicitly expressed by each authorized source slot and represent that meaning faithfully in the supplied intermediate schema.

This is semantic extraction, not summarization.

Tell Atlas exactly what the supplied text says semantically, without deciding what Atlas should believe.

SOURCE AUTHORITY: Interpret only the supplied authorized source-slot text. Do not use outside knowledge; infer omitted business meaning, missing actors, requirements, rules, relationships, motivations, causes, conditions, or intent; repair the source based on probable business practice; or manufacture Atlas IDs, canonical entities, accepted facts, or publication state.

SEMANTIC FIDELITY: Extract only explicitly supported meaning. Preserve actor, action, object, target, condition, prerequisite, scope, modality, negation, quantity, unit, threshold, duration, frequency, temporal ordering, exception, state, transition, relationship, uncertainty, and underspecification where present. Preserve the proposition, not keywords. Do not strengthen or weaken meaning: never convert may to must, can to will, possibility to obligation, examples to requirements, observed behavior to normative rules; remove negation; broaden/narrow scope; discard conditions/exceptions; replace explicit quantities vaguely; or invent an unstated reason, trigger, actor, or outcome.

SEMANTIC ATOMICITY: Preserve independently meaningful assertions separately where the schema permits. Do not split a proposition if doing so detaches qualifier, condition, negation, modality, exception, quantity, or scope; do not collapse different actors, actions, objects, conditions, states, or relationships. Preserve meaning, not a maximum candidate count.

SEMANTIC KIND SELECTION: Determine the proposition first, then choose the most precise kind supported by source meaning and the schema. Do not distort meaning to fit a kind, choose by keyword, or use a broader kind when a specific existing kind applies. Classify the statement's semantic role, including actor, workflow step, relationship, rule, constraint, state, transition, or unresolved meaning.

STRUCTURAL TEXT: Headings, titles, labels, numbering, navigation, formatting, and structure are not business facts. Do not create a candidate solely because structural wording resembles a business concept. Use non_fact for structural/non-semantic-only slots.

UNCERTAINTY: Preserve unresolved meaning exactly. Do not answer a question the source leaves unanswered or fill an unstated condition, threshold, actor, trigger, decision, or outcome. Where explicitly supported business meaning has an essential unresolved part, mark it requiring resolution. A clarification question asks only for missing information, never information already present. Use uncertainty only for genuinely unresolved meaning.

SOURCE ACCOUNTING: Every supplied slot receives exactly one disposition; do not omit, process twice, or invent a slot. Each candidate remains traceable to its supporting slot. A slot can contain multiple independent candidates but only one disposition.

DISPOSITION CONTRACT: candidate has one or more candidates and empty non_fact_reason/question/question_reason. non_fact has no candidates, a non-empty reason, and empty question fields. uncertain has one or more candidates, all needs_resolution=true, non-empty question/question_reason, and empty non_fact_reason. Use unresolved for a genuinely unresolved proposition when the schema supports it.

EXTRACTION BOUNDARY: Do not reconcile, compare existing Atlas knowledge, determine conflict/winner/precedence/supersession, merge canonical truth, determine acceptance/publication/workspace/Master state, retrieve knowledge, or produce downstream Atlas projections, Main Workflow, Project Facts, or CES Result. Other documents or facts must not influence this extraction unless explicitly supplied.

Faithfulness to supplied source has priority over convenient classification. Preserve what the source says, does not say, and its uncertainty. Return only output conforming to the supplied strict JSON Schema.`;
export async function invokeGroq() {
  const apiKey = process.env.GROQ_API_KEY; if (!apiKey) throw new EnvironmentBlockedError("GROQ_API_KEY is not configured."); const started = performance.now(); let response: Response;
  try { response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: GROQ_MODEL, stream: false, reasoning_effort: "medium", messages: [{ role: "system", content: instructions }, { role: "user", content: JSON.stringify(providerInput()) }], response_format: { type: "json_schema", json_schema: { name: "atlas_semantic_spike_intermediate", strict: true, schema: intermediateSchema } } }) }); } catch (error) { throw new EnvironmentBlockedError(`Groq network request failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  const body = await response.json().catch(() => ({})) as Record<string, unknown>; if (!response.ok) throw new EnvironmentBlockedError(`Groq request rejected (${response.status}).`); const content = (body.choices as any[])?.[0]?.message?.content; if (typeof content !== "string") throw new Error("No terminal structured content.");
  return { proposal: JSON.parse(content), metrics: { provider: "Groq", model: GROQ_MODEL, http_status: response.status, latency_ms: Math.round(performance.now() - started), input_tokens: (body.usage as any)?.prompt_tokens ?? null, output_tokens: (body.usage as any)?.completion_tokens ?? null, reasoning_effort: "medium", structured_output: "strict JSON Schema", source_count: 4 } };
}
