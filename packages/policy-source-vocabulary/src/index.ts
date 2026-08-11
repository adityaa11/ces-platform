import { SourceGlossarySchema } from "@company/ces-policy-source-glossary";
import { z } from "zod";

export const POLICY_SOURCE_VOCABULARY_VERSION = "1.0.0" as const;

const IdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const NonEmptyStringSchema = z.string().trim().min(1);
const ExactNonEmptyStringSchema = z.string().min(1).refine((value) => value.trim().length > 0,
  { message: "Exact source text cannot be blank" });
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const RawSourceSemanticRoleSchema = z.enum([
  "objective",
  "control",
  "requirement",
  "risk_concern",
  "verification_context",
  "evidence_expectation",
]);

export const RawSourceScopeDispositionSchema = z.enum([
  "software_relevant",
  "out_of_scope_organizational",
  "review_required",
]);

export const RawSourceLocatorSchema = z.object({
  locator_type: z.enum([
    "clause",
    "control",
    "requirement",
    "test_scenario",
    "section",
    "page",
    "other",
  ]),
  locator: NonEmptyStringSchema,
  source_uri: z.url().optional(),
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/u),
}).strict();

export const RawSourceExtractionProvenanceSchema = z.object({
  extraction_method: z.enum(["manual", "structured_source", "agent_assisted"]),
  extracted_at: z.iso.datetime({ offset: true }),
  extractor_id: IdSchema,
  extraction_input: z.object({
    hash: Sha256Schema,
    hash_scope: NonEmptyStringSchema,
  }).strict(),
}).strict();

export const RawSourceConceptSchema = z.object({
  concept_id: IdSchema,
  source_release_id: IdSchema,
  source_locator: RawSourceLocatorSchema,
  source_term: ExactNonEmptyStringSchema,
  bounded_description: z.string().trim().min(1).max(2_000),
  semantic_role: RawSourceSemanticRoleSchema,
  scope_disposition: RawSourceScopeDispositionSchema,
  provenance: RawSourceExtractionProvenanceSchema,
  review_status: z.enum(["candidate", "accepted", "rejected"]),
}).strict();

export const RawSourceVocabularySchema = z.object({
  schema_version: z.literal(POLICY_SOURCE_VOCABULARY_VERSION),
  vocabulary_id: IdSchema,
  source_release_id: IdSchema,
  concepts: z.array(RawSourceConceptSchema),
}).strict().superRefine((vocabulary, context) => {
  const conceptIds = new Set(vocabulary.concepts.map(({ concept_id }) => concept_id));
  if (conceptIds.size !== vocabulary.concepts.length) {
    context.addIssue({ code: "custom", message: "Raw source concept IDs must be unique" });
  }
  for (const concept of vocabulary.concepts) {
    if (concept.source_release_id !== vocabulary.source_release_id) {
      context.addIssue({ code: "custom",
        message: `Raw concept ${concept.concept_id} belongs to another source release` });
    }
  }
});

export function validateRawSourceVocabulary(
  glossaryValue: unknown,
  vocabularyValue: unknown,
) {
  const glossary = SourceGlossarySchema.parse(glossaryValue);
  const vocabulary = RawSourceVocabularySchema.parse(vocabularyValue);
  if (!glossary.releases.some(({ release_id }) =>
    release_id === vocabulary.source_release_id)) {
    throw new Error(`Raw vocabulary references unknown release ${vocabulary.source_release_id}`);
  }
  return vocabulary;
}

export type RawSourceSemanticRole = z.infer<typeof RawSourceSemanticRoleSchema>;
export type RawSourceScopeDisposition = z.infer<typeof RawSourceScopeDispositionSchema>;
export type RawSourceLocator = z.infer<typeof RawSourceLocatorSchema>;
export type RawSourceExtractionProvenance = z.infer<typeof RawSourceExtractionProvenanceSchema>;
export type RawSourceConcept = z.infer<typeof RawSourceConceptSchema>;
export type RawSourceVocabulary = z.infer<typeof RawSourceVocabularySchema>;
