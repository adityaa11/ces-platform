export type WorkerConfig = {
  readonly databaseUrl: string;
  readonly concurrency: number;
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
    concurrency: boundedInteger(environment.AGENTS_BRIDGE_WORKER_CONCURRENCY, 2, "AGENTS_BRIDGE_WORKER_CONCURRENCY", 1, 16),
    timeoutSeconds: boundedInteger(environment.AGENTS_BRIDGE_JOB_TIMEOUT_SECONDS, 30, "AGENTS_BRIDGE_JOB_TIMEOUT_SECONDS", 5, 300),
    retryLimit: boundedInteger(environment.AGENTS_BRIDGE_JOB_RETRY_LIMIT, 2, "AGENTS_BRIDGE_JOB_RETRY_LIMIT", 0, 10),
    retryDelaySeconds: boundedInteger(environment.AGENTS_BRIDGE_JOB_RETRY_DELAY_SECONDS, 1, "AGENTS_BRIDGE_JOB_RETRY_DELAY_SECONDS", 1, 60),
    shutdownTimeoutMilliseconds: boundedInteger(environment.AGENTS_BRIDGE_WORKER_SHUTDOWN_TIMEOUT_MS, 15000, "AGENTS_BRIDGE_WORKER_SHUTDOWN_TIMEOUT_MS", 1000, 60000),
  };
}
