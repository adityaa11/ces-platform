/** BSS-V2-006-05-03's authenticated, planning-only BSS-V2-005 reader. */
export type CapacityPlanningSnapshotStatus = "qualified" | "inactive" | "unknown" | "unfit" | "stale";

export type CapacityPlanningSnapshotPrincipal = Readonly<{
  principalId: string;
  quotaDomainId: string;
  processId: string;
  processProfileVersion: string;
  routeId: string;
  serviceClass: "background" | "interactive";
  /** This registration may request sizing while its route remains inactive. */
  prospective: boolean;
}>;

export type CapacityPlanningSnapshotDatabase = Readonly<{
  executeSql(statement: string, values?: readonly unknown[]): Promise<Readonly<{ rows: readonly unknown[] }>>;
}>;

export type CapacityPlanningSnapshotAuthenticator = Readonly<{
  authenticate(credential: string): CapacityPlanningSnapshotPrincipal | null;
}>;

export type CapacityPlanningSnapshotRead = Readonly<{
  prospective?: boolean;
  requestBytes?: number;
  inputTokens?: number;
}>;

export type CapacityPlanningSnapshot = Readonly<{
  apiVersion: "CapacityPlanningSnapshot/v1";
  status: CapacityPlanningSnapshotStatus;
  readIsNotAdmissionPermit: true;
  [key: string]: unknown;
}>;

const blocked = (): CapacityPlanningSnapshot => ({
  apiVersion: "CapacityPlanningSnapshot/v1", status: "inactive", reason: "inactive_or_unauthorized", readIsNotAdmissionPermit: true,
});

function positiveInteger(value: number | undefined): number | null {
  return value === undefined ? null : Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/**
 * Resolves all capacity scope from the server-authenticated principal.  The
 * caller can ask only for a bounded prospective sizing view; it cannot choose
 * a domain, profile, route, policy, or activation revision.
 */
export function createCapacityPlanningSnapshotReader(
  database: CapacityPlanningSnapshotDatabase,
  authenticator: CapacityPlanningSnapshotAuthenticator,
): Readonly<{ read(credential: string, request?: CapacityPlanningSnapshotRead): Promise<CapacityPlanningSnapshot> }> {
  return {
    async read(credential, request: CapacityPlanningSnapshotRead = {}) {
      const principal = authenticator.authenticate(credential);
      if (!principal) return blocked();
      const wantsProspective = request.prospective === true || request.requestBytes !== undefined || request.inputTokens !== undefined;
      const requestBytes = positiveInteger(request.requestBytes);
      const inputTokens = positiveInteger(request.inputTokens);
      if ((request.requestBytes !== undefined && requestBytes === null)
        || (request.inputTokens !== undefined && inputTokens === null)
        || (wantsProspective && !principal.prospective)) return blocked();
      try {
        const result = await database.executeSql(
          "SELECT bridge.read_capacity_planning_snapshot($1,$2,$3,$4,$5,$6,$7,$8) AS snapshot",
          [principal.quotaDomainId, principal.processId, principal.processProfileVersion, principal.routeId, principal.serviceClass, wantsProspective, requestBytes, inputTokens],
        );
        const snapshot = (result.rows[0] as { snapshot?: unknown } | undefined)?.snapshot;
        if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return blocked();
        const value = snapshot as Record<string, unknown>;
        if (value.apiVersion !== "CapacityPlanningSnapshot/v1" || value.readIsNotAdmissionPermit !== true
          || !["qualified", "inactive", "unknown", "unfit", "stale"].includes(String(value.status))) return blocked();
        return value as CapacityPlanningSnapshot;
      } catch {
        // A planning-read outage must never produce a usable admission signal.
        return { apiVersion: "CapacityPlanningSnapshot/v1", status: "stale", reason: "planning_snapshot_unavailable", readIsNotAdmissionPermit: true };
      }
    },
  };
}
