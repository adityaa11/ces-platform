import { createBranchRegistry } from "../../core/branch-registry.js";

/** Reconciliation owns its branch composition; it is intentionally empty. */
export const reconciliationRegistry = createBranchRegistry([]);
