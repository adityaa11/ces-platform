import { cp, mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../apps/cli/src/index.js";
import { runCes, type ProcessResult, type RunnerDependencies } from "../packages/bootstrap-runner/src/index.js";

const LOCKED_COMMIT = "200ff6dbda67efc846e024ec99b80f60e29737de";
const OUTPUT = ".ces/generated/REQ-USER-014";
const REQUIREMENT = ".ces/requirements/REQ-USER-014.yaml";

describe("Phase 2 client boundary", () => {
  it("crosses the checkout, toolchain, build, compile, report, and publication boundary", async () => {
    const workspace = await clientWorkspace();
    const calls: string[][] = [];
    expect(await runCes({ workspace, requirement: REQUIREMENT, output: OUTPUT }, integrationDependencies(workspace, calls))).toBe(0);

    expect(calls.some((args) => args.includes("fetch") && args.includes(LOCKED_COMMIT))).toBe(true);
    expect(calls.some((args) => args.includes("install") && args.includes("--frozen-lockfile"))).toBe(true);
    expect(calls.some((args) => args.includes("build"))).toBe(true);
    const compile = calls.find((args) => args.includes("compile"))!;
    expect(compile).not.toContain("--adapter");
    const report = await readJson(join(workspace, OUTPUT, "execution-report.json"));
    expect(report).toMatchObject({
      schema_version: "1.0.0", status: "success", runner_exit_code: 0, phase_1_exit_code: 0,
      requirement_id: "REQ-USER-014", ces: { commit: LOCKED_COMMIT }, adapter: { id: "laravel", version: "0.1.0" }, diagnostics: [],
    });
    expect((report as { artifacts: { core: string[]; adapter: string[] } }).artifacts).toEqual({
      core: ["core/policy-manifest.json", "core/requirement-package.json"],
      adapter: [
        "adapters/laravel/implementation-plan.json", "adapters/laravel/implementation-task.md",
        "adapters/laravel/test-manifest.json", "adapters/laravel/verification-manifest.json",
      ],
    });
  });

  it.each([
    { name: "blocked", exitCode: 3, status: "blocked", source: "examples/profile-picture.blocked.yaml" },
    { name: "conflict", exitCode: 4, status: "conflict", source: "project's goal/evidence/phase-1/CES-013-conflict-requirement.yaml" },
  ])("publishes a completed $name core-only outcome", async ({ exitCode, status, source }) => {
    const workspace = await clientWorkspace();
    await cp(source, join(workspace, REQUIREMENT));
    expect(await runCes({ workspace, requirement: REQUIREMENT, output: OUTPUT }, integrationDependencies(workspace))).toBe(exitCode);
    const report = await readJson(join(workspace, OUTPUT, "execution-report.json"));
    expect(report).toMatchObject({ status, runner_exit_code: exitCode, phase_1_exit_code: exitCode });
    expect((report as { artifacts: Record<string, string[]> }).artifacts).not.toHaveProperty("adapter");
  });

  it("publishes the configured adapter gap without implementation artifacts", async () => {
    const workspace = await clientWorkspace();
    await replaceInFile(join(workspace, ".ces", "ces.lock"), "id: laravel", "id: laravel-gap-fixture");
    await replaceInFile(join(workspace, ".ces", "project.yaml"), "id: laravel", "id: laravel-gap-fixture");
    expect(await runCes({ workspace, requirement: REQUIREMENT, output: OUTPUT }, integrationDependencies(workspace))).toBe(5);
    expect(await readJson(join(workspace, OUTPUT, "execution-report.json"))).toMatchObject({
      status: "adapter_gap", adapter: { id: "laravel-gap-fixture" },
      artifacts: { adapter: ["adapters/laravel-gap-fixture/adapter-report.json"] },
      diagnostics: [{ code: "CES_ADAPTER_GAP", adapter_id: "laravel-gap-fixture" }],
    });
  });

  it("distinguishes a Phase 1 input error from a runner input error", async () => {
    const phase1Workspace = await clientWorkspace();
    await writeFile(join(phase1Workspace, REQUIREMENT), "schema_version: 1.0.0\n", "utf8");
    expect(await runCes({ workspace: phase1Workspace, requirement: REQUIREMENT, output: OUTPUT }, integrationDependencies(phase1Workspace))).toBe(2);
    expect(await readJson(join(phase1Workspace, OUTPUT, "execution-report.json"))).toMatchObject({ status: "input_error", runner_exit_code: 2, phase_1_exit_code: 2, diagnostics: [{ code: "CES_INPUT_INVALID" }] });

    const runnerWorkspace = await clientWorkspace();
    await replaceInFile(join(runnerWorkspace, ".ces", "ces.lock"), "version: \"0.1.0\"", "version: \"9.9.9\"");
    expect(await runCes({ workspace: runnerWorkspace, requirement: REQUIREMENT, output: OUTPUT }, integrationDependencies(runnerWorkspace))).toBe(1);
    const runnerReport = await readJson(join(runnerWorkspace, OUTPUT, "execution-report.json")) as Record<string, unknown>;
    expect(runnerReport).toMatchObject({ status: "input_error", runner_exit_code: 1, diagnostics: [{ code: "CES_ADAPTER_VERSION_MISMATCH" }] });
    expect(runnerReport).not.toHaveProperty("phase_1_exit_code");
  });

  it("removes stale success artifacts when the next outcome is blocked", async () => {
    const workspace = await clientWorkspace();
    const dependencies = integrationDependencies(workspace);
    expect(await runCes({ workspace, requirement: REQUIREMENT, output: OUTPUT }, dependencies)).toBe(0);
    await cp("examples/profile-picture.blocked.yaml", join(workspace, REQUIREMENT));
    expect(await runCes({ workspace, requirement: REQUIREMENT, output: OUTPUT }, dependencies)).toBe(3);
    await expect(stat(join(workspace, OUTPUT, "adapters"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readJson(join(workspace, OUTPUT, "execution-report.json"))).toMatchObject({ status: "blocked" });
  });

  it.each([
    { name: "success", source: undefined, gap: false },
    { name: "blocked", source: "examples/profile-picture.blocked.yaml", gap: false },
    { name: "conflict", source: "project's goal/evidence/phase-1/CES-013-conflict-requirement.yaml", gap: false },
    { name: "adapter-gap", source: undefined, gap: true },
  ])("produces byte-identical independent $name outcomes", async ({ source, gap }) => {
    const left = await clientWorkspace();
    const right = await clientWorkspace();
    if (source) { await cp(source, join(left, REQUIREMENT)); await cp(source, join(right, REQUIREMENT)); }
    if (gap) {
      for (const workspace of [left, right]) {
        await replaceInFile(join(workspace, ".ces", "ces.lock"), "id: laravel", "id: laravel-gap-fixture");
        await replaceInFile(join(workspace, ".ces", "project.yaml"), "id: laravel", "id: laravel-gap-fixture");
      }
    }
    await runCes({ workspace: left, requirement: REQUIREMENT, output: OUTPUT }, integrationDependencies(left));
    await runCes({ workspace: right, requirement: REQUIREMENT, output: OUTPUT }, integrationDependencies(right));
    expect(await outputBytes(join(left, OUTPUT))).toEqual(await outputBytes(join(right, OUTPUT)));
  });

  it("restores the previous integration result when final promotion fails", async () => {
    const workspace = await clientWorkspace();
    const final = join(workspace, OUTPUT);
    await mkdir(final, { recursive: true });
    await writeFile(join(final, "previous-result.txt"), "coherent previous result\n", "utf8");
    const dependencies: RunnerDependencies = {
      ...integrationDependencies(workspace),
      beforePublish: async () => { throw new Error("controlled final promotion failure"); },
    };
    expect(await runCes({ workspace, requirement: REQUIREMENT, output: OUTPUT }, dependencies)).toBe(1);
    expect(await readFile(join(final, "previous-result.txt"), "utf8")).toBe("coherent previous result\n");
  });
});

async function clientWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "ces-phase-2-client-"));
  await mkdir(join(root, ".ces", "requirements"), { recursive: true });
  await mkdir(join(root, "scripts"), { recursive: true });
  await cp("examples/phase-2-client/.ces/ces.lock", join(root, ".ces", "ces.lock"));
  await cp("examples/phase-2-client/.ces/project.yaml", join(root, ".ces", "project.yaml"));
  await cp("examples/phase-2-client/.ces/requirements/REQ-USER-014.yaml", join(root, REQUIREMENT));
  await cp("examples/phase-2-client/scripts/run-ces.mjs", join(root, "scripts", "run-ces.mjs"));
  await cp("examples/phase-2-client/.gitignore", join(root, ".gitignore"));
  await cp("examples/phase-2-client/README.md", join(root, "README.md"));
  return root;
}

