import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createValidatedFixture } from "./fixture.mts";
import { instructionHash, invokeGroq } from "./groq-client.mts";

const outputDirectory = resolve(".atlas-data/groq-semantic-trace-001-freeform");
const write = async (name: string, value: unknown) => writeFile(resolve(outputDirectory, name), `${JSON.stringify(value, null, 2)}\n`);
await mkdir(outputDirectory, { recursive: true });
await write("fixture.normalized.json", createValidatedFixture());
const runs: Array<Record<string, unknown>> = [];
for (const run of [1, 2]) {
  try {
    const live = await invokeGroq();
    runs.push({ run, transport: "VALID", ...live.metrics, response: live.response });
  } catch (error) {
    // A scheduled second equivalent call is still attempted; no corrective retry is made.
    runs.push({ run, transport: "INVALID", instruction_hash: instructionHash, error: error instanceof Error ? error.message : "Unknown provider response failure" });
  }
  await write(`run-${run}.json`, runs.at(-1));
}
const validRuns = runs.filter((run) => run.transport === "VALID").length;
const summary = { classification: validRuns === 2 ? "VALID_RESPONSES_PENDING_SEMANTIC_REVIEW" : "ENVIRONMENT_BLOCKED", authenticated_valid_runs: validRuns, instruction_hash: instructionHash, runs: runs.map(({ response, ...run }) => run) };
await write("summary.json", summary);
console.log(JSON.stringify(summary));
if (validRuns !== 2) process.exitCode = 2;
