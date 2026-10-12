import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const sourcePaths = process.argv.slice(2);
const expectedFilenames = [
  "Safara_PRD_01_Foundation.pdf",
  "Safara_PRD_02_Finance_Documents.pdf",
  "Safara_PRD_03_Readiness_Manifest_Reporting.pdf",
];
if (sourcePaths.length !== 3) throw new Error("Usage: perception-three-pdf-qualification.mjs <foundation.pdf> <finance.pdf> <readiness.pdf>");

const origin = process.env.ATLAS_LAB_ORIGIN ?? "http://localhost:3001";
const databaseUrl = process.env.ATLAS_DATABASE_URL;
if (!databaseUrl) throw new Error("ATLAS_DATABASE_URL is required.");
const sql = postgres(databaseUrl, { max: 2 });
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const sourceFiles = await Promise.all(sourcePaths.map(async (sourcePath, index) => {
  const bytes = await readFile(sourcePath);
  return {
    filename: expectedFilenames[index],
    byteSize: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    pdfHeader: bytes.subarray(0, 5).toString("ascii"),
    bytes,
  };
}));
assert.deepEqual(sourceFiles.map((source) => source.pdfHeader), ["%PDF-", "%PDF-", "%PDF-"]);

const stableProjectId = process.env.PERC_RESET_007_PROJECT_ID ?? `safara-run003-three-pdf-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const queryRows = async () => await sql.unsafe(`
  SELECT p.id AS project_id, p.stable_id, b.id AS bundle_id, b.state AS bundle_state,
         b.expected_document_count, b.perception_admission_policy,
         d.id AS document_id, d.original_filename, d.source_sha256, d.byte_size,
         m.sequence, m.state AS member_state, m.perception_execution_id,
         e.id AS execution_id, e.state AS execution_state, e.capability_identity,
         e.contract_version,
         c.cache_key, c.normalized_document,
         (SELECT count(*)::integer FROM atlas.document_perception_derived_manifest manifest
           WHERE manifest.artifact_id=d.id AND manifest.accepted_at IS NOT NULL) AS accepted_asset_count
    FROM atlas.project p
    JOIN atlas.extraction_bundle b ON b.project_id=p.id
    JOIN atlas.document d ON d.project_id=p.id
    JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id AND m.document_id=d.id
    LEFT JOIN atlas.document_perception_execution e ON e.id=m.perception_execution_id
    LEFT JOIN atlas.normalized_document_cache c ON c.source_sha256=d.source_sha256
      AND c.contract_version=e.contract_version AND c.capability='atlas.document.perceive'
      AND c.capability_identity=e.capability_identity AND c.invalidated_at IS NULL
   WHERE p.stable_id=$1
   ORDER BY m.sequence`, [stableProjectId]);

const waitFor = async (predicate, timeoutMs, label) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await delay(1_000);
  }
  throw new Error(`Timed out waiting for ${label}.`);
};

try {
  if (!process.env.PERC_RESET_007_PROJECT_ID) {
    const userEmail = `atlas-perc-reset-007-${randomUUID()}@local.invalid`;
    const password = randomBytes(24).toString("hex");
    const signUp = await fetch(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name: "PERC RESET 007", email: userEmail, password }) });
    assert.equal(signUp.status, 200, `sign-up failed: ${await signUp.text()}`);
    const signIn = await fetch(`${origin}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ email: userEmail, password }) });
    assert.equal(signIn.status, 200, `sign-in failed: ${await signIn.text()}`);
    const cookie = (typeof signIn.headers.getSetCookie === "function" ? signIn.headers.getSetCookie() : [signIn.headers.get("set-cookie")].filter(Boolean)).map((value) => value.split(";", 1)[0]).join("; ");
    const form = new FormData();
    form.set("projectId", stableProjectId);
    form.set("projectName", "Safara RUN-003 three-PDF perception");
    form.set("projectDescription", "PERC-RESET-007: perception only; no semantic execution.");
    for (const source of sourceFiles) form.append("prdFiles[]", new Blob([source.bytes], { type: "application/pdf" }), source.filename);
    const created = await fetch(`${origin}/api/projects`, { method: "POST", headers: { cookie, origin }, body: form });
    assert.equal(created.status, 201, `project creation failed: ${await created.text()}`);
  }

  let admissionSnapshot;
  const terminal = await waitFor(async () => {
    const rows = await queryRows();
    if (rows.length === 3) {
      const active = rows.filter((row) => row.execution_state && !["completed", "failed", "cancelled"].includes(String(row.execution_state)));
      const waiting = rows.filter((row) => !row.execution_state && row.member_state === "pending");
      if (!admissionSnapshot && active.length === 2 && waiting.length === 1) admissionSnapshot = rows.map((row) => ({ sequence: Number(row.sequence), filename: row.original_filename, memberState: row.member_state, executionState: row.execution_state ?? "waiting_for_permit" }));
      if (rows.every((row) => row.member_state === "perceived" && row.execution_state === "completed" && row.normalized_document)) return rows;
      if (rows.some((row) => row.execution_state === "failed" || row.member_state === "needs_attention")) throw new Error(`Perception failed: ${JSON.stringify(rows.map((row) => ({ filename: row.original_filename, memberState: row.member_state, executionState: row.execution_state })))}`);
    }
    return undefined;
  }, 12 * 60_000, "all three RUN-003 perception executions");

  assert.deepEqual(terminal.map((row) => row.original_filename), expectedFilenames, "source/member order changed");
  assert.deepEqual(terminal.map((row) => String(row.source_sha256)), sourceFiles.map((source) => source.sha256), "stored source identity changed");
  assert.ok(terminal.every((row) => row.capability_identity === "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1"), "a member did not use RUN-003");
  assert.equal(new Set(terminal.map((row) => String(row.cache_key))).size, 3, "normalized cache identities are not distinct");
  assert.ok(terminal.every((row) => Number(row.accepted_asset_count) >= 0), "asset counts are invalid");

  const projectId = String(terminal[0].project_id);
  const [workspaceProof] = await sql.unsafe(`SELECT
    (SELECT count(*)::integer FROM atlas.workspace WHERE project_id=$1 AND kind='master' AND state='empty') AS empty_masters,
    (SELECT count(*)::integer FROM atlas.workspace WHERE project_id=$1 AND kind='initial_draft' AND state='draft') AS initial_drafts,
    (SELECT count(*)::integer FROM atlas.semantic_execution WHERE project_id=$1) AS semantic_executions,
    (SELECT count(*)::integer FROM pgboss.job job WHERE job.name='bridge-background-execution-v1'
      AND job.data->'execution'->'skill'->>'id' IN ('atlas.semantic.extract','atlas.semantic.reconcile')
      AND job.data->'execution'->>'executionId' IN (SELECT id FROM atlas.semantic_execution WHERE project_id=$1)) AS semantic_jobs`, [projectId]);
  assert.equal(Number(workspaceProof.empty_masters), 1, "Master is not empty");
  assert.equal(Number(workspaceProof.initial_drafts), 1, "Initial Draft boundary is not present");
  assert.equal(Number(workspaceProof.semantic_executions), 0, "semantic executions were created");
  assert.equal(Number(workspaceProof.semantic_jobs), 0, "semantic jobs were queued");
  assert.equal(Number(terminal[0].expected_document_count), 3, "bundle count is not three");
  assert.equal(String(terminal[0].perception_admission_policy), "staged-fair-local-v1", "admission policy changed");

  const documents = terminal.map((row) => {
    const normalized = typeof row.normalized_document === "string" ? JSON.parse(row.normalized_document) : row.normalized_document;
    const pages = normalized?.pages ?? [];
    return {
      sequence: Number(row.sequence), filename: row.original_filename, documentId: row.document_id,
      sourceSha256: row.source_sha256, byteSize: Number(row.byte_size), executionId: row.execution_id,
      executionState: row.execution_state, memberState: row.member_state, capabilityIdentity: row.capability_identity,
      cacheKey: row.cache_key, textBlockCount: pages.reduce((total, page) => total + (page.textBlocks?.length ?? 0), 0),
      tableCount: pages.reduce((total, page) => total + (page.tables?.length ?? 0), 0),
      visualRegionCount: pages.reduce((total, page) => total + (page.visualRegions?.length ?? 0), 0),
      acceptedAssetCount: Number(row.accepted_asset_count),
    };
  });
  process.stdout.write(`${JSON.stringify({ stableProjectId, projectId, bundleId: terminal[0].bundle_id, sourceFiles: sourceFiles.map(({ bytes, ...source }) => source), admissionSnapshot: admissionSnapshot ?? "third member was admitted before a two-active/one-waiting observation", documents, workspace: { emptyMasters: Number(workspaceProof.empty_masters), initialDrafts: Number(workspaceProof.initial_drafts) }, bundle: { state: terminal[0].bundle_state, expectedDocumentCount: Number(terminal[0].expected_document_count), admissionPolicy: terminal[0].perception_admission_policy }, semantic: { executions: Number(workspaceProof.semantic_executions), jobs: Number(workspaceProof.semantic_jobs), providerCalls: 0 } }, null, 2)}\n`);
} finally {
  await sql.end();
}
