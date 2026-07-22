import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import {
  ExecutionReportSchema,
  parseCesLockText,
  phase1Status,
  readPinnedToolchain,
  validateVersionAgreement,
  type Diagnostic,
  type ExecutionReport,
} from "@company/ces-integration-contracts";
import { parseProjectText, type ProjectContext } from "@company/ces-project-schema";

export const CANONICAL_CES_REPOSITORY = "https://github.com/adityaa11/ces-platform.git" as const;

export interface ProcessResult { readonly exitCode: number; readonly stdout: string; readonly stderr: string; readonly timedOut?: boolean; readonly aborted?: boolean }
export interface ProcessOptions {
  readonly timeoutMs: number;
  readonly logPath?: string;
  readonly environment?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
}
export interface RunnerDependencies {
  readonly execute: (command: string, args: readonly string[], cwd: string, options?: ProcessOptions) => Promise<ProcessResult>;
  readonly nodeVersion: string;
  readonly beforePublish?: (staged: string, final: string) => Promise<void>;
}
export interface RunCesOptions {
  readonly workspace: string;
  readonly requirement: string;
  readonly output: string;
  readonly repository?: string;
  readonly signal?: AbortSignal;
}

const CORE_FILES = new Set(["core/requirement-package.json", "core/policy-manifest.json"]);
const IMPLEMENTATION_FILES = new Set(["implementation-plan.json", "implementation-task.md", "test-manifest.json", "verification-manifest.json"]);

