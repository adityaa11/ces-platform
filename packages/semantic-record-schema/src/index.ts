import { createHash } from "node:crypto";
import { z } from "zod";

export const SEMANTIC_RECORD_SCHEMA_VERSION = "1.0.0" as const;
export const MULTILINGUAL_CONTRACT_SCHEMA_VERSION = "1.1.0" as const;
export const SEMANTIC_KIND_REGISTRY_SCHEMA_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);
const Semver = z.string().regex(/^\d+\.\d+\.\d+$/u);

export const LanguageDetectionSchema = z.object({
  detected_language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$|^und$/u),
  language_detection_method: z.enum(["deterministic", "provider", "human"]),
  language_confidence: z.number().min(0).max(1),
}).strict();

export const MultilingualStatementSchema = z.object({
  original_statement: Text,
  original_language: LanguageDetectionSchema,
  canonical_statement: Text,
  canonical_language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$|^und$/u),
  display_language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$|^und$/u),
  translation_status: z.enum(["original", "proposed", "review_required", "approved"]),
  translation_source_unit_ids: z.array(Id).max(0),
}).strict();

export const TranslationEquivalenceProposalSchema = z.object({
  proposal_id: Id,
  equivalence_cluster_id: Id,
  from_record_id: Id,
  to_record_id: Id,
  status: z.literal("possible_equivalence"),
  confidence: z.number().min(0).max(1),
  rationale: Text,
  source_unit_ids: z.array(Id),
  review_status: z.literal("pending"),
}).strict();

export const SourceRepresentationSchema = z.object({
  representation_id: Id,
  exact_original_text: Text,
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$|^und$/u),
  source_unit_ids: z.array(Id).min(1),
  reviewer_selected_primary: z.boolean(),
  primary_source_language: z.boolean(),
}).strict();

export const DisplayLabelSelectionSchema = z.object({
  display_label: Text,
  display_language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$|^und$/u),
  display_label_source: z.enum([
    "original_representation",
    "approved_terminology",
    "canonical_interpretation",
    "review_placeholder",
  ]),
  display_representation_id: Id.optional(),
  fallback_used: z.boolean(),
  selection_reason: z.enum([
    "configured_display_language",
    "reviewer_selected_primary",
    "primary_source_language",
    "approved_terminology",
    "configured_canonical_language",
    "insufficient_safe_label",
  ]),
}).strict();

export const TerminologyProposalSchema = z.object({
  proposal_id: Id,
  source_terms: z.array(z.object({
    language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$|^und$/u),
    value: Text,
  }).strict()).min(1),
  canonical_concept: Id,
  source_unit_ids: z.array(Id).min(1),
  status: z.literal("pending"),
}).strict();

export const TerminologyDecisionSchema = z.object({
  decision_id: Id,
  proposal_id: Id,
  decision: z.enum(["approve", "reject", "correct"]),
  decided_by: Id,
  decided_at: z.string().datetime({ offset: true }),
  decision_revision: Id,
}).strict();

export const ApprovedTerminologyRegistrySchema = z.object({
  schema_version: Semver,
  registry_id: Id,
  registry_version: Semver,
  entries: z.array(z.object({
    term_id: Id,
    canonical_concept: Id,
    approved_terms: z.array(z.object({
      language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$|^und$/u),
      value: Text,
    }).strict()).min(1),
    approved_by: Id,
    decision_id: Id,
  }).strict()),
  content_hash: Hash,
}).strict();

export function detectLanguage(value: string): z.infer<typeof LanguageDetectionSchema> {
  const text = Text.parse(value).toLocaleLowerCase("en-US");
  const indonesian = (text.match(/\b(?:yang|dan|atau|harus|dapat|dengan|untuk|dari|pada)\b/gu)
    ?? []).length;
  const english = (text.match(/\b(?:the|and|or|must|may|with|for|from|on)\b/gu) ?? []).length;
  const detected = indonesian === english ? "und" : indonesian > english ? "id" : "en";
  const signals = indonesian + english;
  return LanguageDetectionSchema.parse({
    detected_language: detected,
    language_detection_method: "deterministic",
    language_confidence: signals === 0 ? 0.25 : Math.min(0.99, 0.5 + Math.abs(indonesian - english)
      / Math.max(2, signals * 2)),
  });
}

