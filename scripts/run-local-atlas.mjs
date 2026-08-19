import { spawn } from "node:child_process";
import { closeSync, existsSync, openSync, readFileSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaults = {
  prd: "docs/prd/Safara_Buyer_Business_PRD.pdf",
  projectIntent: "docs/prd/safara-project-intent.json",
  output: ".ces/generated/safara-buyer",
  startUi: true,
};

export function parseOptions(argv) {
  const options = { ...defaults };
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (name === "--") continue;
    if (name === "--no-ui") options.startUi = false;
    else if (["--prd", "--project-intent", "--output"].includes(name)) {
      const value = argv[index += 1];
      if (!value) throw new Error(`${name} requires a value`);
      if (name === "--prd") options.prd = value;
      if (name === "--project-intent") options.projectIntent = value;
      if (name === "--output") options.output = value;
    } else throw new Error(`Unknown option: ${name}`);
  }
  return options;
}

export function parseEnvironment(text) {
  const environment = {};
  for (const raw of text.split(/\r?\n/u)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) throw new Error("Invalid agent.env entry");
    environment[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return environment;
}

export function uiTarget(outputDirectory, manifest) {
  if (typeof manifest.project_id !== "string" || !Number.isSafeInteger(manifest.revision)) {
    throw new Error("Generated run-manifest.json has no valid project identity and revision");
  }
  if (basename(outputDirectory) !== manifest.project_id) {
    throw new Error(`Output directory must end with generated project ID '${manifest.project_id}'`);
  }
  const artifactRoot = dirname(outputDirectory);
  const query = new URLSearchParams({ project: manifest.project_id, revision: String(manifest.revision) });
  return { artifactRoot, projectId: manifest.project_id, revision: manifest.revision,
    url: `http://localhost:3000/?${query}` };
}

export async function executeAtlasCycle(config, dependencies) {
  const buildCode = await dependencies.run("corepack", ["pnpm", "--filter", "@company/ces-cli",
    "--filter", "@company/ces-agents-bridge", "build"], { env: config.env });
  if (buildCode !== 0) throw new Error(`Atlas runtime build failed with code ${buildCode}`);

  const bridge = dependencies.startBridge(config.env);
  try {
    await dependencies.waitUntilReady();
    const atlasCode = await dependencies.run("node", ["apps/cli/dist/index.js", "atlas", "run",
      "--prd", config.prd, "--project-intent", config.projectIntent,
      "--provider-endpoint", "http://127.0.0.1:8787/v1/atlas/analyze",
      "--provider", "ces-agents-bridge", "--model", config.env.GEMINI_MODEL,
      "--output", config.output], { env: config.env });
    if (atlasCode !== 7) throw new Error(`Atlas exited with code ${atlasCode} (expected 7 for review pending)`);
  } finally {
    await dependencies.stopBridge(bridge);
  }

  const target = uiTarget(config.output, await dependencies.readManifest(config.output));
  dependencies.log(`Atlas extraction completed and paused for review at ${config.output}`);
  if (config.startUi) {
    dependencies.log(`Starting Atlas UI at ${target.url}`);
    const uiCode = await dependencies.run("corepack", ["pnpm", "dev"], {
      env: { ...config.env, CES_ATLAS_ARTIFACT_ROOT: target.artifactRoot },
    });
    if (uiCode !== 0) throw new Error(`Atlas UI exited with code ${uiCode}`);
  }
  return target;
}

function run(command, args, options) {
  const isWindowsCorepack = process.platform === "win32" && command === "corepack";
  const executable = isWindowsCorepack ? process.execPath : command;
  const commandArgs = isWindowsCorepack
    ? [resolve(dirname(process.execPath), "node_modules/corepack/dist/corepack.js"), ...args] : args;
  return new Promise((fulfill, reject) => {
    const child = spawn(executable, commandArgs,
      { cwd: repositoryRoot, env: options.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code, signal) => fulfill(code ?? (signal ? 130 : 1)));
  });
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { if ((await fetch("http://127.0.0.1:8787/readyz")).ok) return; } catch { /* retry */ }
    await new Promise((fulfill) => setTimeout(fulfill, 200));
  }
  throw new Error("Agents Bridge did not become ready; inspect .ces/runtime/agents-bridge.stderr.log");
}

function stopBridge(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((fulfill) => {
    child.once("close", fulfill);
    child.kill();
  });
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function main() {
  const options = parseOptions(process.argv.slice(2));
  const environmentFile = resolve(repositoryRoot, "agent.env");
  if (!existsSync(environmentFile)) throw new Error("Missing local agent.env");
  const env = { ...process.env, ...parseEnvironment(readFileSync(environmentFile, "utf8")) };
  for (const key of ["GEMINI_API_KEY", "AGENTS_BRIDGE_API_KEY"]) {
    if (!env[key] || env[key].startsWith("replace-")) throw new Error(`${key} is not configured`);
  }
  const runtime = resolve(repositoryRoot, ".ces/runtime");
  await mkdir(runtime, { recursive: true });
  Object.assign(env, { HOST: "127.0.0.1", PORT: "8787", CES_ATLAS_API_KEY: env.AGENTS_BRIDGE_API_KEY,
    CES_ATLAS_PDF_ROOT: resolve(runtime, "atlas-pdfs"), GEMINI_MODEL: env.GEMINI_MODEL || "gemini-3.5-flash-lite" });
  const output = resolve(repositoryRoot, options.output);
  await executeAtlasCycle({ ...options, prd: resolve(repositoryRoot, options.prd),
    projectIntent: resolve(repositoryRoot, options.projectIntent), output, env }, {
    run,
    startBridge: (bridgeEnv) => {
      const stdout = openSync(resolve(runtime, "agents-bridge.stdout.log"), "a");
      const stderr = openSync(resolve(runtime, "agents-bridge.stderr.log"), "a");
      try {
        return spawn(process.execPath, ["apps/agents-bridge/dist/main.js"], {
          cwd: repositoryRoot, env: bridgeEnv, stdio: ["ignore", stdout, stderr],
        });
      } finally { closeSync(stdout); closeSync(stderr); }
    },
    waitUntilReady, stopBridge,
    readManifest: async (directory) => JSON.parse(await readFile(resolve(directory, "run-manifest.json"), "utf8")),
    log: console.log,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
