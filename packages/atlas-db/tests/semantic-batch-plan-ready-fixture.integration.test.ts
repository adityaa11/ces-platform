import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import test from "node:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import postgres from "postgres";
import { createInternalReceivingBoundary, PerceptionSourceGrantIssuer } from "@atlas/core";
import { LocalFilesystemDocumentStore } from "@atlas/document-store";
import { createCapacityPlanningSnapshotReader } from "../../../apps/agents-bridge/src/capacity-planning-snapshot.ts";
import { createIdserProspectiveCapacitySnapshotConsumer } from "../../../apps/agents-bridge/src/idser-prospective-capacity-snapshot.ts";
import { proposeStructuralFitCorpusPartition } from "../../../apps/agents-bridge/src/idser-structural-fit-corpus-partition.ts";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { PostgresAcceptedSemanticBatchPlanDocumentResolver, PostgresAcceptedSemanticBatchPlanInputFixtureRepository, parseSemanticBatchPlanInputV1 } from "../src/semantic-batch-plan-input.ts";
import { PostgresImmutableSemanticCorpusPlanRepository, type ImmutableSemanticCorpusPlanInputV1 } from "../src/immutable-semantic-corpus-plan.ts";
import { PostgresSemanticBatchPlanReadyFixtureReceiver, SemanticBatchPlanReadyFixtureError, SemanticBatchPlanReadyManifestRequiredError, fixtureSemanticBatchPlanReadyV1 } from "../src/semantic-batch-plan-ready-fixture.ts";

const databaseUrl = process.env.DATABASE_URL;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

test("NO_ELIGIBLE_SOURCE cannot produce an empty SemanticBatchPlanReady body", () => {
  assert.throws(
    () => fixtureSemanticBatchPlanReadyV1({ planId: "semantic-plan-empty", planHash: "a".repeat(64), handoffs: [] }),
    SemanticBatchPlanReadyFixtureError,
  );
});

function planInput(suffix: string): ImmutableSemanticCorpusPlanInputV1 {
  const documentId = `ready-document-${suffix}`;
  return {
    scope: { projectId: `ready-project-${suffix}`, workspaceId: `ready-workspace-${suffix}`, bundleId: `ready-bundle-${suffix}`, documentId },
    source: { sourceSha256: digest(`source-${suffix}`), normalizedDocumentRef: `ready-cache-${suffix}`, perceptionExecutionId: `ready-execution-${suffix}`, normalizedDocumentFingerprint: digest(`fingerprint-${suffix}`), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", media: [], rel: { state: "unavailable" } },
    proposal: {
      proposalId: `ready-proposal-${suffix}`, proposalHash: digest(`proposal-${suffix}`), sourceHash: digest(`source-hash-${suffix}`), policyHash: digest(`policy-${suffix}`), estimatorHash: digest(`estimator-${suffix}`),
      structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 4096, maxInputTokens: 1024 },
      bssSnapshot: { source: { sourceId: "anoman-source", sourceVersion: "v1" }, enforcement: { policyId: "anoman-policy", policyVersion: "v1" }, process: { profileId: "semantic-process", profileVersion: "v1" }, workload: { planId: "semantic-workload", planVersion: "v1", estimator: { identity: "estimator", version: "v1" } } },
      eligibleDimensions: ["rpm", "tpm", "concurrency"], requestResourceEnvelope: { requestUnits: 2, tokenUnits: 12, dayUnits: 2, concurrencyUnits: 2 },
      units: [
        { locator: { documentId, pageNumber: 1, sourceKind: "text_block", localId: "one" }, classification: "eligible", demand: { requestBytes: 20, inputTokens: 6, envelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 } } },
        { locator: { documentId, pageNumber: 1, sourceKind: "table", localId: "two" }, classification: "eligible", demand: { requestBytes: 20, inputTokens: 6, envelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 } } },
      ],
      batches: [
        { batchId: "batch-0001", ownedLocators: [{ documentId, pageNumber: 1, sourceKind: "text_block", localId: "one" }], contextOnlyLocators: [], requestBytes: 20, inputTokens: 6, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ requestBytes: 20, inputTokens: 6, outcome: "fit" }] },
        { batchId: "batch-0002", ownedLocators: [{ documentId, pageNumber: 1, sourceKind: "table", localId: "two" }], contextOnlyLocators: [], requestBytes: 20, inputTokens: 6, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ requestBytes: 20, inputTokens: 6, outcome: "fit" }] },
      ],
    },
  };
}