export function createMultilingualStatement(input: {
  readonly original_statement: string;
  readonly original_language?: z.input<typeof LanguageDetectionSchema>;
  readonly canonical_statement?: string;
  readonly canonical_language?: string;
  readonly display_language?: string;
  readonly translation_status?: "original" | "proposed" | "review_required" | "approved";
}): z.infer<typeof MultilingualStatementSchema> {
  const originalLanguage = input.original_language
    ? LanguageDetectionSchema.parse(input.original_language)
    : detectLanguage(input.original_statement);
  const canonicalStatement = input.canonical_statement ?? input.original_statement;
  const canonicalLanguage = input.canonical_language ?? originalLanguage.detected_language;
  const translated = canonicalStatement !== input.original_statement
    || canonicalLanguage !== originalLanguage.detected_language;
  return MultilingualStatementSchema.parse({
    original_statement: input.original_statement,
    original_language: originalLanguage,
    canonical_statement: canonicalStatement,
    canonical_language: canonicalLanguage,
    display_language: input.display_language ?? canonicalLanguage,
    translation_status: input.translation_status
      ?? (translated || originalLanguage.language_confidence < 0.5
        ? "review_required" : "original"),
    translation_source_unit_ids: [],
  });
}

export function createTranslationEquivalenceProposal(input: {
  readonly equivalence_cluster_id?: string;
  readonly from_record_id: string;
  readonly to_record_id: string;
  readonly confidence: number;
  readonly rationale: string;
  readonly source_unit_ids?: readonly string[];
}): z.infer<typeof TranslationEquivalenceProposalSchema> {
  const core = {
    from_record_id: Id.parse(input.from_record_id),
    to_record_id: Id.parse(input.to_record_id),
    confidence: z.number().min(0).max(1).parse(input.confidence),
    rationale: Text.parse(input.rationale),
    source_unit_ids: [...new Set(input.source_unit_ids ?? [])].map((id) => Id.parse(id)).sort(compare),
  };
  if (core.from_record_id === core.to_record_id) {
    throw new Error("Translation equivalence requires distinct proposal records");
  }
  return TranslationEquivalenceProposalSchema.parse({
    proposal_id: `translation.proposal.${hashJson(core).slice(7, 23)}`,
    equivalence_cluster_id: input.equivalence_cluster_id
      ? Id.parse(input.equivalence_cluster_id)
      : `translation.cluster.${hashJson([
        core.from_record_id,
        core.to_record_id,
      ].sort(compare)).slice(7, 23)}`,
    ...core,
    status: "possible_equivalence",
    review_status: "pending",
  });
}

