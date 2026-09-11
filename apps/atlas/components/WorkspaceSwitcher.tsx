"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type WorkspaceLifecycle = "published" | "review" | "draft" | "extracting";
export type WorkspaceSwitcherItem = {
  id: string;
  name: string;
  lifecycle: WorkspaceLifecycle;
  lifecycleLabel: string;
  prdCount: number;
  baseWorkspace?: string;
  createdBy: string;
  modifiedAt: string;
  relativeModifiedAt: string;
  head?: string;
  executionProvenance?: string;
  unavailableReason?: string;
};
export type WorkspaceSwitcherModel = { selectedId: string; workspaces: WorkspaceSwitcherItem[] };

const lifecycleLabels: Record<WorkspaceLifecycle, string> = {
  published: "Published",
  review: "Ready for review",
  draft: "Draft",
  extracting: "Extracting",
};

export function WorkspaceSwitcher({ model, onNewWorkspace, onSelect }: { model: WorkspaceSwitcherModel; onNewWorkspace?: () => void; onSelect: (workspaceId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = model.workspaces.find((workspace) => workspace.id === model.selectedId) ?? model.workspaces[0];
  const visible = useMemo(() => model.workspaces.filter((workspace) => `${workspace.name} ${workspace.lifecycleLabel} ${workspace.baseWorkspace ?? ""} ${workspace.createdBy}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [model.workspaces, query]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => search.current?.focus(), 0);
    const closeOnOutsidePress = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => { window.clearTimeout(timer); document.removeEventListener("pointerdown", closeOnOutsidePress); document.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  if (!selected) return null;
  const select = (workspace: WorkspaceSwitcherItem) => {
    if (workspace.unavailableReason) { setNotice(`${workspace.name}: ${workspace.unavailableReason}`); return; }
    onSelect(workspace.id);
    setNotice(`${workspace.name} is now the selected workspace context.`);
    setOpen(false);
    trigger.current?.focus();
  };

  return <div className="workspace-switcher" ref={root}>
    <button aria-controls="workspace-switcher-menu" aria-expanded={open} className="workspace-switcher-trigger" onClick={() => setOpen((value) => !value)} ref={trigger} type="button">
      <span className="workspace-switcher-mark" aria-hidden="true">⌘</span>
      <span className="workspace-switcher-trigger-copy"><strong>{selected.name}</strong><small><span className={`workspace-status workspace-status-${selected.lifecycle}`}>{selected.lifecycleLabel}</span> · modified {selected.relativeModifiedAt}</small></span>
      <span aria-hidden="true" className="workspace-switcher-chevron">⌄</span>
    </button>
    <p aria-live="polite" className="workspace-switcher-notice">{notice}</p>
    {open && <section aria-label="Choose workspace" className="workspace-switcher-menu" id="workspace-switcher-menu">
      <header><div><p>Workspace context</p><h2>Choose workspace</h2></div><button aria-label="Close workspace chooser" className="workspace-switcher-close" onClick={() => { setOpen(false); trigger.current?.focus(); }} type="button">×</button></header>
      <label className="workspace-switcher-search"><span className="sr-only">Search workspaces</span><span aria-hidden="true">⌕</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search workspaces" ref={search} type="search" value={query} /></label>
      <div className="workspace-switcher-list">
        {visible.map((workspace) => <button aria-current={workspace.id === model.selectedId ? "true" : undefined} aria-describedby={workspace.unavailableReason ? `workspace-reason-${workspace.id}` : undefined} className={`workspace-switcher-row ${workspace.id === model.selectedId ? "is-selected" : ""} ${workspace.unavailableReason ? "is-unavailable" : ""}`.trim()} key={workspace.id} onClick={() => select(workspace)} type="button">
          <span className="workspace-switcher-row-main"><span className="workspace-switcher-row-title"><strong>{workspace.name}</strong><span className={`workspace-status workspace-status-${workspace.lifecycle}`}>{workspace.lifecycleLabel}</span></span><span className="workspace-switcher-row-meta">{workspace.prdCount} PRD{workspace.prdCount === 1 ? "" : "s"}{workspace.baseWorkspace ? ` · Base: ${workspace.baseWorkspace}` : " · Root workspace"}</span><span className="workspace-switcher-row-audit">Created by {workspace.createdBy} · {workspace.modifiedAt}</span>{workspace.unavailableReason && <span className="workspace-unavailable-reason" id={`workspace-reason-${workspace.id}`}>Unavailable · {workspace.unavailableReason}</span>}</span><span aria-hidden="true" className="workspace-switcher-row-side">{workspace.id === model.selectedId ? "Selected" : workspace.relativeModifiedAt}</span>
        </button>)}
        {!visible.length && <p className="workspace-switcher-empty">No workspaces match “{query}”.</p>}
      </div>
      <footer><p>Selection changes workspace context only. Lifecycle status remains independent.</p><button onClick={onNewWorkspace} type="button">+ New workspace</button></footer>
    </section>}
  </div>;
}

export function workspaceLifecycleLabel(lifecycle: WorkspaceLifecycle) { return lifecycleLabels[lifecycle]; }
