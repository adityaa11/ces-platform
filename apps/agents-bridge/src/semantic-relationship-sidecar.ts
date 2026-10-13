import { relationshipSha256, type ContextSourceRelationshipRevisionV1, type RelationshipPacketIdentity, type RelationshipSourceLocator, type TrustedFinalizationSlot } from "@atlas/skills";

type ParsedSemanticProposal = {
  readonly source_results: readonly { readonly slot: string; readonly candidates: readonly unknown[] }[];
};

export type RelationshipFinalizationSlot = TrustedFinalizationSlot & { readonly content?: string };
export type CandidateTuple = { readonly source_slot: string; readonly candidate_index: number };
export type DeferredDependentInterpretationV1 = {
  readonly deferred_interpretation_id: string;
  readonly relationship_revision_hash: string;
  readonly provider_candidate_tuple: CandidateTuple;
  readonly source: { readonly owned_source: RelationshipSourceLocator; readonly context_source: RelationshipSourceLocator };
  readonly uncertainty: ContextSourceRelationshipRevisionV1["uncertainty"];
  readonly proposed_candidate_meaning: unknown;
  readonly reason: "essential_provisional_relationship";
  readonly canonical_candidate_id: null;
};
export type PreparedDeferredDependentInterpretations = {
  readonly deferred_interpretations: readonly DeferredDependentInterpretationV1[];
  readonly independent_candidate_tuples: readonly CandidateTuple[];
  readonly optional_relationship_tuples: readonly CandidateTuple[];
};

function reject(message: string): never { throw new Error(`REL-03 deferred interpretation preparation failed: ${message}`); }
const tupleKey = (slot: string, index: number) => `${slot}\u0000${index}`;
const tupleFromKey = (key: string): CandidateTuple => {
  const [source_slot, rawIndex] = key.split("\u0000");
  return { source_slot: source_slot!, candidate_index: Number(rawIndex) };
};
function sameScope(left: RelationshipPacketIdentity, right: RelationshipPacketIdentity) {
  return left.projectId === right.projectId && left.workspaceId === right.workspaceId && left.bundleId === right.bundleId && left.documentId === right.documentId && left.executionId === right.executionId && left.artifactId === right.artifactId && left.sourceSha256 === right.sourceSha256;
}
function sameLocator(slot: TrustedFinalizationSlot, locator: RelationshipSourceLocator) {
  return slot.slot === locator.slot && slot.pageNumber === locator.pageNumber && slot.locatorType === locator.locatorType && slot.locatorId === locator.locatorId && slot.sourceSha256 === locator.sourceSha256 && slot.sourceSha256.length > 0;
}

