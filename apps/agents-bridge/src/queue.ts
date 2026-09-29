import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { parseDocumentPerceptionJob, documentPerceptionQueue, type DocumentPerceptionJob } from "./perception-job.js";
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

/**
 * pg-boss's Drizzle adapter only needs a client with `unsafe()` and driver
 * codecs. A postgres.js transaction scope has the former but deliberately
 * does not expose the root client's mutable `options` object. Supplying an
 * isolated codec bag keeps pg-boss on that same transaction connection while
 * preventing Drizzle setup from mutating the caller's JSON serializers.
 */
function drizzleTransaction(transaction: unknown): DrizzleTransactionLike {
  const client = transaction as { unsafe(query: string, params?: readonly unknown[]): unknown };
  const options = { parsers: {} as Record<string, unknown>, serializers: {} as Record<string, unknown> };
  const adapter = new Proxy(client, {
    get(target, property, receiver) {
      if (property === "options") return options;
      if (property === "unsafe") return (query: string, params: readonly unknown[] = []) => target.unsafe(query, params);
      return Reflect.get(target, property, receiver);
    },
  });
  return drizzle(adapter as never) as DrizzleTransactionLike;
}

/** IDSER-003 adapter: pg-boss receives the caller's postgres.js transaction,
 * so the initial perception job can never commit separately from Atlas state. */
export type TransactionalPerceptionQueueProducer = {
  enqueue(transaction: unknown, job: DocumentPerceptionJob): Promise<string | null>;
  close(): Promise<void>;
};

export async function createTransactionalPerceptionQueueProducer(databaseUrl: string, queueName = documentPerceptionQueue): Promise<TransactionalPerceptionQueueProducer> {
  const boss = new PgBoss({ connectionString: databaseUrl, schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false, application_name: "atlas-perception-kickoff-producer" });
  await boss.start();
  return {
    async enqueue(transaction, job) {
      const parsed = parseDocumentPerceptionJob(job);
      return boss.send(queueName, parsed, { db: fromDrizzle(drizzleTransaction(transaction), sql), singletonKey: parsed.idempotencyKey });
    },
    async close() { await boss.stop({ graceful: false }); },
  };
}

export async function createTransactionalQueueProducer(databaseUrl: string, queueName = backgroundExecutionQueue): Promise<TransactionalQueueProducer> {
  const boss = new PgBoss({ connectionString: databaseUrl, schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false, application_name: "atlas-queue-producer" });
  await boss.start();
  return {
    async enqueue(transaction, job) {
      if (!job.idempotencyKey || job.idempotencyKey.length > 200) throw new Error("idempotencyKey must be between 1 and 200 characters.");
      const execution = parseExecutionRequest(job.execution);
      if (execution.mode !== "background") throw new Error("Background queue requires mode background.");
      return boss.send(queueName, { idempotencyKey: job.idempotencyKey, execution }, {
        // Atlas adapters use postgres.js transactions; pg-boss's Drizzle
        // bridge must receive the corresponding Drizzle transaction wrapper.
        db: fromDrizzle(drizzleTransaction(transaction), sql),
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
  const execution = parseExecutionRequest(candidate.execution);
  if (execution.mode !== "background") throw new Error("Background queue requires mode background.");
  return { idempotencyKey: candidate.idempotencyKey, execution };
}
