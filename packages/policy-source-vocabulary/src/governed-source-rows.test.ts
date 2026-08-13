import { describe, expect, it } from "vitest";
import { CES_POLICY_ASVS_GOVERNED_SOURCE_ROWS_V1, GovernedSourceRowArtifactSchema } from
  "./governed-source-rows.js";

describe("governed ASVS row artifact", () => {
  it.each(["locator", "source_term", "exact_excerpt"] as const)(
    "fails closed when %s changes without new evidence", (field) => {
      const altered = structuredClone(CES_POLICY_ASVS_GOVERNED_SOURCE_ROWS_V1);
      altered.rows[0]![field] = `${altered.rows[0]![field]} altered`;
      expect(() => GovernedSourceRowArtifactSchema.parse(altered)).toThrow(/content evidence/u);
    });
});
