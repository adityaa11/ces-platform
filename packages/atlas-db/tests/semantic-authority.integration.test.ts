import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PostgresSemanticAuthority, canonicalSemanticFingerprint } from "../src/semantic-authority.ts";

const databaseUrl = process.env.DATABASE_URL;
const capability = "capability";
const scopeOf = (id: string, project: string, workspace: string, bundle: string, document: string) => ({ projectId: project, workspaceId: workspace, bundleId: bundle, documentId: document, executionId: id, contractVersion: "v1" as const });
const normalized = (executionId: string, document: string, sourceSha256: string) => ({ version: "v1" as const, executionId, artifactId: document, sourceSha256, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "test", processor: "test", executionId, processedAt: "2026-09-27T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] });

test("semantic authority binds execution context, replay, failure, and Bridge isolation in PostgreSQL", { skip: !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 }); const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = randomUUID(); const owner = `semantic-owner-${suffix}`; const project = `semantic-project-${suffix}`; const workspace = `semantic-workspace-${suffix}`; const bundle = `semantic-bundle-${suffix}`; const document = `semantic-document-${suffix}`; const perception = `perception-${suffix}`; const otherPerception = `perception-other-${suffix}`; const extraction = `semantic-extraction-${suffix}`; const reconciliation = `semantic-reconciliation-${suffix}`; const sha = "a".repeat(64);
  const insertExecution = (id: string, stage: "extraction" | "reconciliation") => atlas.unsafe("INSERT INTO atlas.semantic_execution (id, project_id, workspace_id, bundle_id, document_id, stage, contract_version, skill_version, logical_identity, lifecycle, authorized_context_identity, authorized_context_fingerprint, capability_valid_until) VALUES ($1,$2,$3,$4,$5,$6,'v1','v1',$1,'queued','context',$7,now()+interval '1 hour')", [id, project, workspace, bundle, document, stage, canonicalSemanticFingerprint(capability)]);
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'semantic',$3)", [project, `semantic-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf','private/source',$4,1,'application/pdf',$5)", [document, project, workspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [bundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'pending',$5)", [bundle, document, project, workspace, perception]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/source',$3,'application/pdf',1,'v1','completed',$4,'test')", [perception, document, sha, `perception-key-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','test',$3::jsonb)", [`cache-${suffix}`, sha, JSON.stringify(normalized(perception, document, sha))]);
    await insertExecution(extraction, "extraction"); await insertExecution(reconciliation, "reconciliation");
    const selection = { select: async (scope: ReturnType<typeof scopeOf>) => ({ version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: [], priorCandidates: [], selection: { policy: "idser-007-test", overflow: false, selectedCount: 0 } }) };
    const authority = new PostgresSemanticAuthority(atlas, selection);
    const extractionScope = scopeOf(extraction, project, workspace, bundle, document);
    const extractionJob = { executionId: extraction, skill: { id: "atlas.semantic.extract" as const, version: "v1" as const }, contextCapability: capability };
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/source',$3,'application/pdf',1,'v1','completed',$4,'test')", [otherPerception, document, sha, `perception-other-key-${suffix}`]);
    await atlas.unsafe("UPDATE atlas.normalized_document_cache SET normalized_document=$2::jsonb WHERE cache_key=$1", [`cache-${suffix}`, JSON.stringify(normalized(otherPerception, document, sha))]);
    await assert.rejects(() => authority.redeem(extractionJob), /binding failed/);
    await atlas.unsafe("UPDATE atlas.normalized_document_cache SET normalized_document=$2::jsonb WHERE cache_key=$1", [`cache-${suffix}`, JSON.stringify(normalized(perception, document, sha))]);
    assert.equal((await authority.redeem(extractionJob)).scope.executionId, extraction);
    await assert.rejects(() => authority.redeem({ ...extractionJob, contextCapability: "wrong" }), /stale|authorization/);
    const reconciliationJob = { executionId: reconciliation, skill: { id: "atlas.semantic.reconcile" as const, version: "v1" as const }, contextCapability: capability };
    const first = await authority.redeem(reconciliationJob); const second = await authority.redeem(reconciliationJob);
    assert.deepEqual(first.context, second.context);
    const envelope = { version: "v1", scope: extractionScope, skill: extractionJob.skill, provider: { provider: "test", model: "test", endpoint: "internal", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] } };
    let accepted = 0; await authority.deliver(envelope, { accept: async () => { accepted += 1; } }); await authority.deliver(envelope, { accept: async () => { accepted += 1; } }); assert.equal(accepted, 1);
    await assert.rejects(() => authority.deliver({ ...envelope, provider: { ...envelope.provider, model: "changed" } }, { accept: async () => {} }), /conflicts/);
    await assert.rejects(() => authority.fail({ scope: extractionScope, code: "provider_timeout" }), /unauthorized/);
    await assert.rejects(() => bridge.unsafe("SELECT * FROM atlas.semantic_execution"), /permission denied/i);
  } finally {
    await admin.unsafe("DELETE FROM atlas.semantic_execution_context WHERE execution_id=$1 OR execution_id=$2", [extraction, reconciliation]); await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE id=$1 OR id=$2", [extraction, reconciliation]); await admin.unsafe("DELETE FROM atlas.normalized_document_cache WHERE cache_key=$1", [`cache-${suffix}`]); await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1 OR id=$2", [perception, otherPerception]); await admin.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1", [bundle]); await admin.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1", [bundle]); await admin.unsafe("DELETE FROM atlas.document WHERE id=$1", [document]); await admin.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [workspace]); await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]); await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]); await Promise.all([admin.end(), atlas.end(), bridge.end()]);
  }
});
