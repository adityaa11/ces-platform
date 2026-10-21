import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import { canonicalMultimodalSha256 } from "@atlas/skills";
import postgres from "postgres";
import { ImmutableSemanticCorpusPlanError, PostgresImmutableSemanticCorpusPlanRepository, canonicalImmutableSemanticCorpusPlanV1, canonicalImmutableSemanticCorpusPlanV2, canonicalImmutableSemanticCorpusPlanV3, replayImmutableSemanticCorpusPlanHashV1, replayPlannedSemanticCorpusHandoffHashV3, type ImmutableSemanticCorpusPlanInputV1, type ImmutableSemanticCorpusPlanInputV2, type ImmutableSemanticCorpusPlanInputV3 } from "../src/immutable-semantic-corpus-plan.ts";
import { bindSemanticMultimodalReconstructionPolicyV1 } from "../src/semantic-multimodal-reconstruction-policy-binding.ts";

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
const inputV2 = (suffix: string, proposalId = `proposal-v2-${suffix}`, predecessor?: Readonly<{ planId: string; planHash: string }>): ImmutableSemanticCorpusPlanInputV2 => {
  const one = { documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "text_block" as const, localId: "one" };
  const two = { documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "table" as const, localId: "two" };
  const sourceSpecificationSha256 = sha(`v2-packet-${suffix}`);
  const profile = { identity: "semantic-packet", version: "v2" };
  const estimator = { identity: "estimator", version: "v2" };
  const configuration = { identity: "sem-configuration", version: "v2" };
  const batch = (batchId: string, ownedLocator: typeof one | typeof two, packet: string, requestBytes: number) => ({
    batchId, ownedLocators: [ownedLocator], contextOnlyLocators: [], sourceSpecificationSha256: packet, packetProfile: profile, estimator, configuration,
    conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1" as const, value: requestBytes }, requestBytes, inputTokens: 6, reservedOutputTokens: 4,
    requestResourceEnvelope: { requestUnits: 1, tokenUnits: 6, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256: packet, requestBytes, inputTokens: 6, reservedOutputTokens: 4, outcome: "fit" as const }],
  });
  return {
    version: "ImmutableSemanticCorpusPlan/v2",
    scope: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}` },
    source: { sourceSha256: sha(`source-${suffix}`), normalizedDocumentRef: `cache-${suffix}`, perceptionExecutionId: `execution-${suffix}`, normalizedDocumentFingerprint: sha(`fingerprint-${suffix}`), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", rel: { state: "unavailable" } },
    proposal: {
      proposalId, proposalHash: sha(`proposal-v2-${suffix}`), sourceHash: sha(`source-v2-${suffix}`), policyHash: sha(`policy-v2-${suffix}`), estimatorHash: sha(`estimator-v2-${suffix}`),
      structuralBound: { identity: "semantic-bound", version: "v2", maxRequestBytes: 4096, maxInputTokens: 1024, maxPromptBytes: 4096, maxContextTokens: 2048 },
      bssSnapshot: { source: { sourceId: "anoman-capacity-source", sourceVersion: "v1" }, enforcement: { policyId: "anoman-semantic", policyVersion: "v1" }, process: { profileId: "semantic-process", profileVersion: "v1" }, workload: { planId: "semantic-workload", planVersion: "v1", estimator } },
      packetProfile: profile, estimator, configuration, eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 2, tokenUnits: 12, dayUnits: 2, concurrencyUnits: 2 },
      inventory: [{ locator: one, classification: "eligible" as const }, { locator: two, classification: "eligible" as const }, { locator: { documentId: `document-${suffix}`, pageNumber: 1, sourceKind: "visual_region" as const, localId: "visual" }, classification: "unexamined" as const, reason: "image_accounting_unavailable" }],
      batches: [batch("batch-0001", one, sourceSpecificationSha256, 100), batch("batch-0002", two, sha(`v2-packet-two-${suffix}`), 101)],
      ...(predecessor ? { replanPredecessor: predecessor } : {}),
    },
  };
};

const inputV3 = (suffix: string, proposalId = `proposal-v3-${suffix}`, predecessor?: Readonly<{ planId: string; planHash: string }>): ImmutableSemanticCorpusPlanInputV3 => {
  const v2 = inputV2(suffix, proposalId, predecessor);
  const estimatorConfiguration = { estimator: v2.proposal.estimator, configuration: v2.proposal.configuration, inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: 4, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } };
  const manifestSha256 = sha(`v3-manifest-${suffix}`);
  const promptIdentity = { identity: "semantic-prompt", version: "v3" };
  const schema = { identity: "semantic-schema", version: "v3" };
  const composer = { identity: "semantic-composer", version: "v3" };
  const route = { identity: "semantic-route", version: "v3" };
  const adapter = { identity: "semantic-adapter", version: "v3" };
  return {
    version: "ImmutableSemanticCorpusPlan/v3", scope: v2.scope, source: { ...v2.source, acceptedMedia: [] },
    proposal: {
      ...v2.proposal, estimatorHash: canonicalMultimodalSha256(estimatorConfiguration), manifestSha256, promptIdentity, schema, composer, route, adapter,
      batches: v2.proposal.batches.map((batch, index) => ({ ...batch, requestSha256: sha(`v3-request-${suffix}-${index}`), manifestSha256 })),
      ...(predecessor ? { replanPredecessor: { ...predecessor, cancellationPlanId: predecessor.planId } } : {}),
    },
  };
};

const policyBindingsV3 = (plan: ImmutableSemanticCorpusPlanInputV3) => {
  const canonical = canonicalImmutableSemanticCorpusPlanV3(plan);
  return canonical.handoffContents.map((content, index) => {
    const handoff = content as Record<string, any>;
    const handoffHash = replayPlannedSemanticCorpusHandoffHashV3(content);
    return bindSemanticMultimodalReconstructionPolicyV1({
      bindingVersion: "SemanticMultimodalReconstructionPolicyBinding/v1", planRef: `semantic-plan-${canonical.planHash}`, handoffRef: `semantic-handoff-${handoffHash}`, planHash: canonical.planHash, handoffHash, batchId: handoff.batchId, batchSlot: index + 1,
      identityBinding: { prompt: plan.proposal.promptIdentity, schema: plan.proposal.schema, composer: plan.proposal.composer, route: plan.proposal.route, adapter: plan.proposal.adapter },
      estimatorBinding: { estimator: plan.proposal.estimator, configuration: plan.proposal.configuration, configurationSha256: plan.proposal.estimatorHash, inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: handoff.reservedOutputTokens, requestResourceEnvelope: { requestUnits: handoff.requestResourceEnvelope.requestUnits, dayUnits: handoff.requestResourceEnvelope.dayUnits, concurrencyUnits: handoff.requestResourceEnvelope.concurrencyUnits }, imageTokenPolicy: { identity: "atlas.multimodal-image-grid-estimate", version: "v1", policySha256: sha("image-policy") } },
      routeBinding: { routeId: "route", profileId: "profile", profileVersion: "v1", maxPromptBytes: 4096, image: { version: "v1", mediaTypes: ["image/png"], maxImageCount: 1, maxImageBytes: 1024, maxImageWidth: 64, maxImageHeight: 64 }, imageTpm: { state: "unknown" } },
      serializerBinding: { identity: "anoman.openai-chat.multipart-data-url", version: "v1", model: "model", policySha256: sha("serializer-policy") },
    });
  });
};

const canonicalMedia = (assetRef = "derived/01234567-89ab-cdef-0123-456789abcdef") => ({
  assetRef,
  locatorId: "deferred",
  pageNumber: 1,
  mediaType: "image/png" as const,
  sha256: sha("media-fixture"),
  byteLength: 1,
});
const withMedia = (suffix: string, assetRef?: string): ImmutableSemanticCorpusPlanInputV1 => {
  const plan = input(suffix);
  return { ...plan, source: { ...plan.source, media: [canonicalMedia(assetRef)] } };
};

const assertMediaInvalid = (plan: ImmutableSemanticCorpusPlanInputV1) => {
  assert.throws(
    () => canonicalImmutableSemanticCorpusPlanV1(plan),
    (error: unknown) => error instanceof ImmutableSemanticCorpusPlanError && error.message === "Semantic corpus media metadata is invalid.",
  );
};

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
    await transaction.unsafe("DELETE FROM atlas.semantic_multimodal_reconstruction_policy_binding WHERE plan_id IN (SELECT id FROM atlas.semantic_corpus_plan WHERE project_id=$1)", [plan.scope.projectId]);
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

test("canonicalizes exact derived media references without rewriting metadata", () => {
  const plan = withMedia("canonical-media");
  const canonical = canonicalImmutableSemanticCorpusPlanV1(plan);
  const replay = canonicalImmutableSemanticCorpusPlanV1(plan);
  const content = canonical.planContent as { source: { media: unknown } };

  assert.deepEqual(content.source.media, plan.source.media, "canonical content retains every supplied media value exactly");
  assert.equal(replayImmutableSemanticCorpusPlanHashV1(canonical.planContent), canonical.planHash, "stored-style immutable content replays its hash");
  assert.deepEqual(replay, canonical, "the same nonempty media input remains deterministic");
  assert.doesNotThrow(() => canonicalImmutableSemanticCorpusPlanV1(input("zero-media")), "the existing zero-media baseline remains valid");
});

test("rejects malformed media references and retains existing media and opaque identity fences", () => {
  const valid = withMedia("media-negative");
  const uuid = "01234567-89ab-cdef-0123-456789abcdef";
  const malformedRefs = [
    uuid,
    "derived",
    "derived/",
    `derived//${uuid}`,
    `derivedx/${uuid}`,
    `Derived/${uuid}`,
    `derived/${uuid.toUpperCase()}`,
    "derived/01234567-89ab-cdef-0123-456789abcde",
    "derived/01234567-89ab-cdef-0123-456789abcdef0",
    "derived/0123456789ab-cdef-0123-456789abcdef",
    "derived/01234567-89ab-cdef-0123-456789abcdeg",
    ` derived/${uuid}`,
    `derived/${uuid} `,
    `derived/${uuid}?query=1`,
    `derived/${uuid}#fragment`,
    `https://example.test/derived/${uuid}`,
    `derived%2F${uuid}`,
    `derived/../${uuid}`,
    `derived\\${uuid}`,
  ];
  for (const assetRef of malformedRefs) {
    assertMediaInvalid({ ...valid, source: { ...valid.source, media: [canonicalMedia(assetRef)] } });
  }

  assertMediaInvalid({ ...valid, source: { ...valid.source, media: [{ ...canonicalMedia(), locatorId: "invalid/locator" }] } });
  assertMediaInvalid({ ...valid, source: { ...valid.source, media: [{ ...canonicalMedia(), pageNumber: 0 }] } });
  assertMediaInvalid({ ...valid, source: { ...valid.source, media: [{ ...canonicalMedia(), mediaType: "image/jpeg" as never }] } });
  assertMediaInvalid({ ...valid, source: { ...valid.source, media: [{ ...canonicalMedia(), sha256: "not-a-sha" }] } });
  assertMediaInvalid({ ...valid, source: { ...valid.source, media: [{ ...canonicalMedia(), byteLength: 0 }] } });
  assert.throws(
    () => canonicalImmutableSemanticCorpusPlanV1({ ...valid, scope: { ...valid.scope, documentId: "document/with-slash" } }),
    ImmutableSemanticCorpusPlanError,
    "unrelated opaque identities remain fail-closed",
  );
});

