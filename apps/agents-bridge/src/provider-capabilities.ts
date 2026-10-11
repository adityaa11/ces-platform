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
export type MultipartTextPart = { readonly type: "text"; readonly sourcePartId: string; readonly text: string };
export type MultipartImagePart = {
  readonly type: "image";
  readonly sourcePartId: string;
  readonly media: {
    readonly mimeType: "image/png";
    readonly sha256: string;
    readonly byteLength: number;
    readonly width: number;
    readonly height: number;
    readonly bytes: Uint8Array;
  };
};
export type MultipartMessagePart = MultipartTextPart | MultipartImagePart;
export type MultipartChatMessage = { readonly role: ChatMessage["role"]; readonly parts: readonly MultipartMessagePart[] };
export type MultipartImageCapability = {
  readonly version: "v1";
  readonly mediaTypes: readonly MultipartImagePart["media"]["mimeType"][];
  readonly maxImageCount: number;
  readonly maxImageBytes: number;
  readonly maxImageWidth: number;
  readonly maxImageHeight: number;
};
export type StructuredMessageCapabilities = { readonly image?: MultipartImageCapability };
export type MultipartStructuredRequest = {
  readonly messages: readonly MultipartChatMessage[];
  readonly signal: AbortSignal;
  readonly capabilities: StructuredMessageCapabilities;
};

type RedactedMultipartPart = { readonly type: MultipartMessagePart["type"]; readonly sourcePartId: string; readonly media?: Omit<MultipartImagePart["media"], "bytes"> };
export type RedactedMultipartRequest = { readonly messages: readonly { readonly role: MultipartChatMessage["role"]; readonly parts: readonly RedactedMultipartPart[] }[] };

/**
 * Deliberately preserves the established string-message contract. Multipart
 * callers use the separate, opt-in request below until a qualified adapter
 * owns their provider wire representation.
 */
export function redactMultipartRequest(request: Pick<MultipartStructuredRequest, "messages">): RedactedMultipartRequest {
  return {
    messages: request.messages.map((message) => ({
      role: message.role,
      parts: message.parts.map((part) => part.type === "text"
        ? { type: part.type, sourcePartId: part.sourcePartId }
        : { type: part.type, sourcePartId: part.sourcePartId, media: { mimeType: part.media.mimeType, sha256: part.media.sha256, byteLength: part.media.byteLength, width: part.media.width, height: part.media.height } }),
    })),
  };
}

/**
 * Negotiates the neutral multipart capability before a transport is allowed to
 * observe a request. It intentionally has no provider wire-format knowledge
 * and never converts an image part into text.
 */
export async function dispatchMultipartStructured<T>(request: MultipartStructuredRequest, dispatch: (messages: readonly MultipartChatMessage[]) => Promise<T>): Promise<T> {
  if (request.signal.aborted) throw new BridgeProviderError("cancelled", "The multipart request was cancelled before dispatch.");

  const images = request.messages.flatMap((message) => message.parts.filter((part): part is MultipartImagePart => part.type === "image"));
  if (images.length > 0) {
    const capability = request.capabilities.image;
    if (!capability || capability.version !== "v1") throw new BridgeProviderError("unsupported_capability", "The requested provider does not support image message parts.");
    const byteLength = images.reduce((total, image) => total + image.media.byteLength, 0);
    if (images.length > capability.maxImageCount || byteLength > capability.maxImageBytes || images.some((image) => image.media.byteLength !== image.media.bytes.byteLength || image.media.width > capability.maxImageWidth || image.media.height > capability.maxImageHeight || !capability.mediaTypes.includes(image.media.mimeType))) {
      throw new BridgeProviderError("invalid_request", "The multipart image parts exceed the negotiated capability bounds.");
    }
  }

  if (request.signal.aborted) throw new BridgeProviderError("cancelled", "The multipart request was cancelled before dispatch.");
  return dispatch(request.messages);
}
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
