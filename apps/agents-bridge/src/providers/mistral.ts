import { validateJsonSchema } from "@atlas/contracts";

export type MistralCapability = "atlas.reasoning.structured" | "atlas.chat.default" | "atlas.document.perceive";
export type BridgeErrorCode = "authentication" | "invalid_request" | "unsupported_capability" | "rate_limited" | "timeout" | "provider_unavailable" | "malformed_response" | "response_bound" | "privacy_policy" | "cancelled";

export class BridgeProviderError extends Error {
  constructor(readonly code: BridgeErrorCode, message: string) { super(message); }
}

export type ProviderUsage = { readonly inputTokens?: number; readonly outputTokens?: number; readonly cachedTokens?: number; readonly processedPages?: number; readonly raw?: Readonly<Record<string, unknown>> };
export type ProviderProvenance = { readonly provider: "mistral"; readonly model: string; readonly endpoint: "/v1/chat/completions" | "/v1/ocr"; readonly latencyMilliseconds: number; readonly attempt: number; readonly usage?: ProviderUsage };
export type ChatMessage = { readonly role: "system" | "user" | "assistant" | "tool"; readonly content: string };
export type ChatTool = { readonly name: string; readonly description?: string; readonly parameters: Readonly<Record<string, unknown>> };
export type ChatStreamEvent = { readonly type: "text"; readonly text: string } | { readonly type: "tool_call"; readonly id: string; readonly name: string; readonly arguments: string } | { readonly type: "complete"; readonly provenance: ProviderProvenance };
export type PerceptionOptions = { readonly includeBlocks?: boolean; readonly includeImageBase64?: boolean; readonly tableFormat?: "markdown" | "html"; readonly confidenceScoresGranularity?: "page" | "block" | "word"; readonly requireZeroDataRetention?: boolean };
export type PerceptionRequest = { readonly bytes: Uint8Array; readonly mimeType: string; readonly options?: PerceptionOptions };
export type PerceptionResult = { readonly providerResult: Readonly<Record<string, unknown>>; readonly provenance: ProviderProvenance };

