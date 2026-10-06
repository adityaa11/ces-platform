import assert from "node:assert/strict";
import test from "node:test";
import { atlasSemanticExtractionResultV1Schema, atlasSemanticReconciliationResultV1Schema, parseSemanticBackgroundJob, parseSemanticExtractionContext, parseSemanticExtractionResult, parseSemanticReconciliationContext, parseSemanticReconciliationResult, parseSemanticResultEnvelope, semanticExtractionResultSchema, semanticLimits, semanticReconciliationResultSchema, toAtlasJsonSchema, validateJsonSchema } from "../src/index.ts";

const scope = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: "execution-1", contractVersion: "v1" };
const evidence = { page_number: 1, locator_type: "text_block", locator_id: "block-1", excerpt: "quota is 40" };
const extraction = { version: "v1", candidate_assertions: [{ local_candidate_id: "local-1", semantic_key: "quota", kind: "rule", payload: { value: 40 }, normalized_meaning: "quota is 40", source_wording: "quota is 40", needs_resolution: false, evidence_refs: [evidence] }], source_statement_inventory: [{ source_unit_id: "unit-1", page_number: 1, locator_type: "text_block", locator_id: "block-1", classification: "candidate", destination_local_candidate_ids: ["local-1"] }], questions: [] };
const normalizedDocument = { version: "v1", executionId: "perception-1", artifactId: "document-1", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "provider", processor: "processor", executionId: "perception-1", processedAt: "2026-09-27T00:00:00Z" }, pages: [{ number: 1, textBlocks: [{ id: "block-1", text: "quota is 40" }], tables: [], visualRegions: [] }] };
const jsonBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
const selection = (currentCount: number, selectedCount: number, overflow = false) => ({ policy: "semantic-key-kind", version: "v1" as const, overflow, selectedCount, currentCount, totalCount: currentCount + selectedCount, byteLimit: semanticLimits.contextBytes, byteCount: 0, omittedPriorCount: 0 });
const contextWithBytes = (target: number) => {
  const context = structuredClone({ version: "v1", skill: "atlas.semantic.extract", scope, normalizedDocument: { ...normalizedDocument, pages: [{ ...normalizedDocument.pages[0], textBlocks: [{ id: "block-1", text: "x".repeat(900000) }, { id: "block-2", text: "" }] }] } });
  context.normalizedDocument.pages[0].textBlocks[1].text = "x".repeat(target - jsonBytes(context));
  assert.equal(jsonBytes(context), target);
  return context;
};
const reconciliationContextWithBytes = (target: number) => {
  const priorCandidates = Array.from({ length: 100 }, (_, index) => ({ id: `prior-${index}`, semantic_key: `key-${index}`, kind: "rule", normalized_meaning: "meaning", payload: "x", evidence_refs: [{ ...evidence, locator_id: `block-${index}` }] }));
  const context = { version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: [], priorCandidates, selection: selection(0, priorCandidates.length) };
  let remaining = target - jsonBytes(context);
  for (const candidate of priorCandidates) { const added = Math.min(remaining, 16383); candidate.payload += "x".repeat(added); remaining -= added; }
  assert.equal(remaining, 0); assert.equal(jsonBytes(context), target);
  return context;
};
const envelopeWithBytes = (target: number) => {
  const candidates = Array.from({ length: 200 }, (_, index) => ({ local_candidate_id: `local-${index}`, semantic_key: `key-${index}`, kind: "rule", payload: {}, normalized_meaning: "meaning", source_wording: "x", needs_resolution: false, evidence_refs: [{ ...evidence, locator_id: `block-${index}` }] }));
  const result = { version: "v1", candidate_assertions: candidates, source_statement_inventory: candidates.map((candidate, index) => ({ source_unit_id: `unit-${index}`, page_number: 1, locator_type: "text_block", locator_id: `block-${index}`, classification: "candidate", destination_local_candidate_ids: [candidate.local_candidate_id] })), questions: [] };
  const envelope = { version: "v1", scope, skill: { id: "atlas.semantic.extract", version: "v1" }, provider: { provider: "mistral", model: "configured", endpoint: "/v1", latencyMilliseconds: 1, attempt: 1 }, result };
  let remaining = target - jsonBytes(envelope);
  for (const candidate of candidates) { const added = Math.min(remaining, 11999); candidate.source_wording += "x".repeat(added); remaining -= added; }
  assert.equal(remaining, 0); assert.equal(jsonBytes(envelope), target);
  return envelope;
};

