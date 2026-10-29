import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { parseDocumentPerceptionJob, documentPerceptionQueue, type DocumentPerceptionJob } from "./perception-job.js";
import { fromDrizzle, PgBoss, type DrizzleTransactionLike } from "pg-boss";
import { parseExecutionRequest, type ExecutionRequest } from "@atlas/contracts";

export const backgroundExecutionQueue = "bridge-background-execution-v1";
export const genericHandoffQueue = "atlas-generic-handoff-v1";

export type BackgroundExecutionJob = {
  readonly idempotencyKey: string;
  readonly execution: ExecutionRequest;
};

/** The GHR producer publishes an opaque pointer only.  Delivery, receipts,
 * leases, and all payload loading remain owned by the later Bridge slice. */
export type GenericHandoffJobV1 = {
  readonly handoffId: string;
};

/** Producer-only metadata. The idempotency key is pg-boss metadata, never
 * part of the pointer job payload consumed by GHR-03B. */
export type GenericHandoffQueuePublish = GenericHandoffJobV1 & Readonly<{
  readonly idempotencyKey: string;
}>;

/**
 * pg-boss's Drizzle adapter only needs a client with `unsafe()` and driver
 * codecs. A postgres.js transaction scope has the former but deliberately
 * does not expose the root client's mutable `options` object. Supplying an
 * isolated codec bag keeps pg-boss on that same transaction connection while
 * preventing Drizzle setup from mutating the caller's JSON serializers.
 */
function drizzleTransaction(transaction: unknown): DrizzleTransactionLike {
  const candidate = transaction as {
    unsafe?: (query: string, params?: readonly unknown[]) => unknown;
    session?: { client?: { unsafe?: (query: string, params?: readonly unknown[]) => unknown } };
  };
  // Queue producers are called from a Drizzle transaction. Its postgres.js
  // client remains on the session, so unwrap only that client and retain the
  // caller's transaction connection for pg-boss's enqueue statement.
  const client = typeof candidate.unsafe === "function" ? candidate : candidate.session?.client;
  if (!client || typeof client.unsafe !== "function") throw new Error("Transactional queue requires a postgres.js transaction client.");
  const unsafe = client.unsafe.bind(client);
  const options = { parsers: {} as Record<string, unknown>, serializers: {} as Record<string, unknown> };
  const adapter = new Proxy(client, {
    get(target, property, receiver) {
      if (property === "options") return options;
      if (property === "unsafe") return (query: string, params: readonly unknown[] = []) => unsafe(query, params);
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

/** Legacy producer retained for database acceptance fixtures; no production
 * Bridge worker consumes this queue after the semantic/background route cut. */
export type TransactionalQueueProducer = {
  enqueue(transaction: DrizzleTransactionLike, job: BackgroundExecutionJob): Promise<string | null>;
  close(): Promise<void>;
};

export type TransactionalGenericHandoffQueueProducer = {
  enqueue(transaction: unknown, job: GenericHandoffQueuePublish): Promise<string | null>;
  close(): Promise<void>;
};

export async function createTransactionalGenericHandoffQueueProducer(databaseUrl: string, queueName = genericHandoffQueue): Promise<TransactionalGenericHandoffQueueProducer> {
  const boss = new PgBoss({ connectionString: databaseUrl, schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false, application_name: "atlas-generic-handoff-producer" });
  await boss.start();
  return {
    async enqueue(transaction, job) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(job.handoffId) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(job.idempotencyKey)) throw new Error("Generic handoff job identity is invalid.");
      return boss.send(queueName, { type: "GenericHandoffJob/v1", handoffId: job.handoffId }, {
        db: fromDrizzle(drizzleTransaction(transaction), sql),
        singletonKey: job.idempotencyKey,
      });
    },
    async close() { await boss.stop({ graceful: false }); },
  };
}
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
      return boss.send(queueName, { idempotencyKey: job.idempotencyKey, execution }, { db: fromDrizzle(drizzleTransaction(transaction), sql), singletonKey: job.idempotencyKey });
    },
    async close() { await boss.stop({ graceful: false }); },
  };
}

