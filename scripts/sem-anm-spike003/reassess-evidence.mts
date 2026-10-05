import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { evaluateOracle, type Proposal } from "./semantic-oracle.mts";

const dir = fileURLToPath(new URL("../../.atlas-data/sem-anm-spike003/", import.meta.url));
const runs: Record<string, unknown>[] = [];
for (const index of [1, 2]) {
  const path = `${dir}live-run-${index}.json`;
  const record = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  const proposal = record.parsedProposal as Proposal;
  if (!proposal) throw new Error(`live run ${index} lacks its preserved parsed proposal`);
  record.oracle = evaluateOracle(proposal);
  record.validationError = (record.oracle as { passed: boolean }).passed ? null : "semantic_oracle_failed";
  await writeFile(path, `${JSON.stringify(record, null, 2)}\n`);
  runs.push(record);
}
const matrix = JSON.parse(await readFile(`${dir}semantic-run-matrix.json`, "utf8")) as Record<string, unknown>;
matrix.runs = runs.map((r) => ({ run: r.run, status: r.httpStatus, fenceRemoved: r.fenceRemoved, zodValidation: r.zodValidation, sourceAccounting: r.sourceAccounting, oracle: r.oracle, telemetry: r.telemetry, validationError: r.validationError }));
await writeFile(`${dir}semantic-run-matrix.json`, `${JSON.stringify(matrix, null, 2)}\n`);
const summary = JSON.parse(await readFile(`${dir}summary.json`, "utf8")) as Record<string, unknown>;
summary.runs = matrix.runs; await writeFile(`${dir}summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ reassessedRuns: runs.length, terminalResult: summary.terminalResult, s2: (runs[0].oracle as any).slots.S2.passed, s4: (runs[0].oracle as any).slots.S4.passed }));
