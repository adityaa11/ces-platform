import { createHash } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  assertPublishableCoverage,
  CoverageReportSchema,
} from "@company/ces-atlas-coverage";
import {
  classifyLegacyProjection,
  SemanticCollectionSchema,
  SemanticRecordSchema,
} from "@company/ces-semantic-record-schema";
import { projectWorkflowGraph, WorkflowGraphSchema } from "@company/ces-atlas-intent-graph";
import { ProposalApprovalLedgerSchema } from "@company/ces-atlas-review";
import { ProposedProjectModelSchema } from "@company/ces-proposed-project-model";
import { z } from "zod";

export const APPROVED_PROJECT_MODEL_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

export const ApprovedConceptSchema = z.object({
  id: Id,
  kind: z.enum(["actor", "entity", "field", "state", "action", "event", "calculation", "report"]),
  canonical_label: Text,
  aliases: z.array(Text),
  source_unit_ids: z.array(Id).min(1),
}).strict();

export const ApprovedSemanticRecordSchema = z.object({
  id: Id,
  kind: z.enum([
    "functional_requirement", "business_rule", "permission", "validation", "calculation",
    "state_model", "workflow", "data", "report", "acceptance_criterion", "deliverable",
    "nonfunctional_requirement",
  ]),
  title: Text,
  statement: Text,
  source_unit_ids: z.array(Id).min(1),
  concept_ids: z.array(Id),
  origin: z.enum(["explicit", "inferred"]),
  inference_rationale: Text.optional(),
  reviewed_payload: z.record(z.string(), z.unknown()),
}).strict();

export const ApprovedProjectModelSchema = z.object({
  schema_version: z.literal(APPROVED_PROJECT_MODEL_VERSION),
  id: Id,
  project_id: Id,
  source_revision_id: Id,
  source_content_hash: Hash,
  lexicon_revision_id: Id,
  lexicon_content_hash: Hash,
  semantic_revision_id: Id,
  semantic_content_hash: Hash,
  review_decision_hash: Hash,
  coverage_content_hash: Hash,
  approved_by: z.array(Text).min(1),
  approved_at: z.string().datetime({ offset: true }),
  concepts: z.array(ApprovedConceptSchema),
  records: z.array(ApprovedSemanticRecordSchema),
  relationships: SemanticCollectionSchema.shape.relationships,
  content_hash: Hash,
}).strict();

export const ProjectionResultSchema = z.object({
  schema_version: z.literal(APPROVED_PROJECT_MODEL_VERSION),
  project_model_id: Id,
  consumer: Id,
  status: z.enum(["complete", "partial", "blocked"]),
  projected_record_ids: z.array(Id),
  gaps: z.array(z.object({
    semantic_record_id: Id,
    classification: z.enum(["lossy", "projection_gap"]),
    reason: Text,
  }).strict()),
  content_hash: Hash,
}).strict();

export const HardenedApprovedRecordSchema = z.object({
  id: Id,
  revision: z.number().int().positive(),
  origin_revision: z.number().int().positive(),
  semantic_kind_id: Id,
  statement: Text,
  source_unit_ids: z.array(Id).min(1),
  candidate_ids: z.array(Id),
  proposal_statement: Text.optional(),
  decision_ids: z.array(Id).min(1),
  parent_record_ids: z.array(Id),
  origin: z.enum(["explicit", "derived", "human_added"]),
  status: z.literal("approved"),
}).strict();

export const HardenedApprovedProjectModelSchema = z.object({
  schema_version: z.literal(APPROVED_PROJECT_MODEL_VERSION),
  id: Id,
  project_id: Id,
  model_revision: z.number().int().positive(),
  lifecycle: z.literal("approved"),
  authoritative: z.literal(true),
  approval_required: z.literal(false),
  downstream_execution_allowed: z.literal(true),
  source_revision_id: Id,
  semantic_kind_registry_id: Id,
  proposal_hash: Hash,
  approval_ledger_hash: Hash,
  records: z.array(HardenedApprovedRecordSchema),
  workflow_nodes: ProposedProjectModelSchema.shape.workflow_nodes,
  relationships: ProposedProjectModelSchema.shape.relationships,
  approved_by: z.array(Text).min(1),
  approved_at: z.string().datetime({ offset: true }),
  content_hash: Hash,
}).strict();

