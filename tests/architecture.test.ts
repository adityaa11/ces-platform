import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SyntaxKind } from "typescript/unstable/ast";
import { createScanner } from "typescript/unstable/ast/scanner";

interface WorkspacePackage {
  readonly directory: string;
  readonly name: string;
  readonly dependencies: readonly string[];
  readonly imports: readonly string[];
  readonly crossBoundaryImports?: readonly string[];
}

const ALLOWED_WORKSPACE_DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  "@company/ces-business-rule-schema": [],
  "@company/ces-capability-registry": [],
  "@company/ces-policy-manifest": [],
  "@company/ces-project-schema": [],
  "@company/ces-requirement-schema": ["@company/ces-business-rule-schema"],
  "@company/ces-policy-registry": ["@company/ces-capability-registry"],
  "@company/ces-capability-resolver": ["@company/ces-capability-registry", "@company/ces-policy-manifest", "@company/ces-requirement-schema"],
  "@company/ces-policy-engine": ["@company/ces-capability-resolver", "@company/ces-policy-manifest", "@company/ces-policy-registry", "@company/ces-project-schema", "@company/ces-requirement-schema"],
  "@company/ces-adapter-sdk": ["@company/ces-policy-manifest", "@company/ces-project-schema"],
  "@company/ces-implementation-compiler": ["@company/ces-adapter-sdk", "@company/ces-policy-manifest", "@company/ces-project-schema"],
  "@company/ces-verification-engine": ["@company/ces-adapter-sdk", "@company/ces-policy-manifest"],
  "@company/ces-laravel-adapter": ["@company/ces-adapter-sdk", "@company/ces-policy-manifest", "@company/ces-project-schema"],
  "@company/ces-test-fixture-adapter": ["@company/ces-adapter-sdk", "@company/ces-policy-manifest", "@company/ces-project-schema"],
  "@company/ces-integration-contracts": ["@company/ces-project-schema"],
  "@company/ces-bootstrap-runner": ["@company/ces-integration-contracts", "@company/ces-project-schema"],
  "@company/ces-cli": ["@company/ces-adapter-sdk", "@company/ces-implementation-compiler", "@company/ces-laravel-adapter", "@company/ces-policy-engine", "@company/ces-policy-manifest", "@company/ces-project-schema", "@company/ces-requirement-schema", "@company/ces-test-fixture-adapter", "@company/ces-verification-engine"],
};
const CORE_PACKAGES = new Set(Object.keys(ALLOWED_WORKSPACE_DEPENDENCIES).filter((name) => ["schema", "registry", "resolver", "policy-engine", "policy-manifest"].some((part) => name.includes(part))) );

export function architectureViolations(packages: readonly WorkspacePackage[]): string[] {
  const names = new Set(packages.map(({ name }) => name));
  const violations: string[] = [];
  for (const workspacePackage of packages) {
    const allowed = ALLOWED_WORKSPACE_DEPENDENCIES[workspacePackage.name];
    if (!allowed) violations.push(`Workspace package has no architecture assignment: ${workspacePackage.name}`);
    for (const dependency of workspacePackage.dependencies.filter((name) => names.has(name))) {
      if (!allowed?.includes(dependency)) violations.push(`${workspacePackage.name} has forbidden dependency ${dependency}`);
    }
    for (const imported of workspacePackage.imports) {
      if (names.has(imported) && !workspacePackage.dependencies.includes(imported)) {
        violations.push(`${workspacePackage.name} imports undeclared workspace package ${imported}`);
      }
    }
    for (const imported of workspacePackage.crossBoundaryImports ?? []) violations.push(`${workspacePackage.name} has relative cross-package import ${imported}`);
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
        const sources = sourceFiles(join(directory, "src"));
        const imports = sources.flatMap((path) => importSpecifiers(readFileSync(path, "utf8"))).filter((specifier) => specifier.startsWith("@company/"));
        const crossBoundaryImports = sources.flatMap((path) => importSpecifiers(readFileSync(path, "utf8"))
          .filter((specifier) => specifier.startsWith("."))
          .filter((specifier) => { const target = resolve(dirname(path), specifier); const boundary = relative(directory, target); return boundary === ".." || boundary.startsWith(`..${pathSeparator()}`); })
          .map((specifier) => `${relative(directory, path)} -> ${specifier}`));
        return { directory, name: manifest.name, dependencies, imports, crossBoundaryImports };
      }),
  );
}

function importSpecifiers(source: string): string[] {
  const scanner = createScanner(true, undefined, source);
  const tokens: Array<{ kind: SyntaxKind; value: string }> = [];
  for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) tokens.push({ kind, value: scanner.getTokenValue() });
  const specifiers: string[] = [];
  for (const [index, token] of tokens.entries()) {
    if (token.kind === SyntaxKind.ImportKeyword) {
      const direct = tokens[index + 1]?.kind === SyntaxKind.StringLiteral ? tokens[index + 1] : tokens[index + 1]?.kind === SyntaxKind.OpenParenToken && tokens[index + 2]?.kind === SyntaxKind.StringLiteral ? tokens[index + 2] : undefined;
      if (direct) specifiers.push(direct.value);
      else addFollowingFrom(tokens, index, specifiers);
    } else if (token.kind === SyntaxKind.ExportKeyword) addFollowingFrom(tokens, index, specifiers);
    else if (token.kind === SyntaxKind.RequireKeyword && tokens[index + 1]?.kind === SyntaxKind.OpenParenToken && tokens[index + 2]?.kind === SyntaxKind.StringLiteral) specifiers.push(tokens[index + 2]!.value);
  }
  return specifiers;
}
function addFollowingFrom(tokens: readonly { kind: SyntaxKind; value: string }[], start: number, specifiers: string[]): void {
  for (let index = start + 1; index < tokens.length && tokens[index]?.kind !== SyntaxKind.SemicolonToken; index += 1) {
    if (tokens[index]?.kind === SyntaxKind.FromKeyword && tokens[index + 1]?.kind === SyntaxKind.StringLiteral) { specifiers.push(tokens[index + 1]!.value); return; }
  }
}
function pathSeparator(): string { return process.platform === "win32" ? "\\" : "/"; }

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

  it("fails closed for neutral-name packages and relative cross-package imports", () => {
    const violations = architectureViolations([
      { directory: "core", name: "@company/ces-policy-manifest", dependencies: ["@company/neutral-delivery"], imports: ["@company/neutral-delivery"], crossBoundaryImports: ["src/index.ts -> ../../delivery/src/index.js"] },
      { directory: "delivery", name: "@company/neutral-delivery", dependencies: [], imports: [] },
    ]);
    expect(violations).toContain("@company/ces-policy-manifest has forbidden dependency @company/neutral-delivery");
    expect(violations).toContain("Workspace package has no architecture assignment: @company/neutral-delivery");
    expect(violations).toContain("@company/ces-policy-manifest has relative cross-package import src/index.ts -> ../../delivery/src/index.js");
  });

  it("recognizes static and dynamic workspace imports", () => {
    expect(importSpecifiers(`import value from "@company/static"; export { value } from "@company/exported"; await import("@company/dynamic"); type T = import("@company/type").T;`))
      .toEqual(["@company/static", "@company/exported", "@company/dynamic", "@company/type"]);
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
