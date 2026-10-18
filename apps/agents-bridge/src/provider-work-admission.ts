import type { RuntimeCapacityConstraintPrincipal } from "./runtime-capacity-constraint.js";

export type ProviderWorkAdmissionPrincipal = RuntimeCapacityConstraintPrincipal & Readonly<{
  principalId: string;
}>;

export type ProviderWorkAdmissionRequest = Readonly<{
  logicalWorkId: string;
  attemptNumber: number;
  idempotencyKey: string;
  payloadReference: string;
  payloadHash: string;
  requestResourceEnvelope: Readonly<Record<string, number>>;
  expectedEffectiveConstraintRevision: string;
  /** Required by interactive principals; evaluated and persisted by BSS. */
  deadlineEpochMilliseconds?: number;
}>;

export type ProviderWorkAdmissionOutcome = Readonly<{
  apiVersion: "ProviderWorkAdmission/v1";
  state: "waiting" | "reserved" | "dispatched_or_may_have_started" | "terminal_success" | "terminal_cancelled" | "terminal_provider_failure" | "pressure_limited" | "policy_or_resource_unfit" | "consumer_replan_required";
  logicalWorkId?: string;
  attemptNumber?: number;
  reservationId?: string;
  jobId?: string;
}>;

export type ProviderWorkAdmissionDatabase = Readonly<{
  executeSql(statement: string, values?: readonly unknown[]): Promise<Readonly<{ rows: readonly unknown[] }>>;
}>;

export type ProviderWorkAdmissionAuthenticator = Readonly<{
  authenticate(credential: string): ProviderWorkAdmissionPrincipal | null;
}>;

const unavailable = (): ProviderWorkAdmissionOutcome => ({ apiVersion: "ProviderWorkAdmission/v1", state: "policy_or_resource_unfit" });
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function parseProviderWorkAdmissionRequest(value: unknown): ProviderWorkAdmissionRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Provider work admission request must be an object.");
  const input = value as Record<string, unknown>;
  for (const key of ["logicalWorkId", "idempotencyKey", "payloadReference", "payloadHash", "expectedEffectiveConstraintRevision"] as const) {
    if (!nonEmpty(input[key])) throw new Error(`Provider work admission request has an invalid ${key}.`);
  }
  if (!Number.isInteger(input.attemptNumber) || Number(input.attemptNumber) < 1) throw new Error("Provider work admission request has an invalid attemptNumber.");
  if (!input.requestResourceEnvelope || typeof input.requestResourceEnvelope !== "object" || Array.isArray(input.requestResourceEnvelope)) throw new Error("Provider work admission request has an invalid requestResourceEnvelope.");
  const envelope = input.requestResourceEnvelope as Record<string, unknown>;
  const dimensions = ["rpm", "tpm", "rpd", "concurrency"] as const;
  if (Object.keys(envelope).length !== dimensions.length || dimensions.some((dimension) => !Number.isInteger(envelope[dimension]) || Number(envelope[dimension]) < 1)) {
    throw new Error("Provider work admission request must provide positive integer rpm, tpm, rpd, and concurrency values.");
  }
  if (input.deadlineEpochMilliseconds !== undefined && (!Number.isInteger(input.deadlineEpochMilliseconds) || Number(input.deadlineEpochMilliseconds) < 1)) {
    throw new Error("Provider work admission request has an invalid deadlineEpochMilliseconds.");
  }
  return {
    logicalWorkId: input.logicalWorkId as string,
    attemptNumber: Number(input.attemptNumber),
    idempotencyKey: input.idempotencyKey as string,
    payloadReference: input.payloadReference as string,
    payloadHash: input.payloadHash as string,
    requestResourceEnvelope: Object.fromEntries(dimensions.map((dimension) => [dimension, Number(envelope[dimension])])),
    expectedEffectiveConstraintRevision: input.expectedEffectiveConstraintRevision as string,
    ...(input.deadlineEpochMilliseconds === undefined ? {} : { deadlineEpochMilliseconds: Number(input.deadlineEpochMilliseconds) }),
  };
}

/**
 * The public command resolves every operational identity from its authenticated
 * server registration. Callers submit only opaque logical/payload identities;
 * they cannot select a route, domain, process, workload, or service class.
 */
export function createProviderWorkAdmissionService(
  database: ProviderWorkAdmissionDatabase,
  authenticator: ProviderWorkAdmissionAuthenticator,
): Readonly<{
  admit(credential: string, request: ProviderWorkAdmissionRequest): Promise<ProviderWorkAdmissionOutcome>;
  cancel(credential: string, logicalWorkId: string, attemptNumber: number): Promise<ProviderWorkAdmissionOutcome>;
  outcome(credential: string, logicalWorkId: string, attemptNumber: number): Promise<ProviderWorkAdmissionOutcome>;
}> {
  return {
    async admit(credential, request) {
      const principal = authenticator.authenticate(credential);
      if (!principal) return unavailable();
      try {
        const result = await database.executeSql(
          "SELECT bridge.admit_provider_work_admission_v1($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb) AS outcome",
          [principal.principalId, principal.quotaDomainId, principal.processId, principal.processProfileVersion, principal.routeId, principal.serviceClass,
            request.logicalWorkId, request.attemptNumber, request.idempotencyKey, request.payloadReference, request.payloadHash,
            { requestResourceEnvelope: request.requestResourceEnvelope, expectedEffectiveConstraintRevision: request.expectedEffectiveConstraintRevision, ...(request.deadlineEpochMilliseconds === undefined ? {} : { deadlineEpochMilliseconds: request.deadlineEpochMilliseconds }) }],
        );
        const outcome = (result.rows[0] as { outcome?: unknown } | undefined)?.outcome;
        if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) return unavailable();
        const value = outcome as Record<string, unknown>;
        if (value.apiVersion !== "ProviderWorkAdmission/v1" || !["waiting", "reserved", "dispatched_or_may_have_started", "terminal_success", "terminal_cancelled", "terminal_provider_failure", "pressure_limited", "policy_or_resource_unfit", "consumer_replan_required"].includes(String(value.state))) return unavailable();
        return value as ProviderWorkAdmissionOutcome;
      } catch { return unavailable(); }
    },
    async cancel(credential, logicalWorkId, attemptNumber) {
      const principal = authenticator.authenticate(credential);
      if (!principal || !nonEmpty(logicalWorkId) || !Number.isInteger(attemptNumber) || attemptNumber < 1) return unavailable();
      try {
        const result = await database.executeSql("SELECT bridge.cancel_provider_work_admission_v1($1,$2,$3) AS outcome", [principal.principalId, logicalWorkId, attemptNumber]);
        const outcome = (result.rows[0] as { outcome?: unknown } | undefined)?.outcome;
        return outcome && typeof outcome === "object" && !Array.isArray(outcome) ? outcome as ProviderWorkAdmissionOutcome : unavailable();
      } catch { return unavailable(); }
    },
    async outcome(credential, logicalWorkId, attemptNumber) {
      const principal = authenticator.authenticate(credential);
      if (!principal || !nonEmpty(logicalWorkId) || !Number.isInteger(attemptNumber) || attemptNumber < 1) return unavailable();
      try {
        const result = await database.executeSql("SELECT bridge.read_provider_work_admission_v1_outcome($1,$2,$3) AS outcome", [principal.principalId, logicalWorkId, attemptNumber]);
        const outcome = (result.rows[0] as { outcome?: unknown } | undefined)?.outcome;
        return outcome && typeof outcome === "object" && !Array.isArray(outcome) ? outcome as ProviderWorkAdmissionOutcome : unavailable();
      } catch { return unavailable(); }
    },
  };
}
