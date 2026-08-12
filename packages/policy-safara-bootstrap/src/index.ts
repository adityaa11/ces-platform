import { createHash } from "node:crypto";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { QualificationPolicyDemandFactSchema, type QualificationPolicyDemandFact } from
  "@company/ces-policy-manual-demand-adapter";
import { CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import { CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import { CES_POLICY_REPRESENTATIVE_TAXONOMY_V1 } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { resolvePolicySourceLineage } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1,
  CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1,
  resolveSequentialFlowPolicySourceLineage,
  resolveDataProtectionPolicySourceLineage } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { z } from "zod";

export const SAFARA_BOOTSTRAP_EVALUATOR_VERSION = "1.0.0" as const;
export const SAFARA_BOOTSTRAP_EVALUATOR_V2_VERSION = "1.1.0" as const;
export const SAFARA_BOOTSTRAP_EVALUATOR_V3_VERSION = "1.2.0" as const;
export const SAFARA_BOOTSTRAP_EVALUATOR_V4_VERSION = "1.3.0" as const;
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
  manual_provenance: z.object({
    kind: z.literal("manual_golden_fixture"),
    source_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    inventory_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    page: z.number().int().min(1).max(7),
    exact_text: NonEmpty,
    extraction_method: z.literal("human_reconciled"),
  }).strict(),
  disposition: GovernedDispositionSchema,
  rationale: NonEmpty,
  policy_support: z.array(PolicySupportSchema),
  gap_route: GapRouteSchema.nullable(),
  raw_support_ids: z.array(Id),
  source_support_candidates: z.array(z.object({
    source_release_id: Id,
    source_locator: NonEmpty,
    bounded_relevance: NonEmpty,
  }).strict()),
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
  if (entry.gap_route === "CANONICALIZATION_GAP" && entry.raw_support_ids.length === 0) {
    context.addIssue({ code: "custom", message: "Canonicalization gaps require raw support" });
  }
  if (entry.gap_route === "EXTRACTION_GAP" &&
      entry.source_support_candidates.length === 0) {
    context.addIssue({ code: "custom", message: "Extraction gaps require source candidates" });
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

export const SafaraBootstrapCoverageV2Schema = z.object({
  schema_version: z.literal("1.0.0"),
  result_id: z.literal("ces-policies.safara-bootstrap.coverage-v2"),
  predecessor_result_id: z.literal("ces-policies.safara-bootstrap.coverage-v1"),
  lifecycle: z.literal("proposed"),
  evaluator_version: z.literal(SAFARA_BOOTSTRAP_EVALUATOR_V2_VERSION),
  manual_inventory_sha256: z.literal(
    "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2"),
  raw_corpus_id: z.literal("ces-policies.raw-vocabulary.representative-v1-2"),
  raw_publication_status: z.literal("accepted"),
  canonical_vocabulary_revision: z.literal("1.3.0"),
  candidate_taxonomy_revision: z.literal("1.0.0"),
  candidate_is_authoritative: z.literal(false),
  entries: z.array(SafaraCoverageEntrySchema).length(111),
  result_hash: z.string().regex(/^[0-9a-f]{64}$/u),
}).strict();

export const SafaraBootstrapCoverageV3Schema = z.object({
  schema_version: z.literal("1.0.0"),
  result_id: z.literal("ces-policies.safara-bootstrap.coverage-v3"),
  predecessor_result_id: z.literal("ces-policies.safara-bootstrap.coverage-v2"),
  lifecycle: z.literal("proposed"),
  evaluator_version: z.literal(SAFARA_BOOTSTRAP_EVALUATOR_V3_VERSION),
  manual_inventory_sha256: z.literal(
    "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2"),
  raw_corpus_id: z.literal("ces-policies.raw-vocabulary.representative-v1-2"),
  raw_publication_status: z.literal("accepted"),
  canonical_vocabulary_revision: z.literal("1.5.0"),
  candidate_taxonomy_revision: z.literal("1.1.0"),
  taxonomy_decision_publication_status: z.literal("accepted"),
  candidate_is_authoritative: z.literal(false),
  entries: z.array(SafaraCoverageEntrySchema).length(111),
  result_hash: z.string().regex(/^[0-9a-f]{64}$/u),
}).strict();

export const SafaraBootstrapCoverageV4Schema = z.object({
  schema_version: z.literal("1.0.0"),
  result_id: z.literal("ces-policies.safara-bootstrap.coverage-v4"),
  predecessor_result_id: z.literal("ces-policies.safara-bootstrap.coverage-v3"),
  lifecycle: z.literal("proposed"),
  evaluator_version: z.literal(SAFARA_BOOTSTRAP_EVALUATOR_V4_VERSION),
  manual_inventory_sha256: z.literal(
    "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2"),
  raw_corpus_id: z.literal("ces-policies.raw-vocabulary.representative-v1-2"),
  raw_publication_status: z.literal("accepted"),
  canonical_vocabulary_revision: z.literal("1.5.0"),
  candidate_taxonomy_revision: z.literal("1.2.0"),
  taxonomy_decision_publication_status: z.literal("accepted"),
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
  [factId(16), ["raw.asvs.v2-3-1"]],
]);
const extractionGaps = new Map<string, readonly SourceCandidate[]>([
  [factId(24), [asvsCandidate("v5.0.0-V14.1.1",
    "Sensitive-data identification and classification is relevant to the enumerated pilgrim identity data.")]],
  [factId(27), [asvsCandidate("v5.0.0-V14.2.6",
    "Minimum necessary return and UI masking are directly relevant to partially displayed NIK and passport values.")]],
  [factId(35), [asvsCandidate("v5.0.0-V14.1.1",
    "Sensitive-data identification and classification is relevant to payment records and evidence.")]],
  [factId(45), [asvsCandidate("v5.0.0-V14.1.1",
    "Sensitive-data identification and classification is relevant to identity and health document classes.")]],
]);
const v2PolicyGaps = new Map<string, readonly string[]>([
  [factId(16), ["ces.sequential-business-flow"]],
]);
const v2CanonicalizationGaps = new Map<string, readonly string[]>([
  [factId(24), ["raw.asvs.v14-1-1"]],
  [factId(27), ["raw.asvs.v14-2-6"]],
  [factId(35), ["raw.asvs.v14-1-1"]],
  [factId(45), ["raw.asvs.v14-1-1"]],
]);
const v3SequentialAwareness = idSet([16]);
const v3PolicyGaps = new Map<string, readonly string[]>([
  [factId(24), ["ces.sensitive-data-classification"]],
  [factId(27), ["ces.sensitive-data-disclosure-minimization"]],
  [factId(35), ["ces.sensitive-data-classification"]],
  [factId(45), ["ces.sensitive-data-classification"]],
]);
const v4DataProtectionAwareness = idSet([24, 27, 35, 45]);
const outsideScope = idSet([96, 97, 99, 100, 110]);
const noAwarenessIds = idSet([
  1, 2, 3, 4, 6, 7, 8, 10, 18, 19, 20, 25, 36, 44, 46, 48, 61, 62, 63,
  64, 65, 88, 92, 98,
]);

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
  assertExplicitClassificationPartition(facts.map(({ demand_fact_id }) => demand_fact_id));
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

export function evaluateSafaraBootstrapCoverageV2(
  demandFacts: readonly QualificationPolicyDemandFact[],
) {
  const facts = demandFacts.map((fact) => QualificationPolicyDemandFactSchema.parse(fact));
  if (facts.length !== 111 || new Set(facts.map(({ demand_fact_id }) => demand_fact_id)).size !== 111) {
    throw new Error("Safara bootstrap v2 requires all 111 unique manual demand facts");
  }
  assertPinnedKnowledgeV2();
  assertExplicitClassificationPartitionV2(facts.map(({ demand_fact_id }) => demand_fact_id));
  const entries = facts.map(classifyV2);
  const valueWithoutHash = {
    schema_version: "1.0.0" as const,
    result_id: "ces-policies.safara-bootstrap.coverage-v2" as const,
    predecessor_result_id: "ces-policies.safara-bootstrap.coverage-v1" as const,
    lifecycle: "proposed" as const,
    evaluator_version: SAFARA_BOOTSTRAP_EVALUATOR_V2_VERSION,
    manual_inventory_sha256:
      "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2" as const,
    raw_corpus_id: "ces-policies.raw-vocabulary.representative-v1-2" as const,
    raw_publication_status: "accepted" as const,
    canonical_vocabulary_revision: "1.3.0" as const,
    candidate_taxonomy_revision: "1.0.0" as const,
    candidate_is_authoritative: false as const,
    entries,
  };
  return SafaraBootstrapCoverageV2Schema.parse({ ...valueWithoutHash,
    result_hash: stableHash(valueWithoutHash) });
}

export function evaluateSafaraBootstrapCoverageV3(
  demandFacts: readonly QualificationPolicyDemandFact[],
) {
  const facts = demandFacts.map((fact) => QualificationPolicyDemandFactSchema.parse(fact));
  if (facts.length !== 111 || new Set(facts.map(({ demand_fact_id }) => demand_fact_id)).size !== 111) {
    throw new Error("Safara bootstrap v3 requires all 111 unique manual demand facts");
  }
  assertPinnedKnowledgeV3();
  assertExplicitClassificationPartitionV3(facts.map(({ demand_fact_id }) => demand_fact_id));
  const entries = facts.map(classifyV3);
  const valueWithoutHash = {
    schema_version: "1.0.0" as const,
    result_id: "ces-policies.safara-bootstrap.coverage-v3" as const,
    predecessor_result_id: "ces-policies.safara-bootstrap.coverage-v2" as const,
    lifecycle: "proposed" as const,
    evaluator_version: SAFARA_BOOTSTRAP_EVALUATOR_V3_VERSION,
    manual_inventory_sha256:
      "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2" as const,
    raw_corpus_id: "ces-policies.raw-vocabulary.representative-v1-2" as const,
    raw_publication_status: "accepted" as const,
    canonical_vocabulary_revision: "1.5.0" as const,
    candidate_taxonomy_revision: "1.1.0" as const,
    taxonomy_decision_publication_status: "accepted" as const,
    candidate_is_authoritative: false as const,
    entries,
  };
  return SafaraBootstrapCoverageV3Schema.parse({ ...valueWithoutHash,
    result_hash: stableHash(valueWithoutHash) });
}

export function evaluateSafaraBootstrapCoverageV4(
  demandFacts: readonly QualificationPolicyDemandFact[],
) {
  const facts = demandFacts.map((fact) => QualificationPolicyDemandFactSchema.parse(fact));
  if (facts.length !== 111 || new Set(facts.map(({ demand_fact_id }) => demand_fact_id)).size !== 111) {
    throw new Error("Safara bootstrap v4 requires all 111 unique manual demand facts");
  }
  assertPinnedKnowledgeV4();
  assertExplicitClassificationPartitionV4(facts.map(({ demand_fact_id }) => demand_fact_id));
  const entries = facts.map(classifyV4);
  const valueWithoutHash = {
    schema_version: "1.0.0" as const,
    result_id: "ces-policies.safara-bootstrap.coverage-v4" as const,
    predecessor_result_id: "ces-policies.safara-bootstrap.coverage-v3" as const,
    lifecycle: "proposed" as const,
    evaluator_version: SAFARA_BOOTSTRAP_EVALUATOR_V4_VERSION,
    manual_inventory_sha256:
      "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2" as const,
    raw_corpus_id: "ces-policies.raw-vocabulary.representative-v1-2" as const,
    raw_publication_status: "accepted" as const,
    canonical_vocabulary_revision: "1.5.0" as const,
    candidate_taxonomy_revision: "1.2.0" as const,
    taxonomy_decision_publication_status: "accepted" as const,
    candidate_is_authoritative: false as const,
    entries,
  };
  return SafaraBootstrapCoverageV4Schema.parse({ ...valueWithoutHash,
    result_hash: stableHash(valueWithoutHash) });
}

function classifyV4(fact: QualificationPolicyDemandFact): z.infer<typeof SafaraCoverageEntrySchema> {
  const id = fact.demand_fact_id;
  if (!v4DataProtectionAwareness.has(id)) return classifyV3(fact);
  const canonicalConceptId = id === "safara.manual.fact.0027"
    ? "ces.sensitive-data-disclosure-minimization"
    : "ces.sensitive-data-classification";
  const manual_provenance = {
    kind: fact.provenance.kind, source_sha256: fact.provenance.source_sha256,
    inventory_sha256: fact.provenance.inventory_sha256, page: fact.provenance.page,
    exact_text: fact.provenance.exact_text,
    extraction_method: fact.provenance.extraction_method,
  } as const;
  const sourceLineage = resolveDataProtectionPolicySourceLineage()
    .filter(({ canonical_support }) =>
      canonical_support.canonical_concept_id === canonicalConceptId)
    .flatMap(({ canonical_support, source_lineage }) => source_lineage.map(({ raw_concept }) => ({
      canonical_concept_id: canonical_support.canonical_concept_id,
      raw_concept_id: raw_concept.concept_id, source_release_id: raw_concept.source_release_id,
      source_locator: raw_concept.source_locator.locator,
    })));
  return { demand_fact_id: id, manual_provenance,
    disposition: "AWARENESS_EMITTED",
    rationale: "The fact activates candidate sensitive-data protection awareness; the accepted bounded add/merge decisions do not make the candidate Policy authoritative.",
    policy_support: [{ policy_id: "policy.sensitive-data-protection", policy_revision: "1.0.0",
      support_status: "candidate_only",
      canonical_concept_ids: [canonicalConceptId], source_lineage: sourceLineage }],
    gap_route: null, raw_support_ids: [], source_support_candidates: [] };
}

function classifyV3(fact: QualificationPolicyDemandFact): z.infer<typeof SafaraCoverageEntrySchema> {
  const id = fact.demand_fact_id;
  const manualProvenance = {
    kind: fact.provenance.kind, source_sha256: fact.provenance.source_sha256,
    inventory_sha256: fact.provenance.inventory_sha256, page: fact.provenance.page,
    exact_text: fact.provenance.exact_text,
    extraction_method: fact.provenance.extraction_method,
  } as const;
  if (v3SequentialAwareness.has(id)) {
    const sourceLineage = resolveSequentialFlowPolicySourceLineage()
      .flatMap(({ canonical_support, source_lineage }) => source_lineage.map(({ raw_concept }) => ({
        canonical_concept_id: canonical_support.canonical_concept_id,
        raw_concept_id: raw_concept.concept_id, source_release_id: raw_concept.source_release_id,
        source_locator: raw_concept.source_locator.locator,
      })));
    return { demand_fact_id: id, manual_provenance: manualProvenance,
      disposition: "AWARENESS_EMITTED",
      rationale: "The fact activates candidate sequential business-flow awareness; the accepted add decision does not make the candidate Policy authoritative.",
      policy_support: [{ policy_id: "policy.sequential-business-flow", policy_revision: "1.0.0",
        support_status: "candidate_only", canonical_concept_ids: ["ces.sequential-business-flow"],
        source_lineage: sourceLineage }], gap_route: null, raw_support_ids: [],
      source_support_candidates: [] };
  }
  const canonicalSupport = v3PolicyGaps.get(id);
  if (canonicalSupport) return { demand_fact_id: id, manual_provenance: manualProvenance,
    disposition: "SOURCE_OR_POLICY_GAP",
    rationale: `Approved canonical support ${canonicalSupport.join(", ")} exists, but candidate taxonomy revision 1.1.0 has no Policy representing it.`,
    policy_support: [], gap_route: "POLICY_GAP",
    raw_support_ids: id === factId(27) ? ["raw.asvs.v14-2-6"] : ["raw.asvs.v14-1-1"],
    source_support_candidates: [] };
  return classify(fact);
}

function classifyV2(fact: QualificationPolicyDemandFact): z.infer<typeof SafaraCoverageEntrySchema> {
  const id = fact.demand_fact_id;
  const manual_provenance = {
    kind: fact.provenance.kind, source_sha256: fact.provenance.source_sha256,
    inventory_sha256: fact.provenance.inventory_sha256, page: fact.provenance.page,
    exact_text: fact.provenance.exact_text,
    extraction_method: fact.provenance.extraction_method,
  } as const;
  const canonicalSupport = v2PolicyGaps.get(id);
  if (canonicalSupport) return { demand_fact_id: id, manual_provenance,
    disposition: "SOURCE_OR_POLICY_GAP",
    rationale: `Approved canonical support ${canonicalSupport.join(", ")} exists, but no candidate Policy represents it.`,
    policy_support: [], gap_route: "POLICY_GAP", raw_support_ids: ["raw.asvs.v2-3-1"],
    source_support_candidates: [] };
  const rawSupport = v2CanonicalizationGaps.get(id);
  if (rawSupport) return { demand_fact_id: id, manual_provenance,
    disposition: "SOURCE_OR_POLICY_GAP",
    rationale: "Accepted raw data-protection knowledge exists, but no approved canonical concept represents it.",
    policy_support: [], gap_route: "CANONICALIZATION_GAP", raw_support_ids: [...rawSupport],
    source_support_candidates: [] };
  return classify(fact);
}

function classify(fact: QualificationPolicyDemandFact): z.infer<typeof SafaraCoverageEntrySchema> {
  const id = fact.demand_fact_id;
  const manual_provenance = {
    kind: fact.provenance.kind,
    source_sha256: fact.provenance.source_sha256,
    inventory_sha256: fact.provenance.inventory_sha256,
    page: fact.provenance.page,
    exact_text: fact.provenance.exact_text,
    extraction_method: fact.provenance.extraction_method,
  } as const;
  const rawSupport = canonicalizationGaps.get(id);
  if (rawSupport) return { demand_fact_id: id, manual_provenance,
    disposition: "SOURCE_OR_POLICY_GAP",
    rationale: id === factId(16)
      ? "The raw corpus contains sequential business-flow knowledge but no approved canonical obligation represents it."
      : "The raw corpus contains relevant knowledge but no approved canonical obligation represents it.",
    policy_support: [], gap_route: "CANONICALIZATION_GAP", raw_support_ids: [...rawSupport],
    source_support_candidates: [] };
  const sourceCandidates = extractionGaps.get(id);
  if (sourceCandidates) return { demand_fact_id: id, manual_provenance,
    disposition: "SOURCE_OR_POLICY_GAP",
    rationale: "The governed ASVS release contains closer source knowledge, but the representative POL-006 raw corpus did not extract it.",
    policy_support: [], gap_route: "EXTRACTION_GAP", raw_support_ids: [],
    source_support_candidates: [...sourceCandidates] };
  if (outsideScope.has(id)) return { demand_fact_id: id, manual_provenance,
    disposition: "OUTSIDE_SOFTWARE_SCOPE",
    rationale: "This delivery or organizational handover commitment is accounted for but does not create software-side CES Policy awareness.",
    policy_support: [], gap_route: null, raw_support_ids: [], source_support_candidates: [] };
  if (accessIds.has(id)) return awareness(id, "access",
    "The fact activates candidate authorization awareness; candidate support is not authoritative coverage.", manual_provenance);
  if (traceIds.has(id)) return awareness(id, "trace",
    "The fact activates candidate security-event traceability awareness; candidate support is not authoritative coverage.", manual_provenance);
  if (transactionIds.has(id)) return awareness(id, "transaction",
    "The fact activates candidate transaction-integrity awareness; candidate support is not authoritative coverage.", manual_provenance);
  if (noAwarenessIds.has(id)) return { demand_fact_id: id, manual_provenance,
    disposition: "NO_SECURITY_AWARENESS_REQUIRED",
    rationale: "The fact remains project truth or a functional detail and does not independently require software-security awareness in the current governed knowledge scope.",
    policy_support: [], gap_route: null, raw_support_ids: [], source_support_candidates: [] };
  throw new Error(`Safara demand fact has no explicit classification: ${id}`);
}

function awareness(id: string, kind: keyof typeof policyDefinitions, rationale: string,
  manualProvenance: z.infer<typeof SafaraCoverageEntrySchema>["manual_provenance"]) {
  const definition = policyDefinitions[kind];
  const sourceLineage = resolvePolicySourceLineage(definition.policy_id)
    .flatMap(({ canonical_support, source_lineage }) => source_lineage.map(({ raw_concept }) => ({
      canonical_concept_id: canonical_support.canonical_concept_id,
      raw_concept_id: raw_concept.concept_id,
      source_release_id: raw_concept.source_release_id,
      source_locator: raw_concept.source_locator.locator,
    })));
  return { demand_fact_id: id, manual_provenance: manualProvenance,
    disposition: "AWARENESS_EMITTED" as const, rationale,
    policy_support: [{ policy_id: definition.policy_id, policy_revision: "1.0.0",
      support_status: "candidate_only" as const,
      canonical_concept_ids: [definition.canonical], source_lineage: sourceLineage }],
    gap_route: null, raw_support_ids: [], source_support_candidates: [] };
}

interface SourceCandidate {
  readonly source_release_id: "owasp.asvs.5-0-0";
  readonly source_locator: string;
  readonly bounded_relevance: string;
}

function asvsCandidate(sourceLocator: string, boundedRelevance: string): SourceCandidate {
  return { source_release_id: "owasp.asvs.5-0-0", source_locator: sourceLocator,
    bounded_relevance: boundedRelevance };
}

function assertExplicitClassificationPartition(inputIds: readonly string[]): void {
  const sets = [accessIds, traceIds, transactionIds, canonicalizationGaps,
    extractionGaps, outsideScope, noAwarenessIds];
  const assigned = new Map<string, number>();
  for (const values of sets) {
    for (const id of values.keys()) assigned.set(id, (assigned.get(id) ?? 0) + 1);
  }
  const accepted = new Set(inputIds);
  const duplicates = [...assigned].filter(([, count]) => count !== 1).map(([id]) => id);
  const missing = [...accepted].filter((id) => !assigned.has(id));
  const unknown = [...assigned.keys()].filter((id) => !accepted.has(id));
  if (duplicates.length || missing.length || unknown.length || assigned.size !== 111) {
    throw new Error(`Invalid explicit Safara classification partition: duplicates=${duplicates.join(",")}; missing=${missing.join(",")}; unknown=${unknown.join(",")}`);
  }
}

function assertExplicitClassificationPartitionV2(inputIds: readonly string[]): void {
  const sets = [accessIds, traceIds, transactionIds, v2PolicyGaps,
    v2CanonicalizationGaps, outsideScope, noAwarenessIds];
  const assigned = new Map<string, number>();
  for (const values of sets) {
    for (const id of values.keys()) assigned.set(id, (assigned.get(id) ?? 0) + 1);
  }
  const accepted = new Set(inputIds);
  const duplicates = [...assigned].filter(([, count]) => count !== 1).map(([id]) => id);
  const missing = [...accepted].filter((id) => !assigned.has(id));
  const unknown = [...assigned.keys()].filter((id) => !accepted.has(id));
  if (duplicates.length || missing.length || unknown.length || assigned.size !== 111) {
    throw new Error(`Invalid explicit Safara v2 classification partition: duplicates=${duplicates.join(",")}; missing=${missing.join(",")}; unknown=${unknown.join(",")}`);
  }
}

function assertExplicitClassificationPartitionV3(inputIds: readonly string[]): void {
  const sets = [accessIds, traceIds, transactionIds, v3SequentialAwareness,
    v3PolicyGaps, outsideScope, noAwarenessIds];
  const assigned = new Map<string, number>();
  for (const values of sets) {
    for (const id of values.keys()) assigned.set(id, (assigned.get(id) ?? 0) + 1);
  }
  const accepted = new Set(inputIds);
  const duplicates = [...assigned].filter(([, count]) => count !== 1).map(([id]) => id);
  const missing = [...accepted].filter((id) => !assigned.has(id));
  const unknown = [...assigned.keys()].filter((id) => !accepted.has(id));
  if (duplicates.length || missing.length || unknown.length || assigned.size !== 111) {
    throw new Error(`Invalid explicit Safara v3 classification partition: duplicates=${duplicates.join(",")}; missing=${missing.join(",")}; unknown=${unknown.join(",")}`);
  }
}

function assertExplicitClassificationPartitionV4(inputIds: readonly string[]): void {
  const sets = [accessIds, traceIds, transactionIds, v3SequentialAwareness,
    v4DataProtectionAwareness, outsideScope, noAwarenessIds];
  const assigned = new Map<string, number>();
  for (const values of sets) {
    for (const id of values.keys()) assigned.set(id, (assigned.get(id) ?? 0) + 1);
  }
  const accepted = new Set(inputIds);
  const duplicates = [...assigned].filter(([, count]) => count !== 1).map(([id]) => id);
  const missing = [...accepted].filter((id) => !assigned.has(id));
  const unknown = [...assigned.keys()].filter((id) => !accepted.has(id));
  if (duplicates.length || missing.length || unknown.length || assigned.size !== 111) {
    throw new Error(`Invalid explicit Safara v4 classification partition: duplicates=${duplicates.join(",")}; missing=${missing.join(",")}; unknown=${unknown.join(",")}`);
  }
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


function assertPinnedKnowledgeV2(): void {
  if (CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.publication_status !== "accepted" ||
      CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.corpus.corpus_id !==
      "ces-policies.raw-vocabulary.representative-v1-2" ||
      CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3.vocabulary_revision !==
      "1.3.0" ||
      CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3.vocabulary_status !==
      "approved" ||
      CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.taxonomy_revision !== "1.0.0" ||
      CES_POLICY_REPRESENTATIVE_TAXONOMY_V1.lifecycle !== "candidate") {
    throw new Error("Safara bootstrap v2 knowledge inputs do not match the pinned revisions");
  }
}


function assertPinnedKnowledgeV3(): void {
  if (CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.publication_status !== "accepted" ||
      CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.vocabulary_revision !==
      "1.5.0" ||
      CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.vocabulary_status !==
      "approved" ||
      CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.publication_status !== "accepted" ||
      CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy.taxonomy_revision !==
      "1.1.0" ||
      CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.approval.final_pol_008_approval !== false) {
    throw new Error("Safara bootstrap v3 knowledge inputs do not match the pinned revisions");
  }
}

function assertPinnedKnowledgeV4(): void {
  if (CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.publication_status !== "accepted" ||
      CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.vocabulary_revision !==
      "1.5.0" ||
      CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1.publication_status !== "accepted" ||
      CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1.artifact.taxonomy.taxonomy_revision !==
      "1.2.0" ||
      CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1.approval.evidence_type !==
      "project_owner_confirmation" ||
      CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1.approval.final_pol_008_approval !== false) {
    throw new Error("Safara bootstrap v4 knowledge inputs do not match the pinned revisions");
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
