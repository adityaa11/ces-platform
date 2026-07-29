import { createHash } from "node:crypto";
import { link, mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  AtomicClaimCoverageReportSchema,
  CompletenessCriticReportSchema,
  PipelineCoverageReportSchema,
} from "@company/ces-atlas-coverage";
import { AtlasCandidateInventorySchema } from "@company/ces-atlas-role-contracts";
import {
  MultilingualStatementSchema,
  SemanticKindRegistrySchema,
  TerminologyProposalSchema,
} from "@company/ces-semantic-record-schema";
import { z } from "zod";

export const PROPOSED_PROJECT_MODEL_VERSION = "1.5.0" as const;
export const CANONICAL_RECORD_IDENTITY_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

export const CanonicalRecordIdentitySchema = z.object({
  schema_version: z.literal(CANONICAL_RECORD_IDENTITY_VERSION),
  record_id: Id,
  project_id: Id,
  proposal_revision: z.number().int().positive(),
  semantic_kind_id: Id,
  semantic_fingerprint: Hash,
  source_lineage_hash: Hash,
  approved_logical_id: Id.optional(),
  predecessor_record_ids: z.array(Id),
  identity_status: z.enum(["proposed", "mapped", "collision_review_required"]),
}).strict();

export const ProposedEquivalenceIdentityClusterSchema = z.object({
  schema_version: z.literal(CANONICAL_RECORD_IDENTITY_VERSION),
  equivalence_cluster_id: Id,
  project_id: Id,
  proposal_revision: z.number().int().positive(),
  status: z.literal("possible_equivalence"),
  member_record_ids: z.array(Id).min(2),
  authoritative_merge: z.literal(false),
}).strict();

export const RecordIdentityReportSchema = z.object({
  schema_version: z.literal(CANONICAL_RECORD_IDENTITY_VERSION),
  project_id: Id,
  proposal_revision: z.number().int().positive(),
  identities: z.array(CanonicalRecordIdentitySchema),
  equivalence_clusters: z.array(ProposedEquivalenceIdentityClusterSchema),
  collisions: z.array(z.object({
    semantic_fingerprint: Hash,
    record_ids: z.array(Id).min(2),
    review_required: z.literal(true),
  }).strict()),
  migrations: z.array(z.object({
    predecessor_record_ids: z.array(Id).min(1),
    successor_record_ids: z.array(Id).min(1),
    change_kind: z.enum(["meaning_preserving", "meaning_changed"]),
    approved_logical_id: Id.optional(),
    review_status: z.literal("pending"),
  }).strict()),
  content_hash: Hash,
}).strict();

export function createProposedEquivalenceIdentityCluster(input: {
  readonly project_id: string;
  readonly proposal_revision: number;
  readonly member_record_ids: readonly string[];
}): z.infer<typeof ProposedEquivalenceIdentityClusterSchema> {
  const projectId = Id.parse(input.project_id);
  const proposalRevision = z.number().int().positive().parse(input.proposal_revision);
  const memberRecordIds = [...new Set(input.member_record_ids)]
    .map((id) => Id.parse(id)).sort(compare);
  if (memberRecordIds.length < 2) {
    throw new Error("Possible equivalence requires at least two distinct proposed records");
  }
  const digest = hash({
    project_id: projectId,
    proposal_revision: proposalRevision,
    member_record_ids: memberRecordIds,
  }).slice(7, 23);
  return freeze(ProposedEquivalenceIdentityClusterSchema.parse({
    schema_version: CANONICAL_RECORD_IDENTITY_VERSION,
    equivalence_cluster_id: `${projectId}.equivalence.r${proposalRevision}.${digest}`,
    project_id: projectId,
    proposal_revision: proposalRevision,
    status: "possible_equivalence",
    member_record_ids: memberRecordIds,
    authoritative_merge: false,
  }));
}

export const ProposedSemanticRecordSchema = z.object({
  id: Id,
  identity: CanonicalRecordIdentitySchema,
  candidate_ids: z.array(Id).min(1),
  semantic_kind_id: Id,
  statement: Text,
  multilingual: MultilingualStatementSchema,
  source_unit_ids: z.array(Id).min(1),
  classification_status: z.enum(["classified", "classification_required"]),
  origin: z.enum(["explicit", "derived", "human_added"]),
  review_status: z.literal("pending"),
  details: z.array(z.object({ key: Id, value: z.union([
    z.string(), z.number(), z.boolean(), z.array(z.string()),
  ]) }).strict()),
  issues: z.array(z.object({ code: Id, severity: z.enum(["warning", "review_required", "blocking"]) }).strict()),
}).strict();

export function createCanonicalRecordIdentity(input: {
  readonly project_id: string;
  readonly proposal_revision: number;
  readonly semantic_kind_id: string;
  readonly canonical_semantic_key: string;
  readonly stable_source_lineage_keys: readonly string[];
  readonly approved_logical_id?: string;
  readonly predecessor_record_ids?: readonly string[];
}): z.infer<typeof CanonicalRecordIdentitySchema> {
  const projectId = Id.parse(input.project_id);
  const proposalRevision = z.number().int().positive().parse(input.proposal_revision);
  const semanticKindId = Id.parse(input.semantic_kind_id);
  const semanticFingerprint = hash({
    semantic_kind_id: semanticKindId,
    canonical_semantic_key: normalizeSemanticKey(input.canonical_semantic_key),
  });
  const sourceLineageHash = hash([...new Set(input.stable_source_lineage_keys)].sort(compare));
  const identityDigest = hash({
    project_id: projectId,
    proposal_revision: proposalRevision,
    semantic_fingerprint: semanticFingerprint,
    source_lineage_hash: sourceLineageHash,
  }).slice(7, 23);
  return freeze(CanonicalRecordIdentitySchema.parse({
    schema_version: CANONICAL_RECORD_IDENTITY_VERSION,
    record_id: `${projectId}.record.r${proposalRevision}.${identityDigest}`,
    project_id: projectId,
    proposal_revision: proposalRevision,
    semantic_kind_id: semanticKindId,
    semantic_fingerprint: semanticFingerprint,
    source_lineage_hash: sourceLineageHash,
    ...(input.approved_logical_id
      ? { approved_logical_id: Id.parse(input.approved_logical_id) }
      : {}),
    predecessor_record_ids: [...new Set(input.predecessor_record_ids ?? [])]
      .map((id) => Id.parse(id)).sort(compare),
    identity_status: input.approved_logical_id ? "mapped" : "proposed",
  }));
}

