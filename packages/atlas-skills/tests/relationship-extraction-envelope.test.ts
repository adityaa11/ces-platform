import assert from "node:assert/strict";
import test from "node:test";
import { materializeProvisionalRelationshipRevisions } from "../src/relationship-extraction-envelope.ts";
import type { ContextSourceRelationshipRevisionV1, ProvisionalRelationshipRepository, ProvisionalRelationshipStageV1, RelationshipPacketIdentity, TrustedFinalizationSlot } from "../src/relationship-provenance.ts";

const sourceSha256 = "a".repeat(64);
const packetIdentity: RelationshipPacketIdentity = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: "execution-1", artifactId: "artifact-1", sourceSha256 };
const sourceSlots: readonly TrustedFinalizationSlot[] = [
  { slot: "slot-000001", pageNumber: 1, locatorType: "table", locatorId: "table-1", sourceSha256, role: "owned_source" },
  { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region", locatorId: "legend-1", sourceSha256, role: "reference_context", assetIdentity: { assetRef: "asset-1", sha256: "b".repeat(64), sourceSha256 } },
] as const;

const validEnvelope = () => ({
  contract_version: "atlas.relationship-extraction-envelope/v1",
  semantic_proposal: { version: "v1", source_results: [
    { slot: "slot-000001", classification: "candidate", candidates: [{ semantic_key: "revenue", kind: "business_property", normalized_meaning: "Revenue is reported.", needs_resolution: false, payload: {} }], non_fact_reason: null, questions: [] },
    { slot: "slot-000002", classification: "non_fact", candidates: [], non_fact_reason: "context only", questions: [] },
  ] },
  relationship_proposals: [{ owned_source_slot: "slot-000001", context_source_slot: "slot-000002", source_evidence_slots: ["slot-000001", "slot-000002"], relationship_type: "context_qualifies", direction: "context_to_owned", contextual_role: "legend", necessity: "essential", uncertainty: "medium", proposed_meaning: "The legend qualifies the table.", source_language: "en", candidate_refs: [{ source_slot: "slot-000001", candidate_index: 0 }], predecessor: null }],
});

class InMemoryRepository implements ProvisionalRelationshipRepository {
  readonly revisions = new Map<string, ContextSourceRelationshipRevisionV1>();
  readonly staged = new Map<string, ProvisionalRelationshipStageV1>();
  appendCalls = 0;
  async appendForExecution(input: { readonly executionId: string; readonly sourceSnapshot: RelationshipPacketIdentity; readonly revisions: readonly ContextSourceRelationshipRevisionV1[] }) {
    this.appendCalls += 1;
    return input.revisions.map((revision) => {
      const existing = this.revisions.get(`${input.executionId}:${revision.revisionHash}`);
      if (existing && JSON.stringify(existing) !== JSON.stringify(revision)) throw new Error("same lineage/revision conflict");
      this.revisions.set(`${input.executionId}:${revision.revisionHash}`, revision);
      return existing ?? revision;
    });
  }
  async loadForSnapshot(input: { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly sourceSha256: string }) {
    return [...this.revisions.values()].filter((revision) => revision.scope.projectId === input.projectId && revision.scope.workspaceId === input.workspaceId && revision.scope.bundleId === input.bundleId && revision.scope.documentId === input.documentId && revision.scope.sourceSha256 === input.sourceSha256);
  }
  async stageSidecar(input: ProvisionalRelationshipStageV1) {
    const key = `${input.executionId}:${input.idempotencyKey}`;
    const existing = this.staged.get(key);
    if (existing && existing.sidecarHash !== input.sidecarHash) throw new Error("sidecar conflict");
    this.staged.set(key, existing ?? input);
    return existing ?? input;
  }
  async loadStagedSidecar(input: { readonly executionId: string; readonly idempotencyKey: string }) { return this.staged.get(`${input.executionId}:${input.idempotencyKey}`); }
}

const materialize = (repository = new InMemoryRepository(), envelope: unknown = validEnvelope(), slots = sourceSlots) => materializeProvisionalRelationshipRevisions({ envelope, packetIdentity, sourceSlots: slots, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1, runId: "run-1" }, repository });

