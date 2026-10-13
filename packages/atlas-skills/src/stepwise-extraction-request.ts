import { createHash } from "node:crypto";
import { atlasProviderRelationshipExtractionEnvelopeV1Schema } from "./relationship-extraction-envelope.js";
import { atlasProviderExtractionProposalV1Schema, compileExtractionPrompt, stepwiseMultimodalSemanticExtractionProfileId } from "./semantic-prompt.js";
import { stepwiseSourcePacketVersion, type StepwiseSourcePacket, type StepwiseSourceSlot } from "./stepwise-source-packet.js";

/**
 * The versioned successor profile for the unchanged eight-stage methodology
 * when its request/response contract is the REL proposal envelope.  It is
 * deliberately distinct from the immutable v0.3.1 proposal-only profile.
 */
export const stepwiseRelationshipEnvelopeExtractionProfileId = "atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0" as const;
export const stepwiseRelationshipEnvelopeRequestVersion = "atlas.semantic.stepwise-extraction-request/v1" as const;

export type StepwiseRelationshipEnvelopeRequest = {
  readonly version: typeof stepwiseRelationshipEnvelopeRequestVersion;
  readonly profile: typeof stepwiseRelationshipEnvelopeExtractionProfileId;
  readonly methodologyProfile: StepwiseSourcePacket["semanticProfile"];
  readonly systemPrompt: string;
  readonly responseSchema: Readonly<Record<string, unknown>>;
  readonly sourceSnapshot: StepwiseSourcePacket["sourceSnapshot"];
  readonly sourceSlots: readonly StepwiseSourceSlot[];
  readonly provisionalRelationships: StepwiseSourcePacket["provisionalRelationships"];
  readonly unresolvedRelationshipRequirements: StepwiseSourcePacket["unresolvedRelationshipRequirements"];
  readonly sourceSpecification: string;
  readonly sourceSpecificationSha256: string;
  readonly profileSha256: string;
  readonly requestSha256: string;
};

export type ParsedStepwiseRelationshipEnvelope = {
  readonly semanticProposal: ReturnType<typeof atlasProviderExtractionProposalV1Schema.parse>;
  readonly relationshipProposals: readonly ReturnType<typeof atlasProviderRelationshipExtractionEnvelopeV1Schema.parse>["relationship_proposals"][number][];
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const stableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([, child]) => child !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  throw new Error("Stepwise extraction request must be JSON-serializable.");
};

const frozenMethodologyPrompt = compileExtractionPrompt(stepwiseMultimodalSemanticExtractionProfileId).prompt;
/** Immutable identity of this request/response contract, not a per-request hash. */
export const stepwiseRelationshipEnvelopeProfileSha256 = sha256(stableJson({
  profile: stepwiseRelationshipEnvelopeExtractionProfileId,
  methodologyProfile: stepwiseMultimodalSemanticExtractionProfileId,
  prompt: frozenMethodologyPrompt,
  responseSchema: atlasProviderRelationshipExtractionEnvelopeV1Schema.toJSONSchema(),
}));

function assertPacketIdentity(packet: StepwiseSourcePacket) {
  if (packet.version !== stepwiseSourcePacketVersion || packet.semanticProfile !== stepwiseMultimodalSemanticExtractionProfileId || packet.systemPrompt !== frozenMethodologyPrompt) throw new Error("PROFILE_ID_COLLISION: stepwise request packet does not match the frozen v0.3.1 methodology identity.");
  if (sha256(packet.sourceSpecification) !== packet.sourceSpecificationSha256) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: source specification hash does not match its supplied bytes.");
}

