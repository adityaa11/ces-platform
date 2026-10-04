import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createValidatedFixture } from "./fixture.mts";
import { instructionHash, invokeGroq } from "./groq-client.mts";
import { validateSemanticTrace } from "./schema.mts";

const outputDirectory = resolve(".atlas-data/groq-semantic-trace-001");
const write = async (name: string, value: unknown) => writeFile(resolve(outputDirectory, name), `${JSON.stringify(value, null, 2)}\n`);

if (instructionHash !== "9d00f115bfe5d6c3e08edfb6aa577917386fe6ffb0b9210ad9d53fccc326550c") {
  throw new Error("Frozen system-instruction hash mismatch; SEMTRACE-001 is invalid and no provider call was made.");
}

await mkdir(outputDirectory, { recursive: true });
await write("fixture.normalized.json", createValidatedFixture());
const runs: Array<Record<string, unknown>> = [];
for (const run of [1, 2]) {
  try {
    const live = await invokeGroq();
    const proposal = validateSemanticTrace(live.proposal);
    runs.push({ run, transport: "VALID", source_accounting: "PASS", ...live.metrics, proposal });
  } catch (error) {
    // Deliberately no retry or adaptive change: the second scheduled call remains equivalent.
    runs.push({ run, transport: "INVALID", source_accounting: "NOT_AVAILABLE", instruction_hash: instructionHash, error: error instanceof Error ? error.message : "Unknown provider response failure" });
  }
  await write(`run-${run}.json`, runs.at(-1));
}
const validRuns = runs.filter((run) => run.transport === "VALID").length;
const summary = { classification: validRuns === 2 ? "STRUCTURALLY_VALID_PENDING_SEMANTIC_REVIEW" : "ENVIRONMENT_BLOCKED", authenticated_valid_runs: validRuns, instruction_hash: instructionHash, runs: runs.map(({ proposal, ...run }) => run) };
await write("summary.json", summary);
console.log(JSON.stringify(summary));
if (validRuns !== 2) process.exitCode = 2;
