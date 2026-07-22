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

export const LARAVEL_ADAPTER_PACKAGE_ID = "@company/ces-laravel-adapter";

const POLICY_GUIDANCE = {
  INPUT_VALIDATION: "Use a Laravel Form Request with explicit validation rules",
  RESOURCE_LEVEL_AUTHORIZATION: "Use a Laravel Policy and authorize the target model instance",
  FILE_SIZE_LIMIT: "Apply the resolved maximum size in the Form Request file rule",
  FILE_CONTENT_VERIFICATION: "Verify detected MIME content and decode images before acceptance",
  SERVER_GENERATED_STORAGE_KEY: "Generate a trusted storage path and write through Laravel Storage",
  SAFE_IMAGE_DELIVERY: "Return the stored image with an explicit safe content type",
  ATOMIC_RESOURCE_REPLACEMENT: "Wrap database replacement state in DB::transaction",
  REPLACED_RESOURCE_LIFECYCLE: "Dispatch an idempotent queued cleanup job with afterCommit",
  SAFE_LOGGING: "Log allowlisted metadata without raw request or file content",
} as const;

const TEST_GUIDANCE = {
  INPUT_VALIDATION: "PHPUnit feature test rejects malformed and missing input",
  RESOURCE_LEVEL_AUTHORIZATION: "PHPUnit feature tests deny another user's resource",
  FILE_SIZE_LIMIT: "PHPUnit feature test rejects a file above the resolved limit",
  FILE_CONTENT_VERIFICATION: "PHPUnit integration test rejects spoofed file content",
  SERVER_GENERATED_STORAGE_KEY: "PHPUnit test proves client filenames never select storage paths",
  SAFE_IMAGE_DELIVERY: "PHPUnit feature test asserts safe response media headers",
  ATOMIC_RESOURCE_REPLACEMENT: "PHPUnit integration test proves rollback preserves prior state",
  REPLACED_RESOURCE_LIFECYCLE: "PHPUnit tests prove after-commit dispatch and retry-safe cleanup",
  SAFE_LOGGING: "PHPUnit test proves raw uploaded content is absent from logs",
} as const;

function mapping(policyId: keyof typeof POLICY_GUIDANCE) {
  const mappingId = `LARAVEL-MAP-${policyId}`;
  const provenance = {
    source_policy_id: policyId,
    mapping_id: mappingId,
    mapping_version: "0.1.0",
  };
  return {
    id: mappingId,
    policy_id: policyId,
    support: "supported" as const,
    reason: `Laravel reference mapping for ${policyId}`,
    implementation: [{
      ...provenance,
      id: `LARAVEL-IMPLEMENT-${policyId}`,
      guidance: POLICY_GUIDANCE[policyId],
    }],
    tests: [{
      ...provenance,
      id: `LARAVEL-TEST-${policyId}`,
      guidance: TEST_GUIDANCE[policyId],
    }],
    verification: [{
      ...provenance,
      id: `LARAVEL-VERIFY-${policyId}`,
      guidance: `Require source comment marker CES-EVIDENCE:${policyId}`,
    }],
  };
}

export const laravelAdapter: AdapterDefinition = {
  metadata: {
    schema_version: "1.0.0",
    adapter: { id: "laravel", version: "0.1.0", mapping_version: "0.1.0" },
    classification: "production",
    compatible_policy_manifest_versions: ["1.0.0"],
    technical_compatibility: { languages: ["php"], frameworks: ["laravel"] },
  },
  mappings: Object.keys(POLICY_GUIDANCE)
    .sort(compareText)
    .map((policyId) => mapping(policyId as keyof typeof POLICY_GUIDANCE)),
};

export const laravelGapFixtureAdapter: AdapterDefinition = {
  ...laravelAdapter,
  metadata: {
    ...laravelAdapter.metadata,
    adapter: { id: "laravel-gap-fixture", version: "0.1.0", mapping_version: "0.1.0" },
  },
  mappings: laravelAdapter.mappings.filter(
    ({ policy_id }) => policy_id !== "REPLACED_RESOURCE_LIFECYCLE",
  ),
};

export const laravelAdapterRegistry = createAdapterRegistry([
  laravelAdapter,
  laravelGapFixtureAdapter,
]);

export interface LaravelSourceCheck {
  readonly id: string;
  readonly policy_id: string;
  readonly status: "passed" | "failed";
  readonly reason: string;
  readonly files: readonly string[];
}

export const laravelProhibitedPatterns = [
  {
    id: "LARAVEL-PROHIBIT-CLIENT-STORAGE-PATH",
    policy_id: "SERVER_GENERATED_STORAGE_KEY",
    pattern: "getClientOriginalName\\s*\\(",
    reason: "Client filenames must not determine persistent storage paths",
  },
  {
    id: "LARAVEL-PROHIBIT-RAW-REQUEST-LOG",
    policy_id: "SAFE_LOGGING",
    pattern: "Log::(?:info|debug|warning|error)\\s*\\([^\\n]*(?:request\\(\\)->all|request\\(\\)->file)",
    reason: "Raw request and file content must not be logged",
  },
] as const;

export function checkLaravelSource(
  sources: Readonly<Record<string, string>>,
  policyIds: readonly string[],
): LaravelSourceCheck[] {
  const entries = Object.entries(sources).sort(([left], [right]) => compareText(left, right));
  const markerChecks = [...new Set(policyIds)].sort(compareText).map((policyId) => {
    const marker = `CES-EVIDENCE:${policyId}`;
    const files = entries.filter(([, content]) => content.includes(marker)).map(([path]) => path);
    return {
      id: `LARAVEL-EVIDENCE-${policyId}`,
      policy_id: policyId,
      status: files.length > 0 ? "passed" as const : "failed" as const,
      reason: files.length > 0 ? `Found ${marker}` : `Missing ${marker}`,
      files,
    };
  });
  const prohibitedChecks = laravelProhibitedPatterns.map((rule) => {
    const expression = new RegExp(rule.pattern, "u");
    const files = entries.filter(([, content]) => expression.test(content)).map(([path]) => path);
    return {
      id: rule.id,
      policy_id: rule.policy_id,
      status: files.length === 0 ? "passed" as const : "failed" as const,
      reason: files.length === 0 ? rule.reason : `Prohibited pattern found: ${rule.reason}`,
      files,
    };
  });
  return [...markerChecks, ...prohibitedChecks];
}

export type LaravelCompilationResult =
  | {
      readonly ok: true;
      readonly exit_code: 0;
      readonly implementation_package: ImplementationPackage;
      readonly test_manifest: TestManifest;
      readonly verification_manifest: VerificationManifest;
    }
  | Extract<AdapterPreparationResult, { readonly ok: false }>;

export function compileLaravelAdapter(input: {
  readonly manifest: PolicyManifest;
  readonly technical: ProjectTechnicalContext;
  readonly adapter_id?: "laravel" | "laravel-gap-fixture";
}): LaravelCompilationResult {
  const adapter = laravelAdapterRegistry.get(input.adapter_id ?? "laravel", "0.1.0");
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
      implementation_items: preparation.applicable_mappings.flatMap(({ implementation }) => implementation),
    }),
    test_manifest: TestManifestSchema.parse({
      ...header,
      tests: preparation.applicable_mappings.flatMap(({ tests }) => tests),
    }),
    verification_manifest: VerificationManifestSchema.parse({
      ...header,
      checks: preparation.applicable_mappings.flatMap(({ verification }) => verification),
    }),
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
