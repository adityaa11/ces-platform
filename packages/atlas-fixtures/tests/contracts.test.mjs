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
  assert.ok(cesItem.linkedFactIds.every((id) => workspace.facts.some((item) => item.id === id)));
  assert.equal(change.destination.type, "workflow");
  assert.ok(workspace.workflows.some((item) => item.id === change.destination.targetId));
  assert.ok(workspace.prds.some((prd) => prd.id === source.documentId));
  assert.ok(fact.rows.every((row) => row.prdIds.every((id) => workspace.prds.some((prd) => prd.id === id))));
  assert.ok(workspace.sourceAccounting.every((statement) => workspace.prds.some((prd) => prd.id === statement.prdId)));
});

test("every fixture cross-link and source-accounting destination resolves in the shared workspace", () => {
  const workspace = fixtureScenarios["owner-ready"].workspace;
  const destinations = [...workspace.changes, ...workspace.sourceAccounting, ...workspace.cesItems].map((item) => item.destination);
  for (const destination of destinations) {
    if (destination.type === "unresolved" || destination.type === "project") continue;
    const records = destination.type === "workflow" ? workspace.workflows : destination.type === "fact" ? workspace.facts : workspace.cesItems;
    assert.ok(records.some((record) => record.id === destination.targetId), `${destination.label} resolves to a shared record`);
  }
  for (const collection of [workspace.workflows, workspace.changes, workspace.cesItems]) {
    for (const record of collection) {
      assert.ok(record.evidence.every((source) => workspace.prds.some((prd) => prd.id === source.documentId)), `${record.id} evidence resolves to a PRD`);
    }
  }
  for (const fact of workspace.facts) for (const row of fact.rows) assert.ok(row.evidence.every((source) => workspace.prds.some((prd) => prd.id === source.documentId)), `${fact.id}/${row.id} evidence resolves to a PRD`);
  for (const item of workspace.cesItems) {
    assert.ok(item.sourcePrdIds.every((id) => workspace.prds.some((prd) => prd.id === id)), `${item.id} source PRDs resolve`);
    assert.ok(item.linkedFactIds.every((id) => workspace.facts.some((fact) => fact.id === id)), `${item.id} linked facts resolve`);
    assert.ok(item.evidence.every((source) => workspace.prds.some((prd) => prd.id === source.documentId)), `${item.id} evidence resolves to a PRD`);
  }
});

test("main workflow fixtures preserve ordered groups, semantic pages, and node provenance", () => {
  const workspace = fixtureScenarios["owner-ready"].workspace;
  const primaryGroups = workspace.workflowGroups.filter((group) => !group.support);
  assert.deepEqual(primaryGroups.map((group) => group.order), ["01", "02", "03", "04", "05"]);
  assert.ok(workspace.workflowGroups.some((group) => group.support));
  assert.ok(primaryGroups.every((group) => group.workflowIds.length > 0));
  assert.ok(workspace.prds.every((prd) => /^\d{2} \w+ \d{4}$/.test(prd.publishedAt)));
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
