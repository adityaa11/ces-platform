import { parseSemanticExtractionResult, type SemanticExtractionResult } from "@atlas/contracts";
import {
  atlasProviderExtractionProposalV1Schema,
  relationshipContractVersion,
  relationshipSha256,
  verifyAcceptedContextDecision,
  type AcceptedContextVerificationMechanism,
  type ContextSourceRelationshipRevisionV1,
  type ProvisionalSemanticCompositeAccounting,
  type CanonicalCandidateTupleBinding,
  type SourceLocatorType,
} from "@atlas/skills";
import type { DeferredDependentInterpretationV1 } from "./semantic-relationship-sidecar.js";

/** Atlas-resolved finalization input. Extra identity fields are required only for contextual trust. */
export type TrustedFinalizationSlot = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  readonly content?: string;
  readonly role?: "owned_source" | "reference_context" | "pending_authorized_media";
  readonly sourceSha256?: string;
  readonly assetIdentity?: { readonly assetRef: string; readonly sha256: string; readonly sourceSha256: string };
  readonly acceptedContextAsset?: { readonly assetId: string; readonly assetSourceId: string };
};

export type ExtractionFinalizationInput = { readonly proposal: unknown; readonly sourceSlots: readonly TrustedFinalizationSlot[] };
export type FinalizationTrustScope = { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly sourceSha256: string; readonly perceptionExecutionId: string; readonly semanticExecutionId: string };

/** This decision is consumed; its injected mechanism remains the authority owner. */
export type VerifiedAcceptedContextEvidence = {
  readonly relationshipRevision: ContextSourceRelationshipRevisionV1;
  readonly rawDecision: unknown;
  readonly rawAuthorityState: unknown;
  readonly mechanism: AcceptedContextVerificationMechanism;
  readonly now: string;
};

export type VerifiedExtractionFinalizationInput = ExtractionFinalizationInput & {
  readonly trustScope: FinalizationTrustScope;
  readonly acceptedContextEvidence?: readonly VerifiedAcceptedContextEvidence[];
  /** Qualified SEM-005 accounting, consumed read-only for essential deferred meaning. */
  readonly provisionalCompositeAccounting?: ProvisionalSemanticCompositeAccounting;
};

export type VerifiedFinalizationOutcome =
  | { readonly kind: "canonical"; readonly canonicalResult: SemanticExtractionResult }
  | { readonly kind: "provisional_companion"; readonly canonicalResult: SemanticExtractionResult | null; readonly provisionalCompositeAccounting: ProvisionalSemanticCompositeAccounting };

const sourceUnitId = (slot: string) => `source-unit-${slot}`;
const candidateId = (slot: string, index: number) => `candidate-${slot}-${String(index + 1).padStart(3, "0")}`;
const tupleKey = (slot: string, index: number) => `${slot}\u0000${index}`;
const canonicalLocator = (slot: TrustedFinalizationSlot) => `${slot.pageNumber}:${slot.locatorType}:${slot.locatorId}`;
const sha256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

function fail(message: string): never { throw new Error(`Semantic extraction finalization failed: ${message}`); }
function sourceContent(slot: TrustedFinalizationSlot): string { if (!slot.content) fail(`owned source slot ${slot.slot} has no trusted source wording.`); return slot.content; }
function evidenceFor(slot: TrustedFinalizationSlot) {
  if (slot.locatorType === "visual_region") return { page_number: slot.pageNumber, locator_type: slot.locatorType, locator_id: slot.locatorId } as const;
  const content = sourceContent(slot); if (content.length > 4_000) fail(`SCHEMA_FIT_BLOCKED: source slot ${slot.slot} exceeds the canonical evidence excerpt bound.`);
  return { page_number: slot.pageNumber, locator_type: slot.locatorType, locator_id: slot.locatorId, excerpt: content } as const;
}
function validateTrustedSlots(sourceSlots: readonly TrustedFinalizationSlot[]) {
  const bySlot = new Map<string, TrustedFinalizationSlot>();
  for (const slot of sourceSlots) { if (!slot.slot) fail("a trusted finalization slot is empty."); if (bySlot.has(slot.slot)) fail(`duplicate trusted source slot ${slot.slot}.`); bySlot.set(slot.slot, slot); }
  return bySlot;
}
function sameSlot(slot: TrustedFinalizationSlot, locator: ContextSourceRelationshipRevisionV1["ownedSource"], sourceSha: string) {
  return slot.slot === locator.slot && slot.pageNumber === locator.pageNumber && slot.locatorType === locator.locatorType && slot.locatorId === locator.locatorId && slot.sourceSha256 === sourceSha && locator.sourceSha256 === sourceSha && JSON.stringify(slot.assetIdentity) === JSON.stringify(locator.assetIdentity);
}

