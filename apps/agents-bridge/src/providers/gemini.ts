import { validateJsonSchema } from "@atlas/contracts";
import { BridgeProviderError, type ChatMessage, type ChatStreamEvent, type ChatTool, type DocumentPerceptionProvider, type ProviderProvenance, type ProviderUsage, type StreamingChatProvider, type StructuredReasoningProvider } from "../provider-capabilities.js";

export type GeminiProviderConfig = {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly structuredModel: string;
  readonly chatModel: string;
  readonly perceptionModel: string;
  readonly maxDocumentBytes: number;
  readonly maxRequestBytes: number;
  readonly maxResponseBytes: number;
  readonly maxStreamBytes: number;
  readonly timeoutMilliseconds: number;
  readonly zeroDataRetentionApproved: boolean;
};
type FetchLike = (input: string, init: RequestInit) => Promise<Response>;
type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string }; functionCall?: { id?: string; name: string; args?: unknown } };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const partsOf = (payload: unknown): readonly GeminiPart[] => {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) return [];
  const candidate = payload.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) return [];
  return candidate.content.parts.filter(isRecord) as GeminiPart[];
};
function usageOf(value: unknown): ProviderUsage | undefined {
  if (!isRecord(value)) return undefined;
  const count = (key: string) => typeof value[key] === "number" ? value[key] as number : undefined;
  const inputTokens = count("promptTokenCount"); const outputTokens = count("candidatesTokenCount"); const cachedTokens = count("cachedContentTokenCount");
  return inputTokens === undefined && outputTokens === undefined && cachedTokens === undefined ? undefined : { inputTokens, outputTokens, cachedTokens, raw: { inputTokens, outputTokens, cachedTokens } };
}
function providerError(status: number): BridgeProviderError {
  if (status === 408 || status === 504) return new BridgeProviderError("timeout", "Gemini request timed out.");
  if (status === 401 || status === 403) return new BridgeProviderError("authentication", "Gemini authentication was rejected.");
  if (status === 400 || status === 404 || status === 422) return new BridgeProviderError("invalid_request", "Gemini rejected the provider request.");
  if (status === 429) return new BridgeProviderError("rate_limited", "Gemini rate limit reached.");
  if (status >= 500) return new BridgeProviderError("provider_unavailable", "Gemini is temporarily unavailable.");
  return new BridgeProviderError("provider_unavailable", "Gemini request failed.");
}
const role = (value: ChatMessage["role"]) => value === "assistant" ? "model" : value === "tool" ? "user" : value;
function contents(messages: readonly ChatMessage[]) {
  const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
  const turns = messages.filter((message) => message.role !== "system").map((message) => ({ role: role(message.role), parts: [{ text: message.content }] }));
  return { contents: turns, ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}) };
}

