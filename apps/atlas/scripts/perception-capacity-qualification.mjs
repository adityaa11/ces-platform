import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const sourcePath = process.argv[2];
const origin = process.env.ATLAS_LAB_ORIGIN ?? "http://127.0.0.1:33011";
const atlasUrl = process.env.ATLAS_LAB_URL ?? origin;
const databaseUrl = process.env.ATLAS_DATABASE_URL;
if (!sourcePath || !databaseUrl) throw new Error("Usage: ATLAS_DATABASE_URL=... perception-capacity-qualification.mjs <source-pdf-path>");
const sql = postgres(databaseUrl, { max: 2 });
const bytes = await readFile(sourcePath);
const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
const userEmail = `atlas-capacity-${randomUUID()}@local.invalid`;
const userPassword = randomBytes(24).toString("hex");
const stableProjectIds = Array.from({ length: 3 }, () => `safara-capacity-${randomUUID().replaceAll("-", "").slice(0, 12)}`);

const waitFor = async (predicate, timeoutMs, label) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) { const value = await predicate(); if (value) return value; await new Promise((resolve) => setTimeout(resolve, 500)); }
  throw new Error(`Timed out waiting for ${label}.`);
};

try {
  const signUp = await fetch(`${atlasUrl}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name: "Atlas Capacity Qualification", email: userEmail, password: userPassword }) });
  assert.equal(signUp.status, 200, `sign-up failed: ${await signUp.text()}`);
  const signIn = await fetch(`${atlasUrl}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ email: userEmail, password: userPassword }) });
  assert.equal(signIn.status, 200, `sign-in failed: ${await signIn.text()}`);
  const cookie = (typeof signIn.headers.getSetCookie === "function" ? signIn.headers.getSetCookie() : [signIn.headers.get("set-cookie")].filter(Boolean)).map((value) => value.split(";", 1)[0]).join("; ");
  const create = async (projectId) => {
    const form = new FormData(); form.set("projectId", projectId); form.set("projectName", `Safara capacity ${projectId}`); form.set("projectDescription", "IDSER-012-01-03-02 two-permit qualification."); form.set("prdFiles[]", new Blob([bytes], { type: "application/pdf" }), "Safara_Buyer_Business_PRD_Professional.pdf");
    const response = await fetch(`${atlasUrl}/api/projects`, { method: "POST", headers: { cookie, origin }, body: form });
    assert.equal(response.status, 201, `project creation failed: ${await response.text()}`);
  };
  await Promise.all(stableProjectIds.map(create));
  const rows = async () => await sql.unsafe("SELECT p.stable_id,m.state AS member_state,e.state AS execution_state,d.id AS document_id FROM atlas.project p JOIN atlas.document d ON d.project_id=p.id JOIN atlas.extraction_bundle_document m ON m.document_id=d.id AND m.project_id=p.id LEFT JOIN atlas.document_perception_execution e ON e.id=m.perception_execution_id WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id", [stableProjectIds]);
  const heldSnapshot = await waitFor(async () => { const observed = await rows(); const active = observed.filter((row) => row.execution_state && !["completed", "cancelled", "failed"].includes(String(row.execution_state))); const held = observed.filter((row) => !row.execution_state && row.member_state === "pending"); return active.length === 2 && held.length === 1 ? observed : undefined; }, 120_000, "two active conversions and one held third conversion");
  const terminal = await waitFor(async () => { const observed = await rows(); return observed.length === 3 && observed.every((row) => row.member_state === "perceived" && row.execution_state === "completed") ? observed : undefined; }, 12 * 60_000, "all three qualified conversions");
  const documents = terminal.map((row) => row.document_id);
  const [proof] = await sql.unsafe("SELECT (SELECT count(*)::integer FROM atlas.document_perception_derived_manifest WHERE artifact_id=ANY($1::text[]) AND accepted_at IS NOT NULL) AS accepted_assets, (SELECT count(*)::integer FROM atlas.semantic_execution WHERE document_id=ANY($1::text[])) AS semantic_executions, (SELECT count(*)::integer FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE 'staged-perception:%') AS perception_jobs", [documents]);
  assert.equal(Number(proof.accepted_assets), 15, "each admitted conversion accepted five durable verified assets");
  assert.equal(Number(proof.semantic_executions), 0, "capacity qualification starts no semantic execution");
  console.log(JSON.stringify({ stableProjectIds, heldSnapshot: heldSnapshot.map((row) => ({ stableProjectId: row.stable_id, memberState: row.member_state, executionState: row.execution_state ?? "held" })), terminal: terminal.map((row) => ({ stableProjectId: row.stable_id, memberState: row.member_state, executionState: row.execution_state })), acceptedAssets: Number(proof.accepted_assets), semanticExecutions: Number(proof.semantic_executions), observedPerceptionJobs: Number(proof.perception_jobs) }));
} finally { await sql.end(); }
