import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CROSS_FIELD_POLICY_BODY, CROSS_FIELD_POLICY_TEXT, CROSS_FIELD_SECTION_TITLE } from "./cross-field-policy.mts";
import { compileCrossFieldPrompt, POLICY_ID } from "./prompt-compiler.mts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const predecessor = resolve(root, "scripts/sem-anm-prompt002");
const reference = await readFile(resolve(predecessor, "atlas-semantic-v1-zod-reference.ts"));
const providerSchema = await readFile(resolve(predecessor, "generated/provider-schema.json"));
const predecessorPrompt = await readFile(resolve(predecessor, "generated/system-prompt.txt"), "utf8");
const predecessorProvenance = JSON.parse(await readFile(resolve(predecessor, "generated/prompt-provenance.json"), "utf8"));

assert.equal(sha(reference), "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083");
assert.equal(sha(providerSchema), "c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b");
assert.equal(sha(CROSS_FIELD_POLICY_BODY), "2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10", "policy body must remain the §8 frozen bytes");

const first = compileCrossFieldPrompt();
const second = compileCrossFieldPrompt();
assert.equal(first.prompt, second.prompt, "identical immutable predecessor input must render identical prompt bytes");
assert.deepEqual(first.provenance, second.provenance, "identical immutable predecessor input must render identical provenance");

const section = first.provenance.sections.find((item: any) => item.id === POLICY_ID);
assert.ok(section, "the cross-field policy section must be inserted");
assert.equal(first.provenance.sections.filter((item: any) => item.id === POLICY_ID).length, 1, "the cross-field policy must appear exactly once");
assert.equal(section.generatedSection, CROSS_FIELD_SECTION_TITLE);
assert.equal(section.generatedText, CROSS_FIELD_POLICY_BODY, "frozen policy body must be byte-identical");
assert.equal(section.sourceDescription, CROSS_FIELD_POLICY_BODY, "provenance must retain the exact frozen policy body");
assert.equal(section.sourceSchemaProperty, "(fixed policy)");
assert.equal(section.ownership, "STATIC_POLICY");
assert.equal(count(first.prompt, CROSS_FIELD_POLICY_TEXT), 1, "frozen title and body must render once");

const questionIndex = first.provenance.sections.findIndex((item: any) => item.id === "questions");
const policyIndex = first.provenance.sections.findIndex((item: any) => item.id === POLICY_ID);
const classificationIndex = first.provenance.sections.findIndex((item: any) => item.id === "source-result-classification");
assert.equal(policyIndex, questionIndex + 1, "policy must immediately follow clarification questions");
assert.equal(classificationIndex, policyIndex + 1, "policy must immediately precede source classification");

const withoutPolicy = first.provenance.sections.filter((item: any) => item.id !== POLICY_ID);
assert.deepEqual(withoutPolicy, predecessorProvenance.sections, "removing the sole new section must restore predecessor provenance exactly");
assert.equal(first.predecessor.prompt, predecessorPrompt.trimEnd(), "compiler input must be the exact predecessor prompt");

for (const forbidden of ["Approval may be required before processing.", "S1", "S2", "S3", "S4", "Safara"]) {
  assert.ok(!first.prompt.includes(forbidden), `fixture material must not leak into the generated prompt: ${forbidden}`);
}
assert.ok(!/may\s*=>\s*unresolved/i.test(await readFile(resolve(here, "prompt-compiler.mts"), "utf8")), "no deterministic keyword heuristic may be added");

console.log(`SEM-ANM-PROMPT-003-01 checks passed; policy sha256=${sha(CROSS_FIELD_POLICY_BODY)}; prompt sha256=${sha(`${first.prompt}\n`)}`);

function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
