import assert from "node:assert/strict";
import test from "node:test";
import { finalizeRelationshipExtractionEnvelope, type RelationshipFinalizationSlot } from "../src/semantic-relationship-sidecar.ts";
import type { ContextSourceRelationshipRevisionV1, ProvisionalRelationshipRepository, ProvisionalRelationshipStageV1, RelationshipPacketIdentity } from "@atlas/skills";

const sourceSha256 = "a".repeat(64);
const packetIdentity: RelationshipPacketIdentity = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: "perception-execution", artifactId: "document", sourceSha256 };
const sourceSlots: readonly RelationshipFinalizationSlot[] = [
  { slot: "slot-000001", pageNumber: 1, locatorType: "table", locatorId: "table-1", sourceSha256, content: "Account must be active." },
  { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region", locatorId: "legend-1", sourceSha256, content: "Active means green.", role: "reference_context", assetIdentity: { assetRef: "derived/legend-1", sha256: "b".repeat(64), sourceSha256 } },
];
const envelope = (necessity: "essential" | "optional" = "essential") => ({ contract_version: "atlas.relationship-extraction-envelope/v1", semantic_proposal: { version: "v1", source_results: [
  { slot: "slot-000001", classification: "candidate", candidates: [{ semantic_key: "account", kind: "rule", payload: {}, normalized_meaning: "Account must be active.", needs_resolution: false }, { semantic_key: "owner", kind: "business_property", payload: {}, normalized_meaning: "Account has an owner.", needs_resolution: false }], non_fact_reason: null, questions: [] },
], }, relationship_proposals: [{ owned_source_slot: "slot-000001", context_source_slot: "slot-000002", source_evidence_slots: ["slot-000001", "slot-000002"], relationship_type: "context_qualifies", direction: "context_to_owned", contextual_role: "legend", necessity, uncertainty: "low", proposed_meaning: "Legend qualifies the rule.", source_language: "en", candidate_refs: [{ source_slot: "slot-000001", candidate_index: 0 }], predecessor: null }] });

class Repository implements ProvisionalRelationshipRepository {
  readonly revisions = new Map<string, ContextSourceRelationshipRevisionV1>(); readonly stages = new Map<string, ProvisionalRelationshipStageV1>();
  async appendForExecution(input: { readonly executionId: string; readonly sourceSnapshot: RelationshipPacketIdentity; readonly revisions: readonly ContextSourceRelationshipRevisionV1[] }) { return input.revisions.map((revision) => { const key = `${input.executionId}:${revision.revisionHash}`; const existing = this.revisions.get(key); this.revisions.set(key, existing ?? revision); return existing ?? revision; }); }
  async loadForSnapshot(input: { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly sourceSha256: string }) { return [...this.revisions.values()].filter((revision) => revision.scope.projectId === input.projectId && revision.scope.workspaceId === input.workspaceId && revision.scope.bundleId === input.bundleId && revision.scope.documentId === input.documentId && revision.scope.sourceSha256 === input.sourceSha256); }
  async stageSidecar(input: ProvisionalRelationshipStageV1) { const key = `${input.executionId}:${input.idempotencyKey}`; const existing = this.stages.get(key); if (existing && existing.sidecarHash !== input.sidecarHash) throw new Error("sidecar conflict"); this.stages.set(key, existing ?? input); return existing ?? input; }
  async loadStagedSidecar(input: { readonly executionId: string; readonly idempotencyKey: string }) { return this.stages.get(`${input.executionId}:${input.idempotencyKey}`); }
}
const finalize = (repository = new Repository(), value = envelope()) => finalizeRelationshipExtractionEnvelope({ envelope: value, sourceSlots, provisionalRevisions: [], repository, packetIdentity, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1, runId: "run-1" }, executionId: "semantic-execution", idempotencyKey: "same-key" });

test("REL-03 defers only essential dependent tuples while preserving independent canonical output", async () => {
  const result = await finalize();
  assert.deepEqual(result.canonicalResult.candidate_assertions.map((candidate) => candidate.local_candidate_id), ["candidate-slot-000001-002"]);
  assert.equal(result.sidecar.deferred_interpretations.length, 1);
  assert.equal(result.sidecar.deferred_interpretations[0]?.canonical_candidate_id, null);
  assert.equal(result.canonicalResult.source_statement_inventory[0]?.classification, "candidate");
  assert.equal(result.sidecar.revisions[0]?.disposition, "proposed");
});

test("REL-03 binds optional independent candidates, converges replay, and rejects forged identity or execution conflation", async () => {
  const repository = new Repository(); const first = await finalize(repository, envelope("optional")); const second = await finalize(repository, envelope("optional"));
  assert.deepEqual(second.sidecar, first.sidecar); assert.equal(first.sidecar.bindings.length, 1); assert.equal(repository.revisions.size, 1);
  await assert.rejects(() => finalizeRelationshipExtractionEnvelope({ envelope: envelope(), sourceSlots, provisionalRevisions: [], repository: new Repository(), packetIdentity, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1 }, executionId: "perception-execution", idempotencyKey: "key" }), /must not be conflated/);
  await assert.rejects(() => finalizeRelationshipExtractionEnvelope({ envelope: { ...envelope(), packetIdentity }, sourceSlots, provisionalRevisions: [], repository: new Repository(), packetIdentity, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1 }, executionId: "semantic-execution", idempotencyKey: "key" }), /unrecognized|failed/i);
});
