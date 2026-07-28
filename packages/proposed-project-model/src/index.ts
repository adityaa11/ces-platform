import { createHash } from "node:crypto";
import { link, mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  CompletenessCriticReportSchema,
  PipelineCoverageReportSchema,
} from "@company/ces-atlas-coverage";
import { AtlasCandidateInventorySchema } from "@company/ces-atlas-role-contracts";
import { SemanticKindRegistrySchema } from "@company/ces-semantic-record-schema";
import { z } from "zod";

export const PROPOSED_PROJECT_MODEL_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

export const ProposedSemanticRecordSchema = z.object({
  id: Id,
  candidate_ids: z.array(Id).min(1),
  semantic_kind_id: Id,
  statement: Text,
  source_unit_ids: z.array(Id).min(1),
  classification_status: z.enum(["classified", "classification_required"]),
  origin: z.enum(["explicit", "derived", "human_added"]),
  review_status: z.literal("pending"),
  details: z.array(z.object({ key: Id, value: z.union([
    z.string(), z.number(), z.boolean(), z.array(z.string()),
  ]) }).strict()),
  issues: z.array(z.object({ code: Id, severity: z.enum(["warning", "review_required", "blocking"]) }).strict()),
}).strict();

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

function members(values: readonly string[], allowed: ReadonlySet<string>, label: string, owner: string): void {
  const missing = values.find((value) => !allowed.has(value));
  if (missing) throw new Error(`Unknown ${label} on ${owner}: ${missing}`);
}
function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
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
