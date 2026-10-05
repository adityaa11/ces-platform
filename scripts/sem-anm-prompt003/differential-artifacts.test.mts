import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { CROSS_FIELD_POLICY_BODY, CROSS_FIELD_SECTION_TITLE } from "./cross-field-policy.mts";
import { compileCrossFieldPrompt, POLICY_ID } from "./prompt-compiler.mts";
import { createProviderSchema } from "../sem-anm-prompt002/provider-schema.mts";
import { atlasReconciliationRelationshipTypeV1Schema } from "../sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const predecessor = resolve(root, "scripts/sem-anm-prompt002");
const generated = resolve(here, "generated");
const reference = await readFile(resolve(predecessor, "atlas-semantic-v1-zod-reference.ts"));
const predecessorSchema = await readFile(resolve(predecessor, "generated/provider-schema.json"));
const predecessorProvenance = JSON.parse(await readFile(resolve(predecessor, "generated/prompt-provenance.json"), "utf8"));

const first = build();
const second = build();
assert.deepEqual(second, first, "two identical builds must be byte-identical");
assert.equal(first.providerSchema, predecessorSchema.toString("utf8"), "provider schema must retain PROMPT-002 bytes");
assert.equal(first.hashes.predecessorReferenceSha256, "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083");
assert.equal(first.hashes.providerSchemaSha256, "c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b");
assert.equal(first.hashes.crossFieldPolicyBodySha256, "2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10");

const policy = first.provenance.sections.filter((section: any) => section.id === POLICY_ID);
assert.equal(policy.length, 1, "only the cross-field section may be added");
assert.deepEqual(policy[0], {
  id: POLICY_ID,
  generatedSection: CROSS_FIELD_SECTION_TITLE,
  sourceSchemaProperty: "(fixed policy)",
  sourceDescription: CROSS_FIELD_POLICY_BODY,
  sourceDescriptions: [],
  ownership: "STATIC_POLICY",
  generatedText: CROSS_FIELD_POLICY_BODY,
}, "provenance must provide inspectable fixed-policy attribution");
assert.deepEqual(first.provenance.sections.filter((section: any) => section.id !== POLICY_ID), predecessorProvenance.sections,
  "removing only the cross-field section must restore every predecessor section and order exactly");

for (const forbidden of ["Approval may be required before processing.", "S1", "S2", "S3", "S4", "Safara"]) {
  assert.ok(!first.systemPrompt.includes(forbidden), `excluded material must not leak into the prompt: ${forbidden}`);
}
const reconciliationSchema = z.toJSONSchema(atlasReconciliationRelationshipTypeV1Schema) as any;
for (const branch of reconciliationSchema.anyOf ?? reconciliationSchema.oneOf ?? []) {
  if (typeof branch.description === "string") {
    assert.ok(!first.systemPrompt.includes(branch.description), "reconciliation descriptions must not leak into the extraction prompt");
  }
}

for (const [file, expected] of Object.entries({
  providerSchema: first.providerSchema,
  systemPrompt: first.systemPrompt,
  promptProvenance: first.promptProvenance,
  hashes: first.hashes,
})) {
  const actual = await readFile(resolve(generated, fileName(file)), "utf8");
  assert.equal(actual, typeof expected === "string" ? expected : `${JSON.stringify(expected, null, 2)}\n`, `checked-in ${file} must match deterministic build`);
}
console.log(`SEM-ANM-PROMPT-003-02 differential checks passed; prompt sha256=${first.hashes.systemPromptSha256}`);

function build() {
  const { prompt, provenance, predecessor: compiledPredecessor } = compileCrossFieldPrompt();
  const providerSchema = `${JSON.stringify(createProviderSchema(), null, 2)}\n`;
  const systemPrompt = `${prompt}\n`;
  const promptProvenance = `${JSON.stringify(provenance, null, 2)}\n`;
  const hashes = {
    predecessorReferenceSha256: sha(reference),
    predecessorSystemPromptSha256: sha(compiledPredecessor.prompt + "\n"),
    predecessorProviderSchemaSha256: sha(predecessorSchema),
    systemPromptSha256: sha(systemPrompt),
    providerSchemaSha256: sha(providerSchema),
    promptProvenanceSha256: sha(promptProvenance),
    crossFieldPolicyBodySha256: sha(CROSS_FIELD_POLICY_BODY),
  };
  return { providerSchema, systemPrompt, promptProvenance, hashes, provenance };
}

function fileName(key: string): string {
  return ({ providerSchema: "provider-schema.json", systemPrompt: "system-prompt.txt", promptProvenance: "prompt-provenance.json", hashes: "hashes.json" } as Record<string, string>)[key];
}

function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
