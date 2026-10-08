import type { DocumentPerceptionRequest, DocumentPerceptionTechnicalFailure, NormalizedDocument } from "@atlas/contracts";
import type { TransientDerivedVisual } from "./provider-capabilities.js";

export type AtlasPerceptionClientConfig = {
  readonly baseUrl: string;
  readonly sourcePath: string;
  readonly resultPath: string;
  readonly failurePath: string;
  readonly derivedAssetPath: string;
  readonly serviceCredential: string;
  readonly maximumSourceBytes: number;
  readonly maximumResultBytes: number;
  readonly timeoutMilliseconds: number;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class AtlasPerceptionClientError extends Error {
  constructor(readonly operation: "source" | "result" | "failure" | "derived", message: string) {
    super(message);
    this.name = "AtlasPerceptionClientError";
  }
}

function boundedPositiveInteger(value: string | undefined, fallback: number, name: string, maximum: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  return parsed;
}

function internalPath(value: string | undefined, fallback: string, name: string): string {
  const path = value ?? fallback;
  if (!path.startsWith("/") || path.includes("..") || path.length > 200) throw new Error(`${name} must be a bounded absolute internal path.`);
  return path;
}

export function loadAtlasPerceptionClientConfig(environment: NodeJS.ProcessEnv = process.env): AtlasPerceptionClientConfig {
  const baseUrl = environment.AGENTS_BRIDGE_ATLAS_URL ?? "http://localhost:3001";
  let parsed: URL;
  try { parsed = new URL(baseUrl); } catch { throw new Error("AGENTS_BRIDGE_ATLAS_URL must be an absolute HTTP(S) URL."); }
  if (!/^https?:$/u.test(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("AGENTS_BRIDGE_ATLAS_URL must be an absolute HTTP(S) URL without credentials or query parameters.");
  const serviceCredential = environment.AGENTS_BRIDGE_SERVICE_CREDENTIAL;
  if (!serviceCredential || Buffer.byteLength(serviceCredential) < 32) throw new Error("AGENTS_BRIDGE_SERVICE_CREDENTIAL must be at least 32 bytes.");
  return {
    baseUrl: baseUrl.replace(/\/$/u, ""),
    sourcePath: internalPath(environment.AGENTS_BRIDGE_ATLAS_SOURCE_PATH, "/internal/perception/source", "AGENTS_BRIDGE_ATLAS_SOURCE_PATH"),
    resultPath: internalPath(environment.AGENTS_BRIDGE_ATLAS_RESULT_PATH, "/internal/perception/result", "AGENTS_BRIDGE_ATLAS_RESULT_PATH"), failurePath: internalPath(environment.AGENTS_BRIDGE_ATLAS_PERCEPTION_FAILURE_PATH, "/internal/perception/failure", "AGENTS_BRIDGE_ATLAS_PERCEPTION_FAILURE_PATH"),
    derivedAssetPath: internalPath(environment.AGENTS_BRIDGE_ATLAS_DERIVED_ASSET_PATH, "/internal/perception/derived", "AGENTS_BRIDGE_ATLAS_DERIVED_ASSET_PATH"),
    serviceCredential,
    maximumSourceBytes: boundedPositiveInteger(environment.AGENTS_BRIDGE_MAX_SOURCE_BYTES, 20 * 1024 * 1024, "AGENTS_BRIDGE_MAX_SOURCE_BYTES", 20 * 1024 * 1024),
    maximumResultBytes: boundedPositiveInteger(environment.AGENTS_BRIDGE_MAX_RESULT_BYTES, 10 * 1024 * 1024, "AGENTS_BRIDGE_MAX_RESULT_BYTES", 10 * 1024 * 1024),
    timeoutMilliseconds: boundedPositiveInteger(environment.AGENTS_BRIDGE_ATLAS_TIMEOUT_MS, 30_000, "AGENTS_BRIDGE_ATLAS_TIMEOUT_MS", 120_000),
  };
}

function endpoint(config: AtlasPerceptionClientConfig, path: string): string {
  return new URL(path, `${config.baseUrl}/`).toString();
}

function cancellationError(operation: "source" | "result" | "failure" | "derived"): AtlasPerceptionClientError {
  return new AtlasPerceptionClientError(operation, `Atlas ${operation} handoff was cancelled.`);
}

async function readBoundedBytes(response: Response, maximumBytes: number, operation: "source" | "result" | "failure" | "derived", signal: AbortSignal): Promise<Uint8Array> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength && (!/^\d+$/u.test(declaredLength) || Number(declaredLength) > maximumBytes)) throw new AtlasPerceptionClientError(operation, `Atlas ${operation} handoff exceeded its configured byte limit.`);
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maximumBytes) throw new AtlasPerceptionClientError(operation, `Atlas ${operation} handoff exceeded its configured byte limit.`);
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximumBytes) throw new AtlasPerceptionClientError(operation, `Atlas ${operation} handoff exceeded its configured byte limit.`);
      chunks.push(chunk.value);
    }
  } catch (error) {
    if (signal.aborted) throw cancellationError(operation);
    if (error instanceof AtlasPerceptionClientError) throw error;
    throw new AtlasPerceptionClientError(operation, `Atlas ${operation} handoff response could not be read.`);
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export function createAtlasPerceptionClients(config: AtlasPerceptionClientConfig, fetcher: FetchLike = fetch) {
    const request = async (operation: "source" | "result" | "failure", path: string, body: unknown, signal: AbortSignal): Promise<Response> => {
    const serialized = JSON.stringify(body);
    const deadline = AbortSignal.timeout(config.timeoutMilliseconds);
    const requestSignal = AbortSignal.any([signal, deadline]);
    try {
      const response = await fetcher(endpoint(config, path), {
        method: "POST",
        headers: { authorization: `Bearer ${config.serviceCredential}`, "content-type": "application/json" },
        body: serialized,
        signal: requestSignal,
      });
      if (!response.ok) {
        // A 5xx comes from a temporarily unavailable Atlas boundary.  It must
        // remain with the existing pg-boss retry ledger; only a bounded 4xx
        // rejection can describe an invalid or expired handoff.
        const disposition = response.status >= 500 ? "unavailable" : "rejected";
        throw new AtlasPerceptionClientError(operation, `Atlas ${operation} handoff was ${disposition}.`);
      }
      return response;
    } catch (error) {
      if (error instanceof AtlasPerceptionClientError) throw error;
      if (signal.aborted || deadline.aborted) throw cancellationError(operation);
      throw new AtlasPerceptionClientError(operation, `Atlas ${operation} handoff was unavailable.`);
    }
  };

  return {
    source: {
      async redeem(perceptionRequest: DocumentPerceptionRequest, signal: AbortSignal): Promise<{ readonly bytes: Uint8Array; readonly mimeType: "application/pdf" }> {
        const response = await request("source", config.sourcePath, perceptionRequest, signal);
        const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
        if (contentType !== "application/pdf") throw new AtlasPerceptionClientError("source", "Atlas source handoff returned an unexpected media type.");
        const bytes = await readBoundedBytes(response, config.maximumSourceBytes, "source", signal);
        return { bytes, mimeType: "application/pdf" };
      },
    },
    results: {
      async handoffDerived(perceptionRequest: DocumentPerceptionRequest, descriptor: TransientDerivedVisual, signal: AbortSignal): Promise<{ readonly assetRef: string }> {
        if (descriptor.bytes.byteLength !== descriptor.byteLength || descriptor.byteLength > config.maximumResultBytes) throw new AtlasPerceptionClientError("derived", "Atlas derived handoff exceeded its configured byte limit.");
        const metadata = { request: perceptionRequest, descriptor: { sourceSha256: descriptor.sourceSha256, profile: descriptor.profile, pageNumber: descriptor.pageNumber, locatorId: descriptor.locatorId, mediaType: descriptor.mediaType, width: descriptor.width, height: descriptor.height, byteLength: descriptor.byteLength, sha256: descriptor.sha256 } };
        const deadline = AbortSignal.timeout(config.timeoutMilliseconds); const requestSignal = AbortSignal.any([signal, deadline]);
        let response: Response;
        try {
          response = await fetcher(endpoint(config, config.derivedAssetPath), { method: "POST", headers: { authorization: `Bearer ${config.serviceCredential}`, "content-type": descriptor.mediaType, "x-atlas-derived-metadata": Buffer.from(JSON.stringify(metadata)).toString("base64url") }, body: Buffer.from(descriptor.bytes), signal: requestSignal });
        } catch (error) {
          // A transport break while Atlas is unavailable is retryable work,
          // not a worker cancellation.  Conflating the two strands a
          // half-delivered visual handoff outside the queue's replay path.
          if (signal.aborted || deadline.aborted) throw cancellationError("derived");
          throw new AtlasPerceptionClientError("derived", "Atlas derived handoff was unavailable.");
        }
        if (!response.ok) throw new AtlasPerceptionClientError("derived", response.status >= 500 ? "Atlas derived handoff was unavailable." : "Atlas derived handoff was rejected.");
        const body = await response.json() as { assetRef?: unknown };
        if (typeof body.assetRef !== "string" || !/^derived\//.test(body.assetRef)) throw new AtlasPerceptionClientError("derived", "Atlas derived handoff returned an invalid reference.");
        return { assetRef: body.assetRef };
      },
      async deliver(perceptionRequest: DocumentPerceptionRequest, result: NormalizedDocument, signal: AbortSignal): Promise<void> {
        const serialized = JSON.stringify({ request: perceptionRequest, result });
        if (Buffer.byteLength(serialized) > config.maximumResultBytes) throw new AtlasPerceptionClientError("result", "Atlas result handoff exceeded its configured byte limit.");
        const response = await request("result", config.resultPath, { request: perceptionRequest, result }, signal);
        if (response.status !== 204) throw new AtlasPerceptionClientError("result", "Atlas result handoff returned an invalid acknowledgement.");
      },
      async fail(failure: DocumentPerceptionTechnicalFailure, signal: AbortSignal): Promise<void> {
        const response = await request("failure", config.failurePath, failure, signal);
        if (response.status !== 204) throw new AtlasPerceptionClientError("failure", "Atlas failure handoff returned an invalid acknowledgement.");
      },
    },
  };
}
