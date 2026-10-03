import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const compose = ["compose", "-f", "docker-compose.yml", "-f", "docker-compose.cfc.yml"];
const docker = async (args, options = {}) => (await execFileAsync("docker", [...compose, ...args], { cwd: workspaceRoot, maxBuffer: 4 * 1024 * 1024, ...options })).stdout;
const control = async (service, body) => docker(["exec", "-T", service, "node", "-e", `fetch('http://127.0.0.1:${service === "docling-fault" ? "5001" : "3001"}/__fault',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(${JSON.stringify(body)})}).then(async response=>{if(!response.ok)throw new Error(await response.text())})`]);

async function workerObservation(idempotencyKey) {
  const escapedKey = idempotencyKey.replaceAll("'", "''");
  const query = `SELECT json_build_object('queue_state', j.state, 'retry_count', j.retry_count, 'retry_limit', j.retry_limit, 'bridge_effect_state', e.status, 'lease_generation', e.lease_generation, 'staged_result_count', (SELECT count(*) FROM bridge.document_perception_result_delivery d WHERE d.idempotency_key=j.data->>'idempotencyKey'))::text FROM pgboss.job j LEFT JOIN bridge.background_effects e ON e.idempotency_key=j.data->>'idempotencyKey' WHERE j.data->>'idempotencyKey'='${escapedKey}' ORDER BY j.created_on DESC LIMIT 1`;
  const output = await docker(["exec", "-T", "postgres", "psql", "-U", "agents_bridge", "-d", "atlas_dev", "-At", "-c", query]);
  const record = JSON.parse(output.trim());
  assert.equal(record.bridge_effect_state, "completed", "the Bridge effect must be fenced as completed after the inherited terminal disposition");
  return record;
}

async function scenario(mode) {
  await control("docling-fault", { mode });
  const output = await docker(["exec", "-T", "-e", "PERCEPTION_EXPECT_STATE=failed", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "docling"]);
  const records = output.trim().split(/\r?\n/u).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line));
  const kickoff = records.find((record) => record.phase === "kickoff");
  const completed = records.find((record) => record.phase === "completed");
  assert.ok(kickoff && completed, `${mode} must produce kickoff and terminal observations`);
  assert.equal(completed.state, "failed", `${mode} must follow the inherited terminal disposition after retries`);
  assert.deepEqual({ cache: completed.cache_count, semantic: completed.semantic_execution_count, executions: completed.execution_count, members: completed.member_count }, { cache: 0, semantic: 0, executions: 1, members: 1 }, `${mode} cannot accept invalid output or create semantic work`);
  const worker = await workerObservation(kickoff.idempotencyKey);
  assert.equal(worker.staged_result_count, 0, `${mode} cannot leave a staged result after a pre-handoff failure`);
  await docker(["exec", "-T", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "cleanup", kickoff.executionId, kickoff.idempotencyKey, kickoff.storageKey, kickoff.projectId]);
  return { ...completed, worker, noFallback: { qualifiedRoute: "docling-digital-pdf", remoteProviderConfigured: false, subprocessConfigured: false } };
}

try {
  await docker(["up", "-d", "--build", "--wait", "atlas", "docling-fault", "atlas-fault", "agents-bridge-worker"]);
  const cases = ["unavailable", "not-ready", "reset", "http-5xx", "processing", "timeout", "malformed", "incomplete", "mapper-rejection", "normalization-rejection"];
  const results = [];
  for (const mode of cases) results.push({ mode, ...(await scenario(mode)) });
  await control("docling-fault", { mode: "pass" });
  const recovery = await docker(["exec", "-T", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "docling"]);
  const recoveryRecords = recovery.trim().split(/\r?\n/u).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line));
  const recoveryKickoff = recoveryRecords.find((record) => record.phase === "kickoff");
  const recoveryComplete = recoveryRecords.find((record) => record.phase === "completed");
  assert.equal(recoveryComplete?.state, "completed", "qualified Docling route must recover after controlled faults are removed");
  const recoveryWorker = await workerObservation(recoveryKickoff.idempotencyKey);
  assert.equal(recoveryWorker.staged_result_count, 0, "a delivered recovery result must be acknowledged rather than retained for replay");
  await docker(["exec", "-T", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "cleanup", recoveryKickoff.executionId, recoveryKickoff.idempotencyKey, recoveryKickoff.storageKey, recoveryKickoff.projectId]);
  process.stdout.write(`${JSON.stringify({ cases: results, recovery: { ...recoveryComplete, worker: recoveryWorker, noFallback: { qualifiedRoute: "docling-digital-pdf", remoteProviderConfigured: false, subprocessConfigured: false } } })}\n`);
} finally {
  await control("docling-fault", { mode: "pass" }).catch(() => undefined);
  await control("atlas-fault", { resultOutage: false }).catch(() => undefined);
}
