import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { canonicalSemanticFingerprint, PostgresSemanticAuthority } from "../src/semantic-authority.ts";
import { PostgresExtractionAcceptanceHandler } from "../src/extraction-acceptance.ts";
import { PostgresSemanticCandidateRepository } from "../src/semantic-candidate-repository.ts";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { createTransactionalQueueProducer } from "../../../apps/agents-bridge/src/queue.ts";

const databaseUrl = process.env.DATABASE_URL;
type Queued = { idempotencyKey: string; execution: { skill: { id: string }; executionId: string } };
type Queue = { jobs: Queued[]; fail: boolean; enqueue(_transaction: unknown, job: Queued): Promise<string | null> };
const makeQueue = (): Queue => ({ jobs: [], fail: false, async enqueue(_transaction, job) { if (this.fail) throw new Error("controlled queue failure"); this.jobs.push(job); return `job-${this.jobs.length}`; } });

const normalized = (executionId: string, documentId: string, sourceSha256: string) => ({
  version: "v1", executionId, artifactId: documentId, sourceSha256,
  perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
  provider: { name: "test", processor: "test", executionId, processedAt: "2026-09-29T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [{ id: "block-1", text: "The customer approves an order." }], tables: [{ id: "table-1", content: "Status | Approved" }], visualRegions: [{ id: "visual-1", label: "Approval flow" }] }],
});

const extractionResult = () => ({
  version: "v1",
  candidate_assertions: [
    { local_candidate_id: "candidate-order", semantic_key: "order.approval", kind: "rule", payload: { status: "approved" }, normalized_meaning: "A customer approves an order.", source_wording: "The customer approves an order.", needs_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-1", excerpt: "customer approves" }] },
    { local_candidate_id: "candidate-flow", semantic_key: "order.approval-flow", kind: "workflow_step", payload: { state: "approved" }, normalized_meaning: "Approval is shown in the status table and flow.", needs_resolution: true, evidence_refs: [{ page_number: 1, locator_type: "table", locator_id: "table-1", excerpt: "Status | Approved" }, { page_number: 1, locator_type: "visual_region", locator_id: "visual-1" }] },
  ],
  source_statement_inventory: [
    { source_unit_id: "source-block", page_number: 1, locator_type: "text_block", locator_id: "block-1", classification: "candidate", destination_local_candidate_ids: ["candidate-order"] },
    { source_unit_id: "source-table", page_number: 1, locator_type: "table", locator_id: "table-1", classification: "candidate", destination_local_candidate_ids: ["candidate-flow"] },
    { source_unit_id: "source-visual", page_number: 1, locator_type: "visual_region", locator_id: "visual-1", classification: "candidate", destination_local_candidate_ids: ["candidate-flow"] },
  ],
  questions: [{ question: "Does approval require a second reviewer?", reason: "The flow is incomplete.", evidence_refs: [{ page_number: 1, locator_type: "visual_region", locator_id: "visual-1" }] }],
});

test("IDSER-006 materializes only validated extraction state, replays atomically, and exposes bounded scoped reads", { skip: !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const atlasSecond = postgres(atlasUrl.toString(), { max: 1 });
  const suffix = randomUUID(); const project = `idser006-project-${suffix}`; const workspace = `idser006-workspace-${suffix}`; const bundle = `idser006-bundle-${suffix}`; const document = `idser006-document-${suffix}`; const perception = `idser006-perception-${suffix}`; const extraction = `idser006-extraction-${suffix}`; const owner = `idser006-owner-${suffix}`; const sha = createHash("sha256").update(suffix).digest("hex");
  const scope = { projectId: project, workspaceId: workspace, bundleId: bundle, documentId: document, executionId: extraction, contractVersion: "v1" };
  const isolatedProject = `idser006-isolated-project-${suffix}`; const isolatedWorkspace = `idser006-isolated-workspace-${suffix}`; const isolatedBundle = `idser006-isolated-bundle-${suffix}`; const isolatedDocument = `idser006-isolated-document-${suffix}`; const isolatedPerception = `idser006-isolated-perception-${suffix}`; const isolatedExecution = `idser006-isolated-extraction-${suffix}`;
  const seed = async () => {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'IDSER-006',$3)", [project, `idser006-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Initial Draft')", [workspace, project]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf','private/source',$4,1,'application/pdf',$5)", [document, project, workspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [bundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/source',$3,'application/pdf',1,'v1','completed',$4,'idser006-capability')", [perception, document, sha, `idser006-perception-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id,semantic_extraction_execution_id) VALUES ($1,$2,$3,$4,1,'extracting',$5,$6)", [bundle, document, project, workspace, perception, extraction]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'queued','perception',$6,now()+interval '1 hour')", [extraction, project, workspace, bundle, document, canonicalSemanticFingerprint("capability")]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','idser006-capability',$3::jsonb)", [`idser006-cache-${suffix}`, sha, JSON.stringify(normalized(perception, document, sha))]);
  };
  const envelope = { version: "v1", scope, skill: { id: "atlas.semantic.extract", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: extractionResult() };
  try {
    await seed();
    const queue = makeQueue(); const authority = new PostgresSemanticAuthority(atlas); const handler = new PostgresExtractionAcceptanceHandler(queue);
    await authority.deliver(envelope, handler);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [extraction]))[0].count, 1);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate WHERE extraction_result_id=(SELECT id FROM atlas.semantic_extraction_result WHERE execution_id=$1)", [extraction]))[0].count, 2);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_evidence WHERE semantic_candidate_id IN (SELECT id FROM atlas.semantic_candidate WHERE extraction_result_id=(SELECT id FROM atlas.semantic_extraction_result WHERE execution_id=$1))", [extraction]))[0].count, 3);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.knowledge_index WHERE bundle_id=$1 AND document_id=$2", [bundle, document]))[0].count, 2);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate_identity_map WHERE extraction_execution_id=$1", [extraction]))[0].count, 2);
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [extraction]))[0].lifecycle, "completed");
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, document]))[0].state, "reconciling");
    assert.equal(queue.jobs.length, 1); assert.equal(queue.jobs[0].execution.skill.id, "atlas.semantic.reconcile");
    const [persisted] = await atlas.unsafe("SELECT source_sha256, provider_provenance, result_json FROM atlas.semantic_extraction_result WHERE execution_id=$1", [extraction]);
    assert.equal(persisted.source_sha256, sha); assert.deepEqual(typeof persisted.provider_provenance === "string" ? JSON.parse(persisted.provider_provenance) : persisted.provider_provenance, envelope.provider);
    const retained = typeof persisted.result_json === "string" ? JSON.parse(persisted.result_json) : persisted.result_json as typeof envelope.result;
    assert.deepEqual(retained, envelope.result, "the retained full result is the reindex source");
    const mappings = await atlas.unsafe("SELECT m.local_candidate_id, m.canonical_semantic_id, m.semantic_candidate_id FROM atlas.semantic_candidate_identity_map m WHERE m.extraction_execution_id=$1 ORDER BY m.local_candidate_id", [extraction]);
    for (const mapping of mappings) assert.equal(String(mapping.canonical_semantic_id), createHash("sha256").update(`${document}:${mapping.local_candidate_id}`).digest("hex"));
    await atlas.unsafe("DELETE FROM atlas.semantic_candidate_identity_map WHERE extraction_execution_id=$1", [extraction]);
    await atlas.unsafe("DELETE FROM atlas.knowledge_index WHERE semantic_candidate_id IN (SELECT id FROM atlas.semantic_candidate WHERE extraction_result_id=(SELECT id FROM atlas.semantic_extraction_result WHERE execution_id=$1))", [extraction]);
    for (const candidate of retained.candidate_assertions) {
      const mapping = mappings.find((item) => item.local_candidate_id === candidate.local_candidate_id)!;
      await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id, project_id, workspace_id, bundle_id, document_id, semantic_key, kind, semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [mapping.canonical_semantic_id, project, workspace, bundle, document, candidate.semantic_key, candidate.kind, mapping.semantic_candidate_id]);
      await atlas.unsafe("INSERT INTO atlas.semantic_candidate_identity_map (semantic_candidate_id, canonical_semantic_id, local_candidate_id, extraction_execution_id) VALUES ($1,$2,$3,$4)", [mapping.semantic_candidate_id, mapping.canonical_semantic_id, mapping.local_candidate_id, extraction]);
    }
    assert.deepEqual((await atlas.unsafe("SELECT semantic_id FROM atlas.knowledge_index WHERE document_id=$1 ORDER BY semantic_id", [document])).map((row) => String(row.semantic_id)), mappings.map((row) => String(row.canonical_semantic_id)).sort());
    const repository = new PostgresSemanticCandidateRepository(atlas);
    const candidates = await repository.listCandidates({ projectId: project, workspaceId: workspace, bundleId: bundle, semanticKey: "order.approval", limit: 999 });
    assert.equal(candidates.length, 1); assert.equal(candidates[0].semanticKey, "order.approval");
    assert.ok(candidates[0].semanticId.length > 20);
    assert.deepEqual((await repository.listEvidence({ projectId: project, workspaceId: workspace, bundleId: bundle, semanticId: candidates[0].semanticId })).map(({ locatorId }) => locatorId), ["block-1"]);
    assert.equal(await repository.findCandidate({ projectId: `${project}-wrong`, workspaceId: workspace, bundleId: bundle, semanticId: candidates[0].semanticId }), null);
    await authority.deliver(envelope, handler);
    assert.equal(queue.jobs.length, 1, "exact delivery replay must not enqueue a second continuation");
    await assert.rejects(() => authority.deliver({ ...envelope, provider: { ...envelope.provider, attempt: 2 } }, handler), /conflicts/);

    const invalid = { ...envelope, scope: { ...scope, executionId: extraction }, result: { ...extractionResult(), candidate_assertions: [{ ...extractionResult().candidate_assertions[0], evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "invented", excerpt: "nope" }] }] } };
    const secondDocument = `idser006-invalid-document-${suffix}`; const secondExecution = `idser006-invalid-extraction-${suffix}`; const secondPerception = `idser006-invalid-perception-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'invalid.pdf','private/invalid',$4,1,'application/pdf',$5)", [secondDocument, project, workspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/invalid',$3,'application/pdf',1,'v1','completed',$4,'idser006-invalid-capability')", [secondPerception, secondDocument, sha, `idser006-invalid-perception-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id,semantic_extraction_execution_id) VALUES ($1,$2,$3,$4,2,'extracting',$5,$6)", [bundle, secondDocument, project, workspace, secondPerception, secondExecution]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'queued','perception',$6,now()+interval '1 hour')", [secondExecution, project, workspace, bundle, secondDocument, canonicalSemanticFingerprint("capability")]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','idser006-invalid-capability',$3::jsonb)", [`idser006-invalid-cache-${suffix}`, sha, JSON.stringify(normalized(secondPerception, secondDocument, sha))]);
    const invalidScope = { ...scope, documentId: secondDocument, executionId: secondExecution };
    const malformedResults = [
      invalid.result,
      { ...extractionResult(), candidate_assertions: extractionResult().candidate_assertions.map((candidate, index) => index ? candidate : { ...candidate, evidence_refs: [{ page_number: 2, locator_type: "text_block", locator_id: "block-1", excerpt: "customer" }] }) },
      { ...extractionResult(), candidate_assertions: extractionResult().candidate_assertions.map((candidate, index) => index ? candidate : { ...candidate, evidence_refs: [{ page_number: 1, locator_type: "table", locator_id: "block-1", excerpt: "customer" }] }) },
      { ...extractionResult(), candidate_assertions: extractionResult().candidate_assertions.map((candidate, index) => index ? candidate : { ...candidate, evidence_refs: [{ page_number: 1, locator_type: "table", locator_id: "invented-table", excerpt: "customer" }] }) },
      { ...extractionResult(), candidate_assertions: extractionResult().candidate_assertions.map((candidate, index) => index ? candidate : { ...candidate, evidence_refs: [{ page_number: 1, locator_type: "visual_region", locator_id: "invented-visual" }] }) },
      { ...extractionResult(), candidate_assertions: extractionResult().candidate_assertions.map((candidate, index) => index ? candidate : { ...candidate, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-1", excerpt: "invented excerpt" }] }) },
      { ...extractionResult(), source_statement_inventory: extractionResult().source_statement_inventory.slice(0, 2) },
      { ...extractionResult(), candidate_assertions: [extractionResult().candidate_assertions[0], { ...extractionResult().candidate_assertions[0], local_candidate_id: "candidate-order" }] },
      { ...extractionResult(), source_statement_inventory: [...extractionResult().source_statement_inventory, { ...extractionResult().source_statement_inventory[0], source_unit_id: "duplicate-source" }] },
    ];
    const rejectedQueueCount = queue.jobs.length;
    for (const result of malformedResults) {
      await assert.rejects(() => authority.deliver({ ...envelope, scope: invalidScope, result }, handler), /grounded|account|dangling|duplicate|Invalid/);
      assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [secondExecution]))[0].count, 0);
      assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [secondExecution]))[0].lifecycle, "queued");
      assert.equal(queue.jobs.length, rejectedQueueCount, "rejected output must not enqueue reconciliation");
    }
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [secondExecution]))[0].count, 0);
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [secondExecution]))[0].lifecycle, "queued");
    await assert.rejects(() => authority.deliver({ ...envelope, scope: { ...scope, documentId: secondDocument } }, handler), /scope mismatch/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [secondExecution]))[0].count, 0);
    const concurrentEnvelope = { ...envelope, scope: invalidScope };
    const concurrentAuthority = new PostgresSemanticAuthority(atlasSecond);
    await Promise.all([authority.deliver(concurrentEnvelope, handler), concurrentAuthority.deliver(concurrentEnvelope, handler)]);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [secondExecution]))[0].count, 1);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate_identity_map WHERE extraction_execution_id=$1", [secondExecution]))[0].count, 2);
    await assert.rejects(() => authority.deliver({ ...concurrentEnvelope, result: { ...extractionResult(), candidate_assertions: [{ ...extractionResult().candidate_assertions[0], normalized_meaning: "Changed provider meaning." }, extractionResult().candidate_assertions[1]] } }, handler), /conflicts/);

    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'IDSER-006 isolated',$3)", [isolatedProject, `isolated-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Initial Draft')", [isolatedWorkspace, isolatedProject]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'isolated.pdf','private/isolated',$4,1,'application/pdf',$5)", [isolatedDocument, isolatedProject, isolatedWorkspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',2)", [isolatedBundle, isolatedProject, isolatedWorkspace]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/isolated',$3,'application/pdf',1,'v1','completed',$4,'idser006-isolated-capability')", [isolatedPerception, isolatedDocument, sha, `idser006-isolated-perception-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id,semantic_extraction_execution_id) VALUES ($1,$2,$3,$4,1,'extracting',$5,$6)", [isolatedBundle, isolatedDocument, isolatedProject, isolatedWorkspace, isolatedPerception, isolatedExecution]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'queued','perception',$6,now()+interval '1 hour')", [isolatedExecution, isolatedProject, isolatedWorkspace, isolatedBundle, isolatedDocument, canonicalSemanticFingerprint("capability")]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','idser006-isolated-capability',$3::jsonb)", [`idser006-isolated-cache-${suffix}`, sha, JSON.stringify(normalized(isolatedPerception, isolatedDocument, sha))]);
    const isolatedScope = { ...scope, projectId: isolatedProject, workspaceId: isolatedWorkspace, bundleId: isolatedBundle, documentId: isolatedDocument, executionId: isolatedExecution };
    await authority.deliver({ ...envelope, scope: isolatedScope }, handler);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [isolatedExecution]))[0].count, 1, "the same source hash is valid in an independently scoped project");
    const badDocument = `idser006-isolated-bad-document-${suffix}`; const badPerception = `idser006-isolated-bad-perception-${suffix}`; const badExecution = `idser006-isolated-bad-extraction-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'isolated-bad.pdf','private/isolated-bad',$4,1,'application/pdf',$5)", [badDocument, isolatedProject, isolatedWorkspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/isolated-bad',$3,'application/pdf',1,'v1','completed',$4,'idser006-isolated-bad-capability')", [badPerception, badDocument, sha, `idser006-isolated-bad-perception-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id,semantic_extraction_execution_id) VALUES ($1,$2,$3,$4,2,'extracting',$5,$6)", [isolatedBundle, badDocument, isolatedProject, isolatedWorkspace, badPerception, badExecution]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'queued','perception',$6,now()+interval '1 hour')", [badExecution, isolatedProject, isolatedWorkspace, isolatedBundle, badDocument, canonicalSemanticFingerprint("capability")]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','idser006-isolated-bad-capability',$3::jsonb)", [`idser006-isolated-bad-cache-${suffix}`, sha, JSON.stringify(normalized(isolatedPerception, isolatedDocument, sha))]);
    const queueBeforeBadBinding = queue.jobs.length;
    await assert.rejects(() => authority.deliver({ ...envelope, scope: { ...isolatedScope, documentId: badDocument, executionId: badExecution } }, handler), /source binding/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [badExecution]))[0].count, 0);
    assert.equal(queue.jobs.length, queueBeforeBadBinding, "a cross-document source mismatch cannot enqueue reconciliation");

    const failedQueueDocument = `idser006-rollback-document-${suffix}`; const failedQueueExecution = `idser006-rollback-extraction-${suffix}`; const failedQueuePerception = `idser006-rollback-perception-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'rollback.pdf','private/rollback',$4,1,'application/pdf',$5)", [failedQueueDocument, project, workspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/rollback',$3,'application/pdf',1,'v1','completed',$4,'idser006-rollback-capability')", [failedQueuePerception, failedQueueDocument, sha, `idser006-rollback-perception-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id,semantic_extraction_execution_id) VALUES ($1,$2,$3,$4,3,'extracting',$5,$6)", [bundle, failedQueueDocument, project, workspace, failedQueuePerception, failedQueueExecution]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'queued','perception',$6,now()+interval '1 hour')", [failedQueueExecution, project, workspace, bundle, failedQueueDocument, canonicalSemanticFingerprint("capability")]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','idser006-rollback-capability',$3::jsonb)", [`idser006-rollback-cache-${suffix}`, sha, JSON.stringify(normalized(failedQueuePerception, failedQueueDocument, sha))]);
    const failingQueue = makeQueue(); failingQueue.fail = true; const failingHandler = new PostgresExtractionAcceptanceHandler(failingQueue);
    const rollbackEnvelope = { ...envelope, scope: { ...scope, documentId: failedQueueDocument, executionId: failedQueueExecution } };
    await assert.rejects(() => authority.deliver(rollbackEnvelope, failingHandler), /controlled queue failure/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [failedQueueExecution]))[0].count, 0, "queue failure rolls every materialization write back");
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [failedQueueExecution]))[0].lifecycle, "queued");
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.idser006_fail_materialization() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'IDSER-006 controlled materialization failure'; END; $$");
    for (const table of ["semantic_extraction_result", "semantic_candidate", "knowledge_index", "semantic_candidate_identity_map", "semantic_evidence"]) {
      await admin.unsafe(`CREATE TRIGGER idser006_fail_materialization AFTER INSERT ON atlas.${table} FOR EACH ROW EXECUTE FUNCTION atlas.idser006_fail_materialization()`);
      await assert.rejects(() => authority.deliver(rollbackEnvelope, new PostgresExtractionAcceptanceHandler(makeQueue())), /controlled materialization failure/);
      assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [failedQueueExecution]))[0].count, 0, `${table} failure must roll the complete extraction state back`);
      assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [failedQueueExecution]))[0].lifecycle, "queued");
      await admin.unsafe(`DROP TRIGGER idser006_fail_materialization ON atlas.${table}`);
    }
    await admin.unsafe("DROP FUNCTION atlas.idser006_fail_materialization()");
    const replayQueue = makeQueue(); await authority.deliver(rollbackEnvelope, new PostgresExtractionAcceptanceHandler(replayQueue));
    assert.equal(replayQueue.jobs.length, 1); assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate WHERE document_id=$1", [failedQueueDocument]))[0].count, 2);
    const resultId = String((await atlas.unsafe("SELECT id FROM atlas.semantic_extraction_result WHERE execution_id=$1", [extraction]))[0].id);
    for (let index = 0; index < 101; index += 1) {
      const candidateId = `idser006-bulk-${suffix}-${index}`; const semanticId = `bulk-${String(index).padStart(3, "0")}`;
      await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id, extraction_result_id, project_id, workspace_id, bundle_id, document_id, semantic_key, kind, payload, normalized_meaning, needs_resolution, state) VALUES ($1,$2,$3,$4,$5,$6,$7,'rule','{}'::jsonb,$7,false,'candidate')", [candidateId, resultId, project, workspace, bundle, document, `bulk-key-${index}`]);
      await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id, project_id, workspace_id, bundle_id, document_id, semantic_key, kind, semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,$6,'rule',$7)", [semanticId, project, workspace, bundle, document, `bulk-key-${index}`, candidateId]);
    }
    const capped = await repository.listCandidates({ projectId: project, workspaceId: workspace, bundleId: bundle, limit: 999 });
    assert.equal(capped.length, 100); assert.deepEqual(capped.map(({ semanticId }) => semanticId), [...capped].map(({ semanticId }) => semanticId).sort());
  } finally {
    try {
      await admin.unsafe("DROP FUNCTION IF EXISTS atlas.idser006_fail_materialization() CASCADE");
      await admin.unsafe("DELETE FROM atlas.semantic_evidence e USING atlas.semantic_candidate c WHERE e.semantic_candidate_id=c.id AND c.project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate_identity_map m USING atlas.semantic_candidate c WHERE m.semantic_candidate_id=c.id AND c.project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.knowledge_index WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_extraction_result WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_evidence e USING atlas.semantic_candidate c WHERE e.semantic_candidate_id=c.id AND c.project_id=$1", [isolatedProject]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate_identity_map m USING atlas.semantic_candidate c WHERE m.semantic_candidate_id=c.id AND c.project_id=$1", [isolatedProject]);
      await admin.unsafe("DELETE FROM atlas.knowledge_index WHERE project_id=$1", [isolatedProject]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate WHERE project_id=$1", [isolatedProject]);
      await admin.unsafe("DELETE FROM atlas.semantic_extraction_result WHERE project_id=$1", [isolatedProject]);
      await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE project_id=$1", [isolatedProject]);
      await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [isolatedProject]);
      await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
      await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id LIKE $1", [`idser006-%${suffix}%`]);
      await admin.unsafe("DELETE FROM atlas.normalized_document_cache WHERE cache_key LIKE $1", [`idser006-%${suffix}%`]);
    } finally { await Promise.all([atlasSecond.end(), atlas.end(), admin.end()]); }
  }
});

