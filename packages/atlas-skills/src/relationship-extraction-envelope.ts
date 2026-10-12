import { z } from "zod";
import { atlasProviderExtractionProposalV1Schema } from "./semantic-prompt.js";
import { relationshipContractVersion, relationshipSha256, type ContextSourceRelationshipRevisionV1, type MaterializedRelationshipProposalSet, type ProviderProvenance, type ProvisionalRelationshipRepository, type RelationshipPacketIdentity, type RelationshipSourceLocator, type TrustedFinalizationSlot } from "./relationship-provenance.js";

const slot = z.string().min(1).max(200);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const relationshipProposalSchema = z.strictObject({
  owned_source_slot: slot,
  context_source_slot: slot,
  source_evidence_slots: z.tuple([slot, slot]),
  relationship_type: z.literal("context_qualifies"),
  direction: z.literal("context_to_owned"),
  contextual_role: z.enum(["title", "legend", "scope", "interpretation"]),
  necessity: z.enum(["essential", "optional"]),
  uncertainty: z.enum(["low", "medium", "high", "unknown"]),
  proposed_meaning: z.string().min(1).max(20_000),
  source_language: z.string().min(1).max(64).nullable(),
  candidate_refs: z.array(z.strictObject({ source_slot: slot, candidate_index: z.number().int().nonnegative() })).max(10_000),
  predecessor: z.strictObject({ relationship_revision_hash: sha256, relation: z.enum(["refines", "challenges", "replaces"]) }).nullable(),
});

export const atlasProviderRelationshipProposalV1Schema = relationshipProposalSchema;
export const atlasProviderRelationshipExtractionEnvelopeV1Schema = z.strictObject({
  contract_version: z.literal("atlas.relationship-extraction-envelope/v1"),
  semantic_proposal: atlasProviderExtractionProposalV1Schema,
  relationship_proposals: z.array(relationshipProposalSchema).max(10_000),
});

function reject(message: string): never { throw new Error(`Provisional relationship materialization failed: ${message}`); }
function sourceLocator(source: TrustedFinalizationSlot): RelationshipSourceLocator {
  return { slot: source.slot, pageNumber: source.pageNumber, locatorType: source.locatorType, locatorId: source.locatorId, sourceSha256: source.sourceSha256, ...(source.assetIdentity ? { assetIdentity: source.assetIdentity } : {}) };
}
function validatePacketIdentity(identity: RelationshipPacketIdentity) {
  for (const [field, value] of Object.entries(identity)) if (typeof value !== "string" || value.length === 0) reject(`packet identity ${field} is empty.`);
  if (!/^[a-f0-9]{64}$/.test(identity.sourceSha256)) reject("packet identity source SHA-256 is malformed.");
}
function validateTrustedSlots(sourceSlots: readonly TrustedFinalizationSlot[], packetIdentity: RelationshipPacketIdentity) {
  if (sourceSlots.length === 0) reject("no trusted source slots were supplied.");
  const slots = new Map<string, TrustedFinalizationSlot>();
  for (const source of sourceSlots) {
    if (!source.slot || !Number.isSafeInteger(source.pageNumber) || source.pageNumber < 1 || !source.locatorId) reject("a trusted source slot is malformed.");
    if (!/^[a-f0-9]{64}$/.test(source.sourceSha256) || source.sourceSha256 !== packetIdentity.sourceSha256) reject(`source SHA mismatch for slot ${source.slot}.`);
    if (source.locatorType === "visual_region" && (!source.assetIdentity || !source.assetIdentity.assetRef || !/^[a-f0-9]{64}$/.test(source.assetIdentity.sha256) || source.assetIdentity.sourceSha256 !== packetIdentity.sourceSha256)) reject(`visual source slot ${source.slot} has a source-SHA/asset mismatch.`);
    if (source.locatorType !== "visual_region" && source.assetIdentity) reject(`non-visual source slot ${source.slot} has a foreign asset identity.`);
    if (slots.has(source.slot)) reject(`duplicate trusted source slot ${source.slot}.`);
    slots.set(source.slot, source);
  }
  return slots;
}

