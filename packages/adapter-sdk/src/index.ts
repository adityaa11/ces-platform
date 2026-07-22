import { PolicyManifestSchema, type PolicyManifest } from "@company/ces-policy-manifest";
import type { ProjectTechnicalContext } from "@company/ces-project-schema";
import { z } from "zod";

export const ADAPTER_SDK_SCHEMA_VERSION = "1.0.0" as const;
export type AdapterCompilationExitCode = 0 | 5;

const NonEmptyString = z.string().trim().min(1);
const VersionedAdapterSchema = z
  .object({
    id: NonEmptyString,
    version: NonEmptyString,
    mapping_version: NonEmptyString,
  })
  .strict();

export const AdapterMetadataSchema = z
  .object({
    schema_version: z.literal(ADAPTER_SDK_SCHEMA_VERSION),
    adapter: VersionedAdapterSchema,
    compatible_policy_manifest_versions: z.array(NonEmptyString).min(1),
    technical_compatibility: z
      .object({
        languages: z.array(NonEmptyString).default([]),
        frameworks: z.array(NonEmptyString).default([]),
      })
      .strict(),
  })
  .strict();

export const MappingGuidanceSchema = z
  .object({
    id: NonEmptyString,
    source_policy_id: NonEmptyString,
    mapping_id: NonEmptyString,
    mapping_version: NonEmptyString,
    guidance: NonEmptyString,
  })
  .strict();

export const AdapterPolicyMappingSchema = z
  .object({
    id: NonEmptyString,
    policy_id: NonEmptyString,
    support: z.enum(["supported", "unsupported"]),
    reason: NonEmptyString,
    implementation: z.array(MappingGuidanceSchema).default([]),
    tests: z.array(MappingGuidanceSchema).default([]),
    verification: z.array(MappingGuidanceSchema).default([]),
  })
  .strict()
  .superRefine((mapping, context) => {
    for (const item of [
      ...mapping.implementation,
      ...mapping.tests,
      ...mapping.verification,
    ]) {
      if (item.source_policy_id !== mapping.policy_id) {
        context.addIssue({
          code: "custom",
          path: ["policy_id"],
          message: `Guidance ${item.id} must preserve source policy ${mapping.policy_id}`,
        });
      }
      if (item.mapping_id !== mapping.id) {
        context.addIssue({
          code: "custom",
          path: ["id"],
          message: `Guidance ${item.id} must preserve mapping ${mapping.id}`,
        });
      }
    }
  });

export const AdapterDefinitionSchema = z
  .object({
    metadata: AdapterMetadataSchema,
    mappings: z.array(AdapterPolicyMappingSchema),
  })
  .strict();

export const AdapterGapSchema = z
  .object({
    policy_id: NonEmptyString,
    adapter_id: NonEmptyString,
    adapter_version: NonEmptyString,
    status: z.literal("unsupported"),
    reason: NonEmptyString,
  })
  .strict();

export const AdapterReportSchema = z
  .object({
    schema_version: z.literal(ADAPTER_SDK_SCHEMA_VERSION),
    source_compilation_id: NonEmptyString,
    adapter: VersionedAdapterSchema,
    status: z.literal("gaps_found"),
    gaps: z.array(AdapterGapSchema).min(1),
  })
  .strict();

const DerivedOutputHeader = {
  schema_version: z.literal(ADAPTER_SDK_SCHEMA_VERSION),
  source_requirement_id: NonEmptyString,
  source_compilation_id: NonEmptyString,
  ces_baseline_version: NonEmptyString,
  policy_registry_version: NonEmptyString,
  adapter: VersionedAdapterSchema,
};

export const ImplementationPackageSchema = z
  .object({
    ...DerivedOutputHeader,
    implementation_items: z.array(MappingGuidanceSchema),
  })
  .strict();

export const TestManifestSchema = z
  .object({ ...DerivedOutputHeader, tests: z.array(MappingGuidanceSchema) })
  .strict();

export const VerificationManifestSchema = z
  .object({ ...DerivedOutputHeader, checks: z.array(MappingGuidanceSchema) })
  .strict();

export type AdapterMetadata = z.infer<typeof AdapterMetadataSchema>;
export type AdapterPolicyMapping = z.infer<typeof AdapterPolicyMappingSchema>;
export type AdapterDefinition = z.infer<typeof AdapterDefinitionSchema>;
export type AdapterReport = z.infer<typeof AdapterReportSchema>;
export type ImplementationPackage = z.infer<typeof ImplementationPackageSchema>;
export type TestManifest = z.infer<typeof TestManifestSchema>;
export type VerificationManifest = z.infer<typeof VerificationManifestSchema>;

