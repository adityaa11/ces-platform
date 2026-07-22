import { AdapterCompatibilityError } from "@company/ces-adapter-sdk";
import type { PolicyManifest } from "@company/ces-policy-manifest";
import { describe, expect, it } from "vitest";
import {
  TEST_FIXTURE_ADAPTER_WARNING,
  compileTestFixture,
  testFixtureAdapter,
} from "./index.js";

const policyIds = [
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
];

const manifest: PolicyManifest = {
  schema_version: "1.0.0",
  compilation_id: `sha256:${"a".repeat(64)}`,
  input_hash: `sha256:${"b".repeat(64)}`,
  requirement_id: "REQ-USER-014",
  ces_baseline_version: "0.1.0",
  capability_registry_version: "0.1.0",
  trait_registry_version: "0.1.0",
  policy_registry_version: "0.1.0",
  policy_registry_hash: `sha256:${"c".repeat(64)}`,
  resolved_capabilities: [],
  resolved_traits: [],
  obligations: policyIds.map((policyId) => ({
    policy_id: policyId,
    requirement_level: "mandatory",
    resolution_state: "resolved",
    parameters: policyId === "FILE_SIZE_LIMIT"
      ? { maximum_bytes: 5_242_880 }
      : policyId === "FILE_MEDIA_TYPE_ALLOWLIST"
        ? { allowed_media_types: ["image/jpeg", "image/png"] }
        : {},
    reasons: [`Fixture requires ${policyId}`],
    evidence: [],
    source_rule_ids: [`POL-${policyId}`],
    business_rule_ids: [],
    missing_inputs: [],
  })),
};
const technical = { language: "any-language", framework: "any-framework" };

describe("test-fixture adapter", () => {
  it("requires explicit test mode and is visibly test-only", () => {
    expect(testFixtureAdapter.metadata.classification).toBe("test_fixture");
    expect(TEST_FIXTURE_ADAPTER_WARNING).toMatch(/test-only.*unsafe.*unapproved/iu);
    expect(() => compileTestFixture({ manifest, technical })).toThrow(
      AdapterCompatibilityError,
    );
    expect(
      compileTestFixture({ manifest, technical, test_mode: true }),
    ).toMatchObject({ ok: true, exit_code: 0 });
  });

  it("maps every initial policy with implementation, test, and verification guidance", () => {
    const result = compileTestFixture({ manifest, technical, test_mode: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.implementation_package.implementation_items).toHaveLength(10);
    expect(result.test_manifest.tests).toHaveLength(10);
    expect(result.verification_manifest.checks).toHaveLength(10);
    for (const items of [
      result.implementation_package.implementation_items,
      result.test_manifest.tests,
      result.verification_manifest.checks,
    ]) {
      expect(items.find(({ source_policy_id }) => source_policy_id === "FILE_SIZE_LIMIT")?.parameters)
        .toEqual({ maximum_bytes: 5_242_880 });
      expect(items.find(({ source_policy_id }) => source_policy_id === "FILE_MEDIA_TYPE_ALLOWLIST")?.parameters)
        .toEqual({ allowed_media_types: ["image/jpeg", "image/png"] });
    }
  });

  it("consumes the source manifest unchanged", () => {
    const before = JSON.stringify(manifest);
    const result = compileTestFixture({ manifest, technical, test_mode: true });
    expect(JSON.stringify(manifest)).toBe(before);
    expect(result.ok && result.implementation_package.source_compilation_id).toBe(
      manifest.compilation_id,
    );
  });

  it("produces deterministic output independent of obligation order", () => {
    const first = compileTestFixture({ manifest, technical, test_mode: true });
    const reversed = compileTestFixture({
      manifest: { ...manifest, obligations: [...manifest.obligations].reverse() },
      technical,
      test_mode: true,
    });
    expect(reversed).toEqual(first);
  });

  it("produces only generic guidance", () => {
    const output = JSON.stringify(
      compileTestFixture({ manifest, technical, test_mode: true }),
    );
    expect(output).not.toMatch(/laravel|php|eloquent|artisan|framework package/iu);
  });

  it("exposes a deliberate unsupported-policy gap without partial outputs", () => {
    const result = compileTestFixture({
      manifest,
      technical,
      adapter_id: "test-fixture-with-gap",
      test_mode: true,
    });
    expect(result).toMatchObject({
      ok: false,
      exit_code: 5,
      report: {
        gaps: [{ policy_id: "ATOMIC_RESOURCE_REPLACEMENT", status: "unsupported" }],
      },
    });
    expect(result).not.toHaveProperty("implementation_package");
  });
});
