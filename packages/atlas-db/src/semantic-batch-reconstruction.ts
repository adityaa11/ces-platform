import { createHash } from "node:crypto";
import {
  buildStepwiseRelationshipEnvelopeRequest,
  buildStepwiseSourcePacket,
  type StepwiseSourceAssetIdentity,
  type StepwiseSourceLocator,
} from "@atlas/skills";
import {
  PostgresAcceptedSemanticBatchPlanDocumentResolver,
  type AcceptedDocumentPlannerResultV1,
  type SemanticBatchPlanInputV1,
} from "./semantic-batch-plan-input.js";
import type { ResolvedSemanticBatchV3References } from "./semantic-batch-v3-reference-resolution.js";

type Row = Record<string, unknown>;
type ReadOnlySql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };
type Identity = Readonly<{ identity: string; version: string }>;
type Envelope = Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }>;
type StructuralBound = Readonly<{ identity: string; version: string; maxRequestBytes: number; maxInputTokens: number; maxPromptBytes: number; maxContextTokens: number }>;
type AcceptedMedia = NonNullable<AcceptedDocumentPlannerResultV1["media"][number]>;

export class SemanticBatchReconstructionError extends Error {}

/** The v3 immutable identifiers redeemed by the approved background resolver. */
export type SemanticBatchReconstructionReferenceV3 = ResolvedSemanticBatchV3References;

/** Bounded proof metadata. The request and manifest bodies are intentionally absent. */
export type VerifiedSemanticBatchReconstructionV3 = Readonly<{
  reference: ResolvedSemanticBatchV3References["reference"];
  sourceSpecificationSha256: string;
  requestSha256: string;
  manifestSha256: string;
  sourceSlotOrder: readonly string[];
  packetProfile: Identity;
  estimator: Identity;
  configuration: Identity;
  structuralBound: StructuralBound;
  conservativeLogicalRequestBytes: Readonly<{ version: "ConservativeLogicalRequestBytes/v1"; value: number }>;
  requestBytes: number;
  inputTokens: number;
  reservedOutputTokens: number;
  requestResourceEnvelope: Envelope;
}>;

type BackgroundAcceptedDocumentResolver = Pick<PostgresAcceptedSemanticBatchPlanDocumentResolver, "resolveBackground">;

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const digestJson = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fail = (message: string): never => { throw new SemanticBatchReconstructionError(`Semantic batch reconstruction is unavailable or invalid: ${message}`); };
const locatorKey = (locator: { documentId: string; pageNumber: number; sourceKind: string; localId: string }) => `${locator.documentId}\u0000${locator.pageNumber}\u0000${locator.sourceKind}\u0000${locator.localId}`;

function planInput(source: ResolvedSemanticBatchV3References["source"]): SemanticBatchPlanInputV1 {
  return {
    normalizedDocumentRef: source.normalizedDocumentRef,
    perceptionExecutionId: source.perceptionExecutionId,
    normalizedDocumentFingerprint: source.normalizedDocumentFingerprint,
    sourceSha256: source.sourceSha256,
    normalizedDocumentVersion: "v1",
  };
}

function selectedLocators(input: ResolvedSemanticBatchV3References): { owned: readonly StepwiseSourceLocator[]; context: readonly StepwiseSourceLocator[] } {
  const convert = (locator: ResolvedSemanticBatchV3References["selection"]["ownedLocators"][number]): StepwiseSourceLocator => ({
    pageNumber: locator.pageNumber,
    locatorType: locator.sourceKind,
    locatorId: locator.localId,
  });
  return { owned: input.selection.ownedLocators.map(convert), context: input.selection.contextOnlyLocators.map(convert) };
}

function selectedMedia(
  input: ResolvedSemanticBatchV3References,
  accepted: AcceptedDocumentPlannerResultV1,
): { manifest: readonly AcceptedMedia[]; identities: readonly StepwiseSourceAssetIdentity[] } {
  const selected = new Set([...input.selection.ownedLocators, ...input.selection.contextOnlyLocators].map(locatorKey));
  const mediaByKey = new Map<string, AcceptedMedia>();
  for (const media of accepted.media) mediaByKey.set(locatorKey({ documentId: accepted.scope.documentId, pageNumber: media.pageNumber, sourceKind: "visual_region", localId: media.locatorId }), media);
  const manifest: AcceptedMedia[] = [];
  for (const descriptor of input.acceptedMedia) {
    const key = locatorKey(descriptor.locator);
    if (!selected.has(key) || descriptor.locator.sourceKind !== "visual_region") fail("accepted image descriptor is not selected");
    const actual = mediaByKey.get(key);
    if (!actual || actual.assetRef !== descriptor.assetRef || actual.sha256 !== descriptor.sha256 || actual.mediaType !== descriptor.mediaType || actual.byteLength !== descriptor.byteLength) fail("accepted image descriptor is unavailable or substituted");
    if (!actual) fail("accepted image descriptor is unavailable or substituted");
    const matched = actual as AcceptedMedia;
    manifest.push(matched);
  }
  if (new Set(manifest.map((media) => locatorKey({ documentId: accepted.scope.documentId, pageNumber: media.pageNumber, sourceKind: "visual_region", localId: media.locatorId }))).size !== manifest.length) fail("accepted image descriptor is duplicated");
  return {
    manifest,
    identities: manifest.map((media) => ({ pageNumber: media.pageNumber, locatorId: media.locatorId, assetRef: media.assetRef, sha256: media.sha256, sourceSha256: accepted.source.sourceSha256 })),
  };
}

