import { createHash } from "node:crypto";
import {
  buildStepwiseRelationshipEnvelopeRequest,
  buildStepwiseSourcePacket,
  prepareQualifiedStepwiseSemanticCompositeAccounting,
  verifyQualifiedStepwiseSemanticPreparation,
  type ContextSourceRelationshipRevisionV1,
  type RelationshipPacketIdentity,
  type StepwiseSourceAssetIdentity,
} from "@atlas/skills";
import { dispatchMultipartStructured, preflightMultimodalRequest, type MultipartChatMessage, type MultimodalRequestProfile, type ProviderProvenance } from "./provider-capabilities.js";
import { createSemanticCompositeReplay, semanticCompositeHash, type QualifiedSemanticCompositePreparation, type SemanticCompositeWinner } from "./semantic-composite-replay.js";
import { projectQualifiedStepwiseSemanticResult } from "./semantic-extraction-finalizer.js";
import { prepareQualifiedStepwiseSemanticPreparation, projectStepwiseSlotsForRel03 } from "./semantic-relationship-interoperability-bridge.js";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };
const sha256 = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");

/**
 * Explicitly injected, offline-only authority.  It is intentionally not a
 * production semantic context and cannot be constructed from a normal D1 job.
 */
export type OfflineStepwiseQualificationContext = Readonly<{
  readonly scope: { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly executionId: string; readonly sourceSha256: string };
  readonly normalizedDocument: Parameters<typeof buildStepwiseSourcePacket>[0]["document"];
  readonly assetIdentities: readonly StepwiseSourceAssetIdentity[];
  readonly media: ReadonlyMap<string, { readonly assetRef: string; readonly sha256: string; readonly sourceSha256: string; readonly mimeType: "image/png"; readonly width: number; readonly height: number; readonly bytes: Uint8Array }>;
  readonly relationshipScope: RelationshipPacketIdentity;
  readonly trustedPriorRevisions: readonly ContextSourceRelationshipRevisionV1[];
  readonly rawResponse: unknown;
  readonly providerProvenance: ProviderProvenance;
}>;

export type OfflineStepwiseDependencies = Readonly<{
  readonly database: Database;
  readonly idempotencyKey: string;
  readonly lease: { readonly owner: string; readonly generation: number };
  readonly routes: readonly MultimodalRequestProfile[];
  readonly routeId: string;
  readonly profileId: string;
  readonly nowEpochMilliseconds: number;
  readonly dispatch: (messages: readonly MultipartChatMessage[]) => Promise<unknown>;
}>;

function assertContext(context: OfflineStepwiseQualificationContext): void {
  const document = context.normalizedDocument;
  if (document.executionId === context.scope.executionId || document.artifactId !== context.scope.documentId || document.sourceSha256 !== context.scope.sourceSha256) throw new Error("OFFLINE_CONTEXT_BLOCKED: fixture execution or source scope is inconsistent.");
  if (context.relationshipScope.executionId !== document.executionId || context.relationshipScope.artifactId !== document.artifactId || context.relationshipScope.sourceSha256 !== document.sourceSha256) throw new Error("OFFLINE_CONTEXT_BLOCKED: relationship scope is not bound to the fixture source.");
  for (const asset of context.assetIdentities) {
    const media = context.media.get(asset.assetRef);
    if (!media || media.sha256 !== asset.sha256 || media.sourceSha256 !== asset.sourceSha256 || sha256(media.bytes) !== media.sha256) throw new Error("OFFLINE_CONTEXT_BLOCKED: media authorization or asset identity is invalid.");
  }
}

