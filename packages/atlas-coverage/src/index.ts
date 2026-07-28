import { createHash } from "node:crypto";
import { z } from "zod";

export const ATLAS_COVERAGE_VERSION = "1.0.0" as const;
export const ATLAS_PIPELINE_COVERAGE_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

export const PipelineStageSchema = z.enum([
  "evaluated", "non_normative", "candidate", "classified", "normalized",
  "deduplicated", "assigned", "projected", "unmapped", "ambiguous",
  "conflicting", "excluded",
]);

export const SourcePipelineCoverageSchema = z.object({
  source_unit_id: Id,
  normative: z.boolean(),
  current_stage: PipelineStageSchema,
  candidate_ids: z.array(Id),
  normalized_record_ids: z.array(Id),
  workflow_node_ids: z.array(Id),
  graph_node_ids: z.array(Id),
  reason: Text.optional(),
  stage_history: z.array(z.object({
    stage: PipelineStageSchema,
    status: z.enum(["included", "lost", "review_required"]),
    entity_id: Id.optional(),
    reason: Text.optional(),
  }).strict()).min(1),
}).strict().superRefine((value, context) => {
  if (["non_normative", "excluded"].includes(value.current_stage) && !value.reason) {
    context.addIssue({ code: "custom", message: `${value.current_stage} requires reviewed reason` });
  }
  if (value.normative && value.current_stage === "non_normative") {
    context.addIssue({ code: "custom", message: "Normative source cannot be non_normative" });
  }
});

export const NormalizedRecordCoverageSchema = z.object({
  record_id: Id,
  semantic_kind_id: Id,
  candidate_ids: z.array(Id).min(1),
  source_unit_ids: z.array(Id).min(1),
}).strict();

export const PipelineCoverageReportSchema = z.object({
  schema_version: z.literal(ATLAS_PIPELINE_COVERAGE_VERSION),
  source_revision_id: Id,
  semantic_kind_registry_id: Id,
  source_coverage: z.array(SourcePipelineCoverageSchema),
  record_coverage: z.array(NormalizedRecordCoverageSchema),
  counts: z.object({
    source_units: z.number().int().nonnegative(),
    normative: z.number().int().nonnegative(),
    unmapped_normative: z.number().int().nonnegative(),
    unknown_records: z.number().int().nonnegative(),
    organization_records: z.number().int().nonnegative(),
  }).strict(),
  loss_by_stage: z.record(PipelineStageSchema, z.number().int().nonnegative()),
  content_hash: Hash,
}).strict();

export const CoverageDispositionSchema = z.enum([
  "covered", "context_only", "duplicate", "uncertain", "conflicting",
  "excluded_with_reason", "uncovered",
]);

export const CoverageEntrySchema = z.object({
  source_unit_id: Id,
  normative: z.boolean(),
  disposition: CoverageDispositionSchema,
  candidate_ids: z.array(Id),
  reason: Text.optional(),
}).strict().superRefine((value, context) => {
  if (["context_only", "duplicate", "excluded_with_reason"].includes(value.disposition)
    && !value.reason) {
    context.addIssue({ code: "custom", message: `${value.disposition} requires a reason` });
  }
  if (value.disposition === "covered" && value.candidate_ids.length === 0) {
    context.addIssue({ code: "custom", message: "Covered units require a candidate" });
  }
  if (!value.normative && value.disposition === "uncovered") {
    context.addIssue({ code: "custom", message: "Non-normative units cannot be uncovered" });
  }
});

export const CandidateEvidenceSchema = z.object({
  candidate_id: Id,
  source_unit_ids: z.array(Id).min(1),
  supported: z.boolean(),
  distortion_detected: z.boolean(),
  diagnostic: Text.optional(),
}).strict().superRefine((value, context) => {
  if ((!value.supported || value.distortion_detected) && !value.diagnostic) {
    context.addIssue({ code: "custom", message: "Unsupported or distorted candidates need diagnostics" });
  }
});

export const CriticFindingSchema = z.object({
  id: Id,
  kind: z.enum([
    "likely_omission", "over_combination", "distortion", "unsupported_fact",
    "false_context", "duplicate",
  ]),
  source_unit_ids: z.array(Id).min(1),
  candidate_ids: z.array(Id),
  severity: z.enum(["blocking", "warning"]),
  statement: Text,
}).strict();

