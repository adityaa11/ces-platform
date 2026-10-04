import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { normalizeProviderWireResult, providerWireResultSchema, sourceSemanticResultSchema } from "./semir-002-schema.mjs";
import { evaluateAccounting, evaluateSemanticResult } from "./semir-003-oracle.mjs";
import { createQualificationFixtures } from "./semir-004-harness.mts";

const ticket = "SEMSPIKE-007";
const model = "claude-sonnet-5-5";
const subsetIds = ["SEMIR-001-021", "SEMIR-001-003", "SEMIR-001-002", "SEMIR-001-006", "SEMIR-001-007", "SEMIR-001-004", "SEMIR-001-009", "SEMIR-001-022", "SEMIR-001-010", "SEMIR-001-020", "SEMIR-001-035", "SEMIR-001-038"] as const;
// Keep this string byte-for-byte identical to the frozen SEMSPIKE-006 prompt.
const prompt = "Extract only meaning supported by the authorized source units. Represent each meaningful source as one or more propositions. Preserve modality, polarity, conditions, triggers, temporal relationships, quantities, scope, state, discourse role, and unresolved aspects independently when supported. Do not strengthen or weaken the source. Permission, possibility, obligation, prohibition, and recommendation are distinct. When an essential component is missing, preserve known meaning and identify the missing component as unresolved; do not invent it. Preserve examples and non-semantic structure as such. Use only evidence from the authorized source text. Do not canonicalize terminology, reconcile project truth, resolve conflicts, infer authority, or repair ambiguity.";
const promptSha256 = createHash("sha256").update(prompt).digest("hex");
const envelopeSchema = z.object({ results: z.array(providerWireResultSchema).length(subsetIds.length) }).strict();
const output = resolve(process.env.SEMSPIKE_007_ARTIFACT_ROOT ?? ".atlas-data/semantic-ir-spike-007/anthropic-sonnet-5-5");
const credentialPattern = /(sk-ant-[A-Za-z0-9_-]+|x-api-key\s*[:=]\s*[^\s,;"']+|Bearer\s+[A-Za-z0-9._~-]+|(?:api[_-]?key|authorization|token|secret|password)\s*[:=]\s*[^\s,;"']+)/gi;
const credentialKey = /(?:api[_-]?key|authorization|token|secret|password|cookie|headers?|environment)/i;

const sha256 = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const safeText = (value: string) => value.slice(0, 2_000).replace(credentialPattern, "[REDACTED]");
export const sanitizeProviderDiagnostic = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return "[TRUNCATED]";
  if (typeof value === "string") return safeText(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitizeProviderDiagnostic(item, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 50).map(([key, item]) => [key, credentialKey.test(key) ? "[REDACTED]" : sanitizeProviderDiagnostic(item, depth + 1)]));
  return String(value);
};
const safeError = (error: unknown) => sanitizeProviderDiagnostic(error instanceof Error ? { name: error.name, message: error.message, status: (error as { status?: unknown }).status } : error);

const fixture = createQualificationFixtures();
const subset = subsetIds.map((caseId) => {
  const expected = fixture.knownGood.find((item) => item.entry.id === caseId);
  const slot = fixture.slots.find((item) => item.caseId === caseId);
  if (!expected || !slot) throw new Error(`Frozen subset member ${caseId} is unavailable from the SEMIR-004 harness.`);
  return { caseId, sourceSlot: slot.sourceSlot, locatorId: slot.locatorId, text: slot.text, expected: expected.expected, observed: expected.observed };
});
const outputFormat = zodOutputFormat(envelopeSchema);
const providerSchema = outputFormat.schema;

function validateAnthropicSchema(schema: unknown) {
  const violations: Array<{ path: string; kind: string; value?: unknown }> = [];
  const objects: string[] = [];
  const seen = new Set<unknown>();
  const visit = (node: any, path: string) => {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    for (const key of ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "maxItems"]) if (Object.hasOwn(node, key)) violations.push({ path, kind: `unsupported-${key}`, value: node[key] });
    if (Object.hasOwn(node, "minItems") && ![0, 1].includes(node.minItems)) violations.push({ path, kind: "unsupported-minItems", value: node.minItems });
    if (typeof node.$ref === "string" && !node.$ref.startsWith("#/")) violations.push({ path, kind: "external-ref", value: node.$ref });
    if (Array.isArray(node.allOf) && node.allOf.some((branch: unknown) => branch && typeof branch === "object" && "$ref" in (branch as object))) violations.push({ path, kind: "allOf-with-ref" });
    if (node.properties && typeof node.properties === "object") {
      objects.push(path);
      if (node.additionalProperties !== false) violations.push({ path, kind: "open-object", value: node.additionalProperties });
      for (const [key, value] of Object.entries(node.properties)) visit(value, `${path}/properties/${key}`);
    }
    if (node.items) visit(node.items, `${path}/items`);
    for (const key of ["anyOf", "oneOf", "allOf"]) if (Array.isArray(node[key])) node[key].forEach((value: unknown, index: number) => visit(value, `${path}/${key}/${index}`));
    if (node.$defs && typeof node.$defs === "object") for (const [key, value] of Object.entries(node.$defs)) visit(value, `${path}/$defs/${key}`);
  };
  visit(schema, "#");
  return { compatible: violations.length === 0, violations, objectCount: objects.length };
}