export function createRecordIdentityReport(input: {
  readonly project_id: string;
  readonly proposal_revision: number;
  readonly identities: readonly z.input<typeof CanonicalRecordIdentitySchema>[];
  readonly equivalence_clusters?: readonly z.input<
    typeof ProposedEquivalenceIdentityClusterSchema
  >[];
  readonly migrations?: readonly {
    readonly predecessor_record_ids: readonly string[];
    readonly successor_record_ids: readonly string[];
    readonly change_kind: "meaning_preserving" | "meaning_changed";
    readonly approved_logical_id?: string;
    readonly review_status: "pending";
  }[];
}): z.infer<typeof RecordIdentityReportSchema> {
  const projectId = Id.parse(input.project_id);
  const proposalRevision = z.number().int().positive().parse(input.proposal_revision);
  const identities = input.identities.map((identity) => CanonicalRecordIdentitySchema.parse(identity))
    .sort((left, right) => compare(left.record_id, right.record_id));
  unique(identities.map(({ record_id }) => record_id), "record identity");
  if (identities.some((identity) =>
    identity.project_id !== projectId || identity.proposal_revision !== proposalRevision)) {
    throw new Error("Record identity report revision mismatch");
  }
  const equivalenceClusters = (input.equivalence_clusters ?? [])
    .map((cluster) => ProposedEquivalenceIdentityClusterSchema.parse(cluster))
    .sort((left, right) => compare(left.equivalence_cluster_id, right.equivalence_cluster_id));
  unique(equivalenceClusters.map(({ equivalence_cluster_id }) => equivalence_cluster_id),
    "equivalence cluster");
  const identityById = new Map(identities.map((identity) => [identity.record_id, identity]));
  for (const cluster of equivalenceClusters) {
    if (cluster.project_id !== projectId || cluster.proposal_revision !== proposalRevision) {
      throw new Error("Equivalence cluster revision mismatch");
    }
    unique(cluster.member_record_ids, "equivalence cluster member");
    for (const recordId of cluster.member_record_ids) {
      const identity = identityById.get(recordId);
      if (!identity) throw new Error(`Unknown equivalence cluster member: ${recordId}`);
      if (identity.approved_logical_id) {
        throw new Error("Pending equivalence members cannot carry an approved logical identity");
      }
    }
  }
  const byFingerprint = new Map<string, string[]>();
  for (const identity of identities) {
    const ids = byFingerprint.get(identity.semantic_fingerprint) ?? [];
    ids.push(identity.record_id);
    byFingerprint.set(identity.semantic_fingerprint, ids);
  }
  const collisions = [...byFingerprint.entries()]
    .filter(([, recordIds]) => recordIds.length > 1)
    .map(([semanticFingerprint, recordIds]) => ({
      semantic_fingerprint: semanticFingerprint,
      record_ids: recordIds.sort(compare),
      review_required: true as const,
    })).sort((left, right) => compare(left.semantic_fingerprint, right.semantic_fingerprint));
  const migrations = (input.migrations ?? []).map((migration) => {
    const parsed = RecordIdentityReportSchema.shape.migrations.element.parse(migration);
    if (parsed.change_kind === "meaning_preserving" && !parsed.approved_logical_id) {
      throw new Error("Meaning-preserving migration requires approved logical identity");
    }
    return parsed;
  }).sort((left, right) => compare(
    left.predecessor_record_ids.join("\u0000"),
    right.predecessor_record_ids.join("\u0000"),
  ));
  const core = {
    schema_version: CANONICAL_RECORD_IDENTITY_VERSION,
    project_id: projectId,
    proposal_revision: proposalRevision,
    identities,
    equivalence_clusters: equivalenceClusters,
    collisions,
    migrations,
  };
  return freeze(RecordIdentityReportSchema.parse({ ...core, content_hash: hash(core) }));
}

export const ProposedWorkflowNodeSchema = z.object({
  id: Id,
  label: Text,
  semantic_record_ids: z.array(Id),
  source_unit_ids: z.array(Id).min(1),
}).strict();

export const ModelKindSchema = z.enum([
  "activity_flow",
  "business_workflow",
  "bpmn_candidate",
  "functional_decomposition",
  "module_dependency",
  "state_diagram",
  "decision_model",
  "actor_goal_model",
  "sequence_interaction",
  "conceptual_data_model",
]);

export const ModelSupportStatusSchema = z.enum([
  "supported",
  "partially_supported",
  "insufficient_evidence",
  "conflicting_evidence",
  "not_applicable",
  "human_review_required",
]);

export const ModelSupportAssessmentSchema = z.object({
  model_kind: ModelKindSchema,
  support_status: ModelSupportStatusSchema,
  confidence: z.number().min(0).max(1),
  evidence_source_unit_ids: z.array(Id),
  satisfied_evidence: z.array(Id),
  missing_evidence: z.array(Id),
  rationale: Text,
  projection_eligibility: z.enum([
    "normal_proposed",
    "review_only_partial",
    "review_preview",
    "exception_only",
    "none",
  ]),
  review_status: z.literal("pending"),
  proposal_revision: z.number().int().positive(),
}).strict();

const MODEL_KINDS = ModelKindSchema.options;

