import {
  AtlasUncertaintySchema,
  type AtlasProviderResult,
} from "@company/ces-agent-provider-sdk";
import type { AtlasReviewOutput } from "@company/ces-atlas-review";
import {
  ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
  ATLAS_DETAIL_CONTRACT,
  ATLAS_DETAIL_INDEX_CONTRACT,
  ATLAS_WORKSPACE_CONTRACT,
  ModelReviewDetailIndexSchema,
  ModelReviewDetailSchema,
  ModelReviewWorkspaceSchema,
  ProjectionEdgeSchema,
} from "@company/ces-atlas-model-review-contracts";
import {
  RequirementLinkSchema,
  type RequirementLink,
} from "@company/ces-greenfield-contracts";
import { compilePolicyManifest } from "@company/ces-policy-engine";
import type { PolicyManifest } from "@company/ces-policy-manifest";
import {
  ProjectAssuranceContextSchema,
} from "@company/ces-project-schema";
import { ProposedProjectModelSchema } from "@company/ces-proposed-project-model";
import {
  assertCollectionPackages,
  canonicalJson,
  requirementRevisionHash,
} from "@company/ces-requirement-collection-schema";
import type { RequirementPackage } from "@company/ces-requirement-schema";
import { z } from "zod";

export const ATLAS_INTENT_GRAPH_VERSION = "1.0.0" as const;
export const ATLAS_WORKFLOW_GRAPH_VERSION = "1.0.0" as const;
export const ATLAS_FOCUSED_PROJECTION_VERSION = "1.0.0" as const;
export const ATLAS_INTEGRATED_GRAPH_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const StableId = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);

const ReviewStateSchema = z.enum([
  "pending", "approved", "rejected", "correction_requested", "ambiguous",
  "unsupported", "conflict", "source_missing",
]);

const IntegratedLayerSchema = z.enum([
  "actors", "modules", "workflows", "decisions", "states",
  "conceptual_entities", "rules", "evidence",
]);

const IntegratedNodeSchema = z.object({
  node_id: StableId,
  canonical_id: StableId,
  node_kind: NonEmptyString,
  label: NonEmptyString,
  source_unit_ids: z.array(StableId),
}).strict();

const IntegratedEdgeSchema = z.object({
  edge_id: StableId,
  from_id: StableId,
  to_id: StableId,
  relationship_kind: NonEmptyString,
  source_unit_ids: z.array(StableId),
  review_status: z.literal("pending"),
}).strict();

export const IntegratedSemanticGraphProjectionSchema = z.object({
  schema_version: z.literal(ATLAS_INTEGRATED_GRAPH_VERSION),
  model_hash: Sha256Schema,
  index: z.object({
    summary_artifact: NonEmptyString,
    layers: z.array(z.object({
      layer: IntegratedLayerSchema,
      artifact: NonEmptyString,
      node_count: z.number().int().nonnegative(),
      edge_count: z.number().int().nonnegative(),
    }).strict()),
  }).strict(),
  summary: z.object({
    node_count: z.number().int().nonnegative(),
    edge_count: z.number().int().nonnegative(),
    layer_counts: z.record(IntegratedLayerSchema, z.number().int().nonnegative()),
  }).strict(),
  layers: z.array(z.object({
    layer: IntegratedLayerSchema,
    nodes: z.array(IntegratedNodeSchema),
    edges: z.array(IntegratedEdgeSchema),
  }).strict()),
  model_projection_index: z.object({
    projections: z.array(z.object({
      model_kind: NonEmptyString,
      support_status: NonEmptyString,
      projection_eligibility: z.enum([
        "normal_proposed", "review_only_partial", "review_preview",
      ]),
      artifact: NonEmptyString,
      review_status: z.literal("pending"),
    }).strict()),
    excluded: z.array(z.object({
      model_kind: NonEmptyString,
      support_status: NonEmptyString,
      reason: NonEmptyString,
    }).strict()),
  }).strict(),
  model_projections: z.array(z.object({
    artifact: NonEmptyString,
    model_kind: NonEmptyString,
    support_status: NonEmptyString,
    projection_eligibility: NonEmptyString,
    layers: z.array(IntegratedLayerSchema),
    nodes: z.array(IntegratedNodeSchema),
    edges: z.array(IntegratedEdgeSchema),
  }).strict()),
}).strict();

export function createIntegratedSemanticGraphProjection(input: {
  readonly model: z.input<typeof ProposedProjectModelSchema>;
}): z.infer<typeof IntegratedSemanticGraphProjectionSchema> {
  const model = ProposedProjectModelSchema.parse(input.model);
  type Layer = z.infer<typeof IntegratedLayerSchema>;
  const layerNames = IntegratedLayerSchema.options;
  const nodes = new Map<Layer, z.infer<typeof IntegratedNodeSchema>[]>(
    layerNames.map((layer) => [layer, []]),
  );
  const edges = new Map<Layer, z.infer<typeof IntegratedEdgeSchema>[]>(
    layerNames.map((layer) => [layer, []]),
  );
  const recordLayer = (kind: string): Layer => {
    if (/rule|control|constraint|permission/u.test(kind)) return "rules";
    if (/decision/u.test(kind)) return "decisions";
    if (/state/u.test(kind)) return "states";
    if (/entity|data|terminology/u.test(kind)) return "conceptual_entities";
    if (/module|capability/u.test(kind)) return "modules";
    return "evidence";
  };
  for (const record of model.records) {
    nodes.get(recordLayer(record.semantic_kind_id))!.push({
      node_id: record.id, canonical_id: record.id,
      node_kind: record.semantic_kind_id, label: record.statement,
      source_unit_ids: [...record.source_unit_ids].sort(compareText),
    });
  }
  const actorIds = new Set<string>();
  for (const operation of model.operations) {
    nodes.get(operation.operation_kind === "decision" ? "decisions" : "workflows")!.push({
      node_id: operation.operation_id, canonical_id: operation.operation_id,
      node_kind: operation.operation_kind, label: operation.label,
      source_unit_ids: operation.semantic_record_ids.flatMap((id) =>
        model.records.find((record) => record.id === id)?.source_unit_ids ?? []),
    });
    if (operation.actor) actorIds.add(operation.actor);
  }
  for (const actor of [...actorIds].sort(compareText)) {
    const id = `${model.project_id}.actor.${safeId(actor)}`;
    nodes.get("actors")!.push({
      node_id: id, canonical_id: id, node_kind: "actor", label: actor,
      source_unit_ids: [],
    });
  }
  for (const workflow of model.workflows) {
    nodes.get("workflows")!.push({
      node_id: workflow.workflow_id, canonical_id: workflow.workflow_id,
      node_kind: "workflow", label: workflow.label, source_unit_ids: [],
    });
  }
  for (const edge of model.workflow_edges) {
    edges.get("workflows")!.push({
      edge_id: edge.edge_id, from_id: edge.from_operation_id,
      to_id: edge.to_operation_id, relationship_kind: edge.edge_kind,
      source_unit_ids: [...edge.governance.evidence_source_unit_ids].sort(compareText),
      review_status: "pending",
    });
  }
  for (const relationship of model.relationship_candidates) {
    for (const target of relationship.targets) {
      if (!target.target_id) continue;
      const layer = model.workflows.some(({ workflow_id }) =>
        workflow_id === relationship.from_id)
        ? "workflows"
        : recordLayer(
          model.records.find(({ id }) => id === relationship.from_id)?.semantic_kind_id ?? "",
        );
      edges.get(layer)!.push({
        edge_id: target.target_candidate_id, from_id: relationship.from_id,
        to_id: target.target_id, relationship_kind: relationship.relationship_kind,
        source_unit_ids: [...new Set([
          ...relationship.governance.evidence_source_unit_ids,
          ...target.evidence_source_unit_ids,
        ])].sort(compareText),
        review_status: "pending",
      });
    }
  }
  const layers = layerNames.map((layer) => ({
    layer,
    nodes: nodes.get(layer)!.sort((a, b) => compareText(a.node_id, b.node_id)),
    edges: edges.get(layer)!.sort((a, b) => compareText(a.edge_id, b.edge_id)),
  }));
  const artifact = (layer: Layer) =>
    `proposed-integrated-semantic-graph/${layer.replaceAll("_", "-")}.json`;
  const eligible = new Set(["normal_proposed", "review_only_partial", "review_preview"]);
  const projectionLayers: Record<string, Layer[]> = {
    activity_flow: ["workflows"], business_workflow: ["actors", "workflows", "decisions"],
    bpmn_candidate: ["actors", "workflows", "decisions"],
    functional_decomposition: ["modules"], module_dependency: ["modules"],
    state_diagram: ["states"], decision_model: ["decisions", "rules"],
    actor_goal_model: ["actors", "modules"], sequence_interaction: ["actors", "workflows"],
    conceptual_data_model: ["conceptual_entities"],
  };
  const eligibleAssessments = model.model_support.filter((item) =>
    eligible.has(item.projection_eligibility));
  const modelProjections = eligibleAssessments.map((item) => {
    const selected = projectionLayers[item.model_kind] ?? ["evidence"];
    const slices = layers.filter(({ layer }) => selected.includes(layer));
    return {
      artifact: `proposed-model-projections/${item.model_kind}.json`,
      model_kind: item.model_kind, support_status: item.support_status,
      projection_eligibility: item.projection_eligibility,
      layers: selected,
      nodes: slices.flatMap((slice) => slice.nodes),
      edges: slices.flatMap((slice) => slice.edges),
    };
  });
  return IntegratedSemanticGraphProjectionSchema.parse({
    schema_version: ATLAS_INTEGRATED_GRAPH_VERSION,
    model_hash: model.content_hash,
    index: {
      summary_artifact: "proposed-integrated-semantic-graph/summary.json",
      layers: layers.map((slice) => ({
        layer: slice.layer, artifact: artifact(slice.layer),
        node_count: slice.nodes.length, edge_count: slice.edges.length,
      })),
    },
    summary: {
      node_count: layers.reduce((sum, layer) => sum + layer.nodes.length, 0),
      edge_count: layers.reduce((sum, layer) => sum + layer.edges.length, 0),
      layer_counts: Object.fromEntries(layers.map((layer) =>
        [layer.layer, layer.nodes.length])),
    },
    layers,
    model_projection_index: {
      projections: eligibleAssessments.map((item) => ({
        model_kind: item.model_kind,
        support_status: item.support_status,
        projection_eligibility: item.projection_eligibility as
          "normal_proposed" | "review_only_partial" | "review_preview",
        artifact: `proposed-model-projections/${item.model_kind}.json`,
        review_status: "pending" as const,
      })),
      excluded: model.model_support.filter((item) =>
        !eligible.has(item.projection_eligibility)).map((item) => ({
        model_kind: item.model_kind,
        support_status: item.support_status,
        reason: item.rationale,
      })),
    },
    model_projections: modelProjections,
  });
}

