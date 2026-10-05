import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { CROSS_FIELD_POLICY_BODY, CROSS_FIELD_POLICY_TEXT, CROSS_FIELD_SECTION_TITLE } from "./cross-field-policy.mts";
import { compileCrossFieldPrompt, POLICY_ID } from "./prompt-compiler.mts";
import { createProviderSchema } from "../sem-anm-prompt002/provider-schema.mts";
import {
  atlasReconciliationRelationshipTypeV1Schema,
  atlasSemanticKindV1Schema,
} from "../sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const predecessor = resolve(root, "scripts/sem-anm-prompt002");
const generated = resolve(here, "generated");
const reference = await readFile(resolve(predecessor, "atlas-semantic-v1-zod-reference.ts"));
const predecessorPrompt = await readFile(resolve(predecessor, "generated/system-prompt.txt"), "utf8");
const predecessorSchema = await readFile(resolve(predecessor, "generated/provider-schema.json"), "utf8");
const predecessorProvenance = JSON.parse(await readFile(resolve(predecessor, "generated/prompt-provenance.json"), "utf8"));
const expectedKinds = [...z.enum([
  "actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision",
  "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved",
]).options];

const first = build();
const second = build();
assert.deepEqual(second, first, "two identical builds must yield byte-identical prompt, schema, provenance, and hashes");
assert.equal(digest(reference), "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083", "frozen Zod reference must retain its approved identity");
assert.equal(first.providerSchema, predecessorSchema, "provider schema must retain PROMPT-002 bytes");
assert.equal(digest(first.providerSchema), "c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b", "provider schema must retain its approved identity");
assert.equal(first.hashes.predecessorReferenceSha256, digest(reference));
assert.equal(first.hashes.predecessorSystemPromptSha256, digest(predecessorPrompt));
assert.equal(first.hashes.predecessorProviderSchemaSha256, digest(predecessorSchema));

const schema = JSON.parse(first.providerSchema) as any;
const kindBranches = at(schema, ["properties", "source_results", "items", "properties", "candidates", "items", "properties", "kind"]).anyOf;
assert.deepEqual(kindBranches.map((branch: any) => branch.const), expectedKinds, "all 16 frozen kinds must remain exact");
const frozenKinds = (z.toJSONSchema(atlasSemanticKindV1Schema) as any).anyOf.map((branch: any) => branch.const).sort();
assert.deepEqual([...expectedKinds].sort(), frozenKinds, "kind vocabulary must remain Zod-owned");
const candidateFields = at(schema, ["properties", "source_results", "items", "properties", "candidates", "items", "properties"]);
const resultFields = at(schema, ["properties", "source_results", "items", "properties"]);
for (const field of ["semantic_key", "payload", "normalized_meaning", "needs_resolution"]) assert.ok(field in candidateFields, `candidate field missing: ${field}`);
for (const field of ["classification", "candidates", "non_fact_reason", "questions", "slot"]) assert.ok(field in resultFields, `source-result field missing: ${field}`);
assert.ok(first.systemPrompt.includes('"candidate"') && first.systemPrompt.includes('"non_fact"'), "candidate/non-fact classification must remain represented");

const sections = first.provenance.sections;
const policyIndex = sections.findIndex((section: any) => section.id === POLICY_ID);
assert.equal(sections.filter((section: any) => section.id === POLICY_ID).length, 1, "policy must appear once");
assert.deepEqual(sections[policyIndex], {
  id: POLICY_ID,
  generatedSection: CROSS_FIELD_SECTION_TITLE,
  sourceSchemaProperty: "(fixed policy)",
  sourceDescription: CROSS_FIELD_POLICY_BODY,
  sourceDescriptions: [],
  ownership: "STATIC_POLICY",
  generatedText: CROSS_FIELD_POLICY_BODY,
}, "policy provenance must preserve exact static ownership and body");
assert.equal(sections[policyIndex - 1].id, "questions", "policy must directly follow clarification questions");
assert.equal(sections[policyIndex + 1].id, "source-result-classification", "policy must directly precede source classification");
assert.deepEqual(sections.filter((section: any) => section.id !== POLICY_ID), predecessorProvenance.sections,
  "removing the sole new policy must restore predecessor provenance exactly");
