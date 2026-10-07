import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import test from "node:test";
import { PgBoss } from "pg-boss";
import postgres from "postgres";
import { semanticLimits } from "@atlas/contracts";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { PostgresReconciliationAcceptanceHandler } from "../src/reconciliation-acceptance.ts";
import { PostgresReconciliationSelector } from "../src/reconciliation-selector.ts";
import { PostgresSemanticCandidateRepository } from "../src/semantic-candidate-repository.ts";
import { PostgresSemanticAuthority, canonicalSemanticFingerprint } from "../src/semantic-authority.ts";
import { createTransactionalPerceptionQueueProducer, createTransactionalQueueProducer } from "../../../apps/agents-bridge/src/queue.ts";

const databaseUrl = process.env.DATABASE_URL;
const capability = "reconciliation-capability";

const restartWorkerPath = fileURLToPath(new URL("../../../apps/agents-bridge/tests/reconciliation-restart-worker.ts", import.meta.url));
const jitiCliPath = fileURLToPath(new URL("../../../apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs", import.meta.url));

async function startComposeReconciliationWorker(queueName: string, perceptionQueueName: string): Promise<{ child: ChildProcess; ready: Promise<void>; stderr: () => string }> {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const child = spawn(process.execPath, [jitiCliPath, restartWorkerPath], { cwd: process.cwd(), env: { ...process.env, AGENTS_BRIDGE_DATABASE_URL: bridgeUrl.toString(), ATLAS_RECONCILIATION_RESTART_QUEUE: queueName, ATLAS_RECONCILIATION_RESTART_PERCEPTION_QUEUE: perceptionQueueName }, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout!.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
  child.stderr!.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
  const ready = (async () => {
    const deadline = Date.now() + 20000;
    while (!stdout.includes("COMPOSE_RECONCILIATION_WORKER_READY")) {
      if (child.exitCode !== null) throw new Error(`Compose worker exited before ready (${child.exitCode}): ${stderr}`);
      if (Date.now() >= deadline) { child.kill("SIGTERM"); throw new Error(`Compose worker did not become ready: ${stderr}`); }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  })();
  await ready;
  return { child, ready, stderr: () => stderr };
}

async function stopComposeReconciliationWorker(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    once(child, "exit"),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Compose worker did not stop after SIGTERM")), 10000)),
  ]);
  assert.equal(child.exitCode, 0, "Compose worker process stops through its shutdown handler");
}

async function waitForCondition(check: () => Promise<boolean>, message: string | (() => string), timeoutMilliseconds = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(typeof message === "function" ? message() : message);
}

test("IDSER-007 selects a stable incoming neighborhood and atomically advances one bundle member", { skip: !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 }); const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 }); const atlasSecond = postgres(atlasUrl.toString(), { max: 1 }); const suffix = randomUUID(); const owner = `idser007-owner-${suffix}`; const foreignOwner = `idser007-foreign-owner-${suffix}`; const project = `idser007-project-${suffix}`; const workspace = `idser007-workspace-${suffix}`; const bundle = `idser007-bundle-${suffix}`; const first = `idser007-first-${suffix}`; const second = `idser007-second-${suffix}`; const third = `idser007-third-${suffix}`; const overBudgetBundle = `over-budget-bundle-${suffix}`; const overBudgetDocument = `over-budget-document-${suffix}`; const execution = `idser007-reconcile-${suffix}`; const foreignProject = `foreign-project-${suffix}`; const foreignWorkspace = `foreign-workspace-${suffix}`; const foreignBundle = `foreign-bundle-${suffix}`; const foreignDocument = `foreign-document-${suffix}`; const foreignNext = `foreign-next-${suffix}`; const foreignExecution = `foreign-execution-${suffix}`; const foreignReconcile = `foreign-reconcile-${suffix}`; const foreignResult = `foreign-result-${suffix}`; const foreignCandidate = `foreign-candidate-${suffix}`; const foreignSemantic = `foreign-semantic-${suffix}`; const sha = createHash("sha256").update(suffix).digest("hex");
  const scope = { projectId: project, workspaceId: workspace, bundleId: bundle, documentId: first, executionId: execution, contractVersion: "v1" as const };
  // This fixture deliberately creates incomplete synthetic documents. Keep
  // their real pg-boss jobs away from the always-on Compose worker, otherwise
  // it can truthfully terminally fail the fixture before this test reaches its
  // own restarted-worker delivery.
  const perceptionQueueName = `atlas-document-perception-idser007-${suffix}`;
  const reconciliationQueueName = `bridge-background-reconciliation-idser007-${suffix}`;
  const perceptionQueue = await createTransactionalPerceptionQueueProducer(databaseUrl!, perceptionQueueName);
  const perceptionQueueRegistrar = new PgBoss({ connectionString: databaseUrl!, schema: "pgboss", migrate: false, supervise: false, schedule: false, createSchema: false, application_name: "idser007-reconciliation-fixture" });
  await perceptionQueueRegistrar.start();
  await perceptionQueueRegistrar.createQueue(perceptionQueueName);
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now()),($3,$3,$4,false,now(),now())', [owner, `${owner}@example.test`, foreignOwner, `${foreignOwner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'IDSER-007',$3)", [project, `idser007-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Same display'),($3,$2,'master','empty','Master')", [workspace, project, `idser007-master-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'one.pdf','private/one',$4,1,'application/pdf',$5),($6,$2,$3,'two.pdf','private/two',$4,1,'application/pdf',$5),($7,$2,$3,'three.pdf','private/three',$4,1,'application/pdf',$5),($8,$2,$3,'over-budget.pdf','private/over-budget',$4,1,'application/pdf',$5)", [first, project, workspace, sha, owner, second, third, overBudgetDocument]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,perception_admission_policy,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1','staged-fair-local-v1',3),($4,$2,$3,'waiting','v1','v1',NULL,1)", [bundle, project, workspace, overBudgetBundle]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,semantic_reconciliation_execution_id) VALUES ($1,$2,$3,$4,1,'reconciling',$5),($1,$6,$3,$4,2,'pending',NULL),($1,$7,$3,$4,3,'pending',NULL),($8,$9,$3,$4,1,'pending',NULL)", [bundle, first, project, workspace, execution, second, third, overBudgetBundle, overBudgetDocument]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [bundle]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'reconciliation','v1','v1',$1,'queued','extraction',$6,now()+interval '1 hour')", [execution, project, workspace, bundle, first, canonicalSemanticFingerprint(capability)]);
    const candidates = [["current-a", "quota", "rule", "The quota is 40."], ["current-b", "quota", "rule", "The quota is 45."]] as const;
    const extraction = `extract-${suffix}`; const extractionResult = `result-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'completed','perception',$6,now()+interval '1 hour',$7,now())", [extraction, project, workspace, bundle, first, canonicalSemanticFingerprint(extraction), `fingerprint-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,'{}','{}',$8)", [extractionResult, extraction, project, workspace, bundle, first, sha, `fingerprint-${suffix}`]);
    for (const [suffixId, key, kind, meaning] of candidates) {
      const candidate = `candidate-${suffixId}-${suffix}`; const semantic = `semantic-${suffixId}-${suffix}`;
      await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,true,'candidate')", [candidate, extractionResult, project, workspace, bundle, first, key, kind, { quota: suffixId === "current-a" ? 40 : 45 }, meaning]);
      await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [semantic, project, workspace, bundle, first, key, kind, candidate]);
      await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block',$4,$5)", [`evidence-${suffixId}-${suffix}`, candidate, first, `block-${suffixId}`, meaning]);
    }
    const selector = new PostgresReconciliationSelector(atlas); const authority = new PostgresSemanticAuthority(atlas, selector);
    const perception = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("s".repeat(32)));
    const handler = new PostgresReconciliationAcceptanceHandler({ authority: perception, queue: perceptionQueue });
    const context = await authority.redeem({ version: "v1", executionId: execution, skill: { id: "atlas.semantic.reconcile", version: "v1" }, contextCapability: capability });
    const current = (context.context as { currentCandidates: { id: string; evidence_refs: { page_number: number; locator_type: string; locator_id: string; excerpt?: string }[] }[] }).currentCandidates;
    assert.deepEqual(current.map((candidate) => candidate.id).sort(), candidates.map(([id]) => `semantic-${id}-${suffix}`).sort());
    const unselectedCandidate = `unselected-candidate-${suffix}`; const unselectedSemantic = `unselected-semantic-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'unselected','actor','{}','existing but not selected',false,'candidate')", [unselectedCandidate, extractionResult, project, workspace, bundle, first]);
    await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'unselected','actor',$6)", [unselectedSemantic, project, workspace, bundle, first, unselectedCandidate]);
    await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block','unselected','existing')", [`unselected-evidence-${suffix}`, unselectedCandidate, first]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'Foreign',$3)", [foreignProject, `foreign-${suffix.slice(0, 12)}`, foreignOwner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Same display')", [foreignWorkspace, foreignProject]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'foreign.pdf','private/foreign',$4,1,'application/pdf',$5),($6,$2,$3,'foreign-next.pdf','private/foreign-next',$4,1,'application/pdf',$5)", [foreignDocument, foreignProject, foreignWorkspace, sha, owner, foreignNext]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,perception_admission_policy,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1','staged-fair-local-v1',2)", [foreignBundle, foreignProject, foreignWorkspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,semantic_reconciliation_execution_id) VALUES ($1,$2,$3,$4,1,'reconciling',$5),($1,$6,$3,$4,2,'pending',NULL)", [foreignBundle, foreignDocument, foreignProject, foreignWorkspace, foreignReconcile, foreignNext]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [foreignBundle]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'completed','perception',$6,now()+interval '1 hour',$7,now()),($8,$2,$3,$4,$5,'reconciliation','v1','v1',$8,'queued','extraction',$9,now()+interval '1 hour',NULL,NULL)", [foreignExecution, foreignProject, foreignWorkspace, foreignBundle, foreignDocument, canonicalSemanticFingerprint(foreignExecution), `foreign-fingerprint-${suffix}`, foreignReconcile, canonicalSemanticFingerprint(`foreign-capability-${suffix}`)]);
    await atlas.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,'{}','{}',$8)", [foreignResult, foreignExecution, foreignProject, foreignWorkspace, foreignBundle, foreignDocument, sha, `foreign-fingerprint-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'quota','rule','{}','foreign quota',false,'candidate')", [foreignCandidate, foreignResult, foreignProject, foreignWorkspace, foreignBundle, foreignDocument]);
    await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'quota','rule',$6)", [foreignSemantic, foreignProject, foreignWorkspace, foreignBundle, foreignDocument, foreignCandidate]);
    await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block','foreign','foreign')", [`foreign-evidence-${suffix}`, foreignCandidate, foreignDocument]);
    const foreignScope = { projectId: foreignProject, workspaceId: foreignWorkspace, bundleId: foreignBundle, documentId: foreignDocument, executionId: foreignReconcile, contractVersion: "v1" as const };
    const foreignContext = (await authority.redeem({ version: "v1", executionId: foreignReconcile, skill: { id: "atlas.semantic.reconcile", version: "v1" }, contextCapability: `foreign-capability-${suffix}` })) as { context: { currentCandidates: { id: string; evidence_refs: unknown[] }[] } };
    const relatedTypes = ["supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution"] as const;
    const envelope = { version: "v1", scope, skill: { id: "atlas.semantic.reconcile", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", relationships: [...relatedTypes.map((relationship_type) => ({ source_candidate_id: current[0].id, target_candidate_id: current[1].id, relationship_type, payload: { same_document: true }, requires_resolution: ["contradicts", "ambiguous", "requires_resolution", "partially_supersedes"].includes(relationship_type), evidence_refs: current[0].evidence_refs })), { source_candidate_id: current[1].id, relationship_type: "new" as const, payload: {}, requires_resolution: false, evidence_refs: current[1].evidence_refs }], questions: [] } };
    await assert.rejects(() => authority.deliver({ ...envelope, result: { ...envelope.result, relationships: [{ source_candidate_id: current[0].id, relationship_type: "new", payload: {}, requires_resolution: false, evidence_refs: current[0].evidence_refs }] } }, handler), /account for every current candidate/);
    await assert.rejects(() => authority.deliver({ ...envelope, result: { ...envelope.result, relationships: [{ ...envelope.result.relationships[0], relationship_type: "supports", target_candidate_id: `invented-${suffix}` }] } }, handler), /authorized context/);
    await assert.rejects(() => authority.deliver({ ...envelope, result: { ...envelope.result, relationships: [{ ...envelope.result.relationships[0], target_candidate_id: unselectedSemantic }] } }, handler), /authorized context/);
    await assert.rejects(() => authority.deliver({ ...envelope, result: { ...envelope.result, relationships: [{ ...envelope.result.relationships[0], target_candidate_id: foreignSemantic }] } }, handler), /authorized context/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [execution]))[0].count, 0, "invalid references create no partial reconciliation state");
    const concurrentAuthority = new PostgresSemanticAuthority(atlasSecond, new PostgresReconciliationSelector(atlasSecond));
    const foreignEnvelope = { version: "v1", scope: foreignScope, skill: { id: "atlas.semantic.reconcile", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", relationships: [{ source_candidate_id: foreignContext.context.currentCandidates[0].id, relationship_type: "new", payload: {}, requires_resolution: false, evidence_refs: foreignContext.context.currentCandidates[0].evidence_refs }], questions: [] } };
    const failingHandler = new PostgresReconciliationAcceptanceHandler({ authority: perception, queue: { enqueue: async () => { throw new Error("injected enqueue failure"); } } });
    await assert.rejects(() => authority.deliver(envelope, failingHandler), /injected enqueue failure/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [execution]))[0].count, 0, "enqueue failure rolls back the reconciliation result");
    for (const index of [1, 2]) await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,$3,$4,'application/pdf',1,'v1','queued',$5,'test-capacity')", [`reconciliation-capacity-${index}-${suffix}`, `reconciliation-capacity-artifact-${index}-${suffix}`, `private/capacity/${index}`, sha, `reconciliation-capacity-key-${index}-${suffix}`]);
    await Promise.all([authority.deliver(envelope, handler), concurrentAuthority.deliver(envelope, handler), concurrentAuthority.deliver(foreignEnvelope, handler)]);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [execution]))[0].count, 1);
    assert.deepEqual((await atlas.unsafe("SELECT relationship_type FROM atlas.reconciliation_relationship WHERE reconciliation_result_id=(SELECT id FROM atlas.semantic_reconciliation_result WHERE execution_id=$1) ORDER BY relationship_type", [execution])).map((row) => String(row.relationship_type)), ["ambiguous", "contradicts", "duplicates", "extends", "new", "partially_supersedes", "refines", "requires_resolution", "supersedes", "supports"]);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate WHERE id = ANY($1::text[]) AND needs_resolution", [[`candidate-current-a-${suffix}`, `candidate-current-b-${suffix}`]]))[0].count, 2, "conflicting quota candidates remain unresolved incoming records");
    assert.equal((await atlas.unsafe("SELECT requires_resolution FROM atlas.reconciliation_relationship WHERE reconciliation_result_id=(SELECT id FROM atlas.semantic_reconciliation_result WHERE execution_id=$1) AND relationship_type='contradicts'", [execution]))[0].requires_resolution, true);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate WHERE document_id=$1 AND state='candidate'", [first]))[0].count, 3, "relationships remain incoming proposals and do not resolve candidates");
    const repository = new PostgresSemanticCandidateRepository(atlas);
    assert.equal((await repository.listRelationships({ projectId: project, workspaceId: workspace, bundleId: bundle, semanticId: current[0].id, limit: 999 })).length, 9, "relationship traversal remains page-bounded and addressable");
    assert.deepEqual(await repository.listRelationships({ projectId: `${project}-wrong`, workspaceId: workspace, bundleId: bundle, semanticId: current[0].id }), []);
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, first]))[0].state, "completed");
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, second]))[0].state, "pending", "reconciliation cannot admit a successor while both staged permits are occupied");
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.document_perception_execution WHERE artifact_id=$1", [second]))[0].count, 0, "no successor execution, grant, or job is created without a staged permit");
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE id IN ($1,$2)", [`reconciliation-capacity-1-${suffix}`, `reconciliation-capacity-2-${suffix}`]);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.document_perception_execution WHERE state NOT IN ('completed','cancelled','failed')"))[0].count, 0, "releasing both permits leaves the shared staged gate capacity available");
    await atlas.begin((sql) => perception.admitStagedInTransaction(sql, perceptionQueue));
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, second]))[0].state, "perception_queued", "the shared staged gate admits the pending successor only after capacity opens");
    assert.equal((await atlas.unsafe("SELECT completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [bundle]))[0].completed_document_count, 1);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$3 AND data->'request'->>'executionId'=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, second, perceptionQueueName]))[0].count, 1);
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [foreignBundle, foreignNext]))[0].state, "perception_queued", "distinct bundles owned by distinct users advance independently despite identical workspace display wording");
    assert.notEqual((await atlas.unsafe("SELECT created_by_user_id FROM atlas.project WHERE id=$1", [project]))[0].created_by_user_id, (await atlas.unsafe("SELECT created_by_user_id FROM atlas.project WHERE id=$1", [foreignProject]))[0].created_by_user_id, "the concurrent bundles belong to distinct user identities");
    const restartedAuthority = new PostgresSemanticAuthority(atlas, new PostgresReconciliationSelector(atlas));
    await restartedAuthority.deliver(envelope, handler);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$3 AND data->'request'->>'executionId'=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, second, perceptionQueueName]))[0].count, 1, "same acknowledgement cannot advance twice");
    const extraction2 = `extract-two-${suffix}`; const result2 = `result-two-${suffix}`; const candidate2 = `candidate-two-${suffix}`; const semantic2 = `semantic-two-${suffix}`; const reconciliation2 = `reconcile-two-${suffix}`; const capability2 = "reconciliation-capability-two";
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'completed','perception',$6,now()+interval '1 hour',$7,now()),($8,$2,$3,$4,$5,'reconciliation','v1','v1',$8,'queued','extraction',$9,now()+interval '1 hour',NULL,NULL)", [extraction2, project, workspace, bundle, second, canonicalSemanticFingerprint(extraction2), `fingerprint-two-${suffix}`, reconciliation2, canonicalSemanticFingerprint(capability2)]);
    await atlas.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,'{}','{}',$8)", [result2, extraction2, project, workspace, bundle, second, sha, `fingerprint-two-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'quota','rule',$7::jsonb,'The quota is 45.',true,'candidate')", [candidate2, result2, project, workspace, bundle, second, { quota: 45 }]);
    await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'quota','rule',$6)", [semantic2, project, workspace, bundle, second, candidate2]);
    await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block','block-two','The quota is 45.'),($4,$2,$3,2,'text_block','supporting-supersession','The approved revision replaces the quota of 40 with 45.'),($5,$2,$3,3,'text_block','unresolved-supersession','The source does not establish that quota 45 replaces quota 40.')", [`evidence-two-${suffix}`, candidate2, second, `evidence-two-supported-${suffix}`, `evidence-two-unresolved-${suffix}`]);
    for (let index = 0; index < 499; index += 1) {
      const candidate = `bulk-candidate-${index}-${suffix}`; const semantic = `bulk-semantic-${index}-${suffix}`;
      await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'quota','rule','{}',$7,false,'candidate')", [candidate, extractionResult, project, workspace, bundle, first, `prior quota ${index}`]);
      await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'quota','rule',$6)", [semantic, project, workspace, bundle, first, candidate]);
      await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block',$4,'prior')", [`bulk-evidence-${index}-${suffix}`, candidate, first, `bulk-${index}`]);
    }
    // Each valid record stays intact, but the ranked prior set no longer fits
    // as a whole. This makes the selector prove UTF-8 byte fitting rather than
    // merely its count cap.
    await atlas.unsafe("UPDATE atlas.semantic_evidence SET excerpt=$2 WHERE id LIKE $1", [`bulk-evidence-%-${suffix}`, "界".repeat(1000)]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='reconciling', semantic_extraction_execution_id=$3, semantic_reconciliation_execution_id=$4 WHERE bundle_id=$1 AND document_id=$2", [bundle, second, extraction2, reconciliation2]);
    const nextContext = (await authority.redeem({ version: "v1", executionId: reconciliation2, skill: { id: "atlas.semantic.reconcile", version: "v1" }, contextCapability: capability2 })) as { context: { currentCandidates: { id: string; evidence_refs: { page_number: number; locator_type: "text_block"; locator_id: string; excerpt: string }[] }[]; priorCandidates: { id: string }[]; selection: { overflow: boolean; version: string; selectedCount: number; currentCount: number; totalCount: number; byteLimit: number; byteCount: number; omittedPriorCount: number } } };
    assert.deepEqual(nextContext.context.currentCandidates.map((candidate) => candidate.id), [semantic2]);
    assert.ok(nextContext.context.priorCandidates.length > 0 && nextContext.context.priorCandidates.length < 500, "lower-ranked prior records are omitted to fit the byte budget");
    assert.equal(new Set(nextContext.context.priorCandidates.map((candidate) => candidate.id)).size, nextContext.context.priorCandidates.length);
    assert.equal(nextContext.context.selection.overflow, true);
    assert.equal(nextContext.context.selection.version, "v1");
    assert.equal(nextContext.context.selection.selectedCount, nextContext.context.priorCandidates.length);
    assert.equal(nextContext.context.selection.currentCount, 1);
    assert.equal(nextContext.context.selection.totalCount, nextContext.context.priorCandidates.length + 1);
    assert.equal(nextContext.context.selection.byteLimit, semanticLimits.contextBytes);
    assert.equal(nextContext.context.selection.byteCount, new TextEncoder().encode(JSON.stringify(nextContext.context)).byteLength);
    assert.ok(nextContext.context.selection.byteCount <= semanticLimits.contextBytes);
    assert.equal(nextContext.context.selection.omittedPriorCount, 501 - nextContext.context.priorCandidates.length, "metadata includes the count-cap overflow row as well as byte-fitted omissions");
    const repeated = await selector.select({ ...scope, documentId: second, executionId: reconciliation2 });
    assert.deepEqual((repeated as { priorCandidates: { id: string }[]; selection: unknown }).priorCandidates.map((candidate) => candidate.id), nextContext.context.priorCandidates.map((candidate) => candidate.id), "byte fitting preserves deterministic ranked IDs");
    assert.deepEqual((repeated as { selection: unknown }).selection, nextContext.context.selection, "repeated selection retains byte and omission metadata");
    const supportedEvidence = nextContext.context.currentCandidates[0].evidence_refs.filter((evidence) => evidence.locator_id === "supporting-supersession");
    const unresolvedEvidence = nextContext.context.currentCandidates[0].evidence_refs.filter((evidence) => evidence.locator_id === "unresolved-supersession");
    assert.equal(supportedEvidence.length, 1);
    assert.equal(unresolvedEvidence.length, 1);
    const crossTarget = nextContext.context.priorCandidates[0].id;
    const secondEnvelope = { version: "v1", scope: { ...scope, documentId: second, executionId: reconciliation2 }, skill: { id: "atlas.semantic.reconcile", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", relationships: [...["supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution"].map((relationship_type) => ({ source_candidate_id: semantic2, target_candidate_id: crossTarget, relationship_type, payload: { cross_document: true, supersession_evidence: relationship_type === "supersedes" ? "supported" : "not_inferred_from_order" }, requires_resolution: ["contradicts", "partially_supersedes", "ambiguous", "requires_resolution"].includes(relationship_type), evidence_refs: relationship_type === "supersedes" ? supportedEvidence : unresolvedEvidence })), { source_candidate_id: semantic2, target_candidate_id: crossTarget, relationship_type: "supersedes", payload: { cross_document: true, supersession_evidence: "unsupported" }, requires_resolution: true, evidence_refs: unresolvedEvidence }], questions: [] } };
    const backgroundQueue = await createTransactionalQueueProducer(databaseUrl!, reconciliationQueueName);
    const reconciliationJobIdempotencyKey = `idser007-reconcile-restart-${suffix}`;
    const compressedEnvelope = `z:${deflateRawSync(Buffer.from(JSON.stringify(secondEnvelope))).toString("base64")}`;
    assert.ok(compressedEnvelope.length <= 1000, "compressed frozen semantic envelope fits the semantic capability bound");
    let idleWorker: ChildProcess | undefined;
    let restartedWorker: ChildProcess | undefined;
    let restartedWorkerStderr = () => "";
    try {
      idleWorker = (await startComposeReconciliationWorker(reconciliationQueueName, perceptionQueueName)).child;
      await stopComposeReconciliationWorker(idleWorker);
      await atlas.begin(async (transaction) => backgroundQueue.enqueue(transaction, {
        idempotencyKey: reconciliationJobIdempotencyKey,
        execution: {
          version: "v1",
          executionId: reconciliation2,
          mode: "background",
          skill: { id: "atlas.semantic.reconcile", version: "v1" },
          input: {
            version: "v1",
            executionId: reconciliation2,
            skill: { id: "atlas.semantic.reconcile", version: "v1" },
            contextCapability: compressedEnvelope,
          },
          context: { boundary: "idser-007-restart-test", items: [] },
        },
      }));
      assert.equal((await admin.unsafe("SELECT state FROM pgboss.job WHERE name=$1 AND data->>'idempotencyKey'=$2", [reconciliationQueueName, reconciliationJobIdempotencyKey]))[0].state, "created", "reconciliation delivery remains queued while the Compose worker is stopped");
      const restarted = await startComposeReconciliationWorker(reconciliationQueueName, perceptionQueueName);
      restartedWorker = restarted.child;
      restartedWorkerStderr = restarted.stderr;
      try {
        await waitForCondition(async () => {
          const [result] = await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [reconciliation2]);
          const [effect] = await admin.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [reconciliationJobIdempotencyKey]);
          return result.count === 1 && effect?.status === "completed";
        }, "restarted Compose worker did not complete reconciliation");
        // The real restarted pg-boss worker owns the accepted completion. A
        // concurrent/stale terminal report arriving after that commit must be
        // rejected rather than regressing the accepted reconciliation state.
        await assert.rejects(() => restartedAuthority.fail({ version: "v1", scope: secondEnvelope.scope, code: "provider_timeout" }), /unauthorized/, "a stale reconciliation failure loses to the worker's accepted completion");
        assert.deepEqual((await atlas.unsafe("SELECT lifecycle, failure_code FROM atlas.semantic_execution WHERE id=$1", [reconciliation2]))[0], { lifecycle: "completed", failure_code: null }, "accepted reconciliation completion has no contradictory failure state");
        assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, second]))[0].state, "completed", "the stale failure cannot regress the completed member");
      } catch (error) {
        const [job] = await admin.unsafe("SELECT state, retry_count, output FROM pgboss.job WHERE name=$1 AND data->>'idempotencyKey'=$2", [reconciliationQueueName, reconciliationJobIdempotencyKey]);
        const [effect] = await admin.unsafe("SELECT status, last_error, lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [reconciliationJobIdempotencyKey]);
        throw new Error(`${error instanceof Error ? error.message : String(error)}; job=${JSON.stringify(job)}; effect=${JSON.stringify(effect)}; stderr=${restartedWorkerStderr()}`);
      }
    } finally {
      if (restartedWorker) await stopComposeReconciliationWorker(restartedWorker);
      await admin.unsafe("DELETE FROM pgboss.job WHERE name=$1 AND data->>'idempotencyKey'=$2", [reconciliationQueueName, reconciliationJobIdempotencyKey]).catch(() => undefined);
      await admin.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key=$1", [reconciliationJobIdempotencyKey]).catch(() => undefined);
      await backgroundQueue.close();
    }
    assert.deepEqual((await atlas.unsafe("SELECT payload->>'supersession_evidence' AS evidence FROM atlas.reconciliation_relationship WHERE reconciliation_result_id=(SELECT id FROM atlas.semantic_reconciliation_result WHERE execution_id=$1) AND relationship_type='supersedes' ORDER BY evidence", [reconciliation2])).map((row) => String(row.evidence)), ["supported", "unsupported"], "supported and unsupported supersession proposals remain distinct incoming records");
    const supersessionEvidence = await atlas.unsafe("SELECT relationship->'evidence_refs' AS evidence_refs FROM atlas.semantic_reconciliation_result, jsonb_array_elements(result_json->'relationships') AS relationship WHERE execution_id=$1 AND relationship->>'relationship_type'='supersedes' ORDER BY relationship->'payload'->>'supersession_evidence'", [reconciliation2]);
    assert.deepEqual(supersessionEvidence.map((row) => ((typeof row.evidence_refs === "string" ? JSON.parse(row.evidence_refs) : row.evidence_refs) as { locator_id: string }[])[0].locator_id), ["supporting-supersession", "unresolved-supersession"], "supported and unsupported supersession proposals cite distinct evidence");
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, second]))[0].state, "completed");
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [bundle, third]))[0].state, "perception_queued");
    assert.equal((await atlas.unsafe("SELECT completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [bundle]))[0].completed_document_count, 2, "D3 is queued only after D2 reconciliation commits");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$3 AND data->'request'->>'executionId'=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, third, perceptionQueueName]))[0].count, 1, "the restarted worker's reconciliation schedules exactly one D3 perception job");
    const extraction3 = `extract-three-${suffix}`; const result3 = `result-three-${suffix}`; const candidate3 = `candidate-three-${suffix}`; const semantic3 = `semantic-three-${suffix}`; const reconciliation3 = `reconcile-three-${suffix}`; const capability3 = "reconciliation-capability-three";
    const perception1 = `perception-one-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/one',$3,'application/pdf',1,'v1','completed',$4,'idser008-fixture')", [perception1, first, sha, `perception-one-${suffix}`]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET perception_execution_id=$3, semantic_extraction_execution_id=$4 WHERE bundle_id=$1 AND document_id=$2", [bundle, first, perception1, extraction]);
    await atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE id IN (SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1)", [bundle]);
    // The final gate deliberately re-resolves each persisted evidence locator
    // against the completed normalized document rather than trusting the
    // earlier extraction write. This fixture supplies the complete source
    // inventory for every candidate created above.
    const memberIdentities = new Map([[first, "idser008-fixture-first"], [second, "idser008-fixture-second"], [third, "idser008-fixture-third"]]);
    for (const [documentId, capabilityIdentity] of memberIdentities) {
      await atlas.unsafe("UPDATE atlas.document_perception_execution SET capability_identity=$3 WHERE id=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, documentId, capabilityIdentity]);
    }
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb)", [`idser008-cache-first-${suffix}`, sha, "idser008-fixture-first", JSON.stringify({ pages: [{ number: 1, textBlocks: ["block-current-a", "block-current-b", "unselected", ...Array.from({ length: 499 }, (_, index) => `bulk-${index}`)].map((id) => ({ id, text: id })) }] })]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb)", [`idser008-cache-second-${suffix}`, sha, "idser008-fixture-second", JSON.stringify({ pages: [{ number: 1, textBlocks: [{ id: "block-two", text: "block-two" }] }, { number: 2, textBlocks: [{ id: "supporting-supersession", text: "supporting" }] }, { number: 3, textBlocks: [{ id: "unresolved-supersession", text: "unresolved" }] }] })]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb)", [`idser008-cache-third-${suffix}`, sha, "idser008-fixture-third", JSON.stringify({ pages: [{ number: 1, textBlocks: [{ id: "block-three", text: "block-three" }] }] })]);
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'completed','perception',$6,now()+interval '1 hour',$7,now()),($8,$2,$3,$4,$5,'reconciliation','v1','v1',$8,'queued','extraction',$9,now()+interval '1 hour',NULL,NULL)", [extraction3, project, workspace, bundle, third, canonicalSemanticFingerprint(extraction3), `fingerprint-three-${suffix}`, reconciliation3, canonicalSemanticFingerprint(capability3)]);
    await atlas.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,'{}','{}',$8)", [result3, extraction3, project, workspace, bundle, third, sha, `fingerprint-three-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'final','actor','{}','final candidate',false,'candidate')", [candidate3, result3, project, workspace, bundle, third]);
    await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'final','actor',$6)", [semantic3, project, workspace, bundle, third, candidate3]);
    await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block','block-three','final')", [`evidence-three-${suffix}`, candidate3, third]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='reconciling', semantic_extraction_execution_id=$3, semantic_reconciliation_execution_id=$4 WHERE bundle_id=$1 AND document_id=$2", [bundle, third, extraction3, reconciliation3]);
    const thirdContext = (await authority.redeem({ version: "v1", executionId: reconciliation3, skill: { id: "atlas.semantic.reconcile", version: "v1" }, contextCapability: capability3 })) as { context: { currentCandidates: { id: string }[] } };
    const finalEnvelope = { version: "v1", scope: { ...scope, documentId: third, executionId: reconciliation3 }, skill: { id: "atlas.semantic.reconcile", version: "v1" }, provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", relationships: [{ source_candidate_id: thirdContext.context.currentCandidates[0].id, relationship_type: "new", payload: {}, requires_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-three", excerpt: "final" }] }], questions: [] } };
    const rejectsFinalAcceptance = async (label: string, mutate: () => Promise<void>, restore: () => Promise<void>) => {
      await mutate();
      try {
        await assert.rejects(() => authority.deliver(finalEnvelope, handler), /Bundle completion/);
        assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [reconciliation3]))[0].count, 0, `${label} rolls back the final result`);
        assert.deepEqual((await atlas.unsafe("SELECT state, completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [bundle]))[0], { state: "processing", completed_document_count: 2 }, `${label} cannot advance the bundle`);
      } finally {
        await restore();
      }
    };
    await assert.rejects(() => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET sequence=99 WHERE bundle_id=$1 AND document_id=$2", [bundle, third]), /manifest is immutable/, "the manifest cannot change after processing starts");
    await rejectsFinalAcceptance("an inconsistent expected manifest count", () => atlas.unsafe("UPDATE atlas.extraction_bundle SET expected_document_count=4 WHERE id=$1", [bundle]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.extraction_bundle SET expected_document_count=3 WHERE id=$1", [bundle]).then(() => undefined));
    await rejectsFinalAcceptance("an incomplete member", () => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='needs_attention' WHERE bundle_id=$1 AND document_id=$2", [bundle, first]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET state='completed' WHERE bundle_id=$1 AND document_id=$2", [bundle, first]).then(() => undefined));
    await rejectsFinalAcceptance("an unfinished perception execution", () => atlas.unsafe("UPDATE atlas.document_perception_execution SET state='queued' WHERE id=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, second]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.document_perception_execution SET state='completed' WHERE id=(SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2)", [bundle, second]).then(() => undefined));
    await rejectsFinalAcceptance("a missing extraction execution", () => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET semantic_extraction_execution_id=NULL WHERE bundle_id=$1 AND document_id=$2", [bundle, first]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET semantic_extraction_execution_id=$3 WHERE bundle_id=$1 AND document_id=$2", [bundle, first, extraction]).then(() => undefined));
    await rejectsFinalAcceptance("a missing reconciliation execution", () => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET semantic_reconciliation_execution_id=NULL WHERE bundle_id=$1 AND document_id=$2", [bundle, second]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.extraction_bundle_document SET semantic_reconciliation_execution_id=$3 WHERE bundle_id=$1 AND document_id=$2", [bundle, second, reconciliation2]).then(() => undefined));
    await rejectsFinalAcceptance("a queued active-version semantic stage", () => atlas.unsafe("UPDATE atlas.semantic_execution SET lifecycle='queued', completion_fingerprint=NULL, completed_at=NULL WHERE id=$1", [extraction]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.semantic_execution SET lifecycle='completed', completion_fingerprint=$2, completed_at=now() WHERE id=$1", [extraction, `fingerprint-${suffix}`]).then(() => undefined));
    await rejectsFinalAcceptance("a candidate tied to another extraction result", async () => {
      await admin.unsafe("SET session_replication_role = replica");
      try { await admin.unsafe("UPDATE atlas.semantic_candidate SET extraction_result_id=$2 WHERE id=$1", [candidate3, result2]); }
      finally { await admin.unsafe("SET session_replication_role = origin"); }
    }, () => atlas.unsafe("UPDATE atlas.semantic_candidate SET extraction_result_id=$2 WHERE id=$1", [candidate3, result3]).then(() => undefined));
    await rejectsFinalAcceptance("evidence tied to the wrong document", async () => {
      await admin.unsafe("SET session_replication_role = replica");
      try { await admin.unsafe("UPDATE atlas.semantic_evidence SET document_id=$2 WHERE id=$1", [`evidence-three-${suffix}`, first]); }
      finally { await admin.unsafe("SET session_replication_role = origin"); }
    }, () => atlas.unsafe("UPDATE atlas.semantic_evidence SET document_id=$2 WHERE id=$1", [`evidence-three-${suffix}`, third]).then(() => undefined));
    await rejectsFinalAcceptance("a nonexistent normalized-document locator", () => atlas.unsafe("UPDATE atlas.semantic_evidence SET locator_id='missing-normalized-locator' WHERE id=$1", [`evidence-three-${suffix}`]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.semantic_evidence SET locator_id='block-three' WHERE id=$1", [`evidence-three-${suffix}`]).then(() => undefined));
    await rejectsFinalAcceptance("an earlier completed member with a nonexistent normalized locator", () => atlas.unsafe("UPDATE atlas.semantic_evidence SET locator_id='missing-earlier-member-locator' WHERE id=$1", [`bulk-evidence-4-${suffix}`]).then(() => undefined), () => atlas.unsafe("UPDATE atlas.semantic_evidence SET locator_id='bulk-4' WHERE id=$1", [`bulk-evidence-4-${suffix}`]).then(() => undefined));
    const master = `idser008-master-${suffix}`;
    await rejectsFinalAcceptance("a missing empty Master workspace", () => atlas.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [`idser007-master-${suffix}`]).then(() => undefined), () => atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'master','empty','Master')", [master, project]).then(() => undefined));
    await assert.rejects(() => atlas.unsafe("UPDATE atlas.semantic_candidate SET state='accepted' WHERE id=$1", [candidate3]), /check constraint/, "candidate promotion is forbidden before review");
    await assert.rejects(() => atlas.unsafe("UPDATE atlas.workspace SET state='draft' WHERE id=$1", [master]), /check constraint/, "Master cannot leave empty state");
    await assert.rejects(() => authority.deliver({ ...finalEnvelope, result: { ...finalEnvelope.result, relationships: [{ ...finalEnvelope.result.relationships[0], evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "outside-authorized-context", excerpt: "outside" }] }] } }, handler), /outside the authorized context/, "a reconciliation reference outside its authorized context rolls back before final acceptance");
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [reconciliation3]))[0].count, 0, "an unauthorized final reference leaves no partial result");
    await authority.deliver(finalEnvelope, handler);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_reconciliation_result WHERE execution_id=$1", [reconciliation3]))[0].count, 1, "final reconciliation is accepted exactly once");
    assert.equal((await atlas.unsafe("SELECT state, completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [bundle]))[0].state, "ready_for_review", "all twelve completion checks gate the bundle transition");
    assert.equal((await atlas.unsafe("SELECT state FROM atlas.workspace WHERE id=$1", [workspace]))[0].state, "ready_for_review", "the bootstrap workspace changes only with final completion");
    await authority.deliver(finalEnvelope, handler);
    assert.equal((await atlas.unsafe("SELECT completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [bundle]))[0].completed_document_count, 3, "replay has no second progress effect");
    const overBudgetExtraction = `over-budget-extraction-${suffix}`; const overBudgetResult = `over-budget-result-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'completed','perception',$6,now()+interval '1 hour',$7,now())", [overBudgetExtraction, project, workspace, overBudgetBundle, overBudgetDocument, canonicalSemanticFingerprint(overBudgetExtraction), `over-budget-fingerprint-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,'{}','{}',$8)", [overBudgetResult, overBudgetExtraction, project, workspace, overBudgetBundle, overBudgetDocument, sha, `over-budget-fingerprint-${suffix}`]);
    for (let index = 0; index < 500; index += 1) {
      const candidate = `over-budget-candidate-${index}-${suffix}`; const semantic = `over-budget-semantic-${index}-${suffix}`;
      await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'over-budget','rule',$7::jsonb,$8,false,'candidate')", [candidate, overBudgetResult, project, workspace, overBudgetBundle, overBudgetDocument, { text: "界".repeat(2000) }, `over-budget-${index}`]);
      await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'over-budget','rule',$6)", [semantic, project, workspace, overBudgetBundle, overBudgetDocument, candidate]);
      await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,1,'text_block',$4,'over budget')", [`over-budget-evidence-${index}-${suffix}`, candidate, overBudgetDocument, `over-budget-${index}`]);
    }
    await assert.rejects(() => selector.select({ ...scope, bundleId: overBudgetBundle, documentId: overBudgetDocument, executionId: `over-budget-reconciliation-${suffix}` }), /Current reconciliation candidates and required evidence exceed/);
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate WHERE bundle_id=$1 AND document_id=$2", [overBudgetBundle, overBudgetDocument]))[0].count, semanticLimits.currentCandidates, "the selector fails rather than dropping any current candidate");
    const pagingCandidate = `paging-candidate-${suffix}`; const pagingSemantic = `paging-semantic-${suffix}`;
    await atlas.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,$4,$5,$6,'paging','actor','{}','paging candidate',false,'candidate')", [pagingCandidate, extractionResult, project, workspace, bundle, first]);
    await atlas.unsafe("INSERT INTO atlas.knowledge_index (semantic_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,'paging','actor',$6)", [pagingSemantic, project, workspace, bundle, first, pagingCandidate]);
    for (let index = 0; index < 101; index += 1) await atlas.unsafe("INSERT INTO atlas.semantic_evidence (id,semantic_candidate_id,document_id,page_number,locator_type,locator_id,excerpt) VALUES ($1,$2,$3,$4,'text_block',$5,'paged')", [`paging-evidence-${String(index).padStart(3, "0")}-${suffix}`, pagingCandidate, first, index + 1, `paging-${index}`]);
    const evidencePageOne = await repository.listEvidence({ projectId: project, workspaceId: workspace, bundleId: bundle, semanticId: pagingSemantic, limit: 999 });
    const evidencePageTwo = await repository.listEvidence({ projectId: project, workspaceId: workspace, bundleId: bundle, semanticId: pagingSemantic, afterEvidenceId: evidencePageOne.at(-1)!.evidenceId });
    assert.equal(evidencePageOne.length, 100);
    assert.equal(evidencePageTwo.length, 1);
    assert.equal(new Set([...evidencePageOne, ...evidencePageTwo].map((item) => item.evidenceId)).size, 101, "evidence pagination has no omissions or duplicates");
    await atlas.unsafe("INSERT INTO atlas.reconciliation_relationship (id,reconciliation_result_id,project_id,workspace_id,bundle_id,source_semantic_id,target_semantic_id,relationship_type,payload,requires_resolution) SELECT concat('plan-relationship-', series, '-', $5::text), (SELECT id FROM atlas.semantic_reconciliation_result WHERE execution_id=$4), $1,$2,$3,concat('bulk-semantic-', series % 499, '-', $5::text),concat('bulk-semantic-', (series + 1) % 499, '-', $5::text),'supports','{}'::jsonb,false FROM generate_series(1,5000) AS series", [project, workspace, bundle, execution, suffix]);
    await atlas.unsafe("ANALYZE atlas.reconciliation_relationship");
    await atlas.unsafe("ANALYZE atlas.knowledge_index");
    await atlas.unsafe("ANALYZE atlas.semantic_candidate");
    await atlas.unsafe("ANALYZE atlas.extraction_bundle_document");
    await atlas.unsafe("ANALYZE atlas.semantic_execution");
    // Existing local Compose volumes may have recorded migration 0019 before
    // this second index was introduced; fresh migration runs create it.
    await atlas.unsafe("CREATE INDEX IF NOT EXISTS knowledge_index_reconciliation_key_scope ON atlas.knowledge_index (project_id, workspace_id, bundle_id, semantic_key, semantic_id)");
    await atlas.unsafe("CREATE INDEX IF NOT EXISTS knowledge_index_reconciliation_kind_scope ON atlas.knowledge_index (project_id, workspace_id, bundle_id, kind, document_id, semantic_id)");
    await atlas.unsafe("CREATE INDEX IF NOT EXISTS semantic_evidence_candidate_page ON atlas.semantic_evidence (semantic_candidate_id, id)");
    const selectorPlan = await atlas.unsafe("EXPLAIN (COSTS OFF) SELECT k.semantic_id, c.semantic_key, c.kind, m.sequence, CASE WHEN k.semantic_key = ANY($6::text[]) THEN 0 ELSE 1 END AS match_rank FROM atlas.knowledge_index k JOIN atlas.semantic_candidate c ON c.id=k.semantic_candidate_id JOIN atlas.extraction_bundle_document m ON m.bundle_id=k.bundle_id AND m.document_id=k.document_id AND m.project_id=k.project_id AND m.workspace_id=k.workspace_id JOIN atlas.semantic_execution prior_reconciliation ON prior_reconciliation.id=m.semantic_reconciliation_execution_id AND prior_reconciliation.stage='reconciliation' AND prior_reconciliation.lifecycle='completed' WHERE k.project_id=$1 AND k.workspace_id=$2 AND k.bundle_id=$3 AND m.sequence < $4 AND m.state='completed' AND (k.semantic_key = ANY($6::text[]) OR k.kind = ANY($7::text[])) ORDER BY match_rank ASC, m.sequence ASC, k.semantic_id ASC LIMIT $5", [project, workspace, bundle, 2, 501, ["quota"], ["rule"]]);
    // The selector plan above is deliberately unforced. Keep the existing
    // bounded traversal index checks deterministic in their small fixture.
    await atlas.unsafe("SET enable_seqscan=off");
    const evidencePlan = await atlas.unsafe("EXPLAIN (COSTS OFF) SELECT e.id FROM atlas.knowledge_index k JOIN atlas.semantic_evidence e ON e.semantic_candidate_id=k.semantic_candidate_id WHERE k.semantic_id=$1 AND k.project_id=$2 AND k.workspace_id=$3 AND k.bundle_id=$4 ORDER BY e.id LIMIT 100", [pagingSemantic, project, workspace, bundle]);
    const relationshipPlan = await atlas.unsafe("EXPLAIN (COSTS OFF) SELECT id FROM (SELECT r.id FROM atlas.reconciliation_relationship r WHERE r.project_id=$1 AND r.workspace_id=$2 AND r.bundle_id=$3 AND r.source_semantic_id=$4 UNION SELECT r.id FROM atlas.reconciliation_relationship r WHERE r.project_id=$1 AND r.workspace_id=$2 AND r.bundle_id=$3 AND r.target_semantic_id=$4) AS relationships ORDER BY id LIMIT 100", [project, workspace, bundle, current[0].id]);
    assert.match(selectorPlan.map((row) => String(row["QUERY PLAN"])).join("\n"), /Index (Only )?Scan using knowledge_index_/);
    assert.match(evidencePlan.map((row) => String(row["QUERY PLAN"])).join("\n"), /semantic_evidence_candidate_page/);
    assert.match(relationshipPlan.map((row) => String(row["QUERY PLAN"])).join("\n"), /Index (Only )?Scan using reconciliation_relationship_/);
  } finally {
    await admin.unsafe("DELETE FROM pgboss.job WHERE data->'request'->>'executionId' IN (SELECT perception_execution_id FROM atlas.extraction_bundle_document WHERE bundle_id=$1)", [bundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.semantic_execution_context WHERE execution_id=$1", [execution]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE bundle_id=$1 OR bundle_id=$2", [bundle, overBudgetBundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1 OR bundle_id=$2", [bundle, overBudgetBundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1 OR id=$2", [bundle, overBudgetBundle]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.document WHERE id=$1 OR id=$2 OR id=$3 OR id=$4", [first, second, third, overBudgetDocument]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE project_id=$1", [foreignProject]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE project_id=$1", [foreignProject]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.extraction_bundle WHERE project_id=$1", [foreignProject]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.document WHERE project_id=$1", [foreignProject]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.workspace WHERE project_id=$1", [foreignProject]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [foreignProject]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [workspace]).catch(() => undefined); await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined); await admin.unsafe('DELETE FROM auth."user" WHERE id = ANY($1::text[])', [[owner, foreignOwner]]).catch(() => undefined); await Promise.all([perceptionQueue.close(), perceptionQueueRegistrar.stop({ graceful: false }), admin.end(), atlas.end(), atlasSecond.end()]);
  }
});
