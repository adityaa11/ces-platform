import { normalizePerceptionResult } from "@atlas/core";
import type { DocumentPerceptionRequest, DocumentPerceptionTechnicalFailure, NormalizedDocument } from "@atlas/contracts";
import { AtlasPerceptionClientError } from "./atlas-perception-client.js";
import { BridgeProviderError, type MistralProvider } from "./providers/mistral.js";

export type SourceGrantClient = { redeem(request: DocumentPerceptionRequest, signal: AbortSignal): Promise<{ readonly bytes: Uint8Array; readonly mimeType: "application/pdf" }> };
export type PerceptionResultClient = { deliver(request: DocumentPerceptionRequest, result: NormalizedDocument, signal: AbortSignal): Promise<void>; fail?(failure: DocumentPerceptionTechnicalFailure, signal: AbortSignal): Promise<void> };
export type PerceptionResultReplay = { load(idempotencyKey: string, executionId: string): Promise<NormalizedDocument | undefined>; stage(idempotencyKey: string, executionId: string, result: NormalizedDocument): Promise<void>; acknowledge(idempotencyKey: string, executionId: string): Promise<void> };

class RetryableReplayError extends Error {
  constructor(operation: "load" | "stage", cause: unknown) {
    super(`Perception replay ${operation} is temporarily unavailable.`, { cause });
    this.name = "RetryableReplayError";
  }
}

function terminalFailure(error: unknown, finalAttempt: boolean): DocumentPerceptionTechnicalFailure["code"] | undefined {
  if (error instanceof RetryableReplayError) return undefined;
  if (error instanceof AtlasPerceptionClientError) {
    if (error.operation === "source") return /unavailable|cancelled/u.test(error.message) ? undefined : "source_grant_expired";
    // A result may already be committed when its acknowledgement is lost, so
    // the existing replay/queue path must retain ownership of that retry.
    return undefined;
  }
  if (error instanceof BridgeProviderError) {
    if (error.code === "timeout") return finalAttempt ? "provider_timeout" : undefined;
    if (error.code === "provider_unavailable" || error.code === "rate_limited") return finalAttempt ? "provider_unavailable" : undefined;
    if (error.code === "malformed_response" || error.code === "response_bound") return "malformed_output";
    return "integrity_validation";
  }
  return "integrity_validation";
}

async function deliverStaged(request: DocumentPerceptionRequest, result: NormalizedDocument, results: PerceptionResultClient, signal: AbortSignal, replay?: { readonly idempotencyKey: string; readonly store: PerceptionResultReplay }): Promise<void> {
  try {
    await results.deliver(request, result, signal);
  } catch (firstError) {
    // Result delivery is idempotent at Atlas. One immediate replay closes the
    // acknowledgement-loss window without re-redeeming or re-perceiving.
    if (!replay || signal.aborted) throw firstError;
    await results.deliver(request, result, signal);
  }
}

/** Bridge orchestration has no storage/database authority; Atlas owns both handoff endpoints. */
export async function runDocumentPerception(request: DocumentPerceptionRequest, provider: MistralProvider, source: SourceGrantClient, results: PerceptionResultClient, signal: AbortSignal, replay?: { readonly idempotencyKey: string; readonly store: PerceptionResultReplay; readonly finalAttempt?: boolean }): Promise<void> {
  let trustedResult = false;
  try {
    let staged: NormalizedDocument | undefined;
    if (replay) {
      try { staged = await replay.store.load(replay.idempotencyKey, request.executionId); }
      catch (error) { throw new RetryableReplayError("load", error); }
    }
    if (staged) { trustedResult = true; await deliverStaged(request, staged, results, signal, replay); return; }
    const input = await source.redeem(request, signal);
    if (signal.aborted) throw new Error("Document perception was cancelled.");
    const perceived = await provider.perceive({ bytes: input.bytes, mimeType: input.mimeType }, signal);
    if (signal.aborted) throw new Error("Document perception was cancelled.");
    const normalized = normalizePerceptionResult({ executionId: request.executionId, artifactId: request.artifact.id, sourceSha256: request.artifact.sourceSha256, provider: { provider: perceived.provenance.provider, processor: perceived.provenance.model, executionId: request.executionId, processedAt: new Date().toISOString() }, result: perceived.providerResult as { pages: readonly unknown[] } });
    if (signal.aborted) throw new Error("Document perception was cancelled.");
    if (replay) {
      try { await replay.store.stage(replay.idempotencyKey, request.executionId, normalized); }
      catch (error) { throw new RetryableReplayError("stage", error); }
    }
    trustedResult = true;
    await deliverStaged(request, normalized, results, signal, replay);
  } catch (error) {
    if (trustedResult || signal.aborted || !results.fail) throw error;
    const code = terminalFailure(error, replay?.finalAttempt === true);
    if (!code) throw error;
    await results.fail({ request, code }, signal);
  }
}
