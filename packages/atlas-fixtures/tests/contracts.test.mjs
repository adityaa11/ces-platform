import assert from "node:assert/strict";
import test from "node:test";
import { fixtureScenarios, getFixtureScenario } from "../src/index.ts";

test("fixture scenarios cover each required role and major prototype state", () => {
  assert.equal(getFixtureScenario().id, "owner-ready");
  assert.equal(fixtureScenarios["owner-ready"].session.role, "owner");
  assert.equal(fixtureScenarios["editor-ready"].session.role, "editor");
  assert.equal(fixtureScenarios["viewer-ready"].session.role, "viewer");
  for (const stage of ["uploading", "extracting", "modeling", "ready", "needs-attention", "failed"]) {
    assert.ok(Object.values(fixtureScenarios).some((scenario) => scenario.processingJob?.stage === stage), `${stage} is selectable`);
  }
  assert.equal(fixtureScenarios["approved-result"].workspace.atlasApproval, "approved");
  assert.equal(fixtureScenarios["approved-result"].workspace.cesApproval, "approved");
});

test("source-grounded fixture records keep quote, document, page, and relationships", () => {
  const workspace = fixtureScenarios["owner-ready"].workspace;
  const [workflow] = workspace.workflows;
  const [fact] = workspace.facts;
  const [cesItem] = workspace.cesItems;
  const [change] = workspace.changes;
  const [source] = workflow.evidence;
  assert.ok(source.quote.length > 0);
  assert.ok(source.documentName.length > 0);
  assert.ok(source.page > 0);
  assert.deepEqual(cesItem.linkedFactIds, [fact.id]);
  assert.ok(change.affectedIds.includes(workflow.id));
  assert.ok(workspace.prds.some((prd) => prd.id === source.documentId));
});

test("main workflow fixtures preserve ordered groups, semantic pages, and node provenance", () => {
  const workspace = fixtureScenarios["owner-ready"].workspace;
  const primaryGroups = workspace.workflowGroups.filter((group) => !group.support);
  assert.deepEqual(primaryGroups.map((group) => group.order), ["01", "02", "03", "04", "05"]);
  assert.ok(workspace.workflowGroups.some((group) => group.support));
  assert.ok(primaryGroups.every((group) => group.workflowIds.length > 0));
  for (const workflow of workspace.workflows) {
    assert.ok(workspace.workflowGroups.some((group) => group.id === workflow.groupId));
    assert.ok(workflow.nodes.length >= 2);
    for (const node of workflow.nodes) {
      assert.ok(node.prdIds.length > 0);
      assert.ok(node.evidence.understood.length > 0);
      assert.ok(node.evidence.quote.length > 0);
      assert.ok(node.evidence.page > 0);
    }
  }
});
