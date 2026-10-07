export type WorkerConfig = {
  readonly databaseUrl: string;
  /** Unrelated background/provider work. It must not consume local Docling slots. */
  readonly backgroundConcurrency: number;
  /** The only Bridge limit for Atlas local document perception. */
  readonly perceptionConcurrency: number;
  readonly timeoutSeconds: number;
  readonly retryLimit: number;
  readonly retryDelaySeconds: number;
  readonly shutdownTimeoutMilliseconds: number;
};

function boundedInteger(value: string | undefined, fallback: number, name: string, minimum: number, maximum: number): number {
  const result = Number(value ?? fallback);
  if (!Number.isInteger(result) || result < minimum || result > maximum) throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  return result;
}

export function loadWorkerConfig(environment: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const databaseUrl = environment.AGENTS_BRIDGE_DATABASE_URL;
  if (!databaseUrl) throw new Error("AGENTS_BRIDGE_DATABASE_URL is required for the Bridge worker.");
  return {
    databaseUrl,
    backgroundConcurrency: boundedInteger(environment.AGENTS_BRIDGE_BACKGROUND_WORKER_CONCURRENCY, 1, "AGENTS_BRIDGE_BACKGROUND_WORKER_CONCURRENCY", 1, 16),
    perceptionConcurrency: boundedInteger(environment.AGENTS_BRIDGE_PERCEPTION_WORKER_CONCURRENCY, 2, "AGENTS_BRIDGE_PERCEPTION_WORKER_CONCURRENCY", 1, 2),
    timeoutSeconds: boundedInteger(environment.AGENTS_BRIDGE_JOB_TIMEOUT_SECONDS, 30, "AGENTS_BRIDGE_JOB_TIMEOUT_SECONDS", 5, 300),
    retryLimit: boundedInteger(environment.AGENTS_BRIDGE_JOB_RETRY_LIMIT, 2, "AGENTS_BRIDGE_JOB_RETRY_LIMIT", 0, 10),
    retryDelaySeconds: boundedInteger(environment.AGENTS_BRIDGE_JOB_RETRY_DELAY_SECONDS, 1, "AGENTS_BRIDGE_JOB_RETRY_DELAY_SECONDS", 1, 60),
    // Compose grants the worker 20 seconds to stop. Keep five seconds available
    // for signal delivery and container teardown at the highest accepted value.
    shutdownTimeoutMilliseconds: boundedInteger(environment.AGENTS_BRIDGE_WORKER_SHUTDOWN_TIMEOUT_MS, 15000, "AGENTS_BRIDGE_WORKER_SHUTDOWN_TIMEOUT_MS", 1000, 15000),
  };
}
