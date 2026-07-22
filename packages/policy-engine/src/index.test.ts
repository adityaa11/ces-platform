import { defaultPolicyRegistry, type PolicyRegistry } from "@company/ces-policy-registry";
import { parseRequirementPackage } from "@company/ces-requirement-schema";
import { describe, expect, it } from "vitest";
import { canonicalJson, compilePolicyManifest } from "./index.js";

const assurance = {
  exposure: "public_internet",
  criticality: "business_critical",
  data_classes: ["personal"],
};

function createRequirement(options?: {
  readonly includeLifecycle?: boolean;
  readonly sizes?: readonly number[];
}) {
  const includeLifecycle = options?.includeLifecycle ?? true;
  const sizes = options?.sizes ?? [5_242_880];
  return parseRequirementPackage({
    schema_version: "1.0.0",
    requirement: {
      id: "REQ-USER-014",
      title: "Replace profile picture",
    },
    source: {
      document_id: "PRD-USER-MANAGEMENT",
      section: "4.3.2",
    },
    actor: { type: "authenticated_user" },
    operation: {
      action: "replace",
      resource: "profile_picture",
      target_scope: "own_resource",
    },
    inputs: sizes.map((maximumSizeBytes, index) => ({
      name: `profile_picture_${index}`,
      type: "binary_file",
      media_category: "image",
      constraints: {
        allowed_media_types: ["image/jpeg", "image/png"],
        maximum_size_bytes: maximumSizeBytes,
      },
    })),
    effects: ["persistent_write", "replaces_existing_resource"],
    business_rules: [
      {
        id: "BR-USER-031",
        type: "authorization",
        statement: "A user may replace only their own profile picture.",
      },
      ...(includeLifecycle
        ? [
            {
              id: "BR-USER-033",
              type: "lifecycle",
              statement: "Delete the old image after commit using retry-safe cleanup.",
            },
          ]
        : []),
    ],
  });
}

function compile(
  requirement = createRequirement(),
  registry: PolicyRegistry = defaultPolicyRegistry,
) {
  return compilePolicyManifest({
    requirement,
    assurance,
    ces_baseline_version: "0.1.0",
    registry,
  });
}

describe("compilePolicyManifest", () => {
  it("resolves all initial policies for the complete profile requirement", () => {
    const result = compile();

    expect(result.exit_code).toBe(0);
    expect(result.manifest.obligations.map(({ policy_id }) => policy_id)).toEqual([
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
    expect(
      result.manifest.obligations.find(
        ({ policy_id }) => policy_id === "FILE_SIZE_LIMIT",
      )?.parameters,
    ).toEqual({ maximum_bytes: 5_242_880 });
  });

  it("blocks lifecycle when the business lifecycle fact is absent", () => {
    const result = compile(createRequirement({ includeLifecycle: false }));
    const lifecycle = result.manifest.obligations.find(
      ({ policy_id }) => policy_id === "REPLACED_RESOURCE_LIFECYCLE",
    );

    expect(result.exit_code).toBe(3);
    expect(lifecycle).toMatchObject({
      requirement_level: "mandatory",
      resolution_state: "blocked",
      missing_inputs: ["business_rules[type=lifecycle]"],
    });
  });

  it("merges compatible duplicate contributions", () => {
    const duplicate = {
      ...defaultPolicyRegistry.rules.find(({ id }) => id === "POL-INPUT-001")!,
      id: "POL-INPUT-002",
      reason: "A compatible duplicate validation rule",
    };
    const registry: PolicyRegistry = {
      ...defaultPolicyRegistry,
      rules: [...defaultPolicyRegistry.rules, duplicate],
    };
    const validation = compile(createRequirement(), registry).manifest.obligations.find(
      ({ policy_id }) => policy_id === "INPUT_VALIDATION",
    );

    expect(validation?.source_rule_ids).toContain("POL-INPUT-001");
    expect(validation?.source_rule_ids).toContain("POL-INPUT-002");
    expect(validation?.evidence).toContainEqual({
      path: "inputs[0].type",
      value: "binary_file",
    });
    expect(validation?.evidence).toContainEqual({
      path: "inputs[0].constraints.maximum_size_bytes",
      value: 5_242_880,
    });
    expect(
      validation?.evidence.filter(
        ({ path, value }) =>
          path === "inputs[0].type" && value === "binary_file",
      ),
    ).toHaveLength(1);
  });

  it("reports incompatible policy parameters as a conflict", () => {
    const result = compile(createRequirement({ sizes: [5_242_880, 10_485_760] }));
    const sizeLimit = result.manifest.obligations.find(
      ({ policy_id }) => policy_id === "FILE_SIZE_LIMIT",
    );

    expect(result.exit_code).toBe(4);
    expect(sizeLimit?.resolution_state).toBe("conflict");
    expect(sizeLimit?.parameters).toEqual({
      maximum_bytes: { conflict_values: [5_242_880, 10_485_760] },
    });
  });

  it("reports mandatory and prohibited contributions as a conflict", () => {
    const prohibited = {
      ...defaultPolicyRegistry.rules.find(({ id }) => id === "POL-INPUT-001")!,
      id: "POL-INPUT-PROHIBIT-001",
      requirement_level: "prohibited" as const,
      reason: "Conflicting test rule",
    };
    const registry: PolicyRegistry = {
      ...defaultPolicyRegistry,
      rules: [...defaultPolicyRegistry.rules, prohibited],
    };
    const result = compile(createRequirement(), registry);
    const validation = result.manifest.obligations.find(
      ({ policy_id }) => policy_id === "INPUT_VALIDATION",
    );

    expect(result.exit_code).toBe(4);
    expect(validation).toMatchObject({
      requirement_level: "mandatory",
      resolution_state: "conflict",
    });
  });

  it("is byte-deterministic and independent of registry ordering", () => {
    const reversedRegistry: PolicyRegistry = {
      ...defaultPolicyRegistry,
      definitions: [...defaultPolicyRegistry.definitions].reverse(),
      rules: [...defaultPolicyRegistry.rules].reverse(),
    };

    expect(canonicalJson(compile().manifest)).toBe(
      canonicalJson(compile(createRequirement(), reversedRegistry).manifest),
    );
  });

  it("keeps technical and adapter terminology out of the manifest", () => {
    const serialized = canonicalJson(compile().manifest);

    expect(serialized).not.toMatch(/adapter|framework|implementation_pattern/iu);
  });

  it("does not change policy meaning when source traceability changes", () => {
    const withSource = compile().manifest;
    const withoutSourceRequirement = parseRequirementPackage({
      ...createRequirement(),
      source: undefined,
    });
    const withoutSource = compile(withoutSourceRequirement).manifest;

    expect(withoutSource).toEqual(withSource);
  });
});