test("REL-01 materializes deterministic, source-verified proposed revisions without authority", async () => {
  const repository = new InMemoryRepository();
  const first = await materialize(repository);
  const second = await materialize(repository);
  assert.deepEqual(second.revisions, first.revisions);
  assert.equal(repository.revisions.size, 1);
  const revision = first.revisions[0]!;
  assert.equal(revision.disposition, "proposed");
  assert.equal(revision.authorization, null);
  assert.equal(revision.scope.sourceSha256, sourceSha256);
  assert.deepEqual(revision.ownedSource, { slot: "slot-000001", pageNumber: 1, locatorType: "table", locatorId: "table-1", sourceSha256 });
  assert.equal(revision.contextSource.assetIdentity?.sha256, "b".repeat(64));
  assert.equal(revision.proposalProvenance.providerRelationshipOrdinal, 0);
  assert.equal(revision.proposalProvenance.confidence, null);
  const stage: ProvisionalRelationshipStageV1 = { executionId: packetIdentity.executionId, idempotencyKey: "same-request", sidecarHash: revision.revisionHash, revisions: first.revisions };
  assert.deepEqual(await repository.stageSidecar(stage), await repository.stageSidecar(stage));
  assert.equal((await repository.loadStagedSidecar({ executionId: packetIdentity.executionId, idempotencyKey: "same-request" }))?.sidecarHash, revision.revisionHash);
});

test("REL-01 rejects malformed, foreign, authority-bearing, and unresolvable provider values before append", async () => {
  const mutations: readonly [string, (value: any) => unknown, ReadonlyArray<TrustedFinalizationSlot>?][] = [
    ["unknown field", (value) => ({ ...value, accepted: true })],
    ["fenced response", () => "```json\\n{}\\n```"],
    ["malformed decoded envelope object", (value) => ({ ...value, relationship_proposals: [null] })],
    ["noncanonical enum", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], necessity: "accepted" }] })],
    ["missing relationship slot", (value) => {
      const { context_source_slot: _omitted, ...proposal } = value.relationship_proposals[0];
      return { ...value, relationship_proposals: [proposal] };
    }],
    ["foreign source", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], context_source_slot: "foreign", source_evidence_slots: ["slot-000001", "foreign"] }] })],
    ["wrong evidence pair", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], source_evidence_slots: ["slot-000002", "slot-000001"] }] })],
    ["dangling candidate", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], candidate_refs: [{ source_slot: "slot-000001", candidate_index: 4 }] }] })],
    ["forged predecessor", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], predecessor: { relationship_revision_hash: "c".repeat(64), relation: "refines" } }] })],
    ["accepted claim", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], disposition: "accepted" }] })],
    ["confirmed claim", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], disposition: "confirmed" }] })],
    ["published claim", (value) => ({ ...value, relationship_proposals: [{ ...value.relationship_proposals[0], disposition: "published" }] })],
    ["duplicate relationship", (value) => ({ ...value, relationship_proposals: [value.relationship_proposals[0], value.relationship_proposals[0]] })],
    ["duplicate source slots", (value) => value, [sourceSlots[0]!, sourceSlots[0]!]],
    ["source SHA mismatch", (value) => value, [{ ...sourceSlots[0]!, sourceSha256: "d".repeat(64) }, sourceSlots[1]!]],
    ["asset mismatch", (value) => value, [{ ...sourceSlots[0]! }, { ...sourceSlots[1]!, assetIdentity: { assetRef: "asset-1", sha256: "b".repeat(64), sourceSha256: "e".repeat(64) } }]],
  ];
  for (const [name, mutate, slots] of mutations) {
    const repository = new InMemoryRepository();
    await assert.rejects(materialize(repository, mutate(validEnvelope()), slots ?? sourceSlots), name);
    assert.equal(repository.appendCalls, 0, `${name} reached append`);
  }
});

test("REL-01 records only provisional local data and makes no provider or job interaction", async () => {
  const result = await materialize();
  const serialized = JSON.stringify(result);
  assert.match(serialized, /"disposition":"proposed"/);
  assert.doesNotMatch(serialized, /accepted|confirmed|published|local_candidate_id|visual-owned|semantic correctness/i);
});
