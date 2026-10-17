import Fastify from "fastify";
import { parseExecutionRequest, type ReasoningRuntime } from "@atlas/contracts";
import type { RuntimeCapacityConstraintRead, RuntimeCapacityConstraint } from "./runtime-capacity-constraint.js";
import { parseProviderWorkAdmissionRequest, type ProviderWorkAdmissionOutcome } from "./provider-work-admission.js";

type RuntimeCapacityConstraintReader = Readonly<{
  read(credential: string, request?: RuntimeCapacityConstraintRead): Promise<RuntimeCapacityConstraint>;
}>;

type ProviderWorkAdmissionService = Readonly<{
  admit(credential: string, request: ReturnType<typeof parseProviderWorkAdmissionRequest>): Promise<ProviderWorkAdmissionOutcome>;
  cancel(credential: string, logicalWorkId: string, attemptNumber: number): Promise<ProviderWorkAdmissionOutcome>;
}>;

const unavailableRuntimeConstraint = (): RuntimeCapacityConstraint => ({
  apiVersion: "RuntimeCapacityConstraint/v1",
  reason: "inactive_or_unauthorized",
  readIsNotSendPermit: true,
});

function bearerCredential(authorization: string | undefined): string | undefined {
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const credential = authorization.slice("Bearer ".length);
  return credential.length > 0 ? credential : undefined;
}

export function createBridgeApp(options: {
  readonly runtime: ReasoningRuntime;
  readonly version: string;
  readonly ready?: () => boolean;
  readonly runtimeCapacityConstraintReader?: RuntimeCapacityConstraintReader;
  readonly providerWorkAdmissionService?: ProviderWorkAdmissionService;
}) {
  const app = Fastify({ logger: false });
  app.get("/healthz", async () => ({ status: "ok" }));
  app.get("/readyz", async (_request, reply) => {
    const ready = options.ready?.() ?? true;
    if (!ready) reply.code(503);
    return { status: ready ? "ready" : "not_ready", version: options.version };
  });
  app.get("/v1/runtime-capacity-constraint", async (request, reply) => {
    const credential = bearerCredential(request.headers.authorization);
    if (!credential) return unavailableRuntimeConstraint();
    const expectedEffectiveConstraintRevision = (request.query as { expectedEffectiveConstraintRevision?: unknown }).expectedEffectiveConstraintRevision;
    if (expectedEffectiveConstraintRevision !== undefined && typeof expectedEffectiveConstraintRevision !== "string") {
      return reply.code(400).send({ error: "expectedEffectiveConstraintRevision must be a string." });
    }
    return (options.runtimeCapacityConstraintReader ?? { read: async () => unavailableRuntimeConstraint() })
      .read(credential, expectedEffectiveConstraintRevision === undefined ? undefined : { expectedEffectiveConstraintRevision });
  });
  app.post("/v1/provider-work-admissions", async (request, reply) => {
    const credential = bearerCredential(request.headers.authorization);
    if (!credential) return { apiVersion: "ProviderWorkAdmission/v1", state: "policy_or_resource_unfit" };
    try {
      const admission = parseProviderWorkAdmissionRequest(request.body);
      return (options.providerWorkAdmissionService ?? { admit: async () => ({ apiVersion: "ProviderWorkAdmission/v1" as const, state: "policy_or_resource_unfit" as const }) }).admit(credential, admission);
    } catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : "Invalid provider work admission request." }); }
  });
  app.post("/v1/provider-work-admissions/:logicalWorkId/:attemptNumber/cancel", async (request, reply) => {
    const credential = bearerCredential(request.headers.authorization);
    const params = request.params as { logicalWorkId?: unknown; attemptNumber?: unknown };
    const attemptNumber = Number(params.attemptNumber);
    if (!credential || !nonEmptyRouteParam(params.logicalWorkId) || !Number.isInteger(attemptNumber) || attemptNumber < 1) return { apiVersion: "ProviderWorkAdmission/v1", state: "policy_or_resource_unfit" };
    return (options.providerWorkAdmissionService ?? { cancel: async () => ({ apiVersion: "ProviderWorkAdmission/v1" as const, state: "policy_or_resource_unfit" as const }) }).cancel(credential, params.logicalWorkId, attemptNumber);
  });
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

function nonEmptyRouteParam(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