/** Strictly validates and persists provider proposals; it has no provider, job, reservation, or finalization dependency. */
export async function materializeProvisionalRelationshipRevisions(input: {
  readonly envelope: unknown;
  readonly packetIdentity: RelationshipPacketIdentity;
  readonly sourceSlots: readonly TrustedFinalizationSlot[];
  readonly providerProvenance: ProviderProvenance;
  readonly repository: ProvisionalRelationshipRepository;
}): Promise<MaterializedRelationshipProposalSet> {
  validatePacketIdentity(input.packetIdentity);
  const envelope = atlasProviderRelationshipExtractionEnvelopeV1Schema.parse(input.envelope);
  const slots = validateTrustedSlots(input.sourceSlots, input.packetIdentity);
  const results = new Map<string, (typeof envelope.semantic_proposal.source_results)[number]>();
  for (const result of envelope.semantic_proposal.source_results) {
    if (!slots.has(result.slot)) reject(`semantic proposal references foreign source slot ${result.slot}.`);
    if (results.has(result.slot)) reject(`semantic proposal has duplicate source slot ${result.slot}.`);
    results.set(result.slot, result);
  }
  const expectedProviderIdentity = [input.providerProvenance.provider, input.providerProvenance.model, input.providerProvenance.endpoint].join(":");
  if (!input.providerProvenance.provider || !input.providerProvenance.model || !input.providerProvenance.endpoint || !Number.isSafeInteger(input.providerProvenance.attempt) || input.providerProvenance.attempt < 1) reject("provider provenance is malformed.");
  const priorRevisions = await input.repository.loadForSnapshot({ projectId: input.packetIdentity.projectId, workspaceId: input.packetIdentity.workspaceId, bundleId: input.packetIdentity.bundleId, documentId: input.packetIdentity.documentId, sourceSha256: input.packetIdentity.sourceSha256 });
  const priorHashes = new Set(priorRevisions.map((revision) => revision.revisionHash));
  const relationshipKeys = new Set<string>();
  const revisions = envelope.relationship_proposals.map((proposal, providerRelationshipOrdinal) => {
    const owned = slots.get(proposal.owned_source_slot);
    const context = slots.get(proposal.context_source_slot);
    if (!owned || !context || owned.slot === context.slot) reject("relationship references a missing, foreign, or self source slot.");
    if ((owned.role ?? "owned_source") !== "owned_source") reject(`relationship owned source ${owned.slot} is not independently owned.`);
    if (proposal.source_evidence_slots[0] !== owned.slot || proposal.source_evidence_slots[1] !== context.slot) reject("relationship source evidence does not equal the owned/context pair.");
    const relationshipKey = [owned.slot, context.slot, proposal.contextual_role, proposal.necessity, proposal.proposed_meaning].join("\u0000");
    if (relationshipKeys.has(relationshipKey)) reject("duplicate relationship proposal.");
    relationshipKeys.add(relationshipKey);
    const candidateKeys = new Set<string>();
    for (const candidate of proposal.candidate_refs) {
      const candidateSource = slots.get(candidate.source_slot);
      const semanticResult = results.get(candidate.source_slot);
      if (!candidateSource || !semanticResult || (candidateSource.role ?? "owned_source") !== "owned_source" || candidate.candidate_index >= semanticResult.candidates.length) reject("relationship has a dangling candidate tuple.");
      const candidateKey = `${candidate.source_slot}\u0000${candidate.candidate_index}`;
      if (candidateKeys.has(candidateKey)) reject("relationship has a duplicate candidate tuple.");
      candidateKeys.add(candidateKey);
    }
    if (proposal.predecessor && !priorHashes.has(proposal.predecessor.relationship_revision_hash)) reject("relationship has a forged predecessor.");
    const scope = input.packetIdentity;
    const relationship = { type: proposal.relationship_type, direction: proposal.direction, contextualRole: proposal.contextual_role, necessity: proposal.necessity } as const;
    const lineageBasis = { scope, ownedSource: sourceLocator(owned), contextSource: sourceLocator(context), relationship };
    const relationshipLineageId = relationshipSha256(lineageBasis);
    const proposalProvenance = { providerIdentity: expectedProviderIdentity, providerRun: input.providerProvenance.runId ?? relationshipSha256(input.providerProvenance), providerRelationshipOrdinal, confidence: null } as const;
    const immutable = { contractVersion: relationshipContractVersion, relationshipLineageId, scope, normalizedDocument: { executionId: scope.executionId, artifactId: scope.artifactId, sourceSha256: scope.sourceSha256 }, ownedSource: sourceLocator(owned), contextSource: sourceLocator(context), relationship, disposition: "proposed" as const, uncertainty: proposal.uncertainty, proposedMeaning: proposal.proposed_meaning, sourceLanguage: proposal.source_language, candidateRefs: proposal.candidate_refs.map((candidate) => ({ sourceSlot: candidate.source_slot, candidateIndex: candidate.candidate_index })), proposalProvenance, predecessor: proposal.predecessor === null ? null : { relationshipRevisionHash: proposal.predecessor.relationship_revision_hash, relation: proposal.predecessor.relation }, authorization: null };
    return { ...immutable, revisionHash: relationshipSha256(immutable) } satisfies ContextSourceRelationshipRevisionV1;
  });
  if (new Set(revisions.map((revision) => revision.revisionHash)).size !== revisions.length) reject("duplicate relationship revision conflict.");
  const persisted = await input.repository.appendForExecution({ executionId: input.packetIdentity.executionId, sourceSnapshot: input.packetIdentity, revisions });
  if (persisted.length !== revisions.length || persisted.some((revision, index) => revision.revisionHash !== revisions[index]?.revisionHash)) reject("repository returned a conflicting relationship revision.");
  return { semanticProposal: envelope.semantic_proposal, revisions: persisted };
}
