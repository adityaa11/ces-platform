import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import test from "node:test";
import { relationshipSha256, type AcceptedContextBinding, type AcceptedContextVerificationMechanism, type ContextSourceRelationshipRevisionV1, type ProvisionalSemanticCompositeAccounting } from "@atlas/skills";
import { finalizeVerifiedExtractionProposal } from "../src/semantic-extraction-finalizer.ts";

const sourceSha256 = "a".repeat(64);
const trustScope = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", sourceSha256, perceptionExecutionId: "perception-1", semanticExecutionId: "semantic-1" } as const;
const slots = [
  { slot: "slot-000001", pageNumber: 1, locatorType: "table" as const, locatorId: "table-1", content: "Accounts must be active.", sourceSha256 },
  { slot: "slot-000002", pageNumber: 1, locatorType: "visual_region" as const, locatorId: "legend-1", role: "reference_context" as const, sourceSha256, assetIdentity: { assetRef: "asset-legend-1", sha256: "c".repeat(64), sourceSha256 }, acceptedContextAsset: { assetId: "asset-legend-1", assetSourceId: sourceSha256 } },
] as const;
const proposal = { version: "v1", source_results: [{ slot: "slot-000001", classification: "candidate", candidates: [
  { semantic_key: "active account", kind: "rule", payload: { color: "green" }, normalized_meaning: "Green accounts must be active.", needs_resolution: false },
  { semantic_key: "account owner", kind: "business_property", payload: {}, normalized_meaning: "Accounts have an owner.", needs_resolution: false },
], non_fact_reason: null, questions: [] }] } as const;
const relationship = (necessity: "essential" | "optional") => ({ type: "context_qualifies" as const, direction: "context_to_owned" as const, contextualRole: "legend" as const, necessity });
const ownedSource = { slot: slots[0].slot, pageNumber: slots[0].pageNumber, locatorType: slots[0].locatorType, locatorId: slots[0].locatorId, sourceSha256 };
const contextSource = { slot: slots[1].slot, pageNumber: slots[1].pageNumber, locatorType: slots[1].locatorType, locatorId: slots[1].locatorId, sourceSha256, assetIdentity: slots[1].assetIdentity };
const revision = (necessity: "essential" | "optional" = "essential"): ContextSourceRelationshipRevisionV1 => {
  const relation = relationship(necessity); const lineage = relationshipSha256({ scope: { projectId: trustScope.projectId, workspaceId: trustScope.workspaceId, bundleId: trustScope.bundleId, documentId: trustScope.documentId, executionId: trustScope.perceptionExecutionId, artifactId: trustScope.documentId, sourceSha256 }, ownedSource, contextSource, relationship: relation });
  const immutable = { contractVersion: "atlas.context-provenance/v1" as const, relationshipLineageId: lineage, scope: { projectId: trustScope.projectId, workspaceId: trustScope.workspaceId, bundleId: trustScope.bundleId, documentId: trustScope.documentId, executionId: trustScope.perceptionExecutionId, artifactId: trustScope.documentId, sourceSha256 }, normalizedDocument: { executionId: trustScope.perceptionExecutionId, artifactId: trustScope.documentId, sourceSha256 }, ownedSource, contextSource, relationship: relation, disposition: "proposed" as const, uncertainty: "medium" as const, proposedMeaning: "The legend qualifies the activation rule.", sourceLanguage: "en", candidateRefs: [{ sourceSlot: slots[0].slot, candidateIndex: 0 }], proposalProvenance: { providerIdentity: "offline", providerRun: "fixture", providerRelationshipOrdinal: 0, confidence: null }, predecessor: null, authorization: null };
  return { ...immutable, revisionHash: relationshipSha256(immutable) };
};
const now = "2026-10-14T00:00:00.000Z";
const key = "test-only-sem-cutover-006-verifier";
const mac = (value: unknown) => createHmac("sha256", key).update(JSON.stringify(value)).digest("hex");
const signed = (payload: unknown) => ({ payload, signature: mac(payload) });
const bindingFor = (relationshipRevision: ContextSourceRelationshipRevisionV1): AcceptedContextBinding => ({ projectId: trustScope.projectId, workspaceId: trustScope.workspaceId, bundleId: trustScope.bundleId, documentId: trustScope.documentId, sourceSha256, perceptionExecutionId: trustScope.perceptionExecutionId, semanticExecutionId: trustScope.semanticExecutionId, relationshipLineageId: relationshipRevision.relationshipLineageId, relationshipRevisionHash: relationshipRevision.revisionHash, ownedSource: { slot: slots[0].slot, canonicalLocator: "1:table:table-1" }, contextSource: { slot: slots[1].slot, canonicalLocator: "1:visual_region:legend-1" }, contextAsset: { assetId: "asset-legend-1", assetSourceId: sourceSha256, assetSha256: "c".repeat(64) }, contextualRole: relationshipRevision.relationship.contextualRole, necessity: relationshipRevision.relationship.necessity });
const mechanism: AcceptedContextVerificationMechanism = { mechanismId: "test-only-hmac/v1", verify: ({ rawDecision, rawAuthorityState }) => {
  const valid = (raw: unknown): raw is { payload: unknown; signature: string } => Boolean(raw && typeof raw === "object" && "payload" in raw && "signature" in raw && typeof (raw as { signature: unknown }).signature === "string" && timingSafeEqual(Buffer.from((raw as { signature: string }).signature), Buffer.from(mac((raw as { payload: unknown }).payload))));
  return valid(rawDecision) && valid(rawAuthorityState) ? { decision: rawDecision.payload as never, authorityState: rawAuthorityState.payload as never } : undefined;
} };
const evidenceFor = (relationshipRevision: ContextSourceRelationshipRevisionV1, overrides: Record<string, unknown> = {}) => {
  const binding = bindingFor(relationshipRevision);
  const decision = { version: "atlas.accepted-context-decision/v1" as const, issuerId: "fixture-issuer", decisionId: "accepted-1", issuedAt: "2026-10-13T00:00:00.000Z", expiresAt: "2026-10-15T00:00:00.000Z", authorizationState: "accepted" as const, binding };
  const state = { version: "atlas.accepted-context-authority-state/v1" as const, issuerId: "fixture-issuer", fetchedAt: "2026-10-13T23:00:00.000Z", expiresAt: "2026-10-15T00:00:00.000Z", decisions: { "accepted-1": "authorized" as const } };
  return { relationshipRevision, rawDecision: signed(decision), rawAuthorityState: signed(state), mechanism, now, ...overrides };
};
const evidence = (overrides: Record<string, unknown> = {}) => evidenceFor(revision(), overrides);

