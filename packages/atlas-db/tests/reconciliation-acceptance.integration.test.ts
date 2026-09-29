import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { PostgresReconciliationAcceptanceHandler } from "../src/reconciliation-acceptance.ts";
import { PostgresReconciliationSelector } from "../src/reconciliation-selector.ts";
import { PostgresSemanticCandidateRepository } from "../src/semantic-candidate-repository.ts";
import { PostgresSemanticAuthority, canonicalSemanticFingerprint } from "../src/semantic-authority.ts";
import { createTransactionalPerceptionQueueProducer } from "../../../apps/agents-bridge/src/queue.ts";

const databaseUrl = process.env.DATABASE_URL;
const capability = "reconciliation-capability";

test("IDSER-007 selects a stable incoming neighborhood and atomically advances one bundle member", { skip: !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 }); const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 }); const atlasSecond = postgres(atlasUrl.toString(), { max: 1 }); const suffix = randomUUID(); const owner = `idser007-owner-${suffix}`; const project = `idser007-project-${suffix}`; const workspace = `idser007-workspace-${suffix}`; const bundle = `idser007-bundle-${suffix}`; const first = `idser007-first-${suffix}`; const second = `idser007-second-${suffix}`; const execution = `idser007-reconcile-${suffix}`; const sha = createHash("sha256").update(suffix).digest("hex");
  const scope = { projectId: project, workspaceId: workspace, bundleId: bundle, documentId: first, executionId: execution, contractVersion: "v1" as const };
  const perceptionQueue = await createTransactionalPerceptionQueueProducer(databaseUrl!);
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'IDSER-007',$3)", [project, `idser007-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Same display')", [workspace, project]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'one.pdf','private/one',$4,1,'application/pdf',$5),($6,$2,$3,'two.pdf','private/two',$4,1,'application/pdf',$5)", [first, project, workspace, sha, owner, second]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',2)", [bundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,semantic_reconciliation_execution_id) VALUES ($1,$2,$3,$4,1,'reconciling',$5),($1,$6,$3,$4,2,'pending',NULL)", [bundle, first, project, workspace, execution, second]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [bundle]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'reconciliation','v1','v1',$1,'queued','extraction',$6,now()+interval '1 hour')", [execution, project, workspace, bundle, first, canonicalSemanticFingerprint(capability)]);
    const candidates = [["current-a", "quota", "rule"], ["current-b", "quota", "rule"]] as const;
    const extraction = `extract-${suffix}`; const extractionResult = `result-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'completed','perception',$6,now()+interval '1 hour',$7,now())", [extraction, project, workspace, bundle, first, canonicalSemanticFingerprint(extraction), `fingerprint-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,'{}','{}',$8)", [extractionResult, extraction, project, workspace, bundle, first, sha, `fingerprint-${suffix}`]);
    for (const [suffixId, key, kind] of candidates) {
      const candidate = `candidate-${suffixId}-${suffix}`; const semantic = `semantic-${suffixId}-${suffix}`;
      await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'{}',$9,false,'candidate')", [candidate, extractionResult, project, workspace, bundle, first, key, kind, suffixId]);
      await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [semantic, project, workspace, bundle, first, key, kind, candidate]);
      await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block',$4,$5)", [`evidence-${suffixId}-${suffix}`, candidate, first, `block-${suffixId}`, suffixId]);
    }
    const selector = new PostgresReconciliationSelector(atlas); const authority = new PostgresSemanticAuthority(atlas, selector);
    const perception = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("s".repeat(32)));
    const handler = new PostgresReconciliationAcceptanceHandler({ authority: perception, queue: perceptionQueue });
    const context = await authority.redeem({ version: "v1", executionId: execution, skill: { id: "atlas.semantic.reconcile", version: "v1" }, contextCapability: capability });
    const current = (context.context as { currentCandidates: { id: string; evidence_refs: { page_number: number; locator_type: string; locator_id: string; excerpt?: string }[] }[] }).currentCandidates;
    assert.deepEqual(current.map((candidate) => candidate.id).sort(), candidates.map(([id]) => `semantic-${id}-${suffix}`).sort());
    const relatedTypes = ["supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution"] as const;
    const envelope = { version: "v1", scope, skill: { id: "atlas.semantic.reconcile", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", relationships: [...relatedTypes.map((relationship_type) => ({ source_candidate_id: current[0].id, target_candidate_id: current[1].id, relationship_type, payload: { same_document: true }, requires_resolution: ["contradicts", "ambiguous", "requires_resolution", "partially_supersedes"].includes(relationship_type), evidence_refs: current[0].evidence_refs })), { source_candidate_id: current[1].id, relationship_type: "new" as const, payload: {}, requires_resolution: false, evidence_refs: current[1].evidence_refs }], questions: [] } };
    await assert.rejects(() => authority.deliver({ ...envelope, result: { ...envelope.result, relationships: [{ ...envelope.result.relationships[0], relationship_type: "supports", target_candidate_id: `invented-${suffix}` }] } }, handler), /authorized context/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [execution]))[0].count, 0, "invalid references create no partial reconciliation state");
    const concurrentAuthority = new PostgresSemanticAuthority(atlasSecond, new PostgresReconciliationSelector(atlasSecond));
    await Promise.all([authority.deliver(envelope, handler), concurrentAuthority.deliver(envelope, handler)]);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [execution]))[0].count, 1);
    assert.deepEqual((await atlas.unsafe("SELECT relationship_type FROM atlas.reconciliation_relationship WHERE reconciliation_result_id=(SELECT id FROM atlas.semantic_reconciliation_result WHERE execution_id=$1) ORDER BY relationship_type", [execution])).map((row) => String(row.relationship_type)), ["ambiguous", "contradicts", "duplicates", "extends", "new", "partially_supersedes", "refines", "requires_resolution", "supersedes", "supports"]);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate WHERE document_id=$1 AND state='candidate'", [first]))[0].count, 2, "relationships remain incoming proposals and do not resolve candidates");
    const repository = new PostgresSemanticCandidateRepository(atlas);
    assert.equal((await repository.listRelationships({ projectId: project, workspaceId: workspace, bundleId: bundle, semanticId: current[0].id, limit: 999 })).length, 9, "relationship traversal remains page-bounded and addressable");
    assert.deepEqual(await repository.listRelationships({ projectId: `${project}-wrong`, workspaceId: workspace, bundleId: bundle, semanticId: current[0].id }), []);
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, first]))[0].state, "completed");
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, second]))[0].state, "perception_queued");
    assert.equal((await atlas.unsafe("SELECT completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [bundle]))[0].completed_document_count, 1);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->'request'->>'executionId'=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, second]))[0].count, 1);
    const restartedAuthority = new PostgresSemanticAuthority(atlas, new PostgresReconciliationSelector(atlas));
    await restartedAuthority.deliver(envelope, handler);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data->'request'->>'executionId'=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, second]))[0].count, 1, "same acknowledgement cannot advance twice");
    const extraction2 = `extract-two-${suffix}`; const result2 = `result-two-${suffix}`; const candidate2 = `candidate-two-${suffix}`; const semantic2 = `semantic-two-${suffix}`; const reconciliation2 = `reconcile-two-${suffix}`; const capability2 = "reconciliation-capability-two";
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'completed','perception',$6,now()+interval '1 hour',$7,now()),($8,$2,$3,$4,$5,'reconciliation','v1','v1',$8,'queued','extraction',$9,now()+interval '1 hour',NULL,NULL)", [extraction2, project, workspace, bundle, second, canonicalSemanticFingerprint(extraction2), `fingerprint-two-${suffix}`, reconciliation2, canonicalSemanticFingerprint(capability2)]);
    await atlas.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,'{}','{}',$8)", [result2, extraction2, project, workspace, bundle, second, sha, `fingerprint-two-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'quota','rule','{}','later quota',false,'candidate')", [candidate2, result2, project, workspace, bundle, second]);
    await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'quota','rule',$6)", [semantic2, project, workspace, bundle, second, candidate2]);
    await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block','block-two','later')", ["evidence-two-" + suffix, candidate2, second]);
    for (let index = 0; index < 499; index += 1) {
      const candidate = `bulk-candidate-${index}-${suffix}`; const semantic = `bulk-semantic-${index}-${suffix}`;
      await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'quota','rule','{}',$7,false,'candidate')", [candidate, extractionResult, project, workspace, bundle, first, `prior quota ${index}`]);
      await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'quota','rule',$6)", [semantic, project, workspace, bundle, first, candidate]);
      await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block',$4,'prior')", [`bulk-evidence-${index}-${suffix}`, candidate, first, `bulk-${index}`]);
    }
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='reconciling', semantic_extraction_execution_id=$3, semantic_reconciliation_execution_id=$4 WHERE bundle_id=$1 AND document_id=$2", [bundle, second, extraction2, reconciliation2]);
    const nextContext = (await authority.redeem({ version: "v1", executionId: reconciliation2, skill: { id: "atlas.semantic.reconcile", version: "v1" }, contextCapability: capability2 })) as { context: { currentCandidates: { id: string }[]; priorCandidates: { id: string }[]; selection: { overflow: boolean } } };
    assert.deepEqual(nextContext.context.currentCandidates.map((candidate) => candidate.id), [semantic2]);
    assert.equal(nextContext.context.priorCandidates.length, 500);
    assert.equal(new Set(nextContext.context.priorCandidates.map((candidate) => candidate.id)).size, 500);
    assert.equal(nextContext.context.selection.overflow, true);
    const finalEnvelope = { version: "v1", scope: { ...scope, documentId: second, executionId: reconciliation2 }, skill: { id: "atlas.semantic.reconcile", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", relationships: [{ source_candidate_id: semantic2, relationship_type: "new", payload: {}, requires_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-two", excerpt: "later" }] }], questions: [] } };
    await assert.rejects(() => authority.deliver(finalEnvelope, handler), /completion validation is unavailable/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [reconciliation2]))[0].count, 0, "IDSER-008 completion absence rolls back the final reconciliation");
    assert.equal((await atlas.unsafe("SELECT completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [bundle]))[0].completed_document_count, 1);
  } finally {
    await admin.unsafe("DELETE FROM pgboss.job WHERE data->'request'->>'executionId' IN (SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1)", [bundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.semantic_execution_context WHERE execution_id=$1", [execution]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE bundle_id=$1", [bundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1", [bundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1", [bundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.document WHERE id=$1 OR id=$2", [first, second]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [workspace]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined); await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined); await Promise.all([perceptionQueue.close(), admin.end(), atlas.end(), atlasSecond.end()]);
  }
});
