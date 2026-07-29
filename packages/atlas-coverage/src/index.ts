import { createHash } from "node:crypto";
import { z } from "zod";

export const ATLAS_COVERAGE_VERSION = "1.0.0" as const;
export const ATLAS_PIPELINE_COVERAGE_VERSION = "1.0.0" as const;
export const ATLAS_ATOMIC_CLAIMS_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

export const AtomicClaimDispositionSchema = z.enum([
  "represented",
  "duplicate",
  "not_applicable",
  "ambiguous",
  "conflicting",
  "unsupported",
  "uncovered",
  "human_review_required",
]);

export const AtomicClaimSchema = z.object({
  claim_id: Id,
  source_revision_id: Id,
  source_unit_id: Id,
  statement: Text,
  exact_text: Text,
  span: z.object({
    start_offset: z.number().int().nonnegative(),
    end_offset: z.number().int().positive(),
  }).strict(),
  boundary_confidence: z.number().min(0).max(1),
  decomposition_method: z.enum(["deterministic", "provider", "human"]),
  review_required: z.boolean(),
}).strict().refine(
  ({ span }) => span.end_offset > span.start_offset,
  "Atomic claim span must be non-empty",
);

export const AtomicClaimsArtifactSchema = z.object({
  schema_version: z.literal(ATLAS_ATOMIC_CLAIMS_VERSION),
  source_revision_id: Id,
  claims: z.array(AtomicClaimSchema),
  content_hash: Hash,
}).strict();

export const AtomicClaimCoverageEntrySchema = z.object({
  claim_id: Id,
  disposition: AtomicClaimDispositionSchema,
  candidate_ids: z.array(Id),
  record_ids: z.array(Id),
  duplicate_of_claim_id: Id.optional(),
  reason: Text.optional(),
}).strict().superRefine((value, context) => {
  if (value.disposition === "represented"
    && (value.candidate_ids.length === 0 || value.record_ids.length === 0)) {
    context.addIssue({
      code: "custom",
      message: "Represented claims require candidate and canonical record mappings",
    });
  }
  if (value.disposition === "duplicate" && !value.duplicate_of_claim_id) {
    context.addIssue({ code: "custom", message: "Duplicate claims require a canonical claim" });
  }
  if (value.disposition !== "duplicate" && value.duplicate_of_claim_id) {
    context.addIssue({ code: "custom", message: "Only duplicate claims may reference another claim" });
  }
  if (value.disposition !== "represented" && value.disposition !== "duplicate" && !value.reason) {
    context.addIssue({ code: "custom", message: `${value.disposition} requires a reason` });
  }
});

export const AtomicClaimFindingSchema = z.object({
  finding_id: Id,
  claim_id: Id,
  source_unit_id: Id,
  disposition: z.enum([
    "ambiguous", "conflicting", "unsupported", "uncovered", "human_review_required",
  ]),
  severity: z.enum(["blocking", "review_required"]),
  statement: Text,
}).strict();

export const AtomicClaimCoverageReportSchema = z.object({
  schema_version: z.literal(ATLAS_ATOMIC_CLAIMS_VERSION),
  source_revision_id: Id,
  atomic_claims_hash: Hash,
  entries: z.array(AtomicClaimCoverageEntrySchema),
  findings: z.array(AtomicClaimFindingSchema),
  counts: z.object({
    total: z.number().int().nonnegative(),
    represented: z.number().int().nonnegative(),
    unresolved: z.number().int().nonnegative(),
    blocking: z.number().int().nonnegative(),
  }).strict(),
  qualification_blocked: z.boolean(),
  content_hash: Hash,
}).strict();

export const AtomicClaimRetryScopeSchema = z.object({
  source_revision_id: Id,
  claim_coverage_hash: Hash,
  attempt: z.number().int().positive(),
  claim_ids: z.array(Id).min(1),
  source_unit_ids: z.array(Id).min(1),
  prior_candidate_ids: z.array(Id),
}).strict();

export interface AtomicClaimInput {
  readonly source_unit_id: string;
  readonly statement: string;
  readonly exact_text: string;
  readonly start_offset: number;
  readonly end_offset: number;
  readonly boundary_confidence: number;
  readonly decomposition_method: "deterministic" | "provider" | "human";
}