export async function runCes(options: RunCesOptions, dependencies: RunnerDependencies = defaultDependencies()): Promise<number> {
  const workspace = resolve(options.workspace);
  const requirement = resolve(workspace, options.requirement);
  const projectPath = join(workspace, ".ces", "project.yaml");
  const lockPath = join(workspace, ".ces", "ces.lock");
  const finalOutput = resolve(workspace, options.output);
  const runtime = join(workspace, ".ces-runtime");
  const runRoot = await mkdtemp(join(tmpdir(), "ces-run-"));
  const checkout = join(runRoot, "checkout");
  const hooks = join(runRoot, "hooks");
  const gitConfig = join(runRoot, "gitconfig");
  const logs = join(runRoot, "logs");
  await mkdir(hooks, { recursive: true });
  await mkdir(logs, { recursive: true });
  await writeFile(gitConfig, "", "utf8");
  let invoked = false;
  let lock: ReturnType<typeof parseCesLockText> | undefined;
  let project: ProjectContext | undefined;
  let commitValidated = false;
  let adapterValidated = false;
  let ownedStaging: string | undefined;

  try {
    assertInside(workspace, requirement, "requirement");
    assertInside(workspace, finalOutput, "output");
    try { lock = parseCesLockText(await readFile(lockPath, "utf8")); }
    catch { throw new RunnerFailure("input_error", "CES_LOCK_INVALID", "The CES lock file is invalid."); }
    try { project = parseProjectText(await readFile(projectPath, "utf8"), "yaml"); }
    catch { throw new RunnerFailure("input_error", "CES_PROJECT_INVALID", "The CES project file is invalid."); }
    const agreement = validateVersionAgreement(lock, project);
    if (agreement.length > 0) throw new RunnerFailure("input_error", agreement[0]!, diagnosticMessage(agreement[0]!));
    adapterValidated = true;
    await access(requirement);

    await prepareCheckout({ checkout, hooks, gitConfig, logs, commit: lock.ces.commit, repository: options.repository ?? CANONICAL_CES_REPOSITORY, execute: dependencies.execute, ...(options.signal ? { signal: options.signal } : {}) });
    commitValidated = true;
    const packageManifest = JSON.parse(await readFile(join(checkout, "package.json"), "utf8")) as unknown;
    const toolchain = readPinnedToolchain(packageManifest, await readFile(join(checkout, ".node-version"), "utf8"));
    if (dependencies.nodeVersion !== toolchain.node) throw new RunnerFailure("execution_error", "CES_NODE_VERSION_MISMATCH", `Node.js ${toolchain.node} is required.`);
    const pnpmVersionCommand = corepackInvocation(["pnpm", "--version"]);
    const pnpmVersion = await dependencies.execute(pnpmVersionCommand.command, pnpmVersionCommand.args, checkout, processOptions("runtime", join(logs, "pnpm-version.log"), options.signal));
    ensureNotTimedOut(pnpmVersion);
    if (pnpmVersion.exitCode !== 0) throw new RunnerFailure("execution_error", "CES_PNPM_UNAVAILABLE", "The pinned pnpm runtime is unavailable.");
    if (pnpmVersion.stdout.trim() !== toolchain.pnpm) throw new RunnerFailure("execution_error", "CES_PNPM_VERSION_MISMATCH", `pnpm ${toolchain.pnpm} is required.`);
    const install = corepackInvocation(["pnpm", "install", "--frozen-lockfile", "--ignore-scripts"]);
    await requireSuccess(dependencies.execute(install.command, install.args, checkout, processOptions("install", join(logs, "install.log"), options.signal)), "CES_INSTALL_FAILED", "Dependency installation failed.");
    const build = corepackInvocation(["pnpm", "build"]);
    await requireSuccess(dependencies.execute(build.command, build.args, checkout, processOptions("build", join(logs, "build.log"), options.signal)), "CES_BUILD_FAILED", "The pinned CES build failed.");
    await access(join(checkout, "apps", "cli", "dist", "index.js"));

    await mkdir(dirname(finalOutput), { recursive: true });
    const staged = await mkdtemp(join(dirname(finalOutput), `.${basename(finalOutput)}.ces-next-`));
    ownedStaging = staged;
    invoked = true;
    const compilation = await dependencies.execute(process.execPath, [
      join(checkout, "apps", "cli", "dist", "index.js"), "compile",
      "--requirement", requirement, "--project", projectPath, "--output", staged,
    ], checkout, processOptions("compile", join(logs, "compile.log"), options.signal));
    ensureNotTimedOut(compilation);
    const status = phase1Status(compilation.exitCode);
    if (!status) throw new RunnerFailure("execution_error", "CES_PHASE_1_EXIT_UNSUPPORTED", `Phase 1 returned unsupported exit code ${compilation.exitCode}.`, compilation.exitCode);
    const report = await completedReport(staged, status, compilation.exitCode, lock);
    await writeReport(staged, report);
    await publish(staged, finalOutput, runtime, dependencies.beforePublish);
    ownedStaging = undefined;
    return compilation.exitCode;
  } catch (error) {
    const failure = normalizeFailure(error, invoked);
    const report: ExecutionReport = {
      schema_version: "1.0.0",
      status: failure.status,
      runner_exit_code: 1,
      ...(failure.phase1ExitCode === undefined ? {} : { phase_1_exit_code: failure.phase1ExitCode }),
      ...(lock && commitValidated ? { ces: { commit: lock.ces.commit } } : {}),
      ...(lock && adapterValidated ? { adapter: lock.adapter } : {}),
      artifacts: {},
      diagnostics: [{ code: failure.code, source: "phase_2_runner", severity: "error", message: failure.message }],
    };
    if (!invoked) {
      try { await publishReportOnly(finalOutput, runtime, report, dependencies.beforePublish); } catch { /* retain the original failure */ }
    }
    return 1;
  } finally {
    if (ownedStaging) await rm(ownedStaging, { recursive: true, force: true });
    await rm(runRoot, { recursive: true, force: true });
  }
}