export function selectDisplayLabel(input: {
  readonly display_language: string;
  readonly canonical_language: string;
  readonly representations: readonly z.input<typeof SourceRepresentationSchema>[];
  readonly approved_terminology_label?: string;
  readonly approved_terminology_language?: string;
  readonly canonical_interpretation?: string;
  readonly review_placeholder?: string;
}): z.infer<typeof DisplayLabelSelectionSchema> {
  const displayLanguage = LanguageDetectionSchema.shape.detected_language.parse(
    input.display_language,
  );
  const canonicalLanguage = LanguageDetectionSchema.shape.detected_language.parse(
    input.canonical_language,
  );
  const representations = input.representations
    .map((representation) => SourceRepresentationSchema.parse(representation))
    .sort((left, right) => compare(left.representation_id, right.representation_id));
  const representationIds = representations.map(({ representation_id }) => representation_id);
  if (new Set(representationIds).size !== representationIds.length) {
    throw new Error("Duplicate source representation identity");
  }
  const chooseRepresentation = (
    predicate: (representation: z.infer<typeof SourceRepresentationSchema>) => boolean,
    selection_reason: "configured_display_language" | "reviewer_selected_primary"
      | "primary_source_language",
  ) => {
    const representation = representations.find(predicate);
    return representation
      ? DisplayLabelSelectionSchema.parse({
        display_label: representation.exact_original_text,
        display_language: representation.language,
        display_label_source: "original_representation",
        display_representation_id: representation.representation_id,
        fallback_used: selection_reason !== "configured_display_language",
        selection_reason,
      })
      : undefined;
  };
  const displayMatch = chooseRepresentation(
    (representation) => representation.language === displayLanguage,
    "configured_display_language",
  );
  if (displayMatch) return displayMatch;
  const reviewerSelected = chooseRepresentation(
    (representation) => representation.reviewer_selected_primary,
    "reviewer_selected_primary",
  );
  if (reviewerSelected) return reviewerSelected;
  const primarySource = chooseRepresentation(
    (representation) => representation.primary_source_language,
    "primary_source_language",
  );
  if (primarySource) return primarySource;
  if (input.approved_terminology_label && input.approved_terminology_language) {
    return DisplayLabelSelectionSchema.parse({
      display_label: input.approved_terminology_label,
      display_language: input.approved_terminology_language,
      display_label_source: "approved_terminology",
      fallback_used: true,
      selection_reason: "approved_terminology",
    });
  }
  if (input.canonical_interpretation) {
    return DisplayLabelSelectionSchema.parse({
      display_label: input.canonical_interpretation,
      display_language: canonicalLanguage,
      display_label_source: "canonical_interpretation",
      fallback_used: true,
      selection_reason: "configured_canonical_language",
    });
  }
  return DisplayLabelSelectionSchema.parse({
    display_label: input.review_placeholder ?? "Review required",
    display_language: displayLanguage,
    display_label_source: "review_placeholder",
    fallback_used: true,
    selection_reason: "insufficient_safe_label",
  });
}

export function createTerminologyProposal(input: {
  readonly source_terms: readonly { readonly language: string; readonly value: string }[];
  readonly canonical_concept: string;
  readonly source_unit_ids: readonly string[];
}): z.infer<typeof TerminologyProposalSchema> {
  const core = {
    source_terms: input.source_terms.map((term) => ({
      language: term.language,
      value: Text.parse(term.value),
    })).sort((left, right) => compare(`${left.language}:${left.value}`, `${right.language}:${right.value}`)),
    canonical_concept: Id.parse(input.canonical_concept),
    source_unit_ids: [...new Set(input.source_unit_ids)].map((id) => Id.parse(id)).sort(compare),
  };
  return TerminologyProposalSchema.parse({
    proposal_id: `term.proposal.${hashJson(core).slice(7, 23)}`,
    ...core,
    status: "pending",
  });
}

export const SemanticKindDefinitionSchema = z.object({
  id: Id,
  schema_version: Semver,
  registered_by: z.enum(["ces", "organization"]),
  description: Text,
  representation_kind: z.enum([
    "functional_requirement", "business_rule", "permission", "validation",
    "calculation", "state_model", "workflow", "data", "report",
    "acceptance_criterion", "deliverable", "nonfunctional_requirement",
    "extensible_record", "unknown",
  ]),
  representation_status: z.enum(["lossless", "structured_extension", "classification_required"]),
}).strict();

export const SemanticKindRegistrySchema = z.object({
  schema_version: z.literal(SEMANTIC_KIND_REGISTRY_SCHEMA_VERSION),
  id: Id,
  organization_id: Id.optional(),
  definitions: z.array(SemanticKindDefinitionSchema).min(1),
  content_hash: Hash,
}).strict();

export const SemanticKindResolutionSchema = z.object({
  registry_id: Id,
  requested_kind: Text,
  semantic_kind_id: Id,
  classification_status: z.enum(["classified", "classification_required"]),
}).strict();