export function assessSupportedModelKinds(input: {
  readonly proposal_revision: number;
  readonly evidence_counts: Readonly<Record<string, number>>;
  readonly evidence_source_unit_ids?: Readonly<Partial<Record<
    z.infer<typeof ModelKindSchema>,
    readonly string[]
  >>>;
  readonly conflicting_model_kinds?: readonly z.infer<typeof ModelKindSchema>[];
  readonly review_required_model_kinds?: readonly z.infer<typeof ModelKindSchema>[];
  readonly not_applicable_model_kinds?: readonly z.infer<typeof ModelKindSchema>[];
}): readonly z.infer<typeof ModelSupportAssessmentSchema>[] {
  const revision = z.number().int().positive().parse(input.proposal_revision);
  const count = (key: string) => Math.max(0, Math.trunc(input.evidence_counts[key] ?? 0));
  const conflicting = new Set(input.conflicting_model_kinds ?? []);
  const reviewRequired = new Set(input.review_required_model_kinds ?? []);
  const notApplicable = new Set(input.not_applicable_model_kinds ?? []);
  const requirements: Record<z.infer<typeof ModelKindSchema>, {
    readonly supported: boolean;
    readonly partial: boolean;
    readonly satisfied: readonly string[];
    readonly missing: readonly string[];
  }> = {
    activity_flow: evidence(
      [["two_activities", count("activities") >= 2],
        ["ordered_or_dependent_pair", count("activity_relationships") >= 1]],
    ),
    business_workflow: evidence(
      [["two_activities", count("activities") >= 2],
        ["meaningful_process_structure", count("process_structures") >= 1]],
      count("activities") >= 2 && count("activity_relationships") >= 1,
    ),
    bpmn_candidate: evidence(
      [["process_boundary", count("process_boundaries") >= 1],
        ["bpmn_semantics", count("bpmn_semantics") >= 1]],
      count("activities") >= 2 && count("process_structures") >= 1,
    ),
    functional_decomposition: evidence(
      [["functional_areas_or_subcapabilities",
        count("functional_areas") >= 2 || count("subcapabilities") >= 1]],
    ),
    module_dependency: evidence(
      [["two_modules", count("modules") >= 2],
        ["evidence_backed_module_relationship", count("module_relationships") >= 1]],
    ),
    state_diagram: evidence(
      [["two_states", count("states") >= 2],
        ["state_transition", count("state_transitions") >= 1]],
      count("states") >= 2,
    ),
    decision_model: evidence(
      [["condition_outcome_rule", (count("decision_conditions") >= 1
        && count("decision_outcomes") >= 2) || count("decision_rules") >= 1]],
    ),
    actor_goal_model: evidence(
      [["actor", count("actors") >= 1],
        ["actor_goal_capability_or_permission", count("actor_goals") >= 1]],
    ),
    sequence_interaction: evidence(
      [["two_participants", count("participants") >= 2],
        ["ordered_message_exchange", count("ordered_messages") >= 1]],
    ),
    conceptual_data_model: evidence(
      [["entities_or_attributed_entity", count("entities") >= 2
        || (count("entities") >= 1 && count("entity_attributes") >= 1
          && count("entity_relationships") >= 1)]],
    ),
  };
  return MODEL_KINDS.map((modelKind) => {
    const requirement = requirements[modelKind];
    let status: z.infer<typeof ModelSupportStatusSchema>;
    if (notApplicable.has(modelKind)) status = "not_applicable";
    else if (conflicting.has(modelKind)) status = "conflicting_evidence";
    else if (requirement.supported && reviewRequired.has(modelKind)) {
      status = "human_review_required";
    } else if (requirement.supported) status = "supported";
    else if (requirement.partial) status = "partially_supported";
    else status = "insufficient_evidence";
    const projectionEligibility = status === "supported"
      ? "normal_proposed"
      : status === "partially_supported"
        ? "review_only_partial"
        : status === "human_review_required"
          ? "review_preview"
          : status === "conflicting_evidence"
            ? "exception_only"
            : "none";
    const sourceIds = [...new Set(input.evidence_source_unit_ids?.[modelKind] ?? [])]
      .map((id) => Id.parse(id)).sort(compare);
    const confidence = status === "supported" ? 1
      : status === "human_review_required" ? 0.75
        : status === "partially_supported" ? 0.5
          : sourceIds.length > 0 ? 0.25 : 0;
    return ModelSupportAssessmentSchema.parse({
      model_kind: modelKind,
      support_status: status,
      confidence,
      evidence_source_unit_ids: sourceIds,
      satisfied_evidence: requirement.satisfied,
      missing_evidence: requirement.missing,
      rationale: `${modelKind} is ${status.replaceAll("_", " ")} from semantic evidence.`,
      projection_eligibility: projectionEligibility,
      review_status: "pending",
      proposal_revision: revision,
    });
  });
}

function evidence(
  checks: readonly (readonly [string, boolean])[],
  partial = false,
): {
  readonly supported: boolean;
  readonly partial: boolean;
  readonly satisfied: readonly string[];
  readonly missing: readonly string[];
} {
  return {
    supported: checks.every(([, passed]) => passed),
    partial,
    satisfied: checks.filter(([, passed]) => passed).map(([name]) => name),
    missing: checks.filter(([, passed]) => !passed).map(([name]) => name),
  };
}

export const GovernedAssociationSchema = z.object({
  id: Id,
  origin: z.enum(["explicit", "derived", "human_added"]),
  evidence_source_unit_ids: z.array(Id),
  rationale: Text,
  confidence: z.number().min(0).max(1),
  review_status: z.literal("pending"),
  bulk_approval_eligible: z.boolean(),
  blockers: z.array(Id),
  proposal_revision: z.number().int().positive(),
}).strict();

export const ProposedWorkflowSchema = z.object({
  workflow_id: Id,
  label: Text,
  summary: Text,
  operation_ids: z.array(Id),
  source_unit_ids: z.array(Id).min(1),
  governance: GovernedAssociationSchema,
}).strict();

export const ProposedOperationSchema = z.object({
  operation_id: Id,
  workflow_id: Id.optional(),
  label: Text,
  operation_kind: z.enum(["action", "decision", "state", "start", "end", "unknown"]),
  actor: Text.optional(),
  semantic_record_ids: z.array(Id).min(1),
  source_unit_ids: z.array(Id).min(1),
  governance: GovernedAssociationSchema,
}).strict();

export const GovernedWorkflowEdgeSchema = z.object({
  edge_id: Id,
  workflow_id: Id,
  from_operation_id: Id,
  to_operation_id: Id,
  edge_kind: z.enum(["transition", "dependency", "ordering", "branch", "join", "loop"]),
  condition: Text.optional(),
  outcome_label: Text.optional(),
  fanout_group_id: Id.optional(),
  path_semantics: z.enum(["independent_non_exclusive", "conditional_exclusive"]).optional(),
  governance: GovernedAssociationSchema,
}).strict();

export const WorkflowAssignmentSchema = z.object({
  assignment_id: Id,
  record_id: Id,
  workflow_id: Id,
  operation_id: Id.optional(),
  applicability: z.enum(["primary", "supporting"]),
  governance: GovernedAssociationSchema,
}).strict();