async function prepareCheckout(input: { checkout: string; hooks: string; gitConfig: string; logs: string; commit: string; repository: string; execute: RunnerDependencies["execute"]; signal?: AbortSignal }): Promise<void> {
  const { checkout, hooks, gitConfig, logs, commit, repository, execute, signal } = input;
  if (repository !== CANONICAL_CES_REPOSITORY) throw new RunnerFailure("input_error", "CES_REPOSITORY_INVALID", "The configured CES repository is not canonical.");
  const gitEnvironment = { GIT_CONFIG_GLOBAL: gitConfig, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "Never" };
  const secured = ["-c", `core.hooksPath=${hooks}`, "-c", "core.fsmonitor=false"];
  await requireSuccess(execute("git", [...secured, "clone", "--no-checkout", "--no-recurse-submodules", repository, checkout], dirname(checkout), { ...processOptions("git_network", join(logs, "git-clone.log"), signal), environment: gitEnvironment }), "CES_CHECKOUT_FAILED", "The canonical CES repository could not be cloned.");
  await requireSuccess(execute("git", [...secured, "-C", checkout, "fetch", "--no-tags", "--no-recurse-submodules", "origin", commit], checkout, { ...processOptions("git_network", join(logs, "git-fetch.log"), signal), environment: gitEnvironment }), "CES_CHECKOUT_FAILED", "The locked CES commit could not be fetched.");
  await requireSuccess(execute("git", [...secured, "-C", checkout, "checkout", "--detach", commit], checkout, { ...processOptions("git_metadata", join(logs, "git-checkout.log"), signal), environment: gitEnvironment }), "CES_CHECKOUT_FAILED", "The locked CES commit could not be checked out.");
  const head = await execute("git", [...secured, "-C", checkout, "rev-parse", "HEAD"], checkout, { ...processOptions("git_metadata", join(logs, "git-head.log"), signal), environment: gitEnvironment });
  ensureNotTimedOut(head);
  if (head.exitCode !== 0 || head.stdout.trim() !== commit) throw new RunnerFailure("execution_error", "CES_HEAD_MISMATCH", "The checked-out CES HEAD does not match the lock.");
  const origin = await execute("git", [...secured, "-C", checkout, "remote", "get-url", "origin"], checkout, { ...processOptions("git_metadata", join(logs, "git-origin.log"), signal), environment: gitEnvironment });
  ensureNotTimedOut(origin);
  if (origin.exitCode !== 0 || origin.stdout.trim() !== repository) throw new RunnerFailure("execution_error", "CES_CHECKOUT_ORIGIN_INVALID", "The runtime checkout origin is not canonical.");
  const clean = await execute("git", [...secured, "-C", checkout, "status", "--porcelain", "--untracked-files=no"], checkout, { ...processOptions("git_metadata", join(logs, "git-status.log"), signal), environment: gitEnvironment });
  ensureNotTimedOut(clean);
  if (clean.exitCode !== 0 || clean.stdout.trim() !== "") throw new RunnerFailure("execution_error", "CES_CHECKOUT_DIRTY", "The checked-out CES work tree is not clean.");
  await access(join(checkout, "apps", "cli", "src", "index.ts"));
}

async function completedReport(staged: string, status: NonNullable<ReturnType<typeof phase1Status>>, exitCode: number, lock: ReturnType<typeof parseCesLockText>): Promise<ExecutionReport> {
  const files = await listFiles(staged);
  validateArtifacts(files, status, lock.adapter.id);
  const requirementPackage = await optionalJson(join(staged, "core", "requirement-package.json"));
  const policyManifest = await optionalJson(join(staged, "core", "policy-manifest.json"));
  const requirementId = nestedStringField(requirementPackage, "requirement", "id") ?? stringField(policyManifest, "requirement_id");
  const compilationId = stringField(policyManifest, "compilation_id");
  const diagnostics = await outcomeDiagnostics(staged, status, lock.adapter.id, policyManifest);
  const core = files.filter((path) => path.startsWith("core/"));
  const adapter = files.filter((path) => path.startsWith(`adapters/${lock.adapter.id}/`));
  return ExecutionReportSchema.parse({
    schema_version: "1.0.0", status, runner_exit_code: exitCode, phase_1_exit_code: exitCode,
    ...(requirementId ? { requirement_id: requirementId } : {}),
    ...(compilationId ? { compilation_id: compilationId } : {}),
    ces: { commit: lock.ces.commit }, adapter: lock.adapter,
    artifacts: { ...(core.length ? { core } : {}), ...(adapter.length ? { adapter } : {}) },
    diagnostics,
  });
}

