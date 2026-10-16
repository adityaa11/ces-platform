import type { Db } from "pg-boss";

/** The payload is an opaque durable wakeup identity, never work content. */
export type ProviderWakeupJob = Readonly<{ quotaDomainId: string; wakeupKey: string }>;

export type ProviderWakeupContext = Readonly<{ database: Db; signal: AbortSignal }>;
export type ProviderWakeupHandler = (job: ProviderWakeupJob, context: ProviderWakeupContext) => Promise<void>;

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function parseProviderWakeupJob(value: unknown): ProviderWakeupJob {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Provider wakeup job must be an object.");
  const job = value as Record<string, unknown>;
  if (!nonEmpty(job.quotaDomainId) || !nonEmpty(job.wakeupKey)) throw new Error("Provider wakeup job has an invalid durable identity.");
  return { quotaDomainId: job.quotaDomainId, wakeupKey: job.wakeupKey };
}

/** Claims and consumes exactly one durable activation wakeup. SQL owns the
 * revalidation fence and intent derivation so replay cannot create another
 * effective dispatch or publish a plan. */
export const createProviderWakeupHandler = (): ProviderWakeupHandler => async (job, { database }) => {
  await database.executeSql("SELECT bridge.consume_active_plan_wakeup($1,$2)", [job.quotaDomainId, job.wakeupKey]);
};
