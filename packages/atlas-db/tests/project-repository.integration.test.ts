import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { createStoredAtlasProject } from "@atlas/core";
import { PostgresAtlasProjectRepository } from "../src/project-repository.ts";

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
    const [beforeBridgeEffects] = await admin.unsafe("SELECT (SELECT COUNT(*)::integer FROM bridge.background_effects) AS background_effect_count, (SELECT COUNT(*)::integer FROM bridge.document_perception_result_delivery) AS delivery_count, (SELECT COUNT(*)::integer FROM pg_catalog.pg_tables WHERE schemaname='pgboss') AS pgboss_table_count");
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
    const [afterBridgeEffects] = await admin.unsafe("SELECT (SELECT COUNT(*)::integer FROM bridge.background_effects) AS background_effect_count, (SELECT COUNT(*)::integer FROM bridge.document_perception_result_delivery) AS delivery_count, (SELECT COUNT(*)::integer FROM pg_catalog.pg_tables WHERE schemaname='pgboss') AS pgboss_table_count");
    assert.deepEqual(afterBridgeEffects, beforeBridgeEffects);
    await assert.rejects(() => createStoredAtlasProject({ projectId: input.projectId, name: "Duplicate project", description: null, creatorUserId: owner, sources: [{ originalFilename: "duplicate.pdf", bytes: sourceBytes[0], mediaType: "application/pdf" }] }, { documentStore, projectRepository: repository }), /already exists/);
    const [{ count: duplicateRows }] = await atlas.unsafe("SELECT COUNT(*)::integer AS count FROM atlas.document WHERE storage_key LIKE 'documents/%'");
    assert.equal(Number(duplicateRows), 2);
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.pcc002_force_transaction_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'PCC-002 controlled transaction failure'; END; $$");
    await admin.unsafe("CREATE TRIGGER pcc002_force_transaction_failure BEFORE INSERT ON atlas.workspace FOR EACH ROW EXECUTE FUNCTION atlas.pcc002_force_transaction_failure()");
    await assert.rejects(() => createStoredAtlasProject({ projectId: failedProjectId, name: "Failed project", description: null, creatorUserId: owner, sources: [{ originalFilename: "failed.pdf", bytes: sourceBytes[0], mediaType: "application/pdf" }] }, { documentStore, projectRepository: repository }), /controlled transaction failure/);
    await admin.unsafe("DROP TRIGGER pcc002_force_transaction_failure ON atlas.workspace");
    await admin.unsafe("DROP FUNCTION atlas.pcc002_force_transaction_failure()");
    const [{ project_count, member_count, workspace_count, document_count }] = await atlas.unsafe("SELECT (SELECT COUNT(*)::integer FROM atlas.project WHERE stable_id=$1) AS project_count, (SELECT COUNT(*)::integer FROM atlas.project_member m JOIN atlas.project p ON p.id=m.project_id WHERE p.stable_id=$1) AS member_count, (SELECT COUNT(*)::integer FROM atlas.workspace w JOIN atlas.project p ON p.id=w.project_id WHERE p.stable_id=$1) AS workspace_count, (SELECT COUNT(*)::integer FROM atlas.document d JOIN atlas.project p ON p.id=d.project_id WHERE p.stable_id=$1) AS document_count", [failedProjectId]);
    assert.deepEqual({ project_count: Number(project_count), member_count: Number(member_count), workspace_count: Number(workspace_count), document_count: Number(document_count) }, { project_count: 0, member_count: 0, workspace_count: 0, document_count: 0 });
    await atlas.unsafe("INSERT INTO atlas.project (id, stable_id, name, created_by_user_id) VALUES ($1,$2,$3,$4)", [unrelatedProject, `pcc-${randomUUID().slice(0, 12)}`, "Unrelated project", owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id, project_id, kind, state) VALUES ($1,$2,'initial_draft','draft')", [unrelatedWorkspace, unrelatedProject]);
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
