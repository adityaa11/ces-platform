"use client";

import { useCallback, useState } from "react";

export type WorkspaceLens = { selectedPrdIds: string[]; mode: "highlight" | "isolate" };
export type WorkspaceApprovals = { atlas: "awaiting-approval" | "approved"; ces: "awaiting-approval" | "approved" };

export function demoHref(values: Record<string, string | undefined>) {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  Object.entries(values).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
  return `/demo?${params.toString()}`;
}

export function useWorkspaceLens(initial: WorkspaceLens) {
  const [lens, setLens] = useState(initial);
  const updateUrl = useCallback((next: WorkspaceLens) => {
    const params = new URLSearchParams(window.location.search);
    if (next.selectedPrdIds.length) params.set("prd", next.selectedPrdIds.join(",")); else params.delete("prd");
    if (next.mode === "isolate") params.set("lens", "isolate"); else params.delete("lens");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);
  const set = useCallback((next: WorkspaceLens) => {
    const normalized = next.selectedPrdIds.length ? next : { selectedPrdIds: [], mode: "highlight" as const };
    setLens(normalized);
    updateUrl(normalized);
  }, [updateUrl]);
  const toggle = useCallback((id: string) => set({ ...lens, selectedPrdIds: lens.selectedPrdIds.includes(id) ? lens.selectedPrdIds.filter((item) => item !== id) : [...lens.selectedPrdIds, id] }), [lens, set]);
  const href = useCallback((view: "workflow" | "facts" | "changes") => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", view);
    return `${window.location.pathname}?${params.toString()}`;
  }, []);
  return { lens, set, toggle, href };
}

export function useWorkspaceApprovals(projectId: string, initial: WorkspaceApprovals) {
  const key = `atlas-prototype:approvals:${projectId}`;
  const [approvals, setApprovals] = useState(() => {
    if (typeof window === "undefined") return initial;
    try { return JSON.parse(window.sessionStorage.getItem(key) ?? "null") as WorkspaceApprovals ?? initial; } catch { return initial; }
  });
  const approve = useCallback((kind: keyof WorkspaceApprovals) => setApprovals((current) => {
    const next = { ...current, [kind]: "approved" as const };
    try { window.sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* no-op */ }
    return next;
  }), [key]);
  return { approvals, approve };
}
