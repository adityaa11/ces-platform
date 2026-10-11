import { createHash } from "node:crypto";

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
export type ProviderProvenance = { readonly provider: string; readonly model: string; readonly endpoint: string; readonly latencyMilliseconds: number; readonly attempt: number; readonly usage?: ProviderUsage; readonly metadata?: Readonly<Record<string, string | number | boolean>> };
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

/**
 * A replay-safe description of the request which can be handed to a future
 * admission planner.  It intentionally contains hashes and bounds, never
 * text, image bytes, base64, credentials, or a computed resource envelope.
 */
export type MultimodalRequestSpecPart = { readonly type: "text"; readonly sourcePartId: string; readonly textSha256: string; readonly byteLength: number } | { readonly type: "image"; readonly sourcePartId: string; readonly assetRef: string; readonly mimeType: "image/png"; readonly sha256: string; readonly byteLength: number; readonly width: number; readonly height: number };

export type MultimodalRequestSpec = {
  readonly version: "v1";
  readonly identity: string;
  readonly routeId: string;
  readonly profileId: string;
  readonly profileVersion: string;
  readonly schemaSha256: string;
  readonly deadlineEpochMilliseconds: number;
  readonly promptBytes: number;
  readonly parts: readonly MultimodalRequestSpecPart[];
};

export type ResourceEstimatorInput = {
  readonly version: "v1";
  readonly requestSpecIdentity: string;
  readonly routeId: string;
  readonly profileId: string;
  readonly promptBytes: number;
  readonly imageCount: number;
  readonly imageBytes: number;
  readonly imagePixels: number;
  readonly imageTpm: { readonly state: "qualified"; readonly tokensPerImage: number } | { readonly state: "not_applicable" };
};

export type ResourceEnvelopeBlocked = {
  readonly code: "RESOURCE_ENVELOPE_BLOCKED";
  readonly routeId: string;
  readonly profileId: string;
  readonly reason: "unknown_image_tpm";
};

export type MultimodalRequestProfile = {
  readonly version: "v1";
  readonly routeId: string;
  readonly profileId: string;
  readonly profileVersion: string;
  readonly image?: MultipartImageCapability;
  readonly maxPromptBytes: number;
  readonly maxDeadlineMilliseconds: number;
  readonly imageTpm: { readonly state: "qualified"; readonly tokensPerImage: number } | { readonly state: "unknown" };
};

export type MultimodalRequestPreflightInput = {
  readonly routes: readonly MultimodalRequestProfile[];
  readonly routeId: string;
  readonly profileId: string;
  readonly messages: readonly MultipartChatMessage[];
  readonly schema: Readonly<Record<string, unknown>>;
  readonly signal: AbortSignal;
  readonly deadlineEpochMilliseconds: number;
  readonly nowEpochMilliseconds?: number;
};

export type MultimodalRequestPreflight = {
  readonly requestSpec: MultimodalRequestSpec;
  readonly resourceEstimatorInput: ResourceEstimatorInput | ResourceEnvelopeBlocked;
};

type RedactedMultipartPart = { readonly type: MultipartMessagePart["type"]; readonly sourcePartId: string; readonly media?: Omit<MultipartImagePart["media"], "bytes"> };
export type RedactedMultipartRequest = { readonly messages: readonly { readonly role: MultipartChatMessage["role"]; readonly parts: readonly RedactedMultipartPart[] }[] };

const sha256 = (value: Uint8Array | string): string => createHash("sha256").update(value).digest("hex");

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  throw new BridgeProviderError("invalid_request", "The multipart schema must be JSON-serializable.");
}

function rejectPreflight(message: string): never {
  throw new BridgeProviderError("invalid_request", message);
}

/**
 * Performs the route/profile and structural checks before an authorization or
 * provider transport can observe the request.  This function is deliberately
 * provider-neutral and returns estimator inputs, not a RequestResourceEnvelope.
 */
