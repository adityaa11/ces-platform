import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import Ajv from "ajv";

const skillsRoot = path.resolve(import.meta.dirname, "../../../.agents/skills");
const skillDirectories = (await readdir(skillsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("atlas-"))
  .map((entry) => entry.name);
const manifests = await Promise.all(skillDirectories.map(async (directory) => ({
  directory,
  manifest: JSON.parse(await readFile(path.join(skillsRoot, directory, "atlas-skill.json"), "utf8")),
  instructions: await readFile(path.join(skillsRoot, directory, "SKILL.md"), "utf8"),
})));

function validValue(schema) {
  if ("const" in schema) return schema.const;
  if (schema.enum) return schema.enum[0];
  const type = Array.isArray(schema.type) ? schema.type.find((value) => value !== "null") : schema.type;
  if (type === "string") return "value";
  if (type === "integer" || type === "number") return Math.max(schema.minimum ?? 0, 1);
  if (type === "boolean") return true;
  if (type === "array") return Array.from({ length: schema.minItems ?? 0 }, () => validValue(schema.items ?? {}));
  if (type === "object" || schema.properties) {
    return Object.fromEntries((schema.required ?? []).map((key) => [key, validValue(schema.properties?.[key] ?? {})]));
  }
  return {};
}

test("every Atlas skill manifest parses and validates representative valid and invalid data", () => {
  const ajv = new Ajv({ strict: false });
  assert.deepEqual(skillDirectories.sort(), [
    "atlas-fixture-changes",
    "atlas-fixture-projections",
    "atlas-fixture-repository",
    "atlas-fixture-verification",
    "atlas-prd-extraction",
  ]);

  for (const { manifest } of manifests) {
    const validateInput = ajv.compile(manifest.inputSchema);
    const validateOutput = ajv.compile(manifest.outputSchema);
    assert.equal(validateInput(validValue(manifest.inputSchema)), true, `${manifest.id} accepts its valid input`);
    const validOutput = validValue(manifest.outputSchema);
    assert.equal(validateOutput(validOutput), true, `${manifest.id} accepts its valid output`);
    delete validOutput.skillId;
    assert.equal(validateOutput(validOutput), false, `${manifest.id} rejects output without its declared skill identity`);
  }
});

test("every shared skill is candidate or advisory only and carries execution provenance", () => {
  for (const { manifest, instructions } of manifests) {
    assert.match(instructions, /boundary/i);
    assert.equal(manifest.execution.requiresDeterministicValidation, true);
    assert.ok(["candidate-only", "advisory-only"].includes(manifest.execution.resultDisposition));
    assert.ok(manifest.outputSchema.required.includes("executionProvenance"));
    assert.deepEqual(manifest.outputSchema.properties.executionProvenance.required, ["skillId", "skillVersion", "mode"]);
  }
});