/** Produces draft-only descriptors from strictly parsed meaning and immutable REL-02 revisions. */
export function prepareDeferredDependentInterpretations(input: {
  readonly semanticProposal: ParsedSemanticProposal;
  readonly sourceSlots: readonly TrustedFinalizationSlot[];
  readonly scope: RelationshipPacketIdentity;
  readonly provisionalRelationshipRevisions: readonly ContextSourceRelationshipRevisionV1[];
}): PreparedDeferredDependentInterpretations {
  const slots = new Map<string, TrustedFinalizationSlot>();
  for (const slot of input.sourceSlots) {
    if (!slot.slot || slots.has(slot.slot) || slot.sourceSha256 !== input.scope.sourceSha256) reject("trusted source slots are malformed, duplicate, or outside the supplied scope.");
    slots.set(slot.slot, slot);
  }
  const results = new Map<string, (typeof input.semanticProposal.source_results)[number]>();
  for (const result of input.semanticProposal.source_results) {
    const slot = slots.get(result.slot);
    if (!slot || slot.role === "reference_context" || slot.role === "pending_authorized_media" || results.has(result.slot)) reject("semantic proposal has a foreign, unowned, or duplicate source result.");
    results.set(result.slot, result);
  }
  for (const slot of slots.values()) if ((slot.role ?? "owned_source") === "owned_source" && !results.has(slot.slot)) reject("semantic proposal omitted an owned source result.");

  const allCandidateTuples = new Set<string>();
  for (const result of results.values()) for (const [candidateIndex] of result.candidates.entries()) allCandidateTuples.add(tupleKey(result.slot, candidateIndex));
  const revisions = new Set<string>();
  const classifiedTuples = new Map<string, { readonly revision: ContextSourceRelationshipRevisionV1; readonly necessity: "essential" | "optional" }>();
  for (const revision of input.provisionalRelationshipRevisions) {
    if (!revision.revisionHash || revisions.has(revision.revisionHash)) reject("relationship revisions are duplicate or missing an immutable revision hash.");
    revisions.add(revision.revisionHash);
    if (revision.contractVersion !== "atlas.context-provenance/v1" || revision.disposition !== "proposed" || revision.authorization !== null || !sameScope(revision.scope, input.scope)) reject("relationship revision is foreign, mutable, unowned, or outside the trusted scope.");
    if (revision.normalizedDocument.executionId !== input.scope.executionId || revision.normalizedDocument.artifactId !== input.scope.artifactId || revision.normalizedDocument.sourceSha256 !== input.scope.sourceSha256) reject("relationship revision normalized-document identity does not match scope.");
    const owner = slots.get(revision.ownedSource.slot); const context = slots.get(revision.contextSource.slot);
    if (!owner || !context || (owner.role ?? "owned_source") !== "owned_source" || owner.slot === context.slot || !sameLocator(owner, revision.ownedSource) || !sameLocator(context, revision.contextSource)) reject("relationship revision source references are foreign, mismatched, or unowned.");
    for (const candidateRef of revision.candidateRefs) {
      const key = tupleKey(candidateRef.sourceSlot, candidateRef.candidateIndex);
      if (!Number.isSafeInteger(candidateRef.candidateIndex) || candidateRef.candidateIndex < 0 || !allCandidateTuples.has(key) || candidateRef.sourceSlot !== owner.slot) reject("relationship revision has an out-of-range, mismatched, or foreign candidate tuple.");
      if (classifiedTuples.has(key)) reject("relationship revisions have duplicate or conflicting candidate tuple dependencies.");
      classifiedTuples.set(key, { revision, necessity: revision.relationship.necessity });
    }
  }

  const deferred_interpretations: DeferredDependentInterpretationV1[] = [];
  const optional_relationship_tuples: CandidateTuple[] = [];
  for (const [key, dependency] of [...classifiedTuples.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (dependency.necessity === "optional") { optional_relationship_tuples.push(tupleFromKey(key)); continue; }
    const tuple = tupleFromKey(key); const candidate = results.get(tuple.source_slot)?.candidates[tuple.candidate_index];
    if (candidate === undefined) reject("essential relationship candidate tuple is not locally resolvable.");
    deferred_interpretations.push({
      deferred_interpretation_id: relationshipSha256({ scope: input.scope, sourceSlot: tuple.source_slot, candidateIndex: tuple.candidate_index, relationshipRevisionHash: dependency.revision.revisionHash }),
      relationship_revision_hash: dependency.revision.revisionHash, provider_candidate_tuple: tuple,
      source: { owned_source: dependency.revision.ownedSource, context_source: dependency.revision.contextSource }, uncertainty: dependency.revision.uncertainty,
      proposed_candidate_meaning: candidate, reason: "essential_provisional_relationship", canonical_candidate_id: null,
    });
  }
  const independent_candidate_tuples = [...allCandidateTuples].filter((key) => !classifiedTuples.has(key)).sort().map(tupleFromKey);
  return { deferred_interpretations, independent_candidate_tuples, optional_relationship_tuples };
}

/**
 * Compatibility guard for the pre-existing worker candidate.  The integrated
 * composition is outside this GO authorization and must fail closed until its
 * separately owned durable/worker path is qualified.
 */
export async function finalizeRelationshipExtractionEnvelope(_input: unknown): Promise<{ readonly canonicalResult: never }> {
  reject("integrated finalization is not authorized by the REL-03 pure-interface prerequisite.");
}
