import { createAtlasAuthFromEnvironment } from "@atlas/auth";

type AuthEnvironment = Record<string, string | undefined>;
type AtlasAuthService = ReturnType<typeof createAtlasAuthFromEnvironment>;

let service: AtlasAuthService | undefined;
let usesWorkerBindings = false;

async function runtimeEnvironment(): Promise<AuthEnvironment> {
  // Node-level tests supply their environment directly. Workers expose secret
  // bindings through `cloudflare:workers`, not through process.env.
  if (typeof WebSocketPair === "undefined" && process.env.BETTER_AUTH_SECRET && process.env.DATABASE_URL) return process.env;
  const worker = await import(/* @vite-ignore */ "cloudflare:workers") as { env: AuthEnvironment };
  usesWorkerBindings = true;
  return worker.env;
}

/** Server-only secret lookup for internal assertions derived from a resolved session. */
export async function getAtlasAuthSecret(): Promise<string> {
  const secret = (await runtimeEnvironment()).BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required.");
  return secret;
}

/**
 * Creates auth from one central configuration boundary. Worker I/O objects are
 * request-scoped, so their PostgreSQL client cannot be reused by another
 * request; Node retains one shared service for lifecycle tests.
 */
export async function getAtlasAuthService(): Promise<AtlasAuthService> {
  const environment = await runtimeEnvironment();
  if (usesWorkerBindings) return createAtlasAuthFromEnvironment(environment);
  if (!service) service = createAtlasAuthFromEnvironment(environment);
  return service;
}

export function isWorkerAuthRuntime(): boolean {
  return usesWorkerBindings;
}
