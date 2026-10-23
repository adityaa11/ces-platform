import { createBranchRegistry } from "../../core/branch-registry.js";

/** Semantic owns its branch composition; GHR-01B intentionally registers none. */
export const semanticRegistry = createBranchRegistry([]);
