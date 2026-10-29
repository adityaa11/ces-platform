import { randomUUID } from "node:crypto";
import { PgBoss, type Db } from "pg-boss";
import type { DocumentPerceptionRequest } from "@atlas/contracts";
import { genericHandoffQueue } from "./queue.js";
import { documentPerceptionQueue, parseDocumentPerceptionJob } from "./perception-job.js";
import type { WorkerConfig } from "./worker-config.js";
import { deliverGenericHandoffJob } from "./ghr/delivery-worker.js";
import type { GenericHandoffHttpTransportConfig } from "./ghr/http-transport-config.js";

export type BackgroundWorker = {
  start(): Promise<void>;
  stop(): Promise<void>;
  readonly boss: PgBoss;
};

/**
 * Bridge owns pg-boss tables and the deliberately narrow Atlas queue grants.
 * Compose invokes this before Atlas opens its transactional producer, and the
 * long-running worker reapplies it at every start so its effective queue
 * policy remains observable and durable.
 */
export async function initializePgBossInfrastructure(boss: PgBoss, config: WorkerConfig, perceptionQueueName = documentPerceptionQueue, includePerceptionQueue = true): Promise<void> {
  const queueOptions = {
    retryLimit: config.retryLimit,
    retryDelay: config.retryDelaySeconds,
    retryBackoff: true,
    expireInSeconds: config.timeoutSeconds,
  };
  if (includePerceptionQueue) {
    await boss.createQueue(perceptionQueueName, queueOptions);
    await boss.updateQueue(perceptionQueueName, queueOptions);
  }
  // GHR-03B owns the sole consumer. Its handler loads only the known pointer
  // through the narrow dispatch function and never accepts queue JSON as
  // routing or body authority.
  await boss.createQueue(genericHandoffQueue, queueOptions);
  await boss.updateQueue(genericHandoffQueue, queueOptions);
  await boss.getDb().executeSql("GRANT SELECT ON TABLE pgboss.version, pgboss.queue TO atlas_app");
  // pg-boss 12 routes active queues through the partitioned `job` table;
  // `job_common` remains present for compatibility. Its transactional send
  // plan reads the relation while resolving a singleton insert, so Atlas gets
  // read/insert access only--never queue management or job lifecycle writes.
  await boss.getDb().executeSql("GRANT INSERT ON TABLE pgboss.job, pgboss.job_common TO atlas_app");
  await boss.getDb().executeSql("GRANT SELECT ON TABLE pgboss.job TO atlas_app");
  await boss.getDb().executeSql("GRANT SELECT (id) ON TABLE pgboss.job, pgboss.job_common TO atlas_app");
}

/**
 * The Bridge can execute perception only through an injected bounded handoff.
 * It deliberately has no Atlas repository or cache dependency.
 */
