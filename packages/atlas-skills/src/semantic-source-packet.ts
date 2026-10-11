import { createHash } from "node:crypto";
import { parseNormalizedDocument, type NormalizedDocument } from "@atlas/contracts";
import { atlasProviderExtractionProposalV1JsonSchema, compileExtractionPrompt, semanticExtractionProfileId, stepwiseMultimodalSemanticExtractionProfileId } from "./semantic-prompt.js";

/** Frozen pre-provider bounds for the BSS-V2-004-03-03 source packet. */
export const semanticSourcePacketLimits = {
  maxSourceUnits: 10_000,
  maxUserPromptBytes: 1_000_000,
} as const;

export type SourceLocatorType = "text_block" | "table" | "visual_region";
export type SemanticSourceUnit = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  readonly content: string;
};
export type RejectedSemanticSourceUnit = {
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  readonly reason: "empty_content" | "unlabeled_visual_region";
};
export type SemanticSourcePacket = {
  readonly semanticProfile: typeof semanticExtractionProfileId;
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly providerProposalJsonSchema: Readonly<Record<string, unknown>>;
  readonly sourceSlotMap: readonly SemanticSourceUnit[];
  readonly rejectedSourceUnits: readonly RejectedSemanticSourceUnit[];
};

/**
 * Offline-only packet contract for BSS-V2-004-03-08-02-01.  The packet names
 * source and derived-media identities, but never reads, encodes, or transports
 * the referenced media.
 */
export const unhydratedMultimodalSourcePacketVersion = "atlas.semantic.unhydrated-source-packet/v1" as const;

export type AuthorizedSourceRelationshipBinding = {
  readonly relationshipLineageId: string;
  readonly revisionHash: string;
  readonly normalizedDocument: { readonly executionId: string; readonly artifactId: string; readonly sourceSha256: string };
  readonly ownedSource: { readonly pageNumber: number; readonly locatorType: SourceLocatorType; readonly locatorId: string };
  readonly contextVisual: { readonly pageNumber: number; readonly locatorId: string; readonly assetRef: string; readonly derivedAssetSha256: string };
  readonly contextualRole: "title" | "legend" | "scope" | "interpretation";
  readonly necessity: "essential" | "optional";
  /** This leaf consumes an already accepted binding; it cannot issue one. */
  readonly authorization: { readonly mechanismId: string; readonly attestationId: string };
};

/** A manifest-declared contextual dependency. Essential requirements fail closed when no accepted binding is supplied. */
export type SourceRelationshipRequirement = Pick<AuthorizedSourceRelationshipBinding, "ownedSource" | "contextVisual" | "contextualRole" | "necessity">;

export type UnhydratedMultimodalSourceSlot = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  readonly role: "owned_source" | "reference_context" | "pending_authorized_media";
  readonly content?: string;
};

export type PendingAuthorizedMediaPart = {
  readonly sourceSlot: string;
  readonly pageNumber: number;
  readonly locatorId: string;
  readonly assetRef: string;
};

export type UnhydratedMultimodalSourcePacket = {
  readonly version: typeof unhydratedMultimodalSourcePacketVersion;
  readonly semanticProfile: typeof stepwiseMultimodalSemanticExtractionProfileId;
  readonly systemPrompt: string;
  readonly providerProposalJsonSchema: Readonly<Record<string, unknown>>;
  readonly sourceSlots: readonly UnhydratedMultimodalSourceSlot[];
  readonly referenceContexts: readonly {
    readonly ownedSourceSlot: string;
    readonly contextSourceSlot: string;
    readonly relationshipLineageId: string;
    readonly revisionHash: string;
    readonly contextualRole: AuthorizedSourceRelationshipBinding["contextualRole"];
    readonly necessity: AuthorizedSourceRelationshipBinding["necessity"];
    readonly derivedAssetSha256: string;
  }[];
  readonly pendingAuthorizedMedia: readonly PendingAuthorizedMediaPart[];
  readonly sourceSpecification: string;
  readonly sourceSpecificationSha256: string;
};

