import { BridgeProviderError, dispatchMultipartStructured, type ChatMessage, type MultipartChatMessage, type MultipartImageCapability, type ProviderProvenance, type ProviderUsage, type StructuredReasoningProvider } from "../provider-capabilities.js";

export type AnomanProviderConfig = {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly structuredModel: "gemini-2.5-flash";
  readonly maxRequestBytes: number;
  readonly maxResponseBytes: number;
  readonly timeoutMilliseconds: number;
  readonly zeroDataRetentionApproved: boolean;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;
type JsonRecord = Readonly<Record<string, unknown>>;

/**
 * The only vendor capability introduced by this adapter.  These are transport
 * limits, not semantic/image-understanding claims, and are negotiated before
 * the fake or real transport can observe image bytes.
 */
export const anomanMultipartImageCapability: MultipartImageCapability = {
  version: "v1",
  mediaTypes: ["image/png"],
  maxImageCount: 4,
  maxImageBytes: 512_000,
  maxImageWidth: 4_096,
  maxImageHeight: 4_096,
};

export type AnomanMultipartStructuredInput = {
  readonly messages: readonly MultipartChatMessage[];
  readonly schema: Readonly<Record<string, unknown>>;
  readonly signal: AbortSignal;
  readonly requireZeroDataRetention?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const boundedString = (value: unknown, maximum = 120): string | undefined => typeof value === "string" && value.length > 0 && value.length <= maximum ? value : undefined;

function providerError(status: number): BridgeProviderError {
  if (status === 408 || status === 504) return new BridgeProviderError("timeout", "Anoman request timed out.");
  if (status === 401 || status === 403) return new BridgeProviderError("authentication", "Anoman authentication was rejected.");
  if (status === 400 || status === 404 || status === 422) return new BridgeProviderError("invalid_request", "Anoman rejected the provider request.");
  if (status === 429) return new BridgeProviderError("rate_limited", "Anoman rate limit reached.");
  if (status >= 500) return new BridgeProviderError("provider_unavailable", "Anoman is temporarily unavailable.");
  return new BridgeProviderError("provider_unavailable", "Anoman request failed.");
}

function usageOf(value: unknown): ProviderUsage | undefined {
  if (!isRecord(value)) return undefined;
  const number = (key: string) => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0 ? value[key] : undefined;
  const inputTokens = number("prompt_tokens") ?? number("input_tokens");
  const outputTokens = number("completion_tokens") ?? number("output_tokens");
  const cachedTokens = number("cached_tokens") ?? number("cache_read_input_tokens");
  return inputTokens === undefined && outputTokens === undefined && cachedTokens === undefined
    ? undefined
    : { inputTokens, outputTokens, cachedTokens };
}

function metadataOf(payload: JsonRecord, requestedModel: string): Readonly<Record<string, string | number | boolean>> {
  const metadata: Record<string, string | number | boolean> = { requestedModel };
  for (const key of ["model", "system_fingerprint", "service_tier", "route", "cache_status"] as const) {
    const value = boundedString(payload[key]);
    if (value) metadata[key === "model" ? "servedModel" : key] = value;
  }
  const usage = isRecord(payload.usage) ? payload.usage : undefined;
  const cachedTokens = usage && typeof usage.cached_tokens === "number" && Number.isFinite(usage.cached_tokens) && usage.cached_tokens >= 0 ? usage.cached_tokens : undefined;
  if (cachedTokens !== undefined) metadata.cachedTokens = cachedTokens;
  return metadata;
}

function multipartMessages(messages: readonly MultipartChatMessage[]): readonly { readonly role: MultipartChatMessage["role"]; readonly content: readonly ({ readonly type: "text"; readonly text: string } | { readonly type: "image_url"; readonly image_url: { readonly url: string } })[] }[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.parts.map((part) => part.type === "text"
      ? { type: "text" as const, text: part.text }
      : { type: "image_url" as const, image_url: { url: `data:${part.media.mimeType};base64,${Buffer.from(part.media.bytes).toString("base64")}` } }),
  }));
}

/**
 * Concrete Anoman transport for already-prepared neutral reasoning messages.
 * It deliberately treats the supplied schema as an Atlas-local hint: object
 * mode bounds the wire response while validation remains above this adapter.
 */
export class AnomanProvider implements StructuredReasoningProvider {
  constructor(private readonly config: AnomanProviderConfig, private readonly fetcher: FetchLike = fetch) {}

  private preflight(requireZeroDataRetention = false): string {
    if (requireZeroDataRetention && !this.config.zeroDataRetentionApproved) throw new BridgeProviderError("privacy_policy", "Zero-retention execution is not approved for this deployment.");
    if (!this.config.apiKey) throw new BridgeProviderError("authentication", "Anoman credentials are not configured.");
    return this.config.structuredModel;
  }