export const RetryRequestSchema = z.object({
  id: Id,
  attempt: z.number().int().positive(),
  source_unit_ids: z.array(Id).min(1),
  finding_ids: z.array(Id).min(1),
  prior_candidate_ids: z.array(Id),
}).strict();

export const CoverageReportSchema = z.object({
  schema_version: z.literal(ATLAS_COVERAGE_VERSION),
  source_revision_id: Id,
  semantic_collection_id: Id,
  entries: z.array(CoverageEntrySchema),
  candidate_evidence: z.array(CandidateEvidenceSchema),
  critic_findings: z.array(CriticFindingSchema),
  retry_history: z.array(RetryRequestSchema),
  counts: z.object({
    normative: z.number().int().nonnegative(),
    covered: z.number().int().nonnegative(),
    uncovered: z.number().int().nonnegative(),
    blocking_findings: z.number().int().nonnegative(),
    unsupported_candidates: z.number().int().nonnegative(),
  }).strict(),
  status: z.enum([
    "success", "incomplete_coverage", "unsupported_candidate", "conflict",
    "review_required",
  ]),
  content_hash: Hash,
}).strict();

export type CoverageEntry = z.input<typeof CoverageEntrySchema>;
export type CandidateEvidence = z.input<typeof CandidateEvidenceSchema>;
export type CriticFinding = z.input<typeof CriticFindingSchema>;
export type RetryRequest = z.input<typeof RetryRequestSchema>;
export type CoverageReport = z.infer<typeof CoverageReportSchema>;

export function calculateCoverage(input: {
  readonly source_revision_id: string;
  readonly semantic_collection_id: string;
  readonly source_unit_ids: readonly string[];
  readonly candidate_ids: readonly string[];
  readonly entries: readonly CoverageEntry[];
  readonly candidate_evidence: readonly CandidateEvidence[];
  readonly critic_findings?: readonly CriticFinding[];
  readonly retry_history?: readonly RetryRequest[];
}): CoverageReport {
  const sourceIds = new Set(input.source_unit_ids.map((id) => Id.parse(id)));
  const candidateIds = new Set(input.candidate_ids.map((id) => Id.parse(id)));
  const entries = input.entries.map((entry) => CoverageEntrySchema.parse(entry))
    .sort((a, b) => compare(a.source_unit_id, b.source_unit_id));
  assertUnique(entries.map(({ source_unit_id }) => source_unit_id), "coverage source unit");
  if (entries.length !== sourceIds.size
    || entries.some(({ source_unit_id }) => !sourceIds.has(source_unit_id))) {
    throw new Error("Coverage map must disposition every source unit exactly once");
  }
  for (const entry of entries) assertMembers(entry.candidate_ids, candidateIds, "candidate");
  const evidence = input.candidate_evidence.map((item) => CandidateEvidenceSchema.parse(item))
    .sort((a, b) => compare(a.candidate_id, b.candidate_id));
  assertUnique(evidence.map(({ candidate_id }) => candidate_id), "candidate evidence");
  if (evidence.length !== candidateIds.size
    || evidence.some(({ candidate_id }) => !candidateIds.has(candidate_id))) {
    throw new Error("Precision evidence must cover every candidate exactly once");
  }
  for (const item of evidence) assertMembers(item.source_unit_ids, sourceIds, "source unit");
  const findings = (input.critic_findings ?? []).map((item) => CriticFindingSchema.parse(item))
    .sort((a, b) => compare(a.id, b.id));
  for (const finding of findings) {
    assertMembers(finding.source_unit_ids, sourceIds, "source unit");
    assertMembers(finding.candidate_ids, candidateIds, "candidate");
  }
  const retries = (input.retry_history ?? []).map((item) => RetryRequestSchema.parse(item))
    .sort((a, b) => a.attempt - b.attempt || compare(a.id, b.id));
  validateRetryHistory(retries, sourceIds, findings);
  const normative = entries.filter(({ normative: value }) => value);
  const uncovered = normative.filter(({ disposition }) =>
    !["covered", "duplicate", "excluded_with_reason"].includes(disposition)).length;
  const unsupported = evidence.filter(({ supported, distortion_detected }) =>
    !supported || distortion_detected).length;
  const blocking = findings.filter(({ severity }) => severity === "blocking").length;
  const hasConflict = entries.some(({ disposition }) => disposition === "conflicting");
  const status = unsupported > 0 ? "unsupported_candidate"
    : hasConflict ? "conflict"
    : uncovered > 0 ? "incomplete_coverage"
    : blocking > 0 ? "review_required"
    : "success";
  const core = {
    schema_version: ATLAS_COVERAGE_VERSION,
    source_revision_id: Id.parse(input.source_revision_id),
    semantic_collection_id: Id.parse(input.semantic_collection_id),
    entries,
    candidate_evidence: evidence,
    critic_findings: findings,
    retry_history: retries,
    counts: {
      normative: normative.length,
      covered: normative.length - uncovered,
      uncovered,
      blocking_findings: blocking,
      unsupported_candidates: unsupported,
    },
    status,
  };
  return deepFreeze(CoverageReportSchema.parse({
    ...core, content_hash: hashJson(core),
  }));
}