function validateArtifacts(files: readonly string[], status: NonNullable<ReturnType<typeof phase1Status>>, adapterId: string): void {
  for (const path of files) {
    if (CORE_FILES.has(path)) continue;
    const prefix = `adapters/${adapterId}/`;
    if (!path.startsWith(prefix)) throw new RunnerFailure("execution_error", "CES_ARTIFACT_INVALID", "Phase 1 produced an artifact outside the selected adapter directory.");
    const name = path.slice(prefix.length);
    if (status === "adapter_gap" ? name !== "adapter-report.json" : status === "input_error" || !IMPLEMENTATION_FILES.has(name)) throw new RunnerFailure("execution_error", "CES_ARTIFACT_INVALID", "Phase 1 produced an artifact invalid for its outcome.");
  }
  if (["blocked", "conflict"].includes(status) && files.some((path) => path.startsWith("adapters/"))) throw new RunnerFailure("execution_error", "CES_ARTIFACT_INVALID", "A core-only outcome produced adapter artifacts.");
  const required = status === "success"
    ? [...CORE_FILES, ...[...IMPLEMENTATION_FILES].map((name) => `adapters/${adapterId}/${name}`)]
    : status === "adapter_gap"
      ? [...CORE_FILES, `adapters/${adapterId}/adapter-report.json`]
      : ["blocked", "conflict"].includes(status) ? [...CORE_FILES] : [];
  if (required.some((path) => !files.includes(path))) throw new RunnerFailure("execution_error", "CES_ARTIFACT_MISSING", "Phase 1 did not produce the artifacts required for its outcome.");
}

async function outcomeDiagnostics(staged: string, status: NonNullable<ReturnType<typeof phase1Status>>, adapterId: string, manifest: unknown): Promise<Diagnostic[]> {
  if (status === "success") return [];
  if (status === "input_error") return [{ code: "CES_INPUT_INVALID", source: "phase_1_exit_code", severity: "error", message: "Phase 1 rejected the supplied input." }];
  if (status === "adapter_gap") {
    await optionalJson(join(staged, "adapters", adapterId, "adapter-report.json"));
    return [{ code: "CES_ADAPTER_GAP", source: "adapter_report", severity: "error", message: "The selected adapter has a mandatory mapping gap.", adapter_id: adapterId }];
  }
  const state = status;
  const obligations = objectArrayField(manifest, "obligations");
  return obligations.filter((item) => stringField(item, "resolution_state") === state).map((item) => ({
    code: status === "blocked" ? "CES_POLICY_BLOCKED" : "CES_POLICY_CONFLICT",
    source: "policy_manifest" as const, severity: "error" as const,
    message: status === "blocked" ? "A mandatory policy could not be resolved." : "Policy inputs conflict.",
    ...(stringField(item, "policy_id") ? { policy_id: stringField(item, "policy_id") } : {}),
  }));
}

async function publishReportOnly(finalOutput: string, runtime: string, report: ExecutionReport, hook?: RunnerDependencies["beforePublish"]): Promise<void> {
  await mkdir(dirname(finalOutput), { recursive: true });
  const staged = await mkdtemp(join(dirname(finalOutput), `.${basename(finalOutput)}.ces-report-`));
  try {
    await writeReport(staged, ExecutionReportSchema.parse(report));
    await publish(staged, finalOutput, runtime, hook);
  } finally {
    await rm(staged, { recursive: true, force: true });
  }
}

async function publish(staged: string, finalOutput: string, runtime: string, hook?: RunnerDependencies["beforePublish"]): Promise<void> {
  const release = await acquirePublicationLock(runtime, finalOutput, basename(staged));
  const backupContainer = await mkdtemp(join(dirname(finalOutput), `.${basename(finalOutput)}.ces-backup-`));
  const backup = join(backupContainer, "previous");
  const hadFinal = await exists(finalOutput);
  try {
    if (hadFinal) await rename(finalOutput, backup);
    if (hook) await hook(staged, finalOutput);
    await rename(staged, finalOutput);
  } catch (error) {
    if (await exists(finalOutput)) await rm(finalOutput, { recursive: true, force: true });
    if (hadFinal && await exists(backup)) await rename(backup, finalOutput);
    throw error;
  } finally {
    await rm(backupContainer, { recursive: true, force: true });
    await rm(staged, { recursive: true, force: true });
    await release();
  }
}

