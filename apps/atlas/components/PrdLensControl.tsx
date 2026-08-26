"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProjectWorkspaceFixture } from "@atlas/fixtures";
import type { WorkspaceLens } from "./WorkspaceLens";

type Props = {
  lens: WorkspaceLens;
  prds: ProjectWorkspaceFixture["prds"];
  set: (lens: WorkspaceLens) => void;
  toggle: (id: string) => void;
};

export function PrdLensControl({ lens, prds, set, toggle }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const active = lens.selectedPrdIds.length > 0;

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <div className="topbar-prd-lens" ref={rootRef}>
    <button aria-controls={popoverId} aria-expanded={open} className="topbar-prd-trigger" onClick={() => setOpen((value) => !value)} type="button">
      <span>⌁</span><div><small>PRD lens</small><strong>{active ? <>{lens.selectedPrdIds.length} PRD{lens.selectedPrdIds.length > 1 ? "s" : ""}<span className="lens-selected-suffix"> selected</span></> : "All PRDs"}</strong></div><i>⌄</i>
    </button>
    {open && <div className="prd-lens-popover" id={popoverId}>
      <header><div><span className="workflow-kicker">Global project filter</span><strong>Choose one or more PRDs</strong></div><button aria-label="Close PRD lens" onClick={() => setOpen(false)} type="button">×</button></header>
      <button className={!active ? "is-selected" : ""} onClick={() => set({ selectedPrdIds: [], mode: "highlight" })} type="button"><span>{!active ? "✓" : ""}</span><div><strong>All PRDs</strong><small>Complete accumulated project</small></div></button>
      {prds.map((prd) => <button className={lens.selectedPrdIds.includes(prd.id) ? "is-selected" : ""} key={prd.id} onClick={() => toggle(prd.id)} type="button"><span>{lens.selectedPrdIds.includes(prd.id) ? "✓" : ""}</span><div><strong>{prd.increment}</strong><small>{prd.name} · {prd.pageCount} pages</small></div></button>)}
      <label aria-label="Hide unselected PRD data" className={!active ? "is-disabled" : ""}><input checked={lens.mode === "isolate" && active} disabled={!active} onChange={(event) => set({ ...lens, mode: event.target.checked ? "isolate" : "highlight" })} type="checkbox" /><i /><div><strong>Hide unselected PRD data</strong><small>{lens.mode === "isolate" && active ? "Isolation mode" : "Contextual highlight mode"}</small></div></label>
      <footer><span>{active ? lens.mode === "isolate" ? "Showing selected contributions and structural context." : "Showing accumulated context with selected contributions." : "Showing the complete accumulated project."}</span><button onClick={() => setOpen(false)} type="button">Done</button></footer>
    </div>}
  </div>;
}
