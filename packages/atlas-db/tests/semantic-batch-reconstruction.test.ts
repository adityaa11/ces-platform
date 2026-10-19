import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import test from "node:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import postgres from "postgres";
import { buildStepwiseSourcePacket } from "@atlas/skills";
import { LocalFilesystemDocumentStore } from "@atlas/document-store";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { PostgresAcceptedSemanticBatchPlanDocumentResolver, PostgresAcceptedSemanticBatchPlanInputFixtureRepository, type AcceptedDocumentPlannerResultV1, type AcceptedDocumentResolverScope } from "../src/semantic-batch-plan-input.ts";
import { canonicalImmutableSemanticCorpusPlanV2, PostgresImmutableSemanticCorpusPlanRepository, replayImmutableSemanticCorpusPlanHashV2, type ImmutableSemanticCorpusPlanInputV2 } from "../src/immutable-semantic-corpus-plan.ts";
import { PostgresSemanticBatchReconstructionResolver, SemanticBatchReconstructionError } from "../src/semantic-batch-reconstruction.ts";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const scope: AcceptedDocumentResolverScope = { callerUserId: "reconstruction-owner", callerSessionToken: "reconstruction-session", projectId: "reconstruction-project", workspaceId: "reconstruction-workspace", bundleId: "reconstruction-bundle", documentId: "reconstruction-document" };
const sourceSha256 = digest("reconstruction-source");
const databaseUrl = process.env.DATABASE_URL;
const document = {
  version: "v1" as const, executionId: "reconstruction-execution", artifactId: scope.documentId, sourceSha256,
  perception: { capability: "atlas.document.perceive", contractVersion: "v1" as const },
  provider: { name: "docling", processor: "test", executionId: "reconstruction-execution", processedAt: "2026-10-20T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [{ id: "owned", text: "Owned canonical source." }], tables: [{ id: "context", content: "Context canonical table." }], visualRegions: [] }],
};
const fingerprint = digest(JSON.stringify(document));
const accepted: AcceptedDocumentPlannerResultV1 = { scope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId: scope.documentId }, normalizedDocument: document, source: { documentId: scope.documentId, sourceSha256 }, media: [], rel: { state: "unavailable" } };
const owned = { documentId: scope.documentId, pageNumber: 1, sourceKind: "text_block" as const, localId: "owned" };
const context = { documentId: scope.documentId, pageNumber: 1, sourceKind: "table" as const, localId: "context" };
const packet = buildStepwiseSourcePacket({ document, ownedLocators: [{ pageNumber: 1, locatorType: "text_block", locatorId: "owned" }], contextOnlyLocators: [{ pageNumber: 1, locatorType: "table", locatorId: "context" }] });
const identity = (name: string) => ({ identity: name, version: "v1" });

function planInput(): ImmutableSemanticCorpusPlanInputV2 {
  return {
    version: "ImmutableSemanticCorpusPlan/v2", scope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId: scope.documentId },
    source: { sourceSha256, normalizedDocumentRef: "reconstruction-cache", perceptionExecutionId: document.executionId, normalizedDocumentFingerprint: fingerprint, normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", rel: { state: "unavailable" } },
    proposal: {
      proposalId: "reconstruction-proposal", proposalHash: digest("proposal"), sourceHash: digest("source"), policyHash: digest("policy"), estimatorHash: digest("estimator"),
      structuralBound: { identity: "bound", version: "v1", maxRequestBytes: 4096, maxInputTokens: 1024, maxPromptBytes: 4096, maxContextTokens: 2048 },
      bssSnapshot: { source: { sourceId: "capacity", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "semantic", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: identity("estimator") } },
      packetProfile: identity("semantic-packet"), estimator: identity("estimator"), configuration: identity("configuration"), eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 },
      inventory: [{ locator: owned, classification: "eligible" }, { locator: context, classification: "deferred", reason: "context_only" }],
      batches: [{ batchId: "batch-0001", ownedLocators: [owned], contextOnlyLocators: [context], sourceSpecificationSha256: packet.sourceSpecificationSha256, packetProfile: identity("semantic-packet"), estimator: identity("estimator"), configuration: identity("configuration"), conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: 100 }, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256: packet.sourceSpecificationSha256, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, outcome: "fit" }] }],
    },
  };
}

