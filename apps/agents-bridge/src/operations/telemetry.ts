import type { BridgeLogger, BridgeMetrics } from "../server.js";

export interface OperationalTelemetry {
  readonly logger: BridgeLogger;
  readonly metrics: BridgeMetrics;
  readonly provider: (event: Readonly<{
    provider_id: string;
    status?: number;
    retry_count: number;
    duration_ms: number;
  }>) => void;
}

export function createJsonTelemetry(
  write: (line: string) => void,
): OperationalTelemetry {
  return {
    logger: {
      log: (event) => write(JSON.stringify({ kind: "request_log", ...event })),
    },
    metrics: {
      record: (event) => write(JSON.stringify({ kind: "request_metric", ...event })),
    },
    provider: (event) => write(JSON.stringify({ kind: "provider_metric", ...event })),
  };
}
