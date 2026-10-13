import assert from "node:assert/strict";
import test from "node:test";
import { atlasProviderExtractionProposalV1Schema, relationshipSha256, type ContextSourceRelationshipRevisionV1, type RelationshipPacketIdentity, type TrustedFinalizationSlot } from "@atlas/skills";
import { prepareDeferredDependentInterpretations } from "../src/semantic-relationship-sidecar.ts";

const sourceSha256 = "a".repeat(64);
const scope: RelationshipPacketIdentity = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: "perception-execution", artifactId: "artifact", sourceSha256 };
const slots: readonly TrustedFinalizationSlot[] = [
  { slot: "slot-000001", pageNumber: 1, locatorType: "table", locatorId: "table-1", sourceSha256 },
  { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region", locatorId: "legend-1", sourceSha256, role: "reference_context", assetIdentity: { assetRef: "derived/legend-1", sha256: "b".repeat(64), sourceSha256 } },
];
const proposal = atlasProviderExtractionProposalV1Schema.parse({ version: "v1", source_results: [{ slot: "slot-000001", classification: "candidate", candidates: [
  { semantic_key: "account", kind: "rule", payload: { qualifier: "green" }, normalized_meaning: "Account must be active when green.", needs_resolution: false },
  { semantic_key: "owner", kind: "business_property", payload: {}, normalized_meaning: "Account has an owner.", needs_resolution: false },
], non_fact_reason: null, questions: [] }] });
function revision(necessity: "essential" | "optional" = "essential", candidateIndex = 0): ContextSourceRelationshipRevisionV1 {
  const relationship = { type: "context_qualifies" as const, direction: "context_to_owned" as const, contextualRole: "legend" as const, necessity };
  return { contractVersion: "atlas.context-provenance/v1", relationshipLineageId: `lineage-${necessity}-${candidateIndex}`, revisionHash: relationshipSha256({ scope, relationship, candidateIndex }), scope, normalizedDocument: { executionId: scope.executionId, artifactId: scope.artifactId, sourceSha256 }, ownedSource: { slot: "slot-000001", pageNumber: 1, locatorType: "table", locatorId: "table-1", sourceSha256 }, contextSource: { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region", locatorId: "legend-1", sourceSha256, assetIdentity: { assetRef: "derived/legend-1", sha256: "b".repeat(64), sourceSha256 } }, relationship, disposition: "proposed", uncertainty: "medium", proposedMeaning: "Legend qualifies the rule.", sourceLanguage: "en", candidateRefs: [{ sourceSlot: "slot-000001", candidateIndex }], proposalProvenance: { providerIdentity: "offline", providerRun: "run-1", providerRelationshipOrdinal: candidateIndex, confidence: null }, predecessor: null, authorization: null };
}
const prepare = (revisions: readonly ContextSourceRelationshipRevisionV1[]) => prepareDeferredDependentInterpretations({ semanticProposal: proposal, sourceSlots: slots, scope, provisionalRelationshipRevisions: revisions });

test("REL-03 preserves full essential dependent meaning and deterministically separates independent tuples", () => {
  const first = prepare([revision()]); const second = prepare([revision()]);
  assert.deepEqual(second, first); assert.deepEqual(first.independent_candidate_tuples, [{ source_slot: "slot-000001", candidate_index: 1 }]); assert.deepEqual(first.optional_relationship_tuples, []);
  assert.deepEqual(first.deferred_interpretations[0], { deferred_interpretation_id: relationshipSha256({ scope, sourceSlot: "slot-000001", candidateIndex: 0, relationshipRevisionHash: revision().revisionHash }), relationship_revision_hash: revision().revisionHash, provider_candidate_tuple: { source_slot: "slot-000001", candidate_index: 0 }, source: { owned_source: revision().ownedSource, context_source: revision().contextSource }, uncertainty: "medium", proposed_candidate_meaning: proposal.source_results[0]!.candidates[0], reason: "essential_provisional_relationship", canonical_candidate_id: null });
});
test("REL-03 keeps optional relationship tuples distinct from independent and deferred tuples", () => {
  const result = prepare([revision("optional", 0)]);
  assert.deepEqual(result.deferred_interpretations, []); assert.deepEqual(result.optional_relationship_tuples, [{ source_slot: "slot-000001", candidate_index: 0 }]); assert.deepEqual(result.independent_candidate_tuples, [{ source_slot: "slot-000001", candidate_index: 1 }]);
});
test("REL-03 rejects malformed, foreign, duplicate, conflicting, and mismatched immutable inputs", () => {
  const cases: readonly [string, () => unknown][] = [
    ["duplicate revision", () => prepare([revision(), revision()])], ["conflicting tuple", () => prepare([revision(), revision("optional", 0)])], ["foreign scope", () => prepare([{ ...revision(), scope: { ...scope, documentId: "foreign" } }])], ["mismatched source", () => prepare([{ ...revision(), ownedSource: { ...revision().ownedSource, locatorId: "forged" } }])], ["unowned tuple", () => prepare([{ ...revision(), candidateRefs: [{ sourceSlot: "slot-000002", candidateIndex: 0 }] }])], ["out of range tuple", () => prepare([{ ...revision(), candidateRefs: [{ sourceSlot: "slot-000001", candidateIndex: 2 }] }])], ["foreign proposal result", () => prepareDeferredDependentInterpretations({ semanticProposal: { ...proposal, source_results: [{ ...proposal.source_results[0]!, slot: "foreign" }] }, sourceSlots: slots, scope, provisionalRelationshipRevisions: [] })],
  ];
  for (const [name, run] of cases) assert.throws(run, /REL-03 deferred interpretation preparation failed/, name);
});
test("REL-03 remains a pure data transformation with no canonical, repository, provider, or staging input", () => {
  const result = prepare([revision()]); assert.equal(result.deferred_interpretations[0]!.canonical_candidate_id, null);
});