async function fixture(sql: ReturnType<typeof postgres>, plan: ImmutableSemanticCorpusPlanInputV1) {
  const owner = `ready-owner-${randomUUID()}`;
  await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
  await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'ready fixture',$3)", [plan.scope.projectId, `ready-${randomUUID().slice(0, 12)}`, owner]);
  await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [plan.scope.workspaceId, plan.scope.projectId]);
  await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'ready.pdf','private/ready.pdf',$4,1,'application/pdf',$5)", [plan.scope.documentId, plan.scope.projectId, plan.scope.workspaceId, plan.source.sourceSha256, owner]);
  await sql.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity,completion_fingerprint) VALUES ($1,$2,'private/ready.pdf',$3,'application/pdf',1,'v1','completed',$4,$5,$6)", [plan.source.perceptionExecutionId, plan.scope.documentId, plan.source.sourceSha256, `ready-${randomUUID()}`, plan.source.perceptionCapability, plan.source.normalizedDocumentFingerprint]);
  await sql.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document,derived_assets) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb,'[]'::jsonb)", [plan.source.normalizedDocumentRef, plan.source.sourceSha256, plan.source.perceptionCapability, {}]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [plan.scope.bundleId, plan.scope.projectId, plan.scope.workspaceId]);
  await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perceived',$5)", [plan.scope.bundleId, plan.scope.documentId, plan.scope.projectId, plan.scope.workspaceId, plan.source.perceptionExecutionId]);
  await sql.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [plan.scope.bundleId]);
  return owner;
}

async function cleanup(sql: ReturnType<typeof postgres>, plan: ImmutableSemanticCorpusPlanInputV1, owner: string) {
  await sql.begin(async (transaction) => {
    await transaction.unsafe("SET LOCAL session_replication_role = replica");
    await transaction.unsafe("DELETE FROM atlas.planned_semantic_corpus_handoff WHERE plan_id IN (SELECT id FROM atlas.semantic_corpus_plan WHERE project_id=$1)", [plan.scope.projectId]);
    await transaction.unsafe("DELETE FROM atlas.semantic_corpus_plan WHERE project_id=$1", [plan.scope.projectId]);
  });
  await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [plan.scope.projectId]);
  await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
}

async function downstreamCounts(sql: ReturnType<typeof postgres>, documentId: string) {
  const [counts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS jobs, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS admissions, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations, (SELECT count(*)::int FROM bridge.provider_work_dispatch) AS dispatches, (SELECT count(*)::int FROM bridge.provider_transport_claim) AS transport_claims, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS semantic_execution, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidates, (SELECT count(*)::int FROM atlas.semantic_evidence WHERE document_id=$1) AS evidence, (SELECT count(*)::int FROM atlas.knowledge_index WHERE document_id=$1) AS knowledge_index, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [documentId]);
  return counts;
}

