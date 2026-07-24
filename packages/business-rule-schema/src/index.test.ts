import { describe, expect, it } from "vitest";
import { BusinessRuleSchema } from "./index.js";

describe("BusinessRuleSchema", () => {
  it("validates a stack-agnostic business rule", () => {
    expect(
      BusinessRuleSchema.parse({
        id: "BR-USER-031",
        type: "authorization",
        statement: "A user may replace only their own profile picture.",
      }),
    ).toEqual({
      id: "BR-USER-031",
      type: "authorization",
      statement: "A user may replace only their own profile picture.",
    });
  });

  it("rejects implementation-specific fields", () => {
    expect(() =>
      BusinessRuleSchema.parse({
        id: "BR-USER-031",
        type: "authorization",
        statement: "Authorize access.",
        middleware: "framework-auth",
      }),
    ).toThrow();
  });

  it.each(["ownership", "state_transition", "uniqueness"] as const)(
    "accepts greenfield business-rule type %s",
    (type) => {
      expect(BusinessRuleSchema.parse({
        id: `BR-${type}`,
        type,
        statement: `A stack-neutral ${type} rule.`,
      }).type).toBe(type);
    },
  );
});