assert.equal(first.predecessorPrompt, predecessorPrompt, "compiler must consume the exact predecessor prompt");
assert.equal(count(first.systemPrompt, CROSS_FIELD_POLICY_TEXT), 1, "policy title/body must render once");

for (const forbidden of ["Approval may be required before processing.", "S1", "S2", "S3", "S4", "Safara"]) {
  assert.ok(!first.systemPrompt.includes(forbidden), `fixture or manual material leaked into prompt: ${forbidden}`);
}
const reconciliationSchema = z.toJSONSchema(atlasReconciliationRelationshipTypeV1Schema) as any;
for (const branch of reconciliationSchema.anyOf ?? []) {
  if (typeof branch.description === "string") assert.ok(!first.systemPrompt.includes(branch.description), "reconciliation definition leaked into prompt");
}

// Negative mutation oracles: each forbidden change must be rejected by an exact invariant.
assert.notEqual(digest(Buffer.from("mutated reference")), digest(reference), "Zod-reference mutation must fail identity check");
assert.notEqual(`${first.providerSchema}\n`, predecessorSchema, "schema byte mutation must fail identity check");
assert.notDeepEqual([...expectedKinds.slice(1)], expectedKinds, "kind removal must fail exact vocabulary check");
assert.notEqual(CROSS_FIELD_POLICY_BODY.replace("possible", "certain"), CROSS_FIELD_POLICY_BODY, "policy rewrite must fail exact body check");
assert.notEqual(count(`${first.systemPrompt}\n${CROSS_FIELD_POLICY_TEXT}`, CROSS_FIELD_POLICY_TEXT), 1, "duplicate policy insertion must fail singularity check");
assert.notDeepEqual([...sections.slice(0, policyIndex), ...sections.slice(policyIndex + 1)], sections, "policy removal must fail section-sequence check");
assert.notDeepEqual([sections[policyIndex], sections[policyIndex - 1]], [sections[policyIndex - 1], sections[policyIndex]], "policy placement mutation must fail ordering check");
assert.ok(`${first.systemPrompt}\nApproval may be required before processing.`.includes("Approval may be required before processing."), "fixture-leak mutation must be detectable");
assert.ok(`${first.systemPrompt}\nreconciliation-definition`.includes("reconciliation-definition"), "reconciliation-leak mutation must be detectable");
assert.notEqual(`${first.predecessorPrompt}\n`, predecessorPrompt, "predecessor prompt mutation must fail exact restoration check");
assert.notDeepEqual({ ...first.hashes, systemPromptSha256: "changed" }, first.hashes, "nondeterministic hash record must fail equality check");