function validateRevision(input: { readonly revision: ContextSourceRelationshipRevisionV1; readonly trustScope: FinalizationTrustScope; readonly slots: ReadonlyMap<string, TrustedFinalizationSlot>; readonly owned: ReadonlyMap<string, TrustedFinalizationSlot>; readonly proposal: ReturnType<typeof atlasProviderExtractionProposalV1Schema.parse> }) {
  const { revision, trustScope, slots, owned, proposal } = input;
  const { revisionHash: ignored, ...immutable } = revision;
  if (revision.contractVersion !== relationshipContractVersion || !sha256(revision.relationshipLineageId) || !sha256(revision.revisionHash) || revision.revisionHash !== relationshipSha256(immutable)) fail("SOURCE_RELATIONSHIP_BLOCKED: relationship revision is not immutable.");
  if (revision.relationshipLineageId !== relationshipSha256({ scope: revision.scope, ownedSource: revision.ownedSource, contextSource: revision.contextSource, relationship: revision.relationship })) fail("SOURCE_RELATIONSHIP_BLOCKED: relationship lineage does not match immutable relationship content.");
  if (revision.disposition !== "proposed" || revision.authorization !== null || revision.relationship.type !== "context_qualifies" || revision.relationship.direction !== "context_to_owned") fail("SOURCE_RELATIONSHIP_BLOCKED: relationship descriptor is not a provisional contextual relation.");
  if (revision.scope.projectId !== trustScope.projectId || revision.scope.workspaceId !== trustScope.workspaceId || revision.scope.bundleId !== trustScope.bundleId || revision.scope.documentId !== trustScope.documentId || revision.scope.executionId !== trustScope.perceptionExecutionId || revision.scope.sourceSha256 !== trustScope.sourceSha256 || revision.normalizedDocument.executionId !== trustScope.perceptionExecutionId || revision.normalizedDocument.artifactId !== trustScope.documentId || revision.normalizedDocument.sourceSha256 !== trustScope.sourceSha256) fail("SOURCE_RELATIONSHIP_BLOCKED: relationship descriptor belongs to a foreign snapshot.");
  const owner = owned.get(revision.ownedSource.slot); const context = slots.get(revision.contextSource.slot);
  if (!owner || !context || (context.role ?? "owned_source") !== "reference_context" || !sameSlot(owner, revision.ownedSource, trustScope.sourceSha256) || !sameSlot(context, revision.contextSource, trustScope.sourceSha256)) fail("SOURCE_RELATIONSHIP_BLOCKED: relationship descriptor does not match exact trusted slots.");
  const result = proposal.source_results.find((item) => item.slot === owner.slot);
  if (!result || revision.candidateRefs.length === 0 || revision.candidateRefs.some((candidate) => candidate.sourceSlot !== owner.slot || !Number.isSafeInteger(candidate.candidateIndex) || candidate.candidateIndex < 0 || candidate.candidateIndex >= result.candidates.length)) fail("SOURCE_RELATIONSHIP_BLOCKED: relationship descriptor does not bind exact proposal tuples.");
  if (trustScope.perceptionExecutionId === trustScope.semanticExecutionId || !sha256(trustScope.sourceSha256)) fail("SOURCE_RELATIONSHIP_BLOCKED: perception and semantic scope identities are invalid.");
  if (!context.assetIdentity || !context.acceptedContextAsset || context.assetIdentity.sourceSha256 !== trustScope.sourceSha256 || context.acceptedContextAsset.assetId !== context.assetIdentity.assetRef || context.acceptedContextAsset.assetSourceId !== context.assetIdentity.sourceSha256) fail("SOURCE_RELATIONSHIP_BLOCKED: contextual asset identity is incomplete or foreign.");
  return { owner, context };
}

