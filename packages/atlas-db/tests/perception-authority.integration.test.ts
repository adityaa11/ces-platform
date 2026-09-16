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
  const sourceSha256 = createHash("sha256").update(executionId).digest("hex");
  const issuer = new PerceptionSourceGrantIssuer("s".repeat(32));
  const authority = new PostgresPerceptionAuthority(atlas, issuer);
  const input = { executionId, artifactId, storageKey: `private/${executionId}`, sourceSha256, mimeType: "application/pdf" as const, byteSize: 16, idempotencyKey: `idempotency-${randomUUID()}`, capabilityIdentity: "mistral-ocr:test-config" };
  try {
    const request = await authority.create(input);
    const [record] = await atlas.unsafe("SELECT state, document_storage_key FROM atlas.document_perception_execution WHERE id=$1", [executionId]);
    assert.equal(record.state, "queued");
    assert.equal(record.document_storage_key, input.storageKey);
    const redeemed = await authority.redeem(request);
    assert.equal(redeemed.storageKey, input.storageKey);
    const restarted = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("s".repeat(32)));
    assert.equal((await restarted.redeem(request)).storageKey, input.storageKey);
    assert.deepEqual(await restarted.create(input), request);
    await assert.rejects(() => restarted.create({ ...input, byteSize: input.byteSize + 1 }), /conflicts/);
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [executionId]))[0].state, "fetching_source");
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
    const racingAuthority = new PostgresPerceptionAuthority(atlasSecond, new PerceptionSourceGrantIssuer("s".repeat(32)));
    const race = await Promise.allSettled([authority.deliver(raceRequest, raceResult), racingAuthority.deliver(raceRequest, { ...raceResult, provider: { ...raceResult.provider, processedAt: "2026-09-16T00:02:00.000Z" } })]);
    assert.equal(race.filter((attempt) => attempt.status === "fulfilled").length, 1);
    assert.equal(race.filter((attempt) => attempt.status === "rejected").length, 1);
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [raceExecutionId]))[0].state, "completed");
    await atlas.unsafe("UPDATE atlas.document_perception_source_grant SET expires_at = now() - interval '1 second' WHERE execution_id=$1", [executionId]);
    await assert.rejects(() => authority.redeem(request), /stale or unauthorized/);
    await assert.rejects(() => authority.deliver(request, result), /stale or unauthorized/);
    await assert.rejects(() => bridge.unsafe("INSERT INTO atlas.document_perception_execution (id, artifact_id, document_storage_key, source_sha256, mime_type, byte_size, contract_version, state, idempotency_key, capability_identity) VALUES ($1,$2,$3,$4,'application/pdf',1,'v1','queued',$5,'test')", [`bridge-${randomUUID()}`, artifactId, "private/nope", sourceSha256, `bridge-${randomUUID()}`]), /permission denied/i);
  } finally {
    await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1 OR id=$2", [executionId, raceExecutionId ?? ""]);
    await Promise.all([admin.end(), atlas.end(), atlasSecond.end(), bridge.end()]);
  }
});
