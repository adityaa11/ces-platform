"use client";

import { useMemo, useState } from "react";
import type { ProjectFixture, ProjectWorkspaceFixture, WorkflowFixture, WorkflowNodeFixture } from "@atlas/fixtures";
import { AppShell } from "./AppShell";
import { OperationalModel } from "./OperationalModel";
import { PrdLensControl } from "./PrdLensControl";
import { useWorkspaceLens, type WorkspaceLens } from "./WorkspaceLens";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
const matches = (ids: string[], selected: string[]) => !selected.length || ids.some((id) => selected.includes(id));

export function WorkflowWorkspace({ user, projects, workspace, initialLens }: { user: User; projects: ProjectFixture[]; workspace: ProjectWorkspaceFixture; initialLens: WorkspaceLens }) {
  const { lens, set, toggle } = useWorkspaceLens(initialLens);
  const [pageId, setPageId] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [approval, setApproval] = useState(workspace.atlasApproval);
  const active = lens.selectedPrdIds.length > 0;
  const isolate = active && lens.mode === "isolate";
  const affectedPages = useMemo(() => workspace.workflows.filter((page) => matches(page.prdIds, lens.selectedPrdIds)), [lens.selectedPrdIds, workspace.workflows]);
  const pages = isolate ? affectedPages : workspace.workflows;
  const page = workspace.workflows.find((item) => item.id === pageId) ?? null;
  const group = workspace.workflowGroups.find((item) => item.id === page?.groupId);
  const selectedNode = page?.nodes.find((item) => item.id === nodeId) ?? null;
  const index = page ? pages.findIndex((item) => item.id === page.id) : -1;
  const open = (id: string) => { setPageId(id); setNodeId(null); };
  const move = (direction: -1 | 1) => { if (pages.length) open(pages[(index + direction + pages.length) % pages.length].id); };
  const moveAffected = (direction: -1 | 1) => { const affectedIndex = affectedPages.findIndex((item) => item.id === page?.id); if (affectedPages.length) open(affectedPages[(Math.max(affectedIndex, 0) + direction + affectedPages.length) % affectedPages.length].id); };
  return <AppShell active="workflow" projectNavigation projects={projects} routeContext={{ prd: active ? lens.selectedPrdIds.join(",") : undefined, lens: isolate ? "isolate" : undefined }} selectedProjectId={workspace.project.id} topbarAction={<PrdLensControl lens={lens} prds={workspace.prds} set={set} toggle={toggle} />} user={user} workspace={workspace}>
    <section className="workflow-page">{page ? isolate && active && !matches(page.prdIds, lens.selectedPrdIds) ? <IsolationEmpty onBack={() => { setPageId(null); setNodeId(null); }} /> : <Detail affectedCount={affectedPages.length} currentIndex={index} group={group?.title ?? "Workflow"} groups={workspace.workflowGroups} isolate={isolate} lensActive={active} onBack={() => { setPageId(null); setNodeId(null); }} onMove={move} onMoveAffected={moveAffected} onOpen={open} onSelectNode={setNodeId} page={page} pages={pages} prds={workspace.prds} projectName={workspace.project.name} selected={lens.selectedPrdIds} selectedNode={selectedNode} /> : <Overview active={active} approval={approval} isolate={isolate} lens={lens} onApprove={() => setApproval("approved")} onOpen={open} user={user} workspace={workspace} />}</section>
  </AppShell>;
}

