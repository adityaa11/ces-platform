import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import Ajv from "ajv";
import { resolveGoldenFixtureBranch } from "../src/index.ts";

const output = path.resolve(import.meta.dirname, "../generated/safara-golden-bundle.json");
const reconciliation = path.resolve(import.meta.dirname, "../generated/safara-reconciliation.md");
const script = path.resolve(import.meta.dirname, "../../../apps/atlas/scripts/generate-golden-fixture.mjs");
const cwd = path.resolve(import.meta.dirname, "../../../apps/atlas");
const bundle = JSON.parse(await readFile(output, "utf8"));
const skillsRoot = path.resolve(import.meta.dirname, "../../../.agents/skills");

async function contract(id) {
  return JSON.parse(await readFile(path.join(skillsRoot, id.replace("atlas.", "atlas-"), "atlas-skill.json"), "utf8"));
}

test("the generated bundle records schema-valid envelopes for every shared skill stage", async () => {
  const stages = [
    ...bundle.skillResponses.extractionResponses,
    bundle.skillResponses.repositoryResponse,
    bundle.skillResponses.changeResponse,
    ...bundle.skillResponses.projectionResponses,
    ...bundle.skillResponses.verificationResponses,
  ];
  assert.equal(stages.length, 9);
  const ajv = new Ajv({ strict: false });
  for (const stage of stages) {
    const definition = await contract(stage.skillId);
    assert.equal(ajv.compile(definition.inputSchema)(stage.input), true, `${stage.skillId} input is contract-valid`);
    assert.equal(ajv.compile(definition.outputSchema)(stage.response), true, `${stage.skillId} output is contract-valid`);
    assert.equal(stage.response.executionProvenance.mode, "codex");
  }
});

test("semantic identity, supersession, dependencies, and staged changes remain explicit", () => {
  const exclusions = bundle.repository.assertions.find((item) => item.semanticKey === "inc01.exclusions");
  const eligibility = bundle.repository.assertions.find((item) => item.semanticKey === "manifest.eligibility");
  assert.ok(exclusions && eligibility);
  assert.notEqual(exclusions.assertionId, eligibility.assertionId);
  assert.equal(eligibility.supersedesAssertionId, undefined);
  assert.ok(bundle.repository.revisions.every((revision) => revision.executionProvenance));
  const proposal = bundle.repository.changeProposals[0];
  for (const key of ["beforeValue", "proposedValue", "provenance", "resolution"]) assert.ok(Object.hasOwn(proposal, key));
  for (const projection of bundle.projections) for (const surface of projection.surfaces) for (const record of surface.records) assert.deepEqual(record.dependencyIds, record.assertionIds);
});

test("verification proves every required architectural invariant before publication", () => {
  const required = ["branch-heads-resolve", "revision-parents-resolve", "proposal-base-resolves", "assertion-source-provenance", "supersession-integrity", "staged-proposal-isolation", "approved-proposal-branch-movement", "projection-heads-match", "projection-provenance", "cross-surface-semantic-consistency", "branch-isolation", "unresolved-conflict-integrity"];
  for (const stage of bundle.skillResponses.verificationResponses) {
    assert.deepEqual(stage.response.checks.map((check) => check.checkId), required);
    assert.ok(stage.response.checks.every((check) => check.status === "pass"));
  }
});

test("GLF-003-02 accounts for exactly the eleven authoritative Safara pages", () => {
  assert.equal(bundle.repository.artifacts.length, 3);
  assert.equal(bundle.sourceCoverage.expectedPageCount, 11);
  assert.equal(bundle.repository.artifacts.reduce((n, item) => n + item.pageCount, 0), 11);
  assert.ok(bundle.repository.artifacts.every((item) => /Incremental_PRD_0[123]/.test(item.name) && !/buyer/i.test(item.name + item.relativePath)));
  assert.equal(bundle.sourceStatementInventory.length, new Set(bundle.sourceStatementInventory.map((item) => item.inventoryId)).size);
  for (const artifact of bundle.repository.artifacts) for (let page = 1; page <= artifact.pageCount; page += 1) assert.ok(bundle.sourceStatementInventory.some((item) => item.artifactName === artifact.name && item.page === page));
});

