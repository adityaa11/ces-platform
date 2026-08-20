export type AccessRole = "owner" | "editor" | "viewer";
export type ProjectStatus = "ready" | "processing" | "needs-attention";
export type ProcessingStage = "uploading" | "extracting" | "modeling" | "ready" | "failed";
export type ApprovalState = "awaiting-approval" | "approved";
export type CesCoverageState = "covered" | "needs-review" | "out-of-scope" | "unresolved";
export type ChangeKind = "established" | "clarified" | "expanded" | "superseded" | "unresolved";

export type SourceEvidence = { id: string; understood: string; quote: string; documentId: string; documentName: string; page: number };
export type PrdFixture = { id: string; name: string; increment: string; pageCount: number; selectedByDefault?: boolean };
export type ProjectFixture = { id: string; name: string; status: ProjectStatus; prdCount: number; collaborators: number; lastActivity: string; isShared: boolean };
export type MembershipFixture = { id: string; name: string; email: string; role: AccessRole; status: "active" | "invited" | "removed" };
export type WorkflowFixture = { id: string; title: string; businessQuestion: string; roles: string[]; expectedResult: string; evidence: SourceEvidence[] };
export type FactFixture = { id: string; group: "Scope" | "People and responsibilities" | "Constraints" | "Information protection" | "Outputs" | "Commitments"; statement: string; evidence: SourceEvidence[] };
export type ChangeFixture = { id: string; kind: ChangeKind; summary: string; prdId: string; affectedIds: string[]; evidence: SourceEvidence[] };
export type CesItemFixture = { id: string; policy: string; obligation: string; linkedFactIds: string[]; concern: string; capabilityNeed: string; coverage: CesCoverageState; decision?: string; evidence: SourceEvidence[] };
export type ProcessingJobFixture = { id: string; projectId: string; stage: ProcessingStage; message: string; progress: number };

export type ProjectWorkspaceFixture = { project: ProjectFixture; prds: PrdFixture[]; memberships: MembershipFixture[]; workflows: WorkflowFixture[]; facts: FactFixture[]; changes: ChangeFixture[]; cesItems: CesItemFixture[]; atlasApproval: ApprovalState; cesApproval: ApprovalState };
export type FixtureScenario = { id: "empty-library" | "owner-ready" | "editor-ready" | "viewer-ready" | "processing" | "approved-result" | "needs-attention"; label: string; session: { name: string; email: string; role: AccessRole }; projects: ProjectFixture[]; workspace?: ProjectWorkspaceFixture; processingJob?: ProcessingJobFixture; lens: { selectedPrdIds: string[]; mode: "highlight" | "isolate" } };

const evidence: SourceEvidence = { id: "evidence-booking-review", understood: "A booking change is checked before it is confirmed.", quote: "Operations reviews the requested change before confirming the revised booking.", documentId: "safara-increment-01", documentName: "Safara Buyer Business PRD — Initial release", page: 12 };
const project: ProjectFixture = { id: "safara", name: "Safara operations platform", status: "ready", prdCount: 3, collaborators: 4, lastActivity: "Atlas understanding is ready to review", isShared: false };
const workspace: ProjectWorkspaceFixture = {
  project,
  prds: [
    { id: "safara-increment-01", name: "Initial release", increment: "PRD 1", pageCount: 28, selectedByDefault: true },
    { id: "safara-increment-02", name: "Finance clarification", increment: "PRD 2", pageCount: 9 },
    { id: "safara-increment-03", name: "Operations expansion", increment: "PRD 3", pageCount: 14 },
  ],
  memberships: [
    { id: "nadia", name: "Nadia Hartono", email: "nadia@example.com", role: "owner", status: "active" },
    { id: "raka", name: "Raka Pratama", email: "raka@example.com", role: "editor", status: "active" },
    { id: "sari", name: "Sari Utami", email: "sari@example.com", role: "viewer", status: "active" },
    { id: "maya", name: "Maya Santoso", email: "maya@example.com", role: "viewer", status: "invited" },
  ],
  workflows: [{ id: "booking-change", title: "Review a booking change", businessQuestion: "How is a requested change reviewed before confirmation?", roles: ["Operations", "Finance"], expectedResult: "A reviewed change is ready to confirm.", evidence: [evidence] }],
  facts: [{ id: "fact-review", group: "People and responsibilities", statement: "Operations reviews requested booking changes.", evidence: [evidence] }],
  changes: [{ id: "change-finance", kind: "clarified", summary: "Finance review is required for payment-impacting changes.", prdId: "safara-increment-02", affectedIds: ["booking-change", "fact-review"], evidence: [evidence] }],
  cesItems: [{ id: "ces-access", policy: "Access accountability", obligation: "Account for who may review and confirm a change.", linkedFactIds: ["fact-review"], concern: "An unaccounted reviewer could approve a sensitive change.", capabilityNeed: "The solution must make review responsibility visible.", coverage: "needs-review", decision: "Confirm the accountability record for Finance review.", evidence: [evidence] }],
  atlasApproval: "awaiting-approval", cesApproval: "awaiting-approval",
};

