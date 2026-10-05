import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { atlasReconciliationRelationshipTypeV1Schema } from "./atlas-semantic-v1-zod-reference.ts";
import { compileExtractionPrompt, resolveLocalRef } from "./prompt-compiler.mts";
import { createProviderSchema, FROZEN_REFERENCE_SHA256 } from "./provider-schema.mts";

const here = dirname(fileURLToPath(import.meta.url));
const schema = createProviderSchema();
const first = compileExtractionPrompt(schema);
const second = compileExtractionPrompt(createProviderSchema());
assert.equal(first.prompt, second.prompt, "identical frozen schema input must render identical prompt bytes");
assert.deepEqual(first.provenance, second.provenance, "identical schema input must render identical provenance");

const prompt = first.prompt;
const providerSchema = JSON.stringify(schema);
const kindBranches = at(schema, ["properties", "source_results", "items", "properties", "candidates", "items", "properties", "kind", "anyOf"]);
assert.ok(Array.isArray(kindBranches), "provider schema must expose kind alternatives");
const kinds = kindBranches.map((branch: any) => branch.const as string);
assert.deepEqual(kinds, [
  "actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision",
  "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved",
]);
for (const kind of kindBranches) {
  assert.ok(prompt.includes(kind.const), `generated prompt must contain kind ${kind.const}`);
  assert.ok(prompt.includes(kind.description), `generated prompt must carry the exact Zod description for ${kind.const}`);
}
for (const phrase of [
  "candidate", "non_fact", "semantic_key", "payload", "normalized_meaning", "needs_resolution", "questions",
  "Return one source_result for every supplied slot.", "Preserve the supplied slot exactly.",
  "Do not create slots that were not supplied.", "Do not omit a supplied slot.",
  "Do not use non_fact as a fallback for missing or failed extraction.",
  "PRIMARY semantic role",
]) assert.ok(prompt.includes(phrase), `generated prompt is missing required coverage: ${phrase}`);
assert.match(prompt, /Kinds can overlap conceptually/);
assert.match(prompt, /kind may remain primary while needs_resolution is true/);
assert.doesNotMatch(prompt, /semantic_units\[\]|workflow_step \| rule \| constraint/);

const reconciliationSchema = z.toJSONSchema(atlasReconciliationRelationshipTypeV1Schema) as any;
const reconciliationDefinitions = (reconciliationSchema.anyOf ?? reconciliationSchema.oneOf ?? [])
  .map((branch: any) => branch.description)
  .filter((description: unknown) => typeof description === "string");
for (const definition of reconciliationDefinitions) {
  assert.ok(!prompt.includes(definition), "reconciliation relationship definitions must not be rendered into the extraction prompt");
}
assert.ok(!("reconciliation" in (schema as any).properties), "provider output schema remains extraction-only");
assert.ok(!providerSchema.includes('"relationship_type"'));

const fixedChecks = [
  "You are a semantic extraction component.",
  "Extract the project meaning of each supplied source into semantic candidates.",
  "Do not merge independent propositions merely because they appear in the",
  "Do not split one proposition merely because it contains multiple",
  "do not choose one arbitrarily.",
  "Do not silently reconcile, weaken, merge, prioritize, supersede, or",
  "Do not infer which conflicting proposition is accepted or canonical.",
  "Preserve modality and negation.", "Preserve exact numeric values and units.",
  "Preserve conditions and temporal relationships separately.",
  "Preserve material source-supported facets even when they are not the",
  "Return valid JSON only.",
];
for (const phrase of fixedChecks) assert.ok(prompt.includes(phrase), `fixed extraction policy missing: ${phrase}`);

const provenance = first.provenance as any;
assert.ok(provenance.sections.some((section: any) => section.ownership === "STATIC_POLICY"));
assert.ok(provenance.sections.some((section: any) => section.ownership.includes("ZOD_DESCRIPTION")));
for (const section of provenance.sections) {
  assert.ok(section.generatedSection && section.sourceSchemaProperty && section.sourceDescription && section.ownership);
  assert.ok(prompt.includes(section.generatedText), `provenance text is absent from rendered prompt section ${section.id}`);
  for (const source of section.sourceDescriptions) {
    assert.ok(section.generatedText.includes(source.sourceDescription), `provenance source description is not rendered in ${section.id}: ${source.sourceSchemaProperty}`);
  }
}

const generatedPrompt = await readFile(resolve(here, "generated/system-prompt.txt"), "utf8");
const generatedSchema = await readFile(resolve(here, "generated/provider-schema.json"), "utf8");
const generatedProvenance = await readFile(resolve(here, "generated/prompt-provenance.json"), "utf8");
const hashes = JSON.parse(await readFile(resolve(here, "generated/hashes.json"), "utf8")) as Record<string, string>;
const promptBytes = `${prompt}\n`;
assert.equal(generatedPrompt, promptBytes);
assert.equal(generatedSchema, `${JSON.stringify(schema, null, 2)}\n`);
assert.deepEqual(JSON.parse(generatedProvenance), provenance);
assert.equal(hashes.referenceSha256, FROZEN_REFERENCE_SHA256);
assert.equal(hashes.providerSchemaSha256, digest(generatedSchema));
assert.equal(hashes.systemPromptSha256, digest(generatedPrompt));

const changedKindSchema = structuredClone(schema) as any;
at(changedKindSchema, ["properties", "source_results", "items", "properties", "candidates", "items", "properties", "kind", "anyOf"]).push({ type: "string", const: "invented_kind", description: "invented" });
assert.throws(() => compileExtractionPrompt(changedKindSchema), /do not exactly match the frozen Zod extraction vocabulary/);

const missingDescriptionSchema = structuredClone(schema) as any;
delete at(missingDescriptionSchema, ["properties", "source_results", "items", "properties", "slot"]).description;
assert.throws(() => compileExtractionPrompt(missingDescriptionSchema), /Missing JSON Schema description/);
assert.throws(() => resolveLocalRef({ $ref: "#/missing" }, {}), /Broken local JSON Schema reference/);
assert.throws(() => resolveLocalRef({ $ref: "https://example.test/schema" }, {}), /Unsupported JSON Schema reference/);
assert.throws(() => resolveLocalRef({ $ref: "#/$defs/loop" }, { $defs: { loop: { $ref: "#/$defs/loop" } } }), /Cyclic JSON Schema reference/);
assert.throws(() => compileExtractionPrompt({ type: "string", description: "unsupported root" }), /expected object properties/);

console.log(`SEM-ANM-PROMPT-002-02 checks passed; prompt sha256=${digest(generatedPrompt)}; schema sha256=${digest(generatedSchema)}`);

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function at(value: any, path: string[]): any {
  return path.reduce((current, key) => current[key], value);
}
