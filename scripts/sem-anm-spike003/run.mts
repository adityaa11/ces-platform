import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { atlasProviderExtractionProposalV1Schema } from "../sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts";
import { callAnoman, ENDPOINT, loadAnomanKey, MODEL, RESPONSE_FORMAT, TEMPERATURE } from "./anoman-client.mts";
import { fixtureSha256, userPayload } from "./fixture.mts";
import { parseNormalizedProviderOutput } from "./normalize-provider-output.mts";
import { assertSourceAccounting, evaluateOracle } from "./semantic-oracle.mts";

const ARTIFACT_DIR = fileURLToPath(new URL("../../.atlas-data/sem-anm-spike003/", import.meta.url));
const hashes = { reference: "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083", schema: "c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b", prompt: "80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5", provenance: "27bb968c000d82897857f8076f7dfab1e04abaffcab2bed798c4fb8dc451f8c4" };
const root = new URL("../../", import.meta.url); const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
async function checked(path: string, expected: string): Promise<Uint8Array> { const bytes = await readFile(new URL(path, root)); if (sha(bytes) !== expected) throw new Error(`BLOCKED_AUTHORITY: hash mismatch for ${path}`); return bytes; }
const reference = await checked("scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts", hashes.reference);
const schema = await checked("scripts/sem-anm-prompt002/generated/provider-schema.json", hashes.schema);
const promptBytes = await checked("scripts/sem-anm-prompt002/generated/system-prompt.txt", hashes.prompt);
await checked("scripts/sem-anm-prompt002/generated/prompt-provenance.json", hashes.provenance);
try { execFileSync("git", ["check-ignore", "-q", ".env"], { stdio: "ignore" }); execFileSync("git", ["check-ignore", "-q", ".atlas-data/sem-anm-spike003/summary.json"], { stdio: "ignore" }); } catch { throw new Error("BLOCKED_AUTHORITY: root .env or spike evidence directory is not ignored"); }
const apiKey = await loadAnomanKey(); const prompt = new TextDecoder().decode(promptBytes); const payloadHash = sha(new TextEncoder().encode(userPayload));
await mkdir(ARTIFACT_DIR, { recursive: true });
async function safeWrite(name: string, value: unknown) { let text = `${JSON.stringify(value, null, 2)}\n`; if (text.includes(apiKey)) text = text.replaceAll(apiKey, "[REDACTED]"); text = text.replace(/Bearer\s+[^\s"\\]+/gi, "Bearer [REDACTED]"); await writeFile(`${ARTIFACT_DIR}${name}`, text); }
const config = { ticket: "SEM-ANM-SPIKE-003", predecessor: { ticket: "SEM-ANM-PROMPT-002", ck: "SEM-ANM-PROMPT-002-BATCH-03-e2ccb5b-review.md: PASS", hashes }, provider: { endpoint: ENDPOINT, model: MODEL, stream: false, temperature: TEMPERATURE, responseFormat: RESPONSE_FORMAT }, callsAuthorized: 2, fixtureSha256, userPayloadSha256: payloadHash, sourceReferenceSha256: sha(reference), providerSchemaSha256: sha(schema) };
await safeWrite("run-config.json", config);
const runs: Record<string, unknown>[] = [];
for (let index = 1; index <= 2; index += 1) {
  await checked("scripts/sem-anm-prompt002/generated/system-prompt.txt", hashes.prompt); await checked("scripts/sem-anm-prompt002/generated/provider-schema.json", hashes.schema);
  const call = await callAnoman(apiKey, prompt, userPayload);
  const record: Record<string, unknown> = { run: index, configuration: { endpoint: ENDPOINT, model: MODEL, stream: false, temperature: TEMPERATURE, responseFormat: RESPONSE_FORMAT, promptSha256: hashes.prompt, schemaSha256: hashes.schema, fixtureSha256, userPayloadSha256: payloadHash }, httpStatus: call.status, latencyMs: call.latencyMs, telemetry: call.telemetry, rawProviderContent: call.content ?? null, fenceRemoved: false, postFenceJsonText: null, parsedProposal: null, zodValidation: "not_reached", sourceAccounting: "not_reached", oracle: null };
  if (call.content !== undefined) try { const normalized = parseNormalizedProviderOutput(call.content); record.fenceRemoved = normalized.removedFence; record.postFenceJsonText = normalized.text; const proposal = atlasProviderExtractionProposalV1Schema.parse(normalized.value); record.parsedProposal = proposal; record.zodValidation = "PASS"; assertSourceAccounting(proposal); record.sourceAccounting = "PASS"; record.oracle = evaluateOracle(proposal); if (!(record.oracle as { passed: boolean }).passed) record.validationError = "semantic_oracle_failed"; } catch (error) { record.validationError = error instanceof SyntaxError ? "invalid_json_after_permitted_normalization" : error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 600) : "validation_failed"; } else record.validationError = call.status === 0 ? "network_failure" : `http_${call.status}_without_provider_content`;
  await safeWrite(`live-run-${index}.json`, record); runs.push(record);
}
const inferenceReturned = runs.some((r) => r.httpStatus === 200); const correct = runs.every((r) => r.httpStatus === 200 && r.zodValidation === "PASS" && r.sourceAccounting === "PASS" && (r.oracle as { passed?: boolean } | null)?.passed === true);
const blocked = !inferenceReturned || runs.every((r) => [0, 401, 403, 429].includes(r.httpStatus as number) || (r.httpStatus as number) >= 500);
const terminalResult = correct ? (runs.some((r) => r.fenceRemoved === true) ? "PASS_WITH_LIMITS" : "PASS") : blocked ? "ENVIRONMENT_BLOCKED" : "FAIL";
const matrix = { terminalResult, runs: runs.map((r) => ({ run: r.run, status: r.httpStatus, fenceRemoved: r.fenceRemoved, zodValidation: r.zodValidation, sourceAccounting: r.sourceAccounting, oracle: r.oracle, telemetry: r.telemetry, validationError: r.validationError ?? null })) };
await safeWrite("semantic-run-matrix.json", matrix); await safeWrite("summary.json", { ...matrix, ...hashes, fixtureSha256, userPayloadSha256: payloadHash, requestCount: runs.length });
for (const name of ["run-config.json", "live-run-1.json", "live-run-2.json", "semantic-run-matrix.json", "summary.json"]) { const text = await readFile(`${ARTIFACT_DIR}${name}`, "utf8"); if (text.includes(apiKey) || /authorization\s*:\s*bearer/i.test(text)) throw new Error("Secret-safety inspection failed"); }
console.log(JSON.stringify({ terminalResult, requestCount: runs.length, promptSha256: hashes.prompt, providerSchemaSha256: hashes.schema, fixtureSha256, artifacts: ".atlas-data/sem-anm-spike003/" }));
if (terminalResult === "FAIL" || terminalResult === "ENVIRONMENT_BLOCKED") process.exitCode = terminalResult === "ENVIRONMENT_BLOCKED" ? 2 : 1;
