import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createValidatedFixture } from "./fixture.mts";
import { EnvironmentBlockedError, invokeGroq } from "./groq-client.mts";
import { FROZEN_INSTRUCTION_SHA256, instructionSha256 } from "./prompt.mts";
import { parseEnvelope } from "./parser.mts";

const outputDirectory = resolve(".atlas-data/groq-semantic-spike-004");
const write = async (name: string, value: unknown) => writeFile(resolve(outputDirectory, name), `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
const writeRaw = async (name: string, value: string) => writeFile(resolve(outputDirectory, name), value, { mode: 0o600 });
await mkdir(outputDirectory, { recursive: true });

const actualHash = instructionSha256();
if (actualHash !== FROZEN_INSTRUCTION_SHA256) {
  const invalid = { classification: "INVALID_INSTRUCTION_HASH", expected: FROZEN_INSTRUCTION_SHA256, actual: actualHash };
  await write("preflight.json", invalid);
  console.log(JSON.stringify(invalid));
  process.exitCode = 3;
} else {
  await write("fixture.normalized.json", createValidatedFixture());
  const runs: Array<Record<string, unknown>> = [];
  const apiKeyConfigured = Boolean(process.env.GROQ_API_KEY);
  if (!apiKeyConfigured) {
    for (const run of [1, 2]) runs.push({ run, transport: "ENVIRONMENT_BLOCKED", error: "GROQ_API_KEY is not configured." });
  } else {
    for (const run of [1, 2]) {
      try {
        const live = await invokeGroq();
        await writeRaw(`run-${run}.raw.txt`, live.rawResponse);
        if (live.packagingFailure) {
          runs.push({ run, transport: "MODEL_RESPONSE", envelope: "FAIL", error: live.packagingFailure, ...live.metrics });
        } else {
          try {
            const parsed = parseEnvelope(live.rawResponse);
            await write(`run-${run}.parsed.json`, parsed);
            runs.push({ run, transport: "MODEL_RESPONSE", envelope: "PASS", semantic_review: "PENDING_MANUAL_ORACLE", ...live.metrics });
          } catch (error) {
            runs.push({ run, transport: "MODEL_RESPONSE", envelope: "FAIL", error: error instanceof Error ? error.message : "Envelope validation failed.", ...live.metrics });
          }
        }
        await write(`run-${run}.record.json`, runs.at(-1));
      } catch (error) {
        const blocked = error instanceof EnvironmentBlockedError;
        const record = {
          run,
          transport: blocked ? "ENVIRONMENT_BLOCKED" : "MODEL_RESPONSE",
          envelope: blocked ? "NOT_RUN" : "FAIL",
          error: error instanceof Error ? error.message : "Provider execution failed.",
          http_status: blocked ? error.httpStatus : null,
          latency_ms: blocked ? error.latencyMs : null,
          instruction_sha256: actualHash,
          source_count: 4,
          structured_output_mode: "none",
        };
        runs.push(record);
        await write(`run-${run}.record.json`, record);
      }
    }
  }

  const hasModelFailure = runs.some((run) => run.transport === "MODEL_RESPONSE" && run.envelope === "FAIL");
  const blockedRuns = runs.filter((run) => run.transport === "ENVIRONMENT_BLOCKED").length;
  const classification = hasModelFailure ? "FAIL" : blockedRuns > 0 ? "ENVIRONMENT_BLOCKED" : "VALID_RESPONSES_PENDING_SEMANTIC_REVIEW";
  const summary = {
    classification,
    authorized_live_calls_scheduled: 2,
    calls_attempted: apiKeyConfigured ? 2 : 0,
    authenticated_valid_envelopes: runs.filter((run) => run.envelope === "PASS").length,
    instruction_sha256: actualHash,
    structured_output_mode: "none",
    runs,
  };
  await write("summary.json", summary);
  console.log(JSON.stringify(summary));
  if (classification === "FAIL") process.exitCode = 2;
  if (classification === "ENVIRONMENT_BLOCKED") process.exitCode = 4;
}
