import assert from "node:assert/strict";
import test from "node:test";
import { createFixtureProject, createFixtureWorkspace, fixtureScenarios, getFixtureScenario, markFixtureWorkspaceReadyForReview, projectCardStressFixtures, projectCardStressLimits, resolveFixtureAuthoringExecutor, resolveFixtureProjectRoute, resolveFixtureWorkspaceInventory, resolveFixtureWorkspaceRoute, resolveSkillsMode, workspaceIdPattern } from "../src/index.ts";

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
  const readyForReview = projects.find((project) => project.repository.state === "ready-for-review")?.repository.action;
  assert.equal(readyForReview?.enabled, false);
  assert.match(readyForReview?.unavailableReason ?? "", /completed Initial Draft.*review workspace is not available/i);
});

test("project routes resolve fixture-owned projects and workspaces only by stable ID", () => {
  const scenario = fixtureScenarios["owner-ready"];
  const published = resolveFixtureProjectRoute(scenario, "safara");
  const extracting = resolveFixtureProjectRoute(scenario, "member-portal");
  const review = resolveFixtureProjectRoute(scenario, "vendor-onboarding");
  const missing = resolveFixtureProjectRoute(scenario, "not-a-project");
  assert.equal(published.project?.id, "safara");
  assert.equal(published.workspace?.project.id, "safara");
  assert.equal(published.canOpenWorkspace, true);
  assert.equal(extracting.project?.id, "member-portal");
  assert.equal(extracting.workspace, undefined);
  assert.equal(extracting.canOpenWorkspace, false);
  assert.equal(review.project?.id, "vendor-onboarding");
  assert.equal(review.workspace, undefined);
  assert.equal(review.canOpenWorkspace, false);
  assert.equal(missing.project, undefined);
  assert.equal(missing.workspace, undefined);
  assert.equal(missing.canOpenWorkspace, false);
});

test("project creation request produces one extracting fixture record and matching job by stable ID", () => {
  const created = createFixtureProject({ projectId: "Customer-Portal-V2", projectName: "Customer Portal V2", projectDescription: "Keep the supplied casing.", prdFiles: [{ name: "customer-portal.pdf", type: "application/pdf", size: 4200 }] });
  assert.equal(created.request.projectId, "customer-portal-v2");
  assert.equal(created.project.id, "customer-portal-v2");
  assert.equal(created.processingJob.projectId, "customer-portal-v2");
  assert.equal(created.masterWorkspace.workspaceName, "Master");
  assert.equal(created.masterWorkspace.status, "empty");
  assert.equal(created.initialDraftWorkspace.workspaceName, "Initial Draft");
  assert.equal(created.initialDraftWorkspace.projectId, created.project.id);
  assert.match(created.initialDraftWorkspace.workspaceId, workspaceIdPattern);
  assert.equal(created.initialDraftWorkspace.available, false);
  assert.equal(created.project.status, "processing");
  assert.equal(created.project.repository.state, "extracting");
  assert.equal(created.project.repository.initialDraft.totalPrds, 1);
  assert.equal(created.project.repository.action.enabled, false);
  assert.equal(created.request.projectName, "Customer Portal V2");
  assert.equal(created.request.projectDescription, "Keep the supplied casing.");
  const route = resolveFixtureProjectRoute({ ...fixtureScenarios["owner-ready"], projects: [...fixtureScenarios["owner-ready"].projects, created.project] }, created.project.id);
  assert.equal(route.project?.id, created.processingJob.projectId);
  assert.equal(route.canOpenWorkspace, false);
});

test("project intake retries a colliding Initial Draft ID and fails without a usable token", () => {
  const request = { projectId: "customer-portal-v2", projectName: "Customer Portal V2", projectDescription: "", prdFiles: [{ name: "customer-portal.pdf", type: "application/pdf", size: 4200 }] };
  const created = createFixtureProject(request, ["aaaaaaaaaaaa", "b2c3d4e5f6h7"], ["cus-aaaaaaaaaaaa"]);
  assert.equal(created.initialDraftWorkspace.workspaceId, "cus-b2c3d4e5f6h7");
  assert.throws(() => createFixtureProject(request, ["aaaaaaaaaaaa"], ["cus-aaaaaaaaaaaa"]), /Unable to allocate a unique workspace ID/);
});

