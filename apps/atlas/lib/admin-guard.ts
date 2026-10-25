import { and, eq } from "drizzle-orm";
import { atlasAdminBootstrapState, authUser, createDatabase } from "@atlas/db";

type AtlasDatabase = ReturnType<typeof createDatabase>["db"];

export type AtlasAdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: "admin";
};

type SessionResolver = (context: { headers: Headers }) => Promise<{ user?: { id?: string | null } } | null>;
export type AdminAuthorizationReader = (userId: string) => Promise<AtlasAdminIdentity | null>;

export class AtlasAdminAccessError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? "Unauthorized" : "Forbidden");
  }
}

/**
 * Reads the two persisted prerequisites for Atlas Platform Super Admin access:
 * Better Auth's user role and AA-001's globally sealed bootstrap marker.
 */
export function createPersistedAdminAuthorizationReader(db: AtlasDatabase): AdminAuthorizationReader {
  return async (userId) => {
    const rows = await db
      .select({ id: authUser.id, email: authUser.email, name: authUser.name, role: authUser.role })
      .from(authUser)
      .innerJoin(atlasAdminBootstrapState, eq(atlasAdminBootstrapState.bootstrapKey, "atlas-platform-super-admin"))
      .where(and(
        eq(authUser.id, userId),
        eq(authUser.role, "admin"),
        eq(atlasAdminBootstrapState.state, "SEALED"),
      ));
    const identity = rows[0];
    if (!identity || identity.role !== "admin") return null;
    return { ...identity, role: "admin" };
  };
}

/**
 * The reusable server-side boundary for current and future Atlas Admin APIs.
 * Better Auth decides whether a session is valid; persisted Atlas state decides
 * whether that authenticated identity has usable Super Admin authority.
 */
export function createAtlasAdminGuard(getSession: SessionResolver, readAuthorization: AdminAuthorizationReader) {
  return async (requestHeaders: Headers): Promise<AtlasAdminIdentity> => {
    let session: Awaited<ReturnType<SessionResolver>>;
    try {
      session = await getSession({ headers: requestHeaders });
    } catch {
      throw new AtlasAdminAccessError(401);
    }
    if (!session?.user?.id) throw new AtlasAdminAccessError(401);

    const identity = await readAuthorization(session.user.id);
    if (!identity) throw new AtlasAdminAccessError(403);
    return identity;
  };
}