function fixture(mutator?: (content: { plan: any; handoff: any }) => void, cancelled = false) {
  const canonical = canonicalImmutableSemanticCorpusPlanV2(planInput());
  const content = { plan: JSON.parse(JSON.stringify(canonical.planContent)), handoff: JSON.parse(JSON.stringify(canonical.handoffContents[0])) };
  mutator?.(content);
  const planHash = replayImmutableSemanticCorpusPlanHashV2(content.plan);
  content.handoff.planHash = planHash;
  const handoffHash = replayImmutableSemanticCorpusPlanHashV2(content.handoff);
  const planId = `semantic-plan-${planHash}`;
  const handoffId = `semantic-handoff-${handoffHash}`;
  return { reference: { documentPlanRef: planId, planHash, batchId: "batch-0001", batchHandoffRef: handoffId, batchHandoffHash: handoffHash }, row: { plan_id: planId, plan_hash: planHash, project_id: scope.projectId, workspace_id: scope.workspaceId, bundle_id: scope.bundleId, document_id: scope.documentId, plan_content: content.plan, handoff_id: handoffId, handoff_plan_id: planId, batch_id: "batch-0001", batch_slot: 1, handoff_hash: handoffHash, handoff_content: content.handoff, cancelled_plan_id: cancelled ? planId : null } };
}

function resolver(data = fixture(), acceptedResolver: { resolve: (...args: any[]) => Promise<AcceptedDocumentPlannerResultV1> } = { resolve: async () => accepted }) {
  const statements: string[] = [];
  const sql = { unsafe: async (statement: string) => { statements.push(statement); return [data.row]; } };
  return { resolver: new PostgresSemanticBatchReconstructionResolver(sql, acceptedResolver), statements };
}

test("reconstructs the exact selected packet from an authorized persisted v2 handoff without effects", async () => {
  const data = fixture();
  let resolveCalls = 0;
  const { resolver: subject, statements } = resolver(data, { resolve: async (actualScope, input) => {
    resolveCalls += 1;
    assert.deepEqual(actualScope, scope);
    assert.deepEqual(input, { normalizedDocumentRef: "reconstruction-cache", perceptionExecutionId: document.executionId, normalizedDocumentFingerprint: fingerprint, sourceSha256, normalizedDocumentVersion: "v1" });
    return accepted;
  } });
  const result = await subject.reconstruct(scope, data.reference);
  assert.equal(resolveCalls, 1);
  assert.equal(result.sourceSpecification, packet.sourceSpecification);
  assert.equal(result.sourceSpecificationSha256, packet.sourceSpecificationSha256);
  assert.equal(statements.length, 1);
  assert.match(statements[0]!, /^SELECT/i, "the reconstruction boundary has no write query");
  assert.ok(!/\b(INSERT|UPDATE|DELETE|CALL)\b/i.test(statements[0]!), "the reconstruction query is SELECT-only");
});

test("fails closed before source redemption for foreign, cancelled, malformed, and profile-mismatched persisted references", async () => {
  const cases = [
    { label: "foreign", data: fixture(), sqlRows: [] as readonly Record<string, unknown>[] },
    { label: "cancelled", data: fixture(undefined, true) },
    { label: "profile", data: fixture(({ handoff }) => { handoff.packetProfile = identity("foreign-packet"); }) },
    { label: "duplicate selection", data: fixture(({ handoff }) => { handoff.contextOnlyLocators = [handoff.ownedLocators[0]]; }) },
    { label: "deferred owner", data: fixture(({ plan }) => { plan.proposal.inventory[0].classification = "deferred"; plan.proposal.inventory[1].classification = "eligible"; }) },
  ];
  for (const scenario of cases) {
    let redemptions = 0;
    const statements: string[] = [];
    const sql = { unsafe: async (statement: string) => { statements.push(statement); return scenario.sqlRows ?? [scenario.data.row]; } };
    const subject = new PostgresSemanticBatchReconstructionResolver(sql, { resolve: async () => { redemptions += 1; return accepted; } });
    await assert.rejects(() => subject.reconstruct(scope, scenario.data.reference), SemanticBatchReconstructionError, scenario.label);
    assert.equal(redemptions, 0, `${scenario.label} fails before accepted-source redemption`);
    assert.equal(statements.length, 1);
  }
});

