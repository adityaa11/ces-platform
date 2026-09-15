export interface AtlasAuthEnvironment {
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
}

export interface AtlasAuthConfig {
  databaseUrl: string;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
}

const environmentFromRuntime = (): AtlasAuthEnvironment => (
  (globalThis as { process?: { env?: AtlasAuthEnvironment } }).process?.env ?? {}
);

const required = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const origin = (value: string, name: string): string => {
  try {
    const parsed = new URL(value);
    if (parsed.origin !== value || !/^https?:$/.test(parsed.protocol)) throw new Error();
    return parsed.origin;
  } catch {
    throw new Error(`${name} must be an absolute http(s) origin`);
  }
};

/** Reads only required configuration and fails before an auth handler is created. */
export function loadAtlasAuthConfig(environment: AtlasAuthEnvironment = environmentFromRuntime()): AtlasAuthConfig {
  const secret = required(environment.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET");
  if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
  const baseURL = origin(required(environment.BETTER_AUTH_URL, "BETTER_AUTH_URL"), "BETTER_AUTH_URL");
  const trustedOrigins = (environment.BETTER_AUTH_TRUSTED_ORIGINS ?? baseURL)
    .split(",")
    .map((value) => origin(value.trim(), "BETTER_AUTH_TRUSTED_ORIGINS"));
  return { databaseUrl: required(environment.DATABASE_URL, "DATABASE_URL"), secret, baseURL, trustedOrigins };
}
