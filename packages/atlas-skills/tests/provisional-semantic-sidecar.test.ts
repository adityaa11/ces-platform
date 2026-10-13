import assert from "node:assert/strict";
import test from "node:test";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket, InMemoryProvisionalSemanticSidecarRepository, prepareProvisionalSemanticCompositeAccounting, prepareProvisionalSemanticSidecar } from "../src/index.ts";
import { relationshipContractVersion, relationshipSha256 } from "../src/relationship-provenance.ts";

const sourceSha256 = "a".repeat(64);
const scope = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: "semantic-execution-1", sourceSha256 };
const request = () => buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document: { version: "v1", executionId: "perception-execution-1", artifactId: "document-1", sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "pdf", executionId: "perception-execution-1", processedAt: "2026-10-13T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text-1", text: "Independent fact." }], tables: [], visualRegions: [{ id: "visual-1" }] }] } }));
const canonical = { version: "v1", candidate_assertions: [{ local_candidate_id: "candidate-1", semantic_key: "fact", kind: "business_object", normalized_meaning: "Independent fact.", needs_resolution: false, payload: {}, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "text-1", excerpt: "Independent fact." }] }], source_statement_inventory: [{ source_unit_id: "source-1", page_number: 1, locator_type: "text_block", locator_id: "text-1", classification: "candidate", destination_local_candidate_ids: ["candidate-1"] }], questions: [] };

const relationshipRequest = () => {
  const snapshot = { executionId: "perception-execution-1", artifactId: "document-1", sourceSha256 };
  const relationshipLineageId = "c".repeat(64);
  const revisionBase = {
    contractVersion: relationshipContractVersion,
    relationshipLineageId,
    scope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId: scope.documentId, executionId: snapshot.executionId, artifactId: snapshot.artifactId, sourceSha256 },
    normalizedDocument: snapshot,
    ownedSource: { slot: "slot-000001", pageNumber: 1, locatorType: "text_block" as const, locatorId: "text-1", sourceSha256 },
    contextSource: { slot: "slot-000002", pageNumber: 1, locatorType: "text_block" as const, locatorId: "text-2", sourceSha256 },
    relationship: { type: "context_qualifies" as const, direction: "context_to_owned" as const, contextualRole: "legend" as const, necessity: "essential" as const },
    disposition: "proposed" as const,
    uncertainty: "medium" as const,
    proposedMeaning: "The legend qualifies the independent fact.",
    sourceLanguage: "en",
    candidateRefs: [{ sourceSlot: "slot-000001", candidateIndex: 0 }],
    proposalProvenance: { providerIdentity: "test:model:loopback", providerRun: "run-1", providerRelationshipOrdinal: 0, confidence: null },
    predecessor: null,
    authorization: null,
  };
  const revision = { ...revisionBase, revisionHash: relationshipSha256(revisionBase) };
  const packet = buildStepwiseSourcePacket({ document: { version: "v1", executionId: snapshot.executionId, artifactId: snapshot.artifactId, sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "pdf", executionId: snapshot.executionId, processedAt: "2026-10-13T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text-1", text: "Independent fact." }, { id: "text-2", text: "Legend." }], tables: [], visualRegions: [] }] }, provisionalRelationships: [{ relationshipLineageId, revisionHash: revision.revisionHash, normalizedDocument: snapshot, ownedSource: { pageNumber: 1, locatorType: "text_block", locatorId: "text-1" }, contextSource: { pageNumber: 1, locatorType: "text_block", locatorId: "text-2" }, contextualRole: "legend", necessity: "essential", uncertainty: "medium", disposition: "proposed", authorization: null }] });
  return { request: buildStepwiseRelationshipEnvelopeRequest(packet), revision };
};

test("accounting retains meaningful pending visuals beside a complete independent V1 candidate", () => {
  const built = request(); const sidecar = prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: canonical, relationshipRevisions: [] });
  assert.equal(sidecar.sourceAccounting.length, 2);
  assert.equal(sidecar.sourceAccounting.find((item) => item.locatorId === "visual-1")?.disposition, "pending_unexamined_visual");
  assert.equal(sidecar.semanticProfileSha256, built.profileSha256);
  assert.deepEqual(sidecar.authority, { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false });
  assert.equal(prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: canonical, relationshipRevisions: [] }).sidecarHash, sidecar.sidecarHash);
});

test("canonical evidence must be supplied by an exact finalized request slot", () => {
  const built = request();
  const foreignCandidate = { ...canonical, candidate_assertions: [{ ...canonical.candidate_assertions[0], evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "foreign", excerpt: "Foreign fact." }] }] };
  const foreignQuestion = { ...canonical, questions: [{ question: "Is this supported?", reason: "The evidence is foreign.", evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "foreign", excerpt: "Foreign fact." }] }] };
  assert.throws(() => prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: foreignCandidate, relationshipRevisions: [] }), /candidate evidence/);
  assert.throws(() => prepareProvisionalSemanticSidecar({ scope, request: built, canonicalResult: foreignQuestion, relationshipRevisions: [] }), /question evidence/);
});

