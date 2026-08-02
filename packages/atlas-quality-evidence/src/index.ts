import { createHash } from "node:crypto";
import { ATLAS_MODEL_REVIEW_CONTRACT_VERSION } from "@company/ces-atlas-model-review-contracts";
import { z } from "zod";

export const ATLAS_QUALITY_EVIDENCE_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

export const AtlasBackendReleaseReadinessSchema = z.object({
  hard027_golden_passed: z.boolean(),
  hardening_acceptance_complete: z.boolean(),
  backend_gate_decision: z.enum(["pass", "failed", "missing"]),
  current_real_provider_evidence: z.boolean(),
  human_review_recorded: z.boolean(),
}).strict();

export function assessAtlasBackendReleaseReadiness(
  value: z.input<typeof AtlasBackendReleaseReadinessSchema>,
): { decision: "pass" | "blocked"; blockers: readonly string[] } {
  const input = AtlasBackendReleaseReadinessSchema.parse(value);
  const blockers = [
    ...(!input.hard027_golden_passed ? ["atlas.release.hard027-golden"] : []),
    ...(!input.hardening_acceptance_complete ? ["atlas.release.hardening-acceptance"] : []),
    ...(input.backend_gate_decision !== "pass" ? ["atlas.release.backend-quality-gate"] : []),
    ...(!input.current_real_provider_evidence ? ["atlas.release.current-provider-evidence"] : []),
    ...(!input.human_review_recorded ? ["atlas.release.human-review"] : []),
  ];
  return { decision: blockers.length === 0 ? "pass" : "blocked", blockers };
}

export const IntegratedAtlasReleaseInputSchema = z.object({
  backend_decision: z.enum(["pass", "blocked"]),
  ui_decision: z.enum(["pass", "blocked"]),
  contract_versions: z.object({ artifact: Text, bff: Text, react_flow: Text,
    approved_refresh: Text }).strict(),
  runtime: z.literal("nextjs-app-router"),
  authenticated_e2e_passed: z.boolean(),
  security_negative_tests_passed: z.boolean(),
  human_release_review_recorded: z.boolean(),
}).strict();

export function assessIntegratedAtlasRelease(
  value: z.input<typeof IntegratedAtlasReleaseInputSchema>,
): { decision: "release" | "blocked"; blockers: readonly string[] } {
  const input = IntegratedAtlasReleaseInputSchema.parse(value);
  const versions = Object.values(input.contract_versions);
  const blockers = [
    ...(input.backend_decision !== "pass" ? ["atlas.release.backend"] : []),
    ...(input.ui_decision !== "pass" ? ["atlas.release.ui"] : []),
    ...(!versions.every((version) => version === ATLAS_MODEL_REVIEW_CONTRACT_VERSION)
      ? ["atlas.release.contract-version-mismatch"] : []),
    ...(!input.authenticated_e2e_passed ? ["atlas.release.authenticated-e2e"] : []),
    ...(!input.security_negative_tests_passed ? ["atlas.release.security-negative-tests"] : []),
    ...(!input.human_release_review_recorded ? ["atlas.release.human-review"] : []),
  ];
  return { decision: blockers.length === 0 ? "release" : "blocked", blockers };
}

export const QualityVersionTupleSchema = z.object({
  provider_id: Id,
  model_id: Text,
  model_alias: Id,
  agent_version: Text,
  prompt_contract_version: Text,
  source_revision_id: Id,
  source_content_hash: Hash,
  lexicon_revision_id: Id,
  lexicon_content_hash: Hash,
  semantic_schema_version: Text,
  oracle_id: Id,
  oracle_content_hash: Hash,
}).strict().refine(({ provider_id }) => provider_id !== "fixture",
  "Fixture providers cannot produce release-quality evidence");