function verifiedContextualEvidence(input: { readonly finalization: VerifiedExtractionFinalizationInput; readonly slots: ReadonlyMap<string, TrustedFinalizationSlot>; readonly owned: ReadonlyMap<string, TrustedFinalizationSlot>; readonly proposal: ReturnType<typeof atlasProviderExtractionProposalV1Schema.parse> }) {
  const contextual = new Map<string, TrustedFinalizationSlot[]>(); const decisions = new Set<string>();
  for (const evidence of input.finalization.acceptedContextEvidence ?? []) {
    const { owner, context } = validateRevision({ revision: evidence.relationshipRevision, trustScope: input.finalization.trustScope, slots: input.slots, owned: input.owned, proposal: input.proposal });
    const binding = { projectId: input.finalization.trustScope.projectId, workspaceId: input.finalization.trustScope.workspaceId, bundleId: input.finalization.trustScope.bundleId, documentId: input.finalization.trustScope.documentId, sourceSha256: input.finalization.trustScope.sourceSha256, perceptionExecutionId: input.finalization.trustScope.perceptionExecutionId, semanticExecutionId: input.finalization.trustScope.semanticExecutionId, relationshipLineageId: evidence.relationshipRevision.relationshipLineageId, relationshipRevisionHash: evidence.relationshipRevision.revisionHash, ownedSource: { slot: owner.slot, canonicalLocator: canonicalLocator(owner) }, contextSource: { slot: context.slot, canonicalLocator: canonicalLocator(context) }, contextAsset: { assetId: context.acceptedContextAsset!.assetId, assetSourceId: context.acceptedContextAsset!.assetSourceId, assetSha256: context.assetIdentity!.sha256 }, contextualRole: evidence.relationshipRevision.relationship.contextualRole, necessity: evidence.relationshipRevision.relationship.necessity } as const;
    let decision: ReturnType<typeof verifyAcceptedContextDecision>;
    try { decision = verifyAcceptedContextDecision({ rawDecision: evidence.rawDecision, rawAuthorityState: evidence.rawAuthorityState, expectedBinding: binding, mechanism: evidence.mechanism, now: evidence.now }); } catch { fail("SOURCE_RELATIONSHIP_BLOCKED: accepted-context authority was rejected."); }
    if (decisions.has(decision.decisionId)) fail("SOURCE_RELATIONSHIP_BLOCKED: duplicate accepted-context decision."); decisions.add(decision.decisionId);
    for (const candidate of evidence.relationshipRevision.candidateRefs) { const key = tupleKey(candidate.sourceSlot, candidate.candidateIndex); const entries = contextual.get(key) ?? []; if (entries.some((item) => item.slot === context.slot)) fail("SOURCE_RELATIONSHIP_BLOCKED: duplicate contextual evidence binding."); entries.push(context); contextual.set(key, entries); }
  }
  return contextual;
}

