import type { ExecutionEvent, ExecutionRequest, ReasoningRuntime } from "@atlas/contracts";
import { BridgeProviderError, MistralProvider } from "./providers/mistral.js";

/** A deterministic placeholder used only until a provider adapter is introduced. */
export class TestRuntime implements ReasoningRuntime {
  async *execute(request: ExecutionRequest, options: { readonly signal: AbortSignal }): AsyncIterable<ExecutionEvent> {
    if (options.signal.aborted) return;
    yield { type: "text", text: `Test response for ${request.skill.id}.` };
    if (options.signal.aborted) return;
    yield { type: "complete" };
  }
}

/**
 * The BSS-005 envelope intentionally has no final skill registry. Until that
 * arrives, an explicitly configured provider runtime offers only bounded chat
 * execution; structured and OCR capabilities are invoked by future Bridge
 * capability callers, not inferred from client-supplied model parameters.
 */
export class MistralChatRuntime implements ReasoningRuntime {
  constructor(private readonly provider: MistralProvider) {}

  async *execute(request: ExecutionRequest, options: { readonly signal: AbortSignal }): AsyncIterable<ExecutionEvent> {
    const prompt = request.input.prompt;
    if (typeof prompt !== "string" || !prompt) {
      yield { type: "error", message: "Mistral chat execution requires a bounded string prompt." };
      return;
    }
    try {
      for await (const event of this.provider.streamChat({ messages: [{ role: "user", content: prompt }], signal: options.signal })) {
        if (event.type === "text") yield event;
        // The proposal is forwarded but deliberately never executed here;
        // Atlas must authorize any future operation deterministically.
        if (event.type === "tool_call") yield event;
        if (event.type === "complete") yield { type: "complete" };
      }
    } catch (error) {
      const message = error instanceof BridgeProviderError ? error.message : "Provider execution failed.";
      yield { type: "error", message, ...(error instanceof BridgeProviderError ? { code: error.code } : {}) };
    }
  }
}