export function decomposeAtomicClaims(input: {
  readonly source_units: readonly {
    readonly id: string;
    readonly exact_text: string;
    readonly text?: string;
  }[];
  readonly normative_source_unit_ids: readonly string[];
}): AtomicClaimInput[] {
  const normative = new Set(input.normative_source_unit_ids.map((id) => Id.parse(id)));
  const parsedUnits = input.source_units.map((unit) => [Id.parse(unit.id), unit] as const);
  assertUnique(parsedUnits.map(([id]) => id), "atomic-claim source unit");
  const units = new Map(parsedUnits);
  assertMembers([...normative], new Set(units.keys()), "normative source unit");
  return [...normative].sort(compare).flatMap((sourceUnitId) => {
    const unit = units.get(sourceUnitId)!;
    const ranges = splitClaimRanges(unit.exact_text);
    return ranges.map(({ start, end }) => {
      const exactText = unit.exact_text.slice(start, end);
      const statement = exactText
        .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/u, "")
        .trim();
      const uncertainBoundary = /\b(?:and|or|dan|atau)\b/iu.test(statement);
      return {
        source_unit_id: sourceUnitId,
        statement,
        exact_text: exactText,
        start_offset: start,
        end_offset: end,
        boundary_confidence: uncertainBoundary ? 0.75 : 1,
        decomposition_method: "deterministic" as const,
      };
    });
  });
}

export function createAtomicClaims(input: {
  readonly source_revision_id: string;
  readonly source_units: readonly { readonly id: string; readonly exact_text: string }[];
  readonly claims: readonly AtomicClaimInput[];
}): z.infer<typeof AtomicClaimsArtifactSchema> {
  const sourceRevisionId = Id.parse(input.source_revision_id);
  const parsedUnits = input.source_units.map((unit) => [
    Id.parse(unit.id),
    unit.exact_text,
  ] as const);
  assertUnique(parsedUnits.map(([id]) => id), "atomic-claim source unit");
  const sourceUnits = new Map(parsedUnits);
  const claims = input.claims.map((value) => {
    const sourceUnitId = Id.parse(value.source_unit_id);
    const sourceText = sourceUnits.get(sourceUnitId);
    if (sourceText === undefined) throw new Error(`Unknown atomic-claim source unit: ${sourceUnitId}`);
    const span = {
      start_offset: z.number().int().nonnegative().parse(value.start_offset),
      end_offset: z.number().int().positive().parse(value.end_offset),
    };
    if (span.end_offset > sourceText.length
      || sourceText.slice(span.start_offset, span.end_offset) !== value.exact_text) {
      throw new Error(`Atomic claim exact span mismatch: ${sourceUnitId}`);
    }
    const identity = {
      source_revision_id: sourceRevisionId,
      source_unit_id: sourceUnitId,
      span,
      exact_text: value.exact_text,
    };
    return AtomicClaimSchema.parse({
      claim_id: `atlas.claim.${digest(JSON.stringify(canonical(identity))).slice(0, 20)}`,
      source_revision_id: sourceRevisionId,
      source_unit_id: sourceUnitId,
      statement: value.statement,
      exact_text: value.exact_text,
      span,
      boundary_confidence: value.boundary_confidence,
      decomposition_method: value.decomposition_method,
      review_required: value.boundary_confidence < 1,
    });
  }).sort((left, right) => compare(left.claim_id, right.claim_id));
  assertUnique(claims.map(({ claim_id }) => claim_id), "atomic claim");
  const core = {
    schema_version: ATLAS_ATOMIC_CLAIMS_VERSION,
    source_revision_id: sourceRevisionId,
    claims,
  };
  return deepFreeze(AtomicClaimsArtifactSchema.parse({
    ...core,
    content_hash: hashJson(core),
  }));
}