function deferredTuples(proposal: ReturnType<typeof atlasProviderExtractionProposalV1Schema.parse>, accounting: ProvisionalSemanticCompositeAccounting | undefined) {
  const deferred = new Set<string>(); if (!accounting) return deferred;
  const coverage = new Map<string, (typeof accounting.tupleCoverage)[number]>();
  for (const entry of accounting.tupleCoverage) {
    const result = proposal.source_results.find((item) => item.slot === entry.sourceSlot); const key = tupleKey(entry.sourceSlot, entry.candidateIndex);
    if (!result || !Number.isSafeInteger(entry.candidateIndex) || entry.candidateIndex < 0 || entry.candidateIndex >= result.candidates.length || coverage.has(key)) fail("SOURCE_RELATIONSHIP_BLOCKED: provisional accounting has an invalid tuple."); coverage.set(key, entry);
    if (entry.disposition === "essential_dependent_deferred") {
      if (entry.canonicalCandidateId !== undefined || !entry.deferredInterpretationId || !entry.relationshipRevisionHash || !accounting.deferredInterpretations.some((item) => item.deferred_interpretation_id === entry.deferredInterpretationId && item.relationship_revision_hash === entry.relationshipRevisionHash && item.provider_candidate_tuple.source_slot === entry.sourceSlot && item.provider_candidate_tuple.candidate_index === entry.candidateIndex && item.canonical_candidate_id === null)) fail("SOURCE_RELATIONSHIP_BLOCKED: provisional accounting does not preserve deferred meaning."); deferred.add(key);
    }
  }
  for (const result of proposal.source_results) for (const [index] of result.candidates.entries()) { const entry = coverage.get(tupleKey(result.slot, index)); if (!entry) fail("SOURCE_RELATIONSHIP_BLOCKED: provisional accounting omits a provider tuple."); if (entry.disposition !== "essential_dependent_deferred" && entry.canonicalCandidateId !== candidateId(result.slot, index)) fail("SOURCE_RELATIONSHIP_BLOCKED: provisional accounting does not bind the canonical candidate identity."); }
  const sourceCoverage = new Map(accounting.sourceCoverage.map((entry) => [entry.slot, entry]));
  for (const result of proposal.source_results) {
    const expected = result.candidates.length > 0 && result.candidates.every((_candidate, index) => deferred.has(tupleKey(result.slot, index))) ? "essential_dependent_deferred" : "canonical_semantic_v1";
    if (sourceCoverage.get(result.slot)?.disposition !== expected) fail("SOURCE_RELATIONSHIP_BLOCKED: provisional accounting does not preserve exact source coverage.");
  }
  return deferred;
}

