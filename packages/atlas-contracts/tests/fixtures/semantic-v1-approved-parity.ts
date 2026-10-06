/**
 * Approved V1 acceptance oracle, frozen from the pre-Zod Semantic V1 contract.
 * These data-only fixtures deliberately do not call the migrated parsers.
 */
export const semanticV1ParityOracleVersion = "semantic-v1-approved-parity-2026-10-06" as const;

export const approvedSemanticKindsV1 = [
  "actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision",
  "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved",
] as const;

export const approvedReconciliationRelationshipTypesV1 = [
  "new", "supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution",
] as const;

export const semanticV1ParityCases = [
  { dimension: "strict unknown fields", parser: "extraction", accepted: false, patch: { unexpected_provider_field: true } },
  { dimension: "source accounting requires candidate destinations", parser: "extraction", accepted: false, patch: { source_statement_inventory: [{ source_unit_id: "unit-1", page_number: 1, locator_type: "text_block", locator_id: "block-1", classification: "candidate", destination_local_candidate_ids: [] }] } },
  { dimension: "source accounting allows non-fact with reason only", parser: "extraction", accepted: true, value: { version: "v1", candidate_assertions: [], source_statement_inventory: [{ source_unit_id: "unit-1", page_number: 1, locator_type: "visual_region", locator_id: "visual-1", classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: "decorative" }], questions: [] } },
  { dimension: "evidence invariant requires an excerpt for text blocks", parser: "extraction", accepted: false, patch: { candidate_assertions: [{ local_candidate_id: "local-1", semantic_key: "quota", kind: "rule", payload: {}, normalized_meaning: "quota is 40", needs_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-1" }] }] } },
  { dimension: "payload nesting bound", parser: "extraction", accepted: false, payloadDepth: 9 },
  { dimension: "reconciliation new relationship has no target", parser: "reconciliation", accepted: true, value: { version: "v1", relationships: [{ source_candidate_id: "candidate-1", relationship_type: "new", payload: {}, requires_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-1", excerpt: "quota is 40" }] }], questions: [] } },
  { dimension: "reconciliation non-new relationship requires target", parser: "reconciliation", accepted: false, value: { version: "v1", relationships: [{ source_candidate_id: "candidate-1", relationship_type: "supports", payload: {}, requires_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-1", excerpt: "quota is 40" }] }], questions: [] } },
] as const;

/** Boundary metadata is part of the oracle; test construction keeps fixtures readable. */
export const semanticV1BoundaryParityFixtures = [
  { dimension: "extraction candidate count bound", parser: "extractionCandidates", acceptedAt: 500, rejectedAt: 501 },
  { dimension: "reconciliation candidate count bound", parser: "reconciliationCandidates", acceptedAt: 500, rejectedAt: 501 },
  { dimension: "reconciliation-context UTF-8 byte bound", parser: "reconciliationContextBytes", acceptedAt: 1024 * 1024, rejectedAt: 1024 * 1024 + 1 },
] as const;

export const approvedSemanticV1ParserApis = [
  "parseSemanticBackgroundJob", "parseSemanticExtractionContext", "parseSemanticReconciliationContext",
  "parseSemanticExtractionResult", "parseSemanticReconciliationResult", "parseSemanticResultEnvelope",
] as const;