export const CrossCuttingAssignmentSchema = z.object({
  assignment_id: Id,
  record_id: Id,
  control_area: Id,
  governance: GovernedAssociationSchema,
}).strict();

export const RelationshipHintSchema = z.object({
  hint_id: Id,
  from_id: Id,
  to_id: Id.optional(),
  relationship_kind: Id,
  source_unit_ids: z.array(Id),
  rationale: Text,
  confidence: z.number().min(0).max(1),
  publishable: z.literal(false),
}).strict();

export const RelationshipCandidateSchema = z.object({
  relationship_intent_id: Id,
  from_id: Id,
  relationship_kind: Id,
  governance: GovernedAssociationSchema,
  targets: z.array(z.object({
    target_candidate_id: Id,
    target_id: Id.optional(),
    target_status: z.enum(["valid", "competing", "unresolved"]),
    evidence_source_unit_ids: z.array(Id),
    rationale: Text,
    confidence: z.number().min(0).max(1),
    review_status: z.literal("pending"),
    blockers: z.array(Id),
  }).strict()),
}).strict();

export const ApprovedRelationshipIdentitySchema = z.object({
  approved_relationship_id: Id,
  relationship_intent_id: Id,
  target_candidate_id: Id,
  target_id: Id,
}).strict();

export function createApprovedRelationshipIdentity(input: {
  readonly relationship_intent_id: string;
  readonly target_candidate_id: string;
  readonly target_id: string;
}): z.infer<typeof ApprovedRelationshipIdentitySchema> {
  const core = {
    relationship_intent_id: Id.parse(input.relationship_intent_id),
    target_candidate_id: Id.parse(input.target_candidate_id),
    target_id: Id.parse(input.target_id),
  };
  return ApprovedRelationshipIdentitySchema.parse({
    approved_relationship_id: `approved.relationship.${hash(core).slice(7, 23)}`,
    ...core,
  });
}

export const ReviewerRelationshipAugmentationSchema = z.object({
  augmentation_id: Id,
  augmentation_type: z.literal("add_relationship"),
  from_id: Id,
  to_id: Id,
  relationship_kind: Id,
  source_unit_ids: z.array(Id),
  rationale: Text,
  authored_by: Id,
  authored_at: z.string().datetime({ offset: true }),
  authored_revision: Id,
  approval_status: z.literal("pending"),
}).strict();

export function createReviewerRelationshipAugmentation(input: {
  readonly from_id: string;
  readonly to_id: string;
  readonly relationship_kind: string;
  readonly source_unit_ids?: readonly string[];
  readonly rationale: string;
  readonly authored_by: string;
  readonly authored_at: string;
  readonly authored_revision: string;
}): z.infer<typeof ReviewerRelationshipAugmentationSchema> {
  const core = {
    augmentation_type: "add_relationship" as const,
    from_id: Id.parse(input.from_id),
    to_id: Id.parse(input.to_id),
    relationship_kind: Id.parse(input.relationship_kind),
    source_unit_ids: [...new Set(input.source_unit_ids ?? [])].map((id) => Id.parse(id)).sort(compare),
    rationale: Text.parse(input.rationale),
    authored_by: Id.parse(input.authored_by),
    authored_at: input.authored_at,
    authored_revision: Id.parse(input.authored_revision),
    approval_status: "pending" as const,
  };
  return freeze(ReviewerRelationshipAugmentationSchema.parse({
    augmentation_id: `reviewer.augmentation.${hash(core).slice(7, 23)}`,
    ...core,
  }));
}

export const ProposedRelationshipSchema = z.object({
  id: Id,
  from_id: Id,
  to_id: Id,
  kind: Id,
  source_unit_ids: z.array(Id).min(1),
}).strict();

export const ProposedProjectModelSchema = z.object({
  schema_version: z.literal(PROPOSED_PROJECT_MODEL_VERSION),
  project_id: Id,
  proposal_revision: z.number().int().positive(),
  lifecycle: z.literal("review_in_progress"),
  authoritative: z.literal(false),
  approval_required: z.literal(true),
  downstream_execution_allowed: z.literal(false),
  source_revision_id: Id,
  semantic_kind_registry_id: Id,
  candidate_inventory_hash: Hash,
  records: z.array(ProposedSemanticRecordSchema),
  model_support: z.array(ModelSupportAssessmentSchema).default([]),
  workflows: z.array(ProposedWorkflowSchema),
  operations: z.array(ProposedOperationSchema),
  workflow_edges: z.array(GovernedWorkflowEdgeSchema),
  workflow_assignments: z.array(WorkflowAssignmentSchema),
  cross_cutting_assignments: z.array(CrossCuttingAssignmentSchema),
  relationship_hints: z.array(RelationshipHintSchema),
  relationship_candidates: z.array(RelationshipCandidateSchema),
  workflow_nodes: z.array(ProposedWorkflowNodeSchema),
  relationships: z.array(ProposedRelationshipSchema),
  source_documents: z.array(z.object({
    document_id: Id, document_version: Text, content_hash: Hash,
  }).strict()).min(1),
  source_coverage: PipelineCoverageReportSchema,
  extraction_findings: CompletenessCriticReportSchema,
  compatibility_projections: z.array(z.object({
    record_id: Id,
    classification: z.enum(["lossless", "lossy", "projection_gap"]),
    reason: Text.optional(),
  }).strict()),
  approval_blockers: z.array(Id),
  summary: z.object({
    workflow_steps: z.number().int().nonnegative(),
    requirements: z.number().int().nonnegative(),
    unknown_items: z.number().int().nonnegative(),
    derived_items: z.number().int().nonnegative(),
    open_findings: z.number().int().nonnegative(),
    publish_blockers: z.number().int().nonnegative(),
  }).strict(),
  content_hash: Hash,
}).strict();

export const BulkApprovalPolicySchema = z.object({
  version: Text,
  confidence_threshold: z.number().min(0).max(1),
  content_hash: Hash,
}).strict();