const processingProject: ProjectFixture = { id: "member-portal", name: "Member portal refresh", status: "processing", prdCount: 2, collaborators: 2, lastActivity: "Extracting project facts", isShared: true };
const attentionProject: ProjectFixture = { id: "supplier-access", name: "Supplier access update", status: "needs-attention", prdCount: 1, collaborators: 1, lastActivity: "One PDF needs another upload", isShared: false };
const owner = { name: "Nadia Hartono", email: "nadia@example.com", role: "owner" } as const;

export const fixtureScenarios: Record<FixtureScenario["id"], FixtureScenario> = {
  "empty-library": { id: "empty-library", label: "Empty library", session: owner, projects: [], lens: { selectedPrdIds: [], mode: "highlight" } },
  "owner-ready": { id: "owner-ready", label: "Owner reviewing Atlas understanding", session: owner, projects: [project, processingProject], workspace, lens: { selectedPrdIds: [], mode: "highlight" } },
  "editor-ready": { id: "editor-ready", label: "Editor on a shared project", session: { name: "Raka Pratama", email: "raka@example.com", role: "editor" }, projects: [{ ...project, isShared: true }], workspace, lens: { selectedPrdIds: ["safara-increment-02"], mode: "highlight" } },
  "viewer-ready": { id: "viewer-ready", label: "Viewer inspecting a shared project", session: { name: "Sari Utami", email: "sari@example.com", role: "viewer" }, projects: [{ ...project, isShared: true }], workspace, lens: { selectedPrdIds: ["safara-increment-01"], mode: "isolate" } },
  processing: { id: "processing", label: "Extraction in progress", session: owner, projects: [project, processingProject], processingJob: { id: "job-member-portal", projectId: "member-portal", stage: "extracting", message: "Extracting text and structure", progress: 42 }, lens: { selectedPrdIds: [], mode: "highlight" } },
  "approved-result": { id: "approved-result", label: "Approved Atlas and CES result", session: owner, projects: [project], workspace: { ...workspace, atlasApproval: "approved", cesApproval: "approved", cesItems: workspace.cesItems.map((item) => ({ ...item, coverage: "covered" })) }, lens: { selectedPrdIds: [], mode: "highlight" } },
  "needs-attention": { id: "needs-attention", label: "Processing needs attention", session: owner, projects: [attentionProject], processingJob: { id: "job-supplier-access", projectId: "supplier-access", stage: "failed", message: "Needs attention: re-upload the protected PDF", progress: 68 }, lens: { selectedPrdIds: [], mode: "highlight" } },
};

export function getFixtureScenario(id: FixtureScenario["id"] = "owner-ready") {
  return fixtureScenarios[id];
}

// Compatibility export for the initial demo while screens move to named scenarios.
export const atlasWorkspaceFixture = getFixtureScenario("owner-ready");