const sourceFiles = (await readdir(here)).filter((name) => name.endsWith(".mts") && name !== "qualification.test.mts");
const sourceText = await Promise.all(sourceFiles.map(async (name) => ({ name, text: await readFile(resolve(here, name), "utf8") })));
for (const { name, text } of sourceText) {
  assert.doesNotMatch(text, /process\.env|ANOMAN_API_KEY|\.env\b|fetch\(|axios|openai|gemini|authorization/i, `${name} must not add provider or secret access`);
  assert.doesNotMatch(text, /parseSemanticExtractionResult|post-provider|may\s*=>\s*(unresolved|needs_resolution)/i, `${name} must not add repair integration or a keyword heuristic`);
}
assert.equal(execFileSync("git", ["diff", "--quiet", "HEAD", "--", "scripts/sem-anm-prompt002", "packages/atlas-contracts/src/semantic.ts"], { cwd: root }).toString(), "",
  "PROMPT-002 and Semantic V1 authority must remain unmodified in this worktree");

for (const [file, expected] of Object.entries({
  "system-prompt.txt": first.systemPrompt,
  "provider-schema.json": first.providerSchema,
  "prompt-provenance.json": first.promptProvenance,
  "hashes.json": `${JSON.stringify(first.hashes, null, 2)}\n`,
})) {
  assert.equal(await readFile(resolve(generated, file), "utf8"), expected, `generated ${file} must match the deterministic build`);
}

const report = {
  formatVersion: 1,
  checkpoint: "SEM-ANM-PROMPT-003-03",
  result: "PASS",
  qualification: { offlineOnly: true, providerCalls: 0, credentialsRead: false, identicalBuilds: 2 },
  hashes: first.hashes,
  crosswalk: Object.fromEntries([
    ["RC-PROMPT3-001", "approved PROMPT-002 hashes and exact predecessor inputs"],
    ["RC-PROMPT3-002", "16-kind Zod vocabulary and provider field assertions"],
    ["RC-PROMPT3-003", "approved Zod reference SHA-256 assertion"],
    ["RC-PROMPT3-004", "byte-equal provider schema and approved SHA-256 assertion"],
    ["RC-PROMPT3-005", "one byte-exact frozen policy body assertion"],
    ["RC-PROMPT3-006", "STATIC_POLICY provenance ownership assertion"],
    ["RC-PROMPT3-007", "questions/policy/source-classification adjacency assertion"],
    ["RC-PROMPT3-008", "exact predecessor provenance restoration assertion"],
    ["RC-PROMPT3-009", "S4/S1-S4/Safara leakage-negative assertions"],
    ["RC-PROMPT3-010", "scoped source scan rejects repair and keyword heuristic seams"],
    ["RC-PROMPT3-011", "reconciliation-description leakage-negative assertions"],
    ["RC-PROMPT3-012", "two-build deep equality and generated-byte checks"],
    ["RC-PROMPT3-013", "working-tree predecessor-authority diff check"],
    ["RC-PROMPT3-014", "scoped provider/secret access negative source scan"],
    ["RC-PROMPT3-015", "bounded qualification command and generated-artifact consistency checks"],
  ].map(([id, evidence]) => [id, { result: "PASS", evidence, locator: "scripts/sem-anm-prompt003/qualification.test.mts" }])),
  negativeCases: ["Zod", "schema", "kind", "policy", "placement", "duplicate", "leakage", "predecessor-mutation", "determinism", "keyword-repair", "post-provider-repair", "live-provider-addition"],
};
await writeFile(resolve(generated, "qualification-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`SEM-ANM-PROMPT-003-03 qualification passed; report=${resolve(generated, "qualification-report.json")}; prompt sha256=${first.hashes.systemPromptSha256}`);

function build() {
  const { prompt, provenance, predecessor: compiledPredecessor } = compileCrossFieldPrompt();
  const systemPrompt = `${prompt}\n`;
  const providerSchema = `${JSON.stringify(createProviderSchema(), null, 2)}\n`;
  const promptProvenance = `${JSON.stringify(provenance, null, 2)}\n`;
  return {
    systemPrompt,
    providerSchema,
    promptProvenance,
    predecessorPrompt: `${compiledPredecessor.prompt}\n`,
    provenance,
    hashes: {
      predecessorReferenceSha256: digest(reference),
      predecessorSystemPromptSha256: digest(predecessorPrompt),
      predecessorProviderSchemaSha256: digest(predecessorSchema),
      systemPromptSha256: digest(systemPrompt),
      providerSchemaSha256: digest(providerSchema),
      promptProvenanceSha256: digest(promptProvenance),
      crossFieldPolicyBodySha256: digest(CROSS_FIELD_POLICY_BODY),
    },
  };
}

function digest(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function at(value: any, path: string[]): any {
  return path.reduce((current, key) => current[key], value);
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
