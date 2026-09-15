import { PgBoss, type Db } from "pg-boss";
import type { ReasoningRuntime } from "@atlas/contracts";
import { backgroundExecutionQueue, parseBackgroundExecutionJob } from "./queue.js";
import type { WorkerConfig } from "./worker-config.js";

export type BackgroundWorker = {
  start(): Promise<void>;
  stop(): Promise<void>;
  readonly boss: PgBoss;
};

async function executeOnce(runtime: ReasoningRuntime, data: unknown, signal: AbortSignal, transaction: Db): Promise<void> {
  const job = parseBackgroundExecutionJob(data);
  const effect = await transaction.executeSql(
    "INSERT INTO bridge.background_effects (idempotency_key, execution_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING idempotency_key",
    [job.idempotencyKey, job.execution.executionId],
  );
  if (!effect.rows.length) return;
  for await (const event of runtime.execute(job.execution, { signal })) {
    if (signal.aborted) throw new Error("Background execution was cancelled.");
    if (event.type === "error") throw new Error(event.message);
  }
}

export function createBackgroundWorker(config: WorkerConfig, runtime: ReasoningRuntime, queueName = backgroundExecutionQueue): BackgroundWorker {
  let stopping = false;
  const boss = new PgBoss({
    connectionString: config.databaseUrl,
    schema: "pgboss",
    application_name: "agents-bridge-worker",
    max: config.concurrency + 4,
    schedule: false,
    createSchema: false,
  });
  boss.on("error", (error) => { if (!stopping) console.error("Agents Bridge worker error", error); });
  return {
    boss,
    async start() {
      await boss.start();
      const queueOptions = {
        retryLimit: config.retryLimit,
        retryDelay: config.retryDelaySeconds,
        retryBackoff: true,
        expireInSeconds: config.timeoutSeconds,
      };
      await boss.createQueue(queueName, queueOptions);
      // createQueue deliberately preserves an existing queue. Reapply policy on
      // every worker start so deployed configuration changes are effective.
      await boss.updateQueue(queueName, queueOptions);
      await boss.getDb().executeSql("GRANT SELECT ON TABLE pgboss.version, pgboss.queue TO atlas_app");
      await boss.getDb().executeSql("GRANT INSERT ON TABLE pgboss.job_common TO atlas_app");
      await boss.getDb().executeSql("GRANT SELECT (id) ON TABLE pgboss.job_common TO atlas_app");
      await boss.work(queueName, {
        transactional: true,
        localConcurrency: config.concurrency,
        pollingIntervalSeconds: 0.5,
        transactionTimeoutSeconds: config.timeoutSeconds,
      }, async ([job], transaction) => executeOnce(runtime, job.data, job.signal, transaction));
    },
    async stop() {
      stopping = true;
      await boss.stop({ graceful: true, timeout: config.shutdownTimeoutMilliseconds });
    },
  };
}
