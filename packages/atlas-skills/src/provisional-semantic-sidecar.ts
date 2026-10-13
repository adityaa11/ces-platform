import { parseSemanticExtractionResult, type SemanticExtractionResult } from "@atlas/contracts";
import { createHash } from "node:crypto";
import { relationshipContractVersion, relationshipSha256, type ContextSourceRelationshipRevisionV1 } from "./relationship-provenance.js";
import { stepwiseRelationshipEnvelopeExtractionProfileId, stepwiseRelationshipEnvelopeProfileSha256, type StepwiseRelationshipEnvelopeRequest } from "./stepwise-extraction-request.js";

/** Offline-only companion record. It is deliberately not a Semantic V1 field. */
export const provisionalSemanticSidecarVersion = "atlas.semantic.provisional-sidecar/v1" as const;
/** Additive composite companion; it deliberately does not change sidecar V1. */
export const provisionalSemanticCompositeAccountingVersion = "atlas.semantic.provisional-composite-accounting/v1" as const;

export type ProvisionalSemanticScope = {
  readonly projectId: string;
  readonly workspaceId: string;
  readonly bundleId: string;
  readonly documentId: string;
  readonly executionId: string;
  readonly sourceSha256: string;
};

/**
 * An immutable relationship record prepared beside the sidecar.  `unresolved`
 * is retained as provisional context even though materialized revisions are
 * normally `proposed`.
 */
export type ProvisionalRelationshipRevisionReference = Omit<ContextSourceRelationshipRevisionV1, "disposition"> & {
  readonly disposition: "proposed" | "unresolved";
};

export type ProvisionalSemanticSidecar = {
  readonly version: typeof provisionalSemanticSidecarVersion;
  readonly scope: ProvisionalSemanticScope;
  readonly semanticProfile: string;
  readonly semanticProfileSha256: string;
  readonly requestSha256: string;
  readonly canonicalResultSha256: string;
  readonly sourceAccounting: readonly {
    readonly slot: string;
    readonly pageNumber: number;
    readonly locatorType: string;
    readonly locatorId: string;
    readonly disposition: "finalized_in_semantic_v1" | "pending_unexamined_visual" | "conditional_context";
  }[];
  /** Full immutable provenance is retained rather than reduced to a hash summary. */
  readonly relationshipDependencies: readonly ProvisionalRelationshipRevisionReference[];
  readonly unresolvedRelationshipRequirements: readonly { readonly ownedSourceSlot: string; readonly contextSourceSlot: string; readonly necessity: "essential" | "optional" }[];
  readonly authority: { readonly acceptedRelationshipAuthority: null; readonly masterMutation: false; readonly publishing: false; readonly reconciliationTruth: false };
  readonly sidecarHash: string;
};

export type ProviderCandidateTuple = { readonly sourceSlot: string; readonly candidateIndex: number };
export type CanonicalCandidateTupleBinding = ProviderCandidateTuple & { readonly canonicalCandidateId: string };
export type DeferredDependentInterpretationDescriptor = {
  readonly deferred_interpretation_id: string;
  readonly relationship_revision_hash: string;
  readonly provider_candidate_tuple: { readonly source_slot: string; readonly candidate_index: number };
  readonly source: { readonly owned_source: Record<string, unknown>; readonly context_source: Record<string, unknown> };
  readonly uncertainty: "low" | "medium" | "high" | "unknown";
  readonly proposed_candidate_meaning: unknown;
  readonly reason: "essential_provisional_relationship";
  readonly canonical_candidate_id: null;
};
export type ProvisionalSemanticCompositeAccounting = {
  readonly version: typeof provisionalSemanticCompositeAccountingVersion;
  readonly scope: ProvisionalSemanticScope;
  readonly semanticProfile: string;
  readonly semanticProfileSha256: string;
  readonly requestSha256: string;
  readonly canonicalResultSha256: string;
  readonly canonicalSourceSlots: readonly string[];
  readonly sourceCoverage: readonly { readonly slot: string; readonly disposition: "canonical_semantic_v1" | "essential_dependent_deferred" | "pending_unexamined_visual" }[];
  readonly tupleCoverage: readonly { readonly sourceSlot: string; readonly candidateIndex: number; readonly disposition: "independently_finalized" | "optional_relationship_but_independent" | "essential_dependent_deferred"; readonly canonicalCandidateId?: string; readonly deferredInterpretationId?: string; readonly relationshipRevisionHash?: string }[];
  readonly deferredInterpretations: readonly DeferredDependentInterpretationDescriptor[];
  readonly relationshipDependencies: readonly ProvisionalRelationshipRevisionReference[];
  readonly authority: { readonly acceptedRelationshipAuthority: null; readonly masterMutation: false; readonly publishing: false; readonly reconciliationTruth: false };
  readonly compositeHash: string;
};

