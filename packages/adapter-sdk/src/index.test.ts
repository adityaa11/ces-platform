import { describe, expect, it } from "vitest";
import {
  AdapterCompatibilityError,
  AdapterDefinitionSchema,
  ImplementationPackageSchema,
  createAdapterRegistry,
  prepareAdapterCompilation,
} from "./index.js";

const manifest = {
  schema_version: "1.0.0" as const,
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
  obligations: [
    {
      policy_id: "INPUT_VALIDATION",
      requirement_level: "mandatory" as const,
      resolution_state: "resolved" as const,
      parameters: {},
      reasons: ["External input"],
      evidence: [],
      source_rule_ids: ["POL-1"],
      business_rule_ids: [],
      missing_inputs: [],
    },
  ],
};

const technical = { language: "fixture-language", framework: "fixture-framework" };
const guidance = {
  id: "ITEM-1",
  source_policy_id: "INPUT_VALIDATION",
  mapping_id: "MAP-INPUT-1",
  mapping_version: "0.1.0",
  guidance: "Validate external input at the system boundary",
};
const adapter = {
  metadata: {
    schema_version: "1.0.0" as const,
    adapter: { id: "contract-fixture", version: "0.1.0", mapping_version: "0.1.0" },
    compatible_policy_manifest_versions: ["1.0.0"],
    technical_compatibility: { languages: ["fixture-language"], frameworks: ["fixture-framework"] },
  },
  mappings: [
    {
      id: "MAP-INPUT-1",
      policy_id: "INPUT_VALIDATION",
      support: "supported" as const,
      reason: "Fixture mapping",
      implementation: [guidance],
      tests: [{ ...guidance, id: "TEST-1" }],
      verification: [{ ...guidance, id: "CHECK-1" }],
    },
  ],
};

describe("Adapter SDK", () => {
  it("prepares a supported adapter without changing the source manifest", () => {
    const before = JSON.stringify(manifest);
    const result = prepareAdapterCompilation({ manifest, technical, adapter });

    expect(result).toMatchObject({ ok: true, exit_code: 0 });
    expect(JSON.stringify(manifest)).toBe(before);
  });

  it("returns only a structured report and exit code 5 for mandatory gaps", () => {
    const result = prepareAdapterCompilation({
      manifest,
      technical,
      adapter: { ...adapter, mappings: [] },
    });

    expect(result).toEqual({
      ok: false,
      exit_code: 5,
      report: {
        schema_version: "1.0.0",
        source_compilation_id: manifest.compilation_id,
        adapter: adapter.metadata.adapter,
        status: "gaps_found",
        gaps: [
          {
            policy_id: "INPUT_VALIDATION",
            adapter_id: "contract-fixture",
            adapter_version: "0.1.0",
            status: "unsupported",
            reason: "The selected adapter version has no mapping for this policy",
          },
        ],
      },
    });
    expect(result).not.toHaveProperty("implementation_package");
  });

  it("requires mapping provenance on every derived item", () => {
    expect(() =>
      AdapterDefinitionSchema.parse({
        ...adapter,
        mappings: [
          {
            ...adapter.mappings[0],
            implementation: [{ ...guidance, mapping_id: "WRONG" }],
          },
        ],
      }),
    ).toThrow(/must preserve mapping/u);
  });

  it("includes adapter and mapping versions in derived output contracts", () => {
    expect(
      ImplementationPackageSchema.parse({
        schema_version: "1.0.0",
        source_requirement_id: "REQ-1",
        source_compilation_id: manifest.compilation_id,
        ces_baseline_version: "0.1.0",
        policy_registry_version: "0.1.0",
        adapter: adapter.metadata.adapter,
        implementation_items: [guidance],
      }).adapter.mapping_version,
    ).toBe("0.1.0");
  });

  it("enforces manifest and technical compatibility", () => {
    expect(() =>
      prepareAdapterCompilation({
        manifest,
        technical: { ...technical, language: "unsupported-language" },
        adapter,
      }),
    ).toThrow(AdapterCompatibilityError);
  });

  it("rejects blocked manifests before adapter mapping", () => {
    expect(() =>
      prepareAdapterCompilation({
        manifest: {
          ...manifest,
          obligations: [{ ...manifest.obligations[0]!, resolution_state: "blocked", missing_inputs: ["fact"] }],
        },
        technical,
        adapter,
      }),
    ).toThrow(/cannot be passed to an adapter/u);
  });

  it("registers adapters explicitly by ID and version", () => {
    const registry = createAdapterRegistry([adapter]);
    expect(registry.get("contract-fixture", "0.1.0")).toEqual(adapter);
    expect(() => registry.get("missing", "0.1.0")).toThrow(/not registered/u);
    expect(() => createAdapterRegistry([adapter, adapter])).toThrow(/Duplicate adapter/u);
  });

  it("contains no production-framework defaults", () => {
    expect(JSON.stringify({ adapter, schemas: ["implementation", "test", "verification"] }))
      .not.toMatch(/laravel|symfony|spring|\.net|nestjs|django/iu);
  });
});
