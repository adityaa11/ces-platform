import { describe, expect, it } from "vitest";
import { PolicyManifestSchema } from "./index.js";

const hash = `sha256:${"a".repeat(64)}`;

const manifest = {
  schema_version: "1.0.0",
  compilation_id: hash,
  input_hash: hash,
  requirement_id: "REQ-USER-014",
  ces_baseline_version: "0.1.0",
  capability_registry_version: "0.1.0",
  trait_registry_version: "0.1.0",
  policy_registry_version: "0.1.0",
  policy_registry_hash: `sha256:${"a".repeat(64)}`,
  obligations: [
    {
      policy_id: "RESOURCE_LEVEL_AUTHORIZATION",
      requirement_level: "mandatory",
      resolution_state: "resolved",
      reasons: ["Trait USER_OWNED_RESOURCE"],
    },
  ],
} as const;

describe("PolicyManifestSchema", () => {
  it("validates a stack-agnostic manifest", () => {
    expect(PolicyManifestSchema.parse(manifest).requirement_id).toBe(
      "REQ-USER-014",
    );
  });

  it.each(["adapter_id", "framework", "implementation_pattern"])(
    "rejects forbidden adapter field %s",
    (field) => {
      expect(() =>
        PolicyManifestSchema.parse({ ...manifest, [field]: "forbidden" }),
      ).toThrow();
    },
  );
});
