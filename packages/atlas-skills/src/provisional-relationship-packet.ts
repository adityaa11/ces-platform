import { z } from "zod";
import { relationshipContractVersion, relationshipSha256, type ContextSourceRelationshipRevisionV1, type ProvisionalRelationshipRepository, type RelationshipPacketIdentity, type RelationshipSourceLocator, type TrustedFinalizationSlot } from "./relationship-provenance.js";

const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const packetRelationshipSchema = z.strictObject({
  relationship_lineage_id: sha256,
  revision_hash: sha256,
  owned_source_slot: z.string().min(1).max(200),
  context_source_slot: z.string().min(1).max(200),
  contextual_role: z.enum(["title", "legend", "scope", "interpretation"]),
  necessity: z.enum(["essential", "optional"]),
  uncertainty: z.enum(["low", "medium", "high", "unknown"]),
  disposition: z.enum(["proposed", "unresolved"]),
  source_evidence_slots: z.tuple([z.string().min(1).max(200), z.string().min(1).max(200)]),
});

export const provisionalRelationshipPacketExtensionV1Schema = z.strictObject({
  contract_version: z.literal("atlas.relationship-packet-extension/v1"),
  relationships: z.array(packetRelationshipSchema),
});

export type ProvisionalRelationshipPacketExtensionV1 = {
  readonly contract_version: "atlas.relationship-packet-extension/v1";
  readonly relationships: readonly {
    readonly relationship_lineage_id: string;
    readonly revision_hash: string;
    readonly owned_source_slot: string;
    readonly context_source_slot: string;
    readonly contextual_role: "title" | "legend" | "scope" | "interpretation";
    readonly necessity: "essential" | "optional";
    readonly uncertainty: "low" | "medium" | "high" | "unknown";
    readonly disposition: "proposed" | "unresolved";
    readonly source_evidence_slots: readonly [string, string];
  }[];
};

const extensionVersion = "atlas.relationship-packet-extension/v1" as const;
const reject = (message: string): never => { throw new Error(`Provisional relationship packet projection failed: ${message}`); };
const stableSlot = (slot: TrustedFinalizationSlot): RelationshipSourceLocator => ({
  slot: slot.slot,
  pageNumber: slot.pageNumber,
  locatorType: slot.locatorType,
  locatorId: slot.locatorId,
  sourceSha256: slot.sourceSha256,
  ...(slot.assetIdentity === undefined ? {} : { assetIdentity: slot.assetIdentity }),
});
const sameJson = (left: unknown, right: unknown) => relationshipSha256(left) === relationshipSha256(right);

function validateSnapshot(snapshot: RelationshipPacketIdentity) {
  for (const [field, value] of Object.entries(snapshot)) if (typeof value !== "string" || value.length === 0) reject(`source snapshot ${field} is empty.`);
  if (!/^[a-f0-9]{64}$/.test(snapshot.sourceSha256)) reject("source snapshot SHA-256 is malformed.");
}

function slotsForSnapshot(sourceSlots: readonly TrustedFinalizationSlot[], snapshot: RelationshipPacketIdentity) {
  const slots = new Map<string, TrustedFinalizationSlot>();
  for (const source of sourceSlots) {
    if (!source.slot || !Number.isSafeInteger(source.pageNumber) || source.pageNumber < 1 || !source.locatorId) reject("a source slot is malformed.");
    if (source.sourceSha256 !== snapshot.sourceSha256) reject(`source slot ${source.slot} has a foreign source SHA.`);
    if (source.locatorType === "visual_region") {
      if (!source.assetIdentity || !source.assetIdentity.assetRef || !/^[a-f0-9]{64}$/.test(source.assetIdentity.sha256) || source.assetIdentity.sourceSha256 !== snapshot.sourceSha256) reject(`visual source slot ${source.slot} has an absent or foreign asset.`);
    } else if (source.assetIdentity !== undefined) reject(`non-visual source slot ${source.slot} carries an asset.`);
    if (slots.has(source.slot)) reject(`duplicate source slot ${source.slot}.`);
    slots.set(source.slot, source);
  }
  return slots;
}

function immutableRevision(revision: ContextSourceRelationshipRevisionV1) {
  const { revisionHash: _revisionHash, ...immutable } = revision;
  return immutable;
}

