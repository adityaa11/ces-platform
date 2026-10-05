import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { atlasProviderExtractionProposalV1Schema } from "../sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts";
import { CROSS_FIELD_POLICY_BODY } from "../sem-anm-prompt003/cross-field-policy.mts";
import { fixtureSha256, normalizedDocument, userPayload } from "./fixture.mts";
import { normalizeProviderOutput, parseNormalizedProviderOutput } from "./normalize-provider-output.mts";
import { assertSourceAccounting, evaluateOracle, type Proposal } from "./semantic-oracle.mts";
import { parseRootEnvValue, requireRootEnvValue } from "./anoman-client.mts";

const root = new URL("../../", import.meta.url);
const artifact = async (path: string) => readFile(new URL(path, root));
const hash = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const expected = {
  reference: "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083",
  predecessorPrompt: "80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5",
  schema: "c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b",
  prompt: "da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1",
  provenance: "90e9e3b6a6607dedd4c135c485dbfc9223741a6200be6bd28519d4bb7f4b5200",
  policy: "2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10",
  payload: "e0e674749c0917f1e9e5bb8ffbc1d0059d8f9421d7b7f830a1c7994b303a8f65",
};
assert.equal(hash(await artifact("scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts")), expected.reference);
assert.equal(hash(await artifact("scripts/sem-anm-prompt002/generated/system-prompt.txt")), expected.predecessorPrompt);
assert.equal(hash(await artifact("scripts/sem-anm-prompt003/generated/provider-schema.json")), expected.schema);
assert.equal(hash(await artifact("scripts/sem-anm-prompt003/generated/system-prompt.txt")), expected.prompt);
assert.equal(hash(await artifact("scripts/sem-anm-prompt003/generated/prompt-provenance.json")), expected.provenance);
assert.equal(hash(CROSS_FIELD_POLICY_BODY), expected.policy);
assert.equal(hash(userPayload), expected.payload);
execFileSync("git", ["merge-base", "--is-ancestor", "8b098ad", "HEAD"], { stdio: "ignore" });
execFileSync("git", ["check-ignore", "-q", ".env"], { stdio: "ignore" });
execFileSync("git", ["check-ignore", "-q", ".atlas-data/sem-anm-spike004/summary.json"], { stdio: "ignore" });
assert.equal(normalizedDocument.pages[0].textBlocks.length, 4);
assert.equal(fixtureSha256.length, 64);
assert.equal(userPayload.includes("workflow_step"), false);

const proposal: Proposal = {
  version: "v1", source_results: [
    { slot: "S1", classification: "candidate", candidates: [{ semantic_key: "customer order submission", kind: "workflow_step", payload: { actor: "customer", action: "submits", object: "order" }, normalized_meaning: "The customer submits an order.", needs_resolution: false }], non_fact_reason: null, questions: [] },
    { slot: "S2", classification: "candidate", candidates: [{ semantic_key: "customer order product limit", kind: "rule", payload: { actor: "pelanggan", action: "membeli", modality: "hanya boleh", maximum: 2, object: "produk", scope: "dalam satu pesanan" }, normalized_meaning: "A customer may purchase a maximum of 2 products per one order.", needs_resolution: false }], non_fact_reason: null, questions: [] },
    { slot: "S3", classification: "non_fact", candidates: [], non_fact_reason: "Structural section heading.", questions: [] },
    { slot: "S4", classification: "candidate", candidates: [{ semantic_key: "conditional approval before processing", kind: "rule", payload: { subject: "approval", modality: "may be required", timing: "before processing" }, normalized_meaning: "Approval may be required before processing.", needs_resolution: true }], non_fact_reason: null, questions: [{ question: "Under what condition is approval required?", reason: "The applicability condition is not stated." }] },
  ],
};
assert.deepEqual(atlasProviderExtractionProposalV1Schema.parse(proposal), proposal);
assertSourceAccounting(proposal);
assert.equal(evaluateOracle(proposal).passed, true);
const negatives: Array<[string, Proposal]> = [
  ["missing slot", { ...proposal, source_results: proposal.source_results.slice(1) }],
  ["duplicate slot", { ...proposal, source_results: [...proposal.source_results, structuredClone(proposal.source_results[0])] }],
  ["unknown slot", { ...proposal, source_results: proposal.source_results.map((r) => r.slot === "S3" ? { ...r, slot: "S5" } : r) }],
  ["S2 maximum changes", { ...proposal, source_results: proposal.source_results.map((r) => r.slot === "S2" ? { ...r, candidates: [{ ...r.candidates[0], payload: { ...r.candidates[0].payload, maximum: 3 }, normalized_meaning: "A customer may purchase a maximum of 3 products per one order." }] } : r) }],
  ["S4 certainty", { ...proposal, source_results: proposal.source_results.map((r) => r.slot === "S4" ? { ...r, candidates: [{ ...r.candidates[0], payload: { subject: "approval", modality: "required", timing: "before processing" }, normalized_meaning: "Approval is required before processing." }] } : r) }],
];
for (const [name, invalid] of negatives) {
  if (["missing slot", "duplicate slot", "unknown slot"].includes(name)) assert.throws(() => evaluateOracle(invalid), undefined, name);
  else assert.equal(evaluateOracle(invalid).passed, false, name);
}
assert.throws(() => atlasProviderExtractionProposalV1Schema.parse({ version: "v1", source_results: [{ slot: "S1", classification: "candidate", candidates: [], non_fact_reason: null, questions: [] }] }));
assert.throws(() => parseNormalizedProviderOutput("Here is JSON: {}"));
assert.deepEqual(normalizeProviderOutput("```json\n{\"ok\":true}\n```"), { text: "{\"ok\":true}", removedFence: true });
assert.throws(() => normalizeProviderOutput("```json\n{}"));
assert.equal(parseRootEnvValue("OTHER_SECRET=x", "ANOMAN_API_KEY"), undefined);
assert.throws(() => requireRootEnvValue("OTHER_SECRET=x", "ANOMAN_API_KEY"));
console.log(JSON.stringify({ result: "PASS", fixtureSha256, payloadSha256: expected.payload, oraclePositiveAndNegativeCases: negatives.length + 3, frozenArtifactHashes: "verified", redaction: "pass" }));
