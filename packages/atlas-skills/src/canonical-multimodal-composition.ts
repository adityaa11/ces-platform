import { createHash } from "node:crypto";
import type { NormalizedDocument } from "@atlas/contracts";
import {
  buildStepwiseSourcePacket,
  type StepwiseProvisionalRelationship,
  type StepwiseSourceLocator,
  type StepwiseSourceRelationshipRequirement,
  type StepwiseSourceSlot,
} from "./stepwise-source-packet.js";

/**
 * In-memory-only composition boundary for IDSER-012-05-01-01.  The existing
 * stepwise packet builder remains the sole owner of document parsing,
 * locator selection, and source-slot construction.
 */
export const canonicalMultimodalCompositionVersion = "atlas.semantic.canonical-multimodal-composition/v1" as const;

export type VerifiedDerivedImageMetadata = Readonly<{
  pageNumber: number;
  locatorId: string;
  assetRef: string;
  sourceSha256: string;
  assetSha256: string;
  mediaType: "image/png";
  width: number;
  height: number;
  byteLength: number;
}>;

export type CanonicalMultimodalDescriptor = VerifiedDerivedImageMetadata & Readonly<{
  sourceSlot: string;
}>;

export type CanonicalMultimodalComposition = Readonly<{
  version: typeof canonicalMultimodalCompositionVersion;
  sourceSlots: readonly StepwiseSourceSlot[];
  descriptorManifest: readonly CanonicalMultimodalDescriptor[];
  descriptorManifestSha256: string;
  requestCompositionSha256: string;
}>;

export type CanonicalMultimodalCompositionInput = Readonly<{
  document: NormalizedDocument;
  ownedLocators: readonly StepwiseSourceLocator[];
  contextOnlyLocators: readonly StepwiseSourceLocator[];
  verifiedDerivedImages: readonly VerifiedDerivedImageMetadata[];
  provisionalRelationships?: readonly StepwiseProvisionalRelationship[];
  relationshipRequirements?: readonly StepwiseSourceRelationshipRequirement[];
  now?: string;
}>;

const sha256Pattern = /^[a-f0-9]{64}$/;
const canonicalDerivedAssetRef = /^derived\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");
const positiveSafeInteger = (value: unknown): value is number => Number.isSafeInteger(value) && typeof value === "number" && value > 0;
const locatorKey = (pageNumber: number, locatorId: string): string => `${pageNumber}\u0000${locatorId}`;

const stableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  }
  throw new Error("CANONICAL_MULTIMODAL_COMPOSITION_REJECTED: value is not JSON-serializable.");
};

const reject = (message: string): never => {
  throw new Error(`CANONICAL_MULTIMODAL_COMPOSITION_REJECTED: ${message}`);
};

function validateMetadata(input: CanonicalMultimodalCompositionInput): Map<string, VerifiedDerivedImageMetadata> {
  const metadataByLocator = new Map<string, VerifiedDerivedImageMetadata>();
  for (const metadata of input.verifiedDerivedImages) {
    if (!positiveSafeInteger(metadata.pageNumber)
      || !metadata.locatorId
      || !canonicalDerivedAssetRef.test(metadata.assetRef)
      || metadata.sourceSha256 !== input.document.sourceSha256
      || !sha256Pattern.test(metadata.sourceSha256)
      || !sha256Pattern.test(metadata.assetSha256)
      || metadata.mediaType !== "image/png"
      || !positiveSafeInteger(metadata.width)
      || !positiveSafeInteger(metadata.height)
      || !positiveSafeInteger(metadata.byteLength)) {
      reject("derived image metadata is foreign, unsafe, unsupported, or malformed.");
    }
    const key = locatorKey(metadata.pageNumber, metadata.locatorId);
    if (metadataByLocator.has(key)) reject("duplicate derived image metadata.");
    metadataByLocator.set(key, metadata);
  }
  return metadataByLocator;
}

/**
 * Freezes the in-memory source-slot and selected-image descriptor contract.
 * It deliberately returns hashes rather than a request body, media bytes, or
 * a durable artifact; estimation and transport belong to later tickets.
 */
export function composeCanonicalMultimodalSource(input: CanonicalMultimodalCompositionInput): CanonicalMultimodalComposition {
  const metadataByLocator = validateMetadata(input);
  const packet = buildStepwiseSourcePacket({
    document: input.document,
    ownedLocators: input.ownedLocators,
    contextOnlyLocators: input.contextOnlyLocators,
    assetIdentities: [...metadataByLocator.values()].map((metadata) => ({
      pageNumber: metadata.pageNumber,
      locatorId: metadata.locatorId,
      assetRef: metadata.assetRef,
      sha256: metadata.assetSha256,
      sourceSha256: metadata.sourceSha256,
    })),
    ...(input.provisionalRelationships === undefined ? {} : { provisionalRelationships: input.provisionalRelationships }),
    ...(input.relationshipRequirements === undefined ? {} : { relationshipRequirements: input.relationshipRequirements }),
    ...(input.now === undefined ? {} : { now: input.now }),
  });

  const descriptorManifest = packet.sourceSlots
    .filter((slot) => slot.locatorType === "visual_region")
    .map((slot) => {
      const metadata = metadataByLocator.get(locatorKey(slot.pageNumber, slot.locatorId));
      if (metadata === undefined) {
        throw new Error("CANONICAL_MULTIMODAL_COMPOSITION_REJECTED: selected visual has missing verified derived-image metadata.");
      }
      if (!slot.assetIdentity || slot.assetIdentity.assetRef !== metadata.assetRef
        || slot.assetIdentity.sha256 !== metadata.assetSha256
        || slot.assetIdentity.sourceSha256 !== metadata.sourceSha256) {
        reject("selected visual has foreign or mismatched verified derived-image metadata.");
      }
      return {
        sourceSlot: slot.slot,
        pageNumber: metadata.pageNumber,
        locatorId: metadata.locatorId,
        assetRef: metadata.assetRef,
        sourceSha256: metadata.sourceSha256,
        assetSha256: metadata.assetSha256,
        mediaType: metadata.mediaType,
        width: metadata.width,
        height: metadata.height,
        byteLength: metadata.byteLength,
      };
    });
  const descriptorManifestSha256 = sha256(stableJson(descriptorManifest));
  const requestCompositionSha256 = sha256(stableJson({
    version: canonicalMultimodalCompositionVersion,
    sourceSpecificationSha256: packet.sourceSpecificationSha256,
    sourceSlots: packet.sourceSlots,
    descriptorManifestSha256,
  }));
  return Object.freeze({
    version: canonicalMultimodalCompositionVersion,
    sourceSlots: Object.freeze([...packet.sourceSlots]),
    descriptorManifest: Object.freeze(descriptorManifest),
    descriptorManifestSha256,
    requestCompositionSha256,
  });
}
