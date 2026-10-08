import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createJiti } from "jiti";
import postgres from "postgres";

const [mode, stableProjectId] = process.argv.slice(2);
const databaseUrl = process.env.ATLAS_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl || !mode) throw new Error("Usage: derived-asset-cfc-qualification.mjs <route-negatives|offline-fixtures|restart-readback> [stable-project-id]");

const jiti = createJiti(import.meta.url);
const [{ PostgresPerceptionAuthority }, { PerceptionSourceGrantIssuer }, { LocalFilesystemDocumentStore }] = await Promise.all([
  jiti.import("../../../packages/atlas-db/src/perception-authority.ts"),
  jiti.import("../../../packages/atlas-core/src/index.ts"),
  jiti.import("../../../packages/document-store/src/local-filesystem-document-store.ts"),
]);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gL+ZK2mXQAAAABJRU5ErkJggg==", "base64");
const credential = process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL;
const sql = postgres(databaseUrl, { max: 2 });

const countEffects = async (projectId, artifactId) => {
  const [row] = await sql.unsafe("SELECT (SELECT count(*)::integer FROM atlas.document WHERE project_id=$1) AS documents, (SELECT count(*)::integer FROM atlas.extraction_bundle_document WHERE project_id=$1) AS members, (SELECT count(*)::integer FROM atlas.document_perception_source_grant WHERE artifact_id=$2) AS grants, (SELECT count(*)::integer FROM atlas.document_perception_execution WHERE artifact_id=$2) AS executions, (SELECT count(*)::integer FROM pgboss.job WHERE name='atlas-document-perception-v1') AS jobs, (SELECT count(*)::integer FROM atlas.semantic_execution WHERE document_id=$2) AS semantic", [projectId, artifactId]);
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
};

const setup = async () => {
  const root = await mkdtemp(join(tmpdir(), "atlas-derived-cfc-"));
  const owner = `derived-cfc-owner-${randomUUID()}`;
  const project = `derived-cfc-project-${randomUUID()}`;
  const workspace = `derived-cfc-workspace-${randomUUID()}`;
  const bundle = `derived-cfc-bundle-${randomUUID()}`;
  const artifactId = `derived-cfc-artifact-${randomUUID()}`;
  const executionId = `derived-cfc-execution-${randomUUID()}`;
  const sourceSha256 = createHash("sha256").update(`derived-cfc-${executionId}`).digest("hex");
  const input = { executionId, artifactId, storageKey: `documents/${randomUUID()}`, sourceSha256, mimeType: "application/pdf", byteSize: 42, idempotencyKey: `derived-cfc-${randomUUID()}`, capabilityIdentity: "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1" };
  const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer(credential), undefined, input.capabilityIdentity, undefined, new LocalFilesystemDocumentStore(root));
  await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
  await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'derived CFC qualification',$3)", [project, `derived-cfc-${randomUUID().slice(0, 12)}`, owner]);
  await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [project, owner]);
  await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
  await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf',$4,$5,$6,'application/pdf',$7)", [artifactId, project, workspace, input.storageKey, sourceSha256, input.byteSize, owner]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [bundle, project, workspace]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundle, artifactId, project, workspace, executionId]);
  const request = await authority.create(input);
  await authority.redeem(request);
  const descriptor = { sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 1, locatorId: "visual-cfc-1", mediaType: "image/png", width: 1, height: 1, byteLength: png.byteLength, sha256: createHash("sha256").update(png).digest("hex") };
  return { root, owner, project, artifactId, executionId, sourceSha256, authority, request, descriptor, async cleanup() { await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined); await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined); await rm(root, { recursive: true, force: true }); } };
};

