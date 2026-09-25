import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
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
    const [{ count }] = await atlas.unsafe("SELECT COUNT(*)::integer AS count FROM atlas.document_perception_execution WHERE artifact_id=$1", [input.documents[0].id]);
    assert.equal(Number(count), 0);
  } finally {
    await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1 OR id=$2', [owner, other]);
    await Promise.all([admin.end(), atlas.end()]);
  }
});
