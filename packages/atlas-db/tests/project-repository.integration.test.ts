import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { createStoredAtlasProject, PerceptionSourceGrantIssuer, type DocumentPerceptionRequest } from "@atlas/core";
import { PostgresAtlasProjectRepository } from "../src/project-repository.ts";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { createTransactionalPerceptionQueueProducer } from "../../../apps/agents-bridge/src/queue.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("project repository persists a private project graph and scopes reads to membership", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const owner = `pcc-owner-${randomUUID()}`;
  const other = `pcc-other-${randomUUID()}`;
  const project = `pcc-project-${randomUUID()}`;
  const unrelatedProject = `pcc-unrelated-project-${randomUUID()}`;
  const unrelatedWorkspace = `pcc-unrelated-workspace-${randomUUID()}`;
  const serviceProjectId = `pcc-service-${randomUUID().slice(0, 12)}`;
  const failedProjectId = `pcc-failed-${randomUUID().slice(0, 12)}`;
  const storedBytes = new Map<string, Uint8Array>();
  const documentStore = {
    async put({ bytes, mediaType }: { bytes: Uint8Array; mediaType: string }) {
      const storageKey = `documents/${randomUUID()}`;
      storedBytes.set(storageKey, bytes);
      return { storageKey, contentHash: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, byteSize: bytes.byteLength, mediaType };
    },
    async read(storageKey: string) { return storedBytes.get(storageKey)!; },
  };
  const repository = new PostgresAtlasProjectRepository(atlas);
  const input = { id: project, projectId: `pcc-${randomUUID().slice(0, 12)}`, name: "PCC repository project", description: null, creatorUserId: owner, masterWorkspaceId: `master-${randomUUID()}`, initialDraftWorkspaceId: `draft-${randomUUID()}`, documents: [{ id: `document-${randomUUID()}`, originalFilename: "prd.pdf", storageKey: `private/${randomUUID()}`, sourceSha256: "a".repeat(64), byteSize: 20, mediaType: "application/pdf" as const, createdByUserId: owner }] };
  try {
    for (const id of [owner, other]) await admin.unsafe('INSERT INTO auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1,$2,$3,false,now(),now())', [id, id, `${id}@example.test`]);
    await repository.create(input);
    assert.equal((await repository.listAccessibleTo(owner)).length, 1);
    assert.deepEqual(await repository.listAccessibleTo(other), []);
    await assert.rejects(() => repository.create({ ...input, id: `duplicate-${randomUUID()}`, masterWorkspaceId: `master-${randomUUID()}`, initialDraftWorkspaceId: `draft-${randomUUID()}`, documents: [{ ...input.documents[0], id: `document-${randomUUID()}` }] }), /duplicate key/i);
    const [document] = await atlas.unsafe("SELECT storage_key, source_sha256, byte_size, media_type FROM atlas.document WHERE project_id=$1", [project]);
    assert.deepEqual(document, { storage_key: input.documents[0].storageKey, source_sha256: input.documents[0].sourceSha256, byte_size: "20", media_type: "application/pdf" });
    const rawByteColumns = await atlas.unsafe("SELECT column_name FROM information_schema.columns WHERE table_schema='atlas' AND table_name='document' AND udt_name='bytea'");
    assert.deepEqual(Array.from(rawByteColumns), []);
    const sourceBytes = [new Uint8Array(Buffer.from("%PDF-1.7\nPCC-002 integration source")), new Uint8Array(Buffer.from("%PDF-1.7\nPCC-002 second source"))];
    const [beforeAtlasEffects] = await atlas.unsafe("SELECT (SELECT COUNT(*)::integer FROM atlas.document_perception_execution) AS execution_count, (SELECT COUNT(*)::integer FROM atlas.document_perception_source_grant) AS grant_count, (SELECT COUNT(*)::integer FROM atlas.normalized_document_cache) AS cache_count, (SELECT COUNT(*)::integer FROM atlas.document_perception_derived_asset) AS derived_asset_count");
    const [beforeBridgeEffects] = await admin.unsafe("SELECT (SELECT COUNT(*)::integer FROM bridge.background_effects) AS background_effect_count, (SELECT COUNT(*)::integer FROM bridge.document_perception_result_delivery) AS delivery_count");
    const created = await createStoredAtlasProject({ projectId: serviceProjectId, name: "PCC creation service", description: "stored through the application seam", creatorUserId: owner, sources: sourceBytes.map((bytes, index) => ({ originalFilename: `service-prd-${index + 1}.pdf`, bytes, mediaType: "application/pdf" })) }, { documentStore, projectRepository: repository });
    assert.deepEqual(created, { projectId: serviceProjectId, name: "PCC creation service", documentCount: 2 });
    const [serviceProject] = await atlas.unsafe("SELECT id, created_by_user_id FROM atlas.project WHERE stable_id=$1", [serviceProjectId]);
    assert.equal(serviceProject.created_by_user_id, owner);
    assert.deepEqual(Array.from(await atlas.unsafe("SELECT user_id, role FROM atlas.project_member WHERE project_id=$1", [serviceProject.id])), [{ user_id: owner, role: "owner" }]);
    assert.deepEqual(Array.from(await atlas.unsafe("SELECT kind, state FROM atlas.workspace WHERE project_id=$1 ORDER BY kind", [serviceProject.id])), [{ kind: "initial_draft", state: "draft" }, { kind: "master", state: "empty" }]);
    const serviceDocuments = Array.from(await atlas.unsafe("SELECT id, storage_key, source_sha256, byte_size, media_type, original_filename, created_by_user_id FROM atlas.document WHERE project_id=$1 ORDER BY original_filename", [serviceProject.id]));
    assert.equal(serviceDocuments.length, 2);
    for (const [index, serviceDocument] of serviceDocuments.entries()) {
      assert.deepEqual(await documentStore.read(String(serviceDocument.storage_key)), sourceBytes[index]);
      assert.equal(serviceDocument.source_sha256, createHash("sha256").update(sourceBytes[index]).digest("hex"));
      assert.equal(serviceDocument.byte_size, String(sourceBytes[index].byteLength));
      assert.equal(serviceDocument.media_type, "application/pdf");
      assert.equal(serviceDocument.original_filename, `service-prd-${index + 1}.pdf`);
      assert.equal(serviceDocument.created_by_user_id, owner);
    }
    const [afterAtlasEffects] = await atlas.unsafe("SELECT (SELECT COUNT(*)::integer FROM atlas.document_perception_execution) AS execution_count, (SELECT COUNT(*)::integer FROM atlas.document_perception_source_grant) AS grant_count, (SELECT COUNT(*)::integer FROM atlas.normalized_document_cache) AS cache_count, (SELECT COUNT(*)::integer FROM atlas.document_perception_derived_asset) AS derived_asset_count");
    assert.deepEqual(afterAtlasEffects, beforeAtlasEffects);
    const [afterBridgeEffects] = await admin.unsafe("SELECT (SELECT COUNT(*)::integer FROM bridge.background_effects) AS background_effect_count, (SELECT COUNT(*)::integer FROM bridge.document_perception_result_delivery) AS delivery_count");
    assert.deepEqual(afterBridgeEffects, beforeBridgeEffects);
    const [{ job_table }] = await admin.unsafe("SELECT to_regclass('pgboss.job') AS job_table");
    if (job_table === null) {
      assert.equal(job_table, null, "pg-boss has not initialized a job table for project creation to populate.");
    } else {
      const [{ count: projectJobs }] = await admin.unsafe("SELECT COUNT(*)::integer AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data::text LIKE $1", [`%${serviceProjectId}%`]);
      assert.equal(Number(projectJobs), 0);
    }
    await assert.rejects(() => createStoredAtlasProject({ projectId: input.projectId, name: "Duplicate project", description: null, creatorUserId: owner, sources: [{ originalFilename: "duplicate.pdf", bytes: sourceBytes[0], mediaType: "application/pdf" }] }, { documentStore, projectRepository: repository }), /already exists/);
    const [{ count: duplicateRows }] = await atlas.unsafe("SELECT COUNT(*)::integer AS count FROM atlas.document WHERE project_id=$1", [serviceProject.id]);
    assert.equal(Number(duplicateRows), 2);
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.pcc002_force_transaction_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'PCC-002 controlled transaction failure'; END; $$");
    await admin.unsafe("CREATE TRIGGER pcc002_force_transaction_failure BEFORE INSERT ON atlas.workspace FOR EACH ROW EXECUTE FUNCTION atlas.pcc002_force_transaction_failure()");
    await assert.rejects(() => createStoredAtlasProject({ projectId: failedProjectId, name: "Failed project", description: null, creatorUserId: owner, sources: [{ originalFilename: "failed.pdf", bytes: sourceBytes[0], mediaType: "application/pdf" }] }, { documentStore, projectRepository: repository }), /controlled transaction failure/);
    await admin.unsafe("DROP TRIGGER pcc002_force_transaction_failure ON atlas.workspace");
    await admin.unsafe("DROP FUNCTION atlas.pcc002_force_transaction_failure()");
    const [{ project_count, member_count, workspace_count, document_count }] = await atlas.unsafe("SELECT (SELECT COUNT(*)::integer FROM atlas.project WHERE stable_id=$1) AS project_count, (SELECT COUNT(*)::integer FROM atlas.project_member m JOIN atlas.project p ON p.id=m.project_id WHERE p.stable_id=$1) AS member_count, (SELECT COUNT(*)::integer FROM atlas.workspace w JOIN atlas.project p ON p.id=w.project_id WHERE p.stable_id=$1) AS workspace_count, (SELECT COUNT(*)::integer FROM atlas.document d JOIN atlas.project p ON p.id=d.project_id WHERE p.stable_id=$1) AS document_count", [failedProjectId]);
    assert.deepEqual({ project_count: Number(project_count), member_count: Number(member_count), workspace_count: Number(workspace_count), document_count: Number(document_count) }, { project_count: 0, member_count: 0, workspace_count: 0, document_count: 0 });
    await atlas.unsafe("INSERT INTO atlas.project (id, stable_id, name, created_by_user_id) VALUES ($1,$2,$3,$4)", [unrelatedProject, `pcc-${randomUUID().slice(0, 12)}`, "Unrelated project", owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id, project_id, kind, state, display_name) VALUES ($1,$2,'initial_draft','draft','Initial Draft')", [unrelatedWorkspace, unrelatedProject]);
    await assert.rejects(() => atlas.unsafe("INSERT INTO atlas.document (id, project_id, workspace_id, original_filename, storage_key, source_sha256, byte_size, media_type, created_by_user_id) VALUES ($1,$2,$3,'cross-project.pdf','private/cross-project',$4,1,'application/pdf',$5)", [`cross-project-${randomUUID()}`, project, unrelatedWorkspace, "b".repeat(64), owner]), /foreign key/i);
    const [{ count }] = await atlas.unsafe("SELECT COUNT(*)::integer AS count FROM atlas.document_perception_execution WHERE artifact_id=$1", [input.documents[0].id]);
    assert.equal(Number(count), 0);
  } finally {
    await admin.unsafe("DROP TRIGGER IF EXISTS pcc002_force_transaction_failure ON atlas.workspace");
    await admin.unsafe("DROP FUNCTION IF EXISTS atlas.pcc002_force_transaction_failure()");
    await admin.unsafe("DELETE FROM atlas.project WHERE id=$1 OR id=$2 OR stable_id=$3", [project, unrelatedProject, serviceProjectId]);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1 OR id=$2', [owner, other]);
    await Promise.all([admin.end(), atlas.end()]);
  }
});