/** Runs the single SEM-007 fake-provider path and stages only an immutable durable composite winner. */
export async function runOfflineStepwiseComposition(context: OfflineStepwiseQualificationContext, dependencies: OfflineStepwiseDependencies): Promise<SemanticCompositeWinner> {
  assertContext(context);
  const replay = createSemanticCompositeReplay(dependencies.database);
  const existing = await replay.load(dependencies.idempotencyKey, context.scope.executionId);
  if (existing) return existing;

  const packet = buildStepwiseSourcePacket({ document: context.normalizedDocument, assetIdentities: context.assetIdentities });
  const request = buildStepwiseRelationshipEnvelopeRequest(packet);
  const imageParts = packet.sourceSlots.flatMap((slot) => {
    if (!slot.assetIdentity) return [];
    const media = context.media.get(slot.assetIdentity.assetRef);
    if (!media || media.assetRef !== slot.assetIdentity.assetRef || media.sha256 !== slot.assetIdentity.sha256 || media.sourceSha256 !== slot.assetIdentity.sourceSha256) throw new Error("OFFLINE_CONTEXT_BLOCKED: source asset cannot be resolved by the supplied grant.");
    return [{ type: "image" as const, sourcePartId: slot.assetIdentity.assetRef, media: { mimeType: media.mimeType, sha256: media.sha256, byteLength: media.bytes.byteLength, width: media.width, height: media.height, bytes: media.bytes } }];
  });
  const messages: readonly MultipartChatMessage[] = [
    { role: "system", parts: [{ type: "text", sourcePartId: "system", text: request.systemPrompt }] },
    { role: "user", parts: [{ type: "text", sourcePartId: "source-specification", text: request.sourceSpecification }, ...imageParts] },
  ];
  const preflight = preflightMultimodalRequest({ routes: dependencies.routes, routeId: dependencies.routeId, profileId: dependencies.profileId, messages, schema: request.responseSchema, signal: new AbortController().signal, deadlineEpochMilliseconds: dependencies.nowEpochMilliseconds + 1_000, nowEpochMilliseconds: dependencies.nowEpochMilliseconds });
  if ("code" in preflight.resourceEstimatorInput) throw new Error(preflight.resourceEstimatorInput.code);
  const rawResponse = await dispatchMultipartStructured({ messages, capabilities: { image: dependencies.routes.find((route) => route.routeId === dependencies.routeId && route.profileId === dependencies.profileId)?.image, }, signal: new AbortController().signal }, dependencies.dispatch);
  const relationshipQualification = { request, rawResponse, relationshipScope: context.relationshipScope, providerProvenance: context.providerProvenance, trustedPriorRevisions: context.trustedPriorRevisions } as const;
  const qualified = prepareQualifiedStepwiseSemanticPreparation(relationshipQualification);
  const sourceSlots = projectStepwiseSlotsForRel03(request).map((slot) => {
    const original = request.sourceSlots.find((candidate) => candidate.slot === slot.slot);
    return original?.content === undefined ? slot : { ...slot, content: original.content };
  });
  const projection = projectQualifiedStepwiseSemanticResult({ proposal: qualified.parsed.semanticProposal, sourceSlots, qualifiedDeferredInterpretations: qualified.qualified.deferred_interpretations, qualifiedRelationshipRevisions: qualified.currentResponseRevisions });
  const accounting = prepareQualifiedStepwiseSemanticCompositeAccounting({ scope: context.scope, request, providerProposal: qualified.parsed.semanticProposal, relationshipRevisions: context.trustedPriorRevisions, currentResponseRelationshipRevisions: qualified.currentResponseRevisions, qualifiedRelationshipResult: qualified.qualified, canonicalProjection: projection });
  verifyQualifiedStepwiseSemanticPreparation({ accounting, request, providerProposal: qualified.parsed.semanticProposal });
  const preparation: QualifiedSemanticCompositePreparation = { accounting, request, providerProposal: qualified.parsed.semanticProposal, canonicalResult: projection.canonicalResult, relationshipQualification };
  const stage = { idempotencyKey: dependencies.idempotencyKey, executionId: context.scope.executionId, lease: dependencies.lease, preparation };
  return replay.stage({ ...stage, compositeHash: semanticCompositeHash(stage) });
}