test("persists exact canonical media metadata immutably with no forbidden side effects", { skip: "v1 writer retired by IDSER-012-05-03-02" }, async () => {
  const sql = postgres(databaseUrl!, { max: 4 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 2 });
  const suffix = randomUUID();
  const plan = withMedia(suffix, `derived/${randomUUID()}`);
  const invalidPlan = withMedia(`invalid-media-${suffix}`, "derived/not-a-uuid");
  let owner = "";
  let invalidOwner = "";
  try {
    owner = await fixture(sql, plan);
    invalidOwner = await fixture(sql, invalidPlan);
    const repository = new PostgresImmutableSemanticCorpusPlanRepository(atlas as any);
    const [baseline] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS ghr_or_queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS sem, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidate, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [plan.scope.documentId]);
    const [first, simultaneousRetry] = await Promise.all([repository.persist(plan), repository.persist(plan)]);
    assert.deepEqual(simultaneousRetry, first, "concurrent canonical-media claims collapse to the same immutable plan and handoffs");
    const replay = await repository.persist(plan);
    assert.deepEqual(replay, first, "restart-style exact retry returns the existing parent and handoff identities");
    const [persistedCounts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1) AS handoffs", [first.planId]);
    assert.deepEqual({ plans: Number(persistedCounts!.plans), handoffs: Number(persistedCounts!.handoffs) }, { plans: 1, handoffs: 2 }, "the N=2 canonical-media fixture creates one actual plan and two actual handoff rows");
    const [stored] = await sql.unsafe("SELECT immutable_content FROM atlas.semantic_corpus_plan WHERE id=$1", [first.planId]);
    assert.deepEqual((stored!.immutable_content as { source: { media: unknown } }).source.media, plan.source.media, "PostgreSQL retains the exact nonempty media metadata");
    assert.equal(replayImmutableSemanticCorpusPlanHashV1(stored!.immutable_content), first.planHash, "stored immutable content replays the returned parent hash");

    const changedMedia = withMedia(suffix, `derived/${randomUUID()}`);
    await assert.rejects(() => repository.persist(changedMedia), /conflicts with an immutable prior version/, "a changed media reference cannot rewrite a prior immutable plan");
    await assert.rejects(() => repository.persist(invalidPlan), /Semantic corpus media metadata is invalid/, "malformed media is rejected before persistence");
    const [invalidCounts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE project_id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff handoff JOIN atlas.semantic_corpus_plan plan ON plan.id=handoff.plan_id WHERE plan.project_id=$1) AS handoffs", [invalidPlan.scope.projectId]);
    assert.deepEqual({ plans: Number(invalidCounts!.plans), handoffs: Number(invalidCounts!.handoffs) }, { plans: 0, handoffs: 0 }, "invalid media creates no plan or handoff rows");
    const [after] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS ghr_or_queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS sem, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidate, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [plan.scope.documentId]);
    assert.deepEqual({ ghrOrQueue: Number(after!.ghr_or_queue), bssWork: Number(after!.bss_work), bssAttempt: Number(after!.bss_attempt), bssReservation: Number(after!.bss_reservation), sem: Number(after!.sem), candidate: Number(after!.candidate), reconciliation: Number(after!.reconciliation) }, { ghrOrQueue: Number(baseline!.ghr_or_queue), bssWork: Number(baseline!.bss_work), bssAttempt: Number(baseline!.bss_attempt), bssReservation: Number(baseline!.bss_reservation), sem: Number(baseline!.sem), candidate: Number(baseline!.candidate), reconciliation: Number(baseline!.reconciliation) }, "canonical media persistence causes zero forbidden downstream-effect deltas");
  } finally {
    try { if (invalidOwner) await cleanup(sql, invalidPlan, invalidOwner); } finally { try { if (owner) await cleanup(sql, plan, owner); } finally { await atlas.end(); await sql.end(); } }
  }
});