test("IDSER-003 atomically persists the ordered bundle and only D1 kickoff", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const owner = `idser-owner-${randomUUID()}`;
  const project = `idser-project-${randomUUID().slice(0, 12)}`;
  const input = { id: randomUUID(), projectId: project, name: "IDSER kickoff", description: null, creatorUserId: owner, masterWorkspaceId: randomUUID(), initialDraftWorkspaceId: randomUUID(), documents: [1, 2, 3].map((sequence) => ({ id: randomUUID(), originalFilename: `source-${sequence}.pdf`, storageKey: `private/${randomUUID()}`, sourceSha256: String(sequence).repeat(64), byteSize: 20, mediaType: "application/pdf" as const, createdByUserId: owner })) };
  let producer: Awaited<ReturnType<typeof createTransactionalPerceptionQueueProducer>> | undefined;
  try {
    await admin.unsafe('INSERT INTO auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1,$2,$3,false,now(),now())', [owner, owner, `${owner}@example.test`]);
    const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("idser-test-service-credential-which-is-long-enough"));
    producer = await createTransactionalPerceptionQueueProducer(atlasUrl.toString());
    let releaseEnqueueGate: (() => void) | undefined;
    let observeEnqueue: (() => void) | undefined;
    const enqueueObserved = new Promise<void>((resolve) => { observeEnqueue = resolve; });
    const enqueueGate = new Promise<void>((resolve) => { releaseEnqueueGate = resolve; });
    const gatedQueue = {
      async enqueue(transaction: unknown, job: { readonly idempotencyKey: string; readonly request: DocumentPerceptionRequest }) {
        const queued = await producer!.enqueue(transaction, job);
        observeEnqueue!();
        await enqueueGate;
        return queued;
      },
    };
    const repository = new PostgresAtlasProjectRepository(atlas, { authority, queue: gatedQueue });
    const countsFor = async (projectId: string, documentId: string) => {
      const [rows] = await admin.unsafe("SELECT (SELECT COUNT(*)::integer FROM atlas.project WHERE id=$1) AS project_count, (SELECT COUNT(*)::integer FROM atlas.project_member WHERE project_id=$1) AS member_count, (SELECT COUNT(*)::integer FROM atlas.workspace WHERE project_id=$1) AS workspace_count, (SELECT COUNT(*)::integer FROM atlas.document WHERE project_id=$1) AS document_count, (SELECT COUNT(*)::integer FROM atlas.extraction_bundle WHERE project_id=$1) AS bundle_count, (SELECT COUNT(*)::integer FROM atlas.extraction_bundle_document WHERE project_id=$1) AS bundle_document_count, (SELECT COUNT(*)::integer FROM atlas.document_perception_execution e JOIN atlas.document d ON d.id=e.artifact_id WHERE d.project_id=$1) AS execution_count, (SELECT COUNT(*)::integer FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id JOIN atlas.document d ON d.id=e.artifact_id WHERE d.project_id=$1) AS grant_count", [projectId]);
      const [job] = await admin.unsafe("SELECT COUNT(*)::integer AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE $1", [`%:${documentId}:v1`]);
      return { project_count: Number(rows.project_count), member_count: Number(rows.member_count), workspace_count: Number(rows.workspace_count), document_count: Number(rows.document_count), bundle_count: Number(rows.bundle_count), bundle_document_count: Number(rows.bundle_document_count), execution_count: Number(rows.execution_count), grant_count: Number(rows.grant_count), job_count: Number(job.count) };
    };
    const creation = repository.create(input);
    await enqueueObserved;
    assert.deepEqual(await countsFor(input.id, input.documents[0].id), { project_count: 0, member_count: 0, workspace_count: 0, document_count: 0, bundle_count: 0, bundle_document_count: 0, execution_count: 0, grant_count: 0, job_count: 0 });
    releaseEnqueueGate!();
    await creation;
    assert.deepEqual(await countsFor(input.id, input.documents[0].id), { project_count: 1, member_count: 1, workspace_count: 2, document_count: 3, bundle_count: 1, bundle_document_count: 3, execution_count: 1, grant_count: 1, job_count: 1 });
    const [bundle] = await atlas.unsafe("SELECT expected_document_count, completed_document_count, state FROM atlas.extraction_bundle WHERE project_id=$1", [input.id]);
    assert.deepEqual(bundle, { expected_document_count: 3, completed_document_count: 0, state: "processing" });
    assert.deepEqual(Array.from(await atlas.unsafe("SELECT document_id, sequence, state, perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=(SELECT id FROM atlas.extraction_bundle WHERE project_id=$1) ORDER BY sequence", [input.id])).map((row) => ({ document_id: row.document_id, sequence: Number(row.sequence), state: row.state, started: row.perception_execution_id !== null })), input.documents.map((document, index) => ({ document_id: document.id, sequence: index + 1, state: index === 0 ? "perception_queued" : "pending", started: index === 0 })));
    const [{ count: queued }] = await admin.unsafe("SELECT COUNT(*)::integer AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE $1", [`%:${input.documents[0].id}:v1`]);
    assert.equal(Number(queued), 1);
    assert.equal((await atlas.unsafe("SELECT COUNT(*)::integer AS count FROM atlas.document_perception_execution WHERE artifact_id IN ($1,$2,$3)", input.documents.map((document) => document.id)))[0].count, 1);
    const failing = new PostgresAtlasProjectRepository(atlas, { authority, queue: producer });
    const failed = { ...input, id: randomUUID(), projectId: `idser-failed-${randomUUID().slice(0, 8)}`, masterWorkspaceId: randomUUID(), initialDraftWorkspaceId: randomUUID(), documents: input.documents.map((document) => ({ ...document, id: randomUUID() })) };
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.idser003_fail_after_enqueue() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'IDSER-003 controlled post-enqueue failure'; END; $$");
    await admin.unsafe("CREATE TRIGGER idser003_fail_after_enqueue BEFORE UPDATE OF perception_execution_id ON atlas.extraction_bundle_document FOR EACH ROW EXECUTE FUNCTION atlas.idser003_fail_after_enqueue()");
    await assert.rejects(() => failing.create(failed), /controlled post-enqueue failure/);
    await admin.unsafe("DROP TRIGGER idser003_fail_after_enqueue ON atlas.extraction_bundle_document");
    await admin.unsafe("DROP FUNCTION atlas.idser003_fail_after_enqueue()");
    assert.deepEqual(await countsFor(failed.id, failed.documents[0].id), { project_count: 0, member_count: 0, workspace_count: 0, document_count: 0, bundle_count: 0, bundle_document_count: 0, execution_count: 0, grant_count: 0, job_count: 0 });
  } finally {
    if (producer) await producer.close();
    await admin.unsafe("DROP TRIGGER IF EXISTS idser003_fail_after_enqueue ON atlas.extraction_bundle_document");
    await admin.unsafe("DROP FUNCTION IF EXISTS atlas.idser003_fail_after_enqueue()");
    await admin.unsafe("DELETE FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->>'idempotencyKey' LIKE $1", [`%:${input.documents[0].id}:v1`]);
    await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [input.id]);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
    await Promise.all([admin.end(), atlas.end()]);
  }
});
