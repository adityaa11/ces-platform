import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { resolveGoldenFixtureBranch } from "../src/index.ts";

const output = path.resolve(import.meta.dirname, "../generated/safara-golden-bundle.json");
const script = path.resolve(import.meta.dirname, "../../../apps/atlas/scripts/generate-golden-fixture.mjs");
const cwd = path.resolve(import.meta.dirname, "../../../apps/atlas");
const bundle = JSON.parse(await readFile(output, "utf8"));

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
  for (const mutation of ["remove-fact", "corrupt-page", "buyer-artifact", "duplicate-assertion", "corrupt-fact-provenance", "corrupt-projection-provenance", "material-non-fact"]) {
    assert.throws(() => execFileSync(process.execPath, [script], { cwd, env: { ...process.env, GOLDEN_FIXTURE_TEST_MUTATION: mutation }, stdio: "pipe" }));
    assert.equal(await readFile(output, "utf8"), before);
  }
});