export const HardenedApprovalPublicationSchema = z.object({
  model: HardenedApprovedProjectModelSchema,
  graph: WorkflowGraphSchema,
}).strict();

export function materializeHardenedApprovedProjectModel(input: {
  readonly proposal: z.input<typeof ProposedProjectModelSchema>;
  readonly ledger: z.input<typeof ProposalApprovalLedgerSchema>;
}): z.infer<typeof HardenedApprovalPublicationSchema> {
  const proposal = ProposedProjectModelSchema.parse(input.proposal);
  const ledger = ProposalApprovalLedgerSchema.parse(input.ledger);
  if (ledger.proposal_hash !== proposal.content_hash
    || ledger.proposal_revision !== proposal.proposal_revision) {
    throw new Error("Approval ledger is stale for proposal");
  }
  if (proposal.extraction_findings.counts.blocking_open > 0) {
    throw new Error("Open blocking extraction findings prevent publication");
  }
  const decisionsByRecord = new Map<string, typeof ledger.decisions>();
  for (const decision of ledger.decisions) {
    for (const id of decision.target_record_ids) {
      const values = decisionsByRecord.get(id) ?? [];
      decisionsByRecord.set(id, [...values, decision]);
    }
  }
  const records: z.infer<typeof HardenedApprovedRecordSchema>[] = [];
  const consumed = new Set<string>();
  for (const proposed of proposal.records) {
    if (consumed.has(proposed.id)) continue;
    const history = decisionsByRecord.get(proposed.id) ?? [];
    const terminal = history.at(-1);
    if (!terminal) throw new Error(`Missing approval decision for ${proposed.id}`);
    if (terminal.action === "correction_requested" || terminal.action === "mark_ambiguous") {
      throw new Error(`Unresolved approval blocker for ${proposed.id}`);
    }
    if (terminal.action === "reject") continue;
    if (terminal.action === "merge") {
      terminal.target_record_ids.forEach((id) => consumed.add(id));
      const replacement = terminal.replacement_records[0]!;
      const mergeHash = createHash("sha256")
        .update(terminal.target_record_ids.slice().sort(compare).join("\0")
          + "\0" + replacement.statement)
        .digest("hex").slice(0, 12);
      records.push(HardenedApprovedRecordSchema.parse({
        ...replacement,
        id: `${proposal.project_id}.record.merge.${mergeHash}`,
        revision: 1, origin_revision: proposal.proposal_revision,
        decision_ids: [terminal.id], parent_record_ids: terminal.target_record_ids.sort(compare),
        origin: "human_added", status: "approved",
      }));
      continue;
    }
    if (terminal.action === "split") {
      const replacements = terminal.replacement_records;
      replacements.forEach((replacement, index) => records.push(HardenedApprovedRecordSchema.parse({
        ...replacement,
        id: index === 0 ? proposed.id : replacement.id,
        revision: index === 0 ? 2 : 1,
        origin_revision: proposal.proposal_revision,
        proposal_statement: proposed.statement,
        decision_ids: [terminal.id], parent_record_ids: [proposed.id],
        origin: "human_added", status: "approved",
      })));
      consumed.add(proposed.id);
      continue;
    }
    const corrected = ["corrected_approve", "correct_classification"].includes(terminal.action);
    records.push(HardenedApprovedRecordSchema.parse({
      id: proposed.id,
      revision: corrected ? 2 : 1,
      origin_revision: proposal.proposal_revision,
      semantic_kind_id: terminal.approved_semantic_kind_id ?? proposed.semantic_kind_id,
      statement: terminal.approved_statement ?? proposed.statement,
      source_unit_ids: proposed.source_unit_ids,
      candidate_ids: proposed.candidate_ids,
      ...(corrected ? { proposal_statement: proposed.statement } : {}),
      decision_ids: history.map(({ id }) => id),
      parent_record_ids: [],
      origin: proposed.origin,
      status: "approved",
    }));
    consumed.add(proposed.id);
  }
  for (const decision of ledger.decisions.filter(({ action }) => action === "add_record")) {
    const replacement = decision.replacement_records[0]!;
    records.push(HardenedApprovedRecordSchema.parse({
      ...replacement, revision: 1, origin_revision: proposal.proposal_revision,
      decision_ids: [decision.id], parent_record_ids: [],
      origin: "human_added", status: "approved",
    }));
  }
  records.sort((a, b) => compare(a.id, b.id));
  assertUnique(records.map(({ id }) => id), "hardened record");
  const approvedIds = new Set(records.flatMap((record) =>
    [record.id, ...record.parent_record_ids]));
  const workflowNodes = proposal.workflow_nodes.map((node) => ({
    ...node,
    semantic_record_ids: node.semantic_record_ids.filter((id) => approvedIds.has(id)),
  })).filter(({ semantic_record_ids }) => semantic_record_ids.length > 0);
  const nodeIds = new Set(workflowNodes.map(({ id }) => id));
  const relationships = proposal.relationships.filter(({ from_id, to_id }) =>
    nodeIds.has(from_id) && nodeIds.has(to_id));
  const reviewers = [...new Set(ledger.decisions.map(({ reviewer }) => reviewer.identity))].sort(compare);
  const approvedAt = ledger.decisions.map(({ decided_at }) => decided_at).sort().at(-1);
  if (!approvedAt || reviewers.length === 0) throw new Error("Approval requires human decisions");
  const core = {
    schema_version: APPROVED_PROJECT_MODEL_VERSION,
    project_id: proposal.project_id,
    model_revision: proposal.proposal_revision,
    lifecycle: "approved" as const,
    authoritative: true as const,
    approval_required: false as const,
    downstream_execution_allowed: true as const,
    source_revision_id: proposal.source_revision_id,
    semantic_kind_registry_id: proposal.semantic_kind_registry_id,
    proposal_hash: proposal.content_hash,
    approval_ledger_hash: ledger.content_hash,
    records, workflow_nodes: workflowNodes, relationships,
    approved_by: reviewers, approved_at: approvedAt,
  };
  const model = deepFreeze(HardenedApprovedProjectModelSchema.parse({
    ...core,
    id: `${proposal.project_id}.approved-model.${hashJson(core).slice(7, 19)}`,
    content_hash: hashJson(core),
  }));
  const graph = projectWorkflowGraph({
    project_id: model.project_id, model_revision: model.model_revision,
    model_hash: model.content_hash, lifecycle: model.lifecycle,
    authoritative: model.authoritative,
    downstream_execution_allowed: model.downstream_execution_allowed,
    nodes: model.workflow_nodes.map((node) => ({
      id: node.id, kind_id: "ces.graph.workflow-step", label: node.label,
      semantic_record_ids: node.semantic_record_ids, source_unit_ids: node.source_unit_ids,
      item_review_states: node.semantic_record_ids.map(() => "approved" as const),
      issue_codes: [],
    })),
    relationships: model.relationships.map((edge) => ({
      id: edge.id, from_id: edge.from_id, to_id: edge.to_id,
      kind_id: edge.kind, source_unit_ids: edge.source_unit_ids,
    })),
    source_documents: proposal.source_documents, finding_ids: [],
  });
  return deepFreeze(HardenedApprovalPublicationSchema.parse({ model, graph }));
}

