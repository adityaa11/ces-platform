import { getAtlasAuthService, isWorkerAuthRuntime } from "@/lib/auth-server";
import { createAuthRouteHandler } from "@/lib/auth-route";

/** Preserve Better Auth's request and response semantics at the browser boundary. */
const handle = async (request: Request) => {
  const service = await getAtlasAuthService();
  try {
    return await createAuthRouteHandler(service.auth)(request);
  } finally {
    if (isWorkerAuthRuntime()) await service.close();
  }
};

export const GET = handle;
export const POST = handle;