type Lease = { readonly key: string; readonly generation: number };

const stableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([, child]) => child !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  throw new Error("SCHEMA_FIT_BLOCKED: provisional sidecar must be JSON-serializable.");
};
const sha256 = (value: unknown) => createHash("sha256").update(stableJson(value)).digest("hex");
const reject = (message: string): never => { throw new Error(`PROVISIONAL_SIDECAR_REJECTED: ${message}`); };
const isHash = (value: string) => /^[a-f0-9]{64}$/.test(value);
const scopeKey = (scope: ProvisionalSemanticScope, idempotencyKey: string) => `${stableJson(scope)}\u0000${idempotencyKey}`;

function assertScope(scope: ProvisionalSemanticScope, request: StepwiseRelationshipEnvelopeRequest) {
  for (const [key, value] of Object.entries(scope)) if (!value) reject(`scope ${key} is missing.`);
  if (!isHash(scope.sourceSha256) || scope.sourceSha256 !== request.sourceSnapshot.sourceSha256) reject("scope source SHA does not match the request snapshot.");
  if (scope.documentId !== request.sourceSnapshot.artifactId) reject("scope document does not match the request artifact.");
  if (request.profile !== stepwiseRelationshipEnvelopeExtractionProfileId || request.profileSha256 !== stepwiseRelationshipEnvelopeProfileSha256) reject("request profile does not match the frozen profile fingerprint.");
}

const slotKey = (slot: { readonly pageNumber: number; readonly locatorType: string; readonly locatorId: string }) => `${slot.pageNumber}\u0000${slot.locatorType}\u0000${slot.locatorId}`;
const tupleKey = (tuple: ProviderCandidateTuple) => `${tuple.sourceSlot}\u0000${tuple.candidateIndex}`;
/** Structural REL-03 companion identity; it does not create a durable record. */
export const provisionalSemanticDeferredInterpretationId = (scope: ProvisionalSemanticScope, tuple: ProviderCandidateTuple, relationshipRevisionHash: string) => sha256({
  version: "atlas.semantic.provisional-deferred-interpretation/v1",
  scope,
  providerCandidateTuple: tuple,
  relationshipRevisionHash,
});
const sourceLocator = (slot: StepwiseRelationshipEnvelopeRequest["sourceSlots"][number], sourceSha256: string) => ({
  slot: slot.slot,
  pageNumber: slot.pageNumber,
  locatorType: slot.locatorType,
  locatorId: slot.locatorId,
  sourceSha256,
  ...(slot.assetIdentity === undefined ? {} : { assetIdentity: slot.assetIdentity }),
});
const immutableRevision = (revision: ProvisionalRelationshipRevisionReference) => {
  const { revisionHash: _revisionHash, ...immutable } = revision;
  return immutable;
};
const exactLocator = (slot: StepwiseRelationshipEnvelopeRequest["sourceSlots"][number], sourceSha256: string) => stableJson(sourceLocator(slot, sourceSha256));

