import { createHash } from "node:crypto";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { QualificationPolicyDemandFactSchema, type QualificationPolicyDemandFact } from
  "@company/ces-policy-manual-demand-adapter";
import { CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import { CES_POLICY_REPRESENTATIVE_TAXONOMY_V1 } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { resolvePolicySourceLineage } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { z } from "zod";

export const SAFARA_BOOTSTRAP_EVALUATOR_VERSION = "1.0.0" as const;
const Id = z.string().min(1);
const NonEmpty = z.string().trim().min(1);

export const GovernedDispositionSchema = z.enum([
  "AWARENESS_EMITTED", "NO_SECURITY_AWARENESS_REQUIRED",
  "OUTSIDE_SOFTWARE_SCOPE", "DECISION_REQUIRED", "SOURCE_OR_POLICY_GAP",
]);
export const GapRouteSchema = z.enum([
  "POLICY_GAP", "CANONICALIZATION_GAP", "EXTRACTION_GAP", "SOURCE_GAP",
]);

const PolicySupportSchema = z.object({
  policy_id: Id,
  policy_revision: NonEmpty,
  support_status: z.literal("candidate_only"),
  canonical_concept_ids: z.array(Id).min(1),
  source_lineage: z.array(z.object({
    canonical_concept_id: Id,
    raw_concept_id: Id,
    source_release_id: Id,
    source_locator: NonEmpty,
  }).strict()).min(1),
}).strict();

export const SafaraCoverageEntrySchema = z.object({
  demand_fact_id: Id,
  disposition: GovernedDispositionSchema,
  rationale: NonEmpty,
  policy_support: z.array(PolicySupportSchema),
  gap_route: GapRouteSchema.nullable(),
  raw_support_ids: z.array(Id),
}).strict().superRefine((entry, context) => {
  if (entry.disposition === "AWARENESS_EMITTED" && entry.policy_support.length === 0) {
    context.addIssue({ code: "custom", message: "Awareness requires candidate Policy support" });
  }
  if (entry.disposition === "SOURCE_OR_POLICY_GAP" && !entry.gap_route) {
    context.addIssue({ code: "custom", message: "Knowledge gaps require a diagnostic route" });
  }
  if (entry.disposition !== "SOURCE_OR_POLICY_GAP" && entry.gap_route) {
    context.addIssue({ code: "custom", message: "Only knowledge gaps may have a gap route" });
  }
});

export const SafaraBootstrapCoverageSchema = z.object({
  schema_version: z.literal("1.0.0"),
  result_id: z.literal("ces-policies.safara-bootstrap.coverage-v1"),
  lifecycle: z.literal("proposed"),
  evaluator_version: z.literal(SAFARA_BOOTSTRAP_EVALUATOR_VERSION),
  manual_inventory_sha256: z.literal(
    "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2"),
  raw_corpus_id: z.literal("ces-policies.raw-vocabulary.representative-v1-1"),
  canonical_vocabulary_revision: z.literal("1.1.0"),
  candidate_taxonomy_revision: z.literal("1.0.0"),
  candidate_is_authoritative: z.literal(false),
  entries: z.array(SafaraCoverageEntrySchema).length(111),
  result_hash: z.string().regex(/^[0-9a-f]{64}$/u),
}).strict();

const accessIds = idSet([
  11, 12, 13, 14, 15, 17, 23, 28, 47, 51, 56, 57, 58, 79, 89, 94, 95, 101, 108,
]);
const traceIds = idSet([33, 39, 49, 50, 60, 66, 67, 68, 69, 74, 78, 85, 91, 109]);
const transactionIds = idSet([
  5, 9, 21, 22, 26, 29, 30, 31, 32, 34, 37, 38, 40, 41, 42, 43, 52, 53,
  54, 55, 59, 70, 71, 72, 73, 75, 76, 77, 80, 81, 82, 83, 84, 86, 87, 90,
  93, 102, 103, 104, 105, 106, 107, 111,
]);
const canonicalizationGaps = new Map<string, readonly string[]>([
  ...[2, 24, 27, 35, 36, 44, 45, 61, 62, 63, 64, 65, 98]
    .map((number) => [factId(number), ["raw.asvs.v14-2-1"]] as const),
  [factId(16), ["raw.asvs.v2-3-1"]],
]);
const outsideScope = idSet([96, 97, 99, 100, 110]);

const policyDefinitions = {
  access: { policy_id: "policy.access-authorization", canonical: "ces.access-authorization" },
  trace: { policy_id: "policy.security-event-traceability",
    canonical: "ces.security-event-logging" },
  transaction: { policy_id: "policy.transaction-integrity",
    canonical: "ces.transaction-integrity" },
} as const;

export function evaluateSafaraBootstrapCoverage(
  demandFacts: readonly QualificationPolicyDemandFact[],
) {
  const facts = demandFacts.map((fact) => QualificationPolicyDemandFactSchema.parse(fact));
  if (facts.length !== 111 || new Set(facts.map(({ demand_fact_id }) => demand_fact_id)).size !== 111) {
    throw new Error("Safara bootstrap requires all 111 unique manual demand facts");
  }
  assertPinnedKnowledge();
  const entries = facts.map(classify);
  const valueWithoutHash = {
    schema_version: "1.0.0" as const,
    result_id: "ces-policies.safara-bootstrap.coverage-v1" as const,
    lifecycle: "proposed" as const,
    evaluator_version: SAFARA_BOOTSTRAP_EVALUATOR_VERSION,
    manual_inventory_sha256:
      "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2" as const,
    raw_corpus_id: "ces-policies.raw-vocabulary.representative-v1-1" as const,
    canonical_vocabulary_revision: "1.1.0" as const,
    candidate_taxonomy_revision: "1.0.0" as const,
    candidate_is_authoritative: false as const,
    entries,
  };
  return SafaraBootstrapCoverageSchema.parse({ ...valueWithoutHash,
    result_hash: stableHash(valueWithoutHash) });
}

function classify(fact: QualificationPolicyDemandFact): z.infer<typeof SafaraCoverageEntrySchema> {
  const id = fact.demand_fact_id;
  const rawSupport = canonicalizationGaps.get(id);
  if (rawSupport) return { demand_fact_id: id, disposition: "SOURCE_OR_POLICY_GAP",
    rationale: id === factId(16)
      ? "The raw corpus contains sequential business-flow knowledge but no approved canonical obligation represents it."
      : "The raw corpus contains sensitive-data protection knowledge but no approved canonical obligation represents it.",
    policy_support: [], gap_route: "CANONICALIZATION_GAP", raw_support_ids: [...rawSupport] };
  if (outsideScope.has(id)) return { demand_fact_id: id, disposition: "OUTSIDE_SOFTWARE_SCOPE",
    rationale: "This delivery or organizational handover commitment is accounted for but does not create software-side CES Policy awareness.",
    policy_support: [], gap_route: null, raw_support_ids: [] };
  if (accessIds.has(id)) return awareness(id, "access",
    "The fact activates candidate authorization awareness; candidate support is not authoritative coverage.");
  if (traceIds.has(id)) return awareness(id, "trace",
    "The fact activates candidate security-event traceability awareness; candidate support is not authoritative coverage.");
  if (transactionIds.has(id)) return awareness(id, "transaction",
    "The fact activates candidate transaction-integrity awareness; candidate support is not authoritative coverage.");
  return { demand_fact_id: id, disposition: "NO_SECURITY_AWARENESS_REQUIRED",
    rationale: "The fact remains project truth or a functional detail and does not independently require software-security awareness in the current governed knowledge scope.",
    policy_support: [], gap_route: null, raw_support_ids: [] };
}

function awareness(id: string, kind: keyof typeof policyDefinitions, rationale: string) {
  const definition = policyDefinitions[kind];
  const sourceLineage = resolvePolicySourceLineage(definition.policy_id)
    .flatMap(({ canonical_support, source_lineage }) => source_lineage.map(({ raw_concept }) => ({
      canonical_concept_id: canonical_support.canonical_concept_id,
      raw_concept_id: raw_concept.concept_id,
      source_release_id: raw_concept.source_release_id,
      source_locator: raw_concept.source_locator.locator,
    })));
  return { demand_fact_id: id, disposition: "AWARENESS_EMITTED" as const, rationale,
    policy_support: [{ policy_id: definition.policy_id, policy_revision: "1.0.0",
      support_status: "candidate_only" as const,
      canonical_concept_ids: [definition.canonical], source_lineage: sourceLineage }],
    gap_route: null, raw_support_ids: [] };
}

function assertPinnedKnowledge(): void {
  if (CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.corpus_id !==
      "ces-policies.raw-vocabulary.representative-v1-1" ||
      CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1.vocabulary_revision !== "1.1.0" ||
      CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.taxonomy_revision !== "1.0.0" ||
      CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.lifecycle !== "candidate") {
    throw new Error("Safara bootstrap knowledge inputs do not match the pinned revisions");
  }
}

function idSet(numbers: readonly number[]): ReadonlySet<string> {
  return new Set(numbers.map(factId));
}
function factId(number: number): string {
  return `safara.manual.fact.${String(number).padStart(4, "0")}`;
}
function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
