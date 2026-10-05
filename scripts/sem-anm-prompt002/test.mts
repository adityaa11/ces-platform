import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createProviderSchema, FROZEN_REFERENCE_SHA256 } from "./provider-schema.mts";

const here = dirname(fileURLToPath(import.meta.url));
const referenceBytes = await readFile(resolve(here, "atlas-semantic-v1-zod-reference.ts"));
const referenceSha256 = createHash("sha256").update(referenceBytes).digest("hex");
assert.equal(referenceSha256, FROZEN_REFERENCE_SHA256, "the consumed reference must match its frozen identity");

const schema = createProviderSchema();
const repeatSchema = createProviderSchema();
assert.deepEqual(schema, repeatSchema, "public Zod conversion must be deterministic");
assert.equal(schema.type, "object");
assert.ok(typeof schema.description === "string" && schema.description.length > 0, "root description must survive conversion");

const rootProperties = object(schema.properties, "provider root properties");
const sourceResults = object(rootProperties.source_results, "source_results");
assert.equal(sourceResults.type, "array");
assert.ok(typeof sourceResults.description === "string" && sourceResults.description.length > 0);
const sourceResult = object(sourceResults.items, "source_results item");
const sourceProperties = object(sourceResult.properties, "source result properties");
for (const key of ["slot", "classification", "candidates", "non_fact_reason", "questions"]) {
  assert.ok(key in sourceProperties, `missing source result field ${key}`);
}
assert.deepEqual(sourceResult.required, ["slot", "classification", "candidates", "non_fact_reason", "questions"]);

const classification = object(sourceProperties.classification, "classification");
const sourceKinds = enumValues(classification);
assert.deepEqual(sourceKinds.sort(), ["candidate", "non_fact"]);
assert.ok(typeof classification.description === "string" && classification.description.length > 0);

const candidates = object(sourceProperties.candidates, "candidates");
assert.equal(candidates.type, "array");
const candidate = object(candidates.items, "candidate item");
const candidateProperties = object(candidate.properties, "candidate properties");
for (const key of ["semantic_key", "kind", "payload", "normalized_meaning", "needs_resolution"]) {
  assert.ok(key in candidateProperties, `missing candidate field ${key}`);
  assert.ok(typeof candidateProperties[key].description === "string" && candidateProperties[key].description.length > 0, `${key} description must survive conversion`);
}
assert.deepEqual(candidate.required, ["semantic_key", "kind", "payload", "normalized_meaning", "needs_resolution"]);
assert.ok("type" in candidateProperties.payload || "$ref" in candidateProperties.payload, "payload schema must be projected");
const nonFactReason = object(sourceProperties.non_fact_reason, "non_fact_reason");
assert.deepEqual(nonFactReason.anyOf?.map((option: Record<string, unknown>) => option.type), ["string", "null"], "non_fact_reason must remain nullable text");
const questions = object(sourceProperties.questions, "questions");
assert.equal(questions.type, "array");
const question = object(questions.items, "question item");
assert.deepEqual(Object.keys(object(question.properties, "question properties")).sort(), ["question", "reason"]);
assert.deepEqual(question.required, ["question", "reason"]);

const expectedKinds = [
  "actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision",
  "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved",
];
const projectedKinds = enumValues(object(candidateProperties.kind, "candidate kind"));
assert.deepEqual(projectedKinds.sort(), [...expectedKinds].sort(), "extraction kinds exactly match the frozen vocabulary");
const kindBranches = object(candidateProperties.kind, "candidate kind").anyOf as Record<string, unknown>[];
assert.ok(kindBranches.every((branch) => typeof branch.description === "string" && branch.description.length > 0), "every kind description must survive conversion");

const reconciliationKinds = ["new", "supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution"];
for (const value of reconciliationKinds) {
  assert.ok(!projectedKinds.includes(value), `reconciliation relationship ${value} must not be an extraction kind`);
}
assert.ok(!("relationships" in rootProperties), "reconciliation relationships are not part of the extraction result");
assert.ok(!JSON.stringify(schema).includes('"relationship_type"'), "reconciliation relationship definitions are not projected");

const schemaText = `${JSON.stringify(schema, null, 2)}\n`;
const schemaSha256 = createHash("sha256").update(schemaText).digest("hex");
const generatedSchema = await readFile(resolve(here, "generated/provider-schema.json"), "utf8");
assert.equal(generatedSchema, schemaText, "checked-in provider schema must match the public conversion output");
const hashes = JSON.parse(await readFile(resolve(here, "generated/hashes.json"), "utf8")) as Record<string, unknown>;
assert.equal(hashes.referenceSha256, referenceSha256);
assert.equal(hashes.providerSchemaSha256, schemaSha256);

const implementation = await readFile(resolve(here, "provider-schema.mts"), "utf8");
assert.match(implementation, /z\.toJSONSchema\s*\(/, "schema must cross the public Zod JSON-Schema boundary");
assert.doesNotMatch(implementation, /\._def\b|\b_def\b|Zod[A-Z][A-Za-z]+(?:Def|Internals)/, "private Zod internals are forbidden");
console.log(`SEM-ANM-PROMPT-002-01 checks passed; reference sha256=${referenceSha256}; provider schema sha256=${schemaSha256}`);

function object(value: unknown, label: string): Record<string, any> {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value as Record<string, any>;
}

function enumValues(schemaNode: Record<string, any>): string[] {
  if (Array.isArray(schemaNode.enum)) return schemaNode.enum.map(String);
  if (typeof schemaNode.const === "string") return [schemaNode.const];
  const alternatives = schemaNode.anyOf ?? schemaNode.oneOf ?? [];
  return alternatives.flatMap((item: unknown) => enumValues(object(item, "enum alternative")));
}