test("companion state binds the frozen profile and full immutable relationship provenance", () => {
  const built = relationshipRequest();
  const relationshipCanonical = { ...canonical, source_statement_inventory: [{ ...canonical.source_statement_inventory[0], locator_id: "text-1" }] };
  const sidecar = prepareProvisionalSemanticSidecar({ scope, request: built.request, canonicalResult: relationshipCanonical, relationshipRevisions: [built.revision] });
  assert.equal(sidecar.semanticProfileSha256, built.request.profileSha256);
  assert.deepEqual(sidecar.relationshipDependencies, [built.revision]);
  assert.throws(() => prepareProvisionalSemanticSidecar({ scope, request: { ...built.request, profileSha256: "b".repeat(64) }, canonicalResult: relationshipCanonical, relationshipRevisions: [built.revision] }), /profile fingerprint/);
  assert.throws(() => prepareProvisionalSemanticSidecar({ scope, request: built.request, canonicalResult: relationshipCanonical, relationshipRevisions: [{ ...built.revision, revisionHash: "b".repeat(64) }] }), /immutable provenance/);
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

test("composite accounting keeps independent tuples and pending visuals in their existing truthful lanes", () => {
  const built = request();
  const input = { scope, request: built, canonicalResult: canonical, relationshipRevisions: [], providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], optionalRelationshipTuples: [], canonicalCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0, canonicalCandidateId: "candidate-1" }], deferredInterpretations: [] } as const;
  const composite = prepareProvisionalSemanticCompositeAccounting(input);
  assert.equal(composite.tupleCoverage[0]?.disposition, "independently_finalized");
  assert.equal(composite.sourceCoverage.find((item) => item.slot === "slot-000002")?.disposition, "pending_unexamined_visual");
  assert.equal(prepareProvisionalSemanticCompositeAccounting(input).compositeHash, composite.compositeHash);
});

test("composite accounting represents fully deferred source meaning without a fabricated V1 candidate", () => {
  const built = relationshipRequest();
  const deferred = { deferred_interpretation_id: relationshipSha256({ scope: built.revision.scope, sourceSlot: "slot-000001", candidateIndex: 0, relationshipRevisionHash: built.revision.revisionHash }), relationship_revision_hash: built.revision.revisionHash, provider_candidate_tuple: { source_slot: "slot-000001", candidate_index: 0 }, source: { owned_source: built.revision.ownedSource, context_source: built.revision.contextSource }, uncertainty: "medium" as const, proposed_candidate_meaning: { meaning: "Requires its legend." }, reason: "essential_provisional_relationship" as const, canonical_candidate_id: null };
  const input = { scope, request: built.request, canonicalResult: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] }, relationshipRevisions: [built.revision], providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: [deferred] } as const;
  const composite = prepareProvisionalSemanticCompositeAccounting(input);
  assert.deepEqual(composite.sourceCoverage, [{ slot: "slot-000001", disposition: "essential_dependent_deferred" }]);
  assert.equal(composite.tupleCoverage[0]?.deferredInterpretationId, deferred.deferred_interpretation_id);
});

test("composite accounting combines fully deferred and independently finalized sources, including optional tuples", () => {
  const built = relationshipRequest();
  const requestWithTwoOwnedSources = { ...built.request, sourceSlots: built.request.sourceSlots.map((slot) => slot.slot === "slot-000002" ? { ...slot, role: "owned_source" as const, status: "ready" as const } : slot) };
  const deferred = { deferred_interpretation_id: relationshipSha256({ scope: built.revision.scope, sourceSlot: "slot-000001", candidateIndex: 0, relationshipRevisionHash: built.revision.revisionHash }), relationship_revision_hash: built.revision.revisionHash, provider_candidate_tuple: { source_slot: "slot-000001", candidate_index: 0 }, source: { owned_source: built.revision.ownedSource, context_source: built.revision.contextSource }, uncertainty: "medium" as const, proposed_candidate_meaning: { meaning: "Requires its legend." }, reason: "essential_provisional_relationship" as const, canonical_candidate_id: null };
  const canonicalSecondSource = { version: "v1", candidate_assertions: [{ ...canonical.candidate_assertions[0], local_candidate_id: "candidate-2", evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "text-2", excerpt: "Legend." }] }], source_statement_inventory: [{ source_unit_id: "source-2", page_number: 1, locator_type: "text_block", locator_id: "text-2", classification: "candidate", destination_local_candidate_ids: ["candidate-2"] }], questions: [] };
  const composite = prepareProvisionalSemanticCompositeAccounting({ scope, request: requestWithTwoOwnedSources, canonicalResult: canonicalSecondSource, relationshipRevisions: [built.revision], providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }, { sourceSlot: "slot-000002", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [{ sourceSlot: "slot-000002", candidateIndex: 0 }], canonicalCandidateTuples: [{ sourceSlot: "slot-000002", candidateIndex: 0, canonicalCandidateId: "candidate-2" }], deferredInterpretations: [deferred] });
  assert.deepEqual(composite.tupleCoverage.map((item) => item.disposition), ["essential_dependent_deferred", "optional_relationship_but_independent"]);
  assert.deepEqual(composite.sourceCoverage, [{ slot: "slot-000001", disposition: "essential_dependent_deferred" }, { slot: "slot-000002", disposition: "canonical_semantic_v1" }]);
});

