import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

interface WorkspacePackage {
  readonly directory: string;
  readonly name: string;
  readonly dependencies: readonly string[];
  readonly imports: readonly string[];
}

const CORE_PACKAGES = new Set([
  "@company/ces-business-rule-schema",
  "@company/ces-capability-registry",
  "@company/ces-capability-resolver",
  "@company/ces-policy-engine",
  "@company/ces-policy-manifest",
  "@company/ces-policy-registry",
  "@company/ces-project-schema",
  "@company/ces-requirement-schema",
]);

export function architectureViolations(packages: readonly WorkspacePackage[]): string[] {
  const names = new Set(packages.map(({ name }) => name));
  const violations: string[] = [];
  for (const workspacePackage of packages) {
    if (CORE_PACKAGES.has(workspacePackage.name)) {
      for (const dependency of workspacePackage.dependencies) {
        if (dependency.includes("adapter") || dependency.includes("implementation-compiler")) {
          violations.push(`${workspacePackage.name} has forbidden dependency ${dependency}`);
        }
      }
    }
    for (const imported of workspacePackage.imports) {
      if (names.has(imported) && !workspacePackage.dependencies.includes(imported)) {
        violations.push(`${workspacePackage.name} imports undeclared workspace package ${imported}`);
      }
    }
  }
  const graph = new Map(packages.map((item) => [item.name, item.dependencies.filter((dependency) => names.has(dependency))]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(name: string, trail: readonly string[]): void {
    if (visiting.has(name)) {
      violations.push(`Workspace dependency cycle: ${[...trail, name].join(" -> ")}`);
      return;
    }
    if (visited.has(name)) return;
    visiting.add(name);
    for (const dependency of graph.get(name) ?? []) visit(dependency, [...trail, name]);
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of [...names].sort()) visit(name, []);
  return [...new Set(violations)].sort();
}

function loadWorkspacePackages(): WorkspacePackage[] {
  return ["packages", "adapters", "apps"].flatMap((root) =>
    readdirSync(root, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && statSafe(join(root, entry.name, "package.json"), false),
      )
      .map((entry) => {
        const directory = join(root, entry.name);
        const manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8")) as {
          name: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const dependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
        const imports = sourceFiles(join(directory, "src")).flatMap((path) =>
          [...readFileSync(path, "utf8").matchAll(/(?:from\s+|import\s*\()["'](@company\/[^"']+)["']/gu)].map((match) => match[1]!),
        );
        return { directory, name: manifest.name, dependencies, imports };
      }),
  );
}

function sourceFiles(directory: string): string[] {
  if (!statSafe(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : entry.isFile() && path.endsWith(".ts") ? [path] : [];
  });
}

function statSafe(path: string, directory = true): boolean {
  try {
    return directory ? statSync(path).isDirectory() : statSync(path).isFile();
  } catch {
    return false;
  }
}

describe("architecture boundaries", () => {
  it("has no forbidden dependencies, undeclared workspace imports, or cycles", () => {
    expect(architectureViolations(loadWorkspacePackages())).toEqual([]);
  });

  it("fails an intentional forbidden core-to-adapter dependency fixture", () => {
    const violations = architectureViolations([
      { directory: "core", name: "@company/ces-policy-engine", dependencies: ["@company/ces-laravel-adapter"], imports: ["@company/ces-laravel-adapter"] },
      { directory: "adapter", name: "@company/ces-laravel-adapter", dependencies: [], imports: [] },
    ]);
    expect(violations).toContain(
      "@company/ces-policy-engine has forbidden dependency @company/ces-laravel-adapter",
    );
  });

  it("keeps production core source and Policy Manifests framework-neutral", () => {
    const coreSources = loadWorkspacePackages()
      .filter(({ name }) => CORE_PACKAGES.has(name))
      .flatMap(({ directory }) => sourceFiles(join(directory, "src")))
      .filter((path) => !path.endsWith(".test.ts"));
    const content = [
      ...coreSources.map((path) => `${relative(".", path)}\n${readFileSync(path, "utf8")}`),
      readFileSync("project's goal/evidence/phase-1/CES-009-laravel/policy-manifest.json", "utf8"),
    ].join("\n");
    expect(content).not.toMatch(/laravel|symfony|spring|nestjs|django|eloquent|artisan/iu);
  });
});
