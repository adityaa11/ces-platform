import assert from "node:assert/strict";
import test from "node:test";
import { fixtureScenarios, getFixtureScenario, projectCardStressFixtures, projectCardStressLimits, resolveFixtureAuthoringExecutor, resolveSkillsMode } from "../src/index.ts";

test("skills mode defaults to codex and accepts only documented repository-wide values", () => {
  assert.equal(resolveSkillsMode(), "codex");
  assert.equal(resolveSkillsMode({ SKILLS_MODE: "codex" }), "codex");
  assert.equal(resolveSkillsMode({ SKILLS_MODE: "agents_bridge" }), "agents_bridge");
  assert.throws(() => resolveSkillsMode({ SKILLS_MODE: "" }), /Invalid SKILLS_MODE/);
  assert.throws(() => resolveSkillsMode({ SKILLS_MODE: "provider-x" }), /Invalid SKILLS_MODE/);
});

test("skills mode cannot silently enable an unconfigured Agents Bridge", () => {
  assert.equal(resolveFixtureAuthoringExecutor(), "codex");
  assert.throws(
    () => resolveFixtureAuthoringExecutor({ SKILLS_MODE: "agents_bridge" }),
    /requires a configured Agents Bridge executor/,
  );
  assert.equal(
    resolveFixtureAuthoringExecutor({ SKILLS_MODE: "agents_bridge" }, { kind: "agents_bridge" }),
    "agents_bridge",
  );
});

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

test("repository lifecycle counts describe the same fixture-owned PRD records", () => {
  for (const project of fixtureScenarios["owner-ready"].projects) {
    const draft = project.repository.initialDraft;
    if (!draft) continue;
    const uploaded = project.repository.metrics.find((metric) => metric.label === "PRDs uploaded");
    assert.equal(draft.totalPrds, project.prdCount, `${project.id} draft total matches project PRDs`);
    assert.equal(Number(uploaded?.value), project.prdCount, `${project.id} uploaded metric matches project PRDs`);
    if (draft.progress === 100) assert.equal(draft.processedPrds, project.prdCount, `${project.id} completed draft includes every project PRD`);
  }
  const projects = fixtureScenarios["owner-ready"].projects;
  assert.equal(projects.find((project) => project.repository.state === "extracting")?.repository.action.enabled, false);
  assert.equal(projects.find((project) => project.repository.state === "ready-for-review")?.repository.action.enabled, true);
});

test("project-card stress inputs stay isolated from accepted scenarios and cover each planned field limit", () => {
  assert.equal(Object.values(fixtureScenarios).some((scenario) => scenario.projects === projectCardStressFixtures), false);
  assert.equal(projectCardStressFixtures.length, 3);
  for (const project of projectCardStressFixtures) {
    assert.equal(project.id.length, projectCardStressLimits.id);
    assert.equal(project.name.length, projectCardStressLimits.name);
    assert.equal(project.repository.summary.length, projectCardStressLimits.description);
    assert.match(project.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
  assert.match(projectCardStressFixtures[0].name, /^[a-z]+$/);
  assert.match(projectCardStressFixtures[1].name, /^[A-Z]+$/);
  assert.match(projectCardStressFixtures[2].name, /[A-Z]/);
  assert.match(projectCardStressFixtures[2].name, /[a-z]/);
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

test("golden Safara fixture uses the verified incremental PRD metadata and reciprocal reading links", () => {
  const workspace = fixtureScenarios["owner-ready"].workspace;
  assert.deepEqual(workspace.prds.map((prd) => [prd.id, prd.pageCount, prd.publishedAt]), [
    ["safara-increment-01", 3, "27 July 2026"],
    ["safara-increment-02", 4, "27 July 2026"],
    ["safara-increment-03", 4, "27 July 2026"],
  ]);
  const factRows = workspace.facts.flatMap((fact) => fact.rows);
  for (const row of factRows) {
    assert.ok(row.relatedWorkflowIds.every((id) => workspace.workflows.some((workflow) => workflow.id === id)), `${row.id} workflows resolve`);
    assert.ok(row.cesItemIds.every((id) => workspace.cesItems.some((item) => item.id === id)), `${row.id} CES items resolve`);
  }
  for (const item of workspace.cesItems) {
    assert.ok(item.linkedFactRowIds.every((id) => factRows.some((row) => row.id === id)), `${item.id} fact rows resolve`);
    assert.ok(item.relatedWorkflowIds.every((id) => workspace.workflows.some((workflow) => workflow.id === id)), `${item.id} workflows resolve`);
  }
});