export const FocusedProjectionBundleSchema = z.object({
  schema_version: z.literal(ATLAS_FOCUSED_PROJECTION_VERSION),
  model_revision: z.number().int().positive(),
  model_hash: Sha256Schema,
  model_lifecycle: z.enum(["review_in_progress", "approved"]),
  authoritative: z.boolean(),
  downstream_execution_allowed: z.boolean(),
  project_overview: z.object({
    workflows: z.array(z.object({
      workflow_id: StableId,
      semantic_role: z.enum([
        "business_workflow", "shared_data", "context_provider",
        "state_workflow", "reporting_audit",
      ]),
      label: NonEmptyString,
      summary: NonEmptyString,
      operation_count: z.number().int().nonnegative(),
      review_status: z.literal("pending"),
    }).strict()),
    relationships: z.array(z.object({
      relationship_id: StableId,
      from_workflow_id: StableId,
      to_workflow_id: StableId,
      relationship_kind: NonEmptyString,
      review_status: z.literal("pending"),
    }).strict()),
    nodes: z.array(z.object({
      node_id: StableId,
      node_kind: z.enum([
        "business_workflow", "shared_data", "context_provider",
        "state_workflow", "reporting_audit", "decision", "state",
      ]),
      state_value_id: StableId.optional(),
      label: NonEmptyString,
      review_status: z.literal("pending"),
    }).strict()),
    edges: z.array(z.object({
      edge_id: StableId,
      from_node_id: StableId,
      to_node_id: StableId,
      relationship_kind: NonEmptyString,
      outcome_label: NonEmptyString.optional(),
      review_status: z.literal("pending"),
    }).strict()),
    duplicate_decision_state_labels: z.array(z.object({
      normalized_label: NonEmptyString,
      node_ids: z.array(StableId).min(2),
    }).strict()),
  }).strict(),
  workflow_details: z.array(z.object({
    workflow_id: StableId,
    operations: z.array(z.object({
      operation_id: StableId,
      label: NonEmptyString,
      operation_kind: NonEmptyString,
      state_value_id: StableId.optional(),
      semantic_record_ids: z.array(StableId),
    }).strict()),
    edges: z.array(z.object({
      edge_id: StableId,
      from_operation_id: StableId,
      to_operation_id: StableId,
      edge_kind: NonEmptyString,
    }).strict()),
  }).strict()),
  rules_controls_index: z.object({
    artifacts: z.array(z.object({
      artifact: NonEmptyString,
      slice_id: StableId,
      partition_type: z.enum(["workflow", "cross_cutting", "unassigned"]),
      partition_id: StableId,
      item_count: z.number().int().nonnegative(),
      cursor: NonEmptyString,
      next_cursor: NonEmptyString.optional(),
    }).strict()),
  }).strict(),
  rules_controls_slices: z.array(z.object({
    artifact: NonEmptyString,
    slice_id: StableId,
    partition_type: z.enum(["workflow", "cross_cutting", "unassigned"]),
    partition_id: StableId,
    cursor: NonEmptyString,
    next_cursor: NonEmptyString.optional(),
    items: z.array(z.object({
      record_id: StableId,
      semantic_kind_id: StableId,
      statement: NonEmptyString,
      source_unit_ids: z.array(StableId).min(1),
    }).strict()),
  }).strict()),
  traceability: z.array(z.object({
    record_id: StableId,
    candidate_ids: z.array(StableId),
    source_unit_ids: z.array(StableId),
    semantic_fingerprint: Sha256Schema,
  }).strict()),
  approval_exceptions: z.array(z.object({
    entity_type: z.enum(["record", "assignment", "relationship", "workflow_edge"]),
    entity_id: StableId,
    blockers: z.array(StableId).min(1),
  }).strict()),
  relationship_review: z.array(z.object({
    review_subject_id: StableId,
    subject_type: z.enum(["relationship_target", "workflow_edge"]),
    from_id: StableId,
    to_id: StableId,
    relationship_kind: NonEmptyString,
    origin: z.enum(["explicit", "derived", "human_added"]),
    evidence_source_unit_ids: z.array(StableId),
    rationale: NonEmptyString,
    confidence: z.number().min(0).max(1),
    review_status: z.literal("pending"),
    bulk_approval_eligible: z.boolean(),
    blockers: z.array(StableId),
    authoritative: z.literal(false),
  }).strict()),
  content_hash: Sha256Schema,
}).strict().superRefine((value, context) => {
  const approved = value.model_lifecycle === "approved";
  if (value.authoritative !== approved || value.downstream_execution_allowed !== approved) {
    context.addIssue({ code: "custom", message: "Focused projection lifecycle authority mismatch" });
  }
});

