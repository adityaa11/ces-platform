import { parseSemanticBackgroundJob, parseSemanticExtractionContext, parseSemanticReconciliationResult, semanticContractVersion, toAtlasJsonSchema, type SemanticBackgroundJob } from "@atlas/contracts";
import { atlasProviderRelationshipExtractionEnvelopeV1Schema, buildSemanticSourcePacket, getProductionSemanticSkill, loadProvisionalRelationshipPacketExtension, type ProviderProvenance as RelationshipProviderProvenance, type ProvisionalRelationshipRepository, type RelationshipPacketIdentity } from "@atlas/skills";
import { BridgeProviderError, type StructuredReasoningProvider } from "./provider-capabilities.js";
import { AtlasSemanticClientError } from "./atlas-semantic-client.js";
import { SemanticReplayLeaseLostError } from "./semantic-result-replay.js";
import { finalizeExtractionProposal } from "./semantic-extraction-finalizer.js";
import { finalizeRelationshipExtractionEnvelope, type RelationshipFinalizationSlot } from "./semantic-relationship-sidecar.js";

export type SemanticClient = { context(job: SemanticBackgroundJob, signal: AbortSignal): Promise<unknown>; deliver(envelope: unknown, signal: AbortSignal): Promise<void>; fail(failure: unknown, signal: AbortSignal): Promise<void> };
export type SemanticReplay = { load(idempotencyKey: string, executionId: string): Promise<unknown | undefined>; stage(idempotencyKey: string, executionId: string, envelope: unknown, lease: { readonly owner: string; readonly generation: number }): Promise<unknown>; acknowledge(idempotencyKey: string, executionId: string): Promise<void> };
const failureCode = (error: unknown) => error instanceof BridgeProviderError ? (error.code === "timeout" ? "provider_timeout" : error.code === "malformed_response" || error.code === "response_bound" ? "malformed_output" : "provider_unavailable") : "integrity_validation";
const isReplayLeaseLost = (error: unknown): error is SemanticReplayLeaseLostError => error instanceof SemanticReplayLeaseLostError || (error instanceof Error && error.name === "SemanticReplayLeaseLostError");
const relationshipEnvelopeJsonSchema = toAtlasJsonSchema(atlasProviderRelationshipExtractionEnvelopeV1Schema);

export type RelationshipExtractionComposition = {
  readonly packetIdentity: RelationshipPacketIdentity;
  readonly sourceSlots: readonly RelationshipFinalizationSlot[];
  readonly repository: ProvisionalRelationshipRepository;
};

function relationshipProviderProvenance(value: { readonly provider: string; readonly model: string; readonly endpoint: string; readonly attempt: number; readonly metadata?: Readonly<Record<string, string | number | boolean>> }): RelationshipProviderProvenance {
  const runId = value.metadata?.runId;
  return { provider: value.provider, model: value.model, endpoint: value.endpoint, attempt: value.attempt, ...(typeof runId === "string" && runId.length > 0 ? { runId } : {}) };
}

function assertRelationshipComposition(context: { readonly scope: Record<string, string>; readonly normalizedDocument: { readonly executionId: string; readonly artifactId: string; readonly sourceSha256: string } }, packet: ReturnType<typeof buildSemanticSourcePacket>, composition: RelationshipExtractionComposition) {
  const identity = composition.packetIdentity;
  if (identity.projectId !== context.scope.projectId || identity.workspaceId !== context.scope.workspaceId || identity.bundleId !== context.scope.bundleId || identity.documentId !== context.scope.documentId || identity.documentId !== context.normalizedDocument.artifactId || identity.artifactId !== context.normalizedDocument.artifactId || identity.executionId !== context.normalizedDocument.executionId || identity.sourceSha256 !== context.normalizedDocument.sourceSha256) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: trusted relationship packet identity does not match the validated extraction context.");
  if (composition.sourceSlots.length !== packet.sourceSlotMap.length) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: trusted relationship slots do not account for the canonical packet.");
  for (const source of packet.sourceSlotMap) {
    const trusted = composition.sourceSlots.find((slot) => slot.slot === source.slot);
    if (!trusted || trusted.pageNumber !== source.pageNumber || trusted.locatorType !== source.locatorType || trusted.locatorId !== source.locatorId || trusted.content !== source.content || trusted.sourceSha256 !== identity.sourceSha256) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: trusted relationship slots do not exactly match the canonical packet.");
  }
}

