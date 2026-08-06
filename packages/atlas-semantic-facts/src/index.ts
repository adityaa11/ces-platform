import { createHash } from "node:crypto";
import { AtlasEvidenceSchema } from "@company/ces-atlas-knowledge-contracts";
import { SourceUnitSchema } from "@company/ces-source-unit-schema";
import { z } from "zod";

export const ATLAS_SEMANTIC_FACT_VERSION = "2.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const ExactText = z.string().min(1);

export const SemanticFactKindSchema = z.enum([
  "module", "actor", "activity", "activity_order", "decision", "condition",
  "outcome", "business_rule", "state", "state_transition", "entity",
  "entity_relationship", "dependency", "event", "permission", "validation",
  "audit_action", "nonfunctional_requirement", "unknown",
]);

export const SemanticFactTermSchema = z.object({
  role_id: Id,
  exact_text: ExactText,
}).strict();

const DocumentInputSchema = z.object({
  document_id: Id,
  document_revision_id: Id,
  revision: z.number().int().positive(),
  content_hash: Hash,
  media_type: z.string().min(1),
  original_name: ExactText,
}).strict();

export const SemanticFactExtractionInputSchema = z.object({
  schema_version: z.literal(ATLAS_SEMANTIC_FACT_VERSION),
  project_id: Id,
  documents: z.array(DocumentInputSchema).min(1),
  source_units: z.array(SourceUnitSchema).min(1),
}).strict().superRefine((input, context) => {
  const revisions = new Set(input.documents.map(({ document_revision_id }) =>
    document_revision_id));
  for (const unit of input.source_units) {
    if (!revisions.has(unit.document_revision_id)) context.addIssue({ code: "custom",
      message: `Source unit ${unit.id} references an unknown document revision` });
  }
});

export const SemanticFactCandidateSchema = z.object({
  candidate_id: Id,
  kind: SemanticFactKindSchema,
  exact_statement: ExactText,
  source_unit_ids: z.array(Id).min(1),
  terms: z.array(SemanticFactTermSchema),
  relation_kind: Id.optional(),
  confidence: z.number().min(0).max(1),
  uncertainty: ExactText.optional(),
  proposed_equivalence_key: Id.optional(),
}).strict();

export const SemanticFactIntermediateSchema = z.object({
  schema_version: z.literal(ATLAS_SEMANTIC_FACT_VERSION),
  facts: z.array(SemanticFactCandidateSchema),
}).strict();

export const SemanticFactSchema = SemanticFactCandidateSchema.omit({ candidate_id: true }).extend({
  fact_id: Id,
  evidence_ids: z.array(Id).min(1),
  context_paths: z.array(ExactText),
  equivalence_status: z.enum(["not_proposed", "pending_review"]),
}).strict();

export const SemanticFactExtractionOutputSchema = z.object({
  schema_version: z.literal(ATLAS_SEMANTIC_FACT_VERSION),
  project_id: Id,
  facts: z.array(SemanticFactSchema),
  evidence: z.array(AtlasEvidenceSchema),
}).strict();

export function finalizeSemanticFacts(inputValue: unknown, resultValue: unknown):
z.infer<typeof SemanticFactExtractionOutputSchema> {
  const input = SemanticFactExtractionInputSchema.parse(inputValue);
  const result = SemanticFactIntermediateSchema.parse(resultValue);
  const units = new Map(input.source_units.map((unit) => [unit.id, unit]));
  const documents = new Map(input.documents.map((document) =>
    [document.document_revision_id, document]));
  const evidence = new Map<string, z.infer<typeof AtlasEvidenceSchema>>();
  const facts = result.facts.map((candidate) => {
    const cited = candidate.source_unit_ids.map((id) => {
      const unit = units.get(id);
      if (!unit) throw new Error(`Semantic fact references unknown source unit ${id}`);
      return unit;
    });
    if (!cited.some(({ exact_text }) => exact_text.includes(candidate.exact_statement))) {
      throw new Error(`Semantic fact ${candidate.candidate_id} does not preserve an exact source quote`);
    }
    for (const term of candidate.terms) {
      if (!cited.some(({ exact_text }) => exact_text.includes(term.exact_text))) {
        throw new Error(`Semantic fact term ${term.role_id} is not present in cited source text`);
      }
    }
    const evidenceIds = cited.map((unit) => {
      const document = documents.get(unit.document_revision_id);
      if (!document) throw new Error(`Unknown document revision ${unit.document_revision_id}`);
      const evidenceId = `${input.project_id}.evidence.${stable(unit.revision_hash).slice(0, 16)}`;
      const page = unit.location.page_start ?? 1;
      evidence.set(evidenceId, AtlasEvidenceSchema.parse({
        evidence_id: evidenceId,
        exact_text: unit.exact_text,
        language: unit.language_detection.detected_language,
        location: {
          document_id: document.document_id,
          document_revision: document.revision,
          source_unit_id: unit.id,
          page_number: page,
          page_number_base: 1,
          text_span: { start: 0, end: unit.exact_text.length },
          coordinates: unit.bounding_box ? {
            coordinate_status: "available",
            bounding_boxes: [{ ...unit.bounding_box,
              coordinate_space: "normalized_page", origin: "top_left" }],
          } : {
            coordinate_status: "unavailable", bounding_boxes: [],
            reason: "source_has_no_coordinates",
          },
        },
        extraction_method: unit.source_kind === "pdf_ocr" ? "ocr"
          : unit.source_kind === "pdf_text" ? "text_layer" : "structured_text",
        extraction_confidence: unit.ocr_confidence
          ?? unit.language_detection.language_confidence,
        review_status: "unreviewed",
      }));
      return evidenceId;
    });
    const identity = { kind: candidate.kind, exact_statement: candidate.exact_statement,
      source_unit_ids: [...candidate.source_unit_ids].sort() };
    const { candidate_id: _candidateId, ...semantic } = candidate;
    return SemanticFactSchema.parse({
      ...semantic,
      fact_id: `${input.project_id}.fact.${stable(identity).slice(0, 16)}`,
      evidence_ids: [...new Set(evidenceIds)].sort(),
      context_paths: [...new Set(cited.flatMap(({ section_path }) =>
        section_path.length ? [section_path.join(" > ")] : []))].sort(),
      equivalence_status: candidate.proposed_equivalence_key
        ? "pending_review" : "not_proposed",
    });
  }).sort((left, right) => left.fact_id.localeCompare(right.fact_id));
  if (new Set(facts.map(({ fact_id }) => fact_id)).size !== facts.length) {
    throw new Error("Duplicate semantic facts are not allowed");
  }
  return SemanticFactExtractionOutputSchema.parse({
    schema_version: ATLAS_SEMANTIC_FACT_VERSION,
    project_id: input.project_id,
    facts,
    evidence: [...evidence.values()].sort((left, right) =>
      left.evidence_id.localeCompare(right.evidence_id)),
  });
}

function stable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export type SemanticFactExtractionInput = z.infer<typeof SemanticFactExtractionInputSchema>;
export type SemanticFactExtractionOutput = z.infer<typeof SemanticFactExtractionOutputSchema>;
