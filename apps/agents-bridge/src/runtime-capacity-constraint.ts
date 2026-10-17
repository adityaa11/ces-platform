/** The authenticated external read boundary for BSS-V2-006-04-01. */
export type RuntimeCapacityConstraintReason =
  | "eligible_in_principle"
  | "temporarily_pressure_blocked"
  | "structurally_unfit"
  | "unknown_policy_blocked"
  | "inactive_or_unauthorized";

export type RuntimeCapacityConstraintPrincipal = Readonly<{
  principalId: string;
  quotaDomainId: string;
  processId: string;
  processProfileVersion: string;
  routeId: string;
  serviceClass: "background" | "interactive";
}>;

export type RuntimeCapacityConstraintAuthenticator = Readonly<{
  authenticate(credential: string): RuntimeCapacityConstraintPrincipal | null;
}>;

export type RuntimeCapacityConstraintDatabase = Readonly<{
  executeSql(statement: string, values?: readonly unknown[]): Promise<Readonly<{ rows: readonly unknown[] }>>;
}>;

export type RuntimeCapacityConstraint = Readonly<{
  apiVersion: "RuntimeCapacityConstraint/v1";
  reason: RuntimeCapacityConstraintReason;
  readIsNotSendPermit: true;
  [key: string]: unknown;
}>;

export type RuntimeCapacityConstraintRead = Readonly<{
  /** A prior opaque revision may be fenced, but callers never choose scope. */
  expectedEffectiveConstraintRevision?: string;
}>;

const blocked = (): RuntimeCapacityConstraint => ({
  apiVersion: "RuntimeCapacityConstraint/v1",
  reason: "inactive_or_unauthorized",
  readIsNotSendPermit: true,
});

/**
 * Consumers present only an opaque credential. The server resolves every
 * process, route, quota-domain, and class identity before calling the
 * read-only database projection; callers cannot select a foreign scope.
 */
export function createRuntimeCapacityConstraintReader(
  database: RuntimeCapacityConstraintDatabase,
  authenticator: RuntimeCapacityConstraintAuthenticator,
): Readonly<{ read(credential: string, request?: RuntimeCapacityConstraintRead): Promise<RuntimeCapacityConstraint> }> {
  return {
    async read(credential, request: RuntimeCapacityConstraintRead = {}) {
      const principal = authenticator.authenticate(credential);
      if (!principal) return blocked();
      try {
        const result = await database.executeSql(
          "SELECT bridge.read_runtime_capacity_constraint($1,$2,$3,$4,$5) AS snapshot",
          [principal.quotaDomainId, principal.processId, principal.processProfileVersion, principal.routeId, principal.serviceClass],
        );
        const snapshot = (result.rows[0] as { snapshot?: unknown } | undefined)?.snapshot;
        if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return blocked();
        const value = snapshot as Record<string, unknown>;
        if (value.apiVersion !== "RuntimeCapacityConstraint/v1" || value.readIsNotSendPermit !== true
          || !["eligible_in_principle", "temporarily_pressure_blocked", "structurally_unfit", "unknown_policy_blocked", "inactive_or_unauthorized"].includes(String(value.reason))) return blocked();
        if (request.expectedEffectiveConstraintRevision !== undefined
          && request.expectedEffectiveConstraintRevision !== value.effectiveConstraintRevision) {
          return { ...value, apiVersion: "RuntimeCapacityConstraint/v1", readIsNotSendPermit: true, reason: "unknown_policy_blocked", transientStatus: "stale", eligible: { background: false, interactive: false } } as RuntimeCapacityConstraint;
        }
        return value as RuntimeCapacityConstraint;
      } catch {
        // A read outage is never optimistic and never falls through to send.
        return { apiVersion: "RuntimeCapacityConstraint/v1", reason: "unknown_policy_blocked", readIsNotSendPermit: true };
      }
    },
  };
}
