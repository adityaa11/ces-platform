import { createAtlasAuthFromEnvironment } from "@atlas/auth";

/** The sole Atlas application instance of the approved Better Auth service. */
export const atlasAuthService = createAtlasAuthFromEnvironment();
export const auth = atlasAuthService.auth;
