import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { canonicalMultimodalSha256, buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket, composeCanonicalMultimodalSource } from "@atlas/skills";
import { bindSemanticMultimodalReconstructionPolicyV1, type AcceptedDocumentPlannerResultV1, type ResolvedSemanticBatchV3References } from "@atlas/db";
import { estimateConservativeMultimodalRequest } from "../src/conservative-multimodal-estimation.ts";
import { anomanMultipartSerializationPolicy } from "../src/providers/anoman-multipart-serialization.ts";
import { conservativeMultimodalImageTokenPolicy } from "../src/conservative-multimodal-estimation.ts";
import { verifyIdserV3ReconstructionParity, IdserV3ReconstructionParityError } from "../src/idser-v3-reconstruction-parity.ts";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const scope = { projectId: "parity-project", workspaceId: "parity-workspace", bundleId: "parity-bundle", documentId: "parity-document" };
const sourceSha256 = sha("parity-source");
const visual = { assetRef: "derived/00000000-0000-0000-0000-000000000001", locatorId: "figure", pageNumber: 1, mediaType: "image/png" as const, sha256: sha("parity-png"), byteLength: 24, width: 16, height: 16 };
const document = { version: "v1" as const, executionId: "parity-execution", artifactId: scope.documentId, sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: "v1" as const }, provider: { name: "docling", processor: "test", executionId: "parity-execution", processedAt: "2026-10-21T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text", text: "Bounded reconstruction source." }], tables: [], visualRegions: [{ id: "figure", assetRef: visual.assetRef }] }] };
const accepted: AcceptedDocumentPlannerResultV1 = { scope, normalizedDocument: document, source: { documentId: scope.documentId, sourceSha256 }, media: [visual], rel: { state: "unavailable" } };
const identity = (name: string) => ({ identity: name, version: "v1" });