function integrationDependencies(workspace: string, calls: string[][] = []): RunnerDependencies {
  return {
    nodeVersion: "24.12.0",
    execute: async (command, args) => {
      calls.push([command, ...args]);
      const checkout = join(workspace, ".ces-runtime", "checkout");
      if (command === "git" && args[0] === "clone") {
        await mkdir(join(checkout, ".git"), { recursive: true });
        await writeFile(join(checkout, "package.json"), JSON.stringify({ packageManager: "pnpm@11.15.1", engines: { node: "24.12.0", pnpm: "11.15.1" } }), "utf8");
        await writeFile(join(checkout, ".node-version"), "24.12.0\n", "utf8");
        return processResult(0);
      }
      if (command === "git" && args.includes("get-url")) return processResult(0, "https://github.com/adityaa11/ces-platform.git\n");
      if (command === "git" && args.includes("rev-parse")) return processResult(0, `${LOCKED_COMMIT}\n`);
      if (args.includes("corepack") && args.includes("--version")) return processResult(0, "11.15.1\n");
      if (command === process.execPath) {
        const exitCode = await runCli(args.slice(1), { stdout: () => undefined, stderr: () => undefined });
        return processResult(exitCode);
      }
      return processResult(0);
    },
  };
}

function processResult(exitCode: number, stdout = ""): ProcessResult { return { exitCode, stdout, stderr: "" }; }
async function replaceInFile(path: string, before: string, after: string): Promise<void> { const content = await readFile(path, "utf8"); expect(content).toContain(before); await writeFile(path, content.replace(before, after), "utf8"); }
async function readJson(path: string): Promise<unknown> { return JSON.parse(await readFile(path, "utf8")) as unknown; }
async function outputBytes(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const path of await files(root)) result[path] = (await readFile(join(root, path))).toString("base64");
  return result;
}
async function files(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory() ? files(join(directory, entry.name), root) : [relative(root, join(directory, entry.name)).split(sep).join("/")]))).flat().sort();
}