function verifyMeasurements(
  input: ResolvedSemanticBatchV3References,
  request: ReturnType<typeof buildStepwiseRelationshipEnvelopeRequest>,
  manifest: readonly AcceptedMedia[],
): Envelope {
  const commitments = input.commitments;
  const requestBytes = Buffer.byteLength(request.systemPrompt) + Buffer.byteLength(request.sourceSpecification) + Buffer.byteLength(JSON.stringify(request.responseSchema));
  const inputTokens = Math.ceil(requestBytes / 4);
  const requestHash = digestJson(request);
  const manifestHash = digestJson(manifest);
  if (request.sourceSpecificationSha256 !== commitments.sourceSpecificationSha256) fail("source specification integrity hash does not match");
  if (requestHash !== commitments.requestSha256) fail("logical request integrity hash does not match");
  if (manifestHash !== commitments.manifestSha256) fail("selected media manifest integrity hash does not match");
  if (commitments.conservativeLogicalRequestBytes.value !== requestBytes || commitments.requestBytes !== requestBytes) fail("request byte measurement does not match");
  if (commitments.inputTokens !== inputTokens) fail("input token measurement does not match");
  if (commitments.requestResourceEnvelope.tokenUnits !== inputTokens) fail("request resource token measurement does not match");
  const bound = commitments.structuralBound;
  if (requestBytes > bound.maxRequestBytes || requestBytes > bound.maxPromptBytes || inputTokens > bound.maxInputTokens || inputTokens > bound.maxContextTokens) fail("reconstructed request exceeds the persisted structural envelope");
  if (commitments.reservedOutputTokens <= 0 || !Number.isSafeInteger(commitments.reservedOutputTokens)) fail("reserved output measurement is invalid");
  return commitments.requestResourceEnvelope;
}

/**
 * Transient, background-only SEM parity boundary. The v3 reference resolver is
 * responsible for persisted authorization and reference integrity; this class
 * only reads the accepted NormalizedDocument V1 and reconstructs in memory.
 */
export class PostgresSemanticBatchReconstructionResolver {
  private readonly acceptedDocumentResolver: BackgroundAcceptedDocumentResolver;

  constructor(sql: ReadOnlySql, acceptedDocumentResolver: BackgroundAcceptedDocumentResolver = new PostgresAcceptedSemanticBatchPlanDocumentResolver(sql)) {
    this.acceptedDocumentResolver = acceptedDocumentResolver;
  }

  async reconstruct(input: SemanticBatchReconstructionReferenceV3): Promise<VerifiedSemanticBatchReconstructionV3> {
    if (!input || !record(input) || !record(input.reference) || !record(input.scope) || !record(input.source) || !record(input.commitments)) fail("resolved v3 references are malformed");
    const resolved = input;
    const accepted = await this.acceptedDocumentResolver.resolveBackground(planInput(resolved.source)).catch(() => fail("accepted NormalizedDocument V1 source is unavailable or unauthorized"));
    if (accepted.scope.projectId !== resolved.scope.projectId || accepted.scope.workspaceId !== resolved.scope.workspaceId || accepted.scope.bundleId !== resolved.scope.bundleId || accepted.scope.documentId !== resolved.scope.documentId
      || accepted.source.documentId !== resolved.scope.documentId || accepted.source.sourceSha256 !== resolved.source.sourceSha256
      || accepted.normalizedDocument.executionId !== resolved.source.perceptionExecutionId || accepted.normalizedDocument.artifactId !== resolved.scope.documentId
      || accepted.normalizedDocument.sourceSha256 !== resolved.source.sourceSha256 || accepted.normalizedDocument.perception.capability !== resolved.source.perceptionCapability
      || accepted.normalizedDocument.perception.contractVersion !== resolved.source.perceptionContractVersion || accepted.rel.state !== "unavailable") fail("accepted source binding is inconsistent");

    const { owned, context } = selectedLocators(resolved);
    const media = selectedMedia(resolved, accepted);
    const packet = (() => {
      try {
        return buildStepwiseSourcePacket({ document: accepted.normalizedDocument, ownedLocators: owned, contextOnlyLocators: context, assetIdentities: media.identities });
      } catch {
        return fail("shared source packet reconstruction rejected the persisted selection");
      }
    })();
    const request = (() => {
      try { return buildStepwiseRelationshipEnvelopeRequest(packet); }
      catch { return fail("shared logical request reconstruction rejected the persisted selection"); }
    })();
    const envelope = verifyMeasurements(resolved, request, media.manifest);
    const commitments = resolved.commitments;
    return {
      reference: resolved.reference,
      sourceSpecificationSha256: packet.sourceSpecificationSha256,
      requestSha256: commitments.requestSha256,
      manifestSha256: commitments.manifestSha256,
      sourceSlotOrder: request.sourceSlots.map((slot) => slot.slot),
      packetProfile: commitments.packetProfile,
      estimator: commitments.estimator,
      configuration: commitments.configuration,
      structuralBound: commitments.structuralBound,
      conservativeLogicalRequestBytes: commitments.conservativeLogicalRequestBytes,
      requestBytes: commitments.requestBytes,
      inputTokens: commitments.inputTokens,
      reservedOutputTokens: commitments.reservedOutputTokens,
      requestResourceEnvelope: envelope,
    };
  }
}
