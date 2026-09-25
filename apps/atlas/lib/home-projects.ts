import type { AccessibleAtlasProject, AtlasProjectRepository } from "@atlas/core";
import type { ProjectCardViewModel } from "../components/project-card-view-model";

/** Fails closed for incomplete persisted state rather than inventing progress. */
export function toProjectCardViewModel(project: AccessibleAtlasProject): ProjectCardViewModel | null {
  if (!Number.isSafeInteger(project.initialDraftDocumentCount) || project.initialDraftDocumentCount < 1 || project.masterWorkspaceState !== "empty" || project.initialDraftWorkspaceState !== "draft" || project.hasDownstreamExtractionState) return null;
  const documentCount = project.initialDraftDocumentCount;
  return { id: project.id, projectId: project.projectId, name: project.name, summary: project.description ?? "No project description provided.", documentCount, state: "waiting-for-extraction", master: { label: "No published work" }, initialDraft: { processedLabel: `0 of ${documentCount} PRDs processed`, progressPercent: 0 }, metrics: { publishedFacts: 0, uploadedPrds: documentCount }, action: { label: "Workspace unavailable", unavailableReason: "A production workspace is not available yet." } };
}

/** Maps an already-authorized repository result; it has no request transport or cookie boundary. */
export async function listHomeProjectCards(userId: string, repository: Pick<AtlasProjectRepository, "listAccessibleTo">): Promise<readonly ProjectCardViewModel[]> {
  const projects = await repository.listAccessibleTo(userId);
  return projects.flatMap((project) => {
    const card = toProjectCardViewModel(project);
    return card ? [card] : [];
  });
}