/** Pure, provider-neutral composition. It neither hydrates media nor dispatches work. */
export function buildStepwiseRelationshipEnvelopeRequest(packet: StepwiseSourcePacket): StepwiseRelationshipEnvelopeRequest {
  assertPacketIdentity(packet);
  const responseSchema = atlasProviderRelationshipExtractionEnvelopeV1Schema.toJSONSchema() as Readonly<Record<string, unknown>>;
  const request = {
    version: stepwiseRelationshipEnvelopeRequestVersion,
    profile: stepwiseRelationshipEnvelopeExtractionProfileId,
    methodologyProfile: packet.semanticProfile,
    systemPrompt: packet.systemPrompt,
    responseSchema,
    sourceSnapshot: packet.sourceSnapshot,
    sourceSlots: packet.sourceSlots,
    provisionalRelationships: packet.provisionalRelationships,
    unresolvedRelationshipRequirements: packet.unresolvedRelationshipRequirements,
    sourceSpecification: packet.sourceSpecification,
    sourceSpecificationSha256: packet.sourceSpecificationSha256,
    profileSha256: stepwiseRelationshipEnvelopeProfileSha256,
  } as const;
  return { ...request, requestSha256: sha256(stableJson(request)) };
}

function reject(message: string): never { throw new Error(`STEPWISE_REL_ENVELOPE_REJECTED: ${message}`); }

/**
 * Parses only the strict provider envelope and verifies every provider-facing
 * coordinate against the exact request slot map.  It has no persistence seam.
 */
export function parseStepwiseRelationshipEnvelope(request: StepwiseRelationshipEnvelopeRequest, rawResponse: unknown): ParsedStepwiseRelationshipEnvelope {
  if (request.version !== stepwiseRelationshipEnvelopeRequestVersion || request.profile !== stepwiseRelationshipEnvelopeExtractionProfileId || request.profileSha256 !== stepwiseRelationshipEnvelopeProfileSha256) reject("request profile is unknown or does not match the frozen successor hash.");
  const envelope = atlasProviderRelationshipExtractionEnvelopeV1Schema.parse(rawResponse);
  const slots = new Map(request.sourceSlots.map((slot) => [slot.slot, slot]));
  if (slots.size !== request.sourceSlots.length) reject("request contains duplicate source slots.");
  const ownedSlots = new Set(request.sourceSlots.filter((slot) => slot.role === "owned_source").map((slot) => slot.slot));
  const semanticResults = new Map<string, (typeof envelope.semantic_proposal.source_results)[number]>();
  for (const result of envelope.semantic_proposal.source_results) {
    if (!ownedSlots.has(result.slot)) reject(`semantic proposal references a non-owned or foreign source slot ${result.slot}.`);
    if (semanticResults.has(result.slot)) reject(`semantic proposal repeats source slot ${result.slot}.`);
    semanticResults.set(result.slot, result);
  }
  if (semanticResults.size !== ownedSlots.size || [...ownedSlots].some((slot) => !semanticResults.has(slot))) reject("semantic proposal does not cover the exact owned source-slot map.");
  const relationshipKeys = new Set<string>();
  for (const proposal of envelope.relationship_proposals) {
    const owned = slots.get(proposal.owned_source_slot);
    const context = slots.get(proposal.context_source_slot);
    if (!owned || !context || owned.slot === context.slot) reject("relationship proposal references a missing, foreign, or self source slot.");
    if (owned.role !== "owned_source") reject(`relationship proposal owner ${owned.slot} is not an owned source slot.`);
    if (proposal.source_evidence_slots[0] !== owned.slot || proposal.source_evidence_slots[1] !== context.slot) reject("relationship proposal evidence slots do not match its owned/context pair.");
    const relationshipKey = [owned.slot, context.slot, proposal.contextual_role, proposal.necessity, proposal.proposed_meaning].join("\u0000");
    if (relationshipKeys.has(relationshipKey)) reject("relationship proposal is duplicated.");
    relationshipKeys.add(relationshipKey);
    const candidateRefs = new Set<string>();
    for (const candidate of proposal.candidate_refs) {
      const result = semanticResults.get(candidate.source_slot);
      if (!result || candidate.candidate_index >= result.candidates.length) reject("relationship proposal has a dangling candidate reference.");
      const key = `${candidate.source_slot}\u0000${candidate.candidate_index}`;
      if (candidateRefs.has(key)) reject("relationship proposal repeats a candidate reference.");
      candidateRefs.add(key);
    }
  }
  return { semanticProposal: atlasProviderExtractionProposalV1Schema.parse(envelope.semantic_proposal), relationshipProposals: envelope.relationship_proposals };
}
