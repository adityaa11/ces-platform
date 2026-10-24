import Fastify from "fastify";
import { parseExecutionRequest, type ReasoningRuntime } from "@atlas/contracts";
import type { RuntimeCapacityConstraintRead, RuntimeCapacityConstraint } from "./runtime-capacity-constraint.js";
import { parseProviderWorkAdmissionRequest, type ProviderWorkAdmissionOutcome } from "./provider-work-admission.js";
import type { CapacityPlanningSnapshot, CapacityPlanningSnapshotRead } from "./capacity-planning-snapshot.js";
import type { GenericHandoffHttpTransportConfig } from "./ghr/http-transport-config.js";
import type { BatchPlanAcceptanceStore } from "./ghr/routes/semantic/receivers/batch-plan.receiver.js";
import { registerAuthenticatedBatchPlanHttpReceiver } from "./ghr/authenticated-batch-plan-http-receiver.js";

type RuntimeCapacityConstraintReader = Readonly<{
  read(credential: string, request?: RuntimeCapacityConstraintRead): Promise<RuntimeCapacityConstraint>;
}>;

type ProviderWorkAdmissionService = Readonly<{
  admit(credential: string, request: ReturnType<typeof parseProviderWorkAdmissionRequest>): Promise<ProviderWorkAdmissionOutcome>;
  cancel(credential: string, logicalWorkId: string, attemptNumber: number): Promise<ProviderWorkAdmissionOutcome>;
  outcome(credential: string, logicalWorkId: string, attemptNumber: number): Promise<ProviderWorkAdmissionOutcome>;
}>;
type CapacityPlanningSnapshotReader = Readonly<{ read(credential: string, request?: CapacityPlanningSnapshotRead): Promise<CapacityPlanningSnapshot> }>;

const unavailablePlanningSnapshot = (): CapacityPlanningSnapshot => ({ apiVersion: "CapacityPlanningSnapshot/v1", status: "inactive", reason: "inactive_or_unauthorized", readIsNotAdmissionPermit: true });

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
  readonly capacityPlanningSnapshotReader?: CapacityPlanningSnapshotReader;
  readonly providerWorkAdmissionService?: ProviderWorkAdmissionService;
  /** Durable IDSER planning-acceptance store. */
  readonly batchPlanAcceptance?: BatchPlanAcceptanceStore;
  /** Deployment-owned internal receiver configuration. Missing credentials fail closed. */
  readonly genericHandoffHttpTransport?: GenericHandoffHttpTransportConfig;
}) {
  const app = Fastify({ logger: false });
  registerAuthenticatedBatchPlanHttpReceiver(app, { credential: options.genericHandoffHttpTransport?.credential, acceptance: options.batchPlanAcceptance });
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
  app.get("/v1/capacity-planning-snapshot", async (request, reply) => {
    const credential = bearerCredential(request.headers.authorization);
    if (!credential) return unavailablePlanningSnapshot();
    const query = request.query as { prospective?: unknown; requestBytes?: unknown; inputTokens?: unknown; outputTokens?: unknown };
    const parseOptionalInteger = (value: unknown) => value === undefined ? undefined : typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : null;
    const requestBytes = parseOptionalInteger(query.requestBytes);
    const inputTokens = parseOptionalInteger(query.inputTokens);
    const outputTokens = parseOptionalInteger(query.outputTokens);
    if ((query.prospective !== undefined && query.prospective !== "true" && query.prospective !== "false") || requestBytes === null || inputTokens === null || outputTokens === null) {
      return reply.code(400).send({ error: "prospective must be true or false and sizing values must be non-negative integers." });
    }
    return (options.capacityPlanningSnapshotReader ?? { read: async () => unavailablePlanningSnapshot() }).read(credential, { prospective: query.prospective === "true", requestBytes, inputTokens, outputTokens });
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
  app.get("/v1/provider-work-admissions/:logicalWorkId/:attemptNumber", async (request) => {
    const credential = bearerCredential(request.headers.authorization);
    const params = request.params as { logicalWorkId?: unknown; attemptNumber?: unknown };
    const attemptNumber = Number(params.attemptNumber);
    if (!credential || !nonEmptyRouteParam(params.logicalWorkId) || !Number.isInteger(attemptNumber) || attemptNumber < 1) return { apiVersion: "ProviderWorkAdmission/v1", state: "policy_or_resource_unfit" };
    return (options.providerWorkAdmissionService ?? { outcome: async () => ({ apiVersion: "ProviderWorkAdmission/v1" as const, state: "policy_or_resource_unfit" as const }) }).outcome(credential, params.logicalWorkId, attemptNumber);
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
