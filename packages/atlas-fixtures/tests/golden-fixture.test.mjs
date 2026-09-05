import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { resolveGoldenFixtureBranch } from "../src/index.ts";

const bundle = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../generated/safara-golden-bundle.json"), "utf8"));

test("golden bundle keeps branch HEAD, materialized state, and projections together", () => {
  const branches = new Map(bundle.repository.branches.map((branch) => [branch.branchId, branch]));
  for (const state of bundle.repository.materializedStates) assert.equal(resolveGoldenFixtureBranch(bundle, state.branchId).headRevisionId, state.headRevisionId);
  for (const projection of bundle.projections) {
    assert.equal(branches.get(projection.branchId).headRevisionId, projection.headRevisionId);
    assert.ok(projection.surfaces.every((surface) => surface.branchId === projection.branchId && surface.headRevisionId === projection.headRevisionId));
  }
});

test("workspace branches have distinct current truth and a staged proposal cannot move HEAD", () => {
  const value = (branchId) => resolveGoldenFixtureBranch(bundle, branchId).materializedState.state.resolvedFacts.find((fact) => fact.semanticKey === "manifest.eligibility").value;
  assert.deepEqual(value("branch-master"), { status: "out_of_scope" });
  assert.deepEqual(value("branch-increment-003"), { allowedReadiness: "Siap" });
  const proposal = bundle.repository.changeProposals[0];
  assert.equal(proposal.status, "staged");
  assert.equal(branches(bundle).get(proposal.branchId).headRevisionId, proposal.baseRevisionId);
});

test("GLF-003-01 accounts for every Safara source and projects the complete operational workflow", () => {
  const expectedSources = [
    ["Safara_Incremental_PRD_01_Foundation_Enrollment-1.pdf", "75a6bf6c7411c909f9a94dd763cfb540656717c5ecac789dad57e7de4e6740bc", 16],
    ["Safara_Incremental_PRD_02_Payment_Documents_Readiness.pdf", "d4c17ac5e54555837dedece4a8b32b8e50780931fe3db9ed3fbd549627d8e8ca", 14],
    ["Safara_Incremental_PRD_03_Manifest_Reporting_Audit.pdf", "02f98474e2e17a8fa6da879055e40e6ca6de862cb71211f9d4b23e259e4094af", 13],
  ];
  assert.equal(bundle.sourceCoverage.expectedArtifactCount, 3);
  assert.equal(bundle.repository.artifacts.length, 3);
  assert.equal(bundle.repository.assertions.length, 43);
  assert.equal(bundle.sourceCoverage.candidateAssertionCount, 43);
  assert.deepEqual(bundle.repository.artifacts.map(({ name, sha256 }) => [name, sha256]), expectedSources.map(([name, sha256]) => [name, sha256]));
  assert.equal(bundle.skillResponses.extractionResponses.length, 3);
  assert.deepEqual(bundle.skillResponses.extractionResponses.map(({ input, response }) => [input.artifact.name, response.candidateAssertions.length]), expectedSources.map(([name, , count]) => [name, count]));
  assert.ok(bundle.skillResponses.extractionResponses.every(({ response }) => response.candidateAssertions.length > 0 && response.unaccountedStatements.length === 0));
  const increment = resolveGoldenFixtureBranch(bundle, "branch-increment-003");
  const workflowStages = increment.projection.surfaces.find((surface) => surface.surface === "workflow").records.map((record) => record.recordId.replace("workflow-", ""));
  assert.deepEqual(workflowStages, bundle.sourceCoverage.expectedWorkflowStages);
  assert.ok(increment.materializedState.state.resolvedFacts.some((fact) => fact.semanticKey === "payment.accepted-balance"));
  assert.ok(increment.materializedState.state.resolvedFacts.some((fact) => fact.semanticKey === "document.review-statuses"));
  assert.ok(increment.materializedState.state.resolvedFacts.some((fact) => fact.semanticKey === "dashboard.metrics"));
  assert.ok(increment.materializedState.state.resolvedFacts.some((fact) => fact.semanticKey === "activity-history.coverage"));
});

function branches(bundle) { return new Map(bundle.repository.branches.map((branch) => [branch.branchId, branch])); }

test("invalid mode or schema response cannot replace the last valid bundle", async () => {
  const output = path.resolve(import.meta.dirname, "../generated/safara-golden-bundle.json");
  const before = await readFile(output, "utf8");
  const script = path.resolve(import.meta.dirname, "../../../apps/atlas/scripts/generate-golden-fixture.mjs");
  const cwd = path.resolve(import.meta.dirname, "../../../apps/atlas");
  for (const environment of [{ SKILLS_MODE: "invalid" }, { GOLDEN_FIXTURE_TEST_FAIL_SCHEMA: "atlas.fixture-repository" }]) {
    assert.throws(() => execFileSync(process.execPath, [script], { cwd, env: { ...process.env, ...environment }, stdio: "pipe" }));
    assert.equal(await readFile(output, "utf8"), before);
  }
});
