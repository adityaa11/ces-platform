import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const baseCompose = ["compose", "-f", "docker-compose.yml"];
const smokeCompose = [...baseCompose, "-f", "docker-compose.perception-smoke.yml"];

async function docker(args, allowFailure = false) {
  try {
    const result = await execFileAsync("docker", [...args], { cwd: workspaceRoot, maxBuffer: 4 * 1024 * 1024 });
    return result.stdout;
  } catch (error) {
    if (allowFailure) return "";
    const details = error && typeof error === "object" && "stderr" in error ? String(error.stderr) : "docker compose command failed";
    throw new Error(details.slice(-4000));
  }
}

async function waitFor(predicate, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the Compose perception smoke state.");
}

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev";
const atlasUrl = new URL(databaseUrl);
atlasUrl.username = "atlas_app";
atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
const bridgeUrl = new URL(databaseUrl);
bridgeUrl.username = "agents_bridge";
bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
const atlas = postgres(atlasUrl.toString(), { max: 2 });
const bridge = postgres(bridgeUrl.toString(), { max: 2 });
let seeded;

try {
  await docker([...smokeCompose, "up", "-d", "--build", "--wait"]);
  const seedOutput = await docker([...smokeCompose, "exec", "-T", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs"]);
  const seedLine = seedOutput.trim().split(/\r?\n/u).at(-1);
  if (!seedLine) throw new Error("Compose seed did not return operation metadata.");
  seeded = JSON.parse(seedLine);

  await waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [seeded.executionId]))[0]?.state === "completed");
  await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [seeded.idempotencyKey]))[0]?.status === "completed");
  await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1", [seeded.idempotencyKey]))[0]?.count === 0);

  const cacheRows = await atlas.unsafe("SELECT derived_assets FROM atlas.normalized_document_cache WHERE source_sha256=$1 AND capability_identity=$2 AND invalidated_at IS NULL", [seeded.sourceSha256, "mistral-ocr:compose-smoke"]);
  assert.equal(cacheRows.length, 1);
  const derivedAssets = typeof cacheRows[0]?.derived_assets === "string" ? JSON.parse(cacheRows[0].derived_assets) : cacheRows[0]?.derived_assets;
  assert.deepEqual(derivedAssets, ["derived/compose-smoke/figure.png"]);

  const queueRows = await bridge.unsafe("SELECT data::text AS data FROM pgboss.job WHERE name=$1 AND data->>'idempotencyKey'=$2 ORDER BY created_on DESC LIMIT 1", ["atlas-document-perception-v1", seeded.idempotencyKey]);
  assert.equal(queueRows.length, 1);
  const queuedData = String(queueRows[0].data);
  assert.equal(queuedData.includes("%PDF-compose-smoke-synthetic%"), false);
  assert.equal(queuedData.includes(seeded.storageKey), false);
  assert.equal(queuedData.includes(process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL ?? "agents_bridge_service_local_dev_only_32"), false);

  const mockMetrics = JSON.parse(await docker([...smokeCompose, "exec", "-T", "mistral-mock", "node", "-e", "fetch('http://127.0.0.1:3100/metrics').then(async (response) => process.stdout.write(await response.text()))"]));
  assert.ok(mockMetrics.ocrCalls >= 1, "worker-main must invoke the mocked OCR provider");
  process.stdout.write("Compose perception smoke passed through Atlas HTTP middleware and worker-main.\n");
} finally {
  if (seeded) {
    await docker([...smokeCompose, "exec", "-T", "atlas", "node", "apps/atlas/scripts/perception-compose-seed.mjs", "cleanup", seeded.executionId, seeded.idempotencyKey, seeded.storageKey], true);
  }
  await Promise.all([atlas.end(), bridge.end()]);
  await docker([...smokeCompose, "down"], true);
  await docker([...baseCompose, "up", "-d", "--wait"], true);
}
