import assert from "node:assert/strict";
import test from "node:test";
import { parseSemanticBackgroundJob, parseSemanticExtractionResult, parseSemanticReconciliationContext, parseSemanticReconciliationResult, parseSemanticResultEnvelope, semanticLimits } from "../src/index.ts";

const scope = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: "execution-1", contractVersion: "v1" };
const evidence = { page_number: 1, locator_type: "text_block", locator_id: "block-1", excerpt: "quota is 40" };
const extraction = { version: "v1", candidate_assertions: [{ local_candidate_id: "local-1", semantic_key: "quota", kind: "rule", payload: { value: 40 }, normalized_meaning: "quota is 40", source_wording: "quota is 40", needs_resolution: false, evidence_refs: [evidence] }], source_statement_inventory: [{ source_unit_id: "unit-1", page_number: 1, locator_type: "text_block", locator_id: "block-1", classification: "candidate", destination_local_candidate_ids: ["local-1"] }], questions: [] };

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
  assert.doesNotThrow(() => parseSemanticReconciliationContext({ version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: [candidate], priorCandidates: [], selection: { policy: "semantic-key-kind", overflow: false, selectedCount: 0 } }));
  assert.doesNotThrow(() => parseSemanticReconciliationResult({ version: "v1", relationships: [{ source_candidate_id: "canonical-1", relationship_type: "new", payload: {}, requires_resolution: false, evidence_refs: [evidence] }], questions: [] }));
  assert.throws(() => parseSemanticResultEnvelope({ version: "v1", scope, skill: { id: "atlas.semantic.extract", version: "v1" }, provider: { provider: "mistral", model: "configured", endpoint: "/v1", latencyMilliseconds: 1, attempt: 1 }, result: { ...extraction, unexpected: true } }));
});
