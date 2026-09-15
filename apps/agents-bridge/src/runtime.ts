import type { ExecutionEvent, ExecutionRequest, ReasoningRuntime } from "@atlas/contracts";

/** A deterministic placeholder used only until a provider adapter is introduced. */
export class TestRuntime implements ReasoningRuntime {
  async *execute(request: ExecutionRequest, options: { readonly signal: AbortSignal }): AsyncIterable<ExecutionEvent> {
    if (options.signal.aborted) return;
    yield { type: "text", text: `Test response for ${request.skill.id}.` };
    if (options.signal.aborted) return;
    yield { type: "complete" };
  }
}