export function calculatePipelineCoverage(input: {
  readonly source_revision_id: string;
  readonly semantic_kind_registry_id: string;
  readonly source_unit_ids: readonly string[];
  readonly candidate_sources: Readonly<Record<string, readonly string[]>>;
  readonly normalized_record_ids: readonly string[];
  readonly workflow_node_ids: readonly string[];
  readonly graph_node_ids: readonly string[];
  readonly source_coverage: readonly z.input<typeof SourcePipelineCoverageSchema>[];
  readonly record_coverage: readonly z.input<typeof NormalizedRecordCoverageSchema>[];
}): z.infer<typeof PipelineCoverageReportSchema> {
  const sourceIds = new Set(input.source_unit_ids.map((id) => Id.parse(id)));
  const candidateSources = new Map(Object.entries(input.candidate_sources).map(([id, sources]) => [
    Id.parse(id), new Set(sources.map((source) => Id.parse(source))),
  ]));
  const recordIds = new Set(input.normalized_record_ids.map((id) => Id.parse(id)));
  const workflowIds = new Set(input.workflow_node_ids.map((id) => Id.parse(id)));
  const graphIds = new Set(input.graph_node_ids.map((id) => Id.parse(id)));
  const sources = input.source_coverage.map((item) => SourcePipelineCoverageSchema.parse(item))
    .sort((a, b) => compare(a.source_unit_id, b.source_unit_id));
  assertUnique(sources.map(({ source_unit_id }) => source_unit_id), "pipeline source unit");
  if (sources.length !== sourceIds.size
    || sources.some(({ source_unit_id }) => !sourceIds.has(source_unit_id))) {
    throw new Error("Pipeline coverage must disposition every source unit exactly once");
  }
  for (const source of sources) {
    assertMembers(source.candidate_ids, new Set(candidateSources.keys()), "candidate");
    assertMembers(source.normalized_record_ids, recordIds, "normalized record");
    assertMembers(source.workflow_node_ids, workflowIds, "workflow node");
    assertMembers(source.graph_node_ids, graphIds, "graph node");
  }
  const records = input.record_coverage
    .map((item) => NormalizedRecordCoverageSchema.parse(item))
    .sort((a, b) => compare(a.record_id, b.record_id));
  assertUnique(records.map(({ record_id }) => record_id), "record coverage");
  if (records.length !== recordIds.size || records.some(({ record_id }) => !recordIds.has(record_id))) {
    throw new Error("Record coverage must include every normalized record exactly once");
  }
  for (const record of records) {
    assertMembers(record.candidate_ids, new Set(candidateSources.keys()), "candidate");
    assertMembers(record.source_unit_ids, sourceIds, "source unit");
    const inherited = new Set(record.candidate_ids.flatMap((id) =>
      [...(candidateSources.get(id) ?? [])]));
    const unrelated = record.source_unit_ids.find((id) => !inherited.has(id));
    if (unrelated) throw new Error(`Record provenance is not inherited from candidates: ${unrelated}`);
  }
  const lossByStage = Object.fromEntries(PipelineStageSchema.options.map((stage) => [
    stage,
    sources.filter(({ stage_history }) => stage_history.some((entry) =>
      entry.stage === stage && entry.status === "lost")).length,
  ])) as Record<z.infer<typeof PipelineStageSchema>, number>;
  const core = {
    schema_version: ATLAS_PIPELINE_COVERAGE_VERSION,
    source_revision_id: Id.parse(input.source_revision_id),
    semantic_kind_registry_id: Id.parse(input.semantic_kind_registry_id),
    source_coverage: sources,
    record_coverage: records,
    counts: {
      source_units: sources.length,
      normative: sources.filter(({ normative }) => normative).length,
      unmapped_normative: sources.filter(({ normative, current_stage }) =>
        normative && ["unmapped", "ambiguous", "conflicting"].includes(current_stage)).length,
      unknown_records: records.filter(({ semantic_kind_id }) =>
        semantic_kind_id === "ces.kind.unknown").length,
      organization_records: records.filter(({ semantic_kind_id }) =>
        !semantic_kind_id.startsWith("ces.kind.")).length,
    },
    loss_by_stage: lossByStage,
  };
  return deepFreeze(PipelineCoverageReportSchema.parse({
    ...core, content_hash: hashJson(core),
  }));
}