export const BulkApprovalEligibilitySchema = z.object({
  proposal_hash: Hash,
  policy_version: Text,
  policy_hash: Hash,
  items: z.array(z.object({
    record_id: Id,
    eligible: z.boolean(),
    blockers: z.array(Id),
  }).strict()),
  workflows: z.array(z.object({
    workflow_id: Id,
    eligible: z.boolean(),
    eligible_record_ids: z.array(Id),
    blocked_record_ids: z.array(Id),
  }).strict()),
  summary: z.object({
    total_items: z.number().int().nonnegative(),
    eligible_items: z.number().int().nonnegative(),
    blocked_items: z.number().int().nonnegative(),
  }).strict(),
  content_hash: Hash,
}).strict();

export const ExpandedApprovalEligibilitySchema = z.object({
  proposal_hash: Hash,
  proposal_revision: z.number().int().positive(),
  entities: z.array(z.object({
    entity_type: z.enum([
      "record", "workflow_assignment", "cross_cutting_assignment",
      "relationship_intent", "relationship_target", "workflow_edge",
      "terminology_proposal",
    ]),
    entity_id: Id,
    eligible: z.boolean(),
    bulk_approval_eligible: z.boolean(),
    blockers: z.array(Id),
  }).strict()),
  content_hash: Hash,
}).strict();

export function calculateExpandedApprovalEligibility(input: {
  readonly model: z.input<typeof ProposedProjectModelSchema>;
  readonly atomic_claim_coverage?: z.input<typeof AtomicClaimCoverageReportSchema>;
  readonly terminology_proposals?: readonly z.input<typeof TerminologyProposalSchema>[];
}): z.infer<typeof ExpandedApprovalEligibilitySchema> {
  const model = ProposedProjectModelSchema.parse(input.model);
  const claimCoverage = input.atomic_claim_coverage
    ? AtomicClaimCoverageReportSchema.parse(input.atomic_claim_coverage)
    : undefined;
  if (claimCoverage && claimCoverage.source_revision_id !== model.source_revision_id) {
    throw new Error("Atomic claim eligibility revision mismatch");
  }
  const uncoveredBlocksAll = claimCoverage?.entries.some(({ disposition }) =>
    disposition === "uncovered") ?? false;
  const claimBlockers = new Map<string, Set<string>>();
  for (const entry of claimCoverage?.entries ?? []) {
    if (["represented", "duplicate", "not_applicable"].includes(entry.disposition)) continue;
    for (const recordId of entry.record_ids) {
      const blockers = claimBlockers.get(recordId) ?? new Set<string>();
      blockers.add(`claim-${entry.disposition}`);
      claimBlockers.set(recordId, blockers);
    }
  }
  const entities: z.input<typeof ExpandedApprovalEligibilitySchema>["entities"] = [];
  for (const record of model.records) {
    const blockers = new Set<string>(claimBlockers.get(record.id) ?? []);
    if (uncoveredBlocksAll) blockers.add("uncovered-claim");
    if (record.semantic_kind_id === "ces.kind.unknown") blockers.add("unknown-semantic-kind");
    if (record.classification_status === "classification_required") blockers.add("classification-required");
    if (record.multilingual.translation_status === "review_required") blockers.add("language-review-required");
    record.issues.filter(({ severity }) => severity !== "warning")
      .forEach(({ code }) => blockers.add(code));
    entities.push({
      entity_type: "record", entity_id: record.id,
      eligible: blockers.size === 0,
      bulk_approval_eligible: blockers.size === 0 && record.origin === "explicit",
      blockers: [...blockers].sort(compare),
    });
  }
  const addGoverned = (
    entityType: "workflow_assignment" | "cross_cutting_assignment"
      | "relationship_intent" | "workflow_edge",
    entityId: string,
    governance: z.infer<typeof GovernedAssociationSchema>,
  ): void => {
    const blockers = new Set(governance.blockers);
    if (uncoveredBlocksAll) blockers.add("uncovered-claim");
    const reviewOnly = new Set(entityType === "workflow_edge"
      ? ["derived-topology-requires-review", "derived-requires-review"]
      : entityType === "workflow_assignment" ? ["derived-assignment"] : []);
    const approvalBlockers = [...blockers].filter((blocker) => !reviewOnly.has(blocker));
    entities.push({
      entity_type: entityType,
      entity_id: entityId,
      eligible: approvalBlockers.length === 0,
      bulk_approval_eligible: blockers.size === 0 && governance.bulk_approval_eligible,
      blockers: [...blockers].sort(compare),
    });
  };
  model.workflow_assignments.forEach((assignment) =>
    addGoverned("workflow_assignment", assignment.assignment_id, assignment.governance));
  model.cross_cutting_assignments.forEach((assignment) =>
    addGoverned("cross_cutting_assignment", assignment.assignment_id, assignment.governance));
  model.workflow_edges.forEach((edge) =>
    addGoverned("workflow_edge", edge.edge_id, edge.governance));
  for (const relationship of model.relationship_candidates) {
    addGoverned("relationship_intent", relationship.relationship_intent_id,
      relationship.governance);
    for (const target of relationship.targets) {
      const blockers = new Set(target.blockers);
      if (!target.target_id || target.target_status !== "valid") blockers.add("target-unresolved");
      if (uncoveredBlocksAll) blockers.add("uncovered-claim");
      entities.push({
        entity_type: "relationship_target",
        entity_id: target.target_candidate_id,
        eligible: blockers.size === 0,
        bulk_approval_eligible: false,
        blockers: [...blockers].sort(compare),
      });
    }
  }
  for (const proposalValue of input.terminology_proposals ?? []) {
    const proposal = TerminologyProposalSchema.parse(proposalValue);
    entities.push({
      entity_type: "terminology_proposal",
      entity_id: proposal.proposal_id,
      eligible: true,
      bulk_approval_eligible: false,
      blockers: [],
    });
  }
  entities.sort((left, right) =>
    compare(`${left.entity_type}:${left.entity_id}`, `${right.entity_type}:${right.entity_id}`));
  const core = {
    proposal_hash: model.content_hash,
    proposal_revision: model.proposal_revision,
    entities,
  };
  return freeze(ExpandedApprovalEligibilitySchema.parse({
    ...core, content_hash: hash(core),
  }));
}

