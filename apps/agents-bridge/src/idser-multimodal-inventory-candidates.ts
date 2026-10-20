import { createHash } from "node:crypto";
import {
  buildStepwiseSourcePacket,
  composeCanonicalMultimodalSource,
  type StepwiseSourceLocator,
  type VerifiedDerivedImageMetadata,
} from "@atlas/skills";
import type { AcceptedDocumentPlannerResultV1 } from "@atlas/db";
import {
  ConservativeMultimodalEstimationError,
  estimateConservativeMultimodalRequest,
  type ConservativeMultimodalEstimate,
  type PinnedMultimodalSerializerPolicy,
} from "./conservative-multimodal-estimation.js";
import type { CompleteSemCandidateRequestEstimatorConfiguration } from "./complete-sem-candidate-request-estimator.js";
import type { MultimodalRequestProfile } from "./provider-capabilities.js";

export class IdserMultimodalInventoryCandidateError extends Error {}

export type VerifiedVisualMeasurement = Readonly<{
  pageNumber: number;
  locatorId: string;
  assetRef: string;
  sourceSha256: string;
  assetSha256: string;
  mediaType: string;
  width: number;
  height: number;
  byteLength: number;
}>;

export type MultimodalInventoryDisposition = "eligible" | "rejected";
export type MultimodalInventoryReason = "empty_content" | "malformed" | "foreign" | "unavailable" | "unsupported" | "indivisible";

export type MultimodalInventoryItem = Readonly<{
  locator: StepwiseSourceLocator;
  disposition: MultimodalInventoryDisposition;
  reason?: MultimodalInventoryReason;
  candidateId?: string;
}>;

export type TransientMultimodalCandidate = Readonly<{
  candidateId: string;
  ownedLocators: readonly StepwiseSourceLocator[];
  contextOnlyLocators: readonly StepwiseSourceLocator[];
  selectedMedia: readonly Readonly<{
    sourceSlot: string;
    pageNumber: number;
    locatorId: string;
    assetRef: string;
    sourceSha256: string;
    assetSha256: string;
    mediaType: "image/png";
    width: number;
    height: number;
    byteLength: number;
  }>[];
  descriptorManifestSha256: string;
  requestCompositionSha256: string;
  estimate: ConservativeMultimodalEstimate;
}>;

export type MultimodalInventoryAndCandidates = Readonly<{
  version: "atlas.idser.multimodal-inventory-candidates/v1";
  inventory: readonly MultimodalInventoryItem[];
  candidates: readonly TransientMultimodalCandidate[];
}>;

const visualKey = (pageNumber: number, locatorId: string): string => `${pageNumber}\u0000${locatorId}`;
const positive = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const sha256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
};
const hash = (value: string): string => createHash("sha256").update(value).digest("hex");

function acceptedBinding(document: AcceptedDocumentPlannerResultV1): void {
  if (document.rel.state !== "unavailable"
    || document.normalizedDocument.artifactId !== document.source.documentId
    || document.normalizedDocument.sourceSha256 !== document.source.sourceSha256
    || !sha256(document.source.sourceSha256)) {
    throw new IdserMultimodalInventoryCandidateError("accepted document binding is invalid.");
  }
}

function visualInputByLocator(input: readonly VerifiedVisualMeasurement[]): Map<string, VerifiedVisualMeasurement | "duplicate"> {
  const result = new Map<string, VerifiedVisualMeasurement | "duplicate">();
  for (const measurement of input) {
    const key = visualKey(measurement.pageNumber, measurement.locatorId);
    result.set(key, result.has(key) ? "duplicate" : measurement);
  }
  return result;
}

function acceptedMediaByLocator(document: AcceptedDocumentPlannerResultV1): Map<string, AcceptedDocumentPlannerResultV1["media"][number] | "duplicate"> {
  const result = new Map<string, AcceptedDocumentPlannerResultV1["media"][number] | "duplicate">();
  for (const media of document.media) {
    const key = visualKey(media.pageNumber, media.locatorId);
    result.set(key, result.has(key) ? "duplicate" : media);
  }
  return result;
}

