import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PostgresSemanticFoundationRepository } from "../src/semantic-foundation-repository.ts";

const databaseUrl = process.env.DATABASE_URL;
test("semantic foundation preserves bundle scope, lifecycle, and Bridge isolation", { skip: !databaseUrl }, async (t) => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = randomUUID(); const owner = `idser-owner-${suffix}`; const project = `idser-project-${suffix}`; const workspace = `idser-draft-${suffix}`; const document = `idser-document-${suffix}`; const bundle = `idser-bundle-${suffix}`;
  try {
    await admin.unsafe('INSERT INTO auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1,$2,$3,false,now(),now())', [owner, owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id, stable_id, name, created_by_user_id) VALUES ($1,$2,'IDSER test',$3)", [project, `idser-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id, project_id, kind, state, display_name) VALUES ($1,$2,'initial_draft','draft','A duplicate display name')", [workspace, project]);
    await atlas.unsafe("INSERT INTO atlas.document (id, project_id, workspace_id, original_filename, storage_key, source_sha256, byte_size, media_type, created_by_user_id) VALUES ($1,$2,$3,'prd.pdf','test/idser',$4,1,'application/pdf',$5)", [document, project, workspace, "a".repeat(64), owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id, project_id, workspace_id, state, semantic_contract_version, reconciliation_contract_version, expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [bundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id, document_id, project_id, workspace_id, sequence, state) VALUES ($1,$2,$3,$4,1,'pending')", [bundle, document, project, workspace]);
    const found = await new PostgresSemanticFoundationRepository(atlas).findBundle(bundle);
    assert.deepEqual(found && { ...found, expectedDocumentCount: Number(found.expectedDocumentCount) }, { id: bundle, projectId: project, workspaceId: workspace, state: "waiting", expectedDocumentCount: 1, completedDocumentCount: 0 });
    await atlas.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [bundle]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='perceiving', started_at=now(), perception_execution_id=$3 WHERE bundle_id=$1 AND document_id=$2", [bundle, document, `perception-${suffix}`]);
    await assert.rejects(() => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET sequence=2 WHERE bundle_id=$1 AND document_id=$2", [bundle, document]), /immutable/i);
    await assert.rejects(() => bridge.unsafe("SELECT * FROM atlas.extraction_bundle"), /permission denied/i);
    await bridge.unsafe("INSERT INTO bridge.semantic_result_delivery (idempotency_key, execution_id, stage, validated_envelope, provenance, completion_fingerprint) VALUES ($1,$2,'extraction','{}','{}','fingerprint')", [`delivery-${suffix}`, `execution-${suffix}`]);
  } catch (error) {
    t.diagnostic(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    throw error;
  } finally {
    await admin.unsafe("UPDATE atlas.extraction_bundle SET state='waiting', started_at=NULL WHERE id=$1", [bundle]);
    await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
    await Promise.all([admin.end(), atlas.end(), bridge.end()]);
  }
});
