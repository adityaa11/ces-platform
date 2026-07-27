import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { AtlasProviderRequestSchema } from "@company/ces-agent-provider-sdk";
import { z } from "zod";
import { BridgeIdentifierSchema, GenericAgentExecutionRequestSchema, authorizeAgent } from "./core/contracts.js";
import { BridgeExecutionError, executeRegisteredAgent, type BridgeRegistries } from "./core/executor.js";
import { validateRegistries } from "./core/registry.js";
import {
  InMemoryAdmissionController,
  type BridgeAdmissionController,
} from "./core/admission.js";
import type { BridgeRuntimeConfig, RuntimeClient } from "./config/environment.js";

const AtlasCompatibilityEnvelopeSchema = z.object({
  contract: z.literal("1.0.0"),
  model: z.string().trim().min(1),
  request: AtlasProviderRequestSchema,
}).strict();

export interface BridgeLogger {
  log(event: Readonly<{
    request_id: string;
    route: string;
    status: number;
    duration_ms: number;
    agent_id?: string;
    error_code?: string;
    diagnostic_stage?: string;
  }>): void;
}

export interface BridgeMetrics {
  record(event: Readonly<{
    route: string;
    status: number;
    duration_ms: number;
    input_bytes: number;
    source_documents: number;
    agent_id?: string;
    provider_id?: string;
  }>): void;
}

export interface BridgeRequest {
  readonly method?: string;
  readonly url?: string;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly body: AsyncIterable<Uint8Array | string>;
}

export interface BridgeResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface BridgeRuntime {
  readonly config: BridgeRuntimeConfig;
  readonly registries: BridgeRegistries;
  readonly logger: BridgeLogger;
  readonly metrics?: BridgeMetrics;
  readonly admission?: BridgeAdmissionController;
  readonly now?: () => number;
  readonly requestId?: () => string;
}

