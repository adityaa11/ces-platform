export class AtlasAdminAccessError extends Error {
  constructor(status) {
    super(status === 401 ? "Unauthorized" : "Forbidden");
    this.status = status;
  }
}

export function createPersistedAdminAuthorizationReader() {
  return async () => null;
}

export function createAtlasAdminGuard() {
  return async () => {
    const state = globalThis.__atlasDashboardRouteHarness;
    if (["missing", "expired", "revoked", "failed-session"].includes(state.outcome)) {
      throw new AtlasAdminAccessError(401);
    }
    if (["ordinary", "unavailable"].includes(state.outcome)) {
      throw new AtlasAdminAccessError(403);
    }
    if (state.outcome === "database-failure") throw new Error("database unavailable");
    return state.identity;
  };
}