export function createProposedProjectModel(input: {
  readonly project_id: string;
  readonly proposal_revision: number;
  readonly source_revision_id: string;
  readonly kind_registry: z.input<typeof SemanticKindRegistrySchema>;
  readonly candidate_inventory: z.input<typeof AtlasCandidateInventorySchema>;
  readonly records: readonly z.input<typeof ProposedSemanticRecordSchema>[];
  readonly model_support?: readonly z.input<typeof ModelSupportAssessmentSchema>[];
  readonly workflows: readonly z.input<typeof ProposedWorkflowSchema>[];
  readonly operations: readonly z.input<typeof ProposedOperationSchema>[];
  readonly workflow_edges?: readonly z.input<typeof GovernedWorkflowEdgeSchema>[];
  readonly workflow_assignments?: readonly z.input<typeof WorkflowAssignmentSchema>[];
  readonly cross_cutting_assignments?: readonly z.input<typeof CrossCuttingAssignmentSchema>[];
  readonly relationship_hints?: readonly z.input<typeof RelationshipHintSchema>[];
  readonly relationship_candidates?: readonly z.input<typeof RelationshipCandidateSchema>[];
  readonly workflow_nodes: readonly z.input<typeof ProposedWorkflowNodeSchema>[];
  readonly relationships?: readonly z.input<typeof ProposedRelationshipSchema>[];
  readonly source_documents: readonly { document_id: string; document_version: string; content_hash: string }[];
  readonly source_coverage: z.input<typeof PipelineCoverageReportSchema>;
  readonly extraction_findings: z.input<typeof CompletenessCriticReportSchema>;
  readonly compatibility_projections: readonly {
    record_id: string; classification: "lossless" | "lossy" | "projection_gap"; reason?: string;
  }[];
  readonly approval_blockers?: readonly string[];
}): z.infer<typeof ProposedProjectModelSchema> {
  const registry = SemanticKindRegistrySchema.parse(input.kind_registry);
  const inventory = AtlasCandidateInventorySchema.parse(input.candidate_inventory);
  const coverage = PipelineCoverageReportSchema.parse(input.source_coverage);
  const findings = CompletenessCriticReportSchema.parse(input.extraction_findings);
  if (inventory.source_revision_id !== input.source_revision_id
    || coverage.source_revision_id !== input.source_revision_id
    || findings.source_revision_id !== input.source_revision_id
    || inventory.semantic_kind_registry_id !== registry.id) {
    throw new Error("Proposed model revision tuple mismatch");
  }
  const candidates = new Map(inventory.candidates.map((candidate) =>
    [candidate.candidate_id, candidate]));
  const kinds = new Set(registry.definitions.map(({ id }) => id));
  const sourceIds = new Set(coverage.source_coverage.map(({ source_unit_id }) => source_unit_id));
  const records = input.records.map((record) => ProposedSemanticRecordSchema.parse(record))
    .sort((a, b) => compare(a.id, b.id));
  const modelSupport = (input.model_support ?? [])
    .map((assessment) => ModelSupportAssessmentSchema.parse(assessment))
    .sort((left, right) => compare(left.model_kind, right.model_kind));
  unique(modelSupport.map(({ model_kind }) => model_kind), "model support assessment");
  if (modelSupport.some(({ proposal_revision }) => proposal_revision !== input.proposal_revision)) {
    throw new Error("Model support assessment revision mismatch");
  }
  unique(records.map(({ id }) => id), "record");
  for (const record of records) {
    if (record.id !== record.identity.record_id
      || record.semantic_kind_id !== record.identity.semantic_kind_id
      || record.identity.project_id !== input.project_id
      || record.identity.proposal_revision !== input.proposal_revision) {
      throw new Error(`Canonical record identity mismatch: ${record.id}`);
    }
    if (record.statement !== record.multilingual.canonical_statement) {
      throw new Error(`Canonical statement mismatch: ${record.id}`);
    }
    members(record.candidate_ids, new Set(candidates.keys()), "candidate", record.id);
    members(record.source_unit_ids, sourceIds, "source unit", record.id);
    if (!kinds.has(record.semantic_kind_id)) throw new Error(`Unknown semantic kind: ${record.semantic_kind_id}`);
    if (record.origin === "derived"
      && !record.issues.some(({ code }) => code === "derived-interpretation-requires-review")) {
      throw new Error(`Derived record requires review issue: ${record.id}`);
    }
  }
  const recordIds = new Set(records.map(({ id }) => id));
  const workflows = input.workflows.map((workflow) => ProposedWorkflowSchema.parse(workflow))
    .sort((left, right) => compare(left.workflow_id, right.workflow_id));
  unique(workflows.map(({ workflow_id }) => workflow_id), "workflow");
  const workflowIds = new Set(workflows.map(({ workflow_id }) => workflow_id));
  const operations = input.operations.map((operation) => ProposedOperationSchema.parse(operation))
    .sort((left, right) => compare(left.operation_id, right.operation_id));
  unique(operations.map(({ operation_id }) => operation_id), "operation");
  const operationIds = new Set(operations.map(({ operation_id }) => operation_id));
  for (const workflow of workflows) {
    members(workflow.operation_ids, operationIds, "operation", workflow.workflow_id);
    members(workflow.source_unit_ids, sourceIds, "source unit", workflow.workflow_id);
    validateGovernance(workflow.governance, input.proposal_revision, sourceIds);
  }
  for (const operation of operations) {
    if (operation.workflow_id && !workflowIds.has(operation.workflow_id)) {
      throw new Error(`Unknown workflow on operation: ${operation.operation_id}`);
    }
    members(operation.semantic_record_ids, recordIds, "record", operation.operation_id);
    members(operation.source_unit_ids, sourceIds, "source unit", operation.operation_id);
    validateGovernance(operation.governance, input.proposal_revision, sourceIds);
  }
  const workflowEdges = (input.workflow_edges ?? [])
    .map((edge) => GovernedWorkflowEdgeSchema.parse(edge))
    .sort((left, right) => compare(left.edge_id, right.edge_id));
  unique(workflowEdges.map(({ edge_id }) => edge_id), "workflow edge");
  for (const edge of workflowEdges) {
    if (!workflowIds.has(edge.workflow_id)) throw new Error(`Unknown workflow edge owner: ${edge.edge_id}`);
    members([edge.from_operation_id, edge.to_operation_id], operationIds, "operation", edge.edge_id);
    validateGovernance(edge.governance, input.proposal_revision, sourceIds);
  }
  const workflowAssignments = (input.workflow_assignments ?? [])
    .map((assignment) => WorkflowAssignmentSchema.parse(assignment))
    .sort((left, right) => compare(left.assignment_id, right.assignment_id));
  unique(workflowAssignments.map(({ assignment_id }) => assignment_id), "workflow assignment");
  for (const assignment of workflowAssignments) {
    members([assignment.record_id], recordIds, "record", assignment.assignment_id);
    members([assignment.workflow_id], workflowIds, "workflow", assignment.assignment_id);
    if (assignment.operation_id) {
      members([assignment.operation_id], operationIds, "operation", assignment.assignment_id);
      const operation = operations.find(({ operation_id }) =>
        operation_id === assignment.operation_id)!;
      if (operation.workflow_id && operation.workflow_id !== assignment.workflow_id) {
        throw new Error(`Assignment workflow/operation mismatch: ${assignment.assignment_id}`);
      }
    }
    validateGovernance(assignment.governance, input.proposal_revision, sourceIds);
  }
  const crossCuttingAssignments = (input.cross_cutting_assignments ?? [])
    .map((assignment) => CrossCuttingAssignmentSchema.parse(assignment))
    .sort((left, right) => compare(left.assignment_id, right.assignment_id));
  unique(crossCuttingAssignments.map(({ assignment_id }) => assignment_id),
    "cross-cutting assignment");
  for (const assignment of crossCuttingAssignments) {
    members([assignment.record_id], recordIds, "record", assignment.assignment_id);
    validateGovernance(assignment.governance, input.proposal_revision, sourceIds);
  }
  const governedEndpointIds = new Set([
    ...recordIds, ...workflowIds, ...operationIds,
    ...input.workflow_nodes.map(({ id }) => Id.parse(id)),
  ]);
  const relationshipHints = (input.relationship_hints ?? [])
    .map((hint) => RelationshipHintSchema.parse(hint))
    .sort((left, right) => compare(left.hint_id, right.hint_id));
  unique(relationshipHints.map(({ hint_id }) => hint_id), "relationship hint");
  for (const hint of relationshipHints) {
    members([hint.from_id, ...(hint.to_id ? [hint.to_id] : [])],
      governedEndpointIds, "relationship endpoint", hint.hint_id);
    members(hint.source_unit_ids, sourceIds, "source unit", hint.hint_id);
  }
  const relationshipCandidates = (input.relationship_candidates ?? [])
    .map((candidate) => RelationshipCandidateSchema.parse(candidate))
    .sort((left, right) => compare(left.relationship_intent_id, right.relationship_intent_id));
  unique(relationshipCandidates.map(({ relationship_intent_id }) => relationship_intent_id),
    "relationship intent");
  unique(relationshipCandidates.flatMap(({ targets }) =>
    targets.map(({ target_candidate_id }) => target_candidate_id)), "relationship target");
  for (const candidate of relationshipCandidates) {
    members([candidate.from_id], governedEndpointIds,
      "relationship endpoint", candidate.relationship_intent_id);
    for (const target of candidate.targets) {
      if (target.target_id) {
        members([target.target_id], governedEndpointIds,
          "relationship target", target.target_candidate_id);
      }
      members(target.evidence_source_unit_ids, sourceIds,
        "target evidence", target.target_candidate_id);
      if (target.target_status === "unresolved" && target.target_id) {
        throw new Error(`Unresolved target cannot identify an endpoint: ${target.target_candidate_id}`);
      }
    }
    validateGovernance(candidate.governance, input.proposal_revision, sourceIds);
    if (candidate.governance.origin !== "explicit"
      && candidate.governance.bulk_approval_eligible) {
      throw new Error(
        `Derived relationship cannot be bulk eligible: ${candidate.relationship_intent_id}`,
      );
    }
  }
  const workflowNodes = input.workflow_nodes.map((node) => ProposedWorkflowNodeSchema.parse(node))
    .sort((a, b) => compare(a.id, b.id));
  unique(workflowNodes.map(({ id }) => id), "workflow node");
  for (const node of workflowNodes) {
    members(node.semantic_record_ids, recordIds, "record", node.id);
    members(node.source_unit_ids, sourceIds, "source unit", node.id);
  }
  const nodeIds = new Set(workflowNodes.map(({ id }) => id));
  const relationships = (input.relationships ?? []).map((item) =>
    ProposedRelationshipSchema.parse(item)).sort((a, b) => compare(a.id, b.id));
  for (const edge of relationships) {
    members([edge.from_id, edge.to_id], nodeIds, "workflow node", edge.id);
    members(edge.source_unit_ids, sourceIds, "source unit", edge.id);
  }
  const projections = [...input.compatibility_projections].sort((a, b) =>
    compare(a.record_id, b.record_id));
  unique(projections.map(({ record_id }) => record_id), "compatibility projection");
  if (projections.length !== records.length
    || projections.some(({ record_id }) => !recordIds.has(record_id))) {
    throw new Error("Compatibility projection must disposition every record");
  }
  const blockers = [...new Set(input.approval_blockers ?? [])].map((id) => Id.parse(id)).sort(compare);
  const core = {
    schema_version: PROPOSED_PROJECT_MODEL_VERSION,
    project_id: Id.parse(input.project_id),
    proposal_revision: z.number().int().positive().parse(input.proposal_revision),
    lifecycle: "review_in_progress" as const,
    authoritative: false as const,
    approval_required: true as const,
    downstream_execution_allowed: false as const,
    source_revision_id: Id.parse(input.source_revision_id),
    semantic_kind_registry_id: registry.id,
    candidate_inventory_hash: inventory.content_hash,
    records, model_support: modelSupport, workflows, operations, workflow_edges: workflowEdges,
    workflow_assignments: workflowAssignments,
    cross_cutting_assignments: crossCuttingAssignments,
    relationship_hints: relationshipHints,
    relationship_candidates: relationshipCandidates,
    workflow_nodes: workflowNodes, relationships,
    source_documents: [...input.source_documents].sort((a, b) => compare(a.document_id, b.document_id)),
    source_coverage: coverage,
    extraction_findings: findings,
    compatibility_projections: projections,
    approval_blockers: blockers,
    summary: {
      workflow_steps: operations.length,
      requirements: records.length,
      unknown_items: records.filter(({ semantic_kind_id }) => semantic_kind_id === "ces.kind.unknown").length,
      derived_items: records.filter(({ origin }) => origin === "derived").length,
      open_findings: findings.counts.open,
      publish_blockers: blockers.length + findings.counts.blocking_open,
    },
  };
  return freeze(ProposedProjectModelSchema.parse({
    ...core, content_hash: hash(core),
  }));
}

