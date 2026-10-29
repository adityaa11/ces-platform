import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket } from "@atlas/skills";
import { createCapacityPlanningSnapshotReader } from "../../apps/agents-bridge/src/capacity-planning-snapshot.ts";
import { createIdserProspectiveCapacitySnapshotConsumer } from "../../apps/agents-bridge/src/idser-prospective-capacity-snapshot.ts";
import { proposeStructuralFitCorpusPartition } from "../../apps/agents-bridge/src/idser-structural-fit-corpus-partition.ts";
import { PostgresAcceptedSemanticBatchPlanDocumentResolver, PostgresAcceptedSemanticBatchPlanInputFixtureRepository } from "../../packages/atlas-db/src/semantic-batch-plan-input.ts";
import { PostgresImmutableSemanticCorpusPlanRepository } from "../../packages/atlas-db/src/immutable-semantic-corpus-plan.ts";
import { PostgresSemanticBatchPlanReadyFixtureReceiver, fixtureSemanticBatchPlanReadyV1 } from "../../packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts";
import { PostgresSemanticBatchReconstructionResolver } from "../../packages/atlas-db/src/semantic-batch-reconstruction.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const bridgeDatabaseUrl = process.env.AGENTS_BRIDGE_DATABASE_URL;
if (!bridgeDatabaseUrl) throw new Error("AGENTS_BRIDGE_DATABASE_URL is required");
const canonicalDatabaseUrl = process.env.CANONICAL_DATABASE_URL;
if (!canonicalDatabaseUrl) throw new Error("CANONICAL_DATABASE_URL is required for the read-only no-mutation snapshot");
const sourceSha256 = process.env.IDSER_0120407_SOURCE_SHA256;
if (!sourceSha256 || !/^[a-f0-9]{64}$/.test(sourceSha256)) throw new Error("IDSER_0120407_SOURCE_SHA256 must be a lowercase SHA-256");
const sql = postgres(databaseUrl, { max: 1 });
const bridge = postgres(bridgeDatabaseUrl, { max: 1 });
const canonical = postgres(canonicalDatabaseUrl, { max: 1 });
const suffix = randomUUID();
const domain = `idser-012-04-07-${suffix}`;
const processId = `${domain}-process`;
const workloadId = `${domain}-workload`;
const credential = `${domain}-credential`;
const outputTokens = 128;

const counters = async (connection: any, documentId: string) => (await connection.unsafe(`SELECT
  (SELECT count(*)::int FROM pgboss.job) AS jobs,
  (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS admissions,
  (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts,
  (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations,
  (SELECT count(*)::int FROM bridge.provider_work_dispatch) AS dispatches,
  (SELECT count(*)::int FROM bridge.provider_transport_claim) AS transport_claims,
  (SELECT count(*)::int FROM bridge.semantic_result_delivery) AS semantic_deliveries,
  (SELECT count(*)::int FROM bridge.document_perception_result_delivery) AS perception_deliveries,
  (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS semantic_executions,
  (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE document_id=$1) AS semantic_results,
  (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidates,
  (SELECT count(*)::int FROM atlas.semantic_evidence WHERE document_id=$1) AS semantic_evidence,
  (SELECT count(*)::int FROM atlas.semantic_deferred_acceptance WHERE document_id=$1) AS deferred_acceptance,
  (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliations,
  (SELECT count(*)::int FROM atlas.reconciliation_relationship relationship JOIN atlas.semantic_reconciliation_result result ON result.id=relationship.reconciliation_result_id WHERE result.current_document_id=$1) AS reconciliation_relationships,
  (SELECT count(*)::int FROM atlas.knowledge_index WHERE document_id=$1) AS knowledge_index,
  (SELECT count(*)::int FROM atlas.workspace WHERE kind='master') AS master_workspaces,
  (SELECT count(*)::int FROM bridge.provider_process_profile WHERE process_kind='ces') AS ces_process_profiles`, [documentId]))[0];

