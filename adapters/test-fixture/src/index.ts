import {
  ImplementationPackageSchema,
  TestManifestSchema,
  VerificationManifestSchema,
  createAdapterRegistry,
  prepareAdapterCompilation,
  type AdapterDefinition,
  type AdapterPreparationResult,
  type ImplementationPackage,
  type TestManifest,
  type VerificationManifest,
} from "@company/ces-adapter-sdk";
import type { PolicyManifest } from "@company/ces-policy-manifest";
import type { ProjectTechnicalContext } from "@company/ces-project-schema";

export const TEST_FIXTURE_ADAPTER_PACKAGE_ID = "@company/ces-test-fixture-adapter";
export const TEST_FIXTURE_ADAPTER_WARNING =
  "Test-only contract fixture. Unsafe and unapproved for production guidance.";

const POLICY_GUIDANCE = {
  INPUT_VALIDATION: "Validate external values at the system boundary",
  RESOURCE_LEVEL_AUTHORIZATION: "Authorize access against the target resource",
  FILE_SIZE_LIMIT: "Reject files exceeding the resolved byte limit",
  FILE_CONTENT_VERIFICATION: "Verify file content independently of its supplied name",
  SERVER_GENERATED_STORAGE_KEY: "Generate storage identifiers inside the trusted boundary",
  SAFE_IMAGE_DELIVERY: "Deliver image content using a safe media response",
  ATOMIC_RESOURCE_REPLACEMENT: "Commit replacement state atomically",
  REPLACED_RESOURCE_LIFECYCLE: "Clean up the replaced resource after successful commit",
  SAFE_LOGGING: "Exclude unsafe external values from structured logs",
} as const;

function mapping(policyId: keyof typeof POLICY_GUIDANCE) {
  const mappingId = `FIXTURE-MAP-${policyId}`;
  const provenance = {
    source_policy_id: policyId,
    mapping_id: mappingId,
    mapping_version: "0.1.0",
  };
  return {
    id: mappingId,
    policy_id: policyId,
    support: "supported" as const,
    reason: `Contract fixture supports ${policyId}`,
    implementation: [
      {
        ...provenance,
        id: `FIXTURE-IMPLEMENT-${policyId}`,
        guidance: POLICY_GUIDANCE[policyId],
      },
    ],
    tests: [
      {
        ...provenance,
        id: `FIXTURE-TEST-${policyId}`,
        guidance: `Test that ${POLICY_GUIDANCE[policyId].toLowerCase()}`,
      },
    ],
    verification: [
      {
        ...provenance,
        id: `FIXTURE-VERIFY-${policyId}`,
        guidance: `Verify evidence that ${POLICY_GUIDANCE[policyId].toLowerCase()}`,
      },
    ],
  };
}

export const testFixtureAdapter: AdapterDefinition = {
  metadata: {
    schema_version: "1.0.0",
    adapter: {
      id: "test-fixture",
      version: "0.1.0",
      mapping_version: "0.1.0",
    },
    classification: "test_fixture",
    compatible_policy_manifest_versions: ["1.0.0"],
    technical_compatibility: { languages: [], frameworks: [] },
  },
  mappings: Object.keys(POLICY_GUIDANCE)
    .sort(compareText)
    .map((policyId) => mapping(policyId as keyof typeof POLICY_GUIDANCE)),
};

export const unsupportedPolicyFixtureAdapter: AdapterDefinition = {
  ...testFixtureAdapter,
  metadata: {
    ...testFixtureAdapter.metadata,
    adapter: {
      id: "test-fixture-with-gap",
      version: "0.1.0",
      mapping_version: "0.1.0",
    },
  },
  mappings: testFixtureAdapter.mappings.filter(
    ({ policy_id }) => policy_id !== "ATOMIC_RESOURCE_REPLACEMENT",
  ),
};

export const testFixtureAdapterRegistry = createAdapterRegistry([
  testFixtureAdapter,
  unsupportedPolicyFixtureAdapter,
]);

export type FixtureCompilationResult =
  | {
      readonly ok: true;
      readonly exit_code: 0;
      readonly implementation_package: ImplementationPackage;
      readonly test_manifest: TestManifest;
      readonly verification_manifest: VerificationManifest;
    }
  | Extract<AdapterPreparationResult, { readonly ok: false }>;

export function compileTestFixture(input: {
  readonly manifest: PolicyManifest;
  readonly technical: ProjectTechnicalContext;
  readonly adapter_id?: "test-fixture" | "test-fixture-with-gap";
  readonly test_mode?: boolean;
}): FixtureCompilationResult {
  const adapter = testFixtureAdapterRegistry.get(
    input.adapter_id ?? "test-fixture",
    "0.1.0",
    input.test_mode === undefined ? {} : { test_mode: input.test_mode },
  );
  const preparation = prepareAdapterCompilation({
    manifest: input.manifest,
    technical: input.technical,
    adapter,
  });
  if (!preparation.ok) return preparation;

  const header = {
    schema_version: "1.0.0" as const,
    source_requirement_id: input.manifest.requirement_id,
    source_compilation_id: input.manifest.compilation_id,
    ces_baseline_version: input.manifest.ces_baseline_version,
    policy_registry_version: input.manifest.policy_registry_version,
    adapter: adapter.metadata.adapter,
  };
  return {
    ok: true,
    exit_code: 0,
    implementation_package: ImplementationPackageSchema.parse({
      ...header,
      implementation_items: preparation.applicable_mappings.flatMap(
        ({ implementation }) => implementation,
      ),
    }),
    test_manifest: TestManifestSchema.parse({
      ...header,
      tests: preparation.applicable_mappings.flatMap(({ tests }) => tests),
    }),
    verification_manifest: VerificationManifestSchema.parse({
      ...header,
      checks: preparation.applicable_mappings.flatMap(
        ({ verification }) => verification,
      ),
    }),
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
