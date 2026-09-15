import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { authAccount, authSession, authUser, authVerification, createDatabase } from "@atlas/db";
import { loadAtlasAuthConfig, type AtlasAuthConfig, type AtlasAuthEnvironment } from "./config.js";

export { loadAtlasAuthConfig, type AtlasAuthConfig, type AtlasAuthEnvironment } from "./config.js";

/** Creates the identity-only Better Auth boundary; it owns no Atlas authorization data. */
export function createAtlasAuth(config: AtlasAuthConfig) {
  const database = createDatabase(config.databaseUrl);
  return {
    auth: betterAuth({
      baseURL: config.baseURL,
      secret: config.secret,
      trustedOrigins: config.trustedOrigins,
      database: drizzleAdapter(database.db, {
        provider: "pg",
        camelCase: true,
        schema: { user: authUser, session: authSession, account: authAccount, verification: authVerification },
      }),
      emailAndPassword: { enabled: true },
    }),
    close: database.close,
  };
}

export function createAtlasAuthFromEnvironment(environment?: AtlasAuthEnvironment) {
  // The config loader reads the runtime environment only when it is not supplied.
  if (!environment) return createAtlasAuth(loadAtlasAuthConfig());
  return createAtlasAuth(loadAtlasAuthConfig(environment));
}
