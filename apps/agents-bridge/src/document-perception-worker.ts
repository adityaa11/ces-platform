import { normalizePerceptionResult } from "@atlas/core";
import type { DocumentPerceptionRequest, NormalizedDocument } from "@atlas/contracts";
import type { MistralProvider } from "./providers/mistral.js";

export type SourceGrantClient = { redeem(request: DocumentPerceptionRequest, signal: AbortSignal): Promise<{ readonly bytes: Uint8Array; readonly mimeType: "application/pdf" }> };
export type PerceptionResultClient = { deliver(request: DocumentPerceptionRequest, result: NormalizedDocument, signal: AbortSignal): Promise<void> };

/** Bridge orchestration has no storage/database authority; Atlas owns both handoff endpoints. */
export async function runDocumentPerception(request: DocumentPerceptionRequest, provider: MistralProvider, source: SourceGrantClient, results: PerceptionResultClient, signal: AbortSignal): Promise<void> {
  const input = await source.redeem(request, signal);
  if (signal.aborted) throw new Error("Document perception was cancelled.");
  const perceived = await provider.perceive({ bytes: input.bytes, mimeType: input.mimeType }, signal);
  if (signal.aborted) throw new Error("Document perception was cancelled.");
  const normalized = normalizePerceptionResult({ executionId: request.executionId, artifactId: request.artifact.id, sourceSha256: request.artifact.sourceSha256, provider: { provider: perceived.provenance.provider, processor: perceived.provenance.model, executionId: request.executionId, processedAt: new Date().toISOString() }, result: perceived.providerResult as { pages: readonly unknown[] } });
  if (signal.aborted) throw new Error("Document perception was cancelled.");
  await results.deliver(request, normalized, signal);
}