test("workspace creation is transient, Master-rooted, collision-safe, and unavailable while extracting", () => {
  const bases=[{workspaceId:"master",projectId:"safara",headRevisionId:"rev-master"},{workspaceId:"inc-03",projectId:"safara",baseWorkspaceId:"master",headRevisionId:"rev-inc-03"},{workspaceId:"saf-aaaaaaaaaaaa",projectId:"safara",baseWorkspaceId:"master",headRevisionId:"rev-collision"}];
  const created=createFixtureWorkspace({projectId:"safara",workspaceName:"Refund correction",baseWorkspaceId:"inc-03",prdFiles:[{name:"refund.pdf",type:"application/pdf",size:42}]},bases,["aaaaaaaaaaaa","b2c3d4e5f6h7"]);
  assert.match(created.workspace.workspaceId,workspaceIdPattern); assert.equal(created.workspace.workspaceId,created.extractionRequest.workspaceId); assert.equal(created.workspace.baseWorkspaceId,"inc-03"); assert.equal(created.workspace.baseHeadRevisionId,"rev-inc-03"); assert.equal(created.workspace.available,false); assert.match(created.workspace.unavailableReason,/still in progress/i);
  assert.equal(created.workspace.workspaceId,"saf-b2c3d4e5f6h7");
  assert.throws(()=>createFixtureWorkspace({projectId:"unknown",workspaceName:"x",baseWorkspaceId:"master",prdFiles:[{name:"a.pdf",type:"application/pdf",size:1}]},bases),/Unknown project/);
  assert.throws(()=>createFixtureWorkspace({projectId:"safara",workspaceName:"   ",baseWorkspaceId:"master",prdFiles:[{name:"a.pdf",type:"application/pdf",size:1}]},bases),/Workspace name/);
  assert.throws(()=>createFixtureWorkspace({projectId:"safara",workspaceName:"x",baseWorkspaceId:"missing",prdFiles:[{name:"a.pdf",type:"application/pdf",size:1}]},bases),/Unknown base/);
  assert.throws(()=>createFixtureWorkspace({projectId:"safara",workspaceName:"x",baseWorkspaceId:"master",prdFiles:[]},bases),/PDF/);
  assert.throws(()=>createFixtureWorkspace({projectId:"safara",workspaceName:"x",baseWorkspaceId:"master",prdFiles:[{name:"a.txt",type:"text/plain",size:1}]},bases),/PDF/);
});

test("workspace creation accepts the fixture inventory's stable Master branch ID", () => {
  const bases=[{workspaceId:"branch-master",projectId:"safara",headRevisionId:"rev-master"},{workspaceId:"branch-increment-003",projectId:"safara",baseWorkspaceId:"branch-master",headRevisionId:"rev-inc-03"}];
  const created=createFixtureWorkspace({projectId:"safara",workspaceName:"Refund correction",baseWorkspaceId:"branch-increment-003",prdFiles:[{name:"refund.pdf",type:"application/pdf",size:42}]},bases,["b2c3d4e5f6h7"]);
  assert.equal(created.workspace.baseWorkspaceId,"branch-increment-003"); assert.equal(created.workspace.baseHeadRevisionId,"rev-inc-03");
});

test("a supplied Ready-for-review fixture workspace becomes selectable and openable", () => {
  const bases=[{workspaceId:"master",projectId:"safara",headRevisionId:"rev-master"}];
  const created=createFixtureWorkspace({projectId:"safara",workspaceName:"Refund correction",baseWorkspaceId:"master",prdFiles:[{name:"refund.pdf",type:"application/pdf",size:42}]},bases,["b2c3d4e5f6h7"]);
  const ready=markFixtureWorkspaceReadyForReview(created.workspace);
  assert.equal(created.workspace.status,"extracting"); assert.equal(created.workspace.available,false); assert.equal(ready.status,"ready-for-review"); assert.equal(ready.available,true); assert.equal(ready.unavailableReason,undefined);
});

test("workspace selector inventory is fixture-owned, stable-ID keyed, and exposes availability", () => {
  const inventory = resolveFixtureWorkspaceInventory("safara");
  assert.deepEqual(inventory.map((workspace) => workspace.workspaceId), ["branch-master", "branch-increment-003", "saf-a2b3c4d5e6f7"]);
  assert.equal(inventory.find((workspace) => workspace.workspaceId === "branch-increment-003")?.headRevisionId, "rev-safara-increment-003");
  assert.equal(inventory.find((workspace) => workspace.workspaceId === "saf-a2b3c4d5e6f7")?.available, false);
  assert.equal(resolveFixtureWorkspaceInventory("unknown").length, 0);
  assert.equal(resolveFixtureWorkspaceRoute("safara", "branch-master").selectedWorkspace?.workspaceId, "branch-master");
  assert.equal(resolveFixtureWorkspaceRoute("safara", "saf-a2b3c4d5e6f7").selectedWorkspace?.workspaceId, "branch-increment-003");
  assert.match(resolveFixtureWorkspaceRoute("safara", "saf-a2b3c4d5e6f7").unavailableWorkspace?.unavailableReason ?? "", /cannot be opened/i);
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
  assert.match(projectCardStressFixtures[0].name, /^[a-z ]+$/);
  assert.match(projectCardStressFixtures[1].name, /^[A-Z ]+$/);
  assert.match(projectCardStressFixtures[2].name, /[A-Z]/);
  assert.match(projectCardStressFixtures[2].name, /[a-z]/);
  assert.match(projectCardStressFixtures[0].repository.summary, / /);
  assert.match(projectCardStressFixtures[1].repository.summary, / /);
  assert.match(projectCardStressFixtures[2].repository.summary, / /);
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
