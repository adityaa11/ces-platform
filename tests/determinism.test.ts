import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseProjectText } from "../packages/project-schema/src/index.js";
import { describe, expect, it } from "vitest";

const deterministicFiles = [
  "requirement-package.json",
  "policy-manifest.json",
  "implementation-plan.json",
  "implementation-task.md",
  "test-manifest.json",
  "verification-manifest.json",
].sort();

describe("cross-cutting determinism", () => {
  it("normalizes equivalent YAML and JSON project input", () => {
    const yaml = readFileSync("project's goal/evidence/phase-1/CES-009-project.yaml", "utf8");
    const parsedYaml = parseProjectText(yaml, "yaml");
    expect(parseProjectText(JSON.stringify(parsedYaml), "json")).toEqual(parsedYaml);
  });

  it("keeps the shared Policy Manifest byte-identical across adapters", () => {
    expect(readFileSync("project's goal/evidence/phase-1/CES-009-laravel/policy-manifest.json"))
      .toEqual(readFileSync("project's goal/evidence/phase-1/CES-009-fixture/policy-manifest.json"));
  });

  it("uses UTF-8-compatible LF output without timestamps or machine paths", () => {
    for (const directory of ["CES-009-laravel", "CES-009-fixture"]) {
      expect(readdirSync(`project's goal/evidence/phase-1/${directory}`).sort()).toEqual(deterministicFiles);
      for (const file of deterministicFiles) {
        const content = readFileSync(join("project's goal/evidence/phase-1", directory, file), "utf8");
        expect(content).not.toContain("\r");
        expect(content).not.toMatch(/(?:created_at|updated_at|timestamp|duration_ms)/iu);
        expect(content).not.toMatch(/[A-Z]:\\Users\\|\/home\/|\/Users\//u);
        expect(Buffer.from(content, "utf8").toString("utf8")).toBe(content);
      }
    }
  });
});