export type MistralProviderConfig = {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly structuredModel: string;
  readonly chatModel: string;
  readonly ocrModel: string;
  readonly maxDocumentBytes: number;
  readonly zeroDataRetentionApproved: boolean;
  readonly maxResponseBytes?: number;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function modelFor(config: MistralProviderConfig, capability: MistralCapability): string {
  if (capability === "atlas.reasoning.structured") return config.structuredModel;
  if (capability === "atlas.chat.default") return config.chatModel;
  if (capability === "atlas.document.perceive") return config.ocrModel;
  throw new BridgeProviderError("unsupported_capability", "The requested provider capability is not configured.");
}

function usageOf(value: unknown): ProviderUsage | undefined {
  if (!isRecord(value)) return undefined;
  const number = (key: string) => typeof value[key] === "number" ? value[key] : undefined;
  return { inputTokens: number("prompt_tokens") ?? number("input_tokens"), outputTokens: number("completion_tokens") ?? number("output_tokens"), cachedTokens: number("cached_tokens"), processedPages: number("pages_processed") ?? number("processed_pages"), raw: value };
}

function providerError(status: number): BridgeProviderError {
  if (status === 401 || status === 403) return new BridgeProviderError("authentication", "Mistral authentication was rejected.");
  if (status === 400 || status === 404 || status === 422) return new BridgeProviderError("invalid_request", "Mistral rejected the provider request.");
  if (status === 429) return new BridgeProviderError("rate_limited", "Mistral rate limit reached.");
  if (status >= 500) return new BridgeProviderError("provider_unavailable", "Mistral is temporarily unavailable.");
  return new BridgeProviderError("provider_unavailable", "Mistral request failed.");
}

/** Stateless Mistral transport. It receives explicit content only; it never opens Atlas storage or databases. */
export class MistralProvider {
  constructor(private readonly config: MistralProviderConfig, private readonly fetcher: FetchLike = fetch) {}

  capabilityModel(capability: MistralCapability): string { return modelFor(this.config, capability); }

  private preflight(capability: MistralCapability, requireZeroDataRetention = false): string {
    const model = modelFor(this.config, capability);
    if (!model) throw new BridgeProviderError("unsupported_capability", "The requested provider capability has no qualified model.");
    if (requireZeroDataRetention && !this.config.zeroDataRetentionApproved) throw new BridgeProviderError("privacy_policy", "Zero-retention execution is not approved for this deployment.");
    if (!this.config.apiKey) throw new BridgeProviderError("authentication", "Mistral credentials are not configured.");
    return model;
  }

  private async request(endpoint: "/v1/chat/completions" | "/v1/ocr", body: Record<string, unknown>, signal: AbortSignal): Promise<{ readonly response: Response; readonly attempt: number; readonly started: number }> {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const started = Date.now();
      let response: Response;
      try {
        response = await this.fetcher(`${this.config.baseUrl}${endpoint}`, { method: "POST", headers: { authorization: `Bearer ${this.config.apiKey}`, "content-type": "application/json" }, body: JSON.stringify(body), signal });
      } catch (error) {
        if (signal.aborted) throw new BridgeProviderError("cancelled", "Provider request was cancelled.");
        if (attempt === 2) throw new BridgeProviderError("provider_unavailable", "Mistral could not be reached.");
        continue;
      }
      if (response.ok) return { response, attempt, started };
      const mapped = providerError(response.status);
      if ((mapped.code === "rate_limited" || mapped.code === "provider_unavailable") && attempt < 2) continue;
      throw mapped;
    }
    throw new BridgeProviderError("provider_unavailable", "Mistral could not be reached.");
  }

  private async json(response: Response): Promise<Record<string, unknown>> {
    const text = await response.text();
    if (text.length > (this.config.maxResponseBytes ?? 10 * 1024 * 1024)) throw new BridgeProviderError("response_bound", "Provider response exceeded the configured bound.");
    try { const parsed: unknown = JSON.parse(text); if (isRecord(parsed)) return parsed; } catch { /* mapped below */ }
    throw new BridgeProviderError("malformed_response", "Mistral returned an invalid response.");
  }

  async structured(input: { readonly messages: readonly ChatMessage[]; readonly schema: Readonly<Record<string, unknown>>; readonly signal: AbortSignal; readonly requireZeroDataRetention?: boolean }): Promise<{ readonly value: unknown; readonly provenance: ProviderProvenance }> {
    const model = this.preflight("atlas.reasoning.structured", input.requireZeroDataRetention);
    const { response, attempt, started } = await this.request("/v1/chat/completions", { model, stream: false, messages: input.messages, response_format: { type: "json_schema", json_schema: { name: "atlas_output", strict: true, schema: input.schema } } }, input.signal);
    const payload = await this.json(response);
    const choices = payload.choices;
    const first = Array.isArray(choices) && isRecord(choices[0]) ? choices[0] : undefined;
    const message = first && isRecord(first.message) ? first.message : undefined;
    const content = message?.content;
    if (typeof content !== "string") throw new BridgeProviderError("malformed_response", "Mistral returned no structured content.");
    let value: unknown;
    try { value = JSON.parse(content); } catch { throw new BridgeProviderError("malformed_response", "Mistral structured content was not JSON."); }
    try { validateJsonSchema(input.schema, value); } catch { throw new BridgeProviderError("malformed_response", "Mistral structured content did not satisfy the required schema."); }
    return { value, provenance: { provider: "mistral", model: typeof payload.model === "string" ? payload.model : model, endpoint: "/v1/chat/completions", latencyMilliseconds: Date.now() - started, attempt, usage: usageOf(payload.usage) } };
  }

  async *streamChat(input: { readonly messages: readonly ChatMessage[]; readonly tools?: readonly ChatTool[]; readonly signal: AbortSignal; readonly requireZeroDataRetention?: boolean }): AsyncIterable<ChatStreamEvent> {
    const model = this.preflight("atlas.chat.default", input.requireZeroDataRetention);
    const tools = input.tools?.map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.parameters } }));
    const { response, attempt, started } = await this.request("/v1/chat/completions", { model, stream: true, messages: input.messages, ...(tools?.length ? { tools } : {}) }, input.signal);
    if (!response.body) throw new BridgeProviderError("malformed_response", "Mistral returned no stream body.");
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffered = ""; let usage: ProviderUsage | undefined;
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        buffered += decoder.decode(chunk.value, { stream: true });
        const lines = buffered.split(/\r?\n/u); buffered = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim(); if (data === "[DONE]") continue;
          let payload: unknown; try { payload = JSON.parse(data); } catch { throw new BridgeProviderError("malformed_response", "Mistral sent malformed stream data."); }
          if (!isRecord(payload)) continue; usage = usageOf(payload.usage) ?? usage;
          const choice = Array.isArray(payload.choices) && isRecord(payload.choices[0]) ? payload.choices[0] : undefined;
          const delta = choice && isRecord(choice.delta) ? choice.delta : undefined;
          if (typeof delta?.content === "string" && delta.content) yield { type: "text", text: delta.content };
          if (Array.isArray(delta?.tool_calls)) for (const call of delta.tool_calls) if (isRecord(call) && isRecord(call.function) && typeof call.function.name === "string") yield { type: "tool_call", id: typeof call.id === "string" ? call.id : "", name: call.function.name, arguments: typeof call.function.arguments === "string" ? call.function.arguments : "" };
        }
      }
    } finally { reader.releaseLock(); }
    yield { type: "complete", provenance: { provider: "mistral", model, endpoint: "/v1/chat/completions", latencyMilliseconds: Date.now() - started, attempt, usage } };
  }

  async perceive(input: PerceptionRequest, signal: AbortSignal): Promise<PerceptionResult> {
    const model = this.preflight("atlas.document.perceive", input.options?.requireZeroDataRetention);
    if (input.mimeType !== "application/pdf") throw new BridgeProviderError("invalid_request", "Only explicit PDF input is supported by this capability.");
    if (input.bytes.byteLength > this.config.maxDocumentBytes) throw new BridgeProviderError("invalid_request", "Document exceeds the configured provider byte limit.");
    const documentUrl = `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`;
    const { response, attempt, started } = await this.request("/v1/ocr", { model, document: { type: "document_url", document_url: documentUrl }, include_blocks: input.options?.includeBlocks ?? true, include_image_base64: input.options?.includeImageBase64 ?? false, table_format: input.options?.tableFormat ?? "markdown", confidence_scores_granularity: input.options?.confidenceScoresGranularity ?? "block" }, signal);
    const payload = await this.json(response);
    if (!Array.isArray(payload.pages)) throw new BridgeProviderError("malformed_response", "Mistral OCR response did not contain pages.");
    return { providerResult: payload, provenance: { provider: "mistral", model: typeof payload.model === "string" ? payload.model : model, endpoint: "/v1/ocr", latencyMilliseconds: Date.now() - started, attempt, usage: usageOf(payload.usage_info) } };
  }
}
