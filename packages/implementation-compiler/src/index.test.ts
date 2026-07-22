import type { AdapterDefinition } from "@company/ces-adapter-sdk";
import type { PolicyManifest } from "@company/ces-policy-manifest";
import { describe, expect, it } from "vitest";
import { compileImplementationArtifacts } from "./index.js";

const manifest: PolicyManifest = {
  schema_version: "1.0.0",
  compilation_id: `sha256:${"a".repeat(64)}`,
  input_hash: `sha256:${"b".repeat(64)}`,
  requirement_id: "REQ-1",
  ces_baseline_version: "0.1.0",
  capability_registry_version: "0.1.0",
  trait_registry_version: "0.1.0",
  policy_registry_version: "0.1.0",
  policy_registry_hash: `sha256:${"c".repeat(64)}`,
  resolved_capabilities: [],
  resolved_traits: [],
  obligations: ["INPUT_VALIDATION", "SAFE_LOGGING"].map((policyId) => ({
    policy_id: policyId,
    requirement_level: "mandatory",
    resolution_state: "resolved",
    parameters: {},
    reasons: ["Required"],
    evidence: [],
    source_rule_ids: [policyId],
    business_rule_ids: [],
    missing_inputs: [],
  })),
};

function createAdapter(policyIds = ["INPUT_VALIDATION", "SAFE_LOGGING"]): AdapterDefinition {
  return {
    metadata: {
      schema_version: "1.0.0",
      adapter: { id: "fixture", version: "0.1.0", mapping_version: "0.1.0" },
      classification: "production",
      compatible_policy_manifest_versions: ["1.0.0"],
      technical_compatibility: { languages: [], frameworks: [] },
    },
    mappings: policyIds.map((policyId) => {
      const common = {
        source_policy_id: policyId,
        mapping_id: `MAP-${policyId}`,
        mapping_version: "0.1.0",
      };
      return {
        id: common.mapping_id,
        policy_id: policyId,
        support: "supported",
        reason: "Supported",
        implementation: [{ ...common, id: `IMPL-${policyId}`, guidance: `Implement ${policyId}` }],
        tests: [{ ...common, id: `TEST-${policyId}`, guidance: `Test ${policyId}` }],
        verification: [{ ...common, id: `VERIFY-${policyId}`, guidance: `Verify ${policyId}` }],
      };
    }),
  };
}

const technical = { language: "fixture", framework: "fixture" };

describe("implementation compiler", () => {
  it("generates all shared-contract artifacts and agent-neutral Markdown", () => {
    const result = compileImplementationArtifacts({ manifest, technical, adapter: createAdapter() });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artifacts).toMatchObject({
      implementation_plan: { source_compilation_id: manifest.compilation_id },
      test_manifest: { source_compilation_id: manifest.compilation_id },
      verification_manifest: { source_compilation_id: manifest.compilation_id },
    });
    expect(result.artifacts.implementation_task).toMatch(/^# Implementation Task\n/u);
    expect(result.artifacts.implementation_task).not.toMatch(/codex|claude|openai|anthropic/iu);
  });

  it("is deterministic when manifest and mapping arrays are reversed", () => {
    const first = compileImplementationArtifacts({ manifest, technical, adapter: createAdapter() });
    const second = compileImplementationArtifacts({
      manifest: { ...manifest, obligations: [...manifest.obligations].reverse() },
      technical,
      adapter: { ...createAdapter(), mappings: [...createAdapter().mappings].reverse() },
    });
    expect(second).toEqual(first);
  });

  it("stops blocked and conflicting manifests before adapter preflight", () => {
    for (const state of ["blocked", "conflict"] as const) {
      const result = compileImplementationArtifacts({
        manifest: { ...manifest, obligations: [{ ...manifest.obligations[0]!, resolution_state: state }] },
        technical,
        adapter: createAdapter(),
      });
      expect(result).toMatchObject({
        ok: false,
        kind: "policy",
        exit_code: state === "blocked" ? 3 : 4,
      });
    }
  });

  it("returns only adapter-report data for gaps", () => {
    const result = compileImplementationArtifacts({
      manifest,
      technical,
      adapter: createAdapter(["INPUT_VALIDATION"]),
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "adapter_gap",
      exit_code: 5,
      report: { gaps: [{ policy_id: "SAFE_LOGGING" }] },
    });
    expect(result).not.toHaveProperty("artifacts");
  });
});
