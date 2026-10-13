import assert from "node:assert/strict";
import test from "node:test";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket, InMemoryProvisionalSemanticSidecarRepository, prepareProvisionalSemanticSidecar } from "../src/index.ts";

const sourceSha256 = "a".repeat(64);
const scope = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: "semantic-execution-1", sourceSha256 };
const request = () => buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document: { version: "v1", executionId: "perception-execution-1", artifactId: "document-1", sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "pdf", executionId: "perception-execution-1", processedAt: "2026-10-13T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text-1", text: "Independent fact." }], tables: [], visualRegions: [{ id: "visual-1" }] }] } }));
const canonical = { version: "v1", candidate_assertions: [{ local_candidate_id: "candidate-1", semantic_key: "fact", kind: "business_object", normalized_meaning: "Independent fact.", needs_resolution: false, payload: {}, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "text-1", excerpt: "Independent fact." }] }], source_statement_inventory: [{ source_unit_id: "source-1", page_number: 1, locator_type: "text_block", locator_id: "text-1", classification: "candidate", destination_local_candidate_ids: ["candidate-1"] }], questions: [] };

test("accounting retains meaningful pending visuals beside a complete independent V1 candidate", () => {
  const built = request(); const sidecar = prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: canonical, relationshipRevisions: [] });
  assert.equal(sidecar.sourceAccounting.length, 2);
  assert.equal(sidecar.sourceAccounting.find((item) => item.locatorId === "visual-1")?.disposition, "pending_unexamined_visual");
  assert.deepEqual(sidecar.authority, { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false });
  assert.equal(prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: canonical, relationshipRevisions: [] }).sidecarHash, sidecar.sidecarHash);
});

test("zero visual and empty provisional relationships need no verifier", () => {
  const noVisual = buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document: { version: "v1", executionId: "perception-execution-1", artifactId: "document-1", sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "pdf", executionId: "perception-execution-1", processedAt: "2026-10-13T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text-1", text: "Independent fact." }], tables: [], visualRegions: [] }] } }));
  assert.doesNotThrow(() => prepareProvisionalSemanticSidecar({ scope, request: noVisual, canonicalResult: canonical, relationshipRevisions: [] }));
});

test("fake fenced staging is replay-stable and rejects mismatches", () => {
  const built = request();
  const sidecar = prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: canonical, relationshipRevisions: [] }); const repository = new InMemoryProvisionalSemanticSidecarRepository();
  const first = repository.acquireLease(scope, "key-1"); const winner = repository.stage({ sidecar, idempotencyKey: "key-1", lease: first });
  assert.throws(() => repository.acknowledge({ sidecar: winner, idempotencyKey: "key-1", failAfterCommit: true }), /ACK_LOSS_SIMULATED/);
  const replay = repository.acquireLease(scope, "key-1"); assert.equal(repository.stage({ sidecar, idempotencyKey: "key-1", lease: replay }).sidecarHash, winner.sidecarHash);
  assert.throws(() => repository.stage({ sidecar: { ...sidecar, sidecarHash: "b".repeat(64) }, idempotencyKey: "key-1", lease: replay }), /staged winner/);
  assert.throws(() => repository.stage({ sidecar, idempotencyKey: "key-1", lease: first }), /stale lease/);
  assert.throws(() => prepareProvisionalSemanticSidecar({ scope: { ...scope, sourceSha256: "b".repeat(64) }, request: built, canonicalResult: canonical, relationshipRevisions: [] }), /source SHA/);
  const foreign = { revisionHash: "c".repeat(64), sourceSnapshot: built.sourceSnapshot };
  assert.throws(() => prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: canonical, relationshipRevisions: [foreign] }), /not represented/);
  assert.throws(() => prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: canonical, relationshipRevisions: [foreign, foreign] }), /duplicated/);
});
