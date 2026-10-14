import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { provisionalSemanticCompositeAccountingVersion, relationshipContractVersion, relationshipSha256 } from "@atlas/skills";
import { createSemanticCompositeReplay, SemanticCompositeConflictError, SemanticCompositeLeaseLostError, semanticCompositeHash, type SemanticCompositeStageInput } from "../src/semantic-composite-replay.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function childReplay(): Promise<void> {
  const raw = process.env.REL03_COMPOSITE_CHILD_INPUT;
  if (!raw || !databaseUrl) throw new Error("REL-03 child replay input is unavailable.");
  const bridgeUrl = new URL(databaseUrl); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const database = { executeSql: async (query: string, parameters?: readonly unknown[]) => {
    const values = query.includes("$5::jsonb") && parameters ? parameters.map((value, index) => index >= 4 && index <= 9 && typeof value === "string" ? JSON.parse(value) : value) : parameters;
    return { rows: await bridge.unsafe(query, values as readonly (string | number | null | object)[] | undefined) };
  } };
  try {
    const input = JSON.parse(raw) as SemanticCompositeStageInput;
    const replay = createSemanticCompositeReplay(database);
    const result = process.env.REL03_COMPOSITE_CHILD_MODE === "stage" ? await replay.stage(input) : await replay.load(input.idempotencyKey, input.executionId);
    process.stdout.write(JSON.stringify(result));
  } finally { await bridge.end(); }
}