test("each inventory statement has one destination and every candidate keeps exact provenance", () => {
  const assertions = new Map(bundle.repository.assertions.map((item) => [item.inventoryId, item]));
  assert.equal(assertions.size, bundle.repository.assertions.length);
  assert.equal(new Set(bundle.repository.assertions.map((item) => item.candidateId)).size, bundle.repository.assertions.length);
  for (const entry of bundle.sourceStatementInventory) {
    assert.ok(["candidate_assertion", "non_fact"].includes(entry.destination.type));
    if (entry.destination.type === "candidate_assertion") {
      const assertion = assertions.get(entry.inventoryId);
      assert.ok(assertion);
      assert.equal(assertion.candidateId, entry.destination.candidateId);
      assert.equal(assertion.evidence.page, entry.page);
      assert.equal(assertion.evidence.quote, entry.quote);
    } else assert.ok(entry.destination.reason);
  }
});

test("all branch facts and projections resolve to inventory-backed candidates", () => {
  const assertions = new Set(bundle.repository.assertions.map((item) => item.assertionId));
  for (const state of bundle.repository.materializedStates) {
    assert.equal(resolveGoldenFixtureBranch(bundle, state.branchId).headRevisionId, state.headRevisionId);
    for (const fact of state.state.resolvedFacts) assert.ok(assertions.has(fact.assertionId) && fact.inventoryId && fact.candidateId);
  }
  for (const projection of bundle.projections) for (const surface of projection.surfaces) for (const record of surface.records) {
    assert.equal(record.assertionIds.length, record.inventoryIds.length);
    assert.equal(record.assertionIds.length, record.candidateIds.length);
    for (let index = 0; index < record.assertionIds.length; index += 1) {
      const assertion = bundle.repository.assertions.find((item) => item.assertionId === record.assertionIds[index]);
      assert.ok(assertion);
      assert.equal(record.inventoryIds[index], assertion.inventoryId);
      assert.equal(record.candidateIds[index], assertion.candidateId);
    }
  }
  const stages = resolveGoldenFixtureBranch(bundle, "branch-increment-003").projection.surfaces.find((surface) => surface.surface === "workflow").records.map((record) => record.recordId.replace("workflow-", ""));
  assert.deepEqual(stages, bundle.sourceCoverage.expectedWorkflowStages);
});

test("negative publication cases preserve the last valid bundle", async () => {
  const before = await readFile(output, "utf8");
  for (const mutation of ["remove-fact", "corrupt-page", "buyer-artifact", "duplicate-assertion", "corrupt-fact-provenance", "corrupt-projection-provenance", "material-non-fact", "corrupt-skill-output", "corrupt-verification-checks"]) {
    assert.throws(() => execFileSync(process.execPath, [script], { cwd, env: { ...process.env, GOLDEN_FIXTURE_TEST_MUTATION: mutation }, stdio: "pipe" }));
    assert.equal(await readFile(output, "utf8"), before);
  }
});

test("reconciliation counts are derived from fixture data", async () => {
  const normalReport = await readFile(reconciliation, "utf8");
  const sourcePages = bundle.repository.artifacts.reduce((total, artifact) => total + artifact.pageCount, 0);
  const unresolved = bundle.sourceStatementInventory.filter((entry) => entry.normalizedInterpretation && entry.normalizedInterpretation.kind === "unresolved_question").length;
  const projectedRecords = bundle.projections.reduce((total, projection) => total + projection.surfaces.reduce((sum, surface) => sum + surface.records.length, 0), 0);
  assert.ok(normalReport.includes("- Source pages: " + sourcePages));
  assert.ok(normalReport.includes("- Unresolved questions: " + unresolved));
  assert.ok(normalReport.includes("- Projected records: " + projectedRecords));
  execFileSync(process.execPath, [script], { cwd, env: { ...process.env, GOLDEN_FIXTURE_TEST_MUTATION: "add-unresolved-question" }, stdio: "pipe" });
  const questionReport = await readFile(reconciliation, "utf8");
  assert.ok(questionReport.includes("- Unresolved questions: 1"));
  execFileSync(process.execPath, [script], { cwd, env: process.env, stdio: "pipe" });
});