test("strict non-delivering SemanticBatchPlanReady fixture validates real immutable plan membership", { skip: !databaseUrl }, async () => {
  const sql = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const plan = planInput(randomUUID());
  let owner = "";
  try {
    owner = await fixture(sql, plan);
    const persisted = await new PostgresImmutableSemanticCorpusPlanRepository(atlas as never).persist(plan);
    const fixtureBody = fixtureSemanticBatchPlanReadyV1(persisted);
    const receiver = new PostgresSemanticBatchPlanReadyFixtureReceiver(sql);
    const [before] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS jobs, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS semantic_execution, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidates, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [plan.scope.documentId]);
    assert.equal(fixtureBody.canonicalJsonSha256, digest(fixtureBody.canonicalJson), "the evidence digest binds exact validated body bytes");
    assert.deepEqual(await receiver.receive(fixtureBody.canonicalJson), fixtureBody.body, "the receiver accepts only the persisted positive N-batch body");
    const reject = async (label: string, body: unknown) => await assert.rejects(() => receiver.receive(JSON.stringify(body)), SemanticBatchPlanReadyFixtureError, label);
    await reject("missing field", { ...fixtureBody.body, planHash: undefined });
    await reject("extra field", { ...fixtureBody.body, extra: true });
    await reject("wrong parent hash", { ...fixtureBody.body, planHash: "f".repeat(64) });
    await reject("wrong count", { ...fixtureBody.body, batchCount: 1 });
    await reject("duplicate batch", { ...fixtureBody.body, batchHandoffRefs: [fixtureBody.body.batchHandoffRefs[0], { ...fixtureBody.body.batchHandoffRefs[0], ref: fixtureBody.body.batchHandoffRefs[1]!.ref }] });
    await reject("foreign ref", { ...fixtureBody.body, batchHandoffRefs: [{ ...fixtureBody.body.batchHandoffRefs[0]!, ref: "semantic-handoff-foreign" }, fixtureBody.body.batchHandoffRefs[1]] });
    await reject("stale member hash", { ...fixtureBody.body, batchHandoffRefs: [{ ...fixtureBody.body.batchHandoffRefs[0]!, hash: "e".repeat(64) }, fixtureBody.body.batchHandoffRefs[1]] });
    await reject("oversized opaque field", { ...fixtureBody.body, documentPlanRef: `a${"x".repeat(200)}` });
    await assert.rejects(() => receiver.receive(JSON.stringify({ ...fixtureBody.body, batchCount: 101, batchHandoffRefs: Array.from({ length: 101 }, (_, index) => ({ batchId: `batch-${String(index + 1).padStart(4, "0")}`, ref: `handoff-${index + 1}`, hash: "a".repeat(64) })) })), SemanticBatchPlanReadyManifestRequiredError, "more than 100 handoffs requires a separately versioned manifest");
    await assert.rejects(() => receiver.receive(`${fixtureBody.canonicalJson.slice(0, -1)},"extra":true}`), /not exact|not canonical/, "duplicate/extra JSON does not become a body");
    await sql.unsafe("SET session_replication_role = replica");
    await sql.unsafe("UPDATE atlas.planned_semantic_corpus_handoff SET immutable_content=jsonb_set(immutable_content, '{ownedLocators}', '[]'::jsonb) WHERE id=$1", [persisted.handoffs[0]!.handoffId]);
    await sql.unsafe("SET session_replication_role = origin");
    await assert.rejects(() => receiver.receive(fixtureBody.canonicalJson), SemanticBatchPlanReadyFixtureError, "missing persisted owned coverage is rejected by the receiver");
    const [after] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS jobs, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS semantic_execution, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidates, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [plan.scope.documentId]);
    assert.deepEqual(after, before, "validating an unissued output creates no queue, BSS, semantic, or reconciliation effect");
  } finally { try { if (owner) await cleanup(sql, plan, owner); } finally { await atlas.end(); await sql.end(); } }
});

