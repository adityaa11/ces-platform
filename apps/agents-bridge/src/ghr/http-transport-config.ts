export type GenericHandoffHttpTransportConfig = Readonly<{
  origin: string;
  credential: string;
  timeoutMilliseconds: number;
  maximumResponseBytes: number;
}>;

const MAX_TIMEOUT_MILLISECONDS = 120_000;
const MAX_RESPONSE_BYTES = 65_536;

function boundedPositiveInteger(value: string | number | undefined, fallback: number, name: string, maximum: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  return parsed;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
    && (parts[0] === 10 || (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) || (parts[0] === 192 && parts[1] === 168));
}

function parsePrivateOrigin(value: unknown): URL | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  let parsed: URL;
  try { parsed = new URL(value); } catch { return undefined; }
  const privateHost = parsed.hostname === "agents-bridge" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]" || isPrivateIpv4(parsed.hostname);
  if (parsed.protocol !== "http:" || !privateHost || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) return undefined;
  return parsed;
}

/** Runtime validation for the composition boundary; callers cannot rely on TypeScript types at runtime. */
export function isValidGenericHandoffHttpTransportConfig(value: unknown): value is GenericHandoffHttpTransportConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const timeoutMilliseconds = candidate.timeoutMilliseconds;
  const maximumResponseBytes = candidate.maximumResponseBytes;
  return parsePrivateOrigin(candidate.origin) !== undefined
    && typeof candidate.credential === "string"
    && Buffer.byteLength(candidate.credential) >= 32
    && typeof timeoutMilliseconds === "number"
    && Number.isInteger(timeoutMilliseconds)
    && timeoutMilliseconds >= 1
    && timeoutMilliseconds <= MAX_TIMEOUT_MILLISECONDS
    && typeof maximumResponseBytes === "number"
    && Number.isInteger(maximumResponseBytes)
    && maximumResponseBytes >= 1
    && maximumResponseBytes <= MAX_RESPONSE_BYTES;
}

/** Parses the deployment-only origin and the already-established service credential. */
export function loadGenericHandoffHttpTransportConfig(environment: NodeJS.ProcessEnv = process.env): GenericHandoffHttpTransportConfig | undefined {
  const origin = environment.AGENTS_BRIDGE_GHR_HTTP_ORIGIN;
  if (origin === undefined || origin === "") return undefined;
  const parsed = parsePrivateOrigin(origin);
  if (!parsed) {
    throw new Error("AGENTS_BRIDGE_GHR_HTTP_ORIGIN must be a credential-free private HTTP origin without a path, query, or fragment.");
  }
  const credential = environment.AGENTS_BRIDGE_SERVICE_CREDENTIAL;
  if (!credential || Buffer.byteLength(credential) < 32) throw new Error("AGENTS_BRIDGE_SERVICE_CREDENTIAL must be at least 32 bytes for GHR HTTP delivery.");
  return Object.freeze({
    origin: parsed.origin,
    credential,
    timeoutMilliseconds: boundedPositiveInteger(environment.AGENTS_BRIDGE_GHR_HTTP_TIMEOUT_MS, 30_000, "AGENTS_BRIDGE_GHR_HTTP_TIMEOUT_MS", MAX_TIMEOUT_MILLISECONDS),
    maximumResponseBytes: boundedPositiveInteger(environment.AGENTS_BRIDGE_GHR_HTTP_MAX_RESPONSE_BYTES, 8_192, "AGENTS_BRIDGE_GHR_HTTP_MAX_RESPONSE_BYTES", MAX_RESPONSE_BYTES),
  });
}
