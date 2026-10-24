import type { SemanticBatchPlanInputV1 } from "@atlas/db";
import type { TrustedPlanningScope } from "../../../../idser-semantic-batch-plan-job.js";
import type { ExactBranchSelector } from "../../../core/branch-registry.js";
import { isSemanticBatchPlanSelector } from "../branches/batch-plan.route.js";
import { parseSemanticBatchPlanInputV1ForGhr } from "../bodies/semantic-batch-plan-input.v1.js";

/**
 * Input supplied exclusively by the Bridge delivery boundary after it has
 * authenticated the persisted handoff and generic wrapper. This adapter
 * neither accepts caller JSON nor establishes that verification itself.
 */
export type VerifiedBatchPlanDeliveryCommand = Readonly<{
  readonly selector: ExactBranchSelector;
  readonly canContinue: boolean;
  readonly payload: string | Uint8Array;
  readonly handoffId: string;
  readonly bodySha256: string;
  readonly trustedScope: TrustedPlanningScope;
}>;

export type BatchPlanAcceptanceStore = Readonly<{ accept(input: Readonly<{ handoffId: string; bodySha256: string; input: SemanticBatchPlanInputV1; trustedScope: TrustedPlanningScope }>): Promise<void> }>;

export type BatchPlanAcceptedDecision = Readonly<{ readonly disposition: "planning_accepted" }>;

export class BatchPlanReceiverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchPlanReceiverError";
  }
}

/**
 * Validates and durably accepts one already-verified planning delivery. The
 * HTTP path deliberately stops here; the pg-boss consumer owns redemption,
 * planning, retries, and outcome persistence.
 */
export async function receiveVerifiedBatchPlan(command: VerifiedBatchPlanDeliveryCommand, acceptance?: BatchPlanAcceptanceStore): Promise<BatchPlanAcceptedDecision> {
  if (!isSemanticBatchPlanSelector(command.selector)) {
    throw new BatchPlanReceiverError("Verified delivery pins do not select semantic/batch-plan v2.");
  }
  if (command.canContinue === false) {
    throw new BatchPlanReceiverError("semantic/batch-plan requires an explicit true continuation mode for planning.");
  }
  if (!command.trustedScope.bundleId || !command.trustedScope.documentId) {
    throw new BatchPlanReceiverError("semantic/batch-plan requires a complete trusted source scope.");
  }
  if (!acceptance) {
    throw new BatchPlanReceiverError("semantic/batch-plan durable acceptance is unavailable.");
  }
  let input: SemanticBatchPlanInputV1;
  try { input = parseSemanticBatchPlanInputV1ForGhr(command.payload); }
  catch { throw new BatchPlanReceiverError("semantic/batch-plan payload is not canonical SemanticBatchPlanInput/v1."); }
  await acceptance.accept({ handoffId: command.handoffId, bodySha256: command.bodySha256, input, trustedScope: command.trustedScope });
  return Object.freeze({
    disposition: "planning_accepted",
  });
}
