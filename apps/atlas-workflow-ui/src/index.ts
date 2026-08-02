import { adaptWorkspacePayload } from "./adapter.js";
import { renderWorkspaceState } from "./render.js";

export async function loadWorkspace(url: string, fetcher: typeof fetch = fetch): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("Atlas application root is missing");
  root.innerHTML = renderWorkspaceState({ kind: "loading" });
  try {
    const response = await fetcher(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Projection request failed (${response.status})`);
    root.innerHTML = renderWorkspaceState(adaptWorkspacePayload(await response.json()));
  } catch (error) {
    root.innerHTML = renderWorkspaceState({ kind: "error", message: error instanceof Error
      ? error.message : "Projection request failed" });
  }
}

const root = document.querySelector("#app");
if (root) {
  const projectionUrl = new URLSearchParams(location.search).get("projection")
    ?? "/api/atlas/workspace";
  void loadWorkspace(projectionUrl);
}
