import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CANONICAL_CES_REPOSITORY, runCes, type ProcessResult, type RunnerDependencies } from "./index.js";

const commit = "0123456789abcdef0123456789abcdef01234567";

describe("adapter-neutral bootstrap runner", () => {
  it("checks out the lock, validates toolchains, compiles without an adapter flag, and reports current artifacts", async () => {
    const workspace = await fixture();
    const calls: string[][] = [];
    const dependencies = fakeDependencies(workspace, calls, async (args) => {
      const output = option(args, "--output");
      await writeJson(join(output, "core", "requirement-package.json"), { requirement: { id: "REQ-1" } });
      await writeJson(join(output, "core", "policy-manifest.json"), { requirement_id: "REQ-1", compilation_id: `sha256:${"a".repeat(64)}`, obligations: [] });
      await writeJson(join(output, "adapters", "example-adapter", "implementation-plan.json"), {});
      await writeFileEnsured(join(output, "adapters", "example-adapter", "implementation-task.md"), "task\n");
      await writeJson(join(output, "adapters", "example-adapter", "test-manifest.json"), {});
      await writeJson(join(output, "adapters", "example-adapter", "verification-manifest.json"), {});
      return result(0);
    });

    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(0);
    const compile = calls.find((args) => args.includes("compile"))!;
    expect(compile).not.toContain("--adapter");
    expect(compile).not.toContain("--override-adapter");
    const report = await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"));
    expect(report).toMatchObject({ status: "success", runner_exit_code: 0, phase_1_exit_code: 0, requirement_id: "REQ-1", adapter: { id: "example-adapter", version: "0.1.0" } });
    expect((report as { artifacts: { adapter: string[] } }).artifacts.adapter).toEqual([
      "adapters/example-adapter/implementation-plan.json", "adapters/example-adapter/implementation-task.md",
      "adapters/example-adapter/test-manifest.json", "adapters/example-adapter/verification-manifest.json",
    ]);
  });

  it("publishes a stable pre-invocation report for an adapter mismatch", async () => {
    const workspace = await fixture({ lockAdapter: "other-adapter" });
    const calls: string[][] = [];
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, fakeDependencies(workspace, calls))).toBe(1);
    expect(calls).toEqual([]);
    const report = await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"));
    expect(report).toMatchObject({
      status: "input_error", runner_exit_code: 1, artifacts: {}, diagnostics: [{ code: "CES_ADAPTER_ID_MISMATCH" }],
    });
    expect(report).not.toHaveProperty("ces");
    expect(report).not.toHaveProperty("adapter");
  });

  it("rejects a runtime mismatch before install and omits the Phase 1 exit code", async () => {
    const workspace = await fixture();
    const calls: string[][] = [];
    const dependencies = { ...fakeDependencies(workspace, calls), nodeVersion: "23.0.0" };
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(1);
    expect(calls.some((args) => args.includes("install"))).toBe(false);
    const report = await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json")) as Record<string, unknown>;
    expect(report).toMatchObject({ status: "execution_error", diagnostics: [{ code: "CES_NODE_VERSION_MISMATCH" }] });
    expect(report).not.toHaveProperty("phase_1_exit_code");
  });

  it("replaces stale success output with a core-only blocked outcome", async () => {
    const workspace = await fixture();
    const final = join(workspace, ".ces", "generated", "REQ-1");
    await writeFileEnsured(join(final, "adapters", "example-adapter", "stale.json"), "stale");
    const dependencies = fakeDependencies(workspace, [], async (args) => {
      const output = option(args, "--output");
      await writeJson(join(output, "core", "requirement-package.json"), { requirement: { id: "REQ-1" } });
      await writeJson(join(output, "core", "policy-manifest.json"), { requirement_id: "REQ-1", compilation_id: `sha256:${"b".repeat(64)}`, obligations: [{ policy_id: "REPLACED_RESOURCE_LIFECYCLE", resolution_state: "blocked" }] });
      return result(3);
    });
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(3);
    await expect(readFile(join(final, "adapters", "example-adapter", "stale.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(await json(join(final, "execution-report.json"))).toMatchObject({ status: "blocked", runner_exit_code: 3, diagnostics: [{ code: "CES_POLICY_BLOCKED", policy_id: "REPLACED_RESOURCE_LIFECYCLE" }] });
  });

  it("restores the coherent previous output when publication fails", async () => {
    const workspace = await fixture();
    const final = join(workspace, ".ces", "generated", "REQ-1");
    await writeFileEnsured(join(final, "previous.txt"), "previous");
    const dependencies = fakeDependencies(workspace, [], async (args) => {
      const output = option(args, "--output");
      await writeJson(join(output, "core", "requirement-package.json"), { requirement: { id: "REQ-1" } });
      await writeJson(join(output, "core", "policy-manifest.json"), { requirement_id: "REQ-1", compilation_id: `sha256:${"c".repeat(64)}`, obligations: [] });
      await writeJson(join(output, "adapters", "example-adapter", "implementation-plan.json"), {});
      await writeFileEnsured(join(output, "adapters", "example-adapter", "implementation-task.md"), "task\n");
      await writeJson(join(output, "adapters", "example-adapter", "test-manifest.json"), {});
      await writeJson(join(output, "adapters", "example-adapter", "verification-manifest.json"), {});
      return result(0);
    });
    dependencies.beforePublish = async () => { throw new Error("controlled publication failure"); };
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(1);
    expect(await readFile(join(final, "previous.txt"), "utf8")).toBe("previous");
  });

  it("classifies an invalid commit lock as a runner input error before Git", async () => {
    const workspace = await fixture();
    await writeFileEnsured(join(workspace, ".ces", "ces.lock"), "schema_version: 1.0.0\nces: { commit: main }\nadapter: { id: example-adapter, version: 0.1.0 }\n");
    const calls: string[][] = [];
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, fakeDependencies(workspace, calls))).toBe(1);
    expect(calls).toEqual([]);
    expect(await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"))).toMatchObject({ status: "input_error", diagnostics: [{ code: "CES_LOCK_INVALID" }] });
  });

  it("rejects an incorrect checked-out HEAD before installation", async () => {
    const workspace = await fixture();
    const calls: string[][] = [];
    const base = fakeDependencies(workspace, calls);
    const execute = base.execute;
    const dependencies: RunnerDependencies = { ...base, execute: async (command, args, cwd) => args.includes("rev-parse") ? result(0, `${"f".repeat(40)}\n`) : execute(command, args, cwd) };
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(1);
    expect(calls.some((args) => args.includes("install"))).toBe(false);
    const report = await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"));
    expect(report).toMatchObject({ status: "execution_error", diagnostics: [{ code: "CES_HEAD_MISMATCH" }] });
    expect(report).not.toHaveProperty("ces");
  });

  it("publishes actual core artifacts produced before a Phase 1 input error", async () => {
    const workspace = await fixture();
    const dependencies = fakeDependencies(workspace, [], async (args) => {
      const output = option(args, "--output");
      await writeJson(join(output, "core", "requirement-package.json"), { requirement: { id: "REQ-1" } });
      await writeJson(join(output, "core", "policy-manifest.json"), { requirement_id: "REQ-1", compilation_id: `sha256:${"d".repeat(64)}`, obligations: [] });
      return result(2);
    });
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(2);
    expect(await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"))).toMatchObject({ status: "input_error", phase_1_exit_code: 2, diagnostics: [{ code: "CES_INPUT_INVALID" }] });
  });

  it("derives an adapter-gap path and identity entirely from configuration", async () => {
    const workspace = await fixture();
    const dependencies = fakeDependencies(workspace, [], async (args) => {
      const output = option(args, "--output");
      await writeJson(join(output, "core", "requirement-package.json"), { requirement: { id: "REQ-1" } });
      await writeJson(join(output, "core", "policy-manifest.json"), { requirement_id: "REQ-1", compilation_id: `sha256:${"e".repeat(64)}`, obligations: [] });
      await writeJson(join(output, "adapters", "example-adapter", "adapter-report.json"), { status: "gaps_found" });
      return result(5);
    });
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(5);
    expect(await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"))).toMatchObject({
      status: "adapter_gap", adapter: { id: "example-adapter" },
      artifacts: { adapter: ["adapters/example-adapter/adapter-report.json"] },
      diagnostics: [{ code: "CES_ADAPTER_GAP", adapter_id: "example-adapter" }],
    });
  });

  it("contains no framework-specific execution branch or universal path", async () => {
    const source = await readFile("packages/bootstrap-runner/src/index.ts", "utf8");
    expect(source).not.toMatch(/laravel|symfony|django|spring|nestjs/iu);
  });

  it("rejects an unsupported CES baseline before checkout", async () => {
    const workspace = await fixture();
    const projectPath = join(workspace, ".ces", "project.yaml");
    await writeFile(projectPath, (await readFile(projectPath, "utf8")).replace("baseline_version: 0.1.0", "baseline_version: 9.9.9"), "utf8");
    const calls: string[][] = [];
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, fakeDependencies(workspace, calls))).toBe(1);
    expect(calls).toEqual([]);
    expect(await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"))).toMatchObject({ status: "input_error", diagnostics: [{ code: "CES_BASELINE_UNSUPPORTED" }] });
  });

  it.each([
    { boundary: "fetch", code: "CES_CHECKOUT_FAILED" },
    { boundary: "install", code: "CES_INSTALL_FAILED" },
    { boundary: "build", code: "CES_BUILD_FAILED" },
  ])("reports a controlled $boundary execution failure without invoking Phase 1", async ({ boundary, code }) => {
    const workspace = await fixture();
    const calls: string[][] = [];
    const base = fakeDependencies(workspace, calls);
    const execute = base.execute;
    const dependencies: RunnerDependencies = {
      ...base,
      execute: async (command, args, cwd) => args.includes(boundary) ? result(1) : execute(command, args, cwd),
    };
    expect(await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, dependencies)).toBe(1);
    expect(calls.some((args) => args.includes("compile"))).toBe(false);
    const report = await json(join(workspace, ".ces", "generated", "REQ-1", "execution-report.json"));
    expect(report).toMatchObject({ status: "execution_error", diagnostics: [{ code }] });
    expect(report).not.toHaveProperty("phase_1_exit_code");
  });
});