export function calculateAtomicClaimCoverage(input: {
  readonly atomic_claims: z.input<typeof AtomicClaimsArtifactSchema>;
  readonly candidate_ids: readonly string[];
  readonly record_ids: readonly string[];
  readonly entries: readonly z.input<typeof AtomicClaimCoverageEntrySchema>[];
}): z.infer<typeof AtomicClaimCoverageReportSchema> {
  const artifact = AtomicClaimsArtifactSchema.parse(input.atomic_claims);
  const claimIds = new Set(artifact.claims.map(({ claim_id }) => claim_id));
  const candidates = new Set(input.candidate_ids.map((id) => Id.parse(id)));
  const records = new Set(input.record_ids.map((id) => Id.parse(id)));
  const entries = input.entries.map((entry) => AtomicClaimCoverageEntrySchema.parse(entry))
    .sort((left, right) => compare(left.claim_id, right.claim_id));
  assertUnique(entries.map(({ claim_id }) => claim_id), "atomic claim coverage");
  if (entries.length !== claimIds.size || entries.some(({ claim_id }) => !claimIds.has(claim_id))) {
    throw new Error("Claim coverage must disposition every atomic claim exactly once");
  }
  for (const entry of entries) {
    assertMembers(entry.candidate_ids, candidates, "claim candidate");
    assertMembers(entry.record_ids, records, "claim record");
    if (entry.duplicate_of_claim_id) {
      if (!claimIds.has(entry.duplicate_of_claim_id)
        || entry.duplicate_of_claim_id === entry.claim_id) {
        throw new Error("Duplicate claim must reference another atomic claim");
      }
    }
    const claim = artifact.claims.find(({ claim_id }) => claim_id === entry.claim_id)!;
    if (claim.review_required && entry.disposition === "represented") {
      throw new Error("Uncertain atomic claim decomposition requires human review");
    }
  }
  const unresolved = new Set([
    "ambiguous", "conflicting", "unsupported", "uncovered", "human_review_required",
  ]);
  const findings = entries.filter(({ disposition }) => unresolved.has(disposition))
    .map((entry) => {
      const claim = artifact.claims.find(({ claim_id }) => claim_id === entry.claim_id)!;
      return AtomicClaimFindingSchema.parse({
        finding_id: `atlas.claim-finding.${digest(`${entry.claim_id}:${entry.disposition}`).slice(0, 16)}`,
        claim_id: entry.claim_id,
        source_unit_id: claim.source_unit_id,
        disposition: entry.disposition,
        severity: ["conflicting", "unsupported", "uncovered"].includes(entry.disposition)
          ? "blocking" : "review_required",
        statement: entry.reason ?? `Atomic claim is ${entry.disposition}`,
      });
    }).sort((left, right) => compare(left.finding_id, right.finding_id));
  const blocking = findings.filter(({ severity }) => severity === "blocking").length;
  const core = {
    schema_version: ATLAS_ATOMIC_CLAIMS_VERSION,
    source_revision_id: artifact.source_revision_id,
    atomic_claims_hash: artifact.content_hash,
    entries,
    findings,
    counts: {
      total: entries.length,
      represented: entries.filter(({ disposition }) => disposition === "represented").length,
      unresolved: findings.length,
      blocking,
    },
    qualification_blocked: findings.length > 0,
  };
  return deepFreeze(AtomicClaimCoverageReportSchema.parse({
    ...core,
    content_hash: hashJson(core),
  }));
}

export function createAtomicClaimRetryScope(input: {
  readonly report: z.input<typeof AtomicClaimCoverageReportSchema>;
  readonly attempt: number;
  readonly prior_candidate_ids?: readonly string[];
}): z.infer<typeof AtomicClaimRetryScopeSchema> | undefined {
  const report = AtomicClaimCoverageReportSchema.parse(input.report);
  const retryable = report.findings.filter(({ disposition }) =>
    ["ambiguous", "unsupported", "uncovered", "human_review_required"].includes(disposition));
  if (retryable.length === 0) return undefined;
  return deepFreeze(AtomicClaimRetryScopeSchema.parse({
    source_revision_id: report.source_revision_id,
    claim_coverage_hash: report.content_hash,
    attempt: input.attempt,
    claim_ids: [...new Set(retryable.map(({ claim_id }) => claim_id))].sort(compare),
    source_unit_ids: [...new Set(retryable.map(({ source_unit_id }) => source_unit_id))].sort(compare),
    prior_candidate_ids: [...new Set(input.prior_candidate_ids ?? [])].sort(compare),
  }));
}