test("RC-006-01/02: verified context enriches only the immutable relationship tuple deterministically", () => {
  const input = { proposal, sourceSlots: slots, trustScope, acceptedContextEvidence: [evidence()] } as const;
  const first = finalizeVerifiedExtractionProposal(input); const second = finalizeVerifiedExtractionProposal(input);
  assert.deepEqual(second, first); assert.equal(first.kind, "canonical");
  if (first.kind !== "canonical") throw new Error("expected canonical result");
  assert.equal(first.canonicalResult.candidate_assertions.length, 2);
  assert.equal(first.canonicalResult.candidate_assertions[0]?.local_candidate_id, "candidate-slot-000001-001");
  assert.equal(first.canonicalResult.candidate_assertions[0]?.evidence_refs.length, 2);
  assert.equal(first.canonicalResult.candidate_assertions[1]?.evidence_refs.length, 1, "context is not copied to an unrelated table candidate");
  assert.equal(first.canonicalResult.candidate_assertions.some((candidate) => candidate.local_candidate_id.includes("slot-000002")), false, "context cannot mint a visual-owned candidate");
  const optional = finalizeVerifiedExtractionProposal({ proposal, sourceSlots: slots, trustScope, acceptedContextEvidence: [evidenceFor(revision("optional"))] });
  assert.equal(optional.kind, "canonical"); if (optional.kind !== "canonical") throw new Error("expected optional canonical result");
  assert.equal(optional.canonicalResult.candidate_assertions[0]?.evidence_refs.length, 2, "accepted optional context is attached to the same owned candidate");
});

