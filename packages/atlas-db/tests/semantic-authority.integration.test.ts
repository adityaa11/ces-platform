import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { createSemanticInternalRoutes } from "@atlas/core";
import { semanticLimits } from "@atlas/contracts";
import { PostgresSemanticAuthority, canonicalSemanticFingerprint } from "../src/semantic-authority.ts";

const databaseUrl = process.env.DATABASE_URL;
const capability = "capability";
const scopeOf = (id: string, project: string, workspace: string, bundle: string, document: string) => ({ projectId: project, workspaceId: workspace, bundleId: bundle, documentId: document, executionId: id, contractVersion: "v1" as const });
const normalized = (executionId: string, document: string, sourceSha256: string) => ({ version: "v1" as const, executionId, artifactId: document, sourceSha256, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "test", processor: "test", executionId, processedAt: "2026-09-27T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] });

test("semantic authority binds execution context, replay, failure, and Bridge isolation in PostgreSQL", { skip: !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 }); const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = randomUUID(); const owner = `semantic-owner-${suffix}`; const project = `semantic-project-${suffix}`; const workspace = `semantic-workspace-${suffix}`; const bundle = `semantic-bundle-${suffix}`; const controlBundle = `semantic-control-bundle-${suffix}`; const document = `semantic-document-${suffix}`; const controlDocument = `semantic-control-document-${suffix}`; const boundaryDocument = `semantic-boundary-document-${suffix}`; const raceDocument = `semantic-race-document-${suffix}`; const failureDocument = `semantic-failure-document-${suffix}`; const conflictDocument = `semantic-conflict-document-${suffix}`; const perception = `perception-${suffix}`; const boundaryPerception = `perception-boundary-${suffix}`; const perceptionFailure = `perception-failure-${suffix}`; const otherPerception = `perception-other-${suffix}`; const extraction = `semantic-extraction-${suffix}`; const controlExecution = `semantic-control-${suffix}`; const boundaryExtraction = `semantic-boundary-${suffix}`; const reconciliation = `semantic-reconciliation-${suffix}`; const race = `semantic-race-${suffix}`; const failureRace = `semantic-failure-race-${suffix}`; const conflict = `semantic-conflict-${suffix}`; const sha = "a".repeat(64); const boundarySha = "b".repeat(64);
  const insertExecution = (id: string, stage: "extraction" | "reconciliation", documentId = document) => atlas.unsafe("INSERT INTO atlas.semantic_execution (id, project_id, workspace_id, bundle_id, document_id, stage, contract_version, skill_version, logical_identity, lifecycle, authorized_context_identity, authorized_context_fingerprint, capability_valid_until) VALUES ($1,$2,$3,$4,$5,$6,'v1','v1',$1,'queued','context',$7,now()+interval '1 hour')", [id, project, workspace, bundle, documentId, stage, canonicalSemanticFingerprint(capability)]);
  let scenarioError: unknown;
  try {
    // A negative assertion must never strand the one-off Compose runner behind
    // a leaked lock. These limits are above the deliberate race delays below.
    await admin.unsafe("SET lock_timeout='2s'; SET statement_timeout='5s'");
    await atlas.unsafe("SET lock_timeout='2s'; SET statement_timeout='5s'");
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'semantic',$3)", [project, `semantic-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf','private/source',$4,1,'application/pdf',$5)", [document, project, workspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'boundary.pdf','private/boundary',$4,1,'application/pdf',$5),($6,$2,$3,'race.pdf','private/race',$7,1,'application/pdf',$5),($8,$2,$3,'failure.pdf','private/failure',$7,1,'application/pdf',$5),($9,$2,$3,'conflict.pdf','private/conflict',$7,1,'application/pdf',$5)", [boundaryDocument, project, workspace, boundarySha, owner, raceDocument, sha, failureDocument, conflictDocument]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',5)", [bundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'control.pdf','private/control',$4,1,'application/pdf',$5)", [controlDocument, project, workspace, sha, owner]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [controlBundle, project, workspace]);
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state) VALUES ($1,$2,$3,$4,1,'pending')", [controlBundle, controlDocument, project, workspace]);
    // The manifest becomes immutable once its first member is accepted. Seed
    // every scenario document in one statement before creating executions.
    await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'pending',$5),($1,$6,$3,$4,2,'pending',$7),($1,$8,$3,$4,3,'pending',NULL),($1,$9,$3,$4,4,'pending',NULL),($1,$10,$3,$4,5,'pending',NULL)", [bundle, document, project, workspace, perception, boundaryDocument, boundaryPerception, raceDocument, failureDocument, conflictDocument]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/source',$3,'application/pdf',1,'v1','completed',$4,'test')", [perception, document, sha, `perception-key-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/boundary',$3,'application/pdf',1,'v1','completed',$4,'boundary')", [boundaryPerception, boundaryDocument, boundarySha, `perception-boundary-key-${suffix}`]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/failure',$3,'application/pdf',1,'v1','queued',$4,'failure')", [perceptionFailure, failureDocument, sha, `perception-failure-key-${suffix}`]);
    await atlas.unsafe("UPDATE atlas.extraction_bundle_document SET perception_execution_id=$3, state='perception_queued', started_at=now() WHERE bundle_id=$1 AND document_id=$2", [bundle, failureDocument, perceptionFailure]);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','test',$3::jsonb)", [`cache-${suffix}`, sha, JSON.stringify(normalized(perception, document, sha))]);
    const boundaryScope = scopeOf(boundaryExtraction, project, workspace, bundle, boundaryDocument);
    const boundaryNormalized = normalized(boundaryPerception, boundaryDocument, boundarySha); boundaryNormalized.pages[0].textBlocks.push({ id: "limit-a", text: "" }, { id: "limit-b", text: "" });
    const boundaryContext = { version: "v1", skill: "atlas.semantic.extract", scope: boundaryScope, normalizedDocument: boundaryNormalized };
    const boundaryPadding = semanticLimits.contextBytes - Buffer.byteLength(JSON.stringify(boundaryContext));
    boundaryNormalized.pages[0].textBlocks[0].text = "x".repeat(Math.min(1_000_000, boundaryPadding)); boundaryNormalized.pages[0].textBlocks[1].text = "x".repeat(Math.max(0, boundaryPadding - 1_000_000));
    assert.equal(Buffer.byteLength(JSON.stringify(boundaryContext)), semanticLimits.contextBytes);
    await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive','boundary',$3::jsonb)", [`boundary-cache-${suffix}`, boundarySha, JSON.stringify(boundaryNormalized)]);
    await insertExecution(extraction, "extraction"); await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'queued','context',$6,now()+interval '1 hour')", [controlExecution, project, workspace, controlBundle, controlDocument, canonicalSemanticFingerprint(capability)]); await insertExecution(boundaryExtraction, "extraction", boundaryDocument); await insertExecution(reconciliation, "reconciliation"); await insertExecution(race, "extraction", raceDocument); await insertExecution(failureRace, "extraction", failureDocument); await insertExecution(conflict, "extraction", conflictDocument);
    let selectionCalls = 0;
    const selection = { select: async (scope: ReturnType<typeof scopeOf>) => { selectionCalls += 1; return { version: "v1", skill: "atlas.semantic.reconcile", scope, currentCandidates: [], priorCandidates: selectionCalls === 1 ? [] : [{ id: "later", semantic_key: "later", kind: "rule", normalized_meaning: "later", payload: {}, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "later", excerpt: "later" }] }], selection: { policy: "idser-007-test", version: "v1", overflow: false, selectedCount: 0, currentCount: 0, totalCount: 0, byteLimit: semanticLimits.contextBytes, byteCount: 0, omittedPriorCount: 0 } }; } };
    const authority = new PostgresSemanticAuthority(atlas, selection);
    const extractionScope = scopeOf(extraction, project, workspace, bundle, document);
    const extractionJob = { version: "v1" as const, executionId: extraction, skill: { id: "atlas.semantic.extract" as const, version: "v1" as const }, contextCapability: capability };
    const routes = createSemanticInternalRoutes({ serviceCredential: "s".repeat(32), authority, handler: { accept: async () => { accepted += 1; } } });
    let accepted = 0;
    const snapshotExecution = async (executionId: string) => await atlas.unsafe("SELECT e.lifecycle, b.completed_document_count, m.state AS member_state, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE execution_id=e.id) AS extraction_results, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE execution_id=e.id) AS reconciliation_results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE bundle_id=e.bundle_id AND document_id=e.document_id) AS candidates, (SELECT count(*)::int FROM atlas.semantic_evidence WHERE document_id=e.document_id AND semantic_candidate_id IN (SELECT id FROM atlas.semantic_candidate WHERE bundle_id=e.bundle_id AND document_id=e.document_id)) AS evidence, (SELECT count(*)::int FROM atlas.knowledge_index WHERE bundle_id=e.bundle_id AND document_id=e.document_id) AS knowledge, (SELECT count(*)::int FROM atlas.reconciliation_relationship WHERE bundle_id=e.bundle_id) AS relationships, (SELECT count(*)::int FROM atlas.semantic_execution WHERE bundle_id=e.bundle_id AND document_id=e.document_id AND stage='reconciliation') AS successors FROM atlas.semantic_execution e JOIN atlas.extraction_bundle b ON b.id=e.bundle_id JOIN atlas.extraction_bundle_document m ON m.bundle_id=e.bundle_id AND m.document_id=e.document_id WHERE e.id=$1", [executionId]);
    const denialSnapshot = async () => JSON.parse(JSON.stringify({ target: await snapshotExecution(extraction), control: await snapshotExecution(controlExecution), queue: await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE data->'execution'->>'executionId'=$1 OR data->'execution'->>'executionId'=$2", [extraction, controlExecution]) }));
    assert.equal((await routes.context("wrong", { version: "v1" })).status, 401);
    assert.equal((await routes.context("s".repeat(32), extractionJob)).status, 200);
    const beforeDenials = await denialSnapshot();
    assert.equal((await routes.deliver("s".repeat(32), { version: "v1", scope: { ...extractionScope, executionId: "wrong-execution" }, skill: extractionJob.skill, provider: { provider: "test", model: "test", endpoint: "internal", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] } })).status, 409);
    assert.deepEqual(await denialSnapshot(), beforeDenials, "unauthorized or mismatched context/result denial leaves target, unrelated control, materialization, lifecycle, progress, and queue state unchanged");
    assert.equal((await routes.context("s".repeat(32), { ...extractionJob, skill: { id: "atlas.semantic.reconcile", version: "v1" } })).status, 400);
    assert.equal((await routes.context("s".repeat(32), { ...extractionJob, skill: { id: "atlas.semantic.extract", version: "wrong" } })).status, 400);
    assert.equal((await routes.context("s".repeat(32), { ...extractionJob, contextCapability: "x".repeat(20000) })).status, 400);
    const stream = (source: string) => new ReadableStream<Uint8Array>({ start(controller) { for (let index = 0; index < source.length; index += 127) controller.enqueue(Buffer.from(source.slice(index, index + 127))); controller.close(); } });
    const exactRequest = `${" ".repeat(semanticLimits.jobBytes - Buffer.byteLength(JSON.stringify(extractionJob)))}${JSON.stringify(extractionJob)}`;
    const internalCredential = process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL ?? "agents_bridge_service_local_dev_only_32";
    // This test runs in a one-off Compose container. `localhost` is that
    // container, not the long-running Atlas service that owns the internal
    // route, so use the Compose service DNS name by default.
    const atlasInternalUrl = process.env.ATLAS_INTERNAL_URL ?? "http://atlas:3001";
    const internalRequest = async (path: string, body: string) => fetch(`${atlasInternalUrl}${path}`, { method: "POST", headers: { authorization: `Bearer ${internalCredential}`, "content-type": "application/json" }, body: stream(body), duplex: "half", signal: AbortSignal.timeout(5_000) } as RequestInit);
    const perceptionFailureEnvelope = { request: { version: "v1", executionId: perceptionFailure, artifact: { id: failureDocument, mimeType: "application/pdf", byteSize: 1, sourceSha256: sha }, source: { grant: `123e4567-e89b-12d3-a456-426614174000.${"a".repeat(43)}` }, perception: { capability: "atlas.document.perceive", contractVersion: "v1" } }, code: "provider_timeout" };
    assert.equal((await internalRequest("/internal/perception/failure", JSON.stringify(perceptionFailureEnvelope))).status, 204, "the authenticated perception failure handoff persists terminal lifecycle truth");
    assert.equal((await internalRequest("/internal/perception/failure", JSON.stringify({ ...perceptionFailureEnvelope, request: { ...perceptionFailureEnvelope.request, artifact: { ...perceptionFailureEnvelope.request.artifact, id: document } } }))).status, 400, "a forged perception failure cannot affect another execution");
    assert.deepEqual((await atlas.unsafe("SELECT p.state AS perception_state, m.state AS member_state, b.state AS bundle_state, m.last_failure_code AS member_failure_code, b.last_failure_code AS bundle_failure_code FROM atlas.document_perception_execution p JOIN atlas.extraction_bundle_document m ON m.perception_execution_id=p.id JOIN atlas.extraction_bundle b ON b.id=m.bundle_id WHERE p.id=$1", [perceptionFailure]))[0], { perception_state: "failed", member_state: "needs_attention", bundle_state: "needs_attention", member_failure_code: "provider_timeout", bundle_failure_code: "provider_timeout" });
    assert.equal(Buffer.byteLength(exactRequest), semanticLimits.jobBytes);
    assert.equal((await internalRequest("/internal/semantic/context", exactRequest)).status, 200);
    assert.equal((await internalRequest("/internal/semantic/context", `${exactRequest} `)).status, 400);
    const boundaryJob = { ...extractionJob, executionId: boundaryExtraction };
    const localBoundary = await authority.redeem(boundaryJob); assert.equal(Buffer.byteLength(JSON.stringify(localBoundary.context)), semanticLimits.contextBytes);
    const exactResponse = await internalRequest("/internal/semantic/context", JSON.stringify(boundaryJob));
    const exactResponseBody = await exactResponse.text(); assert.equal(exactResponse.status, 200); assert.equal(Buffer.byteLength(exactResponseBody), semanticLimits.contextBytes); assert.equal(JSON.parse(exactResponseBody).scope.executionId, boundaryExtraction);
    boundaryNormalized.pages[0].textBlocks[1].text += "x";
    await atlas.unsafe("UPDATE atlas.normalized_document_cache SET normalized_document=$2::jsonb WHERE cache_key=$1", [`boundary-cache-${suffix}`, JSON.stringify(boundaryNormalized)]);
    const overLimitResponse = await internalRequest("/internal/semantic/context", JSON.stringify(boundaryJob));
    assert.equal(overLimitResponse.status, 400); assert.ok(Buffer.byteLength(await overLimitResponse.text()) < 512);
    await atlas.unsafe("UPDATE atlas.semantic_execution SET capability_valid_until=now()-interval '1 second' WHERE id=$1", [extraction]);
    assert.equal((await routes.context("s".repeat(32), extractionJob)).status, 400);
    await atlas.unsafe("UPDATE atlas.semantic_execution SET capability_valid_until=now()+interval '1 hour' WHERE id=$1", [extraction]);
    await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/source',$3,'application/pdf',1,'v1','completed',$4,'test')", [otherPerception, document, sha, `perception-other-key-${suffix}`]);
    await atlas.unsafe("UPDATE atlas.normalized_document_cache SET normalized_document=$2::jsonb WHERE cache_key=$1", [`cache-${suffix}`, JSON.stringify(normalized(otherPerception, document, sha))]);
    await assert.rejects(() => authority.redeem(extractionJob), /binding failed/);
    await atlas.unsafe("UPDATE atlas.normalized_document_cache SET normalized_document=$2::jsonb WHERE cache_key=$1", [`cache-${suffix}`, JSON.stringify(normalized(perception, document, sha))]);
    assert.equal((await authority.redeem(extractionJob)).scope.executionId, extraction);
    await assert.rejects(() => authority.redeem({ ...extractionJob, contextCapability: "wrong" }), /stale|authorization/);
    const reconciliationJob = { version: "v1" as const, executionId: reconciliation, skill: { id: "atlas.semantic.reconcile" as const, version: "v1" as const }, contextCapability: capability };
    const first = await authority.redeem(reconciliationJob); const second = await authority.redeem(reconciliationJob);
    assert.deepEqual(first.context, second.context); assert.equal(selectionCalls, 1);
    const reconciliationScope = scopeOf(reconciliation, project, workspace, bundle, document);
    const reconciliationEnvelope = { version: "v1", scope: reconciliationScope, skill: reconciliationJob.skill, provider: { provider: "test", model: "test", endpoint: "internal", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", relationships: [], questions: [] } };
    let cancelledHandlerCalls = 0;
    await atlas.unsafe("UPDATE atlas.semantic_execution SET lifecycle='cancelled' WHERE id=$1", [reconciliation]);
    assert.equal((await routes.context("s".repeat(32), reconciliationJob)).status, 400);
    assert.equal((await routes.deliver("s".repeat(32), reconciliationEnvelope)).status, 409);
    assert.equal((await routes.fail("s".repeat(32), { version: "v1", scope: reconciliationScope, code: "provider_timeout", message: "cancelled" })).status, 400);
    const cancellationBodies = await Promise.all([
      internalRequest("/internal/semantic/context", JSON.stringify(reconciliationJob)),
      internalRequest("/internal/semantic/result", JSON.stringify(reconciliationEnvelope)),
      internalRequest("/internal/semantic/failure", JSON.stringify({ version: "v1", scope: reconciliationScope, code: "provider_timeout", message: "cancelled provider payload prompt grant SELECT private/source" })),
    ]);
    assert.deepEqual(cancellationBodies.map(({ status }) => status), [400, 409, 400]);
    for (const response of cancellationBodies) { const body = await response.text(); assert.ok(Buffer.byteLength(body) < 512); assert.doesNotMatch(body, /provider|payload|prompt|grant|credential|private|source|select|document|capability/i); }
    await assert.rejects(() => authority.deliver(reconciliationEnvelope, { accept: async () => { cancelledHandlerCalls += 1; } }), /not accepting/);
    assert.equal(cancelledHandlerCalls, 0);
    await atlas.unsafe("UPDATE atlas.semantic_execution SET lifecycle='running' WHERE id=$1", [reconciliation]);
    await admin.unsafe("CREATE TABLE atlas.idser004_provisional_acceptance (execution_id text PRIMARY KEY)"); await admin.unsafe("ALTER TABLE atlas.idser004_provisional_acceptance OWNER TO atlas_app");
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.idser004_fail_after_provisional_acceptance() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO atlas.idser004_provisional_acceptance (execution_id) VALUES (NEW.id); RAISE EXCEPTION 'IDSER-004 controlled acceptance persistence failure'; END; $$");
    await admin.unsafe("CREATE TRIGGER idser004_fail_after_provisional_acceptance BEFORE UPDATE OF lifecycle ON atlas.semantic_execution FOR EACH ROW WHEN (NEW.lifecycle = 'completed') EXECUTE FUNCTION atlas.idser004_fail_after_provisional_acceptance()");
    assert.equal((await routes.deliver("s".repeat(32), reconciliationEnvelope)).status, 409);
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [reconciliation]))[0].lifecycle, "running");
    assert.equal((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.idser004_provisional_acceptance WHERE execution_id=$1", [reconciliation]))[0].count, 0);
    await admin.unsafe("DROP TRIGGER idser004_fail_after_provisional_acceptance ON atlas.semantic_execution"); await admin.unsafe("DROP FUNCTION atlas.idser004_fail_after_provisional_acceptance()"); await admin.unsafe("DROP TABLE atlas.idser004_provisional_acceptance");
    const failingRoutes = createSemanticInternalRoutes({ serviceCredential: "s".repeat(32), authority, handler: { accept: async () => { throw new Error("enqueue failed"); } } });
    assert.equal((await failingRoutes.deliver("s".repeat(32), reconciliationEnvelope)).status, 409);
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [reconciliation]))[0].lifecycle, "running");
    await authority.fail({ scope: reconciliationScope, code: "provider_timeout" }); await authority.fail({ scope: reconciliationScope, code: "provider_timeout" });
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [reconciliation]))[0].lifecycle, "failed");
    assert.deepEqual((await atlas.unsafe("SELECT m.state AS member_state, b.state AS bundle_state, m.last_failure_code AS member_failure_code, b.last_failure_code AS bundle_failure_code FROM atlas.extraction_bundle_document m JOIN atlas.extraction_bundle b ON b.id=m.bundle_id WHERE m.bundle_id=$1 AND m.document_id=$2", [bundle, document]))[0], { member_state: "needs_attention", bundle_state: "needs_attention", member_failure_code: "provider_timeout", bundle_failure_code: "provider_timeout" });
    assert.equal((await routes.deliver("s".repeat(32), reconciliationEnvelope)).status, 409);
    const envelope = { version: "v1", scope: extractionScope, skill: extractionJob.skill, provider: { provider: "test", model: "test", endpoint: "internal", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] } };
    const raceScope = scopeOf(race, project, workspace, bundle, raceDocument);
    const raceEnvelope = { ...envelope, scope: raceScope };
    let raceEffects = 0;
    let releaseCompletion!: () => void;
    const completionGate = new Promise<void>((resolve) => { releaseCompletion = resolve; });
    const completion = authority.deliver(raceEnvelope, { accept: async () => { raceEffects += 1; await completionGate; } });
    await new Promise((resolve) => setImmediate(resolve));
    const failure = authority.fail({ scope: raceScope, code: "provider_timeout" }); releaseCompletion();
    await completion; await assert.rejects(failure, /unauthorized/);
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [race]))[0].lifecycle, "completed"); assert.equal(raceEffects, 1);
    const failureRaceScope = scopeOf(failureRace, project, workspace, bundle, failureDocument);
    const failureRaceEnvelope = { ...envelope, scope: failureRaceScope };
    const failureGate = 104004;
    await admin.unsafe("CREATE OR REPLACE FUNCTION atlas.idser004_hold_failure_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(104004); RETURN NEW; END; $$");
    await admin.unsafe("CREATE TRIGGER idser004_hold_failure_commit BEFORE UPDATE OF lifecycle ON atlas.semantic_execution FOR EACH ROW EXECUTE FUNCTION atlas.idser004_hold_failure_commit()");
    const gate = postgres(databaseUrl!, { max: 1 });
    await gate.unsafe("SELECT pg_advisory_lock($1)", [failureGate]);
    const failureFirst = authority.fail({ scope: failureRaceScope, code: "provider_timeout" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const completionAfterFailure = authority.deliver(failureRaceEnvelope, { accept: async () => { raceEffects += 1; } });
    await gate.unsafe("SELECT pg_advisory_unlock($1)", [failureGate]); await gate.end();
    await failureFirst; await assert.rejects(completionAfterFailure, /not accepting/);
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [failureRace]))[0].lifecycle, "failed"); assert.equal(raceEffects, 1);
    await admin.unsafe("DROP TRIGGER idser004_hold_failure_commit ON atlas.semantic_execution"); await admin.unsafe("DROP FUNCTION atlas.idser004_hold_failure_commit()");
    const conflictScope = scopeOf(conflict, project, workspace, bundle, conflictDocument);
    const conflicts = await Promise.allSettled([authority.deliver({ ...envelope, scope: conflictScope }, { accept: async () => { raceEffects += 1; } }), authority.deliver({ ...envelope, scope: conflictScope, provider: { ...envelope.provider, model: "different" } }, { accept: async () => { raceEffects += 1; } })]);
    assert.equal(conflicts.filter(({ status }) => status === "fulfilled").length, 1); assert.equal(raceEffects, 2);
    const rejected = await routes.deliver("s".repeat(32), { ...envelope, scope: { ...envelope.scope, projectId: "wrong" } });
    assert.equal(rejected.status, 409); assert.deepEqual(rejected.body, { error: "Semantic delivery cannot be accepted." }); assert.doesNotMatch(JSON.stringify(rejected.body), /private|capability|SELECT|test/i);
    const deliveries = await Promise.all([routes.deliver("s".repeat(32), envelope), routes.deliver("s".repeat(32), envelope)]);
    assert.deepEqual(deliveries.map(({ status }) => status), [204, 204]); assert.equal(accepted, 2);
    await assert.rejects(() => authority.deliver({ ...envelope, provider: { ...envelope.provider, model: "changed" } }, { accept: async () => {} }), /conflicts/);
    await assert.rejects(() => authority.fail({ scope: extractionScope, code: "provider_timeout" }), /unauthorized/);
    await assert.rejects(() => bridge.unsafe("SELECT * FROM atlas.semantic_execution"), /permission denied/i);
  } catch (error) {
    scenarioError = error;
    throw error;
  } finally {
    try {
    await admin.unsafe("DROP TRIGGER IF EXISTS idser004_fail_after_provisional_acceptance ON atlas.semantic_execution"); await admin.unsafe("DROP FUNCTION IF EXISTS atlas.idser004_fail_after_provisional_acceptance()"); await admin.unsafe("DROP TRIGGER IF EXISTS idser004_hold_failure_commit ON atlas.semantic_execution"); await admin.unsafe("DROP FUNCTION IF EXISTS atlas.idser004_hold_failure_commit()"); await admin.unsafe("DROP TABLE IF EXISTS atlas.idser004_provisional_acceptance");
    await admin.unsafe("DELETE FROM atlas.semantic_execution_context WHERE execution_id=$1 OR execution_id=$2", [extraction, reconciliation]); await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE id IN ($1,$2,$3,$4,$5,$6,$7)", [extraction, controlExecution, boundaryExtraction, reconciliation, race, failureRace, conflict]); await admin.unsafe("DELETE FROM atlas.normalized_document_cache WHERE cache_key=$1 OR cache_key=$2", [`cache-${suffix}`, `boundary-cache-${suffix}`]); await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1 OR id=$2 OR id=$3 OR id=$4", [perception, boundaryPerception, perceptionFailure, otherPerception]); await admin.unsafe("UPDATE atlas.extraction_bundle SET state='waiting', started_at=NULL, completed_at=NULL, last_failure_code=NULL, last_failure_at=NULL WHERE id=$1", [bundle]); await admin.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1 OR bundle_id=$2", [bundle, controlBundle]); await admin.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1 OR id=$2", [bundle, controlBundle]); await admin.unsafe("DELETE FROM atlas.document WHERE id IN ($1,$2,$3,$4,$5,$6)", [document, controlDocument, boundaryDocument, raceDocument, failureDocument, conflictDocument]); await admin.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [workspace]); await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]); await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
    } catch (cleanupError) {
      if (!scenarioError) throw cleanupError;
      console.error("semantic-authority cleanup failed after the scenario error:", cleanupError);
    } finally {
      await Promise.allSettled([admin.end(), atlas.end(), bridge.end()]);
    }
  }
});
