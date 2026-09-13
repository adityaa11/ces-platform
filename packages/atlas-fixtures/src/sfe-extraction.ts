import type { CreatedFixtureProject, ProcessingJobFixture, ProjectFixture, StoredPrdFileMetadata } from "./index.ts";

export type ExtractionMode = "codex" | "agents_bridge";
export type SfeSourceArtifact = StoredPrdFileMetadata & { artifactId: string; workspaceId: string; verifiedSha256: string };
export type SfeCandidate = { candidateId: string; kind: string; semanticKey: string; payload: Record<string, unknown>; relationships: string[]; evidence: { artifactId: string; page: number; quote: string } };
export type SfeInventoryEntry = { inventoryId: string; artifactId: string; page: number; quote: string; classification: "material" | "non_fact" | "empty_page"; normalizedInterpretation: Record<string, unknown>; destination: { type: "candidate_assertion"; candidateId: string } | { type: "non_fact"; reason: string; duplicateOf?: string } };
export type SfeExtractionResult = { skillId: "atlas.prd-extraction"; skillVersion: "1.2.0"; executionProvenance: { skillId: "atlas.prd-extraction"; skillVersion: "1.2.0"; mode: ExtractionMode }; status: "complete" | "needs_resolution"; executionId: string; mode: ExtractionMode; artifact: SfeSourceArtifact; pages: readonly { page: number; text: string }[]; candidateAssertions: readonly SfeCandidate[]; sourceStatementInventory: readonly SfeInventoryEntry[]; questions: readonly Record<string, unknown>[] };
export type SfeProjectInput = CreatedFixtureProject & { sourceFiles: readonly StoredPrdFileMetadata[] };
export type CompletedFixtureProject = Omit<SfeProjectInput, "project" | "processingJob"> & { project: ProjectFixture; processingJob: ProcessingJobFixture; extraction: SfeExtractionResult; initialDraftWorkspace: Omit<CreatedFixtureProject["initialDraftWorkspace"], "status" | "available" | "unavailableReason"> & { status: "ready-for-review"; available: true } };

