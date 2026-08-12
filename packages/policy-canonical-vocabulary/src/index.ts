import { z } from "zod";

export const CANONICAL_VOCABULARY_SCHEMA_VERSION = "1.0.0" as const;

const IdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const RevisionSchema = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const NonEmptyStringSchema = z.string().trim().min(1);

export const CanonicalSemanticKindSchema = z.enum([
  "obligation",
  "concern",
  "verification_context",
  "evidence_expectation",
]);

export const CanonicalLifecycleSchema = z.enum(["candidate", "approved", "retired"]);
export const MappingRelationshipSchema = z.enum([
  "supports",
  "partial_support",
  "verifies",
  "expresses_concern",
]);
export const VocabularyDecisionKindSchema = z.enum(["merge", "split", "alias", "retirement"]);

export const CanonicalConceptSchema = z.object({
  concept_id: IdSchema,
  meaning_version: RevisionSchema,
  preferred_term: NonEmptyStringSchema,
  definition: NonEmptyStringSchema,
  semantic_kind: CanonicalSemanticKindSchema,
  lifecycle: CanonicalLifecycleSchema,
  aliases: z.array(NonEmptyStringSchema),
}).strict();

export const RawConceptMappingSchema = z.object({
  canonical_concept_id: IdSchema,
  raw_concept_id: IdSchema,
  raw_source_release_id: IdSchema,
  relationship: MappingRelationshipSchema,
  rationale: NonEmptyStringSchema,
}).strict();

export interface RawConceptIdentity {
  readonly raw_source_release_id: string;
  readonly raw_concept_id: string;
}

export function rawConceptIdentityKey(identity: RawConceptIdentity): string {
  return JSON.stringify([identity.raw_source_release_id, identity.raw_concept_id]);
}

export const VocabularyDecisionSchema = z.object({
  decision_id: IdSchema,
  decision_kind: VocabularyDecisionKindSchema,
  status: z.enum(["proposed", "approved", "rejected"]),
  affected_canonical_concept_ids: z.array(IdSchema).min(1),
  affected_raw_concept_ids: z.array(IdSchema),
  rationale: NonEmptyStringSchema,
  proposed_at: z.iso.datetime({ offset: true }),
  reviewed_at: z.iso.datetime({ offset: true }).nullable(),
  reviewer_evidence_id: NonEmptyStringSchema.nullable(),
}).strict().superRefine((decision, context) => {
  const hasReviewEvidence = decision.reviewed_at !== null &&
    decision.reviewer_evidence_id !== null;
  if (decision.status === "proposed" &&
      (decision.reviewed_at !== null || decision.reviewer_evidence_id !== null)) {
    context.addIssue({ code: "custom", message: "Proposed decisions cannot claim review evidence" });
  }
  if (decision.status !== "proposed" && !hasReviewEvidence) {
    context.addIssue({ code: "custom", message: "Reviewed decisions require review evidence" });
  }
});

export const CanonicalVocabularySchema = z.object({
  schema_version: z.literal(CANONICAL_VOCABULARY_SCHEMA_VERSION),
  vocabulary_id: IdSchema,
  vocabulary_revision: RevisionSchema,
  predecessor_revision: RevisionSchema.nullable(),
  vocabulary_status: z.enum(["candidate", "approved", "retired"]),
  concepts: z.array(CanonicalConceptSchema).min(1),
  mappings: z.array(RawConceptMappingSchema).min(1),
  decisions: z.array(VocabularyDecisionSchema),
}).strict().superRefine((vocabulary, context) => {
  const conceptIds = new Set(vocabulary.concepts.map(({ concept_id }) => concept_id));
  if (conceptIds.size !== vocabulary.concepts.length) {
    context.addIssue({ code: "custom", message: "Canonical concept IDs must be unique" });
  }
  const mappingKeys = new Set<string>();
  for (const mapping of vocabulary.mappings) {
    if (!conceptIds.has(mapping.canonical_concept_id)) {
      context.addIssue({ code: "custom",
        message: `Mapping references unknown canonical concept ${mapping.canonical_concept_id}` });
    }
    const key = JSON.stringify([mapping.canonical_concept_id,
      mapping.raw_source_release_id, mapping.raw_concept_id]);
    if (mappingKeys.has(key)) {
      context.addIssue({ code: "custom", message: `Duplicate canonical/raw mapping ${key}` });
    }
    mappingKeys.add(key);
  }
  for (const concept of vocabulary.concepts) {
    if (!vocabulary.mappings.some(({ canonical_concept_id }) =>
      canonical_concept_id === concept.concept_id)) {
      context.addIssue({ code: "custom",
        message: `Canonical concept ${concept.concept_id} requires raw-source support` });
    }
  }
  for (const decision of vocabulary.decisions) {
    if (decision.affected_canonical_concept_ids.some((id) => !conceptIds.has(id))) {
      context.addIssue({ code: "custom",
        message: `Decision ${decision.decision_id} references an unknown canonical concept` });
    }
  }
});

