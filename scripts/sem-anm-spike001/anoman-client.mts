import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { providerInput } from "./fixture.mts";
import { SYSTEM_INSTRUCTION } from "./prompt.mts";
import { providerSchema, transportProviderSchema, transportQualificationSchema } from "./schema.mts";

export const ANOMAN_ENDPOINT = "https://api.anoman.io/v1/chat/completions";
export const ANOMAN_MODEL = "gemini-2.5-flash";
export class EnvironmentBlockedError extends Error { constructor(message: string, readonly httpStatus: number | null = null) { super(message); } }
export class StrictSchemaRejectedError extends Error { constructor(message: string, readonly httpStatus: number | null = null) { super(message); } }

const repositoryDotenvPath = fileURLToPath(new URL("../../.env", import.meta.url));

export async function loadAnomanApiKey(env: NodeJS.ProcessEnv = process.env, dotenvPath = repositoryDotenvPath) {
  if (env.ANOMAN_API_KEY?.trim()) return env.ANOMAN_API_KEY.trim();
  let content: string;
  try { content = await readFile(dotenvPath, "utf8"); } catch { throw new EnvironmentBlockedError("ANOMAN_API_KEY is not configured in repository .env; no authenticated live inference was attempted."); }
  const match = content.match(/^\s*ANOMAN_API_KEY\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))\s*(?:#.*)?$/m);
  const key = match?.[1] ?? match?.[2] ?? match?.[3];
  if (!key?.trim()) throw new EnvironmentBlockedError("ANOMAN_API_KEY is not configured in repository .env; no authenticated live inference was attempted.");
  return key.trim();
}

export function buildStrictRequest(kind: "transport" | "semantic") {
  const schema = kind === "transport" ? transportProviderSchema : providerSchema;
  return {
    model: ANOMAN_MODEL, stream: false, temperature: 0,
    messages: kind === "transport" ? [{ role: "user", content: "Return the fixed qualification marker using the supplied schema." }] : [{ role: "system", content: SYSTEM_INSTRUCTION }, { role: "user", content: JSON.stringify(providerInput()) }],
    response_format: { type: "json_schema", json_schema: { name: kind === "transport" ? "transport_qualification" : "semantic_qualification", strict: true, schema } },
  };
}

const numeric = (value: unknown) => typeof value === "number" ? value : null;
export const sanitizeTelemetry = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeTelemetry);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !/authorization|api.?key|secret|token|cookie/i.test(key)).map(([key, child]) => [key, sanitizeTelemetry(child)]));
};

function telemetry(body: Record<string, unknown>, status: number, latencyMs: number) {
  const usage = body.usage as Record<string, unknown> | undefined;
  const anoman = body._anoman as Record<string, unknown> | undefined;
  const routing = anoman?.routing as Record<string, unknown> | undefined;
  const guardrails = anoman?.guardrails ?? anoman?.guardrail;
  return sanitizeTelemetry({ provider: "Anoman", model: ANOMAN_MODEL, endpoint: ANOMAN_ENDPOINT, http_status: status, latency_ms: latencyMs, finish_reason: ((body.choices as Array<{ finish_reason?: unknown }> | undefined)?.[0]?.finish_reason) ?? null, input_tokens: numeric(usage?.prompt_tokens), output_tokens: numeric(usage?.completion_tokens), reasoning_tokens: numeric((usage?.completion_tokens_details as Record<string, unknown> | undefined)?.reasoning_tokens), visible_tokens: numeric((usage?.completion_tokens_details as Record<string, unknown> | undefined)?.visible_tokens), total_tokens: numeric(usage?.total_tokens), weighted_tokens: numeric(anoman?.weighted_tokens), cost_usd: numeric(anoman?.cost_usd), routing_mode: routing?.mode ?? null, gateway_region: routing?.region ?? null, provider_type: routing?.provider_type ?? null, provider_region: routing?.provider_region ?? null, cache: anoman?.cache ?? usage?.cache ?? null, guardrails: guardrails ?? null });
}

async function invoke(kind: "transport" | "semantic") {
  const apiKey = await loadAnomanApiKey();
  const request = buildStrictRequest(kind), started = performance.now();
  let response: Response;
  try { response = await fetch(ANOMAN_ENDPOINT, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(60_000), body: JSON.stringify(request) }); } catch { throw new EnvironmentBlockedError("Anoman network request failed."); }
  const latencyMs = Math.round(performance.now() - started);
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = `Anoman strict-schema request was rejected (HTTP ${response.status}).`;
    if (response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500) throw new EnvironmentBlockedError(message, response.status);
    throw new StrictSchemaRejectedError(message, response.status);
  }
  const content = (body?.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Anoman returned no terminal structured message content.");
  let value: unknown; try { value = JSON.parse(content); } catch { throw new Error("Anoman terminal content was not raw JSON."); }
  if (kind === "transport") transportQualificationSchema.parse(value);
  return { value, telemetry: telemetry(body ?? {}, response.status, latencyMs), config: { model: ANOMAN_MODEL, endpoint: ANOMAN_ENDPOINT, temperature: 0, strict: true, schemaKind: kind } };
}

export const invokeTransportQualification = () => invoke("transport");
export const invokeSemanticQualification = () => invoke("semantic");

/** HMN-SEM-ANM-SPIKE001-001 only: retain the synthetic Gate A content before parsing. */
export async function invokeTransportDiagnostic() {
  const apiKey = await loadAnomanApiKey();
  const request = buildStrictRequest("transport"), started = performance.now();
  let response: Response;
  try { response = await fetch(ANOMAN_ENDPOINT, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(60_000), body: JSON.stringify(request) }); } catch { throw new EnvironmentBlockedError("Anoman network request failed."); }
  const latencyMs = Math.round(performance.now() - started);
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  const choice = (body?.choices as Array<{ finish_reason?: unknown; message?: { content?: unknown } }> | undefined)?.[0];
  return { http_status: response.status, model: body?.model ?? null, finish_reason: choice?.finish_reason ?? null, raw_message_content: choice?.message?.content ?? null, usage: sanitizeTelemetry(body?.usage ?? null), _anoman: sanitizeTelemetry(body?._anoman ?? null), latency_ms: latencyMs };
}
