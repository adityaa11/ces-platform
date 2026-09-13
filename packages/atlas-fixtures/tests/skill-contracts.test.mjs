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
    "atlas-workspace-review-projections",
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
  delete changesOutput.changeProposal.provenance;
  assert.equal(validator("atlas.fixture-changes", "output")(changesOutput), false);

  const projectionsInput = sample("atlas.fixture-projections", "input");
  projectionsInput.branch = { headRevisionId: "rev-1" };
  assert.equal(validator("atlas.fixture-projections", "input")(projectionsInput), false);
  const projectionsOutput = sample("atlas.fixture-projections", "output");
  projectionsOutput.projectionCandidate.surfaces[0].records = [validValue(byId["atlas.fixture-projections"].outputSchema.properties.projectionCandidate.properties.surfaces.items.properties.records.items)];
  delete projectionsOutput.projectionCandidate.surfaces[0].records[0].assertionIds;
  assert.equal(validator("atlas.fixture-projections", "output")(projectionsOutput), false);

  const repositoryInput = sample("atlas.fixture-repository", "input");
  repositoryInput.projectId = 42;
  assert.equal(validator("atlas.fixture-repository", "input")(repositoryInput), false);
  const extractionBackedRepositoryInput = sample("atlas.fixture-repository", "input");
  extractionBackedRepositoryInput.scenarioKind = "extraction_backed";
  assert.equal(validator("atlas.fixture-repository", "input")(extractionBackedRepositoryInput), false, "extraction-backed assembly rejects source metadata without extraction results");
  const repositoryOutput = sample("atlas.fixture-repository", "output");
  repositoryOutput.repositoryCandidate.materializedStates = [validValue(byId["atlas.fixture-repository"].outputSchema.properties.repositoryCandidate.properties.materializedStates.items)];
  delete repositoryOutput.repositoryCandidate.materializedStates[0].state.assertionIds;
  assert.equal(validator("atlas.fixture-repository", "output")(repositoryOutput), false);

  const verificationInput = sample("atlas.fixture-verification", "input");
  delete verificationInput.repository.branches;
  assert.equal(validator("atlas.fixture-verification", "input")(verificationInput), false);
  const verificationOutput = sample("atlas.fixture-verification", "output");
  delete verificationOutput.checks[0].evidence;
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

test("SFE-002 extraction stays candidate-only and supplies a validated repository handoff", async () => {
  const ajv = new Ajv({ strict: false });
  const byId = Object.fromEntries(manifests.map(({ manifest }) => [manifest.id, manifest]));
  const extraction = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../generated/sfe-002-saf-24aysgyw4su6.json"), "utf8"));
  assert.equal(ajv.compile(byId["atlas.prd-extraction"].outputSchema)(extraction), true, "persisted extraction obeys the declared PRD contract");
  const candidates = new Map(extraction.candidateAssertions.map((candidate) => [candidate.candidateId, candidate]));
  for (const entry of extraction.sourceStatementInventory) {
    if (entry.destination.type !== "candidate_assertion") continue;
    const candidate = candidates.get(entry.destination.candidateId);
    assert.ok(candidate, `${entry.inventoryId} resolves to a candidate assertion`);
    assert.equal(candidate.evidence.artifactId, extraction.artifact.artifactId, `${entry.inventoryId} preserves artifact provenance`);
  }
  const repositoryInput = { projectId: "safara-project-01", sourceArtifacts: [extraction.artifact], requestedScenario: "initial-draft-extraction", scenarioKind: "extraction_backed", extractionResults: [{ workspaceId: extraction.artifact.workspaceId, artifact: extraction.artifact, candidateAssertions: extraction.candidateAssertions, sourceStatementInventory: extraction.sourceStatementInventory }] };
  assert.equal(ajv.compile(byId["atlas.fixture-repository"].inputSchema)(repositoryInput), true, "repository assembly accepts the validated extraction handoff");
  const workflowSteps = extraction.candidateAssertions.filter((candidate) => candidate.kind === "workflow_step");
  assert.equal(workflowSteps.length, 6, "the complete six-step main workflow is retained");
  const orderedIds = workflowSteps.map((candidate) => candidate.candidateId);
  for (const step of workflowSteps) {
    assert.deepEqual(step.payload.orderedSteps, orderedIds, `${step.candidateId} retains the complete ordered flow`);
    for (const field of ["actors", "triggers", "conditions", "branches", "inputs", "outputs", "dependencies", "stateTransitions", "exceptions"]) assert.ok(Array.isArray(step.payload[field]), `${step.candidateId} declares ${field}`);
    assert.ok(Array.isArray(step.payload.unresolved), `${step.candidateId} retains unsupported workflow details as unresolved`);
  }
  const footerEntries = extraction.sourceStatementInventory.filter((entry) => entry.quote.includes("Sistem Administrasi Travel Umrah Dokumen Bisnis"));
  assert.equal(footerEntries.length, 3, "each page footer is accounted for once");
  assert.ok(footerEntries.every((entry) => entry.classification === "non_fact" && entry.destination.type === "non_fact"), "footers are never candidate assertions");
});

