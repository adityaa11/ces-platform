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
  const query = `SELECT json_build_object('queue_state', j.state, 'retry_count', j.retry_count, 'retry_limit', j.retry_limit, 'bridge_effect_state', e.status, 'effect_execution_id', e.execution_id, 'lease_owner', e.lease_owner, 'lease_generation', e.lease_generation, 'staged_result_count', (SELECT count(*) FROM bridge.document_perception_result_delivery d WHERE d.idempotency_key=j.data->>'idempotencyKey'), 'staged_execution_count', (SELECT count(*) FROM bridge.document_perception_result_delivery d WHERE d.idempotency_key=j.data->>'idempotencyKey' AND d.execution_id=e.execution_id))::text FROM pgboss.job j LEFT JOIN bridge.background_effects e ON e.idempotency_key=j.data->>'idempotencyKey' WHERE j.data->>'idempotencyKey'='${escapedKey}' ORDER BY j.created_on DESC LIMIT 1`;
  const output = await docker(["exec", "-T", "postgres", "psql", "-U", "atlas", "-d", "atlas_dev", "-At", "-c", query]);
  const record = JSON.parse(output.trim());
  return record;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(observe, label) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const value = await observe();
    if (value) return value;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function scopedCounts(executionId) {
  const escapedId = executionId.replaceAll("'", "''");
  const query = `SELECT json_build_object('state', e.state, 'cache_count', (SELECT count(*) FROM atlas.normalized_document_cache c WHERE c.source_sha256=d.source_sha256 AND c.capability_identity='docling-digital-pdf' AND c.invalidated_at IS NULL), 'semantic_execution_count', (SELECT count(*) FROM atlas.semantic_execution s JOIN atlas.extraction_bundle b ON b.id=s.bundle_id WHERE b.project_id=p.id), 'execution_count', (SELECT count(*) FROM atlas.document_perception_execution x JOIN atlas.document dx ON dx.id=x.artifact_id WHERE dx.project_id=p.id), 'member_count', (SELECT count(*) FROM atlas.extraction_bundle_document m JOIN atlas.extraction_bundle b ON b.id=m.bundle_id WHERE b.project_id=p.id))::text FROM atlas.document_perception_execution e JOIN atlas.document d ON d.id=e.artifact_id JOIN atlas.project p ON p.id=d.project_id WHERE e.id='${escapedId}'`;
  const output = await docker(["exec", "-T", "postgres", "psql", "-U", "atlas", "-d", "atlas_dev", "-At", "-c", query]);
  return JSON.parse(output.trim());
}