export function createFocusedAtlasProjections(input: {
  readonly model: z.input<typeof ProposedProjectModelSchema>;
  readonly page_size?: number;
}): z.infer<typeof FocusedProjectionBundleSchema> {
  const model = ProposedProjectModelSchema.parse(input.model);
  const pageSize = z.number().int().min(1).max(100).parse(input.page_size ?? 25);
  const records = new Map(model.records.map((record) => [record.id, record]));
  const branchedOperationIds = new Set(model.workflow_edges
    .filter(({ edge_kind }) => edge_kind === "branch")
    .flatMap(({ from_operation_id, to_operation_id }) =>
      [from_operation_id, to_operation_id]));
  const overviewOperationNodes = model.operations
    .filter(({ operation_id }) => branchedOperationIds.has(operation_id))
    .map((operation) => ({
      node_id: operation.operation_id,
      node_kind: operation.operation_kind as "decision" | "state",
      ...(operation.state_value_id ? { state_value_id: operation.state_value_id } : {}),
      label: operation.label,
      review_status: "pending" as const,
    }));
  const workflowRelationships = model.relationship_candidates.flatMap((relationship) =>
    relationship.targets.flatMap((target) =>
      model.workflows.some(({ workflow_id }) => workflow_id === relationship.from_id)
        && target.target_id
        && model.workflows.some(({ workflow_id }) => workflow_id === target.target_id)
        ? [{
          relationship_id: target.target_candidate_id,
          from_workflow_id: relationship.from_id,
          to_workflow_id: target.target_id,
          relationship_kind: relationship.relationship_kind,
          review_status: "pending" as const,
        }] : []))
    .sort((left, right) => compareText(left.relationship_id, right.relationship_id));
  const branchEntryEdges = model.operations
    .filter(({ operation_id, operation_kind }) =>
      branchedOperationIds.has(operation_id) && operation_kind === "decision")
    .flatMap((operation) => operation.workflow_id ? [{
      edge_id: `${operation.operation_id}.evaluated-by`,
      from_node_id: operation.workflow_id,
      to_node_id: operation.operation_id,
      relationship_kind: "evaluated-by",
      review_status: "pending" as const,
    }] : []);
  const branchEdges = model.workflow_edges
    .filter(({ edge_kind, from_operation_id, to_operation_id }) =>
      edge_kind === "branch"
      && branchedOperationIds.has(from_operation_id)
      && branchedOperationIds.has(to_operation_id))
    .map((edge) => ({
      edge_id: edge.edge_id,
      from_node_id: edge.from_operation_id,
      to_node_id: edge.to_operation_id,
      relationship_kind: "branches-to",
      ...(edge.outcome_label ? { outcome_label: edge.outcome_label } : {}),
      review_status: "pending" as const,
    }));
  const satisfiedStatesByWorkflow = new Map<string, string>();
  for (const edge of model.workflow_edges.filter(({ outcome_label }) =>
    outcome_label === "condition satisfied")) {
    const operation = model.operations.find(({ operation_id }) =>
      operation_id === edge.to_operation_id);
    if (operation?.workflow_id) {
      satisfiedStatesByWorkflow.set(operation.workflow_id, operation.operation_id);
    }
  }
  const overviewEdges = workflowRelationships.map((relationship) => ({
    edge_id: relationship.relationship_id,
    from_node_id: relationship.relationship_kind.endsWith(".enables")
      ? satisfiedStatesByWorkflow.get(relationship.from_workflow_id)
        ?? relationship.from_workflow_id
      : relationship.from_workflow_id,
    to_node_id: relationship.to_workflow_id,
    relationship_kind: relationship.relationship_kind.split(".").at(-1)!,
    review_status: "pending" as const,
  }));
  const projectOverview = {
    workflows: model.workflows.map((workflow) => ({
      workflow_id: workflow.workflow_id,
      semantic_role: workflow.semantic_role,
      label: workflow.label,
      summary: workflow.summary,
      operation_count: workflow.operation_ids.length,
      review_status: "pending" as const,
    })).sort((left, right) => compareText(left.workflow_id, right.workflow_id)),
    relationships: workflowRelationships,
    nodes: [
      ...model.workflows.map((workflow) => ({
        node_id: workflow.workflow_id,
        node_kind: workflow.semantic_role,
        label: workflow.label,
        review_status: "pending" as const,
      })),
      ...overviewOperationNodes,
    ].sort((left, right) => compareText(left.node_id, right.node_id)),
    edges: [...overviewEdges, ...branchEntryEdges, ...branchEdges]
      .sort((left, right) => compareText(left.edge_id, right.edge_id)),
    duplicate_decision_state_labels: [...Map.groupBy(
      overviewOperationNodes,
      ({ label }) => label.normalize("NFKC").toLocaleLowerCase("en-US")
        .replace(/[^\p{L}\p{N}]+/gu, " ").trim(),
    )].flatMap(([normalizedLabel, nodes]) => {
      const kinds = new Set(nodes.map(({ node_kind }) => node_kind));
      return kinds.has("decision") && kinds.has("state")
        ? [{
          normalized_label: normalizedLabel,
          node_ids: nodes.map(({ node_id }) => node_id).sort(compareText),
        }] : [];
    }).sort((left, right) => compareText(left.normalized_label, right.normalized_label)),
  };
  const workflowDetails = model.workflows.map((workflow) => ({
    workflow_id: workflow.workflow_id,
    operations: model.operations.filter(({ operation_id }) =>
      workflow.operation_ids.includes(operation_id)).map((operation) => ({
      operation_id: operation.operation_id,
      label: operation.label,
      operation_kind: operation.operation_kind,
      ...(operation.state_value_id ? { state_value_id: operation.state_value_id } : {}),
      semantic_record_ids: [...operation.semantic_record_ids].sort(compareText),
    })).sort((left, right) => compareText(left.operation_id, right.operation_id)),
    edges: model.workflow_edges.filter(({ workflow_id }) =>
      workflow_id === workflow.workflow_id).map((edge) => ({
      edge_id: edge.edge_id,
      from_operation_id: edge.from_operation_id,
      to_operation_id: edge.to_operation_id,
      edge_kind: edge.edge_kind,
    })).sort((left, right) => compareText(left.edge_id, right.edge_id)),
  })).sort((left, right) => compareText(left.workflow_id, right.workflow_id));
  const workflowRecordIds = new Map(model.workflows.map((workflow) => [
    workflow.workflow_id,
    new Set(model.workflow_assignments.filter(({ workflow_id }) =>
      workflow_id === workflow.workflow_id).map(({ record_id }) => record_id)),
  ]));
  const crossCuttingRecordIds = new Map<string, Set<string>>();
  for (const assignment of model.cross_cutting_assignments) {
    const ids = crossCuttingRecordIds.get(assignment.control_area) ?? new Set<string>();
    ids.add(assignment.record_id);
    crossCuttingRecordIds.set(assignment.control_area, ids);
  }
  const assigned = new Set([
    ...model.workflow_assignments.map(({ record_id }) => record_id),
    ...model.cross_cutting_assignments.map(({ record_id }) => record_id),
  ]);
  const partitions = [
    ...[...workflowRecordIds].map(([partitionId, ids]) =>
      ({ partitionType: "workflow" as const, partitionId, ids })),
    ...[...crossCuttingRecordIds].map(([partitionId, ids]) =>
      ({ partitionType: "cross_cutting" as const, partitionId, ids })),
    {
      partitionType: "unassigned" as const,
      partitionId: "unassigned",
      ids: new Set(model.records.filter(({ id }) => !assigned.has(id)).map(({ id }) => id)),
    },
  ].filter(({ ids }) => ids.size > 0)
    .sort((left, right) => compareText(
      `${left.partitionType}:${left.partitionId}`,
      `${right.partitionType}:${right.partitionId}`,
    ));
  const slices = partitions.flatMap(({ partitionType, partitionId, ids }) => {
    const items = [...ids].map((id) => records.get(id)!).sort((left, right) =>
      compareText(left.id, right.id));
    const pages = [];
    for (let offset = 0; offset < items.length; offset += pageSize) {
      const page = Math.floor(offset / pageSize) + 1;
      const sliceId = `${model.project_id}.rules.${safeId(partitionId)}.${String(page).padStart(4, "0")}`;
      const artifact = `proposed-rules-controls/${partitionType}/${safeId(partitionId)}/${sliceId}.json`;
      const nextOffset = offset + pageSize;
      pages.push({
        artifact,
        slice_id: sliceId,
        partition_type: partitionType,
        partition_id: partitionId,
        cursor: `${model.content_hash}:${partitionType}:${partitionId}:${offset}`,
        ...(nextOffset < items.length
          ? { next_cursor: `${model.content_hash}:${partitionType}:${partitionId}:${nextOffset}` }
          : {}),
        items: items.slice(offset, nextOffset).map((record) => ({
          record_id: record.id,
          semantic_kind_id: record.semantic_kind_id,
          statement: record.statement,
          source_unit_ids: [...record.source_unit_ids].sort(compareText),
        })),
      });
    }
    return pages;
  });
  const approvalExceptions = [
    ...model.records.flatMap((record) => {
      const blockers = record.issues.filter(({ severity }) => severity !== "warning")
        .map(({ code }) => code);
      return blockers.length === 0 ? [] : [{
        entity_type: "record" as const, entity_id: record.id, blockers,
      }];
    }),
    ...model.workflow_assignments.flatMap((assignment) =>
      assignment.governance.blockers.length === 0 ? [] : [{
        entity_type: "assignment" as const,
        entity_id: assignment.assignment_id,
        blockers: assignment.governance.blockers,
      }]),
    ...model.relationship_candidates.flatMap((relationship) => {
      const blockers = [
        ...relationship.governance.blockers,
        ...relationship.targets.flatMap(({ blockers }) => blockers),
      ];
      return blockers.length === 0 ? [] : [{
        entity_type: "relationship" as const,
        entity_id: relationship.relationship_intent_id,
        blockers: [...new Set(blockers)].sort(compareText),
      }];
    }),
    ...model.workflow_edges.flatMap((edge) =>
      edge.governance.blockers.length === 0 ? [] : [{
        entity_type: "workflow_edge" as const,
        entity_id: edge.edge_id,
        blockers: edge.governance.blockers,
      }]),
  ].sort((left, right) => compareText(left.entity_id, right.entity_id));
  const relationshipReview = [
    ...model.relationship_candidates.flatMap((relationship) =>
      relationship.targets.flatMap((target) => target.target_id ? [{
        review_subject_id: target.target_candidate_id,
        subject_type: "relationship_target" as const,
        from_id: relationship.from_id,
        to_id: target.target_id,
        relationship_kind: relationship.relationship_kind,
        origin: relationship.governance.origin,
        evidence_source_unit_ids: [...new Set([
          ...relationship.governance.evidence_source_unit_ids,
          ...target.evidence_source_unit_ids,
        ])].sort(compareText),
        rationale: target.rationale,
        confidence: target.confidence,
        review_status: "pending" as const,
        bulk_approval_eligible: relationship.governance.bulk_approval_eligible
          && target.blockers.length === 0,
        blockers: [...new Set([
          ...relationship.governance.blockers,
          ...target.blockers,
        ])].sort(compareText),
        authoritative: false as const,
      }] : [])),
    ...model.workflow_edges.map((edge) => ({
      review_subject_id: edge.edge_id,
      subject_type: "workflow_edge" as const,
      from_id: edge.from_operation_id,
      to_id: edge.to_operation_id,
      relationship_kind: edge.edge_kind,
      origin: edge.governance.origin,
      evidence_source_unit_ids: [...edge.governance.evidence_source_unit_ids]
        .sort(compareText),
      rationale: edge.governance.rationale,
      confidence: edge.governance.confidence,
      review_status: "pending" as const,
      bulk_approval_eligible: edge.governance.bulk_approval_eligible,
      blockers: [...edge.governance.blockers].sort(compareText),
      authoritative: false as const,
    })),
  ].sort((left, right) => compareText(left.review_subject_id, right.review_subject_id));
  const core = {
    schema_version: ATLAS_FOCUSED_PROJECTION_VERSION,
    model_revision: model.proposal_revision,
    model_hash: model.content_hash,
    model_lifecycle: model.lifecycle,
    authoritative: model.authoritative,
    downstream_execution_allowed: model.downstream_execution_allowed,
    project_overview: projectOverview,
    workflow_details: workflowDetails,
    rules_controls_index: {
      artifacts: slices.map((slice) => ({
        artifact: slice.artifact,
        slice_id: slice.slice_id,
        partition_type: slice.partition_type,
        partition_id: slice.partition_id,
        item_count: slice.items.length,
        cursor: slice.cursor,
        ...(slice.next_cursor ? { next_cursor: slice.next_cursor } : {}),
      })),
    },
    rules_controls_slices: slices,
    traceability: model.records.map((record) => ({
      record_id: record.id,
      candidate_ids: [...record.candidate_ids].sort(compareText),
      source_unit_ids: [...record.source_unit_ids].sort(compareText),
      semantic_fingerprint: record.identity.semantic_fingerprint,
    })).sort((left, right) => compareText(left.record_id, right.record_id)),
    approval_exceptions: approvalExceptions,
    relationship_review: relationshipReview,
  };
  return deepFreezeProjection(FocusedProjectionBundleSchema.parse({
    ...core,
    content_hash: hashProjection(core),
  }));
}