function validateRelationshipDependencies(input: { readonly scope: ProvisionalSemanticScope; readonly request: StepwiseRelationshipEnvelopeRequest; readonly relationshipRevisions: readonly ProvisionalRelationshipRevisionReference[]; readonly currentResponseRelationshipRevisions?: readonly ProvisionalRelationshipRevisionReference[] }) {
  const slots = new Map(input.request.sourceSlots.map((slot) => [slot.slot, slot]));
  if (slots.size !== input.request.sourceSlots.length) reject("request has duplicate source slots.");
  const extension = input.request.provisionalRelationships.relationships;
  const currentResponseRelationshipRevisions = input.currentResponseRelationshipRevisions ?? [];
  const allRevisions = [...input.relationshipRevisions, ...currentResponseRelationshipRevisions];
  const revisionByHash = new Map(allRevisions.map((revision) => [revision.revisionHash, revision]));
  if (revisionByHash.size !== allRevisions.length) reject("relationship revision references are duplicated.");
  if (input.relationshipRevisions.length !== extension.length) reject("a supplied relationship revision is not represented in the request extension.");
  const validateRevision = (revision: ProvisionalRelationshipRevisionReference) => {
    if (!isHash(revision.revisionHash) || revision.contractVersion !== relationshipContractVersion || revision.revisionHash !== relationshipSha256(immutableRevision(revision))) reject("relationship dependency immutable provenance is malformed.");
    if (stableJson(revision.normalizedDocument) !== stableJson(input.request.sourceSnapshot) || revision.scope.projectId !== input.scope.projectId || revision.scope.workspaceId !== input.scope.workspaceId || revision.scope.bundleId !== input.scope.bundleId || revision.scope.documentId !== input.scope.documentId || revision.scope.artifactId !== input.request.sourceSnapshot.artifactId || revision.scope.sourceSha256 !== input.request.sourceSnapshot.sourceSha256 || (revision.scope.executionId !== input.scope.executionId && revision.scope.executionId !== revision.normalizedDocument.executionId)) reject("relationship dependency belongs to a foreign source snapshot.");
    const owned = slots.get(revision.ownedSource.slot) ?? reject("relationship dependency does not match request slots.");
    const context = slots.get(revision.contextSource.slot) ?? reject("relationship dependency does not match request slots.");
    if (stableJson(revision.ownedSource) !== exactLocator(owned, input.request.sourceSnapshot.sourceSha256) || stableJson(revision.contextSource) !== exactLocator(context, input.request.sourceSnapshot.sourceSha256) || revision.authorization !== null) reject("relationship dependency provenance does not match exact request source slots.");
  };
  for (const revision of allRevisions) validateRevision(revision);
  for (const relationship of extension) {
    const revision = revisionByHash.get(relationship.revision_hash) ?? reject("relationship dependency is foreign or missing.");
    if (revision.relationshipLineageId !== relationship.relationship_lineage_id || revision.relationship.contextualRole !== relationship.contextual_role || revision.relationship.necessity !== relationship.necessity || revision.uncertainty !== relationship.uncertainty || revision.disposition !== relationship.disposition) reject("relationship dependency does not match the request extension.");
    const owned = slots.get(relationship.owned_source_slot) ?? reject("relationship dependency does not match request slots.");
    const context = slots.get(relationship.context_source_slot) ?? reject("relationship dependency does not match request slots.");
    if (relationship.source_evidence_slots[0] !== owned.slot || relationship.source_evidence_slots[1] !== context.slot) reject("relationship dependency does not match request slots.");
  }
  return { slots, revisionByHash };
}

/**
 * Prepares complete, attributable accounting without staging a durable result.
 * Canonical V1 carries only finalized owned sources; pending visuals and
 * provisional context are retained here rather than misclassified as non_fact.
 */