export async function publishHardenedApproval(
  outputDirectory: string,
  publicationValue: z.input<typeof HardenedApprovalPublicationSchema>,
): Promise<string> {
  const publication = HardenedApprovalPublicationSchema.parse(publicationValue);
  const finalDirectory = join(outputDirectory, publication.model.id);
  const stagingDirectory = `${finalDirectory}.staging`;
  await mkdir(stagingDirectory, { recursive: false });
  try {
    await writeFile(join(stagingDirectory, "approved-project-model.json"),
      `${JSON.stringify(canonical(publication.model), null, 2)}\n`, "utf8");
    await writeFile(join(stagingDirectory, "approved-workflow-graph.json"),
      `${JSON.stringify(canonical(publication.graph), null, 2)}\n`, "utf8");
    await rename(stagingDirectory, finalDirectory);
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
  return finalDirectory;
}

export type ApprovedProjectModel = z.infer<typeof ApprovedProjectModelSchema>;

export function publishApprovedProjectModel(input: {
  readonly project_id: string;
  readonly source_revision_id: string;
  readonly source_content_hash: string;
  readonly lexicon_revision_id: string;
  readonly lexicon_content_hash: string;
  readonly concepts: readonly z.input<typeof ApprovedConceptSchema>[];
  readonly semantic_collection: z.input<typeof SemanticCollectionSchema>;
  readonly coverage_report: z.input<typeof CoverageReportSchema>;
  readonly review: {
    readonly status: "reviewed" | "review_required" | "clarification_required";
    readonly source_revision_id: string;
    readonly lexicon_revision_id: string;
    readonly semantic_revision_id: string;
    readonly decision_hash: string;
    readonly approved_by: readonly string[];
    readonly approved_at: string;
    readonly reviewed_payloads: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  };
}): ApprovedProjectModel {
  const projectId = Id.parse(input.project_id);
  const semantic = SemanticCollectionSchema.parse(input.semantic_collection);
  const coverage = CoverageReportSchema.parse(input.coverage_report);
  assertPublishableCoverage(coverage);
  if (input.review.status !== "reviewed") {
    throw new Error(`Project-model publication requires completed review: ${input.review.status}`);
  }
  const revisionTuple = [
    [semantic.project_id, projectId, "semantic project"],
    [semantic.source_revision_id, input.source_revision_id, "semantic source"],
    [semantic.lexicon_revision_id, input.lexicon_revision_id, "semantic lexicon"],
    [coverage.source_revision_id, input.source_revision_id, "coverage source"],
    [coverage.semantic_collection_id, semantic.id, "coverage semantic"],
    [input.review.source_revision_id, input.source_revision_id, "review source"],
    [input.review.lexicon_revision_id, input.lexicon_revision_id, "review lexicon"],
    [input.review.semantic_revision_id, semantic.id, "review semantic"],
  ] as const;
  for (const [actual, expected, label] of revisionTuple) {
    if (actual !== expected) throw new Error(`Mixed revision: ${label}`);
  }
  const concepts = input.concepts.map((concept) => ApprovedConceptSchema.parse(concept))
    .sort((a, b) => compare(a.id, b.id));
  assertUnique(concepts.map(({ id }) => id), "concept");
  const conceptIds = new Set(concepts.map(({ id }) => id));
  const records = semantic.records.map((record) => {
    const payload = input.review.reviewed_payloads[record.id];
    if (!payload) throw new Error(`Missing reviewed payload for ${record.id}`);
    const unknownConcept = record.concept_ids.find((id) => !conceptIds.has(id));
    if (unknownConcept) throw new Error(`Unknown approved concept: ${unknownConcept}`);
    assertBusinessTruthPayload(payload, record.id);
    return ApprovedSemanticRecordSchema.parse({
      id: record.id,
      kind: record.kind,
      title: record.title,
      statement: record.statement,
      source_unit_ids: record.source_unit_ids,
      concept_ids: record.concept_ids,
      origin: record.origin,
      ...(record.inference_rationale ? { inference_rationale: record.inference_rationale } : {}),
      reviewed_payload: payload,
    });
  }).sort((a, b) => compare(a.id, b.id));
  const core = {
    schema_version: APPROVED_PROJECT_MODEL_VERSION,
    project_id: projectId,
    source_revision_id: Id.parse(input.source_revision_id),
    source_content_hash: Hash.parse(input.source_content_hash),
    lexicon_revision_id: Id.parse(input.lexicon_revision_id),
    lexicon_content_hash: Hash.parse(input.lexicon_content_hash),
    semantic_revision_id: semantic.id,
    semantic_content_hash: semantic.content_hash,
    review_decision_hash: Hash.parse(input.review.decision_hash),
    coverage_content_hash: coverage.content_hash,
    approved_by: [...new Set(input.review.approved_by.map((value) => Text.parse(value)))].sort(compare),
    approved_at: input.review.approved_at,
    concepts,
    records,
    relationships: semantic.relationships,
  };
  const contentHash = hashJson(core);
  return deepFreeze(ApprovedProjectModelSchema.parse({
    ...core,
    id: `${projectId}.model.${contentHash.slice(7, 19)}`,
    content_hash: contentHash,
  }));
}

export function projectApprovedModel(
  modelValue: ApprovedProjectModel,
  consumer: string,
): z.infer<typeof ProjectionResultSchema> {
  const model = ApprovedProjectModelSchema.parse(modelValue);
  const projections = model.records.map((record) => {
    const semantic = modelRecordToSemanticProjectionInput(record, model);
    return classifyLegacyProjection(SemanticRecordSchema.parse(semantic));
  });
  const gaps = projections.filter(({ classification }) => classification !== "lossless")
    .map((projection) => ({
      semantic_record_id: projection.semantic_record_id,
      classification: projection.classification as "lossy" | "projection_gap",
      reason: projection.reason!,
    }));
  const core = {
    schema_version: APPROVED_PROJECT_MODEL_VERSION,
    project_model_id: model.id,
    consumer: Id.parse(consumer),
    status: gaps.length === 0 ? "complete" as const : "partial" as const,
    projected_record_ids: projections.filter(({ classification }) => classification === "lossless")
      .map(({ semantic_record_id }) => semantic_record_id).sort(compare),
    gaps: gaps.sort((a, b) => compare(a.semantic_record_id, b.semantic_record_id)),
  };
  return ProjectionResultSchema.parse({ ...core, content_hash: hashJson(core) });
}

function modelRecordToSemanticProjectionInput(
  record: z.infer<typeof ApprovedSemanticRecordSchema>,
  model: ApprovedProjectModel,
): z.input<typeof SemanticCollectionSchema>["records"][number] {
  return {
    schema_version: "1.0.0",
    id: record.id,
    project_id: model.project_id,
    source_revision_id: model.source_revision_id,
    lexicon_revision_id: model.lexicon_revision_id,
    title: record.title,
    statement: record.statement,
    source_unit_ids: record.source_unit_ids,
    concept_ids: record.concept_ids,
    origin: record.origin,
    ...(record.inference_rationale ? { inference_rationale: record.inference_rationale } : {}),
    review_state: "candidate",
    ...record.reviewed_payload,
    kind: record.kind,
  } as z.input<typeof SemanticCollectionSchema>["records"][number];
}

function assertBusinessTruthPayload(payload: Readonly<Record<string, unknown>>, id: string): void {
  const forbidden = ["provider", "model", "prompt", "confidence", "agent", "token_usage"];
  const present = forbidden.filter((key) => key in payload);
  if (present.length > 0) throw new Error(`Agent metadata cannot enter business truth ${id}: ${present.join(", ")}`);
}
function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate approved ${label}`);
}
function hashJson(value: unknown): string {
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
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