test("atomically persists immutable plans and batch handoffs with replay, recovery, ancestry, and zero forbidden effects", { skip: "v1 writer retired by IDSER-012-05-03-02" }, async () => {
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

test("rejects incomplete ownership and rolls back a crash before any partial completed plan is visible", { skip: "v1 writer retired by IDSER-012-05-03-02" }, async () => {
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

test("v2 persists one immutable locator-only parent and N strict handoffs atomically", { skip: "v2 writer retired by IDSER-012-05-03-02" }, async () => {
  const sql = postgres(databaseUrl!, { max: 4 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 2 });
  const suffix = randomUUID(); const plan = inputV2(suffix); let owner = "";
  try {
    owner = await fixture(sql, plan as unknown as ImmutableSemanticCorpusPlanInputV1);
    const repository = new PostgresImmutableSemanticCorpusPlanRepository(atlas as any);
    const [before] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS sem, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidate, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [plan.scope.documentId]);
    await sql.unsafe("CREATE OR REPLACE FUNCTION atlas.idser012_v2_plan_crash() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'controlled v2 plan crash'; END; $$");
    await sql.unsafe("CREATE TRIGGER idser012_v2_plan_crash BEFORE INSERT ON atlas.planned_semantic_corpus_handoff FOR EACH ROW EXECUTE FUNCTION atlas.idser012_v2_plan_crash()");
    await assert.rejects(() => repository.persistV2(plan), /controlled v2 plan crash/, "a child-insert crash rejects the entire v2 transaction");
    await sql.unsafe("DROP TRIGGER idser012_v2_plan_crash ON atlas.planned_semantic_corpus_handoff"); await sql.unsafe("DROP FUNCTION atlas.idser012_v2_plan_crash()");
    const [rolledBack] = await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE project_id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff handoff JOIN atlas.semantic_corpus_plan plan ON plan.id=handoff.plan_id WHERE plan.project_id=$1) AS handoffs", [plan.scope.projectId]);
    assert.deepEqual({ plans: Number(rolledBack!.plans), handoffs: Number(rolledBack!.handoffs) }, { plans: 0, handoffs: 0 }, "a v2 failure leaves no partial parent or handoff");
    for (const version of ["ImmutableSemanticCorpusPlan/v3", "ImmutableSemanticCorpusPlan/future"]) {
      await assert.rejects(() => repository.persist({ ...plan, version } as any), ImmutableSemanticCorpusPlanError, `${version} is rejected before a transaction starts`);
    }
    const [unknownVersionCounts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE project_id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff handoff JOIN atlas.semantic_corpus_plan plan ON plan.id=handoff.plan_id WHERE plan.project_id=$1) AS handoffs", [plan.scope.projectId]);
    assert.deepEqual({ plans: Number(unknownVersionCounts!.plans), handoffs: Number(unknownVersionCounts!.handoffs) }, { plans: 0, handoffs: 0 }, "unknown versions create no immutable parent or handoff rows");
    const [first, replay] = await Promise.all([repository.persist(plan), repository.persist(plan)]);
    assert.deepEqual(replay, first, "concurrent v2 replay returns the one committed parent/child set");
    const [storedPlan] = await sql.unsafe("SELECT immutable_content FROM atlas.semantic_corpus_plan WHERE id=$1", [first.planId]);
    const stored = storedPlan!.immutable_content as { version: string; proposal: { inventory: unknown[] } };
    assert.equal(stored.version, "ImmutableSemanticCorpusPlan/v2");
    assert.equal(stored.proposal.inventory.length, 3, "parent retains explicit eligible/deferred/unexamined locator inventory only");
    assert.equal(canonicalImmutableSemanticCorpusPlanV2(plan).planHash, first.planHash, "stored v2 parent uses the strict canonical hash");
    const handoffs = await sql.unsafe("SELECT immutable_content FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1 ORDER BY batch_slot", [first.planId]);
    assert.equal(handoffs.length, 2, "one parent creates exactly N immutable v2 handoffs");
    for (const row of handoffs) {
      const content = row.immutable_content as { version: string; sourceSpecificationSha256: string; conservativeLogicalRequestBytes: unknown; reservedOutputTokens: number };
      assert.equal(content.version, "PlannedSemanticCorpusHandoff/v2");
      assert.match(content.sourceSpecificationSha256, /^[a-f0-9]{64}$/);
      assert.deepEqual(content.conservativeLogicalRequestBytes && Object.keys(content.conservativeLogicalRequestBytes as object).sort(), ["value", "version"]);
      assert.equal(content.reservedOutputTokens, 4);
    }
    await assert.rejects(() => atlas.unsafe("UPDATE atlas.semantic_corpus_plan SET proposal_id='rewrite' WHERE id=$1", [first.planId]), /immutable/);
    await repository.cancel(first.planId, "v2 source revision");
    const replacement = inputV2(suffix, `replacement-${suffix}`, { planId: first.planId, planHash: first.planHash });
    replacement.proposal.proposalHash = sha(`replacement-proposal-${suffix}`) as never;
    replacement.proposal.policyHash = sha(`replacement-policy-${suffix}`) as never;
    const replanned = await repository.persistV2(replacement);
    assert.notEqual(replanned.planId, first.planId, "a cancelled v2 plan has an append-only v2 successor");
    const [after] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS sem, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$1) AS candidate, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$1) AS reconciliation", [plan.scope.documentId]);
    assert.deepEqual(after, before, "v2 persistence has zero GHR, BSS, SEM, acceptance, reconciliation, Master, or CES effects");
  } finally { try { await sql.unsafe("DROP TRIGGER IF EXISTS idser012_v2_plan_crash ON atlas.planned_semantic_corpus_handoff"); await sql.unsafe("DROP FUNCTION IF EXISTS atlas.idser012_v2_plan_crash()"); if (owner) await cleanup(sql, plan as unknown as ImmutableSemanticCorpusPlanInputV1, owner); } finally { await atlas.end(); await sql.end(); } }
});