test("IDSER-006 couples accepted perception with one extraction execution and queue handoff", { skip: !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const suffix = randomUUID(); const project = `idser006-kickoff-project-${suffix}`; const workspace = `idser006-kickoff-workspace-${suffix}`; const bundle = `idser006-kickoff-bundle-${suffix}`; const document = `idser006-kickoff-document-${suffix}`; const perception = `idser006-kickoff-perception-${suffix}`; const owner = `idser006-kickoff-owner-${suffix}`; const sha = createHash("sha256").update(`kickoff-${suffix}`).digest("hex");
  let producer: Awaited<ReturnType<typeof createTransactionalQueueProducer>> | undefined;
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'IDSER-006 kickoff',$3)", [project, `kickoff-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Initial Draft')", [workspace, project]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf','private/source',$4,1,'application/pdf',$5)", [document, project, workspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [bundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perceiving',$5)", [bundle, document, project, workspace, perception]);
    producer = await createTransactionalQueueProducer(atlasUrl.toString());
    const queue = { enqueue: (transaction: unknown, job: unknown) => producer.enqueue(transaction as never, job as never) };
    const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("s".repeat(32)), queue as never);
    const request = await authority.create({ executionId: perception, artifactId: document, storageKey: "private/source", sourceSha256: sha, mimeType: "application/pdf", byteSize: 1, idempotencyKey: `idser006-kickoff-${suffix}`, capabilityIdentity: `idser006-kickoff-capability-${suffix}` });
    await authority.redeem(request);
    const perceptionResult = normalized(perception, document, sha);
    await authority.deliver(request, perceptionResult);
    const extractionRows = await atlas.unsafe("SELECT id, stage, lifecycle FROM atlas.semantic_execution WHERE bundle_id=$1 AND document_id=$2", [bundle, document]);
    assert.equal(extractionRows.length, 1); assert.equal(extractionRows[0].stage, "extraction"); assert.equal(extractionRows[0].lifecycle, "queued");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='bridge-background-execution-v1' AND data->'execution'->>'executionId'=(SELECT semantic_extraction_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, document]))[0].count, 1);
    assert.equal((await atlas.unsafe("SELECT state, semantic_extraction_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, document]))[0].state, "extracting");
    await authority.deliver(request, perceptionResult);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='bridge-background-execution-v1' AND data->'execution'->>'executionId'=(SELECT semantic_extraction_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, document]))[0].count, 1, "perception replay must not create a second durable extraction job");
    const extractionId = String((await atlas.unsafe("SELECT semantic_extraction_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, document]))[0].semantic_extraction_execution_id);
    const semanticAuthority = new PostgresSemanticAuthority(atlas);
    const semanticEnvelope = { version: "v1", scope: { projectId: project, workspaceId: workspace, bundleId: bundle, documentId: document, executionId: extractionId, contractVersion: "v1" }, skill: { id: "atlas.semantic.extract", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: extractionResult() };
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.idser006_fail_real_enqueue() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'IDSER-006 real queue rollback'; END; $$");
    await admin.unsafe("CREATE TRIGGER idser006_fail_real_enqueue BEFORE UPDATE OF state ON atlas.extraction_bundle_document FOR EACH ROW WHEN (NEW.state='reconciling') EXECUTE FUNCTION atlas.idser006_fail_real_enqueue()");
    const rollbackError = await semanticAuthority.deliver(semanticEnvelope, new PostgresExtractionAcceptanceHandler(queue as never)).then(() => undefined, (error) => error);
    assert.ok(rollbackError, "the post-enqueue trigger must reject the transaction");
    assert.match(String((rollbackError as Error).stack), /real queue rollback/);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [extractionId]))[0].count, 0);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='bridge-background-execution-v1' AND data->'execution'->'skill'->>'id'='atlas.semantic.reconcile' AND data->'execution'->>'executionId' IN (SELECT id FROM atlas.semantic_execution WHERE document_id=$1 AND stage='reconciliation')", [document]))[0].count, 0);
    await admin.unsafe("DROP TRIGGER idser006_fail_real_enqueue ON atlas.extraction_bundle_document"); await admin.unsafe("DROP FUNCTION atlas.idser006_fail_real_enqueue()");
    await semanticAuthority.deliver(semanticEnvelope, new PostgresExtractionAcceptanceHandler(queue as never));
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='bridge-background-execution-v1' AND data->'execution'->'skill'->>'id'='atlas.semantic.reconcile' AND data->'execution'->>'executionId' IN (SELECT id FROM atlas.semantic_execution WHERE document_id=$1 AND stage='reconciliation')", [document]))[0].count, 1, "successful replay creates exactly one durable reconciliation job");
  } finally {
    try {
      if (producer) await producer.close();
      await admin.unsafe("DROP FUNCTION IF EXISTS atlas.idser006_fail_real_enqueue() CASCADE");
      await admin.unsafe("DELETE FROM pgboss.job WHERE name='bridge-background-execution-v1' AND data->'execution'->>'executionId' IN (SELECT id FROM atlas.semantic_execution WHERE project_id=$1)", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_evidence e USING atlas.semantic_candidate c WHERE e.semantic_candidate_id=c.id AND c.project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate_identity_map m USING atlas.semantic_candidate c WHERE m.semantic_candidate_id=c.id AND c.project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.knowledge_index WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_extraction_result WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]);
      await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
      await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [perception]);
      await admin.unsafe("DELETE FROM atlas.normalized_document_cache WHERE cache_key LIKE $1", [`%${sha}%`]);
    } finally { await Promise.all([atlas.end(), admin.end()]); }
  }
});