export function assertAtomicClaimCoverageComplete(
  reportValue: z.input<typeof AtomicClaimCoverageReportSchema>,
): void {
  const report = AtomicClaimCoverageReportSchema.parse(reportValue);
  if (report.qualification_blocked) {
    throw new Error("Atlas qualification blocked: unresolved atomic claims");
  }
}

function splitClaimRanges(value: string): { start: number; end: number }[] {
  const boundaries = /[.;](?=\s+|$)|\r?\n/gu;
  const ranges: { start: number; end: number }[] = [];
  let start = 0;
  for (const match of value.matchAll(boundaries)) {
    const boundaryEnd = match.index + match[0].length;
    appendTrimmedRange(value, start, boundaryEnd, ranges);
    start = boundaryEnd;
  }
  appendTrimmedRange(value, start, value.length, ranges);
  return ranges.length > 0 ? ranges : [{ start: 0, end: value.length }];
}

function appendTrimmedRange(
  value: string,
  rawStart: number,
  rawEnd: number,
  ranges: { start: number; end: number }[],
): void {
  let start = rawStart;
  let end = rawEnd;
  while (start < end && /\s/u.test(value[start]!)) start += 1;
  while (end > start && /\s/u.test(value[end - 1]!)) end -= 1;
  if (end > start) ranges.push({ start, end });
}

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

export const CompletenessFindingInputSchema = z.object({
  finding_type: z.enum([
    "uncovered_normative_source", "distorted_candidate", "unsupported_candidate",
    "conflict", "suspiciously_sparse_category", "empty_workflow_area",
    "false_non_normative", "over_combination", "duplicate",
  ]),
  pipeline_stage: PipelineStageSchema,
  source_unit_ids: z.array(Id).min(1),
  candidate_ids: z.array(Id),
  record_ids: z.array(Id),
  semantic_kind_ids: z.array(Id),
  severity: z.enum(["material", "blocking", "warning"]),
  statement: Text,
  recommended_action: z.enum(["targeted_retry", "human_review", "inspect_stage"]),
  resolution_history: z.array(z.object({
    sequence: z.number().int().positive(),
    actor_type: z.enum(["human", "deterministic_pipeline"]),
    actor_id: Text,
    action: z.enum(["resolved", "accepted_risk", "retry_completed", "reopened"]),
    note: Text,
  }).strict()).default([]),
}).strict();

export const CompletenessFindingSchema = CompletenessFindingInputSchema.extend({
  id: Id,
  status: z.enum(["open", "resolved"]),
}).strict();

export const CompletenessCriticReportSchema = z.object({
  schema_version: z.literal(ATLAS_PIPELINE_COVERAGE_VERSION),
  source_revision_id: Id,
  pipeline_coverage_hash: Hash,
  findings: z.array(CompletenessFindingSchema),
  counts: z.object({
    total: z.number().int().nonnegative(),
    open: z.number().int().nonnegative(),
    blocking_open: z.number().int().nonnegative(),
  }).strict(),
  content_hash: Hash,
}).strict();

export const RetryCapabilitySchema = z.object({
  extractor_id: Id,
  contract_version: Text,
  mode: z.enum(["category", "broad_discovery", "deterministic_stage"]),
  supported_finding_types: z.array(Text).min(1),
  supported_semantic_kind_ids: z.array(Id),
}).strict();

export const HardenedRetryRequestSchema = z.object({
  id: Id,
  finding_id: Id,
  source_revision_id: Id,
  critic_report_hash: Hash,
  attempt: z.number().int().positive(),
  extractor_id: Id,
  extractor_contract_version: Text,
  retry_scope: z.object({
    source_unit_ids: z.array(Id).min(1),
    candidate_ids: z.array(Id),
    record_ids: z.array(Id),
    pipeline_stage: PipelineStageSchema,
  }).strict(),
}).strict();

export const HardenedRetryAttemptSchema = z.object({
  request_id: Id,
  finding_id: Id,
  attempt: z.number().int().positive(),
  status: z.enum(["succeeded", "unresolved", "provider_error", "exhausted"]),
  prior_candidate_ids: z.array(Id),
  appended_candidate_ids: z.array(Id),
  diagnostic: Text,
}).strict();

