import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createValidatedFixture } from "./fixture.mts";
import { finalize } from "./finalize.mts";
import { EnvironmentBlockedError, invokeGroq } from "./groq-client.mts";
import { assertSemanticOracle, semanticDecisionSignature } from "./semantic-oracle.mts";
import { parseProposal, providerSchema } from "./schema.mts";

const out = resolve(fileURLToPath(new URL("../../.atlas-data/groq-semantic-spike-005/", import.meta.url)));
const write = (name: string, data: unknown) => writeFile(resolve(out, name), `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
const writeRaw = (name: string, data: string) => writeFile(resolve(out, name), data, { mode: 0o600 });
await mkdir(out, { recursive: true }); await write("fixture.normalized.json", createValidatedFixture()); await write("provider-schema.json", providerSchema);
const runs: Record<string, unknown>[] = [];
for (const run of [1, 2]) {
  try {
    const live = await invokeGroq(); await writeRaw(`run-${run}.raw.txt`, live.rawResponse);
    try {
      const proposal = parseProposal(live.proposal);
      let finalResult: unknown, finalParser = "PASS", finalError: string | undefined;
      try { finalResult = finalize(proposal); } catch (error) { finalParser = "FAIL"; finalError = error instanceof Error ? error.message : "Unknown finalizer failure"; }
      let oracle = "PASS", oracleError: string | undefined;
      try { assertSemanticOracle(proposal); } catch (error) { oracle = "FAIL"; oracleError = error instanceof Error ? error.message : "Unknown oracle failure"; }
      const record = { run, ...live.metrics, zod_parse: "PASS", source_accounting: "PASS", semantic_oracle: oracle, final_parser: finalParser, ...(finalError || oracleError ? { error: [finalError, oracleError].filter(Boolean).join("; ") } : {}), proposal, ...(finalResult ? { final_result: finalResult } : {}) };
      runs.push(record); await write(`run-${run}.json`, record);
    } catch (error) { const record = { run, ...live.metrics, zod_parse: "FAIL", source_accounting: "NOT_RUN", semantic_oracle: "NOT_RUN", final_parser: "NOT_RUN", error: error instanceof Error ? error.message : "Unknown Zod validation failure" }; runs.push(record); await write(`run-${run}.json`, record); }
  } catch (error) { const blocked = error instanceof EnvironmentBlockedError; const record = { run, transport: blocked ? "ENVIRONMENT_BLOCKED" : "MODEL_RESPONSE", zod_parse: "NOT_RUN", source_accounting: "NOT_RUN", semantic_oracle: "NOT_RUN", final_parser: "NOT_RUN", error: error instanceof Error ? error.message : "Unknown provider failure", http_status: blocked ? error.httpStatus : null }; runs.push(record); await write(`run-${run}.json`, record); }
}
const passing = runs.filter((run) => run.semantic_oracle === "PASS");
const consistent = passing.length === 2 && JSON.stringify(semanticDecisionSignature((passing[0] as { proposal: never }).proposal)) === JSON.stringify(semanticDecisionSignature((passing[1] as { proposal: never }).proposal));
const anyModelResponse = runs.some((run) => run.transport !== "ENVIRONMENT_BLOCKED");
const summary = { classification: consistent ? "PASS" : anyModelResponse ? "FAIL" : "ENVIRONMENT_BLOCKED", authorized_live_calls: 2, calls_attempted: process.env.GROQ_API_KEY ? 2 : 0, repeatability: consistent ? "materially consistent" : "not qualified", runs: runs.map(({ proposal, final_result, ...record }) => record) };
await write("summary.json", summary); console.log(JSON.stringify(summary)); if (summary.classification !== "PASS") process.exitCode = summary.classification === "ENVIRONMENT_BLOCKED" ? 4 : 2;
