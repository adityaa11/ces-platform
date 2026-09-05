import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const bundle = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../generated/safara-golden-bundle.json"), "utf8"));

test("golden bundle keeps branch HEAD, materialized state, and projections together", () => {
  const branches = new Map(bundle.repository.branches.map((branch) => [branch.branchId, branch]));
  for (const state of bundle.repository.materializedStates) assert.equal(branches.get(state.branchId).headRevisionId, state.headRevisionId);
  for (const projection of bundle.projections) {
    assert.equal(branches.get(projection.branchId).headRevisionId, projection.headRevisionId);
    assert.ok(projection.surfaces.every((surface) => surface.branchId === projection.branchId && surface.headRevisionId === projection.headRevisionId));
  }
});

test("workspace branches have distinct current truth and a staged proposal cannot move HEAD", () => {
  const value = (branchId) => bundle.repository.materializedStates.find((state) => state.branchId === branchId).state.resolvedFacts.find((fact) => fact.semanticKey === "manifest.eligibility").value;
  assert.deepEqual(value("branch-master"), { status: "out_of_scope" });
  assert.deepEqual(value("branch-increment-003"), { allowedReadiness: "Siap" });
  const proposal = bundle.repository.changeProposals[0];
  assert.equal(proposal.status, "staged");
  assert.equal(branches(bundle).get(proposal.branchId).headRevisionId, proposal.baseRevisionId);
});

function branches(bundle) { return new Map(bundle.repository.branches.map((branch) => [branch.branchId, branch])); }
