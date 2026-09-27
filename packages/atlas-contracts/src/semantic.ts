import Ajv from "ajv/dist/ajv.js";
import { normalizedDocumentSchema, type NormalizedDocument } from "./perception.js";

type Validator = ((value: unknown) => boolean) & { readonly errors?: unknown };
type AjvInstance = { compile(schema: object): Validator; errorsText(errors: unknown): string };
const AjvConstructor = Ajv as unknown as new (options: { readonly allErrors: boolean; readonly strict: boolean }) => AjvInstance;
const ajv = new AjvConstructor({ allErrors: true, strict: false });

export const semanticContractVersion = "v1" as const;
export const semanticSkillIds = ["atlas.semantic.extract", "atlas.semantic.reconcile"] as const;
export type SemanticSkillId = typeof semanticSkillIds[number];
export const semanticLimits = {
  jobBytes: 16 * 1024, contextBytes: 1024 * 1024, resultEnvelopeBytes: 2 * 1024 * 1024,
  currentCandidates: 500, priorCandidates: 500, totalCandidates: 1000, retrievalPage: 100,
} as const;

const id = { type: "string", minLength: 1, maxLength: 200, pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$" } as const;
const text = (maxLength: number) => ({ type: "string", minLength: 1, maxLength });
const jsonValue = { anyOf: [{ type: "null" }, { type: "boolean" }, { type: "number" }, { type: "string", maxLength: 16384 }, { type: "array", maxItems: 100, items: {} }, { type: "object", maxProperties: 100, additionalProperties: {} }] } as const;
const scopeSchema = { type: "object", additionalProperties: false, required: ["projectId", "workspaceId", "bundleId", "documentId", "executionId", "contractVersion"], properties: { projectId: id, workspaceId: id, bundleId: id, documentId: id, executionId: id, contractVersion: { const: semanticContractVersion } } } as const;
const evidenceRefSchema = { type: "object", additionalProperties: false, required: ["page_number", "locator_type", "locator_id"], properties: { page_number: { type: "integer", minimum: 1 }, locator_type: { enum: ["text_block", "table", "visual_region"] }, locator_id: id, excerpt: { type: "string", minLength: 1, maxLength: 4000 } } } as const;
const kindValues = ["actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision", "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved"] as const;
const candidateSchema = { type: "object", additionalProperties: false, required: ["local_candidate_id", "semantic_key", "kind", "payload", "normalized_meaning", "needs_resolution", "evidence_refs"], properties: { local_candidate_id: id, semantic_key: text(300), kind: { enum: kindValues }, payload: jsonValue, normalized_meaning: text(8000), source_wording: { type: "string", minLength: 1, maxLength: 12000 }, needs_resolution: { type: "boolean" }, evidence_refs: { type: "array", minItems: 1, maxItems: 32, items: evidenceRefSchema } } } as const;
const inventorySchema = { type: "object", additionalProperties: false, required: ["source_unit_id", "page_number", "locator_type", "locator_id", "classification", "destination_local_candidate_ids"], properties: { source_unit_id: id, page_number: { type: "integer", minimum: 1 }, locator_type: { enum: ["text_block", "table", "visual_region"] }, locator_id: id, classification: { enum: ["candidate", "non_fact"] }, destination_local_candidate_ids: { type: "array", maxItems: 64, items: id }, non_fact_reason: { type: "string", minLength: 1, maxLength: 1000 } } } as const;
const questionSchema = { type: "object", additionalProperties: false, required: ["question", "reason"], properties: { question: text(2000), reason: text(2000), evidence_refs: { type: "array", maxItems: 16, items: evidenceRefSchema } } } as const;

export const semanticExtractionResultSchema = { $id: "https://atlas.local/contracts/semantic-extraction-result-v1.json", type: "object", additionalProperties: false, required: ["version", "candidate_assertions", "source_statement_inventory", "questions"], properties: { version: { const: semanticContractVersion }, candidate_assertions: { type: "array", maxItems: semanticLimits.currentCandidates, items: candidateSchema }, source_statement_inventory: { type: "array", maxItems: 100000, items: inventorySchema }, questions: { type: "array", maxItems: 100, items: questionSchema } } } as const;
const relationshipTypes = ["new", "supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution"] as const;
const relationshipSchema = { type: "object", additionalProperties: false, required: ["source_candidate_id", "relationship_type", "payload", "requires_resolution", "evidence_refs"], properties: { source_candidate_id: id, target_candidate_id: id, relationship_type: { enum: relationshipTypes }, payload: jsonValue, requires_resolution: { type: "boolean" }, evidence_refs: { type: "array", maxItems: 32, items: evidenceRefSchema } } } as const;
export const semanticReconciliationResultSchema = { $id: "https://atlas.local/contracts/semantic-reconciliation-result-v1.json", type: "object", additionalProperties: false, required: ["version", "relationships", "questions"], properties: { version: { const: semanticContractVersion }, relationships: { type: "array", maxItems: semanticLimits.totalCandidates * 10, items: relationshipSchema }, questions: { type: "array", maxItems: 100, items: questionSchema } } } as const;

export const semanticBackgroundJobSchema = { type: "object", additionalProperties: false, required: ["version", "executionId", "skill", "contextCapability"], properties: { version: { const: semanticContractVersion }, executionId: id, skill: { type: "object", additionalProperties: false, required: ["id", "version"], properties: { id: { enum: semanticSkillIds }, version: { const: semanticContractVersion } } }, contextCapability: text(1000) } } as const;
export const semanticExtractionContextSchema = { type: "object", additionalProperties: false, required: ["version", "skill", "scope", "normalizedDocument"], properties: { version: { const: semanticContractVersion }, skill: { const: "atlas.semantic.extract" }, scope: scopeSchema, normalizedDocument: normalizedDocumentSchema } } as const;
const contextCandidateSchema = { type: "object", additionalProperties: false, required: ["id", "semantic_key", "kind", "normalized_meaning", "payload", "evidence_refs"], properties: { id, semantic_key: text(300), kind: { enum: kindValues }, normalized_meaning: text(8000), payload: jsonValue, evidence_refs: { type: "array", maxItems: 32, items: evidenceRefSchema } } } as const;
export const semanticReconciliationContextSchema = { type: "object", additionalProperties: false, required: ["version", "skill", "scope", "currentCandidates", "priorCandidates", "selection"], properties: { version: { const: semanticContractVersion }, skill: { const: "atlas.semantic.reconcile" }, scope: scopeSchema, currentCandidates: { type: "array", maxItems: semanticLimits.currentCandidates, items: contextCandidateSchema }, priorCandidates: { type: "array", maxItems: semanticLimits.priorCandidates, items: contextCandidateSchema }, selection: { type: "object", additionalProperties: false, required: ["policy", "overflow"], properties: { policy: text(200), overflow: { type: "boolean" }, selectedCount: { type: "integer", minimum: 0, maximum: semanticLimits.priorCandidates } } }, acceptedBaseCandidates: { type: "array", maxItems: 0 } } } as const;
export const semanticResultEnvelopeSchema = { type: "object", additionalProperties: false, required: ["version", "scope", "skill", "provider", "result"], properties: { version: { const: semanticContractVersion }, scope: scopeSchema, skill: { type: "object", additionalProperties: false, required: ["id", "version"], properties: { id: { enum: semanticSkillIds }, version: { const: semanticContractVersion } } }, provider: { type: "object", additionalProperties: false, required: ["provider", "model", "endpoint", "latencyMilliseconds", "attempt"], properties: { provider: text(100), model: text(200), endpoint: text(500), latencyMilliseconds: { type: "integer", minimum: 0 }, attempt: { type: "integer", minimum: 1 }, usage: jsonValue } }, result: { oneOf: [semanticExtractionResultSchema, semanticReconciliationResultSchema] } } } as const;
export const semanticTechnicalFailureSchema = { type: "object", additionalProperties: false, required: ["version", "scope", "code", "message"], properties: { version: { const: semanticContractVersion }, scope: scopeSchema, code: { enum: ["context_authorization", "context_bound", "provider_unavailable", "provider_timeout", "malformed_output", "schema_validation", "integrity_validation", "completion_conflict"] }, message: text(1000) } } as const;

export type SemanticBackgroundJob = { readonly version: "v1"; readonly executionId: string; readonly skill: { readonly id: SemanticSkillId; readonly version: "v1" }; readonly contextCapability: string };
export type SemanticExtractionContext = { readonly version: "v1"; readonly skill: "atlas.semantic.extract"; readonly scope: Record<string, string>; readonly normalizedDocument: NormalizedDocument };
export type SemanticReconciliationContext = { readonly version: "v1"; readonly skill: "atlas.semantic.reconcile"; readonly scope: Record<string, string>; readonly currentCandidates: readonly unknown[]; readonly priorCandidates: readonly unknown[]; readonly selection: { readonly policy: string; readonly overflow: boolean; readonly selectedCount?: number } };
export type SemanticExtractionResult = { readonly version: "v1"; readonly candidate_assertions: readonly unknown[]; readonly source_statement_inventory: readonly unknown[]; readonly questions: readonly unknown[] };
export type SemanticReconciliationResult = { readonly version: "v1"; readonly relationships: readonly unknown[]; readonly questions: readonly unknown[] };

const validators = { job: ajv.compile(semanticBackgroundJobSchema), extractionContext: ajv.compile(semanticExtractionContextSchema), reconciliationContext: ajv.compile(semanticReconciliationContextSchema), extractionResult: ajv.compile(semanticExtractionResultSchema), reconciliationResult: ajv.compile(semanticReconciliationResultSchema), envelope: ajv.compile(semanticResultEnvelopeSchema), failure: ajv.compile(semanticTechnicalFailureSchema) };
function parse<T>(validator: Validator, value: unknown, label: string, maximumBytes: number): T { assertUtf8JsonBytes(value, maximumBytes, label); if (!validator(value)) throw new Error(`Invalid ${label}: ${ajv.errorsText(validator.errors)}`); return value as T; }
export function assertUtf8JsonBytes(value: unknown, maximumBytes: number, label = "semantic value"): void { let serialized: string; try { serialized = JSON.stringify(value); } catch { throw new Error(`Invalid ${label}: not JSON serializable`); } if (new TextEncoder().encode(serialized).byteLength > maximumBytes) throw new Error(`Invalid ${label}: exceeds ${maximumBytes} UTF-8 JSON bytes`); }
export function parseSemanticBackgroundJob(value: unknown): SemanticBackgroundJob { return parse<SemanticBackgroundJob>(validators.job, value, "semantic background job", semanticLimits.jobBytes); }
export function parseSemanticExtractionContext(value: unknown): SemanticExtractionContext { return parse<SemanticExtractionContext>(validators.extractionContext, value, "semantic extraction context", semanticLimits.contextBytes); }
export function parseSemanticReconciliationContext(value: unknown): SemanticReconciliationContext { const parsed = parse<SemanticReconciliationContext>(validators.reconciliationContext, value, "semantic reconciliation context", semanticLimits.contextBytes); if (parsed.currentCandidates.length + parsed.priorCandidates.length > semanticLimits.totalCandidates) throw new Error("Invalid semantic reconciliation context: candidate total exceeds limit"); return parsed; }
export function parseSemanticExtractionResult(value: unknown): SemanticExtractionResult {
  const parsed = parse<SemanticExtractionResult>(validators.extractionResult, value, "semantic extraction result", semanticLimits.resultEnvelopeBytes);
  const result = parsed as unknown as { readonly candidate_assertions: readonly { readonly local_candidate_id: string }[]; readonly source_statement_inventory: readonly { readonly page_number: number; readonly locator_type: string; readonly locator_id: string; readonly classification: string; readonly destination_local_candidate_ids: readonly string[]; readonly non_fact_reason?: string }[] };
  const localIds = new Set<string>();
  for (const candidate of result.candidate_assertions) { if (localIds.has(candidate.local_candidate_id)) throw new Error("Invalid semantic extraction result: duplicate local candidate ID"); localIds.add(candidate.local_candidate_id); }
  const sources = new Set<string>();
  for (const item of result.source_statement_inventory) {
    const source = `${item.page_number}:${item.locator_type}:${item.locator_id}`;
    if (sources.has(source)) throw new Error("Invalid semantic extraction result: duplicate source inventory identity");
    sources.add(source);
    if (item.classification === "candidate" && item.destination_local_candidate_ids.length === 0) throw new Error("Invalid semantic extraction result: candidate inventory needs a destination");
    if (item.classification === "non_fact" && (!item.non_fact_reason || item.destination_local_candidate_ids.length)) throw new Error("Invalid semantic extraction result: non_fact inventory needs only a reason");
    for (const destination of item.destination_local_candidate_ids) if (!localIds.has(destination)) throw new Error("Invalid semantic extraction result: dangling local candidate ID");
  }
  return parsed;
}
export function parseSemanticReconciliationResult(value: unknown): SemanticReconciliationResult {
  const parsed = parse<SemanticReconciliationResult>(validators.reconciliationResult, value, "semantic reconciliation result", semanticLimits.resultEnvelopeBytes);
  for (const relationship of (parsed as unknown as { readonly relationships: readonly { readonly relationship_type: string; readonly target_candidate_id?: string }[] }).relationships) {
    if (relationship.relationship_type === "new" ? relationship.target_candidate_id !== undefined : relationship.target_candidate_id === undefined) throw new Error("Invalid semantic reconciliation result: relationship target is inconsistent with type");
  }
  return parsed;
}
export function parseSemanticResultEnvelope(value: unknown): unknown {
  const parsed = parse(validators.envelope, value, "semantic result envelope", semanticLimits.resultEnvelopeBytes) as { skill: { id: SemanticSkillId }; result: unknown };
  if (parsed.skill.id === "atlas.semantic.extract") parseSemanticExtractionResult(parsed.result); else parseSemanticReconciliationResult(parsed.result);
  return parsed;
}
export function parseSemanticTechnicalFailure(value: unknown): unknown { return parse(validators.failure, value, "semantic technical failure", semanticLimits.jobBytes); }
