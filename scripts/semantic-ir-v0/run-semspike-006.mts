import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { normalizeProviderWireResult, providerWireResultSchema, sourceSemanticResultSchema } from "./semir-002-schema.mjs";
import { evaluateAccounting, evaluateSemanticResult } from "./semir-003-oracle.mjs";
import { createQualificationFixtures } from "./semir-004-harness.mts";

// This is the frozen, context-free SEMSPIKE-006 subset.  Its IDs and prompt
// are deliberately kept in the runner so that both calls have one identity.
const subsetIds = [
  "SEMIR-001-021", "SEMIR-001-003", "SEMIR-001-002", "SEMIR-001-006",
  "SEMIR-001-007", "SEMIR-001-004", "SEMIR-001-009", "SEMIR-001-022",
  "SEMIR-001-010", "SEMIR-001-020", "SEMIR-001-035", "SEMIR-001-038",
] as const;
const model = "openai/gpt-oss-120b";
const prompt = `Extract only meaning supported by the authorized source units. Represent each meaningful source as one or more propositions. Preserve modality, polarity, conditions, triggers, temporal relationships, quantities, scope, state, discourse role, and unresolved aspects independently when supported. Do not strengthen or weaken the source. Permission, possibility, obligation, prohibition, and recommendation are distinct. When an essential component is missing, preserve known meaning and identify the missing component as unresolved; do not invent it. Preserve examples and non-semantic structure as such. Use only evidence from the authorized source text. Do not canonicalize terminology, reconcile project truth, resolve conflicts, infer authority, or repair ambiguity.`;
// The request uses the Groq-compatible wire contract; successful wire values
// are structurally normalized and then parsed by the unchanged Atlas contract.
const envelopeSchema = z.object({ results: z.array(providerWireResultSchema).length(subsetIds.length) }).strict();
const output = resolve(process.env.SEMSPIKE_006_ARTIFACT_ROOT ?? ".atlas-data/semantic-ir-spike-006");
const runIdentity = process.env.SEMSPIKE_006_RUN_ID ?? "SEMSPIKE-006";
const callCount = Number(process.env.SEMSPIKE_006_CALL_COUNT ?? "2");
if (!Number.isInteger(callCount) || callCount < 1 || callCount > 2) throw new Error("SEMSPIKE_006_CALL_COUNT must be 1 or 2.");
const write = (name: string, data: unknown) => writeFile(resolve(output, name), `${JSON.stringify(data, null, 2)}\n`);
const credentialPattern = /(gsk_[A-Za-z0-9_-]+|Bearer\s+[A-Za-z0-9._~-]+|(?:api[_-]?key|authorization|token|secret|password)\s*[:=]\s*[^\s,;"']+)/gi;
const credentialKey = /(?:api[_-]?key|authorization|token|secret|password|cookie|headers?|environment)/i;
export const sanitizeDiagnosticText = (value: string) => value.slice(0, 2_000).replace(credentialPattern, "[REDACTED]");
export const sanitizeProviderDiagnostic = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return "[TRUNCATED]";
  if (typeof value === "string") return sanitizeDiagnosticText(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitizeProviderDiagnostic(item, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 50).map(([key, item]) => [key, credentialKey.test(key) ? "[REDACTED]" : sanitizeProviderDiagnostic(item, depth + 1)]));
  return String(value);
};
const safeError = (error: unknown) => error instanceof Error ? sanitizeDiagnosticText(error.message) : "Unknown error";

if (process.env.SEMSPIKE_006_SANITIZER_TEST === "1") {
  const sample = sanitizeProviderDiagnostic({ error: { message: "Bearer abc.def gsk_abc123", type: "invalid_request_error", api_key: "gsk_secret" }, headers: { authorization: "Bearer hidden" } });
  const encoded = JSON.stringify(sample);
  assert.ok(!encoded.includes("gsk_"), "sanitizer must remove Groq key patterns");
  assert.ok(!encoded.includes("Bearer abc"), "sanitizer must remove bearer tokens");
  assert.ok(encoded.includes("invalid_request_error"), "sanitizer must retain safe diagnostic fields");
  console.log("SEMSPIKE-006 sanitizer PASS");
  process.exit(0);
}

const fixture = createQualificationFixtures();
const subset = subsetIds.map((caseId) => {
  const expected = fixture.knownGood.find((item) => item.entry.id === caseId);
  const slot = fixture.slots.find((item) => item.caseId === caseId);
  if (!expected || !slot) throw new Error(`Frozen subset member ${caseId} is unavailable from the SEMIR-004 harness.`);
  return { caseId, sourceSlot: slot.sourceSlot, locatorId: slot.locatorId, text: slot.text, expected: expected.expected };
});
const providerSchema = z.toJSONSchema(envelopeSchema, { target: "draft-2020-12" });
const promptHash = createHash("sha256").update(prompt).digest("hex");
const profile = { provider: "Groq", model, streaming: false, reasoning_effort: "medium", output: "strict JSON Schema", retries: 0, fallback: false, repair: false };

async function callProvider() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { kind: "environment" as const, error: "GROQ_API_KEY is not configured; no authenticated live inference was attempted." };
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, stream: false, reasoning_effort: "medium", messages: [{ role: "system", content: prompt }, { role: "user", content: JSON.stringify({ sources: subset.map(({ sourceSlot, text }) => ({ sourceSlot, text })) }) }], response_format: { type: "json_schema", json_schema: { name: "atlas_semantic_ir_v0", strict: true, schema: providerSchema } } }),
    });
  } catch (error) { return { kind: "environment" as const, error: `Groq network request failed: ${safeError(error)}` }; }
  const latencyMs = Math.round(performance.now() - started);
  const responseText = await response.text();
  let body: Record<string, any> = {};
  try { body = JSON.parse(responseText) as Record<string, any>; } catch { /* bounded text diagnostic below */ }
  const metrics = { httpStatus: response.status, latencyMs, inputTokens: body.usage?.prompt_tokens ?? null, outputTokens: body.usage?.completion_tokens ?? null };
  if (!response.ok) {
    const providerError = sanitizeProviderDiagnostic(Object.keys(body).length ? (body.error ?? body) : responseText);
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("request-id");
    return { kind: "environment" as const, metrics, providerError, ...(requestId ? { providerRequestId: sanitizeDiagnosticText(requestId) } : {}), error: `Groq request was rejected (${response.status}) before semantic execution.` };
  }
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string") return { kind: "structural" as const, metrics, error: "Groq returned no terminal structured message content." };
  let raw: unknown;
  try { raw = JSON.parse(content); } catch { return { kind: "structural" as const, metrics, error: "Groq terminal content was not JSON." }; }
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) return { kind: "structural" as const, metrics, raw, error: parsed.error.issues.map((issue) => issue.path.join(".") || "root") };
  try { return { kind: "success" as const, metrics, raw, results: parsed.data.results.map(normalizeProviderWireResult) }; }
  catch (error) { return { kind: "structural" as const, metrics, raw, error: `Provider-wire normalization failed: ${safeError(error)}` }; }
}

