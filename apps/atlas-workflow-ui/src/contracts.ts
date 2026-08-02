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
  readonly relationship_status: "proposed" | "pending" | "approved" | "rejected";
}

export interface DetailIndexEntry {
  readonly subject_id: string;
  readonly revision: number;
  readonly href: string;
}

export interface DetailProjection {
  readonly schema_version: "1.0.0";
  readonly subject_id: string;
  readonly revision: number;
  readonly label: string;
  readonly nodes: readonly OverviewNode[];
  readonly edges: readonly OverviewEdge[];
  readonly tabs: readonly FocusedTabProjection[];
}

export type FocusedTabKind = "flow" | "rules" | "validations" | "permissions"
  | "states" | "evidence" | "approval";

export interface FocusedTabItem {
  readonly item_id: string;
  readonly canonical_concept_id: string;
  readonly label: string;
  readonly evidence_id?: string;
  readonly equivalence_status: "independent" | "pending_review" | "accepted";
  readonly representation_count: number;
}

export interface FocusedTabProjection {
  readonly tab: FocusedTabKind;
  readonly explicitly_empty: boolean;
  readonly items: readonly FocusedTabItem[];
}

export interface EvidenceIndexEntry {
  readonly evidence_id: string;
  readonly revision: number;
  readonly access_href: string;
}

export interface SourceRepresentation {
  readonly representation_id: string;
  readonly exact_text: string;
  readonly language: string;
  readonly document_id: string;
  readonly page: number;
  readonly section: string;
  readonly source_unit_id: string;
  readonly span_start: number;
  readonly span_end: number;
  readonly bounding_box?: readonly [number, number, number, number];
}

export interface SourceEvidenceProjection {
  readonly schema_version: "1.0.0";
  readonly project_id: string;
  readonly revision: number;
  readonly evidence_id: string;
  readonly canonical_concept_id: string;
  readonly primary_representation_id: string;
  readonly primary_selection_reason: string;
  readonly representations: readonly SourceRepresentation[];
  readonly canonical_wording?: string;
  readonly canonical_language?: string;
  readonly access_event: {
    readonly audit_event_id: string;
    readonly accessed_at: string;
  };
  readonly trace: {
    readonly document_id: string;
    readonly source_unit_id: string;
    readonly atomic_claim_id: string;
    readonly canonical_record_id: string;
    readonly workflow_id?: string;
    readonly operation_id?: string;
  };
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
  readonly revision: number;
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
  readonly detail_index: readonly DetailIndexEntry[];
  readonly evidence_index: readonly EvidenceIndexEntry[];
}

export type WorkspaceState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "empty" }
  | { readonly kind: "missing_projection"; readonly projectLabel: string }
  | { readonly kind: "stale"; readonly payload: AtlasWorkspacePayload }
  | { readonly kind: "ready"; readonly payload: AtlasWorkspacePayload };