export function createProposedModelReviewWorkspace(input: {
  readonly model: z.input<typeof ProposedProjectModelSchema>;
  readonly focused_projections: z.input<typeof FocusedProjectionBundleSchema>;
  readonly max_initial_nodes?: number;
  readonly max_initial_edges?: number;
  readonly max_initial_payload_bytes?: number;
  readonly max_initial_layout_ms?: number;
  readonly approval?: {
    readonly decision_ids: readonly string[];
    readonly canonical_relationship_ids: Readonly<Record<string, string>>;
    readonly downstream_blockers?: readonly string[];
  };
}): z.infer<typeof ModelReviewWorkspaceSchema> {
  const model = ProposedProjectModelSchema.parse(input.model);
  const focused = FocusedProjectionBundleSchema.parse(input.focused_projections);
  const approved = input.approval !== undefined;
  const maxNodes = z.number().int().positive().parse(input.max_initial_nodes ?? 50);
  const maxEdges = z.number().int().positive().parse(input.max_initial_edges ?? 100);
  const workflowById = new Map(model.workflows.map((workflow) =>
    [workflow.workflow_id, workflow] as const));
  const operationById = new Map(model.operations.map((operation) =>
    [operation.operation_id, operation] as const));
  const projectionNodeId = (canonicalId: string) =>
    `${canonicalId}.projection.overview`;
  const overviewRole = (node: typeof focused.project_overview.nodes[number]) => {
    if (node.node_kind === "shared_data") return "shared_data" as const;
    if (node.node_kind === "context_provider") return "context_provider" as const;
    if (node.node_kind === "decision") return "significant_decision" as const;
    if (node.node_kind === "state") return "significant_state" as const;
    return "major_business_area" as const;
  };
  const allNodes = focused.project_overview.nodes.map((node) => {
    const semantic = workflowById.get(node.node_id) ?? operationById.get(node.node_id);
    if (!semantic) throw new Error(`Overview node lacks canonical source: ${node.node_id}`);
    const role = overviewRole(node);
    return {
      node: {
        projection_node_id: projectionNodeId(node.node_id),
        projection_kind: "atlas.projection.integrated",
        node_kind: `atlas.node.${node.node_kind.replaceAll("_", "-")}`,
        label: node.label,
        review_status: approved ? "approved" as const : "pending" as const,
        authoritative: approved,
        identity_kind: "canonical_concept" as const,
        canonical_concept_id: node.node_id,
        evidence_ids: [...semantic.source_unit_ids].sort(compareText),
      },
      overview_eligible: true,
      overview_priority: role === "significant_decision" || role === "significant_state"
        ? 90 : role === "major_business_area" ? 80 : 70,
      overview_role: role,
      overview_inclusion_reason: role === "major_business_area"
        ? "Backend-classified major project area"
        : `Backend-classified ${role.replaceAll("_", " ")}`,
      default_visible: true,
    };
  }).sort((left, right) => right.overview_priority - left.overview_priority
    || compareText(left.node.projection_node_id, right.node.projection_node_id));
  const nodes = allNodes.slice(0, maxNodes);
  const selectedCanonicalIds = new Set(nodes.map(({ node }) =>
    node.canonical_concept_id));
  const relationshipTargets = new Map(model.relationship_candidates.flatMap((intent) =>
    intent.targets.map((target) => [target.target_candidate_id, { intent, target }] as const)));
  const workflowEdges = new Map(model.workflow_edges.map((edge) => [edge.edge_id, edge] as const));
  const allEdges = focused.project_overview.edges.flatMap<z.infer<typeof ProjectionEdgeSchema>>((edge) => {
    if (!selectedCanonicalIds.has(edge.from_node_id)
      || !selectedCanonicalIds.has(edge.to_node_id)) return [];
    const relationship = relationshipTargets.get(edge.edge_id);
    const workflowEdge = workflowEdges.get(edge.edge_id);
    if (relationship) {
      return [{
        projection_edge_id: `${edge.edge_id}.projection.overview`,
        projection_kind: "atlas.projection.integrated",
        from_projection_node_id: projectionNodeId(edge.from_node_id),
        to_projection_node_id: projectionNodeId(edge.to_node_id),
        relationship_kind: relationship.intent.relationship_kind,
        relationship_status: approved ? "approved" as const : "pending" as const,
        authoritative: approved,
        identity_kind: "governed_relationship" as const,
        governed_relationship_id: relationship.target.target_candidate_id,
        ...(input.approval?.canonical_relationship_ids[
          relationship.target.target_candidate_id
        ] ? { canonical_relationship_id: input.approval.canonical_relationship_ids[
          relationship.target.target_candidate_id
        ] } : {}),
        origin: relationship.intent.governance.origin,
        evidence_ids: [...new Set([
          ...relationship.intent.governance.evidence_source_unit_ids,
          ...relationship.target.evidence_source_unit_ids,
        ])].sort(compareText),
        rationale: relationship.target.rationale,
      }];
    }
    if (workflowEdge) {
      return [{
        projection_edge_id: `${edge.edge_id}.projection.overview`,
        projection_kind: "atlas.projection.integrated",
        from_projection_node_id: projectionNodeId(edge.from_node_id),
        to_projection_node_id: projectionNodeId(edge.to_node_id),
        relationship_kind: `atlas.relationship.${workflowEdge.edge_kind}`,
        relationship_status: approved ? "approved" as const : "pending" as const,
        authoritative: approved,
        identity_kind: "governed_relationship" as const,
        governed_relationship_id: workflowEdge.edge_id,
        origin: workflowEdge.governance.origin,
        evidence_ids: [...workflowEdge.governance.evidence_source_unit_ids].sort(compareText),
        rationale: workflowEdge.governance.rationale,
      }];
    }
    const decisionId = edge.to_node_id.endsWith(".decision")
      ? edge.to_node_id : edge.from_node_id;
    const derivations = model.workflow_edges.filter(({ from_operation_id }) =>
      from_operation_id === decisionId).map(({ edge_id }) => edge_id).sort(compareText);
    if (derivations.length === 0) return [];
    return [{
      projection_edge_id: `${edge.edge_id}.projection.overview`,
      projection_kind: "atlas.projection.integrated",
      from_projection_node_id: projectionNodeId(edge.from_node_id),
      to_projection_node_id: projectionNodeId(edge.to_node_id),
      relationship_kind: "atlas.relationship.evaluated-by",
      relationship_status: "pending" as const,
      authoritative: false as const,
      identity_kind: "projection_construct" as const,
      projection_construct_id: edge.edge_id,
      derived_from_relationship_ids: derivations,
      evidence_ids: [],
    }];
  }).sort((left, right) => compareText(left.projection_edge_id, right.projection_edge_id));
  const edges = allEdges.slice(0, maxEdges);
  const budget = {
    max_initial_nodes: maxNodes,
    max_initial_edges: maxEdges,
    max_initial_payload_bytes: z.number().int().positive()
      .parse(input.max_initial_payload_bytes ?? 262_144),
    max_initial_layout_ms: z.number().int().positive()
      .parse(input.max_initial_layout_ms ?? 1_000),
  };
  const nodeOrder = nodes.map(({ node }) => node.projection_node_id).sort(compareText);
  const edgeOrder = edges.map(({ projection_edge_id }) => projection_edge_id).sort(compareText);
  return ModelReviewWorkspaceSchema.parse({
    contract_name: ATLAS_WORKSPACE_CONTRACT,
    contract_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
    producer_version: `atlas-intent-graph@${ATLAS_INTENT_GRAPH_VERSION}`,
    projection_schema_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
    evidence_schema_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
    command_schema_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
    project_id: model.project_id,
    revision: model.proposal_revision,
    authority: approved
      ? { lifecycle: "approved", authority: "authoritative",
        approval_decision_ids: [...input.approval.decision_ids].sort(compareText),
        downstream_execution: input.approval.downstream_blockers?.length
          ? { status: "blocked", blockers: [...input.approval.downstream_blockers].sort(compareText) }
          : { status: "allowed" } }
      : { lifecycle: "review_in_progress", authority: "non_authoritative",
        downstream_execution: { status: "blocked",
          blockers: ["atlas.blocker.human-review-required"] } },
    overview: {
      nodes,
      edges,
      summary: {
        node_count: allNodes.length,
        edge_count: allEdges.length,
        is_truncated: allNodes.length > nodes.length || allEdges.length > edges.length,
        available_layer_ids: ["atlas.layer.workflow", "atlas.layer.decision",
          "atlas.layer.state", "atlas.layer.data", "atlas.layer.evidence"],
        artifact_hashes: [model.content_hash],
        schema_versions: [ATLAS_MODEL_REVIEW_CONTRACT_VERSION],
        revision: model.proposal_revision,
        ...(allNodes.length > nodes.length || allEdges.length > edges.length
          ? { next_cursor: `revision-${model.proposal_revision}-page-2` } : {}),
        budget,
      },
      layout: {
        layout_engine: "elkjs",
        layout_engine_version: "1.0.0",
        layout_profile: "atlas.layout.overview-v1",
        layout_algorithm: "atlas.layout.layered",
        direction: "RIGHT",
        node_order: nodeOrder,
        edge_order: edgeOrder,
        layout_input_hash: hashProjection({ nodeOrder, edgeOrder }),
        layout_options_hash: hashProjection({ algorithm: "layered", direction: "RIGHT",
          spacing: 40, profile: "atlas.layout.overview-v1" }),
      },
    },
  });
}