export function prepareProvisionalSemanticSidecar(input: {
  readonly scope: ProvisionalSemanticScope;
  readonly request: StepwiseRelationshipEnvelopeRequest;
  readonly canonicalResult: unknown;
  readonly relationshipRevisions: readonly ProvisionalRelationshipRevisionReference[];
}): ProvisionalSemanticSidecar {
  assertScope(input.scope, input.request);
  const canonicalResult = parseSemanticExtractionResult(input.canonicalResult);
  const { slots } = validateRelationshipDependencies(input);
  const inventory = new Map(canonicalResult.source_statement_inventory.map((item) => [`${item.page_number}\u0000${item.locator_type}\u0000${item.locator_id}`, item]));
  const eligible = input.request.sourceSlots.filter((slot) => slot.role === "owned_source" && slot.status === "ready");
  if (inventory.size !== canonicalResult.source_statement_inventory.length) reject("canonical result repeats a source inventory locator.");
  if (inventory.size !== eligible.length) reject("canonical result does not account for the exact finalized owned-source set.");
  for (const slot of eligible) if (!inventory.has(`${slot.pageNumber}\u0000${slot.locatorType}\u0000${slot.locatorId}`)) reject(`canonical result omits owned source slot ${slot.slot}.`);
  for (const slot of input.request.sourceSlots.filter((slot) => slot.role !== "owned_source" || slot.status !== "ready")) if (inventory.has(`${slot.pageNumber}\u0000${slot.locatorType}\u0000${slot.locatorId}`)) reject(`canonical result improperly accounts a pending or contextual slot ${slot.slot}.`);
  const canonicalEvidenceSlots = new Set(eligible.map(slotKey));
  for (const [kind, records] of [["candidate", canonicalResult.candidate_assertions], ["question", canonicalResult.questions]] as const) {
    for (const record of records) for (const evidence of record.evidence_refs ?? []) {
      if (!canonicalEvidenceSlots.has(`${evidence.page_number}\u0000${evidence.locator_type}\u0000${evidence.locator_id}`)) reject(`${kind} evidence does not match an exact finalized request source slot.`);
    }
  }

  const extension = input.request.provisionalRelationships.relationships;
  const revisionByHash = new Map(input.relationshipRevisions.map((revision) => [revision.revisionHash, revision]));
  const sourceAccounting = input.request.sourceSlots.map((slot) => ({ slot: slot.slot, pageNumber: slot.pageNumber, locatorType: slot.locatorType, locatorId: slot.locatorId, disposition: slot.status === "pending_unexamined_visual" ? "pending_unexamined_visual" as const : slot.role === "context_only_reference" ? "conditional_context" as const : "finalized_in_semantic_v1" as const }));
  const body = {
    version: provisionalSemanticSidecarVersion,
    scope: input.scope,
    semanticProfile: input.request.profile,
    semanticProfileSha256: input.request.profileSha256,
    requestSha256: input.request.requestSha256,
    canonicalResultSha256: sha256(canonicalResult),
    sourceAccounting,
    relationshipDependencies: extension.map((relationship) => revisionByHash.get(relationship.revision_hash)!),
    unresolvedRelationshipRequirements: input.request.unresolvedRelationshipRequirements.map((item) => ({ ownedSourceSlot: item.ownedSourceSlot, contextSourceSlot: item.contextSourceSlot, necessity: item.necessity })),
    authority: { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false } as const,
  };
  return { ...body, sidecarHash: sha256(body) };
}

/**
 * Validates a partial canonical V1 outcome together with REL-03-shaped
 * descriptors. This is pure preparation only; it cannot stage or publish.
 */
