import assert from "node:assert/strict";
import test from "node:test";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket, prepareProvisionalSemanticCompositeAccounting, prepareQualifiedStepwiseSemanticCompositeAccounting, relationshipSha256 } from "@atlas/skills";
import { projectQualifiedStepwiseSemanticResult } from "../src/semantic-extraction-finalizer.js";
import { prepareQualifiedStepwiseSemanticPreparation, prepareStepwiseRel03Interoperability, projectStepwiseSlotsForRel03 } from "../src/semantic-relationship-interoperability-bridge.js";

const sourceSha256 = "a".repeat(64);
const relationshipScope = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: "perception-execution", artifactId: "document", sourceSha256 };
const semanticScope = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: "semantic-execution", sourceSha256 };
const visualAsset = { assetRef: "derived/legend", sha256: "b".repeat(64), sourceSha256 } as const;
const document = () => ({ version: "v1" as const, executionId: relationshipScope.executionId, artifactId: "document", sourceSha256, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "docling", processor: "pdf", executionId: relationshipScope.executionId, processedAt: "2026-10-13T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "a-owned", text: "Owned fact." }], tables: [], visualRegions: [{ id: "z-legend", label: "Legend.", assetRef: visualAsset.assetRef }] }] });
const request = () => buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document: document(), assetIdentities: [{ pageNumber: 1, locatorId: "z-legend", ...visualAsset }] }));
const requestWithPrior = (revision: ReturnType<typeof bridge>["currentResponseRevisions"][number]) => buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document: document(), assetIdentities: [{ pageNumber: 1, locatorId: "z-legend", ...visualAsset }], provisionalRelationships: [{ relationshipLineageId: revision.relationshipLineageId, revisionHash: revision.revisionHash, normalizedDocument: revision.normalizedDocument, ownedSource: { pageNumber: revision.ownedSource.pageNumber, locatorType: revision.ownedSource.locatorType, locatorId: revision.ownedSource.locatorId }, contextSource: { pageNumber: revision.contextSource.pageNumber, locatorType: revision.contextSource.locatorType, locatorId: revision.contextSource.locatorId }, contextualRole: revision.relationship.contextualRole, necessity: revision.relationship.necessity, uncertainty: revision.uncertainty, disposition: revision.disposition, authorization: null }] }));
const canonical = (candidateAssertions: readonly unknown[], inventory: readonly unknown[]) => ({ version: "v1", candidate_assertions: candidateAssertions, source_statement_inventory: inventory, questions: [] });
const candidate = (id: string, locator: string) => ({ local_candidate_id: id, semantic_key: id, kind: "business_object", normalized_meaning: id, needs_resolution: false, payload: {}, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: locator, excerpt: locator }] });
const raw = (relationship: boolean, ownedCandidates = 1) => ({ contract_version: "atlas.relationship-extraction-envelope/v1", semantic_proposal: { version: "v1", source_results: [{ slot: "slot-000001", classification: ownedCandidates === 0 ? "non_fact" : "candidate", candidates: Array.from({ length: ownedCandidates }, (_, index) => ({ semantic_key: `owned-${index}`, kind: "business_object", payload: {}, normalized_meaning: `Owned ${index}`, needs_resolution: false })), non_fact_reason: ownedCandidates === 0 ? "No candidate." : null, questions: [] }] }, relationship_proposals: relationship ? [{ owned_source_slot: "slot-000001", context_source_slot: "slot-000002", source_evidence_slots: ["slot-000001", "slot-000002"], relationship_type: "context_qualifies", direction: "context_to_owned", contextual_role: "legend", necessity: "essential", uncertainty: "medium", proposed_meaning: "Context qualifies owned.", source_language: "en", candidate_refs: [{ source_slot: "slot-000001", candidate_index: 0 }], predecessor: null }] : [] });
const bridge = (response: unknown) => prepareStepwiseRel03Interoperability({ request: request(), rawResponse: response, relationshipScope, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1, runId: "run" }, trustedPriorRevisions: [] });

