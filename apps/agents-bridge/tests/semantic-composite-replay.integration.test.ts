import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket, prepareQualifiedStepwiseSemanticCompositeAccounting } from "@atlas/skills";
import { projectQualifiedStepwiseSemanticResult } from "../src/semantic-extraction-finalizer.ts";
import { prepareQualifiedStepwiseSemanticPreparation, projectStepwiseSlotsForRel03 } from "../src/semantic-relationship-interoperability-bridge.ts";
import { createSemanticCompositeReplay, SemanticCompositeConflictError, SemanticCompositeLeaseLostError, semanticCompositeHash, type SemanticCompositeStageInput } from "../src/semantic-composite-replay.ts";

const databaseUrl = process.env.DATABASE_URL;
const hash = (value: string) => value.repeat(64).slice(0, 64);

const sqlAdapter = (client: ReturnType<typeof postgres>) => ({ executeSql: async (query: string, parameters?: readonly unknown[]) => {
  const values = query.includes("$5::jsonb") && parameters ? parameters.map((value, index) => index >= 4 && index <= 9 && typeof value === "string" ? JSON.parse(value) : value) : parameters;
  return { rows: await client.unsafe(query, values as readonly (string | number | null | object)[] | undefined) };
} });

function qualified(mode: "ordinary" | "mixed" | "deferred", semanticExecutionId: string) {
  const sourceSha256 = hash("a"); const perceptionExecutionId = `perception-${semanticExecutionId}`;
  const asset = { assetRef: "derived/legend", sha256: hash("b"), sourceSha256 } as const;
  const document = { version: "v1" as const, executionId: perceptionExecutionId, artifactId: "document-1", sourceSha256, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "docling", processor: "pdf", executionId: perceptionExecutionId, processedAt: "2026-10-14T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "owned", text: "Qualified owned fact." }], tables: [], visualRegions: [{ id: "legend", label: "Qualified visual legend.", assetRef: asset.assetRef }] }] };
  const request = buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document, assetIdentities: [{ pageNumber: 1, locatorId: "legend", ...asset }] }));
  const candidates = mode === "mixed" ? 2 : 1;
  const hasRelationship = mode !== "ordinary";
  const rawResponse = {
    contract_version: "atlas.relationship-extraction-envelope/v1",
    semantic_proposal: { version: "v1", source_results: [{ slot: "slot-000001", classification: "candidate", candidates: Array.from({ length: candidates }, (_, candidateIndex) => ({ semantic_key: `candidate-${candidateIndex}`, kind: "business_object", payload: {}, normalized_meaning: `Meaning ${candidateIndex}`, needs_resolution: false })), non_fact_reason: null, questions: [] }] },
    relationship_proposals: hasRelationship ? [{ owned_source_slot: "slot-000001", context_source_slot: "slot-000002", source_evidence_slots: ["slot-000001", "slot-000002"], relationship_type: "context_qualifies", direction: "context_to_owned", contextual_role: "legend", necessity: "essential", uncertainty: "medium", proposed_meaning: "Legend qualifies meaning.", source_language: "en", candidate_refs: [{ source_slot: "slot-000001", candidate_index: 0 }], predecessor: null }] : [],
  };
  const relationshipScope = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: perceptionExecutionId, artifactId: "document-1", sourceSha256 };
  const relationshipQualification = { request, rawResponse, relationshipScope, providerProvenance: { provider: "offline", model: "fixture", endpoint: "test", attempt: 1, runId: "run-1" }, trustedPriorRevisions: [] } as const;
  const handoff = prepareQualifiedStepwiseSemanticPreparation(relationshipQualification);
  const slots = projectStepwiseSlotsForRel03(request).map((slot) => slot.slot === "slot-000001" ? { ...slot, content: "Qualified owned fact." } : slot);
  const projection = projectQualifiedStepwiseSemanticResult({ proposal: handoff.parsed.semanticProposal, sourceSlots: slots, qualifiedDeferredInterpretations: handoff.qualified.deferred_interpretations, qualifiedRelationshipRevisions: handoff.currentResponseRevisions });
  const accounting = prepareQualifiedStepwiseSemanticCompositeAccounting({ scope: { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", executionId: semanticExecutionId, sourceSha256 }, request, providerProposal: handoff.parsed.semanticProposal, relationshipRevisions: [], currentResponseRelationshipRevisions: handoff.currentResponseRevisions, qualifiedRelationshipResult: handoff.qualified, canonicalProjection: projection });
  return { accounting, request, providerProposal: handoff.parsed.semanticProposal, canonicalResult: projection.canonicalResult, relationshipQualification };
}

function inputFor(idempotencyKey: string, executionId: string, mode: "ordinary" | "mixed" | "deferred", owner: string): SemanticCompositeStageInput {
  const partial = { idempotencyKey, executionId, lease: { owner, generation: 1 }, preparation: qualified(mode, executionId) } as const;
  return { ...partial, compositeHash: semanticCompositeHash(partial) };
}

async function childReplay(): Promise<void> {
  const raw = process.env.REL03_COMPOSITE_CHILD_INPUT;
  if (!raw || !databaseUrl) throw new Error("REL-03 child replay input is unavailable.");
  const bridgeUrl = new URL(databaseUrl); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 }); const input = JSON.parse(raw) as SemanticCompositeStageInput;
  try {
    const replay = createSemanticCompositeReplay(sqlAdapter(bridge)); const mode = process.env.REL03_COMPOSITE_CHILD_MODE;
    if (mode === "stage") process.stdout.write(JSON.stringify(await replay.stage(input)));
    else if (mode === "crash-after-commit") { await replay.stage(input); process.stdout.write("committed\n"); await new Promise<void>(() => undefined); }
    else {
      const recovered = await replay.load(input.idempotencyKey, input.executionId);
      if (!recovered) throw new Error("Committed winner was not recoverable in fresh process.");
      const table = process.env.REL03_COMPOSITE_EFFECT_TABLE;
      if (!table || !/^[a-z0-9_]+$/u.test(table)) throw new Error("Test effect ledger is unavailable.");
      if (mode === "deliver") {
        await bridge.unsafe(`INSERT INTO bridge.${table} (idempotency_key, effect) VALUES ($1,'delivery_effect') ON CONFLICT DO NOTHING`, [input.idempotencyKey]);
        if (process.env.REL03_COMPOSITE_FAIL_EFFECT === "delivery") throw new Error("INJECTED_DELIVERY_FAILURE_AFTER_EFFECT");
      } else if (mode === "ack") {
        await bridge.unsafe(`INSERT INTO bridge.${table} (idempotency_key, effect) VALUES ($1,'ack_attempt') ON CONFLICT DO NOTHING`, [input.idempotencyKey]);
        if (process.env.REL03_COMPOSITE_FAIL_EFFECT === "ack") throw new Error("INJECTED_ACK_LOSS_AT_BOUNDARY");
        await bridge.unsafe(`INSERT INTO bridge.${table} (idempotency_key, effect) VALUES ($1,'ack_effect') ON CONFLICT DO NOTHING`, [input.idempotencyKey]);
      }
      process.stdout.write(JSON.stringify(recovered));
    }
  } finally { await bridge.end(); }
}