export async function publishProposedProjectModel(
  filePath: string,
  modelValue: z.input<typeof ProposedProjectModelSchema>,
): Promise<void> {
  const model = ProposedProjectModelSchema.parse(modelValue);
  await mkdir(dirname(filePath), { recursive: true });
  const staging = `${filePath}.${model.content_hash.slice(7, 19)}.staging`;
  const bytes = `${JSON.stringify(canonical(model), null, 2)}\n`;
  await writeFile(staging, bytes, { encoding: "utf8", flag: "wx" });
  try {
    await link(staging, filePath);
  } finally {
    await unlink(staging).catch(() => undefined);
  }
}

export function calculateBulkApprovalEligibility(input: {
  readonly model: z.input<typeof ProposedProjectModelSchema>;
  readonly candidate_inventory: z.input<typeof AtlasCandidateInventorySchema>;
  readonly policy: z.input<typeof BulkApprovalPolicySchema>;
}): z.infer<typeof BulkApprovalEligibilitySchema> {
  const model = ProposedProjectModelSchema.parse(input.model);
  const inventory = AtlasCandidateInventorySchema.parse(input.candidate_inventory);
  const policy = BulkApprovalPolicySchema.parse(input.policy);
  if (inventory.content_hash !== model.candidate_inventory_hash) {
    throw new Error("Bulk eligibility candidate inventory mismatch");
  }
  const candidates = new Map(inventory.candidates.map((candidate) =>
    [candidate.candidate_id, candidate]));
  const items = model.records.map((record) => {
    const blockers = new Set<string>();
    const linked = record.candidate_ids.map((id) => candidates.get(id)!);
    if (record.source_unit_ids.length === 0) blockers.add("source-missing");
    if (record.semantic_kind_id === "ces.kind.unknown") blockers.add("unknown-semantic-kind");
    if (record.classification_status === "classification_required") {
      blockers.add("classification-required");
    }
    if (record.origin === "derived") blockers.add("derived-interpretation-requires-review");
    if (linked.some(({ confidence }) => confidence < policy.confidence_threshold)) {
      blockers.add("low-confidence");
    }
    for (const issue of record.issues) {
      if (issue.severity !== "warning") blockers.add(issue.code);
    }
    return { record_id: record.id, eligible: blockers.size === 0,
      blockers: [...blockers].sort(compare) };
  }).sort((a, b) => compare(a.record_id, b.record_id));
  const byRecord = new Map(items.map((item) => [item.record_id, item]));
  const workflows = model.workflow_nodes.map((workflow) => {
    const contained = workflow.semantic_record_ids.map((id) => byRecord.get(id)!);
    return {
      workflow_id: workflow.id,
      eligible: contained.length > 0 && contained.every(({ eligible }) => eligible),
      eligible_record_ids: contained.filter(({ eligible }) => eligible)
        .map(({ record_id }) => record_id).sort(compare),
      blocked_record_ids: contained.filter(({ eligible }) => !eligible)
        .map(({ record_id }) => record_id).sort(compare),
    };
  }).sort((a, b) => compare(a.workflow_id, b.workflow_id));
  const core = {
    proposal_hash: model.content_hash,
    policy_version: policy.version,
    policy_hash: policy.content_hash,
    items, workflows,
    summary: {
      total_items: items.length,
      eligible_items: items.filter(({ eligible }) => eligible).length,
      blocked_items: items.filter(({ eligible }) => !eligible).length,
    },
  };
  return freeze(BulkApprovalEligibilitySchema.parse({
    ...core, content_hash: hash(core),
  }));
}