function finalize(input: ExtractionFinalizationInput, contextualEvidence: ReadonlyMap<string, readonly TrustedFinalizationSlot[]>, deferred: ReadonlySet<string>, allowFullyDeferred: boolean): SemanticExtractionResult | null {
  const proposal = atlasProviderExtractionProposalV1Schema.parse(input.proposal); validateTrustedSlots(input.sourceSlots); const ownedSlots = input.sourceSlots.filter((slot) => (slot.role ?? "owned_source") === "owned_source"); const ownedById = new Map(ownedSlots.map((slot) => [slot.slot, slot]));
  const resultBySlot = new Map<string, (typeof proposal.source_results)[number]>();
  for (const sourceResult of proposal.source_results) { if (!ownedById.has(sourceResult.slot)) fail(`proposal supplied a non-owned, foreign, or dangling slot ${sourceResult.slot}.`); if (resultBySlot.has(sourceResult.slot)) fail(`proposal supplied duplicate source result ${sourceResult.slot}.`); resultBySlot.set(sourceResult.slot, sourceResult); }
  for (const slot of ownedSlots) if (!resultBySlot.has(slot.slot)) fail(`proposal omitted owned source slot ${slot.slot}.`);
  const candidate_assertions: SemanticExtractionResult["candidate_assertions"] = []; const source_statement_inventory: SemanticExtractionResult["source_statement_inventory"] = []; const questions: SemanticExtractionResult["questions"] = [];
  for (const source of ownedSlots) {
    const proposalResult = resultBySlot.get(source.slot)!; const wording = sourceContent(source); const sourceEvidence = evidenceFor(source); const candidateIds: string[] = [];
    for (const [index, proposed] of proposalResult.candidates.entries()) {
      if (wording.length > 12_000) fail(`SCHEMA_FIT_BLOCKED: source slot ${source.slot} exceeds the canonical source wording bound.`); if (deferred.has(tupleKey(source.slot, index))) continue;
      const local_candidate_id = candidateId(source.slot, index); candidateIds.push(local_candidate_id);
      candidate_assertions.push({ local_candidate_id, semantic_key: proposed.semantic_key, kind: proposed.kind, payload: proposed.payload, normalized_meaning: proposed.normalized_meaning, source_wording: wording, needs_resolution: proposed.needs_resolution, evidence_refs: [sourceEvidence, ...(contextualEvidence.get(tupleKey(source.slot, index)) ?? []).map(evidenceFor)] });
    }
    const fullyDeferred = proposalResult.classification === "candidate" && proposalResult.candidates.length > 0 && candidateIds.length === 0;
    if (fullyDeferred) { if (!allowFullyDeferred) fail("SCHEMA_FIT_BLOCKED: fully deferred meaning requires qualified provisional composite accounting."); continue; }
    source_statement_inventory.push({ source_unit_id: sourceUnitId(source.slot), page_number: source.pageNumber, locator_type: source.locatorType, locator_id: source.locatorId, classification: proposalResult.classification, destination_local_candidate_ids: candidateIds, ...(proposalResult.classification === "non_fact" ? { non_fact_reason: proposalResult.non_fact_reason! } : {}) });
    for (const question of proposalResult.questions) questions.push({ question: question.question, reason: question.reason, evidence_refs: [sourceEvidence] });
  }
  if (allowFullyDeferred && source_statement_inventory.length === 0) return null;
  return parseSemanticExtractionResult({ version: "v1", candidate_assertions, source_statement_inventory, questions });
}

/** Pure finalization with no contextual-authority path. Legacy slot pairs are rejected. */
export function finalizeExtractionProposal(input: ExtractionFinalizationInput): SemanticExtractionResult {
  if ("acceptedContextEvidence" in input) fail("SOURCE_RELATIONSHIP_BLOCKED: caller-supplied contextual slot pairs are not authority.");
  return finalize(input, new Map(), new Set(), false)!;
}

/**
 * Projects only REL-03-qualified deferred tuples.  It is intentionally pure:
 * strict proposal parsing and tuple identity remain the source of truth, and
 * no contextual authority is issued or consulted here.
 */
