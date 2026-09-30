import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("Atlas owns perception execution, completion replay, cache invalidation, and Bridge denial", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const atlasSecond = postgres(atlasUrl.toString(), { max: 1 });
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const executionId = `perception-${randomUUID()}`;
  let raceExecutionId: string | undefined;
  const artifactId = `artifact-${randomUUID()}`;
  const owner = `perception-authority-owner-${randomUUID()}`;
  const project = `perception-authority-project-${randomUUID()}`;
  const workspace = `perception-authority-workspace-${randomUUID()}`;
  const bundle = `perception-authority-bundle-${randomUUID()}`;
  const controlExecutionId = `perception-authority-control-${randomUUID()}`;
  const controlArtifactId = `artifact-control-${randomUUID()}`;
  const controlBundle = `perception-authority-control-bundle-${randomUUID()}`;
  const sourceSha256 = createHash("sha256").update(executionId).digest("hex");
  const issuer = new PerceptionSourceGrantIssuer("s".repeat(32));
  const semanticQueue = { enqueue: async () => randomUUID() };
  const authority = new PostgresPerceptionAuthority(atlas, issuer, semanticQueue);
  const input = { executionId, artifactId, storageKey: `private/${executionId}`, sourceSha256, mimeType: "application/pdf" as const, byteSize: 16, idempotencyKey: `idempotency-${randomUUID()}`, capabilityIdentity: "mistral-ocr:test-config" };
  try {
    const request = await authority.create(input);
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'perception authority',$3)", [project, `perception-authority-${randomUUID().slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf',$4,$5,$6,'application/pdf',$7)", [artifactId, project, workspace, input.storageKey, sourceSha256, input.byteSize, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [bundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundle, artifactId, project, workspace, executionId]);
    const controlInput = { ...input, executionId: controlExecutionId, artifactId: controlArtifactId, storageKey: `private/${controlExecutionId}`, sourceSha256: createHash("sha256").update(controlExecutionId).digest("hex"), idempotencyKey: `idempotency-${randomUUID()}` };
    const controlRequest = await authority.create(controlInput);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'control.pdf',$4,$5,$6,'application/pdf',$7)", [controlArtifactId, project, workspace, controlInput.storageKey, controlInput.sourceSha256, controlInput.byteSize, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [controlBundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [controlBundle, controlArtifactId, project, workspace, controlExecutionId]);
    const snapshot = async () => ({
      execution: (await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [executionId]))[0],
      target: (await atlas.unsafe("SELECT b.state AS bundle_state,b.started_at,b.completed_document_count,m.state AS member_state,m.started_at AS member_started_at FROM atlas.extraction_bundle b JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id WHERE b.id=$1 AND m.document_id=$2", [bundle, artifactId]))[0],
      control: (await atlas.unsafe("SELECT b.state AS bundle_state,b.started_at,b.completed_document_count,m.state AS member_state,m.started_at AS member_started_at FROM atlas.extraction_bundle b JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id WHERE b.id=$1 AND m.document_id=$2", [controlBundle, controlArtifactId]))[0],
    });
    const rejectWithoutMutation = async (label: string, candidate: typeof request) => {
      const before = await snapshot();
      await assert.rejects(() => authority.redeem(candidate), /stale or unauthorized|invalid/i, label);
      assert.deepEqual(await snapshot(), before, `${label} leaves the target and unrelated lifecycle rows unchanged`);
    };
    const invalidRedemptionMatrix: ReadonlyArray<{ readonly label: string; readonly candidate: typeof request }> = [
      { label: "forged grant", candidate: { ...request, source: { grant: `${request.source.grant.slice(0, -1)}x` } } },
      { label: "wrong execution", candidate: { ...request, executionId: `wrong-${executionId}` } },
      { label: "grant bound to a different execution/document scope", candidate: { ...controlRequest, source: request.source } },
      { label: "wrong document", candidate: { ...request, artifact: { ...request.artifact, id: controlArtifactId } } },
      { label: "source hash mismatch", candidate: { ...request, artifact: { ...request.artifact, sourceSha256: "b".repeat(64) } } },
      { label: "byte-size mismatch", candidate: { ...request, artifact: { ...request.artifact, byteSize: request.artifact.byteSize + 1 } } },
    ];
    for (const { label, candidate } of invalidRedemptionMatrix) await rejectWithoutMutation(label, candidate);
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='cancelled' WHERE id=$1", [controlExecutionId]);
    const terminalExecution = await snapshot();
    await assert.rejects(() => authority.redeem(controlRequest), /stale or unauthorized/, "terminal execution is rejected");
    assert.deepEqual(await snapshot(), terminalExecution, "terminal execution cannot mutate either lifecycle pair");
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='queued' WHERE id=$1", [controlExecutionId]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle SET state='needs_attention' WHERE id=$1", [controlBundle]);
    const terminalBundle = await snapshot();
    await assert.rejects(() => authority.redeem(controlRequest), /stale or unauthorized/, "terminal bundle is rejected");
    assert.deepEqual(await snapshot(), terminalBundle, "terminal bundle cannot mutate either lifecycle pair");
    await atlas.unsafe("UPDATE atlas.extraction_bundle SET state='waiting' WHERE id=$1", [controlBundle]);
    await admin.unsafe("UPDATE atlas.document_perception_source_grant SET expires_at=now()-interval '1 second' WHERE execution_id=$1", [controlExecutionId]);
    const expiredGrant = await snapshot();
    await assert.rejects(() => authority.redeem(controlRequest), /stale or unauthorized/, "expired persisted grant is rejected");
    assert.deepEqual(await snapshot(), expiredGrant, "expired grant cannot mutate either lifecycle pair");
    await admin.unsafe("DELETE FROM atlas.document_perception_source_grant WHERE execution_id=$1", [controlExecutionId]);
    const missingGrant = await snapshot();
    await assert.rejects(() => authority.redeem(controlRequest), /stale or unauthorized/, "missing persisted grant is rejected");
    assert.deepEqual(await snapshot(), missingGrant, "missing grant cannot mutate either lifecycle pair");
    const [record] = await atlas.unsafe("SELECT state, document_storage_key FROM atlas.document_perception_execution WHERE id=$1", [executionId]);
    assert.equal(record.state, "queued");
    assert.equal(record.document_storage_key, input.storageKey);
    const beforeActivation = await snapshot();
    const redeemed = await authority.redeem(request);
    assert.equal(redeemed.storageKey, input.storageKey);
    const afterActivation = await snapshot();
    assert.deepEqual(beforeActivation.target, { bundle_state: "waiting", started_at: null, completed_document_count: 0, member_state: "perception_queued", member_started_at: null });
    assert.equal(afterActivation.target.bundle_state, "processing"); assert.equal(afterActivation.target.member_state, "perceiving"); assert.equal(afterActivation.target.completed_document_count, 0); assert.ok(afterActivation.target.started_at); assert.ok(afterActivation.target.member_started_at);
    assert.deepEqual(afterActivation.control, beforeActivation.control, "first redemption activates only its bound bundle/member");
    const activationTimestamps = { started_at: afterActivation.target.started_at, member_started_at: afterActivation.target.member_started_at };
    const restarted = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("s".repeat(32)), semanticQueue);
    assert.equal((await restarted.redeem(request)).storageKey, input.storageKey);
    assert.deepEqual(await snapshot(), afterActivation, "duplicate valid redemption is idempotent and does not reset timestamps or controls");
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='extracting' WHERE bundle_id=$1 AND document_id=$2", [bundle, artifactId]);
    const progressed = await snapshot();
    assert.equal((await restarted.redeem(request)).storageKey, input.storageKey);
    assert.deepEqual(await snapshot(), progressed, "valid replay after member progress cannot regress lifecycle state or timestamps");
    assert.deepEqual({ started_at: progressed.target.started_at, member_started_at: progressed.target.member_started_at }, activationTimestamps);
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='needs_attention' WHERE bundle_id=$1 AND document_id=$2", [bundle, artifactId]);
    await rejectWithoutMutation("terminal member", request);
    assert.deepEqual(await restarted.create(input), request);
    await assert.rejects(() => restarted.create({ ...input, byteSize: input.byteSize + 1 }), /conflicts/);
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [executionId]))[0].state, "fetching_source");
    const unboundExecutionId = `perception-unbound-${randomUUID()}`;
    const unboundArtifactId = `artifact-unbound-${randomUUID()}`;
    const unboundInput = { ...input, executionId: unboundExecutionId, artifactId: unboundArtifactId, idempotencyKey: `idempotency-${randomUUID()}` };
    const unboundRequest = await authority.create(unboundInput);
    const beforeUnbound = { execution: await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [unboundExecutionId]), lifecycle: await snapshot() };
    await assert.rejects(() => authority.redeem(unboundRequest), /stale or unauthorized/, "a valid grant without its exact D1 member is rejected before protected-source release");
    assert.deepEqual({ execution: await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [unboundExecutionId]), lifecycle: await snapshot() }, beforeUnbound, "rejected unbound redemption leaves its execution, target, and unrelated lifecycle unchanged");
    const result = { version: "v1" as const, executionId, artifactId, sourceSha256, perception: request.perception, provider: { name: "test", processor: "test", executionId, processedAt: "2026-09-16T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [{ id: "visual-1", assetRef: "derived/visual-1" }] }] };
    await assert.rejects(() => authority.deliver({ ...request, source: { grant: `${request.source.grant.slice(0, -1)}x` } }, result), /invalid/);
    await authority.deliver(request, result);
    await authority.deliver(request, result);
    await assert.rejects(() => authority.deliver(request, { ...result, provider: { ...result.provider, processedAt: "2026-09-16T00:01:00.000Z" } }), /conflicts/);
    assert.deepEqual(await authority.getCached({ sourceSha256, perception: request.perception, capabilityIdentity: input.capabilityIdentity }), result);
    await authority.invalidateCache({ sourceSha256, perception: request.perception, capabilityIdentity: input.capabilityIdentity });
    assert.equal(await authority.getCached({ sourceSha256, perception: request.perception, capabilityIdentity: input.capabilityIdentity }), undefined);
    raceExecutionId = `perception-${randomUUID()}`;
    const raceArtifactId = `artifact-${randomUUID()}`;
    const raceSha256 = createHash("sha256").update(raceExecutionId).digest("hex");
    const raceInput = { ...input, executionId: raceExecutionId, artifactId: raceArtifactId, sourceSha256: raceSha256, storageKey: `private/${raceExecutionId}`, idempotencyKey: `idempotency-${randomUUID()}` };
    const raceRequest = await authority.create(raceInput);
    const raceResult = { ...result, executionId: raceExecutionId, artifactId: raceArtifactId, sourceSha256: raceSha256, perception: raceRequest.perception, provider: { ...result.provider, executionId: raceExecutionId } };
    const racingAuthority = new PostgresPerceptionAuthority(atlasSecond, new PerceptionSourceGrantIssuer("s".repeat(32)), semanticQueue);
    const race = await Promise.allSettled([authority.deliver(raceRequest, raceResult), racingAuthority.deliver(raceRequest, { ...raceResult, provider: { ...raceResult.provider, processedAt: "2026-09-16T00:02:00.000Z" } })]);
    assert.equal(race.filter((attempt) => attempt.status === "fulfilled").length, 1);
    assert.equal(race.filter((attempt) => attempt.status === "rejected").length, 1);
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [raceExecutionId]))[0].state, "completed");
    await atlas.unsafe("UPDATE atlas.document_perception_source_grant SET expires_at = now() - interval '1 second' WHERE execution_id=$1", [executionId]);
    await assert.rejects(() => authority.redeem(request), /stale or unauthorized/);
    await assert.rejects(() => authority.deliver(request, result), /stale or unauthorized/);
    await assert.rejects(() => bridge.unsafe("INSERT INTO atlas.document_perception_execution (id, artifact_id, document_storage_key, source_sha256, mime_type, byte_size, contract_version, state, idempotency_key, capability_identity) VALUES ($1,$2,$3,$4,'application/pdf',1,'v1','queued',$5,'test')", [`bridge-${randomUUID()}`, artifactId, "private/nope", sourceSha256, `bridge-${randomUUID()}`]), /permission denied/i);
  } finally {
    await atlas.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1", [bundle]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1", [bundle]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1", [controlBundle]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1", [controlBundle]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.document WHERE id=$1", [artifactId]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.document WHERE id=$1", [controlArtifactId]).catch(() => undefined);
    await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1 OR id=$2", [executionId, raceExecutionId ?? ""]);
    await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id LIKE 'perception-unbound-%'").catch(() => undefined);
    await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [controlExecutionId]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [workspace]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined);
    await Promise.all([admin.end(), atlas.end(), atlasSecond.end(), bridge.end()]);
  }
});
