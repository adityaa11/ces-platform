import { describe, expect, it } from "vitest";
import {
  PolicyDefinitionSchema,
  PolicyRuleSchema,
  defaultPolicyRegistry,
} from "./index.js";

describe("policy registry", () => {
  it("contains the nine canonical initial policies", () => {
    expect(defaultPolicyRegistry.definitions.map(({ id }) => id).sort()).toEqual([
      "ATOMIC_RESOURCE_REPLACEMENT",
      "FILE_CONTENT_VERIFICATION",
      "FILE_SIZE_LIMIT",
      "INPUT_VALIDATION",
      "REPLACED_RESOURCE_LIFECYCLE",
      "RESOURCE_LEVEL_AUTHORIZATION",
      "SAFE_IMAGE_DELIVERY",
      "SAFE_LOGGING",
      "SERVER_GENERATED_STORAGE_KEY",
    ]);
  });

  it("uses FILE_CONTENT_VERIFICATION as the only content policy name", () => {
    const serialized = JSON.stringify(defaultPolicyRegistry);
    expect(serialized).toContain("FILE_CONTENT_VERIFICATION");
    expect(serialized).not.toMatch(/(?<!FILE_)CONTENT_VERIFICATION/u);
  });

  it("validates every definition and rule", () => {
    for (const definition of defaultPolicyRegistry.definitions) {
      expect(PolicyDefinitionSchema.parse(definition)).toEqual(definition);
    }
    for (const rule of defaultPolicyRegistry.rules) {
      expect(PolicyRuleSchema.parse(rule)).toEqual(rule);
    }
  });
});
