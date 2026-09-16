import { randomUUID } from "node:crypto";
import { PgBoss, type Db } from "pg-boss";
import type { DocumentPerceptionRequest, ReasoningRuntime } from "@atlas/contracts";
import { backgroundExecutionQueue, parseBackgroundExecutionJob } from "./queue.js";
import { documentPerceptionQueue, parseDocumentPerceptionJob } from "./perception-job.js";
import type { WorkerConfig } from "./worker-config.js";

export type BackgroundWorker = {
  start(): Promise<void>;
  stop(): Promise<void>;
  readonly boss: PgBoss;
};

/**
 * The Bridge can execute perception only through an injected bounded handoff.
 * It deliberately has no Atlas repository or cache dependency.
 */
export type DocumentPerceptionQueueHandler = (request: DocumentPerceptionRequest, signal: AbortSignal, context: { readonly idempotencyKey: string; readonly database: Db }) => Promise<void | (() => Promise<void>)>;

async function executeOnce(idempotencyKey: string, executionId: string, leaseSeconds: number, work: () => Promise<void | (() => Promise<void>)>, database: Db): Promise<void> {
  const owner = randomUUID();
  const effect = await database.executeSql(
    "INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at, started_at) VALUES ($1, $2, 'running', $3, 1, now() + make_interval(secs => $4), now()) ON CONFLICT (idempotency_key) DO UPDATE SET status = 'running', lease_owner = $3, lease_generation = bridge.background_effects.lease_generation + 1, lease_expires_at = now() + make_interval(secs => $4), started_at = now(), last_error = NULL WHERE bridge.background_effects.execution_id = EXCLUDED.execution_id AND bridge.background_effects.status <> 'completed' AND (bridge.background_effects.lease_expires_at IS NULL OR bridge.background_effects.lease_expires_at < now()) RETURNING lease_generation",
    [idempotencyKey, executionId, owner, leaseSeconds],
  );
  if (!effect.rows.length) {
    const existing = await database.executeSql("SELECT execution_id FROM bridge.background_effects WHERE idempotency_key = $1", [idempotencyKey]);
    if (existing.rows.length && (existing.rows[0] as { execution_id: string }).execution_id !== executionId) throw new Error("Background idempotency key conflicts with an existing execution identity.");
    return;
  }
  const generation = Number((effect.rows[0] as { lease_generation: number }).lease_generation);
  try { const afterCompletion = await work();
    const completed = await database.executeSql("UPDATE bridge.background_effects SET status = 'completed', completed_at = now(), lease_expires_at = NULL WHERE idempotency_key = $1 AND lease_owner = $2 AND lease_generation = $3 AND status = 'running' RETURNING idempotency_key", [idempotencyKey, owner, generation]);
    if (!completed.rows.length) throw new Error("Background execution lease was superseded.");
    if (afterCompletion) await afterCompletion();
  } catch (error) { await database.executeSql("UPDATE bridge.background_effects SET status = 'pending', lease_expires_at = now(), last_error = $4 WHERE idempotency_key = $1 AND lease_owner = $2 AND lease_generation = $3 AND status = 'running'", [idempotencyKey, owner, generation, error instanceof Error ? error.message : "Background execution failed."]); throw error; }
}

export function createBackgroundWorker(config: WorkerConfig, runtime: ReasoningRuntime, queueName = backgroundExecutionQueue, documentPerception?: DocumentPerceptionQueueHandler, perceptionQueueName = documentPerceptionQueue): BackgroundWorker {
  let stopping = false;
  const boss = new PgBoss({
    connectionString: config.databaseUrl,
    schema: "pgboss",
    application_name: "agents-bridge-worker",
    max: config.concurrency + 4,
    schedule: false,
    migrate: true,
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
      const workOptions = {
        transactional: false,
        localConcurrency: config.concurrency,
        pollingIntervalSeconds: 0.5,
      };
      await boss.work(queueName, workOptions, async ([job]) => {
        const backgroundJob = parseBackgroundExecutionJob(job.data);
        await executeOnce(backgroundJob.idempotencyKey, backgroundJob.execution.executionId, config.timeoutSeconds, async () => {
          for await (const event of runtime.execute(backgroundJob.execution, { signal: job.signal })) {
            if (job.signal.aborted) throw new Error("Background execution was cancelled.");
            if (event.type === "error") throw new Error(event.message);
          }
        }, boss.getDb());
      });
      if (documentPerception) {
        await boss.createQueue(perceptionQueueName, queueOptions);
        await boss.updateQueue(perceptionQueueName, queueOptions);
        await boss.work(perceptionQueueName, workOptions, async ([job]) => {
          const perceptionJob = parseDocumentPerceptionJob(job.data);
          await executeOnce(perceptionJob.idempotencyKey, perceptionJob.request.executionId, config.timeoutSeconds, () => documentPerception(perceptionJob.request, job.signal, { idempotencyKey: perceptionJob.idempotencyKey, database: boss.getDb() }), boss.getDb());
        });
      }
    },
    async stop() {
      stopping = true;
      await boss.stop({ graceful: true, timeout: config.shutdownTimeoutMilliseconds });
    },
  };
}