test("real accepted source composes into persisted, validated, and unissued SemanticBatchPlanReady output", { skip: !databaseUrl }, async () => {
  const suffix = randomUUID();
  const sql = postgres(databaseUrl!, { max: 2 });
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const root = await mkdtemp(join(tmpdir(), "atlas-semantic-ready-compose-"));
  const owner = `ready-compose-owner-${suffix}`;
  const projectId = `ready-compose-project-${suffix}`;
  const workspaceId = `ready-compose-workspace-${suffix}`;
  const bundleId = `ready-compose-bundle-${suffix}`;
  const documentId = `ready-compose-document-${suffix}`;
  const executionId = `ready-compose-execution-${suffix}`;
  const sourceSha256 = digest(`ready-compose-source-${suffix}`);
  const credential = `ready-compose-credential-${suffix}`;
  const processId = `ready-compose-process-${suffix}`;
  const workloadId = `ready-compose-workload-${suffix}`;
  const capabilityIdentity = "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1";
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gL+ZK2mXQAAAABJRU5ErkJggg==", "base64");
  try {
    const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer("i".repeat(32)), undefined, capabilityIdentity, undefined, new LocalFilesystemDocumentStore(root));
    await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'ready compose',$3)", [projectId, `ready-compose-${suffix.slice(0, 12)}`, owner]);
    await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [projectId, owner]);
    await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspaceId, projectId]);
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'compose.pdf',$4,$5,64,'application/pdf',$6)", [documentId, projectId, workspaceId, `private/${suffix}.pdf`, sourceSha256, owner]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [bundleId, projectId, workspaceId]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundleId, documentId, projectId, workspaceId, executionId]);
    const request = await authority.create({ executionId, artifactId: documentId, storageKey: `private/${suffix}.pdf`, sourceSha256, mimeType: "application/pdf", byteSize: 64, idempotencyKey: `ready-compose-${suffix}`, capabilityIdentity });
    await authority.redeem(request);
    const asset = await authority.handoffDerived(request, { sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 1, locatorId: "compose-visual", mediaType: "image/png", width: 1, height: 1, byteLength: png.byteLength, sha256: createHash("sha256").update(png).digest("hex") }, png);
    await authority.deliver(request, { version: "v1", executionId, artifactId: documentId, sourceSha256, perception: request.perception, provider: { name: "docling", processor: "run-003-capture", executionId, processedAt: "2026-10-19T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "compose-text", text: "A source-grounded composition fixture." }], tables: [], visualRegions: [{ id: "compose-visual", assetRef: asset.assetRef }] }] });
    const inputFixture = await new PostgresAcceptedSemanticBatchPlanInputFixtureRepository(sql).derive(executionId);
    const resolver = new PostgresAcceptedSemanticBatchPlanDocumentResolver(sql);
    const receiving = createInternalReceivingBoundary({ serviceCredential: credential, parseBody: parseSemanticBatchPlanInputV1, redeem: (body) => resolver.resolveBackground(body) });
    const accepted = await receiving.receive(credential, inputFixture.canonicalJson);
    assert.equal(accepted.media[0]?.assetRef, asset.assetRef, "the real resolver preserves the accepted RUN-003 derived-media reference");

    await bridge.unsafe("BEGIN");
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',false,'[\"semantic\"]'::jsonb,$2::jsonb,$3::jsonb,'anoman-quota-v1',$4::jsonb,$5::jsonb)", [workloadId, { identity: "anoman-prospective-bound", version: "v1", maxRequestBytes: 10000, maxInputTokens: 4000 }, { identity: "anoman-prospective-estimator", version: "v2", media: { identity: "anoman-prospective-media", version: "v1" } }, { policyId: "anoman-output", policyVersion: "v1", maxOutputTokens: 100 }, { policyId: "anoman-safety", policyVersion: "v1" }]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}'::jsonb,$2::jsonb,false,'[\"anoman-semantic\"]'::jsonb,$3,'v1')", [processId, { background: { weight: 1, mayBorrowIdleCapacity: false }, hardInteractiveProtection: { policyId: "anoman-reserve", policyVersion: "v1" } }, workloadId]);
    const snapshotReader = createCapacityPlanningSnapshotReader({ executeSql: async (statement, values) => ({ rows: await bridge.unsafe(statement, values as never[]) }) }, { authenticate: (value) => value === credential ? { credential, principalId: `ready-compose-reader-${suffix}`, quotaDomainId: "anoman-shared-prod", processId, processProfileVersion: "v1", routeId: "anoman-semantic", serviceClass: "background", prospective: true } : null });
    const proposal = await proposeStructuralFitCorpusPartition({
      acceptedDocument: accepted,
      estimatorConfiguration: { bssRegisteredEstimator: { identity: "anoman-prospective-estimator", version: "v2" }, estimator: { identity: "anoman-prospective-estimator", version: "v2" }, modelRoute: { model: "qualified-semantic-model", route: "anoman-semantic" }, overheads: { systemPromptBytes: 10, schemaBytes: 10, contextPlaceholderBytes: 0, contextPlaceholderTokens: 0, reservedOutputBytes: 10, reservedOutputTokens: 1, mediaMetadataBytes: 0, mediaInputTokensPerByte: 0, inputBytesPerToken: 4, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0 } },
      capacityConsumer: createIdserProspectiveCapacitySnapshotConsumer({ reader: snapshotReader, serverCredential: credential }),
    });
    assert.equal(proposal.disposition, "READY", "the real BSS prospective reader, estimator, and partitioner yield a bounded unpublished plan");
    if (proposal.disposition !== "READY") throw new Error("expected a ready structural proposal");
    const immutableInput: ImmutableSemanticCorpusPlanInputV1 = {
      scope: accepted.scope,
      source: { sourceSha256, normalizedDocumentRef: inputFixture.input.normalizedDocumentRef, perceptionExecutionId: inputFixture.input.perceptionExecutionId, normalizedDocumentFingerprint: inputFixture.input.normalizedDocumentFingerprint, normalizedDocumentVersion: "v1", perceptionCapability: accepted.normalizedDocument.perception.capability, perceptionContractVersion: accepted.normalizedDocument.perception.contractVersion, media: accepted.media, rel: accepted.rel },
      proposal: { proposalId: proposal.proposalId, proposalHash: proposal.proposalHash, sourceHash: proposal.sourceHash, policyHash: proposal.policyHash, estimatorHash: proposal.estimatorHash, structuralBound: proposal.structuralBound, bssSnapshot: { source: { sourceId: String(proposal.bssSnapshot.source.quotaDomainId), sourceVersion: String(proposal.bssSnapshot.source.providerCapacityProfileVersion) }, enforcement: { policyId: String(proposal.bssSnapshot.enforcement.policyId), policyVersion: String(proposal.bssSnapshot.enforcement.policyVersion) }, process: { profileId: String(proposal.bssSnapshot.process.id), profileVersion: String(proposal.bssSnapshot.process.profileVersion) }, workload: { planId: String(proposal.bssSnapshot.workload.id), planVersion: String(proposal.bssSnapshot.workload.profileVersion), estimator: { identity: String((proposal.bssSnapshot.workload.estimator as Record<string, unknown>).identity), version: String((proposal.bssSnapshot.workload.estimator as Record<string, unknown>).version) } } }, eligibleDimensions: proposal.eligibleDimensions, requestResourceEnvelope: proposal.requestResourceEnvelope, units: proposal.units, batches: proposal.batches },
    };
    const before = await downstreamCounts(sql, documentId);
    const repository = new PostgresImmutableSemanticCorpusPlanRepository(atlas as never);
    const persisted = await repository.persist(immutableInput);
    const replay = await repository.persist(immutableInput);
    assert.deepEqual(replay, persisted, "the exact accepted-source composition replays to the same immutable plan and handoffs");
    const output = fixtureSemanticBatchPlanReadyV1(persisted);
    assert.deepEqual(await new PostgresSemanticBatchPlanReadyFixtureReceiver(sql).receive(output.canonicalJson), output.body, "the real persisted plan composes into a validated but unissued output body");
    const [storedPlan] = await sql.unsafe("SELECT immutable_content FROM atlas.semantic_corpus_plan WHERE id=$1", [persisted.planId]);
    const storedContent = storedPlan!.immutable_content as { source: unknown; proposal: { bssSnapshot: unknown; structuralBound: unknown; eligibleDimensions: unknown; requestResourceEnvelope: unknown; units: unknown } };
    assert.deepEqual(storedContent.source, immutableInput.source, "the real composed plan retains exact accepted source/media and REL state");
    assert.deepEqual(storedContent.proposal.bssSnapshot, immutableInput.proposal.bssSnapshot, "the real composed plan retains exact BSS policy/provider provenance");
    assert.deepEqual(storedContent.proposal.structuralBound, immutableInput.proposal.structuralBound, "the real composed plan retains its structural bound");
    assert.deepEqual(storedContent.proposal.eligibleDimensions, immutableInput.proposal.eligibleDimensions, "the real composed plan retains eligible dimensions including unknown/not-enforced RPD treatment");
    assert.deepEqual(storedContent.proposal.requestResourceEnvelope, immutableInput.proposal.requestResourceEnvelope, "the real composed plan retains its bounded envelope");
    assert.deepEqual(storedContent.proposal.units, immutableInput.proposal.units, "the real composed plan retains eligible, visual, context, and deferred unit state");
    const storedHandoffs = await sql.unsafe("SELECT immutable_content FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1 ORDER BY batch_slot", [persisted.planId]);
    assert.equal(storedHandoffs.length, immutableInput.proposal.batches.length, "the real composed plan retains every referenced handoff");
    storedHandoffs.forEach((row, index) => {
      const content = row.immutable_content as { ownedLocators: unknown; contextOnlyLocators: unknown; requestResourceEnvelope: unknown };
      const expected = immutableInput.proposal.batches[index]!;
      assert.deepEqual(content.ownedLocators, expected.ownedLocators, "each referenced handoff retains owned locators");
      assert.deepEqual(content.contextOnlyLocators, expected.contextOnlyLocators, "each referenced handoff retains context locators");
      assert.deepEqual(content.requestResourceEnvelope, expected.requestResourceEnvelope, "each referenced handoff retains its bounded envelope");
    });
    const changedComposition = (kind: string, source = immutableInput.source, proposal = immutableInput.proposal): ImmutableSemanticCorpusPlanInputV1 => ({
      ...immutableInput,
      source,
      proposal: { ...proposal, proposalId: `${proposal.proposalId}-${kind}`, proposalHash: digest(`${proposal.proposalHash}-${kind}`), sourceHash: digest(`${proposal.sourceHash}-${kind}`) },
    });
    const changedAsset = changedComposition("asset", { ...immutableInput.source, media: [{ ...immutableInput.source.media[0]!, assetRef: `derived/${randomUUID()}` }] });
    const changedProfile = changedComposition("profile", immutableInput.source, { ...immutableInput.proposal, bssSnapshot: { ...immutableInput.proposal.bssSnapshot, process: { profileId: `${processId}-v2`, profileVersion: "v2" } } });
    const changedStructural = changedComposition("structural", immutableInput.source, { ...immutableInput.proposal, structuralBound: { ...immutableInput.proposal.structuralBound, version: "v2", maxRequestBytes: immutableInput.proposal.structuralBound.maxRequestBytes + 1 } });
    const originalSnapshot = JSON.parse(JSON.stringify(storedPlan!.immutable_content));
    for (const changed of [changedAsset, changedProfile, changedStructural]) await repository.persist(changed);
    const [afterChanges] = await sql.unsafe("SELECT immutable_content FROM atlas.semantic_corpus_plan WHERE id=$1", [persisted.planId]);
    assert.deepEqual(afterChanges!.immutable_content, originalSnapshot, "changed accepted-source-derived asset, BSS profile, and structural versions cannot mutate the prior composed plan");
    const after = await downstreamCounts(sql, documentId);
    assert.deepEqual(after, before, "the positive composition creates zero GHR, BSS execution, SEM, or reconciliation effects");
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.normalized_document_cache WHERE source_sha256=$1", [sourceSha256]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [projectId]).catch(() => undefined);
    await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined);
    await Promise.all([bridge.end(), atlas.end(), sql.end(), rm(root, { recursive: true, force: true })]);
  }
});
