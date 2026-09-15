import Fastify from "fastify";
import { parseExecutionRequest, type ReasoningRuntime } from "@atlas/contracts";

export function createBridgeApp(options: { readonly runtime: ReasoningRuntime; readonly version: string }) {
  const app = Fastify({ logger: false });
  app.get("/healthz", async () => ({ status: "ok" }));
  app.get("/readyz", async () => ({ status: "ready", version: options.version }));
  app.post("/v1/interactive/execute", async (request, reply) => {
    let execution;
    try { execution = parseExecutionRequest(request.body); }
    catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : "Invalid execution request." }); }
    if (execution.mode !== "interactive") return reply.code(400).send({ error: "Interactive endpoint requires mode interactive." });

    const cancellation = new AbortController();
    // IncomingRequest's `close` fires after a fully received request as well;
    // response close is the signal that represents a disconnected SSE client.
    reply.raw.once("close", () => { if (!reply.raw.writableEnded) cancellation.abort(); });
    reply.hijack();
    reply.raw.writeHead(200, { "cache-control": "no-cache", connection: "keep-alive", "content-type": "text/event-stream; charset=utf-8", "x-accel-buffering": "no" });
    try {
      for await (const event of options.runtime.execute(execution, { signal: cancellation.signal })) {
        if (cancellation.signal.aborted) break;
        reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        if (event.type === "complete" || event.type === "error") break;
      }
    } finally { reply.raw.end(); }
  });
  return app;
}
