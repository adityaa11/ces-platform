import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import postgres from "postgres";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { LocalFilesystemDocumentStore } from "@atlas/document-store";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gL+ZK2mXQAAAABJRU5ErkJggg==", "base64");

test("derived assets persist before acceptance and remain scoped, immutable, and resolvable after cache invalidation", { skip }, async () => {
  const sql = postgres(databaseUrl!, { max: 1 });
  const root = await mkdtemp(join(tmpdir(), "atlas-derived-qualification-"));
  const owner = `derived-owner-${randomUUID()}`;
  const foreign = `derived-foreign-${randomUUID()}`;
  const project = `derived-project-${randomUUID()}`;
  const workspace = `derived-workspace-${randomUUID()}`;
  const bundle = `derived-bundle-${randomUUID()}`;
  const artifactId = `derived-artifact-${randomUUID()}`;
  const executionId = `derived-execution-${randomUUID()}`;
  const sourceSha256 = createHash("sha256").update("derived-qualification").digest("hex");
  const input = { executionId, artifactId, storageKey: `documents/${randomUUID()}`, sourceSha256, mimeType: "application/pdf" as const, byteSize: 42, idempotencyKey: `derived-${randomUUID()}`, capabilityIdentity: "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1" };
  const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer("d".repeat(32)), undefined, input.capabilityIdentity, undefined, new LocalFilesystemDocumentStore(root));
  try {
    const request = await authority.create(input);
    await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now()),($3,$3,$4,false,now(),now())', [owner, `${owner}@example.test`, foreign, `${foreign}@example.test`]);
    await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'derived qualification',$3)", [project, `derived-${randomUUID().slice(0, 12)}`, owner]);
    await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [project, owner]);
    await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf',$4,$5,$6,'application/pdf',$7)", [artifactId, project, workspace, input.storageKey, sourceSha256, input.byteSize, owner]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [bundle, project, workspace]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundle, artifactId, project, workspace, executionId]);
    await authority.redeem(request);

    const descriptor = { sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 1, locatorId: "visual-1", mediaType: "image/png" as const, width: 1, height: 1, byteLength: png.byteLength, sha256: createHash("sha256").update(png).digest("hex") };
    const first = await authority.handoffDerived(request, descriptor, png);
    const orphanDescriptor = { ...descriptor, locatorId: "visual-orphan" };
    const orphan = await authority.handoffDerived(request, orphanDescriptor, png);
    assert.notEqual(orphan.assetRef, first.assetRef, "a distinct locator never aliases an unaccepted asset");
    const restarted = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer("d".repeat(32)), undefined, input.capabilityIdentity, undefined, new LocalFilesystemDocumentStore(root));
    assert.deepEqual(await restarted.handoffDerived(request, descriptor, png), first, "restart/retry sees the already verified immutable handoff");
    assert.deepEqual(await restarted.handoffDerived(request, orphanDescriptor, png), orphan, "an unaccepted manifest can only be replayed for its exact complete identity");
    await assert.rejects(() => restarted.handoffDerived(request, { ...descriptor, sha256: "0".repeat(64) }, png), /integrity|conflicts/i, "a conflicting retry cannot replace verified bytes");
    await assert.rejects(() => restarted.handoffDerived(request, { ...descriptor, mediaType: "image/jpeg" as never }, png), /metadata is invalid/i, "unsupported media is rejected before persistence");
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
    await assert.rejects(() => restarted.handoffDerived(request, { ...descriptor, byteLength: oversized.byteLength, sha256: createHash("sha256").update(oversized).digest("hex") }, oversized), /metadata is invalid/i, "oversized binary transfer is rejected before persistence");
    const [grantId, signature] = request.source.grant.split(".");
    await assert.rejects(() => restarted.handoffDerived({ ...request, source: { grant: `${grantId}.${signature![0] === "a" ? "b" : "a"}${signature!.slice(1)}` } }, descriptor, png), /invalid|unauthorized/i, "a malformed grant cannot write derived bytes");

    const good = { version: "v1" as const, executionId, artifactId, sourceSha256, perception: request.perception, provider: { name: "docling", processor: "capture", executionId, processedAt: "2026-10-09T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [{ id: "visual-1", assetRef: first.assetRef }] }] };
    await assert.rejects(() => restarted.deliver(request, { ...good, pages: [{ ...good.pages[0]!, visualRegions: [{ id: "wrong-locator", assetRef: first.assetRef }] }] }), /misbound|dangling/i);
    assert.equal((await sql.unsafe("SELECT accepted_at FROM atlas.document_perception_derived_manifest WHERE execution_id=$1", [executionId]))[0]?.accepted_at, null, "a rejected result cannot accept a staged asset");
    await restarted.deliver(request, good);
    await restarted.deliver(request, good);
    assert.equal((await sql.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [executionId]))[0]?.state, "completed");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_execution WHERE document_id=$1", [artifactId]))[0]?.count, 0, "derived evidence admission does not create semantic execution");
    assert.deepEqual((await restarted.resolveDerived({ callerUserId: owner, artifactId, sourceSha256, locatorId: descriptor.locatorId, assetRef: first.assetRef })).bytes, new Uint8Array(png));
    await assert.rejects(() => restarted.resolveDerived({ callerUserId: foreign, artifactId, sourceSha256, locatorId: descriptor.locatorId, assetRef: first.assetRef }), /unavailable|unauthorized/i);
    await assert.rejects(() => restarted.resolveDerived({ callerUserId: owner, artifactId, sourceSha256, locatorId: "other-locator", assetRef: first.assetRef }), /unavailable|unauthorized/i, "wrong locator binding cannot retrieve bytes");
    await assert.rejects(() => restarted.resolveDerived({ callerUserId: owner, artifactId, sourceSha256: "f".repeat(64), locatorId: descriptor.locatorId, assetRef: first.assetRef }), /unavailable|unauthorized/i, "wrong source binding cannot retrieve bytes");
    await assert.rejects(() => restarted.resolveDerived({ callerUserId: owner, artifactId, sourceSha256, locatorId: descriptor.locatorId, assetRef: "derived/00000000-0000-0000-0000-000000000000" }), /unavailable|unauthorized/i, "missing immutable bytes cannot be represented as available");
    await assert.rejects(() => restarted.resolveDerived({ callerUserId: owner, artifactId, sourceSha256, locatorId: "../unsafe", assetRef: first.assetRef }), /reference is invalid/i, "path traversal is rejected before storage access");
    await restarted.invalidateCache({ sourceSha256, perception: request.perception, capabilityIdentity: input.capabilityIdentity });
    assert.equal((await restarted.resolveDerived({ callerUserId: owner, artifactId, sourceSha256, locatorId: descriptor.locatorId, assetRef: first.assetRef })).byteLength, png.byteLength, "cache invalidation retains accepted historical bytes");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM atlas.document_perception_derived_manifest WHERE execution_id=$1 AND accepted_at IS NOT NULL", [executionId]))[0]?.count, 1, "cache invalidation cannot orphan or delete accepted evidence");
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET created_at=now()-interval '8 days' WHERE execution_id=$1 AND asset_ref=$2", [executionId, orphan.assetRef]);
    assert.deepEqual(await new LocalFilesystemDocumentStore(root).readDerived(orphan.assetRef), new Uint8Array(png), "an unaccepted orphan remains retained when no authoritative cleanup sweep has proven it safe to delete");
    await writeFile(join(root, first.assetRef), Buffer.from("tampered"));
    await assert.rejects(() => restarted.resolveDerived({ callerUserId: owner, artifactId, sourceSha256, locatorId: descriptor.locatorId, assetRef: first.assetRef }), /integrity/i, "resolver fails closed when immutable bytes no longer verify");
  } finally {
    await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined);
    await sql.unsafe('DELETE FROM auth."user" WHERE id=$1 OR id=$2', [owner, foreign]).catch(() => undefined);
    await sql.end();
    await rm(root, { recursive: true, force: true });
  }
});
