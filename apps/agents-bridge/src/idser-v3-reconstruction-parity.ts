import {
  canonicalMultimodalSha256,
  buildStepwiseRelationshipEnvelopeRequest,
  buildStepwiseSourcePacket,
  composeCanonicalMultimodalSource,
  type StepwiseSourceLocator,
} from "@atlas/skills";
import type { AcceptedDocumentPlannerResultV1, ResolvedSemanticBatchV3References } from "@atlas/db";
import { anomanMultipartSerializationPolicy } from "./providers/anoman-multipart-serialization.js";
import { conservativeMultimodalImageTokenPolicy, estimateConservativeMultimodalRequest, type PinnedMultimodalSerializerPolicy } from "./conservative-multimodal-estimation.js";
import type { CompleteSemCandidateRequestEstimatorConfiguration } from "./complete-sem-candidate-request-estimator.js";
import type { MultimodalRequestProfile } from "./provider-capabilities.js";

export class IdserV3ReconstructionParityError extends Error {
  constructor(message: string) { super(`IDSER_V3_RECONSTRUCTION_PARITY_REJECTED: ${message}`); }
}

export type VerifiedIdserV3ReconstructionParity = Readonly<{
  reference: ResolvedSemanticBatchV3References["reference"];
  sourceSpecificationSha256: string;
  requestSha256: string;
  selectedMediaManifestSha256: string;
  sourceSlotOrder: readonly string[];
  requestBytes: number;
  inputTokens: number;
  reservedOutputTokens: number;
  requestResourceEnvelope: Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }>;
  identities: ResolvedSemanticBatchV3References["policyBinding"]["identityBinding"];
}>;

const same = (left: unknown, right: unknown) => canonicalMultimodalSha256(left) === canonicalMultimodalSha256(right);
const fail = (message: string): never => { throw new IdserV3ReconstructionParityError(message); };
const locator = (value: ResolvedSemanticBatchV3References["selection"]["ownedLocators"][number]): StepwiseSourceLocator => ({ pageNumber: value.pageNumber, locatorType: value.sourceKind, locatorId: value.localId });

/**
 * Read-only proof surface. It accepts redeemed v3 metadata plus an already
 * authorized in-memory source and never has a transport, grant, job, or write
 * dependency. All policy is supplied from the immutable sidecar, never a
 * current route/config default.
 */
