import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSemanticFingerprint } from "../src/semantic-authority.ts";

const envelope = {
  version: "v1",
  scope: { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: "execution", contractVersion: "v1" },
  skill: { id: "atlas.semantic.extract", version: "v1" },
  provider: { provider: "test", model: "test", endpoint: "internal", latencyMilliseconds: 1, attempt: 1 },
  result: { version: "v1", candidate_assertions: [{ local_candidate_id: "candidate", semantic_key: "key", kind: "rule", payload: { nested: "one" }, normalized_meaning: "meaning", needs_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block", excerpt: "evidence" }] }], source_statement_inventory: [], questions: [] },
} as const;

test("semantic completion fingerprint recursively binds scope, provenance, and result content", () => {
  assert.equal(canonicalSemanticFingerprint(envelope), canonicalSemanticFingerprint({ ...envelope, provider: { ...envelope.provider }, result: { ...envelope.result, candidate_assertions: [...envelope.result.candidate_assertions] } }));
  assert.notEqual(canonicalSemanticFingerprint(envelope), canonicalSemanticFingerprint({ ...envelope, scope: { ...envelope.scope, projectId: "other-project" } }));
  assert.notEqual(canonicalSemanticFingerprint(envelope), canonicalSemanticFingerprint({ ...envelope, provider: { ...envelope.provider, model: "other-model" } }));
  assert.notEqual(canonicalSemanticFingerprint(envelope), canonicalSemanticFingerprint({ ...envelope, result: { ...envelope.result, candidate_assertions: [{ ...envelope.result.candidate_assertions[0], payload: { nested: "changed" } }] } }));
});