function Overview({ active, approval, isolate, lens, onApprove, onOpen, user, workspace }: { active: boolean; approval: "awaiting-approval" | "approved"; isolate: boolean; lens: WorkspaceLens; onApprove: () => void; onOpen: (id: string) => void; user: User; workspace: ProjectWorkspaceFixture }) {
  const groups = workspace.workflowGroups.filter((group) => !group.support && (!isolate || matches(group.prdIds, lens.selectedPrdIds)));
  const support = workspace.workflowGroups.find((group) => group.support);
  const first = groups[0]?.workflowIds[0] ?? workspace.workflows[0]?.id;
  return <>
    <section aria-label="Atlas understanding approval" className={"workflow-approval-bar " + (approval === "approved" ? "is-approved" : "")}>
      <div><strong>Atlas understanding · {approval === "approved" ? "Approved" : "Awaiting approval"}</strong><p>{approval === "approved" ? "The accumulated workflow, facts, changes, and evidence have been approved." : "Review workflows, facts, changes, and evidence before confirming the accumulated understanding."}</p></div>
      <div><button onClick={() => first && onOpen(first)} type="button">Review evidence</button>{user.role === "owner" && approval === "awaiting-approval" && <button className="is-primary" onClick={onApprove} type="button">Approve understanding</button>}</div>
    </section>
    <header className="workspace-page-heading"><div><p className="workflow-kicker">Current accumulated understanding</p><h1>How Safara operates today</h1><p>A compact map of the major operational scopes. Open a scope to inspect detailed workflow pages, source wording, related facts, and CES baseline awareness.</p></div></header>
    {active && <section className="workflow-refactor-lens-note"><strong>{isolate ? "Isolating selected PRD contributions" : "Selected PRDs in accumulated context"}</strong><span>{workspace.workflows.filter((item) => matches(item.prdIds, lens.selectedPrdIds)).length} workflow pages contain a selected contribution.</span></section>}
    <div className="workflow-refactor-layout">
      <section className="workflow-refactor-main"><div className="workflow-refactor-sequence" aria-label="Ordered major workflows">{groups.map((group) => {
        const flows = group.workflowIds.map((id) => workspace.workflows.find((item) => item.id === id)).filter((item): item is WorkflowFixture => Boolean(item));
        return <article className={active && !matches(group.prdIds, lens.selectedPrdIds) ? "is-muted" : ""} key={group.id}><span>{group.order}</span><div><h2>{group.title}</h2><p>{group.summary}</p><section className="workflow-refactor-pages">{flows.map((flow) => <button key={flow.id} onClick={() => onOpen(flow.id)} type="button">{flow.title}</button>)}</section></div><aside><small>Business result</small><strong>{group.expectedResult}</strong><button onClick={() => onOpen(group.workflowIds[0])} type="button">Open first detailed workflow →</button></aside></article>;
      })}</div></section>
      <aside className="workflow-refactor-rail">
        <OperationalModel workspace={workspace} />
        {support && <section className="workflow-support-model"><p className="workflow-kicker">Cross-workflow support</p><h2>{support.title}</h2><p>{support.summary}</p><div>{support.workflowIds.map((id) => <button key={id} onClick={() => onOpen(id)} type="button">{workspace.workflows.find((item) => item.id === id)?.title} →</button>)}</div></section>}
      </aside>
    </div>
  </>;
}

function IsolationEmpty({ onBack }: { onBack: () => void }) {
  return <section className="workflow-isolation-empty"><span className="workflow-kicker">No selected contribution on this page</span><h1>Choose another PRD lens state</h1><p>This workflow has no contribution from the selected PRDs. Return to the overview to open an affected page, or change the lens to restore accumulated context.</p><button onClick={onBack} type="button">← Return to overview</button></section>;
}

