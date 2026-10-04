import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { finalize } from "./finalize.mts";
import { assertSemanticOracle, semanticDecisionSignature } from "./semantic-oracle.mts";
import { parseProposal } from "./schema.mts";

const out = resolve(fileURLToPath(new URL("../../.atlas-data/groq-semantic-spike-005/", import.meta.url)));
const readJson = async (name: string) => JSON.parse(await readFile(resolve(out, name), "utf8")) as Record<string, unknown>;
const writeJson = async (name: string, value: unknown) => writeFile(resolve(out, name), `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
const records: Record<string, unknown>[] = [];
for (const run of [1, 2]) {
  const prior = await readJson(`run-${run}.json`), raw = await readFile(resolve(out, `run-${run}.raw.txt`), "utf8");
  try {
    const proposal = parseProposal(JSON.parse(raw));
    let finalResult: unknown, finalParser = "PASS", finalError: string | undefined;
    try { finalResult = finalize(proposal); } catch (error) { finalParser = "FAIL"; finalError = error instanceof Error ? error.message : "Unknown finalizer failure"; }
    let oracle = "PASS", oracleError: string | undefined;
    try { assertSemanticOracle(proposal); } catch (error) { oracle = "FAIL"; oracleError = error instanceof Error ? error.message : "Unknown oracle failure"; }
    const record = { ...prior, zod_parse: "PASS", source_accounting: "PASS", semantic_oracle: oracle, final_parser: finalParser, ...(finalError || oracleError ? { error: [finalError, oracleError].filter(Boolean).join("; ") } : {}), proposal, ...(finalResult ? { final_result: finalResult } : {}) };
    records.push(record); await writeJson(`run-${run}.json`, record);
  } catch (error) { const record = { ...prior, zod_parse: "FAIL", source_accounting: "NOT_RUN", semantic_oracle: "NOT_RUN", final_parser: "NOT_RUN", error: error instanceof Error ? error.message : "Unknown Zod validation failure" }; records.push(record); await writeJson(`run-${run}.json`, record); }
}
const passing = records.filter((record) => record.semantic_oracle === "PASS");
const consistent = passing.length === 2 && JSON.stringify(semanticDecisionSignature((passing[0] as { proposal: never }).proposal)) === JSON.stringify(semanticDecisionSignature((passing[1] as { proposal: never }).proposal));
const summary = { classification: consistent ? "PASS" : "FAIL", authorized_live_calls: 2, calls_attempted: 2, repeatability: consistent ? "materially consistent" : "not qualified", runs: records.map(({ proposal, final_result, ...record }) => record) };
await writeJson("summary.json", summary); console.log(JSON.stringify(summary));
