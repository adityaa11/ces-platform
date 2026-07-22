import { access, mkdtemp, mkdir, readFile, utimes, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CANONICAL_CES_REPOSITORY, acquirePublicationLock, corepackInvocation, defaultDependencies, runCes, sanitizedEnvironment, type ProcessOptions, type ProcessResult, type RunnerDependencies } from "./index.js";

const commit = "0123456789abcdef0123456789abcdef01234567";

describe("adapter-neutral bootstrap runner", () => {
  it("uses direct Corepack execution on POSIX and the command processor on Windows", () => {
    expect(corepackInvocation(["pnpm", "--version"], "linux")).toEqual({ command: "corepack", args: ["pnpm", "--version"] });
    expect(corepackInvocation(["pnpm", "--version"], "win32", "cmd.exe")).toEqual({ command: "cmd.exe", args: ["/d", "/s", "/c", "corepack", "pnpm", "--version"] });
  });

  it("removes dangerous Git redirection variables from child environments", () => {
    const previous = process.env.GIT_DIR;
    process.env.GIT_DIR = "client-controlled";
    try {
      expect(sanitizedEnvironment(undefined)).not.toHaveProperty("GIT_DIR");
      expect(sanitizedEnvironment(undefined)).toMatchObject({ CI: "true", GIT_TERMINAL_PROMPT: "0" });
    } finally {
      if (previous === undefined) delete process.env.GIT_DIR;
      else process.env.GIT_DIR = previous;
    }
  });

  it("uses a fresh external checkout with hooks disabled and ignores a pre-seeded client checkout", async () => {
    const workspace = await fixture();
    const marker = join(workspace, "hook-marker");
    await writeFileEnsured(join(workspace, ".ces-runtime", "checkout", ".git", "hooks", "post-checkout"), `marker=${marker}`);
    const observations: Array<{ command: string; args: readonly string[]; options?: ProcessOptions }> = [];
    await runCes({ workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" }, fakeDependencies(workspace, [], async (args) => {
      const output = option(args, "--output");
      await successArtifacts(output, "secure");
      return result(0);
    }, observations));
    const clone = observations.find(({ command, args }) => command === "git" && args.includes("clone"))!;
    expect(clone.args.at(-1)).not.toContain(workspace);
    expect(clone.args.some((arg) => arg.startsWith("core.hooksPath="))).toBe(true);
    expect(clone.options?.environment).toMatchObject({ GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "Never" });
    await expect(access(marker)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("times out hanging commands and bounds captured output while streaming a log", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-process-policy-"));
    const dependencies = defaultDependencies();
    const hanging = await dependencies.execute(process.execPath, ["-e", "setInterval(() => {}, 1000)"], directory, { timeoutMs: 50 });
    expect(hanging).toMatchObject({ timedOut: true });
    const logPath = join(directory, "large.log");
    const large = await dependencies.execute(process.execPath, ["-e", "process.stdout.write('x'.repeat(200000)); process.stderr.write('y'.repeat(200000))"], directory, { timeoutMs: 5_000, logPath });
    expect(Buffer.byteLength(large.stdout)).toBeLessThanOrEqual(64 * 1024);
    expect(Buffer.byteLength(large.stderr)).toBeLessThanOrEqual(64 * 1024);
    expect((await readFile(logPath)).byteLength).toBeGreaterThan(64 * 1024);
  });

  it("terminates a timed-out process tree and supports user cancellation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-process-tree-"));
    const marker = join(directory, "orphan-marker");
    const script = `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'orphan'), 500)`)}],{stdio:'ignore'}); setInterval(() => {}, 1000);`;
    const dependencies = defaultDependencies();
    expect(await dependencies.execute(process.execPath, ["-e", script], directory, { timeoutMs: 50 })).toMatchObject({ timedOut: true });
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 700));
    await expect(access(marker)).rejects.toMatchObject({ code: "ENOENT" });

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);
    expect(await dependencies.execute(process.execPath, ["-e", "setInterval(() => {}, 1000)"], directory, { timeoutMs: 5_000, signal: controller.signal })).toMatchObject({ aborted: true });
  });
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

  it("serializes parallel publication so the final output belongs to exactly one execution", async () => {
    const workspace = await fixture();
    const options = { workspace, requirement: ".ces/requirements/REQ-1.yaml", output: ".ces/generated/REQ-1" };
    const dependencies = (marker: string) => fakeDependencies(workspace, [], async (args) => {
      const output = option(args, "--output");
      await successArtifacts(output, marker);
      return result(0);
    });
    expect(await Promise.all([runCes(options, dependencies("first")), runCes(options, dependencies("second"))])).toEqual([0, 0]);
    const final = join(workspace, ".ces", "generated", "REQ-1");
    const plan = await json(join(final, "adapters", "example-adapter", "implementation-plan.json")) as { marker: string };
    const requirement = await json(join(final, "core", "requirement-package.json")) as { requirement: { id: string } };
    const report = await json(join(final, "execution-report.json")) as { requirement_id: string };
    expect([requirement.requirement.id, report.requirement_id]).toEqual([plan.marker, plan.marker]);
  });

  it("rejects active publication locks and recovers locks older than the stale policy", async () => {
    const workspace = await fixture();
    const runtime = join(workspace, ".ces-runtime");
    const final = join(workspace, ".ces", "generated", "REQ-1");
    const lock = join(runtime, "locks", `${createHash("sha256").update(final).digest("hex")}.lock`);
    await mkdir(lock, { recursive: true });
    await expect(acquirePublicationLock(runtime, final, "second", { waitMs: 20, staleMs: 60_000 })).rejects.toMatchObject({ code: "CES_PUBLICATION_LOCKED" });
    const old = new Date(Date.now() - 120_000);
    await utimes(lock, old, old);
    const release = await acquirePublicationLock(runtime, final, "recovered", { waitMs: 20, staleMs: 60_000 });
    expect(await json(join(lock, "owner.json"))).toMatchObject({ execution_id: "recovered" });
    await release();
    await expect(access(lock)).rejects.toMatchObject({ code: "ENOENT" });
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

function fakeDependencies(workspace: string, calls: string[][], compile: (args: readonly string[]) => Promise<ProcessResult> = async () => result(0), observations: Array<{ command: string; args: readonly string[]; options?: ProcessOptions }> = []): RunnerDependencies & { beforePublish?: RunnerDependencies["beforePublish"] } {
  void workspace;
  return {
    nodeVersion: "24.12.0",
    execute: async (command, args, _cwd, options) => {
      calls.push([command, ...args]);
      observations.push({ command, args, ...(options ? { options } : {}) });
      const cloneIndex = args.indexOf("clone");
      if (command === "git" && cloneIndex >= 0) {
        const checkout = args.at(-1)!;
        expect(args).toContain(CANONICAL_CES_REPOSITORY);
        await mkdir(join(checkout, ".git"), { recursive: true });
        await mkdir(join(checkout, "apps", "cli", "src"), { recursive: true });
        await mkdir(join(checkout, "apps", "cli", "dist"), { recursive: true });
        await writeJson(join(checkout, "package.json"), { packageManager: "pnpm@11.15.1", engines: { node: "24.12.0", pnpm: "11.15.1" } });
        await writeFile(join(checkout, ".node-version"), "24.12.0\n", "utf8");
        await writeFile(join(checkout, "apps", "cli", "src", "index.ts"), "", "utf8");
        await writeFile(join(checkout, "apps", "cli", "dist", "index.js"), "", "utf8");
        return result(0);
      }
      if (command === "git" && args.includes("rev-parse")) return result(0, `${commit}\n`);
      if (command === "git" && args.includes("get-url")) return result(0, `${CANONICAL_CES_REPOSITORY}\n`);
      if ((command === "corepack" || args.includes("corepack")) && args.includes("--version")) return result(0, "11.15.1\n");
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
async function successArtifacts(output: string, marker: string): Promise<void> {
  await writeJson(join(output, "core", "requirement-package.json"), { requirement: { id: marker } });
  await writeJson(join(output, "core", "policy-manifest.json"), { requirement_id: marker, compilation_id: `sha256:${"a".repeat(64)}`, obligations: [] });
  await writeJson(join(output, "adapters", "example-adapter", "implementation-plan.json"), { marker });
  await writeFileEnsured(join(output, "adapters", "example-adapter", "implementation-task.md"), marker);
  await writeJson(join(output, "adapters", "example-adapter", "test-manifest.json"), { marker });
  await writeJson(join(output, "adapters", "example-adapter", "verification-manifest.json"), { marker });
}