export function prepareProvisionalSemanticCompositeAccounting(input: {
  readonly scope: ProvisionalSemanticScope;
  readonly request: StepwiseRelationshipEnvelopeRequest;
  readonly canonicalResult: unknown;
  readonly relationshipRevisions: readonly ProvisionalRelationshipRevisionReference[];
  /** Revisions prepared from the current parsed response are distinct from request-projected history. */
  readonly currentResponseRelationshipRevisions?: readonly ProvisionalRelationshipRevisionReference[];
  readonly providerCandidateTuples: readonly ProviderCandidateTuple[];
  readonly independentCandidateTuples: readonly ProviderCandidateTuple[];
  readonly optionalRelationshipTuples: readonly ProviderCandidateTuple[];
  readonly canonicalCandidateTuples: readonly CanonicalCandidateTupleBinding[];
  readonly deferredInterpretations: readonly DeferredDependentInterpretationDescriptor[];
}): ProvisionalSemanticCompositeAccounting {
  assertScope(input.scope, input.request);
  const { slots, revisionByHash } = validateRelationshipDependencies(input);
  const canonicalResult = parseSemanticExtractionResult(input.canonicalResult);
  const owned = new Map([...slots.values()].filter((slot) => slot.role === "owned_source" && slot.status === "ready").map((slot) => [slot.slot, slot]));
  const candidateIds = new Set(canonicalResult.candidate_assertions.map((candidate) => candidate.local_candidate_id));
  const inventoryByLocator = new Map(canonicalResult.source_statement_inventory.map((item) => [`${item.page_number}\u0000${item.locator_type}\u0000${item.locator_id}`, item]));
  if (inventoryByLocator.size !== canonicalResult.source_statement_inventory.length) reject("canonical result repeats a source inventory locator.");
  const canonicalSourceSlots = [...inventoryByLocator].map(([locator]) => [...owned.values()].find((slot) => slotKey(slot) === locator)?.slot ?? reject("canonical result accounts a foreign, pending, or contextual source slot.")).sort();
  const sourceSlotForEvidence = (evidence: { readonly page_number: number; readonly locator_type: string; readonly locator_id: string }) => [...owned.values()].find((slot) => slotKey(slot) === `${evidence.page_number}\u0000${evidence.locator_type}\u0000${evidence.locator_id}`)?.slot;
  for (const [kind, records] of [["candidate", canonicalResult.candidate_assertions], ["question", canonicalResult.questions]] as const) {
    for (const record of records) for (const evidence of record.evidence_refs ?? []) {
      if (!sourceSlotForEvidence(evidence)) reject(`${kind} evidence does not match an exact canonical request source slot.`);
    }
  }
  const universe = new Map<string, ProviderCandidateTuple>();
  for (const tuple of input.providerCandidateTuples) {
    if (!owned.has(tuple.sourceSlot) || !Number.isSafeInteger(tuple.candidateIndex) || tuple.candidateIndex < 0 || universe.has(tupleKey(tuple))) reject("provider candidate tuple is foreign, malformed, or duplicated.");
    universe.set(tupleKey(tuple), tuple);
  }
  const classifications = new Map<string, "independently_finalized" | "optional_relationship_but_independent" | "essential_dependent_deferred">();
  const addClassification = (tuples: readonly ProviderCandidateTuple[], disposition: "independently_finalized" | "optional_relationship_but_independent") => {
    for (const tuple of tuples) {
      const key = tupleKey(tuple);
      if (!universe.has(key) || classifications.has(key)) reject("candidate tuple is foreign, missing, or represented more than once.");
      classifications.set(key, disposition);
    }
  };
  addClassification(input.independentCandidateTuples, "independently_finalized");
  addClassification(input.optionalRelationshipTuples, "optional_relationship_but_independent");
  const deferredByTuple = new Map<string, DeferredDependentInterpretationDescriptor>();
  const deferredIds = new Set<string>();
  for (const deferred of input.deferredInterpretations) {
    const tuple = { sourceSlot: deferred.provider_candidate_tuple?.source_slot, candidateIndex: deferred.provider_candidate_tuple?.candidate_index };
    const key = tupleKey(tuple);
    const source = owned.get(tuple.sourceSlot);
    const revision = revisionByHash.get(deferred.relationship_revision_hash);
    const expectedRel03Id = revision === undefined ? undefined : relationshipSha256({ scope: revision.scope, sourceSlot: tuple.sourceSlot, candidateIndex: tuple.candidateIndex, relationshipRevisionHash: deferred.relationship_revision_hash });
    if (!source || !universe.has(key) || classifications.has(key) || deferredByTuple.has(key) || deferredIds.has(deferred.deferred_interpretation_id) || !revision || deferred.deferred_interpretation_id !== expectedRel03Id || deferred.reason !== "essential_provisional_relationship" || deferred.canonical_candidate_id !== null || !["low", "medium", "high", "unknown"].includes(deferred.uncertainty) || deferred.proposed_candidate_meaning === undefined || stableJson(deferred.source?.owned_source) !== exactLocator(source, input.scope.sourceSha256) || stableJson(deferred.source?.context_source) !== stableJson(revision.contextSource) || revision.relationship.necessity !== "essential" || !revision.candidateRefs.some((candidate) => tupleKey(candidate) === key)) reject("deferred descriptor is foreign, malformed, duplicated, or lacks an immutable essential dependency.");
    classifications.set(key, "essential_dependent_deferred"); deferredByTuple.set(key, deferred); deferredIds.add(deferred.deferred_interpretation_id);
  }
  if (classifications.size !== universe.size) reject("provider candidate tuple is missing composite accounting.");
  const canonicalBindings = new Map<string, CanonicalCandidateTupleBinding>();
  for (const binding of input.canonicalCandidateTuples) {
    const key = tupleKey(binding);
    if (!universe.has(key) || canonicalBindings.has(key) || !candidateIds.has(binding.canonicalCandidateId) || classifications.get(key) === "essential_dependent_deferred") reject("canonical candidate tuple is foreign, duplicate, missing from V1, or deferred.");
    canonicalBindings.set(key, binding);
  }
  for (const [key, disposition] of classifications) if (disposition !== "essential_dependent_deferred" && !canonicalBindings.has(key)) reject("independent or optional candidate tuple is not represented canonically.");
  const bindingsByCandidate = new Map<string, CanonicalCandidateTupleBinding[]>();
  for (const binding of canonicalBindings.values()) bindingsByCandidate.set(binding.canonicalCandidateId, [...(bindingsByCandidate.get(binding.canonicalCandidateId) ?? []), binding]);
  for (const candidate of canonicalResult.candidate_assertions) {
    const bindings = bindingsByCandidate.get(candidate.local_candidate_id);
    if (!bindings || bindings.length === 0 || !candidate.evidence_refs || candidate.evidence_refs.length === 0) reject("canonical candidate is detached from its tuple or exact source evidence.");
    const bindingSources = new Set(bindings!.map((binding) => binding.sourceSlot));
    for (const evidence of candidate.evidence_refs) if (!bindingSources.has(sourceSlotForEvidence(evidence) ?? "")) reject("canonical candidate evidence does not match its bound tuple source.");
  }
  for (const [slot, item] of [...inventoryByLocator].map(([locator, item]) => [[...owned.values()].find((candidate) => slotKey(candidate) === locator)!.slot, item] as const)) {
    if (item.classification === "candidate" && (!item.destination_local_candidate_ids.length || item.destination_local_candidate_ids.some((id) => !bindingsByCandidate.get(id)?.some((binding) => binding.sourceSlot === slot)))) reject("canonical inventory destination is detached from a canonical tuple binding.");
  }
  const canonicalTupleSources = new Set([...canonicalBindings.values()].map((binding) => binding.sourceSlot));
  for (const sourceSlot of canonicalTupleSources) if (!canonicalSourceSlots.includes(sourceSlot)) reject("canonical candidate tuple source is absent from canonical inventory.");
  for (const slot of canonicalSourceSlots) {
    const item = inventoryByLocator.get(slotKey(owned.get(slot)!))!;
    if (item.classification === "non_fact" && (canonicalTupleSources.has(slot) || [...deferredByTuple.values()].some((deferred) => deferred.provider_candidate_tuple.source_slot === slot))) reject("canonical non_fact conflicts with meaningful candidate tuple.");
  }
  for (const slot of owned.values()) if (!canonicalSourceSlots.includes(slot.slot) && ![...universe.values()].some((tuple) => tuple.sourceSlot === slot.slot)) reject("ready owned source is absent from canonical and tuple accounting.");
  const sourceCoverage: { slot: string; disposition: "canonical_semantic_v1" | "essential_dependent_deferred" | "pending_unexamined_visual" }[] = [...owned.values()].filter((slot) => canonicalSourceSlots.includes(slot.slot) || [...deferredByTuple.values()].some((deferred) => deferred.provider_candidate_tuple.source_slot === slot.slot)).map((slot) => ({ slot: slot.slot, disposition: canonicalSourceSlots.includes(slot.slot) ? "canonical_semantic_v1" as const : "essential_dependent_deferred" as const }));
  for (const slot of input.request.sourceSlots.filter((slot) => slot.status === "pending_unexamined_visual")) sourceCoverage.push({ slot: slot.slot, disposition: "pending_unexamined_visual" });
  sourceCoverage.sort((left, right) => left.slot.localeCompare(right.slot));
  const tupleCoverage = [...universe.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, tuple]) => {
    const disposition = classifications.get(key)!; const canonical = canonicalBindings.get(key); const deferred = deferredByTuple.get(key);
    return { ...tuple, disposition, ...(canonical === undefined ? {} : { canonicalCandidateId: canonical.canonicalCandidateId }), ...(deferred === undefined ? {} : { deferredInterpretationId: deferred.deferred_interpretation_id, relationshipRevisionHash: deferred.relationship_revision_hash }) };
  });
  const body = { version: provisionalSemanticCompositeAccountingVersion, scope: input.scope, semanticProfile: input.request.profile, semanticProfileSha256: input.request.profileSha256, requestSha256: input.request.requestSha256, canonicalResultSha256: sha256(canonicalResult), canonicalSourceSlots, sourceCoverage, tupleCoverage, deferredInterpretations: [...input.deferredInterpretations].sort((left, right) => left.deferred_interpretation_id.localeCompare(right.deferred_interpretation_id)), relationshipDependencies: [...revisionByHash.values()].sort((left, right) => left.revisionHash.localeCompare(right.revisionHash)), authority: { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false } as const };
  return { ...body, compositeHash: sha256(body) };
}

