import { parseSemanticBackgroundJob, parseSemanticExtractionContext, parseSemanticReconciliationResult, semanticContractVersion, type SemanticBackgroundJob } from "@atlas/contracts";
import { buildSemanticSourcePacket, getProductionSemanticSkill } from "@atlas/skills";
import { BridgeProviderError, type StructuredReasoningProvider } from "./provider-capabilities.js";
import { AtlasSemanticClientError } from "./atlas-semantic-client.js";
import { SemanticReplayLeaseLostError } from "./semantic-result-replay.js";
import { finalizeExtractionProposal } from "./semantic-extraction-finalizer.js";
import { runOfflineStepwiseComposition, type OfflineStepwiseDependencies, type OfflineStepwiseQualificationContext } from "./semantic-offline-stepwise-composition.js";

export type SemanticClient = { context(job: SemanticBackgroundJob, signal: AbortSignal): Promise<unknown>; deliver(envelope: unknown, signal: AbortSignal): Promise<void>; fail(failure: unknown, signal: AbortSignal): Promise<void> };
export type SemanticReplay = { load(idempotencyKey: string, executionId: string): Promise<unknown | undefined>; stage(idempotencyKey: string, executionId: string, envelope: unknown, lease: { readonly owner: string; readonly generation: number }): Promise<unknown>; acknowledge(idempotencyKey: string, executionId: string): Promise<void> };
const failureCode = (error: unknown) => error instanceof BridgeProviderError ? (error.code === "timeout" ? "provider_timeout" : error.code === "malformed_response" || error.code === "response_bound" ? "malformed_output" : "provider_unavailable") : "integrity_validation";
const isReplayLeaseLost = (error: unknown): error is SemanticReplayLeaseLostError => error instanceof SemanticReplayLeaseLostError || (error instanceof Error && error.name === "SemanticReplayLeaseLostError");

/** Test-selectable only: never supplied by worker-main's normal D1 callback. */
export type OfflineStepwiseSelection = Readonly<{ readonly context: OfflineStepwiseQualificationContext; readonly dependencies: Omit<OfflineStepwiseDependencies, "idempotencyKey" | "lease"> }>;

export async function runSemanticJob(jobValue: unknown, provider: StructuredReasoningProvider, client: SemanticClient, replay: SemanticReplay, idempotencyKey: string, signal: AbortSignal, lease = { owner: "unit-test", generation: 1 }, offlineStepwise?: OfflineStepwiseSelection): Promise<void> {
  const job = parseSemanticBackgroundJob(jobValue);
  const staged = await replay.load(idempotencyKey, job.executionId);
  if (staged) { await client.deliver(staged, signal); return; }
  let context: { readonly scope: Record<string, string> } | undefined;
  // A persisted envelope is the authoritative result for this execution.  A
  // delivery transport failure after this point must return to pg-boss for a
  // replay, rather than terminally failing the result that was just staged.
  let trustedStage = false;
  try {
    context = await client.context(job, signal) as { readonly scope: Record<string, string> };
    if (signal.aborted) throw new BridgeProviderError("cancelled", "Semantic execution was cancelled.");
    const extractionContext = job.skill.id === "atlas.semantic.extract" ? parseSemanticExtractionContext(context) : undefined;
    if (extractionContext && offlineStepwise) {
      const offlineScope = offlineStepwise.context.scope;
      const contextScope = extractionContext.scope;
      if (contextScope.projectId !== offlineScope.projectId || contextScope.workspaceId !== offlineScope.workspaceId || contextScope.bundleId !== offlineScope.bundleId || contextScope.documentId !== offlineScope.documentId || contextScope.executionId !== offlineScope.executionId || JSON.stringify(extractionContext.normalizedDocument) !== JSON.stringify(offlineStepwise.context.normalizedDocument)) {
        throw new Error("OFFLINE_CONTEXT_BLOCKED: the redeemed extraction context was substituted after offline qualification.");
      }
      await runOfflineStepwiseComposition(offlineStepwise.context, { ...offlineStepwise.dependencies, idempotencyKey, lease });
      return;
    }
    const skill = extractionContext ? undefined : getProductionSemanticSkill(job.skill.id, job.skill.version);
    const packet = extractionContext ? buildSemanticSourcePacket(extractionContext.normalizedDocument) : undefined;
    const response = await provider.structured(extractionContext
      ? { messages: [{ role: "system", content: packet!.systemPrompt }, { role: "user", content: packet!.userPrompt }], schema: packet!.providerProposalJsonSchema, signal }
      : { messages: [{ role: "system", content: skill!.promptTemplate }, { role: "user", content: JSON.stringify(context) }], schema: skill!.outputSchema, signal });
    const result = extractionContext ? finalizeExtractionProposal({ proposal: response.value, sourceSlots: packet!.sourceSlotMap }) : parseSemanticReconciliationResult(response.value);
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