test("RC-INT-001: independent extraction composes with distinct executions and pending asset identity", () => {
  const prepared = bridge(raw(false, 0)); const req = request();
  const composite = prepareProvisionalSemanticCompositeAccounting({ scope: semanticScope, request: req, canonicalResult: canonical([], [{ source_unit_id: "owned", page_number: 1, locator_type: "text_block", locator_id: "a-owned", classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: "No candidate." }]), relationshipRevisions: [], currentResponseRelationshipRevisions: prepared.currentResponseRevisions, providerCandidateTuples: [], independentCandidateTuples: prepared.qualified.independent_candidate_tuples.map((item) => ({ sourceSlot: item.source_slot, candidateIndex: item.candidate_index })), optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: [] });
  assert.equal(composite.scope.executionId, "semantic-execution"); assert.notEqual(composite.scope.executionId, relationshipScope.executionId); assert.equal(prepared.currentResponseRevisions.length, 0);
  assert.deepEqual(composite.canonicalSourceSlots, ["slot-000001"]);
  assert.deepEqual(composite.tupleCoverage, []);
  assert.deepEqual(req.sourceSlots[1], { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region", locatorId: "z-legend", ownership: "independently_owned", role: "pending_authorized_media", status: "pending_unexamined_visual", content: "Legend.", assetIdentity: visualAsset, pendingReason: "visual_not_examined" });
  assert.deepEqual(composite.sourceCoverage, [{ slot: "slot-000001", disposition: "canonical_semantic_v1" }, { slot: "slot-000002", disposition: "pending_unexamined_visual" }]);
  assert.deepEqual(composite.authority, { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false });
});

test("RC-INT-002/003: genuine REL-01 revisions and REL-03 IDs reach composite accounting unchanged", () => {
  const prepared = bridge(raw(true, 2)); const req = request(); const deferred = prepared.qualified.deferred_interpretations[0]!;
  const composite = prepareProvisionalSemanticCompositeAccounting({ scope: semanticScope, request: req, canonicalResult: canonical([candidate("independent", "a-owned")], [{ source_unit_id: "owned", page_number: 1, locator_type: "text_block", locator_id: "a-owned", classification: "candidate", destination_local_candidate_ids: ["independent"] }]), relationshipRevisions: [], currentResponseRelationshipRevisions: prepared.currentResponseRevisions, providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }, { sourceSlot: "slot-000001", candidateIndex: 1 }], independentCandidateTuples: prepared.qualified.independent_candidate_tuples.map((item) => ({ sourceSlot: item.source_slot, candidateIndex: item.candidate_index })), optionalRelationshipTuples: [], canonicalCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 1, canonicalCandidateId: "independent" }], deferredInterpretations: prepared.qualified.deferred_interpretations });
  assert.equal(composite.deferredInterpretations[0]?.deferred_interpretation_id, deferred.deferred_interpretation_id); assert.equal(composite.relationshipDependencies[0]?.scope.executionId, relationshipScope.executionId);
  assert.deepEqual(composite.tupleCoverage.map((item) => item.disposition), ["essential_dependent_deferred", "independently_finalized"]);
  assert.deepEqual(composite.tupleCoverage.find((item) => item.disposition === "independently_finalized"), { sourceSlot: "slot-000001", candidateIndex: 1, disposition: "independently_finalized", canonicalCandidateId: "independent" });
  assert.deepEqual(composite.sourceCoverage, [{ slot: "slot-000001", disposition: "canonical_semantic_v1" }, { slot: "slot-000002", disposition: "pending_unexamined_visual" }]);
  assert.deepEqual(composite.relationshipDependencies[0]?.ownedSource, { slot: "slot-000001", pageNumber: 1, locatorType: "text_block", locatorId: "a-owned", sourceSha256 });
  assert.deepEqual(composite.relationshipDependencies[0]?.contextSource, { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region", locatorId: "z-legend", sourceSha256, assetIdentity: visualAsset });
  assert.equal(composite.relationshipDependencies[0]?.normalizedDocument.sourceSha256, sourceSha256);
});

