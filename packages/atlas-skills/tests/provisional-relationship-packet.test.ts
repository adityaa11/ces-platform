import assert from "node:assert/strict";
import test from "node:test";
import { buildRelationshipExtractionRequestPacket } from "../src/relationship-extraction-envelope.ts";
import { buildProvisionalRelationshipPacketExtension, loadProvisionalRelationshipPacketExtension } from "../src/provisional-relationship-packet.ts";
import { relationshipContractVersion, relationshipSha256, type ContextSourceRelationshipRevisionV1, type RelationshipPacketIdentity, type TrustedFinalizationSlot } from "../src/relationship-provenance.ts";

const sourceSha256 = "a".repeat(64);
const snapshot: RelationshipPacketIdentity = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: "execution-1", artifactId: "artifact-1", sourceSha256 };
const sourceSlots: readonly TrustedFinalizationSlot[] = [
  { slot: "slot-000001", pageNumber: 1, locatorType: "table", locatorId: "table-1", sourceSha256, role: "owned_source" },
  { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region", locatorId: "legend-1", sourceSha256, role: "reference_context", assetIdentity: { assetRef: "asset-1", sha256: "b".repeat(64), sourceSha256 } },
] as const;

const revision = (overrides: Record<string, unknown> = {}): ContextSourceRelationshipRevisionV1 => {
  const immutable = {
    contractVersion: relationshipContractVersion,
    relationshipLineageId: relationshipSha256({ lineage: "relation-1" }),
    scope: snapshot,
    normalizedDocument: { executionId: snapshot.executionId, artifactId: snapshot.artifactId, sourceSha256 },
    ownedSource: { slot: "slot-000001", pageNumber: 1, locatorType: "table" as const, locatorId: "table-1", sourceSha256 },
    contextSource: { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region" as const, locatorId: "legend-1", sourceSha256, assetIdentity: { assetRef: "asset-1", sha256: "b".repeat(64), sourceSha256 } },
    relationship: { type: "context_qualifies" as const, direction: "context_to_owned" as const, contextualRole: "legend" as const, necessity: "essential" as const },
    disposition: "proposed" as const,
    uncertainty: "medium" as const,
    proposedMeaning: "Legend qualifies table.",
    sourceLanguage: "en",
    candidateRefs: [],
    proposalProvenance: { providerIdentity: "offline:fixture:test", providerRun: "run-1", providerRelationshipOrdinal: 0, confidence: null },
    predecessor: null,
    authorization: null,
    ...overrides,
  } as ContextSourceRelationshipRevisionV1;
  const { revisionHash: _ignored, ...hashable } = immutable;
  return { ...immutable, revisionHash: relationshipSha256(hashable) };
};

test("REL-02 projects an empty first extraction and sorts attributable proposed revisions deterministically", () => {
  const empty = buildProvisionalRelationshipPacketExtension({ sourceSnapshot: snapshot, sourceSlots, revisions: [] });
  assert.deepEqual(empty, { contract_version: "atlas.relationship-packet-extension/v1", relationships: [] });
  const first = revision();
  const second = revision({ relationshipLineageId: relationshipSha256({ lineage: "relation-2" }) });
  const unresolved = revision({ relationshipLineageId: relationshipSha256({ lineage: "relation-3" }), disposition: "unresolved" });
  const firstPacket = buildProvisionalRelationshipPacketExtension({ sourceSnapshot: snapshot, sourceSlots, revisions: [second, unresolved, first] });
  const replay = buildProvisionalRelationshipPacketExtension({ sourceSnapshot: snapshot, sourceSlots, revisions: [first, unresolved, second] });
  assert.deepEqual(firstPacket, replay);
  const firstProjected = firstPacket.relationships.find((item) => item.revision_hash === first.revisionHash);
  assert.deepEqual(firstProjected?.source_evidence_slots, ["slot-000001", "slot-000002"]);
  assert.deepEqual(firstProjected, { relationship_lineage_id: first.relationshipLineageId, revision_hash: first.revisionHash, owned_source_slot: "slot-000001", context_source_slot: "slot-000002", contextual_role: "legend", necessity: "essential", uncertainty: "medium", disposition: "proposed", source_evidence_slots: ["slot-000001", "slot-000002"] });
  assert.equal(firstPacket.relationships.find((item) => item.revision_hash === unresolved.revisionHash)?.disposition, "unresolved");
});

test("REL-02 loads only the exact stored snapshot slice and composes an opt-in body without authority", async () => {
  const calls: unknown[] = [];
  const packet = await loadProvisionalRelationshipPacketExtension({ sourceSnapshot: snapshot, sourceSlots, repository: { async loadForSnapshot(input) { calls.push(input); return [revision()]; } } });
  assert.deepEqual(calls, [{ projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", sourceSha256 }]);
  const request = buildRelationshipExtractionRequestPacket({ sourceSlots, provisionalRelationships: packet });
  assert.deepEqual(Object.keys(request).sort(), ["provisional_relationships", "source_slots"]);
  const serialized = JSON.stringify(packet);
  assert.match(serialized, /"disposition":"proposed"/);
  assert.doesNotMatch(serialized, /accepted|authorization|attestation|candidate|assetRef|proposedMeaning|sourceLanguage/i);
});

test("REL-02 rejects foreign, stale, malformed, duplicate, unsupported, and authority-bearing revisions", () => {
  const base = revision();
  const cases: readonly [string, ContextSourceRelationshipRevisionV1[], readonly TrustedFinalizationSlot[]][] = [
    ["foreign scope", [revision({ scope: { ...snapshot, workspaceId: "foreign" } })], sourceSlots],
    ["stale normalized document", [revision({ normalizedDocument: { ...base.normalizedDocument, executionId: "old" } })], sourceSlots],
    ["foreign source SHA", [revision({ scope: { ...snapshot, sourceSha256: "c".repeat(64) } })], sourceSlots],
    ["absent locator", [revision({ ownedSource: { ...base.ownedSource, slot: "missing" } })], sourceSlots],
    ["asset mismatch", [revision({ contextSource: { ...base.contextSource, assetIdentity: { ...base.contextSource.assetIdentity!, sha256: "d".repeat(64) } } })], sourceSlots],
    ["malformed hash", [{ ...base, revisionHash: "not-a-hash" }], sourceSlots],
    ["tampered immutable content", [{ ...base, uncertainty: "high" }], sourceSlots],
    ["duplicate revision", [base, base], sourceSlots],
    ["accepted disposition", [revision({ disposition: "accepted" })], sourceSlots],
    ["authority field", [revision({ accepted: true })], sourceSlots],
    ["foreign current slot", [base], [{ ...sourceSlots[0]!, sourceSha256: "e".repeat(64) }, sourceSlots[1]!]],
  ];
  for (const [name, revisions, slots] of cases) assert.throws(() => buildProvisionalRelationshipPacketExtension({ sourceSnapshot: snapshot, sourceSlots: slots, revisions }), name);
});
