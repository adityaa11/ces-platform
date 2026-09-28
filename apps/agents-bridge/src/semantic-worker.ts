import { parseSemanticBackgroundJob, parseSemanticExtractionResult, parseSemanticReconciliationResult, semanticContractVersion, type SemanticBackgroundJob } from "@atlas/contracts";
import { getProductionSemanticSkill } from "@atlas/skills";
import { BridgeProviderError, type MistralProvider } from "./providers/mistral.js";

export type SemanticClient = { context(job: SemanticBackgroundJob, signal: AbortSignal): Promise<unknown>; deliver(envelope: unknown, signal: AbortSignal): Promise<void>; fail(failure: unknown, signal: AbortSignal): Promise<void> };
export type SemanticReplay = { load(idempotencyKey: string, executionId: string): Promise<unknown | undefined>; stage(idempotencyKey: string, executionId: string, envelope: unknown): Promise<void>; acknowledge(idempotencyKey: string, executionId: string): Promise<void> };
const failureCode = (error: unknown) => error instanceof BridgeProviderError ? (error.code === "timeout" ? "provider_timeout" : error.code === "malformed_response" || error.code === "response_bound" ? "malformed_output" : "provider_unavailable") : "integrity_validation";

export async function runSemanticJob(jobValue: unknown, provider: MistralProvider, client: SemanticClient, replay: SemanticReplay, idempotencyKey: string, signal: AbortSignal): Promise<void> {
  const job = parseSemanticBackgroundJob(jobValue);
  const staged = await replay.load(idempotencyKey, job.executionId);
  if (staged) { await client.deliver(staged, signal); return; }
  let context: { readonly scope: Record<string, string> } | undefined;
  try {
    context = await client.context(job, signal) as { readonly scope: Record<string, string> };
    if (signal.aborted) throw new BridgeProviderError("cancelled", "Semantic execution was cancelled.");
    const skill = getProductionSemanticSkill(job.skill.id, job.skill.version);
    const response = await provider.structured({ messages: [{ role: "system", content: skill.promptTemplate }, { role: "user", content: JSON.stringify(context) }], schema: skill.outputSchema, signal });
    const result = job.skill.id === "atlas.semantic.extract" ? parseSemanticExtractionResult(response.value) : parseSemanticReconciliationResult(response.value);
    const envelope = { version: semanticContractVersion, scope: context.scope, skill: job.skill, provider: response.provenance, result };
    await replay.stage(idempotencyKey, job.executionId, envelope);
    await client.deliver(envelope, signal);
  } catch (error) {
    if (context && !(error instanceof Error && error.message.includes("handoff was rejected"))) {
      const failure = { version: semanticContractVersion, scope: context.scope, code: failureCode(error), message: "Semantic execution failed before a trusted result was delivered." };
      await client.fail(failure, signal);
      return;
    }
    throw error;
  }
}
