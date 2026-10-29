import type { DocumentPerceptionQueueHandler } from "./worker.js";
import { createBackgroundWorker, type BackgroundWorker } from "./worker.js";
import type { WorkerConfig } from "./worker-config.js";
import type { GenericHandoffHttpTransportConfig } from "./ghr/http-transport-config.js";

/**
 * The worker-main composition owns the admitted-job consumer registration.
 * The transport is its only replaceable seam: the generic worker retains no
 * provider semantics, while tests can prove the real pg-boss composition
 * without permitting a live provider call.
 */
export function createProductionBridgeWorker(input: Readonly<{
  config: WorkerConfig;
  documentPerception: DocumentPerceptionQueueHandler;
  genericHandoffHttpTransport?: GenericHandoffHttpTransportConfig;
}>): BackgroundWorker {
  return createBackgroundWorker(
    input.config,
    input.documentPerception,
    input.genericHandoffHttpTransport,
  );
}
