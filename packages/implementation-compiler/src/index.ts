import {
  ImplementationPackageSchema,
  TestManifestSchema,
  VerificationManifestSchema,
  materializeGuidance,
  prepareAdapterCompilation,
  type AdapterDefinition,
  type AdapterReport,
  type ImplementationPackage,
  type TestManifest,
  type VerificationManifest,
} from "@company/ces-adapter-sdk";
import type { PolicyManifest } from "@company/ces-policy-manifest";
import type { ProjectTechnicalContext } from "@company/ces-project-schema";

export interface CompiledImplementationArtifacts {
  readonly implementation_plan: ImplementationPackage;
  readonly implementation_task: string;
  readonly test_manifest: TestManifest;
  readonly verification_manifest: VerificationManifest;
}

export type ImplementationCompilationResult =
  | {
      readonly ok: true;
      readonly exit_code: 0;
      readonly artifacts: CompiledImplementationArtifacts;
    }
  | {
      readonly ok: false;
      readonly kind: "policy";
      readonly exit_code: 3 | 4;
      readonly manifest: PolicyManifest;
    }
  | {
      readonly ok: false;
      readonly kind: "adapter_gap";
      readonly exit_code: 5;
      readonly report: AdapterReport;
    };

export function compileImplementationArtifacts(input: {
  readonly manifest: PolicyManifest;
  readonly technical: ProjectTechnicalContext;
  readonly adapter: AdapterDefinition;
}): ImplementationCompilationResult {
  const conflict = input.manifest.obligations.some(
    ({ resolution_state }) => resolution_state === "conflict",
  );
  const blocked = input.manifest.obligations.some(
    ({ resolution_state }) => resolution_state === "blocked",
  );
  if (conflict || blocked) {
    return {
      ok: false,
      kind: "policy",
      exit_code: conflict ? 4 : 3,
      manifest: input.manifest,
    };
  }

  const preparation = prepareAdapterCompilation(input);
  if (!preparation.ok) {
    return {
      ok: false,
      kind: "adapter_gap",
      exit_code: 5,
      report: preparation.report,
    };
  }

  const header = {
    schema_version: "1.0.0" as const,
    source_requirement_id: input.manifest.requirement_id,
    source_compilation_id: input.manifest.compilation_id,
    ces_baseline_version: input.manifest.ces_baseline_version,
    policy_registry_version: input.manifest.policy_registry_version,
    adapter: preparation.adapter.metadata.adapter,
  };
  const parametersByPolicy = new Map(
    input.manifest.obligations.map(({ policy_id, parameters }) => [policy_id, parameters]),
  );
  const materialize = (item: Parameters<typeof materializeGuidance>[0]) =>
    materializeGuidance(item, parametersByPolicy.get(item.source_policy_id) ?? {});
  const implementationPlan = ImplementationPackageSchema.parse({
    ...header,
    implementation_items: preparation.applicable_mappings.flatMap(
      ({ implementation }) => implementation.map(materialize),
    ),
  });
  const testManifest = TestManifestSchema.parse({
    ...header,
    tests: preparation.applicable_mappings.flatMap(({ tests }) => tests.map(materialize)),
  });
  const verificationManifest = VerificationManifestSchema.parse({
    ...header,
    checks: preparation.applicable_mappings.flatMap(
      ({ verification }) => verification.map(materialize),
    ),
  });
  return {
    ok: true,
    exit_code: 0,
    artifacts: {
      implementation_plan: implementationPlan,
      implementation_task: renderImplementationTask(
        implementationPlan,
        testManifest,
      ),
      test_manifest: testManifest,
      verification_manifest: verificationManifest,
    },
  };
}

export function renderImplementationTask(
  plan: ImplementationPackage,
  tests: TestManifest,
): string {
  const implementation = [...plan.implementation_items].sort(compareGuidance);
  const requiredTests = [...tests.tests].sort(compareGuidance);
  const lines = [
    "# Implementation Task",
    "",
    `Requirement: ${plan.source_requirement_id}`,
    `Source Policy Manifest: ${plan.source_compilation_id}`,
    `Adapter: ${plan.adapter.id}@${plan.adapter.version}`,
    `Mapping version: ${plan.adapter.mapping_version}`,
    "",
    "## Implementation plan",
    "",
    ...implementation.map(
      (item) => `- [${item.source_policy_id}] ${item.guidance}`,
    ),
    "",
    "## Required tests",
    "",
    ...requiredTests.map(
      (item) => `- [${item.source_policy_id}] ${item.guidance}`,
    ),
    "",
    "## Completion",
    "",
    "Implement the plan, add the required tests, and retain the declared policy evidence.",
    "",
  ];
  return lines.join("\n");
}

function compareGuidance(
  left: { readonly source_policy_id: string; readonly id: string },
  right: { readonly source_policy_id: string; readonly id: string },
): number {
  const leftKey = `${left.source_policy_id}\u0000${left.id}`;
  const rightKey = `${right.source_policy_id}\u0000${right.id}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}
