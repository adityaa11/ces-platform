import { createHash } from "node:crypto";
import { z } from "zod";

export const ATLAS_ROLE_CONTRACT_VERSION = "1.0.0" as const;
export const ATLAS_CANDIDATE_CONTRACT_VERSION = "1.0.0" as const;
export const ATLAS_SECTION_CLASSIFIER_CONTRACT_VERSION = "1.0.0" as const;
export const ATLAS_ROLE_IDS = [
  "atlas.structure-classifier",
  "atlas.domain-discovery",
  "atlas.section-extractor",
] as const;

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);

export const AtlasCandidateSchema = z.object({
  contract_version: z.literal(ATLAS_CANDIDATE_CONTRACT_VERSION),
  candidate_id: Id,
  statement: Text,
  provisional_kind: Text,
  source_unit_ids: z.array(Id).min(1),
  confidence: z.number().min(0).max(1),
  extraction_role: Id,
  classification_status: z.enum([
    "unclassified", "classified", "classification_required",
  ]),
  evidence_status: z.enum(["source_anchored", "support_review_required"]),
  payload_hash: Hash,
  provider_metadata: z.object({
    provider_id: Id,
    model_id: Text,
    contract_version: Text,
  }).strict(),
}).strict();

export const AtlasCandidateInventorySchema = z.object({
  contract_version: z.literal(ATLAS_CANDIDATE_CONTRACT_VERSION),
  source_revision_id: Id,
  lexicon_revision_id: Id,
  semantic_schema_version: Text,
  semantic_kind_registry_id: Id,
  semantic_kind_registry_hash: Hash,
  prompt_contract_version: Text,
  candidates: z.array(AtlasCandidateSchema),
  content_hash: Hash,
}).strict();

export const LegacyCandidateMigrationSchema = z.object({
  candidate_id: Id,
  status: z.literal("rejected_lossy"),
  losses: z.array(z.enum(["statement", "confidence", "provider_metadata"])).min(1),
}).strict();

export const CategoryExtractorDefinitionSchema = z.object({
  extractor_id: Id,
  contract_version: Text,
  registered_by: z.enum(["ces", "organization"]),
  supported_semantic_kind_ids: z.array(Id).min(1),
}).strict();

export const CategoryExtractorRegistrySchema = z.object({
  contract_version: z.literal(ATLAS_CANDIDATE_CONTRACT_VERSION),
  id: Id,
  organization_id: Id.optional(),
  extractors: z.array(CategoryExtractorDefinitionSchema).min(1),
  content_hash: Hash,
}).strict();

const BUILT_IN_EXTRACTORS = [
  ["atlas.extractor.capability", ["ces.kind.capability"]],
  ["atlas.extractor.workflow", ["ces.kind.workflow", "ces.kind.operational-procedure"]],
  ["atlas.extractor.business-rule", ["ces.kind.business-rule"]],
  ["atlas.extractor.validation", ["ces.kind.validation-constraint", "ces.kind.uniqueness-constraint"]],
  ["atlas.extractor.role-permission", ["ces.kind.role-permission", "ces.kind.security-sensitive-restriction"]],
  ["atlas.extractor.state-lifecycle", ["ces.kind.state-definition", "ces.kind.state-transition", "ces.kind.lifecycle-rule"]],
  ["atlas.extractor.calculation", ["ces.kind.calculation"]],
  ["atlas.extractor.reporting", ["ces.kind.reporting-requirement"]],
  ["atlas.extractor.acceptance", ["ces.kind.acceptance-criterion", "ces.kind.acceptance-scenario"]],
  ["atlas.extractor.terminology", ["ces.kind.terminology"]],
] as const;