function checkedVisual(
  document: AcceptedDocumentPlannerResultV1,
  visual: Readonly<{ id: string; assetRef?: string }>,
  pageNumber: number,
  media: AcceptedDocumentPlannerResultV1["media"][number] | "duplicate" | undefined,
  measurement: VerifiedVisualMeasurement | "duplicate" | undefined,
): Readonly<{ reason: MultimodalInventoryReason } | { metadata: VerifiedDerivedImageMetadata }> {
  if (!visual.id || !positive(pageNumber)) return { reason: "malformed" };
  if (!visual.assetRef || !media || !measurement) return { reason: "unavailable" };
  if (media === "duplicate" || measurement === "duplicate") return { reason: "malformed" };
  if (media.assetRef !== visual.assetRef || measurement.assetRef !== visual.assetRef
    || measurement.pageNumber !== pageNumber || measurement.locatorId !== visual.id
    || measurement.sourceSha256 !== document.source.sourceSha256 || !sha256(media.sha256)
    || measurement.assetSha256 !== media.sha256) return { reason: "foreign" };
  if (media.mediaType !== "image/png" || measurement.mediaType !== "image/png") return { reason: "unsupported" };
  if (!positive(media.byteLength) || !positive(measurement.byteLength) || media.byteLength !== measurement.byteLength
    || !positive(measurement.width) || !positive(measurement.height)) return { reason: "malformed" };
  return { metadata: {
    pageNumber,
    locatorId: visual.id,
    assetRef: visual.assetRef,
    sourceSha256: document.source.sourceSha256,
    assetSha256: media.sha256,
    mediaType: "image/png",
    width: measurement.width,
    height: measurement.height,
    byteLength: measurement.byteLength,
  } };
}

/**
 * Builds only a deterministic, transient candidate. The next ticket owns
 * BSS structural-fit and partition decisions; this seam neither reads BSS nor
 * writes a plan, retrieves media bytes, or invokes a remote service.
 */