export function verifyIdserV3ReconstructionParity(input: Readonly<{
  resolved: ResolvedSemanticBatchV3References;
  acceptedDocument: AcceptedDocumentPlannerResultV1;
  estimatorConfiguration: CompleteSemCandidateRequestEstimatorConfiguration;
  effectiveRoute: MultimodalRequestProfile;
  serializerPolicy: PinnedMultimodalSerializerPolicy;
}>): VerifiedIdserV3ReconstructionParity {
  const { resolved, acceptedDocument, estimatorConfiguration, effectiveRoute, serializerPolicy } = input;
  const binding = resolved.policyBinding;
  if (acceptedDocument.rel.state !== "unavailable" || acceptedDocument.scope.documentId !== resolved.scope.documentId
    || acceptedDocument.source.sourceSha256 !== resolved.source.sourceSha256 || acceptedDocument.normalizedDocument.executionId !== resolved.source.perceptionExecutionId
    || acceptedDocument.normalizedDocument.sourceSha256 !== resolved.source.sourceSha256) fail("accepted source is foreign, stale, or unavailable");
  if (!same(estimatorConfiguration.estimator, binding.estimatorBinding.estimator) || !same(estimatorConfiguration.configuration, binding.estimatorBinding.configuration)
    || canonicalMultimodalSha256(estimatorConfiguration) !== binding.estimatorBinding.configurationSha256
    || estimatorConfiguration.inputBytesPerToken !== binding.estimatorBinding.inputBytesPerToken
    || estimatorConfiguration.framingAllowanceBytes !== binding.estimatorBinding.framingAllowanceBytes
    || estimatorConfiguration.requestByteSafetyMargin !== binding.estimatorBinding.requestByteSafetyMargin
    || estimatorConfiguration.inputTokenSafetyMargin !== binding.estimatorBinding.inputTokenSafetyMargin
    || estimatorConfiguration.reservedOutputTokens !== binding.estimatorBinding.reservedOutputTokens
    || !same(estimatorConfiguration.requestResourceEnvelope, binding.estimatorBinding.requestResourceEnvelope)) fail("estimator configuration is not the immutable bound policy");
  if (binding.estimatorBinding.imageTokenPolicy.identity !== conservativeMultimodalImageTokenPolicy.identity
    || binding.estimatorBinding.imageTokenPolicy.version !== conservativeMultimodalImageTokenPolicy.version
    || binding.estimatorBinding.imageTokenPolicy.policySha256 !== canonicalMultimodalSha256(conservativeMultimodalImageTokenPolicy)) fail("image-token policy is unknown or drifted");
  if (effectiveRoute.routeId !== binding.routeBinding.routeId || effectiveRoute.profileId !== binding.routeBinding.profileId || effectiveRoute.profileVersion !== binding.routeBinding.profileVersion
    || effectiveRoute.maxPromptBytes !== binding.routeBinding.maxPromptBytes || !effectiveRoute.image
    || !same(effectiveRoute.image, binding.routeBinding.image) || !same(effectiveRoute.imageTpm, binding.routeBinding.imageTpm)) fail("effective route profile is not the immutable bound policy");
  if (serializerPolicy.identity !== binding.serializerBinding.identity || serializerPolicy.version !== binding.serializerBinding.version || serializerPolicy.model !== binding.serializerBinding.model
    || canonicalMultimodalSha256({ ...anomanMultipartSerializationPolicy, model: serializerPolicy.model }) !== binding.serializerBinding.policySha256) fail("serializer policy is unknown or drifted");
  const selected = new Set([...resolved.selection.ownedLocators, ...resolved.selection.contextOnlyLocators].map((item) => `${item.pageNumber}\u0000${item.localId}`));
  const metadata = resolved.acceptedMedia.map((media) => {
    if (!selected.has(`${media.locator.pageNumber}\u0000${media.locator.localId}`)) fail("media commitment is not selected");
    return { pageNumber: media.locator.pageNumber, locatorId: media.locator.localId, assetRef: media.assetRef, sourceSha256: resolved.source.sourceSha256, assetSha256: media.sha256, mediaType: media.mediaType, width: media.width, height: media.height, byteLength: media.byteLength } as const;
  });
  const owned = resolved.selection.ownedLocators.map(locator);
  const context = resolved.selection.contextOnlyLocators.map(locator);
  const composition = composeCanonicalMultimodalSource({ document: acceptedDocument.normalizedDocument, ownedLocators: owned, contextOnlyLocators: context, verifiedDerivedImages: metadata });
  const packet = buildStepwiseSourcePacket({ document: acceptedDocument.normalizedDocument, ownedLocators: owned, contextOnlyLocators: context, assetIdentities: metadata.map((item) => ({ pageNumber: item.pageNumber, locatorId: item.locatorId, assetRef: item.assetRef, sha256: item.assetSha256, sourceSha256: item.sourceSha256 })) });
  const request = buildStepwiseRelationshipEnvelopeRequest(packet);
  const estimate = estimateConservativeMultimodalRequest({ composition, candidatePacket: packet, effectiveRoute, serializerPolicy, configuration: estimatorConfiguration });
  const commitment = resolved.commitments;
  if (packet.sourceSpecificationSha256 !== commitment.sourceSpecificationSha256 || request.requestSha256 !== commitment.requestSha256
    || composition.descriptorManifestSha256 !== commitment.manifestSha256 || estimate.estimate.requestBytes !== commitment.requestBytes
    || estimate.estimate.inputTokens !== commitment.inputTokens || estimate.estimate.reservedOutputTokens !== commitment.reservedOutputTokens
    || !same(estimate.estimate.requestResourceEnvelope, commitment.requestResourceEnvelope)
    || estimate.estimate.requestBytes > commitment.structuralBound.maxRequestBytes || estimate.estimate.requestBytes > commitment.structuralBound.maxPromptBytes
    || estimate.estimate.inputTokens > commitment.structuralBound.maxInputTokens || estimate.estimate.inputTokens + estimate.estimate.reservedOutputTokens > commitment.structuralBound.maxContextTokens) fail("canonical reconstruction differs from immutable v3 commitments");
  return Object.freeze({ reference: resolved.reference, sourceSpecificationSha256: packet.sourceSpecificationSha256, requestSha256: request.requestSha256, selectedMediaManifestSha256: composition.descriptorManifestSha256, sourceSlotOrder: Object.freeze(request.sourceSlots.map((slot) => slot.slot)), requestBytes: estimate.estimate.requestBytes, inputTokens: estimate.estimate.inputTokens, reservedOutputTokens: estimate.estimate.reservedOutputTokens, requestResourceEnvelope: Object.freeze({ ...estimate.estimate.requestResourceEnvelope }), identities: binding.identityBinding });
}