function Detail({ affectedCount, currentIndex, group, groups, isolate, lensActive, onBack, onMove, onMoveAffected, onOpen, onSelectNode, page, pages, prds, projectName, selected, selectedNode }: { affectedCount: number; currentIndex: number; group: string; groups: ProjectWorkspaceFixture["workflowGroups"]; isolate: boolean; lensActive: boolean; onBack: () => void; onMove: (direction: -1 | 1) => void; onMoveAffected: (direction: -1 | 1) => void; onOpen: (id: string) => void; onSelectNode: (id: string | null) => void; page: WorkflowFixture; pages: WorkflowFixture[]; prds: ProjectWorkspaceFixture["prds"]; projectName: string; selected: string[]; selectedNode: WorkflowNodeFixture | null }) {
  const visibleNodes = page.nodes.filter((node, index, nodes) => !isolate || !lensActive || matches(node.prdIds, selected) || (index > 0 && matches(nodes[index - 1].prdIds, selected)));
  return <><nav className="semantic-pager" aria-label="Semantic workflow navigation"><button onClick={onBack} type="button">← Overview</button><button aria-label="Previous workflow page" onClick={() => onMove(-1)} type="button">←</button><select aria-label="Workflow page" onChange={(event) => onOpen(event.target.value)} value={page.id}>{groups.map((groupItem) => <optgroup key={groupItem.id} label={`${groupItem.order} · ${groupItem.title}`}>{pages.filter((item) => item.groupId === groupItem.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup>)}</select><button aria-label="Next workflow page" onClick={() => onMove(1)} type="button">→</button>{lensActive && !isolate && <span>{affectedCount} affected pages <button aria-label="Previous affected workflow page" onClick={() => onMoveAffected(-1)} type="button">←</button><button aria-label="Next affected workflow page" onClick={() => onMoveAffected(1)} type="button">→</button></span>}</nav>
    <nav aria-label="Breadcrumb" className="workflow-breadcrumb"><span>{projectName}</span><span>Main Workflow</span><span>{group}</span><strong>{page.title}</strong></nav>
    <header className="semantic-heading"><div><p className="workflow-kicker">{group} · Page {String(currentIndex + 1).padStart(2, "0")} of {pages.length}</p><h1>{page.title}</h1><p>{page.summary} This page answers one business question without loading the entire project graph.</p></div><dl><div><dt>Who is involved</dt><dd>{page.roles.join(" · ")}</dd></div><div><dt>Business result</dt><dd>{page.expectedResult}</dd></div></dl></header>
    <section className="source-history"><div><span className="workflow-kicker">Source history</span><strong>Built from {page.prdIds.length} PRD{page.prdIds.length > 1 ? "s" : ""}</strong></div>{page.prdIds.map((id) => { const prd = prds.find((item) => item.id === id); return prd && <span className={selected.includes(id) ? "is-selected" : ""} key={id}><b>{prd.increment}</b><small>{prd.name} · {prd.publishedAt}</small></span>; })}<p>{lensActive ? "Selected contributions are marked in the workflow." : "Use the PRD lens to inspect provenance."}</p></section>
    <section className="semantic-flow"><header><div><span className="workflow-kicker">Semantic workflow page</span><h2>{page.businessQuestion}</h2></div><p>Select a step to verify its exact PRD wording.</p></header><div className="semantic-nodes">{visibleNodes.map((node, index) => { const matched = matches(node.prdIds, selected); const context = isolate && lensActive && !matched; return <div className="semantic-node-slot" key={node.id}><button className={`semantic-node ${node.kind} ${selectedNode?.id === node.id ? "is-selected" : ""} ${lensActive && matched ? "is-matched" : ""} ${context ? "is-context" : ""}`} onClick={() => onSelectNode(node.id)} type="button"><span>{String(index + 1).padStart(2, "0")}</span><strong>{node.title}</strong><p>{node.note}</p>{lensActive && <em>{context ? "Context" : matched ? "Selected PRD" : "Accumulated"}</em>}</button>{index < visibleNodes.length - 1 && <i>→</i>}</div>; })}</div><footer><span>□ Current page data</span>{lensActive && <span>▣ Selected PRD contribution</span>}{isolate && lensActive && <span>┄ Structural context</span>}</footer></section>
    <section className={`node-evidence ${selectedNode ? "is-open" : ""}`}>{selectedNode ? <><article><span className="workflow-kicker">What Atlas understood</span><h2>{selectedNode.title}</h2><p>{selectedNode.evidence.understood}</p></article><article><header><span className="workflow-kicker">Exact PRD wording</span><button onClick={() => onSelectNode(null)} type="button">Close</button></header><blockquote>“{selectedNode.evidence.quote}”</blockquote><footer>{selectedNode.evidence.documentName} · page {selectedNode.evidence.page}</footer></article></> : <p><strong>Select a workflow step</strong><br />Atlas interpretation and exact PRD wording will appear here.</p>}</section>
    <footer className="detail-continuation"><button onClick={() => onMove(-1)} type="button">← Previous workflow page</button><span>Page {currentIndex + 1} in the accumulated model</span><button onClick={() => onMove(1)} type="button">Next workflow page →</button></footer></>;
}