export const OracleQualityMappingSchema = z.object({
  oracle_key: Id,
  mandatory: z.boolean(),
  normative: z.boolean(),
  stage: z.enum([
    "direct_extraction", "critic_detection", "targeted_retry",
    "human_created", "human_corrected", "missing",
  ]),
  candidate_ids: z.array(Id),
  approved_record_ids: z.array(Id),
  supported: z.boolean(),
  distorted: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.stage === "missing" && value.approved_record_ids.length > 0) {
    context.addIssue({ code: "custom", message: "Missing oracle keys cannot have approved records" });
  }
  if (value.stage !== "missing" && value.candidate_ids.length === 0
    && value.stage !== "human_created") {
    context.addIssue({ code: "custom", message: `${value.stage} requires candidate attribution` });
  }
  if (value.stage === "human_created" && value.approved_record_ids.length === 0) {
    context.addIssue({ code: "custom", message: "Human-created mappings require approved records" });
  }
});

export const AtlasQualityEvidenceInputSchema = z.object({
  schema_version: z.literal(ATLAS_QUALITY_EVIDENCE_VERSION),
  run_id: Id,
  versions: QualityVersionTupleSchema,
  reviewer: z.object({
    identity: Text,
    reviewed_at: z.string().datetime({ offset: true }),
  }).strict(),
  mappings: z.array(OracleQualityMappingSchema).min(1),
  required_primary_rule_keys: z.array(Id).min(10),
  artifact_hashes: z.record(Id, Hash),
}).strict();

export const AtlasQualityEvidenceSchema = z.object({
  schema_version: z.literal(ATLAS_QUALITY_EVIDENCE_VERSION),
  run_id: Id,
  versions: QualityVersionTupleSchema,
  reviewer: AtlasQualityEvidenceInputSchema.shape.reviewer,
  metrics: z.object({
    mandatory_total: z.number().int().positive(),
    direct_recall: z.number().min(0).max(1),
    post_retry_recall: z.number().min(0).max(1),
    final_normative_coverage: z.number().min(0).max(1),
    unsupported_approved_records: z.number().int().nonnegative(),
    distorted_approved_records: z.number().int().nonnegative(),
    critic_detected_keys: z.number().int().nonnegative(),
    human_created_keys: z.number().int().nonnegative(),
    human_corrected_keys: z.number().int().nonnegative(),
  }).strict(),
  stage_counts: z.record(z.enum([
    "direct_extraction", "critic_detection", "targeted_retry",
    "human_created", "human_corrected", "missing",
  ]), z.number().int().nonnegative()),
  mappings: z.array(OracleQualityMappingSchema),
  required_primary_rule_keys: z.array(Id),
  artifact_hashes: z.record(Id, Hash),
  release_decision: z.enum(["pass", "quality_gate_failed", "review_required"]),
  content_hash: Hash,
}).strict();

export const SafaraHardeningGateInputSchema = z.object({
  schema_version: z.literal(ATLAS_QUALITY_EVIDENCE_VERSION),
  qualification_id: Id,
  oracle_id: Id,
  fixture_evidence_hash: Hash,
  real_provider_evidence_hash: Hash,
  reviewer: z.object({
    kind: z.literal("human"),
    identity: Text,
    reviewed_at: z.string().datetime({ offset: true }),
  }).strict(),
  metrics: z.object({
    primary_rules_total: z.literal(10),
    primary_rules_after_retry: z.number().int().min(0).max(10),
    workflow_areas_total: z.literal(10),
    workflow_areas_represented: z.number().int().min(0).max(10),
    broader_normative_recall_before_review: z.number().min(0).max(1),
    final_reviewed_normative_coverage: z.number().min(0).max(1),
    unsupported_approved_records: z.number().int().nonnegative(),
    distorted_approved_records: z.number().int().nonnegative(),
    approved_records_total: z.number().int().positive(),
    approved_records_with_source: z.number().int().nonnegative(),
    exact_text_available_total: z.number().int().nonnegative(),
    exact_text_preserved: z.number().int().nonnegative(),
    ambiguities_total: z.number().int().nonnegative(),
    ambiguities_surfaced: z.number().int().nonnegative(),
    conflicts_total: z.number().int().nonnegative(),
    conflicts_surfaced: z.number().int().nonnegative(),
  }).strict(),
  lifecycle_checks: z.object({
    deterministic_artifacts: z.boolean(),
    proposed_graph_available: z.boolean(),
    proposal_authoritative: z.boolean(),
    preapproval_downstream_execution_allowed: z.boolean(),
    proposed_artifacts_valid: z.boolean(),
    approved_artifacts_valid: z.boolean(),
  }).strict(),
  artifact_hashes: z.record(Id, Hash),
  claim_scope: z.literal("safara_fixture_and_atlas_lifecycle_only"),
  general_domain_coverage_claimed: z.literal(false),
}).strict();

