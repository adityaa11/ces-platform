import { AtlasAdminAccessError, createAtlasAdminGuard, createPersistedAdminAuthorizationReader, type AdminAuthorizationReader } from "@/lib/admin-guard";
import { getAtlasAuthService, isWorkerAuthRuntime } from "@/lib/auth-server";

type SessionResolver = (context: { headers: Headers }) => Promise<{ user?: { id?: string | null } } | null>;

export function createAdminIdentityHandler(getSession: SessionResolver, readAuthorization: AdminAuthorizationReader) {
  const requireAtlasAdmin = createAtlasAdminGuard(getSession, readAuthorization);
  return async (request: Request) => {
    try {
      const identity = await requireAtlasAdmin(request.headers);
      return Response.json({ user: { id: identity.id, email: identity.email, name: identity.name }, role: identity.role });
    } catch (error) {
      if (error instanceof AtlasAdminAccessError) return Response.json({ error: error.message }, { status: error.status });
      throw error;
    }
  };
}

export async function GET(request: Request) {
  const service = await getAtlasAuthService();
  try {
    return await createAdminIdentityHandler(service.auth.api.getSession, createPersistedAdminAuthorizationReader(service.db))(request);
  } finally {
    if (isWorkerAuthRuntime()) await service.close();
  }
}