  private async read(response: Response, caller: AbortSignal, deadline: AbortSignal): Promise<JsonRecord> {
    if (!response.body) throw new BridgeProviderError("malformed_response", "Anoman returned no response body.");
    const reader = response.body.getReader();
    const combined = AbortSignal.any([caller, deadline]);
    const cancel = () => { void reader.cancel(); };
    const chunks: Uint8Array[] = [];
    let size = 0;
    combined.addEventListener("abort", cancel, { once: true });
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > this.config.maxResponseBytes) throw new BridgeProviderError("response_bound", "Anoman response exceeded the configured byte limit.");
        chunks.push(next.value);
      }
    } catch (error) {
      if (error instanceof BridgeProviderError) throw error;
      if (caller.aborted || deadline.aborted) throw new BridgeProviderError(caller.aborted ? "cancelled" : "timeout", caller.aborted ? "Anoman request was cancelled." : "Anoman request exceeded the configured timeout.");
      throw new BridgeProviderError("provider_unavailable", "Anoman response could not be read.");
    } finally {
      combined.removeEventListener("abort", cancel);
      reader.releaseLock();
    }
    try {
      const payload: unknown = JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8"));
      if (isRecord(payload)) return payload;
    } catch { /* mapped below */ }
    throw new BridgeProviderError("malformed_response", "Anoman returned invalid JSON.");
  }

  private async execute(input: { readonly messages: unknown; readonly signal: AbortSignal; readonly requireZeroDataRetention?: boolean }): Promise<{ readonly value: unknown; readonly provenance: ProviderProvenance }> {
    const model = this.preflight(input.requireZeroDataRetention);
    const body = { model, messages: input.messages, temperature: 0, stream: false, response_format: { type: "json_object" } };
    const serialized = JSON.stringify(body);
    if (Buffer.byteLength(serialized) > this.config.maxRequestBytes) throw new BridgeProviderError("invalid_request", "Anoman request exceeded the configured byte limit.");
    const deadline = AbortSignal.timeout(this.config.timeoutMilliseconds);
    const signal = AbortSignal.any([input.signal, deadline]);
    const started = Date.now();
    let response: Response;
    try {
      response = await this.fetcher(`${this.config.baseUrl}/v1/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${this.config.apiKey}`, "content-type": "application/json" }, body: serialized, signal });
    } catch {
      if (signal.aborted) throw new BridgeProviderError(input.signal.aborted ? "cancelled" : "timeout", input.signal.aborted ? "Anoman request was cancelled." : "Anoman request exceeded the configured timeout.");
      throw new BridgeProviderError("provider_unavailable", "Anoman could not be reached.");
    }
    if (!response.ok) throw providerError(response.status);
    const payload = await this.read(response, input.signal, deadline);
    const first = Array.isArray(payload.choices) && isRecord(payload.choices[0]) ? payload.choices[0] : undefined;
    const message = first && isRecord(first.message) ? first.message : undefined;
    if (typeof message?.content !== "string" || message.content.length === 0) throw new BridgeProviderError("malformed_response", "Anoman returned no structured content.");
    let value: unknown;
    try { value = JSON.parse(message.content); } catch { throw new BridgeProviderError("malformed_response", "Anoman structured content was not JSON."); }
    const servedModel = boundedString(payload.model) ?? model;
    return { value, provenance: { provider: "anoman", model: servedModel, endpoint: "/v1/chat/completions", latencyMilliseconds: Date.now() - started, attempt: 1, usage: usageOf(payload.usage), metadata: metadataOf(payload, model) } };
  }

  async structured(input: { readonly messages: readonly ChatMessage[]; readonly schema: Readonly<Record<string, unknown>>; readonly signal: AbortSignal; readonly requireZeroDataRetention?: boolean }): Promise<{ readonly value: unknown; readonly provenance: ProviderProvenance }> {
    return this.execute(input);
  }

  /**
   * Adapter-owned serialization for already-authorized neutral parts.  It is
   * intentionally an opt-in seam: existing string-message callers continue
   * through `structured`, and no worker/provider activation is added here.
   */
  async structuredMultipart(input: AnomanMultipartStructuredInput): Promise<{ readonly value: unknown; readonly provenance: ProviderProvenance }> {
    return dispatchMultipartStructured({
      messages: input.messages,
      signal: input.signal,
      capabilities: { image: anomanMultipartImageCapability },
    }, async (messages) => this.execute({
      messages: multipartMessages(messages),
      signal: input.signal,
      requireZeroDataRetention: input.requireZeroDataRetention,
    }));
  }
}

/** The composition root receives only the neutral capability. */
export function createAnomanCapabilities(config: AnomanProviderConfig): { readonly structured: StructuredReasoningProvider } {
  return { structured: new AnomanProvider(config) };
}