const sourceSnapshot = async (connection: any) => {
  const rows = await connection.unsafe(`SELECT execution.id AS perception_execution_id, execution.artifact_id AS document_id,
    document.source_sha256, execution.state AS execution_state, execution.contract_version, execution.capability_identity,
    execution.completion_fingerprint, member.state AS member_state, bundle.state AS bundle_state
    FROM atlas.document_perception_execution execution
    JOIN atlas.extraction_bundle_document member ON member.perception_execution_id=execution.id AND member.document_id=execution.artifact_id
    JOIN atlas.extraction_bundle bundle ON bundle.id=member.bundle_id AND bundle.project_id=member.project_id AND bundle.workspace_id=member.workspace_id
    JOIN atlas.document document ON document.id=member.document_id AND document.project_id=member.project_id AND document.workspace_id=member.workspace_id
    WHERE document.source_sha256=$1 AND execution.state='completed' AND execution.contract_version='v1'
      AND execution.capability_identity='docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1'
      AND member.state='perceived' AND bundle.state='processing' AND execution.completion_fingerprint ~ '^[a-f0-9]{64}$'
    ORDER BY execution.created_at DESC LIMIT 2`, [sourceSha256]);
  assert.equal(rows.length, 1, "the protected source must resolve to exactly one current accepted RUN-003 record");
  return rows[0]!;
};