test("RC-INT-003: a genuine fully deferred meaning retains the REL-03 ID without canonical state", () => {
  const prepared = bridge(raw(true, 1)); const req = request(); const deferred = prepared.qualified.deferred_interpretations[0]!;
  const composite = prepareProvisionalSemanticCompositeAccounting({ scope: semanticScope, request: req, canonicalResult: canonical([], []), relationshipRevisions: [], currentResponseRelationshipRevisions: prepared.currentResponseRevisions, providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: prepared.qualified.deferred_interpretations });
  assert.deepEqual(composite.canonicalSourceSlots, []);
  assert.deepEqual(composite.sourceCoverage, [{ slot: "slot-000001", disposition: "essential_dependent_deferred" }, { slot: "slot-000002", disposition: "pending_unexamined_visual" }]);
  assert.deepEqual(composite.tupleCoverage, [{ sourceSlot: "slot-000001", candidateIndex: 0, disposition: "essential_dependent_deferred", deferredInterpretationId: deferred.deferred_interpretation_id, relationshipRevisionHash: deferred.relationship_revision_hash }]);
  assert.equal(composite.deferredInterpretations[0]?.deferred_interpretation_id, deferred.deferred_interpretation_id);
});

test("RC-INT-004: current-response revisions remain separate from prior request projection", () => {
  const prior = bridge(raw(true)).currentResponseRevisions[0]!;
  const projectedRequest = requestWithPrior(prior);
  const laterRaw = raw(true); laterRaw.semantic_proposal.source_results = laterRaw.semantic_proposal.source_results.filter((result) => result.slot !== "slot-000002"); laterRaw.relationship_proposals[0]!.proposed_meaning = "Later context qualifies owned.";
  const prepared = prepareStepwiseRel03Interoperability({ request: projectedRequest, rawResponse: laterRaw, relationshipScope, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 2, runId: "later-run" }, trustedPriorRevisions: [prior] });
  assert.equal(projectedRequest.provisionalRelationships.relationships[0]?.revision_hash, prior.revisionHash);
  assert.equal(prepared.currentResponseRevisions.length, 1);
  assert.equal(prepared.currentResponseRevisions[0]?.normalizedDocument.executionId, relationshipScope.executionId);
  assert.notEqual(prepared.currentResponseRevisions[0]?.revisionHash, prior.revisionHash);
  const composite = prepareProvisionalSemanticCompositeAccounting({ scope: semanticScope, request: projectedRequest, canonicalResult: canonical([], []), relationshipRevisions: [prior], currentResponseRelationshipRevisions: prepared.currentResponseRevisions, providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: prepared.qualified.deferred_interpretations });
  assert.deepEqual(composite.relationshipDependencies.map((revision) => revision.revisionHash).sort(), [prior.revisionHash, prepared.currentResponseRevisions[0]!.revisionHash].sort());
  assert.equal(composite.relationshipDependencies.every((revision) => revision.normalizedDocument.executionId === relationshipScope.executionId), true);
});

