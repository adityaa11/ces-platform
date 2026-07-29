import { createHash } from "node:crypto";
import { link, mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  CompletenessCriticReportSchema,
  PipelineCoverageReportSchema,
} from "@company/ces-atlas-coverage";
import { AtlasCandidateInventorySchema } from "@company/ces-atlas-role-contracts";
import {
  MultilingualStatementSchema,
  SemanticKindRegistrySchema,
} from "@company/ces-semantic-record-schema";
import { z } from "zod";

export const PROPOSED_PROJECT_MODEL_VERSION = "1.1.0" as const;
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

export const RecordIdentityReportSchema = z.object({
  schema_version: z.literal(CANONICAL_RECORD_IDENTITY_VERSION),
  project_id: Id,
  proposal_revision: z.number().int().positive(),
  identities: z.array(CanonicalRecordIdentitySchema),
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

export function createProposedProjectModel(input: {
  readonly project_id: string;
  readonly proposal_revision: number;
  readonly source_revision_id: string;
  readonly kind_registry: z.input<typeof SemanticKindRegistrySchema>;
  readonly candidate_inventory: z.input<typeof AtlasCandidateInventorySchema>;
  readonly records: readonly z.input<typeof ProposedSemanticRecordSchema>[];
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
  const workflows = input.workflow_nodes.map((node) => ProposedWorkflowNodeSchema.parse(node))
    .sort((a, b) => compare(a.id, b.id));
  unique(workflows.map(({ id }) => id), "workflow node");
  for (const node of workflows) {
    members(node.semantic_record_ids, recordIds, "record", node.id);
    members(node.source_unit_ids, sourceIds, "source unit", node.id);
  }
  const nodeIds = new Set(workflows.map(({ id }) => id));
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
    records, workflow_nodes: workflows, relationships,
    source_documents: [...input.source_documents].sort((a, b) => compare(a.document_id, b.document_id)),
    source_coverage: coverage,
    extraction_findings: findings,
    compatibility_projections: projections,
    approval_blockers: blockers,
    summary: {
      workflow_steps: workflows.length,
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
