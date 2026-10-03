import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createValidatedFixture } from "./fixture.mts";
import { finalize } from "./finalize.mts";
import { validateIntermediate } from "./intermediate-schema.mts";
import { assertSemanticOracle, semanticDecisionSignature } from "./semantic-oracle.mts";
import { invokeGroq } from "./groq-client.mts";
const out = resolve(".atlas-data/groq-semantic-spike-002"), write = async (name: string, data: unknown) => writeFile(resolve(out, name), `${JSON.stringify(data, null, 2)}\n`);
await mkdir(out, { recursive: true }); await write("fixture.normalized.json", createValidatedFixture());
const runs: any[] = [];
for (const number of [1, 2]) {
  try { const live = await invokeGroq(); try { const proposal = validateIntermediate(live.proposal), final_result = finalize(proposal); try { assertSemanticOracle(proposal); const record = { run: number, ...live.metrics, parser: "parseSemanticExtractionResult", parser_result: "PASS", source_accounting: "PASS", semantic_oracle: "PASS", proposal, final_result }; await write(`run-${number}.json`, record); runs.push(record); } catch (error) { const record = { run: number, ...live.metrics, parser: "parseSemanticExtractionResult", parser_result: "PASS", source_accounting: "PASS", semantic_oracle: "FAIL", error: error instanceof Error ? error.message : "Unknown failure", proposal, final_result }; await write(`run-${number}.json`, record); runs.push(record); } } catch (error) { const record = { run: number, ...live.metrics, parser_result: "NOT_RUN", source_accounting: "FAIL", semantic_oracle: "NOT_RUN", error: error instanceof Error ? error.message : "Unknown failure", proposal: live.proposal }; await write(`run-${number}.json`, record); runs.push(record); } } catch (error) { const record = { run: number, parser_result: "NOT_RUN", source_accounting: "FAIL", semantic_oracle: "NOT_RUN", error: error instanceof Error ? error.message : "Unknown failure" }; await write(`run-${number}.json`, record); runs.push(record); }
}
const valid = runs.filter((run) => run.proposal && run.semantic_oracle === "PASS"), same = valid.length === 2 && JSON.stringify(semanticDecisionSignature(valid[0].proposal)) === JSON.stringify(semanticDecisionSignature(valid[1].proposal));
const summary = { classification: same ? "PASS" : "FAIL", authenticated_live_inference: runs.some((run) => run.http_status) ? "yes" : "no", repeatability: same ? "materially consistent" : "not qualified because an oracle failed or decisions differed", runs: runs.map(({ run, provider, model, http_status, latency_ms, input_tokens, output_tokens, parser_result, source_accounting, semantic_oracle, error }) => ({ run, provider, model, http_status, latency_ms, input_tokens, output_tokens, parser_result, source_accounting, semantic_oracle, error })) };
await write("summary.json", summary); console.log(JSON.stringify(summary)); if (!same) process.exitCode = 2;