const BUILT_IN_KIND_INPUTS = [
  ["capability", "A business capability.", "extensible_record", "structured_extension"],
  ["workflow", "A workflow or workflow step.", "workflow", "lossless"],
  ["business_rule", "An explicit business rule.", "business_rule", "lossless"],
  ["validation_constraint", "A validation constraint.", "validation", "lossless"],
  ["calculation", "A calculation or formula.", "calculation", "lossless"],
  ["role_permission", "A role permission or restriction.", "permission", "lossless"],
  ["state_definition", "A state definition.", "state_model", "lossless"],
  ["state_transition", "A state transition.", "state_model", "lossless"],
  ["lifecycle_rule", "A lifecycle or retention rule.", "extensible_record", "structured_extension"],
  ["uniqueness_constraint", "A uniqueness constraint.", "validation", "lossless"],
  ["reporting_requirement", "A reporting or export requirement.", "report", "lossless"],
  ["acceptance_criterion", "An acceptance criterion.", "acceptance_criterion", "lossless"],
  ["acceptance_scenario", "An acceptance scenario.", "acceptance_criterion", "lossless"],
  ["terminology", "Source-defined terminology.", "extensible_record", "structured_extension"],
  ["operational_procedure", "An operational procedure.", "workflow", "lossless"],
  ["security_sensitive_restriction", "A security-sensitive restriction.",
    "nonfunctional_requirement", "lossless"],
  ["unknown", "Normative meaning requiring classification.", "unknown",
    "classification_required"],
] as const;

export const BUILT_IN_SEMANTIC_KIND_DEFINITIONS = Object.freeze(
  BUILT_IN_KIND_INPUTS.map(([id, description, representation_kind, representation_status]) =>
    SemanticKindDefinitionSchema.parse({
      id: `ces.kind.${id.replaceAll("_", "-")}`,
      schema_version: "1.0.0",
      registered_by: "ces",
      description,
      representation_kind,
      representation_status,
    })),
);

export type SemanticKindDefinition = z.input<typeof SemanticKindDefinitionSchema>;
export type SemanticKindRegistry = z.infer<typeof SemanticKindRegistrySchema>;

export function createSemanticKindRegistry(input: {
  readonly organization_id?: string;
  readonly organization_definitions?: readonly SemanticKindDefinition[];
} = {}): SemanticKindRegistry {
  const organizationId = input.organization_id
    ? Id.parse(input.organization_id)
    : undefined;
  const extensions = (input.organization_definitions ?? [])
    .map((definition) => SemanticKindDefinitionSchema.parse(definition));
  if (extensions.length > 0 && !organizationId) {
    throw new Error("Organization semantic kinds require organization_id");
  }
  if (extensions.some(({ registered_by }) => registered_by !== "organization")) {
    throw new Error("Organization extensions must be registered_by organization");
  }
  const definitions = [...BUILT_IN_SEMANTIC_KIND_DEFINITIONS, ...extensions]
    .sort((left, right) => compare(left.id, right.id));
  assertUnique(definitions.map(({ id }) => id), "semantic kind");
  const core = {
    schema_version: SEMANTIC_KIND_REGISTRY_SCHEMA_VERSION,
    ...(organizationId ? { organization_id: organizationId } : {}),
    definitions,
  };
  const contentHash = hashJson(core);
  return deepFreeze(SemanticKindRegistrySchema.parse({
    ...core,
    id: `${organizationId ?? "ces"}.semantic-kinds.${contentHash.slice(7, 19)}`,
    content_hash: contentHash,
  }));
}

export function resolveSemanticKind(
  registryInput: SemanticKindRegistry,
  requestedKind: string,
): z.infer<typeof SemanticKindResolutionSchema> {
  const registry = SemanticKindRegistrySchema.parse(registryInput);
  const requested = Text.parse(requestedKind);
  const definition = registry.definitions.find(({ id }) => id === requested);
  const unknown = registry.definitions.find(({ id }) => id === "ces.kind.unknown");
  if (!unknown) throw new Error("Semantic kind registry requires unknown fallback");
  return SemanticKindResolutionSchema.parse({
    registry_id: registry.id,
    requested_kind: requested,
    semantic_kind_id: definition?.id ?? unknown.id,
    classification_status: definition ? "classified" : "classification_required",
  });
}

