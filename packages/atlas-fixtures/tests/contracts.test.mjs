import assert from "node:assert/strict";
import test from "node:test";
import { fixtureScenarios, getFixtureScenario } from "../src/index.ts";

test("fixture scenarios cover each required role and major prototype state", () => {
  assert.equal(getFixtureScenario().id, "owner-ready");
  assert.equal(fixtureScenarios["owner-ready"].session.role, "owner");
  assert.equal(fixtureScenarios["editor-ready"].session.role, "editor");
  assert.equal(fixtureScenarios["viewer-ready"].session.role, "viewer");
  assert.equal(fixtureScenarios.processing.processingJob.stage, "extracting");
  assert.equal(fixtureScenarios["needs-attention"].processingJob.stage, "failed");
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
