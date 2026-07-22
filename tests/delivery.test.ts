import { readFileSync, readdirSync } from "node:fs";
import { compilePolicyManifest } from "../packages/policy-engine/src/index.js";
import { parseProjectText, splitProjectContext } from "../packages/project-schema/src/index.js";
import { parseRequirementText } from "../packages/requirement-schema/src/index.js";
import { describe, expect, it } from "vitest";

const project = parseProjectText(readFileSync("examples/laravel-project.yaml", "utf8"), "yaml");
const { assurance, ces } = splitProjectContext(project);

describe("Phase 1 delivery", () => {
  it("ships resolved and blocked profile-picture examples", () => {
    const resolved = compilePolicyManifest({
      requirement: parseRequirementText(readFileSync("examples/profile-picture.requirement.yaml", "utf8"), "yaml"),
      assurance,
      ces_baseline_version: ces.baseline_version,
    });
    const blocked = compilePolicyManifest({
      requirement: parseRequirementText(readFileSync("examples/profile-picture.blocked.yaml", "utf8"), "yaml"),
      assurance,
      ces_baseline_version: ces.baseline_version,
    });
    expect(resolved.exit_code).toBe(0);
    expect(blocked).toMatchObject({ exit_code: 3 });
    expect(blocked.manifest.obligations).toContainEqual(
      expect.objectContaining({
        policy_id: "REPLACED_RESOURCE_LIFECYCLE",
        resolution_state: "blocked",
      }),
    );
  });

  it("attaches complete portable outputs and core-only blocked diagnostics", () => {
    const expected = [
      "implementation-plan.json",
      "implementation-task.md",
      "policy-manifest.json",
      "requirement-package.json",
      "test-manifest.json",
      "verification-manifest.json",
    ];
    expect(readdirSync("project's goal/evidence/phase-1/CES-012-laravel").sort()).toEqual(expected);
    expect(readdirSync("project's goal/evidence/phase-1/CES-012-fixture").sort()).toEqual(expected);
    expect(readFileSync("project's goal/evidence/phase-1/CES-012-laravel/policy-manifest.json"))
      .toEqual(readFileSync("project's goal/evidence/phase-1/CES-012-fixture/policy-manifest.json"));
    expect(readdirSync("project's goal/evidence/phase-1/CES-012-blocked").sort()).toEqual([
      "policy-manifest.json",
      "requirement-package.json",
    ]);
  });

  it("pins Node and pnpm in a multi-stage local Docker image", () => {
    const dockerfile = readFileSync("Dockerfile", "utf8");
    expect(dockerfile.match(/^FROM /gmu)).toHaveLength(2);
    expect(dockerfile).toContain("node:24.12.0-bookworm-slim");
    expect(dockerfile).toContain("pnpm@11.15.1");
    expect(dockerfile).toContain('ENTRYPOINT ["node", "apps/cli/dist/index.js"]');
  });

  it("uses a repository-only CI workflow with Docker validation", () => {
    const workflow = readFileSync(".github/workflows/test.yml", "utf8");
    expect(workflow).not.toContain("workflow_call");
    expect(workflow).toContain("corepack pnpm check");
    expect(workflow).toContain("docker build -t ces-cli:local .");
  });

  it("documents deferred scope without implementing it", () => {
    const guide = readFileSync("docs/phase-1.md", "utf8");
    expect(guide).toContain("Natural-language PRD extraction is a Phase 3 flow");
    expect(guide).toContain("Overrides, exceptions, and governance are Phase 5 targets");
    expect(guide).toContain("not approved production guidance");
    expect(guide).not.toMatch(/requirement\s*(?:→|->)\s*laravel/iu);
  });
});