const Common = {
  schema_version: z.literal(SEMANTIC_RECORD_SCHEMA_VERSION),
  id: Id,
  project_id: Id,
  source_revision_id: Id,
  lexicon_revision_id: Id,
  title: Text,
  statement: Text,
  source_unit_ids: z.array(Id).min(1),
  concept_ids: z.array(Id),
  origin: z.enum(["explicit", "inferred"]),
  inference_rationale: Text.optional(),
  review_state: z.literal("candidate"),
} as const;

const commonRecord = <T extends z.ZodRawShape>(kind: string, shape: T) =>
  z.object({ ...Common, kind: z.literal(kind), ...shape }).strict();

export const FunctionalRequirementSchema = commonRecord("functional_requirement", {
  actor_concept_id: Id.optional(), action: Text, resource_concept_id: Id.optional(),
  preconditions: z.array(Text).default([]), outcomes: z.array(Text).min(1),
});
export const BusinessRuleSchema = commonRecord("business_rule", {
  condition: Text.optional(), constraint: Text, consequence: Text.optional(),
});
export const PermissionSchema = commonRecord("permission", {
  actor_concept_id: Id, action: Text, resource_concept_id: Id,
  effect: z.enum(["allow", "deny"]), condition: Text.optional(),
});
export const ValidationSchema = commonRecord("validation", {
  subject_concept_id: Id, predicate: Text, failure_behavior: Text,
});
export const CalculationSchema = commonRecord("calculation", {
  output_concept_id: Id, formula: Text, input_concept_ids: z.array(Id).min(1),
});
export const StateModelSchema = commonRecord("state_model", {
  subject_concept_id: Id, states: z.array(Text).min(2),
  transitions: z.array(z.object({ from: Text, to: Text, trigger: Text }).strict()),
});
export const WorkflowSchema = commonRecord("workflow", {
  steps: z.array(z.object({ order: z.number().int().positive(), action: Text,
    actor_concept_id: Id.optional() }).strict()).min(2),
});
export const DataSchema = commonRecord("data", {
  subject_concept_id: Id, fields: z.array(z.object({
    concept_id: Id.optional(), name: Text, required: z.boolean(),
  }).strict()).min(1), confidentiality: Text.optional(),
});
export const ReportSchema = commonRecord("report", {
  report_concept_id: Id.optional(), fields: z.array(Text).min(1),
  filters: z.array(Text).default([]), formats: z.array(Text).default([]),
});
export const AcceptanceCriterionSchema = commonRecord("acceptance_criterion", {
  scenario: Text, expected_result: Text,
});
export const DeliverableSchema = commonRecord("deliverable", {
  deliverable: Text, acceptance_condition: Text.optional(),
});
export const NonfunctionalRequirementSchema = commonRecord("nonfunctional_requirement", {
  quality_attribute: Text, constraint: Text, measure: Text.optional(),
});

export const SemanticRecordSchema = z.discriminatedUnion("kind", [
  FunctionalRequirementSchema, BusinessRuleSchema, PermissionSchema, ValidationSchema,
  CalculationSchema, StateModelSchema, WorkflowSchema, DataSchema, ReportSchema,
  AcceptanceCriterionSchema, DeliverableSchema, NonfunctionalRequirementSchema,
]).superRefine((value, context) => {
  if (value.origin === "inferred" && !value.inference_rationale) {
    context.addIssue({ code: "custom", message: "Inferred records require rationale" });
  }
  if (value.origin === "explicit" && value.inference_rationale) {
    context.addIssue({ code: "custom", message: "Explicit records cannot claim inference rationale" });
  }
});

export const SemanticRelationshipSchema = z.object({
  id: Id,
  from_record_id: Id,
  to_record_id: Id,
  kind: z.enum([
    "depends_on", "refines", "conflicts_with", "duplicates", "verifies",
    "produces", "governs", "precedes",
  ]),
  source_unit_ids: z.array(Id).min(1),
}).strict();

