export const MODEL_KINDS = [
  "activity_flow", "business_workflow", "bpmn_candidate",
  "functional_decomposition", "module_dependency", "state_diagram",
  "decision_model", "actor_goal_model", "sequence_interaction",
  "conceptual_data_model",
] as const;

export type ModelKind = typeof MODEL_KINDS[number];
export type SupportStatus = "supported" | "partially_supported"
  | "human_review_required" | "insufficient_evidence"
  | "conflicting_evidence" | "not_applicable";
export type ProjectionEligibility = "normal_proposed" | "review_only_partial"
  | "review_preview" | "exception_only" | "none";

export interface ModelSupport {
  readonly model_kind: ModelKind;
  readonly support_status: SupportStatus;
  readonly projection_eligibility: ProjectionEligibility;
  readonly missing_evidence: readonly string[];
  readonly rationale: string;
}

export interface OverviewWorkflow {
  readonly workflow_id: string;
  readonly semantic_role: string;
  readonly label: string;
  readonly summary: string;
  readonly operation_count: number;
}

export interface OverviewNode {
  readonly node_id: string;
  readonly node_kind: string;
  readonly label: string;
}

export interface OverviewEdge {
  readonly edge_id: string;
  readonly from_node_id: string;
  readonly to_node_id: string;
  readonly relationship_kind: string;
  readonly outcome_label?: string;
}

export interface SourceDocument {
  readonly document_id: string;
  readonly label: string;
  readonly media_type: string;
}

export interface AtlasWorkspacePayload {
  readonly schema_version: "1.0.0";
  readonly project: { readonly id: string; readonly label: string };
  readonly lifecycle: "review_in_progress" | "approved";
  readonly authoritative: boolean;
  readonly downstream_execution_allowed: boolean;
  readonly stale: boolean;
  readonly summaries: {
    readonly records: number;
    readonly eligible: number;
    readonly exceptions: number;
  };
  readonly model_support: readonly ModelSupport[];
  readonly project_overview: {
    readonly workflows: readonly OverviewWorkflow[];
    readonly nodes: readonly OverviewNode[];
    readonly edges: readonly OverviewEdge[];
  };
  readonly source_documents: readonly SourceDocument[];
}

export type WorkspaceState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "empty" }
  | { readonly kind: "missing_projection"; readonly projectLabel: string }
  | { readonly kind: "stale"; readonly payload: AtlasWorkspacePayload }
  | { readonly kind: "ready"; readonly payload: AtlasWorkspacePayload };
