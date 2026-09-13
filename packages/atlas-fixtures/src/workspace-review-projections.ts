import type { ExtractionMode, SfeExtractionResult } from "./sfe-extraction.ts";

export type ReviewSurface = "workflow" | "facts" | "ces";
export type WorkspaceReviewInput = { workspaceId: string; projectId: string; status: "ready-for-review" | "needs-attention"; baseWorkspaceId?: string; baseHeadRevisionId?: string; extraction: SfeExtractionResult; requestedSurfaces: readonly ReviewSurface[]; mode?: ExtractionMode };
export type WorkspaceReviewOutput = { skillId: "atlas.workspace-review-projections"; skillVersion: "1.0.0"; executionProvenance: { skillId: "atlas.workspace-review-projections"; skillVersion: "1.0.0"; mode: ExtractionMode }; status: "complete" | "needs_resolution"; reviewModel: { workspaceId: string; baseWorkspaceId?: string; baseHeadRevisionId?: string; status: "review-only"; sourceLanguage: "und"; groups: readonly ReviewGroup[]; annotations: readonly ReviewAnnotation[] }; issues: readonly { candidateIds: readonly string[]; question: string }[] };
export type ReviewGroup = { groupId: string; order: number; label: string; summary: string; outcome: string; supportingCandidateIds: readonly string[] };
export type ReviewAnnotation = { annotationId: string; candidateId: string; groupId: string; surface: ReviewSurface; role: "workflow_page" | "workflow_step" | "fact_row" | "ces_assessment"; order: number; sourceLanguage: "und"; label: string; summary: string; outcome: string; supportingCandidateIds: readonly string[] };

const roleFor = (surface: ReviewSurface): ReviewAnnotation["role"] => surface === "workflow" ? "workflow_step" : surface === "facts" ? "fact_row" : "ces_assessment";
const sourceCopy = (quote: string) => quote.replace(/\s+/g, " ").trim();

/** Produces a review-only graph without adding presentation copy or reading another workspace. */
export function projectWorkspaceReview(input: WorkspaceReviewInput): WorkspaceReviewOutput {
  const mode = input.mode ?? input.extraction.mode;
  const issues: { candidateIds: readonly string[]; question: string }[] = [];
  if (input.status !== "ready-for-review") issues.push({ candidateIds: [], question: "The selected workspace is not ready for review." });
  if (input.extraction.artifact.workspaceId !== input.workspaceId) issues.push({ candidateIds: input.extraction.candidateAssertions.map((candidate) => candidate.candidateId), question: "Candidate evidence belongs to a different workspace." });
  const candidates = input.extraction.candidateAssertions.filter((candidate) => candidate.evidence.artifactId === input.extraction.artifact.artifactId && Boolean(sourceCopy(candidate.evidence.quote)));
  if (candidates.length !== input.extraction.candidateAssertions.length) issues.push({ candidateIds: input.extraction.candidateAssertions.filter((candidate) => candidate.evidence.artifactId !== input.extraction.artifact.artifactId || !sourceCopy(candidate.evidence.quote)).map((candidate) => candidate.candidateId), question: "Every review annotation needs evidence from the selected workspace artifact." });
  const groups = candidates.map((candidate, index): ReviewGroup => { const quote = sourceCopy(candidate.evidence.quote); return { groupId: `review-group-${String(index + 1).padStart(3, "0")}`, order: index + 1, label: quote, summary: quote, outcome: quote, supportingCandidateIds: [candidate.candidateId] }; });
  const annotations = groups.flatMap((group, index) => input.requestedSurfaces.map((surface): ReviewAnnotation => ({ annotationId: `review-${surface}-${String(index + 1).padStart(3, "0")}`, candidateId: group.supportingCandidateIds[0], groupId: group.groupId, surface, role: roleFor(surface), order: index + 1, sourceLanguage: "und", label: group.label, summary: group.summary, outcome: group.outcome, supportingCandidateIds: group.supportingCandidateIds })));
  return { skillId: "atlas.workspace-review-projections", skillVersion: "1.0.0", executionProvenance: { skillId: "atlas.workspace-review-projections", skillVersion: "1.0.0", mode }, status: issues.length ? "needs_resolution" : "complete", reviewModel: { workspaceId: input.workspaceId, ...(input.baseWorkspaceId ? { baseWorkspaceId: input.baseWorkspaceId } : {}), ...(input.baseHeadRevisionId ? { baseHeadRevisionId: input.baseHeadRevisionId } : {}), status: "review-only", sourceLanguage: "und", groups, annotations }, issues };
}