export function createModelReviewDetails(input: {
  readonly model: z.input<typeof ProposedProjectModelSchema>;
  readonly focused_projections: z.input<typeof FocusedProjectionBundleSchema>;
  readonly workspace: z.input<typeof ModelReviewWorkspaceSchema>;
}) {
  const model = ProposedProjectModelSchema.parse(input.model);
  const focused = FocusedProjectionBundleSchema.parse(input.focused_projections);
  const workspace = ModelReviewWorkspaceSchema.parse(input.workspace);
  const artifactPrefix = workspace.authority.lifecycle === "approved" ? "approved" : "proposed";
  const operationById = new Map(model.operations.map((operation) =>
    [operation.operation_id, operation] as const));
  const workflowEdgeById = new Map(model.workflow_edges.map((edge) => [edge.edge_id, edge] as const));
  const role = (overviewRole: typeof workspace.overview.nodes[number]["overview_role"]) => {
    if (overviewRole === "shared_data") return "shared_data" as const;
    if (overviewRole === "context_provider") return "context_provider" as const;
    if (overviewRole === "significant_decision") return "decision" as const;
    if (overviewRole === "significant_state") return "state" as const;
    return "workflow" as const;
  };
  const details = workspace.overview.nodes.map((overviewNode) => {
    const subject = overviewNode.node;
    if (subject.identity_kind !== "canonical_concept") {
      throw new Error(`Overview detail subject is not canonical: ${subject.projection_node_id}`);
    }
    const canonicalId = subject.canonical_concept_id;
    const workflow = focused.workflow_details.find(({ workflow_id }) => workflow_id === canonicalId);
    const operations = workflow?.operations ?? (operationById.has(canonicalId)
      ? [{ ...operationById.get(canonicalId)!, semantic_record_ids: [] }] : []);
    const nodes = operations.map((operation) => {
      const canonical = operationById.get(operation.operation_id);
      if (!canonical || canonical.source_unit_ids.length === 0) {
        throw new Error(`Detail operation lacks canonical evidence: ${operation.operation_id}`);
      }
      return {
        projection_node_id: `${operation.operation_id}.projection.detail`,
        projection_kind: "atlas.projection.workflow-detail",
        node_kind: `atlas.node.${operation.operation_kind.replaceAll("_", "-")}`,
        label: operation.label,
        review_status: subject.review_status,
        authoritative: subject.authoritative,
        identity_kind: "canonical_concept" as const,
        canonical_concept_id: operation.operation_id,
        evidence_ids: [...canonical.source_unit_ids].sort(compareText),
      };
    });
    const nodeIds = new Set(nodes.map(({ canonical_concept_id }) => canonical_concept_id));
    const edges = (workflow?.edges ?? []).flatMap((edge) => {
      const canonical = workflowEdgeById.get(edge.edge_id);
      if (!canonical || !nodeIds.has(edge.from_operation_id) || !nodeIds.has(edge.to_operation_id)) return [];
      return [{
        projection_edge_id: `${edge.edge_id}.projection.detail`,
        projection_kind: "atlas.projection.workflow-detail",
        from_projection_node_id: `${edge.from_operation_id}.projection.detail`,
        to_projection_node_id: `${edge.to_operation_id}.projection.detail`,
        relationship_kind: `atlas.relationship.${edge.edge_kind.replaceAll("_", "-")}`,
        relationship_status: subject.review_status,
        authoritative: subject.authoritative,
        identity_kind: "governed_relationship" as const,
        governed_relationship_id: edge.edge_id,
        origin: canonical.governance.origin,
        evidence_ids: [...canonical.governance.evidence_source_unit_ids].sort(compareText),
        rationale: canonical.governance.rationale,
      }];
    });
    const slices = focused.rules_controls_slices.filter((slice) =>
      slice.partition_type === "workflow" && slice.partition_id === canonicalId);
    const items = slices.flatMap(({ items }) => items);
    const countKind = (kind: string) => items.filter(({ semantic_kind_id }) =>
      semantic_kind_id.includes(kind)).length;
    const tab = (name: "rules" | "validations" | "permissions" | "states", count: number) => count
      ? { tab: name, availability: "available" as const, item_count: count,
        artifact_path: slices[0]!.artifact }
      : { tab: name, availability: "explicitly_empty" as const, item_count: 0,
        reason: `Atlas found no ${name} for this subject` };
    const connected = workspace.overview.edges.filter((edge) =>
      edge.from_projection_node_id === subject.projection_node_id
      || edge.to_projection_node_id === subject.projection_node_id);
    const detail = ModelReviewDetailSchema.parse({
      contract_name: ATLAS_DETAIL_CONTRACT,
      contract_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
      producer_version: `atlas-intent-graph@${ATLAS_INTENT_GRAPH_VERSION}`,
      projection_schema_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
      evidence_schema_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
      command_schema_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
      project_id: workspace.project_id,
      revision: workspace.revision,
      authority: workspace.authority,
      availability: nodes.length ? "full" : "explicitly_empty",
      subject: {
        subject_id: canonicalId,
        subject_role: role(overviewNode.overview_role),
        projection_node_id: subject.projection_node_id,
        canonical_concept_id: canonicalId,
        node_kind: subject.node_kind,
        label: subject.label,
        review_status: subject.review_status,
        authoritative: subject.authoritative,
        evidence_ids: subject.evidence_ids,
      },
      graph: {
        nodes,
        edges,
        ordering_status: edges.length ? "established" : nodes.length > 1 ? "not_established" : "not_applicable",
        ordering_explanation: edges.length
          ? "Atlas found governed sequence relationships for this detail."
          : nodes.length > 1
            ? "The source does not establish ordering between these operations."
            : "Ordering does not apply to this detail.",
      },
      connected_project_relationships: connected,
      tabs: [
        nodes.length
          ? { tab: "flow", availability: "available", item_count: nodes.length,
            artifact_path: artifactPrefix === "approved"
              ? "approved-workflow-detail-graphs.json"
              : `proposed-workflows/${canonicalId}/flow.json` }
          : { tab: "flow", availability: "explicitly_empty", item_count: 0,
            reason: "Atlas found no flow operations for this subject" },
        tab("rules", items.length),
        tab("validations", countKind("validation")),
        tab("permissions", countKind("permission")),
        tab("states", countKind("state")),
        { tab: "evidence", availability: "available", item_count: subject.evidence_ids.length },
        connected.length
          ? { tab: "approval", availability: "available", item_count: connected.length,
            artifact_path: artifactPrefix === "approved"
              ? "approved-relationships.json" : "proposed-relationship-review.json" }
          : { tab: "approval", availability: "explicitly_empty", item_count: 0,
            reason: "Atlas found no connected relationships requiring approval" },
      ],
    });
    return { path: `${artifactPrefix}-details/${canonicalId}.json`, detail };
  });
  const index = ModelReviewDetailIndexSchema.parse({
    contract_name: ATLAS_DETAIL_INDEX_CONTRACT,
    contract_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
    producer_version: `atlas-intent-graph@${ATLAS_INTENT_GRAPH_VERSION}`,
    projection_schema_version: ATLAS_MODEL_REVIEW_CONTRACT_VERSION,
    project_id: workspace.project_id,
    revision: workspace.revision,
    authority: workspace.authority,
    entries: details.map(({ path, detail }) => ({
      subject_id: detail.subject.subject_id,
      subject_role: detail.subject.subject_role,
      label: detail.subject.label,
      detail_path: path,
      review_status: detail.subject.review_status,
    })),
  });
  return { index, details };
}

export function materializeApprovedFocusedProjections(input: {
  readonly proposed: z.input<typeof FocusedProjectionBundleSchema>;
  readonly approved_model_hash: string;
  readonly approved_model_revision: number;
  readonly approved_workflow_ids?: readonly string[];
  readonly approved_operation_ids?: readonly string[];
  readonly approved_workflow_edge_ids?: readonly string[];
  readonly approved_relationship_ids?: readonly string[];
}): z.infer<typeof FocusedProjectionBundleSchema> {
  const proposed = FocusedProjectionBundleSchema.parse(input.proposed);
  if (proposed.model_lifecycle !== "review_in_progress") {
    throw new Error("Approved projection materialization requires a proposed projection");
  }
  const { content_hash: _ignored, ...rest } = proposed;
  const approvedArtifacts = new Map(proposed.rules_controls_slices.map((slice) => [
    slice.slice_id,
    slice.artifact.replace(/^proposed-/u, "approved-"),
  ]));
  const workflowIds = new Set(input.approved_workflow_ids
    ?? proposed.workflow_details.map(({ workflow_id }) => workflow_id));
  const operationIds = new Set(input.approved_operation_ids
    ?? proposed.workflow_details.flatMap(({ operations }) =>
      operations.map(({ operation_id }) => operation_id)));
  const edgeIds = new Set(input.approved_workflow_edge_ids ?? []);
  const relationshipIds = new Set(input.approved_relationship_ids ?? []);
  const approvedWorkflowDetails = proposed.workflow_details
    .filter(({ workflow_id }) => workflowIds.has(workflow_id))
    .map((detail) => ({
      ...detail,
      operations: detail.operations.filter(({ operation_id }) =>
        operationIds.has(operation_id)),
      edges: detail.edges.filter(({ edge_id }) => edgeIds.has(edge_id)),
    }));
  const approvedOverviewNodes = proposed.project_overview.nodes.filter(({ node_id }) =>
    workflowIds.has(node_id) || operationIds.has(node_id));
  const approvedOverviewEdges = proposed.project_overview.edges.filter((edge) =>
    (relationshipIds.has(edge.edge_id) || edgeIds.has(edge.edge_id)
      || edge.edge_id.endsWith(".evaluated-by"))
    && (workflowIds.has(edge.from_node_id) || operationIds.has(edge.from_node_id))
    && (workflowIds.has(edge.to_node_id) || operationIds.has(edge.to_node_id)));
  const core = {
    ...rest,
    model_revision: z.number().int().positive().parse(input.approved_model_revision),
    model_hash: Sha256Schema.parse(input.approved_model_hash),
    model_lifecycle: "approved" as const,
    authoritative: true,
    downstream_execution_allowed: true,
    project_overview: {
      workflows: proposed.project_overview.workflows
        .filter(({ workflow_id }) => workflowIds.has(workflow_id))
        .map((workflow) => ({
          ...workflow,
          operation_count: approvedWorkflowDetails.find(({ workflow_id }) =>
            workflow_id === workflow.workflow_id)?.operations.length ?? 0,
        })),
      relationships: proposed.project_overview.relationships
        .filter(({ relationship_id, from_workflow_id, to_workflow_id }) =>
          relationshipIds.has(relationship_id)
          && workflowIds.has(from_workflow_id)
          && workflowIds.has(to_workflow_id)),
      nodes: approvedOverviewNodes,
      edges: approvedOverviewEdges,
      duplicate_decision_state_labels: proposed.project_overview.duplicate_decision_state_labels
        .filter(({ node_ids }) => node_ids.every((id) =>
          approvedOverviewNodes.some(({ node_id }) => node_id === id))),
    },
    workflow_details: approvedWorkflowDetails,
    rules_controls_index: {
      artifacts: proposed.rules_controls_index.artifacts.map((artifact) => ({
        ...artifact,
        artifact: approvedArtifacts.get(artifact.slice_id)!,
      })),
    },
    rules_controls_slices: proposed.rules_controls_slices.map((slice) => ({
      ...slice,
      artifact: approvedArtifacts.get(slice.slice_id)!,
    })),
    relationship_review: [],
  };
  return deepFreezeProjection(FocusedProjectionBundleSchema.parse({
    ...core,
    content_hash: hashProjection(core),
  }));
}

