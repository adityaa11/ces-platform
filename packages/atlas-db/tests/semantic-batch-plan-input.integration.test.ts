import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import test from "node:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import postgres from "postgres";
import { createInternalReceivingBoundary, PerceptionSourceGrantIssuer } from "@atlas/core";
import { LocalFilesystemDocumentStore } from "@atlas/document-store";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { PostgresAcceptedSemanticBatchPlanDocumentResolver, PostgresAcceptedSemanticBatchPlanInputFixtureRepository, parseSemanticBatchPlanInputV1 } from "../src/semantic-batch-plan-input.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gL+ZK2mXQAAAABJRU5ErkJggg==", "base64");

test("accepted RUN-003 facts derive the sole canonical semantic-batch input without any downstream effect", { skip }, async () => {
  const sql = postgres(databaseUrl!, { max: 1 });
  const root = await mkdtemp(join(tmpdir(), "atlas-semantic-batch-resolver-"));
  const suffix = randomUUID();
  const owner = `semantic-batch-input-owner-${suffix}`;
  const sessionToken = `semantic-batch-input-session-${suffix}`;
  const project = `semantic-batch-input-project-${suffix}`;
  const workspace = `semantic-batch-input-workspace-${suffix}`;
  const bundle = `semantic-batch-input-bundle-${suffix}`;
  const documentId = `semantic-batch-input-document-${suffix}`;
  const executionId = `semantic-batch-input-execution-${suffix}`;
  const sourceSha256 = createHash("sha256").update(`semantic-batch-input-source-${suffix}`).digest("hex");
  const foreignProject = `semantic-batch-input-foreign-project-${suffix}`;
  const foreignWorkspace = `semantic-batch-input-foreign-workspace-${suffix}`;
  const foreignBundle = `semantic-batch-input-foreign-bundle-${suffix}`;
  const foreignDocumentId = `semantic-batch-input-foreign-document-${suffix}`;
  const foreignExecutionId = `semantic-batch-input-foreign-execution-${suffix}`;
  const foreignSourceSha256 = createHash("sha256").update(`semantic-batch-input-foreign-source-${suffix}`).digest("hex");
  const capabilityIdentity = "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1";
  const input = { executionId, artifactId: documentId, storageKey: `private/${suffix}.pdf`, sourceSha256, mimeType: "application/pdf" as const, byteSize: 64, idempotencyKey: `semantic-batch-input-${suffix}`, capabilityIdentity };
  const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer("i".repeat(32)), undefined, capabilityIdentity, undefined, new LocalFilesystemDocumentStore(root));
  const fixtures = new PostgresAcceptedSemanticBatchPlanInputFixtureRepository(sql);
  const resolver = new PostgresAcceptedSemanticBatchPlanDocumentResolver(sql);
  try {
    const request = await authority.create(input);
    await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await sql.unsafe('INSERT INTO auth."session" (id,"expiresAt",token,"createdAt","updatedAt","userId") VALUES ($1,now()+interval \'5 minutes\',$2,now(),now(),$3)', [`semantic-batch-input-session-id-${suffix}`, sessionToken, owner]);
    await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'semantic batch input fixture',$3)", [project, `semantic-batch-input-${suffix.slice(0, 12)}`, owner]);
    await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [project, owner]);
    await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'accepted.pdf',$4,$5,$6,'application/pdf',$7)", [documentId, project, workspace, input.storageKey, sourceSha256, input.byteSize, owner]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [bundle, project, workspace]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundle, documentId, project, workspace, executionId]);
    await authority.redeem(request);
    const asset = await authority.handoffDerived(request, { sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 1, locatorId: "resolver-visual-1", mediaType: "image/png", width: 1, height: 1, byteLength: png.byteLength, sha256: createHash("sha256").update(png).digest("hex") }, png);
    await authority.deliver(request, {
      version: "v1",
      executionId,
      artifactId: documentId,
      sourceSha256,
      perception: request.perception,
      provider: { name: "docling", processor: "run-003-capture", executionId, processedAt: "2026-10-19T00:00:00.000Z" },
      pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [{ id: "resolver-visual-1", assetRef: asset.assetRef }] }],
    });
    const accepted = (await sql.unsafe("SELECT e.state AS execution_state, m.state AS member_state, e.completion_fingerprint, c.cache_key FROM atlas.document_perception_execution e JOIN atlas.extraction_bundle_document m ON m.perception_execution_id=e.id JOIN atlas.normalized_document_cache c ON c.source_sha256=e.source_sha256 AND c.contract_version=e.contract_version AND c.capability_identity=e.capability_identity AND c.invalidated_at IS NULL WHERE e.id=$1", [executionId]))[0]!;
    assert.deepEqual({ execution_state: accepted.execution_state, member_state: accepted.member_state }, { execution_state: "completed", member_state: "perceived" }, "fixture source is an actual accepted staged-perception record");
    const before = (await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.normalized_document_cache WHERE source_sha256=$1) AS cache_rows, (SELECT count(*)::int FROM atlas.document_perception_derived_asset asset JOIN atlas.normalized_document_cache cache ON cache.cache_key=asset.cache_key WHERE cache.source_sha256=$1) AS derived_asset_links, (SELECT count(*)::int FROM atlas.document_perception_derived_manifest WHERE artifact_id=$2 AND accepted_at IS NOT NULL) AS accepted_media_manifests, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$2) AS semantic_executions, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE document_id=$2) AS semantic_results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$2) AS semantic_candidates, (SELECT count(*)::int FROM atlas.knowledge_index WHERE document_id=$2) AS knowledge_index, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$2) AS reconciliation_results", [sourceSha256, documentId]))[0];
    const fixture = await fixtures.derive(executionId);
    const replay = await fixtures.derive(executionId);
    assert.deepEqual(replay, fixture, "the same accepted facts always reproduce the exact fixture and provenance");
    assert.equal(fixture.provenance.repositoryPath, "atlas.document_perception_execution -> atlas.extraction_bundle_document -> atlas.document -> atlas.normalized_document_cache");
    assert.equal(fixture.input.normalizedDocumentRef, accepted.cache_key, "fixture uses the persisted cache key");
    assert.equal(fixture.input.sourceSha256, sourceSha256, "fixture uses the original document source digest");
    assert.equal(fixture.input.normalizedDocumentFingerprint, accepted.completion_fingerprint, "fixture uses the accepted completion fingerprint");
    assert.notEqual(fixture.input.normalizedDocumentRef, fixture.input.normalizedDocumentFingerprint, "cache key and completion fingerprint remain distinct identities");
    assert.equal(fixture.canonicalJsonSha256, createHash("sha256").update(fixture.canonicalJson).digest("hex"));
    assert.deepEqual(parseSemanticBatchPlanInputV1(fixture.canonicalJson), fixture.input);
    const scope = { callerUserId: owner, callerSessionToken: sessionToken, projectId: project, workspaceId: workspace, bundleId: bundle, documentId };
    const resolved = await resolver.resolve(scope, fixture.input);
    assert.equal(resolved.normalizedDocument.executionId, executionId, "the real parser result redeems to the accepted normalized document");
    assert.deepEqual(resolved.source, { documentId, sourceSha256 }, "the planner receives only a bounded source reference, never a storage path or bytes");
    assert.deepEqual(resolved.media.map((media) => media.assetRef), [asset.assetRef], "the planner receives only the accepted, locator-bound media reference metadata");
    assert.deepEqual(resolved.rel, { state: "unavailable" }, "REL absence is explicit and no graph is fabricated");
    const foreignRequest = await authority.create({ executionId: foreignExecutionId, artifactId: foreignDocumentId, storageKey: `private/foreign-${suffix}.pdf`, sourceSha256: foreignSourceSha256, mimeType: "application/pdf", byteSize: 64, idempotencyKey: `semantic-batch-input-foreign-${suffix}`, capabilityIdentity });
    await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'foreign semantic batch input fixture',$3)", [foreignProject, `foreign-semantic-batch-input-${suffix.slice(0, 12)}`, owner]);
    await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Foreign Draft')", [foreignWorkspace, foreignProject]);
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'foreign-accepted.pdf',$4,$5,$6,'application/pdf',$7)", [foreignDocumentId, foreignProject, foreignWorkspace, `private/foreign-${suffix}.pdf`, foreignSourceSha256, 64, owner]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [foreignBundle, foreignProject, foreignWorkspace]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [foreignBundle, foreignDocumentId, foreignProject, foreignWorkspace, foreignExecutionId]);
    await authority.redeem(foreignRequest);
    await authority.deliver(foreignRequest, {
      version: "v1",
      executionId: foreignExecutionId,
      artifactId: foreignDocumentId,
      sourceSha256: foreignSourceSha256,
      perception: foreignRequest.perception,
      provider: { name: "docling", processor: "run-003-capture", executionId: foreignExecutionId, processedAt: "2026-10-19T00:00:00.000Z" },
      pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }],
    });
    const foreignFixture = await fixtures.derive(foreignExecutionId);
    const forbiddenEffectsBefore = (await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS bridge_jobs, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_admissions, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservations, (SELECT count(*)::int FROM bridge.provider_work_dispatch) AS bss_dispatches, (SELECT count(*)::int FROM bridge.provider_work_wakeup_dispatch) AS bss_wakeup_dispatches"))[0];
    const serviceCredential = process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL ?? "agents_bridge_service_local_dev_only_32";
    let parserCalls = 0;
    let backgroundResolverCalls = 0;
    const backgroundReceiver = createInternalReceivingBoundary({
      serviceCredential,
      parseBody: (rawBody) => {
        parserCalls += 1;
        return parseSemanticBatchPlanInputV1(rawBody);
      },
      redeem: async (body) => {
        backgroundResolverCalls += 1;
        return resolver.resolveBackground(body);
      },
    });
    await assert.rejects(() => backgroundReceiver.receive(undefined, fixture.canonicalJson), /unauthorized internal service request/i, "an unauthenticated receiving request is rejected before parsing or redemption");
    await assert.rejects(() => backgroundReceiver.receive("wrong-service-credential", fixture.canonicalJson), /unauthorized internal service request/i, "a wrong receiving credential is rejected before parsing or redemption");
    assert.deepEqual({ parserCalls, backgroundResolverCalls }, { parserCalls: 0, backgroundResolverCalls: 0 }, "invalid credentials have zero parser and Atlas resolver calls");
    const backgroundResolved = await backgroundReceiver.receive(serviceCredential, fixture.canonicalJson);
    assert.deepEqual(backgroundResolved, resolved, "background redemption returns the same bounded accepted-document planner result as interactive redemption");
    assert.deepEqual(backgroundResolved.scope, { projectId: project, workspaceId: workspace, bundleId: bundle, documentId }, "background scope is derived from the authoritative joined rows");
    assert.deepEqual({ parserCalls, backgroundResolverCalls }, { parserCalls: 1, backgroundResolverCalls: 1 }, "the authenticated receiver parses and redeems the original canonical JSON exactly once");
    await assert.rejects(() => resolver.resolve({ ...scope, projectId: `foreign-project-${suffix}` }, fixture.input), /unavailable|unauthorized/i, "foreign scope fails closed");
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, JSON.stringify({ ...fixture.input, sourceSha256: "f".repeat(64) })), /unavailable|unauthorized/i, "an independently altered source hash fails closed for background redemption");
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, JSON.stringify({ ...fixture.input, normalizedDocumentRef: "f".repeat(64) })), /unavailable|unauthorized/i, "an independently altered cache reference fails closed for background redemption");
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, JSON.stringify({ ...fixture.input, normalizedDocumentFingerprint: "f".repeat(64) })), /unavailable|unauthorized/i, "a stale fingerprint fails closed for background redemption");
    await sql.unsafe('UPDATE auth."session" SET "expiresAt"=now()-interval \'1 second\' WHERE token=$1', [sessionToken]);
    await assert.rejects(() => resolver.resolve(scope, fixture.input), /unavailable|unauthorized/i, "an expired authenticated session fails closed");
    assert.deepEqual(await backgroundReceiver.receive(serviceCredential, fixture.canonicalJson), resolved, "logout or session expiry does not terminate independently authorized background redemption");
    await sql.unsafe('UPDATE auth."session" SET "expiresAt"=now()+interval \'5 minutes\' WHERE token=$1', [sessionToken]);
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, fixture.canonicalJson.replace("\"normalizedDocumentVersion\":\"v1\"", "\"normalizedDocumentVersion\":\"v2\"")), /SemanticBatchPlanInput\/v1 is invalid/, "a wrong version is rejected by the strict receiver parser before background redemption");
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, JSON.stringify({ ...fixture.input, perceptionExecutionId: foreignFixture.input.perceptionExecutionId })), /unavailable|unauthorized/i, "a persisted cross-document execution substitution fails closed");
    await sql.unsafe("UPDATE atlas.normalized_document_cache SET invalidated_at=now() WHERE cache_key=$1", [fixture.input.normalizedDocumentRef]);
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, fixture.canonicalJson), /unavailable|unauthorized/i, "a stale cache fails closed for background redemption");
    await sql.unsafe("UPDATE atlas.normalized_document_cache SET invalidated_at=NULL WHERE cache_key=$1", [fixture.input.normalizedDocumentRef]);
    await sql.unsafe("UPDATE atlas.document_perception_execution SET state='cancelled' WHERE id=$1", [executionId]);
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, fixture.canonicalJson), /unavailable|unauthorized/i, "a cancelled accepted execution fails closed for background redemption");
    await sql.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE id=$1", [executionId]);
    await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='perception_queued' WHERE bundle_id=$1 AND document_id=$2", [bundle, documentId]);
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, fixture.canonicalJson), /unavailable|unauthorized/i, "an otherwise-valid unaccepted member lifecycle fails closed without leaking a planner result");
    await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='perceived' WHERE bundle_id=$1 AND document_id=$2", [bundle, documentId]);
    await sql.unsafe("UPDATE atlas.extraction_bundle SET state='waiting', started_at=NULL WHERE id=$1", [bundle]);
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, fixture.canonicalJson), /unavailable|unauthorized/i, "a nonprocessing bundle fails closed for background redemption");
    await sql.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [bundle]);
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET accepted_at=NULL WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef]);
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, fixture.canonicalJson), /media.*unavailable|unauthorized/i, "missing accepted media fails closed without leaking the normalized document");
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET accepted_at=now() WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef]);
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET source_sha256=$3 WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef, "f".repeat(64)]);
    await assert.rejects(() => backgroundReceiver.receive(serviceCredential, fixture.canonicalJson), /media.*unavailable|unauthorized/i, "foreign media fails closed without leaking the normalized document");
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET source_sha256=$3 WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef, sourceSha256]);
    assert.ok(!fixture.canonicalJson.includes(input.storageKey), "fixture does not copy a source-storage path");
    assert.ok(!fixture.canonicalJson.includes("normalized_document"), "fixture does not copy normalized document or media bytes");
    assert.deepEqual((await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.normalized_document_cache WHERE source_sha256=$1) AS cache_rows, (SELECT count(*)::int FROM atlas.document_perception_derived_asset asset JOIN atlas.normalized_document_cache cache ON cache.cache_key=asset.cache_key WHERE cache.source_sha256=$1) AS derived_asset_links, (SELECT count(*)::int FROM atlas.document_perception_derived_manifest WHERE artifact_id=$2 AND accepted_at IS NOT NULL) AS accepted_media_manifests, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$2) AS semantic_executions, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE document_id=$2) AS semantic_results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$2) AS semantic_candidates, (SELECT count(*)::int FROM atlas.knowledge_index WHERE document_id=$2) AS knowledge_index, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$2) AS reconciliation_results", [sourceSha256, documentId]))[0], before, "fixture derivation/parser/resolver reads are side-effect free for cache, assets, semantic work, and reconciliation");
    assert.deepEqual((await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS bridge_jobs, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_admissions, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservations, (SELECT count(*)::int FROM bridge.provider_work_dispatch) AS bss_dispatches, (SELECT count(*)::int FROM bridge.provider_work_wakeup_dispatch) AS bss_wakeup_dispatches"))[0], forbiddenEffectsBefore, "background redemption has zero GHR job/dispatch and BSS admission, attempt, reservation, or dispatch effects");
    await assert.rejects(() => fixtures.derive(`lookalike-${suffix}`), /accepted.*unavailable|ambiguous/i, "a JSON-shaped identity without accepted persisted facts cannot produce a fixture");

    const reject = (label: string, body: string) => assert.throws(() => parseSemanticBatchPlanInputV1(body), /SemanticBatchPlanInput\/v1 is invalid/, label);
    reject("missing field", JSON.stringify({ ...fixture.input, sourceSha256: undefined }));
    reject("extra field", `${fixture.canonicalJson.slice(0, -1)},"extra":true}`);
    reject("duplicate field", fixture.canonicalJson.replace("\"sourceSha256\":", `"sourceSha256":"${"0".repeat(64)}",\"sourceSha256\":`));
    reject("prototype-bearing field", `${fixture.canonicalJson.slice(0, -1)},"__proto__":{}}`);
    reject("oversized body", "x".repeat(2049));
    reject("malformed hash", fixture.canonicalJson.replace(fixture.input.sourceSha256, fixture.input.sourceSha256.toUpperCase()));
    reject("malformed execution", fixture.canonicalJson.replace(executionId, ""));
    reject("wrong version", fixture.canonicalJson.replace("\"normalizedDocumentVersion\":\"v1\"", "\"normalizedDocumentVersion\":\"v2\""));
    reject("noncanonical whitespace", ` ${fixture.canonicalJson}`);
  } finally {
    await sql.unsafe("DELETE FROM atlas.normalized_document_cache WHERE source_sha256=$1", [foreignSourceSha256]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [foreignExecutionId]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [foreignProject]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.normalized_document_cache WHERE source_sha256=$1", [sourceSha256]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined);
    await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined);
    await sql.end();
    await rm(root, { recursive: true, force: true });
  }
});
