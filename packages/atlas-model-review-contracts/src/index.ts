import { z } from "zod";

export const ATLAS_MODEL_REVIEW_CONTRACT_VERSION = "1.0.0" as const;
export const ATLAS_WORKSPACE_CONTRACT = "atlas.model-review.workspace" as const;

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Text = z.string().trim().min(1);
const Sha256 = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Version = z.string().regex(/^\d+\.\d+\.\d+$/u);
const RelativePath = z.string().regex(/^\/(?!\/)[^\s]*$/u);

export const ContractMetadataSchema = z.object({
  contract_name: z.literal(ATLAS_WORKSPACE_CONTRACT),
  contract_version: z.literal(ATLAS_MODEL_REVIEW_CONTRACT_VERSION),
  producer_version: Text,
  projection_schema_version: Version,
  evidence_schema_version: Version,
  command_schema_version: Version,
}).strict();

export const ReviewStatusSchema = z.enum([
  "proposed", "pending", "approved", "rejected", "correction_requested",
]);
export const OriginSchema = z.enum(["explicit", "derived", "human_added"]);

const ProjectionNodeBase = z.object({
  projection_node_id: Id,
  projection_kind: Id,
  node_kind: Id,
  label: Text,
  review_status: ReviewStatusSchema,
  authoritative: z.boolean(),
}).strict();

export const CanonicalProjectionNodeSchema = ProjectionNodeBase.extend({
  identity_kind: z.literal("canonical_concept"),
  canonical_concept_id: Id,
  evidence_ids: z.array(Id).min(1),
}).strict();

export const ProjectionConstructNodeSchema = ProjectionNodeBase.extend({
  identity_kind: z.literal("projection_construct"),
  projection_construct_id: Id,
  projection_construct_kind: Id,
  derived_from_relationship_ids: z.array(Id).min(1),
  evidence_ids: z.array(Id).max(0),
  authoritative: z.literal(false),
}).strict();

export const ProjectionNodeSchema = z.discriminatedUnion("identity_kind", [
  CanonicalProjectionNodeSchema,
  ProjectionConstructNodeSchema,
]);

const ProjectionEdgeBase = z.object({
  projection_edge_id: Id,
  projection_kind: Id,
  from_projection_node_id: Id,
  to_projection_node_id: Id,
  relationship_kind: Id,
  relationship_status: ReviewStatusSchema,
  authoritative: z.boolean(),
}).strict();

export const GovernedProjectionEdgeSchema = ProjectionEdgeBase.extend({
  identity_kind: z.literal("governed_relationship"),
  canonical_relationship_id: Id,
  origin: OriginSchema,
  evidence_ids: z.array(Id).min(1),
  rationale: Text,
}).strict();

export const ProjectionConstructEdgeSchema = ProjectionEdgeBase.extend({
  identity_kind: z.literal("projection_construct"),
  projection_construct_id: Id,
  derived_from_relationship_ids: z.array(Id).min(1),
  evidence_ids: z.array(Id).max(0),
  authoritative: z.literal(false),
}).strict();

export const ProjectionEdgeSchema = z.discriminatedUnion("identity_kind", [
  GovernedProjectionEdgeSchema,
  ProjectionConstructEdgeSchema,
]);

export const OverviewRoleSchema = z.enum([
  "major_business_area", "shared_data", "context_provider",
  "significant_decision", "significant_state", "governed_bridge",
]);

export const OverviewNodeSchema = z.object({
  node: ProjectionNodeSchema,
  overview_eligible: z.boolean(),
  overview_priority: z.number().int().min(0).max(100),
  overview_role: OverviewRoleSchema,
  overview_inclusion_reason: Text,
  default_visible: z.boolean(),
}).strict();

export const ProjectionBudgetSchema = z.object({
  max_initial_nodes: z.number().int().positive(),
  max_initial_edges: z.number().int().positive(),
  max_initial_payload_bytes: z.number().int().positive(),
  max_initial_layout_ms: z.number().int().positive(),
}).strict();

export const OverviewSummarySchema = z.object({
  node_count: z.number().int().nonnegative(),
  edge_count: z.number().int().nonnegative(),
  is_truncated: z.boolean(),
  available_layer_ids: z.array(Id),
  artifact_hashes: z.array(Sha256),
  schema_versions: z.array(Version).min(1),
  revision: z.number().int().positive(),
  next_cursor: Text.optional(),
  budget: ProjectionBudgetSchema,
}).strict().superRefine((value, context) => {
  if (value.node_count > value.budget.max_initial_nodes && !value.is_truncated) {
    context.addIssue({ code: "custom", message: "Over-budget overview must be truncated" });
  }
  if (value.edge_count > value.budget.max_initial_edges && !value.is_truncated) {
    context.addIssue({ code: "custom", message: "Over-budget overview must be truncated" });
  }
});

export const LayoutMetadataSchema = z.object({
  layout_engine: z.literal("elkjs"),
  layout_engine_version: Version,
  layout_profile: Id,
  layout_algorithm: Id,
  direction: z.enum(["UP", "DOWN", "LEFT", "RIGHT"]),
  node_order: z.array(Id),
  edge_order: z.array(Id),
  layout_input_hash: Sha256,
  layout_options_hash: Sha256,
}).strict();