async function fixture(options: { lockAdapter?: string } = {}): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), "ces-runner-"));
  await writeFileEnsured(join(workspace, ".ces", "ces.lock"), `schema_version: "1.0.0"\nces:\n  commit: "${commit}"\nadapter:\n  id: ${options.lockAdapter ?? "example-adapter"}\n  version: "0.1.0"\n`);
  await writeFileEnsured(join(workspace, ".ces", "project.yaml"), `schema_version: 1.0.0\nproject: { id: example, name: Example }\nassurance: { exposure: private_network, criticality: standard }\ntechnical: { language: example, framework: example }\nces:\n  baseline_version: 0.1.0\n  adapter: { id: example-adapter, version: 0.1.0 }\n`);
  await writeFileEnsured(join(workspace, ".ces", "requirements", "REQ-1.yaml"), "schema_version: 1.0.0\n");
  return workspace;
}

function fakeDependencies(workspace: string, calls: string[][], compile: (args: readonly string[]) => Promise<ProcessResult> = async () => result(0)): RunnerDependencies & { beforePublish?: RunnerDependencies["beforePublish"] } {
  return {
    nodeVersion: "24.12.0",
    execute: async (command, args) => {
      calls.push([command, ...args]);
      const checkout = join(workspace, ".ces-runtime", "checkout");
      if (command === "git" && args[0] === "clone") {
        expect(args).toContain(CANONICAL_CES_REPOSITORY);
        await mkdir(join(checkout, ".git"), { recursive: true });
        await writeJson(join(checkout, "package.json"), { packageManager: "pnpm@11.15.1", engines: { node: "24.12.0", pnpm: "11.15.1" } });
        await writeFile(join(checkout, ".node-version"), "24.12.0\n", "utf8");
        return result(0);
      }
      if (command === "git" && args.includes("rev-parse")) return result(0, `${commit}\n`);
      if (args.includes("corepack") && args.includes("--version")) return result(0, "11.15.1\n");
      if (command === process.execPath) return compile(args);
      return result(0);
    },
  };
}
function result(exitCode: number, stdout = ""): ProcessResult { return { exitCode, stdout, stderr: "" }; }
function option(args: readonly string[], flag: string): string { const value = args[args.indexOf(flag) + 1]; if (!value) throw new Error(`Missing ${flag}`); return value; }
async function writeFileEnsured(path: string, content: string): Promise<void> { await mkdir(join(path, ".."), { recursive: true }); await writeFile(path, content, "utf8"); }
async function writeJson(path: string, value: unknown): Promise<void> { await writeFileEnsured(path, `${JSON.stringify(value)}\n`); }
async function json(path: string): Promise<unknown> { return JSON.parse(await readFile(path, "utf8")) as unknown; }
