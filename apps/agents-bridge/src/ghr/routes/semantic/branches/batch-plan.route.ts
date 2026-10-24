import type { BranchRegistration, ExactBranchSelector } from "../../../core/branch-registry.js";

/**
 * The single Test-1 semantic destination.  These pins are declarative: the
 * future Bridge dispatcher authenticates and validates them before it invokes
 * the receiver; this route never discovers or substitutes a destination.
 */
export const semanticBatchPlanRoute = Object.freeze({
  branch: "batch-plan",
  producerProcessKey: "perception.acceptance",
  policyVersion: "v2",
  handlerVersion: "v2",
  bodyContractType: "SemanticBatchPlanInput",
  bodyContractVersion: "v1",
  canContinue: true,
  payloadByteLimit: 2_048,
  wrappedBodyByteLimit: 2_081,
  receiverIdentity: "semantic.batch-plan",
  receiver: { transport: "http", method: "POST", path: "/internal/semantic/batch-plan" },
} as const satisfies BranchRegistration);

export function isSemanticBatchPlanSelector(selector: ExactBranchSelector): boolean {
  return selector.branch === semanticBatchPlanRoute.branch
    && selector.producerProcessKey === semanticBatchPlanRoute.producerProcessKey
    && selector.policyVersion === semanticBatchPlanRoute.policyVersion
    && selector.handlerVersion === semanticBatchPlanRoute.handlerVersion
    && selector.bodyContractType === semanticBatchPlanRoute.bodyContractType
    && selector.bodyContractVersion === semanticBatchPlanRoute.bodyContractVersion;
}