if (process.env.REL03_COMPOSITE_CHILD_MODE) {
  await childReplay();
} else test("REL-03 durable composite staging is fenced, immutable, restart-readable, and Bridge-only", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 3 });
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 3 }); const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const suffix = randomUUID(); const idempotencyKey = `rel03-durable-${suffix}`; const executionId = `rel03-execution-${suffix}`;
  // pg-boss's executeSql accepts JSON text; postgres.js needs JSON values here
  // to bind the same $n::jsonb placeholders without double-stringifying them.
  const database = { executeSql: async (query: string, parameters?: readonly unknown[]) => {
    const values = query.includes("$5::jsonb") && parameters
      ? parameters.map((value, index) => index >= 4 && index <= 9 && typeof value === "string" ? JSON.parse(value) : value)
      : parameters;
    return { rows: await bridge.unsafe(query, values as readonly (string | number | null | object)[] | undefined) };
  } };
  const replay = createSemanticCompositeReplay(database);
  const child = (mode: "stage" | "load", input: SemanticCompositeStageInput) => new Promise<{ readonly code: number | null; readonly output: string }>((resolve, reject) => {
    const processChild = spawn(process.execPath, ["apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs", "apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts"], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl, REL03_COMPOSITE_CHILD_MODE: mode, REL03_COMPOSITE_CHILD_INPUT: JSON.stringify(input) }, stdio: ["ignore", "pipe", "pipe"] });
    let output = ""; let error = "";
    processChild.stdout.on("data", (chunk: Buffer) => { output += chunk; }); processChild.stderr.on("data", (chunk: Buffer) => { error += chunk; });
    processChild.on("error", reject); processChild.on("close", (code) => code === 0 ? resolve({ code, output }) : reject(new Error(`REL-03 child ${mode} failed: ${error}`)));
  });
  const makeInput = (overrides: Partial<SemanticCompositeStageInput> = {}): SemanticCompositeStageInput => {
    const { provisionalRelationshipRevisions: _ignoredRevisions, provisionalSidecar: _ignoredSidecar, ...safeOverrides } = overrides;
    const base = {
      idempotencyKey, executionId, lease: { owner: `rel03-owner-${suffix}`, generation: 1 },
      sourceSnapshot: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}`, executionId, artifactId: `document-${suffix}`, sourceSha256: hash(`source-${suffix}`) },
      profile: { id: `profile-${suffix}`, hash: hash(`profile-${suffix}`) }, request: { id: `request-${suffix}`, hash: hash(`request-${suffix}`) },
      canonicalResult: { version: "v1" as const, candidate_assertions: [], source_statement_inventory: [], questions: [] },
    } as const;
    const partial = { ...base, ...safeOverrides } as Omit<SemanticCompositeStageInput, "compositeHash" | "provisionalRelationshipRevisions" | "provisionalSidecar">;
    const source = partial.sourceSnapshot;
    const revisionBody = { contractVersion: relationshipContractVersion, relationshipLineageId: hash(`lineage-${partial.executionId}`), scope: source, normalizedDocument: { executionId: partial.executionId, artifactId: source.artifactId, sourceSha256: source.sourceSha256 }, ownedSource: { slot: "owned-1", pageNumber: 1, locatorType: "text_block", locatorId: "text-1", sourceSha256: source.sourceSha256 }, contextSource: { slot: "context-1", pageNumber: 1, locatorType: "text_block", locatorId: "text-2", sourceSha256: source.sourceSha256 }, relationship: { type: "context_qualifies" as const, direction: "context_to_owned" as const, contextualRole: "legend" as const, necessity: "essential" as const }, disposition: "proposed" as const, uncertainty: "medium" as const, proposedMeaning: "Requires its legend.", sourceLanguage: null, candidateRefs: [{ sourceSlot: "owned-1", candidateIndex: 0 }], proposalProvenance: { providerIdentity: "fixture", providerRun: hash(`provider-${partial.executionId}`), providerRelationshipOrdinal: 0, confidence: null }, predecessor: null, authorization: null };
    const revision = { ...revisionBody, revisionHash: relationshipSha256(revisionBody) };
    const deferred = { deferred_interpretation_id: relationshipSha256({ scope: revision.scope, sourceSlot: "owned-1", candidateIndex: 0, relationshipRevisionHash: revision.revisionHash }), relationship_revision_hash: revision.revisionHash, provider_candidate_tuple: { source_slot: "owned-1", candidate_index: 0 }, source: { owned_source: revision.ownedSource, context_source: revision.contextSource }, uncertainty: "medium" as const, proposed_candidate_meaning: { meaning: "Requires its legend." }, reason: "essential_provisional_relationship" as const, canonical_candidate_id: null };
    const sidecarBody = { version: provisionalSemanticCompositeAccountingVersion, scope: { projectId: source.projectId, workspaceId: source.workspaceId, bundleId: source.bundleId, documentId: source.documentId, executionId: partial.executionId, sourceSha256: source.sourceSha256 }, semanticProfile: partial.profile.id, semanticProfileSha256: partial.profile.hash, requestSha256: partial.request.hash, canonicalResultSha256: relationshipSha256(partial.canonicalResult), canonicalSourceSlots: [], sourceCoverage: [], tupleCoverage: [], deferredInterpretations: [deferred], relationshipDependencies: [revision], authority: { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false } };
    const candidate = { ...partial, provisionalRelationshipRevisions: [revision], provisionalSidecar: { ...sidecarBody, compositeHash: relationshipSha256(sidecarBody) } } as Omit<SemanticCompositeStageInput, "compositeHash">;
    return { ...candidate, compositeHash: semanticCompositeHash(candidate) };
  };
  try {
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [idempotencyKey, executionId, `rel03-owner-${suffix}`]);
    const input = makeInput(); const winner = await replay.stage(input);
    assert.equal(winner.compositeHash, input.compositeHash, "the exact composite hash is persisted");
    const restartReplay = createSemanticCompositeReplay(database); assert.deepEqual(await restartReplay.load(idempotencyKey, executionId), winner, "a new process view retrieves the immutable winner");
    assert.deepEqual(await replay.stage(input), winner, "identical retry returns the original winner");
    const deferredKey = `rel03-deferred-${suffix}`; const deferredExecution = `rel03-deferred-execution-${suffix}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [deferredKey, deferredExecution, `rel03-owner-${suffix}`]);
    const deferred = makeInput({ idempotencyKey: deferredKey, executionId: deferredExecution, canonicalResult: null, sourceSnapshot: { ...input.sourceSnapshot, executionId: deferredExecution } });
    const { compositeHash: _deferredHash, ...deferredWithoutHash } = deferred; const deferredWithHash = { ...deferredWithoutHash, compositeHash: semanticCompositeHash(deferredWithoutHash) };
    assert.equal((await replay.stage(deferredWithHash)).canonicalResult, null, "a genuinely deferred composite persists without fabricating non_fact");
    const conflict = makeInput({ request: { id: `different-request-${suffix}`, hash: hash(`different-request-${suffix}`) } });
    await assert.rejects(() => replay.stage(conflict), SemanticCompositeConflictError, "identity conflicts do not overwrite the winner");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [idempotencyKey]))[0]?.count, 1, "one concurrent-key winner exists");
    const malformed = makeInput();
    const revisionBase = malformed.provisionalRelationshipRevisions[0]!;
    const malformedRelationshipBody = { ...revisionBase, relationship: { ...revisionBase.relationship as Record<string, unknown>, type: "bogus" } }; delete (malformedRelationshipBody as { revisionHash?: string }).revisionHash;
    const malformedRelationship = { ...malformedRelationshipBody, revisionHash: relationshipSha256(malformedRelationshipBody) };
    const originalDeferred = (malformed.provisionalSidecar.deferredInterpretations as readonly Record<string, unknown>[])[0]!;
    const malformedDeferred = { ...originalDeferred, relationship_revision_hash: malformedRelationship.revisionHash, deferred_interpretation_id: relationshipSha256({ scope: malformedRelationship.scope, sourceSlot: (originalDeferred.provider_candidate_tuple as Record<string, unknown>).source_slot, candidateIndex: (originalDeferred.provider_candidate_tuple as Record<string, unknown>).candidate_index, relationshipRevisionHash: malformedRelationship.revisionHash }) };
    const { compositeHash: _originalSidecarHash, ...originalSidecarBody } = malformed.provisionalSidecar;
    const malformedRelationshipSidecarBody = { ...originalSidecarBody, relationshipDependencies: [malformedRelationship], deferredInterpretations: [malformedDeferred] };
    const malformedRelationshipSidecar = { ...malformedRelationshipSidecarBody, compositeHash: relationshipSha256(malformedRelationshipSidecarBody) };
    const malformedRelationshipInputWithoutHash = { ...malformed, provisionalRelationshipRevisions: [malformedRelationship], provisionalSidecar: malformedRelationshipSidecar }; delete (malformedRelationshipInputWithoutHash as { compositeHash?: string }).compositeHash;
    const malformedRelationshipInput = { ...malformedRelationshipInputWithoutHash, compositeHash: semanticCompositeHash(malformedRelationshipInputWithoutHash) } as SemanticCompositeStageInput;
    let validationSqlCalls = 0;
    const validationReplay = createSemanticCompositeReplay({ executeSql: async () => { validationSqlCalls += 1; return { rows: [] }; } });
    await assert.rejects(() => validationReplay.stage(malformedRelationshipInput), /unqualified|malformed/, "self-consistent malformed relationship vocabulary is rejected before SQL");
    assert.equal(validationSqlCalls, 0, "malformed relationship validation makes zero SQL calls");
    await assert.rejects(() => replay.stage({ ...malformed, provisionalRelationshipRevisions: [{}] }), /unqualified|malformed/, "malformed relationship revision is rejected before durable effect");
    await assert.rejects(() => replay.stage({ ...malformed, provisionalRelationshipRevisions: [{ ...malformed.provisionalRelationshipRevisions[0]!, revisionHash: "a".repeat(64) }] }), /tampered|duplicated/, "tampered relationship revision is rejected before durable effect");
    await assert.rejects(() => replay.stage({ ...malformed, provisionalRelationshipRevisions: [...malformed.provisionalRelationshipRevisions, malformed.provisionalRelationshipRevisions[0]!] }), /duplicated/, "duplicate relationship revision is rejected before durable effect");
    const { compositeHash: _sidecarHash, ...sidecarBody } = malformed.provisionalSidecar;
    const fabricatedSidecar = { ...sidecarBody, semanticProfile: "foreign-profile" };
    await assert.rejects(() => replay.stage({ ...malformed, provisionalSidecar: { ...fabricatedSidecar, compositeHash: relationshipSha256(fabricatedSidecar) } }), /unqualified|tampered|inconsistent/, "fabricated sidecar meaning is rejected before durable effect");
    const foreignDeferred = { ...(malformed.provisionalSidecar.deferredInterpretations as readonly Record<string, unknown>[])[0]!, relationship_revision_hash: "b".repeat(64) };
    const foreignSidecar = { ...sidecarBody, deferredInterpretations: [foreignDeferred] };
    await assert.rejects(() => replay.stage({ ...malformed, provisionalSidecar: { ...foreignSidecar, compositeHash: relationshipSha256(foreignSidecar) } }), /foreign|duplicated/, "foreign deferred link is rejected before durable effect");
    const badTupleDeferred = { ...(malformed.provisionalSidecar.deferredInterpretations as readonly Record<string, unknown>[])[0]!, provider_candidate_tuple: { source_slot: "foreign", candidate_index: 1 } };
    const badTupleSidecar = { ...sidecarBody, deferredInterpretations: [badTupleDeferred] };
    await assert.rejects(() => replay.stage({ ...malformed, provisionalSidecar: { ...badTupleSidecar, compositeHash: relationshipSha256(badTupleSidecar) } }), /foreign|duplicated/, "invalid deferred tuple is rejected before durable effect");
    const forgedOwnedDeferred = { ...(malformed.provisionalSidecar.deferredInterpretations as readonly Record<string, unknown>[])[0]!, source: { ...((malformed.provisionalSidecar.deferredInterpretations as readonly Record<string, unknown>[])[0]!.source as Record<string, unknown>), owned_source: { forged: true } } };
    const forgedOwnedSidecar = { ...sidecarBody, deferredInterpretations: [forgedOwnedDeferred] };
    await assert.rejects(() => replay.stage({ ...malformed, provisionalSidecar: { ...forgedOwnedSidecar, compositeHash: relationshipSha256(forgedOwnedSidecar) } }), /foreign|duplicated/, "forged deferred owned-source locator is rejected before durable effect");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [idempotencyKey]))[0]?.count, 1, "rejected input leaves no partial state");
    await bridge.unsafe("UPDATE bridge.background_effects SET lease_generation=2, lease_owner='successor', lease_expires_at=now()-interval '1 second' WHERE idempotency_key=$1", [idempotencyKey]);
    await assert.rejects(() => replay.stage(input), SemanticCompositeLeaseLostError, "expired and superseded claimants write zero rows");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [idempotencyKey]))[0]?.count, 1, "stale claimant preserves the winner");
    const concurrentKey = `rel03-concurrent-${suffix}`; const concurrentExecution = `rel03-concurrent-execution-${suffix}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [concurrentKey, concurrentExecution, `rel03-owner-${suffix}`]);
    const concurrent = makeInput({ idempotencyKey: concurrentKey, executionId: concurrentExecution, sourceSnapshot: { ...input.sourceSnapshot, executionId: concurrentExecution } });
    const { compositeHash: _oldHash, ...concurrentWithoutHash } = concurrent;
    const concurrentWithHash = { ...concurrentWithoutHash, compositeHash: semanticCompositeHash(concurrentWithoutHash) };
    const contenders = await Promise.all([replay.stage(concurrentWithHash), createSemanticCompositeReplay(database).stage(concurrentWithHash)]);
    assert.equal(contenders[0].compositeHash, contenders[1].compositeHash, "concurrent claimants observe the same immutable winner");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [concurrentKey]))[0]?.count, 1, "concurrent claimants create one winner");
    const raceKey = `rel03-race-${suffix}`; const raceExecution = `rel03-race-execution-${suffix}`; const raceName = `rel03_race_${suffix.replace(/-/gu, "")}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [raceKey, raceExecution, `rel03-owner-${suffix}`]);
    await admin.unsafe(`CREATE FUNCTION bridge.${raceName}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.idempotency_key = '${raceKey}' THEN PERFORM pg_sleep(0.2); END IF; RETURN NEW; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${raceName}_trigger BEFORE INSERT ON bridge.semantic_composite_stage FOR EACH ROW EXECUTE FUNCTION bridge.${raceName}()`);
    const race = makeInput({ idempotencyKey: raceKey, executionId: raceExecution, sourceSnapshot: { ...input.sourceSnapshot, executionId: raceExecution } });
    const staging = replay.stage(race); await new Promise((resolve) => setTimeout(resolve, 25));
    const supersede = bridge.unsafe("UPDATE bridge.background_effects SET lease_generation=2, lease_owner='successor', lease_expires_at=now()-interval '1 second' WHERE idempotency_key=$1", [raceKey]);
    assert.equal(await Promise.race([supersede.then(() => "updated"), new Promise<string>((resolve) => setTimeout(() => resolve("blocked"), 25))]), "blocked", "the lease mutation waits behind the staging claimant lock");
    await staging; await supersede;
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [raceKey]))[0]?.count, 1, "a serialized claimant preserves its one winner before later supersession");
    await admin.unsafe(`DROP TRIGGER ${raceName}_trigger ON bridge.semantic_composite_stage`); await admin.unsafe(`DROP FUNCTION bridge.${raceName}()`);
    const faultKey = `rel03-fault-${suffix}`; const faultExecution = `rel03-fault-execution-${suffix}`; const faultName = `rel03_fault_${suffix.replace(/-/gu, "")}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [faultKey, faultExecution, `rel03-owner-${suffix}`]);
    await admin.unsafe(`CREATE FUNCTION bridge.${faultName}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.idempotency_key = '${faultKey}' THEN RAISE EXCEPTION 'injected composite pre-commit failure'; END IF; RETURN NEW; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${faultName}_trigger BEFORE INSERT ON bridge.semantic_composite_stage FOR EACH ROW EXECUTE FUNCTION bridge.${faultName}()`);
    const fault = makeInput({ idempotencyKey: faultKey, executionId: faultExecution, sourceSnapshot: { ...input.sourceSnapshot, executionId: faultExecution } });
    const { compositeHash: _faultHash, ...faultWithoutHash } = fault; const faultWithHash = { ...faultWithoutHash, compositeHash: semanticCompositeHash(faultWithoutHash) };
    await assert.rejects(() => replay.stage(faultWithHash), /injected composite pre-commit failure/, "a deterministic database failure leaves no staged row");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [faultKey]))[0]?.count, 0, "pre-commit fault leaves zero partial state");
    await admin.unsafe(`DROP TRIGGER ${faultName}_trigger ON bridge.semantic_composite_stage`); await admin.unsafe(`DROP FUNCTION bridge.${faultName}()`);
    const cancellationKey = `rel03-cancel-${suffix}`; const cancellationExecution = `rel03-cancel-execution-${suffix}`; const cancellationName = `rel03_cancel_${suffix.replace(/-/gu, "")}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [cancellationKey, cancellationExecution, `rel03-owner-${suffix}`]);
    await admin.unsafe(`CREATE FUNCTION bridge.${cancellationName}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.idempotency_key = '${cancellationKey}' THEN PERFORM pg_sleep(10); END IF; RETURN NEW; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${cancellationName}_trigger BEFORE INSERT ON bridge.semantic_composite_stage FOR EACH ROW EXECUTE FUNCTION bridge.${cancellationName}()`);
    const cancellation = makeInput({ idempotencyKey: cancellationKey, executionId: cancellationExecution, sourceSnapshot: { ...input.sourceSnapshot, executionId: cancellationExecution } });
    const cancellationChild = spawn(process.execPath, ["apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs", "apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts"], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl, REL03_COMPOSITE_CHILD_MODE: "stage", REL03_COMPOSITE_CHILD_INPUT: JSON.stringify(cancellation) }, stdio: ["ignore", "ignore", "pipe"] });
    let cancellationError = ""; cancellationChild.stderr.on("data", (chunk: Buffer) => { cancellationError += chunk; });
    const sleepQuery = "SELECT count(*)::int AS count FROM pg_stat_activity WHERE usename='agents_bridge' AND wait_event_type='Timeout' AND query LIKE '%semantic_composite_stage%'";
    for (let attempt = 0; attempt < 100; attempt += 1) { if ((await admin.unsafe(sleepQuery))[0]?.count === 1) break; await new Promise((resolve) => setTimeout(resolve, 20)); }
    if ((await admin.unsafe(sleepQuery))[0]?.count !== 1) { if (cancellationChild.exitCode === null) await new Promise<void>((resolve) => cancellationChild.once("close", () => resolve())); assert.fail(`the cancellation child did not reach SQL: ${cancellationError}`); }
    assert.equal((await admin.unsafe(sleepQuery))[0]?.count, 1, "the cancellation child reached the trigger-confirmed in-flight SQL boundary");
    cancellationChild.kill("SIGTERM"); await new Promise<void>((resolve) => cancellationChild.once("close", () => resolve()));
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [cancellationKey]))[0]?.count, 0, "terminating the in-flight child leaves no partial staged row");
    await admin.unsafe(`DROP TRIGGER ${cancellationName}_trigger ON bridge.semantic_composite_stage`); await admin.unsafe(`DROP FUNCTION bridge.${cancellationName}()`);
    const deliveryRecovery = await child("load", input); assert.deepEqual(JSON.parse(deliveryRecovery.output), winner, "a fresh delivery child recovers the exact committed winner");
    const acknowledgementRecovery = await child("load", input); assert.deepEqual(JSON.parse(acknowledgementRecovery.output), winner, "acknowledgement loss recovery from a fresh process does not delete the winner");
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.semantic_composite_stage LIMIT 1"), /permission denied/i, "atlas_app has no staging-table access");
    const [ownership] = await admin.unsafe("SELECT pg_get_userbyid(c.relowner) AS owner, has_table_privilege('atlas_app','bridge.semantic_composite_stage','SELECT') AS atlas_can_read FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='bridge' AND c.relname='semantic_composite_stage'");
    assert.equal(ownership?.owner, "agents_bridge"); assert.equal(ownership?.atlas_can_read, false);
  } finally {
    await admin.unsafe(`DROP TRIGGER IF EXISTS rel03_fault_${suffix.replace(/-/gu, "")}_trigger ON bridge.semantic_composite_stage`).catch(() => undefined);
    await admin.unsafe(`DROP FUNCTION IF EXISTS bridge.rel03_fault_${suffix.replace(/-/gu, "")}()`).catch(() => undefined);
    await admin.unsafe(`DROP TRIGGER IF EXISTS rel03_race_${suffix.replace(/-/gu, "")}_trigger ON bridge.semantic_composite_stage`).catch(() => undefined);
    await admin.unsafe(`DROP FUNCTION IF EXISTS bridge.rel03_race_${suffix.replace(/-/gu, "")}()`).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.semantic_composite_stage WHERE idempotency_key LIKE $1", [`rel03-%-${suffix}`]).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key LIKE $1", [`rel03-%-${suffix}`]).catch(() => undefined);
    await Promise.all([admin.end(), bridge.end(), atlas.end()]);
  }
});
