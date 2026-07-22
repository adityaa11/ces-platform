import { defaultPolicyRegistry, type PolicyRegistry } from "@company/ces-policy-registry";
import {
  defaultCapabilityTraitRegistry,
  type CapabilityTraitRegistry,
} from "@company/ces-capability-resolver";
import { parseRequirementPackage } from "@company/ces-requirement-schema";
import type { ProjectAssuranceContext } from "@company/ces-project-schema";
import { describe, expect, it } from "vitest";
import { canonicalJson, compilePolicyManifest } from "./index.js";

const assurance: ProjectAssuranceContext = {
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
      trust_boundary: "external",
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
  vocabularyRegistry: CapabilityTraitRegistry = defaultCapabilityTraitRegistry,
) {
  return compilePolicyManifest({
    requirement,
    assurance,
    ces_baseline_version: "0.1.0",
    registry,
    vocabulary_registry: vocabularyRegistry,
  });
}

describe("compilePolicyManifest", () => {
  it("resolves all initial policies for the complete profile requirement", () => {
    const result = compile();

    expect(result.exit_code).toBe(0);
    expect(result.manifest.obligations.map(({ policy_id }) => policy_id)).toEqual([
      "ATOMIC_RESOURCE_REPLACEMENT",
      "FILE_CONTENT_VERIFICATION",
      "FILE_MEDIA_TYPE_ALLOWLIST",
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
    expect(
      result.manifest.obligations.find(
        ({ policy_id }) => policy_id === "FILE_MEDIA_TYPE_ALLOWLIST",
      )?.parameters,
    ).toEqual({ allowed_media_types: ["image/jpeg", "image/png"] });
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

  it("returns a diagnostic manifest and exit code 4 for registry conflicts", () => {
    const registry: PolicyRegistry = {
      ...defaultPolicyRegistry,
      definitions: [
        ...defaultPolicyRegistry.definitions,
        defaultPolicyRegistry.definitions[0]!,
      ],
    };
    const result = compile(createRequirement(), registry);

    expect(result.exit_code).toBe(4);
    expect(result.manifest.obligations).toEqual([
      expect.objectContaining({
        policy_id: "POLICY_REGISTRY",
        resolution_state: "conflict",
        reasons: ["Duplicate policy definition INPUT_VALIDATION"],
      }),
    ]);
  });

  it("records a content-derived policy registry hash", () => {
    const original = compile();
    const changedRegistry: PolicyRegistry = {
      ...defaultPolicyRegistry,
      version: "0.1.0+changed",
    };
    const changed = compile(createRequirement(), changedRegistry);

    expect(original.manifest.policy_registry_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(changed.manifest.policy_registry_hash).not.toBe(
      original.manifest.policy_registry_hash,
    );
  });

  it("changes compilation identity when registry content changes without a version change", () => {
    const changedRegistry: PolicyRegistry = {
      ...defaultPolicyRegistry,
      rules: defaultPolicyRegistry.rules.map((rule) =>
        rule.id === "POL-INPUT-001"
          ? { ...rule, reason: `${rule.reason} (content mutation)` }
          : rule,
      ),
    };
    const original = compile();
    const changed = compile(createRequirement(), changedRegistry);

    expect(changed.manifest.policy_registry_version).toBe(
      original.manifest.policy_registry_version,
    );
    expect(changed.manifest.policy_registry_hash).not.toBe(
      original.manifest.policy_registry_hash,
    );
    expect(changed.manifest.compilation_id).not.toBe(
      original.manifest.compilation_id,
    );
  });

  it("changes the matching registry hash for every registry mutation category", () => {
    const original = compile().manifest;
    const capabilityDefinition: CapabilityTraitRegistry = {
      ...defaultCapabilityTraitRegistry,
      capabilities: defaultCapabilityTraitRegistry.capabilities.filter(
        (id) => id !== "IMAGE_PROCESSING",
      ),
      rules: defaultCapabilityTraitRegistry.rules.filter(
        ({ target_id }) => target_id !== "IMAGE_PROCESSING",
      ),
    };
    const traitDefinition: CapabilityTraitRegistry = {
      ...defaultCapabilityTraitRegistry,
      traits: defaultCapabilityTraitRegistry.traits.filter(
        (id) => id !== "BROWSER_RENDERED_CONTENT",
      ),
      rules: defaultCapabilityTraitRegistry.rules.filter(
        ({ target_id }) => target_id !== "BROWSER_RENDERED_CONTENT",
      ),
    };
    const resolverRule: CapabilityTraitRegistry = {
      ...defaultCapabilityTraitRegistry,
      rules: defaultCapabilityTraitRegistry.rules.map((rule) =>
        rule.id === "CAP-FILE-001" ? { ...rule, reason: `${rule.reason} mutated` } : rule,
      ),
    };
    const policyRule: PolicyRegistry = {
      ...defaultPolicyRegistry,
      rules: defaultPolicyRegistry.rules.map((rule) =>
        rule.id === "POL-INPUT-001" ? { ...rule, reason: `${rule.reason} mutated` } : rule,
      ),
    };
    const policyDefinition: PolicyRegistry = {
      ...defaultPolicyRegistry,
      definitions: defaultPolicyRegistry.definitions.map((definition) =>
        definition.id === "SAFE_LOGGING"
          ? { ...definition, category: "consistency" as const }
          : definition,
      ),
    };
    const parameterBinding: PolicyRegistry = {
      ...defaultPolicyRegistry,
      rules: defaultPolicyRegistry.rules.map((rule) =>
        rule.id === "POL-FILE-001"
          ? {
              ...rule,
              parameters: rule.parameters.map((binding) => ({
                ...binding,
                name: "maximum_upload_bytes",
              })),
            }
          : rule,
      ),
    };

    const mutations = [
      [compile(createRequirement(), defaultPolicyRegistry, capabilityDefinition).manifest, "capability_registry_hash"],
      [compile(createRequirement(), defaultPolicyRegistry, traitDefinition).manifest, "trait_registry_hash"],
      [compile(createRequirement(), defaultPolicyRegistry, resolverRule).manifest, "capability_registry_hash"],
      [compile(createRequirement(), policyDefinition).manifest, "policy_registry_hash"],
      [compile(createRequirement(), policyRule).manifest, "policy_registry_hash"],
      [compile(createRequirement(), parameterBinding).manifest, "policy_registry_hash"],
    ] as const;
    for (const [changed, hashField] of mutations) {
      expect(changed[hashField]).not.toBe(original[hashField]);
      expect(changed.compilation_id).not.toBe(original.compilation_id);
    }
  });

  it("is byte-deterministic and independent of registry ordering", () => {
    const reversedRegistry: PolicyRegistry = {
      ...defaultPolicyRegistry,
      definitions: [...defaultPolicyRegistry.definitions]
        .reverse()
        .map((definition) => ({ ...definition, requires: [...definition.requires].reverse() })),
      rules: [...defaultPolicyRegistry.rules]
        .reverse()
        .map((rule) => ({ ...rule, parameters: [...rule.parameters].reverse() })),
    };

    expect(canonicalJson(compile().manifest)).toBe(
      canonicalJson(compile(createRequirement(), reversedRegistry).manifest),
    );
  });

  it("normalizes vocabulary definitions, rules, and predicate ordering", () => {
    const rules = defaultCapabilityTraitRegistry.rules.map((rule) =>
      rule.id === "CAP-FILE-001"
        ? { ...rule, all: [...rule.all, { ...rule.all[0]! }] }
        : rule,
    );
    const forward: CapabilityTraitRegistry = {
      ...defaultCapabilityTraitRegistry,
      rules,
    };
    const reversed: CapabilityTraitRegistry = {
      ...defaultCapabilityTraitRegistry,
      capabilities: [...defaultCapabilityTraitRegistry.capabilities].reverse(),
      traits: [...defaultCapabilityTraitRegistry.traits].reverse(),
      rules: [...rules].reverse().map((rule) => ({ ...rule, all: [...rule.all].reverse() })),
    };
    expect(canonicalJson(compile(createRequirement(), defaultPolicyRegistry, reversed).manifest))
      .toBe(canonicalJson(compile(createRequirement(), defaultPolicyRegistry, forward).manifest));
  });

  it("keeps technical and adapter terminology out of the manifest", () => {
    const serialized = canonicalJson(compile().manifest);

    expect(serialized).not.toMatch(
      /adapter|framework|implementation_pattern|typescript|react|codex|claude/iu,
    );
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