test("RC-006-01: forged, foreign, expired, revoked, duplicate, unsupported, and mismatched authority fails before output", () => {
  const rejected = (item: ReturnType<typeof evidence>) => assert.throws(() => finalizeVerifiedExtractionProposal({ proposal, sourceSlots: slots, trustScope, acceptedContextEvidence: [item] }), /SOURCE_RELATIONSHIP_BLOCKED/);
  const validRevision = revision();
  const forgedLineageRevision = { ...validRevision, relationshipLineageId: "f".repeat(64) };
  const { revisionHash: ignored, ...forgedImmutable } = forgedLineageRevision;
  rejected(evidence({ relationshipRevision: { ...forgedLineageRevision, revisionHash: relationshipSha256(forgedImmutable) } }));
  rejected(evidence({ rawDecision: { payload: {}, signature: "0".repeat(64) } }));
  rejected(evidence({ rawDecision: signed({ version: "atlas.accepted-context-decision/v1", issuerId: "fixture-issuer", decisionId: "accepted-1", issuedAt: "2026-10-13T00:00:00.000Z", expiresAt: "2026-10-15T00:00:00.000Z", authorizationState: "accepted", binding: { ...bindingFor(revision()), documentId: "foreign-document" } }) }));
  rejected(evidence({ rawDecision: signed({ version: "atlas.accepted-context-decision/v1", issuerId: "fixture-issuer", decisionId: "accepted-1", issuedAt: "2026-10-13T00:00:00.000Z", expiresAt: "2026-10-13T23:00:00.000Z", authorizationState: "accepted", binding: bindingFor(revision()) }) }));
  rejected(evidence({ rawAuthorityState: signed({ version: "atlas.accepted-context-authority-state/v1", issuerId: "fixture-issuer", fetchedAt: "2026-10-13T23:00:00.000Z", expiresAt: "2026-10-15T00:00:00.000Z", decisions: { "accepted-1": "revoked" } }) }));
  rejected(evidence({ rawAuthorityState: signed({ version: "atlas.accepted-context-authority-state/v1", issuerId: "fixture-issuer", fetchedAt: "2026-10-15T00:00:00.000Z", expiresAt: "2026-10-16T00:00:00.000Z", decisions: { "accepted-1": "authorized" } }) }));
  rejected(evidence({ rawDecision: signed({ version: "atlas.accepted-context-decision/v1", issuerId: "fixture-issuer", decisionId: "accepted-1", issuedAt: "2026-10-13T00:00:00.000Z", expiresAt: "2026-10-15T00:00:00.000Z", authorizationState: "accepted", binding: { ...bindingFor(revision()), contextAsset: { assetId: "asset-legend-1", assetSourceId: sourceSha256, assetSha256: "f".repeat(64) } } }) }));
  rejected({ ...evidence(), relationshipRevision: { ...revision(), relationship: { ...relationship("essential"), contextualRole: "unsupported" } } as never });
  const duplicated = evidence(); assert.throws(() => finalizeVerifiedExtractionProposal({ proposal, sourceSlots: slots, trustScope, acceptedContextEvidence: [duplicated, duplicated] }), /duplicate accepted-context decision/);
});

test("RC-006-02/03: qualified composite accounting preserves essential deferred tuples without false V1 coverage", () => {
  const deferredId = "d".repeat(64); const revisionHash = revision().revisionHash;
  const accounting = { tupleCoverage: [
    { sourceSlot: "slot-000001", candidateIndex: 0, disposition: "essential_dependent_deferred", deferredInterpretationId: deferredId, relationshipRevisionHash: revisionHash },
    { sourceSlot: "slot-000001", candidateIndex: 1, disposition: "independently_finalized", canonicalCandidateId: "candidate-slot-000001-002" },
  ], sourceCoverage: [{ slot: "slot-000001", disposition: "canonical_semantic_v1" }], deferredInterpretations: [{ deferred_interpretation_id: deferredId, relationship_revision_hash: revisionHash, provider_candidate_tuple: { source_slot: "slot-000001", candidate_index: 0 }, canonical_candidate_id: null }] } as unknown as ProvisionalSemanticCompositeAccounting;
  const outcome = finalizeVerifiedExtractionProposal({ proposal, sourceSlots: slots, trustScope, provisionalCompositeAccounting: accounting });
  assert.equal(outcome.kind, "provisional_companion"); if (outcome.kind !== "provisional_companion") throw new Error("expected provisional companion");
  assert.equal(outcome.provisionalCompositeAccounting, accounting);
  assert.deepEqual(outcome.canonicalResult?.candidate_assertions.map((candidate) => candidate.local_candidate_id), ["candidate-slot-000001-002"]);
});
