import { describe, expect, it } from "vitest";
import {
  CapabilityIdSchema,
  ResolutionRuleSchema,
  TraitIdSchema,
  defaultCapabilityTraitRegistry,
} from "./index.js";

describe("capability and trait registry", () => {
  it("contains the three initial capabilities", () => {
    expect([...CapabilityIdSchema.options].sort()).toEqual([
      "FILE_UPLOAD",
      "IMAGE_PROCESSING",
      "PROFILE_MANAGEMENT",
    ]);
  });

  it("contains the seven initial traits", () => {
    expect([...TraitIdSchema.options].sort()).toEqual([
      "AUTHENTICATED_ACTOR",
      "BINARY_DATA",
      "BROWSER_RENDERED_CONTENT",
      "EXTERNAL_INPUT",
      "PERSISTENT_DATA",
      "REPLACEABLE_RESOURCE",
      "USER_OWNED_RESOURCE",
    ]);
  });

  it("validates every declarative rule", () => {
    for (const rule of defaultCapabilityTraitRegistry.rules) {
      expect(ResolutionRuleSchema.parse(rule)).toEqual(rule);
    }
  });
});
