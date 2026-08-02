import {
  MODEL_KINDS,
  type AtlasWorkspacePayload,
  type ModelKind,
  type ModelSupport,
  type WorkspaceState,
} from "./contracts.js";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function requirePayload(value: unknown): AtlasWorkspacePayload {
  if (!isObject(value) || value.schema_version !== "1.0.0"
    || !isObject(value.project) || typeof value.project.id !== "string"
    || typeof value.project.label !== "string"
    || !isObject(value.project_overview)
    || !Array.isArray(value.project_overview.workflows)
    || !Array.isArray(value.project_overview.nodes)
    || !Array.isArray(value.project_overview.edges)
    || !Array.isArray(value.model_support)
    || !Array.isArray(value.source_documents)) {
    throw new Error("Atlas workspace projection is missing required versioned fields");
  }
  return value as unknown as AtlasWorkspacePayload;
}

export function adaptWorkspacePayload(value: unknown): WorkspaceState {
  if (value === null || value === undefined) return { kind: "empty" };
  try {
    const payload = requirePayload(value);
    if (payload.project_overview.workflows.length === 0
      && payload.model_support.every(({ projection_eligibility }) =>
        projection_eligibility === "none")) {
      return { kind: "missing_projection", projectLabel: payload.project.label };
    }
    return payload.stale ? { kind: "stale", payload } : { kind: "ready", payload };
  } catch (error) {
    return { kind: "error", message: error instanceof Error
      ? error.message : "Atlas workspace projection could not be read" };
  }
}

export function visibleModels(models: readonly ModelSupport[]): readonly ModelSupport[] {
  return models.filter(({ support_status, projection_eligibility }) =>
    ["supported", "partially_supported", "human_review_required"].includes(support_status)
    && ["normal_proposed", "review_only_partial", "review_preview"]
      .includes(projection_eligibility));
}

export function modelLabel(kind: ModelKind): string {
  const labels: Record<ModelKind, string> = {
    activity_flow: "Activity flow",
    business_workflow: "Business workflow",
    bpmn_candidate: "BPMN candidate",
    functional_decomposition: "Functional decomposition",
    module_dependency: "Module dependency",
    state_diagram: "State diagram",
    decision_model: "Decision model",
    actor_goal_model: "Actor and goal model",
    sequence_interaction: "Sequence interaction",
    conceptual_data_model: "Conceptual data model",
  };
  return labels[kind];
}

export function hasCompleteModelRegistry(models: readonly ModelSupport[]): boolean {
  const kinds = new Set(models.map(({ model_kind }) => model_kind));
  return MODEL_KINDS.every((kind) => kinds.has(kind));
}