export function renderFocusedWorkflowMermaid(input: {
  readonly workflow_id: string;
  readonly operations: readonly {
    readonly operation_id: string;
    readonly label: string;
    readonly operation_kind: string;
  }[];
  readonly edges: readonly {
    readonly from_operation_id: string;
    readonly to_operation_id: string;
    readonly edge_kind: string;
  }[];
}): string {
  const operations = [...input.operations].sort((left, right) =>
    compareText(left.operation_id, right.operation_id));
  const aliases = new Map(operations.map((operation, index) =>
    [operation.operation_id, `op${index + 1}`] as const));
  const lines = [
    `%% ${input.workflow_id} — PROPOSED, NOT AUTHORITATIVE`,
    "flowchart TD",
    ...operations.map((operation) => {
      const alias = aliases.get(operation.operation_id)!;
      const label = escapeMermaid(operation.label);
      return operation.operation_kind === "decision"
        ? `  ${alias}{"${label}"}` : `  ${alias}["${label}"]`;
    }),
    ...[...input.edges].sort((left, right) =>
      compareText(
        `${left.from_operation_id}:${left.to_operation_id}:${left.edge_kind}`,
        `${right.from_operation_id}:${right.to_operation_id}:${right.edge_kind}`,
      )).map((edge) =>
      `  ${aliases.get(edge.from_operation_id)} -->|"${escapeMermaid(edge.edge_kind)}"| ${aliases.get(edge.to_operation_id)}`),
  ];
  return `${lines.join("\n")}\n`;
}

export function renderProjectOverviewMermaid(input: {
  readonly workflows: readonly {
    readonly workflow_id: string;
    readonly label: string;
  }[];
  readonly relationships: readonly {
    readonly relationship_id: string;
    readonly from_workflow_id: string;
    readonly to_workflow_id: string;
    readonly relationship_kind: string;
  }[];
  readonly nodes?: readonly {
    readonly node_id: string;
    readonly node_kind: "business_workflow" | "shared_data" | "context_provider"
      | "state_workflow" | "reporting_audit" | "decision" | "state";
    readonly label: string;
  }[];
  readonly edges?: readonly {
    readonly edge_id: string;
    readonly from_node_id: string;
    readonly to_node_id: string;
    readonly relationship_kind: string;
    readonly outcome_label?: string | undefined;
  }[];
}): string {
  const nodes = input.nodes?.length ? [...input.nodes] : input.workflows.map((workflow) => ({
    node_id: workflow.workflow_id, node_kind: "business_workflow" as const,
    label: workflow.label,
  }));
  nodes.sort((left, right) => compareText(left.node_id, right.node_id));
  const aliases = new Map(nodes.map((node, index) =>
    [node.node_id, `node${index + 1}`] as const));
  const edges = input.edges?.length ? [...input.edges] : input.relationships.map(
    (relationship) => ({
      edge_id: relationship.relationship_id,
      from_node_id: relationship.from_workflow_id,
      to_node_id: relationship.to_workflow_id,
      relationship_kind: relationship.relationship_kind.split(".").at(-1)!,
    }));
  const lines = [
    "%% PROJECT OVERVIEW -- PROPOSED, NOT AUTHORITATIVE",
    "flowchart LR",
    ...nodes.map((node) => {
      const alias = aliases.get(node.node_id)!;
      const label = escapeMermaid(node.label);
      if (node.node_kind === "decision") return `  ${alias}{"${label}"}`;
      if (node.node_kind === "shared_data") return `  ${alias}[("${label}")]`;
      if (node.node_kind === "context_provider") return `  ${alias}(["${label}"])`;
      return `  ${alias}["${label}"]`;
    }),
    ...edges
      .filter(({ from_node_id, to_node_id }) =>
        aliases.has(from_node_id) && aliases.has(to_node_id))
      .sort((left, right) => compareText(left.edge_id, right.edge_id))
      .map((relationship) => {
        const arrow = relationship.relationship_kind.endsWith("provides-data-to")
          ? "-.->" : "-->";
        const label = ("outcome_label" in relationship
          ? relationship.outcome_label : undefined) ?? relationship.relationship_kind;
        return `  ${aliases.get(relationship.from_node_id)} ${arrow}|"${escapeMermaid(label)}"| ${aliases.get(relationship.to_node_id)}`;
      }),
  ];
  return `${lines.join("\n")}\n`;
}

export const WorkflowGraphProjectionInputSchema = z.object({
  project_id: StableId,
  model_revision: z.number().int().positive(),
  model_hash: Sha256Schema,
  lifecycle: z.enum(["proposed", "review_in_progress", "approved", "superseded"]),
  authoritative: z.boolean(),
  downstream_execution_allowed: z.boolean(),
  nodes: z.array(z.object({
    id: StableId,
    kind_id: StableId,
    label: NonEmptyString,
    semantic_record_ids: z.array(StableId),
    source_unit_ids: z.array(StableId).min(1),
    item_review_states: z.array(ReviewStateSchema),
    issue_codes: z.array(StableId),
  }).strict()),
  relationships: z.array(z.object({
    id: StableId, from_id: StableId, to_id: StableId, kind_id: StableId,
    source_unit_ids: z.array(StableId).min(1),
  }).strict()),
  source_documents: z.array(z.object({
    document_id: StableId, document_version: NonEmptyString, content_hash: Sha256Schema,
  }).strict()),
  finding_ids: z.array(StableId),
}).strict().superRefine((value, context) => {
  const approved = value.lifecycle === "approved";
  if (approved !== value.authoritative || approved !== value.downstream_execution_allowed) {
    context.addIssue({ code: "custom", message: "Graph lifecycle authority mismatch" });
  }
});

export const WorkflowGraphSchema = z.object({
  schema_version: z.literal(ATLAS_WORKFLOW_GRAPH_VERSION),
  project_id: StableId,
  model_revision: z.number().int().positive(),
  model_hash: Sha256Schema,
  model_lifecycle: z.enum(["proposed", "review_in_progress", "approved", "superseded"]),
  graph_purpose: z.enum(["extraction_approval", "approved_baseline"]),
  authoritative: z.boolean(),
  approval_required: z.boolean(),
  downstream_execution_allowed: z.boolean(),
  banner: NonEmptyString,
  nodes: z.array(z.object({
    id: StableId, kind_id: StableId, label: NonEmptyString,
    semantic_record_ids: z.array(StableId), source_unit_ids: z.array(StableId).min(1),
    review_status: z.enum(["pending", "approved", "exception"]),
    issue_codes: z.array(StableId),
  }).strict()),
  edges: z.array(z.object({
    id: StableId, source_id: StableId, target_id: StableId, kind_id: StableId,
    source_unit_ids: z.array(StableId).min(1),
  }).strict()),
  documents: z.array(z.object({
    document_id: StableId, document_version: NonEmptyString, content_hash: Sha256Schema,
  }).strict()),
  finding_ids: z.array(StableId),
  approval_summary: z.object({
    total_nodes: z.number().int().nonnegative(),
    approved_nodes: z.number().int().nonnegative(),
    pending_nodes: z.number().int().nonnegative(),
    exception_nodes: z.number().int().nonnegative(),
  }).strict(),
  content_hash: Sha256Schema,
}).strict();

export function projectWorkflowGraph(
  inputValue: z.input<typeof WorkflowGraphProjectionInputSchema>,
): z.infer<typeof WorkflowGraphSchema> {
  const input = WorkflowGraphProjectionInputSchema.parse(inputValue);
  const nodes = input.nodes.map((node) => {
    const exceptions = new Set([
      "rejected", "correction_requested", "ambiguous", "unsupported", "conflict", "source_missing",
    ]);
    const reviewStatus = node.item_review_states.length > 0
      && node.item_review_states.every((state) => state === "approved")
      ? "approved" as const
      : node.item_review_states.some((state) => exceptions.has(state))
        || node.issue_codes.length > 0
        || node.kind_id === "ces.graph.unknown"
        ? "exception" as const : "pending" as const;
    return {
      id: node.id, kind_id: node.kind_id, label: node.label,
      semantic_record_ids: [...node.semantic_record_ids].sort(compareText),
      source_unit_ids: [...node.source_unit_ids].sort(compareText),
      review_status: reviewStatus,
      issue_codes: [...node.issue_codes].sort(compareText),
    };
  }).sort((a, b) => compareText(a.id, b.id));
  const nodeIds = new Set(nodes.map(({ id }) => id));
  const edges = input.relationships.map((edge) => {
    if (!nodeIds.has(edge.from_id) || !nodeIds.has(edge.to_id)) {
      throw new Error(`Dangling workflow relationship: ${edge.id}`);
    }
    return {
      id: edge.id, source_id: edge.from_id, target_id: edge.to_id,
      kind_id: edge.kind_id, source_unit_ids: [...edge.source_unit_ids].sort(compareText),
    };
  }).sort((a, b) => compareText(a.id, b.id));
  const approved = input.lifecycle === "approved";
  const core = {
    schema_version: ATLAS_WORKFLOW_GRAPH_VERSION,
    project_id: input.project_id,
    model_revision: input.model_revision,
    model_hash: input.model_hash,
    model_lifecycle: input.lifecycle,
    graph_purpose: approved ? "approved_baseline" as const : "extraction_approval" as const,
    authoritative: input.authoritative,
    approval_required: !approved,
    downstream_execution_allowed: input.downstream_execution_allowed,
    banner: approved ? "APPROVED BASELINE" : "PROPOSED -- NOT YET APPROVED",
    nodes, edges,
    documents: [...input.source_documents].sort((a, b) =>
      compareText(a.document_id, b.document_id)),
    finding_ids: [...input.finding_ids].sort(compareText),
    approval_summary: {
      total_nodes: nodes.length,
      approved_nodes: nodes.filter(({ review_status }) => review_status === "approved").length,
      pending_nodes: nodes.filter(({ review_status }) => review_status === "pending").length,
      exception_nodes: nodes.filter(({ review_status }) => review_status === "exception").length,
    },
  };
  return WorkflowGraphSchema.parse({ ...core, content_hash: workflowHash(core) });
}

