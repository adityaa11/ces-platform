import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import test from "node:test";
import { canonicalMultimodalSha256 } from "@atlas/skills";
import { join } from "node:path";
import { tmpdir } from "node:os";
import postgres from "postgres";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { LocalFilesystemDocumentStore } from "@atlas/document-store";
import { PostgresImmutableSemanticCorpusPlanRepository, canonicalImmutableSemanticCorpusPlanV3, replayImmutableSemanticCorpusPlanHashV3, replayPlannedSemanticCorpusHandoffHashV3, type ImmutableSemanticCorpusPlanInputV3 } from "../src/immutable-semantic-corpus-plan.ts";
import { bindSemanticMultimodalReconstructionPolicyV1 } from "../src/semantic-multimodal-reconstruction-policy-binding.ts";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { canonicalSemanticBatchV3Reference, createSemanticBatchV3ReferenceReceivingBoundary, PostgresSemanticBatchV3ReferenceResolver } from "../src/semantic-batch-v3-reference-resolution.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gL+ZK2mXQAAAABJRU5ErkJggg==", "base64");

test("v3 background reference resolution uses persisted PostgreSQL facts and has zero downstream effects", { skip }, async () => {
  const sql = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const root = await mkdtemp(join(tmpdir(), "atlas-v3-reference-resolution-"));
  const suffix = randomUUID();
  const owner = `v3-background-owner-${suffix}`;
  const projectId = `v3-background-project-${suffix}`;
  const workspaceId = `v3-background-workspace-${suffix}`;
  const bundleId = `v3-background-bundle-${suffix}`;
  const documentId = `v3-background-document-${suffix}`;
  const executionId = `v3-background-execution-${suffix}`;
  const sourceSha256 = digest(`v3-background-source-${suffix}`);
  const capabilityIdentity = "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1";
  const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer("i".repeat(32)), undefined, capabilityIdentity, undefined, new LocalFilesystemDocumentStore(root));
  let persisted: { planId: string; planHash: string; handoffs: readonly { batchId: string; handoffId: string; handoffHash: string }[] } | undefined;
  try {
    await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'v3 background fixture',$3)", [projectId, `v3-background-${suffix.slice(0, 12)}`, owner]);
    await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspaceId, projectId]);
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'v3.pdf',$4,$5,$6,'application/pdf',$7)", [documentId, projectId, workspaceId, `private/v3-${suffix}.pdf`, sourceSha256, 64, owner]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [bundleId, projectId, workspaceId]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundleId, documentId, projectId, workspaceId, executionId]);
    const request = await authority.create({ executionId, artifactId: documentId, storageKey: `private/v3-${suffix}.pdf`, sourceSha256, mimeType: "application/pdf", byteSize: 64, idempotencyKey: `v3-background-${suffix}`, capabilityIdentity });
    await authority.redeem(request);
    const assetSha256 = createHash("sha256").update(png).digest("hex");
    const asset = await authority.handoffDerived(request, { sourceSha256, profile: "atlas-digital-pdf-run-003-capture-v1", pageNumber: 1, locatorId: "v3-visual-1", mediaType: "image/png", width: 1, height: 1, byteLength: png.byteLength, sha256: assetSha256 }, png);
    await authority.deliver(request, { version: "v1", executionId, artifactId: documentId, sourceSha256, perception: request.perception, provider: { name: "docling", processor: "run-003-capture", executionId, processedAt: "2026-10-21T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "v3-text-1", text: "bounded persisted source" }], tables: [], visualRegions: [{ id: "v3-visual-1", assetRef: asset.assetRef }] }] });
    const [accepted] = await sql.unsafe("SELECT cache.cache_key, execution.completion_fingerprint FROM atlas.document_perception_execution execution JOIN atlas.normalized_document_cache cache ON cache.source_sha256=execution.source_sha256 AND cache.contract_version='v1' AND cache.capability_identity=execution.capability_identity AND cache.invalidated_at IS NULL WHERE execution.id=$1", [executionId]);
    assert.ok(accepted, "fixture has one accepted persisted source/cache binding");
    const visual = { documentId, pageNumber: 1, sourceKind: "visual_region" as const, localId: "v3-visual-1" };
    const text = { documentId, pageNumber: 1, sourceKind: "text_block" as const, localId: "v3-text-1" };
    const identity = (name: string) => ({ identity: name, version: "v3" });
    const estimatorConfiguration = { estimator: identity("estimator"), configuration: identity("configuration"), inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } };
    const plan: ImmutableSemanticCorpusPlanInputV3 = {
      version: "ImmutableSemanticCorpusPlan/v3",
      scope: { projectId, workspaceId, bundleId, documentId },
      source: { sourceSha256, normalizedDocumentRef: String(accepted!.cache_key), perceptionExecutionId: executionId, normalizedDocumentFingerprint: String(accepted!.completion_fingerprint), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", rel: { state: "unavailable" }, acceptedMedia: [{ assetRef: asset.assetRef, locator: visual, sha256: assetSha256, mediaType: "image/png", byteLength: png.byteLength }] },
      proposal: {
        proposalId: `v3-proposal-${suffix}`, proposalHash: digest(`v3-proposal-${suffix}`), sourceHash: digest(`v3-source-${suffix}`), policyHash: digest(`v3-policy-${suffix}`), estimatorHash: canonicalMultimodalSha256(estimatorConfiguration), manifestSha256: digest(`v3-manifest-${suffix}`),
        structuralBound: { identity: "v3-bound", version: "v3", maxRequestBytes: 4096, maxInputTokens: 1024, maxPromptBytes: 2048, maxContextTokens: 1024 },
        bssSnapshot: { source: { sourceId: "capacity", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "semantic", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: identity("estimator") } },
        packetProfile: identity("packet"), estimator: identity("estimator"), configuration: identity("configuration"), promptIdentity: identity("prompt"), schema: identity("schema"), composer: identity("composer"), route: identity("route"), adapter: identity("adapter"), eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 },
        inventory: [{ locator: visual, classification: "eligible" }, { locator: text, classification: "eligible" }],
        batches: [{ batchId: "batch-0001", ownedLocators: [visual, text], contextOnlyLocators: [], sourceSpecificationSha256: digest(`v3-source-spec-${suffix}`), requestSha256: digest(`v3-request-${suffix}`), manifestSha256: digest(`v3-manifest-${suffix}`), packetProfile: identity("packet"), estimator: identity("estimator"), configuration: identity("configuration"), conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: 100 }, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256: digest(`v3-source-spec-${suffix}`), requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, outcome: "fit" }] }],
      },
    };
    const canonical = canonicalImmutableSemanticCorpusPlanV3(plan);
    const canonicalHandoff = canonical.handoffContents[0]!;
    const canonicalHandoffHash = replayPlannedSemanticCorpusHandoffHashV3(canonicalHandoff);
    const binding = bindSemanticMultimodalReconstructionPolicyV1({
      bindingVersion: "SemanticMultimodalReconstructionPolicyBinding/v1", planRef: `semantic-plan-${canonical.planHash}`, handoffRef: `semantic-handoff-${canonicalHandoffHash}`, planHash: canonical.planHash, handoffHash: canonicalHandoffHash, batchId: "batch-0001", batchSlot: 1,
      identityBinding: { prompt: identity("prompt"), schema: identity("schema"), composer: identity("composer"), route: identity("route"), adapter: identity("adapter") },
      estimatorBinding: { ...estimatorConfiguration, configurationSha256: plan.proposal.estimatorHash, imageTokenPolicy: { identity: "atlas.multimodal-image-grid-estimate", version: "v1", policySha256: digest("image-policy") } },
      routeBinding: { routeId: "route", profileId: "profile", profileVersion: "v1", maxPromptBytes: 2048, image: { version: "v1", mediaTypes: ["image/png"], maxImageCount: 1, maxImageBytes: 1024, maxImageWidth: 64, maxImageHeight: 64 }, imageTpm: { state: "unknown" } },
      serializerBinding: { identity: "anoman.openai-chat.multipart-data-url", version: "v1", model: "model", policySha256: digest("serializer-policy") },
    });
    persisted = await new PostgresImmutableSemanticCorpusPlanRepository(atlas as never).persist(plan, [binding]);
    const handoff = persisted.handoffs[0]!;
    const reference = { documentPlanRef: persisted.planId, planHash: persisted.planHash, batchId: handoff.batchId, batchHandoffRef: handoff.handoffId, batchHandoffHash: handoff.handoffHash };
    const [immutableRows] = await sql.unsafe("SELECT plan.immutable_content AS plan_content, handoff.immutable_content AS handoff_content FROM atlas.semantic_corpus_plan plan JOIN atlas.planned_semantic_corpus_handoff handoff ON handoff.plan_id=plan.id WHERE plan.id=$1 AND handoff.id=$2", [persisted.planId, handoff.handoffId]);
    assert.ok(immutableRows, "fixture has one immutable persisted plan/handoff pair");
    const originalPlanContent = immutableRows!.plan_content;
    const originalHandoffContent = immutableRows!.handoff_content;
    const installImmutableFixture = async (
      planContent: Record<string, unknown>,
      handoffContent: Record<string, unknown>,
      batchId = handoff.batchId,
      batchSlot = 1,
    ) => {
      const planHash = replayImmutableSemanticCorpusPlanHashV3(planContent);
      const replacementHandoff = structuredClone(handoffContent) as Record<string, unknown>;
      replacementHandoff.planHash = planHash;
      replacementHandoff.batchId = batchId;
      replacementHandoff.batchSlot = batchSlot;
      const handoffHash = replayPlannedSemanticCorpusHandoffHashV3(replacementHandoff);
      await sql.begin(async (transaction) => {
        await transaction.unsafe("SET LOCAL session_replication_role = replica");
        await transaction.unsafe("UPDATE atlas.semantic_corpus_plan SET plan_hash=$2, immutable_content=$3::jsonb WHERE id=$1", [persisted!.planId, planHash, planContent]);
        await transaction.unsafe("UPDATE atlas.planned_semantic_corpus_handoff SET batch_id=$2, batch_slot=$3, handoff_hash=$4, immutable_content=$5::jsonb WHERE id=$1", [handoff.handoffId, batchId, batchSlot, handoffHash, replacementHandoff]);
      });
      return { documentPlanRef: persisted!.planId, planHash, batchId, batchHandoffRef: handoff.handoffId, batchHandoffHash: handoffHash };
    };
    const restoreImmutableFixture = () => installImmutableFixture(originalPlanContent, originalHandoffContent);
    const resolver = new PostgresSemanticBatchV3ReferenceResolver(sql);
    const credential = "v".repeat(32);
    const receiver = createSemanticBatchV3ReferenceReceivingBoundary(credential, resolver);
    const body = canonicalSemanticBatchV3Reference(reference);
    const before = (await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS jobs, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS admissions, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS semantic_execution, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE document_id=$1) AS semantic_results, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [documentId]))[0]!;
    await assert.rejects(() => receiver.receive(undefined, "not json"), /unauthorized internal service request/i, "service authentication happens before body parsing");
    const resolved = await receiver.receive(credential, body);
    assert.deepEqual(resolved.scope, { projectId, workspaceId, bundleId, documentId }, "scope comes only from joined persisted Atlas facts");
    assert.deepEqual(resolved.acceptedMedia.map((value) => value.assetRef), [asset.assetRef], "only accepted locator-bound image metadata is returned");
    assert.equal(JSON.stringify(resolved).includes("normalized_document"), false, "no normalized source hydration escapes the resolver");
    await assert.rejects(() => receiver.receive(credential, canonicalSemanticBatchV3Reference({ ...reference, planHash: "f".repeat(64) })), /unavailable|invalid/i, "plan hash mismatch fails closed");
    await sql.unsafe("UPDATE atlas.document SET source_sha256=$2 WHERE id=$1", [documentId, "d".repeat(64)]);
    await assert.rejects(() => receiver.receive(credential, body), /unavailable|invalid/i, "stale or substituted source fails closed");
    await sql.unsafe("UPDATE atlas.document SET source_sha256=$2 WHERE id=$1", [documentId, sourceSha256]);
    await sql.unsafe("UPDATE atlas.normalized_document_cache SET invalidated_at=now() WHERE cache_key=$1", [accepted!.cache_key]);
    await assert.rejects(() => receiver.receive(credential, body), /unavailable|invalid/i, "stale cache fails closed");
    await sql.unsafe("UPDATE atlas.normalized_document_cache SET invalidated_at=NULL WHERE cache_key=$1", [accepted!.cache_key]);
    await sql.unsafe("UPDATE atlas.normalized_document_cache SET contract_version='v2' WHERE cache_key=$1", [accepted!.cache_key]);
    await assert.rejects(() => receiver.receive(credential, body), /inconsistent|invalid/i, "persisted version mismatch fails closed");
    await sql.unsafe("UPDATE atlas.normalized_document_cache SET contract_version='v1' WHERE cache_key=$1", [accepted!.cache_key]);
    await sql.begin(async (transaction) => {
      await transaction.unsafe("SET LOCAL session_replication_role = replica");
      await transaction.unsafe("UPDATE atlas.semantic_corpus_plan SET immutable_content=jsonb_set(immutable_content, '{scope,projectId}', to_jsonb($2::text)) WHERE id=$1", [persisted!.planId, `foreign-project-${suffix}`]);
    });
    await assert.rejects(() => receiver.receive(credential, body), /inconsistent|invalid/i, "persisted scope substitution fails closed");
    await sql.begin(async (transaction) => { await transaction.unsafe("SET LOCAL session_replication_role = replica"); await transaction.unsafe("UPDATE atlas.semantic_corpus_plan SET immutable_content=$2::jsonb WHERE id=$1", [persisted!.planId, originalPlanContent]); });
    const reordered = structuredClone(originalHandoffContent) as { ownedLocators: unknown[] };
    reordered.ownedLocators.reverse();
    await sql.begin(async (transaction) => { await transaction.unsafe("SET LOCAL session_replication_role = replica"); await transaction.unsafe("UPDATE atlas.planned_semantic_corpus_handoff SET immutable_content=$2::jsonb WHERE id=$1", [handoff.handoffId, reordered]); });
    await assert.rejects(() => receiver.receive(credential, body), /unavailable|invalid/i, "reordered persisted locators fail closed through their immutable handoff hash");
    await sql.begin(async (transaction) => { await transaction.unsafe("SET LOCAL session_replication_role = replica"); await transaction.unsafe("UPDATE atlas.planned_semantic_corpus_handoff SET immutable_content=$2::jsonb WHERE id=$1", [handoff.handoffId, originalHandoffContent]); });
    const missingLocatorPlan = structuredClone(originalPlanContent) as Record<string, any>;
    missingLocatorPlan.proposal.inventory = missingLocatorPlan.proposal.inventory.filter((entry: { locator: { localId: string } }) => entry.locator.localId !== text.localId);
    const missingLocatorReference = await installImmutableFixture(missingLocatorPlan, originalHandoffContent);
    await assert.rejects(() => receiver.receive(credential, canonicalSemanticBatchV3Reference(missingLocatorReference)), /foreign|missing|substituted|invalid/i, "missing persisted locator membership fails closed");
    await restoreImmutableFixture();
    const substitutedLocatorHandoff = structuredClone(originalHandoffContent) as Record<string, any>;
    substitutedLocatorHandoff.ownedLocators[1] = { ...substitutedLocatorHandoff.ownedLocators[1], localId: "v3-substituted-locator" };
    const substitutedLocatorReference = await installImmutableFixture(originalPlanContent, substitutedLocatorHandoff);
    await assert.rejects(() => receiver.receive(credential, canonicalSemanticBatchV3Reference(substitutedLocatorReference)), /foreign|missing|substituted|invalid/i, "substituted persisted locator membership fails closed");
    await restoreImmutableFixture();
    const corruptInventoryPlan = structuredClone(originalPlanContent) as Record<string, any>;
    corruptInventoryPlan.proposal.inventory.find((entry: { locator: { localId: string } }) => entry.locator.localId === text.localId).classification = "deferred";
    const corruptInventoryReference = await installImmutableFixture(corruptInventoryPlan, originalHandoffContent);
    await assert.rejects(() => receiver.receive(credential, canonicalSemanticBatchV3Reference(corruptInventoryReference)), /foreign|missing|substituted|invalid/i, "corrupt persisted inventory membership fails closed");
    await restoreImmutableFixture();
    const invalidBatchReference = await installImmutableFixture(originalPlanContent, originalHandoffContent, "batch-0002", 2);
    await assert.rejects(() => receiver.receive(credential, canonicalSemanticBatchV3Reference(invalidBatchReference)), /membership|order|invalid/i, "invalid persisted batch membership and order fail closed");
    await restoreImmutableFixture();
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET accepted_at=NULL WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef]);
    await assert.rejects(() => receiver.receive(credential, body), /missing|substituted|invalid/i, "missing accepted image fails closed");
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET accepted_at=now() WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef]);
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET sha256=$3 WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef, "c".repeat(64)]);
    await assert.rejects(() => receiver.receive(credential, body), /missing|substituted|invalid/i, "substituted accepted image fails closed");
    await sql.unsafe("UPDATE atlas.document_perception_derived_manifest SET sha256=$3 WHERE execution_id=$1 AND asset_ref=$2", [executionId, asset.assetRef, assetSha256]);
    await sql.unsafe("UPDATE atlas.document_perception_execution SET completion_fingerprint=$2 WHERE id=$1", [executionId, "e".repeat(64)]);
    await assert.rejects(() => receiver.receive(credential, body), /inconsistent|invalid/i, "changed accepted fingerprint fails closed");
    await sql.unsafe("UPDATE atlas.document_perception_execution SET completion_fingerprint=$2 WHERE id=$1", [executionId, accepted!.completion_fingerprint]);
    await sql.unsafe("INSERT INTO atlas.semantic_corpus_plan_cancellation (plan_id,reason) VALUES ($1,'fixture cancellation')", [persisted.planId]);
    await assert.rejects(() => receiver.receive(credential, body), /cancelled|invalid/i, "cancelled immutable plan fails closed");
    const after = (await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS jobs, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS admissions, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS attempts, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS semantic_execution, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE document_id=$1) AS semantic_results, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [documentId]))[0]!;
    assert.deepEqual(after, before, "background resolution neither hydrates nor creates GHR, BSS, SEM, or reconciliation effects");
  } finally {
    if (persisted) await sql.begin(async (transaction) => { await transaction.unsafe("SET LOCAL session_replication_role = replica"); await transaction.unsafe("DELETE FROM atlas.semantic_corpus_plan_cancellation WHERE plan_id=$1", [persisted!.planId]); await transaction.unsafe("DELETE FROM atlas.semantic_multimodal_reconstruction_policy_binding WHERE plan_id=$1", [persisted!.planId]); await transaction.unsafe("DELETE FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1", [persisted!.planId]); await transaction.unsafe("DELETE FROM atlas.semantic_corpus_plan WHERE id=$1", [persisted!.planId]); });
    await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [projectId]).catch(() => undefined);
    await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined);
    await atlas.end(); await sql.end(); await rm(root, { recursive: true, force: true });
  }
});
