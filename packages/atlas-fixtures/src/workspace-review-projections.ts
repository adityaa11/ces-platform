import type { ExtractionMode, SfeExtractionResult } from "./sfe-extraction.ts";

export type ReviewSurface = "workflow" | "facts" | "ces";
export type WorkspaceReviewInput = { workspaceId: string; projectId: string; status: "ready-for-review" | "needs-attention"; sourceLanguage: string; baseWorkspaceId?: string; baseHeadRevisionId?: string; extraction: SfeExtractionResult; requestedSurfaces: readonly ReviewSurface[]; mode?: ExtractionMode };
export type WorkspaceReviewOutput = { skillId: "atlas.workspace-review-projections"; skillVersion: "1.0.0"; executionProvenance: { skillId: "atlas.workspace-review-projections"; skillVersion: "1.0.0"; mode: ExtractionMode }; status: "complete" | "needs_resolution"; reviewModel: { workspaceId: string; baseWorkspaceId?: string; baseHeadRevisionId?: string; status: "review-only"; sourceLanguage: string; groups: readonly ReviewGroup[]; annotations: readonly ReviewAnnotation[] }; issues: readonly { candidateIds: readonly string[]; question: string }[] };
export type ReviewGroup = { groupId: string; order: number; label: string; supportingCandidateIds: readonly string[] };
export type ReviewAnnotation = { annotationId: string; candidateId: string; groupId: string; surface: ReviewSurface; role: "workflow_page" | "workflow_step" | "fact_row" | "ces_assessment"; order: number; sourceLanguage: string; label: string; supportingCandidateIds: readonly string[] };

const roleFor = (surface: ReviewSurface): ReviewAnnotation["role"] => surface === "workflow" ? "workflow_step" : surface === "facts" ? "fact_row" : "ces_assessment";
const sourceCopy = (quote: string) => quote.replace(/\s+/g, " ").trim();
const factKinds = new Set(["system_requirement", "role_permission", "capability", "data_schema_requirement", "relationship_rule", "display_requirement", "information_requirement"]);
const surfaceCandidate = (surface: ReviewSurface, candidates: readonly SfeExtractionResult["candidateAssertions"][number][]) => candidates.find((candidate) => surface === "workflow" ? candidate.kind === "workflow_step" : surface === "facts" ? factKinds.has(candidate.kind) : candidate.kind === "acceptance_criterion");

/** Produces a review-only graph without adding presentation copy or reading another workspace. */
export function projectWorkspaceReview(input: WorkspaceReviewInput): WorkspaceReviewOutput {
  const mode = input.mode ?? input.extraction.mode;
  const issues: { candidateIds: readonly string[]; question: string }[] = [];
  if (input.status !== "ready-for-review") issues.push({ candidateIds: [], question: "The selected workspace is not ready for review." });
  if (input.extraction.artifact.workspaceId !== input.workspaceId) issues.push({ candidateIds: input.extraction.candidateAssertions.map((candidate) => candidate.candidateId), question: "Candidate evidence belongs to a different workspace." });
  const hasSourceEvidence = (candidate: SfeExtractionResult["candidateAssertions"][number]) => candidate.evidence.artifactId === input.extraction.artifact.artifactId
    && Boolean(sourceCopy(candidate.evidence.quote))
    && input.extraction.sourceStatementInventory.some((entry) => entry.destination.type === "candidate_assertion" && entry.destination.candidateId === candidate.candidateId && entry.artifactId === candidate.evidence.artifactId && entry.page === candidate.evidence.page && sourceCopy(entry.quote) === sourceCopy(candidate.evidence.quote))
    && input.extraction.pages.some((page) => page.page === candidate.evidence.page && sourceCopy(page.text).includes(sourceCopy(candidate.evidence.quote)));
  const candidates = input.extraction.candidateAssertions.filter(hasSourceEvidence);
  const unsupportedCandidateIds = input.extraction.candidateAssertions.filter((candidate) => !hasSourceEvidence(candidate)).map((candidate) => candidate.candidateId);
  if (unsupportedCandidateIds.length) issues.push({ candidateIds: unsupportedCandidateIds, question: "Every review annotation needs evidence from the selected workspace artifact." });
  const candidatesById = new Map(candidates.map((candidate) => [candidate.candidateId, candidate]));
  const danglingRelationshipIds = candidates.flatMap((candidate) => candidate.relationships.filter((relatedId) => !candidatesById.has(relatedId)).map(() => candidate.candidateId));
  if (danglingRelationshipIds.length) issues.push({ candidateIds: danglingRelationshipIds, question: "Every candidate relationship must resolve within the selected workspace." });
  const groupedCandidates = candidates.filter((candidate) => input.requestedSurfaces.some((surface) => surfaceCandidate(surface, [candidate]))).map((candidate) => [candidate]);
  const groups = groupedCandidates.map((members, index): ReviewGroup => ({ groupId: `review-group-${String(index + 1).padStart(3, "0")}`, order: index + 1, label: sourceCopy(members[0].evidence.quote), supportingCandidateIds: members.map((member) => member.candidateId) }));
  const annotations = groups.flatMap((group, index) => input.requestedSurfaces.flatMap((surface) => {
    const candidate = surfaceCandidate(surface, groupedCandidates[index]);
    return candidate ? [{ annotationId: `review-${surface}-${String(index + 1).padStart(3, "0")}`, candidateId: candidate.candidateId, groupId: group.groupId, surface, role: roleFor(surface), order: index + 1, sourceLanguage: input.sourceLanguage, label: sourceCopy(candidate.evidence.quote), supportingCandidateIds: group.supportingCandidateIds } satisfies ReviewAnnotation] : [];
  }));
  if (input.requestedSurfaces.some((surface) => !annotations.some((annotation) => annotation.surface === surface))) issues.push({ candidateIds: [], question: "The selected evidence cannot support every requested review surface." });
  return { skillId: "atlas.workspace-review-projections", skillVersion: "1.0.0", executionProvenance: { skillId: "atlas.workspace-review-projections", skillVersion: "1.0.0", mode }, status: issues.length ? "needs_resolution" : "complete", reviewModel: { workspaceId: input.workspaceId, ...(input.baseWorkspaceId ? { baseWorkspaceId: input.baseWorkspaceId } : {}), ...(input.baseHeadRevisionId ? { baseHeadRevisionId: input.baseHeadRevisionId } : {}), status: "review-only", sourceLanguage: input.sourceLanguage, groups, annotations }, issues };
}
