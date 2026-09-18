import { atlasAuthService, auth } from "@/lib/auth-server";
import { createAuthRouteHandler } from "@/lib/auth-route";

/** Preserve Better Auth's request and response semantics at the browser boundary. */
const handle = createAuthRouteHandler(auth);

export const GET = handle;
export const POST = handle;

/** Test-only lifecycle seam for the server-owned auth service used by this route. */
export const closeMountedAuthServiceForTest = () => atlasAuthService.close();
