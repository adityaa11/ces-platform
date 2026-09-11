"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type WorkspaceSwitcherItem = { id: string; name: string; status: "Published" | "Review" | "Needs review" | "Draft" | "Processing"; prdCount: number; base?: string; createdBy: string; createdAt: string; modifiedBy: string; modifiedAt: string; relative: string; unavailableReason?: string };
export type WorkspaceSwitcherModel = { projectName: string; selectedId: string; workspaces: WorkspaceSwitcherItem[] };

const initials = (name: string) => name === "Atlas" ? "AT" : name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const statusClass = (status: WorkspaceSwitcherItem["status"]) => status.toLowerCase().replace(/\s+/g, "-");

export function WorkspaceSwitcher({ model, onNewWorkspace, onSelect }: { model: WorkspaceSwitcherModel; onNewWorkspace?: () => void; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<WorkspaceSwitcherItem["status"] | "">("");
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = model.workspaces.find((item) => item.id === model.selectedId) ?? model.workspaces[0];
  const results = useMemo(() => model.workspaces.filter((item) => !status || item.status === status).filter((item) => `${item.name} ${item.status} ${item.base ?? ""} ${item.createdBy} ${item.modifiedBy}`.toLowerCase().includes(query.trim().toLowerCase())), [model.workspaces, query, status]);
  const published = results.filter((item) => item.status === "Published");
  const active = results.filter((item) => item.id === model.selectedId && item.status !== "Published");
  const other = results.filter((item) => item.status !== "Published" && item.id !== model.selectedId);
  useEffect(() => { if (!open) return; const timeout = window.setTimeout(() => search.current?.focus(), 0); const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }; document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape); return () => { window.clearTimeout(timeout); document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); }; }, [open]);
  if (!selected) return null;
  const select = (item: WorkspaceSwitcherItem) => { if (item.unavailableReason) { setNotice(`${item.name}: ${item.unavailableReason}`); return; } onSelect(item.id); setOpen(false); setNotice(`${item.name} is now the selected workspace context.`); trigger.current?.focus(); };
  const Row = ({ item }: { item: WorkspaceSwitcherItem }) => <button aria-current={item.id === model.selectedId ? "true" : undefined} aria-describedby={item.unavailableReason ? `reason-${item.id}` : undefined} className={`workspace-audit-row ${item.id === model.selectedId ? "current" : ""}`} key={item.id} onClick={() => select(item)} type="button"><div className="row-main"><div className="row-title"><strong>{item.name}</strong><span className={`workspace-status ${statusClass(item.status)}`}>{item.status}</span></div>{item.base && <div className="base-meta"><span>Base</span><b>{item.base}</b></div>}<div className="audit-grid"><Audit label="Created" name={item.createdBy} time={item.createdAt} /><Audit label="Last modified" name={item.modifiedBy} time={item.modifiedAt} /></div>{item.unavailableReason && <span className="workspace-unavailable" id={`reason-${item.id}`}>Unavailable · {item.unavailableReason}</span>}</div><div className="row-side"><span>{item.prdCount} PRD{item.prdCount === 1 ? "" : "s"}</span><small>{item.relative}</small></div></button>;
  return <div className="workspace-switcher" ref={root}>
    <p className="switch-label">Workspace</p>
    <button aria-controls="workspaceMenu" aria-expanded={open} className="workspace-trigger" onClick={() => setOpen((value) => !value)} ref={trigger} type="button"><span className="branch-glyph" aria-hidden="true">⌘</span><span><strong>{selected.name}</strong><small><em className={`workspace-status ${statusClass(selected.status)}`}>{selected.status}</em>modified {selected.relative}</small></span><b aria-hidden="true">⌄</b></button><p aria-live="polite" className="sr-only">{notice}</p>
    {open && <section aria-label="Workspace switcher" className="workspace-menu" id="workspaceMenu"><div className="switcher-head"><div className="switcher-title"><strong>Switch workspace</strong><span>{model.projectName}</span><button aria-label="Close workspace switcher" onClick={() => { setOpen(false); trigger.current?.focus(); }} type="button">×</button></div><label className="workspace-search"><span aria-hidden="true">⌕</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search workspace, creator, modifier, or PRD…" ref={search} type="search" value={query} /></label><div className="filterbar"><span>Users</span><label>Status<select aria-label="Filter by status" onChange={(event) => setStatus(event.target.value as WorkspaceSwitcherItem["status"] | "")} value={status}><option value="">All</option>{["Published", "Review", "Needs review", "Draft", "Processing"].map((value) => <option key={value}>{value}</option>)}</select></label><span>Created date</span><span>Modified date</span></div></div><div className="switcher-body">{!results.length && <p className="empty-results">No workspaces match these filters.</p>}<Group title="Published truth" items={published} Row={Row} /><Group title="Active workspace" items={active} Row={Row} /><Group title="Other workspaces" items={other} Row={Row} /></div><footer className="switcher-foot"><span>Workspace identity and audit metadata</span><button onClick={onNewWorkspace} type="button">+ New workspace</button></footer></section>}
  </div>;
}

function Audit({ label, name, time }: { label: string; name: string; time: string }) { return <div className="audit-block"><span>{label}</span><div><i>{initials(name)}</i><p><b>{name}</b><small>{time}</small></p></div></div>; }
function Group({ title, items, Row }: { title: string; items: WorkspaceSwitcherItem[]; Row: ({ item }: { item: WorkspaceSwitcherItem }) => React.JSX.Element }) { return items.length ? <section className="workspace-group"><h3>{title}</h3>{items.map((item) => <Row item={item} key={item.id} />)}</section> : null; }
