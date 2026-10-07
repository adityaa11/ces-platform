import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const project = "idser-012-01-02-qualification";
const env = { ...process.env, POSTGRES_PORT: "18432", ATLAS_PORT: "18001", AGENTS_BRIDGE_PORT: "18002", DOCLING_TIMEOUT_MS: "120000" };
const base = ["compose", "-p", project, "-f", "docker-compose.yml", "-f", "docker-compose.cfc.yml"];
const origin = "http://localhost:18001";
const databaseUrl = "postgresql://atlas:atlas_local_dev_only@localhost:18432/atlas_dev";
const atlasUrl = new URL(databaseUrl); atlasUrl.username = "atlas_app"; atlasUrl.password = env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
const bridgeUrl = new URL(databaseUrl); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
const atlas = postgres(atlasUrl.toString(), { max: 3 });
const bridge = postgres(bridgeUrl.toString(), { max: 3 });
const report = { ticket: "IDSER-012-01-02", profile: null, heldConcurrency: null, terminal: null, replayRestartFailure: null, determinism: null };

const run = async (args, optional = false) => {
  try { return (await execFileAsync("docker", args, { cwd: root, env, maxBuffer: 8 * 1024 * 1024 })).stdout; }
  catch (error) { if (optional) return String(error?.stderr ?? error); throw new Error(String(error?.stderr ?? error).slice(-6000)); }
};
const waitFor = async (predicate, label, timeout = 120_000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await predicate()) return; await new Promise((resolve) => setTimeout(resolve, 250)); }
  throw new Error(`Timed out waiting for ${label}.`);
};
const composeExec = (service, expression) => run([...base, "exec", "-T", service, "node", "-e", expression]);
const proxyControl = async (next) => JSON.parse(await composeExec("docling-fault", `fetch('http://127.0.0.1:5001/__fault',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(${JSON.stringify(next)})}).then(async r=>process.stdout.write(await r.text()))`));
const proxyMetrics = async () => JSON.parse(await composeExec("docling-fault", "fetch('http://127.0.0.1:5001/__fault').then(async r=>process.stdout.write(await r.text()))"));
const atlasFault = async (next) => JSON.parse(await composeExec("atlas-fault", `fetch('http://127.0.0.1:3001/__fault',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(${JSON.stringify(next)})}).then(async r=>process.stdout.write(await r.text()))`));
const short = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const homeSecret = async () => {
  const value = await readFile(new URL("../../atlas/.dev.vars", import.meta.url), "utf8");
  const match = value.match(/^BETTER_AUTH_SECRET=(.+)$/m); assert.ok(match?.[1]); return match[1].trim();
};
const authenticate = async (label) => {
  const email = `idser01202-${label}-${randomUUID().slice(0, 8)}@example.test`;
  const signup = await fetch(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3001" }, body: JSON.stringify({ name: "IDSER 012 qualification", email, password: "a-tested-local-password" }) });
  assert.equal(signup.status, 200, await signup.text());
  const signin = await fetch(`${origin}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3001" }, body: JSON.stringify({ email, password: "a-tested-local-password" }) });
  assert.equal(signin.status, 200, await signin.text());
  return signin.headers.getSetCookie().map((item) => item.split(";", 1)[0]).join("; ");
};
const create = async (label, files) => {
  const cookie = await authenticate(label); const projectId = `idser-012-01-02-${label}-${randomUUID().slice(0, 8)}`;
  const form = new FormData(); form.set("projectId", projectId); form.set("projectName", `IDSER-012 ${label}`);
  for (const [index, file] of files.entries()) form.append("prdFiles[]", new File([file.bytes], file.name ?? `${label}-${index + 1}.pdf`, { type: "application/pdf" }));
  const response = await fetch(`${origin}/api/projects`, { method: "POST", headers: { cookie, origin: "http://localhost:3001" }, body: form });
  assert.equal(response.status, 201, await response.text()); return { projectId, cookie };
};
let approvedDigitalPdf;
const synthetic = (label) => approvedDigitalPdf ? { name: `${label}.pdf`, bytes: approvedDigitalPdf } : { name: `${label}.pdf`, bytes: Buffer.from(`%PDF-1.7\n${label}\n`) };
const scopeRows = async (projectIds) => atlas.unsafe(`SELECT p.stable_id,b.id AS bundle_id,b.state AS bundle_state,b.last_perception_admission_turn,m.sequence,m.document_id,m.state AS member_state,m.perception_execution_id,e.state AS perception_state,e.completion_fingerprint,
  (SELECT count(*)::int FROM atlas.document_perception_source_grant g WHERE g.execution_id=e.id) AS grants,
  (SELECT count(*)::int FROM atlas.normalized_document_cache c WHERE c.source_sha256=d.source_sha256 AND c.capability_identity=e.capability_identity AND c.invalidated_at IS NULL) AS accepted_cache,
  (SELECT count(*)::int FROM atlas.semantic_execution s WHERE s.bundle_id=b.id) AS semantic_executions
  FROM atlas.project p JOIN atlas.extraction_bundle b ON b.project_id=p.id JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id JOIN atlas.document d ON d.id=m.document_id LEFT JOIN atlas.document_perception_execution e ON e.id=m.perception_execution_id
  WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id,m.sequence`, [projectIds]);
const activeCounts = async (projectIds) => {
  const executions = await atlas.unsafe(`SELECT e.id FROM atlas.document_perception_execution e JOIN atlas.document d ON d.id=e.artifact_id JOIN atlas.project p ON p.id=d.project_id WHERE p.stable_id=ANY($1::text[]) AND e.state NOT IN ('completed','cancelled','failed')`, [projectIds]);
  const ids = executions.map((row) => String(row.id));
  const [bridgeCount] = ids.length ? await bridge.unsafe(`SELECT count(*)::int AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND state='active' AND data->'request'->>'executionId'=ANY($1::text[])`, [ids]) : [{ count: 0 }];
  const atlasCount = { count: executions.length };
  return { atlasNonterminal: Number(atlasCount.count), bridgeActive: Number(bridgeCount.count) };
};
const perceptionJobCounts = async (rows) => {
  const ids = rows.map((row) => row.perception_execution_id).filter(Boolean);
  if (!ids.length) return new Map();
  const jobs = await bridge.unsafe(`SELECT data->'request'->>'executionId' AS execution_id,count(*)::int AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->'request'->>'executionId'=ANY($1::text[]) GROUP BY data->'request'->>'executionId'`, [ids]);
  return new Map(jobs.map((row) => [String(row.execution_id), Number(row.count)]));
};
const terminal = async (projectId) => {
  await waitFor(async () => (await scopeRows([projectId])).every((row) => row.member_state === "perceived" && row.perception_state === "completed"), `${projectId} perceived`);
  return scopeRows([projectId]);
};
const waitForWorker = () => waitFor(async () => (await run([...base, "exec", "-T", "agents-bridge-worker", "sh", "-c", "test -f /tmp/agents-bridge-worker.ready && printf ready"], true)).trim() === "ready", "persistent perception worker readiness");
const material = (document) => ({ version: document.version, sourceSha256: document.sourceSha256, pages: document.pages });

try {
  await run([...base, "down", "-v"], true);
  // Migrations and pg-boss bootstrap remain production services; the two
  // proxies only provide bounded hold/ack-loss observations around their real
  // upstream routes.
  await run([...base, "up", "-d", "--build", "--wait", "atlas", "agents-bridge", "docling-serve", "docling-fault", "atlas-fault"]);
  const effectiveDoclingEnvironment = await run([...base, "exec", "-T", "docling-serve", "sh", "-c", "tr '\\000' '\\n' </proc/1/environ | grep -E 'DOCLING_(SERVE_WORKERS|LOCAL_CONVERSION_CONCURRENCY|DEVICE|SERVE_ENABLE_REMOTE_SERVICES)' && ps -o pid,args -p 1"]);
  const effectiveWorkerEnvironment = await run([...base, "run", "--rm", "--no-deps", "agents-bridge-pgboss-bootstrap", "sh", "-c", "true"], true);
  const invalidProfile = await run([...base, "run", "--rm", "--no-deps", "-e", "AGENTS_BRIDGE_PERCEPTION_WORKER_CONCURRENCY=3", "agents-bridge-pgboss-bootstrap"], true);
  assert.match(invalidProfile, /AGENTS_BRIDGE_PERCEPTION_WORKER_CONCURRENCY must be an integer between 1 and 2/);
  const [gate] = await atlas.unsafe("SELECT gate_key,next_turn FROM atlas.perception_admission_gate WHERE gate_key='staged-fair-local-v1'");
  assert.match(effectiveDoclingEnvironment, /DOCLING_SERVE_WORKERS=1/); assert.match(effectiveDoclingEnvironment, /DOCLING_LOCAL_CONVERSION_CONCURRENCY=2/); assert.match(effectiveDoclingEnvironment, /DOCLING_DEVICE=cpu/); assert.match(effectiveDoclingEnvironment, /DOCLING_SERVE_ENABLE_REMOTE_SERVICES=false/);
  report.profile = { effectiveDoclingEnvironment: effectiveDoclingEnvironment.trim(), gate, bridgeProfile: { background: 1, perception: 2 }, invalidProfileRejected: true, bootstrapProbe: effectiveWorkerEnvironment.trim().slice(-400) };

  // All successful perception scenarios use this repository-approved digital
  // PDF, not a synthetic header that a real converter is entitled to reject.
  approvedDigitalPdf = await readFile(new URL("../../../docs/example/Safara_PRD_01_Foundation.pdf", import.meta.url));

  // The worker readiness file is written after its persistent consumer has
  // started. Compose may briefly report it unhealthy during that startup
  // window, so start it here and let the held-call assertion below establish
  // the actual runtime readiness needed by this qualification.
  await run([...base, "up", "-d", "--build", "agents-bridge-worker"]);
  await waitForWorker();
  // Let the worker's real Docling warm-up finish first; the held-call probe
  // applies only to the subsequently staged production jobs.
  await proxyControl({ mode: "pass", holdConversions: true, releaseCount: 0, resetMetrics: true });
  const held = await Promise.all(["held-a", "held-b", "held-c"].map((label) => create(label, [synthetic(label)])));
  const heldIds = held.map((item) => item.projectId);
  await waitFor(async () => { const counts = await activeCounts(heldIds); const metrics = await proxyMetrics(); return counts.atlasNonterminal === 2 && counts.bridgeActive === 2 && metrics.active === 2 && metrics.upstreamCalls === 2; }, "two held Atlas, Bridge, and Docling calls");
  const heldBefore = await scopeRows(heldIds); const beforeCounts = await activeCounts(heldIds); const beforeMetrics = await proxyMetrics();
  const heldJobCounts = await perceptionJobCounts(heldBefore);
  assert.equal(heldBefore.filter((row) => row.member_state === "pending").length, 1); assert.equal(heldBefore.filter((row) => row.member_state === "pending" && row.perception_execution_id === null && Number(row.grants) === 0).length, 1); assert.equal(heldJobCounts.size, 2, "the pending third document has no pg-boss perception job");
  await proxyControl({ holdConversions: true, releaseCount: 1 });
  await waitFor(async () => (await scopeRows(heldIds)).filter((row) => row.member_state === "perceived").length >= 1, "first terminal held conversion");
  await waitFor(async () => { const counts = await activeCounts(heldIds); const metrics = await proxyMetrics(); return counts.atlasNonterminal === 2 && counts.bridgeActive === 2 && metrics.active === 2 && metrics.calls >= 3 && metrics.upstreamCalls >= 3; }, "refilled third conversion");
  const heldAfterRefill = await scopeRows(heldIds); const afterMetrics = await proxyMetrics();
  assert.equal(heldAfterRefill.filter((row) => row.member_state !== "pending").length, 3); assert.ok(afterMetrics.peakActive <= 2);
  await proxyControl({ holdConversions: false, releaseCount: 0 });
  for (const item of held) await terminal(item.projectId);
  report.heldConcurrency = { projectIds: heldIds, before: heldBefore, beforeCounts, beforeMetrics, afterRefill: heldAfterRefill, afterMetrics, peakConcurrentDoclingCalls: afterMetrics.peakActive };

  const terminalRows = await scopeRows(heldIds); assert.ok(terminalRows.every((row) => Number(row.accepted_cache) === 1 && Number(row.semantic_executions) === 0 && row.bundle_state === "processing"));
  const [terminalCache] = await atlas.unsafe(`SELECT c.normalized_document FROM atlas.normalized_document_cache c JOIN atlas.document_perception_execution e ON e.capability_identity=c.capability_identity JOIN atlas.document d ON d.id=e.artifact_id JOIN atlas.project p ON p.id=d.project_id WHERE p.stable_id=$1 LIMIT 1`, [heldIds[0]]);
  const parsedTerminalCache = typeof terminalCache.normalized_document === "string" ? JSON.parse(terminalCache.normalized_document) : terminalCache.normalized_document;
  assert.equal(parsedTerminalCache.version, "v1"); assert.ok(Array.isArray(parsedTerminalCache.pages));
  report.terminal = { rows: terminalRows, parserValidNormalizedDocumentV1: true, semanticJobs: 0 };

  // Completion reaches Atlas, but the first acknowledgement is deliberately
  // lost to Bridge. The retry must use the persisted result and converge.
  await atlasFault({ resultOutage: false, acknowledgementLoss: true });
  const replay = await create("ack-loss", [synthetic("ack-loss")]);
  await waitFor(async () => (await scopeRows([replay.projectId]))[0]?.perception_state === "completed", "Atlas completion before acknowledgement");
  const replayInitial = await scopeRows([replay.projectId]);
  const replayExecution = replayInitial[0].perception_execution_id;
  const [replayOperation] = await atlas.unsafe("SELECT idempotency_key FROM atlas.document_perception_execution WHERE id=$1", [replayExecution]);
  const replayIdempotencyKey = String(replayOperation.idempotency_key);
  await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.document_perception_result_delivery WHERE execution_id=$1", [replayExecution]))[0].count === 1, "durable unacknowledged result");
  await atlasFault({ resultOutage: false, acknowledgementLoss: false });
  await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.document_perception_result_delivery WHERE execution_id=$1", [replayExecution]))[0].count === 0, "acknowledged result replay");
  await waitFor(async () => (await bridge.unsafe("SELECT state FROM pgboss.job WHERE data->>'idempotencyKey'=$1 ORDER BY created_on DESC LIMIT 1", [replayIdempotencyKey]))[0]?.state === "completed", "replay queue completion");
  const replayConverged = await scopeRows([replay.projectId]); const gateBeforeDuplicate = (await atlas.unsafe("SELECT next_turn FROM atlas.perception_admission_gate WHERE gate_key='staged-fair-local-v1'"))[0].next_turn;
  await bridge.unsafe("UPDATE pgboss.job SET state='created',started_on=NULL,completed_on=NULL,start_after=now() WHERE data->>'idempotencyKey'=$1", [replayIdempotencyKey]);
  await waitFor(async () => (await bridge.unsafe("SELECT state FROM pgboss.job WHERE data->>'idempotencyKey'=$1 ORDER BY created_on DESC LIMIT 1", [replayIdempotencyKey]))[0]?.state === "completed", "duplicate result delivery");
  const replayDuplicate = await scopeRows([replay.projectId]); const gateAfterDuplicate = (await atlas.unsafe("SELECT next_turn FROM atlas.perception_admission_gate WHERE gate_key='staged-fair-local-v1'"))[0].next_turn;
  assert.deepEqual(replayDuplicate, replayConverged); assert.equal(gateAfterDuplicate, gateBeforeDuplicate);

  await proxyControl({ mode: "pass", holdConversions: true, releaseCount: 0, resetMetrics: true });
  const restartItems = await Promise.all(["restart-a", "restart-b", "restart-c"].map((label) => create(label, [synthetic(label)])));
  const restartIds = restartItems.map((item) => item.projectId);
  await waitFor(async () => { const counts = await activeCounts(restartIds); return counts.atlasNonterminal === 2 && (await proxyMetrics()).active === 2; }, "restart saturation");
  await run([...base, "restart", "agents-bridge-worker"]);
  await run([...base, "up", "-d", "agents-bridge-worker"]);
  const duringRestart = await activeCounts(restartIds); assert.ok(duringRestart.atlasNonterminal <= 2);
  // The restarted worker's real warm-up conversion shares the qualified
  // two-conversion Docling engine. Release the held calls after capturing the
  // durable bounded state, otherwise waiting for its ready marker deadlocks
  // behind the test hold rather than exercising restart recovery.
  await proxyControl({ holdConversions: false, releaseCount: 0 });
  await waitForWorker();
  for (const item of restartItems) await terminal(item.projectId);

  // Reserve one real global permit with an in-flight conversion so this
  // two-document bundle receives only one admission. The held conversion has
  // already reached real Docling, so it cannot disappear between the capacity
  // observation and failure-bundle creation.
  await proxyControl({ mode: "pass", holdConversions: true, releaseCount: 0 });
  const failureBlocker = await create("fail-hold", [synthetic("terminal-failure-blocker")]);
  await waitFor(async () => (await activeCounts([failureBlocker.projectId])).atlasNonterminal === 1 && (await proxyMetrics()).active === 1, "failure-scenario held permit");
  await proxyControl({ mode: "processing", holdConversions: true, releaseCount: 0 });
  const failed = await create("terminal-failure", [synthetic("failure-one"), synthetic("failure-two")]);
  await waitFor(async () => (await scopeRows([failed.projectId]))[0]?.bundle_state === "needs_attention", "terminal perception failure");
  const failedRows = await scopeRows([failed.projectId]); assert.equal(failedRows.filter((row) => row.member_state === "needs_attention").length, 1); assert.equal(failedRows.filter((row) => row.member_state === "pending" && row.perception_execution_id === null).length, 1);
  await proxyControl({ mode: "pass", holdConversions: true, releaseCount: 1 });
  await terminal(failureBlocker.projectId);
  await proxyControl({ mode: "pass", holdConversions: false, releaseCount: 0 });
  const healthy = await create("healthy-after-failure", [synthetic("healthy-after-failure")]); const healthyRows = await terminal(healthy.projectId); assert.equal(healthyRows[0].member_state, "perceived");
  report.replayRestartFailure = { acknowledgementLoss: { executionId: replayExecution, initial: replayInitial, converged: replayConverged, duplicate: replayDuplicate, gateBeforeDuplicate, gateAfterDuplicate }, restart: { projectIds: restartIds, observedNonterminalDuringRestart: duringRestart.atlasNonterminal, final: await scopeRows(restartIds) }, terminalFailure: { reservedPermit: await scopeRows([failureBlocker.projectId]), rows: failedRows, healthyRefill: healthyRows } };

  // RC-05 measures only the warm sequential and two-concurrent controls;
  // clear proxy counters after the prior RC-02/04 observations have drained.
  await proxyControl({ mode: "pass", holdConversions: false, releaseCount: 0, resetMetrics: true });
  const fixtures = await Promise.all(["Safara_PRD_01_Foundation.pdf", "Safara_PRD_02_Finance_Documents.pdf"].map(async (name) => ({ name, bytes: await readFile(new URL(`../../../docs/example/${name}`, import.meta.url)) })));
  const timed = async (label, file) => { const started = Date.now(); const item = await create(label, [file]); const rows = await terminal(item.projectId); return { item, rows, durationMilliseconds: Date.now() - started }; };
  const sequentialOne = await timed("sequential-one", fixtures[0]); const sequentialTwo = await timed("sequential-two", fixtures[1]);
  const concurrentStarted = Date.now(); const [concurrentOne, concurrentTwo] = await Promise.all([timed("concurrent-one", fixtures[0]), timed("concurrent-two", fixtures[1])]); const concurrentDuration = Date.now() - concurrentStarted;
  const loadNormalized = async (projectId) => { const value = (await atlas.unsafe(`SELECT c.normalized_document FROM atlas.normalized_document_cache c JOIN atlas.document_perception_execution e ON e.capability_identity=c.capability_identity JOIN atlas.document d ON d.id=e.artifact_id JOIN atlas.project p ON p.id=d.project_id WHERE p.stable_id=$1`, [projectId]))[0].normalized_document; return typeof value === "string" ? JSON.parse(value) : value; };
  const sequentialDocuments = [await loadNormalized(sequentialOne.item.projectId), await loadNormalized(sequentialTwo.item.projectId)]; const concurrentDocuments = [await loadNormalized(concurrentOne.item.projectId), await loadNormalized(concurrentTwo.item.projectId)];
  for (const index of [0, 1]) assert.deepEqual(material(concurrentDocuments[index]), material(sequentialDocuments[index]), `concurrent ${index + 1} preserves material normalized output`);
  const stats = await run([...base, "stats", "--no-stream", "--format", "{{.Name}} {{.CPUPerc}} {{.MemUsage}}"]);
  const cuda = await run([...base, "exec", "-T", "docling-serve", "python", "-c", "import torch; print({'cuda_available': torch.cuda.is_available(), 'cuda_version': torch.version.cuda})"]);
  const performance = { sequential: [sequentialOne, sequentialTwo].map(({ item, durationMilliseconds }, index) => ({ projectId: item.projectId, durationMilliseconds, normalizedSha256: short(material(sequentialDocuments[index])) })), concurrent: [concurrentOne, concurrentTwo].map(({ item, durationMilliseconds }, index) => ({ projectId: item.projectId, durationMilliseconds, normalizedSha256: short(material(concurrentDocuments[index])) })), concurrentWallMilliseconds: concurrentDuration, peakConcurrentConversions: (await proxyMetrics()).peakActive, stats: stats.trim(), cuda: cuda.trim(), documentHashes: { sequential: sequentialDocuments.map((item) => short(material(item))), concurrent: concurrentDocuments.map((item) => short(material(item))) } };
  assert.ok(Math.max(sequentialOne.durationMilliseconds, sequentialTwo.durationMilliseconds, concurrentOne.durationMilliseconds, concurrentTwo.durationMilliseconds) <= 20_000, "warm route must remain within 20s per document"); assert.match(cuda, /cuda_available.*False/); assert.ok(performance.peakConcurrentConversions <= 2);
  report.determinism = performance;
  process.stdout.write(`IDSER-012-01-02 qualification evidence: ${JSON.stringify(report)}\n`);
} finally {
  await Promise.all([atlas.end(), bridge.end()]);
  await run([...base, "down", "-v"], true);
}
