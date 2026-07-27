import { createHash } from "node:crypto";
import {
  assertPublishableCoverage,
  CoverageReportSchema,
} from "@company/ces-atlas-coverage";
import {
  classifyLegacyProjection,
  SemanticCollectionSchema,
  SemanticRecordSchema,
} from "@company/ces-semantic-record-schema";
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
