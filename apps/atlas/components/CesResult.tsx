"use client";

import { useMemo } from "react";
import type { FixtureRouteProjectRecord, ProjectFixture, ProjectWorkspaceFixture } from "@atlas/fixtures";
import { AppShell } from "./AppShell";
import { KnowledgeFactsLayout } from "./KnowledgeFactsLayout";
import { PrdLensControl } from "./PrdLensControl";
import { useWorkspaceApprovals, useWorkspaceLens } from "./WorkspaceLens";
import { WorkspaceSwitcherDemoHost } from "./WorkspaceSwitcherPreview";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type Lens = { selectedPrdIds: string[]; mode: "highlight" | "isolate" };
type CesItem = ProjectWorkspaceFixture["cesItems"][number];
const matches = (ids: string[], selected: string[]) => !selected.length || ids.some((id) => selected.includes(id));

export function CesResult({ user, projects, workspace, initialLens, initialCesItemId, initialWorkspaceId, scenario, unavailableWorkspaceName, fixtureRecords, onWorkspaceSelect }: { user: User; projects: ProjectFixture[]; workspace: ProjectWorkspaceFixture; initialLens: Lens; initialCesItemId?: string; initialWorkspaceId?: string; scenario?: string; unavailableWorkspaceName?: string; fixtureRecords?: readonly FixtureRouteProjectRecord[]; onWorkspaceSelect?: (workspaceId: string) => void }) {
  const { lens, set, toggle } = useWorkspaceLens(initialLens);
  const { approvals, approve } = useWorkspaceApprovals(workspace.project.id, { atlas: workspace.atlasApproval, ces: workspace.cesApproval });
  const active = lens.selectedPrdIds.length > 0;
  const isolate = active && lens.mode === "isolate";
  const facts = useMemo(() => workspace.facts.filter((fact) => !isolate || matches(fact.prdIds, lens.selectedPrdIds)), [isolate, lens.selectedPrdIds, workspace.facts]);
  const isAffected = (item: CesItem) => item.sourcePrdIds.some((id) => lens.selectedPrdIds.includes(id)) || item.linkedFactIds.some((rowId) => workspace.facts.some((fact) => fact.rows.some((row) => row.id === rowId && row.prdIds.some((id) => lens.selectedPrdIds.includes(id)))));
  const items = workspace.cesItems.filter((item) => !isolate || isAffected(item));
  const counts = useMemo(() => items.reduce<Record<CesItem["coverage"], number>>((all, item) => ({ ...all, [item.coverage]: (all[item.coverage] ?? 0) + 1 }), { covered: 0, "needs-review": 0, "out-of-scope": 0, unresolved: 0 }), [items]);
  return <AppShell active="ces" projectNavigation projectRole={user.role} projects={projects} routeContext={{ scenario, workspaceId: initialWorkspaceId, prd: active ? lens.selectedPrdIds.join(",") : undefined, lens: isolate ? "isolate" : undefined }} selectedProjectId={workspace.project.id} topbarAction={<PrdLensControl lens={lens} prds={workspace.prds} set={set} toggle={toggle} />} user={user} workspace={workspace} workspaceSwitcher={<WorkspaceSwitcherDemoHost fixtureRecords={fixtureRecords} initialWorkspaceId={initialWorkspaceId} onWorkspaceSelect={onWorkspaceSelect} projectId={workspace.project.id} projectName={workspace.project.name} unavailableWorkspaceName={unavailableWorkspaceName} />}><section className="knowledge-page ces-page"><KnowledgeFactsLayout active={active} approval={{ status: approvals.ces, pendingText: "Review CES assessments against Project Facts before confirming the CES baseline.", approvedText: "The CES baseline has been approved against the accumulated project facts.", reviewLabel: "Review assessments", approveLabel: "Approve CES baseline", onApprove: () => approve("ces"), onReview: () => facts[0] && document.getElementById(facts[0].id)?.scrollIntoView({ behavior: "smooth", block: "start" }) }} facts={facts} heading={{ kicker: "CES awareness over project facts", title: "CES Result", description: "The same Project Facts, now with CES interpretation attached to each relevant fact. Expand a fact group to review CES in the source context." }} isolate={isolate} lens={lens} operationalModel={<CesOperationalModel counts={counts} total={items.length} />} renderExtension={(_, row) => <CesAssessmentExtension affected={isAffected} initialCesItemId={initialCesItemId} items={items.filter((item) => item.linkedFactIds.includes(row.id))} />} user={user} workspace={workspace} /></section></AppShell>;
}

function CesOperationalModel({ counts, total }: { counts: Record<CesItem["coverage"], number>; total: number }) {
  const metrics = [{ label: "Policy items shown", value: total }, { label: "Covered", value: counts.covered }, { label: "Needs review", value: counts["needs-review"] }, { label: "Out of scope", value: counts["out-of-scope"] }, { label: "Unresolved", value: counts.unresolved }];
  return <section className="workflow-operational-model ces-operational-model mobile-context-primary"><h2>CES operational model</h2><p>Coverage for the CES assessments attached to the current Project Facts context.</p><dl>{metrics.map((metric) => <div key={metric.label}><dt>{metric.value}</dt><dd>{metric.label}</dd></div>)}</dl></section>;
}

function CesAssessmentExtension({ affected, initialCesItemId, items }: { affected: (item: CesItem) => boolean; initialCesItemId?: string; items: CesItem[] }) {
  if (!items.length) return null;
  return <section className="ces-layer"><p className="workflow-kicker">CES assessment <span>{items.length} related</span></p>{items.map((item) => <details className={`ces-item coverage-${item.coverage} ${affected(item) ? "is-matched" : ""}`} id={item.id} key={item.id} open={item.id === initialCesItemId}><summary><span>{item.policyId}</span><span className="ces-item-copy"><strong>{item.policy}</strong><small>{item.conclusion}{affected(item) ? " · Selected PRD contribution" : ""}</small></span><em>{item.coverage.replace("-", " ")}</em></summary><dl><div><dt>Policy rule</dt><dd>{item.rule}</dd></div><div><dt>Concern</dt><dd>{item.concern}</dd></div><div><dt>Policy obligation</dt><dd>{item.obligation}</dd></div><div><dt>Capability need</dt><dd>{item.capabilityNeed}</dd></div>{item.decision && <div className="ces-decision"><dt>Open decision</dt><dd>{item.decision}</dd></div>}</dl></details>)}</section>;
}
