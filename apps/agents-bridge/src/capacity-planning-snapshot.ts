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
  /** Server-only switch for isolated BSS-V2-014-03 qualification. */
  qualificationVersion?: "v2";
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
  outputTokens?: number;
}>;

export type CapacityPlanningSnapshot = Readonly<{
  apiVersion: "CapacityPlanningSnapshot/v1" | "CapacityPlanningSnapshot/v2";
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
      // V1 sizing is the historical prospective view.  A server-bound v2
      // qualification principal instead checks complete request demand against
      // its immutable candidate without ever making that candidate active.
      const wantsProspective = principal.qualificationVersion !== "v2"
        && (request.prospective === true || request.requestBytes !== undefined || request.inputTokens !== undefined || request.outputTokens !== undefined);
      const requestBytes = positiveInteger(request.requestBytes);
      const inputTokens = positiveInteger(request.inputTokens);
      const outputTokens = positiveInteger(request.outputTokens);
      if ((request.requestBytes !== undefined && requestBytes === null)
        || (request.inputTokens !== undefined && inputTokens === null)
        || (request.outputTokens !== undefined && outputTokens === null)
        || (wantsProspective && !principal.prospective)
        || (principal.qualificationVersion === "v2" && request.prospective === true)) return blocked();
      try {
        const result = await database.executeSql(
          "SELECT bridge.read_capacity_planning_snapshot($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS snapshot",
          [principal.quotaDomainId, principal.processId, principal.processProfileVersion, principal.routeId, principal.serviceClass, wantsProspective, requestBytes, inputTokens, outputTokens, principal.qualificationVersion === "v2"],
        );
        const snapshot = (result.rows[0] as { snapshot?: unknown } | undefined)?.snapshot;
        if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return blocked();
        const value = snapshot as Record<string, unknown>;
        if ((value.apiVersion !== "CapacityPlanningSnapshot/v1" && value.apiVersion !== "CapacityPlanningSnapshot/v2") || value.readIsNotAdmissionPermit !== true
          || !["qualified", "inactive", "unknown", "unfit", "stale"].includes(String(value.status))) return blocked();
        return value as CapacityPlanningSnapshot;
      } catch {
        // A planning-read outage must never produce a usable admission signal.
        return { apiVersion: "CapacityPlanningSnapshot/v1", status: "stale", reason: "planning_snapshot_unavailable", readIsNotAdmissionPermit: true };
      }
    },
  };
}
