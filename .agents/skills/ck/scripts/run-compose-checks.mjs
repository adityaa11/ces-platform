import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const argv = process.argv.slice(2);
const valueFor = (flag) => {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
};
const hasFlag = (flag) => argv.includes(flag);
const service = valueFor("--service") ?? "atlas";
const manifestPath = valueFor("--manifest");
const checksJson = valueFor("--checks-json");
const reportPath = valueFor("--report");
const tailLimit = Number(valueFor("--tail-bytes") ?? 12000);

if (!manifestPath && !checksJson) throw new Error("Provide --manifest <path> or --checks-json <json>.");
if (!Number.isInteger(tailLimit) || tailLimit < 100) throw new Error("--tail-bytes must be an integer of at least 100.");

const manifest = checksJson ? JSON.parse(checksJson) : JSON.parse(await readFile(manifestPath, "utf8"));
const checks = Array.isArray(manifest) ? manifest : manifest.checks;
if (!Array.isArray(checks) || checks.some((check) => !check?.name || !Array.isArray(check.args) || check.args.some((arg) => typeof arg !== "string"))) {
  throw new Error("Checks must be an array of { name, args: string[] } objects.");
}

const command = process.platform === "win32" ? "docker.exe" : "docker";
const tail = (current, chunk) => `${current}${chunk}`.slice(-tailLimit);

const run = (args) => new Promise((resolve) => {
  const startedAt = Date.now();
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout = tail(stdout, chunk.toString()); });
  child.stderr.on("data", (chunk) => { stderr = tail(stderr, chunk.toString()); });
  child.on("error", (error) => resolve({ code: 1, durationMs: Date.now() - startedAt, stdout, stderr: `${stderr}${error.message}`.slice(-tailLimit) }));
  child.on("close", (code) => resolve({ code: code ?? 1, durationMs: Date.now() - startedAt, stdout, stderr }));
});

const results = [];
if (!hasFlag("--no-build")) {
  const build = await run(["compose", "build", "--quiet", service]);
  results.push({ name: `build ${service}`, args: ["compose", "build", "--quiet", service], ...build });
  if (build.code !== 0) {
    console.error(`[FAIL] build ${service}`);
    console.error(`${build.stderr || build.stdout}`.trimEnd());
    process.exitCode = 1;
  } else {
    console.log(`[PASS] build ${service} (${build.durationMs} ms)`);
  }
}

if (!process.exitCode) {
  for (const check of checks) {
    const args = ["compose", "run", "--rm", "--no-deps", service, ...check.args];
    const result = await run(args);
    const record = { name: check.name, args, ...result };
    results.push(record);
    if (result.code === 0) {
      console.log(`[PASS] ${check.name} (${result.durationMs} ms)`);
    } else {
      console.error(`[FAIL] ${check.name} (${result.durationMs} ms)`);
      console.error(`${result.stderr || result.stdout}`.trimEnd());
      process.exitCode = 1;
      break;
    }
  }
}

const passed = results.filter((result) => result.code === 0).length;
const failed = results.length - passed;
console.log(`Summary: ${passed} passed, ${failed} failed`);
if (reportPath) await writeFile(reportPath, `${JSON.stringify({ service, results, passed, failed }, null, 2)}\n`, "utf8");