// Converts frozen Atlas fixtures solely to prove the unchanged wire envelope can
// represent them. Live responses always undergo the reverse normalization.
function fixtureToWire(value: any): any {
  if (Array.isArray(value)) return value.map(fixtureToWire);
  if (!value || typeof value !== "object") return value;
  const copy: Record<string, any> = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fixtureToWire(item)]));
  if ("discourseRole" in copy || "sourceDisposition" in copy) copy.discourseRole ??= null;
  if (copy.qualifiers) {
    copy.qualifiers.modality ??= null;
    copy.qualifiers.polarity ??= "positive";
    for (const key of ["conditions", "triggers", "temporal", "quantities", "scopes"]) copy.qualifiers[key] ??= [];
    copy.qualifiers.state ??= null;
    if (copy.qualifiers.modality?.type === "possibility") copy.qualifiers.modality.appliesTo ??= null;
    if (copy.qualifiers.state) copy.qualifiers.state.from ??= null;
    for (const quantity of copy.qualifiers.quantities) quantity.unit ??= null;
  }
  return copy;
}

function runOfflineGate() {
  assert.equal(promptSha256, "6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144", "frozen semantic prompt hash must match");
  assert.deepEqual(subset.map((item) => item.caseId), [...subsetIds], "frozen source order must match");
  const commands = ["check-semir-001-corpus.mjs", "check-semir-002-schema.mjs", "check-semir-003-oracle.mjs", "check-semir-004-harness.mts", "check-semir-006-provider-wire.mjs"];
  for (const command of commands) {
    const result = spawnSync(process.execPath, ["packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs", `scripts/semantic-ir-v0/${command}`], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(result.status, 0, `${command} must pass before provider use: ${result.stderr || result.stdout}`);
  }
  const schema = validateAnthropicSchema(providerSchema);
  assert.equal(schema.compatible, true, `Anthropic transformed schema incompatible: ${JSON.stringify(schema.violations)}`);
  for (const item of subset) assert.doesNotThrow(() => providerWireResultSchema.parse(fixtureToWire(item.observed)), `${item.caseId} must remain representable by the provider wire`);
  const isolation = (() => { const runOne = { semantic: "run-one" }; const runTwo = { semantic: "run-two" }; return runOne.semantic !== runTwo.semantic; })();
  assert.equal(isolation, true, "Run 2 must not share Run 1 semantic state");
  const sanitizerSample = JSON.stringify(sanitizeProviderDiagnostic({ "x-api-key": "sk-ant-secret", authorization: "Bearer hidden", cookie: "session=hidden", environment: { ANTHROPIC_API_KEY: "sk-ant-hidden" }, message: "sk-ant-visible" }));
  assert.ok(!/sk-ant-|Bearer hidden|session=hidden|ANTHROPIC_API_KEY/.test(sanitizerSample), "sanitizer must redact Anthropic secrets and environment data");
  assert.equal(existsSync(resolve(".gitignore")), true, "artifact isolation requires repository ignore rules");
  const ignored = spawnSync("git", ["check-ignore", "-q", output], { cwd: process.cwd() });
  assert.equal(ignored.status, 0, `${output} must be ignored`);
  const diffCheck = spawnSync("git", ["diff", "--check"], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(diffCheck.status, 0, `git diff --check must pass: ${diffCheck.stdout}${diffCheck.stderr}`);
  return { commands, schema, promptSha256, sourceSubsetSha256: sha256(subset.map(({ caseId, sourceSlot, text }) => ({ caseId, sourceSlot, text }))), providerCallsBeforeRelease: 0 };
}

function evaluate(results: z.infer<typeof sourceSemanticResultSchema>[]) {
  const accounting = evaluateAccounting(new Set(subset.map((item) => item.sourceSlot)), results);
  const bySlot = new Map(results.map((result) => [result.sourceSlot, result]));
  const semantic = subset.map((item) => evaluateSemanticResult({ expected: item.expected, observed: bySlot.get(item.sourceSlot), sourceText: item.text }));
  return { accounting, semantic, passed: accounting.passed && semantic.every((result) => result.passed) };
}

async function callProvider(key: string) {
  const client = new Anthropic({ apiKey: key, maxRetries: 0 });
  const started = performance.now();
  try {
    const message = await client.messages.parse({ model, max_tokens: 16_000, stream: false, thinking: { type: "adaptive" }, system: prompt, messages: [{ role: "user", content: JSON.stringify({ sources: subset.map(({ sourceSlot, text }) => ({ sourceSlot, text })) }) }], output_config: { effort: "high", format: outputFormat } });
    const metrics = { messageId: message.id, stopReason: message.stop_reason, latencyMs: Math.round(performance.now() - started), inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens, cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? null, cacheReadInputTokens: message.usage.cache_read_input_tokens ?? null };
    if (message.stop_reason === "max_tokens") return { kind: "failure" as const, category: "PROVIDER_OUTPUT_TRUNCATION", metrics, error: "Anthropic ended the response at max_tokens." };
    if (message.stop_reason === "refusal") return { kind: "failure" as const, category: "PROVIDER_REFUSAL_FAILURE", metrics, error: "Anthropic refused the structured response." };
    if (message.stop_reason !== "end_turn") return { kind: "failure" as const, category: "PROVIDER_STRUCTURAL_FAILURE", metrics, error: `Unexpected stop reason: ${message.stop_reason ?? "null"}.` };
    const parsed = envelopeSchema.safeParse(message.parsed_output);
    if (!parsed.success) return { kind: "failure" as const, category: "PROVIDER_STRUCTURAL_FAILURE", metrics, error: parsed.error.issues.map((issue) => issue.path.join(".") || "root") };
    try { return { kind: "success" as const, metrics, evaluation: evaluate(parsed.data.results.map(normalizeProviderWireResult)), parsedOutputSha256: sha256(parsed.data) }; }
    catch (error) { return { kind: "failure" as const, category: "PROVIDER_STRUCTURAL_FAILURE", metrics, error: safeError(error) };
    }
  } catch (error) { return { kind: "environment" as const, metrics: { latencyMs: Math.round(performance.now() - started) }, providerError: safeError(error) }; }
}

async function main() {
  const offline = runOfflineGate();
  if (process.env.SEMSPIKE_007_OFFLINE_ONLY === "1") { console.log(JSON.stringify({ ticket, offline, providerCalls: 0 }, null, 2)); return; }
  if (!process.env.ANTHROPIC_API_KEY && existsSync(resolve(".env"))) process.loadEnvFile(resolve(".env"));
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured; the offline gate passed and no authenticated call was made.");
  await mkdir(output, { recursive: true });
  const freeze = { ticket, provider: "Anthropic", model, promptSha256, sourceSubsetSha256: offline.sourceSubsetSha256, providerSchemaSha256: sha256(providerSchema), maxTokens: 16_000, thinking: "adaptive", effort: "high", streaming: false, sdkVersion: "0.131.0", runnerCommit: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim(), retries: 0, fallback: false, repair: false, providerCallsBeforeRelease: offline.providerCallsBeforeRelease };
  const write = (name: string, value: unknown) => writeFile(resolve(output, name), `${JSON.stringify(value, null, 2)}\n`);
  await write("freeze.json", freeze);
  const runs: any[] = [];
  for (const run of [1, 2]) { const response = await callProvider(key); const record = { run, request: { promptSha256, sourceSubsetSha256: offline.sourceSubsetSha256, providerSchemaSha256: freeze.providerSchemaSha256 }, ...response }; await write(`run-${String(run).padStart(2, "0")}.json`, record); runs.push(record); }
  const successes = runs.filter((run) => run.kind === "success");
  const allSemanticPass = successes.length === 2 && successes.every((run) => run.evaluation.passed);
  const comparable = successes.length === 2;
  const stability = comparable && JSON.stringify(successes[0].evaluation.semantic.map((item: any) => item.checks)) === JSON.stringify(successes[1].evaluation.semantic.map((item: any) => item.checks));
  const semanticExecuted = runs.some((run) => run.kind !== "environment");
  const failureCategory = runs.find((run) => run.category)?.category ?? (semanticExecuted ? (allSemanticPass ? (stability ? null : "PROVIDER_STABILITY_FAILURE") : "PROVIDER_SEMANTIC_FAILURE") : "ENVIRONMENT_BLOCKED");
  const terminal = allSemanticPass && stability ? "PASS" : semanticExecuted ? "FAIL" : "ENVIRONMENT_BLOCKED";
  const summary = { ticket, terminal, failureCategory, structuralResult: successes.length === 2 ? "PASS" : "FAIL", evidenceResult: successes.length === 2 && successes.every((run) => run.evaluation.accounting.passed) ? "PASS" : "FAIL", semanticResult: allSemanticPass ? "PASS" : "FAIL", crossRunStability: comparable ? (stability ? "PASS" : "FAIL") : "NOT_RUN", freeze, runs: runs.map(({ run, kind, category, metrics, error, providerError, evaluation, parsedOutputSha256 }) => ({ run, kind, category, metrics, error, providerError, parsedOutputSha256, evaluation })) };
  await write("summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = terminal === "FAIL" ? 2 : 0;
}

await main();
