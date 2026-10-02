import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createValidatedFixture } from "./fixture.mts";
import { finalize } from "./finalize.mts";
import { validateIntermediate } from "./intermediate-schema.mts";
import { EnvironmentBlockedError, invokeGroq } from "./groq-client.mts";

const out = resolve(".atlas-data/groq-semantic-spike");
const write = async (name: string, data: unknown) => writeFile(resolve(out, name), `${JSON.stringify(data, null, 2)}\n`);
const decisionSignature = (proposal: { source_results: readonly { slot: number; disposition: string; candidates: readonly { kind: string; needs_resolution: boolean; normalized_meaning: string }[] }[] }) => proposal.source_results.map((result) => ({ slot: result.slot, disposition: result.disposition, kinds: result.candidates.map((candidate) => candidate.kind), needs_resolution: result.candidates.map((candidate) => candidate.needs_resolution), normalized_meaning: result.candidates.map((candidate) => candidate.normalized_meaning) }));

await mkdir(out, { recursive: true });
const fixture = createValidatedFixture();
await write("fixture.normalized.json", fixture);
try {
  const runs: any[] = [];
  for (const number of [1, 2]) {
    let record: any;
    try {
      const live = await invokeGroq();
      try {
        const proposal = validateIntermediate(live.proposal);
        const finalResult = finalize(proposal);
        record = { run: number, ...live.metrics, parser: "parseSemanticExtractionResult", parser_result: "PASS", source_accounting: "PASS", proposal, final_result: finalResult };
      } catch (error) {
        record = { run: number, ...live.metrics, parser_result: "NOT_RUN", source_accounting: "FAIL", error: error instanceof Error ? error.message : "Unknown failure", proposal: live.proposal };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown failure";
      record = { run: number, parser_result: "NOT_RUN", source_accounting: "FAIL", error: message };
    }
    await write(`run-${number}.json`, record);
    runs.push(record);
  }
  const validRuns = runs.filter((run) => run.proposal && !run.error);
  const sameDecisions = validRuns.length === 2 && JSON.stringify(decisionSignature(validRuns[0].proposal)) === JSON.stringify(decisionSignature(validRuns[1].proposal));
  const summary = { classification: sameDecisions ? "PASS" : "FAIL", authenticated_live_inference: runs.some((run) => run.http_status) ? "yes" : "no", repeatability: sameDecisions ? "materially consistent" : "not qualified because one or more runs failed", runs: runs.map(({ run, provider, model, http_status, latency_ms, input_tokens, output_tokens, parser_result, source_accounting, error }) => ({ run, provider, model, http_status, latency_ms, input_tokens, output_tokens, parser_result, source_accounting, error })) };
  await write("summary.json", summary);
  console.log(JSON.stringify(summary));
  if (!sameDecisions) process.exitCode = 2;
} catch (error) {
  const classification = error instanceof EnvironmentBlockedError ? "ENVIRONMENT_BLOCKED" : "FAIL";
  const summary = { classification, authenticated_live_inference: "no", reason: error instanceof Error ? error.message : "Unknown failure" };
  await write("summary.json", summary);
  console.log(JSON.stringify(summary));
  process.exitCode = classification === "ENVIRONMENT_BLOCKED" ? 0 : 1;
}
