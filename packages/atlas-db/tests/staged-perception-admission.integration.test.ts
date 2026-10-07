import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PgBoss } from "pg-boss";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { PostgresAtlasProjectRepository } from "../src/project-repository.ts";
import { createTransactionalPerceptionQueueProducer } from "../../../apps/agents-bridge/src/queue.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("IDSER-012-01-01 admits staged bundles fairly, atomically, and never transports source paths", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 2 });
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
    // Recreate the authority and race two refills.  The first transaction may
    // consume both permits, but both calls must still serialize through the
    // durable gate and preserve the A/B/C fair-turn order.
    const restartedAuthority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("idser012-restarted-service-credential-long-enough"));
    await Promise.all([
      atlas.begin((sql) => authority.admitStagedInTransaction(sql, producer)),
      atlas.begin((sql) => restartedAuthority.admitStagedInTransaction(sql, producer)),
    ]);
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

test("IDSER-012-01-01 serializes concurrent production creation, preserves saturation, and uses pg-boss atomically", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 4 });
  const owner = `idser012-production-${randomUUID()}`;
  const projectIds: string[] = [];
  const documentIds: string[] = [];
  const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("idser012-production-service-credential-long-enough"));
  let producer: Awaited<ReturnType<typeof createTransactionalPerceptionQueueProducer>> | undefined;
  const input = (label: string) => {
    const id = randomUUID(); projectIds.push(id);
    const documentId = randomUUID(); documentIds.push(documentId);
    return { id, projectId: `idser012-${label}-${randomUUID().slice(0, 10)}`, name: label, description: null, creatorUserId: owner, masterWorkspaceId: randomUUID(), initialDraftWorkspaceId: randomUUID(), documents: [{ id: documentId, originalFilename: `${label}.pdf`, storageKey: `private/${label}/${documentId}`, sourceSha256: "a".repeat(64), byteSize: 1, mediaType: "application/pdf" as const, createdByUserId: owner }] };
  };
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    const bossUrl = new URL(databaseUrl!);
    bossUrl.username = "agents_bridge";
    bossUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
    const boss = new PgBoss({ connectionString: bossUrl.toString(), schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false });
    await boss.start();
    await boss.createQueue("atlas-document-perception-v1");
    await boss.stop({ graceful: false });
    producer = await createTransactionalPerceptionQueueProducer(atlasUrl.toString());
    const repository = new PostgresAtlasProjectRepository(atlas, { authority, queue: producer });
    const [first, second] = [input("concurrent-a"), input("concurrent-b")];
    await Promise.all([repository.create(first), repository.create(second)]);
    const active = await atlas.unsafe("SELECT id FROM atlas.document_perception_execution WHERE state NOT IN ('completed','cancelled','failed') AND artifact_id=ANY($1::text[]) ORDER BY id", [[first.documents[0].id, second.documents[0].id]]);
    assert.equal(active.length, 2, "separate concurrent production creates serialize to exactly two permits");
    const turns = await atlas.unsafe("SELECT last_perception_admission_turn FROM atlas.extraction_bundle WHERE project_id=ANY($1::text[]) ORDER BY last_perception_admission_turn", [[first.id, second.id]]);
    const turnValues = turns.map((row) => Number(row.last_perception_admission_turn));
    assert.equal(turnValues[1], turnValues[0] + 1, "serialized admissions retain monotonic durable turns");
    const saturated = input("saturated");
    await repository.create(saturated);
    const [pending] = await atlas.unsafe("SELECT m.state, m.perception_execution_id, (SELECT count(*)::integer FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE e.artifact_id=$1) AS grants FROM atlas.extraction_bundle_document m WHERE m.project_id=$2", [saturated.documents[0].id, saturated.id]);
    const [pendingJob] = await admin.unsafe("SELECT count(*)::integer AS jobs FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE $1", [`%:${saturated.documents[0].id}:v1`]);
    assert.deepEqual({ state: pending.state, execution: pending.perception_execution_id, grants: Number(pending.grants), jobs: Number(pendingJob.jobs) }, { state: "pending", execution: null, grants: 0, jobs: 0 }, "saturated repository creation commits a durable pending member with no execution, grant, or job");
    const [success] = await atlas.unsafe("SELECT count(*)::integer AS grants FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE e.artifact_id=$1", [first.documents[0].id]);
    const [successJob] = await admin.unsafe("SELECT count(*)::integer AS jobs, (SELECT data::text FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE $1 LIMIT 1) AS payload FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE $1", [`%:${first.documents[0].id}:v1`]);
    assert.deepEqual({ grants: Number(success.grants), jobs: Number(successJob.jobs) }, { grants: 1, jobs: 1 }, "successful production admission commits exactly one fresh grant and durable pg-boss job");
    assert.doesNotMatch(String(successJob.payload), /private\//, "the persisted pg-boss payload never contains a storage path");
    const refill = input("refill");
    await repository.create(refill);
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE artifact_id=ANY($1::text[]) AND state NOT IN ('completed','cancelled','failed')", [[first.documents[0].id, second.documents[0].id]]);
    const restartedAuthority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("idser012-restarted-service-credential-long-enough"));
    await Promise.all([
      atlas.begin((sql) => authority.admitStagedInTransaction(sql, producer!)),
      atlas.begin((sql) => restartedAuthority.admitStagedInTransaction(sql, producer!)),
    ]);
    const refillAdmissions = await atlas.unsafe("SELECT artifact_id FROM atlas.document_perception_execution WHERE artifact_id=ANY($1::text[]) AND state NOT IN ('completed','cancelled','failed') ORDER BY artifact_id", [[saturated.documents[0].id, refill.documents[0].id]]);
    assert.deepEqual(refillAdmissions.map((row) => String(row.artifact_id)).sort(), [saturated.documents[0].id, refill.documents[0].id].sort(), "concurrent refill after an authority restart admits each pending member once");
    const [occupied] = await atlas.unsafe("SELECT count(*)::integer AS count FROM atlas.document_perception_execution WHERE state NOT IN ('completed','cancelled','failed')");
    assert.equal(Number(occupied.count), 2, "concurrent refill preserves the two-permit global cap");
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE artifact_id=ANY($1::text[]) AND state NOT IN ('completed','cancelled','failed')", [[saturated.documents[0].id, refill.documents[0].id]]);
    const rollback = input("pgboss-rollback");
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.idser012_fail_after_enqueue() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'IDSER-012 controlled post-enqueue failure'; END; $$");
    await admin.unsafe("CREATE TRIGGER idser012_fail_after_enqueue BEFORE UPDATE OF perception_execution_id ON atlas.extraction_bundle_document FOR EACH ROW EXECUTE FUNCTION atlas.idser012_fail_after_enqueue()");
    await assert.rejects(() => repository.create(rollback), /IDSER-012 controlled post-enqueue failure/);
    await admin.unsafe("DROP TRIGGER idser012_fail_after_enqueue ON atlas.extraction_bundle_document");
    await admin.unsafe("DROP FUNCTION atlas.idser012_fail_after_enqueue()");
    const [rolledBack] = await admin.unsafe("SELECT (SELECT count(*)::integer FROM atlas.project WHERE id=$1) AS projects, (SELECT count(*)::integer FROM atlas.document_perception_execution WHERE artifact_id=$2) AS executions, (SELECT count(*)::integer FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE e.artifact_id=$2) AS grants, (SELECT count(*)::integer FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE $3) AS jobs", [rollback.id, rollback.documents[0].id, `%:${rollback.documents[0].id}:v1`]);
    assert.deepEqual({ projects: Number(rolledBack.projects), executions: Number(rolledBack.executions), grants: Number(rolledBack.grants), jobs: Number(rolledBack.jobs) }, { projects: 0, executions: 0, grants: 0, jobs: 0 }, "a real transactional pg-boss enqueue rolls back every admission effect");
    const legacyProject = input("legacy");
    await admin.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,$3,$4)", [legacyProject.id, legacyProject.projectId, legacyProject.name, owner]);
    await admin.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Initial Draft')", [legacyProject.initialDraftWorkspaceId, legacyProject.id]);
    await admin.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [legacyProject.documents[0].id, legacyProject.id, legacyProject.initialDraftWorkspaceId, "legacy.pdf", "private/legacy.pdf", "b".repeat(64), 1, "application/pdf", owner]);
    await admin.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [randomUUID(), legacyProject.id, legacyProject.initialDraftWorkspaceId]);
    await admin.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state) SELECT id,$1,project_id,workspace_id,1,'pending' FROM atlas.extraction_bundle WHERE project_id=$2", [legacyProject.documents[0].id, legacyProject.id]);
    await assert.rejects(() => authority.create({ executionId: randomUUID(), artifactId: legacyProject.documents[0].id, storageKey: "private/legacy.pdf", sourceSha256: "b".repeat(64), mimeType: "application/pdf", byteSize: 1, idempotencyKey: `legacy-bypass-${randomUUID()}`, capabilityIdentity: "legacy-scheduler" }), /Legacy perception admission is disabled/);
  } finally {
    if (producer) await producer.close();
    await admin.unsafe("DROP TRIGGER IF EXISTS idser012_fail_after_enqueue ON atlas.extraction_bundle_document");
    await admin.unsafe("DROP FUNCTION IF EXISTS atlas.idser012_fail_after_enqueue()");
    await admin.unsafe("DELETE FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE 'staged-perception:%'");
    await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE artifact_id=ANY($1::text[])", [documentIds]);
    for (const projectId of projectIds) await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [projectId]);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
    await Promise.all([atlas.end(), admin.end()]);
  }
});
