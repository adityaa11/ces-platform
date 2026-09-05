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
    const validInput = validValue(manifest.inputSchema);
    assert.equal(validateInput(validInput), true, `${manifest.id} accepts its valid input`);
    delete validInput[manifest.inputSchema.required[0]];
    assert.equal(validateInput(validInput), false, `${manifest.id} rejects input without a required field`);
    const validOutput = validValue(manifest.outputSchema);
    assert.equal(validateOutput(validOutput), true, `${manifest.id} accepts its valid output`);
    delete validOutput.skillId;
    assert.equal(validateOutput(validOutput), false, `${manifest.id} rejects output without its declared skill identity`);
    const missingProvenance = validValue(manifest.outputSchema);
    delete missingProvenance.executionProvenance.mode;
    assert.equal(validateOutput(missingProvenance), false, `${manifest.id} rejects missing execution mode provenance`);
  }
});

test("skill contracts reject malformed evidence, modes, branches, proposals, projections, and checks", () => {
  const ajv = new Ajv({ strict: false });
  const byId = Object.fromEntries(manifests.map(({ manifest }) => [manifest.id, manifest]));
  const validator = (id, kind) => ajv.compile(byId[id][`${kind}Schema`]);
  const sample = (id, kind) => structuredClone(validValue(byId[id][`${kind}Schema`]));

  const extractionInput = sample("atlas.prd-extraction", "input");
  extractionInput.artifact.type = "memo";
  assert.equal(validator("atlas.prd-extraction", "input")(extractionInput), false);
  const extractionOutput = sample("atlas.prd-extraction", "output");
  extractionOutput.candidateAssertions = [validValue(byId["atlas.prd-extraction"].outputSchema.properties.candidateAssertions.items)];
  delete extractionOutput.candidateAssertions[0].evidence;
  assert.equal(validator("atlas.prd-extraction", "output")(extractionOutput), false);

  const changesInput = sample("atlas.fixture-changes", "input");
  changesInput.inputKind = "unknown";
  assert.equal(validator("atlas.fixture-changes", "input")(changesInput), false);
  const changesOutput = sample("atlas.fixture-changes", "output");
  changesOutput.changeProposal = validValue(byId["atlas.fixture-changes"].outputSchema.properties.changeProposal);
  delete changesOutput.changeProposal.baseRevisionId;
  assert.equal(validator("atlas.fixture-changes", "output")(changesOutput), false);

  const projectionsInput = sample("atlas.fixture-projections", "input");
  projectionsInput.branch = { headRevisionId: "rev-1" };
  assert.equal(validator("atlas.fixture-projections", "input")(projectionsInput), false);
  const projectionsOutput = sample("atlas.fixture-projections", "output");
  delete projectionsOutput.projectionCandidate.surfaces[0].records;
  assert.equal(validator("atlas.fixture-projections", "output")(projectionsOutput), false);

  const repositoryInput = sample("atlas.fixture-repository", "input");
  repositoryInput.projectId = 42;
  assert.equal(validator("atlas.fixture-repository", "input")(repositoryInput), false);
  const repositoryOutput = sample("atlas.fixture-repository", "output");
  repositoryOutput.repositoryCandidate.materializedStates = [validValue(byId["atlas.fixture-repository"].outputSchema.properties.repositoryCandidate.properties.materializedStates.items)];
  delete repositoryOutput.repositoryCandidate.materializedStates[0].state.assertionIds;
  assert.equal(validator("atlas.fixture-repository", "output")(repositoryOutput), false);

  const verificationInput = sample("atlas.fixture-verification", "input");
  delete verificationInput.repository.branches;
  assert.equal(validator("atlas.fixture-verification", "input")(verificationInput), false);
  const verificationOutput = sample("atlas.fixture-verification", "output");
  delete verificationOutput.checks[0].status;
  assert.equal(validator("atlas.fixture-verification", "output")(verificationOutput), false);
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
