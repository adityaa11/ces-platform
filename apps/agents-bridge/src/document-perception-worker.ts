import { normalizePerceptionResult } from "@atlas/core";
import type { DocumentPerceptionRequest, NormalizedDocument } from "@atlas/contracts";
import type { MistralProvider } from "./providers/mistral.js";

export type SourceGrantClient = { redeem(request: DocumentPerceptionRequest, signal: AbortSignal): Promise<{ readonly bytes: Uint8Array; readonly mimeType: "application/pdf" }> };
export type PerceptionResultClient = { deliver(request: DocumentPerceptionRequest, result: NormalizedDocument, signal: AbortSignal): Promise<void> };
export type PerceptionResultReplay = { load(idempotencyKey: string, executionId: string): Promise<NormalizedDocument | undefined>; stage(idempotencyKey: string, executionId: string, result: NormalizedDocument): Promise<void>; acknowledge(idempotencyKey: string, executionId: string): Promise<void> };

async function deliverStaged(request: DocumentPerceptionRequest, result: NormalizedDocument, results: PerceptionResultClient, signal: AbortSignal, replay?: { readonly idempotencyKey: string; readonly store: PerceptionResultReplay }): Promise<void> {
  try {
    await results.deliver(request, result, signal);
  } catch (firstError) {
    // Result delivery is idempotent at Atlas. One immediate replay closes the
    // acknowledgement-loss window without re-redeeming or re-perceiving.
    if (!replay || signal.aborted) throw firstError;
    await results.deliver(request, result, signal);
  }
  if (replay) await replay.store.acknowledge(replay.idempotencyKey, request.executionId);
}

/** Bridge orchestration has no storage/database authority; Atlas owns both handoff endpoints. */
export async function runDocumentPerception(request: DocumentPerceptionRequest, provider: MistralProvider, source: SourceGrantClient, results: PerceptionResultClient, signal: AbortSignal, replay?: { readonly idempotencyKey: string; readonly store: PerceptionResultReplay }): Promise<void> {
  const staged = replay && await replay.store.load(replay.idempotencyKey, request.executionId);
  if (staged) {
    await deliverStaged(request, staged, results, signal, replay);
    return;
  }
  const input = await source.redeem(request, signal);
  if (signal.aborted) throw new Error("Document perception was cancelled.");
  const perceived = await provider.perceive({ bytes: input.bytes, mimeType: input.mimeType }, signal);
  if (signal.aborted) throw new Error("Document perception was cancelled.");
  const normalized = normalizePerceptionResult({ executionId: request.executionId, artifactId: request.artifact.id, sourceSha256: request.artifact.sourceSha256, provider: { provider: perceived.provenance.provider, processor: perceived.provenance.model, executionId: request.executionId, processedAt: new Date().toISOString() }, result: perceived.providerResult as { pages: readonly unknown[] } });
  if (signal.aborted) throw new Error("Document perception was cancelled.");
  if (replay) await replay.store.stage(replay.idempotencyKey, request.executionId, normalized);
  await deliverStaged(request, normalized, results, signal, replay);
}