function validateRevision(revision: ContextSourceRelationshipRevisionV1, snapshot: RelationshipPacketIdentity, slots: ReadonlyMap<string, TrustedFinalizationSlot>) {
  if (revision.contractVersion !== relationshipContractVersion) reject("revision contract version is unsupported.");
  if (!/^[a-f0-9]{64}$/.test(revision.relationshipLineageId) || !/^[a-f0-9]{64}$/.test(revision.revisionHash)) reject("revision has a malformed hash.");
  if (revision.revisionHash !== relationshipSha256(immutableRevision(revision))) reject("revision hash does not match immutable revision content.");
  if (!sameJson(revision.scope, snapshot) || !sameJson(revision.normalizedDocument, { executionId: snapshot.executionId, artifactId: snapshot.artifactId, sourceSha256: snapshot.sourceSha256 })) reject("revision is stale for the current source snapshot.");
  if (revision.disposition !== "proposed" && (revision.disposition as string) !== "unresolved") reject("revision disposition is unsupported; accepted records are not provisional.");
  const owned = slots.get(revision.ownedSource.slot);
  const context = slots.get(revision.contextSource.slot);
  if (!owned || !context) return reject("revision locator or asset does not match the current source slots.");
  if (owned.slot === context.slot || !sameJson(revision.ownedSource, stableSlot(owned)) || !sameJson(revision.contextSource, stableSlot(context))) reject("revision locator or asset does not match the current source slots.");
  if ((owned.role ?? "owned_source") !== "owned_source") reject("revision owned source is not independently owned.");
  if (revision.relationship.type !== "context_qualifies" || revision.relationship.direction !== "context_to_owned") reject("revision relationship is unsupported.");
  if (!packetRelationshipSchema.shape.contextual_role.safeParse(revision.relationship.contextualRole).success || !packetRelationshipSchema.shape.necessity.safeParse(revision.relationship.necessity).success || !packetRelationshipSchema.shape.uncertainty.safeParse(revision.uncertainty).success) reject("revision relationship attributes are malformed.");
  if (revision.authorization !== null || "accepted" in (revision as Record<string, unknown>) || "attestation" in (revision as Record<string, unknown>) || "localCandidateId" in (revision as Record<string, unknown>)) reject("revision carries non-provisional authority.");
  return { relationship_lineage_id: revision.relationshipLineageId, revision_hash: revision.revisionHash, owned_source_slot: owned.slot, context_source_slot: context.slot, contextual_role: revision.relationship.contextualRole, necessity: revision.relationship.necessity, uncertainty: revision.uncertainty, disposition: revision.disposition as "proposed" | "unresolved", source_evidence_slots: [owned.slot, context.slot] as [string, string] };
}

/** Projects stored provisional revisions into an opt-in provider request extension; it never creates accepted context evidence. */
export function buildProvisionalRelationshipPacketExtension(input: { readonly sourceSnapshot: RelationshipPacketIdentity; readonly sourceSlots: readonly TrustedFinalizationSlot[]; readonly revisions: readonly ContextSourceRelationshipRevisionV1[] }): ProvisionalRelationshipPacketExtensionV1 {
  validateSnapshot(input.sourceSnapshot);
  const slots = slotsForSnapshot(input.sourceSlots, input.sourceSnapshot);
  const seen = new Set<string>();
  const relationships = input.revisions.map((revision) => {
    const projected = validateRevision(revision, input.sourceSnapshot, slots);
    const key = `${projected.relationship_lineage_id}\u0000${projected.revision_hash}`;
    if (seen.has(key)) reject("duplicate relationship revision.");
    seen.add(key);
    return projected;
  }).sort((left, right) => `${left.relationship_lineage_id}\u0000${left.revision_hash}`.localeCompare(`${right.relationship_lineage_id}\u0000${right.revision_hash}`));
  return provisionalRelationshipPacketExtensionV1Schema.parse({ contract_version: extensionVersion, relationships });
}

/** Runtime entry point: fetches only the exact project/workspace/bundle/document/source-SHA slice before projection. */
export async function loadProvisionalRelationshipPacketExtension(input: { readonly sourceSnapshot: RelationshipPacketIdentity; readonly sourceSlots: readonly TrustedFinalizationSlot[]; readonly repository: Pick<ProvisionalRelationshipRepository, "loadForSnapshot"> }): Promise<ProvisionalRelationshipPacketExtensionV1> {
  validateSnapshot(input.sourceSnapshot);
  const revisions = await input.repository.loadForSnapshot({ projectId: input.sourceSnapshot.projectId, workspaceId: input.sourceSnapshot.workspaceId, bundleId: input.sourceSnapshot.bundleId, documentId: input.sourceSnapshot.documentId, sourceSha256: input.sourceSnapshot.sourceSha256 });
  return buildProvisionalRelationshipPacketExtension({ sourceSnapshot: input.sourceSnapshot, sourceSlots: input.sourceSlots, revisions });
}