test("v3 atomically persists references-only commitments with policy sidecars, idempotency, cancellation ancestry, and no dispatch", { skip: !databaseUrl }, async () => {
  const sql = postgres(databaseUrl!, { max: 4 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 2 });
  const suffix = randomUUID(); const plan = inputV3(suffix); let owner = "";
  try {
    owner = await fixture(sql, plan as unknown as ImmutableSemanticCorpusPlanInputV1);
    const repository = new PostgresImmutableSemanticCorpusPlanRepository(atlas as any);
    const [baseline] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS sem", [plan.scope.documentId]);
    await sql.unsafe("CREATE OR REPLACE FUNCTION atlas.idser012_v3_plan_crash() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'controlled v3 plan crash'; END; $$");
    await sql.unsafe("CREATE TRIGGER idser012_v3_plan_crash BEFORE INSERT ON atlas.planned_semantic_corpus_handoff FOR EACH ROW EXECUTE FUNCTION atlas.idser012_v3_plan_crash()");
    await assert.rejects(() => repository.persistV3(plan, policyBindingsV3(plan)), /controlled v3 plan crash/);
    await sql.unsafe("DROP TRIGGER idser012_v3_plan_crash ON atlas.planned_semantic_corpus_handoff"); await sql.unsafe("DROP FUNCTION atlas.idser012_v3_plan_crash()");
    const [rolledBack] = await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_corpus_plan WHERE project_id=$1) AS plans, (SELECT count(*)::int FROM atlas.planned_semantic_corpus_handoff handoff JOIN atlas.semantic_corpus_plan plan ON plan.id=handoff.plan_id WHERE plan.project_id=$1) AS handoffs", [plan.scope.projectId]);
    assert.deepEqual({ plans: Number(rolledBack!.plans), handoffs: Number(rolledBack!.handoffs) }, { plans: 0, handoffs: 0 }, "a child failure leaves no partial v3 parent or handoff");
    const [first, replay] = await Promise.all([repository.persistV3(plan, policyBindingsV3(plan)), repository.persistV3(plan, policyBindingsV3(plan))]);
    assert.deepEqual(replay, first, "simultaneous v3 retries return the same immutable parent and children");
    assert.deepEqual(await repository.persist(plan, policyBindingsV3(plan)), first, "the version dispatcher preserves v3 idempotency");
    const [storedPlan] = await sql.unsafe("SELECT immutable_content FROM atlas.semantic_corpus_plan WHERE id=$1", [first.planId]);
    const children = await sql.unsafe("SELECT immutable_content FROM atlas.planned_semantic_corpus_handoff WHERE plan_id=$1 ORDER BY batch_slot", [first.planId]);
    assert.equal((storedPlan!.immutable_content as { version: string }).version, "ImmutableSemanticCorpusPlan/v3");
    assert.equal(children.length, plan.proposal.batches.length);
    const sidecars = await sql.unsafe("SELECT binding_sha256 FROM atlas.semantic_multimodal_reconstruction_policy_binding WHERE plan_id=$1 ORDER BY batch_slot", [first.planId]);
    assert.equal(sidecars.length, plan.proposal.batches.length, "each committed v3 handoff has one same-transaction immutable policy binding");
    const persisted = JSON.stringify([storedPlan!.immutable_content, ...children.map((row) => row.immutable_content)]);
    for (const forbidden of ["rawRequest", "promptBody", "schemaBody", "sourceText", "mediaBytes", "base64", "adapterJson", "providerResponse", "credentials"]) assert.equal(persisted.includes(forbidden), false, `${forbidden} is not stored`);
    assert.equal(canonicalImmutableSemanticCorpusPlanV3(plan).planHash, first.planHash, "the DB row has the rederivable v3 commitment hash");
    await repository.cancel(first.planId, "v3 source revision");
    const successor = inputV3(suffix, `replan-v3-${suffix}`, { planId: first.planId, planHash: first.planHash });
    successor.proposal.proposalHash = sha(`replan-v3-proposal-${suffix}`) as never;
    const next = await repository.persistV3(successor, policyBindingsV3(successor));
    const [ancestry] = await sql.unsafe("SELECT predecessor_plan_id, predecessor_plan_hash FROM atlas.semantic_corpus_plan WHERE id=$1", [next.planId]);
    assert.deepEqual({ planId: ancestry!.predecessor_plan_id, planHash: ancestry!.predecessor_plan_hash }, { planId: first.planId, planHash: first.planHash }, "v3 retains only the cancelled predecessor identity");
    const [after] = await sql.unsafe("SELECT (SELECT count(*)::int FROM pgboss.job) AS queue, (SELECT count(*)::int FROM bridge.provider_work_admission_v1) AS bss_work, (SELECT count(*)::int FROM bridge.provider_work_attempt) AS bss_attempt, (SELECT count(*)::int FROM bridge.provider_work_reservation) AS bss_reservation, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$1) AS sem", [plan.scope.documentId]);
    assert.deepEqual(after, baseline, "v3 persistence creates no queue, BSS admission, provider, or semantic execution effect");
  } finally { try { await sql.unsafe("DROP TRIGGER IF EXISTS idser012_v3_plan_crash ON atlas.planned_semantic_corpus_handoff"); await sql.unsafe("DROP FUNCTION IF EXISTS atlas.idser012_v3_plan_crash()"); if (owner) await cleanup(sql, plan as unknown as ImmutableSemanticCorpusPlanInputV1, owner); } finally { await atlas.end(); await sql.end(); } }
});