test("composite accounting retains a genuine non_fact source without inventing deferred meaning", () => {
  const built = request();
  const nonFact = { version: "v1", candidate_assertions: [], source_statement_inventory: [{ source_unit_id: "source-1", page_number: 1, locator_type: "text_block", locator_id: "text-1", classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: "Page decoration only." }], questions: [] };
  const composite = prepareProvisionalSemanticCompositeAccounting({ scope, request: built, canonicalResult: nonFact, relationshipRevisions: [], providerCandidateTuples: [], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: [] });
  assert.equal(composite.sourceCoverage.find((item) => item.slot === "slot-000001")?.disposition, "canonical_semantic_v1");
  assert.equal(composite.deferredInterpretations.length, 0);
});

test("composite accounting rejects double ownership, missing revision identity, false non_fact, and partial-result detachment", () => {
  const built = relationshipRequest();
  const deferred = { deferred_interpretation_id: relationshipSha256({ scope: built.revision.scope, sourceSlot: "slot-000001", candidateIndex: 0, relationshipRevisionHash: built.revision.revisionHash }), relationship_revision_hash: built.revision.revisionHash, provider_candidate_tuple: { source_slot: "slot-000001", candidate_index: 0 }, source: { owned_source: built.revision.ownedSource, context_source: built.revision.contextSource }, uncertainty: "medium" as const, proposed_candidate_meaning: { meaning: "Requires its legend." }, reason: "essential_provisional_relationship" as const, canonical_candidate_id: null };
  const base = { scope, request: built.request, canonicalResult: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] }, relationshipRevisions: [built.revision], providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: [deferred] } as const;
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...base, independentCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }] }), /duplicated|represented more than once|immutable essential dependency/);
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...base, deferredInterpretations: [{ ...deferred, relationship_revision_hash: "b".repeat(64) }] }), /immutable essential dependency/);
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...base, canonicalResult: { version: "v1", candidate_assertions: [], source_statement_inventory: [{ source_unit_id: "source-1", page_number: 1, locator_type: "text_block", locator_id: "text-1", classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: "Decorative only." }], questions: [] } }), /non_fact conflicts/);
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...base, deferredInterpretations: [] }), /missing composite accounting/);
});

test("composite accounting fail-closes foreign canonical evidence, forged deferred identity, and omitted ready sources", () => {
  const built = relationshipRequest();
  const deferred = { deferred_interpretation_id: relationshipSha256({ scope: built.revision.scope, sourceSlot: "slot-000001", candidateIndex: 0, relationshipRevisionHash: built.revision.revisionHash }), relationship_revision_hash: built.revision.revisionHash, provider_candidate_tuple: { source_slot: "slot-000001", candidate_index: 0 }, source: { owned_source: built.revision.ownedSource, context_source: built.revision.contextSource }, uncertainty: "medium" as const, proposed_candidate_meaning: { meaning: "Requires its legend." }, reason: "essential_provisional_relationship" as const, canonical_candidate_id: null };
  const deferredBase = { scope, request: built.request, canonicalResult: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] }, relationshipRevisions: [built.revision], providerCandidateTuples: [{ sourceSlot: "slot-000001", candidateIndex: 0 }], independentCandidateTuples: [], optionalRelationshipTuples: [], canonicalCandidateTuples: [], deferredInterpretations: [deferred] } as const;
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...deferredBase, deferredInterpretations: [{ ...deferred, deferred_interpretation_id: "f".repeat(64) }] }), /immutable essential dependency/);
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...deferredBase, canonicalResult: { ...canonical, candidate_assertions: [{ ...canonical.candidate_assertions[0], evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "foreign", excerpt: "foreign" }] }] } }), /candidate evidence/);
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...deferredBase, canonicalResult: { ...canonical, questions: [{ question: "foreign?", reason: "foreign", evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "foreign", excerpt: "foreign" }] }] } }), /question evidence/);
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...deferredBase, canonicalResult: canonical }), /detached from its tuple/);
  const twoOwned = { ...built.request, sourceSlots: built.request.sourceSlots.map((slot) => slot.slot === "slot-000002" ? { ...slot, role: "owned_source" as const, status: "ready" as const } : slot) };
  assert.throws(() => prepareProvisionalSemanticCompositeAccounting({ ...deferredBase, request: twoOwned }), /ready owned source is absent/);
});