test("treats changed source bytes and unavailable accepted source as integrity failures with no fallback", async () => {
  const mismatch = fixture(({ handoff }) => { handoff.sourceSpecificationSha256 = digest("different-packet"); handoff.fitTrace[0].sourceSpecificationSha256 = handoff.sourceSpecificationSha256; });
  let calls = 0;
  const { resolver: subject } = resolver(mismatch, { resolve: async () => { calls += 1; return accepted; } });
  await assert.rejects(() => subject.reconstruct(scope, mismatch.reference), /integrity hash/, "a planned hash mismatch cannot be accepted");
  assert.equal(calls, 1, "the shared builder is reached once and no conversion fallback exists");

  const unavailable = fixture();
  const { resolver: unavailableSubject } = resolver(unavailable, { resolve: async () => { throw new Error("Accepted normalized document is unavailable"); } });
  await assert.rejects(() => unavailableSubject.reconstruct(scope, unavailable.reference), /unavailable/, "an unavailable source is not re-perceived or replaced");
});

test("redeems a real accepted PostgreSQL source and immutable v2 handoff without downstream effects", { skip: !databaseUrl }, async () => {
  const sql = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const root = await mkdtemp(join(tmpdir(), "atlas-semantic-batch-reconstruction-"));
  const suffix = randomUUID();
  const liveScope: AcceptedDocumentResolverScope = { callerUserId: `reconstruction-owner-${suffix}`, callerSessionToken: `reconstruction-session-${suffix}`, projectId: `reconstruction-project-${suffix}`, workspaceId: `reconstruction-workspace-${suffix}`, bundleId: `reconstruction-bundle-${suffix}`, documentId: `reconstruction-document-${suffix}` };
  const liveSource = digest(`reconstruction-source-${suffix}`);
  const executionId = `reconstruction-execution-${suffix}`;
  const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer("i".repeat(32)), undefined, "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1", undefined, new LocalFilesystemDocumentStore(root));
  try {
    await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [liveScope.callerUserId, `${liveScope.callerUserId}@example.test`]);
    await sql.unsafe('INSERT INTO auth."session" (id,"expiresAt",token,"createdAt","updatedAt","userId") VALUES ($1,now()+interval \'5 minutes\',$2,now(),now(),$3)', [`reconstruction-session-id-${suffix}`, liveScope.callerSessionToken, liveScope.callerUserId]);
    await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'reconstruction fixture',$3)", [liveScope.projectId, `reconstruction-${suffix.slice(0, 12)}`, liveScope.callerUserId]);
    await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [liveScope.projectId, liveScope.callerUserId]);
    await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [liveScope.workspaceId, liveScope.projectId]);
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'accepted.pdf',$4,$5,64,'application/pdf',$6)", [liveScope.documentId, liveScope.projectId, liveScope.workspaceId, `private/${suffix}.pdf`, liveSource, liveScope.callerUserId]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [liveScope.bundleId, liveScope.projectId, liveScope.workspaceId]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [liveScope.bundleId, liveScope.documentId, liveScope.projectId, liveScope.workspaceId, executionId]);
    const request = await authority.create({ executionId, artifactId: liveScope.documentId, storageKey: `private/${suffix}.pdf`, sourceSha256: liveSource, mimeType: "application/pdf", byteSize: 64, idempotencyKey: `reconstruction-${suffix}`, capabilityIdentity: "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1" });
    await authority.redeem(request);
    await authority.deliver(request, { version: "v1", executionId, artifactId: liveScope.documentId, sourceSha256: liveSource, perception: request.perception, provider: { name: "docling", processor: "test", executionId, processedAt: "2026-10-20T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "owned", text: "Immutable owned source." }], tables: [{ id: "context", content: "Immutable context table." }], visualRegions: [] }] });
    const fixtureInput = await new PostgresAcceptedSemanticBatchPlanInputFixtureRepository(sql).derive(executionId);
    const acceptedSource = await new PostgresAcceptedSemanticBatchPlanDocumentResolver(sql).resolve(liveScope, fixtureInput.input);
    const liveOwned = { documentId: liveScope.documentId, pageNumber: 1, sourceKind: "text_block" as const, localId: "owned" };
    const liveContext = { documentId: liveScope.documentId, pageNumber: 1, sourceKind: "table" as const, localId: "context" };
    const livePacket = buildStepwiseSourcePacket({ document: acceptedSource.normalizedDocument, ownedLocators: [{ pageNumber: 1, locatorType: "text_block", locatorId: "owned" }], contextOnlyLocators: [{ pageNumber: 1, locatorType: "table", locatorId: "context" }] });
    const livePlan: ImmutableSemanticCorpusPlanInputV2 = { version: "ImmutableSemanticCorpusPlan/v2", scope: acceptedSource.scope, source: { sourceSha256: fixtureInput.input.sourceSha256, normalizedDocumentRef: fixtureInput.input.normalizedDocumentRef, perceptionExecutionId: fixtureInput.input.perceptionExecutionId, normalizedDocumentFingerprint: fixtureInput.input.normalizedDocumentFingerprint, normalizedDocumentVersion: "v1", perceptionCapability: acceptedSource.normalizedDocument.perception.capability, perceptionContractVersion: acceptedSource.normalizedDocument.perception.contractVersion, rel: { state: "unavailable" } }, proposal: { proposalId: `reconstruction-proposal-${suffix}`, proposalHash: digest(`proposal-${suffix}`), sourceHash: digest(`source-${suffix}`), policyHash: digest(`policy-${suffix}`), estimatorHash: digest(`estimator-${suffix}`), structuralBound: { identity: "bound", version: "v1", maxRequestBytes: 4096, maxInputTokens: 1024, maxPromptBytes: 4096, maxContextTokens: 2048 }, bssSnapshot: { source: { sourceId: "capacity", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "semantic", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: identity("estimator") } }, packetProfile: identity("semantic-packet"), estimator: identity("estimator"), configuration: identity("configuration"), eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, inventory: [{ locator: liveOwned, classification: "eligible" }, { locator: liveContext, classification: "deferred", reason: "context_only" }], batches: [{ batchId: "batch-0001", ownedLocators: [liveOwned], contextOnlyLocators: [liveContext], sourceSpecificationSha256: livePacket.sourceSpecificationSha256, packetProfile: identity("semantic-packet"), estimator: identity("estimator"), configuration: identity("configuration"), conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: 100 }, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256: livePacket.sourceSpecificationSha256, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, outcome: "fit" }] }] } };
    const persisted = await new PostgresImmutableSemanticCorpusPlanRepository(atlas as never).persist(livePlan);
    const before = (await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS jobs, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS executions, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidates, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliations", [liveScope.documentId]))[0];
    const handoff = persisted.handoffs[0]!;
    const result = await new PostgresSemanticBatchReconstructionResolver(sql).reconstruct(liveScope, { documentPlanRef: persisted.planId, planHash: persisted.planHash, batchId: handoff.batchId, batchHandoffRef: handoff.handoffId, batchHandoffHash: handoff.handoffHash });
    assert.equal(result.sourceSpecification, livePacket.sourceSpecification, "the read-only persisted replay is byte-identical");
    assert.equal(result.sourceSpecificationSha256, livePacket.sourceSpecificationSha256, "the persisted planned hash matches the rebuilt packet");
    await assert.rejects(() => new PostgresSemanticBatchReconstructionResolver(sql).reconstruct({ ...liveScope, projectId: `foreign-${suffix}` }, { documentPlanRef: persisted.planId, planHash: persisted.planHash, batchId: handoff.batchId, batchHandoffRef: handoff.handoffId, batchHandoffHash: handoff.handoffHash }), SemanticBatchReconstructionError, "a foreign authenticated scope fails closed");
    const after = (await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS jobs, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS executions, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidates, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliations", [liveScope.documentId]))[0];
    assert.deepEqual(after, before, "reconstruction creates no job, BSS admission/reservation, semantic execution, truth, or reconciliation effect");
  } finally {
    await sql.unsafe("DELETE FROM atlas.normalized_document_cache WHERE source_sha256=$1", [liveSource]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [liveScope.projectId]).catch(() => undefined);
    await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [liveScope.callerUserId]).catch(() => undefined);
    await Promise.all([atlas.end(), sql.end(), rm(root, { recursive: true, force: true })]);
  }
});
