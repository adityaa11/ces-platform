import type { ReasoningRuntime } from "@atlas/contracts";
import type { ProviderOutboundTransport } from "./provider-operational-runtime.js";
import { createProviderAdmittedExecutionHandler } from "./provider-operational-runtime.js";
import { createProviderWakeupHandler } from "./provider-wakeup-worker.js";
import type { DocumentPerceptionQueueHandler, SemanticQueueHandler } from "./worker.js";
import { createBackgroundWorker, type BackgroundWorker } from "./worker.js";
import type { WorkerConfig } from "./worker-config.js";

/**
 * The worker-main composition owns the admitted-job consumer registration.
 * The transport is its only replaceable seam: the generic worker retains no
 * provider semantics, while tests can prove the real pg-boss composition
 * without permitting a live provider call.
 */
export function createProductionBridgeWorker(input: Readonly<{
  config: WorkerConfig;
  runtime: ReasoningRuntime;
  documentPerception: DocumentPerceptionQueueHandler;
  semantic: SemanticQueueHandler;
  providerOutboundTransport: ProviderOutboundTransport;
}>): BackgroundWorker {
  return createBackgroundWorker(
    input.config,
    input.runtime,
    undefined,
    input.documentPerception,
    undefined,
    input.semantic,
    createProviderAdmittedExecutionHandler(input.providerOutboundTransport),
    createProviderWakeupHandler(),
  );
}
