import { parseStepwiseSemanticExtractionContext, type SemanticBackgroundJob, type StepwiseSemanticExtractionContext } from "@atlas/contracts";
import { type ContextSourceRelationshipRevisionV1, type RelationshipPacketIdentity } from "@atlas/skills";
import { BridgeProviderError, type MultipartChatMessage, type MultimodalRequestProfile, type ProviderProvenance, type StructuredReasoningProvider } from "./provider-capabilities.js";
import { type AtlasSemanticClientConfig } from "./atlas-semantic-client.js";
import { PostgresProvisionalRelationshipRepository } from "./postgres-provisional-relationship-repository.js";
import { runStepwiseSemanticComposition, type StepwiseCompositionDependencies, type StepwiseCompositionResult } from "./semantic-offline-stepwise-composition.js";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };
export type StepwiseSemanticClient = { media(redemption: StepwiseSemanticExtractionContext["stepwise"]["assets"][number]["media"], signal: AbortSignal): Promise<Uint8Array> };
export type MultipartStructuredProvider = StructuredReasoningProvider & { structuredMultipart?(input: { readonly messages: readonly MultipartChatMessage[]; readonly schema: Readonly<Record<string, unknown>>; readonly signal: AbortSignal }): Promise<{ readonly value: unknown; readonly provenance: ProviderProvenance }> };
export type StepwiseRuntimeDependencies = Readonly<{
  readonly database: Database;
  readonly routes: readonly MultimodalRequestProfile[];
  readonly routeId: string;
  readonly profileId: string;
  readonly nowEpochMilliseconds?: number;
}>;

function relationshipScope(context: StepwiseSemanticExtractionContext): RelationshipPacketIdentity {
  return { projectId: context.scope.projectId, workspaceId: context.scope.workspaceId, bundleId: context.scope.bundleId, documentId: context.scope.documentId, executionId: context.stepwise.perceptionExecutionId, artifactId: context.normalizedDocument.artifactId, sourceSha256: context.normalizedDocument.sourceSha256 };
}

async function media(context: StepwiseSemanticExtractionContext, client: StepwiseSemanticClient, signal: AbortSignal) {
  const resolved = await Promise.all(context.stepwise.assets.map(async (asset) => [asset.assetRef, { assetRef: asset.assetRef, sha256: asset.sha256, sourceSha256: asset.sourceSha256, mimeType: asset.mimeType, width: asset.width, height: asset.height, bytes: await client.media(asset.media, signal) }] as const));
  return new Map(resolved);
}

function transport(provider: MultipartStructuredProvider) {
  return async (input: { readonly messages: readonly MultipartChatMessage[]; readonly schema: Readonly<Record<string, unknown>>; readonly signal: AbortSignal }) => {
    const images = input.messages.some((message) => message.parts.some((part) => part.type === "image"));
    if (images) {
      if (!provider.structuredMultipart) throw new BridgeProviderError("unsupported_capability", "The selected semantic route cannot transport authorized images.");
      return provider.structuredMultipart(input);
    }
    return provider.structured({ messages: input.messages.map((message) => ({ role: message.role, content: message.parts.filter((part): part is Extract<typeof part, { readonly type: "text" }> => part.type === "text").map((part) => part.text).join("\n") })), schema: input.schema, signal: input.signal });
  };
}

/** Executes the ordinary context through the same promoted engine as offline
 * qualification. It accepts no raw response/provenance injection. */
export async function runOrdinaryStepwiseSemanticExtraction(input: {
  readonly job: SemanticBackgroundJob;
  readonly redeemedContext: unknown;
  readonly client: StepwiseSemanticClient;
  readonly provider: MultipartStructuredProvider;
  readonly idempotencyKey: string;
  readonly lease: { readonly owner: string; readonly generation: number };
  readonly signal: AbortSignal;
  readonly dependencies: StepwiseRuntimeDependencies;
}): Promise<StepwiseCompositionResult> {
  const context = parseStepwiseSemanticExtractionContext(input.redeemedContext);
  if (context.scope.executionId !== input.job.executionId || context.stepwise.profileId !== "atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0") throw new Error("STEPWISE_CONTEXT_BLOCKED: execution or profile identity is invalid.");
  const scope = relationshipScope(context);
  const prior: readonly ContextSourceRelationshipRevisionV1[] = await new PostgresProvisionalRelationshipRepository(input.dependencies.database).loadForSnapshot(scope);
  const assets = context.stepwise.assets.map((asset) => ({ assetRef: asset.assetRef, sha256: asset.sha256, sourceSha256: asset.sourceSha256, pageNumber: asset.pageNumber, locatorId: asset.locatorId }));
  const composition: StepwiseCompositionDependencies = { database: input.dependencies.database, idempotencyKey: input.idempotencyKey, lease: input.lease, routes: input.dependencies.routes, routeId: input.dependencies.routeId, profileId: input.dependencies.profileId, nowEpochMilliseconds: input.dependencies.nowEpochMilliseconds ?? Date.now(), signal: input.signal, transport: transport(input.provider) };
  return runStepwiseSemanticComposition({ scope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId: scope.documentId, executionId: input.job.executionId, sourceSha256: scope.sourceSha256 }, normalizedDocument: context.normalizedDocument, assetIdentities: assets, media: await media(context, input.client, input.signal), relationshipScope: scope, trustedPriorRevisions: prior }, composition);
}