export const SafaraHardeningGateReportSchema = SafaraHardeningGateInputSchema.extend({
  gates: z.array(z.object({
    id: Id,
    passed: z.boolean(),
    failure_stage: z.enum([
      "parsing", "extraction", "classification", "normalization",
      "deduplication", "assignment", "projection", "review", "publication",
    ]).optional(),
  }).strict()),
  decision: z.enum(["pass", "failed"]),
  content_hash: Hash,
}).strict();

export function calculateSafaraHardeningGate(
  inputValue: z.input<typeof SafaraHardeningGateInputSchema>,
): z.infer<typeof SafaraHardeningGateReportSchema> {
  assertRedactedEvidence(inputValue);
  const input = SafaraHardeningGateInputSchema.parse(inputValue);
  const metrics = input.metrics;
  const checks = input.lifecycle_checks;
  const gateValues: [string, boolean, z.infer<typeof SafaraHardeningGateReportSchema>["gates"][number]["failure_stage"]][] = [
    ["primary-rules", metrics.primary_rules_after_retry === 10, "extraction"],
    ["workflow-areas", metrics.workflow_areas_represented === 10, "assignment"],
    ["pre-review-recall", metrics.broader_normative_recall_before_review >= 0.9, "extraction"],
    ["final-coverage", metrics.final_reviewed_normative_coverage === 1, "review"],
    ["approved-quality", metrics.unsupported_approved_records === 0
      && metrics.distorted_approved_records === 0, "review"],
    ["source-grounding", metrics.approved_records_with_source === metrics.approved_records_total,
      "normalization"],
    ["exact-text", metrics.exact_text_preserved === metrics.exact_text_available_total, "parsing"],
    ["ambiguities", metrics.ambiguities_surfaced === metrics.ambiguities_total, "classification"],
    ["conflicts", metrics.conflicts_surfaced === metrics.conflicts_total, "deduplication"],
    ["determinism", checks.deterministic_artifacts, "publication"],
    ["proposed-graph", checks.proposed_graph_available, "projection"],
    ["proposal-authority", !checks.proposal_authoritative
      && !checks.preapproval_downstream_execution_allowed, "publication"],
    ["artifact-suites", checks.proposed_artifacts_valid
      && checks.approved_artifacts_valid, "publication"],
  ];
  const gates = gateValues.map(([id, passed, failureStage]) => ({
    id: `safara.gate.${id}`, passed,
    ...(passed ? {} : { failure_stage: failureStage }),
  })).sort((a, b) => compare(a.id, b.id));
  const core = {
    ...input,
    artifact_hashes: Object.fromEntries(Object.entries(input.artifact_hashes)
      .sort(([a], [b]) => compare(a, b))),
    gates,
    decision: gates.every(({ passed }) => passed) ? "pass" as const : "failed" as const,
  };
  return deepFreeze(SafaraHardeningGateReportSchema.parse({
    ...core, content_hash: hashJson(core),
  }));
}

export type AtlasQualityEvidenceInput = z.input<typeof AtlasQualityEvidenceInputSchema>;

