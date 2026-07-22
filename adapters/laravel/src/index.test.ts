import type { PolicyManifest } from "@company/ces-policy-manifest";
import { describe, expect, it } from "vitest";
import {
  checkLaravelSource,
  compileLaravelAdapter,
  laravelAdapter,
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
  compilation_id: "sha256:240139824b60a83ac65a17fcbf2db171c604f0fd9bc924f3a24402dfe3a545fa",
  input_hash: `sha256:${"b".repeat(64)}`,
  requirement_id: "REQ-USER-014",
  ces_baseline_version: "0.1.0",
  capability_registry_version: "0.1.0",
  capability_registry_hash: `sha256:${"d".repeat(64)}`,
  trait_registry_version: "0.1.0",
  trait_registry_hash: `sha256:${"e".repeat(64)}`,
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
    reasons: [`Requirement for ${policyId}`],
    evidence: [],
    source_rule_ids: [`POL-${policyId}`],
    business_rule_ids: [],
    missing_inputs: [],
  })),
};
const technical = { language: "php", framework: "laravel", framework_version: "12" };

describe("Laravel reference adapter", () => {
  it("maps every initial mandatory policy with provenance", () => {
    const result = compileLaravelAdapter({ manifest, technical });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.implementation_package.implementation_items).toHaveLength(10);
    for (const item of result.implementation_package.implementation_items) {
      expect(item.mapping_id).toBe(`LARAVEL-MAP-${item.source_policy_id}`);
      expect(item.mapping_version).toBe("0.1.0");
    }
    expect(result.implementation_package.source_compilation_id).toBe(manifest.compilation_id);
    expect(result.implementation_package.implementation_items).toContainEqual(
      expect.objectContaining({
        source_policy_id: "FILE_SIZE_LIMIT",
        parameters: { maximum_bytes: 5_242_880 },
        guidance: expect.stringContaining("5242880 bytes"),
      }),
    );
    expect(result.implementation_package.implementation_items).toContainEqual(
      expect.objectContaining({
        source_policy_id: "FILE_MEDIA_TYPE_ALLOWLIST",
        parameters: { allowed_media_types: ["image/jpeg", "image/png"] },
        guidance: expect.stringContaining("image/jpeg, image/png"),
      }),
    );
  });

  it("defines PHPUnit tests and evidence markers for every mapping", () => {
    const result = compileLaravelAdapter({ manifest, technical });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.test_manifest.tests.every(({ guidance }) => guidance.includes("PHPUnit"))).toBe(true);
    expect(result.verification_manifest.checks.every(({ guidance, source_policy_id }) =>
      guidance.includes(`CES-EVIDENCE:${source_policy_id}`),
    )).toBe(true);
  });

  it("checks evidence markers deterministically without framework dependencies", () => {
    const checks = checkLaravelSource(
      {
        "z.php": "// CES-EVIDENCE:INPUT_VALIDATION",
        "a.php": "// CES-EVIDENCE:SAFE_LOGGING",
      },
      ["SAFE_LOGGING", "INPUT_VALIDATION", "FILE_SIZE_LIMIT"],
    );
    expect(checks.slice(0, 3).map(({ policy_id, status }) => [policy_id, status])).toEqual([
      ["FILE_SIZE_LIMIT", "failed"],
      ["INPUT_VALIDATION", "passed"],
      ["SAFE_LOGGING", "passed"],
    ]);
  });

  it("fails prohibited source patterns", () => {
    const checks = checkLaravelSource(
      { "Upload.php": "$path = $file->getClientOriginalName();" },
      [],
    );
    expect(checks).toContainEqual(expect.objectContaining({
      id: "LARAVEL-PROHIBIT-CLIENT-STORAGE-PATH",
      status: "failed",
      files: ["Upload.php"],
    }));
  });

  it("reports an explicit mandatory mapping gap without partial output", () => {
    const result = compileLaravelAdapter({
      manifest,
      technical,
      adapter_id: "laravel-gap-fixture",
    });
    expect(result).toMatchObject({
      ok: false,
      exit_code: 5,
      report: { gaps: [{ policy_id: "REPLACED_RESOURCE_LIFECYCLE" }] },
    });
    expect(result).not.toHaveProperty("implementation_package");
  });

  it("is explicitly registered as a production Laravel adapter", () => {
    expect(laravelAdapter.metadata).toMatchObject({
      classification: "production",
      technical_compatibility: { languages: ["php"], frameworks: ["laravel"] },
    });
  });
});
