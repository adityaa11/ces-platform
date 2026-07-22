import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PolicyManifestSchema } from "../packages/policy-manifest/src/index.js";
import { compileTestFixture } from "../adapters/test-fixture/src/index.js";
import { compileLaravelAdapter } from "../adapters/laravel/src/index.js";
import { describe, expect, it } from "vitest";

describe("cross-adapter Policy Manifest portability", () => {
  it("passes the same unchanged profile manifest to Laravel and fixture adapters", () => {
    const manifest = PolicyManifestSchema.parse(
      JSON.parse(
        readFileSync(
          resolve("project's goal/evidence/phase-1/CES-004-policy-manifest.json"),
          "utf8",
        ),
      ),
    );
    const before = JSON.stringify(manifest);
    const fixture = compileTestFixture({
      manifest,
      technical: { language: "fixture", framework: "fixture" },
      test_mode: true,
    });
    const laravel = compileLaravelAdapter({
      manifest,
      technical: { language: "php", framework: "laravel" },
    });

    expect(fixture.ok).toBe(true);
    expect(laravel.ok).toBe(true);
    if (!fixture.ok || !laravel.ok) return;
    expect(fixture.implementation_package.source_compilation_id).toBe(
      laravel.implementation_package.source_compilation_id,
    );
    expect(fixture.implementation_package.source_compilation_id).toBe(
      manifest.compilation_id,
    );
    expect(JSON.stringify(manifest)).toBe(before);
  });
});
