/**
 * Bridge-owned provider capabilities. These contracts deliberately describe
 * only bounded inputs and normalized outputs; provider SDK and API shapes stay
 * inside concrete adapters.
 */
export type BridgeErrorCode = "authentication" | "invalid_request" | "unsupported_capability" | "rate_limited" | "timeout" | "provider_unavailable" | "malformed_response" | "response_bound" | "privacy_policy" | "cancelled";

export class BridgeProviderError extends Error {
  constructor(readonly code: BridgeErrorCode, message: string) { super(message); }
}

export type ProviderUsage = { readonly inputTokens?: number; readonly outputTokens?: number; readonly cachedTokens?: number; readonly processedPages?: number; readonly raw?: Readonly<Record<string, unknown>> };
export type ProviderProvenance = { readonly provider: string; readonly model: string; readonly endpoint: string; readonly latencyMilliseconds: number; readonly attempt: number; readonly usage?: ProviderUsage };
export type TransientDerivedVisual = { readonly sourceSha256: string; readonly profile: string; readonly pageNumber: number; readonly locatorId: string; readonly mediaType: "image/png"; readonly width: number; readonly height: number; readonly byteLength: number; readonly sha256: string; readonly bytes: Uint8Array };
export type ChatMessage = { readonly role: "system" | "user" | "assistant" | "tool"; readonly content: string };
export type ChatTool = { readonly name: string; readonly description?: string; readonly parameters: Readonly<Record<string, unknown>> };
export type ChatStreamEvent = { readonly type: "text"; readonly text: string } | { readonly type: "tool_call"; readonly id: string; readonly name: string; readonly arguments: string } | { readonly type: "complete"; readonly provenance: ProviderProvenance };

export type StructuredReasoningProvider = {
  structured(input: { readonly messages: readonly ChatMessage[]; readonly schema: Readonly<Record<string, unknown>>; readonly signal: AbortSignal; readonly requireZeroDataRetention?: boolean }): Promise<{ readonly value: unknown; readonly provenance: ProviderProvenance }>;
};

export type DocumentPerceptionProvider = {
  perceive(input: { readonly bytes: Uint8Array; readonly mimeType: string; readonly sourceSha256?: string; readonly options?: { readonly includeBlocks?: boolean; readonly includeImageBase64?: boolean; readonly tableFormat?: "markdown" | "html"; readonly confidenceScoresGranularity?: "page" | "block" | "word"; readonly requireZeroDataRetention?: boolean } }, signal: AbortSignal): Promise<{ readonly providerResult: Readonly<Record<string, unknown>>; readonly provenance: ProviderProvenance; readonly requiresAssetHandoff?: boolean; readonly transientVisualDescriptors?: readonly TransientDerivedVisual[] }>;
};

export type StreamingChatProvider = {
  streamChat(input: { readonly messages: readonly ChatMessage[]; readonly tools?: readonly ChatTool[]; readonly signal: AbortSignal; readonly requireZeroDataRetention?: boolean }): AsyncIterable<ChatStreamEvent>;
};

/** Reserved vocabulary for a later qualified embedding capability. */
export type EmbeddingProvider = {
  embed?(input: { readonly inputs: readonly string[]; readonly signal: AbortSignal }): Promise<{ readonly vectors: readonly (readonly number[])[]; readonly provenance: ProviderProvenance }>;
};