export function calculateAtlasQualityEvidence(
  inputValue: AtlasQualityEvidenceInput,
): z.infer<typeof AtlasQualityEvidenceSchema> {
  assertRedactedEvidence(inputValue);
  const input = AtlasQualityEvidenceInputSchema.parse(inputValue);
  const mappings = [...input.mappings].sort((a, b) => compare(a.oracle_key, b.oracle_key));
  assertUnique(mappings.map(({ oracle_key }) => oracle_key), "oracle mapping");
  assertUnique(input.required_primary_rule_keys, "primary-rule key");
  const mappingKeys = new Set(mappings.map(({ oracle_key }) => oracle_key));
  const absentRules = input.required_primary_rule_keys.filter((key) => !mappingKeys.has(key));
  if (absentRules.length > 0) {
    throw new Error(`Primary rules lack explicit extraction or missing attribution: ${absentRules.join(", ")}`);
  }
  const mandatory = mappings.filter(({ mandatory }) => mandatory);
  const normative = mappings.filter(({ normative }) => normative);
  const direct = mandatory.filter(({ stage }) => stage === "direct_extraction").length;
  const postRetry = mandatory.filter(({ stage }) =>
    ["direct_extraction", "critic_detection", "targeted_retry"].includes(stage)).length;
  const finalCovered = normative.filter(({ stage, approved_record_ids }) =>
    stage !== "missing" && approved_record_ids.length > 0).length;
  const unsupported = mappings.reduce((total, mapping) =>
    total + (!mapping.supported ? mapping.approved_record_ids.length : 0), 0);
  const distorted = mappings.reduce((total, mapping) =>
    total + (mapping.distorted ? mapping.approved_record_ids.length : 0), 0);
  const stageCounts = Object.fromEntries([
    "direct_extraction", "critic_detection", "targeted_retry",
    "human_created", "human_corrected", "missing",
  ].map((stage) => [stage, mappings.filter((mapping) => mapping.stage === stage).length]));
  const metrics = {
    mandatory_total: mandatory.length,
    direct_recall: ratio(direct, mandatory.length),
    post_retry_recall: ratio(postRetry, mandatory.length),
    final_normative_coverage: ratio(finalCovered, normative.length),
    unsupported_approved_records: unsupported,
    distorted_approved_records: distorted,
    critic_detected_keys: stageCounts.critic_detection!,
    human_created_keys: stageCounts.human_created!,
    human_corrected_keys: stageCounts.human_corrected!,
  };
  const allRulesAccounted = input.required_primary_rule_keys.every((key) => mappingKeys.has(key));
  const releaseDecision = metrics.final_normative_coverage < 1 ? "review_required"
    : unsupported > 0 || distorted > 0 || !allRulesAccounted ? "quality_gate_failed"
    : "pass";
  const core = {
    schema_version: ATLAS_QUALITY_EVIDENCE_VERSION,
    run_id: input.run_id,
    versions: input.versions,
    reviewer: input.reviewer,
    metrics,
    stage_counts: stageCounts,
    mappings,
    required_primary_rule_keys: [...input.required_primary_rule_keys].sort(compare),
    artifact_hashes: Object.fromEntries(Object.entries(input.artifact_hashes).sort(([a], [b]) =>
      compare(a, b))),
    release_decision: releaseDecision,
  };
  return deepFreeze(AtlasQualityEvidenceSchema.parse({
    ...core, content_hash: hashJson(core),
  }));
}

export function assertRedactedEvidence(value: unknown): void {
  const forbiddenKeys = /(?:api.?key|authorization|credential|secret|(?:^|_)prompt(?:$|_text)|(?:^|_)response(?:$|_text)|document.?text|prd.?text)/iu;
  const forbiddenValues = /(?:bearer\s+[a-z0-9._-]+|-----begin [a-z ]+key-----)/iu;
  const visit = (item: unknown, path: string): void => {
    if (typeof item === "string" && forbiddenValues.test(item)) {
      throw new Error(`Unredacted secret-like evidence at ${path}`);
    }
    if (Array.isArray(item)) item.forEach((child, index) => visit(child, `${path}[${index}]`));
    else if (item !== null && typeof item === "object") {
      for (const [key, child] of Object.entries(item)) {
        if (forbiddenKeys.test(key)) throw new Error(`Forbidden evidence field: ${path}.${key}`);
        visit(child, `${path}.${key}`);
      }
    }
  };
  visit(value, "$");
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) throw new Error("Quality evidence requires normative and mandatory keys");
  return numerator / denominator;
}
function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
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