export function createBulkApprovalPolicy(
  version: string,
  confidenceThreshold: number,
): z.infer<typeof BulkApprovalPolicySchema> {
  const core = {
    version: Text.parse(version),
    confidence_threshold: z.number().min(0).max(1).parse(confidenceThreshold),
  };
  return freeze(BulkApprovalPolicySchema.parse({
    ...core, content_hash: hash(core),
  }));
}

export function assertBulkApprovalSelection(
  eligibilityValue: z.input<typeof BulkApprovalEligibilitySchema>,
  selectedRecordIds: readonly string[],
): void {
  const eligibility = BulkApprovalEligibilitySchema.parse(eligibilityValue);
  const byRecord = new Map(eligibility.items.map((item) => [item.record_id, item]));
  for (const idValue of selectedRecordIds) {
    const id = Id.parse(idValue);
    const item = byRecord.get(id);
    if (!item) throw new Error(`Unknown bulk approval record: ${id}`);
    if (!item.eligible) {
      throw new Error(`Bulk approval blocked for ${id}: ${item.blockers.join(",")}`);
    }
  }
}

function validateGovernance(
  governance: z.infer<typeof GovernedAssociationSchema>,
  proposalRevision: number,
  sourceIds: ReadonlySet<string>,
): void {
  if (governance.proposal_revision !== proposalRevision) {
    throw new Error(`Governance proposal revision mismatch: ${governance.id}`);
  }
  members(governance.evidence_source_unit_ids, sourceIds, "source evidence", governance.id);
  if (governance.origin === "explicit" && governance.evidence_source_unit_ids.length === 0) {
    throw new Error(`Explicit governance requires source evidence: ${governance.id}`);
  }
  if (governance.origin !== "explicit" && governance.bulk_approval_eligible) {
    throw new Error(`Derived governance cannot be bulk eligible: ${governance.id}`);
  }
}

function members(values: readonly string[], allowed: ReadonlySet<string>, label: string, owner: string): void {
  const missing = values.find((value) => !allowed.has(value));
  if (missing) throw new Error(`Unknown ${label} on ${owner}: ${missing}`);
}
function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function normalizeSemanticKey(value: string): string {
  return Text.parse(value).normalize("NFKC").toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function hash(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex")}`;
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonical(record[key])]));
  }
  return value;
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