/** Deterministic fake only; it models the fenced winner/replay contract, not SQL durability. */
export class InMemoryProvisionalSemanticSidecarRepository {
  #generations = new Map<string, number>();
  #staged = new Map<string, ProvisionalSemanticSidecar>();
  acquireLease(scope: ProvisionalSemanticScope, idempotencyKey: string): Lease {
    const key = scopeKey(scope, idempotencyKey); const generation = (this.#generations.get(key) ?? 0) + 1;
    this.#generations.set(key, generation); return { key, generation };
  }
  stage(input: { readonly sidecar: ProvisionalSemanticSidecar; readonly idempotencyKey: string; readonly lease: Lease }): ProvisionalSemanticSidecar {
    const key = scopeKey(input.sidecar.scope, input.idempotencyKey);
    if (key !== input.lease.key || this.#generations.get(key) !== input.lease.generation) reject("stale lease generation.");
    const existing = this.#staged.get(key);
    if (existing && existing.sidecarHash !== input.sidecar.sidecarHash) reject("staged winner does not match replay sidecar.");
    const winner = existing ?? input.sidecar;
    if (!existing) this.#staged.set(key, winner);
    return winner;
  }
  acknowledge(input: { readonly sidecar: ProvisionalSemanticSidecar; readonly idempotencyKey: string; readonly failAfterCommit?: boolean }): ProvisionalSemanticSidecar {
    const existing = this.#staged.get(scopeKey(input.sidecar.scope, input.idempotencyKey));
    if (!existing || existing.sidecarHash !== input.sidecar.sidecarHash) reject("acknowledgement does not match staged winner.");
    if (input.failAfterCommit) throw new Error("ACK_LOSS_SIMULATED");
    return existing!;
  }
}
