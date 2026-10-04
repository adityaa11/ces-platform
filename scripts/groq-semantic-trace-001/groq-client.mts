import { createHash } from "node:crypto";
import { providerInput } from "./fixture.mts";
import { semanticTraceSchema } from "./schema.mts";

export const GROQ_MODEL = "openai/gpt-oss-120b";
export class EnvironmentBlockedError extends Error {}

export const FROZEN_SYSTEM_INSTRUCTION = `You are performing a bounded semantic-meaning trace experiment.

Your only task is to describe the meaning explicitly expressed by each supplied source slot. This experiment measures language understanding before any Atlas classification, policy, reconciliation, or application-schema mapping.

Interpret only the supplied text. Do not use outside knowledge or probable business practice. Do not invent actors, requirements, conditions, causes, thresholds, intent, or outcomes that are not expressed.

For each source slot:
1. Decide whether it contains a business proposition or is structural/non-semantic text.
2. If it contains a business proposition, restate that proposition faithfully without strengthening or weakening it.
3. Identify its epistemic status using only: certain, probable, possible, underspecified, or not_applicable.
4. Identify its polarity using only: positive, negative, underspecified, or not_applicable.
5. Record any condition explicitly stated by the source. If none is stated, return an empty list.
6. Record information that the source itself leaves unresolved and that would be necessary to know whether or how the proposition applies. Do not answer or repair the missing information.
7. Preserve quantities, units, scope, modality, negation, temporal ordering, exceptions, and other qualifiers exactly.
8. Return exactly one semantic observation for every supplied slot. Do not omit, duplicate, or invent slots.

Important distinctions:
- Modal words are not classified by keyword alone. For example, "may" can express permission or possibility; determine its meaning from the sentence.
- Do not convert may to must, can to will, possibility to obligation, examples to requirements, or descriptive statements to normative rules.
- Do not treat headings, numbering, labels, navigation, or other structural text as business propositions.
- Do not generate clarification questions. Only describe information that remains unresolved in the source.
- Do not use Atlas concepts or labels such as candidate, workflow_step, constraint, unresolved kind, needs_resolution, disposition, evidence, canonical, accepted fact, reconciliation, Main Workflow, Project Facts, or CES Result.
- Do not decide what Atlas should believe, accept, publish, reconcile, or do.

Return only JSON conforming to the supplied strict JSON Schema.`;

export const instructionHash = createHash("sha256").update(FROZEN_SYSTEM_INSTRUCTION, "utf8").digest("hex");

export async function invokeGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new EnvironmentBlockedError("GROQ_API_KEY is not configured; no authenticated live inference was attempted.");
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: GROQ_MODEL, stream: false, reasoning_effort: "medium", messages: [{ role: "system", content: FROZEN_SYSTEM_INSTRUCTION }, { role: "user", content: JSON.stringify(providerInput()) }], response_format: { type: "json_schema", json_schema: { name: "semantic_trace_observation", strict: true, schema: semanticTraceSchema } } }) });
  } catch (error) { throw new EnvironmentBlockedError(`Groq network request failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  const latency_ms = Math.round(performance.now() - started);
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new EnvironmentBlockedError(`Groq request was rejected (${response.status}); frozen route did not yield a valid run.`);
  const content = (body.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Groq returned no terminal structured message content.");
  try { return { proposal: JSON.parse(content), metrics: { provider: "Groq", model: GROQ_MODEL, http_status: response.status, latency_ms, input_tokens: (body.usage as Record<string, unknown> | undefined)?.prompt_tokens ?? null, output_tokens: (body.usage as Record<string, unknown> | undefined)?.completion_tokens ?? null, reasoning_effort: "medium", structured_output: "strict JSON Schema", instruction_hash: instructionHash, source_count: 4 } }; } catch { throw new Error("Groq terminal content was not JSON."); }
}