try {
  const canonicalBeforeSource = await sourceSnapshot(canonical);
  const canonicalBeforeCounters = await counters(canonical, String(canonicalBeforeSource.document_id));
  const selected = await sourceSnapshot(sql);
  assert.deepEqual(selected, canonicalBeforeSource, "the isolated copy must begin from the verified canonical source and lifecycle snapshot");
  const fixture = await new PostgresAcceptedSemanticBatchPlanInputFixtureRepository(sql as any).derive(String(selected.perception_execution_id));
  const accepted = await new PostgresAcceptedSemanticBatchPlanDocumentResolver(sql as any).resolveBackground(fixture.input);
  const eligible = accepted.normalizedDocument.pages.flatMap((page) => [
    ...page.textBlocks.filter((entry) => entry.text.trim()).map((entry) => ({ pageNumber: page.number, locatorType: "text_block" as const, locatorId: entry.id })),
    ...page.tables.filter((entry) => entry.content.trim()).map((entry) => ({ pageNumber: page.number, locatorType: "table" as const, locatorId: entry.id })),
  ]);
  assert.ok(eligible.length >= 2, "the real accepted source must contain two text/table units");
  const fullPacket = buildStepwiseSourcePacket({ document: accepted.normalizedDocument, ownedLocators: eligible, contextOnlyLocators: [] });
  const request = buildStepwiseRelationshipEnvelopeRequest(fullPacket);
  const fullBytes = Buffer.byteLength(request.systemPrompt) + Buffer.byteLength(request.sourceSpecification) + Buffer.byteLength(JSON.stringify(request.responseSchema));
  const fullTokens = Math.ceil(fullBytes / 4);
  const singleMeasurements = eligible.map((locator) => {
    const candidate = buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document: accepted.normalizedDocument, ownedLocators: [locator], contextOnlyLocators: [] }));
    const bytes = Buffer.byteLength(candidate.systemPrompt) + Buffer.byteLength(candidate.sourceSpecification) + Buffer.byteLength(JSON.stringify(candidate.responseSchema));
    return { bytes, tokens: Math.ceil(bytes / 4) };
  });
  const maxRequestBytes = Math.max(...singleMeasurements.map((value) => value.bytes + 1), Math.ceil(fullBytes / 3));
  const maxInputTokens = Math.max(...singleMeasurements.map((value) => value.tokens + 1), Math.ceil(fullTokens / 3));
  const before = await counters(sql, accepted.scope.documentId);
  await bridge.unsafe("BEGIN");
  await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'v1','qualification',$2::jsonb,$3::jsonb,$4::jsonb,'qualified_observation','qualification://idser-012-04-07','v1',now(),now())", [domain, [{ routeId: "qualification-semantic", providerId: "qualification" }], { rpm: { state: "known", value: 100 }, tpm: { state: "known", value: 1_000_000 }, rpd: { state: "known", value: 10_000 }, concurrency: { state: "known", value: 10 } }, { rpm: { kind: "fixed_window" }, tpm: { kind: "fixed_window" }, rpd: { kind: "fixed_window" } }]);
  await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'v1','qualification-semantic','qualification-policy','v1','{}'::jsonb,'qualification',now())", [`${domain}-approval`, domain]);
  await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'v1','qualification-semantic','qualification-policy','v1',$2,$3::jsonb,now())", [domain, `${domain}-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "enforced", limitSource: "provider" }, concurrency: { mode: "enforced", limitSource: "provider" } }]);
  await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',false,'[\"semantic\"]'::jsonb,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb)", [workloadId, { identity: "idser-012-04-07-bound", version: "v1", maxRequestBytes, maxInputTokens, maxPromptBytes: maxRequestBytes, maxContextTokens: maxInputTokens + outputTokens }, { identity: "idser-012-04-07-estimator", version: "v1" }, { policyId: "idser-012-04-07-output", policyVersion: "v1", maxOutputTokens: outputTokens }, { policyId: "idser-012-04-07-safety", policyVersion: "v1" }]);
  await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}'::jsonb,$2::jsonb,false,'[\"qualification-semantic\"]'::jsonb,$3,'v1')", [processId, { background: { weight: 1, mayBorrowIdleCapacity: false }, hardInteractiveProtection: { policyId: "idser-012-04-07-reserve", policyVersion: "v1" } }, workloadId]);
  const reader = createCapacityPlanningSnapshotReader({ executeSql: async (statement, values) => ({ rows: await bridge.unsafe(statement, values as any) }) }, { authenticate: (value) => value === credential ? { principalId: `${domain}-reader`, quotaDomainId: domain, processId, processProfileVersion: "v1", routeId: "qualification-semantic", serviceClass: "background" as const, prospective: true } : null });
  const proposal = await proposeStructuralFitCorpusPartition({ acceptedDocument: accepted, estimatorConfiguration: { estimator: { identity: "idser-012-04-07-estimator", version: "v1" }, configuration: { identity: "idser-012-04-07-accounting", version: "v1" }, inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: outputTokens, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } }, capacityConsumer: createIdserProspectiveCapacitySnapshotConsumer({ reader, serverCredential: credential }) });
  assert.equal(proposal.disposition, "READY", `the isolated authenticated BSS reader must accept the bounded real-data partition: ${proposal.disposition === "READY" ? "ready" : proposal.reason}`);
  if (proposal.disposition !== "READY") throw new Error("unreachable");
  assert.ok(proposal.batches.length >= 2, "the deliberately bounded workload must create at least two batches");
  await bridge.unsafe("ROLLBACK");
  const packetProfile = { identity: "stepwise-relationship-envelope", version: "v1" };
  const v2: any = { version: "ImmutableSemanticCorpusPlan/v2", scope: accepted.scope, source: { sourceSha256: fixture.input.sourceSha256, normalizedDocumentRef: fixture.input.normalizedDocumentRef, perceptionExecutionId: fixture.input.perceptionExecutionId, normalizedDocumentFingerprint: fixture.input.normalizedDocumentFingerprint, normalizedDocumentVersion: "v1", perceptionCapability: accepted.normalizedDocument.perception.capability, perceptionContractVersion: accepted.normalizedDocument.perception.contractVersion, rel: accepted.rel }, proposal: { proposalId: proposal.proposalId, proposalHash: proposal.proposalHash, sourceHash: proposal.sourceHash, policyHash: proposal.policyHash, estimatorHash: proposal.estimatorHash, structuralBound: proposal.structuralBound, bssSnapshot: { source: { sourceId: String((proposal.bssSnapshot.source as any).quotaDomainId), sourceVersion: String((proposal.bssSnapshot.source as any).sourceVersion) }, enforcement: { policyId: String((proposal.bssSnapshot.enforcement as any).policyId), policyVersion: String((proposal.bssSnapshot.enforcement as any).policyVersion) }, process: { profileId: String((proposal.bssSnapshot.process as any).id), profileVersion: String((proposal.bssSnapshot.process as any).profileVersion) }, workload: { planId: String((proposal.bssSnapshot.workload as any).id), planVersion: String((proposal.bssSnapshot.workload as any).profileVersion), estimator: { identity: "idser-012-04-07-estimator", version: "v1" } } }, packetProfile, estimator: { identity: "idser-012-04-07-estimator", version: "v1" }, configuration: { identity: "idser-012-04-07-accounting", version: "v1" }, eligibleDimensions: proposal.eligibleDimensions, requestResourceEnvelope: proposal.requestResourceEnvelope, inventory: proposal.units.map((unit: any) => ({ locator: { documentId: accepted.scope.documentId, pageNumber: unit.locator.pageNumber, sourceKind: unit.locator.locatorType, localId: unit.locator.locatorId }, classification: unit.classification, ...(unit.reason ? { reason: unit.reason } : {}) })), batches: proposal.batches.map((batch: any) => ({ batchId: batch.batchId, ownedLocators: batch.ownedLocators.map((locator: any) => ({ documentId: accepted.scope.documentId, pageNumber: locator.pageNumber, sourceKind: locator.locatorType, localId: locator.locatorId })), contextOnlyLocators: [], sourceSpecificationSha256: batch.sourceSpecificationSha256, packetProfile, estimator: { identity: "idser-012-04-07-estimator", version: "v1" }, configuration: { identity: "idser-012-04-07-accounting", version: "v1" }, conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: batch.requestBytes }, requestBytes: batch.requestBytes, inputTokens: batch.inputTokens, reservedOutputTokens: outputTokens, requestResourceEnvelope: batch.requestResourceEnvelope, fitTrace: batch.fitTrace.map((trace: any) => ({ ...trace, reservedOutputTokens: outputTokens })) })) } };
  const repository = new PostgresImmutableSemanticCorpusPlanRepository(sql as any);
  const planCounts = async () => (await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE document_id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff handoff JOIN atlas.semantic_corpus_plan plan ON plan.id=handoff.plan_id WHERE plan.document_id=$1) AS handoffs", [accepted.scope.documentId]))[0];
  const beforePlans = await planCounts();
  const persisted: any = await repository.persist(v2);
  assert.deepEqual(await repository.persist(v2), persisted, "replay is idempotent");
  await assert.rejects(() => repository.persist({ ...v2, source: { ...v2.source, sourceSha256: "f".repeat(64) } }), /foreign, stale, or no longer accepted/, "a stale source binding rolls back without a partial v2 plan");
  const afterPlans = await planCounts();
  assert.equal(afterPlans.plans, beforePlans.plans + 1, "the successful immutable parent is the only plan added");
  assert.equal(afterPlans.handoffs, beforePlans.handoffs + persisted.handoffs.length, "the rejected replay leaves no partial handoffs");
  const body = fixtureSemanticBatchPlanReadyV1(persisted);
  assert.deepEqual(await new PostgresSemanticBatchPlanReadyFixtureReceiver(sql as any).receive(body.canonicalJson), body.body, "reference-only body validates persisted v2 membership");
  const qualificationUserId = `${domain}-reader`;
  const qualificationSession = `${domain}-session`;
  await sql.unsafe("BEGIN");
  try {
    await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [qualificationUserId, `${qualificationUserId}@example.test`]);
    await sql.unsafe('INSERT INTO auth."session" (id,"expiresAt",token,"createdAt","updatedAt","userId") VALUES ($1,now()+interval \'5 minutes\',$2,now(),now(),$3)', [`${domain}-session-id`, qualificationSession, qualificationUserId]);
    await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [accepted.scope.projectId, qualificationUserId]);
    const reconstruction = new PostgresSemanticBatchReconstructionResolver(sql as any);
    for (const handoff of persisted.handoffs) {
      const rebuilt: any = await reconstruction.reconstruct({ ...accepted.scope, callerUserId: qualificationUserId, callerSessionToken: qualificationSession }, { documentPlanRef: persisted.planId, planHash: persisted.planHash, batchId: handoff.batchId, batchHandoffRef: handoff.handoffId, batchHandoffHash: handoff.handoffHash });
      assert.ok(/^[a-f0-9]{64}$/.test(rebuilt.sourceSpecificationSha256));
    }
  } finally {
    await sql.unsafe("ROLLBACK").catch(() => undefined);
  }
  const after = await counters(sql, accepted.scope.documentId);
  assert.deepEqual(after, before, "qualification creates no downstream work or semantic effects");
  const canonicalAfterSource = await sourceSnapshot(canonical);
  const canonicalAfterCounters = await counters(canonical, String(canonicalAfterSource.document_id));
  assert.deepEqual(canonicalAfterSource, canonicalBeforeSource, "qualification must not mutate the canonical source or lifecycle");
  assert.deepEqual(canonicalAfterCounters, canonicalBeforeCounters, "qualification must not create canonical provider, GHR, BSS, semantic, reconciliation, Master, or CES effects");
  const visuals = proposal.units.filter((unit) => unit.locator.locatorType === "visual_region");
  assert.ok(visuals.length > 0 && visuals.every((unit) => unit.classification === "unexamined" && unit.reason === "image_accounting_unavailable"), "real visual units remain explicitly non-ready");
  console.log(JSON.stringify({ sourceSha256, pages: accepted.normalizedDocument.pages.length, eligibleUnits: eligible.length, visualUnits: visuals.length, batchCount: persisted.handoffs.length, planId: persisted.planId, planHash: persisted.planHash, handoffHashes: persisted.handoffs.map((handoff: any) => handoff.handoffHash), referenceBodySha256: body.canonicalJsonSha256, maxRequestBytes, maxInputTokens, isolatedCounters: after, canonicalSourceSnapshot: canonicalAfterSource, canonicalCounters: canonicalAfterCounters }));
} catch (error) {
  await bridge.unsafe("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await Promise.all([canonical.end(), bridge.end(), sql.end()]);
}
