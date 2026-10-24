export type GenericHandoffHttpTransportConfig = Readonly<{
  origin: string;
  credential: string;
  timeoutMilliseconds: number;
  maximumResponseBytes: number;
}>;

function boundedPositiveInteger(value: string | undefined, fallback: number, name: string, maximum: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  return parsed;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
    && (parts[0] === 10 || (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) || (parts[0] === 192 && parts[1] === 168));
}

/** Parses the deployment-only origin and the already-established service credential. */
export function loadGenericHandoffHttpTransportConfig(environment: NodeJS.ProcessEnv = process.env): GenericHandoffHttpTransportConfig | undefined {
  const origin = environment.AGENTS_BRIDGE_GHR_HTTP_ORIGIN;
  if (origin === undefined || origin === "") return undefined;
  let parsed: URL;
  try { parsed = new URL(origin); } catch { throw new Error("AGENTS_BRIDGE_GHR_HTTP_ORIGIN must be an absolute private HTTP origin."); }
  const privateHost = parsed.hostname === "agents-bridge" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]" || isPrivateIpv4(parsed.hostname);
  if (parsed.protocol !== "http:" || !privateHost || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("AGENTS_BRIDGE_GHR_HTTP_ORIGIN must be a credential-free private HTTP origin without a path, query, or fragment.");
  }
  const credential = environment.AGENTS_BRIDGE_SERVICE_CREDENTIAL;
  if (!credential || Buffer.byteLength(credential) < 32) throw new Error("AGENTS_BRIDGE_SERVICE_CREDENTIAL must be at least 32 bytes for GHR HTTP delivery.");
  return Object.freeze({
    origin: parsed.origin,
    credential,
    timeoutMilliseconds: boundedPositiveInteger(environment.AGENTS_BRIDGE_GHR_HTTP_TIMEOUT_MS, 30_000, "AGENTS_BRIDGE_GHR_HTTP_TIMEOUT_MS", 120_000),
    maximumResponseBytes: boundedPositiveInteger(environment.AGENTS_BRIDGE_GHR_HTTP_MAX_RESPONSE_BYTES, 8_192, "AGENTS_BRIDGE_GHR_HTTP_MAX_RESPONSE_BYTES", 65_536),
  });
}
