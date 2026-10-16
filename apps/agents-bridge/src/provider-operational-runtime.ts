import { randomUUID } from "node:crypto";
import type { Db } from "pg-boss";
import type { ProviderAdmittedExecutionHandler, ProviderAdmittedJob } from "./provider-admitted-worker.js";
import type { AtlasCapability } from "./route-registry.js";

export type QualifiedRouteResolver = Readonly<{
  resolve(capability: AtlasCapability): Readonly<{
    routeId: string;
    capability: AtlasCapability;
    adapterVersion: string;
    qualificationVersion: string;
  }>;
}>;

type SqlExecutor = Pick<Db, "executeSql">;

type ClaimedTransport = Readonly<{
  logicalWorkId: string;
  attemptNumber: number;
  reservationId: string;
  routeId: string;
  capability: string;
  adapterVersion: string;
  qualificationVersion: string;
  quotaDomainId: string;
  desiredProfileVersion: string;
}>;

export type ProviderOperationalOutcome = Readonly<{
  feedbackId?: string;
  transportDisposition: "terminal_confirmed" | "may_have_started" | "definitely_not_sent";
  usage?: Readonly<{ rpm?: number; tpm?: number; rpd?: number }>;
}>;

/** This is the only replaceable dependency in the admitted-worker path. */
export type ProviderOutboundTransport = (input: Readonly<{
  routeId: string;
  capability: string;
  adapterVersion: string;
  qualificationVersion: string;
  /** BSS-03A has no source/prompt authority; this is deliberately content-free. */
  payloadReference: Readonly<{ kind: "bss-v2-006-03a-operational-fixture" }>;
  signal: AbortSignal;
}>) => Promise<ProviderOperationalOutcome>;

/**
 * Bind an attempt from the configured, server-owned resolver.  Callers never
 * supply a route ID, adapter version, or qualification identity: the attempt's
 * persisted process capability selects the one route the registry permits.
 */
export async function bindProviderWorkRouteFromResolver(
  database: SqlExecutor,
  resolver: QualifiedRouteResolver,
  input: Readonly<{ logicalWorkId: string; attemptNumber: number }>,
): Promise<void> {
  const attempt = await database.executeSql(
    `SELECT process.capability
       FROM bridge.provider_work_attempt work
       JOIN bridge.provider_process_profile process
         ON process.process_id=work.process_id
        AND process.profile_version=work.process_profile_version
      WHERE work.logical_work_id=$1 AND work.attempt_number=$2`,
    [input.logicalWorkId, input.attemptNumber],
  );
  const capability = (attempt.rows[0] as { capability?: unknown } | undefined)?.capability;
  if (typeof capability !== "string") throw new Error("Provider work attempt has no server-authorized capability.");
  const route = resolver.resolve(capability as AtlasCapability);
  if (route.capability !== capability) throw new Error("Qualified route resolver returned a mismatched capability.");
  await database.executeSql(
    "SELECT bridge.publish_qualified_provider_route_authority($1,$2,$3,$4)",
    [route.routeId, route.capability, route.adapterVersion, route.qualificationVersion],
  );
  await database.executeSql(
    "SELECT bridge.bind_provider_work_route($1,$2,$3)",
    [input.logicalWorkId, input.attemptNumber, route.routeId],
  );
}

const claim = async (database: Db, reservationId: string): Promise<ClaimedTransport> => {
  const result = await database.executeSql("SELECT bridge.claim_provider_admitted_transport($1) AS claimed", [reservationId]);
  const value = (result.rows[0] as { claimed?: unknown } | undefined)?.claimed;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Provider transport claim did not return a bounded route identity.");
  const route = value as Record<string, unknown>;
  if (!["logicalWorkId", "attemptNumber", "reservationId", "routeId", "capability", "adapterVersion", "qualificationVersion", "quotaDomainId", "desiredProfileVersion"].every((key) => typeof route[key] === "string" || (key === "attemptNumber" && Number.isInteger(route[key])))) throw new Error("Provider transport claim returned invalid route metadata.");
  return route as unknown as ClaimedTransport;
};

const ingress = async (database: Db, claimed: ClaimedTransport, outcome: ProviderOperationalOutcome): Promise<void> => {
  await database.executeSql("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [JSON.stringify({
    feedbackId: outcome.feedbackId ?? randomUUID(),
    reservationId: claimed.reservationId,
    attemptId: `${claimed.logicalWorkId}:${claimed.attemptNumber}`,
    routeId: claimed.routeId,
    quotaDomainId: claimed.quotaDomainId,
    desiredProfileVersion: claimed.desiredProfileVersion,
    qualificationVersion: claimed.qualificationVersion,
    observationSource: "qualified_adapter",
    observationTrust: "qualified",
    observedAt: new Date().toISOString(),
    transportDisposition: outcome.transportDisposition,
    ...(outcome.usage ? { usage: outcome.usage } : {}),
  })]);
};

/**
 * Single BSS-owned admitted-job execution path.  A thrown outbound error is
 * conservatively persisted as may-have-started: it can never cause a replay
 * to issue another send for the same reservation.
 */
export function createProviderAdmittedExecutionHandler(transport: ProviderOutboundTransport): ProviderAdmittedExecutionHandler {
  return async (job: ProviderAdmittedJob, { database, signal }) => {
    const claimed = await claim(database, job.reservationId);
    if (claimed.logicalWorkId !== job.logicalWorkId || claimed.attemptNumber !== job.attemptNumber || claimed.reservationId !== job.reservationId) throw new Error("Admitted job identity does not match its durable reservation claim.");
    try {
      const outcome = await transport({ routeId: claimed.routeId, capability: claimed.capability, adapterVersion: claimed.adapterVersion, qualificationVersion: claimed.qualificationVersion, payloadReference: { kind: "bss-v2-006-03a-operational-fixture" }, signal });
      await ingress(database, claimed, outcome);
    } catch (error) {
      await ingress(database, claimed, { transportDisposition: "may_have_started" });
      throw error;
    }
  };
}