if (mode === "route-negatives") {
  if (!credential) throw new Error("AGENTS_BRIDGE_SERVICE_CREDENTIAL is required for route qualification.");
  const fixture = await setup();
  try {
    const endpoint = "http://127.0.0.1:3001/internal/perception/derived";
    const baseHeaders = { authorization: `Bearer ${credential}`, "content-type": "image/png" };
    const before = await countEffects(fixture.project, fixture.artifactId);
    const malformed = await fetch(endpoint, { method: "POST", headers: { ...baseHeaders, "x-atlas-derived-metadata": "not-base64-json" }, body: png });
    assert.equal(malformed.status, 400, "malformed route metadata is rejected");
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
    const oversizedDescriptor = { ...fixture.descriptor, byteLength: oversized.byteLength, sha256: createHash("sha256").update(oversized).digest("hex") };
    const oversizedMetadata = Buffer.from(JSON.stringify({ request: fixture.request, descriptor: oversizedDescriptor })).toString("base64url");
    const oversizedResponse = await fetch(endpoint, { method: "POST", headers: { ...baseHeaders, "x-atlas-derived-metadata": oversizedMetadata }, body: oversized });
    assert.equal(oversizedResponse.status, 400, "oversized route transfer is rejected before persistence");
    await sql.unsafe("UPDATE atlas.document_perception_source_grant SET expires_at=now()-interval '1 second' WHERE execution_id=$1", [fixture.executionId]);
    const expiredMetadata = Buffer.from(JSON.stringify({ request: fixture.request, descriptor: fixture.descriptor })).toString("base64url");
    const expired = await fetch(endpoint, { method: "POST", headers: { ...baseHeaders, "x-atlas-derived-metadata": expiredMetadata }, body: png });
    assert.equal(expired.status, 400, "expired route grant is rejected before persistence");
    const [manifest] = await sql.unsafe("SELECT count(*)::integer AS count FROM atlas.document_perception_derived_manifest WHERE execution_id=$1", [fixture.executionId]);
    assert.equal(Number(manifest.count), 0, "rejected handoffs do not create an asset manifest or release an asset reference");
    assert.deepEqual(await countEffects(fixture.project, fixture.artifactId), before, "rejected handoffs create no document, member, grant, execution, perception job, or semantic effect");
    console.log(JSON.stringify({ mode, malformed: malformed.status, oversized: oversizedResponse.status, expired: expired.status, effects: before }));
  } finally { await fixture.cleanup(); }
} else if (mode === "offline-fixtures") {
  const fixture = await setup();
  try {
    const asset = await fixture.authority.handoffDerived(fixture.request, fixture.descriptor, png);
    const normalized = { version: "v1", executionId: fixture.executionId, artifactId: fixture.artifactId, sourceSha256: fixture.sourceSha256, perception: fixture.request.perception, provider: { name: "qualification", processor: "offline-fixture", executionId: fixture.executionId, processedAt: "2026-10-09T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text-cfc-1", text: "Offline derived-evidence qualification text." }], tables: [{ id: "table-cfc-1", content: "column-a | column-b\nvalue-a | value-b" }], visualRegions: [{ id: fixture.descriptor.locatorId, assetRef: asset.assetRef }] }] };
    await fixture.authority.deliver(fixture.request, normalized);
    const before = await countEffects(fixture.project, fixture.artifactId);
    const cached = await fixture.authority.getCached({ sourceSha256: fixture.sourceSha256, perception: fixture.request.perception, capabilityIdentity: "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1" });
    assert.equal(cached?.pages[0]?.textBlocks[0]?.text, "Offline derived-evidence qualification text.");
    assert.match(cached?.pages[0]?.tables[0]?.content ?? "", /value-b/);
    assert.deepEqual((await fixture.authority.resolveDerived({ callerUserId: fixture.owner, artifactId: fixture.artifactId, sourceSha256: fixture.sourceSha256, locatorId: fixture.descriptor.locatorId, assetRef: asset.assetRef })).bytes, new Uint8Array(png));
    await fixture.authority.deliver(fixture.request, normalized); // replay fixture
    await fixture.authority.resolveDerived({ callerUserId: fixture.owner, artifactId: fixture.artifactId, sourceSha256: fixture.sourceSha256, locatorId: fixture.descriptor.locatorId, assetRef: asset.assetRef }); // UI-like read fixture
    await fixture.authority.invalidateCache({ sourceSha256: fixture.sourceSha256, perception: fixture.request.perception, capabilityIdentity: "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1" }); // cache-invalidation fixture
    await fixture.authority.resolveDerived({ callerUserId: fixture.owner, artifactId: fixture.artifactId, sourceSha256: fixture.sourceSha256, locatorId: fixture.descriptor.locatorId, assetRef: asset.assetRef }); // semantic-like context read fixture
    assert.deepEqual(await countEffects(fixture.project, fixture.artifactId), before, "read/replay/UI-like/cache-invalidation/semantic-like fixtures create no recursive effects");
    console.log(JSON.stringify({ mode, fixtures: ["read", "replay", "ui-like", "cache-invalidation", "semantic-like"], effects: before, resolvedAsset: asset.assetRef }));
  } finally { await fixture.cleanup(); }
} else if (mode === "restart-readback") {
  if (!stableProjectId) throw new Error("restart-readback requires the persisted stable project id.");
  const [lifecycle] = await sql.unsafe("SELECT p.created_by_user_id,d.id AS artifact_id,d.source_sha256,m.state AS member_state FROM atlas.project p JOIN atlas.document d ON d.project_id=p.id JOIN atlas.extraction_bundle_document m ON m.document_id=d.id AND m.project_id=p.id WHERE p.stable_id=$1", [stableProjectId]);
  assert.ok(lifecycle, "the prior RUN-003 qualification project is retained across the restart");
  const manifests = await sql.unsafe("SELECT locator_id,asset_ref,byte_size,sha256 FROM atlas.document_perception_derived_manifest WHERE artifact_id=$1 AND accepted_at IS NOT NULL ORDER BY locator_id", [lifecycle.artifact_id]);
  assert.equal(manifests.length, 5, "all five accepted references remain after restart");
  const store = new LocalFilesystemDocumentStore(process.env.ATLAS_DOCUMENT_STORE_ROOT ?? "/workspace/.atlas-data");
  const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer(credential), undefined, process.env.ATLAS_D1_PERCEPTION_CAPABILITY_IDENTITY, undefined, store);
  const readback = [];
  for (const manifest of manifests) { const resolved = await authority.resolveDerived({ callerUserId: lifecycle.created_by_user_id, artifactId: lifecycle.artifact_id, sourceSha256: lifecycle.source_sha256, locatorId: manifest.locator_id, assetRef: manifest.asset_ref }); assert.equal(resolved.byteLength, Number(manifest.byte_size)); assert.equal(resolved.sha256, manifest.sha256); readback.push({ locatorId: manifest.locator_id, byteSize: resolved.byteLength, sha256: resolved.sha256 }); }
  assert.equal(lifecycle.member_state, "perceived");
  console.log(JSON.stringify({ mode, stableProjectId, memberState: lifecycle.member_state, readback }));
} else throw new Error(`Unknown qualification mode: ${mode}`);

await sql.end();
