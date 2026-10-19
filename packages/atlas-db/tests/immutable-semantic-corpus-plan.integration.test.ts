import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { ImmutableSemanticCorpusPlanError, PostgresImmutableSemanticCorpusPlanRepository, canonicalImmutableSemanticCorpusPlanV1, replayImmutableSemanticCorpusPlanHashV1, type ImmutableSemanticCorpusPlanInputV1 } from "../src/immutable-semantic-corpus-plan.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

const input = (suffix: string, proposalId = `proposal-${suffix}`, predecessor?: Readonly<{ planId: string; planHash: string }>): ImmutableSemanticCorpusPlanInputV1 => ({
  scope: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}` },
  source: { sourceSha256: sha(`source-${suffix}`), normalizedDocumentRef: `cache-${suffix}`, perceptionExecutionId: `execution-${suffix}`, normalizedDocumentFingerprint: sha(`fingerprint-${suffix}`), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", media: [], rel: { state: "unavailable" } },
  proposal: {
    proposalId, proposalHash: sha(`proposal-${suffix}`), sourceHash: sha(`source-hash-${suffix}`), policyHash: sha(`policy-${suffix}`), estimatorHash: sha(`estimator-${suffix}`),
    structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 4096, maxInputTokens: 1024 },
    bssSnapshot: { source: { sourceId: "anoman-capacity-source", sourceVersion: "v1" }, enforcement: { policyId: "anoman-semantic", policyVersion: "v1" }, process: { profileId: "semantic-process", profileVersion: "v1" }, workload: { planId: "semantic-workload", planVersion: "v1", estimator: { identity: "estimator", version: "v1" } } },
    eligibleDimensions: ["rpm", "tpm", "concurrency"], requestResourceEnvelope: { requestUnits: 2, tokenUnits: 12, dayUnits: 2, concurrencyUnits: 2 },
    units: [
      { locator: { documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "text_block", localId: "one" }, classification: "eligible", demand: { requestBytes: 20, inputTokens: 6, envelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 } } },
      { locator: { documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "table", localId: "two" }, classification: "eligible", demand: { requestBytes: 20, inputTokens: 6, envelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 } } },
      { locator: { documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "visual_region", localId: "deferred" }, classification: "deferred", reason: "unlabeled_visual" },
    ],
    batches: [
      { batchId: "batch-0001", ownedLocators: [{ documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "text_block", localId: "one" }], contextOnlyLocators: [], requestBytes: 20, inputTokens: 6, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ requestBytes: 20, inputTokens: 6, outcome: "fit" }] },
      { batchId: "batch-0002", ownedLocators: [{ documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "table", localId: "two" }], contextOnlyLocators: [], requestBytes: 20, inputTokens: 6, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ requestBytes: 20, inputTokens: 6, outcome: "fit" }] },
    ],
    ...(predecessor ? { replanPredecessor: predecessor } : {}),
  },
});

async function fixture(sql: ReturnType<typeof postgres>, plan: ImmutableSemanticCorpusPlanInputV1) {
  const owner = `owner-${randomUUID()}`;
  await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
  await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'semantic plan fixture',$3)", [plan.scope.projectId, `stable-${randomUUID().slice(0, 12)}`, owner]);
  await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [plan.scope.workspaceId, plan.scope.projectId]);
  await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'plan.pdf','private/plan.pdf',$4,1,'application/pdf',$5)", [plan.scope.documentId, plan.scope.projectId, plan.scope.workspaceId, plan.source.sourceSha256, owner]);
  await sql.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity,completion_fingerprint) VALUES ($1,$2,'private/plan.pdf',$3,'application/pdf',1,'v1','completed',$4,$5,$6)", [plan.source.perceptionExecutionId, plan.scope.documentId, plan.source.sourceSha256, `fixture-${randomUUID()}`, plan.source.perceptionCapability, plan.source.normalizedDocumentFingerprint]);
  await sql.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document,derived_assets) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb,'[]'::jsonb)", [plan.source.normalizedDocumentRef, plan.source.sourceSha256, plan.source.perceptionCapability, {}]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [plan.scope.bundleId, plan.scope.projectId, plan.scope.workspaceId]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perceived',$5)", [plan.scope.bundleId, plan.scope.documentId, plan.scope.projectId, plan.scope.workspaceId, plan.source.perceptionExecutionId]);
  await sql.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [plan.scope.bundleId]);
  return owner;
}

async function cleanup(sql: ReturnType<typeof postgres>, plan: ImmutableSemanticCorpusPlanInputV1, owner: string) {
  await sql.begin(async (transaction) => {
    // Fixtures are removed by the database administrator only; product writes
    // run as atlas_app and remain subject to the append-only triggers.
    await transaction.unsafe("SET LOCAL session_replication_role = replica");
    await transaction.unsafe("DELETE FROM atlas.semantic_corpus_plan_cancellation WHERE plan_id IN (SELECT id FROM atlas.semantic_corpus_plan WHERE project_id=$1)", [plan.scope.projectId]);
    await transaction.unsafe("DELETE FROM atlas.planned_semantic_corpus_handoff WHERE plan_id IN (SELECT id FROM atlas.semantic_corpus_plan WHERE project_id=$1)", [plan.scope.projectId]);
    await transaction.unsafe("DELETE FROM atlas.semantic_corpus_plan WHERE project_id=$1", [plan.scope.projectId]);
  });
  await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [plan.scope.projectId]);
  await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
}

test("requires a complete references-only BSS provenance snapshot", () => {
  const plan = input("bounded-bss");
  assert.doesNotThrow(() => canonicalImmutableSemanticCorpusPlanV1(plan));

  const missingVersion = input("missing-bss");
  missingVersion.proposal.bssSnapshot = { source: { sourceId: "source", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "process", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: { identity: "estimator" } } } as never;
  assert.throws(() => canonicalImmutableSemanticCorpusPlanV1(missingVersion), /complete versioned references/);

  const rawPayload = input("raw-bss");
  rawPayload.proposal.bssSnapshot = { source: { sourceId: "source", sourceVersion: "v1", customerMemo: "raw customer payload" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "process", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: { identity: "estimator", version: "v1" } } } as never;
  assert.throws(() => canonicalImmutableSemanticCorpusPlanV1(rawPayload), /complete versioned references/);
});

test("atomically persists immutable plans and batch handoffs with replay, recovery, ancestry, and zero forbidden effects", { skip }, async () => {
  const sql = postgres(databaseUrl!, { max: 4 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 2 });
  const suffix = randomUUID();
  const plan = input(suffix);
  let owner = "";
  try {
    owner = await fixture(sql, plan);
    const repository = new PostgresImmutableSemanticCorpusPlanRepository(atlas as any);
    const [baseline] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS ghr_or_queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation");
    await sql.unsafe("UPDATE atlas.document_perception_execution SET contract_version='v2' WHERE id=$1", [plan.source.perceptionExecutionId]);
    await assert.rejects(() => repository.persist(plan), /foreign, stale, or no longer accepted/, "a completed execution under another perception contract cannot satisfy the frozen plan binding");
    const [rejectedCount] = await sql.unsafe("SELECT count(*)::int AS plans FROM atlas.semantic_corpus_plan WHERE project_id=$1", [plan.scope.projectId]);
    assert.equal(Number(rejectedCount!.plans), 0, "a perception-contract mismatch inserts neither a plan nor handoff");
    await sql.unsafe("UPDATE atlas.document_perception_execution SET contract_version='v1' WHERE id=$1", [plan.source.perceptionExecutionId]);
    const [first, simultaneousRetry] = await Promise.all([repository.persist(plan), repository.persist(plan)]);
    assert.deepEqual(simultaneousRetry, first, "concurrent claims collapse to one immutable plan and its complete handoff set");
    const replay = await repository.persist(plan); // lost post-commit acknowledgement/restart replay
    assert.deepEqual(replay, first, "same immutable fingerprint returns the same durable plan and handoff references");
    const [stored] = await sql.unsafe("SELECT immutable_content FROM atlas.semantic_corpus_plan WHERE id=$1", [first.planId]);
    assert.equal(replayImmutableSemanticCorpusPlanHashV1(stored!.immutable_content), first.planHash, "stored immutable content independently replays the parent hash");
    assert.equal(canonicalImmutableSemanticCorpusPlanV1(plan).planHash, first.planHash, "canonical plan encoding remains deterministic");
    const [counts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1) AS handoffs, (SELECT count(*)::int FROM pgboss.job) AS ghr_or_queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$2) AS sem, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$2) AS candidate, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$2) AS reconciliation", [first.planId, plan.scope.documentId]);
    assert.deepEqual({ plans: Number(counts.plans), handoffs: Number(counts.handoffs) }, { plans: 1, handoffs: 2 }, "one committed plan owns exactly its N handoffs");
    assert.deepEqual({ ghrOrQueue: Number(counts.ghr_or_queue), bssWork: Number(counts.bss_work), bssAttempt: Number(counts.bss_attempt), bssReservation: Number(counts.bss_reservation), sem: Number(counts.sem), candidate: Number(counts.candidate), reconciliation: Number(counts.reconciliation) }, { ghrOrQueue: Number(baseline!.ghr_or_queue), bssWork: Number(baseline!.bss_work), bssAttempt: Number(baseline!.bss_attempt), bssReservation: Number(baseline!.bss_reservation), sem: 0, candidate: 0, reconciliation: 0 }, "persistence writes no GHR, BSS, SEM, or reconciliation effect");

    await assert.rejects(() => atlas.unsafe("UPDATE atlas.semantic_corpus_plan SET proposal_id='rewritten' WHERE id=$1", [first.planId]), /immutable/, "the normal Atlas role cannot update a persisted plan");
    await assert.rejects(() => atlas.unsafe("DELETE FROM atlas.planned_semantic_corpus_handoff WHERE id=$1", [first.handoffs[0]!.handoffId]), /immutable/, "the normal Atlas role cannot delete a persisted handoff");

    await repository.cancel(first.planId, "source revision changed");
    await assert.rejects(() => atlas.unsafe("UPDATE atlas.semantic_corpus_plan_cancellation SET reason='rewritten' WHERE plan_id=$1", [first.planId]), /immutable/, "the normal Atlas role cannot update cancellation ancestry");
    await assert.rejects(() => atlas.unsafe("DELETE FROM atlas.semantic_corpus_plan_cancellation WHERE plan_id=$1", [first.planId]), /immutable/, "the normal Atlas role cannot delete cancellation ancestry");
    const revised = input(suffix, `replan-${suffix}`, { planId: first.planId, planHash: first.planHash });
    revised.proposal.proposalHash = sha(`replan-proposal-${suffix}`) as never;
    revised.proposal.policyHash = sha(`replan-policy-${suffix}`) as never;
    const next = await repository.persist(revised);
    assert.notEqual(next.planId, first.planId, "authorized replan creates a new immutable version");
    const [ancestry] = await sql.unsafe("SELECT predecessor_plan_id, predecessor_plan_hash FROM atlas.semantic_corpus_plan WHERE id=$1", [next.planId]);
    assert.deepEqual({ id: ancestry!.predecessor_plan_id, hash: ancestry!.predecessor_plan_hash }, { id: first.planId, hash: first.planHash }, "replan records its cancelled immutable predecessor");

    const conflicting = input(suffix, plan.proposal.proposalId);
    conflicting.proposal.bssSnapshot = { source: { sourceId: "anoman-capacity-source", sourceVersion: "v2" }, enforcement: { policyId: "anoman-semantic", policyVersion: "v1" }, process: { profileId: "semantic-process", profileVersion: "v1" }, workload: { planId: "semantic-workload", planVersion: "v1", estimator: { identity: "estimator", version: "v1" } } };
    await assert.rejects(() => repository.persist(conflicting), ImmutableSemanticCorpusPlanError, "same proposal identity with different immutable content rejects");
    await assert.rejects(() => repository.persist({ ...plan, scope: { ...plan.scope, projectId: `foreign-${suffix}` } }), /foreign, stale, or no longer accepted/, "a foreign scope cannot attach to the accepted source");
  } finally { try { if (owner) await cleanup(sql, plan, owner); } finally { await atlas.end(); await sql.end(); } }
});

test("rejects incomplete ownership and rolls back a crash before any partial completed plan is visible", { skip }, async () => {
  const sql = postgres(databaseUrl!, { max: 2 });
  const suffix = randomUUID(); const plan = input(suffix); let owner = "";
  try {
    owner = await fixture(sql, plan);
    const repository = new PostgresImmutableSemanticCorpusPlanRepository(sql as any);
    const invalid = input(suffix, `invalid-${suffix}`);
    invalid.proposal.batches[1]!.ownedLocators = [] as never;
    await assert.rejects(() => repository.persist(invalid), /own every eligible locator exactly once/);
    await sql.unsafe("CREATE OR REPLACE FUNCTION atlas.idser012_plan_crash() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'controlled plan crash'; END; $$");
    await sql.unsafe("CREATE TRIGGER idser012_plan_crash BEFORE INSERT ON atlas.planned_semantic_corpus_handoff FOR EACH ROW EXECUTE FUNCTION atlas.idser012_plan_crash()");
    await assert.rejects(() => repository.persist(plan), /controlled plan crash/);
    await sql.unsafe("DROP TRIGGER idser012_plan_crash ON atlas.planned_semantic_corpus_handoff"); await sql.unsafe("DROP FUNCTION atlas.idser012_plan_crash()");
    const [counts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE project_id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff handoff JOIN atlas.semantic_corpus_plan plan ON plan.id=handoff.plan_id WHERE plan.project_id=$1) AS handoffs", [plan.scope.projectId]);
    assert.deepEqual({ plans: Number(counts.plans), handoffs: Number(counts.handoffs) }, { plans: 0, handoffs: 0 }, "crash rolls back the parent and every child handoff");
  } finally { try { await sql.unsafe("DROP TRIGGER IF EXISTS idser012_plan_crash ON atlas.planned_semantic_corpus_handoff"); await sql.unsafe("DROP FUNCTION IF EXISTS atlas.idser012_plan_crash()"); if (owner) await cleanup(sql, plan, owner); } finally { await sql.end(); } }
});
