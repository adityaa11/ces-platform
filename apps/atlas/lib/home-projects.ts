import type { AccessibleAtlasProject } from "@atlas/core";
import type { ProjectCardViewModel } from "../components/project-card-view-model";

/** Fails closed for incomplete persisted state rather than inventing progress. */
export function toProjectCardViewModel(project: AccessibleAtlasProject): ProjectCardViewModel | null {
  if (!Number.isSafeInteger(project.initialDraftDocumentCount) || project.initialDraftDocumentCount < 1) return null;
  return { id: project.id, projectId: project.projectId, name: project.name, summary: project.description ?? "No project description provided.", documentCount: project.initialDraftDocumentCount, state: "waiting-for-extraction", action: { label: "Workspace unavailable", unavailableReason: "A production workspace is not available yet." } };
}

export async function listHomeProjectCards(requestHeaders: Headers): Promise<readonly ProjectCardViewModel[]> {
  const host = requestHeaders.get("host");
  if (!host) throw new Error("Atlas project read requires the request host.");
  const response = await fetch(`http://${host}/api/projects/home`, { cache: "no-store", headers: { cookie: requestHeaders.get("cookie") ?? "" } });
  if (!response.ok) throw new Error("Unable to read Atlas projects.");
  const payload = await response.json() as { projects: AccessibleAtlasProject[] };
  return payload.projects.flatMap((project) => {
    const card = toProjectCardViewModel(project);
    return card ? [card] : [];
  });
}
