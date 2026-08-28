"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ProjectWorkspaceFixture } from "@atlas/fixtures";
import type { WorkspaceLens } from "./WorkspaceLens";

type User = { name: string; role: "owner" | "editor" | "viewer" };
type Approval = { status: "awaiting-approval" | "approved"; pendingText: string; approvedText: string; reviewLabel: string; approveLabel: string; onApprove: () => void; onReview: () => void };
type Props = {
  active: boolean;
  approval: Approval;
  facts: ProjectWorkspaceFixture["facts"];
  heading: { kicker: string; title: string; description: string };
  isolate: boolean;
  lens: WorkspaceLens;
  operationalModel: ReactNode;
  renderExtension?: (fact: ProjectWorkspaceFixture["facts"][number], row: ProjectWorkspaceFixture["facts"][number]["rows"][number]) => ReactNode;
  user: User;
  workspace: ProjectWorkspaceFixture;
};

const matches = (ids: string[], selected: string[]) => !selected.length || ids.some((id) => selected.includes(id));

export function KnowledgeFactsLayout({ active, approval, facts, heading, isolate, lens, operationalModel, renderExtension, user, workspace }: Props) {
  return <>
    <section aria-label="Knowledge approval" className={`workflow-approval-bar ${approval.status === "approved" ? "is-approved" : ""}`}><div><strong>{approval.status === "approved" ? "Approved" : "Awaiting approval"}</strong><p>{approval.status === "approved" ? approval.approvedText : approval.pendingText}</p></div><div><button onClick={approval.onReview} type="button">{approval.reviewLabel}</button>{user.role === "owner" && approval.status === "awaiting-approval" && <button className="is-primary" onClick={approval.onApprove} type="button">{approval.approveLabel}</button>}</div></section>
    <header className="workspace-page-heading"><div><p className="workflow-kicker">{heading.kicker}</p><h1>{heading.title}</h1><p>{heading.description}</p></div></header>
    <div className="facts-refactor-layout mobile-context-layout"><section className="knowledge-list mobile-context-main" aria-label={`${heading.title} groups`}>{facts.map((fact) => {
      const rows = isolate ? fact.rows.filter((row) => matches(row.prdIds, lens.selectedPrdIds)) : fact.rows;
      const matched = matches(fact.prdIds, lens.selectedPrdIds);
      return <details className={active && !matched ? "is-muted" : ""} id={fact.id} key={fact.id}><summary><span>{fact.number}</span><div><h2>{fact.title}</h2><p>{fact.summary}</p></div><small><b>{rows.length} fact{rows.length === 1 ? "" : "s"}</b>{fact.prdIds.map((id) => workspace.prds.find((prd) => prd.id === id)?.increment).filter(Boolean).join(" · ")}</small></summary><div className="knowledge-list-body">{rows.map((row) => <article className={active && matches(row.prdIds, lens.selectedPrdIds) ? "is-matched" : ""} key={row.id}><div><small>Original PRD wording</small><blockquote>“{row.statement}”</blockquote><p><strong>Atlas interpretation:</strong> {row.evidence[0].understood}</p><details><summary>Read source evidence</summary><blockquote>“{row.evidence[0].quote}”</blockquote><small>{row.evidence[0].documentName} · page {row.evidence[0].page}</small></details>{renderExtension?.(fact, row)}</div><aside><small>Related main workflow</small>{row.relatedWorkflowIds.slice(0, 1).map((workflowId) => { const workflow = workspace.workflows.find((item) => item.id === workflowId); const group = workspace.workflowGroups.find((item) => item.id === workflow?.groupId); return workflow && <Link href={`/demo?projectId=${workspace.project.id}&view=workflow`} key={workflowId}><strong>{group?.order} · {group?.title}</strong><span>{workflow.title} →</span></Link>; })}</aside></article>)}</div></details>;
    })}</section><aside className="facts-operational-rail mobile-context-rail">{operationalModel}</aside></div>
    {!facts.length && <section className="knowledge-empty"><strong>No selected contribution here</strong><p>Choose another PRD or turn off isolation to restore the accumulated project context.</p></section>}
  </>;
}