export const SemanticConflictSchema = z.object({
  id: Id,
  record_ids: z.array(Id).min(2),
  description: Text,
  blocking: z.boolean(),
}).strict();

export const SemanticUncertaintySchema = z.object({
  id: Id,
  record_id: Id,
  question: Text,
  source_unit_ids: z.array(Id).min(1),
  blocking: z.boolean(),
}).strict();

export const SemanticCollectionSchema = z.object({
  schema_version: z.literal(SEMANTIC_RECORD_SCHEMA_VERSION),
  id: Id,
  project_id: Id,
  source_revision_id: Id,
  lexicon_revision_id: Id,
  records: z.array(SemanticRecordSchema),
  relationships: z.array(SemanticRelationshipSchema),
  conflicts: z.array(SemanticConflictSchema),
  uncertainties: z.array(SemanticUncertaintySchema),
  content_hash: Hash,
}).strict();

export const CompatibilityProjectionSchema = z.object({
  semantic_record_id: Id,
  classification: z.enum(["lossless", "lossy", "projection_gap"]),
  legacy_kind: z.enum(["requirement", "business_rule"]).optional(),
  reason: Text.optional(),
}).strict().superRefine((value, context) => {
  if (value.classification === "lossless" && !value.legacy_kind) {
    context.addIssue({ code: "custom", message: "Lossless projection requires legacy_kind" });
  }
  if (value.classification !== "lossless" && !value.reason) {
    context.addIssue({ code: "custom", message: "Lossy and gap projections require a reason" });
  }
});

export type SemanticRecord = z.input<typeof SemanticRecordSchema>;
export type SemanticRelationship = z.input<typeof SemanticRelationshipSchema>;
export type SemanticCollection = z.infer<typeof SemanticCollectionSchema>;

export function createSemanticCollection(input: {
  readonly project_id: string;
  readonly source_revision_id: string;
  readonly lexicon_revision_id: string;
  readonly source_unit_ids: readonly string[];
  readonly concept_ids: readonly string[];
  readonly records: readonly SemanticRecord[];
  readonly relationships?: readonly SemanticRelationship[];
  readonly conflicts?: readonly z.input<typeof SemanticConflictSchema>[];
  readonly uncertainties?: readonly z.input<typeof SemanticUncertaintySchema>[];
}): SemanticCollection {
  const projectId = Id.parse(input.project_id);
  const sourceRevisionId = Id.parse(input.source_revision_id);
  const lexiconRevisionId = Id.parse(input.lexicon_revision_id);
  const sourceIds = new Set(input.source_unit_ids.map((id) => Id.parse(id)));
  const conceptIds = new Set(input.concept_ids.map((id) => Id.parse(id)));
  const records = input.records.map((record) => SemanticRecordSchema.parse(record))
    .sort((a, b) => compare(a.id, b.id));
  assertUnique(records.map(({ id }) => id), "semantic record");
  for (const record of records) {
    if (record.project_id !== projectId
      || record.source_revision_id !== sourceRevisionId
      || record.lexicon_revision_id !== lexiconRevisionId) {
      throw new Error(`Revision tuple mismatch: ${record.id}`);
    }
    assertMembers(record.source_unit_ids, sourceIds, "source unit", record.id);
    assertMembers(allConceptReferences(record), conceptIds, "concept", record.id);
  }
  const recordIds = new Set(records.map(({ id }) => id));
  const relationships = (input.relationships ?? [])
    .map((value) => SemanticRelationshipSchema.parse(value))
    .sort((a, b) => compare(a.id, b.id));
  assertUnique(relationships.map(({ id }) => id), "relationship");
  for (const relationship of relationships) {
    assertMembers([relationship.from_record_id, relationship.to_record_id],
      recordIds, "record", relationship.id);
    assertMembers(relationship.source_unit_ids, sourceIds, "source unit", relationship.id);
    if (relationship.from_record_id === relationship.to_record_id) {
      throw new Error(`Self relationship: ${relationship.id}`);
    }
  }
  const conflicts = (input.conflicts ?? []).map((value) => SemanticConflictSchema.parse(value))
    .sort((a, b) => compare(a.id, b.id));
  const uncertainties = (input.uncertainties ?? [])
    .map((value) => SemanticUncertaintySchema.parse(value))
    .sort((a, b) => compare(a.id, b.id));
  for (const conflict of conflicts) assertMembers(conflict.record_ids, recordIds, "record", conflict.id);
  for (const uncertainty of uncertainties) {
    assertMembers([uncertainty.record_id], recordIds, "record", uncertainty.id);
    assertMembers(uncertainty.source_unit_ids, sourceIds, "source unit", uncertainty.id);
  }
  const core = {
    schema_version: SEMANTIC_RECORD_SCHEMA_VERSION,
    project_id: projectId,
    source_revision_id: sourceRevisionId,
    lexicon_revision_id: lexiconRevisionId,
    records, relationships, conflicts, uncertainties,
  };
  const contentHash = hashJson(core);
  return deepFreeze(SemanticCollectionSchema.parse({
    ...core,
    id: `${projectId}.semantics.${contentHash.slice(7, 19)}`,
    content_hash: contentHash,
  }));
}