export function inventoryMultimodalCandidates(input: Readonly<{
  acceptedDocument: AcceptedDocumentPlannerResultV1;
  verifiedVisualMeasurements: readonly VerifiedVisualMeasurement[];
  effectiveRoute: MultimodalRequestProfile;
  serializerPolicy: PinnedMultimodalSerializerPolicy;
  estimatorConfiguration: CompleteSemCandidateRequestEstimatorConfiguration;
}>): MultimodalInventoryAndCandidates {
  acceptedBinding(input.acceptedDocument);
  const document = input.acceptedDocument.normalizedDocument;
  const measurements = visualInputByLocator(input.verifiedVisualMeasurements);
  const media = acceptedMediaByLocator(input.acceptedDocument);
  const inventory: MultimodalInventoryItem[] = [];
  const ownedLocators: StepwiseSourceLocator[] = [];
  const images: VerifiedDerivedImageMetadata[] = [];
  const visualInventory = new Map<string, number>();

  for (const page of [...document.pages].sort((left, right) => left.number - right.number)) {
    for (const block of [...page.textBlocks].sort((left, right) => left.id.localeCompare(right.id))) {
      const locator = { pageNumber: page.number, locatorType: "text_block" as const, locatorId: block.id };
      if (!block.id || !block.text.trim()) inventory.push({ locator, disposition: "rejected", reason: "empty_content" });
      else { inventory.push({ locator, disposition: "eligible" }); ownedLocators.push(locator); }
    }
    for (const table of [...page.tables].sort((left, right) => left.id.localeCompare(right.id))) {
      const locator = { pageNumber: page.number, locatorType: "table" as const, locatorId: table.id };
      if (!table.id || !table.content.trim()) inventory.push({ locator, disposition: "rejected", reason: "empty_content" });
      else { inventory.push({ locator, disposition: "eligible" }); ownedLocators.push(locator); }
    }
    for (const visual of [...page.visualRegions].sort((left, right) => left.id.localeCompare(right.id))) {
      const locator = { pageNumber: page.number, locatorType: "visual_region" as const, locatorId: visual.id };
      const key = visualKey(page.number, visual.id);
      if (visualInventory.has(key)) {
        inventory.push({ locator, disposition: "rejected", reason: "malformed" });
        continue;
      }
      visualInventory.set(key, inventory.length);
      const checked = checkedVisual(input.acceptedDocument, visual, page.number, media.get(key), measurements.get(key));
      if ("reason" in checked) inventory.push({ locator, disposition: "rejected", reason: checked.reason });
      else { inventory.push({ locator, disposition: "eligible" }); ownedLocators.push(locator); images.push(checked.metadata); }
    }
  }

  // Media/measurement entries without a matching accepted visual are never
  // silently ignored: they are an integrity failure for candidate creation.
  const visualKeys = new Set(visualInventory.keys());
  if ([...media.keys(), ...measurements.keys()].some((key) => !visualKeys.has(key))) {
    throw new IdserMultimodalInventoryCandidateError("accepted visual media or measurement is foreign.");
  }

  const build = (locators: readonly StepwiseSourceLocator[], metadata: readonly VerifiedDerivedImageMetadata[]): TransientMultimodalCandidate | undefined => {
    if (locators.length === 0) return undefined;
    const composition = composeCanonicalMultimodalSource({ document, ownedLocators: locators, contextOnlyLocators: [], verifiedDerivedImages: metadata });
    const packet = buildStepwiseSourcePacket({
      document,
      ownedLocators: locators,
      contextOnlyLocators: [],
      assetIdentities: metadata.map((item) => ({ pageNumber: item.pageNumber, locatorId: item.locatorId, assetRef: item.assetRef, sha256: item.assetSha256, sourceSha256: item.sourceSha256 })),
    });
    const candidateId = `candidate-${hash(composition.requestCompositionSha256).slice(0, 16)}`;
    const estimate = estimateConservativeMultimodalRequest({ composition, candidatePacket: packet, effectiveRoute: input.effectiveRoute, serializerPolicy: input.serializerPolicy, configuration: input.estimatorConfiguration });
    return freeze({
      candidateId,
      ownedLocators: [...locators],
      contextOnlyLocators: [],
      selectedMedia: composition.descriptorManifest.map((item) => ({ ...item })),
      descriptorManifestSha256: composition.descriptorManifestSha256,
      requestCompositionSha256: composition.requestCompositionSha256,
      estimate,
    });
  };

  let candidate: TransientMultimodalCandidate | undefined;
  try { candidate = build(ownedLocators, images); }
  catch (error) {
    if (!(error instanceof ConservativeMultimodalEstimationError)) throw error;
    // A visual which cannot form even one complete candidate is explicitly
    // dispositioned here; structural fit remains exclusively downstream.
    for (const image of images) {
      const index = visualInventory.get(visualKey(image.pageNumber, image.locatorId));
      if (index !== undefined) inventory[index] = { locator: inventory[index]!.locator, disposition: "rejected", reason: "indivisible" };
    }
    const nonVisual = ownedLocators.filter((locator) => locator.locatorType !== "visual_region");
    candidate = build(nonVisual, []);
  }
  if (candidate) {
    for (const image of images) {
      const index = visualInventory.get(visualKey(image.pageNumber, image.locatorId));
      if (index !== undefined && inventory[index]?.disposition === "eligible") inventory[index] = { ...inventory[index]!, candidateId: candidate.candidateId };
    }
    for (let index = 0; index < inventory.length; index += 1) if (inventory[index]!.disposition === "eligible") inventory[index] = { ...inventory[index]!, candidateId: candidate.candidateId };
  }
  return freeze({ version: "atlas.idser.multimodal-inventory-candidates/v1", inventory, candidates: candidate ? [candidate] : [] });
}