function fixture(): Readonly<{ resolved: ResolvedSemanticBatchV3References; configuration: any; route: any; serializer: any }> {
  const owned = { documentId: scope.documentId, pageNumber: 1, sourceKind: "text_block" as const, localId: "text" };
  const context = { documentId: scope.documentId, pageNumber: 1, sourceKind: "visual_region" as const, localId: "figure" };
  const metadata = [{ pageNumber: visual.pageNumber, locatorId: visual.locatorId, assetRef: visual.assetRef, sourceSha256, assetSha256: visual.sha256, mediaType: visual.mediaType, width: visual.width, height: visual.height, byteLength: visual.byteLength }];
  const packet = buildStepwiseSourcePacket({ document, ownedLocators: [{ pageNumber: 1, locatorType: "text_block", locatorId: "text" }], contextOnlyLocators: [{ pageNumber: 1, locatorType: "visual_region", locatorId: "figure" }], assetIdentities: metadata.map(({ pageNumber, locatorId, assetRef, assetSha256 }) => ({ pageNumber, locatorId, assetRef, sha256: assetSha256, sourceSha256 })) });
  const composition = composeCanonicalMultimodalSource({ document, ownedLocators: [{ pageNumber: 1, locatorType: "text_block", locatorId: "text" }], contextOnlyLocators: [{ pageNumber: 1, locatorType: "visual_region", locatorId: "figure" }], verifiedDerivedImages: metadata });
  const configuration = { estimator: identity("complete-estimator"), configuration: identity("complete-configuration"), inputBytesPerToken: 4, framingAllowanceBytes: 64, requestByteSafetyMargin: 4096, inputTokenSafetyMargin: 1, reservedOutputTokens: 64, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } } as const;
  const route = { version: "v1" as const, routeId: "parity-route", profileId: "parity-profile", profileVersion: "v1", maxPromptBytes: 1_000_000, maxDeadlineMilliseconds: 10_000, image: { version: "v1" as const, mediaTypes: ["image/png"] as const, maxImageCount: 2, maxImageBytes: 100_000, maxImageWidth: 1_000, maxImageHeight: 1_000 }, imageTpm: { state: "qualified" as const, tokensPerImage: 516 } };
  const serializer = { identity: anomanMultipartSerializationPolicy.identity, version: anomanMultipartSerializationPolicy.version, model: "parity-model" } as const;
  const estimate = estimateConservativeMultimodalRequest({ composition, candidatePacket: packet, effectiveRoute: route, serializerPolicy: serializer, configuration });
  const reference = { documentPlanRef: "semantic-plan-parity", planHash: sha("plan"), batchId: "batch-0001", batchHandoffRef: "semantic-handoff-parity", batchHandoffHash: sha("handoff") };
  const binding = bindSemanticMultimodalReconstructionPolicyV1({
    bindingVersion: "SemanticMultimodalReconstructionPolicyBinding/v1", planRef: reference.documentPlanRef, handoffRef: reference.batchHandoffRef, planHash: reference.planHash, handoffHash: reference.batchHandoffHash, batchId: reference.batchId, batchSlot: 1,
    identityBinding: { prompt: identity("prompt"), schema: identity("schema"), composer: identity("composer"), route: identity("route"), adapter: identity("adapter") },
    estimatorBinding: { estimator: configuration.estimator, configuration: configuration.configuration, configurationSha256: canonicalMultimodalSha256(configuration), inputBytesPerToken: configuration.inputBytesPerToken, framingAllowanceBytes: configuration.framingAllowanceBytes, requestByteSafetyMargin: configuration.requestByteSafetyMargin, inputTokenSafetyMargin: configuration.inputTokenSafetyMargin, reservedOutputTokens: configuration.reservedOutputTokens, requestResourceEnvelope: configuration.requestResourceEnvelope, imageTokenPolicy: { identity: conservativeMultimodalImageTokenPolicy.identity, version: conservativeMultimodalImageTokenPolicy.version, policySha256: canonicalMultimodalSha256(conservativeMultimodalImageTokenPolicy) } },
    routeBinding: { routeId: route.routeId, profileId: route.profileId, profileVersion: route.profileVersion, maxPromptBytes: route.maxPromptBytes, image: route.image, imageTpm: route.imageTpm },
    serializerBinding: { identity: serializer.identity, version: serializer.version, model: serializer.model, policySha256: canonicalMultimodalSha256({ ...anomanMultipartSerializationPolicy, model: serializer.model }) },
  });
  const request = buildStepwiseRelationshipEnvelopeRequest(packet);
  const resolved: ResolvedSemanticBatchV3References = { reference, scope, source: { sourceSha256, normalizedDocumentRef: "parity-cache", perceptionExecutionId: document.executionId, normalizedDocumentFingerprint: sha("fingerprint"), normalizedDocumentVersion: "v1", perceptionCapability: document.perception.capability, perceptionContractVersion: "v1" }, acceptedMedia: [{ assetRef: visual.assetRef, locator: context, sha256: visual.sha256, mediaType: "image/png", byteLength: visual.byteLength, width: visual.width, height: visual.height }], selection: { ownedLocators: [owned], contextOnlyLocators: [context] }, policyBinding: binding, commitments: { sourceSpecificationSha256: packet.sourceSpecificationSha256, requestSha256: request.requestSha256, manifestSha256: composition.descriptorManifestSha256, structuralBound: { identity: "bound", version: "v1", maxRequestBytes: estimate.estimate.requestBytes + 1, maxInputTokens: estimate.estimate.inputTokens + 1, maxPromptBytes: estimate.estimate.requestBytes + 1, maxContextTokens: estimate.estimate.inputTokens + estimate.estimate.reservedOutputTokens + 1 }, packetProfile: identity("packet"), estimator: configuration.estimator, configuration: configuration.configuration, conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: estimate.estimate.requestBytes }, requestBytes: estimate.estimate.requestBytes, inputTokens: estimate.estimate.inputTokens, reservedOutputTokens: estimate.estimate.reservedOutputTokens, requestResourceEnvelope: estimate.estimate.requestResourceEnvelope } };
  return { resolved, configuration, route, serializer };
}

test("proves sidecar-bound v3 reconstruction parity without dispatch or persistence", () => {
  const data = fixture();
  const result = verifyIdserV3ReconstructionParity({ resolved: data.resolved, acceptedDocument: accepted, estimatorConfiguration: data.configuration, effectiveRoute: data.route, serializerPolicy: data.serializer });
  assert.equal(result.reference.batchId, "batch-0001");
  assert.equal(result.selectedMediaManifestSha256, data.resolved.commitments.manifestSha256);
  assert.equal(result.requestBytes, data.resolved.commitments.requestBytes);
});

test("fails closed when route, policy, or immutable measurement drifts", () => {
  const data = fixture();
  assert.throws(() => verifyIdserV3ReconstructionParity({ resolved: data.resolved, acceptedDocument: accepted, estimatorConfiguration: data.configuration, effectiveRoute: { ...data.route, maxPromptBytes: 1 }, serializerPolicy: data.serializer }), IdserV3ReconstructionParityError);
  assert.throws(() => verifyIdserV3ReconstructionParity({ resolved: { ...data.resolved, commitments: { ...data.resolved.commitments, requestSha256: sha("tampered") } }, acceptedDocument: accepted, estimatorConfiguration: data.configuration, effectiveRoute: data.route, serializerPolicy: data.serializer }), IdserV3ReconstructionParityError);
});