function evaluate(results: z.infer<typeof sourceSemanticResultSchema>[]) {
  const expectedSlots = new Set(subset.map((item) => item.sourceSlot));
  const accounting = evaluateAccounting(expectedSlots, results);
  const bySlot = new Map(results.map((result) => [result.sourceSlot, result]));
  const semantic = subset.map((item) => evaluateSemanticResult({ expected: item.expected, observed: bySlot.get(item.sourceSlot), sourceText: item.text }));
  return { accounting, semantic, passed: accounting.passed && semantic.every((result) => result.passed) };
}

await mkdir(output, { recursive: true });
await write("freeze.json", { runIdentity, profile, subset: subset.map(({ caseId, sourceSlot, locatorId }) => ({ caseId, sourceSlot, locatorId })), promptSha256: promptHash, providerSchemaSha256: createHash("sha256").update(JSON.stringify(providerSchema)).digest("hex"), requestShape: "one non-streaming strict-schema request containing only the frozen 12 source units" });

const runs: any[] = [];
for (const number of Array.from({ length: callCount }, (_, index) => index + 1)) {
  const response = await callProvider();
  const record: any = { run: number, profile, ...("metrics" in response ? response.metrics : {}), request: { promptSha256: promptHash, sourceSlots: subset.map((item) => item.sourceSlot) }, stage: response.kind };
  if (response.kind === "success") {
    record.raw = response.raw;
    record.evaluation = evaluate(response.results);
  } else { record.error = response.error; if ("providerError" in response) record.providerError = response.providerError; if ("providerRequestId" in response) record.providerRequestId = response.providerRequestId; if ("raw" in response) record.raw = response.raw; }
  await write(`run-${String(number).padStart(2, "0")}.json`, record);
  runs.push(record);
}

const successful = runs.filter((run) => run.stage === "success");
const allSemanticPass = callCount === 2 && successful.length === 2 && successful.every((run) => run.evaluation.passed);
const comparable = callCount === 2 && successful.length === 2;
const stability = comparable && JSON.stringify(successful[0].evaluation.semantic.map((result: any) => result.checks)) === JSON.stringify(successful[1].evaluation.semantic.map((result: any) => result.checks));
const anyHttpSuccess = runs.some((run) => run.httpStatus === 200);
const terminal = allSemanticPass && stability ? "PASS" : anyHttpSuccess ? "FAIL" : "ENVIRONMENT_BLOCKED";
const failureCategory = terminal === "PASS" ? null : terminal === "ENVIRONMENT_BLOCKED" ? "ENVIRONMENT_BLOCKED" : successful.length !== 2 ? "PROVIDER_STRUCTURAL_FAILURE" : !allSemanticPass ? "PROVIDER_SEMANTIC_FAILURE" : "PROVIDER_STABILITY_FAILURE";
const summary = { runIdentity, callCount, terminal, failureCategory, profile, promptSha256: promptHash, structuralResult: successful.length === 2 ? "PASS" : "FAIL", evidenceResult: successful.length === 2 && successful.every((run) => run.evaluation.accounting.passed) ? "PASS" : "FAIL", semanticResult: allSemanticPass ? "PASS" : "FAIL", crossRunStability: comparable ? (stability ? "PASS" : "FAIL") : "NOT_RUN", runs: runs.map(({ run, stage, httpStatus, latencyMs, inputTokens, outputTokens, error, providerError, providerRequestId }) => ({ run, stage, httpStatus, latencyMs, inputTokens, outputTokens, error, providerError, providerRequestId })) };
await write("summary.json", summary);
console.log(JSON.stringify(summary, null, 2));
process.exitCode = terminal === "PASS" || terminal === "ENVIRONMENT_BLOCKED" ? 0 : 2;
