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
  const directGroups = candidates.map((candidate, index) => {
    const memberIds = new Set([candidate.candidateId, ...candidate.relationships]);
    const members = candidates.filter((item) => memberIds.has(item.candidateId));
    return { groupId: `review-group-${String(index + 1).padStart(3, "0")}`, order: index + 1, members };
  });
  const candidateIndex = new Map(candidates.map((candidate, index) => [candidate.candidateId, index]));
  const scoreGroup = (group: typeof directGroups[number]) => {
    const surfaces = new Set(group.members.flatMap((candidate) => input.requestedSurfaces.filter((surface) => surfaceCandidate(surface, [candidate]))));
    return [surfaces.has("ces") ? 1 : 0, surfaces.size, -group.order] as const;
  };
  const compareScore = (left: readonly number[], right: readonly number[]) => {
    for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return left[index] - right[index];
    return 0;
  };
  const selected = new Map<string, { group: typeof directGroups[number]; candidate: SfeExtractionResult["candidateAssertions"][number]; surface: ReviewSurface }>();
  for (const group of directGroups) for (const candidate of group.members) for (const surface of input.requestedSurfaces) {
    if (!surfaceCandidate(surface, [candidate])) continue;
    const key = `${surface}:${candidate.candidateId}`;
    const existing = selected.get(key);
    if (!existing || compareScore(scoreGroup(group), scoreGroup(existing.group)) > 0) selected.set(key, { group, candidate, surface });
  }
  const selectedMemberships = [...selected.values()].sort((left, right) => left.surface.localeCompare(right.surface) || candidateIndex.get(left.candidate.candidateId)! - candidateIndex.get(right.candidate.candidateId)!);
  const usedGroupIds = new Set(selectedMemberships.map((membership) => membership.group.groupId));
  const groups = directGroups.filter((group) => usedGroupIds.has(group.groupId)).map((group): ReviewGroup => ({ groupId: group.groupId, order: group.order, label: sourceCopy(group.members[0].evidence.quote), supportingCandidateIds: group.members.map((member) => member.candidateId) }));
  const surfaceOrders = new Map<ReviewSurface, number>();
  const annotations = selectedMemberships.map((membership): ReviewAnnotation => {
    const order = (surfaceOrders.get(membership.surface) ?? 0) + 1;
    surfaceOrders.set(membership.surface, order);
    return { annotationId: `review-${membership.surface}-${String(order).padStart(3, "0")}`, candidateId: membership.candidate.candidateId, groupId: membership.group.groupId, surface: membership.surface, role: roleFor(membership.surface), order, sourceLanguage: input.sourceLanguage, label: sourceCopy(membership.candidate.evidence.quote), supportingCandidateIds: membership.group.members.map((member) => member.candidateId) };
  });
  if (input.requestedSurfaces.some((surface) => !annotations.some((annotation) => annotation.surface === surface))) issues.push({ candidateIds: [], question: "The selected evidence cannot support every requested review surface." });
  return { skillId: "atlas.workspace-review-projections", skillVersion: "1.0.0", executionProvenance: { skillId: "atlas.workspace-review-projections", skillVersion: "1.0.0", mode }, status: issues.length ? "needs_resolution" : "complete", reviewModel: { workspaceId: input.workspaceId, ...(input.baseWorkspaceId ? { baseWorkspaceId: input.baseWorkspaceId } : {}), ...(input.baseHeadRevisionId ? { baseHeadRevisionId: input.baseHeadRevisionId } : {}), status: "review-only", sourceLanguage: input.sourceLanguage, groups, annotations }, issues };
}
