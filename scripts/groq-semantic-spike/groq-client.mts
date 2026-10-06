import { intermediateSchema } from "./intermediate-schema.mts";
import { providerInput } from "./fixture.mts";

export const GROQ_MODEL = "openai/gpt-oss-120b";
export class EnvironmentBlockedError extends Error {}
const instructions = `
You are performing bounded semantic extraction for Atlas.

Your job is NOT to summarize the document.
Your job is to identify the business meaning explicitly expressed by each authorized source slot and represent that meaning faithfully in the required intermediate schema.

SOURCE AUTHORITY

You receive only authorized source slots.

Interpret only text contained in the supplied source slots.
Do not use outside knowledge.
Do not infer missing requirements, actors, rules, relationships, motivations, or business intent.
Do not manufacture Atlas IDs or canonical entities.
Do not infer accepted truth.

SEMANTIC EXTRACTION

Extract business meaning only when it is explicitly supported by the source text.

A semantic statement may describe, for example:
- an actor performing or being allowed to perform an action;
- a system behavior or obligation;
- a business rule;
- a condition or prerequisite;
- a prohibition;
- a state or state transition;
- a constraint or limit;
- a quantity, threshold, duration, frequency, or other bounded value;
- an explicitly stated relationship between business concepts.

Preserve the meaning of the source rather than merely copying keywords.

Preserve all materially relevant qualifiers, including:
- actor;
- action;
- object;
- conditions;
- scope;
- modality such as must, may, should, can, cannot, or will;
- negation;
- quantities and units;
- temporal constraints;
- exceptions;
- uncertainty or underspecification.

Do not strengthen or weaken modality.
Do not convert possibility into obligation.
Do not convert examples into requirements.
Do not convert descriptive statements into normative rules.
Do not collapse distinct actors, objects, conditions, or actions into one generalized statement.

ATOMICITY

Represent independently meaningful business statements separately when the schema permits it.

Do not split a statement when doing so would detach a condition, qualifier, negation, or scope from the meaning it governs.

If two clauses express separate business assertions, preserve both.
If one clause only qualifies another clause, preserve them as one semantic unit or retain their explicit relationship as allowed by the schema.

STRUCTURAL TEXT

Headings, titles, labels, numbering, navigation text, and document structure are not business facts by themselves.

They may provide local interpretation context only when the supplied source slot explicitly establishes that relationship.

Do not create a semantic assertion solely from a heading whose wording happens to resemble a business concept.

AMBIGUITY AND INCOMPLETE MEANING

Do not repair vague or incomplete source text.

If the source expresses uncertain, ambiguous, conditional, or incomplete meaning, preserve that uncertainty instead of choosing an interpretation.

If a source contains no independently extractable business meaning, classify it using the appropriate non-semantic disposition defined by the schema.

SOURCE ACCOUNTING

Every supplied source slot must receive exactly one disposition.

No source slot may be omitted.
No additional source slot may be invented.
Every extracted semantic statement must remain traceable to the source slot that explicitly supports it.

BOUNDARY

This stage performs extraction only.

Do not:
- reconcile extracted statements;
- determine whether statements conflict;
- resolve ambiguity;
- choose a winner;
- supersede an existing statement;
- merge with existing Atlas knowledge;
- determine canonical truth;
- infer publication status;
- infer acceptance;
- perform downstream Atlas projection.

Return only output conforming to the supplied strict JSON Schema.
`;

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