export function projectProposedWorkflowGraph(
  modelValue: z.input<typeof ProposedProjectModelSchema>,
): z.infer<typeof WorkflowGraphSchema> {
  const model = ProposedProjectModelSchema.parse(modelValue);
  const records = new Map(model.records.map((record) => [record.id, record]));
  return projectWorkflowGraph({
    project_id: model.project_id,
    model_revision: model.proposal_revision,
    model_hash: model.content_hash,
    lifecycle: model.lifecycle,
    authoritative: model.authoritative,
    downstream_execution_allowed: model.downstream_execution_allowed,
    nodes: model.workflow_nodes.map((node) => {
      const contained = node.semantic_record_ids.map((id) => records.get(id)!);
      return {
        id: node.id,
        kind_id: proposedGraphKind(contained.map(({ semantic_kind_id }) =>
          semantic_kind_id)),
        label: node.label,
        semantic_record_ids: node.semantic_record_ids,
        source_unit_ids: node.source_unit_ids,
        item_review_states: contained.map(({ review_status }) => review_status),
        issue_codes: contained.flatMap(({ issues }) => issues.map(({ code }) => code)),
      };
    }),
    relationships: model.relationships.map((edge) => ({
      id: edge.id, from_id: edge.from_id, to_id: edge.to_id,
      kind_id: edge.kind, source_unit_ids: edge.source_unit_ids,
    })),
    source_documents: model.source_documents,
    finding_ids: model.extraction_findings.findings.map(({ id }) => id),
  });
}

function proposedGraphKind(kinds: readonly string[]): string {
  if (kinds.includes("ces.kind.unknown")) return "ces.graph.unknown";
  const priority = [
    "state-transition", "state-definition", "workflow", "operational-procedure",
    "capability", "calculation", "role-permission", "validation-constraint",
    "uniqueness-constraint", "security-sensitive-restriction", "lifecycle-rule",
    "business-rule", "reporting-requirement", "acceptance-scenario",
    "acceptance-criterion", "terminology",
  ];
  const selected = priority.find((suffix) => kinds.includes(`ces.kind.${suffix}`));
  return selected ? `ces.graph.${selected}` : "ces.graph.semantic-record";
}

export function renderWorkflowGraphJson(
  graphValue: z.input<typeof WorkflowGraphSchema>,
): string {
  return `${JSON.stringify(WorkflowGraphSchema.parse(graphValue), null, 2)}\n`;
}