export function createBridgeHandler(runtime: BridgeRuntime) {
  validateRegistries(runtime.registries);
  const admission = runtime.admission
    ?? new InMemoryAdmissionController(runtime.config.provider_max_concurrency, runtime.now);
  return async (request: BridgeRequest): Promise<BridgeResponse> => {
    const started = runtime.now?.() ?? Date.now();
    const requestId = validRequestId(header(request.headers, "x-request-id"))
      ?? runtime.requestId?.()
      ?? randomUUID();
    let route = "unknown";
    let agentId: string | undefined;
    let inputBytes = 0;
    let sourceDocuments = 0;
    let errorCode: string | undefined;
    let diagnosticStage: string | undefined;
    let response: BridgeResponse;
    try {
      const pathname = new URL(request.url ?? "/", "http://bridge.invalid").pathname;
      if (pathname === "/healthz" || pathname === "/readyz") {
        route = pathname;
        if (request.method !== "GET") throw error(405, "METHOD_NOT_ALLOWED", "The method is not allowed.");
        response = json(200, pathname === "/healthz"
          ? { status: "ok", service: "ces-agents-bridge" }
          : { status: "ready", service: "ces-agents-bridge" });
      } else if (pathname === "/v1/atlas/analyze") {
        route = pathname;
        agentId = "atlas.requirement-extractor";
        if (request.method !== "POST") throw error(405, "METHOD_NOT_ALLOWED", "The method is not allowed.");
        const atlas = runtime.config.atlas;
        if (!atlas) throw error(503, "BRIDGE_NOT_READY", "The bridge is not ready.");
        const client = authenticate(request.headers, runtime.config.clients);
        authorize(client, agentId, route);
        const raw = await readBody(request.body, runtime.config.ceilings.max_request_bytes);
        inputBytes = Buffer.byteLength(raw, "utf8");
        let envelope: ReturnType<typeof AtlasCompatibilityEnvelopeSchema.parse>;
        try {
          envelope = AtlasCompatibilityEnvelopeSchema.parse(JSON.parse(raw));
        } catch {
          throw error(400, "INVALID_ATLAS_REQUEST", "The Atlas provider request is invalid.");
        }
        if (envelope.model !== atlas.legacy_model) {
          throw error(400, "INVALID_ATLAS_REQUEST", "The Atlas provider request is invalid.");
        }
        sourceDocuments = envelope.request.source_documents.length;
        response = await runAgent(runtime, {
          agent_id: agentId,
          agent_version: atlas.agent_version,
          value: envelope.request,
          request_id: requestId,
          client,
        }, admission);
      } else {
        const match = /^\/v1\/agents\/([^/]+)\/execute$/u.exec(pathname);
        if (!match) throw error(404, "AGENT_NOT_FOUND", "The route was not found.");
        route = "/v1/agents/:agentId/execute";
        if (request.method !== "POST") throw error(405, "METHOD_NOT_ALLOWED", "The method is not allowed.");
        try {
          agentId = BridgeIdentifierSchema.parse(decodeURIComponent(match[1]!));
        } catch {
          throw error(404, "AGENT_NOT_FOUND", "The registered agent was not found.");
        }
        const client = authenticate(request.headers, runtime.config.clients);
        authorize(client, agentId, route);
        const raw = await readBody(request.body, runtime.config.ceilings.max_request_bytes);
        inputBytes = Buffer.byteLength(raw, "utf8");
        let envelope: ReturnType<typeof GenericAgentExecutionRequestSchema.parse>;
        try {
          envelope = GenericAgentExecutionRequestSchema.parse(JSON.parse(raw));
        } catch {
          throw error(400, "INVALID_REQUEST", "The request body is invalid.");
        }
        response = await runAgent(runtime, {
          agent_id: agentId,
          agent_version: envelope.agent_version,
          value: envelope.input,
          request_id: envelope.correlation?.request_id ?? requestId,
          client,
        }, admission);
      }
    } catch (caught) {
      errorCode = caught instanceof BridgeExecutionError ? caught.code : "INTERNAL_ERROR";
      diagnosticStage = caught instanceof BridgeExecutionError ? caught.diagnostic_stage : undefined;
      response = errorResponse(caught, requestId);
    }
    runtime.logger.log({
      request_id: requestId,
      route,
      status: response.status,
      duration_ms: Math.max(0, (runtime.now?.() ?? Date.now()) - started),
      ...(agentId ? { agent_id: agentId } : {}),
      ...(errorCode ? { error_code: errorCode } : {}),
      ...(diagnosticStage ? { diagnostic_stage: diagnosticStage } : {}),
    });
    const providerId = agentId ? providerForAgent(runtime, agentId) : undefined;
    runtime.metrics?.record({
      route,
      status: response.status,
      duration_ms: Math.max(0, (runtime.now?.() ?? Date.now()) - started),
      input_bytes: inputBytes,
      source_documents: sourceDocuments,
      ...(agentId ? { agent_id: agentId } : {}),
      ...(providerId ? { provider_id: providerId } : {}),
    });
    return response;
  };
}

async function runAgent(
  runtime: BridgeRuntime,
  input: {
    readonly agent_id: string;
    readonly agent_version: string;
    readonly value: unknown;
    readonly request_id: string;
    readonly client: RuntimeClient["identity"];
  },
  admission: BridgeAdmissionController,
): Promise<BridgeResponse> {
  const providerId = providerForAgent(runtime, input.agent_id);
  const lease = providerId
    ? await admission.acquire({
      client: input.client,
      agent_id: input.agent_id,
      provider_id: providerId,
    })
    : undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runtime.config.request_timeout_ms);
  try {
    const output = await withAbort(executeRegisteredAgent({
      ...input,
      ceilings: runtime.config.ceilings,
      registries: runtime.registries,
      signal: controller.signal,
    }), controller.signal);
    return json(200, output);
  } finally {
    clearTimeout(timeout);
    lease?.release();
  }
}