export const PdfLocationSchema = z.object({
  page_number: z.number().int().positive(),
  page_number_base: z.literal(1),
  bounding_box: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
    coordinate_space: z.literal("normalized_page"),
    origin: z.literal("top_left"),
    page_rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    page_width: z.number().positive(),
    page_height: z.number().positive(),
    crop_box: z.object({ x: z.number(), y: z.number(), width: z.number().positive(),
      height: z.number().positive() }).strict().optional(),
  }).strict().superRefine((box, context) => {
    if (box.x + box.width > 1 || box.y + box.height > 1) {
      context.addIssue({ code: "custom", message: "Normalized bounding box exceeds page" });
    }
  }),
}).strict();

export const SourceRepresentationSchema = z.object({
  representation_id: Id,
  exact_text: Text,
  language: Text,
  document_id: Id,
  source_unit_id: Id,
  text_span: z.object({ start: z.number().int().nonnegative(),
    end: z.number().int().positive() }).strict()
    .refine(({ start, end }) => end > start, "Text span end must exceed start"),
  pdf_location: PdfLocationSchema.optional(),
}).strict();

export const RepresentationTraceSchema = z.object({
  representation_id: Id,
  document_id: Id,
  source_unit_id: Id,
  atomic_claim_id: Id,
  canonical_record_id: Id,
  workflow_id: Id.optional(),
  operation_id: Id.optional(),
}).strict();

export const SourceEvidenceProjectionSchema = z.object({
  evidence_id: Id,
  canonical_concept_id: Id,
  representations: z.array(SourceRepresentationSchema).min(1),
  traces: z.array(RepresentationTraceSchema).min(1),
}).strict().superRefine((value, context) => {
  const representationIds = new Set(value.representations.map(({ representation_id }) =>
    representation_id));
  const traceCounts = new Map<string, number>();
  for (const trace of value.traces) {
    traceCounts.set(trace.representation_id, (traceCounts.get(trace.representation_id) ?? 0) + 1);
    if (!representationIds.has(trace.representation_id)) {
      context.addIssue({ code: "custom", message: "Trace references unknown representation" });
    }
  }
  for (const id of representationIds) {
    if (traceCounts.get(id) !== 1) {
      context.addIssue({ code: "custom", message: "Every representation requires one trace" });
    }
  }
});

const BlockedExecutionSchema = z.object({
  status: z.literal("blocked"), blockers: z.array(Id).min(1),
}).strict();
const AllowedExecutionSchema = z.object({ status: z.literal("allowed") }).strict();

export const WorkspaceAuthoritySchema = z.discriminatedUnion("lifecycle", [
  z.object({ lifecycle: z.literal("review_in_progress"),
    authority: z.literal("non_authoritative"),
    downstream_execution: BlockedExecutionSchema }).strict(),
  z.object({ lifecycle: z.literal("approved"),
    authority: z.literal("authoritative"),
    downstream_execution: z.discriminatedUnion("status", [
      AllowedExecutionSchema, BlockedExecutionSchema,
    ]) }).strict(),
]);

export const ModelReviewWorkspaceSchema = ContractMetadataSchema.extend({
  project_id: Id,
  revision: z.number().int().positive(),
  authority: WorkspaceAuthoritySchema,
  overview: z.object({
    nodes: z.array(OverviewNodeSchema),
    edges: z.array(ProjectionEdgeSchema),
    summary: OverviewSummarySchema,
    layout: LayoutMetadataSchema,
  }).strict(),
}).strict();

export const DecisionCommandSchema = z.object({
  contract_name: z.literal("atlas.model-review.decision-command"),
  contract_version: z.literal(ATLAS_MODEL_REVIEW_CONTRACT_VERSION),
  project_id: Id,
  proposal_revision: z.number().int().positive(),
  subject_ids: z.array(Id).min(1),
  action: z.enum(["approve", "reject", "request_correction", "reclassify",
    "change_assignment", "add_relationship", "remove_relationship", "split", "merge"]),
  note: Text,
  idempotency_key: Text,
  csrf_token: Text,
}).strict();

export const DecisionReceiptSchema = z.object({
  contract_name: z.literal("atlas.model-review.decision-receipt"),
  contract_version: z.literal(ATLAS_MODEL_REVIEW_CONTRACT_VERSION),
  project_id: Id,
  proposal_revision: z.number().int().positive(),
  decision_id: Id,
  audit_event_id: Id,
  reviewer: z.object({ kind: z.literal("human"), display_name: Text }).strict(),
  materialized_workspace_path: RelativePath,
}).strict();

export type ContractCompatibility = "current" | "migration_required" | "unsupported";

export function classifyContractCompatibility(input: {
  readonly contract_name?: string;
  readonly contract_version?: string;
  readonly migration_adapter_versions?: readonly string[];
}): ContractCompatibility {
  if (input.contract_name !== ATLAS_WORKSPACE_CONTRACT || !input.contract_version) {
    return "unsupported";
  }
  if (input.contract_version === ATLAS_MODEL_REVIEW_CONTRACT_VERSION) return "current";
  return input.migration_adapter_versions?.includes(input.contract_version)
    ? "migration_required" : "unsupported";
}

export type ProjectionNode = z.infer<typeof ProjectionNodeSchema>;
export type ProjectionEdge = z.infer<typeof ProjectionEdgeSchema>;
export type ModelReviewWorkspace = z.infer<typeof ModelReviewWorkspaceSchema>;
export type SourceEvidenceProjection = z.infer<typeof SourceEvidenceProjectionSchema>;