export function createCategoryExtractorRegistry(input: {
  readonly organization_id?: string;
  readonly organization_extractors?: readonly z.input<typeof CategoryExtractorDefinitionSchema>[];
} = {}): z.infer<typeof CategoryExtractorRegistrySchema> {
  const organizationId = input.organization_id ? Id.parse(input.organization_id) : undefined;
  const extensions = (input.organization_extractors ?? [])
    .map((item) => CategoryExtractorDefinitionSchema.parse(item));
  if (extensions.length > 0 && !organizationId) {
    throw new Error("Organization extractors require organization_id");
  }
  if (extensions.some(({ registered_by }) => registered_by !== "organization")) {
    throw new Error("Organization extractors must be registered_by organization");
  }
  const extractors = [
    ...BUILT_IN_EXTRACTORS.map(([extractor_id, supported_semantic_kind_ids]) =>
      CategoryExtractorDefinitionSchema.parse({
        extractor_id,
        contract_version: "1.0.0",
        registered_by: "ces",
        supported_semantic_kind_ids: [...supported_semantic_kind_ids],
      })),
    ...extensions,
  ].sort((left, right) => compare(left.extractor_id, right.extractor_id));
  assertUnique(extractors.map(({ extractor_id }) => extractor_id), "extractor");
  const core = {
    contract_version: ATLAS_CANDIDATE_CONTRACT_VERSION,
    ...(organizationId ? { organization_id: organizationId } : {}),
    extractors,
  };
  const contentHash = hash(canonicalJson(core));
  return deepFreeze(CategoryExtractorRegistrySchema.parse({
    ...core,
    id: `${organizationId ?? "ces"}.atlas-extractors.${contentHash.slice(7, 19)}`,
    content_hash: contentHash,
  }));
}

