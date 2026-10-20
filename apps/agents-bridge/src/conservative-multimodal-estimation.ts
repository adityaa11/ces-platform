import {
  buildStepwiseRelationshipEnvelopeRequest,
  type CanonicalMultimodalComposition,
  type StepwiseSourcePacket,
} from "@atlas/skills";
import {
  estimateCompleteSemCandidateRequest,
  type CompleteSemCandidateRequestEstimate,
  type CompleteSemCandidateRequestEstimatorConfiguration,
} from "./complete-sem-candidate-request-estimator.js";
import type { MultimodalRequestProfile } from "./provider-capabilities.js";
import {
  anomanMultipartSerializationPolicy,
  projectAnomanMultipartRequestBytes,
  projectedBase64DataUrlBytes,
} from "./providers/anoman-multipart-serialization.js";

export const conservativeMultimodalImageTokenPolicy = Object.freeze({
  identity: "atlas.multimodal-image-grid-estimate",
  version: "v1",
  formula: "ceil(width/768)*ceil(height/768)*516",
});

export class ConservativeMultimodalEstimationError extends Error {
  constructor(message: string) { super(`SEM_MULTIMODAL_SERIALIZER_POLICY_GAP: ${message}`); }
}

export type PinnedMultimodalSerializerPolicy = Readonly<{
  identity: typeof anomanMultipartSerializationPolicy.identity;
  version: typeof anomanMultipartSerializationPolicy.version;
  model: string;
}>;

export type ConservativeMultimodalEstimate = Readonly<{
  estimate: CompleteSemCandidateRequestEstimate;
  projectedTransportBytes: number;
  selectedImageCount: number;
  selectedImageBytes: number;
  providerImageTpm: MultimodalRequestProfile["imageTpm"];
  provenance: Readonly<{
    composition: Readonly<{ version: string; descriptorManifestSha256: string; requestCompositionSha256: string }>;
    prompt: CompleteSemCandidateRequestEstimate["provenance"]["semRequest"];
    sourceSpecificationSha256: string;
    estimator: CompleteSemCandidateRequestEstimate["provenance"]["estimator"];
    configuration: CompleteSemCandidateRequestEstimate["provenance"]["configuration"];
    route: Readonly<{ routeId: string; profileId: string; profileVersion: string }>;
    serializerPolicy: PinnedMultimodalSerializerPolicy;
    imageTokenPolicy: typeof conservativeMultimodalImageTokenPolicy;
  }>;
}>;

const stableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  throw new ConservativeMultimodalEstimationError("composition is not JSON-serializable.");
};
const same = (left: unknown, right: unknown): boolean => stableJson(left) === stableJson(right);
const positiveSafeInteger = (value: unknown): value is number => Number.isSafeInteger(value) && typeof value === "number" && value > 0;
const safeSum = (values: readonly number[], label: string): number => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total)) throw new ConservativeMultimodalEstimationError(`${label} exceeds safe integer bounds.`);
  return total;
};

function imageTokens(width: number, height: number): number {
  if (!positiveSafeInteger(width) || !positiveSafeInteger(height)) throw new ConservativeMultimodalEstimationError("selected image dimensions must be positive safe integers.");
  const tiles = Math.ceil(width / 768) * Math.ceil(height / 768);
  const tokens = tiles * 516;
  if (!Number.isSafeInteger(tiles) || !Number.isSafeInteger(tokens)) throw new ConservativeMultimodalEstimationError("image token estimate exceeds safe integer bounds.");
  return tokens;
}

function selectedDescriptors(composition: CanonicalMultimodalComposition, candidatePacket: StepwiseSourcePacket) {
  if (!same(composition.sourceSlots, candidatePacket.sourceSlots)) throw new ConservativeMultimodalEstimationError("candidate packet does not exactly consume the canonical composition.");
  const visuals = candidatePacket.sourceSlots.filter((slot) => slot.locatorType === "visual_region");
  if (visuals.length !== composition.descriptorManifest.length) throw new ConservativeMultimodalEstimationError("canonical visual manifest and candidate packet disagree.");
  return composition.descriptorManifest.map((descriptor, index) => {
    const slot = visuals[index];
    if (!slot || slot.slot !== descriptor.sourceSlot || !slot.assetIdentity
      || slot.assetIdentity.assetRef !== descriptor.assetRef || slot.assetIdentity.sha256 !== descriptor.assetSha256
      || slot.assetIdentity.sourceSha256 !== descriptor.sourceSha256 || descriptor.mediaType !== "image/png"
      || !positiveSafeInteger(descriptor.byteLength)) throw new ConservativeMultimodalEstimationError("canonical visual manifest has missing, foreign, or unsafe selected-media metadata.");
    return descriptor;
  });
}

