import {
  parseStepwiseRelationshipEnvelope,
  prepareProvisionalRelationshipRevisions,
  type ContextSourceRelationshipRevisionV1,
  type ParsedStepwiseRelationshipEnvelope,
  type ProviderProvenance,
  type RelationshipPacketIdentity,
  type StepwiseRelationshipEnvelopeRequest,
  type TrustedFinalizationSlot,
} from "@atlas/skills";
import { prepareDeferredDependentInterpretations, type PreparedDeferredDependentInterpretations } from "./semantic-relationship-sidecar.js";

const reject = (message: string): never => { throw new Error(`SEMANTIC_INTEROPERABILITY_REJECTED: ${message}`); };

/**
 * Projects only the genuine stepwise request slots into REL-03's trusted-slot
 * vocabulary. It has no provider, repository, staging, or worker dependency.
 */
export function projectStepwiseSlotsForRel03(request: StepwiseRelationshipEnvelopeRequest): readonly TrustedFinalizationSlot[] {
  const slots = new Set<string>();
  const projected: TrustedFinalizationSlot[] = [];
  for (const slot of request.sourceSlots) {
    if (!slot.slot || slots.has(slot.slot)) reject("stepwise source slots are empty or duplicated.");
    slots.add(slot.slot);
    const base = { slot: slot.slot, pageNumber: slot.pageNumber, locatorType: slot.locatorType, locatorId: slot.locatorId, sourceSha256: request.sourceSnapshot.sourceSha256, ...(slot.assetIdentity === undefined ? {} : { assetIdentity: slot.assetIdentity }) } as const;
    if (slot.role === "owned_source" && slot.ownership === "independently_owned" && slot.status === "ready") projected.push({ ...base, role: "owned_source" });
    else if (slot.role === "context_only_reference" && slot.ownership === "context_only_reference" && (slot.status === "ready" || (slot.status === "pending_unexamined_visual" && slot.locatorType === "visual_region" && slot.assetIdentity !== undefined))) projected.push({ ...base, role: "reference_context" });
    else if (slot.role === "pending_authorized_media" && slot.ownership === "independently_owned" && slot.status === "pending_unexamined_visual" && slot.locatorType === "visual_region") projected.push({ ...base, role: "pending_authorized_media" });
    else reject(`stepwise role/status/ownership combination is not trusted for ${slot.slot}.`);
  }
  return projected;
}

export function prepareStepwiseRel03Interoperability(input: {
  readonly request: StepwiseRelationshipEnvelopeRequest;
  readonly rawResponse: unknown;
  readonly relationshipScope: RelationshipPacketIdentity;
  readonly providerProvenance: ProviderProvenance;
  readonly trustedPriorRevisions: readonly ContextSourceRelationshipRevisionV1[];
}): {
  readonly parsed: ParsedStepwiseRelationshipEnvelope;
  readonly currentResponseRevisions: readonly ContextSourceRelationshipRevisionV1[];
  readonly qualified: PreparedDeferredDependentInterpretations;
} {
  const slots = projectStepwiseSlotsForRel03(input.request);
  if (input.relationshipScope.executionId !== input.request.sourceSnapshot.executionId || input.relationshipScope.artifactId !== input.request.sourceSnapshot.artifactId || input.relationshipScope.sourceSha256 !== input.request.sourceSnapshot.sourceSha256) reject("relationship scope does not match the exact current request source snapshot.");
  const parsed = parseStepwiseRelationshipEnvelope(input.request, input.rawResponse);
  const prepared = prepareProvisionalRelationshipRevisions({
    envelope: input.rawResponse,
    packetIdentity: input.relationshipScope,
    sourceSlots: slots,
    providerProvenance: input.providerProvenance,
    trustedPriorRevisions: input.trustedPriorRevisions,
  });
  const qualified = prepareDeferredDependentInterpretations({
    semanticProposal: parsed.semanticProposal,
    sourceSlots: slots,
    scope: input.relationshipScope,
    provisionalRelationshipRevisions: prepared.revisions,
  });
  return { parsed, currentResponseRevisions: prepared.revisions, qualified };
}

/**
 * Immutable REL-03 handoff for the separately owned semantic-composite
 * preparation.  This deliberately wraps, rather than recreates, REL-03.
 */
export type QualifiedStepwiseSemanticPreparation = Readonly<{
  parsed: ParsedStepwiseRelationshipEnvelope;
  currentResponseRevisions: readonly ContextSourceRelationshipRevisionV1[];
  qualified: PreparedDeferredDependentInterpretations;
}>;

export function prepareQualifiedStepwiseSemanticPreparation(input: {
  readonly request: StepwiseRelationshipEnvelopeRequest;
  readonly rawResponse: unknown;
  readonly relationshipScope: RelationshipPacketIdentity;
  readonly providerProvenance: ProviderProvenance;
  readonly trustedPriorRevisions: readonly ContextSourceRelationshipRevisionV1[];
}): QualifiedStepwiseSemanticPreparation {
  return prepareStepwiseRel03Interoperability(input);
}
