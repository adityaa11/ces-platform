"use client";

import { useCallback, useState } from "react";

export type WorkspaceLens = { selectedPrdIds: string[]; mode: "highlight" | "isolate" };

export function useWorkspaceLens(initial: WorkspaceLens) {
  const [lens, setLens] = useState(initial);
  const updateUrl = useCallback((next: WorkspaceLens) => {
    const params = new URLSearchParams(window.location.search);
    if (next.selectedPrdIds.length) params.set("prd", next.selectedPrdIds.join(",")); else params.delete("prd");
    if (next.mode === "isolate") params.set("lens", "isolate"); else params.delete("lens");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);
  const set = useCallback((next: WorkspaceLens) => { setLens(next); updateUrl(next); }, [updateUrl]);
  const toggle = useCallback((id: string) => set({ ...lens, selectedPrdIds: lens.selectedPrdIds.includes(id) ? lens.selectedPrdIds.filter((item) => item !== id) : [...lens.selectedPrdIds, id] }), [lens, set]);
  const href = useCallback((view: "workflow" | "facts" | "changes") => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", view);
    return `${window.location.pathname}?${params.toString()}`;
  }, []);
  return { lens, set, toggle, href };
}