function validateRoute(route: MultimodalRequestProfile, descriptors: readonly CanonicalMultimodalComposition["descriptorManifest"][number][], promptBytes: number): void {
  if (!route.routeId || !route.profileId || !route.profileVersion || !positiveSafeInteger(route.maxPromptBytes) || promptBytes > route.maxPromptBytes) throw new ConservativeMultimodalEstimationError("effective route/profile identity or prompt bound is unavailable or exceeded.");
  if (descriptors.length === 0) return;
  const capability = route.image;
  if (!capability || capability.version !== "v1" || !positiveSafeInteger(capability.maxImageCount)
    || !positiveSafeInteger(capability.maxImageBytes) || !positiveSafeInteger(capability.maxImageWidth) || !positiveSafeInteger(capability.maxImageHeight)
    || !capability.mediaTypes.includes("image/png")) throw new ConservativeMultimodalEstimationError("effective route media capability is missing or ambiguous.");
  const totalBytes = safeSum(descriptors.map((descriptor) => descriptor.byteLength), "selected image bytes");
  if (descriptors.length > capability.maxImageCount || totalBytes > capability.maxImageBytes
    || descriptors.some((descriptor) => descriptor.width > capability.maxImageWidth || descriptor.height > capability.maxImageHeight)) throw new ConservativeMultimodalEstimationError("selected images exceed effective route media capability bounds.");
}

/**
 * Pure planning seam: reuse the established request estimator and prove that
 * it is never below the pinned adapter's JSON/data-URL projection.
 */
export function estimateConservativeMultimodalRequest(input: Readonly<{
  composition: CanonicalMultimodalComposition;
  candidatePacket: StepwiseSourcePacket;
  effectiveRoute: MultimodalRequestProfile;
  serializerPolicy: PinnedMultimodalSerializerPolicy;
  configuration: CompleteSemCandidateRequestEstimatorConfiguration;
}>): ConservativeMultimodalEstimate {
  if (input.serializerPolicy.identity !== anomanMultipartSerializationPolicy.identity
    || input.serializerPolicy.version !== anomanMultipartSerializationPolicy.version
    || !input.serializerPolicy.model.trim()) throw new ConservativeMultimodalEstimationError("adapter serialization policy is missing, unpinned, or unsupported.");
  const request = buildStepwiseRelationshipEnvelopeRequest(input.candidatePacket);
  const descriptors = selectedDescriptors(input.composition, input.candidatePacket);
  const promptBytes = Buffer.byteLength(request.systemPrompt, "utf8") + Buffer.byteLength(request.sourceSpecification, "utf8");
  if (!Number.isSafeInteger(promptBytes)) throw new ConservativeMultimodalEstimationError("canonical prompt bytes exceed safe integer bounds.");
  validateRoute(input.effectiveRoute, descriptors, promptBytes);
  const selectedMedia = descriptors.map((descriptor) => ({
    sourceSlot: descriptor.sourceSlot,
    assetSha256: descriptor.assetSha256,
    transportAllowanceBytes: projectedBase64DataUrlBytes(descriptor.mediaType, descriptor.byteLength),
    estimatedImageTokens: imageTokens(descriptor.width, descriptor.height),
  }));
  const estimate = estimateCompleteSemCandidateRequest({ candidatePacket: input.candidatePacket, selectedMedia, configuration: input.configuration });
  const projectedTransportBytes = projectAnomanMultipartRequestBytes({
    model: input.serializerPolicy.model,
    messages: [
      { role: "system", parts: [{ type: "text", text: request.systemPrompt }] },
      { role: "user", parts: [{ type: "text", text: request.sourceSpecification }, ...descriptors.map((descriptor) => ({ type: "image" as const, media: { mimeType: descriptor.mediaType, byteLength: descriptor.byteLength } }))] },
    ],
  });
  if (estimate.requestBytes < projectedTransportBytes) throw new ConservativeMultimodalEstimationError(`pinned serializer projection (${projectedTransportBytes}) exceeds conservative request bytes (${estimate.requestBytes}).`);
  return Object.freeze({
    estimate,
    projectedTransportBytes,
    selectedImageCount: descriptors.length,
    selectedImageBytes: safeSum(descriptors.map((descriptor) => descriptor.byteLength), "selected image bytes"),
    providerImageTpm: input.effectiveRoute.imageTpm,
    provenance: Object.freeze({
      composition: Object.freeze({ version: input.composition.version, descriptorManifestSha256: input.composition.descriptorManifestSha256, requestCompositionSha256: input.composition.requestCompositionSha256 }),
      prompt: estimate.provenance.semRequest,
      sourceSpecificationSha256: estimate.provenance.sourcePacket.sourceSpecificationSha256,
      estimator: estimate.provenance.estimator,
      configuration: estimate.provenance.configuration,
      route: Object.freeze({ routeId: input.effectiveRoute.routeId, profileId: input.effectiveRoute.profileId, profileVersion: input.effectiveRoute.profileVersion }),
      serializerPolicy: Object.freeze({ ...input.serializerPolicy }),
      imageTokenPolicy: conservativeMultimodalImageTokenPolicy,
    }),
  });
}
