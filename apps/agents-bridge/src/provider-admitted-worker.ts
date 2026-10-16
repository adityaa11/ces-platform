import type { Db } from "pg-boss";

/**
 * The only payload carried by the provider-admission queue.  Content, prompts,
 * credentials, and provider responses never cross this boundary.
 */
export type ProviderAdmittedJob = Readonly<{
  logicalWorkId: string;
  attemptNumber: number;
  reservationId: string;
}>;

export type ProviderAdmittedExecutionContext = Readonly<{
  database: Db;
  signal: AbortSignal;
}>;

/**
 * Implemented by the BSS operational composition root.  It must claim the
 * persisted reservation before invoking its single outbound transport port and
 * submit the resulting normalized operational feedback through the same
 * database ingress.  The generic pg-boss worker intentionally knows neither
 * provider semantics nor accounting rules.
 */
export type ProviderAdmittedExecutionHandler = (
  job: ProviderAdmittedJob,
  context: ProviderAdmittedExecutionContext,
) => Promise<void>;

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function parseProviderAdmittedJob(value: unknown): ProviderAdmittedJob {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Provider admitted job must be an object.");
  const job = value as Record<string, unknown>;
  if (!isNonEmptyString(job.logicalWorkId) || !Number.isInteger(job.attemptNumber) || Number(job.attemptNumber) < 1 || !isNonEmptyString(job.reservationId)) {
    throw new Error("Provider admitted job has an invalid durable identity.");
  }
  return { logicalWorkId: job.logicalWorkId, attemptNumber: Number(job.attemptNumber), reservationId: job.reservationId };
}
