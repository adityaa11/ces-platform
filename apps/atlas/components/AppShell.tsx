"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ProfileMenu } from "./ProfileMenu";
import { TopBar } from "./TopBar";
import type { ProjectFixture, ProjectWorkspaceFixture } from "@atlas/fixtures";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type Destination = "projects" | "workflow" | "facts" | "ces" | "changes";
type WorkspaceView = Exclude<Destination, "projects">;
type Props = { user: User; children: ReactNode; projects: ProjectFixture[]; selectedProjectId?: string; workspace?: ProjectWorkspaceFixture; active?: Destination; projectNavigation?: boolean; sidebarAction?: ReactNode; topbarAction?: ReactNode; routeContext?: { prd?: string; lens?: "isolate" } };
const destinationLabel: Record<Destination, string> = { projects: "Projects", workflow: "Main Workflow", facts: "Project Facts", ces: "CES Result", changes: "Changes Done" };
const destinationIcon: Record<Destination, string> = { projects: "▦", workflow: "∿", facts: "▤", ces: "▣", changes: "↻" };

export function AppShell({ user, children, projects, selectedProjectId, workspace, active = "projects", projectNavigation = false, sidebarAction, topbarAction, routeContext }: Props) {
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeTriggerRef = useRef<HTMLButtonElement>(null);
  const [compact, setCompact] = useState(false);
  const current = projects.find((project) => project.id === selectedProjectId);
  const workflowCount = current && workspace && current.id === workspace.project.id ? workspace.workflows.length : undefined;
  const href = (view: WorkspaceView) => { const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams(current?.status === "ready" ? { projectId: current.id } : {}); if (routeContext?.prd) params.set("prd", routeContext.prd); if (routeContext?.lens) params.set("lens", routeContext.lens); params.set("view", view); return params.size ? `/demo?${params.toString()}` : "/demo"; };
  const closeNavigation = () => { setCollapsed(false); menuTriggerRef.current?.focus(); };
  useEffect(() => { const query = window.matchMedia("(max-width: 640px)"); const update = () => setCompact(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setMenu(false); if (compact && collapsed) closeNavigation(); } }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [collapsed, compact]);
  useEffect(() => { if (!menu) return; const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setMenu(false); }; document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close); }, [menu]);
  useEffect(() => {
    if (!compact || !collapsed) return;
    closeTriggerRef.current?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !navigationRef.current) return;
      const focusable = Array.from(navigationRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [collapsed, compact]);
  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    <TopBar className="app-header" variant="workspace"><Link className="brand" href="/demo"><span>A</span>Atlas</Link><div className="topbar-actions"><label className="project-search"><svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="5.8" stroke="currentColor" strokeWidth="1.8" /><path d="m15.2 15.2 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg><span>Search projects</span><input aria-label="Search projects" placeholder="Search projects" type="search" /></label>{topbarAction}<button aria-controls="app-navigation" aria-expanded={compact && collapsed} aria-label={collapsed ? "Close navigation menu" : "Open navigation menu"} className="mobile-menu" onClick={() => setCollapsed(!collapsed)} ref={menuTriggerRef} type="button"><svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg></button></div></TopBar>
    {compact && collapsed && <button aria-label="Close navigation menu" className="drawer-backdrop" onClick={closeNavigation} type="button" />}
    <aside aria-label="Workspace navigation" className={`navigation ${collapsed ? "navigation-open" : ""}`} id="app-navigation" ref={navigationRef}><button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} type="button">‹</button><button aria-label="Close navigation menu" className="drawer-close" onClick={closeNavigation} ref={closeTriggerRef} type="button">×</button>
      <section className="sidebar-project-region"><div className="project-switcher" ref={ref}><button aria-expanded={menu} onClick={() => setMenu(!menu)} type="button"><span>{current ? current.name[0] : "⌁"}</span><div><small>{current ? "Current project" : "Project"}</small><strong>{current ? current.name : "Select a project"}</strong><em>{current ? `${current.prdCount} PRDs${workflowCount === undefined ? "" : ` · ${workflowCount} workflow pages`}` : `${projects.length} available projects`}</em></div><i>⌄</i></button>{menu && <div className="project-switcher-menu"><header><strong>All projects</strong><small>{projects.length} projects</small></header>{projects.map((project) => { const isCurrent = current?.id === project.id; const detail = <><span>{project.name[0]}</span><div><strong>{project.name}</strong><small>{project.prdCount} PRDs · {project.status === "ready" ? "ready to review" : project.status}</small></div>{isCurrent && <em>Current</em>}</>; return project.status === "ready" ? <Link className={isCurrent ? "is-current" : ""} href={`/demo?projectId=${project.id}&view=workflow`} key={project.id} onClick={() => { setMenu(false); if (compact) setCollapsed(false); }}>{detail}</Link> : <span className="is-unavailable" key={project.id}>{detail}</span>; })}<p>Select a ready project to inspect its workflow.</p></div>}</div></section>
      <div className="sidebar-action">{sidebarAction}</div><section className="sidebar-project-links"><p className="nav-section-label">Project</p><nav aria-label="Project navigation"><Link aria-current={active === "projects" ? "page" : undefined} className={active === "projects" ? "nav-active" : ""} href="/demo"><span aria-hidden="true">{destinationIcon.projects}</span>{destinationLabel.projects}</Link>{projectNavigation && (["workflow", "facts", "ces", "changes"] as const).map((view) => <Link aria-current={active === view ? "page" : undefined} className={active === view ? "nav-active" : ""} href={href(view)} key={view} onClick={() => { if (compact) setCollapsed(false); }}><span aria-hidden="true">{destinationIcon[view]}</span>{destinationLabel[view]}</Link>)}</nav></section><section className="sidebar-workspace-region"><p className="nav-section-label">Workspace</p><nav aria-label="Workspace tools">{[["○", "Sources"], ["♙", "Members"], ["⚙", "Settings"]].map(([icon, label]) => <button aria-disabled="true" className="nav-placeholder" key={label} type="button"><span aria-hidden="true">{icon}</span>{label}</button>)}</nav></section><ProfileMenu user={user} /></aside><main className="app-content">{children}</main>
  </div>;
}