/**
 * Later leaves must supply authorization and bounded media planning separately.
 * This packet deliberately supplies neither bytes nor a token/cost estimate.
 */
export const unhydratedMultimodalPacketHandoffRequirements = {
  resolver: ["An Atlas service identity and scoped, replay-safe grant.", "A verified manifest match for the document, source SHA, visual locator, asset reference, hash, type, dimensions, and byte length.", "Ephemeral media retrieval with cancellation and redaction; no packet, log, job, or database byte persistence."],
  resourcePlanner: ["The eventual hydrated part count, verified media metadata, prompt bytes, effective profile, deadline, and capability result.", "A separately owned request-resource envelope and admission decision; this packet supplies no media-token estimate."],
} as const;

type CandidateSource = Omit<SemanticSourceUnit, "slot">;
const utf8Bytes = (value: string) => Buffer.byteLength(value, "utf8");
const compareId = <T extends { readonly id: string }>(left: T, right: T) => left.id.localeCompare(right.id);
const comparePage = (left: NormalizedDocument["pages"][number], right: NormalizedDocument["pages"][number]) => left.number - right.number;
const sourceKey = (pageNumber: number, locatorType: SourceLocatorType, locatorId: string) => `${pageNumber}\u0000${locatorType}\u0000${locatorId}`;
const stableJson = (value: unknown): string => Array.isArray(value) ? `[${value.map(stableJson).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}` : JSON.stringify(value);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const sha256Pattern = /^[a-f0-9]{64}$/;

/**
 * Converts only accepted NormalizedDocument material into temporary provider slots.
 * Slot names are packet-local and never become Atlas semantic identities.
 */
export function buildSemanticSourcePacket(input: NormalizedDocument): SemanticSourcePacket {
  const document = parseNormalizedDocument(input);
  const candidates: CandidateSource[] = [];
  const rejected: RejectedSemanticSourceUnit[] = [];
  const seenLocators = new Set<string>();
  const add = (pageNumber: number, locatorType: SourceLocatorType, locatorId: string, content: string | undefined, reason?: RejectedSemanticSourceUnit["reason"]) => {
    const locatorKey = sourceKey(pageNumber, locatorType, locatorId);
    if (seenLocators.has(locatorKey)) throw new Error(`Duplicate normalized source locator: ${locatorType}/${locatorId} on page ${pageNumber}.`);
    seenLocators.add(locatorKey);
    if (content === undefined || content.length === 0) {
      rejected.push({ pageNumber, locatorType, locatorId, reason: reason ?? "empty_content" });
      return;
    }
    candidates.push({ pageNumber, locatorType, locatorId, content });
  };

  for (const page of [...document.pages].sort(comparePage)) {
    for (const block of [...page.textBlocks].sort(compareId)) add(page.number, "text_block", block.id, block.text);
    for (const table of [...page.tables].sort(compareId)) add(page.number, "table", table.id, table.content);
    for (const visual of [...page.visualRegions].sort(compareId)) {
      const originalLabel = visual.label;
      // v1 has no semantic-content field for an unlabeled visual. Do not infer meaning from its derived asset reference.
      add(page.number, "visual_region", visual.id, originalLabel === undefined || originalLabel.trim().length === 0 ? undefined : originalLabel, "unlabeled_visual_region");
    }
  }

  if (candidates.length > semanticSourcePacketLimits.maxSourceUnits) throw new Error(`Semantic source packet exceeds ${semanticSourcePacketLimits.maxSourceUnits} source units.`);
  const sourceSlotMap = candidates.map((source, index) => ({ ...source, slot: `slot-${String(index + 1).padStart(6, "0")}` }));
  const userPayload = {
    version: "v1",
    // The provider receives only a temporary slot and source material. Atlas retains page/locator lineage locally.
    source_slots: sourceSlotMap.map(({ slot, content }) => ({ slot, content })),
  };
  const userPrompt = JSON.stringify(userPayload);
  if (utf8Bytes(userPrompt) > semanticSourcePacketLimits.maxUserPromptBytes) throw new Error(`Semantic source packet exceeds ${semanticSourcePacketLimits.maxUserPromptBytes} UTF-8 bytes.`);

  const compiled = compileExtractionPrompt();
  return {
    semanticProfile: semanticExtractionProfileId,
    systemPrompt: compiled.prompt,
    userPrompt,
    providerProposalJsonSchema: atlasProviderExtractionProposalV1JsonSchema,
    sourceSlotMap,
    rejectedSourceUnits: rejected,
  };
}