test("workspace review contract accepts the persisted complete extraction", async () => {
  const ajv = new Ajv({ strict: false });
  const byId = Object.fromEntries(manifests.map(({ manifest }) => [manifest.id, manifest]));
  const extraction = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../generated/sfe-002-saf-24aysgyw4su6.json"), "utf8"));
  const reviewInput = { workspace: { workspaceId: extraction.artifact.workspaceId, projectId: "safara-project-01", status: "ready-for-review", sourceLanguage: "id" }, extraction, requestedSurfaces: ["workflow", "facts", "ces"] };
  const validate = ajv.compile(byId["atlas.workspace-review-projections"].inputSchema);
  assert.equal(validate(reviewInput), true, "workspace review accepts the complete persisted extraction result");
  const invalidMode = structuredClone(reviewInput);
  invalidMode.extraction.mode = "unconfigured";
  assert.equal(validate(invalidMode), false, "workspace review rejects an unconfigured extraction mode");
  const invalidProvenance = structuredClone(reviewInput);
  invalidProvenance.extraction.executionProvenance = null;
  assert.equal(validate(invalidProvenance), false, "workspace review rejects missing extraction provenance");
  const invalidInventory = structuredClone(reviewInput);
  invalidInventory.extraction.sourceStatementInventory = [null];
  assert.equal(validate(invalidInventory), false, "workspace review rejects malformed source accounting");
});

test("SFE-002 repository candidate and verification preserve an empty Master", async () => {
  const ajv = new Ajv({ strict: false });
  const byId = Object.fromEntries(manifests.map(({ manifest }) => [manifest.id, manifest]));
  const pipeline = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../generated/sfe-002-saf-24aysgyw4su6-pipeline.json"), "utf8"));
  const repositoryResponse = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../generated/sfe-002-saf-24aysgyw4su6-repository-response.json"), "utf8"));
  const verificationResponse = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../generated/sfe-002-saf-24aysgyw4su6-verification-response.json"), "utf8"));
  assert.deepEqual(pipeline.repositoryResponse, repositoryResponse, "pipeline records the supplied repository skill response verbatim");
  assert.deepEqual(pipeline.verification, verificationResponse, "pipeline records the supplied verification skill response verbatim");
  assert.equal(ajv.compile(byId["atlas.fixture-repository"].inputSchema)(pipeline.repositoryInput), true, "pipeline preserves the extraction-backed handoff");
  assert.equal(ajv.compile(byId["atlas.fixture-repository"].outputSchema)(pipeline.repositoryResponse), true, "repository stage returns a declared candidate result");
  assert.equal(ajv.compile(byId["atlas.fixture-verification"].inputSchema)(pipeline.verificationInput), true, "verification receives the repository candidate and selected Master projection");
  assert.equal(ajv.compile(byId["atlas.fixture-verification"].outputSchema)(pipeline.verification), true, "verification stage returns a declared advisory result");
  const repository = pipeline.repositoryResponse.repositoryCandidate;
  assert.equal(repository.candidateWorkspace.status, "awaiting_review");
  assert.equal(repository.revisions.length, 1);
  assert.deepEqual(repository.revisions[0].acceptedAssertionIds, []);
  assert.deepEqual(repository.materializedStates[0].state.assertionIds, []);
  assert.equal(pipeline.verification.status, "pass");
  assert.ok(pipeline.verification.checks.every((check) => check.status === "pass"));
});
