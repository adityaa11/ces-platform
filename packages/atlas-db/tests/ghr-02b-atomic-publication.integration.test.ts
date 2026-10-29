import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PgBoss } from "pg-boss";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { canonicalSemanticBatchPlanInputV1 } from "../src/semantic-batch-plan-input.ts";
import { createTransactionalGenericHandoffQueueProducer, genericHandoffQueue } from "../../../apps/agents-bridge/src/queue.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

type GenericPublisher = Awaited<ReturnType<typeof createTransactionalGenericHandoffQueueProducer>>;

async function stagedFixture(sql: ReturnType<typeof postgres>, authority: PostgresPerceptionAuthority, suffix: string) {
  const owner = `ghr-02b-owner-${suffix}`;
  const project = `ghr-02b-project-${suffix}`;
  const workspace = `ghr-02b-workspace-${suffix}`;
  const bundle = `ghr-02b-bundle-${suffix}`;
  const documentId = `ghr-02b-document-${suffix}`;
  const executionId = `ghr-02b-execution-${suffix}`;
  const sourceSha256 = hash(`ghr-02b-source-${suffix}`);
  const input = { executionId, artifactId: documentId, storageKey: `private/${suffix}.pdf`, sourceSha256, mimeType: "application/pdf" as const, byteSize: 64, idempotencyKey: `ghr-02b-perception-${suffix}`, capabilityIdentity: "ghr-02b-test-capability-v1" };
  const request = await authority.create(input);
  await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
  await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'GHR-02B qualification',$3)", [project, `ghr-02b-${suffix.slice(0, 12)}`, owner]);
  await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [project, owner]);
  await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
  await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'accepted.pdf',$4,$5,$6,'application/pdf',$7)", [documentId, project, workspace, input.storageKey, sourceSha256, input.byteSize, owner]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [bundle, project, workspace]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundle, documentId, project, workspace, executionId]);
  await authority.redeem(request);
  const result = { version: "v1" as const, executionId, artifactId: documentId, sourceSha256, perception: request.perception, provider: { name: "ghr-02b", processor: "qualification", executionId, processedAt: "2026-10-24T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] };
  return { bundle, documentId, executionId, project, request, result, sourceSha256, workspace };
}

test("GHR-02B atomically publishes exactly one pointer-only handoff from accepted staged perception", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const bridgeBoss = new PgBoss({ connectionString: bridgeUrl.toString(), schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false });
  let publisher: GenericPublisher | undefined;
  try {
    await bridgeBoss.start();
    await bridgeBoss.createQueue(genericHandoffQueue);
    publisher = await createTransactionalGenericHandoffQueueProducer(atlasUrl.toString());
    const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("g".repeat(32)), undefined, undefined, undefined, undefined, publisher);
    const fixture = await stagedFixture(atlas, authority, randomUUID());
    await authority.deliver(fixture.request, fixture.result);

    const [accepted] = await atlas.unsafe("SELECT execution.state AS execution_state, execution.completion_fingerprint, member.state AS member_state FROM atlas.document_perception_execution execution JOIN atlas.extraction_bundle_document member ON member.perception_execution_id=execution.id WHERE execution.id=$1", [fixture.executionId]);
    const [intent] = await atlas.unsafe("SELECT handoff_id,idempotency_key,trusted_header,body_bytes,body_sha256 FROM atlas.generic_handoff_intent WHERE producer_execution_id=$1", [fixture.executionId]);
    const [job] = await admin.unsafe("SELECT data,singleton_key FROM pgboss.job WHERE name=$1 AND data->>'handoffId'=$2", [genericHandoffQueue, intent!.handoff_id]);
    assert.deepEqual({ execution: accepted!.execution_state, member: accepted!.member_state }, { execution: "completed", member: "perceived" }, "normal acceptance reaches its durable staged terminal facts");
    assert.ok(intent, "the accepted execution creates one immutable GHR intent");
    assert.deepEqual(typeof job!.data === "string" ? JSON.parse(job!.data) : job!.data, { type: "GenericHandoffJob/v1", handoffId: intent!.handoff_id }, "the queue job carries only its generic type and handoff pointer");
    assert.equal(job!.singleton_key, intent!.idempotency_key, "the queue singleton identity is the immutable logical issuance identity");
    const header = typeof intent!.trusted_header === "string" ? JSON.parse(intent!.trusted_header) : intent!.trusted_header as Record<string, unknown>;
    const payload = { normalizedDocumentRef: (await atlas.unsafe("SELECT cache_key FROM atlas.normalized_document_cache WHERE source_sha256=$1 AND invalidated_at IS NULL", [fixture.sourceSha256]))[0]!.cache_key, perceptionExecutionId: fixture.executionId, sourceSha256: fixture.sourceSha256, normalizedDocumentVersion: "v1" as const, normalizedDocumentFingerprint: accepted!.completion_fingerprint };
    const body = `{"can_continue":false,"payload":${canonicalSemanticBatchPlanInputV1(payload)}}`;
    assert.equal(Buffer.from(intent!.body_bytes as Uint8Array).toString("utf8"), body, "issued bytes are the sole canonical false-only wrapper");
    assert.equal(intent!.body_sha256, hash(body), "stored hash covers the complete immutable wrapper");
    assert.deepEqual((header as { producer: unknown; route: unknown; scope: unknown }).producer, { processKey: "perception.acceptance", executionId: fixture.executionId });
    assert.deepEqual((header as { producer: unknown; route: unknown; scope: unknown }).route, { main: "semantic", branch: "batch-plan", policyVersion: "v1", handlerVersion: "v1" });
    assert.deepEqual((header as { producer: unknown; route: unknown; scope: unknown }).scope, { projectId: fixture.project, workspaceId: fixture.workspace, bundleId: fixture.bundle, documentId: fixture.documentId });
    assert.deepEqual((await admin.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS semantic, to_regclass('bridge.generic_handoff_delivery') AS delivery", [fixture.documentId]))[0], { semantic: 0, delivery: null }, "publication creates no receiver or delivery state");

    const restarted = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("g".repeat(32)), undefined, undefined, undefined, undefined, publisher);
    await restarted.deliver(fixture.request, fixture.result);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.generic_handoff_intent WHERE producer_execution_id=$1", [fixture.executionId]))[0]!.count, 1, "completed replay preserves one immutable intent");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$1 AND data->>'handoffId'=$2", [genericHandoffQueue, intent!.handoff_id]))[0]!.count, 1, "completed replay preserves one singleton pointer job");

    const failingPublisher = { enqueue: async (transaction: Parameters<GenericPublisher["enqueue"]>[0], job: Parameters<GenericPublisher["enqueue"]>[1]) => { await publisher!.enqueue(transaction, job); throw new Error("injected GHR-02B publication failure"); } };
    const failingAuthority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("g".repeat(32)), undefined, undefined, undefined, undefined, failingPublisher);
    const rollback = await stagedFixture(atlas, failingAuthority, randomUUID());
    await assert.rejects(() => failingAuthority.deliver(rollback.request, rollback.result), /injected GHR-02B publication failure/);
    assert.deepEqual((await atlas.unsafe("SELECT (SELECT state FROM atlas.document_perception_execution WHERE id=$1) AS execution_state, (SELECT state FROM atlas.extraction_bundle_document WHERE perception_execution_id=$1) AS member_state, (SELECT count(*)::int FROM atlas.generic_handoff_intent WHERE producer_execution_id=$1) AS intents", [rollback.executionId]))[0], { execution_state: "fetching_source", member_state: "perceiving", intents: 0 }, "a publication failure rolls acceptance lifecycle changes and intent back together");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$1 AND data->>'handoffId' LIKE 'ghr-handoff-v1-%' AND data->>'handoffId' NOT IN (SELECT handoff_id FROM atlas.generic_handoff_intent)", [genericHandoffQueue]))[0]!.count, 0, "no queued handoff can reference rolled-back issuance truth");
  } finally {
    await publisher?.close().catch(() => undefined);
    await bridgeBoss.stop({ graceful: false }).catch(() => undefined);
    await Promise.all([admin.end(), atlas.end()]);
  }
});