export async function runSemanticJob(jobValue: unknown, provider: StructuredReasoningProvider, client: SemanticClient, replay: SemanticReplay, idempotencyKey: string, signal: AbortSignal, lease = { owner: "unit-test", generation: 1 }, relationship?: RelationshipExtractionComposition): Promise<void> {
  const job = parseSemanticBackgroundJob(jobValue);
  const staged = await replay.load(idempotencyKey, job.executionId);
  if (staged) {
    if (relationship && !await relationship.repository.loadStagedSidecar({ executionId: job.executionId, idempotencyKey })) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: canonical replay exists without its relationship sidecar.");
    await client.deliver(staged, signal); return;
  }
  let context: { readonly scope: Record<string, string> } | undefined;
  // A persisted envelope is the authoritative result for this execution.  A
  // delivery transport failure after this point must return to pg-boss for a
  // replay, rather than terminally failing the result that was just staged.
  let trustedStage = false;
  try {
    context = await client.context(job, signal) as { readonly scope: Record<string, string> };
    if (signal.aborted) throw new BridgeProviderError("cancelled", "Semantic execution was cancelled.");
    const extractionContext = job.skill.id === "atlas.semantic.extract" ? parseSemanticExtractionContext(context) : undefined;
    const skill = extractionContext ? undefined : getProductionSemanticSkill(job.skill.id, job.skill.version);
    const packet = extractionContext ? buildSemanticSourcePacket(extractionContext.normalizedDocument) : undefined;
    if (extractionContext && relationship) assertRelationshipComposition(extractionContext, packet!, relationship);
    const relationshipExtension = extractionContext && relationship ? await loadProvisionalRelationshipPacketExtension({ sourceSnapshot: relationship.packetIdentity, sourceSlots: relationship.sourceSlots, repository: relationship.repository }) : undefined;
    const relationshipRequest = relationshipExtension ? { source_slots: packet!.sourceSlotMap.map(({ slot, content }) => ({ slot, content })), provisional_relationships: relationshipExtension } : undefined;
    const response = await provider.structured(extractionContext
      ? { messages: [{ role: "system", content: packet!.systemPrompt }, { role: "user", content: relationshipRequest ? JSON.stringify(relationshipRequest) : packet!.userPrompt }], schema: relationshipRequest ? relationshipEnvelopeJsonSchema : packet!.providerProposalJsonSchema, signal }
      : { messages: [{ role: "system", content: skill!.promptTemplate }, { role: "user", content: JSON.stringify(context) }], schema: skill!.outputSchema, signal });
    const result = extractionContext ? relationship
      ? (await finalizeRelationshipExtractionEnvelope({ envelope: response.value, sourceSlots: relationship.sourceSlots, provisionalRevisions: [], repository: relationship.repository, packetIdentity: relationship.packetIdentity, providerProvenance: relationshipProviderProvenance(response.provenance), executionId: job.executionId, idempotencyKey })).canonicalResult
      : finalizeExtractionProposal({ proposal: response.value, sourceSlots: packet!.sourceSlotMap })
      : parseSemanticReconciliationResult(response.value);
    const envelope = { version: semanticContractVersion, scope: context.scope, skill: job.skill, provider: response.provenance, result };
    const winningEnvelope = await replay.stage(idempotencyKey, job.executionId, envelope, lease);
    trustedStage = true;
    await client.deliver(winningEnvelope, signal);
  } catch (error) {
    if (isReplayLeaseLost(error)) {
      const winner = await replay.load(idempotencyKey, job.executionId);
      if (winner) { await client.deliver(winner, signal); return; }
      throw error;
    }
    if (trustedStage) {
      if (context && error instanceof AtlasSemanticClientError && error.operation === "result" && error.status === 422) {
        await client.fail({ version: semanticContractVersion, scope: context.scope, code: "integrity_validation", message: "Semantic execution failed before a trusted result was delivered." }, signal);
        return;
      }
      throw error;
    }
    // A worker-stop or queue cancellation has no semantic outcome to report.
    // Let pg-boss release the fenced effect so a fresh claimant can retry;
    // sending a terminal failure with an aborted signal can otherwise race the
    // shutdown and complete an execution that never produced trusted output.
    if (signal.aborted) throw error;
    if (context && !(error instanceof Error && error.message.includes("handoff was rejected"))) {
      const failure = { version: semanticContractVersion, scope: context.scope, code: failureCode(error), message: "Semantic execution failed before a trusted result was delivered." };
      await client.fail(failure, signal);
      return;
    }
    throw error;
  }
}
