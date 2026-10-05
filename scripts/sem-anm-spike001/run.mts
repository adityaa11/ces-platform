import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANOMAN_ENDPOINT, ANOMAN_MODEL, EnvironmentBlockedError, StrictSchemaRejectedError, buildStrictRequest, invokeSemanticQualification, invokeTransportQualification } from "./anoman-client.mts";
import { createValidatedFixture } from "./fixture.mts";
import { finalize } from "./finalize.mts";
import { assertSemanticOracle, semanticDecisionSignature } from "./semantic-oracle.mts";
import { parseProposal, providerSchema, transportProviderSchema } from "./schema.mts";

const out = resolve(fileURLToPath(new URL("../../.atlas-data/sem-anm-spike001/", import.meta.url)));
const write = (name: string, data: unknown) => writeFile(resolve(out, name), `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const base = { provider: "Anoman", endpoint: ANOMAN_ENDPOINT, model: ANOMAN_MODEL, temperature: 0, stream: false, strict: true, retry: "none", fallback: "none", promptFingerprint: fingerprint(buildStrictRequest("semantic").messages), schemaFingerprint: fingerprint(providerSchema), fixtureFingerprint: fingerprint(createValidatedFixture()) };
await mkdir(out, { recursive: true });
await write("fixture.normalized.json", createValidatedFixture()); await write("provider-schema.json", providerSchema); await write("transport-schema.json", transportProviderSchema);

let gateA: Record<string, unknown>;
try { const live = await invokeTransportQualification(); gateA = { result: "STRICT_SCHEMA_PASS", ...base, ...live.telemetry, transport_zod: "PASS", marker: live.value }; }
catch (error) { const environment = error instanceof EnvironmentBlockedError; gateA = { result: environment ? (error.httpStatus === 401 || error.httpStatus === 403 ? "AUTHENTICATION_BLOCKED" : error.httpStatus === 429 ? "RATE_LIMITED" : "ENVIRONMENT_BLOCKED") : error instanceof StrictSchemaRejectedError ? "STRICT_SCHEMA_REJECTED" : "STRICT_SCHEMA_MALFORMED_RESPONSE", ...base, http_status: error instanceof EnvironmentBlockedError || error instanceof StrictSchemaRejectedError ? error.httpStatus : null, error: error instanceof Error ? error.message : "Unknown Gate A failure" }; }
await write("gate-a-transport.json", gateA);
if (gateA.result !== "STRICT_SCHEMA_PASS") { const classification = gateA.result === "AUTHENTICATION_BLOCKED" || gateA.result === "RATE_LIMITED" || gateA.result === "ENVIRONMENT_BLOCKED" ? "ENVIRONMENT_BLOCKED" : "FAIL"; await write("summary.json", { classification, gateA: gateA.result, authorized_live_calls: 1, calls_attempted: 1, config: base }); console.log(JSON.stringify({ classification, gateA: gateA.result })); process.exitCode = classification === "ENVIRONMENT_BLOCKED" ? 4 : 2; }
else {
  const runs: Record<string, unknown>[] = [];
  for (const run of [1, 2]) {
    try { const live = await invokeSemanticQualification(); const proposal = parseProposal(live.value); const finalResult = finalize(proposal); assertSemanticOracle(proposal); const record = { run, ...base, ...live.telemetry, zod_parse: "PASS", source_accounting: "PASS", semantic_oracle: "PASS", final_parser: "PASS", proposal, final_result: finalResult }; runs.push(record); await write(`semantic-run-${run}.json`, record); }
    catch (error) { const blocked = error instanceof EnvironmentBlockedError; const record = { run, ...base, transport: blocked ? "ENVIRONMENT_BLOCKED" : "MODEL_RESPONSE", http_status: blocked ? error.httpStatus : null, zod_parse: "FAIL", source_accounting: "NOT_RUN", semantic_oracle: "NOT_RUN", final_parser: "NOT_RUN", error: error instanceof Error ? error.message : "Unknown semantic qualification failure" }; runs.push(record); await write(`semantic-run-${run}.json`, record); }
  }
  const passing = runs.filter((run) => run.semantic_oracle === "PASS") as Array<{ proposal: Parameters<typeof semanticDecisionSignature>[0] }>;
  const consistent = passing.length === 2 && JSON.stringify(semanticDecisionSignature(passing[0].proposal)) === JSON.stringify(semanticDecisionSignature(passing[1].proposal));
  const classification = consistent ? "PASS" : runs.some((run) => run.transport !== "ENVIRONMENT_BLOCKED") ? "FAIL" : "ENVIRONMENT_BLOCKED";
  await write("summary.json", { classification, gateA: "STRICT_SCHEMA_PASS", authorized_live_calls: 3, calls_attempted: 3, repeatability: consistent ? "materially consistent" : "not qualified", config: base, runs: runs.map(({ proposal, final_result, ...record }) => record) }); console.log(JSON.stringify({ classification, gateA: "STRICT_SCHEMA_PASS", semanticRuns: runs.length })); if (classification !== "PASS") process.exitCode = classification === "ENVIRONMENT_BLOCKED" ? 4 : 2;
}