if (process.env.REL03_COMPOSITE_CHILD_MODE) {
  await childReplay();
} else test("REL-03 durable staging consumes qualified preparation and proves fenced recovery", async () => {
  assert.ok(databaseUrl, "RC-DURABLE-06 requires an explicit isolated DATABASE_URL; this qualification must not skip.");
  const admin = postgres(databaseUrl!, { max: 3 });
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 3 }); const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const suffix = randomUUID().replace(/-/gu, ""); const owner = `rel03-owner-${suffix}`; const effects = `rel03_cfc_effects_${suffix}`;
  const replay = createSemanticCompositeReplay(sqlAdapter(bridge));
  const child = (mode: "stage" | "load" | "crash-after-commit" | "deliver" | "ack", input: SemanticCompositeStageInput, fail?: "delivery" | "ack") => new Promise<{ readonly code: number | null; readonly output: string }>((resolve, reject) => {
    const processChild = spawn(process.execPath, ["apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs", "apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts"], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl, REL03_COMPOSITE_CHILD_MODE: mode, REL03_COMPOSITE_CHILD_INPUT: JSON.stringify(input), REL03_COMPOSITE_EFFECT_TABLE: effects, ...(fail === undefined ? {} : { REL03_COMPOSITE_FAIL_EFFECT: fail }) }, stdio: ["ignore", "pipe", "pipe"] });
    let output = ""; let error = ""; processChild.stdout.on("data", (chunk: Buffer) => { output += chunk; }); processChild.stderr.on("data", (chunk: Buffer) => { error += chunk; }); processChild.on("error", reject); processChild.on("close", (code) => code === 0 ? resolve({ code, output }) : reject(new Error(`REL-03 child ${mode} failed: ${error}`)));
  });
  const lease = async (input: SemanticCompositeStageInput) => bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [input.idempotencyKey, input.executionId, owner]);
  try {
    await admin.unsafe(`CREATE TABLE bridge.${effects} (idempotency_key text NOT NULL, effect text NOT NULL, PRIMARY KEY (idempotency_key, effect))`); await admin.unsafe(`GRANT SELECT, INSERT ON bridge.${effects} TO agents_bridge`);
    const ordinary = inputFor(`rel03-ordinary-${suffix}`, `semantic-ordinary-${suffix}`, "ordinary", owner); const mixed = inputFor(`rel03-mixed-${suffix}`, `semantic-mixed-${suffix}`, "mixed", owner); const deferred = inputFor(`rel03-deferred-${suffix}`, `semantic-deferred-${suffix}`, "deferred", owner);
    await Promise.all([lease(ordinary), lease(mixed), lease(deferred)]);
    const ordinaryWinner = await replay.stage(ordinary); const mixedWinner = await replay.stage(mixed); const deferredWinner = await replay.stage(deferred);
    assert.notEqual(ordinaryWinner.sourceSnapshot.executionId, ordinaryWinner.executionId, "perception and semantic executions remain distinct");
    assert.equal(mixedWinner.canonicalResult?.candidate_assertions.length, 1, "mixed qualified output keeps only independently finalizable meaning");
    assert.equal(deferredWinner.canonicalResult, null, "fully deferred qualified output persists SQL NULL, not a placeholder");
    assert.equal(deferredWinner.provisionalSidecar.qualifiedPreparationHash, deferred.preparation.accounting.compositeHash, "persisted projection binds exact qualified preparation identity");
    assert.equal(JSON.stringify(deferredWinner.provisionalSidecar).includes("preparationContext"), false, "transient request/provider evidence is not persisted");
    assert.deepEqual(await replay.stage(ordinary), ordinaryWinner, "identical retry returns immutable winner");
    assert.deepEqual(await createSemanticCompositeReplay(sqlAdapter(bridge)).load(ordinary.idempotencyKey, ordinary.executionId), ordinaryWinner, "fresh replay object retrieves winner");

    let validationSqlCalls = 0; const preSql = createSemanticCompositeReplay({ executeSql: async () => { validationSqlCalls += 1; return { rows: [] }; } });
    const alteredProposal = { ...mixed.preparation.providerProposal, source_results: mixed.preparation.providerProposal.source_results.map((result) => ({ ...result, candidates: result.candidates.map((candidate, index) => index === 0 ? { ...candidate, normalized_meaning: "forged" } : candidate) })) };
    await assert.rejects(() => preSql.stage({ ...mixed, preparation: { ...mixed.preparation, providerProposal: alteredProposal } }), /Qualified preparation evidence|immutable preparation context|candidate content/, "forged candidate meaning rejects before SQL");
    const foreignRequest = { ...mixed.preparation.request, sourceSlots: mixed.preparation.request.sourceSlots.slice(1) };
    await assert.rejects(() => preSql.stage({ ...mixed, preparation: { ...mixed.preparation, request: foreignRequest } }), /Qualified preparation evidence|immutable preparation context|tuple|source/i, "removed actual request source rejects before SQL");
    await assert.rejects(() => preSql.stage({ ...mixed, executionId: "forged-semantic-execution" }), /identities|scope/, "semantic execution substitution rejects before SQL");
    await assert.rejects(() => preSql.stage({ ...mixed, preparation: { ...mixed.preparation, canonicalResult: null } }), /Prepared accounting|Canonical result/, "replacing genuine canonical output with null rejects before SQL");
    assert.equal(validationSqlCalls, 0, "all qualified-input forgeries make zero SQL calls");

    const conflict = { ...ordinary, preparation: qualified("ordinary", ordinary.executionId) } as Omit<SemanticCompositeStageInput, "compositeHash">; const conflictInput = { ...conflict, compositeHash: semanticCompositeHash(conflict) };
    await assert.rejects(() => replay.stage({ ...conflictInput, preparation: { ...conflictInput.preparation, accounting: { ...conflictInput.preparation.accounting, requestSha256: hash("c") } } }), /Prepared accounting|immutable preparation context|identities|hash/, "conflicting retry cannot overwrite the winner");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [ordinary.idempotencyKey]))[0]?.count, 1, "pre-SQL rejections preserve the prior winner");

    const concurrent = inputFor(`rel03-concurrent-${suffix}`, `semantic-concurrent-${suffix}`, "ordinary", owner); await lease(concurrent);
    const [first, second] = await Promise.all([replay.stage(concurrent), createSemanticCompositeReplay(sqlAdapter(bridge)).stage(concurrent)]); assert.equal(first.compositeHash, second.compositeHash); assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [concurrent.idempotencyKey]))[0]?.count, 1, "concurrent claimants produce one winner");
    await bridge.unsafe("UPDATE bridge.background_effects SET lease_generation=2, lease_owner='successor', lease_expires_at=now()-interval '1 second' WHERE idempotency_key=$1", [concurrent.idempotencyKey]); await assert.rejects(() => replay.stage(concurrent), SemanticCompositeLeaseLostError, "stale lease is fenced");

    const fault = inputFor(`rel03-fault-${suffix}`, `semantic-fault-${suffix}`, "ordinary", owner); await lease(fault); const faultTrigger = `rel03_fault_${suffix}`;
    await admin.unsafe(`CREATE FUNCTION bridge.${faultTrigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.idempotency_key = '${fault.idempotencyKey}' THEN RAISE EXCEPTION 'injected pre-commit failure'; END IF; RETURN NEW; END $$`); await admin.unsafe(`CREATE TRIGGER ${faultTrigger}_trigger BEFORE INSERT ON bridge.semantic_composite_stage FOR EACH ROW EXECUTE FUNCTION bridge.${faultTrigger}()`);
    await assert.rejects(() => replay.stage(fault), /injected pre-commit failure/); assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [fault.idempotencyKey]))[0]?.count, 0, "pre-commit failure leaves zero partial rows"); await admin.unsafe(`DROP TRIGGER ${faultTrigger}_trigger ON bridge.semantic_composite_stage`); await admin.unsafe(`DROP FUNCTION bridge.${faultTrigger}()`);

    const cancellation = inputFor(`rel03-cancel-${suffix}`, `semantic-cancel-${suffix}`, "ordinary", owner); await lease(cancellation); const cancelTrigger = `rel03_cancel_${suffix}`;
    await admin.unsafe(`CREATE FUNCTION bridge.${cancelTrigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.idempotency_key = '${cancellation.idempotencyKey}' THEN PERFORM pg_sleep(10); END IF; RETURN NEW; END $$`); await admin.unsafe(`CREATE TRIGGER ${cancelTrigger}_trigger BEFORE INSERT ON bridge.semantic_composite_stage FOR EACH ROW EXECUTE FUNCTION bridge.${cancelTrigger}()`);
    const cancelChild = spawn(process.execPath, ["apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs", "apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts"], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl, REL03_COMPOSITE_CHILD_MODE: "stage", REL03_COMPOSITE_CHILD_INPUT: JSON.stringify(cancellation), REL03_COMPOSITE_EFFECT_TABLE: effects }, stdio: ["ignore", "ignore", "pipe"] });
    const inFlight = "SELECT count(*)::int AS count FROM pg_stat_activity WHERE usename='agents_bridge' AND wait_event_type='Timeout' AND query LIKE '%semantic_composite_stage%'";
    for (let attempt = 0; attempt < 100 && (await admin.unsafe(inFlight))[0]?.count !== 1; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 20)); assert.equal((await admin.unsafe(inFlight))[0]?.count, 1, "cancellation child reached the trigger-confirmed SQL boundary"); cancelChild.kill("SIGTERM"); await new Promise<void>((resolve) => cancelChild.once("close", () => resolve())); assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [cancellation.idempotencyKey]))[0]?.count, 0, "in-flight cancellation leaves zero partial rows"); await admin.unsafe(`DROP TRIGGER ${cancelTrigger}_trigger ON bridge.semantic_composite_stage`); await admin.unsafe(`DROP FUNCTION bridge.${cancelTrigger}()`);

    const recovery = inputFor(`rel03-recovery-${suffix}`, `semantic-recovery-${suffix}`, "mixed", owner); await lease(recovery);
    const crash = spawn(process.execPath, ["apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs", "apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts"], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl, REL03_COMPOSITE_CHILD_MODE: "crash-after-commit", REL03_COMPOSITE_CHILD_INPUT: JSON.stringify(recovery), REL03_COMPOSITE_EFFECT_TABLE: effects }, stdio: ["ignore", "pipe", "pipe"] });
    let crashOutput = ""; crash.stdout.on("data", (chunk: Buffer) => { crashOutput += chunk; }); for (let attempt = 0; attempt < 100 && !crashOutput.includes("committed"); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 20)); assert.match(crashOutput, /committed/, "child reached observable post-commit/pre-delivery boundary"); crash.kill("SIGTERM"); await new Promise<void>((resolve) => crash.once("close", () => resolve()));
    const recovered = JSON.parse((await child("load", recovery)).output); assert.equal(recovered.compositeHash, (await replay.load(recovery.idempotencyKey, recovery.executionId))?.compositeHash, "fresh process recovers exact post-crash winner");
    await assert.rejects(() => child("deliver", recovery, "delivery"), /INJECTED_DELIVERY_FAILURE_AFTER_EFFECT/); assert.equal((await admin.unsafe(`SELECT count(*)::int AS count FROM bridge.${effects} WHERE idempotency_key=$1 AND effect='delivery_effect'`, [recovery.idempotencyKey]))[0]?.count, 1, "delivery effect is non-inert and observed once");
    await child("deliver", recovery); await assert.rejects(() => child("ack", recovery, "ack"), /INJECTED_ACK_LOSS_AT_BOUNDARY/); assert.equal((await admin.unsafe(`SELECT count(*)::int AS count FROM bridge.${effects} WHERE idempotency_key=$1 AND effect='ack_attempt'`, [recovery.idempotencyKey]))[0]?.count, 1, "acknowledgement attempt boundary is observed"); await child("ack", recovery); assert.equal((await admin.unsafe(`SELECT count(*)::int AS count FROM bridge.${effects} WHERE idempotency_key=$1 AND effect='ack_effect'`, [recovery.idempotencyKey]))[0]?.count, 1, "acknowledgement effect is non-inert and retry-safe"); assert.deepEqual(await replay.load(recovery.idempotencyKey, recovery.executionId), await createSemanticCompositeReplay(sqlAdapter(bridge)).load(recovery.idempotencyKey, recovery.executionId), "delivery/ack recovery never deletes or changes winner");
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.semantic_composite_stage LIMIT 1"), /permission denied/i, "atlas_app has no Bridge staging access");
  } finally {
    await admin.unsafe(`DROP TRIGGER IF EXISTS rel03_cancel_${suffix}_trigger ON bridge.semantic_composite_stage`).catch(() => undefined); await admin.unsafe(`DROP FUNCTION IF EXISTS bridge.rel03_cancel_${suffix}()`).catch(() => undefined); await admin.unsafe(`DROP TRIGGER IF EXISTS rel03_fault_${suffix}_trigger ON bridge.semantic_composite_stage`).catch(() => undefined); await admin.unsafe(`DROP FUNCTION IF EXISTS bridge.rel03_fault_${suffix}()`).catch(() => undefined); await admin.unsafe(`DROP TABLE IF EXISTS bridge.${effects}`).catch(() => undefined); await bridge.unsafe("DELETE FROM bridge.semantic_composite_stage WHERE idempotency_key LIKE $1", [`rel03-%-${suffix}`]).catch(() => undefined); await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key LIKE $1", [`rel03-%-${suffix}`]).catch(() => undefined); await Promise.all([admin.end(), bridge.end(), atlas.end()]);
  }
});