export type AdapterPreparationResult =
  | {
      readonly ok: true;
      readonly exit_code: 0;
      readonly adapter: AdapterDefinition;
      readonly applicable_mappings: readonly AdapterPolicyMapping[];
    }
  | {
      readonly ok: false;
      readonly exit_code: 5;
      readonly report: AdapterReport;
    };

export class AdapterCompatibilityError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdapterCompatibilityError";
  }
}

export function prepareAdapterCompilation(input: {
  readonly manifest: PolicyManifest;
  readonly technical: ProjectTechnicalContext;
  readonly adapter: AdapterDefinition;
}): AdapterPreparationResult {
  const manifest = PolicyManifestSchema.parse(input.manifest);
  const adapter = AdapterDefinitionSchema.parse(input.adapter);
  assertCompatible(adapter.metadata, manifest.schema_version, input.technical);
  if (manifest.obligations.some(({ resolution_state }) => resolution_state !== "resolved")) {
    throw new AdapterCompatibilityError(
      "Blocked or conflicting Policy Manifests cannot be passed to an adapter",
    );
  }
  const mappingByPolicy = new Map(adapter.mappings.map((mapping) => [mapping.policy_id, mapping]));
  const gaps = manifest.obligations
    .filter(({ requirement_level, resolution_state }) =>
      requirement_level === "mandatory" && resolution_state === "resolved",
    )
    .flatMap((obligation) => {
      const mapping = mappingByPolicy.get(obligation.policy_id);
      if (mapping?.support === "supported") return [];
      return [
        AdapterGapSchema.parse({
          policy_id: obligation.policy_id,
          adapter_id: adapter.metadata.adapter.id,
          adapter_version: adapter.metadata.adapter.version,
          status: "unsupported",
          reason: mapping?.reason ?? "The selected adapter version has no mapping for this policy",
        }),
      ];
    })
    .sort((left, right) => compareText(left.policy_id, right.policy_id));

  if (gaps.length > 0) {
    return {
      ok: false,
      exit_code: 5,
      report: AdapterReportSchema.parse({
        schema_version: ADAPTER_SDK_SCHEMA_VERSION,
        source_compilation_id: manifest.compilation_id,
        adapter: adapter.metadata.adapter,
        status: "gaps_found",
        gaps,
      }),
    };
  }

  return {
    ok: true,
    exit_code: 0,
    adapter,
    applicable_mappings: manifest.obligations
      .flatMap((obligation) => {
        const mapping = mappingByPolicy.get(obligation.policy_id);
        return mapping?.support === "supported" ? [mapping] : [];
      })
      .sort((left, right) => compareText(left.policy_id, right.policy_id)),
  };
}

export function createAdapterRegistry(adapters: readonly AdapterDefinition[]) {
  const parsed = adapters.map((adapter) => AdapterDefinitionSchema.parse(adapter));
  const byKey = new Map<string, AdapterDefinition>();
  for (const adapter of parsed) {
    const key = adapterKey(adapter.metadata.adapter.id, adapter.metadata.adapter.version);
    if (byKey.has(key)) throw new AdapterCompatibilityError(`Duplicate adapter ${key}`);
    byKey.set(key, adapter);
  }
  return {
    get(id: string, version: string): AdapterDefinition {
      const adapter = byKey.get(adapterKey(id, version));
      if (!adapter) throw new AdapterCompatibilityError(`Adapter ${id}@${version} is not registered`);
      return adapter;
    },
  };
}

function assertCompatible(
  metadata: AdapterMetadata,
  manifestVersion: string,
  technical: ProjectTechnicalContext,
): void {
  if (!metadata.compatible_policy_manifest_versions.includes(manifestVersion)) {
    throw new AdapterCompatibilityError(
      `Adapter ${metadata.adapter.id}@${metadata.adapter.version} is incompatible with Policy Manifest ${manifestVersion}`,
    );
  }
  const { languages, frameworks } = metadata.technical_compatibility;
  if (languages.length > 0 && !languages.includes(technical.language)) {
    throw new AdapterCompatibilityError(`Adapter does not support language ${technical.language}`);
  }
  if (frameworks.length > 0 && !frameworks.includes(technical.framework)) {
    throw new AdapterCompatibilityError(`Adapter does not support framework ${technical.framework}`);
  }
}

function adapterKey(id: string, version: string): string {
  return `${id}@${version}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