export function mergeCategoryExtractorRuns(input: {
  readonly registry: z.input<typeof CategoryExtractorRegistrySchema>;
  readonly inventory: z.input<typeof AtlasCandidateInventorySchema>;
  readonly expected_revisions: z.input<typeof AtlasRevisionTupleSchema>;
  readonly runs: readonly z.input<typeof CategoryExtractorRunSchema>[];
}): z.infer<typeof CategoryExtractorMergeSchema> {
  const registry = CategoryExtractorRegistrySchema.parse(input.registry);
  const inventory = AtlasCandidateInventorySchema.parse(input.inventory);
  const revisions = AtlasRevisionTupleSchema.parse(input.expected_revisions);
  const candidates = [...inventory.candidates].sort((a, b) => compare(a.candidate_id, b.candidate_id));
  const byCandidate = new Map(candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const byExtractor = new Map(registry.extractors.map((extractor) =>
    [extractor.extractor_id, extractor]));
  const runs = input.runs.map((run) => CategoryExtractorRunSchema.parse(run))
    .sort((a, b) => compare(a.extractor_id, b.extractor_id));
  assertUnique(runs.map(({ extractor_id }) => extractor_id), "extractor run");
  const claimed = new Set<string>();
  for (const run of runs) {
    if (canonicalJson(run.revisions) !== canonicalJson(revisions)) {
      throw new Error(`Revision tuple mismatch: ${run.extractor_id}`);
    }
    const extractor = byExtractor.get(run.extractor_id);
    if (!extractor) throw new Error(`Unregistered extractor: ${run.extractor_id}`);
    for (const candidateId of run.candidate_ids) {
      const candidate = byCandidate.get(candidateId);
      if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
      if (!extractor.supported_semantic_kind_ids.includes(candidate.provisional_kind)) {
        throw new Error(`Extractor does not support candidate kind: ${candidateId}`);
      }
      claimed.add(candidateId);
    }
  }
  const core = {
    contract_version: ATLAS_CANDIDATE_CONTRACT_VERSION,
    extractor_registry_id: registry.id,
    candidate_inventory_hash: inventory.content_hash,
    status: runs.some(({ status }) => status !== "success") ? "incomplete" as const : "success" as const,
    runs,
    candidates,
    unclaimed_candidate_ids: candidates.map(({ candidate_id }) => candidate_id)
      .filter((id) => !claimed.has(id)),
  };
  return deepFreeze(CategoryExtractorMergeSchema.parse({
    ...core, content_hash: hash(canonicalJson(core)),
  }));
}

export const AtlasRevisionTupleSchema = z.object({
  source_revision_id: Id,
  source_content_hash: Hash,
  lexicon_revision_id: Id,
  lexicon_content_hash: Hash,
  lexicon_state: z.enum(["seed", "candidate_pinned", "reviewed", "approved", "superseded"]),
  semantic_schema_version: Text,
  prompt_contract_version: Text,
}).strict();

export const CategoryExtractorRunSchema = z.object({
  extractor_id: Id,
  contract_version: Text,
  revisions: AtlasRevisionTupleSchema,
  status: z.enum(["success", "provider_error", "partial_failure"]),
  candidate_ids: z.array(Id),
  diagnostics: z.array(Text),
}).strict();

export const CategoryExtractorMergeSchema = z.object({
  contract_version: z.literal(ATLAS_CANDIDATE_CONTRACT_VERSION),
  extractor_registry_id: Id,
  candidate_inventory_hash: Hash,
  status: z.enum(["success", "incomplete"]),
  runs: z.array(CategoryExtractorRunSchema),
  candidates: z.array(AtlasCandidateSchema),
  unclaimed_candidate_ids: z.array(Id),
  content_hash: Hash,
}).strict();

export const AtlasRoleBudgetSchema = z.object({
  maximum_source_units: z.number().int().positive(),
  maximum_input_characters: z.number().int().positive(),
  maximum_output_candidates: z.number().int().positive(),
  maximum_output_tokens: z.number().int().positive(),
}).strict();

export const BoundedSourceUnitSchema = z.object({
  id: Id,
  order: z.number().int().nonnegative(),
  section_path: z.array(Text),
  kind: Text,
  text: Text,
  content_hash: Hash,
}).strict();

export const SectionPurposeDefinitionSchema = z.object({
  purpose_id: Id,
  description: Text,
  registered_by: z.enum(["ces", "organization"]),
}).strict();

export const SectionPurposeRegistrySchema = z.object({
  contract_version: z.literal(ATLAS_SECTION_CLASSIFIER_CONTRACT_VERSION),
  id: Id,
  organization_id: Id.optional(),
  purposes: z.array(SectionPurposeDefinitionSchema).min(1),
  content_hash: Hash,
}).strict();

const BUILT_IN_SECTION_PURPOSES = [
  ["ces.section.normative-rules", "Business rules, constraints, and validations."],
  ["ces.section.workflows", "Processes, scenarios, steps, branches, and approvals."],
  ["ces.section.roles-permissions", "Actors, ownership, permissions, and prohibitions."],
  ["ces.section.calculations", "Formulas, derived values, thresholds, and rounding."],
  ["ces.section.states-lifecycle", "States, transitions, readiness, and finalization."],
  ["ces.section.reporting-audit", "Reports, exports, dashboards, audit, and traceability."],
  ["ces.section.data", "Entities, fields, documents, retention, and data constraints."],
  ["ces.section.acceptance-deliverables", "Acceptance criteria, deliverables, and handover."],
  ["ces.section.terminology", "Definitions, vocabulary, aliases, and abbreviations."],
  ["ces.section.context", "Objectives, background, scope, and non-normative context."],
  ["ces.section.unknown", "Purpose cannot be classified reliably from the content."],
] as const;

export function createSectionPurposeRegistry(input: {
  readonly organization_id?: string;
  readonly organization_purposes?: readonly z.input<typeof SectionPurposeDefinitionSchema>[];
} = {}): z.infer<typeof SectionPurposeRegistrySchema> {
  const organizationId = input.organization_id ? Id.parse(input.organization_id) : undefined;
  const extensions = (input.organization_purposes ?? [])
    .map((item) => SectionPurposeDefinitionSchema.parse(item));
  if (extensions.length > 0 && !organizationId) {
    throw new Error("Organization section purposes require organization_id");
  }
  if (extensions.some(({ registered_by }) => registered_by !== "organization")) {
    throw new Error("Organization section purposes must be registered_by organization");
  }
  const purposes = [
    ...BUILT_IN_SECTION_PURPOSES.map(([purpose_id, description]) =>
      SectionPurposeDefinitionSchema.parse({
        purpose_id, description, registered_by: "ces",
      })),
    ...extensions,
  ].sort((left, right) => compare(left.purpose_id, right.purpose_id));
  assertUnique(purposes.map(({ purpose_id }) => purpose_id), "section purpose");
  const core = {
    contract_version: ATLAS_SECTION_CLASSIFIER_CONTRACT_VERSION,
    ...(organizationId ? { organization_id: organizationId } : {}),
    purposes,
  };
  const contentHash = hash(canonicalJson(core));
  return deepFreeze(SectionPurposeRegistrySchema.parse({
    ...core,
    id: `${organizationId ?? "ces"}.section-purposes.${contentHash.slice(7, 19)}`,
    content_hash: contentHash,
  }));
}

export const SectionPurposeClassificationSchema = z.object({
  source_unit_id: Id,
  purpose_ids: z.array(Id).min(1),
  confidence: z.number().min(0).max(1),
  status: z.enum(["classified", "ambiguous", "unknown"]),
  rationale: Text,
}).strict();

export const SectionClassifierInputSchema = z.object({
  contract_version: z.literal(ATLAS_SECTION_CLASSIFIER_CONTRACT_VERSION),
  revisions: AtlasRevisionTupleSchema,
  purpose_registry: SectionPurposeRegistrySchema,
  source_units: z.array(BoundedSourceUnitSchema).min(1),
}).strict();

export const SectionClassifierOutputSchema = z.object({
  contract_version: z.literal(ATLAS_SECTION_CLASSIFIER_CONTRACT_VERSION),
  revisions: AtlasRevisionTupleSchema,
  purpose_registry_id: Id,
  classifier: z.object({
    agent_id: Id,
    agent_version: Text,
    provider_id: Id,
    model_id: Text,
  }).strict(),
  classifications: z.array(SectionPurposeClassificationSchema).min(1),
  content_hash: Hash,
}).strict();

export function finalizeSectionClassifications(inputValue: unknown, values: unknown, execution: {
  readonly agent_id?: string;
  readonly agent_version?: string;
  readonly provider_id?: string;
  readonly model_id?: string;
} = {}):
z.infer<typeof SectionClassifierOutputSchema> {
  const input = SectionClassifierInputSchema.parse(inputValue);
  const classifications = z.array(SectionPurposeClassificationSchema).parse(values)
    .map((classification) => ({
      ...classification,
      purpose_ids: [...classification.purpose_ids].sort(compare),
    }))
    .sort((left, right) => compare(left.source_unit_id, right.source_unit_id));
  assertUnique(classifications.map(({ source_unit_id }) => source_unit_id), "section classification");
  const expected = new Set(input.source_units.map(({ id }) => id));
  const registered = new Set(input.purpose_registry.purposes.map(({ purpose_id }) => purpose_id));
  for (const classification of classifications) {
    if (!expected.delete(classification.source_unit_id)) {
      throw new Error(`Classification references unknown source unit: ${classification.source_unit_id}`);
    }
    const invalid = classification.purpose_ids.find((id) => !registered.has(id));
    if (invalid) throw new Error(`Classification references unknown purpose: ${invalid}`);
    const usesUnknown = classification.purpose_ids.includes("ces.section.unknown");
    if ((classification.status === "unknown") !== usesUnknown) {
      throw new Error(`Unknown classification status mismatch: ${classification.source_unit_id}`);
    }
  }
  if (expected.size > 0) {
    throw new Error(`Missing source-unit classification: ${[...expected].sort(compare)[0]}`);
  }
  const core = {
    contract_version: ATLAS_SECTION_CLASSIFIER_CONTRACT_VERSION,
    revisions: input.revisions,
    purpose_registry_id: input.purpose_registry.id,
    classifier: {
      agent_id: Id.parse(execution.agent_id ?? "atlas.structure-classifier"),
      agent_version: Text.parse(execution.agent_version ?? "1.0.0"),
      provider_id: Id.parse(execution.provider_id ?? "fixture"),
      model_id: Text.parse(execution.model_id ?? "deterministic-fixture"),
    },
    classifications,
  };
  return deepFreeze(SectionClassifierOutputSchema.parse({
    ...core, content_hash: hash(canonicalJson(core)),
  }));
}

export const AtlasRoleInputSchema = z.object({
  contract_version: z.literal(ATLAS_ROLE_CONTRACT_VERSION),
  role_id: z.enum(ATLAS_ROLE_IDS),
  partition_id: Id,
  revisions: AtlasRevisionTupleSchema,
  budget: AtlasRoleBudgetSchema,
  source_units: z.array(BoundedSourceUnitSchema).min(1),
}).strict().superRefine((value, context) => {
  if (value.source_units.length > value.budget.maximum_source_units) {
    context.addIssue({ code: "custom", message: "Source-unit budget exceeded" });
  }
  const characters = value.source_units.reduce((total, unit) => total + unit.text.length, 0);
  if (characters > value.budget.maximum_input_characters) {
    context.addIssue({ code: "custom", message: "Input-character budget exceeded" });
  }
  if (value.role_id === "atlas.section-extractor"
    && !["candidate_pinned", "reviewed"].includes(value.revisions.lexicon_state)) {
    context.addIssue({ code: "custom",
      message: "Section extraction requires pinned L1 or reviewed pinned L2 lexicon" });
  }
});

export const StructureClassificationSchema = z.object({
  source_unit_id: Id,
  classification: z.enum(["normative", "context", "heading", "example", "unknown"]),
  rationale: Text,
}).strict();

export const DomainConceptProposalEnvelopeSchema = z.object({
  proposal_id: Id,
  source_unit_ids: z.array(Id).min(1),
  kind: z.enum(["actor", "entity", "field", "state", "action", "event", "calculation", "report"]),
  label: Text,
  aliases: z.array(Text).default([]),
}).strict();

export const SemanticCandidateEnvelopeSchema = z.object({
  candidate_id: Id,
  source_unit_ids: z.array(Id).min(1),
  semantic_kind: z.enum([
    "functional_requirement", "business_rule", "permission", "validation", "calculation",
    "state_model", "workflow", "data", "report", "acceptance_criterion", "deliverable",
    "nonfunctional_requirement",
  ]),
  payload_hash: Hash,
}).strict();

export const AtlasRoleOutputSchema = z.object({
  contract_version: z.literal(ATLAS_ROLE_CONTRACT_VERSION),
  role_id: z.enum(ATLAS_ROLE_IDS),
  partition_id: Id,
  revisions: AtlasRevisionTupleSchema,
  classifications: z.array(StructureClassificationSchema).default([]),
  concept_proposals: z.array(DomainConceptProposalEnvelopeSchema).default([]),
  semantic_candidates: z.array(SemanticCandidateEnvelopeSchema).default([]),
  uncertainties: z.array(z.object({
    id: Id, source_unit_ids: z.array(Id).min(1), statement: Text,
  }).strict()).default([]),
  conflicts: z.array(z.object({
    id: Id, source_unit_ids: z.array(Id).min(1), statement: Text,
  }).strict()).default([]),
}).strict();

export const AtlasMergeReportSchema = z.object({
  contract_version: z.literal(ATLAS_ROLE_CONTRACT_VERSION),
  revisions: AtlasRevisionTupleSchema,
  partition_ids: z.array(Id),
  classifications: z.array(StructureClassificationSchema),
  concept_proposals: z.array(DomainConceptProposalEnvelopeSchema),
  semantic_candidates: z.array(SemanticCandidateEnvelopeSchema),
  uncertainties: z.array(z.object({
    id: Id, source_unit_ids: z.array(Id).min(1), statement: Text,
  }).strict()),
  conflicts: z.array(z.object({
    id: Id, source_unit_ids: z.array(Id).min(1), statement: Text,
  }).strict()),
  duplicate_candidate_groups: z.array(z.array(Id).min(2)),
  content_hash: Hash,
}).strict();

export type AtlasRoleInput = z.infer<typeof AtlasRoleInputSchema>;
export type AtlasRoleOutput = z.input<typeof AtlasRoleOutputSchema>;
export type AtlasCandidate = z.input<typeof AtlasCandidateSchema>;

export function createAtlasCandidateInventory(input: {
  readonly source_revision_id: string;
  readonly lexicon_revision_id: string;
  readonly semantic_schema_version: string;
  readonly semantic_kind_registry_id: string;
  readonly semantic_kind_registry_hash: string;
  readonly prompt_contract_version: string;
  readonly allowed_source_unit_ids: readonly string[];
  readonly candidates: readonly AtlasCandidate[];
}): z.infer<typeof AtlasCandidateInventorySchema> {
  const allowed = new Set(input.allowed_source_unit_ids.map((id) => Id.parse(id)));
  const candidates = input.candidates.map((candidate) => AtlasCandidateSchema.parse(candidate))
    .sort((left, right) => compare(left.candidate_id, right.candidate_id));
  assertUnique(candidates.map(({ candidate_id }) => candidate_id), "candidate");
  for (const candidate of candidates) {
    const invented = candidate.source_unit_ids.find((id) => !allowed.has(id));
    if (invented) throw new Error(`Candidate references unknown source unit: ${invented}`);
  }
  const core = {
    contract_version: ATLAS_CANDIDATE_CONTRACT_VERSION,
    source_revision_id: Id.parse(input.source_revision_id),
    lexicon_revision_id: Id.parse(input.lexicon_revision_id),
    semantic_schema_version: Text.parse(input.semantic_schema_version),
    semantic_kind_registry_id: Id.parse(input.semantic_kind_registry_id),
    semantic_kind_registry_hash: Hash.parse(input.semantic_kind_registry_hash),
    prompt_contract_version: Text.parse(input.prompt_contract_version),
    candidates,
  };
  return deepFreeze(AtlasCandidateInventorySchema.parse({
    ...core,
    content_hash: hash(canonicalJson(core)),
  }));
}

export function inspectLegacyCandidateMigration(
  candidate: z.input<typeof SemanticCandidateEnvelopeSchema>,
): z.infer<typeof LegacyCandidateMigrationSchema> {
  const parsed = SemanticCandidateEnvelopeSchema.parse(candidate);
  return LegacyCandidateMigrationSchema.parse({
    candidate_id: parsed.candidate_id,
    status: "rejected_lossy",
    losses: ["statement", "confidence", "provider_metadata"],
  });
}

export function partitionSourceUnits(input: {
  readonly role_id: typeof ATLAS_ROLE_IDS[number];
  readonly revisions: z.input<typeof AtlasRevisionTupleSchema>;
  readonly budget: z.input<typeof AtlasRoleBudgetSchema>;
  readonly source_units: readonly z.input<typeof BoundedSourceUnitSchema>[];
}): readonly AtlasRoleInput[] {
  const revisions = AtlasRevisionTupleSchema.parse(input.revisions);
  const budget = AtlasRoleBudgetSchema.parse(input.budget);
  const units = input.source_units.map((unit) => BoundedSourceUnitSchema.parse(unit))
    .sort((a, b) => a.order - b.order);
  assertUnique(units.map(({ id }) => id), "source unit");
  const partitions: AtlasRoleInput[] = [];
  let current: typeof units = [];
  let characters = 0;
  for (const unit of units) {
    if (unit.text.length > budget.maximum_input_characters) {
      throw new Error(`Source unit exceeds role input budget: ${unit.id}`);
    }
    if (current.length >= budget.maximum_source_units
      || characters + unit.text.length > budget.maximum_input_characters) {
      partitions.push(makePartition(input.role_id, revisions, budget, current, partitions.length));
      current = [];
      characters = 0;
    }
    current.push(unit);
    characters += unit.text.length;
  }
  if (current.length > 0) {
    partitions.push(makePartition(input.role_id, revisions, budget, current, partitions.length));
  }
  return deepFreeze(partitions);
}

export function mergeAtlasRoleOutputs(input: {
  readonly expected_revisions: z.input<typeof AtlasRevisionTupleSchema>;
  readonly allowed_source_unit_ids: readonly string[];
  readonly outputs: readonly AtlasRoleOutput[];
}): z.infer<typeof AtlasMergeReportSchema> {
  const revisions = AtlasRevisionTupleSchema.parse(input.expected_revisions);
  const allowed = new Set(input.allowed_source_unit_ids.map((id) => Id.parse(id)));
  const outputs = input.outputs.map((output) => AtlasRoleOutputSchema.parse(output));
  assertUnique(outputs.map(({ partition_id }) => partition_id), "partition");
  for (const output of outputs) {
    if (canonicalJson(output.revisions) !== canonicalJson(revisions)) {
      throw new Error(`Revision tuple mismatch: ${output.partition_id}`);
    }
    const referenced = [
      ...output.classifications.map(({ source_unit_id }) => source_unit_id),
      ...output.concept_proposals.flatMap(({ source_unit_ids }) => source_unit_ids),
      ...output.semantic_candidates.flatMap(({ source_unit_ids }) => source_unit_ids),
      ...output.uncertainties.flatMap(({ source_unit_ids }) => source_unit_ids),
      ...output.conflicts.flatMap(({ source_unit_ids }) => source_unit_ids),
    ];
    const invented = referenced.filter((id) => !allowed.has(id));
    if (invented.length > 0) throw new Error(`Agent referenced unknown source unit: ${invented[0]}`);
  }
  const classifications = outputs.flatMap(({ classifications: values }) => values)
    .sort((a, b) => compare(a.source_unit_id, b.source_unit_id));
  const conceptProposals = outputs.flatMap(({ concept_proposals: values }) => values)
    .sort((a, b) => compare(a.proposal_id, b.proposal_id));
  const semanticCandidates = outputs.flatMap(({ semantic_candidates: values }) => values)
    .sort((a, b) => compare(a.candidate_id, b.candidate_id));
  const uncertainties = outputs.flatMap(({ uncertainties: values }) => values)
    .sort((a, b) => compare(a.id, b.id));
  const conflicts = outputs.flatMap(({ conflicts: values }) => values)
    .sort((a, b) => compare(a.id, b.id));
  assertUnique(classifications.map(({ source_unit_id }) => source_unit_id), "classification");
  assertUnique(conceptProposals.map(({ proposal_id }) => proposal_id), "concept proposal");
  assertUnique(semanticCandidates.map(({ candidate_id }) => candidate_id), "semantic candidate");
  const byPayload = Map.groupBy(semanticCandidates, ({ payload_hash }) => payload_hash);
  const duplicateGroups = [...byPayload.values()].filter((group) => group.length > 1)
    .map((group) => group.map(({ candidate_id }) => candidate_id).sort(compare))
    .sort((a, b) => compare(a[0]!, b[0]!));
  const core = {
    contract_version: ATLAS_ROLE_CONTRACT_VERSION,
    revisions,
    partition_ids: outputs.map(({ partition_id }) => partition_id).sort(compare),
    classifications,
    concept_proposals: conceptProposals,
    semantic_candidates: semanticCandidates,
    uncertainties,
    conflicts,
    duplicate_candidate_groups: duplicateGroups,
  };
  return deepFreeze(AtlasMergeReportSchema.parse({
    ...core,
    content_hash: hash(canonicalJson(core)),
  }));
}

function makePartition(roleId: typeof ATLAS_ROLE_IDS[number],
  revisions: z.infer<typeof AtlasRevisionTupleSchema>,
  budget: z.infer<typeof AtlasRoleBudgetSchema>,
  units: readonly z.infer<typeof BoundedSourceUnitSchema>[], index: number): AtlasRoleInput {
  return AtlasRoleInputSchema.parse({
    contract_version: ATLAS_ROLE_CONTRACT_VERSION,
    role_id: roleId,
    partition_id: `atlas.partition.${String(index + 1).padStart(5, "0")}`,
    revisions, budget, source_units: units,
  });
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}
function canonicalJson(value: unknown): string { return JSON.stringify(canonical(value)); }
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonical(record[key])]));
  }
  return value;
}
function hash(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
