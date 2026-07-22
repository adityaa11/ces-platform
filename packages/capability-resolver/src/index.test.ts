import {
  defaultCapabilityTraitRegistry,
  type CapabilityTraitRegistry,
} from "@company/ces-capability-registry";
import { parseRequirementPackage } from "@company/ces-requirement-schema";
import { describe, expect, it } from "vitest";
import {
  ResolverError,
  resolveCapabilitiesAndTraits,
} from "./index.js";

const profilePictureRequirement = parseRequirementPackage({
  schema_version: "1.0.0",
  requirement: {
    id: "REQ-USER-014",
    title: "Replace profile picture",
  },
  actor: { type: "authenticated_user" },
  operation: {
    action: "replace",
    resource: "profile_picture",
    target_scope: "own_resource",
  },
  inputs: [
    {
      name: "profile_picture",
      type: "binary_file",
      trust_boundary: "external",
      media_category: "image",
    },
  ],
  effects: ["persistent_write", "replaces_existing_resource"],
  business_rules: [],
});

describe("resolveCapabilitiesAndTraits", () => {
  it("resolves the expected profile-picture capabilities and traits", () => {
    const result = resolveCapabilitiesAndTraits(profilePictureRequirement);

    expect(result.resolved_capabilities.map(({ id }) => id)).toEqual([
      "FILE_UPLOAD",
      "IMAGE_PROCESSING",
      "PROFILE_MANAGEMENT",
    ]);
    expect(result.resolved_traits.map(({ id }) => id)).toEqual([
      "AUTHENTICATED_ACTOR",
      "BINARY_DATA",
      "BROWSER_RENDERED_CONTENT",
      "EXTERNAL_INPUT",
      "PERSISTENT_DATA",
      "REPLACEABLE_RESOURCE",
      "USER_OWNED_RESOURCE",
    ]);
  });

  it("records rule IDs, evidence, reasons, and registry versions", () => {
    const result = resolveCapabilitiesAndTraits(profilePictureRequirement);
    const fileUpload = result.resolved_capabilities.find(
      ({ id }) => id === "FILE_UPLOAD",
    );

    expect(fileUpload).toMatchObject({
      rule_id: "CAP-FILE-001",
      reason: "A binary file enters the system",
      registry_version: "0.1.0",
      evidence: [{ path: "inputs[0].type", value: "binary_file" }],
    });
  });

  it("derives external input only from the explicit trust boundary", () => {
    const external = resolveCapabilitiesAndTraits(profilePictureRequirement);
    expect(external.resolved_traits.find(({ id }) => id === "EXTERNAL_INPUT")?.evidence)
      .toEqual([{ path: "inputs[0].trust_boundary", value: "external" }]);

    const internal = resolveCapabilitiesAndTraits(parseRequirementPackage({
      ...profilePictureRequirement,
      inputs: profilePictureRequirement.inputs.map((input) => ({
        ...input,
        trust_boundary: "internal",
      })),
    }));
    expect(internal.resolved_traits.map(({ id }) => id)).not.toContain("EXTERNAL_INPUT");
  });

  it("is independent of registry rule order", () => {
    const reversedRegistry: CapabilityTraitRegistry = {
      ...defaultCapabilityTraitRegistry,
      rules: [...defaultCapabilityTraitRegistry.rules].reverse(),
    };

    expect(
      resolveCapabilitiesAndTraits(profilePictureRequirement, reversedRegistry),
    ).toEqual(resolveCapabilitiesAndTraits(profilePictureRequirement));
  });

  it("normalizes duplicate evidence and merges duplicate target rules", () => {
    const duplicateRule = {
      ...defaultCapabilityTraitRegistry.rules.find(
        ({ id }) => id === "CAP-FILE-001",
      )!,
      id: "CAP-FILE-002",
      reason: "A second deterministic file rule",
    };
    const registry: CapabilityTraitRegistry = {
      ...defaultCapabilityTraitRegistry,
      rules: [...defaultCapabilityTraitRegistry.rules, duplicateRule],
    };

    const result = resolveCapabilitiesAndTraits(profilePictureRequirement, registry);
    const fileUpload = result.resolved_capabilities.find(
      ({ id }) => id === "FILE_UPLOAD",
    );

    expect(fileUpload?.evidence).toEqual([
      { path: "inputs[0].type", value: "binary_file" },
    ]);
    expect(fileUpload?.rule_id).toBe("CAP-FILE-001,CAP-FILE-002");
  });

  it("keeps supported assertions separate from resolved capabilities", () => {
    const requirement = parseRequirementPackage({
      ...profilePictureRequirement,
      asserted_capabilities: ["FILE_UPLOAD"],
    });

    const result = resolveCapabilitiesAndTraits(requirement);
    expect(result.asserted_capabilities).toEqual(["FILE_UPLOAD"]);
    expect(result.resolved_capabilities).toHaveLength(3);
  });

  it("rejects a known assertion unsupported by requirement facts", () => {
    const requirement = parseRequirementPackage({
      ...profilePictureRequirement,
      inputs: [],
      asserted_capabilities: ["FILE_UPLOAD"],
    });

    expect(() => resolveCapabilitiesAndTraits(requirement)).toThrowError(
      expect.objectContaining<Partial<ResolverError>>({
        code: "UNSUPPORTED_ASSERTION",
      }),
    );
  });

  it("rejects an unknown asserted capability", () => {
    const requirement = parseRequirementPackage({
      ...profilePictureRequirement,
      asserted_capabilities: ["UNKNOWN_CAPABILITY"],
    });

    expect(() => resolveCapabilitiesAndTraits(requirement)).toThrowError(
      expect.objectContaining<Partial<ResolverError>>({
        code: "UNKNOWN_CAPABILITY",
      }),
    );
  });

  it("rejects a registry rule with an unknown target", () => {
    const registry = {
      ...defaultCapabilityTraitRegistry,
      rules: [
        ...defaultCapabilityTraitRegistry.rules,
        {
          id: "CAP-UNKNOWN-001",
          target_kind: "capability",
          target_id: "UNKNOWN_CAPABILITY",
          all: [{ path: "actor.type", operator: "exists" }],
          reason: "Invalid test rule",
        },
      ],
    } as unknown as CapabilityTraitRegistry;

    expect(() =>
      resolveCapabilitiesAndTraits(profilePictureRequirement, registry),
    ).toThrowError(
      expect.objectContaining<Partial<ResolverError>>({
        code: "UNKNOWN_CAPABILITY",
      }),
    );
  });

  it("does not resolve input capabilities when inputs are absent", () => {
    const requirement = parseRequirementPackage({
      ...profilePictureRequirement,
      inputs: [],
      asserted_capabilities: [],
    });

    const result = resolveCapabilitiesAndTraits(requirement);
    expect(result.resolved_capabilities.map(({ id }) => id)).toEqual([
      "PROFILE_MANAGEMENT",
    ]);
    expect(result.resolved_traits.map(({ id }) => id)).not.toContain(
      "EXTERNAL_INPUT",
    );
  });
});