const unique = (values: readonly string[], label: string) => { if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}.`); };

/** Validates candidate-only extraction before the existing workspace can become reviewable. */
export function validateSfeExtraction(project: SfeProjectInput, result: SfeExtractionResult): void {
  const { project: card, processingJob, initialDraftWorkspace, masterWorkspace } = project;
  if (card.id !== processingJob.projectId || card.id !== initialDraftWorkspace.projectId || card.id !== masterWorkspace.projectId) throw new Error("Project identity does not resolve across SFE records.");
  if (processingJob.workspaceId !== initialDraftWorkspace.workspaceId || project.prdRecord.workspaceId !== initialDraftWorkspace.workspaceId || result.artifact.workspaceId !== initialDraftWorkspace.workspaceId) throw new Error("Extraction must use the existing Initial Draft workspace ID.");
  if (masterWorkspace.status !== "empty" || masterWorkspace.prdFiles.length) throw new Error("Master must remain empty during extraction.");
  if (!/^[a-f0-9]{64}$/.test(result.artifact.sha256) || result.artifact.sha256 !== result.artifact.verifiedSha256) throw new Error("Stored source hash does not match the verified bytes.");
  const stored = project.sourceFiles.find((file) => file.relativePath === result.artifact.relativePath && file.sha256 === result.artifact.sha256);
  if (!stored || !result.artifact.relativePath.startsWith(`docs/PRD/${card.id}/${initialDraftWorkspace.workspaceId}/`)) throw new Error("Extraction artifact does not resolve to the stored Initial Draft file.");
  if (result.skillId !== "atlas.prd-extraction" || result.skillVersion !== "1.2.0" || result.executionProvenance?.skillId !== result.skillId || result.executionProvenance?.skillVersion !== result.skillVersion || result.executionProvenance?.mode !== result.mode || !["codex", "agents_bridge"].includes(result.mode) || result.status !== "complete") throw new Error("Extraction result does not satisfy the declared PRD-extraction contract.");
  if (!result.pages.length || result.pages.some((page, index) => page.page !== index + 1)) throw new Error("Source pages must be contiguous.");
  unique(result.candidateAssertions.map((candidate) => candidate.candidateId), "candidate ID");
  unique(result.sourceStatementInventory.map((entry) => entry.inventoryId), "inventory ID");
  const candidates = new Map(result.candidateAssertions.map((candidate) => [candidate.candidateId, candidate]));
  const linkedCandidates = new Set<string>();
  for (const entry of result.sourceStatementInventory) {
    const sourcePage = result.pages.find((page) => page.page === entry.page);
    if (entry.artifactId !== result.artifact.artifactId || !sourcePage) throw new Error("Inventory provenance is invalid.");
    if (entry.classification === "material" && entry.destination.type !== "candidate_assertion") throw new Error("Material source statements require a candidate destination.");
    if (entry.classification === "empty_page" && sourcePage.text.trim()) throw new Error("Empty-page accounting may only describe a blank source page.");
    if (entry.classification !== "empty_page" && (!entry.quote || !sourcePage.text.includes(entry.quote))) throw new Error("Inventory quote is not grounded in its page.");
    if (entry.destination.type === "candidate_assertion") { if (!candidates.has(entry.destination.candidateId) || linkedCandidates.has(entry.destination.candidateId)) throw new Error("Inventory candidate destination is dangling or duplicated."); linkedCandidates.add(entry.destination.candidateId); }
    if (entry.destination.type === "non_fact" && !entry.destination.reason) throw new Error("Non-fact accounting needs a reason.");
  }
  if (linkedCandidates.size !== result.candidateAssertions.length || result.pages.some((page) => !result.sourceStatementInventory.some((entry) => entry.page === page.page)) || result.pages.some((page) => !page.text.trim() && !result.sourceStatementInventory.some((entry) => entry.page === page.page && entry.classification === "empty_page"))) throw new Error("Source accounting is incomplete.");
  for (const candidate of result.candidateAssertions) {
    const page = result.pages.find((item) => item.page === candidate.evidence.page);
    if (candidate.evidence.artifactId !== result.artifact.artifactId || !page?.text.includes(candidate.evidence.quote)) throw new Error("Candidate evidence is not grounded in the source artifact.");
    if (candidate.relationships.some((id) => id === candidate.candidateId || !candidates.has(id))) throw new Error("Candidate relationship is invalid.");
    if (/workflow/i.test(candidate.kind)) for (const field of ["actors", "triggers", "orderedSteps", "conditions", "branches", "inputs", "outputs", "dependencies", "stateTransitions", "exceptions"]) if (!Array.isArray(candidate.payload[field])) throw new Error(`Workflow candidate is missing ${field}.`);
  }
}

/** Failure never leaves a processing project looking reviewable or indefinitely extracting. */
export function failSfeExtraction(project: SfeProjectInput, message: string): SfeProjectInput {
  const detail = `Needs attention: ${message}`;
  return { ...project, project: { ...project.project, status: "needs-attention", lastActivity: detail, repository: { ...project.project.repository, state: "needs-attention", summary: detail, action: { label: "Open project", enabled: false, unavailableReason: detail } } }, processingJob: { ...project.processingJob, stage: "needs-attention", message: detail }, initialDraftWorkspace: { ...project.initialDraftWorkspace, status: "extracting", available: false, unavailableReason: detail } };
}

export function completeSfeExtraction(project: SfeProjectInput, result: SfeExtractionResult): CompletedFixtureProject {
  validateSfeExtraction(project, result);
  const { unavailableReason: _reason, ...draft } = project.initialDraftWorkspace;
  return { ...project, project: { ...project.project, status: "ready", lastActivity: "Initial Draft is ready for review", repository: { ...project.project.repository, state: "ready-for-review", summary: "Initial Draft extraction is complete and awaiting review.", initialDraft: { processedPrds: project.prdRecord.prdFiles.length, totalPrds: project.prdRecord.prdFiles.length, progress: 100 }, metrics: [{ value: String(result.candidateAssertions.length), label: "extracted facts" }, { value: String(project.prdRecord.prdFiles.length), label: "PRDs uploaded" }, { value: "Ready", label: "to review" }], action: { label: "Review workspace unavailable", enabled: false, unavailableReason: "This Initial Draft is ready for review. Workspace routing is not available until SFE-003." } } }, processingJob: { ...project.processingJob, stage: "ready", message: "Ready to review", progress: 100 }, initialDraftWorkspace: { ...draft, status: "ready-for-review", available: true }, extraction: result };
}
