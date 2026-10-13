import type { SemanticExtractionResult } from "@atlas/contracts";
import { materializeProvisionalRelationshipRevisions, relationshipSha256, type ContextSourceRelationshipRevisionV1, type ProviderProvenance, type ProvisionalRelationshipRepository, type ProvisionalRelationshipStageV1, type RelationshipPacketIdentity, type TrustedFinalizationSlot } from "@atlas/skills";
import { finalizeExtractionProposalWithDeferredTuples, type TrustedFinalizationSlot as CanonicalSlot } from "./semantic-extraction-finalizer.js";

export type RelationshipFinalizationSlot = TrustedFinalizationSlot & CanonicalSlot;
export type DeferredDependentInterpretationV1 = {
  readonly deferred_interpretation_id: string;
  readonly relationship_revision_hash: string;
  readonly provider_candidate_tuple: { readonly source_slot: string; readonly candidate_index: number };
  readonly source: { readonly slot: string; readonly page_number: number; readonly locator_type: string; readonly locator_id: string };
  readonly proposed_candidate_meaning: unknown;
  readonly reason: "essential_provisional_relationship";
  readonly canonical_candidate_id: null;
};
export type ProvisionalRelationshipBindingV1 = {
  readonly relationship_revision_hash: string;
  readonly canonical_candidate_id: string;
  readonly interpretation_state: "not_applied" | "provisional_conditional";
};
export type RelationshipSidecar = ProvisionalRelationshipStageV1 & {
  readonly deferred_interpretations: readonly DeferredDependentInterpretationV1[];
  readonly bindings: readonly ProvisionalRelationshipBindingV1[];
};

function reject(message: string): never { throw new Error(`REL-03 relationship finalization failed: ${message}`); }
const tupleKey = (slot: string, index: number) => `${slot}\u0000${index}`;

/** Composition boundary: REL-01 materialization, pure canonical finalization,
 * then idempotent sidecar staging. It never reads identity/provenance from the
 * provider envelope and deliberately stages only after canonical success. */
export async function finalizeRelationshipExtractionEnvelope(input: {
  readonly envelope: unknown;
  readonly sourceSlots: readonly RelationshipFinalizationSlot[];
  readonly provisionalRevisions: readonly ContextSourceRelationshipRevisionV1[];
  readonly repository: ProvisionalRelationshipRepository;
  readonly packetIdentity: RelationshipPacketIdentity;
  readonly providerProvenance: ProviderProvenance;
  /** Semantic worker execution ID: intentionally distinct from packetIdentity.executionId. */
  readonly executionId: string;
  readonly idempotencyKey: string;
}): Promise<{ readonly canonicalResult: SemanticExtractionResult; readonly sidecar: RelationshipSidecar }> {
  if (!input.executionId || !input.idempotencyKey) reject("semantic staging identity is missing.");
  if (input.packetIdentity.executionId === input.executionId) reject("semantic execution ID must not be conflated with the document-perception execution ID.");
  const materialized = await materializeProvisionalRelationshipRevisions({
    envelope: input.envelope,
    packetIdentity: input.packetIdentity,
    sourceSlots: input.sourceSlots,
    providerProvenance: input.providerProvenance,
    repository: input.repository,
  });
  const essential = new Map<string, ContextSourceRelationshipRevisionV1>();
  for (const revision of materialized.revisions) if (revision.relationship.necessity === "essential") {
    for (const tuple of revision.candidateRefs) {
      const key = tupleKey(tuple.sourceSlot, tuple.candidateIndex);
      const previous = essential.get(key);
      if (previous && previous.revisionHash !== revision.revisionHash) reject("multiple essential relationships claim one provider candidate tuple.");
      essential.set(key, revision);
    }
  }
  const canonicalResult = finalizeExtractionProposalWithDeferredTuples({ proposal: materialized.semanticProposal, sourceSlots: input.sourceSlots }, [...essential.keys()].map((key) => {
    const [sourceSlot, candidateIndex] = key.split("\u0000");
    return { sourceSlot: sourceSlot!, candidateIndex: Number(candidateIndex) };
  }));
  const proposal = materialized.semanticProposal as { readonly source_results: readonly { readonly slot: string; readonly candidates: readonly unknown[] }[] };
  const resultBySlot = new Map(proposal.source_results.map((result) => [result.slot, result]));
  const slotById = new Map(input.sourceSlots.map((slot) => [slot.slot, slot]));
  const deferred = [...essential.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, revision]) => {
    const [sourceSlot, rawIndex] = key.split("\u0000"); const candidateIndex = Number(rawIndex);
    const slot = slotById.get(sourceSlot!); const candidate = resultBySlot.get(sourceSlot!)?.candidates[candidateIndex];
    if (!slot || candidate === undefined) reject("materialized deferred tuple is not locally resolvable.");
    return { deferred_interpretation_id: relationshipSha256({ executionId: input.executionId, sourceSlot, candidateIndex, relationshipRevisionHash: revision.revisionHash }), relationship_revision_hash: revision.revisionHash, provider_candidate_tuple: { source_slot: sourceSlot!, candidate_index: candidateIndex }, source: { slot: slot.slot, page_number: slot.pageNumber, locator_type: slot.locatorType, locator_id: slot.locatorId }, proposed_candidate_meaning: candidate, reason: "essential_provisional_relationship" as const, canonical_candidate_id: null };
  });
  const bindings: ProvisionalRelationshipBindingV1[] = [];
  for (const revision of materialized.revisions) if (revision.relationship.necessity === "optional") for (const tuple of revision.candidateRefs) {
    const id = `candidate-${tuple.sourceSlot}-${String(tuple.candidateIndex + 1).padStart(3, "0")}`;
    if (canonicalResult.candidate_assertions.some((candidate) => candidate.local_candidate_id === id)) bindings.push({ relationship_revision_hash: revision.revisionHash, canonical_candidate_id: id, interpretation_state: "not_applied" });
  }
  const sidecarBody = { executionId: input.executionId, idempotencyKey: input.idempotencyKey, revisions: materialized.revisions, deferred_interpretations: deferred, bindings };
  const sidecar: RelationshipSidecar = { ...sidecarBody, sidecarHash: relationshipSha256(sidecarBody) };
  const persisted = await input.repository.stageSidecar(sidecar);
  if (persisted.sidecarHash !== sidecar.sidecarHash) reject("replay returned a conflicting sidecar.");
  return { canonicalResult, sidecar };
}
