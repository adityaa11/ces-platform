import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { atlasProviderExtractionProposalV1Schema } from "../sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts";
import { CROSS_FIELD_POLICY_BODY } from "../sem-anm-prompt003/cross-field-policy.mts";
import { callAnoman, ENDPOINT, loadAnomanKey, MODEL, RESPONSE_FORMAT, TEMPERATURE } from "./anoman-client.mts";
import { fixtureSha256, userPayload } from "./fixture.mts";
import { parseNormalizedProviderOutput } from "./normalize-provider-output.mts";
import { assertSourceAccounting, evaluateOracle } from "./semantic-oracle.mts";

const ARTIFACT_DIR = fileURLToPath(new URL("../../.atlas-data/sem-anm-spike004/", import.meta.url));
const root = new URL("../../", import.meta.url);
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const hashes = {
  reference: "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083",
  predecessorPrompt: "80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5",
  schema: "c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b",
  prompt: "da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1",
  provenance: "90e9e3b6a6607dedd4c135c485dbfc9223741a6200be6bd28519d4bb7f4b5200",
  policy: "2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10",
  payload: "e0e674749c0917f1e9e5bb8ffbc1d0059d8f9421d7b7f830a1c7994b303a8f65",
};
async function checked(path: string, expected: string): Promise<Uint8Array> { const bytes = await readFile(new URL(path, root)); if (sha(bytes) !== expected) throw new Error(`BLOCKED_AUTHORITY: hash mismatch for ${path}`); return bytes; }
async function assertFrozenIdentity() {
  const reference = await checked("scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts", hashes.reference);
  await checked("scripts/sem-anm-prompt002/generated/system-prompt.txt", hashes.predecessorPrompt);
  const schema = await checked("scripts/sem-anm-prompt003/generated/provider-schema.json", hashes.schema);
  const prompt = await checked("scripts/sem-anm-prompt003/generated/system-prompt.txt", hashes.prompt);
  await checked("scripts/sem-anm-prompt003/generated/prompt-provenance.json", hashes.provenance);
  if (sha(CROSS_FIELD_POLICY_BODY) !== hashes.policy) throw new Error("BLOCKED_AUTHORITY: cross-field policy body hash mismatch");
  if (sha(userPayload) !== hashes.payload) throw new Error("BLOCKED_AUTHORITY: user payload hash mismatch");
  return { reference, schema, prompt };
}
try {
  execFileSync("git", ["merge-base", "--is-ancestor", "8b098ad", "HEAD"], { stdio: "ignore" });
  execFileSync("git", ["check-ignore", "-q", ".env"], { stdio: "ignore" });
  execFileSync("git", ["check-ignore", "-q", ".atlas-data/sem-anm-spike004/summary.json"], { stdio: "ignore" });
} catch { throw new Error("BLOCKED_AUTHORITY: PROMPT-003 CK approval is unreachable or required secret/evidence paths are not ignored"); }
const initial = await assertFrozenIdentity();
const apiKey = await loadAnomanKey();
const prompt = new TextDecoder().decode(initial.prompt);
await mkdir(ARTIFACT_DIR, { recursive: true });
async function safeWrite(name: string, value: unknown) {
  let text = `${JSON.stringify(value, null, 2)}\n`;
  if (text.includes(apiKey)) text = text.replaceAll(apiKey, "[REDACTED]");
  text = text.replace(/Bearer\s+[^\s"\\]+/gi, "Bearer [REDACTED]");
  await writeFile(`${ARTIFACT_DIR}${name}`, text);
}
const config = { ticket: "SEM-ANM-SPIKE-004", predecessor: { ticket: "SEM-ANM-PROMPT-003", ck: "SEM-ANM-PROMPT-003-BATCH-03-603ecca-review.md: PASS", approvalCommit: "8b098ad" }, hashes, provider: { endpoint: ENDPOINT, model: MODEL, stream: false, temperature: TEMPERATURE, responseFormat: RESPONSE_FORMAT }, callsAuthorized: 2, fixtureSha256, userPayloadSha256: sha(userPayload), sourceReferenceSha256: sha(initial.reference), providerSchemaSha256: sha(initial.schema) };
await safeWrite("run-config.json", config);
const runs: Record<string, unknown>[] = [];
for (let index = 1; index <= 2; index += 1) {
  await assertFrozenIdentity();
  const call = await callAnoman(apiKey, prompt, userPayload);
  const record: Record<string, unknown> = { run: index, configuration: { endpoint: ENDPOINT, model: MODEL, stream: false, temperature: TEMPERATURE, responseFormat: RESPONSE_FORMAT, promptSha256: hashes.prompt, schemaSha256: hashes.schema, referenceSha256: hashes.reference, provenanceSha256: hashes.provenance, policySha256: hashes.policy, fixtureSha256, userPayloadSha256: hashes.payload }, httpStatus: call.status, latencyMs: call.latencyMs, servedModel: call.telemetry.servedModel ?? null, finishReason: call.telemetry.finishReason ?? null, telemetry: call.telemetry, rawProviderContent: call.content ?? null, fenceRemoved: false, postFenceJsonText: null, parsedProposal: null, zodValidation: "not_reached", sourceAccounting: "not_reached", oracle: null, validationError: null };
  if (call.content !== undefined) try {
    const normalized = parseNormalizedProviderOutput(call.content);
    record.fenceRemoved = normalized.removedFence;
    record.postFenceJsonText = normalized.text;
    const proposal = atlasProviderExtractionProposalV1Schema.parse(normalized.value);
    record.parsedProposal = proposal;
    record.zodValidation = "PASS";
    assertSourceAccounting(proposal);
    record.sourceAccounting = "PASS";
    record.oracle = evaluateOracle(proposal);
    if (!(record.oracle as { passed: boolean }).passed) record.validationError = "semantic_oracle_failed";
  } catch (error) {
    record.validationError = error instanceof SyntaxError ? "invalid_json_after_permitted_normalization" : error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 600) : "validation_failed";
  } else record.validationError = call.status === 0 ? "network_failure" : `http_${call.status}_without_provider_content`;
  await safeWrite(`live-run-${index}.json`, record);
  runs.push(record);
}
const inferenceReturned = runs.some((r) => r.httpStatus === 200);
const correct = runs.every((r) => r.httpStatus === 200 && r.zodValidation === "PASS" && r.sourceAccounting === "PASS" && (r.oracle as { passed?: boolean } | null)?.passed === true);
const blocked = !inferenceReturned || runs.every((r) => [0, 401, 403, 429].includes(r.httpStatus as number) || (r.httpStatus as number) >= 500);
const terminalResult = correct ? (runs.some((r) => r.fenceRemoved === true) ? "PASS_WITH_LIMITS" : "PASS") : blocked ? "ENVIRONMENT_BLOCKED" : "FAIL";
const matrix = { terminalResult, runs: runs.map((r) => ({ run: r.run, status: r.httpStatus, latencyMs: r.latencyMs, servedModel: r.servedModel, finishReason: r.finishReason, fenceRemoved: r.fenceRemoved, zodValidation: r.zodValidation, sourceAccounting: r.sourceAccounting, oracle: r.oracle, telemetry: r.telemetry, validationError: r.validationError })) };
const comparison = { historicalSpike003: { terminalResult: "FAIL", promptSha256: hashes.predecessorPrompt, runs: [{ run: 1, S1: "PASS", S2: "PASS", S3: "PASS", S4: "FAIL" }, { run: 2, S1: "PASS", S2: "PASS", S3: "PASS", S4: "FAIL" }] }, spike004: { terminalResult, promptSha256: hashes.prompt, sameRoute: { endpoint: ENDPOINT, model: MODEL, stream: false, temperature: TEMPERATURE, responseFormat: RESPONSE_FORMAT }, runs: runs.map((r) => ({ run: r.run, S1: (r.oracle as any)?.slots?.S1?.passed ? "PASS" : "FAIL", S2: (r.oracle as any)?.slots?.S2?.passed ? "PASS" : "FAIL", S3: (r.oracle as any)?.slots?.S3?.passed ? "PASS" : "FAIL", S4: (r.oracle as any)?.slots?.S4?.passed ? "PASS" : "FAIL" })) } };
await safeWrite("semantic-run-matrix.json", matrix);
await safeWrite("comparison-with-spike003.json", comparison);
await safeWrite("summary.json", { ...matrix, ...hashes, fixtureSha256, userPayloadSha256: hashes.payload, requestCount: runs.length, redactionScan: "PASS" });
for (const name of ["run-config.json", "live-run-1.json", "live-run-2.json", "semantic-run-matrix.json", "comparison-with-spike003.json", "summary.json"]) { const text = await readFile(`${ARTIFACT_DIR}${name}`, "utf8"); if (text.includes(apiKey) || /authorization\s*:\s*bearer/i.test(text)) throw new Error("Secret-safety inspection failed"); }
console.log(JSON.stringify({ terminalResult, requestCount: runs.length, promptSha256: hashes.prompt, providerSchemaSha256: hashes.schema, fixtureSha256, artifacts: ".atlas-data/sem-anm-spike004/" }));
if (terminalResult === "FAIL" || terminalResult === "ENVIRONMENT_BLOCKED") process.exitCode = terminalResult === "ENVIRONMENT_BLOCKED" ? 2 : 1;