export function classifyLegacyProjection(
  record: z.infer<typeof SemanticRecordSchema>,
): z.infer<typeof CompatibilityProjectionSchema> {
  const parsed = SemanticRecordSchema.parse(record);
  if (parsed.kind === "functional_requirement") {
    return { semantic_record_id: parsed.id, classification: "lossless", legacy_kind: "requirement" };
  }
  if (parsed.kind === "business_rule") {
    return { semantic_record_id: parsed.id, classification: "lossless", legacy_kind: "business_rule" };
  }
  if (["permission", "validation", "acceptance_criterion", "nonfunctional_requirement"]
    .includes(parsed.kind)) {
    return {
      semantic_record_id: parsed.id,
      classification: "lossy",
      legacy_kind: "requirement",
      reason: `Legacy requirement cannot preserve ${parsed.kind} structure`,
    };
  }
  return {
    semantic_record_id: parsed.id,
    classification: "projection_gap",
    reason: `No faithful legacy projection for ${parsed.kind}`,
  };
}

function allConceptReferences(record: z.infer<typeof SemanticRecordSchema>): string[] {
  const references = [...record.concept_ids];
  const add = (...values: (string | undefined)[]): void => {
    references.push(...values.filter((value): value is string => value !== undefined));
  };
  switch (record.kind) {
    case "functional_requirement": {
      const value = FunctionalRequirementSchema.parse(record);
      add(value.actor_concept_id, value.resource_concept_id); break;
    }
    case "permission": {
      const value = PermissionSchema.parse(record);
      add(value.actor_concept_id, value.resource_concept_id); break;
    }
    case "validation": add(ValidationSchema.parse(record).subject_concept_id); break;
    case "calculation": {
      const value = CalculationSchema.parse(record);
      add(value.output_concept_id, ...value.input_concept_ids); break;
    }
    case "state_model": add(StateModelSchema.parse(record).subject_concept_id); break;
    case "workflow": add(...WorkflowSchema.parse(record).steps
      .map(({ actor_concept_id }) => actor_concept_id)); break;
    case "data": {
      const value = DataSchema.parse(record);
      add(value.subject_concept_id, ...value.fields.map(({ concept_id }) => concept_id)); break;
    }
    case "report": add(ReportSchema.parse(record).report_concept_id); break;
    case "business_rule":
    case "acceptance_criterion":
    case "deliverable":
    case "nonfunctional_requirement": break;
  }
  return [...new Set(references)];
}

function assertMembers(values: readonly string[], allowed: ReadonlySet<string>,
  label: string, owner: string): void {
  const missing = values.filter((value) => !allowed.has(value));
  if (missing.length > 0) throw new Error(`Unknown ${label} on ${owner}: ${missing.join(", ")}`);
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} identity`);
}

function hashJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex")}`;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort()
      .map((key) => [key, canonical(record[key])]));
  }
  return value;
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