export function renderWorkflowGraphMarkdown(
  graphValue: z.input<typeof WorkflowGraphSchema>,
): string {
  const graph = WorkflowGraphSchema.parse(graphValue);
  const labels = new Map(graph.nodes.map((node) => [node.id, node.label]));
  const lines = [
    `# ${graph.banner}`,
    "",
    `Project: \`${graph.project_id}\``,
    `Authority: **${graph.authoritative ? "authoritative" : "non-authoritative"}**`,
    `Downstream execution: **${graph.downstream_execution_allowed ? "allowed" : "blocked"}**`,
    "",
    "## Proposed nodes",
    "",
    ...graph.nodes.map((node) =>
      `- \`${node.id}\` — ${node.label} (${node.review_status}; ${node.kind_id})`),
    "",
    "## Evidence-backed relationships",
    "",
    ...(graph.edges.length > 0
      ? graph.edges.map((edge) =>
        `- **${labels.get(edge.source_id)}** → **${labels.get(edge.target_id)}** `
        + `(${edge.kind_id}; \`${edge.source_id}\` → \`${edge.target_id}\`)`)
      : ["No workflow ordering relationship was extracted; review must not infer one."]),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function renderWorkflowGraphMermaid(
  graphValue: z.input<typeof WorkflowGraphSchema>,
): string {
  const graph = WorkflowGraphSchema.parse(graphValue);
  const aliases = new Map(graph.nodes.map((node, index) => [node.id, `n${index + 1}`]));
  const lines = [
    "flowchart TD",
    `  %% ${graph.banner}; downstream execution is blocked`,
    ...graph.nodes.map((node) =>
      `  ${aliases.get(node.id)}["${escapeMermaid(node.label)}"]`),
    ...graph.edges.map((edge) =>
      `  ${aliases.get(edge.source_id)} -->|"${escapeMermaid(edge.kind_id)}"| ${aliases.get(edge.target_id)}`),
  ];
  return `${lines.join("\n")}\n`;
}

export const GraphNodeSchema = z.object({
  id: NonEmptyString,
  kind: z.enum(["source", "requirement", "business_rule", "uncertainty", "capability"]),
  label: NonEmptyString,
  revision_hash: Sha256Schema,
  provenance: z.array(NonEmptyString).default([]),
}).strict();

export const GraphEdgeSchema = z.object({
  id: NonEmptyString,
  source_id: NonEmptyString,
  target_id: NonEmptyString,
  relationship: z.enum([
    "affects", "conflicts_with", "constrains", "depends_on", "duplicates",
    "implements", "refines", "supersedes", "verified_by",
    "derived_from", "has_rule", "has_uncertainty", "resolves_to",
  ]),
  reason: NonEmptyString,
  provenance: NonEmptyString,
}).strict().refine(({ source_id, target_id }) => source_id !== target_id, {
  message: "A graph edge cannot target itself",
});

export const IntentGraphSchema = z.object({
  schema_version: z.literal(ATLAS_INTENT_GRAPH_VERSION),
  graph: z.object({
    id: NonEmptyString,
    revision_hash: Sha256Schema,
    requirement_collection_id: NonEmptyString,
    requirement_collection_revision_hash: Sha256Schema,
  }).strict(),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
}).strict();

export interface AtlasCoreHandoff {
  readonly manifests: Readonly<Record<string, PolicyManifest>>;
  readonly capabilities: Readonly<Record<string, readonly string[]>>;
}

export type IntentGraph = z.infer<typeof IntentGraphSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

export interface GraphDiagnostic {
  readonly code:
    | "duplicate_node"
    | "duplicate_edge"
    | "dangling_edge"
    | "cyclic_relationship"
    | "conflicting_relationship";
  readonly message: string;
  readonly ids: readonly string[];
}

export class AtlasGraphValidationError extends Error {
  public readonly diagnostics: readonly GraphDiagnostic[];

  public constructor(diagnostics: readonly GraphDiagnostic[]) {
    super(`Invalid Atlas intent graph: ${diagnostics.map(({ code }) => code).join(", ")}`);
    this.name = "AtlasGraphValidationError";
    this.diagnostics = diagnostics;
  }
}

export function compileAtlasCoreHandoff(
  review: AtlasReviewOutput,
  assuranceValue: unknown,
  cesBaselineVersion: string,
): AtlasCoreHandoff {
  assertCollectionPackages(review.collection, review.packages);
  const assurance = ProjectAssuranceContextSchema.parse(assuranceValue);
  const manifests = Object.fromEntries(
    Object.entries(review.packages)
      .sort(([left], [right]) => compareText(left, right))
      .map(([logicalId, requirement]) => [
        logicalId,
        compilePolicyManifest({
          requirement,
          assurance,
          ces_baseline_version: NonEmptyString.parse(cesBaselineVersion),
        }).manifest,
      ]),
  );
  return {
    manifests,
    capabilities: Object.fromEntries(
      Object.entries(manifests).map(([logicalId, manifest]) => [
        logicalId,
        manifest.resolved_capabilities.map(({ id }) => id).sort(compareText),
      ]),
    ),
  };
}

export function buildIntentGraph(input: {
  readonly graph_id: string;
  readonly review: AtlasReviewOutput;
  readonly links?: readonly RequirementLink[];
  readonly uncertainties?: AtlasProviderResult["uncertainties"];
  readonly core_handoff?: AtlasCoreHandoff;
}): IntentGraph {
  assertCollectionPackages(input.review.collection, input.review.packages);
  const graphId = NonEmptyString.parse(input.graph_id);
  const links = [...(input.links ?? [])].map((link) => RequirementLinkSchema.parse(link));
  const uncertainties = [...(input.uncertainties ?? [])]
    .map((item) => AtlasUncertaintySchema.parse(item));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const [logicalId, requirement] of Object.entries(input.review.packages)) {
    addRequirementNodes(requirement, nodes, edges);
    for (const uncertainty of uncertainties.filter(({ affected_requirement_ids }) =>
      affected_requirement_ids.includes(logicalId))) {
      const uncertaintyId = `uncertainty:${uncertainty.id}`;
      nodes.push(GraphNodeSchema.parse({
        id: uncertaintyId,
        kind: "uncertainty",
        label: `${uncertainty.field}: ${uncertainty.reason}`,
        revision_hash: sha256(uncertainty),
        provenance: [logicalId],
      }));
      edges.push(systemEdge(
        logicalId,
        uncertaintyId,
        "has_uncertainty",
        `Requirement is affected by ${uncertainty.severity} uncertainty`,
        uncertainty.id,
      ));
    }
  }

  for (const link of links) {
    edges.push(GraphEdgeSchema.parse({
      id: edgeId(link.source_id, link.target_id, link.relationship),
      ...link,
      provenance: `approved-link:${sha256(link)}`,
    }));
  }

  for (const [requirementId, capabilities] of Object.entries(
    input.core_handoff?.capabilities ?? {},
  )) {
    for (const capability of capabilities) {
      const capabilityId = `capability:${capability}`;
      nodes.push(GraphNodeSchema.parse({
        id: capabilityId,
        kind: "capability",
        label: capability,
        revision_hash: sha256({ capability }),
        provenance: [`core-resolution:${requirementId}`],
      }));
      edges.push(systemEdge(
        requirementId,
        capabilityId,
        "resolves_to",
        "Existing core resolved this capability",
        `core-resolution:${requirementId}`,
      ));
    }
  }

  const normalizedNodes = normalizeNodes(nodes);
  const normalizedEdges = normalizeEdges(edges);
  validateGraph(normalizedNodes, normalizedEdges);
  const base = {
    schema_version: ATLAS_INTENT_GRAPH_VERSION,
    graph: {
      id: graphId,
      requirement_collection_id: input.review.collection.collection.id,
      requirement_collection_revision_hash:
        input.review.collection.collection.revision_hash,
    },
    nodes: normalizedNodes,
    edges: normalizedEdges,
  } as const;
  return IntentGraphSchema.parse({
    ...base,
    graph: { ...base.graph, revision_hash: sha256(base) },
  });
}

function addRequirementNodes(
  requirement: RequirementPackage,
  nodes: GraphNode[],
  edges: GraphEdge[],
): void {
  const logicalId = requirement.requirement.id;
  const sourceId = `source:${requirement.source?.document_id ?? "unknown"}`;
  nodes.push(GraphNodeSchema.parse({
    id: logicalId,
    kind: "requirement",
    label: requirement.requirement.title,
    revision_hash: requirementRevisionHash(requirement),
    provenance: requirement.source?.document_id ? [sourceId] : [],
  }));
  if (requirement.source?.document_id && requirement.source.document_version) {
    nodes.push(GraphNodeSchema.parse({
      id: sourceId,
      kind: "source",
      label: requirement.source.document_id,
      revision_hash: requirement.source.document_version,
      provenance: requirement.source.section ? [requirement.source.section] : [],
    }));
    edges.push(systemEdge(
      logicalId,
      sourceId,
      "derived_from",
      "Approved requirement retains its source document revision",
      requirement.source.document_id,
    ));
  }
  for (const rule of requirement.business_rules) {
    const ruleId = `rule:${rule.id}`;
    nodes.push(GraphNodeSchema.parse({
      id: ruleId,
      kind: "business_rule",
      label: rule.statement,
      revision_hash: sha256(rule),
      provenance: [logicalId],
    }));
    edges.push(systemEdge(
      logicalId,
      ruleId,
      "has_rule",
      `Approved requirement is constrained by ${rule.type} rule`,
      rule.id,
    ));
  }
}

function validateGraph(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): void {
  const diagnostics: GraphDiagnostic[] = [];
  addDuplicateDiagnostics(nodes.map(({ id }) => id), "duplicate_node", diagnostics);
  addDuplicateDiagnostics(edges.map(({ id }) => id), "duplicate_edge", diagnostics);
  const nodeIds = new Set(nodes.map(({ id }) => id));
  for (const edge of edges) {
    const missing = [edge.source_id, edge.target_id].filter((id) => !nodeIds.has(id));
    if (missing.length > 0) diagnostics.push({
      code: "dangling_edge",
      message: `Edge ${edge.id} references missing nodes`,
      ids: [edge.id, ...missing],
    });
  }
  const pairRelationships = new Map<string, Set<string>>();
  for (const edge of edges) {
    const pair = `${edge.source_id}\u0000${edge.target_id}`;
    const relationships = pairRelationships.get(pair) ?? new Set<string>();
    relationships.add(edge.relationship);
    pairRelationships.set(pair, relationships);
  }
  for (const [pair, relationships] of pairRelationships) {
    if (relationships.has("conflicts_with") && relationships.size > 1) {
      diagnostics.push({
        code: "conflicting_relationship",
        message: "A relationship cannot both conflict and assert another relation",
        ids: pair.split("\u0000"),
      });
    }
  }
  const cycle = findCycle(edges.filter(({ relationship }) =>
    ["depends_on", "implements", "refines", "supersedes"].includes(relationship)));
  if (cycle) diagnostics.push({
    code: "cyclic_relationship",
    message: "Directed requirement relationships must be acyclic",
    ids: cycle,
  });
  if (diagnostics.length > 0) {
    throw new AtlasGraphValidationError(
      diagnostics.sort((left, right) => compareText(left.code, right.code)),
    );
  }
}

function findCycle(edges: readonly GraphEdge[]): string[] | undefined {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    graph.set(edge.source_id, [...(graph.get(edge.source_id) ?? []), edge.target_id]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(node: string, path: readonly string[]): string[] | undefined {
    if (visiting.has(node)) return [...path.slice(path.indexOf(node)), node];
    if (visited.has(node)) return undefined;
    visiting.add(node);
    for (const target of (graph.get(node) ?? []).sort(compareText)) {
      const cycle = visit(target, [...path, node]);
      if (cycle) return cycle;
    }
    visiting.delete(node);
    visited.add(node);
    return undefined;
  }
  for (const node of [...graph.keys()].sort(compareText)) {
    const cycle = visit(node, []);
    if (cycle) return cycle;
  }
  return undefined;
}

export function renderIntentGraphJson(graph: IntentGraph): string {
  return canonicalJson(IntentGraphSchema.parse(graph));
}

export function renderIntentGraphMarkdown(graphValue: IntentGraph): string {
  const graph = IntentGraphSchema.parse(graphValue);
  const lines = [
    "# " + graph.graph.id + " System Intent",
    "",
    `Collection: \`${graph.graph.requirement_collection_id}\``,
    `Graph revision: \`${graph.graph.revision_hash}\``,
    "",
    "## Nodes",
    "",
    "| ID | Kind | Label | Revision |",
    "|---|---|---|---|",
    ...graph.nodes.map((node) =>
      `| \`${escapeTable(node.id)}\` | ${node.kind} | ${escapeTable(node.label)} | \`${node.revision_hash}\` |`),
    "",
    "## Relationships",
    "",
    "| Source | Relationship | Target | Reason | Provenance |",
    "|---|---|---|---|---|",
    ...graph.edges.map((edge) =>
      `| \`${escapeTable(edge.source_id)}\` | ${edge.relationship} | \`${escapeTable(edge.target_id)}\` | ${escapeTable(edge.reason)} | ${escapeTable(edge.provenance)} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function renderIntentGraphMermaid(graphValue: IntentGraph): string {
  const graph = IntentGraphSchema.parse(graphValue);
  const aliases = new Map(graph.nodes.map((node, index) => [node.id, `N${index + 1}`]));
  const lines = [
    "flowchart TD",
    ...graph.nodes.map((node) =>
      `  ${aliases.get(node.id)}["${escapeMermaid(node.label)}"]`),
    ...graph.edges.map((edge) =>
      `  ${aliases.get(edge.source_id)} -->|${escapeMermaid(edge.relationship)}| ${aliases.get(edge.target_id)}`),
  ];
  return `${lines.join("\n")}\n`;
}

function systemEdge(
  sourceId: string,
  targetId: string,
  relationship: GraphEdge["relationship"],
  reason: string,
  provenance: string,
): GraphEdge {
  return GraphEdgeSchema.parse({
    id: edgeId(sourceId, targetId, relationship),
    source_id: sourceId,
    target_id: targetId,
    relationship,
    reason,
    provenance,
  });
}

function edgeId(sourceId: string, targetId: string, relationship: string): string {
  return `edge:${sha256({ source_id: sourceId, target_id: targetId, relationship }).slice(7, 23)}`;
}

function normalizeNodes(nodes: readonly GraphNode[]): GraphNode[] {
  const unique: GraphNode[] = [];
  for (const value of nodes) {
    const node = GraphNodeSchema.parse(value);
    const existingIndex = unique.findIndex(({ id }) => id === node.id);
    if (existingIndex < 0) {
      unique.push(node);
      continue;
    }
    const existing = unique[existingIndex]!;
    const { provenance: existingProvenance, ...existingIdentity } = existing;
    const { provenance: nodeProvenance, ...nodeIdentity } = node;
    if (canonicalJson(existingIdentity) === canonicalJson(nodeIdentity)) {
      unique[existingIndex] = {
        ...existing,
        provenance: [...new Set([...existingProvenance, ...nodeProvenance])].sort(compareText),
      };
    } else {
      unique.push(node);
    }
  }
  return unique
    .sort((left, right) => compareText(left.id, right.id));
}

function normalizeEdges(edges: readonly GraphEdge[]): GraphEdge[] {
  return [...edges]
    .map((edge) => GraphEdgeSchema.parse(edge))
    .sort((left, right) => compareText(left.id, right.id));
}

function addDuplicateDiagnostics(
  ids: readonly string[],
  code: "duplicate_node" | "duplicate_edge",
  diagnostics: GraphDiagnostic[],
): void {
  for (const id of [...new Set(ids.filter((value, index) => ids.indexOf(value) !== index))].sort(compareText)) {
    diagnostics.push({ code, message: `Duplicate graph identity ${id}`, ids: [id] });
  }
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeMermaid(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", " ");
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function safeId(value: string): string {
  const normalized = value.toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return StableId.parse(normalized || "unknown");
}

function hashProjection(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value, (_key, child) => {
      if (child === null || typeof child !== "object" || Array.isArray(child)) return child;
      return Object.fromEntries(Object.entries(child).sort(([left], [right]) =>
        compareText(left, right)));
    })).digest("hex")}`;
}

function deepFreezeProjection<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreezeProjection(child);
  }
  return value;
}

function workflowHash(value: unknown): string {
  const canonicalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonicalize);
    if (item !== null && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return Object.fromEntries(Object.keys(record).sort()
        .map((key) => [key, canonicalize(record[key])]));
    }
    return item;
  };
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalize(value))).digest("hex")}`;
}
import { createHash } from "node:crypto";
