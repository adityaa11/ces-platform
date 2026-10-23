import {
  canonicalSemanticBatchPlanInputV1,
  parseSemanticBatchPlanInputV1,
  type SemanticBatchPlanInputV1,
} from "@atlas/db";

/**
 * Semantic's body boundary deliberately delegates all five-field validation
 * and canonicality rules to @atlas/db.  It owns no parallel parser.
 */
export function parseSemanticBatchPlanInputV1ForGhr(payload: string | Uint8Array): SemanticBatchPlanInputV1 {
  return parseSemanticBatchPlanInputV1(payload);
}

/** Exposed only for parser-parity assertions and future trusted composition. */
export { canonicalSemanticBatchPlanInputV1 };