async function writeReport(directory: string, report: ExecutionReport): Promise<void> {
  await writeFile(join(directory, "execution-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
async function listFiles(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path, root) : [relative(root, path).split(sep).join("/")];
  }))).flat();
  return files.filter((path) => path !== "execution-report.json").sort(compareText);
}
async function optionalJson(path: string): Promise<unknown> { try { return JSON.parse(await readFile(path, "utf8")) as unknown; } catch (error) { if (isMissing(error)) return undefined; throw error; } }
function stringField(value: unknown, field: string): string | undefined { if (typeof value !== "object" || value === null) return undefined; const result = (value as Record<string, unknown>)[field]; return typeof result === "string" && result.length ? result : undefined; }
function nestedStringField(value: unknown, objectField: string, field: string): string | undefined { if (typeof value !== "object" || value === null) return undefined; return stringField((value as Record<string, unknown>)[objectField], field); }
function objectArrayField(value: unknown, field: string): Record<string, unknown>[] { if (typeof value !== "object" || value === null) return []; const result = (value as Record<string, unknown>)[field]; return Array.isArray(result) ? result.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : []; }
async function exists(path: string): Promise<boolean> { try { return (await stat(path)).isDirectory() || (await stat(path)).isFile(); } catch { return false; } }
function assertInside(root: string, path: string, label: string): void { const rel = relative(root, path); if (rel === "" || rel.startsWith(`..${sep}`) || rel === ".." || resolve(root, rel) !== path) throw new RunnerFailure("input_error", "CES_WORKSPACE_INVALID", `The ${label} path must be inside the client workspace.`); }
export async function acquirePublicationLock(runtime: string, finalOutput: string, executionId: string, policy: { waitMs: number; staleMs: number } = { waitMs: 5_000, staleMs: 15 * 60_000 }): Promise<() => Promise<void>> {
  const locks = join(runtime, "locks");
  await mkdir(locks, { recursive: true });
  const name = createHash("sha256").update(resolve(finalOutput)).digest("hex");
  const lock = join(locks, `${name}.lock`);
  const deadline = Date.now() + policy.waitMs;
  while (true) {
    try {
      await mkdir(lock);
      await writeFile(join(lock, "owner.json"), `${JSON.stringify({ pid: process.pid, execution_id: executionId })}\n`, "utf8");
      return async () => rm(lock, { recursive: true, force: true });
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
      let age: number;
      try { age = Date.now() - (await stat(lock)).mtimeMs; }
      catch (statError) { if (isMissing(statError)) continue; throw statError; }
      if (age > policy.staleMs) { await rm(lock, { recursive: true, force: true }); continue; }
      if (Date.now() >= deadline) throw new RunnerFailure("execution_error", "CES_PUBLICATION_LOCKED", "Another CES execution is publishing to this output.");
      await delay(50);
    }
  }
}
function delay(milliseconds: number): Promise<void> { return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds)); }
function compareText(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
type ProcessCategory = "git_metadata" | "git_network" | "runtime" | "install" | "build" | "compile";
const PROCESS_TIMEOUTS: Readonly<Record<ProcessCategory, number>> = {
  git_metadata: 30_000,
  git_network: 5 * 60_000,
  runtime: 30_000,
  install: 10 * 60_000,
  build: 10 * 60_000,
  compile: 5 * 60_000,
};
function processOptions(category: ProcessCategory, logPath: string, signal?: AbortSignal): ProcessOptions {
  return { timeoutMs: PROCESS_TIMEOUTS[category], logPath, ...(signal ? { signal } : {}) };
}
export function corepackInvocation(args: readonly string[], platform: NodeJS.Platform = process.platform, commandProcessor = process.env.ComSpec ?? "cmd.exe"): { command: string; args: readonly string[] } {
  return platform === "win32"
    ? { command: commandProcessor, args: ["/d", "/s", "/c", "corepack", ...args] }
    : { command: "corepack", args };
}
function isMissing(error: unknown): boolean { return error instanceof Error && "code" in error && error.code === "ENOENT"; }
function diagnosticMessage(code: string): string { return ({ CES_ADAPTER_ID_MISMATCH: "The lock and project adapter IDs differ.", CES_ADAPTER_VERSION_MISMATCH: "The lock and project adapter versions differ.", CES_BASELINE_UNSUPPORTED: "The project CES baseline is unsupported." } as Record<string, string>)[code] ?? "The client integration input is invalid."; }
function ensureNotTimedOut(result: ProcessResult): void {
  if (result.timedOut) throw new RunnerFailure("execution_error", "CES_COMMAND_TIMEOUT", "An external CES command exceeded its runner timeout.");
  if (result.aborted) throw new RunnerFailure("execution_error", "CES_COMMAND_CANCELLED", "The CES execution was cancelled.");
}
async function requireSuccess(result: Promise<ProcessResult>, code: string, message: string): Promise<void> { const completed = await result; ensureNotTimedOut(completed); if (completed.exitCode !== 0) throw new RunnerFailure("execution_error", code, message); }

class RunnerFailure extends Error {
  constructor(readonly status: "input_error" | "execution_error", readonly code: string, message: string, readonly phase1ExitCode?: number) { super(message); }
}
function normalizeFailure(error: unknown, invoked: boolean): RunnerFailure {
  if (error instanceof RunnerFailure) return error;
  if (isMissing(error)) return new RunnerFailure("input_error", "CES_WORKSPACE_INVALID", "A required client workspace file is missing.");
  return new RunnerFailure("execution_error", invoked ? "CES_PHASE_1_FAILED" : "CES_RUNNER_FAILED", error instanceof Error ? error.message : "The CES runner failed unexpectedly.");
}

export function defaultDependencies(): RunnerDependencies {
  return {
    nodeVersion: process.versions.node,
    execute: (command, args, cwd, options = { timeoutMs: 5 * 60_000 }) => new Promise((resolveResult) => {
      const environment = sanitizedEnvironment(options.environment);
      const child = spawn(command, [...args], { cwd, shell: false, windowsHide: true, detached: process.platform !== "win32", env: environment });
      const log = options.logPath ? createWriteStream(options.logPath, { flags: "a" }) : undefined;
      let stdout = ""; let stderr = "";
      let timedOut = false; let aborted = false; let settled = false;
      const finish = (result: ProcessResult): void => { if (settled) return; settled = true; clearTimeout(timer); options.signal?.removeEventListener("abort", abort); log?.end(); resolveResult(result); };
      child.stdout.on("data", (chunk: Buffer) => { log?.write(chunk); stdout = boundedTail(stdout, chunk); });
      child.stderr.on("data", (chunk: Buffer) => { log?.write(chunk); stderr = boundedTail(stderr, chunk); });
      child.on("error", (error) => finish({ exitCode: 1, stdout, stderr: boundedTail(stderr, Buffer.from(error.message)) }));
      child.on("close", (code) => finish({ exitCode: code ?? 1, stdout, stderr, ...(timedOut ? { timedOut: true } : {}), ...(aborted ? { aborted: true } : {}) }));
      const timeout = (): void => { timedOut = true; terminateProcessTree(child.pid); };
      const abort = (): void => { aborted = true; terminateProcessTree(child.pid); };
      const timer = setTimeout(timeout, options.timeoutMs);
      options.signal?.addEventListener("abort", abort, { once: true });
      if (options.signal?.aborted) abort();
    }),
  };
}

const DANGEROUS_GIT_ENVIRONMENT = new Set(["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_COMMON_DIR", "GIT_CONFIG", "GIT_CONFIG_COUNT", "GIT_CONFIG_KEY_0", "GIT_CONFIG_VALUE_0"]);
export function sanitizedEnvironment(overrides: Readonly<Record<string, string>> | undefined): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) if (value !== undefined && !DANGEROUS_GIT_ENVIRONMENT.has(key)) environment[key] = value;
  return { ...environment, CI: "true", GIT_TERMINAL_PROMPT: "0", ...overrides };
}
function boundedTail(current: string, chunk: Buffer, maximumBytes = 64 * 1024): string {
  const combined = Buffer.concat([Buffer.from(current), chunk]);
  return combined.subarray(Math.max(0, combined.length - maximumBytes)).toString("utf8");
}
function terminateProcessTree(pid: number | undefined): void {
  if (pid === undefined) return;
  try {
    if (process.platform === "win32") {
      // taskkill without /F can end the parent before it traverses descendants.
      spawn("taskkill", ["/pid", String(pid), "/t", "/f"], { windowsHide: true });
    } else {
      process.kill(-pid, "SIGTERM");
      setTimeout(() => { try { process.kill(-pid, "SIGKILL"); } catch { /* process exited during grace period */ } }, 1_000);
    }
  } catch { /* process already exited */ }
}