export const HardenedRetryPlanSchema = z.object({
  source_revision_id: Id,
  critic_report_hash: Hash,
  maximum_attempts: z.number().int().positive(),
  requests: z.array(HardenedRetryRequestSchema),
  unrouteable_finding_ids: z.array(Id),
  exhausted_finding_ids: z.array(Id),
  status: z.enum(["ready", "review_required", "exhausted"]),
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

export function createCompletenessCriticReport(input: {
  readonly coverage: z.input<typeof PipelineCoverageReportSchema>;
  readonly findings: readonly z.input<typeof CompletenessFindingInputSchema>[];
}): z.infer<typeof CompletenessCriticReportSchema> {
  const coverage = PipelineCoverageReportSchema.parse(input.coverage);
  const sourceIds = new Set(coverage.source_coverage.map(({ source_unit_id }) => source_unit_id));
  const candidateIds = new Set(coverage.source_coverage.flatMap(({ candidate_ids }) => candidate_ids));
  const recordIds = new Set(coverage.record_coverage.map(({ record_id }) => record_id));
  const findings = input.findings.map((value) => {
    const parsed = CompletenessFindingInputSchema.parse(value);
    assertMembers(parsed.source_unit_ids, sourceIds, "finding source unit");
    assertMembers(parsed.candidate_ids, candidateIds, "finding candidate");
    assertMembers(parsed.record_ids, recordIds, "finding record");
    const history = [...parsed.resolution_history].sort((a, b) => a.sequence - b.sequence);
    history.forEach((entry, index) => {
      if (entry.sequence !== index + 1) throw new Error("Finding resolution history must be contiguous");
    });
    const identityCore = {
      finding_type: parsed.finding_type,
      pipeline_stage: parsed.pipeline_stage,
      source_unit_ids: [...parsed.source_unit_ids].sort(compare),
      candidate_ids: [...parsed.candidate_ids].sort(compare),
      record_ids: [...parsed.record_ids].sort(compare),
      semantic_kind_ids: [...parsed.semantic_kind_ids].sort(compare),
      statement: parsed.statement,
    };
    const status = history.at(-1)?.action === "resolved"
      || history.at(-1)?.action === "accepted_risk"
      || history.at(-1)?.action === "retry_completed"
      ? "resolved" as const : "open" as const;
    return CompletenessFindingSchema.parse({
      ...parsed,
      source_unit_ids: identityCore.source_unit_ids,
      candidate_ids: identityCore.candidate_ids,
      record_ids: identityCore.record_ids,
      semantic_kind_ids: identityCore.semantic_kind_ids,
      resolution_history: history,
      id: `atlas.finding.${parsed.finding_type}.${digest(JSON.stringify(canonical(identityCore))).slice(0, 12)}`,
      status,
    });
  }).sort((a, b) => compare(a.id, b.id));
  assertUnique(findings.map(({ id }) => id), "completeness finding");
  const core = {
    schema_version: ATLAS_PIPELINE_COVERAGE_VERSION,
    source_revision_id: coverage.source_revision_id,
    pipeline_coverage_hash: coverage.content_hash,
    findings,
    counts: {
      total: findings.length,
      open: findings.filter(({ status }) => status === "open").length,
      blocking_open: findings.filter(({ status, severity }) =>
        status === "open" && severity === "blocking").length,
    },
  };
  return deepFreeze(CompletenessCriticReportSchema.parse({
    ...core, content_hash: hashJson(core),
  }));
}

export function createHardenedRetryPlan(input: {
  readonly report: z.input<typeof CompletenessCriticReportSchema>;
  readonly expected_source_revision_id: string;
  readonly expected_report_hash: string;
  readonly capabilities: readonly z.input<typeof RetryCapabilitySchema>[];
  readonly prior_attempts?: readonly z.input<typeof HardenedRetryAttemptSchema>[];
  readonly maximum_attempts: number;
}): z.infer<typeof HardenedRetryPlanSchema> {
  const report = CompletenessCriticReportSchema.parse(input.report);
  if (report.source_revision_id !== Id.parse(input.expected_source_revision_id)
    || report.content_hash !== Hash.parse(input.expected_report_hash)) {
    throw new Error("Stale critic report or source revision");
  }
  const maximumAttempts = z.number().int().positive().parse(input.maximum_attempts);
  const capabilities = input.capabilities.map((item) => RetryCapabilitySchema.parse(item))
    .sort((a, b) => compare(a.extractor_id, b.extractor_id));
  assertUnique(capabilities.map(({ extractor_id }) => extractor_id), "retry capability");
  const attempts = (input.prior_attempts ?? []).map((item) =>
    HardenedRetryAttemptSchema.parse(item));
  const requests: z.infer<typeof HardenedRetryRequestSchema>[] = [];
  const unrouteable: string[] = [];
  const exhausted: string[] = [];
  for (const finding of report.findings.filter(({ status }) => status === "open")) {
    const prior = attempts.filter(({ finding_id }) => finding_id === finding.id);
    const attempt = prior.length + 1;
    if (attempt > maximumAttempts) {
      exhausted.push(finding.id);
      continue;
    }
    const matching = capabilities.filter((capability) =>
      capability.supported_finding_types.includes(finding.finding_type)
      && (capability.supported_semantic_kind_ids.length === 0
        || finding.semantic_kind_ids.some((id) =>
          capability.supported_semantic_kind_ids.includes(id))));
    const capability = matching.find(({ mode }) => mode !== "broad_discovery")
      ?? matching.find(({ mode }) => mode === "broad_discovery");
    if (!capability) {
      unrouteable.push(finding.id);
      continue;
    }
    const scope = {
      source_unit_ids: finding.source_unit_ids,
      candidate_ids: finding.candidate_ids,
      record_ids: finding.record_ids,
      pipeline_stage: finding.pipeline_stage,
    };
    const identity = digest(JSON.stringify(canonical({
      finding_id: finding.id, attempt, extractor_id: capability.extractor_id, scope,
    }))).slice(0, 12);
    requests.push(HardenedRetryRequestSchema.parse({
      id: `atlas.retry.${String(attempt).padStart(3, "0")}.${identity}`,
      finding_id: finding.id,
      source_revision_id: report.source_revision_id,
      critic_report_hash: report.content_hash,
      attempt,
      extractor_id: capability.extractor_id,
      extractor_contract_version: capability.contract_version,
      retry_scope: scope,
    }));
  }
  requests.sort((a, b) => compare(a.id, b.id));
  const status = exhausted.length > 0 ? "exhausted" as const
    : unrouteable.length > 0 ? "review_required" as const : "ready" as const;
  const core = {
    source_revision_id: report.source_revision_id,
    critic_report_hash: report.content_hash,
    maximum_attempts: maximumAttempts,
    requests,
    unrouteable_finding_ids: unrouteable.sort(compare),
    exhausted_finding_ids: exhausted.sort(compare),
    status,
  };
  return deepFreeze(HardenedRetryPlanSchema.parse({
    ...core, content_hash: hashJson(core),
  }));
}

export function recordHardenedRetryAttempt(input: {
  readonly request: z.input<typeof HardenedRetryRequestSchema>;
  readonly status: z.input<typeof HardenedRetryAttemptSchema>["status"];
  readonly prior_candidate_ids: readonly string[];
  readonly appended_candidate_ids: readonly string[];
  readonly output_source_unit_ids: readonly string[];
  readonly diagnostic: string;
}): z.infer<typeof HardenedRetryAttemptSchema> {
  const request = HardenedRetryRequestSchema.parse(input.request);
  const allowed = new Set(request.retry_scope.source_unit_ids);
  const expanded = input.output_source_unit_ids.find((id) => !allowed.has(Id.parse(id)));
  if (expanded) throw new Error(`Retry output expanded beyond requested scope: ${expanded}`);
  const prior = input.prior_candidate_ids.map((id) => Id.parse(id)).sort(compare);
  const appended = input.appended_candidate_ids.map((id) => Id.parse(id)).sort(compare);
  if (appended.some((id) => prior.includes(id))) {
    throw new Error("Retry output must append candidates without replacing prior evidence");
  }
  return deepFreeze(HardenedRetryAttemptSchema.parse({
    request_id: request.id,
    finding_id: request.finding_id,
    attempt: request.attempt,
    status: input.status,
    prior_candidate_ids: prior,
    appended_candidate_ids: appended,
    diagnostic: input.diagnostic,
  }));
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