export function assertPipelineCoverageComplete(
  reportValue: z.infer<typeof PipelineCoverageReportSchema>,
): void {
  const report = PipelineCoverageReportSchema.parse(reportValue);
  if (report.counts.unmapped_normative > 0) {
    throw new Error("Atlas pipeline coverage gate blocked: unmapped normative source");
  }
}

export function createTargetedRetry(input: {
  readonly report: CoverageReport;
  readonly maximum_attempts: number;
}): z.infer<typeof RetryRequestSchema> | undefined {
  const report = CoverageReportSchema.parse(input.report);
  const nextAttempt = report.retry_history.length + 1;
  if (nextAttempt > z.number().int().positive().parse(input.maximum_attempts)) return undefined;
  const retryableUnits = new Set(report.entries.filter(({ disposition }) =>
    ["uncovered", "uncertain", "conflicting"].includes(disposition))
    .map(({ source_unit_id }) => source_unit_id));
  const relevantFindings = report.critic_findings.filter(({ severity, source_unit_ids }) =>
    severity === "blocking" && source_unit_ids.some((id) => retryableUnits.has(id)));
  for (const finding of relevantFindings) {
    for (const id of finding.source_unit_ids) retryableUnits.add(id);
  }
  if (retryableUnits.size === 0) return undefined;
  const sourceUnitIds = [...retryableUnits].sort(compare);
  const findingIds = relevantFindings.map(({ id }) => id).sort(compare);
  if (findingIds.length === 0) findingIds.push("atlas.finding.deterministic-uncovered");
  return RetryRequestSchema.parse({
    id: `atlas.retry.${String(nextAttempt).padStart(3, "0")}.${digest(sourceUnitIds.join("\0")).slice(0, 8)}`,
    attempt: nextAttempt,
    source_unit_ids: sourceUnitIds,
    finding_ids: findingIds,
    prior_candidate_ids: report.entries.filter(({ source_unit_id }) =>
      retryableUnits.has(source_unit_id)).flatMap(({ candidate_ids }) => candidate_ids)
      .filter((id, index, all) => all.indexOf(id) === index).sort(compare),
  });
}

export function assertPublishableCoverage(reportValue: CoverageReport): void {
  const report = CoverageReportSchema.parse(reportValue);
  if (report.status !== "success") throw new Error(`Atlas coverage gate blocked: ${report.status}`);
  if (report.counts.uncovered !== 0 || report.counts.unsupported_candidates !== 0
    || report.counts.blocking_findings !== 0) {
    throw new Error("Atlas coverage gate counts are inconsistent with success");
  }
}

function validateRetryHistory(retries: readonly z.infer<typeof RetryRequestSchema>[],
  sourceIds: ReadonlySet<string>, findings: readonly z.infer<typeof CriticFindingSchema>[]): void {
  const findingIds = new Set(findings.map(({ id }) => id));
  retries.forEach((retry, index) => {
    if (retry.attempt !== index + 1) throw new Error("Retry attempts must be contiguous");
    assertMembers(retry.source_unit_ids, sourceIds, "retry source unit");
    const unknown = retry.finding_ids.filter((id) =>
      id !== "atlas.finding.deterministic-uncovered" && !findingIds.has(id));
    if (unknown.length > 0) throw new Error(`Unknown retry finding: ${unknown[0]}`);
  });
}
function assertMembers(values: readonly string[], allowed: ReadonlySet<string>, label: string): void {
  const missing = values.find((value) => !allowed.has(value));
  if (missing) throw new Error(`Unknown ${label}: ${missing}`);
}
function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}
function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function hashJson(value: unknown): string {
  return `sha256:${digest(JSON.stringify(canonical(value)))}`;
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
