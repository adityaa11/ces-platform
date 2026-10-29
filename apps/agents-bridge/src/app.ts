import Fastify from "fastify";
import type { GenericHandoffHttpTransportConfig } from "./ghr/http-transport-config.js";
import { registerAuthenticatedBatchPlanHttpReceiver } from "./ghr/authenticated-batch-plan-http-receiver.js";

export function createBridgeApp(options: {
  readonly version: string;
  readonly ready?: () => boolean;
  /** Deployment-owned internal receiver configuration. Missing credentials fail closed. */
  readonly genericHandoffHttpTransport?: GenericHandoffHttpTransportConfig;
}) {
  const app = Fastify({ logger: false });
  registerAuthenticatedBatchPlanHttpReceiver(app, { credential: options.genericHandoffHttpTransport?.credential });
  app.get("/healthz", async () => ({ status: "ok" }));
  app.get("/readyz", async (_request, reply) => {
    const ready = options.ready?.() ?? true;
    if (!ready) reply.code(503);
    return { status: ready ? "ready" : "not_ready", version: options.version };
  });
  return app;
}
