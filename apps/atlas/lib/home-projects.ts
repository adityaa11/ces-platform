import type { AccessibleAtlasProject, AtlasProjectRepository, PersistedLifecycleMemberFact } from "@atlas/core";
import type { ProjectCardViewModel } from "../components/project-card-view-model";

const unavailableAction = { label: "Workspace unavailable", unavailableReason: "A production workspace is not available yet." } as const;
const memberFactsAreConsistent = (members: readonly PersistedLifecycleMemberFact[], expected: number, completed: number) => members.length === expected
  && members.every((member, index) => member.sequence === index + 1)
  && members.filter((member) => member.state === "completed").length === completed;

/** Maps only the authorized persisted lifecycle record; malformed records fail closed. */
export function toProjectCardViewModel(project: AccessibleAtlasProject): ProjectCardViewModel | null {
  if (!Number.isSafeInteger(project.initialDraftDocumentCount) || project.initialDraftDocumentCount < 1 || project.masterWorkspaceState !== "empty") return null;
  const lifecycle = project.lifecycle;
  const documentCount = lifecycle.kind === "legacy_no_bundle" ? project.initialDraftDocumentCount : lifecycle.expectedDocumentCount;
  const completed = lifecycle.kind === "legacy_no_bundle" ? 0 : lifecycle.completedDocumentCount;
  if (!Number.isSafeInteger(documentCount) || documentCount < 1 || !Number.isSafeInteger(completed) || completed < 0 || completed > documentCount) return null;
  let state: ProjectCardViewModel["state"];
  let attentionReason: ProjectCardViewModel["attentionReason"];
  if (lifecycle.kind === "legacy_no_bundle") {
    if (project.initialDraftWorkspaceState !== "draft" || project.hasDownstreamExtractionState) return null;
    state = "waiting-for-extraction";
  } else {
    if (documentCount !== project.initialDraftDocumentCount || !memberFactsAreConsistent(lifecycle.memberFacts, documentCount, completed)) return null;
    if (lifecycle.kind === "technical_failure") {
      if (project.initialDraftWorkspaceState !== "draft" || !lifecycle.memberFacts.some((member) => member.hasTechnicalFailure || member.state === "needs_attention")) return null;
      state = "needs-attention";
      attentionReason = "Processing needs attention.";
    } else if (lifecycle.bundleState === "waiting") {
      if (project.initialDraftWorkspaceState !== "draft" || completed !== 0 || lifecycle.memberFacts.some((member) => member.state !== "pending" && member.state !== "perception_queued")) return null;
      state = "waiting-for-extraction";
    } else if (lifecycle.bundleState === "processing") {
      if (project.initialDraftWorkspaceState !== "draft" || lifecycle.memberFacts.some((member) => member.hasTechnicalFailure || member.state === "needs_attention")) return null;
      state = "extracting";
    } else if (lifecycle.bundleState === "ready_for_review") {
      if (completed !== documentCount || lifecycle.memberFacts.some((member) => member.state !== "completed")) return null;
      state = "ready-for-review";
    } else return null;
  }
  const progressPercent = Math.floor(100 * completed / documentCount);
  return { id: project.id, projectId: project.projectId, name: project.name, summary: project.description ?? "No project description provided.", documentCount, state, ...(attentionReason ? { attentionReason } : {}), master: { label: "No published work" }, initialDraft: { processedLabel: `${completed} of ${documentCount} PRDs processed`, progressPercent }, metrics: { publishedFacts: 0, uploadedPrds: documentCount }, action: unavailableAction };
}

/** Maps an already-authorized repository result; it has no request transport or cookie boundary. */
export async function listHomeProjectCards(userId: string, repository: Pick<AtlasProjectRepository, "listAccessibleTo">): Promise<readonly ProjectCardViewModel[]> {
  const projects = await repository.listAccessibleTo(userId);
  return projects.flatMap((project) => {
    const card = toProjectCardViewModel(project);
    return card ? [card] : [];
  });
}
