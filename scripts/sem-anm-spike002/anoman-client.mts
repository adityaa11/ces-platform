import { readFile } from "node:fs/promises";

const ENV_PATH = new URL("../../.env", import.meta.url);
export const ENDPOINT = "https://api.anoman.io/v1/chat/completions";
export const MODEL = "gemini-2.5-flash";
export const TEMPERATURE = 0;
export const RESPONSE_FORMAT = { type: "json_object" } as const;

export function parseRootEnvValue(envText: string, key: string): string | undefined {
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] !== key) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return value || undefined;
  }
  return undefined;
}

export function requireRootEnvValue(envText: string, key: string): string {
  const value = parseRootEnvValue(envText, key);
  if (!value) throw new Error(`${key} is missing from repository-root .env`);
  return value;
}

export async function loadAnomanKey(): Promise<string> {
  let envText: string;
  try { envText = await readFile(ENV_PATH, "utf8"); }
  catch { throw new Error("ENVIRONMENT_BLOCKED: repository-root .env is unavailable"); }
  try { return requireRootEnvValue(envText, "ANOMAN_API_KEY"); }
  catch { throw new Error("ENVIRONMENT_BLOCKED: ANOMAN_API_KEY is missing from repository-root .env"); }
}

export type CallResult = {
  readonly status: number;
  readonly latencyMs: number;
  readonly content?: string;
  readonly response: unknown;
  readonly telemetry: Record<string, unknown>;
};

export async function callAnoman(apiKey: string, prompt: string, userPayload: string): Promise<CallResult> {
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        temperature: TEMPERATURE,
        response_format: RESPONSE_FORMAT,
        messages: [{ role: "system", content: prompt }, { role: "user", content: userPayload }],
      }),
    });
  } catch {
    return { status: 0, latencyMs: Math.round(performance.now() - started), response: { error: "network_failure" }, telemetry: { network_error: true } };
  }
  const latencyMs = Math.round(performance.now() - started);
  const text = await response.text();
  let body: any;
  try { body = JSON.parse(text); } catch { body = { non_json_response: true }; }
  const choice = body?.choices?.[0];
  const usage = body?.usage ?? {};
  const details = usage?.completion_tokens_details ?? {};
  const telemetry = {
    httpStatus: response.status,
    servedModel: body?.model ?? null,
    finishReason: choice?.finish_reason ?? null,
    latencyMs,
    promptTokens: usage?.prompt_tokens ?? null,
    completionTokens: usage?.completion_tokens ?? null,
    reasoningTokens: details?.reasoning_tokens ?? null,
    textTokens: details?.text_tokens ?? null,
    totalTokens: usage?.total_tokens ?? null,
    anoman: body?._anoman ? {
      weighted_tokens: body._anoman.weighted_tokens ?? null,
      cost_usd: body._anoman.cost_usd ?? null,
      routing: body._anoman.routing ? {
        mode: body._anoman.routing.mode ?? null,
        region: body._anoman.routing.region ?? null,
        provider_type: body._anoman.routing.provider_type ?? null,
        provider_region: body._anoman.routing.provider_region ?? null,
      } : null,
      guardrails: body._anoman.guardrails ?? body._anoman.guardrail ?? null,
      cache: body._anoman.cache ?? null,
    } : null,
  };
  if (!response.ok) {
    const errorCode = body?.error?.code ?? body?.error?.type ?? `http_${response.status}`;
    return { status: response.status, latencyMs, response: { errorCode }, telemetry };
  }
  return { status: response.status, latencyMs, content: typeof choice?.message?.content === "string" ? choice.message.content : undefined, response: body, telemetry };
}
