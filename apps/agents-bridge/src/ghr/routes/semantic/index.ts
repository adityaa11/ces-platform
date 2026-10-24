import { createBranchRegistry } from "../../core/branch-registry.js";
import { semanticBatchPlanRoute } from "./branches/batch-plan.route.js";

/** Semantic owns its exact Test-1 branch composition. */
export const semanticRegistry = createBranchRegistry([semanticBatchPlanRoute]);

export { semanticBatchPlanRoute } from "./branches/batch-plan.route.js";
export {
  BatchPlanReceiverError,
  receiveVerifiedBatchPlan,
  type BatchPlanAcceptanceStore,
  type BatchPlanAcceptedDecision,
  type VerifiedBatchPlanDeliveryCommand,
} from "./receivers/batch-plan.receiver.js";
