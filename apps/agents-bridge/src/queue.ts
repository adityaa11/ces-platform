import { sql } from "drizzle-orm";
import { fromDrizzle, PgBoss, type DrizzleTransactionLike } from "pg-boss";
import { parseExecutionRequest, type ExecutionRequest } from "@atlas/contracts";

export const backgroundExecutionQueue = "bridge-background-execution-v1";

export type BackgroundExecutionJob = {
  readonly idempotencyKey: string;
  readonly execution: ExecutionRequest;
};

export type TransactionalQueueProducer = {
  enqueue(transaction: DrizzleTransactionLike, job: BackgroundExecutionJob): Promise<string | null>;
  close(): Promise<void>;
};

export async function createTransactionalQueueProducer(databaseUrl: string, queueName = backgroundExecutionQueue): Promise<TransactionalQueueProducer> {
  const boss = new PgBoss({ connectionString: databaseUrl, schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false, application_name: "atlas-queue-producer" });
  await boss.start();
  return {
    async enqueue(transaction, job) {
      if (!job.idempotencyKey || job.idempotencyKey.length > 200) throw new Error("idempotencyKey must be between 1 and 200 characters.");
      const execution = parseExecutionRequest(job.execution);
      return boss.send(queueName, { idempotencyKey: job.idempotencyKey, execution }, {
        db: fromDrizzle(transaction, sql),
        singletonKey: job.idempotencyKey,
      });
    },
    async close() {
      await boss.stop({ graceful: false });
    },
  };
}

export function parseBackgroundExecutionJob(value: unknown): BackgroundExecutionJob {
  if (!value || typeof value !== "object") throw new Error("Background job payload must be an object.");
  const candidate = value as { idempotencyKey?: unknown; execution?: unknown };
  if (typeof candidate.idempotencyKey !== "string" || candidate.idempotencyKey.length < 1 || candidate.idempotencyKey.length > 200) {
    throw new Error("Background job idempotencyKey must be between 1 and 200 characters.");
  }
  return { idempotencyKey: candidate.idempotencyKey, execution: parseExecutionRequest(candidate.execution) };
}