async function restartReplayScenario() {
  const container = async () => {
    const id = (await docker(["ps", "-q", "-a", "agents-bridge-worker"])).trim();
    const output = await execFileAsync("docker", ["inspect", "--format", "{{json .}}", id], { maxBuffer: 4 * 1024 * 1024 });
    const value = JSON.parse(output.stdout);
    return { id: value.Id, name: value.Name, state: value.State.Status, startedAt: value.State.StartedAt, finishedAt: value.State.FinishedAt, restartCount: value.RestartCount, image: value.Config.Image };
  };
  // Fail only the authenticated result handoff. The real worker has already
  // staged normalized output when this controlled boundary makes its queue
  // attempt replayable; neither source redemption nor Docling is replaced.
  await control("atlas-fault", { resultOutage: true });
  const output = await docker(["exec", "-T", "-e", "PERCEPTION_WAIT=false", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "docling"]);
  const kickoff = output.trim().split(/\r?\n/u).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line)).find((record) => record.phase === "kickoff");
  assert.ok(kickoff, "restart/replay must persist an authenticated IDSER-003 kickoff");
  const beforeWorker = await waitFor(async () => {
    const worker = await workerObservation(kickoff.idempotencyKey);
    return worker.staged_result_count === 1 && worker.staged_execution_count === 1 && worker.bridge_effect_state === "pending" && Number(worker.retry_count) === 0 ? worker : undefined;
  }, "the controlled result outage to preserve one staged D1 replay");
  const before = await scopedCounts(kickoff.executionId);
  assert.deepEqual({ cache: Number(before.cache_count), semantic: Number(before.semantic_execution_count), executions: Number(before.execution_count), members: Number(before.member_count) }, { cache: 0, semantic: 0, executions: 1, members: 1 }, "the outage leaves one running D1 execution and no accepted cache or semantic work");
  assert.equal(beforeWorker.effect_execution_id, kickoff.executionId, "the staged replay remains fenced to the original D1 execution");
  const containerBeforeStop = await container();
  // SIGKILL is intentional test control: it prevents a graceful worker from
  // consuming the short pg-boss retry window before the replacement exists.
  // Compose then recreates the production worker container below.
  await docker(["kill", "-s", "SIGKILL", "agents-bridge-worker"]);
  const containerStopped = await container();
  assert.equal(containerStopped.state, "exited", "Compose must stop the actual Bridge worker process before replay");
  await control("atlas-fault", { resultOutage: false });
  await docker(["up", "-d", "--force-recreate", "--wait", "agents-bridge-worker"]);
  const containerRestarted = await container();
  assert.notEqual(containerRestarted.id, containerBeforeStop.id, "Compose recreation must supply a fresh worker container");
  const completed = await waitFor(async () => {
    const counts = await scopedCounts(kickoff.executionId);
    return counts.state === "completed" ? counts : undefined;
  }, "the restarted Bridge worker to replay and complete D1");
  assert.deepEqual({ cache: Number(completed.cache_count), semantic: Number(completed.semantic_execution_count), executions: Number(completed.execution_count), members: Number(completed.member_count) }, { cache: 1, semantic: 0, executions: 1, members: 1 }, "restart/replay preserves one accepted D1 result/cache and no semantic continuation");
  const worker = await workerObservation(kickoff.idempotencyKey);
  assert.equal(worker.queue_state, "completed", "the successor completes the original durable queue job");
  assert.equal(worker.effect_execution_id, kickoff.executionId, "the successor cannot replace the original fenced D1 identity");
  assert.ok(Number(worker.lease_generation) > Number(beforeWorker.lease_generation), "the successor claims a higher fenced lease generation");
  assert.equal(worker.staged_result_count, 0, "the successful replay acknowledgement removes its staged result");
  await docker(["exec", "-T", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "cleanup", kickoff.executionId, kickoff.idempotencyKey, kickoff.storageKey, kickoff.projectId]);
  return { command: "docker compose -f docker-compose.yml -f docker-compose.cfc.yml kill -s SIGKILL agents-bridge-worker && docker compose -f docker-compose.yml -f docker-compose.cfc.yml up -d --force-recreate --wait agents-bridge-worker", kickoff, before: { scoped: before, worker: beforeWorker }, restart: { beforeStop: containerBeforeStop, stopped: containerStopped, restarted: containerRestarted }, after: { scoped: completed, worker } };
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
  if (process.env.CFC_RESTART_REPLAY_ONLY === "true") {
    const restartReplay = await restartReplayScenario();
    process.stdout.write(`${JSON.stringify({ restartReplay })}\n`);
    process.exitCode = 0;
  } else {
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
  assert.equal(recoveryWorker.bridge_effect_state, "completed", "a delivered recovery result must complete its Bridge effect");
  assert.equal(recoveryWorker.staged_result_count, 0, "a delivered recovery result must be acknowledged rather than retained for replay");
  await docker(["exec", "-T", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "cleanup", recoveryKickoff.executionId, recoveryKickoff.idempotencyKey, recoveryKickoff.storageKey, recoveryKickoff.projectId]);
  const restartReplay = await restartReplayScenario();
  process.stdout.write(`${JSON.stringify({ cases: results, recovery: { ...recoveryComplete, worker: recoveryWorker, noFallback: { qualifiedRoute: "docling-digital-pdf", remoteProviderConfigured: false, subprocessConfigured: false } }, restartReplay })}\n`);
  }
} finally {
  await control("docling-fault", { mode: "pass" }).catch(() => undefined);
  await control("atlas-fault", { resultOutage: false }).catch(() => undefined);
}