export function validateCanonicalVocabularyAgainstRawConcepts(
  vocabularyValue: unknown,
  rawConcepts: ReadonlyArray<{ concept_id: string; source_release_id: string }>,
) {
  const vocabulary = CanonicalVocabularySchema.parse(vocabularyValue);
  const rawById = new Map(rawConcepts.map((concept) => [rawConceptIdentityKey({
    raw_source_release_id: concept.source_release_id,
    raw_concept_id: concept.concept_id,
  }), concept]));
  for (const mapping of vocabulary.mappings) {
    const raw = rawById.get(rawConceptIdentityKey(mapping));
    if (!raw) {
      throw new Error(`Mapping references missing or mismatched raw concept ${mapping.raw_concept_id}`);
    }
  }
  return vocabulary;
}

function mappingFingerprint(vocabulary: CanonicalVocabulary): string {
  return JSON.stringify(vocabulary.mappings.map((mapping) => ({
    canonical_concept_id: mapping.canonical_concept_id,
    raw_source_release_id: mapping.raw_source_release_id,
    raw_concept_id: mapping.raw_concept_id,
    relationship: mapping.relationship,
    rationale: mapping.rationale,
  })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))));
}

function lifecycleFingerprint(vocabulary: CanonicalVocabulary): string {
  return JSON.stringify(vocabulary.concepts.map(({ concept_id, lifecycle }) =>
    ({ concept_id, lifecycle })).sort((left, right) =>
    left.concept_id.localeCompare(right.concept_id)));
}

export function validateCanonicalVocabularySuccessor(
  predecessorValue: unknown,
  successorValue: unknown,
) {
  const predecessor = CanonicalVocabularySchema.parse(predecessorValue);
  const successor = CanonicalVocabularySchema.parse(successorValue);
  if (successor.vocabulary_id !== predecessor.vocabulary_id) {
    throw new Error("Canonical vocabulary successor must preserve vocabulary identity");
  }
  if (successor.vocabulary_revision === predecessor.vocabulary_revision) {
    throw new Error("Canonical vocabulary successor revision must be distinct");
  }
  if (successor.predecessor_revision !== predecessor.vocabulary_revision) {
    throw new Error("Canonical vocabulary successor must link to the exact predecessor revision");
  }
  const mappingChanged = mappingFingerprint(predecessor) !== mappingFingerprint(successor);
  const lifecycleChanged = lifecycleFingerprint(predecessor) !== lifecycleFingerprint(successor);
  if (predecessor.vocabulary_status === "approved" && !mappingChanged && !lifecycleChanged) {
    throw new Error("Approved vocabulary successor must record a mapping or lifecycle change");
  }
  return { predecessor, successor, mapping_changed: mappingChanged,
    lifecycle_changed: lifecycleChanged } as const;
}

export type CanonicalSemanticKind = z.infer<typeof CanonicalSemanticKindSchema>;
export type CanonicalConcept = z.infer<typeof CanonicalConceptSchema>;
export type RawConceptMapping = z.infer<typeof RawConceptMappingSchema>;
export type VocabularyDecision = z.infer<typeof VocabularyDecisionSchema>;
export type CanonicalVocabulary = z.infer<typeof CanonicalVocabularySchema>;
