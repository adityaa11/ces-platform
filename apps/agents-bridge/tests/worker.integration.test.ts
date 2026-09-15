import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import type { ExecutionEvent, ExecutionRequest, ReasoningRuntime } from "@atlas/contracts";
import { createTransactionalQueueProducer, parseBackgroundExecutionJob, type TransactionalQueueProducer } from "../src/queue.ts";
import { createBackgroundWorker } from "../src/worker.ts";
import { loadWorkerConfig, type WorkerConfig } from "../src/worker-config.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

const execution = (id: string): ExecutionRequest => ({
  version: "v1",
  executionId: id,
  mode: "background",
  skill: { id: "test.background", version: "1" },
  input: { prompt: "test" },
  context: { boundary: "workspace:test", items: [] },
});

const interactiveExecution = (id: string): ExecutionRequest => ({ ...execution(id), mode: "interactive" });

const waitFor = async (predicate: () => Promise<boolean>, timeoutMs = 10000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the expected queue state.");
};

test("worker configuration has bounded defaults and rejects unsafe values", () => {
  assert.deepEqual(loadWorkerConfig({ AGENTS_BRIDGE_DATABASE_URL: "postgresql://bridge@localhost/atlas" }), {
    databaseUrl: "postgresql://bridge@localhost/atlas",
    concurrency: 2,
    timeoutSeconds: 30,
    retryLimit: 2,
    retryDelaySeconds: 1,
    shutdownTimeoutMilliseconds: 15000,
  });
  assert.throws(
    () => loadWorkerConfig({ AGENTS_BRIDGE_DATABASE_URL: "postgresql://bridge@localhost/atlas", AGENTS_BRIDGE_WORKER_CONCURRENCY: "0" }),
    /AGENTS_BRIDGE_WORKER_CONCURRENCY/,
  );
  assert.throws(
    () => loadWorkerConfig({ AGENTS_BRIDGE_DATABASE_URL: "postgresql://bridge@localhost/atlas", AGENTS_BRIDGE_WORKER_SHUTDOWN_TIMEOUT_MS: "15001" }),
    /AGENTS_BRIDGE_WORKER_SHUTDOWN_TIMEOUT_MS/,
  );
  assert.throws(
    () => parseBackgroundExecutionJob({ idempotencyKey: "interactive", execution: interactiveExecution("interactive") }),
    /requires mode background/,
  );
});

