import { createHash } from "node:crypto";
import { userMessage } from "./fixture.mts";

export const GROQ_MODEL = "openai/gpt-oss-120b";
export class EnvironmentBlockedError extends Error {}

export const FREEFORM_SYSTEM_INSTRUCTION = `You are analyzing the meaning of supplied text.

For each supplied source, explain in ordinary natural language exactly what the text means.

Preserve uncertainty, possibility, negation, quantities, scope, conditions, temporal relationships, exceptions, and other qualifications expressed by the source.

Do not use outside knowledge or probable business practice.

Do not fill in information the source does not provide.

Do not strengthen or weaken the meaning of the source. In particular, do not convert uncertain statements into certain statements, possibility into obligation, permission into prediction, examples into requirements, or descriptive statements into normative rules.

Do not map the meaning into Atlas concepts, application fields, predefined semantic categories, enums, ontologies, candidates, dispositions, workflow types, constraints, resolution states, or any other structured semantic representation.

If something is uncertain or unspecified, explain that uncertainty or missing information in ordinary language without answering it.

If a source is only structural text such as a heading, title, label, or numbering, explain that it does not itself state a business proposition.

Respond only with ordinary natural-language explanations for the supplied sources.`;

export const instructionHash = createHash("sha256").update(FREEFORM_SYSTEM_INSTRUCTION, "utf8").digest("hex");

export async function invokeGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new EnvironmentBlockedError("GROQ_API_KEY is not configured; no authenticated live inference was attempted.");
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: GROQ_MODEL, stream: false, reasoning_effort: "medium", messages: [{ role: "system", content: FREEFORM_SYSTEM_INSTRUCTION }, { role: "user", content: userMessage }] }) });
  } catch (error) { throw new EnvironmentBlockedError(`Groq network request failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  const latency_ms = Math.round(performance.now() - started);
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new EnvironmentBlockedError(`Groq request was rejected (${response.status}); frozen route did not yield a valid run.`);
  const content = (body.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") throw new Error("Groq returned no ordinary-language message content.");
  return { response: content, metrics: { provider: "Groq", model: GROQ_MODEL, http_status: response.status, latency_ms, input_tokens: (body.usage as Record<string, unknown> | undefined)?.prompt_tokens ?? null, output_tokens: (body.usage as Record<string, unknown> | undefined)?.completion_tokens ?? null, reasoning_effort: "medium", structured_output: "none", instruction_hash: instructionHash, source_count: 4 } };
}