export function projectQualifiedStepwiseSemanticResult(input: {
  readonly proposal: unknown;
  readonly sourceSlots: readonly TrustedFinalizationSlot[];
  readonly qualifiedDeferredInterpretations: readonly DeferredDependentInterpretationV1[];
  /** REL-03 revisions are supplied by the immutable handoff, not reconstructed here. */
  readonly qualifiedRelationshipRevisions?: readonly ContextSourceRelationshipRevisionV1[];
}): { readonly canonicalResult: SemanticExtractionResult | null; readonly canonicalCandidateTuples: readonly CanonicalCandidateTupleBinding[] } {
  const proposal = atlasProviderExtractionProposalV1Schema.parse(input.proposal);
  const slots = validateTrustedSlots(input.sourceSlots);
  const owned = new Set(input.sourceSlots.filter((slot) => (slot.role ?? "owned_source") === "owned_source").map((slot) => slot.slot));
  const proposalTuples = new Set<string>();
  for (const result of proposal.source_results) {
    if (!owned.has(result.slot)) fail(`qualified projection proposal supplied a foreign source slot ${result.slot}.`);
    for (const [index] of result.candidates.entries()) proposalTuples.add(tupleKey(result.slot, index));
  }
  for (const slot of slots.values()) if ((slot.role ?? "owned_source") === "owned_source" && !proposal.source_results.some((result) => result.slot === slot.slot)) fail(`qualified projection proposal omitted owned source slot ${slot.slot}.`);
  const deferred = new Set<string>();
  const revisions = new Map((input.qualifiedRelationshipRevisions ?? []).map((revision) => [revision.revisionHash, revision]));
  for (const descriptor of input.qualifiedDeferredInterpretations) {
    const key = tupleKey(descriptor.provider_candidate_tuple.source_slot, descriptor.provider_candidate_tuple.candidate_index);
    const revision = revisions.get(descriptor.relationship_revision_hash);
    const ownedSlot = slots.get(descriptor.source.owned_source.slot);
    const contextSlot = slots.get(descriptor.source.context_source.slot);
    const expectedId = revision === undefined ? undefined : relationshipSha256({ scope: revision.scope, sourceSlot: descriptor.provider_candidate_tuple.source_slot, candidateIndex: descriptor.provider_candidate_tuple.candidate_index, relationshipRevisionHash: revision.revisionHash });
    const proposed = proposal.source_results.find((result) => result.slot === descriptor.provider_candidate_tuple.source_slot)?.candidates[descriptor.provider_candidate_tuple.candidate_index];
    if (deferred.has(key) || !proposalTuples.has(key) || !revision || !ownedSlot || !contextSlot || descriptor.reason !== "essential_provisional_relationship" || descriptor.canonical_candidate_id !== null || descriptor.deferred_interpretation_id !== expectedId || revision.relationship.necessity !== "essential" || !revision.candidateRefs.some((candidate) => tupleKey(candidate.sourceSlot, candidate.candidateIndex) === key) || JSON.stringify(descriptor.source.owned_source) !== JSON.stringify(revision.ownedSource) || JSON.stringify(descriptor.source.context_source) !== JSON.stringify(revision.contextSource) || descriptor.uncertainty !== revision.uncertainty || proposed === undefined || relationshipSha256(descriptor.proposed_candidate_meaning) !== relationshipSha256(proposed)) fail("qualified deferred descriptor is duplicate, foreign, malformed, or detached from its REL-03 revision.");
    deferred.add(key);
  }
  const canonicalResult = finalize({ proposal, sourceSlots: input.sourceSlots }, new Map(), deferred, true);
  const canonicalCandidateTuples: CanonicalCandidateTupleBinding[] = [];
  for (const result of proposal.source_results) for (const [index] of result.candidates.entries()) {
    if (!deferred.has(tupleKey(result.slot, index))) canonicalCandidateTuples.push({ sourceSlot: result.slot, candidateIndex: index, canonicalCandidateId: candidateId(result.slot, index) });
  }
  return { canonicalResult, canonicalCandidateTuples };
}

/** Finalizer-only trusted path: consume, never issue, context authority or provisional accounting. */
export function finalizeVerifiedExtractionProposal(input: VerifiedExtractionFinalizationInput): VerifiedFinalizationOutcome {
  const proposal = atlasProviderExtractionProposalV1Schema.parse(input.proposal); const slots = validateTrustedSlots(input.sourceSlots); const owned = new Map(input.sourceSlots.filter((slot) => (slot.role ?? "owned_source") === "owned_source").map((slot) => [slot.slot, slot]));
  const contextual = verifiedContextualEvidence({ finalization: input, slots, owned, proposal }); const deferred = deferredTuples(proposal, input.provisionalCompositeAccounting);
  for (const key of contextual.keys()) if (deferred.has(key)) fail("SOURCE_RELATIONSHIP_BLOCKED: a deferred provisional tuple cannot acquire trusted contextual evidence.");
  const canonicalResult = finalize(input, contextual, deferred, input.provisionalCompositeAccounting !== undefined);
  return input.provisionalCompositeAccounting === undefined ? { kind: "canonical", canonicalResult: canonicalResult! } : { kind: "provisional_companion", canonicalResult, provisionalCompositeAccounting: input.provisionalCompositeAccounting };
}