test("RC-INT-005: forged source identity and malformed slot state reject before composition", () => {
  assert.throws(() => prepareStepwiseRel03Interoperability({ request: request(), rawResponse: raw(true), relationshipScope: { ...relationshipScope, sourceSha256: "b".repeat(64) }, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1 }, trustedPriorRevisions: [] }), /source snapshot/);
  const invalid = { ...request(), sourceSlots: request().sourceSlots.map((slot) => slot.slot === "slot-000001" ? { ...slot, role: "owned_source" as const, status: "pending_unexamined_visual" as const } : slot) };
  assert.throws(() => projectStepwiseSlotsForRel03(invalid), /role\/status\/ownership/);
  const prepared = bridge(raw(true)); const revision = prepared.currentResponseRevisions[0]!;
  const { revisionHash: ignoredRevisionHash, ...immutableRevision } = revision;
  const tamperedBase = { ...immutableRevision, scope: { ...revision.scope, executionId: semanticScope.executionId } };
  const tampered = { ...tamperedBase, revisionHash: relationshipSha256(tamperedBase) };
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ scope: semanticScope, request: request(), canonicalResult: canonical([], []), relationshipRevisions: [], currentResponseRelationshipRevisions: [tampered], providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: prepared.qualified.deferred_interpretations }), /foreign source snapshot/);
});

test("RC-INT-005: integrated replay is hash-stable and has no effect surface", () => {
  const prepared = bridge(raw(true, 1)); const req = request(); const input = { scope: semanticScope, request: req, canonicalResult: canonical([], []), relationshipRevisions: [], currentResponseRelationshipRevisions: prepared.currentResponseRevisions, providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: prepared.qualified.deferred_interpretations } as const;
  const first = prepareProvisionalSemanticCompositeAccounting(input); const replay = prepareProvisionalSemanticCompositeAccounting(input);
  assert.equal(replay.compositeHash, first.compositeHash);
  assert.deepEqual(replay, first);
  assert.deepEqual(first.authority, { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false });
});

test("HMN-006: strict REL-03 handoff, SEM-006 null projection, and SEM-005 qualified accounting compose without caller universes", () => {
  const req = request();
  const handoff = prepareQualifiedStepwiseSemanticPreparation({ request: req, rawResponse: raw(true, 1), relationshipScope, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1, runId: "run-1" }, trustedPriorRevisions: [] });
  const finalizationSlots = projectStepwiseSlotsForRel03(req).map((slot) => slot.slot === "slot-000001" ? { ...slot, content: "Owned fact." } : slot);
  const projection = projectQualifiedStepwiseSemanticResult({ proposal: handoff.parsed.semanticProposal, sourceSlots: finalizationSlots, qualifiedDeferredInterpretations: handoff.qualified.deferred_interpretations, qualifiedRelationshipRevisions: handoff.currentResponseRevisions });
  assert.equal(projection.canonicalResult, null);
  assert.deepEqual(projection.canonicalCandidateTuples, []);
  const first = prepareQualifiedStepwiseSemanticCompositeAccounting({ scope: semanticScope, request: req, providerProposal: handoff.parsed.semanticProposal, relationshipRevisions: [], currentResponseRelationshipRevisions: handoff.currentResponseRevisions, qualifiedRelationshipResult: handoff.qualified, canonicalProjection: projection });
  const second = prepareQualifiedStepwiseSemanticCompositeAccounting({ scope: semanticScope, request: req, providerProposal: handoff.parsed.semanticProposal, relationshipRevisions: [], currentResponseRelationshipRevisions: handoff.currentResponseRevisions, qualifiedRelationshipResult: handoff.qualified, canonicalProjection: projection });
  assert.equal(first.compositeHash, second.compositeHash);
  assert.equal(first.tupleCoverage[0]?.disposition, "essential_dependent_deferred");
  assert.equal(first.canonicalResultSha256, null);
  assert.equal(first.preparationContext?.request, req);
  assert.equal(first.relationshipDependencies[0]?.proposalProvenance.providerRun, "run-1");
  assert.throws(() => prepareQualifiedStepwiseSemanticCompositeAccounting({ scope: semanticScope, request: req, providerProposal: { ...handoff.parsed.semanticProposal, source_results: [] }, relationshipRevisions: [], currentResponseRelationshipRevisions: handoff.currentResponseRevisions, qualifiedRelationshipResult: handoff.qualified, canonicalProjection: projection }), /omits an exact ready owned request source/);
});
