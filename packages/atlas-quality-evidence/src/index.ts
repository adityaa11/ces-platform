import { createHash } from "node:crypto";
import { z } from "zod";

export const ATLAS_QUALITY_EVIDENCE_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

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
