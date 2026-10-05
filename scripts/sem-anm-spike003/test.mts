import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { atlasProviderExtractionProposalV1Schema } from "../sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts";
import { fixtureSha256, normalizedDocument, userPayload } from "./fixture.mts";
import { normalizeProviderOutput, parseNormalizedProviderOutput } from "./normalize-provider-output.mts";
import { assertSourceAccounting, evaluateOracle, type Proposal } from "./semantic-oracle.mts";
import { parseRootEnvValue, requireRootEnvValue } from "./anoman-client.mts";

const root = new URL("../../", import.meta.url);
const artifact = async (path: string) => readFile(new URL(path, root));
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
assert.equal(hash(await artifact("scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts")), "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083");
assert.equal(hash(await artifact("scripts/sem-anm-prompt002/generated/provider-schema.json")), "c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b");
assert.equal(hash(await artifact("scripts/sem-anm-prompt002/generated/system-prompt.txt")), "80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5");
assert.equal(hash(await artifact("scripts/sem-anm-prompt002/generated/prompt-provenance.json")), "27bb968c000d82897857f8076f7dfab1e04abaffcab2bed798c4fb8dc451f8c4");
execFileSync("git", ["check-ignore", "-q", ".env"], { stdio: "ignore" });
execFileSync("git", ["check-ignore", "-q", ".atlas-data/sem-anm-spike003/summary.json"], { stdio: "ignore" });
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
for (const article of ["customer", "the customer", "an customer"]) {
  const variant = structuredClone(proposal); variant.source_results[0].candidates[0].payload.actor = article;
  assert.equal(evaluateOracle(variant).slots.S1.passed, true);
}
const negatives: Array<[string, Proposal]> = [
  ["missing slot", { ...proposal, source_results: proposal.source_results.slice(1) }],
  ["duplicate slot", { ...proposal, source_results: [...proposal.source_results, structuredClone(proposal.source_results[0])] }],
  ["unknown slot", { ...proposal, source_results: proposal.source_results.map((r) => r.slot === "S3" ? { ...r, slot: "S5" } : r) }],
  ["S2 maximum changes", { ...proposal, source_results: proposal.source_results.map((r) => r.slot === "S2" ? { ...r, candidates: [{ ...r.candidates[0], payload: { ...r.candidates[0].payload, maximum: 3 }, normalized_meaning: "A customer may purchase a maximum of 3 products per one order." }] } : r) }],
  ["S2 loses normative facet", { ...proposal, source_results: proposal.source_results.map((r) => r.slot === "S2" ? { ...r, candidates: [{ ...r.candidates[0], payload: { maximum: 2, object: "product", scope: "per order" }, normalized_meaning: "Maximum 2 products per order." }] } : r) }],
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
console.log(JSON.stringify({ result: "PASS", fixtureSha256, oraclePositiveAndNegativeCases: negatives.length + 3, predecessorHashes: "verified", redaction: "pass" }));
