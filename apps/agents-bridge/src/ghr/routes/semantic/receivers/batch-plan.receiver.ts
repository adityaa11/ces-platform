import type { SemanticBatchPlanInputV1 } from "@atlas/db";
import type { ExactBranchSelector } from "../../../core/branch-registry.js";
import { isSemanticBatchPlanSelector } from "../branches/batch-plan.route.js";
import { parseSemanticBatchPlanInputV1ForGhr } from "../bodies/semantic-batch-plan-input.v1.js";

/**
 * Input supplied exclusively by the future Bridge delivery boundary after it
 * has authenticated the persisted handoff and generic wrapper.  This adapter
 * neither accepts caller JSON nor establishes that verification itself.
 */
export type VerifiedBatchPlanDeliveryCommand = Readonly<{
  readonly selector: ExactBranchSelector;
  readonly canContinue: boolean;
  readonly payload: string | Uint8Array;
}>;

export type BatchPlanParseOnlyDecision = Readonly<{
  readonly disposition: "parsed_only";
  readonly input: SemanticBatchPlanInputV1;
}>;

export class BatchPlanReceiverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchPlanReceiverError";
  }
}

/**
 * Parses one already-verified false-only delivery and returns no capability
 * beyond the parsed-only decision.  GHR-03B owns all durable receipt work.
 */
export function receiveVerifiedBatchPlan(command: VerifiedBatchPlanDeliveryCommand): BatchPlanParseOnlyDecision {
  if (!isSemanticBatchPlanSelector(command.selector)) {
    throw new BatchPlanReceiverError("Verified delivery pins do not select semantic/batch-plan v1.");
  }
  if (command.canContinue !== false) {
    throw new BatchPlanReceiverError("semantic/batch-plan accepts only an explicit false continuation mode.");
  }
  return Object.freeze({
    disposition: "parsed_only",
    input: parseSemanticBatchPlanInputV1ForGhr(command.payload),
  });
}