test("semantic parsers reject provider fields, dangling IDs, and multibyte overflow", () => {
  assert.doesNotThrow(() => parseSemanticBackgroundJob({ version: "v1", executionId: "execution-1", skill: { id: "atlas.semantic.extract", version: "v1" }, contextCapability: "capability" }));
  assert.throws(() => parseSemanticBackgroundJob({ version: "v1", executionId: "execution-1", skill: { id: "atlas.semantic.extract", version: "v1", model: "unsafe" }, contextCapability: "capability" }));
  assert.doesNotThrow(() => parseSemanticExtractionResult(extraction));
  assert.throws(() => parseSemanticExtractionResult({ ...extraction, candidate_assertions: [{ ...extraction.candidate_assertions[0], evidence_refs: [] }] }));
  assert.throws(() => parseSemanticExtractionResult({ ...extraction, source_statement_inventory: [{ ...extraction.source_statement_inventory[0], destination_local_candidate_ids: ["missing"] }] }));
  assert.throws(() => parseSemanticBackgroundJob({ version: "v1", executionId: "x", skill: { id: "atlas.semantic.extract", version: "v1" }, contextCapability: "😀".repeat(semanticLimits.jobBytes) }));
});

test("reconciliation contracts retain bounds and reject malformed envelopes", () => {
  const candidate = { id: "canonical-1", semantic_key: "quota", kind: "rule", normalized_meaning: "quota", payload: {}, evidence_refs: [evidence] };
  assert.doesNotThrow(() => parseSemanticReconciliationContext({ version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: [candidate], priorCandidates: [], selection: selection(1, 0) }));
  assert.doesNotThrow(() => parseSemanticReconciliationResult({ version: "v1", relationships: [{ source_candidate_id: "canonical-1", relationship_type: "new", payload: {}, requires_resolution: false, evidence_refs: [evidence] }], questions: [] }));
  assert.throws(() => parseSemanticResultEnvelope({ version: "v1", scope, skill: { id: "atlas.semantic.extract", version: "v1" }, provider: { provider: "mistral", model: "configured", endpoint: "/v1", latencyMilliseconds: 1, attempt: 1 }, result: { ...extraction, unexpected: true } }));
});

test("all extraction kinds, source-accounting forms, and payload limits are bounded", () => {
  const kinds = ["actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision", "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved"];
  for (const kind of kinds) assert.doesNotThrow(() => parseSemanticExtractionResult({ ...extraction, candidate_assertions: [{ ...extraction.candidate_assertions[0], kind }] }));
  assert.throws(() => parseSemanticExtractionResult({ ...extraction, candidate_assertions: [{ ...extraction.candidate_assertions[0], kind: "accepted_truth" }] }));
  assert.doesNotThrow(() => parseSemanticExtractionResult({ version: "v1", candidate_assertions: [], source_statement_inventory: [{ source_unit_id: "unit-1", page_number: 1, locator_type: "visual_region", locator_id: "visual-1", classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: "decorative" }], questions: [{ question: "Which quota applies?", reason: "The source conflicts.", evidence_refs: [evidence] }] }));
  assert.throws(() => parseSemanticExtractionResult({ ...extraction, candidate_assertions: [{ ...extraction.candidate_assertions[0], evidence_refs: [{ page_number: 1, locator_type: "table", locator_id: "table-1" }] }] }));
  assert.throws(() => parseSemanticExtractionResult({ ...extraction, source_statement_inventory: [] }));
  let nested: unknown = "leaf"; for (let depth = 0; depth < 9; depth += 1) nested = [nested];
  assert.throws(() => parseSemanticExtractionResult({ ...extraction, candidate_assertions: [{ ...extraction.candidate_assertions[0], payload: nested }] }));
  const candidates = Array.from({ length: semanticLimits.currentCandidates }, (_, index) => ({ ...extraction.candidate_assertions[0], local_candidate_id: `local-${index}`, evidence_refs: [{ ...evidence, locator_id: `block-${index}` }] }));
  const inventory = candidates.map((candidate, index) => ({ source_unit_id: `unit-${index}`, page_number: 1, locator_type: "text_block", locator_id: `block-${index}`, classification: "candidate", destination_local_candidate_ids: [candidate.local_candidate_id] }));
  assert.doesNotThrow(() => parseSemanticExtractionResult({ version: "v1", candidate_assertions: candidates, source_statement_inventory: inventory, questions: [] }));
  assert.throws(() => parseSemanticExtractionResult({ version: "v1", candidate_assertions: [...candidates, { ...candidates[0], local_candidate_id: "overflow" }], source_statement_inventory: inventory, questions: [] }));
});