function providerForAgent(runtime: BridgeRuntime, agentId: string): string | undefined {
  const agent = runtime.registries.agents.values().find(({ id }) => id === agentId);
  const alias = agent?.execution_policy.allowed_model_aliases[0];
  return alias ? runtime.registries.models.get(alias)?.provider_id : undefined;
}

export function createBridgeServer(runtime: BridgeRuntime): Server {
  const handle = createBridgeHandler(runtime);
  return createServer(async (request, response) => {
    const bridgeResponse = await handle(nodeRequest(request));
    writeNodeResponse(response, bridgeResponse);
  });
}

export async function listenBridgeServer(runtime: BridgeRuntime): Promise<Server> {
  const server = createBridgeServer(runtime);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(runtime.config.port, runtime.config.host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  return server;
}

export async function closeBridgeServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => {
    server.close((caught) => caught ? reject(caught) : resolve());
  });
}

function authenticate(
  headers: BridgeRequest["headers"],
  clients: readonly RuntimeClient[],
) {
  const authorization = header(headers, "authorization");
  if (!authorization) throw error(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  const match = /^Bearer ([^\s]+)$/u.exec(authorization);
  if (!match) throw error(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  const supplied = digest(match[1]!);
  let matched: RuntimeClient | undefined;
  for (const client of clients) {
    for (const credential of client.credentials) {
      if (timingSafeEqual(supplied, digest(credential))) matched = client;
    }
  }
  if (!matched) throw error(403, "AUTHENTICATION_FAILED", "Authentication failed.");
  return matched.identity;
}

function authorize(
  client: RuntimeClient["identity"],
  agentId: string,
  route: string,
): void {
  try {
    authorizeAgent(client, agentId, route);
  } catch {
    throw error(403, "AGENT_NOT_AUTHORIZED", "The client is not authorized for this agent.");
  }
}

async function readBody(
  body: AsyncIterable<Uint8Array | string>,
  maximum: number,
): Promise<string> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const chunkValue of body) {
    const chunk = typeof chunkValue === "string"
      ? Buffer.from(chunkValue)
      : chunkValue;
    length += chunk.byteLength;
    if (length > maximum) throw error(413, "REQUEST_TOO_LARGE", "The request body is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length).toString("utf8");
}

async function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw error(504, "PROVIDER_TIMEOUT", "The provider request timed out.");
  return await new Promise<T>((resolve, reject) => {
    const aborted = () => reject(error(504, "PROVIDER_TIMEOUT", "The provider request timed out."));
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
  });
}

function errorResponse(caught: unknown, requestId: string): BridgeResponse {
  if (caught instanceof BridgeExecutionError) {
    return json(caught.status, { error: { code: caught.code, message: caught.message, request_id: requestId } });
  }
  return json(500, {
    error: { code: "INTERNAL_ERROR", message: "The bridge request failed.", request_id: requestId },
  });
}

function error(status: number, code: string, message: string): BridgeExecutionError {
  return new BridgeExecutionError(status, code, message);
}

function json(status: number, value: unknown): BridgeResponse {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(value),
  };
}

function header(headers: BridgeRequest["headers"], name: string): string | undefined {
  const direct = Object.entries(headers)
    .find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(direct) ? direct[0] : direct;
}

function validRequestId(value: string | undefined): string | undefined {
  return value && /^[A-Za-z0-9._:-]{1,128}$/u.test(value) ? value : undefined;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function nodeRequest(request: IncomingMessage): BridgeRequest {
  return {
    ...(request.method ? { method: request.method } : {}),
    ...(request.url ? { url: request.url } : {}),
    headers: request.headers,
    body: request,
  };
}

function writeNodeResponse(response: ServerResponse, value: BridgeResponse): void {
  response.writeHead(value.status, value.headers);
  response.end(value.body);
}
