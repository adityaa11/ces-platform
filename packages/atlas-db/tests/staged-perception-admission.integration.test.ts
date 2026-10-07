import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("IDSER-012-01-01 admits staged bundles fairly, atomically, and never transports source paths", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const owner = `idser012-owner-${randomUUID()}`;
  const projectIds: string[] = [];
  const queuedJobs: unknown[] = [];
  const producer = { enqueue: async (_transaction: unknown, job: unknown) => { queuedJobs.push(job); return randomUUID(); }, close: async () => undefined };
  const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("idser012-service-credential-long-enough"));
  const bundles = new Map<string, { bundleId: string; documents: string[] }>();
  const createBundle = async (label: string, count: number) => {
    const projectId = `idser012-project-${label}-${randomUUID()}`;
    const workspaceId = `idser012-workspace-${label}-${randomUUID()}`;
    const bundleId = `idser012-${label}`;
    const documents = Array.from({ length: count }, (_, index) => `idser012-${label}-document-${index + 1}-${randomUUID()}`);
    projectIds.push(projectId);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,$3,$4)", [projectId, `idser012-${label}-${randomUUID().slice(0, 12)}`, label, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Initial Draft')", [workspaceId, projectId]);
    for (const [index, documentId] of documents.entries()) await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,1,'application/pdf',$7)", [documentId, projectId, workspaceId, `${label}-${index + 1}.pdf`, `private/${label}/${index + 1}.pdf`, `${String(index + 1).padStart(2, "0")}${"a".repeat(62)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,perception_admission_policy,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1','staged-fair-local-v1',$4)", [bundleId, projectId, workspaceId, count]);
    for (const [index, documentId] of documents.entries()) await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state) VALUES ($1,$2,$3,$4,$5,'pending')", [bundleId, documentId, projectId, workspaceId, index + 1]);
    bundles.set(label, { bundleId, documents });
  };
  const admitted = async () => Array.from(await atlas.unsafe("SELECT b.id AS bundle_id,m.sequence,e.id AS execution_id,e.state FROM atlas.extraction_bundle b JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id JOIN atlas.document_perception_execution e ON e.id=m.perception_execution_id WHERE b.id LIKE 'idser012-%' ORDER BY e.created_at, b.id, m.sequence")).map((row) => ({ bundle: String(row.bundle_id), sequence: Number(row.sequence), execution: String(row.execution_id), state: String(row.state) }));
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await createBundle("a", 4); await createBundle("b", 5); await createBundle("c", 2);
    await atlas.begin((sql) => authority.admitStagedInTransaction(sql, producer));
    assert.deepEqual((await admitted()).map(({ bundle, sequence }) => [bundle, sequence]), [["idser012-a", 1], ["idser012-b", 1]], "never-served A and B receive the first two permits by stable tie-break");
    assert.equal((await atlas.unsafe("SELECT count(*)::integer AS count FROM atlas.document_perception_execution WHERE state NOT IN ('completed','cancelled','failed')"))[0].count, 2, "the Atlas-owned gate never issues a third permit");
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE state NOT IN ('completed','cancelled','failed')");
    await atlas.begin((sql) => authority.admitStagedInTransaction(sql, producer));
    assert.deepEqual((await atlas.unsafe("SELECT id,last_perception_admission_turn FROM atlas.extraction_bundle WHERE id IN ('idser012-a','idser012-c') ORDER BY last_perception_admission_turn")).map((row) => String(row.id)), ["idser012-c", "idser012-a"], "least-recently-served C then A receive the next durable turns");
    assert.ok((await admitted()).some(({ bundle, sequence }) => bundle === "idser012-c" && sequence === 1));
    assert.ok((await admitted()).some(({ bundle, sequence }) => bundle === "idser012-a" && sequence === 2), "admission always selects a bundle's lowest pending sequence");
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE state NOT IN ('completed','cancelled','failed')");
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='needs_attention' WHERE bundle_id IN ('idser012-b','idser012-c') AND state='pending'");
    await atlas.begin((sql) => authority.admitStagedInTransaction(sql, producer));
    assert.deepEqual((await admitted()).slice(-2).map(({ bundle }) => bundle), ["idser012-a", "idser012-a"], "a lone bundle elastically borrows both permits without preemption");
    assert.ok(queuedJobs.length >= 4);
    assert.ok(queuedJobs.every((job) => !JSON.stringify(job).includes("private/")), "queue payloads contain opaque grants, never storage paths");
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE state NOT IN ('completed','cancelled','failed')");
    await createBundle("rollback", 1);
    const rollback = { enqueue: async () => { throw new Error("controlled admission rollback"); } };
    await assert.rejects(() => atlas.begin((sql) => authority.admitStagedInTransaction(sql, rollback)), /controlled admission rollback/);
    assert.deepEqual(Array.from(await atlas.unsafe("SELECT state,perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id='idser012-rollback'")), [{ state: "pending", perception_execution_id: null }], "rollback leaves no execution or member transition");
    assert.equal((await atlas.unsafe("SELECT count(*)::integer AS count FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE e.idempotency_key LIKE 'staged-perception:idser012-rollback:%'"))[0].count, 0, "rollback leaves no fresh source grant or job");
  } finally {
    await producer.close();
    await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE idempotency_key LIKE 'staged-perception:idser012-%'");
    for (const projectId of projectIds) await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [projectId]);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
    await Promise.all([atlas.end(), admin.end()]);
  }
});