test("all reconciliation relationships and scope binding are validated", () => {
  const relationshipTypes = ["new", "supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution"];
  for (const relationship_type of relationshipTypes) assert.doesNotThrow(() => parseSemanticReconciliationResult({ version: "v1", relationships: [{ source_candidate_id: "canonical-1", relationship_type, ...(relationship_type === "new" ? {} : { target_candidate_id: "canonical-2" }), payload: {}, requires_resolution: relationship_type === "contradicts", evidence_refs: [evidence] }], questions: [] }));
  assert.throws(() => parseSemanticReconciliationResult({ version: "v1", relationships: [{ source_candidate_id: "canonical-1", relationship_type: "new", target_candidate_id: "canonical-2", payload: {}, requires_resolution: false, evidence_refs: [evidence] }], questions: [] }));
  assert.doesNotThrow(() => parseSemanticExtractionContext({ version: "v1", skill: "atlas.semantic.extract", scope, normalizedDocument }));
  assert.throws(() => parseSemanticExtractionContext({ version: "v1", skill: "atlas.semantic.extract", scope: { ...scope, documentId: "other-document" }, normalizedDocument }));
  const contextCandidate = { id: "canonical-1", semantic_key: "quota", kind: "rule", normalized_meaning: "quota", payload: {}, evidence_refs: [evidence] };
  assert.doesNotThrow(() => parseSemanticReconciliationContext({ version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: Array.from({ length: semanticLimits.currentCandidates }, () => contextCandidate), priorCandidates: Array.from({ length: semanticLimits.priorCandidates }, () => contextCandidate), selection: selection(semanticLimits.currentCandidates, semanticLimits.priorCandidates) }));
  assert.throws(() => parseSemanticReconciliationContext({ version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: Array.from({ length: 501 }, () => contextCandidate), priorCandidates: [], selection: selection(501, 0, true) }));
});

test("empty and unresolved extraction outcomes preserve reviewable ambiguity", () => {
  assert.doesNotThrow(() => parseSemanticExtractionResult({ version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] }));
  const unresolved = { ...extraction.candidate_assertions[0], local_candidate_id: "unresolved-1", kind: "unresolved", normalized_meaning: "The approval threshold is unclear.", needs_resolution: true };
  assert.doesNotThrow(() => parseSemanticExtractionResult({ version: "v1", candidate_assertions: [unresolved], source_statement_inventory: [{ ...extraction.source_statement_inventory[0], destination_local_candidate_ids: [unresolved.local_candidate_id] }], questions: [{ question: "Which approval threshold applies?", reason: "The document states conflicting values.", evidence_refs: [evidence] }] }));
});

test("same-document contradictions and prior-neighborhood limits are representable", () => {
  assert.doesNotThrow(() => parseSemanticReconciliationResult({ version: "v1", relationships: [{ source_candidate_id: "current-quota-40", target_candidate_id: "current-quota-45", relationship_type: "contradicts", payload: { same_document: true }, requires_resolution: true, evidence_refs: [evidence] }], questions: [{ question: "Which quota applies?", reason: "Two statements in this document conflict.", evidence_refs: [evidence] }] }));
  const candidate = { id: "prior-1", semantic_key: "quota", kind: "rule", normalized_meaning: "quota", payload: {}, evidence_refs: [evidence] };
  assert.doesNotThrow(() => parseSemanticReconciliationContext({ version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: [], priorCandidates: Array.from({ length: semanticLimits.priorCandidates }, () => candidate), selection: selection(0, semanticLimits.priorCandidates) }));
  assert.throws(() => parseSemanticReconciliationContext({ version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: [], priorCandidates: Array.from({ length: semanticLimits.priorCandidates + 1 }, () => candidate), selection: selection(0, semanticLimits.priorCandidates + 1, true) }));
});

test("context and result-envelope UTF-8 JSON limits accept at limit and reject one byte over", () => {
  assert.doesNotThrow(() => parseSemanticExtractionContext(contextWithBytes(semanticLimits.contextBytes)));
  assert.throws(() => parseSemanticExtractionContext(contextWithBytes(semanticLimits.contextBytes + 1)));
  assert.doesNotThrow(() => parseSemanticReconciliationContext(reconciliationContextWithBytes(semanticLimits.contextBytes)));
  assert.throws(() => parseSemanticReconciliationContext(reconciliationContextWithBytes(semanticLimits.contextBytes + 1)));
  assert.doesNotThrow(() => parseSemanticResultEnvelope(envelopeWithBytes(semanticLimits.resultEnvelopeBytes)));
  assert.throws(() => parseSemanticResultEnvelope(envelopeWithBytes(semanticLimits.resultEnvelopeBytes + 1)));
});

test("canonical Zod schemas are the parser authority and generate Ajv-compatible projections", () => {
  assert.deepEqual(semanticExtractionResultSchema, toAtlasJsonSchema(atlasSemanticExtractionResultV1Schema));
  assert.deepEqual(semanticReconciliationResultSchema, toAtlasJsonSchema(atlasSemanticReconciliationResultV1Schema));
  assert.doesNotThrow(() => validateJsonSchema(semanticExtractionResultSchema, extraction));
  assert.doesNotThrow(() => validateJsonSchema(semanticReconciliationResultSchema, { version: "v1", relationships: [], questions: [] }));
  assert.throws(() => atlasSemanticExtractionResultV1Schema.parse({ ...extraction, candidate_assertions: [{ ...extraction.candidate_assertions[0], evidence_refs: [] }] }));
  assert.throws(() => atlasSemanticReconciliationResultV1Schema.parse({ version: "v1", relationships: [{ source_candidate_id: "candidate-1", relationship_type: "new", target_candidate_id: "candidate-2", payload: {}, requires_resolution: false, evidence_refs: [evidence] }], questions: [] }));
});
