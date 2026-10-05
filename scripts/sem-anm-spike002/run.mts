import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildPromptFromZod } from "../sem-anm-prompt001/prompt-builder.mts";
import { SemanticPromptSchema } from "../sem-anm-prompt001/semantic-schema.mts";
import { assertSourceAccounting, evaluateOracle, type Proposal } from "./semantic-oracle.mts";
import { fixtureSha256, normalizedDocument } from "./fixture.mts";
import { prepareSourceSlots, makeUserPayload } from "./prepare-source-slots.mts";
import { callAnoman, ENDPOINT, loadAnomanKey, MODEL, RESPONSE_FORMAT, TEMPERATURE } from "./anoman-client.mts";
import { parseNormalizedProviderOutput } from "./normalize-provider-output.mts";
import { finalizeProposal, snapshotProposal } from "./finalize.mts";

const APPROVED_PROMPT_HASH = "5927a2b78903bc043c214f984bbcf3e91fa1971d216b1dd3e088e009e9cc72c4";
const APPROVED_SCHEMA_HASH = "b0316a004d4f1f94a0b9da240bfa730e3b1956e8f52808f3b6b07083dba97fa5";
const PREDECESSOR_CHECKPOINT = "42f59279d5f599d4d9a580ee2fa9986124cc8361";
const PREDECESSOR_CK = "SEM-ANM-PROMPT-BATCH-001-42f5927-verification.md: PASS";
const ARTIFACT_DIR = fileURLToPath(new URL("../../.atlas-data/sem-anm-spike002/", import.meta.url));
const slots = prepareSourceSlots(normalizedDocument);
const userPayload = makeUserPayload(slots);
const payloadHash = createHash("sha256").update(userPayload).digest("hex");
const { jsonSchema, prompt } = buildPromptFromZod();
const promptHash = createHash("sha256").update(prompt).digest("hex");
const schemaText = `${JSON.stringify(jsonSchema, null, 2)}\n`;
const schemaHash = createHash("sha256").update(schemaText).digest("hex");
if (promptHash !== APPROVED_PROMPT_HASH || schemaHash !== APPROVED_SCHEMA_HASH) throw new Error("BLOCKED_AUTHORITY: predecessor prompt or schema identity mismatch");
try { execFileSync("git", ["check-ignore", "-q", ".env"], { stdio: "ignore" }); }
catch { throw new Error("BLOCKED_AUTHORITY: repository-root .env is not ignored"); }
try { execFileSync("git", ["check-ignore", "-q", ".atlas-data/sem-anm-spike002/run-config.json"], { stdio: "ignore" }); }
catch { throw new Error("BLOCKED_AUTHORITY: spike evidence directory is not ignored"); }
const apiKey = await loadAnomanKey();
await mkdir(ARTIFACT_DIR, { recursive: true });
async function writeSafeJson(file: string, value: unknown) {
  let serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (serialized.includes(apiKey)) serialized = serialized.replaceAll(apiKey, "[REDACTED]");
  serialized = serialized.replace(/Bearer\s+[^\s"\\]+/gi, "Bearer [REDACTED]");
  await writeFile(`${ARTIFACT_DIR}${file}`, serialized);
}
const config = {
  ticket: "SEM-ANM-SPIKE-002",
  predecessor: { ticket: "SEM-ANM-PROMPT-001", checkpoint: PREDECESSOR_CHECKPOINT, ck: PREDECESSOR_CK, promptSha256: promptHash, providerSchemaSha256: schemaHash },
  provider: "Anoman AI", endpoint: ENDPOINT, model: MODEL, stream: false, temperature: TEMPERATURE, responseFormat: RESPONSE_FORMAT,
  callsAuthorized: 2, fixtureSha256, userPayloadSha256: payloadHash,
};
await writeSafeJson("run-config.json", config);

const runs: Array<Record<string, unknown>> = [];
for (let index = 1; index <= 2; index += 1) {
  // Re-assert frozen identities immediately before each call. Run 1 is never read here.
  const current = buildPromptFromZod();
  const currentPromptHash = createHash("sha256").update(current.prompt).digest("hex");
  const currentSchemaHash = createHash("sha256").update(`${JSON.stringify(current.jsonSchema, null, 2)}\n`).digest("hex");
  if (currentPromptHash !== APPROVED_PROMPT_HASH || currentSchemaHash !== APPROVED_SCHEMA_HASH) throw new Error(`BLOCKED_AUTHORITY: frozen identity mismatch before run ${index}`);
  const call = await callAnoman(apiKey, current.prompt, userPayload);
  const record: Record<string, unknown> = {
    run: index, configuration: { endpoint: ENDPOINT, model: MODEL, stream: false, temperature: TEMPERATURE, responseFormat: RESPONSE_FORMAT, promptSha256: currentPromptHash, schemaSha256: currentSchemaHash, fixtureSha256, userPayloadSha256: payloadHash },
    httpStatus: call.status, latencyMs: call.latencyMs, telemetry: call.telemetry, rawResponse: call.response,
    rawProviderContent: call.content ?? null, fenceRemoved: false, zodValidation: "not_reached", sourceAccounting: "not_reached", atlasParser: "not_reached", oracle: null,
  };
  if (call.content !== undefined) {
    try {
      const parsedOutput = parseNormalizedProviderOutput(call.content);
      record.fenceRemoved = parsedOutput.removedFence;
      const proposal = SemanticPromptSchema.parse(parsedOutput.value) as Proposal;
      record.zodValidation = "PASS";
      const unmodifiedProposal = snapshotProposal(proposal);
      assertSourceAccounting(proposal);
      record.sourceAccounting = "PASS";
      const finalized = finalizeProposal(proposal, slots, normalizedDocument);
      record.atlasParser = "PASS";
      const oracle = evaluateOracle(proposal);
      record.oracle = oracle;
      record.finalizedResult = finalized;
      record.proposalUnmodified = snapshotProposal(proposal) === unmodifiedProposal;
      if (!oracle.passed) record.validationError = "semantic_oracle_failed";
    } catch (error) {
      record.validationError = error instanceof SyntaxError ? "invalid_json_after_permitted_normalization" : error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 600) : "validation_failed";
    }
  } else {
    record.validationError = call.status === 0 ? "network_failure" : `http_${call.status}_without_provider_content`;
  }
  await writeSafeJson(`live-run-${index}.json`, record);
  runs.push(record);
}

const inferenceReturned = runs.some((run) => run.httpStatus === 200);
const bothCorrect = runs.length === 2 && runs.every((run) => run.httpStatus === 200 && run.zodValidation === "PASS" && run.sourceAccounting === "PASS" && run.atlasParser === "PASS" && (run.oracle as { passed?: boolean } | null)?.passed === true && run.proposalUnmodified === true);
const environmentBlocked = !inferenceReturned || runs.every((run) => typeof run.httpStatus === "number" && ((run.httpStatus as number) === 0 || (run.httpStatus as number) === 401 || (run.httpStatus as number) === 403 || (run.httpStatus as number) === 429 || (run.httpStatus as number) >= 500));
const terminalResult = bothCorrect ? (runs.some((run) => run.fenceRemoved === true) ? "PASS_WITH_LIMITS" : "PASS") : environmentBlocked ? "ENVIRONMENT_BLOCKED" : "FAIL";
const matrix = {
  terminalResult,
  manualBaseline: {
    S1: "successful manual behavior: resolved workflow step; customer submits an order; no incidental clarification",
    S2: "frozen semantic baseline: resolved customer constraint; maximum exactly two products per order",
    S3: "manual/oracle behavior: structural heading produces zero semantic units",
    S4: "successful manual behavior in 3/3 experiments: possible approval before processing; applicability unknown and unresolved with neutral clarification",
  },
  runs: runs.map((run) => ({ run: run.run, status: run.httpStatus, fenceRemoved: run.fenceRemoved, zodValidation: run.zodValidation, sourceAccounting: run.sourceAccounting, atlasParser: run.atlasParser, oracle: run.oracle, telemetry: run.telemetry, validationError: run.validationError ?? null })),
};
await writeSafeJson("semantic-run-matrix.json", matrix);
const summary = { ...matrix, promptSha256: promptHash, providerSchemaSha256: schemaHash, fixtureSha256, payloadSha256: payloadHash, requestCount: runs.length };
await writeSafeJson("summary.json", summary);

// Secret-safety scan without printing or persisting credential material.
for (const file of ["run-config.json", "live-run-1.json", "live-run-2.json", "semantic-run-matrix.json", "summary.json"]) {
  const text = await readFile(`${ARTIFACT_DIR}${file}`, "utf8");
  if (text.includes(apiKey) || /authorization\s*:\s*bearer/i.test(text)) throw new Error("Secret-safety inspection failed");
}
console.log(JSON.stringify({ terminalResult, requestCount: runs.length, promptSha256: promptHash, providerSchemaSha256: schemaHash, fixtureSha256, artifacts: ".atlas-data/sem-anm-spike002/" }));

if (terminalResult === "FAIL" || terminalResult === "ENVIRONMENT_BLOCKED") process.exitCode = terminalResult === "ENVIRONMENT_BLOCKED" ? 2 : 1;
