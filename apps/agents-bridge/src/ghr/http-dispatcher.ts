import { isTrustedBranchRegistration, type BranchRegistration } from "./core/branch-registry.js";
import { isValidGenericHandoffHttpTransportConfig, type GenericHandoffHttpTransportConfig } from "./http-transport-config.js";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type GenericHandoffAcknowledgement = Readonly<{
  handoffId: string;
  bodySha256: string;
  disposition: "parsed_only";
}>;

export type GenericHandoffHttpDispatchResult =
  | Readonly<{ status: "acknowledged"; acknowledgement: GenericHandoffAcknowledgement }>
  | Readonly<{ status: "rejected" | "unavailable" | "invalid_acknowledgement" | "failed_closed" }>;

export type VerifiedGenericHandoffHttpRequest = Readonly<{
  serializedEnvelopeBytes: Uint8Array;
  handoffId: string;
  bodySha256: string;
}>;

export class GenericHandoffHttpDispatcherConfigurationError extends Error {}

function endpoint(origin: string, receiver: BranchRegistration["receiver"]): string {
  const base = new URL(origin);
  const target = new URL(receiver.path, base);
  if (target.origin !== base.origin) throw new GenericHandoffHttpDispatcherConfigurationError("Registered receiver path must remain within the configured private origin.");
  return target.toString();
}

async function readBoundedBytes(response: Response, maximumBytes: number): Promise<Uint8Array | undefined> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength && (!/^\d+$/u.test(declaredLength) || Number(declaredLength) > maximumBytes)) return undefined;
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return bytes.byteLength <= maximumBytes ? bytes : undefined;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximumBytes) return undefined;
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

function acknowledgement(value: unknown, request: VerifiedGenericHandoffHttpRequest): GenericHandoffAcknowledgement | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 3 || record.handoffId !== request.handoffId || record.bodySha256 !== request.bodySha256 || record.disposition !== "parsed_only") return undefined;
  return { handoffId: request.handoffId, bodySha256: request.bodySha256, disposition: "parsed_only" };
}

/**
 * Generic, inactive transport boundary.  It can be composed only with a
 * resolver-issued registration and deployment configuration; it has no lease
 * or receipt authority.
 */
export function createGenericHandoffHttpDispatcher(
  configuration: GenericHandoffHttpTransportConfig | undefined,
  registration: BranchRegistration,
  fetcher: FetchLike = fetch,
) {
  if (!isValidGenericHandoffHttpTransportConfig(configuration)) throw new GenericHandoffHttpDispatcherConfigurationError("Generic handoff HTTP transport configuration is invalid or missing.");
  if (!isTrustedBranchRegistration(registration)) throw new GenericHandoffHttpDispatcherConfigurationError("Generic handoff HTTP transport requires a trusted registered receiver.");
  if (registration.receiver.transport !== "http" || registration.receiver.method !== "POST") throw new GenericHandoffHttpDispatcherConfigurationError("Generic handoff HTTP transport requires a registered HTTP POST receiver.");
  let target: string;
  try { target = endpoint(configuration.origin, registration.receiver); } catch (error) {
    if (error instanceof GenericHandoffHttpDispatcherConfigurationError) throw error;
    throw new GenericHandoffHttpDispatcherConfigurationError("Generic handoff HTTP transport could not compose a registered receiver destination.");
  }

  return Object.freeze({
    async dispatch(request: VerifiedGenericHandoffHttpRequest): Promise<GenericHandoffHttpDispatchResult> {
      if (!(request.serializedEnvelopeBytes instanceof Uint8Array) || request.serializedEnvelopeBytes.byteLength === 0 || typeof request.handoffId !== "string" || typeof request.bodySha256 !== "string") {
        return { status: "invalid_acknowledgement" };
      }
      const timeout = AbortSignal.timeout(configuration.timeoutMilliseconds);
      let response: Response;
      try {
        response = await fetcher(target, {
          method: "POST",
          // Observe redirects as a terminal protocol violation. Following one
          // could turn the registered path into an untrusted destination.
          redirect: "manual",
          headers: { authorization: `Bearer ${configuration.credential}`, "content-type": "application/json" },
          body: Buffer.from(request.serializedEnvelopeBytes),
          signal: timeout,
        });
      } catch {
        return { status: "unavailable" };
      }
      if (response.status !== 200) {
        if (response.status >= 500 || response.status === 408 || response.status === 429) return { status: "unavailable" };
        if (response.status === 400 || response.status === 422) return { status: "rejected" };
        return { status: "failed_closed" };
      }
      let bytes: Uint8Array | undefined;
      try { bytes = await readBoundedBytes(response, configuration.maximumResponseBytes); } catch { return { status: timeout.aborted ? "unavailable" : "invalid_acknowledgement" }; }
      if (!bytes) return { status: "invalid_acknowledgement" };
      let parsed: unknown;
      try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch { return { status: "invalid_acknowledgement" }; }
      const valid = acknowledgement(parsed, request);
      return valid ? { status: "acknowledged", acknowledgement: valid } : { status: "invalid_acknowledgement" };
    },
  });
}