/** Bridge-internal Gemini REST adapter. It sends only explicit bounded input and never uses provider file storage. */
export class GeminiProvider implements StructuredReasoningProvider, DocumentPerceptionProvider, StreamingChatProvider {
  constructor(private readonly config: GeminiProviderConfig, private readonly fetcher: FetchLike = fetch) {}
  private model(capability: "structured" | "chat" | "perception", requireZeroDataRetention = false): string {
    if (requireZeroDataRetention && !this.config.zeroDataRetentionApproved) throw new BridgeProviderError("privacy_policy", "Zero-retention execution is not approved for this deployment.");
    if (!this.config.apiKey) throw new BridgeProviderError("authentication", "Gemini credentials are not configured.");
    const model = capability === "structured" ? this.config.structuredModel : capability === "chat" ? this.config.chatModel : this.config.perceptionModel;
    if (!model || model.includes("/") || model.length > 120) throw new BridgeProviderError("unsupported_capability", "The requested Gemini capability has no configured model.");
    return model;
  }
  private async post(model: string, body: unknown, signal: AbortSignal, streaming = false) {
    const serialized = JSON.stringify(body);
    if (Buffer.byteLength(serialized) > this.config.maxRequestBytes) throw new BridgeProviderError("invalid_request", "Gemini request exceeded the configured byte limit.");
    const deadline = AbortSignal.timeout(this.config.timeoutMilliseconds);
    const combined = AbortSignal.any([signal, deadline]);
    const endpoint = `${this.config.baseUrl}/v1beta/models/${encodeURIComponent(model)}:${streaming ? "streamGenerateContent?alt=sse" : "generateContent"}`;
    let response: Response;
    try { response = await this.fetcher(endpoint, { method: "POST", headers: { "x-goog-api-key": this.config.apiKey!, "content-type": "application/json" }, body: serialized, signal: combined }); }
    catch {
      if (combined.aborted) throw new BridgeProviderError(signal.aborted ? "cancelled" : "timeout", signal.aborted ? "Gemini request was cancelled." : "Gemini request exceeded the configured timeout.");
      throw new BridgeProviderError("provider_unavailable", "Gemini could not be reached.");
    }
    if (!response.ok) throw providerError(response.status);
    return { response, signal: combined, deadline };
  }
  private async read(response: Response, caller: AbortSignal, deadline: AbortSignal): Promise<unknown> {
    if (!response.body) throw new BridgeProviderError("malformed_response", "Gemini returned no response body.");
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0; const combined = AbortSignal.any([caller, deadline]);
    const cancel = () => { void reader.cancel(); }; combined.addEventListener("abort", cancel, { once: true });
    try { while (true) { const next = await reader.read(); if (next.done) break; size += next.value.byteLength; if (size > this.config.maxResponseBytes) throw new BridgeProviderError("response_bound", "Gemini response exceeded the configured byte limit."); chunks.push(next.value); } }
    catch (error) { if (error instanceof BridgeProviderError) throw error; if (caller.aborted || deadline.aborted) throw new BridgeProviderError(caller.aborted ? "cancelled" : "timeout", caller.aborted ? "Gemini request was cancelled." : "Gemini request exceeded the configured timeout."); throw new BridgeProviderError("provider_unavailable", "Gemini response could not be read."); }
    finally { combined.removeEventListener("abort", cancel); reader.releaseLock(); }
    try { return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8")) as unknown; }
    catch { throw new BridgeProviderError("malformed_response", "Gemini returned invalid JSON."); }
  }
  async structured(input: Parameters<StructuredReasoningProvider["structured"]>[0]): ReturnType<StructuredReasoningProvider["structured"]> {
    const model = this.model("structured", input.requireZeroDataRetention); const started = Date.now();
    const result = await this.post(model, { ...contents(input.messages), generationConfig: { responseMimeType: "application/json", responseJsonSchema: input.schema } }, input.signal);
    const payload = await this.read(result.response, input.signal, result.deadline);
    const text = partsOf(payload).map((part) => part.text ?? "").join("");
    if (!text) throw new BridgeProviderError("malformed_response", "Gemini returned no structured content.");
    let value: unknown; try { value = JSON.parse(text); } catch { throw new BridgeProviderError("malformed_response", "Gemini structured content was not JSON."); }
    try { validateJsonSchema(input.schema, value); } catch { throw new BridgeProviderError("malformed_response", "Gemini structured content did not satisfy the required schema."); }
    const metadata = isRecord(payload) ? payload.usageMetadata : undefined;
    return { value, provenance: { provider: "gemini", model, endpoint: "generateContent", latencyMilliseconds: Date.now() - started, attempt: 1, usage: usageOf(metadata) } satisfies ProviderProvenance };
  }
  async perceive(input: Parameters<DocumentPerceptionProvider["perceive"]>[0], signal: AbortSignal): ReturnType<DocumentPerceptionProvider["perceive"]> {
    const model = this.model("perception", input.options?.requireZeroDataRetention);
    if (input.mimeType !== "application/pdf") throw new BridgeProviderError("invalid_request", "Only explicit PDF input is supported by this capability.");
    if (!input.bytes.byteLength || input.bytes.byteLength > this.config.maxDocumentBytes) throw new BridgeProviderError("invalid_request", "PDF is empty or exceeds the configured provider byte limit.");
    const started = Date.now(); const response = await this.post(model, { contents: [{ role: "user", parts: [{ text: "Extract the document text page by page. Return only JSON matching the requested schema. Do not infer geometry, confidence, or visual asset references." }, { inlineData: { mimeType: "application/pdf", data: Buffer.from(input.bytes).toString("base64") } }] }], generationConfig: { responseMimeType: "application/json", responseJsonSchema: { type: "object", additionalProperties: false, required: ["pages"], properties: { pages: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["page_number", "markdown"], properties: { page_number: { type: "integer", minimum: 1 }, markdown: { type: "string", maxLength: 1000000 } } } } } } } }, signal);
    const payload = await this.read(response.response, signal, response.deadline); const text = partsOf(payload).map((part) => part.text ?? "").join("");
    let parsed: unknown; try { parsed = JSON.parse(text); } catch { throw new BridgeProviderError("malformed_response", "Gemini perception result was not valid JSON."); }
    if (!isRecord(parsed) || !Array.isArray(parsed.pages) || parsed.pages.length < 1 || parsed.pages.length > 1000 || parsed.pages.some((page) => !isRecord(page) || !Number.isInteger(page.page_number) || typeof page.markdown !== "string" || page.markdown.length > 1_000_000)) throw new BridgeProviderError("malformed_response", "Gemini perception result did not contain bounded pages.");
    const metadata = isRecord(payload) ? payload.usageMetadata : undefined;
    return { providerResult: { pages: parsed.pages.map((page) => ({ page_number: page.page_number, markdown: page.markdown })) }, provenance: { provider: "gemini", model, endpoint: "generateContent", latencyMilliseconds: Date.now() - started, attempt: 1, usage: usageOf(metadata) } };
  }
  async *streamChat(input: Parameters<StreamingChatProvider["streamChat"]>[0]): AsyncGenerator<ChatStreamEvent> {
    const model = this.model("chat", input.requireZeroDataRetention); const started = Date.now();
    const toolConfig = input.tools?.length ? { tools: [{ functionDeclarations: input.tools.map((tool) => ({ name: tool.name, description: tool.description, parameters: tool.parameters })) }] } : {};
    const result = await this.post(model, { ...contents(input.messages), ...toolConfig }, input.signal, true);
    if (!result.response.body) throw new BridgeProviderError("malformed_response", "Gemini returned no stream body.");
    const reader = result.response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let bytes = 0; let usage: ProviderUsage | undefined; let completed = false;
    const cancel = () => { void reader.cancel(); }; result.signal.addEventListener("abort", cancel, { once: true });
    try {
      while (true) {
        const item = await reader.read(); if (item.done) break; bytes += item.value.byteLength;
        if (bytes > this.config.maxStreamBytes) throw new BridgeProviderError("response_bound", "Gemini stream exceeded the configured byte limit.");
        buffer += decoder.decode(item.value, { stream: true }); const lines = buffer.split(/\r?\n/u); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue; const source = line.slice(5).trim(); if (!source) continue;
          let payload: unknown; try { payload = JSON.parse(source); } catch { throw new BridgeProviderError("malformed_response", "Gemini sent malformed stream data."); }
          const parts = partsOf(payload); const metadata = isRecord(payload) ? payload.usageMetadata : undefined; usage = usageOf(metadata) ?? usage;
          for (const part of parts) {
            if (part.text) yield { type: "text", text: part.text };
            if (part.functionCall) yield { type: "tool_call", id: part.functionCall.id ?? part.functionCall.name, name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args ?? {}) };
          }
          if (isRecord(payload) && Array.isArray(payload.candidates) && isRecord(payload.candidates[0]) && payload.candidates[0].finishReason && payload.candidates[0].finishReason !== "FINISH_REASON_UNSPECIFIED") completed = true;
        }
      }
    } catch (error) { if (error instanceof BridgeProviderError) throw error; if (input.signal.aborted || result.deadline.aborted) throw new BridgeProviderError(input.signal.aborted ? "cancelled" : "timeout", input.signal.aborted ? "Gemini stream was cancelled." : "Gemini stream exceeded the configured timeout."); throw new BridgeProviderError("provider_unavailable", "Gemini stream failed."); }
    finally { result.signal.removeEventListener("abort", cancel); reader.releaseLock(); }
    if (input.signal.aborted || result.deadline.aborted) throw new BridgeProviderError(input.signal.aborted ? "cancelled" : "timeout", input.signal.aborted ? "Gemini stream was cancelled." : "Gemini stream exceeded the configured timeout.");
    if (!completed) throw new BridgeProviderError("malformed_response", "Gemini stream ended without a completion marker.");
    yield { type: "complete", provenance: { provider: "gemini", model, endpoint: "streamGenerateContent", latencyMilliseconds: Date.now() - started, attempt: 1, usage } };
  }
}
export function createGeminiCapabilities(config: GeminiProviderConfig) {
  const provider = new GeminiProvider(config);
  return { structured: provider, perception: provider, streaming: provider };
}