export type DocumentPerceptionQueueHandler = (request: DocumentPerceptionRequest, signal: AbortSignal, context: { readonly idempotencyKey: string; readonly database: Db; readonly finalAttempt: boolean }) => Promise<void>;

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function executeOnce(idempotencyKey: string, executionId: string, leaseSeconds: number, work: (lease: { readonly owner: string; readonly generation: number }) => Promise<void>, database: Db, afterCompletion?: (lease: { readonly owner: string; readonly generation: number }) => Promise<void>): Promise<void> {
  const owner = randomUUID();
  const effect = await database.executeSql(
    "INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at, started_at) VALUES ($1, $2, 'running', $3, 1, now() + make_interval(secs => $4), now()) ON CONFLICT (idempotency_key) DO UPDATE SET status = 'running', lease_owner = $3, lease_generation = bridge.background_effects.lease_generation + 1, lease_expires_at = now() + make_interval(secs => $4), started_at = now(), last_error = NULL WHERE bridge.background_effects.execution_id = EXCLUDED.execution_id AND bridge.background_effects.status <> 'completed' AND (bridge.background_effects.lease_expires_at IS NULL OR bridge.background_effects.lease_expires_at < now()) RETURNING lease_generation",
    [idempotencyKey, executionId, owner, leaseSeconds],
  );
  if (!effect.rows.length) {
    const existing = await database.executeSql("SELECT execution_id, status, lease_owner, lease_generation, GREATEST(0, CEIL(EXTRACT(EPOCH FROM lease_expires_at - now()) * 1000))::int AS retry_after_ms FROM bridge.background_effects WHERE idempotency_key = $1", [idempotencyKey]);
    const current = existing.rows[0] as { execution_id: string; status: string; lease_owner: unknown; lease_generation: unknown; retry_after_ms: unknown } | undefined;
    if (current && current.execution_id !== executionId) throw new Error("Background idempotency key conflicts with an existing execution identity.");
    // Completion can commit before replay cleanup. If cleanup then faults, a
    // pg-boss retry must use the completed claimant's persisted fence rather
    // than treating the already-completed effect as a no-op forever.
    if (current?.status === "completed" && afterCompletion && typeof current.lease_owner === "string" && Number.isInteger(Number(current.lease_generation))) {
      await afterCompletion({ owner: current.lease_owner, generation: Number(current.lease_generation) });
    }
    // pg-boss can retry a job after a worker restart before that worker's
    // durable execution lease expires. Treating that early replay as success
    // strands the effect once the lease later expires: pg-boss has no job
    // left to reclaim it. Wait only for the authoritative lease window, then
    // claim through the same fenced INSERT/UPDATE path. A live predecessor
    // can still complete first, in which case the recursive call is a no-op.
    if (current?.status === "running" && Number.isSafeInteger(Number(current.retry_after_ms)) && Number(current.retry_after_ms) > 0) {
      await wait(Number(current.retry_after_ms) + 25);
      await executeOnce(idempotencyKey, executionId, leaseSeconds, work, database, afterCompletion);
    }
    return;
  }
  const generation = Number((effect.rows[0] as { lease_generation: number }).lease_generation);
  const lease = { owner, generation } as const;
  try { await work(lease);
    const completed = await database.executeSql("UPDATE bridge.background_effects SET status = 'completed', completed_at = now(), lease_expires_at = NULL WHERE idempotency_key = $1 AND lease_owner = $2 AND lease_generation = $3 AND status = 'running' RETURNING idempotency_key", [idempotencyKey, owner, generation]);
    if (!completed.rows.length) throw new Error("Background execution lease was superseded.");
    if (afterCompletion) await afterCompletion(lease);
  } catch (error) {
    const released = await database.executeSql("UPDATE bridge.background_effects SET status = 'pending', lease_expires_at = now(), last_error = $4 WHERE idempotency_key = $1 AND lease_owner = $2 AND lease_generation = $3 AND status = 'running' RETURNING idempotency_key", [idempotencyKey, owner, generation, error instanceof Error ? error.message : "Background execution failed."]);
    // `afterCompletion` runs after the fenced status update. A cleanup fault
    // therefore cannot be released as ordinary pending work; its effect is
    // already complete. Retry that cleanup with the exact completed fence.
    if (!released.rows.length && afterCompletion) {
      const completed = await database.executeSql("SELECT idempotency_key FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2 AND status='completed' AND lease_owner=$3 AND lease_generation=$4", [idempotencyKey, executionId, owner, generation]);
      if (completed.rows.length) { await afterCompletion(lease); return; }
    }
    throw error;
  }
}

export function createBackgroundWorker(config: WorkerConfig, documentPerception?: DocumentPerceptionQueueHandler, genericHandoffHttpTransport?: GenericHandoffHttpTransportConfig, perceptionQueueName = documentPerceptionQueue): BackgroundWorker {
  let stopping = false;
  const shutdown = new AbortController();
  const boss = new PgBoss({
    connectionString: config.databaseUrl,
    schema: "pgboss",
    application_name: "agents-bridge-worker",
    max: Math.max(config.backgroundConcurrency, config.perceptionConcurrency) + 4,
    schedule: false,
    migrate: true,
    createSchema: false,
  });
  boss.on("error", (error) => { if (!stopping) console.error("Agents Bridge worker error", error); });
  return {
    boss,
    async start() {
      await boss.start();
      await initializePgBossInfrastructure(boss, config, perceptionQueueName, Boolean(documentPerception));
      const workOptions = {
        transactional: false,
        includeMetadata: true as const,
        localConcurrency: config.backgroundConcurrency,
        pollingIntervalSeconds: 0.5,
      };
      await boss.work(genericHandoffQueue, workOptions, async ([job]) => {
        await deliverGenericHandoffJob({
          database: boss.getDb(),
          job: job.data,
          leaseSeconds: config.timeoutSeconds,
          finalAttempt: job.retryCount >= job.retryLimit,
          httpTransportConfiguration: genericHandoffHttpTransport,
        });
      });
      if (documentPerception) {
        const perceptionWorkOptions = { ...workOptions, localConcurrency: config.perceptionConcurrency };
        await boss.work(perceptionQueueName, perceptionWorkOptions, async ([job]) => {
          const perceptionJob = parseDocumentPerceptionJob(job.data);
          const cleanup = () => boss.getDb().executeSql("DELETE FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1 AND execution_id=$2", [perceptionJob.idempotencyKey, perceptionJob.request.executionId]).then(() => undefined);
          await executeOnce(perceptionJob.idempotencyKey, perceptionJob.request.executionId, config.timeoutSeconds, () => documentPerception(perceptionJob.request, job.signal, { idempotencyKey: perceptionJob.idempotencyKey, database: boss.getDb(), finalAttempt: job.retryCount >= job.retryLimit }), boss.getDb(), cleanup);
        });
      }
    },
    async stop() {
      stopping = true;
      shutdown.abort();
      await boss.stop({ graceful: true, timeout: config.shutdownTimeoutMilliseconds });
    },
  };
}
