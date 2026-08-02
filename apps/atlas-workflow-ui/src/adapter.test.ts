import { describe, expect, it } from "vitest";
import { adaptWorkspacePayload, hasCompleteModelRegistry, visibleModels } from "./adapter.js";
import { MODEL_KINDS, type AtlasWorkspacePayload } from "./contracts.js";
import { renderWorkspaceState } from "./render.js";

const payload = {
  schema_version: "1.0.0",
  project: { id: "project.example", label: "Example project" },
  lifecycle: "review_in_progress",
  authoritative: false,
  downstream_execution_allowed: false,
  stale: false,
  revision: 1,
  summaries: { records: 3, eligible: 2, exceptions: 1 },
  model_support: MODEL_KINDS.map((model_kind, index) => ({
    model_kind,
    support_status: index === 0 ? "supported" as const
      : index === 1 ? "partially_supported" as const
        : "insufficient_evidence" as const,
    projection_eligibility: index === 0 ? "normal_proposed" as const
      : index === 1 ? "review_only_partial" as const : "none" as const,
    missing_evidence: index === 1 ? ["ordered pair"] : [],
    rationale: "Backend assessment.",
  })),
  project_overview: {
    workflows: [{ workflow_id: "project.workflow.one", semantic_role: "business_workflow",
      label: "Primary workflow", summary: "A workflow.", operation_count: 2 }],
    nodes: [{ node_id: "project.workflow.one", node_kind: "business_workflow",
      label: "Primary workflow" }],
    edges: [],
  },
  source_documents: [{ document_id: "project.document.one", label: "Requirements",
    media_type: "application/pdf" }],
  detail_index: [{ subject_id: "project.workflow.one", revision: 1,
    href: "/api/atlas/workflows/project.workflow.one" }, {
    subject_id: "model.activity_flow", revision: 1,
    href: "/api/atlas/models/activity-flow" }, {
    subject_id: "model.business_workflow", revision: 1,
    href: "/api/atlas/models/business-workflow" }],
} satisfies AtlasWorkspacePayload;

describe("ATLAS-UI-001 workspace foundation", () => {
  it("renders three panes and persistent authority status from backend data", () => {
    const state = adaptWorkspacePayload(payload);
    const html = renderWorkspaceState(state);
    expect(html).toContain("workspace-grid");
    expect(html).toContain("navigation-pane");
    expect(html).toContain("graph-pane");
    expect(html).toContain("source-pane");
    expect(html).toContain("Proposed — not approved");
    expect(html).toContain("Downstream blocked");
    expect(html).toContain("Primary workflow");
    expect(html).not.toContain("Safara");
  });

  it("shows only supported and explicitly incomplete preview models", () => {
    expect(hasCompleteModelRegistry(payload.model_support)).toBe(true);
    expect(visibleModels(payload.model_support).map(({ model_kind }) => model_kind))
      .toEqual(["activity_flow", "business_workflow"]);
    const html = renderWorkspaceState(adaptWorkspacePayload(payload));
    expect(html).toContain("Review-only");
    expect(html).toContain("Missing: ordered pair");
    expect(html).not.toContain("BPMN candidate");
  });

  it("renders loading, empty, invalid, missing, and stale states", () => {
    expect(renderWorkspaceState({ kind: "loading" })).toContain("Loading");
    expect(renderWorkspaceState(adaptWorkspacePayload(null))).toContain("No project selected");
    expect(renderWorkspaceState(adaptWorkspacePayload({}))).toContain("missing required");
    const missing = { ...payload, project_overview: { workflows: [], nodes: [], edges: [] },
      model_support: payload.model_support.map((model) => ({ ...model,
        support_status: "not_applicable" as const, projection_eligibility: "none" as const })) };
    expect(renderWorkspaceState(adaptWorkspacePayload(missing))).toContain("No supported projection");
    expect(renderWorkspaceState(adaptWorkspacePayload({ ...payload, stale: true })))
      .toContain("Stale data");
  });

  it("escapes project-provided display content", () => {
    const html = renderWorkspaceState(adaptWorkspacePayload({
      ...payload, project: { ...payload.project, label: "<script>alert(1)</script>" },
    }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