export function preflightMultimodalRequest(input: MultimodalRequestPreflightInput): MultimodalRequestPreflight {
  if (input.signal.aborted) throw new BridgeProviderError("cancelled", "The multipart request was cancelled before preflight.");
  const profile = input.routes.find((candidate) => candidate.routeId === input.routeId && candidate.profileId === input.profileId);
  if (!profile) rejectPreflight("The requested route/profile is not recognized.");
  const now = input.nowEpochMilliseconds ?? Date.now();
  if (!Number.isSafeInteger(input.deadlineEpochMilliseconds) || input.deadlineEpochMilliseconds <= now) throw new BridgeProviderError("cancelled", "The multipart request deadline has elapsed before preflight.");
  if (input.deadlineEpochMilliseconds - now > profile.maxDeadlineMilliseconds) rejectPreflight("The multipart request deadline exceeds the effective profile bound.");

  const parts: MultimodalRequestSpecPart[] = [];
  let promptBytes = 0;
  let imageCount = 0;
  let imageBytes = 0;
  let imagePixels = 0;
  for (const message of input.messages) {
    for (const part of message.parts) {
      if (part.type === "text") {
        const byteLength = Buffer.byteLength(part.text, "utf8");
        promptBytes += byteLength;
        parts.push({ type: "text", sourcePartId: part.sourcePartId, textSha256: sha256(part.text), byteLength });
        continue;
      }
      const capability = profile.image;
      if (!capability || capability.version !== "v1" || !capability.mediaTypes.includes(part.media.mimeType)) throw new BridgeProviderError("unsupported_capability", "The effective route/profile does not support this image media.");
      if (!Number.isSafeInteger(part.media.byteLength) || part.media.byteLength <= 0 || part.media.byteLength !== part.media.bytes.byteLength || !Number.isSafeInteger(part.media.width) || part.media.width < 1 || !Number.isSafeInteger(part.media.height) || part.media.height < 1) rejectPreflight("The multipart image metadata is invalid.");
      imageCount += 1;
      imageBytes += part.media.byteLength;
      imagePixels += part.media.width * part.media.height;
      if (!Number.isSafeInteger(imagePixels) || imageCount > capability.maxImageCount || imageBytes > capability.maxImageBytes || part.media.width > capability.maxImageWidth || part.media.height > capability.maxImageHeight) rejectPreflight("The multipart image parts exceed the effective profile bounds.");
      parts.push({ type: "image", sourcePartId: part.sourcePartId, assetRef: part.sourcePartId, mimeType: part.media.mimeType, sha256: part.media.sha256, byteLength: part.media.byteLength, width: part.media.width, height: part.media.height });
    }
  }
  if (promptBytes > profile.maxPromptBytes) rejectPreflight("The multipart prompt exceeds the effective profile bound.");
  if (input.signal.aborted) throw new BridgeProviderError("cancelled", "The multipart request was cancelled during preflight.");

  const requestSpecWithoutIdentity = { version: "v1" as const, routeId: profile.routeId, profileId: profile.profileId, profileVersion: profile.profileVersion, schemaSha256: sha256(canonicalJson(input.schema)), deadlineEpochMilliseconds: input.deadlineEpochMilliseconds, promptBytes, parts };
  const requestSpec: MultimodalRequestSpec = { ...requestSpecWithoutIdentity, identity: sha256(canonicalJson(requestSpecWithoutIdentity)) };
  if (profile.imageTpm.state === "unknown" && imageCount > 0) return { requestSpec, resourceEstimatorInput: { code: "RESOURCE_ENVELOPE_BLOCKED", routeId: profile.routeId, profileId: profile.profileId, reason: "unknown_image_tpm" } };
  const imageTpm = profile.imageTpm.state === "qualified" ? profile.imageTpm : { state: "not_applicable" as const };
  return { requestSpec, resourceEstimatorInput: { version: "v1", requestSpecIdentity: requestSpec.identity, routeId: profile.routeId, profileId: profile.profileId, promptBytes, imageCount, imageBytes, imagePixels, imageTpm } };
}

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
