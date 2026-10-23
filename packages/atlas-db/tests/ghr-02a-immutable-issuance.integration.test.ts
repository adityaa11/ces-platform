import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PostgresGenericHandoffIssuer, type TrustedAcceptedNdv1Facts } from "../src/generic-handoff-issuer.ts";
import { canonicalSemanticBatchPlanInputV1 } from "../src/semantic-batch-plan-input.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

test("GHR-02A issues only the frozen immutable false-only handoff and exposes a known-id read seam", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const issuer = new PostgresGenericHandoffIssuer();
  const suffix = randomUUID();
  const facts = (overrides: Partial<TrustedAcceptedNdv1Facts> = {}): TrustedAcceptedNdv1Facts => ({
    producer: { processKey: "perception.acceptance", event: "NormalizedDocumentAccepted/v1", executionId: `ghr-execution-${suffix}` },
    scope: { projectId: `ghr-project-${suffix}`, workspaceId: `ghr-workspace-${suffix}`, bundleId: `ghr-bundle-${suffix}`, documentId: `ghr-document-${suffix}` },
    payload: { normalizedDocumentRef: hash(`cache-${suffix}`), perceptionExecutionId: `ghr-execution-${suffix}`, sourceSha256: hash(`source-${suffix}`), normalizedDocumentVersion: "v1", normalizedDocumentFingerprint: hash(`fingerprint-${suffix}`) },
    idempotencyKey: `ghr-idempotency-${suffix}`,
    handoffId: `ghr-handoff-${suffix}`,
    workflowId: `ghr-workflow-${suffix}`,
    issuedAt: "2026-10-24T00:00:00.000Z",
    ...overrides,
  });
  try {
    const issued = await atlas.begin((transaction) => issuer.issue(transaction, facts()));
    const expectedPayload = canonicalSemanticBatchPlanInputV1(facts().payload);
    const expectedBody = `{"can_continue":false,"payload":${expectedPayload}}`;
    assert.equal(Buffer.from(issued.bodyBytes).toString("utf8"), expectedBody, "false wrapper order and canonical five-field payload are exact");
    assert.equal(issued.bodySha256, hash(expectedBody), "hash covers the exact persisted wrapper bytes");
    assert.equal(issued.header.route.branch, "batch-plan");
    assert.equal(issued.header.bodyContract.type, "SemanticBatchPlanInput");
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.generic_handoff_intent WHERE handoff_id=$1", [issued.handoffId]))[0]!.count, 1);

    const replay = await atlas.begin((transaction) => issuer.issue(transaction, facts({ handoffId: `ignored-replay-${suffix}` })));
    assert.equal(replay.handoffId, issued.handoffId, "same logical issuance returns the original immutable handoff");
    await assert.rejects(() => atlas.begin((transaction) => issuer.issue(transaction, facts({ payload: { ...facts().payload, sourceSha256: "f".repeat(64) } }))), /idempotency.*conflicts/i);
    await assert.rejects(() => atlas.begin((transaction) => issuer.issue(transaction, facts({ producer: { processKey: "forged" as "perception.acceptance", event: "NormalizedDocumentAccepted/v1", executionId: facts().producer.executionId } }))), /producer facts/i);
    await assert.rejects(() => atlas.begin((transaction) => issuer.issue(transaction, facts({ idempotencyKey: `mismatched-execution-${suffix}`, handoffId: `mismatched-execution-handoff-${suffix}`, payload: { ...facts().payload, perceptionExecutionId: `other-execution-${suffix}` } }))), /execution facts/i);
    await admin.unsafe("UPDATE atlas.generic_handoff_route_policy SET enabled=false WHERE policy_version='v1' AND producer_process_key='perception.acceptance'");
    await assert.rejects(() => atlas.begin((transaction) => issuer.issue(transaction, facts({ idempotencyKey: `disabled-${suffix}`, handoffId: `disabled-handoff-${suffix}` }))), /disabled, revoked, or unavailable/i);
    await admin.unsafe("UPDATE atlas.generic_handoff_route_policy SET enabled=true WHERE policy_version='v1' AND producer_process_key='perception.acceptance'");

    const dispatched = await bridge.unsafe("SELECT * FROM atlas.read_generic_handoff_dispatch_v1($1)", [issued.handoffId]);
    assert.equal(dispatched.length, 1, "Bridge can read exactly the requested known handoff through the narrow function");
    assert.equal(Buffer.from(dispatched[0]!.body_bytes as Uint8Array).toString("utf8"), expectedBody);
    await assert.rejects(() => bridge.unsafe("SELECT * FROM atlas.generic_handoff_intent"), /permission denied/i);
    await assert.rejects(() => bridge.unsafe("INSERT INTO atlas.generic_handoff_intent (handoff_id,idempotency_key,producer_execution_id,project_id,workspace_id,bundle_id,document_id,policy_version,handler_version,body_contract_type,body_contract_version,route_main,route_branch,can_continue,body_encoding,body_bytes,body_sha256,trusted_header,issued_at) VALUES ('forged','forged','x','x','x','x','x','v1','v1','SemanticBatchPlanInput','v1','semantic','batch-plan',false,'canonical-json-v1','x',$1,'{}',now())", ["0".repeat(64)]), /permission denied/i);
    await assert.rejects(() => atlas.unsafe("UPDATE atlas.generic_handoff_intent SET body_sha256=$2 WHERE handoff_id=$1", [issued.handoffId, "f".repeat(64)]), /immutable/i);
    assert.equal((await admin.unsafe("SELECT to_regclass('bridge.generic_handoff_delivery') AS delivery, (SELECT count(*)::int FROM pgboss.job WHERE name='atlas-generic-handoff-v1') AS jobs"))[0]!.delivery, null, "this issuance seam creates neither Bridge delivery state nor queue work");
    assert.equal((await admin.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job WHERE name='atlas-generic-handoff-v1') AS jobs"))[0]!.jobs, 0, "issuer activation has no pg-boss job representation");
  } finally {
    await admin.unsafe("DELETE FROM atlas.generic_handoff_intent WHERE idempotency_key=$1", [facts().idempotencyKey]).catch(() => undefined);
    await Promise.all([admin.end(), atlas.end(), bridge.end()]);
  }
});