/**
 * Builds the additive multimodal source ownership packet. It accepts only
 * relationship bindings that a prior Atlas authority has already accepted and
 * emits unresolved image-bearing visuals as pending media references. No image
 * bytes, vendor request, job, reservation, or semantic result is produced.
 */
export function buildUnhydratedMultimodalSourcePacket(input: { readonly document: NormalizedDocument; readonly authorizedRelationships: readonly AuthorizedSourceRelationshipBinding[]; readonly relationshipRequirements?: readonly SourceRelationshipRequirement[] }): UnhydratedMultimodalSourcePacket {
  const document = parseNormalizedDocument(input.document);
  const allSlots: Omit<UnhydratedMultimodalSourceSlot, "slot" | "role">[] = [];
  const visualAssets = new Map<string, { readonly assetRef: string; readonly slotIndex: number }>();
  const seenLocators = new Set<string>();
  const add = (pageNumber: number, locatorType: SourceLocatorType, locatorId: string, content?: string, assetRef?: string) => {
    const key = sourceKey(pageNumber, locatorType, locatorId);
    if (seenLocators.has(key)) throw new Error(`Duplicate normalized source locator: ${locatorType}/${locatorId} on page ${pageNumber}.`);
    seenLocators.add(key);
    const slotIndex = allSlots.length;
    allSlots.push({ pageNumber, locatorType, locatorId, ...(content === undefined ? {} : { content }) });
    if (assetRef !== undefined) visualAssets.set(key, { assetRef, slotIndex });
  };

  for (const page of [...document.pages].sort(comparePage)) {
    for (const block of [...page.textBlocks].sort(compareId)) add(page.number, "text_block", block.id, block.text);
    for (const table of [...page.tables].sort(compareId)) add(page.number, "table", table.id, table.content);
    for (const visual of [...page.visualRegions].sort(compareId)) add(page.number, "visual_region", visual.id, visual.label === undefined || visual.label.trim().length === 0 ? undefined : visual.label, visual.assetRef);
  }
  if (allSlots.length > semanticSourcePacketLimits.maxSourceUnits) throw new Error(`Semantic source packet exceeds ${semanticSourcePacketLimits.maxSourceUnits} source units.`);

  const sourceSlots = allSlots.map((source, index) => ({ ...source, slot: `slot-${String(index + 1).padStart(6, "0")}`, role: source.locatorType === "visual_region" && visualAssets.has(sourceKey(source.pageNumber, source.locatorType, source.locatorId)) ? "pending_authorized_media" as const : "owned_source" as const }));
  const slotByLocator = new Map(sourceSlots.map((slot) => [sourceKey(slot.pageNumber, slot.locatorType, slot.locatorId), slot]));
  const validateRelationshipTarget = (relationship: Pick<AuthorizedSourceRelationshipBinding, "ownedSource" | "contextVisual" | "contextualRole">) => {
    const ownedKey = sourceKey(relationship.ownedSource.pageNumber, relationship.ownedSource.locatorType, relationship.ownedSource.locatorId);
    const contextKey = sourceKey(relationship.contextVisual.pageNumber, "visual_region", relationship.contextVisual.locatorId);
    const owned = slotByLocator.get(ownedKey);
    const context = slotByLocator.get(contextKey);
    const visualAsset = visualAssets.get(contextKey);
    if (!owned || !context || !visualAsset || relationship.contextVisual.assetRef !== visualAsset.assetRef) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: relationship does not bind an authorized normalized visual asset.");
    if (owned.slot === context.slot) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: a source cannot qualify itself.");
    return { owned, context, relationshipKey: `${owned.slot}\u0000${context.slot}\u0000${relationship.contextualRole}` };
  };
  const requiredRelationshipKeys = new Map<string, SourceRelationshipRequirement>();
  for (const requirement of input.relationshipRequirements ?? []) {
    const { relationshipKey } = validateRelationshipTarget(requirement);
    if (requiredRelationshipKeys.has(relationshipKey)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: duplicate or over-bound context relationship.");
    requiredRelationshipKeys.set(relationshipKey, requirement);
  }
  const relationshipKeys = new Set<string>();
  const referenceContexts = input.authorizedRelationships.map((binding) => {
    if (!binding.relationshipLineageId || !sha256Pattern.test(binding.revisionHash) || !binding.authorization.mechanismId || !binding.authorization.attestationId || !sha256Pattern.test(binding.contextVisual.derivedAssetSha256)) throw new Error("Malformed authorized source relationship binding.");
    if (binding.normalizedDocument.executionId !== document.executionId || binding.normalizedDocument.artifactId !== document.artifactId || binding.normalizedDocument.sourceSha256 !== document.sourceSha256) throw new Error("Foreign authorized source relationship binding.");
    const { owned, context, relationshipKey } = validateRelationshipTarget(binding);
    if (requiredRelationshipKeys.size > 0 && !requiredRelationshipKeys.has(relationshipKey)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: unsupported context relationship.");
    const requirement = requiredRelationshipKeys.get(relationshipKey);
    if (requirement && binding.necessity !== requirement.necessity) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: authorized relationship necessity does not match its requirement.");
    if (relationshipKeys.has(relationshipKey)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: duplicate or over-bound context relationship.");
    relationshipKeys.add(relationshipKey);
    return { ownedSourceSlot: owned.slot, contextSourceSlot: context.slot, relationshipLineageId: binding.relationshipLineageId, revisionHash: binding.revisionHash, contextualRole: binding.contextualRole, necessity: binding.necessity, derivedAssetSha256: binding.contextVisual.derivedAssetSha256 };
  }).sort((left, right) => stableJson(left).localeCompare(stableJson(right)));
  for (const [relationshipKey, requirement] of requiredRelationshipKeys) if (requirement.necessity === "essential" && !relationshipKeys.has(relationshipKey)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: missing essential authorized source relationship.");

  const contextSlots = new Set(referenceContexts.map((relationship) => relationship.contextSourceSlot));
  const resolvedSlots = sourceSlots.map((slot) => contextSlots.has(slot.slot) ? { ...slot, role: "reference_context" as const } : slot);
  const pendingAuthorizedMedia = resolvedSlots.filter((slot) => slot.locatorType === "visual_region").flatMap((slot) => {
    const asset = visualAssets.get(sourceKey(slot.pageNumber, slot.locatorType, slot.locatorId));
    return asset ? [{ sourceSlot: slot.slot, pageNumber: slot.pageNumber, locatorId: slot.locatorId, assetRef: asset.assetRef }] : [];
  });
  const sourceSpecification = stableJson({ version: unhydratedMultimodalSourcePacketVersion, source_slots: resolvedSlots.map(({ slot, pageNumber, locatorType, locatorId, role, content }) => ({ slot, page_number: pageNumber, locator_type: locatorType, locator_id: locatorId, role, ...(content === undefined ? {} : { content }) })), reference_contexts: referenceContexts, pending_authorized_media: pendingAuthorizedMedia });
  if (utf8Bytes(sourceSpecification) > semanticSourcePacketLimits.maxUserPromptBytes) throw new Error(`Semantic source packet exceeds ${semanticSourcePacketLimits.maxUserPromptBytes} UTF-8 bytes.`);
  const compiled = compileExtractionPrompt(stepwiseMultimodalSemanticExtractionProfileId);
  return { version: unhydratedMultimodalSourcePacketVersion, semanticProfile: stepwiseMultimodalSemanticExtractionProfileId, systemPrompt: compiled.prompt, providerProposalJsonSchema: atlasProviderExtractionProposalV1JsonSchema, sourceSlots: resolvedSlots, referenceContexts, pendingAuthorizedMedia, sourceSpecification, sourceSpecificationSha256: sha256(sourceSpecification) };
}