test("pg-boss commits enqueueing atomically, retries idempotently, and releases work on shutdown", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasClient = postgres(atlasUrl.toString(), { max: 2 });
  const bridgeClient = postgres(bridgeUrl.toString(), { max: 4 });
  const atlasDb = drizzle(atlasClient);
  const calls = new Map<string, number>();
  const runKey = (name: string) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const queueName = runKey("bridge-background-test");
  const keys = { commit: runKey("commit"), rollback: runKey("rollback"), retry: runKey("retry"), duplicate: runKey("duplicate"), shutdown: runKey("shutdown") };
  let shutdownAbortObserved = false;
  const runtime: ReasoningRuntime = {
    async *execute(request, { signal }): AsyncIterable<ExecutionEvent> {
      const count = (calls.get(request.executionId) ?? 0) + 1;
      calls.set(request.executionId, count);
      if (request.executionId === "retry" && count === 1) throw new Error("first attempt fails");
      if (request.executionId === "shutdown") {
        await new Promise<void>((resolve) => signal.addEventListener("abort", () => { shutdownAbortObserved = true; resolve(); }, { once: true }));
        throw new Error("shutdown released the job");
      }
      yield { type: "text", text: "test" };
      yield { type: "complete" };
    },
  };
  const config: WorkerConfig = {
    databaseUrl: bridgeUrl.toString(),
    concurrency: 1,
    timeoutSeconds: 5,
    retryLimit: 1,
    retryDelaySeconds: 1,
    shutdownTimeoutMilliseconds: 1000,
  };
  let worker = createBackgroundWorker(config, runtime, queueName);
  let producer: TransactionalQueueProducer | undefined;

  try {
    await admin.unsafe("CREATE TABLE IF NOT EXISTS atlas.queue_source_probe (id text PRIMARY KEY)");
    await admin.unsafe("GRANT INSERT, SELECT ON atlas.queue_source_probe TO atlas_app");
    await admin.unsafe("DELETE FROM atlas.queue_source_probe");
    await bridgeClient.unsafe("DELETE FROM bridge.background_effects");
    await worker.start();
    producer = await createTransactionalQueueProducer(atlasUrl.toString(), queueName);

    // Queue configuration is persistent in pg-boss. Restart with a changed
    // policy to prove a deployment applies its configured bounds to the
    // existing named queue rather than silently retaining stale values.
    await worker.stop();
    const changedConfig: WorkerConfig = { ...config, retryLimit: 3, retryDelaySeconds: 2, timeoutSeconds: 6 };
    worker = createBackgroundWorker(changedConfig, runtime, queueName);
    await worker.start();
    const queue = (await bridgeClient.unsafe("SELECT retry_limit, retry_delay, retry_backoff, expire_seconds FROM pgboss.queue WHERE name = $1", [queueName]))[0];
    assert.deepEqual(queue, { retry_limit: 3, retry_delay: 2, retry_backoff: true, expire_seconds: 6 });

    await assert.rejects(
      () => producer!.enqueue(atlasDb as never, { idempotencyKey: keys.rollback, execution: interactiveExecution("producer-interactive") }),
      /requires mode background/,
    );
    await worker.boss.send(queueName, { idempotencyKey: "interactive-direct", execution: interactiveExecution("worker-interactive") }, { singletonKey: "interactive-direct" });
    await new Promise((resolve) => setTimeout(resolve, 750));
    assert.equal(calls.get("worker-interactive"), undefined);

    await atlasDb.transaction(async (transaction) => {
      await transaction.execute(sql`INSERT INTO atlas.queue_source_probe (id) VALUES ('commit')`);
      await producer!.enqueue(transaction, { idempotencyKey: keys.commit, execution: execution("commit") });
    });
    await assert.rejects(() => atlasDb.transaction(async (transaction) => {
      await transaction.execute(sql`INSERT INTO atlas.queue_source_probe (id) VALUES ('rollback')`);
      await producer!.enqueue(transaction, { idempotencyKey: keys.rollback, execution: execution("rollback") });
      throw new Error("rollback source operation");
    }), /rollback source operation/);
    await waitFor(async () => (await bridgeClient.unsafe(`SELECT COUNT(*)::int AS count FROM bridge.background_effects WHERE idempotency_key = '${keys.commit}'`))[0].count === 1);
    assert.equal((await admin.unsafe("SELECT COUNT(*)::int AS count FROM atlas.queue_source_probe WHERE id = 'commit'"))[0].count, 1);
    assert.equal((await admin.unsafe("SELECT COUNT(*)::int AS count FROM atlas.queue_source_probe WHERE id = 'rollback'"))[0].count, 0);
    assert.equal((await bridgeClient.unsafe(`SELECT COUNT(*)::int AS count FROM pgboss.job WHERE name = '${queueName}' AND data->>'idempotencyKey' = '${keys.rollback}'`))[0].count, 0);

    await worker.boss.send(queueName, { idempotencyKey: keys.retry, execution: execution("retry") }, { singletonKey: keys.retry });
    await waitFor(async () => calls.get("retry") === 2 && (await bridgeClient.unsafe(`SELECT COUNT(*)::int AS count FROM bridge.background_effects WHERE idempotency_key = '${keys.retry}'`))[0].count === 1);

    await worker.boss.send(queueName, { idempotencyKey: keys.duplicate, execution: execution("duplicate") }, { singletonKey: `${keys.duplicate}-a` });
    await worker.boss.send(queueName, { idempotencyKey: keys.duplicate, execution: execution("duplicate") }, { singletonKey: `${keys.duplicate}-b` });
    await waitFor(async () => (await bridgeClient.unsafe(`SELECT COUNT(*)::int AS count FROM bridge.background_effects WHERE idempotency_key = '${keys.duplicate}'`))[0].count === 1);
    await new Promise((resolve) => setTimeout(resolve, 750));
    assert.equal(calls.get("duplicate"), 1);

    await worker.boss.send(queueName, { idempotencyKey: keys.shutdown, execution: execution("shutdown") }, { singletonKey: keys.shutdown });
    await waitFor(async () => calls.get("shutdown") === 1);
    await worker.stop();
    assert.equal(shutdownAbortObserved, true);
  } finally {
    await worker.stop().catch(() => undefined);
    await producer?.close().catch(() => undefined);
    await admin.unsafe("DROP TABLE IF EXISTS atlas.queue_source_probe").catch(() => undefined);
    await Promise.all([admin.end(), atlasClient.end(), bridgeClient.end()]);
  }
});
