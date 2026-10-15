import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import test from "node:test";
import Fastify from "fastify";
import postgres from "postgres";
import { createSemanticInternalRoutes, DerivedImageGrantIssuer, EphemeralDerivedImageHydrator, SemanticAcceptanceRejection } from "@atlas/core";
import { PostgresSemanticAuthority, PostgresSemanticDerivedImageAuthority } from "@atlas/db";
import { semanticLimits } from "@atlas/contracts";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket } from "@atlas/skills";
import { AnomanProvider } from "../src/providers/anoman.ts";
import { createAtlasSemanticClient } from "../src/atlas-semantic-client.ts";
import { createSemanticResultReplay } from "../src/semantic-result-replay.ts";
import { createSemanticCompositeReplay } from "../src/semantic-composite-replay.ts";
import { runOfflineStepwiseComposition, type OfflineStepwiseQualificationContext } from "../src/semantic-offline-stepwise-composition.ts";
import { runSemanticJob } from "../src/semantic-worker.ts";
import { TestRuntime } from "../src/runtime.ts";
import { createBackgroundWorker } from "../src/worker.ts";
import type { WorkerConfig } from "../src/worker-config.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const sem007Only = Boolean(process.env.SEM007_ONLY);
const credential = "semantic-integration-service-credential-32-bytes";
const capability = "semantic-integration-capability";
const capabilityFingerprint = createHash("sha256").update(JSON.stringify(capability)).digest("hex");

const waitFor = async (predicate: () => Promise<boolean>, label: string, timeoutMs = 30_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}.`);
};

const normalized = (executionId: string, documentId: string, sourceSha256: string) => ({
  version: "v1" as const,
  executionId,
  artifactId: documentId,
  sourceSha256,
  perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const },
  provider: { name: "test", processor: "test", executionId, processedAt: "2026-09-28T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }],
});

test("SEM-007 composes the injected stepwise worker path into isolated PostgreSQL composite staging and recovery", { skip: skip || Boolean(process.env.SEM007_CHILD_MODE) || Boolean(process.env.SEM007_SKIP) }, async () => {
  const admin = postgres(databaseUrl!, { max: 3 });
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 4 });
  const suffix = randomUUID().replace(/-/gu, "");
  const queueName = `sem007-worker-${suffix}`;
  const effectTable = `sem007_effects_${suffix}`;
  const syncTable = `sem007_sync_${suffix}`;
  const triggerFunction = `sem007_cancel_${suffix}`;
  const fixtures = new Map<string, OfflineStepwiseQualificationContext>();
  const keys = new Map<string, string>();
  const deliveryModes = new Map<string, "none" | "delivery-failure" | "ack-loss">();
  const jobCounts = new Map<string, number>();
  const providerStructuredCalls = new Map<string, number>();
  const observations: string[] = [];
  let worker: ReturnType<typeof createBackgroundWorker> | undefined;
  const fixture = (label: string, mode: Sem007FixtureMode, withImage: boolean) => {
    const executionId = `sem007-${label}-${suffix}`;
    const value = sem007Fixture(mode, executionId, withImage);
    fixtures.set(executionId, value); keys.set(executionId, `sem007-key-${label}-${suffix}`); deliveryModes.set(executionId, "none");
    return executionId;
  };
  const textOnlyExecution = fixture("text-only", "ordinary", false);
  const ordinaryExecution = fixture("ordinary", "ordinary", true);
  const mixedExecution = fixture("mixed", "mixed", true);
  const deferredExecution = fixture("deferred", "deferred", true);
  const deliveryFailureExecution = fixture("delivery-failure", "ordinary", false);
  const acknowledgementLossExecution = fixture("ack-loss", "ordinary", false);
  const crashExecution = fixture("crash", "mixed", true);
  const cancellationExecution = fixture("cancel", "ordinary", true);
  const staleExecution = fixture("stale", "ordinary", false);
  const safeIdentifier = (value: string) => { if (!/^[a-z0-9_]+$/u.test(value)) throw new Error(`Unsafe SEM-007 identifier: ${value}`); return value; };
  safeIdentifier(effectTable); safeIdentifier(syncTable); safeIdentifier(triggerFunction);
  const effect = async (key: string, kind: string, committed: boolean): Promise<number> => {
    const rows = await bridge.unsafe(`INSERT INTO bridge.${effectTable} (effect_key, effect_kind, attempts, committed) VALUES ($1,$2,1,$3) ON CONFLICT (effect_key,effect_kind) DO UPDATE SET attempts=bridge.${effectTable}.attempts+1 RETURNING attempts`, [key, kind, committed]);
    return Number(rows[0]?.attempts);
  };
  const effectRow = async (key: string, kind: string) => (await admin.unsafe(`SELECT attempts, committed FROM bridge.${effectTable} WHERE effect_key=$1 AND effect_kind=$2`, [key, kind]))[0] as { attempts: number; committed: boolean } | undefined;
  const enqueue = async (executionId: string) => {
    const key = keys.get(executionId)!;
    await worker!.boss.send(queueName, { idempotencyKey: key, execution: { version: "v1", executionId, mode: "background", skill: { id: "atlas.semantic.extract", version: "v1" }, input: { contextCapability: "sem007-offline-authorized-context" }, context: { boundary: "sem007-offline-worker", items: [] } } }, { singletonKey: `${key}-${randomUUID()}` });
  };
  const child = (executionId: string, childMode: "cancel" | "crash", owner: string, generation: number) => {
    const key = keys.get(executionId)!; const selected = fixtures.get(executionId)!;
    const packageCwd = /[\\/]apps[\\/]agents-bridge$/u.test(process.cwd());
    const childApplicationName = `sem007-child-${childMode}-${suffix}`;
    const childProcess = spawn(process.execPath, [packageCwd ? "node_modules/jiti/lib/jiti-cli.mjs" : "apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs", packageCwd ? "tests/semantic-worker.integration.test.ts" : "apps/agents-bridge/tests/semantic-worker.integration.test.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl!, SEM007_CHILD_MODE: childMode, SEM007_CHILD_APP: childApplicationName, SEM007_CHILD_KEY: key, SEM007_CHILD_EXECUTION: executionId, SEM007_CHILD_FIXTURE: childMode === "cancel" ? "ordinary" : "mixed", SEM007_CHILD_IMAGE: String(selected.assetIdentities.length > 0), SEM007_CHILD_OWNER: owner, SEM007_CHILD_GENERATION: String(generation), SEM007_EFFECT_TABLE: effectTable },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = ""; let stderr = ""; let closed = false; let closeCode: number | null = null; let closeSignal: NodeJS.Signals | null = null;
    childProcess.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    childProcess.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    const closedPromise = new Promise<void>((resolve, reject) => {
      childProcess.once("error", reject);
      childProcess.once("close", (code, signal) => { closed = true; closeCode = code; closeSignal = signal; resolve(); });
    });
    const waitMarker = async (marker: string) => {
      await waitFor(async () => { if (closed) throw new Error(`SEM-007 child exited before ${marker}; code=${closeCode}; signal=${closeSignal}; stdout=${stdout}; stderr=${stderr}`); return stdout.includes(marker); }, `SEM-007 child marker ${marker}`, 30_000);
      observations.push(`child:${childMode}:${marker}:code=${String(closeCode)}:signal=${String(closeSignal)}`);
    };
    return { childProcess, closedPromise, waitMarker, diagnostics: () => ({ stdout, stderr, closeCode, closeSignal }) };
  };
  try {
    const [databaseIdentity] = await admin.unsafe("SELECT current_database() AS database, current_user AS user_name, current_setting('server_version') AS server_version");
    assert.ok(databaseIdentity?.database, "the worker proof records an actual PostgreSQL database identity");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM atlas.schema_migrations WHERE name='0025_rel03_semantic_composite_stage'"))[0]?.count, 1, "the approved registered durable-composite migration is applied");
    await admin.unsafe(`CREATE TABLE bridge.${effectTable} (effect_key text NOT NULL, effect_kind text NOT NULL, attempts integer NOT NULL, committed boolean NOT NULL, PRIMARY KEY (effect_key,effect_kind))`);
    await admin.unsafe(`GRANT SELECT, INSERT, UPDATE ON bridge.${effectTable} TO agents_bridge`);
    await admin.unsafe(`CREATE TABLE bridge.${syncTable} (effect_key text PRIMARY KEY, observed_at timestamptz NOT NULL DEFAULT now())`);
    await admin.unsafe(`GRANT SELECT, INSERT ON bridge.${syncTable} TO agents_bridge`);
    const workerConfig: WorkerConfig = { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 20, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 5_000 };
    worker = createBackgroundWorker(workerConfig, new TestRuntime(), queueName, undefined, undefined, async (job, signal, context) => {
      const selected = fixtures.get(job.executionId);
      if (!selected) throw new Error(`SEM-007 fixture is missing for ${job.executionId}`);
      jobCounts.set(job.executionId, (jobCounts.get(job.executionId) ?? 0) + 1);
      const replay = createSemanticCompositeReplay(context.database);
      const deliver = async () => {
        const key = context.idempotencyKey; const attempt = await effect(key, "delivery", false); const mode = deliveryModes.get(job.executionId) ?? "none";
        if (mode === "delivery-failure" && attempt === 1) throw new Error("SEM007_NON_INERT_DELIVERY_FAILURE");
        if (mode === "ack-loss" && attempt === 1) { await bridge.unsafe(`UPDATE bridge.${effectTable} SET committed=true WHERE effect_key=$1 AND effect_kind='delivery'`, [key]); throw new Error("SEM007_ACKNOWLEDGEMENT_LOSS"); }
        await bridge.unsafe(`UPDATE bridge.${effectTable} SET committed=true WHERE effect_key=$1 AND effect_kind='delivery'`, [key]);
      };
      const client = {
        context: async () => sem007ContextResponse(selected),
        media: async () => { throw new Error("SEM-007 offline fixture must not redeem Atlas media."); },
        deliver,
        deliverQualified: deliver,
        fail: async (failure: unknown) => { observations.push(`worker-failure:${job.executionId}:${JSON.stringify(failure)}`); },
      };
      const selection = { context: selected, dependencies: { database: context.database, routes: [sem007Route], routeId: sem007Route.routeId, profileId: sem007Route.profileId, nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 20_000, dispatch: async ({ messages, signal: transportSignal }: { readonly messages: readonly unknown[]; readonly signal: AbortSignal }) => { assert.equal(transportSignal, signal, "the fake transport observes the supplied worker signal"); const imageParts = messages.flatMap((message) => (message as { parts?: readonly { type: string; sourcePartId: string; media?: { sha256: string; bytes: Uint8Array } }[] }).parts ?? []).filter((part) => part.type === "image"); if (selected.assetIdentities.length > 0) { assert.equal(imageParts.length, 1, "the image fixture reaches the neutral multipart fake exactly once"); assert.equal(imageParts[0]?.sourcePartId, selected.assetIdentities[0]?.assetRef); assert.equal(imageParts[0]?.media?.sha256, selected.assetIdentities[0]?.sha256); assert.equal(sem007Hash(imageParts[0]!.media!.bytes), selected.assetIdentities[0]?.sha256); } else assert.equal(imageParts.length, 0, "the text-only fixture does not invent media"); await effect(context.idempotencyKey, "provider", true); return sem007FakeTransport(selected); } } } as const;
      const provider = { structured: async () => { providerStructuredCalls.set(job.executionId, (providerStructuredCalls.get(job.executionId) ?? 0) + 1); throw new Error("SEM-007 ordinary provider path was invoked."); } };
      await runSemanticJob(job, provider, client, { load: replay.load, stage: async () => { throw new Error("SEM-007 worker must stage through composite replay."); }, acknowledge: async () => undefined }, context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration }, selection);
    });
    await worker.start();
    for (const executionId of [textOnlyExecution, ordinaryExecution, mixedExecution, deferredExecution, deliveryFailureExecution, acknowledgementLossExecution]) await enqueue(executionId);
    for (const executionId of [textOnlyExecution, ordinaryExecution, mixedExecution, deferredExecution, deliveryFailureExecution, acknowledgementLossExecution]) {
      const key = keys.get(executionId)!;
      await waitFor(async () => (await admin.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [key]))[0]?.status === "completed", `SEM-007 worker stage completion ${executionId}`);
      assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [key]))[0]?.count, 1, `actual composite winner persisted for ${executionId}`);
    }
    const stagedRows = await admin.unsafe("SELECT idempotency_key, execution_id, canonical_result, source_snapshot, provisional_sidecar, composite_hash, revision_set_hash, sidecar_hash FROM bridge.semantic_composite_stage WHERE idempotency_key = ANY($1::text[]) ORDER BY idempotency_key", [[...keys.values()]]) as Array<Record<string, unknown>>;
    const stagedByExecution = new Map(stagedRows.map((row) => [String(row.execution_id), row]));
    const ordinaryRow = stagedByExecution.get(ordinaryExecution)!; const mixedRow = stagedByExecution.get(mixedExecution)!; const deferredRow = stagedByExecution.get(deferredExecution)!;
    assert.ok(ordinaryRow.canonical_result, "ordinary qualified output persists a canonical result");
    assert.ok(mixedRow.canonical_result, "mixed qualified output persists its independently finalizable result");
    assert.equal(deferredRow.canonical_result, null, "fully deferred qualified output persists SQL NULL");
    for (const executionId of [ordinaryExecution, mixedExecution, deferredExecution]) {
      const winner = await createSemanticCompositeReplay(sem007SqlAdapter(bridge)).load(keys.get(executionId)!, executionId);
      const row = stagedByExecution.get(executionId)!;
      assert.ok(winner);
      assert.equal(winner?.compositeHash, row.composite_hash, `exact persisted composite hash for ${executionId}`);
      assert.equal(winner?.revisionSetHash, row.revision_set_hash, `exact persisted revision-set hash for ${executionId}`);
      assert.equal(winner?.sidecarHash, row.sidecar_hash, `exact persisted sidecar hash for ${executionId}`);
      assert.deepEqual(winner?.sourceSnapshot, row.source_snapshot, `exact persisted source snapshot for ${executionId}`);
      assert.deepEqual(winner?.provisionalSidecar, row.provisional_sidecar, `exact persisted sidecar for ${executionId}`);
      assert.equal(JSON.stringify(winner?.provisionalSidecar).includes("preparationContext"), false, "persisted sidecar excludes transient provider/source evidence");
    }
    const providerBeforeReplay = (await effectRow(keys.get(ordinaryExecution)!, "provider"))?.attempts;
    let replayDeliveries = 0;
    const ordinaryWinnerReplay = createSemanticCompositeReplay(sem007SqlAdapter(bridge));
    await runSemanticJob(sem007Job(ordinaryExecution), { structured: async () => { throw new Error("SEM-007 replay called the provider."); } }, { context: async () => sem007ContextResponse(fixtures.get(ordinaryExecution)!), media: async () => { throw new Error("SEM-007 replay must not redeem media."); }, deliver: async () => { replayDeliveries += 1; }, deliverQualified: async () => { replayDeliveries += 1; }, fail: async () => { throw new Error("SEM-007 replay unexpectedly failed."); } }, { load: ordinaryWinnerReplay.load, stage: async () => { throw new Error("SEM-007 replay attempted a second stage."); }, acknowledge: async () => undefined }, keys.get(ordinaryExecution)!, new AbortController().signal, { owner: "replay-owner", generation: 1 });
    assert.equal(replayDeliveries, 1, "immutable worker replay delivers the persisted winner");
    assert.equal((await effectRow(keys.get(ordinaryExecution)!, "provider"))?.attempts, providerBeforeReplay, "immutable replay does not repeat fake provider execution");
    assert.equal(providerStructuredCalls.get(ordinaryExecution) ?? 0, 0, "ordinary provider adapter remains unused by the injected path");
    assert.ok((jobCounts.get(textOnlyExecution) ?? 0) > 0, "positive worker effect counter is non-inert");
    assert.ok((await effectRow(keys.get(textOnlyExecution)!, "provider"))?.attempts > 0, "positive provider effect counter is non-inert");

    for (const [executionId, mode] of [[deliveryFailureExecution, "delivery-failure"], [acknowledgementLossExecution, "ack-loss"]] as const) {
      const key = keys.get(executionId)!; await admin.unsafe(`DELETE FROM bridge.${effectTable} WHERE effect_key=$1 AND effect_kind='delivery'`, [key]); deliveryModes.set(executionId, mode);
      await bridge.unsafe("UPDATE bridge.background_effects SET status='pending', lease_expires_at=now(), last_error=NULL WHERE idempotency_key=$1", [key]);
      await enqueue(executionId);
      await waitFor(async () => Boolean((await admin.unsafe("SELECT last_error FROM bridge.background_effects WHERE idempotency_key=$1", [key]))[0]?.last_error), `SEM-007 ${mode} observation`);
      const firstEffect = await effectRow(key, "delivery"); assert.ok(firstEffect?.attempts === 1, `non-inert ${mode} effect attempt is recorded`);
      if (mode === "ack-loss") assert.equal(firstEffect?.committed, true, "acknowledgement loss occurs after the durable effect"); else assert.equal(firstEffect?.committed, false, "delivery failure occurs before acknowledgement");
      deliveryModes.set(executionId, "none");
      await enqueue(executionId);
      await waitFor(async () => (await admin.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [key]))[0]?.status === "completed", `SEM-007 ${mode} recovery`);
      const recoveredEffect = await effectRow(key, "delivery"); assert.ok((recoveredEffect?.attempts ?? 0) >= 2, `non-inert ${mode} recovery has a second effect attempt`); assert.equal(recoveredEffect?.committed, true);
      assert.equal((await effectRow(key, "provider"))?.attempts, 1, `recovered ${mode} never repeats provider execution`);
    }

    const staleKey = keys.get(staleExecution)!; const staleOwner = `sem007-stale-owner-${suffix}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [staleKey, staleExecution, staleOwner]);
    await assert.rejects(() => runOfflineStepwiseComposition(fixtures.get(staleExecution)!, { database: sem007SqlAdapter(bridge), idempotencyKey: staleKey, lease: { owner: staleOwner, generation: 1 }, routes: [sem007Route], routeId: sem007Route.routeId, profileId: sem007Route.profileId, nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 20_000, signal: new AbortController().signal, dispatch: async () => { await bridge.unsafe("UPDATE bridge.background_effects SET lease_owner='sem007-successor', lease_generation=2 WHERE idempotency_key=$1", [staleKey]); return sem007FakeTransport(fixtures.get(staleExecution)!); } }), (error: unknown) => error instanceof Error && error.name === "SemanticCompositeLeaseLostError", "stale worker lease is rejected by the approved composite stage");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [staleKey]))[0]?.count, 0, "stale lease cannot persist a composite winner");

    const cancellationKey = keys.get(cancellationExecution)!; const cancellationOwner = `sem007-cancel-owner-${suffix}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [cancellationKey, cancellationExecution, cancellationOwner]);
    await admin.unsafe(`CREATE FUNCTION bridge.${triggerFunction}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.idempotency_key = '${cancellationKey}' THEN INSERT INTO bridge.${syncTable} (effect_key) VALUES (NEW.idempotency_key) ON CONFLICT DO NOTHING; PERFORM pg_sleep(30); END IF; RETURN NEW; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${triggerFunction}_trigger BEFORE INSERT ON bridge.semantic_composite_stage FOR EACH ROW EXECUTE FUNCTION bridge.${triggerFunction}()`);
    const cancellationChild = child(cancellationExecution, "cancel", cancellationOwner, 1);
    await cancellationChild.waitMarker("SEM007_PROVIDER_DISPATCH");
    const cancellationApplicationName = `sem007-child-cancel-${suffix}`;
    await waitFor(async () => Number((await admin.unsafe("SELECT count(*)::int AS count FROM pg_stat_activity WHERE application_name=$1 AND query LIKE '%semantic_composite_stage%'", [cancellationApplicationName]))[0]?.count) === 1, "SEM-007 child trigger-confirmed pre-commit SQL boundary");
    cancellationChild.childProcess.kill("SIGTERM"); await cancellationChild.closedPromise;
    const cancellationDiagnostics = cancellationChild.diagnostics(); observations.push(`cancel-child:code=${String(cancellationDiagnostics.closeCode)}:signal=${String(cancellationDiagnostics.closeSignal)}:stderr=${cancellationDiagnostics.stderr.slice(0, 500)}`);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [cancellationKey]))[0]?.count, 0, "genuine child interruption rolls back the pre-commit composite stage");
    await admin.unsafe(`DROP TRIGGER ${triggerFunction}_trigger ON bridge.semantic_composite_stage`); await admin.unsafe(`DROP FUNCTION bridge.${triggerFunction}()`);

    const crashKey = keys.get(crashExecution)!; const crashOwner = `sem007-crash-owner-${suffix}`;
    await bridge.unsafe("INSERT INTO bridge.background_effects (idempotency_key, execution_id, status, lease_owner, lease_generation, lease_expires_at) VALUES ($1,$2,'running',$3,1,now()+interval '5 minutes')", [crashKey, crashExecution, crashOwner]);
    const crashChild = child(crashExecution, "crash", crashOwner, 1); await crashChild.waitMarker("SEM007_COMMITTED");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [crashKey]))[0]?.count, 1, "child diagnostic marks the durable winner after commit");
    crashChild.childProcess.kill("SIGTERM"); await crashChild.closedPromise;
    const crashDiagnostics = crashChild.diagnostics(); observations.push(`crash-child:code=${String(crashDiagnostics.closeCode)}:signal=${String(crashDiagnostics.closeSignal)}:stderr=${crashDiagnostics.stderr.slice(0, 500)}`);
    const recoveredAfterRestart = await createSemanticCompositeReplay(sem007SqlAdapter(bridge)).load(crashKey, crashExecution); assert.ok(recoveredAfterRestart, "fresh replay object recovers the post-commit winner");
    await bridge.unsafe("UPDATE bridge.background_effects SET status='pending', lease_expires_at=now(), last_error=NULL WHERE idempotency_key=$1", [crashKey]);
    await enqueue(crashExecution);
    await waitFor(async () => (await admin.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [crashKey]))[0]?.status === "completed", "SEM-007 post-commit restart delivery");
    assert.equal((await effectRow(crashKey, "provider"))?.attempts, 1, "post-commit restart recovery does not repeat fake provider execution");
    assert.equal((await effectRow(crashKey, "delivery"))?.committed, true, "post-commit restart delivers the recovered winner");
    assert.ok(observations.some((value) => value.includes("child:cancel:SEM007_PROVIDER_DISPATCH")), "cancellation synchronization is recorded from child diagnostics");
    assert.ok(observations.some((value) => value.includes("child:crash:SEM007_COMMITTED")), "post-commit synchronization is recorded from child diagnostics");

    let deniedDispatches = 0;
    const denied = fixtures.get(textOnlyExecution)!;
    await assert.rejects(() => runOfflineStepwiseComposition(denied, { database: sem007SqlAdapter(bridge), idempotencyKey: `sem007-denied-${suffix}`, lease: { owner: "denied", generation: 1 }, routes: [], routeId: "denied-route", profileId: "denied-profile", nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 20_000, signal: new AbortController().signal, dispatch: async () => { deniedDispatches += 1; return sem007FakeTransport(denied); } }), /recognized|route\/profile/iu);
    const substitutedDocument = { ...denied.normalizedDocument, pages: [{ ...denied.normalizedDocument.pages[0]!, textBlocks: [{ id: "forged", text: "substituted" }], tables: [], visualRegions: [] }] };
    let substitutionFailures = 0;
    const substitutionKey = `sem007-substitution-${suffix}`;
    const substitutionReplay = createSemanticCompositeReplay(sem007SqlAdapter(bridge));
    await runSemanticJob(sem007Job(denied.scope.executionId), { structured: async () => { throw new Error("SEM-007 substituted context reached the ordinary provider."); } }, { context: async () => sem007ContextResponse({ ...denied, normalizedDocument: substitutedDocument }), media: async () => { throw new Error("SEM-007 substituted context must not redeem media."); }, deliver: async () => undefined, deliverQualified: async () => undefined, fail: async () => { substitutionFailures += 1; } }, { load: substitutionReplay.load, stage: async () => { throw new Error("SEM-007 substituted context reached durable staging."); }, acknowledge: async () => undefined }, substitutionKey, new AbortController().signal, { owner: "denied", generation: 1 }, { context: denied, dependencies: { database: sem007SqlAdapter(bridge), routes: [sem007Route], routeId: sem007Route.routeId, profileId: sem007Route.profileId, nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 20_000, dispatch: async () => { deniedDispatches += 1; return sem007FakeTransport(denied); } } });
    assert.equal(substitutionFailures, 1, "a substituted redeemed document is converted to the bounded integrity failure path");
    const imageDenied = fixtures.get(ordinaryExecution)!;
    await assert.rejects(() => runOfflineStepwiseComposition(imageDenied, { database: sem007SqlAdapter(bridge), idempotencyKey: `sem007-unknown-tpm-${suffix}`, lease: { owner: "denied", generation: 1 }, routes: [{ ...sem007Route, imageTpm: { state: "unknown" as const } }], routeId: sem007Route.routeId, profileId: sem007Route.profileId, nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 20_000, signal: new AbortController().signal, dispatch: async () => { deniedDispatches += 1; return sem007FakeTransport(imageDenied); } }), /RESOURCE_ENVELOPE_BLOCKED|recognized|route/iu);
    assert.equal(deniedDispatches, 0, "denied provider-neutral routes have zero provider effects");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key LIKE $1", [`sem007-denied-%-${suffix}`]))[0]?.count, 0, "denied routes have zero durable-job effects");
    const cancelledSignal = new AbortController(); cancelledSignal.abort();
    let boundaryDispatches = 0;
    const boundaryFixture = fixtures.get(textOnlyExecution)!;
    await assert.rejects(() => runOfflineStepwiseComposition(boundaryFixture, { database: sem007SqlAdapter(bridge), idempotencyKey: `sem007-cancelled-${suffix}`, lease: { owner: "cancelled", generation: 1 }, routes: [sem007Route], routeId: sem007Route.routeId, profileId: sem007Route.profileId, nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 20_000, signal: cancelledSignal.signal, dispatch: async () => { boundaryDispatches += 1; return sem007FakeTransport(boundaryFixture); } }), /cancelled/iu);
    await assert.rejects(() => runOfflineStepwiseComposition(boundaryFixture, { database: sem007SqlAdapter(bridge), idempotencyKey: `sem007-deadline-${suffix}`, lease: { owner: "deadline", generation: 1 }, routes: [sem007Route], routeId: sem007Route.routeId, profileId: sem007Route.profileId, nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 1_000, signal: new AbortController().signal, dispatch: async () => { boundaryDispatches += 1; return sem007FakeTransport(boundaryFixture); } }), /deadline has elapsed/iu);
    assert.equal(boundaryDispatches, 0, "cancelled or expired injected work has no fake dispatch effect");
    assert.equal((await admin.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key IN ($1,$2)", [`sem007-cancelled-${suffix}`, `sem007-deadline-${suffix}`]))[0]?.count, 0, "cancelled or expired injected work has no durable staging effect");
    assert.ok((jobCounts.get(textOnlyExecution) ?? 0) > 0 && (await effectRow(keys.get(textOnlyExecution)!, "provider"))?.attempts === 1, "positive job/provider controls are non-inert");
    observations.push(`database=${String(databaseIdentity?.database)} user=${String(databaseIdentity?.user_name)} server=${String(databaseIdentity?.server_version)}`);
    observations.push(`worker-jobs=${JSON.stringify(Object.fromEntries(jobCounts))}`);
    observations.push(`provider-structured=${JSON.stringify(Object.fromEntries(providerStructuredCalls))}`);
    const fakeFixture = fixtures.get(ordinaryExecution)!;
    const fakeRequest = buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({ document: fakeFixture.normalizedDocument, assetIdentities: fakeFixture.assetIdentities }));
    console.log(`SEM007_FAKE_WIRE_EVIDENCE ${JSON.stringify({ systemPromptSha256: sem007Hash(fakeRequest.systemPrompt), sourceSpecificationSha256: fakeRequest.sourceSpecificationSha256, responseSchemaSha256: sem007Hash(JSON.stringify(fakeRequest.responseSchema)), image: { assetRef: fakeFixture.assetIdentities[0]?.assetRef, sha256: fakeFixture.assetIdentities[0]?.sha256, byteLength: fakeFixture.media.get(fakeFixture.assetIdentities[0]?.assetRef ?? "")?.bytes.byteLength ?? 0 }, providerStructuredCalls: providerStructuredCalls.size })}`);
    console.log(`SEM007_EVIDENCE ${JSON.stringify(observations)}`);
    assert.equal(providerStructuredCalls.size, 0, "all SEM-007 worker fixtures bypass ordinary provider execution");
  } catch (error) {
    console.error("SEM007_FAILURE", error, observations, await admin.unsafe("SELECT idempotency_key,status,lease_owner,lease_generation,last_error FROM bridge.background_effects WHERE idempotency_key LIKE $1", [`sem007-key-%-${suffix}`]), await admin.unsafe("SELECT name,state,output FROM pgboss.job WHERE name=$1", [queueName]));
    throw error;
  } finally {
    await worker?.stop().catch(() => undefined);
    await admin.unsafe(`DROP TRIGGER IF EXISTS ${triggerFunction}_trigger ON bridge.semantic_composite_stage`).catch(() => undefined);
    await admin.unsafe(`DROP FUNCTION IF EXISTS bridge.${triggerFunction}()`).catch(() => undefined);
    await admin.unsafe(`DROP TABLE IF EXISTS bridge.${syncTable}`).catch(() => undefined);
    await admin.unsafe(`DROP TABLE IF EXISTS bridge.${effectTable}`).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.semantic_composite_stage WHERE idempotency_key LIKE $1", [`sem007-key-%-${suffix}`]).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key LIKE $1", [`sem007-key-%-${suffix}`]).catch(() => undefined);
    await admin.unsafe("DELETE FROM pgboss.job WHERE name=$1", [queueName]).catch(() => undefined);
    await Promise.all([admin.end(), bridge.end()]);
  }
});

const sem007Hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const sem007Route = {
  version: "v1" as const,
  routeId: "sem007-offline-route",
  profileId: "sem007-offline-profile",
  profileVersion: "sem007-offline-profile-v1",
  maxPromptBytes: 256_000,
  maxDeadlineMilliseconds: 30_000,
  image: { version: "v1" as const, mediaTypes: ["image/png" as const], maxImageCount: 4, maxImageBytes: 1_000_000, maxImageWidth: 1024, maxImageHeight: 1024 },
  imageTpm: { state: "qualified" as const, tokensPerImage: 64 },
};
const sem007SqlAdapter = (client: ReturnType<typeof postgres>) => ({
  executeSql: async (query: string, parameters?: readonly unknown[]) => {
    const jsonIndexes = new Set([4, 5, 6, 7, 8, 9, 13, 15]);
    const values = query.includes("$5::jsonb") && parameters ? parameters.map((value, index) => jsonIndexes.has(index) && typeof value === "string" ? JSON.parse(value) : value) : parameters;
    return { rows: await client.unsafe(query, values as readonly (string | number | null | object)[] | undefined) };
  },
});
type Sem007FixtureMode = "ordinary" | "mixed" | "deferred";

function sem007Fixture(mode: Sem007FixtureMode, semanticExecutionId: string, withImage: boolean): OfflineStepwiseQualificationContext {
  const sourceSha256 = sem007Hash(`sem007-source-${semanticExecutionId}`);
  const perceptionExecutionId = `perception-${semanticExecutionId}`;
  const documentId = `sem007-document-${semanticExecutionId}`;
  const assetBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
  const assetSha256 = sem007Hash(assetBytes);
  const asset = { assetRef: `derived/${semanticExecutionId}/visual-1`, sha256: assetSha256, sourceSha256 } as const;
  const document = {
    version: "v1" as const,
    executionId: perceptionExecutionId,
    artifactId: documentId,
    sourceSha256,
    perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const },
    provider: { name: "docling", processor: "docling-slim", executionId: perceptionExecutionId, processedAt: "2026-10-14T00:00:00.000Z" },
    pages: [{ number: 1, textBlocks: [{ id: "owned-1", text: `SEM-007 owned fact for ${semanticExecutionId}.` }], tables: [], visualRegions: withImage ? [{ id: "visual-1", label: "SEM-007 controlled visual context.", assetRef: asset.assetRef }] : [] }],
  };
  const scope = { projectId: `sem007-project-${semanticExecutionId}`, workspaceId: `sem007-workspace-${semanticExecutionId}`, bundleId: `sem007-bundle-${semanticExecutionId}`, documentId, executionId: semanticExecutionId, sourceSha256 };
  return {
    scope,
    normalizedDocument: document,
    assetIdentities: withImage ? [{ pageNumber: 1, locatorId: "visual-1", ...asset }] : [],
    media: withImage ? new Map([[asset.assetRef, { assetRef: asset.assetRef, sha256: asset.sha256, sourceSha256, mimeType: "image/png" as const, width: 2, height: 2, bytes: assetBytes }]]) : new Map(),
    relationshipScope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId, executionId: perceptionExecutionId, artifactId: documentId, sourceSha256 },
    trustedPriorRevisions: [],
  };
}

function sem007FakeTransport(fixture: OfflineStepwiseQualificationContext) {
  const mode: Sem007FixtureMode = fixture.scope.executionId.includes("-mixed-") ? "mixed" : fixture.scope.executionId.includes("-deferred-") ? "deferred" : "ordinary";
  const candidates = mode === "mixed" ? 2 : 1;
  const hasRelationship = mode !== "ordinary";
  return {
    value: {
    contract_version: "atlas.relationship-extraction-envelope/v1",
    semantic_proposal: { version: "v1", source_results: [{ slot: "slot-000001", classification: "candidate", candidates: Array.from({ length: candidates }, (_, index) => ({ semantic_key: `sem007-candidate-${index}`, kind: "business_object", payload: { mode }, normalized_meaning: `SEM-007 meaning ${index}`, needs_resolution: false })), non_fact_reason: null, questions: [] }] },
    relationship_proposals: hasRelationship ? [{ owned_source_slot: "slot-000001", context_source_slot: "slot-000002", source_evidence_slots: ["slot-000001", "slot-000002"], relationship_type: "context_qualifies", direction: "context_to_owned", contextual_role: "legend", necessity: "essential", uncertainty: "medium", proposed_meaning: "The controlled context qualifies the owned fact.", source_language: "en", candidate_refs: [{ source_slot: "slot-000001", candidate_index: 0 }], predecessor: null }] : [],
    },
    provenance: { provider: "offline", model: "sem007-controlled-fake", endpoint: "test://sem007", latencyMilliseconds: 1, attempt: 1, metadata: { executionId: fixture.scope.executionId } },
  };
}

const sem007ContextResponse = (fixture: OfflineStepwiseQualificationContext) => ({ version: "v1" as const, skill: "atlas.semantic.extract" as const, scope: { projectId: fixture.scope.projectId, workspaceId: fixture.scope.workspaceId, bundleId: fixture.scope.bundleId, documentId: fixture.scope.documentId, executionId: fixture.scope.executionId, contractVersion: "v1" as const }, normalizedDocument: fixture.normalizedDocument });
const sem007Job = (executionId: string) => ({ version: "v1" as const, executionId, skill: { id: "atlas.semantic.extract" as const, version: "v1" as const }, contextCapability: "sem007-offline-authorized-context" });

async function runSem007Child(): Promise<void> {
  const childDatabaseUrl = process.env.DATABASE_URL;
  const childMode = process.env.SEM007_CHILD_MODE;
  if (!childDatabaseUrl || !childMode) throw new Error("SEM-007 child diagnostics require DATABASE_URL and SEM007_CHILD_MODE.");
  const bridgeUrl = new URL(childDatabaseUrl); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1, connection: { application_name: process.env.SEM007_CHILD_APP ?? "sem007-child" } });
  const idempotencyKey = process.env.SEM007_CHILD_KEY!;
  const executionId = process.env.SEM007_CHILD_EXECUTION!;
  const mode = process.env.SEM007_CHILD_FIXTURE as Sem007FixtureMode;
  const fixture = sem007Fixture(mode, executionId, process.env.SEM007_CHILD_IMAGE === "true");
  const table = process.env.SEM007_EFFECT_TABLE!;
  if (!/^[a-z0-9_]+$/u.test(table)) throw new Error("SEM-007 effect table is invalid.");
  const replay = createSemanticCompositeReplay(sem007SqlAdapter(bridge));
  const owner = process.env.SEM007_CHILD_OWNER!;
  const generation = Number(process.env.SEM007_CHILD_GENERATION);
  const selection = { context: fixture, dependencies: { database: sem007SqlAdapter(bridge), routes: [sem007Route], routeId: sem007Route.routeId, profileId: sem007Route.profileId, nowEpochMilliseconds: 1_000, deadlineEpochMilliseconds: 20_000, dispatch: async () => { await bridge.unsafe(`INSERT INTO bridge.${table} (effect_key, effect_kind, attempts, committed) VALUES ($1,'provider',1,false) ON CONFLICT (effect_key,effect_kind) DO UPDATE SET attempts=bridge.${table}.attempts+1`, [idempotencyKey]); process.stdout.write("SEM007_PROVIDER_DISPATCH\n"); return sem007FakeTransport(fixture); } } } as const;
  const semanticReplay = { load: replay.load, stage: async () => { throw new Error("SEM-007 child must stage through the offline composition."); }, acknowledge: async () => undefined };
  try {
    if (childMode === "crash") await runOfflineStepwiseComposition(fixture, { ...selection.dependencies, idempotencyKey, lease: { owner, generation }, signal: new AbortController().signal });
    else await runSemanticJob(sem007Job(executionId), { structured: async () => { throw new Error("SEM-007 offline child invoked the ordinary provider."); } }, { context: async () => sem007ContextResponse(fixture), media: async () => { throw new Error("SEM-007 child must not redeem media."); }, deliver: async () => undefined, deliverQualified: async () => undefined, fail: async (failure: unknown) => { throw new Error(`SEM-007 child unexpectedly failed: ${JSON.stringify(failure)}`); } }, semanticReplay, idempotencyKey, new AbortController().signal, { owner, generation }, selection);
    process.stdout.write("SEM007_COMMITTED\n");
    if (childMode === "crash") await new Promise<void>(() => undefined);
  } finally { await bridge.end(); }
}

if (process.env.SEM007_CHILD_MODE) await runSem007Child();

test("the production semantic worker uses pg-boss, Bridge replay, configured HTTP Anoman, and Atlas routes", { skip: skip || Boolean(process.env.SEM007_CHILD_MODE) || sem007Only }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 4 });
  const bridge = postgres(bridgeUrl.toString(), { max: 4 });
  const suffix = randomUUID();
  const owner = `semantic-worker-owner-${suffix}`;
  const project = `semantic-worker-project-${suffix}`;
  const workspace = `semantic-worker-workspace-${suffix}`;
  const master = `semantic-worker-master-${suffix}`;
  const executions = {
    extract: `semantic-worker-extract-${suffix}`,
    image: `semantic-worker-image-${suffix}`,
    imageDenied: `semantic-worker-image-denied-${suffix}`,
    unavailable: `semantic-worker-unavailable-${suffix}`,
    outage: `semantic-worker-outage-${suffix}`,
    timeout: `semantic-worker-timeout-${suffix}`,
    duplicate: `semantic-worker-duplicate-${suffix}`,
    rejected: `semantic-worker-rejected-${suffix}`,
    malformed: `semantic-worker-malformed-${suffix}`,
    schemaInvalid: `semantic-worker-schema-invalid-${suffix}`,
    providerTimeout: `semantic-worker-provider-timeout-${suffix}`,
    acceptanceRejected: `semantic-worker-acceptance-rejected-${suffix}`,
    missingCredential: `semantic-worker-missing-credential-${suffix}`,
    requestBound: `semantic-worker-request-bound-${suffix}`,
    responseBound: `semantic-worker-response-bound-${suffix}`,
    contextBound: `semantic-worker-context-bound-${suffix}`,
    resultBound: `semantic-worker-result-bound-${suffix}`,
    cancellation: `semantic-worker-cancellation-${suffix}`,
    stopPostStage: `semantic-worker-stop-post-stage-${suffix}`,
    conflictWinner: `semantic-worker-conflict-winner-${suffix}`,
    conflictLoser: `semantic-worker-conflict-loser-${suffix}`,
  };
  const resources = Object.fromEntries(Object.keys(executions).map((label) => [label, {
    bundle: `semantic-worker-bundle-${label}-${suffix}`,
    document: `semantic-worker-document-${label}-${suffix}`,
    perception: `semantic-worker-perception-${label}-${suffix}`,
    cache: `semantic-worker-cache-${label}-${suffix}`,
    sourceSha256: createHash("sha256").update(`semantic-worker-source-${label}-${suffix}`).digest("hex"),
    capabilityIdentity: `semantic-worker-test-${label}`,
  }])) as Record<keyof typeof executions, { readonly bundle: string; readonly document: string; readonly perception: string; readonly cache: string; readonly sourceSha256: string; readonly capabilityIdentity: string }>;
  const keys = Object.fromEntries(Object.entries(executions).map(([label]) => [label, `semantic-worker-key-${label}-${suffix}`])) as Record<keyof typeof executions, string>;
  const conflictKey = `semantic-worker-conflict-key-${suffix}`;
  const queueName = `semantic-worker-integration-${suffix}`;
  const completionFault = `swc_${randomUUID().replace(/-/gu, "").slice(0, 16)}`;
  const cleanupFault = `swc_${randomUUID().replace(/-/gu, "").slice(0, 16)}`;
  const accepted = new Map<string, number>();
  const failed = new Map<string, number>();
  const providerCalls = new Map<string, number>();
  const providerWires = new Map<string, { readonly system: string; readonly sourceSpecification: string; readonly responseFormat: unknown; readonly imageUrls: readonly string[] }>();
  const derivedMediaRedemptions = new Map<string, number>();
  const imageBytes = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gL+ZK2mXQAAAABJRU5ErkJggg==", "base64"));
  const imageSha256 = createHash("sha256").update(imageBytes).digest("hex");
  const imageAssets = new Map<string, Uint8Array>();
  const imageAssetRefs = new Map<string, string>();
  const normalizedByExecution = new Map<string, ReturnType<typeof normalized>>();
  const routeResponses = new Map<string, string[]>();
  const thrownErrors = new Map<string, unknown[]>();
  let providerCallCount = 0;
  let loseAcknowledgement = true;
  let handlerUnavailable = false;
  let deliveryOutage = true;
  let deliveryTimeout = true;
  let stopPostStageDelivery = true;
  let stopPostStageDeliveryStarted = false;
  let contextBoundRequests = 0;
  let resultDeliveryAttempts = 0;
  let cancellationProviderStarted = false;
  let cancellationProviderCalls = 0;
  let conflictDeliveryUnavailable = true;
  const secretPattern = /semantic-integration-capability|private\/semantic-worker|synthetic-provider-key|semantic-integration-service-credential|payload/u;
  const queuePayloadForbiddenPattern = /private\/semantic-worker|synthetic-provider-key|semantic-integration-service-credential|prompt|candidate_assertions|normalized_meaning/u;
  const recordRouteResponse = (executionId: string | undefined, operation: string, status: number, body: unknown) => {
    if (!executionId) return;
    const values = routeResponses.get(executionId) ?? [];
    values.push(`${operation}:${status}:${JSON.stringify(body)}`);
    routeResponses.set(executionId, values);
  };
  const assertRedacted = (executionId: string, ...values: unknown[]) => {
    for (const value of [...values, ...(routeResponses.get(executionId) ?? [])]) {
      const serialized = value instanceof Error
        ? `${value.name}: ${value.message}${value.cause === undefined ? "" : `; cause: ${String(value.cause)}`}`
        : typeof value === "string" ? value : JSON.stringify(value ?? "");
      assert.doesNotMatch(serialized, secretPattern, `operational surface for ${executionId} is redacted`);
    }
  };
  const queuedJobsFor = async (executionId: string) => await admin.unsafe(
    "SELECT data, output, state, retry_count FROM pgboss.job WHERE name=$1 AND data->'execution'->>'executionId'=$2 ORDER BY created_on",
    [queueName, executionId],
  ) as Array<{ data: unknown; output: unknown; state: string; retry_count: number }>;
  const assertQueuedJobRedacted = async (executionId: string) => {
    const rows = await queuedJobsFor(executionId);
    assert.ok(rows.length > 0, `the real pg-boss row is observable for ${executionId}`);
    for (const row of rows) {
      const data = row.data as { execution?: { input?: Record<string, unknown> } };
      const input = data.execution?.input;
      assert.equal(input?.contextCapability, capability, `the queue retains only the contract-required context capability for ${executionId}`);
      // contextCapability is required in the semantic job contract, so inspect
      // the real payload for any other secret-bearing content. The capability
      // itself must still be absent from errors and response surfaces.
      assert.doesNotMatch(JSON.stringify(data), queuePayloadForbiddenPattern, `queued payload for ${executionId} has no prompt, source, credential, or result body`);
      assertRedacted(executionId, row.output);
    }
  };
  const assertThrownErrorsRedacted = (executionId: string) => {
    const errors = thrownErrors.get(executionId) ?? [];
    for (const error of errors) assertRedacted(executionId, error);
    return errors;
  };
  const semanticMediaIdentity = "atlas.semantic-bridge/v1";
  const derivedStore = {
    putDerived: async (input: { readonly bytes: Uint8Array; readonly mediaType: string; readonly storageKey?: string }) => {
      if (!input.storageKey) throw new Error("image integration fixtures require an Atlas-owned asset reference");
      imageAssets.set(input.storageKey, input.bytes);
      return { storageKey: input.storageKey, contentHash: `sha256:${createHash("sha256").update(input.bytes).digest("hex")}`, byteSize: input.bytes.byteLength, mediaType: input.mediaType };
    },
    readDerived: async (assetRef: string) => {
      const bytes = imageAssets.get(assetRef);
      if (!bytes) throw new Error("image fixture asset is unavailable");
      return bytes;
    },
  };
  const derivedAuthority = new PostgresSemanticDerivedImageAuthority(atlas, derivedStore);
  const derivedGrants = new DerivedImageGrantIssuer(credential, semanticMediaIdentity);
  const derivedHydrator = new EphemeralDerivedImageHydrator(derivedGrants, derivedAuthority, derivedAuthority);
  const authority = new PostgresSemanticAuthority(atlas, {
    select: async (scope) => ({ version: "v1" as const, skill: "atlas.semantic.reconcile" as const, scope, currentCandidates: [], priorCandidates: [], selection: { policy: "semantic-worker-integration", version: "v1" as const, overflow: false, selectedCount: 0, currentCount: 0, totalCount: 0, byteLimit: semanticLimits.contextBytes, byteCount: 0, omittedPriorCount: 0 } }),
  }, {
    // Even the text-only ordinary-worker fixture must receive the current
    // stepwise context. Image fixtures replace this issuer with the same
    // Atlas-owned grant seam; neither case can select the old context shape.
    serviceIdentity: semanticMediaIdentity,
    issue: async (scope) => derivedGrants.issue(scope, derivedAuthority),
  });
  const routes = createSemanticInternalRoutes({
    serviceCredential: credential,
    authority,
    handler: {
      accept: async (input, transaction) => {
        const { executionId } = input;
        if (handlerUnavailable && executionId === executions.unavailable) throw new Error("synthetic acceptance handler unavailable");
        if (executionId === executions.acceptanceRejected) {
          throw new SemanticAcceptanceRejection("synthetic deterministic acceptance rejection");
        }
        accepted.set(executionId, (accepted.get(executionId) ?? 0) + 1);
      },
    },
    qualifiedHandler: {
      acceptQualified: async (input) => {
        if (input.executionId === executions.acceptanceRejected) throw new SemanticAcceptanceRejection("synthetic deterministic acceptance rejection");
        accepted.set(input.executionId, (accepted.get(input.executionId) ?? 0) + 1);
      },
    },
  });
  const atlasApp = Fastify();
  const reply = async (operation: "context" | "deliver" | "deliverQualified" | "fail", authorization: string | undefined, body: unknown) => {
    const response = await routes[operation](authorization?.replace(/^Bearer /u, ""), body);
    return response;
  };
  atlasApp.post("/internal/semantic/context", async (request, response) => {
    const executionId = (request.body as { executionId?: string })?.executionId;
    if (executionId === executions.contextBound) {
      contextBoundRequests += 1;
      const body = `\"${"x".repeat(semanticLimits.contextBytes + 1)}\"`;
      recordRouteResponse(executionId, "context", 200, body);
      return response.code(200).type("application/json").send(body);
    }
    const result = await reply("context", request.headers.authorization, request.body);
    recordRouteResponse(executionId, "context", result.status, result.body);
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  atlasApp.post("/internal/semantic/derived-media", async (request, response) => {
    try {
      const executionId = (request.body as { scope?: { authorization?: { executionId?: string } } })?.scope?.authorization?.executionId;
      if (executionId) derivedMediaRedemptions.set(executionId, (derivedMediaRedemptions.get(executionId) ?? 0) + 1);
      const image = await derivedHydrator.hydrate(request.body, new AbortController().signal);
      return response.code(200).type(image.mediaType).send(Buffer.from(image.bytes));
    } catch {
      return response.code(400).send({ error: "Invalid semantic derived-media request." });
    }
  });
  atlasApp.post("/internal/semantic/result", async (request, response) => {
    const executionId = (request.body as { scope?: { executionId?: string } })?.scope?.executionId;
    if (executionId === executions.outage && deliveryOutage) {
      deliveryOutage = false;
      return response.code(503).send({ error: "synthetic result delivery outage" });
    }
    if (executionId === executions.conflictWinner && conflictDeliveryUnavailable) {
      return response.code(503).send({ error: "synthetic conflicting-stage delivery outage" });
    }
    if (executionId === executions.timeout && deliveryTimeout) {
      deliveryTimeout = false;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return response.code(503).send({ error: "synthetic result delivery timeout" });
    }
    if (executionId === executions.stopPostStage && stopPostStageDelivery) {
      stopPostStageDelivery = false;
      stopPostStageDeliveryStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    if (executionId === executions.resultBound) resultDeliveryAttempts += 1;
    const result = await reply("deliver", request.headers.authorization, request.body);
    recordRouteResponse(executionId, "deliver", result.status, result.body);
    if (executionId === executions.extract && loseAcknowledgement && result.status === 204) {
      loseAcknowledgement = false;
      return response.code(503).send({ error: "synthetic acknowledgement loss" });
    }
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  atlasApp.post("/internal/semantic/qualified-result", async (request, response) => {
    const executionId = (request.body as { scope?: { executionId?: string } })?.scope?.executionId;
    if (executionId === executions.outage && deliveryOutage) {
      deliveryOutage = false;
      return response.code(503).send({ error: "synthetic qualified delivery outage" });
    }
    if (executionId === executions.conflictWinner && conflictDeliveryUnavailable) {
      return response.code(503).send({ error: "synthetic conflicting qualified delivery outage" });
    }
    if (executionId === executions.timeout && deliveryTimeout) {
      deliveryTimeout = false;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return response.code(503).send({ error: "synthetic qualified delivery timeout" });
    }
    if (executionId === executions.stopPostStage && stopPostStageDelivery) {
      stopPostStageDelivery = false;
      stopPostStageDeliveryStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    if (executionId === executions.resultBound) resultDeliveryAttempts += 1;
    const result = await reply("deliverQualified", request.headers.authorization, request.body);
    recordRouteResponse(executionId, "qualified-result", result.status, result.body);
    if (executionId === executions.extract && loseAcknowledgement && result.status === 204) {
      loseAcknowledgement = false;
      return response.code(503).send({ error: "synthetic qualified acknowledgement loss" });
    }
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  atlasApp.post("/internal/semantic/failure", async (request, response) => {
    const executionId = (request.body as { scope?: { executionId?: string } })?.scope?.executionId;
    if (executionId) failed.set(executionId, (failed.get(executionId) ?? 0) + 1);
    const result = await reply("fail", request.headers.authorization, request.body);
    recordRouteResponse(executionId, "failure", result.status, result.body);
    return response.code(result.status).type(result.contentType).send(result.body);
  });
  const anomanApp = Fastify();
  anomanApp.post("/v1/chat/completions", async (request, response) => {
    const body = request.body as { messages?: Array<{ role?: string; content?: string | Array<{ type?: string; text?: string; image_url?: { url?: string } }> }>; response_format?: { type?: string } };
    providerCallCount += 1;
    const userContent = body.messages?.find((message) => message.role === "user")?.content;
    const systemContent = body.messages?.find((message) => message.role === "system")?.content;
    const systemText = typeof systemContent === "string" ? systemContent : systemContent?.find((part) => part.type === "text")?.text ?? "";
    const userText = typeof userContent === "string" ? userContent : userContent?.find((part) => part.type === "text")?.text;
    const imageUrls = typeof userContent === "string" ? [] : userContent?.flatMap((part) => part.type === "image_url" && typeof part.image_url?.url === "string" ? [part.image_url.url] : []) ?? [];
    const requested = JSON.parse(userText ?? "{}") as { profile?: string; scope?: { executionId?: string }; source_slots?: Array<{ slot?: string; content?: string; role?: string }>; sourceSlots?: Array<{ slot?: string; content?: string; role?: string }>; currentCandidates?: unknown[]; priorCandidates?: unknown[] };
    const sourceSlots = requested.sourceSlots ?? requested.source_slots ?? [];
    const extractionExecutionId = sourceSlots.map((source) => source.content).find((content): content is string => typeof content === "string" && content.startsWith("Synthetic execution "))?.slice("Synthetic execution ".length, -1);
    const executionId = extractionExecutionId ?? requested.scope?.executionId;
    if (executionId) {
      providerCalls.set(executionId, (providerCalls.get(executionId) ?? 0) + 1);
      providerWires.set(executionId, {
        system: systemText,
        sourceSpecification: userText ?? "",
        responseFormat: body.response_format,
        imageUrls,
      });
    }
    if (executionId === executions.rejected) return response.code(401).send({ error: "credential rejected" });
    if (executionId === executions.malformed) return { model: "semantic-integration-model", choices: [{ message: { content: "{" } }] };
    if (executionId === executions.schemaInvalid) return { model: "semantic-integration-model", choices: [{ message: { content: JSON.stringify({ version: "v1", source_results: "not-an-array" }) } }] };
    if (executionId === executions.providerTimeout) return response.code(504).send({ error: "synthetic provider timeout" });
    if (executionId === executions.cancellation) {
      cancellationProviderStarted = true;
      cancellationProviderCalls += 1;
      if (cancellationProviderCalls === 1) await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    const reconciliation = Array.isArray(requested.currentCandidates) || Array.isArray(requested.priorCandidates);
    const ownedSlots = sourceSlots.filter((source) => source.role === "owned_source");
    const stepwiseEnvelope = { contract_version: "atlas.relationship-extraction-envelope/v1", semantic_proposal: { version: "v1", source_results: ownedSlots.map((source) => ({ slot: source.slot, classification: "non_fact", candidates: [], non_fact_reason: "Synthetic integration fixture.", questions: [] })) }, relationship_proposals: [] };
    const oversizedStepwiseEnvelope = {
      contract_version: "atlas.relationship-extraction-envelope/v1",
      semantic_proposal: {
        version: "v1",
        source_results: ownedSlots.map((source, sourceIndex) => ({
          slot: source.slot,
          classification: "candidate",
          candidates: Array.from({ length: 12 }, (_, index) => ({
            semantic_key: `bound-${sourceIndex}-${index}`,
            kind: "rule",
            payload: Object.fromEntries(Array.from({ length: 100 }, (_, payloadIndex) => [`detail_${payloadIndex}`, "x".repeat(2_048)])),
            normalized_meaning: `Synthetic oversized candidate ${sourceIndex}-${index}.`,
            needs_resolution: false,
          })),
          non_fact_reason: null,
          questions: [],
        })),
      },
      relationship_proposals: [],
    };
    const value = executionId === executions.resultBound
      ? oversizedStepwiseEnvelope
      : reconciliation
      ? { version: "v1", relationships: [], questions: [] }
      : stepwiseEnvelope;
    return { model: "semantic-integration-model", choices: [{ message: { content: JSON.stringify(value) } }] };
  });
  let worker: ReturnType<typeof createBackgroundWorker> | undefined;
  try {
    await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'semantic worker integration',$3)", [project, `semantic-worker-${suffix.slice(0, 12)}`, owner]);
    await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft'),($3,$2,'master','empty','Master')", [workspace, project, master]);
    for (const [label, executionId] of Object.entries(executions)) {
      const resource = resources[label as keyof typeof executions];
      const stage = label === "unavailable" ? "reconciliation" : "extraction";
      await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'semantic-worker.pdf','private/semantic-worker',$4,1,'application/pdf',$5)", [resource.document, project, workspace, resource.sourceSha256, owner]);
      await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [resource.bundle, project, workspace]);
      await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id,semantic_extraction_execution_id) VALUES ($1,$2,$3,$4,1,'pending',$5,$6)", [resource.bundle, resource.document, project, workspace, resource.perception, executionId]);
      await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/semantic-worker',$3,'application/pdf',1,'v1','completed',$4,$5)", [resource.perception, resource.document, resource.sourceSha256, `semantic-worker-perception-key-${label}-${suffix}`, resource.capabilityIdentity]);
      const document = normalized(resource.perception, resource.document, resource.sourceSha256);
      if (stage === "extraction") document.pages[0].textBlocks.push({ id: "execution-marker", text: `Synthetic execution ${executionId}.` });
      if (label === "image" || label === "imageDenied") {
        const assetRef = `derived/${randomUUID()}`;
        imageAssetRefs.set(executionId, assetRef);
        imageAssets.set(assetRef, imageBytes);
        document.pages[0].visualRegions.push({ id: "image-marker", assetRef });
        await atlas.unsafe("INSERT INTO atlas.document_perception_derived_manifest (id,execution_id,artifact_id,source_sha256,profile,page_number,locator_id,asset_ref,media_type,width,height,byte_size,sha256,verified_at,accepted_at) VALUES ($1,$2,$3,$4,'semantic-worker-image-profile',1,'image-marker',$5,'image/png',1,1,$6,$7,now(),now())", [randomUUID(), resource.perception, resource.document, resource.sourceSha256, assetRef, imageBytes.byteLength, imageSha256]);
      }
      normalizedByExecution.set(executionId, document);
      await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb)", [resource.cache, resource.sourceSha256, resource.capabilityIdentity, JSON.stringify(document)]);
      await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,$6,'v1','v1',$1,'queued','context',$7,now()+interval '1 hour')", [executionId, project, workspace, resource.bundle, resource.document, stage, capabilityFingerprint]);
    }
    await admin.unsafe(`CREATE SEQUENCE ${completionFault} START 1`);
    await admin.unsafe(`CREATE FUNCTION ${completionFault}_fn() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$ BEGIN IF NEW.status = 'completed' AND nextval('atlas.${completionFault}') = 1 THEN RAISE EXCEPTION 'synthetic completion acknowledgement loss'; END IF; RETURN NEW; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${completionFault}_trigger BEFORE UPDATE ON bridge.background_effects FOR EACH ROW EXECUTE FUNCTION ${completionFault}_fn()`);
    await admin.unsafe(`CREATE SEQUENCE ${cleanupFault} START 1`);
    await admin.unsafe(`CREATE FUNCTION ${cleanupFault}_fn() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$ BEGIN IF nextval('atlas.${cleanupFault}') = 1 THEN RAISE EXCEPTION 'synthetic fenced cleanup loss'; END IF; RETURN OLD; END $$`);
    await admin.unsafe(`CREATE TRIGGER ${cleanupFault}_trigger BEFORE DELETE ON bridge.semantic_result_delivery FOR EACH ROW EXECUTE FUNCTION ${cleanupFault}_fn()`);
    await atlasApp.listen({ host: "127.0.0.1", port: 0 });
    await anomanApp.listen({ host: "127.0.0.1", port: 0 });
    const atlasPort = (atlasApp.server.address() as AddressInfo).port;
    const anomanPort = (anomanApp.server.address() as AddressInfo).port;
    const provider = new AnomanProvider({ apiKey: "synthetic-provider-key", baseUrl: `http://127.0.0.1:${anomanPort}`, structuredModel: "gemini-2.5-flash", maxRequestBytes: 2 * 1024 * 1024, maxResponseBytes: 10 * 1024 * 1024, zeroDataRetentionApproved: false, timeoutMilliseconds: 10_000 });
    const client = createAtlasSemanticClient({ baseUrl: `http://127.0.0.1:${atlasPort}`, contextPath: "/internal/semantic/context", mediaPath: "/internal/semantic/derived-media", resultPath: "/internal/semantic/result", qualifiedResultPath: "/internal/semantic/qualified-result", failurePath: "/internal/semantic/failure", serviceCredential: credential, timeoutMilliseconds: 100 });
    const config: WorkerConfig = { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 3, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 };
    const createWorker = (stepwiseRoute = sem007Route) => createBackgroundWorker(config, new TestRuntime(), queueName, undefined, undefined, async (job, signal, context) => {
      try {
        await runSemanticJob(job, provider, client, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration }, undefined, { dependencies: { database: context.database, routes: [stepwiseRoute], routeId: stepwiseRoute.routeId, profileId: stepwiseRoute.profileId, deadlineEpochMilliseconds: context.deadlineEpochMilliseconds } });
      } catch (error) {
        const errors = thrownErrors.get(job.executionId) ?? [];
        errors.push(error);
        thrownErrors.set(job.executionId, errors);
        throw error;
      }
    });
    worker = createWorker();
    await worker.start();
    const enqueue = async (label: keyof typeof executions, skill: "atlas.semantic.extract" | "atlas.semantic.reconcile", idempotencyKey = keys[label]) => worker!.boss.send(queueName, { idempotencyKey, execution: { version: "v1", executionId: executions[label], mode: "background", skill: { id: skill, version: "v1" }, input: { contextCapability: capability }, context: { boundary: "semantic-worker-integration", items: [] } } }, { singletonKey: `${idempotencyKey}-${randomUUID()}` });
    const effectFor = async (idempotencyKey: string) => (await bridge.unsafe("SELECT execution_id, status, lease_owner, lease_generation, completed_at, last_error FROM bridge.background_effects WHERE idempotency_key=$1", [idempotencyKey]))[0] as { execution_id?: string; status?: string; lease_owner?: string; lease_generation?: number; completed_at?: string; last_error?: string } | undefined;
    const replayFor = async (idempotencyKey: string) => (await bridge.unsafe("SELECT execution_id, validated_envelope, lease_owner, lease_generation FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [idempotencyKey]))[0] as { execution_id?: string; validated_envelope?: unknown; lease_owner?: string; lease_generation?: number } | undefined;
    const lifecycleFor = async (executionId: string) => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executionId]))[0]?.lifecycle;

    await enqueue("extract", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.extract]))[0]?.status === "pending", "Atlas acceptance before completion restart boundary");
    try {
      await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.extract]))[0]?.status === "completed", "extraction completion");
    } catch (error) {
      console.error("SEM007A_EXTRACTION_COMPLETION_DIAGNOSTIC", await effectFor(keys.extract), await replayFor(keys.extract), thrownErrors.get(executions.extract), routeResponses.get(executions.extract));
      throw error;
    }
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.extract]))[0]?.count === 0, "fenced replay cleanup");
    assert.equal(providerCallCount, 1, "acknowledgement loss, completion retry, and cleanup retry replay one immutable provider result");
    assert.equal(accepted.get(executions.extract), 1, "Atlas accepts one logical effect despite the lost acknowledgement");
    assert.ok(Number((await bridge.unsafe("SELECT lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [keys.extract]))[0]?.lease_generation) >= 2, "completion retry acquires a later fenced lease");
    assert.equal((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.extract]))[0]?.lifecycle, "completed");

    // RC-007A-04/05: this is the ordinary pg-boss worker path, not the
    // injected offline lane. Atlas issues an authenticated image grant from
    // its accepted manifest, Bridge redeems it through the internal media
    // route, and the configured Anoman adapter serializes one multipart image.
    await worker.stop(); worker = createWorker({ ...sem007Route, imageTpm: { state: "unknown" } }); await worker.start();
    await enqueue("imageDenied", "atlas.semantic.extract");
    await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.imageDenied]))[0]?.lifecycle === "failed", "ordinary denied-image preflight");
    assert.equal(derivedMediaRedemptions.get(executions.imageDenied) ?? 0, 0, "unknown image TPM rejects before consuming the Atlas media grant");
    assert.equal(providerCalls.get(executions.imageDenied) ?? 0, 0, "unknown image TPM rejects before provider dispatch");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_composite_stage WHERE idempotency_key=$1", [keys.imageDenied]))[0]?.count, 0, "unknown image TPM creates no durable composite stage");
    assert.equal(failed.get(executions.imageDenied), 1, "ordinary denied image records the bounded resource failure");
    await worker.stop(); worker = createWorker(); await worker.start();
    await enqueue("image", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.image]))[0]?.status === "completed", "image extraction completion");
    const imageWire = providerWires.get(executions.image);
    const imageAssetRef = imageAssetRefs.get(executions.image);
    const imagePacket = buildStepwiseSourcePacket({ document: normalizedByExecution.get(executions.image)!, assetIdentities: [{ pageNumber: 1, locatorId: "image-marker", assetRef: imageAssetRef!, sha256: imageSha256, sourceSha256: resources.image.sourceSha256 }] });
    const imageRequest = buildStepwiseRelationshipEnvelopeRequest(imagePacket);
    assert.ok(imageWire, "Anoman loopback records the ordinary image request wire");
    assert.ok(imageAssetRef, "the Atlas-issued image grant retains its accepted asset identity");
    assert.equal(imageWire?.imageUrls.length, 1, "Anoman receives exactly one multipart image part");
    assert.equal(imageWire?.imageUrls[0], `data:image/png;base64,${Buffer.from(imageBytes).toString("base64")}`, "Anoman receives exactly the Atlas-authorized image bytes");
    assert.equal(imageWire?.system, imageRequest.systemPrompt, "Anoman receives the exact canonical stepwise system prompt");
    assert.equal(imageWire?.sourceSpecification, imageRequest.sourceSpecification, "Anoman receives the exact source specification bound to the Atlas asset");
    assert.equal(createHash("sha256").update(imageWire!.sourceSpecification).digest("hex"), imageRequest.sourceSpecificationSha256, "Anoman source-specification hash matches the REL request");
    assert.equal(createHash("sha256").update(JSON.stringify(imageRequest.responseSchema)).digest("hex"), createHash("sha256").update(JSON.stringify(buildStepwiseRelationshipEnvelopeRequest(imagePacket).responseSchema)).digest("hex"), "the recorded REL-envelope schema hash is deterministic");
    assert.deepEqual(imageWire?.responseFormat, { type: "json_object" }, "Anoman preserves bounded JSON object mode on the wire");
    assert.equal(derivedMediaRedemptions.get(executions.image), 1, "qualified image work redeems its exact Atlas grant once after preflight");
    assert.equal(accepted.get(executions.image), 1, "the ordinary image result is delivered through qualified acceptance once");
    console.log(`SEM007A_ANOMAN_WIRE_EVIDENCE ${JSON.stringify({ systemPromptSha256: createHash("sha256").update(imageWire!.system).digest("hex"), sourceSpecificationSha256: createHash("sha256").update(imageWire!.sourceSpecification).digest("hex"), responseSchemaSha256: createHash("sha256").update(JSON.stringify(imageRequest.responseSchema)).digest("hex"), image: { assetRef: imageAssetRef, sha256: imageSha256, byteLength: imageBytes.byteLength, wireDataUrlSha256: createHash("sha256").update(imageWire!.imageUrls[0]!).digest("hex") }, responseFormat: imageWire!.responseFormat, providerCalls: providerCalls.get(executions.image) })}`);

    handlerUnavailable = true;
    await enqueue("unavailable", "atlas.semantic.reconcile");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.unavailable]))[0]?.count === 1, "retryable unavailable handler replay");
    await waitFor(async () => providerCallCount === 3, "single provider call before retryable handler failure");
    assert.notEqual((await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.unavailable]))[0]?.status, "completed", "an unavailable Atlas acceptance handler cannot complete Bridge work");
    assert.notEqual((await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.unavailable]))[0]?.lifecycle, "completed");
    handlerUnavailable = false;

    await bridge.unsafe("UPDATE bridge.background_effects SET status='running', lease_owner='expired-worker', lease_generation=lease_generation+1, lease_expires_at=now()-interval '1 second' WHERE idempotency_key=$1", [keys.unavailable]);
    await enqueue("unavailable", "atlas.semantic.reconcile");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.unavailable]))[0]?.status === "completed", "stale claimant delivery");
    assert.equal(providerCallCount, 3, "a real stale successor redelivers the stored winner without reinvoking Anoman");
    assert.equal(accepted.get(executions.unavailable), 1, "the stored winner reaches one Atlas logical effect");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.unavailable]))[0]?.count, 0, "only the completed successor fence cleans the winner replay row");

    // A result delivery outage occurs after immutable staging. The subsequent
    // worker attempt must replay that exact envelope instead of failing it.
    await enqueue("outage", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.outage]))[0]?.count === 1, "durable replay after delivery outage");
    await worker.stop(); worker = createWorker(); await worker.start();
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.outage]))[0]?.status === "completed", "outage replay completion");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.outage]))[0]?.count === 0, "outage replay cleanup");
    assert.equal(accepted.get(executions.outage), 1, "delivery outage reaches one Atlas logical effect after replay");
    assert.equal(failed.get(executions.outage) ?? 0, 0, "a staged outage is never terminally failed");
    assert.equal(providerCallCount, 4, "delivery outage reuses one staged provider result");

    // This timeout reaches the post-stage delivery catch boundary. It is the
    // regression for preserving a durable envelope when Atlas transport cancels.
    await enqueue("timeout", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.timeout]))[0]?.count === 1, "durable replay after Atlas timeout");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.timeout]))[0]?.status === "completed", "timeout replay completion");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.timeout]))[0]?.count === 0, "timeout replay cleanup");
    assert.equal(accepted.get(executions.timeout), 1, "Atlas timeout reaches one logical effect after staged replay");
    assert.equal(failed.get(executions.timeout) ?? 0, 0, "a timed-out staged result is never terminally failed");
    assert.equal(providerCallCount, 5, "Atlas timeout reuses one staged provider result");

    // Separate duplicate queue messages share one Bridge idempotency record.
    await Promise.all([enqueue("duplicate", "atlas.semantic.extract"), enqueue("duplicate", "atlas.semantic.extract")]);
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.duplicate]))[0]?.status === "completed", "duplicate job completion");
    assert.equal(accepted.get(executions.duplicate), 1, "duplicate queue jobs create one Atlas logical effect");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.duplicate]))[0]?.count, 0, "duplicate completion leaves no replay row");
    assert.equal(providerCallCount, 6, "duplicate jobs invoke Anoman once for their shared execution");

    // Pre-stage provider failures use the real worker, HTTP adapter, Atlas
    // failure route, and Bridge effect ledger; none creates a trusted replay.
    for (const label of ["rejected", "malformed", "schemaInvalid", "providerTimeout"] as const) {
      await enqueue(label, "atlas.semantic.extract");
      await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions[label]]))[0]?.lifecycle === "failed", `${label} bounded Atlas failure`);
      assert.equal(accepted.get(executions[label]) ?? 0, 0, `${label} creates no accepted effect`);
      assert.equal(failed.get(executions[label]), 1, `${label} reaches one bounded failure handoff`);
      assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys[label]]))[0]?.count, 0, `${label} creates no trusted replay`);
      assert.equal(providerCalls.get(executions[label]), 1, `${label} reaches the controlled provider exactly once before its bounded failure`);
      assert.deepEqual((await atlas.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE execution_id=$1) AS results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE bundle_id=$2 AND document_id=$3) AS candidates, (SELECT count(*)::int FROM atlas.semantic_execution WHERE bundle_id=$2 AND document_id=$3 AND stage='reconciliation') AS successors, (SELECT completed_document_count FROM atlas.extraction_bundle WHERE id=$2) AS completed", [executions[label], resources[label].bundle, resources[label].document]))[0], { results: 0, candidates: 0, successors: 0, completed: 0 }, `${label} creates no materialization, progress, or successor`);
      const effect = (await bridge.unsafe("SELECT status, last_error FROM bridge.background_effects WHERE idempotency_key=$1", [keys[label]]))[0];
      assert.equal(effect?.status, "completed", `${label} records one completed bounded failure effect`);
      assert.doesNotMatch(String(effect?.last_error ?? ""), /synthetic-provider-key|semantic-integration-capability|private\/semantic-worker/u);
    }

    // A current, schema-valid envelope that Atlas deterministically rejects is
    // not replayable delivery work.  It uses the established failure route,
    // rolling back the untrusted result and containing only its own member.
    await enqueue("acceptanceRejected", "atlas.semantic.extract");
    try {
      await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.acceptanceRejected]))[0]?.lifecycle === "failed", "deterministic acceptance rejection failure");
    } catch (error) {
      console.error("SEM007A_ACCEPTANCE_REJECTION_DIAGNOSTIC", await effectFor(keys.acceptanceRejected), await replayFor(keys.acceptanceRejected), thrownErrors.get(executions.acceptanceRejected), routeResponses.get(executions.acceptanceRejected));
      throw error;
    }
    assert.equal(accepted.get(executions.acceptanceRejected) ?? 0, 0, "a deterministically rejected result has no trusted acceptance");
    assert.equal(failed.get(executions.acceptanceRejected), 1, "a deterministically rejected result uses one terminal failure handoff");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.acceptanceRejected]))[0]?.count, 0, "terminal failure cleanup removes the rejected staged envelope");
    assert.equal(providerCalls.get(executions.acceptanceRejected), 1, "the real invalid-evidence result reaches the controlled provider once");
    const controlLabel = "duplicate" as const;
    const controlBefore = { db: await atlas.unsafe("SELECT b.state AS bundle_state, b.completed_document_count, m.state AS member_state, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE bundle_id=b.id) AS results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE bundle_id=b.id) AS candidates FROM atlas.extraction_bundle b JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id WHERE b.id=$1 AND m.document_id=$2", [resources[controlLabel].bundle, resources[controlLabel].document]), queue: await admin.unsafe("SELECT count(*)::int AS queue_rows FROM pgboss.job WHERE name=$1 AND data->'execution'->>'executionId'=$2", [queueName, executions[controlLabel]]) };
    assert.deepEqual((await atlas.unsafe("SELECT e.lifecycle, m.state AS member_state, b.state AS bundle_state, b.completed_document_count, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE execution_id=e.id) AS results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE bundle_id=e.bundle_id AND document_id=e.document_id) AS candidates, (SELECT count(*)::int FROM atlas.semantic_execution WHERE bundle_id=e.bundle_id AND document_id=e.document_id AND stage='reconciliation') AS successors FROM atlas.semantic_execution e JOIN atlas.extraction_bundle_document m ON m.bundle_id=e.bundle_id AND m.document_id=e.document_id JOIN atlas.extraction_bundle b ON b.id=m.bundle_id WHERE e.id=$1", [executions.acceptanceRejected]))[0], { lifecycle: "failed", member_state: "needs_attention", bundle_state: "needs_attention", completed_document_count: 0, results: 0, candidates: 0, successors: 0 }, "the real validator rejection creates no trusted result, progress, or successor before target-only containment");
    assert.deepEqual((await atlas.unsafe("SELECT w.state, (SELECT count(*)::int FROM atlas.extraction_bundle WHERE workspace_id=w.id) AS bundles FROM atlas.workspace w WHERE w.id=$1", [master]))[0], { state: "empty", bundles: 0 }, "the empty Master remains unmaterialized");
    const controlAfter = { db: await atlas.unsafe("SELECT b.state AS bundle_state, b.completed_document_count, m.state AS member_state, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE bundle_id=b.id) AS results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE bundle_id=b.id) AS candidates FROM atlas.extraction_bundle b JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id WHERE b.id=$1 AND m.document_id=$2", [resources[controlLabel].bundle, resources[controlLabel].document]), queue: await admin.unsafe("SELECT count(*)::int AS queue_rows FROM pgboss.job WHERE name=$1 AND data->'execution'->>'executionId'=$2", [queueName, executions[controlLabel]]) };
    assert.deepEqual(controlAfter, controlBefore, "the unrelated control bundle and its queue observation remain unchanged");

    const missingQueue = `${queueName}-missing`;
    const missingWorker = createBackgroundWorker(config, new TestRuntime(), missingQueue, undefined, undefined, async (job, signal, context) => {
      const missingProvider = new AnomanProvider({ apiKey: undefined, baseUrl: `http://127.0.0.1:${anomanPort}`, structuredModel: "gemini-2.5-flash", maxRequestBytes: 2 * 1024 * 1024, maxResponseBytes: 10 * 1024 * 1024, zeroDataRetentionApproved: false, timeoutMilliseconds: 100 });
      await runSemanticJob(job, missingProvider, client, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
    });
    try {
      await missingWorker.start();
      await missingWorker.boss.send(missingQueue, { idempotencyKey: keys.missingCredential, execution: { version: "v1", executionId: executions.missingCredential, mode: "background", skill: { id: "atlas.semantic.extract", version: "v1" }, input: { contextCapability: capability }, context: { boundary: "semantic-worker-integration", items: [] } } }, { singletonKey: `${keys.missingCredential}-${randomUUID()}` });
      await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.missingCredential]))[0]?.lifecycle === "failed", "missing credential bounded failure");
      assert.equal(accepted.get(executions.missingCredential) ?? 0, 0);
      assert.equal(failed.get(executions.missingCredential), 1);
      assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.missingCredential]))[0]?.count, 0);
    } finally { await missingWorker.stop().catch(() => undefined); }

    for (const [label, bounds] of [["requestBound", { maxRequestBytes: 1 }], ["responseBound", { maxResponseBytes: 1 }]] as const) {
      const boundedQueue = `${queueName}-${label}`;
      const boundedWorker = createBackgroundWorker(config, new TestRuntime(), boundedQueue, undefined, undefined, async (job, signal, context) => {
        const boundedProvider = new AnomanProvider({ apiKey: "synthetic-provider-key", baseUrl: `http://127.0.0.1:${anomanPort}`, structuredModel: "gemini-2.5-flash", maxRequestBytes: 2 * 1024 * 1024, maxResponseBytes: 10 * 1024 * 1024, zeroDataRetentionApproved: false, timeoutMilliseconds: 100, ...bounds });
        await runSemanticJob(job, boundedProvider, client, createSemanticResultReplay(context.database), context.idempotencyKey, signal, { owner: context.leaseOwner, generation: context.leaseGeneration });
      });
      try {
        await boundedWorker.start();
        await boundedWorker.boss.send(boundedQueue, { idempotencyKey: keys[label], execution: { version: "v1", executionId: executions[label], mode: "background", skill: { id: "atlas.semantic.extract", version: "v1" }, input: { contextCapability: capability }, context: { boundary: "semantic-worker-integration", items: [] } } }, { singletonKey: `${keys[label]}-${randomUUID()}` });
        await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions[label]]))[0]?.lifecycle === "failed", `${label} bounded failure`);
        assert.equal(accepted.get(executions[label]) ?? 0, 0);
        assert.equal(failed.get(executions[label]), 1);
        assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys[label]]))[0]?.count, 0);
      } finally { await boundedWorker.stop().catch(() => undefined); }
    }

    // The context response is bounded by the real Atlas HTTP client before a
    // provider request or replay write can occur.
    await enqueue("contextBound", "atlas.semantic.extract");
    await waitFor(async () => contextBoundRequests > 0, "oversized Atlas context request");
    await waitFor(async () => Boolean((await bridge.unsafe("SELECT last_error FROM bridge.background_effects WHERE idempotency_key=$1", [keys.contextBound]))[0]?.last_error), "bounded context failure ledger entry");
    const contextEffect = await effectFor(keys.contextBound);
    assert.equal(providerCalls.get(executions.contextBound) ?? 0, 0, "an oversized Atlas context never reaches Anoman");
    assert.equal(accepted.get(executions.contextBound) ?? 0, 0);
    assert.equal(await lifecycleFor(executions.contextBound), "queued", "the oversized synthetic response cannot advance the Atlas execution lifecycle");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.contextBound]))[0]?.count, 0);
    assert.equal(contextEffect?.status, "pending", "the context-bound effect records a bounded retryable outcome");
    assert.ok(contextEffect?.lease_owner, "the context-bound effect keeps its claimant identity");
    assert.ok(Number(contextEffect?.lease_generation) >= 1, "the context-bound effect keeps its claimant fence");
    assert.match(String(contextEffect?.last_error), /context|byte|limit|semantic/iu, "the context-bound effect records a bounded failure outcome");
    assertRedacted(executions.contextBound, contextEffect?.last_error);
    await assertQueuedJobRedacted(executions.contextBound);
    assert.ok(assertThrownErrorsRedacted(executions.contextBound).length > 0, "the actual context-bound thrown error is captured and checked");

    // Anoman preserves only bounded provenance. A large but otherwise valid
    // provider proposal therefore hits Atlas's canonical-result limit before
    // it can become a durable qualified handoff.
    const providerBeforeResultBound = providerCallCount;
    await enqueue("resultBound", "atlas.semantic.extract");
    await waitFor(async () => (await atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [executions.resultBound]))[0]?.lifecycle === "failed", "bounded canonical-result failure");
    const oversizedEffect = await effectFor(keys.resultBound);
    assert.equal(accepted.get(executions.resultBound) ?? 0, 0);
    assert.equal(failed.get(executions.resultBound), 1, "an oversized canonical result uses the bounded failure route");
    assert.equal(providerCallCount, providerBeforeResultBound + 1, "the oversized result reaches Anoman once");
    assert.equal(providerCalls.get(executions.resultBound), 1, "the oversized result has exactly one provider call");
    assert.equal(resultDeliveryAttempts, 0, "a canonical-result bound failure never reaches the public delivery route");
    assert.equal(await lifecycleFor(executions.resultBound), "failed", "the untrusted oversized result is terminally contained");
    assert.equal(oversizedEffect?.status, "completed", "the bounded failure completes the Bridge effect");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.resultBound]))[0]?.count, 0, "a pre-stage canonical-result bound failure creates no replay row");
    assertRedacted(executions.resultBound, oversizedEffect?.last_error, routeResponses.get(executions.resultBound));
    await assertQueuedJobRedacted(executions.resultBound);
    assert.equal(assertThrownErrorsRedacted(executions.resultBound).length, 0, "the bounded pre-stage failure is handled without an uncaught worker error");

    // Stopping a real worker while its configured provider request is active
    // must leave no trusted result. A successor is then free to retry.
    const providerBeforeCancellation = providerCallCount;
    await enqueue("cancellation", "atlas.semantic.extract");
    await waitFor(async () => cancellationProviderStarted, "in-flight semantic provider request");
    await worker.stop();
    // Observe the cancelled claimant before a successor can claim the job.
    // Starting the successor first would let it legitimately complete the
    // same execution and erase the pre-stage cancellation boundary.
    assert.equal(accepted.get(executions.cancellation) ?? 0, 0);
    assert.equal(failed.get(executions.cancellation) ?? 0, 0, "pre-stage cancellation does not fabricate a terminal failure");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.cancellation]))[0]?.count, 0);
    const cancellationEffect = await effectFor(keys.cancellation);
    assert.ok(cancellationEffect, "in-flight cancellation is represented in the Bridge lease ledger");
    assert.equal(cancellationEffect?.status, "pending", "pre-stage cancellation remains retryable rather than completing a trusted effect");
    assert.ok(cancellationEffect?.lease_owner, "pre-stage cancellation records the active lease owner");
    assert.ok(Number(cancellationEffect?.lease_generation) >= 1, "pre-stage cancellation records its lease generation");
    assert.equal(await lifecycleFor(executions.cancellation), "running", "pre-stage cancellation leaves the Atlas lifecycle bounded but incomplete for retry");
    assert.equal(providerCalls.get(executions.cancellation), 1, "the cancelled claimant made one active provider call");
    assertRedacted(executions.cancellation, cancellationEffect?.last_error);
    await assertQueuedJobRedacted(executions.cancellation);
    const cancellationErrors = assertThrownErrorsRedacted(executions.cancellation);
    assert.ok(cancellationErrors.length > 0, "the actual cancellation thrown by runSemanticJob is captured");
    assert.ok(cancellationErrors.every((error) => error instanceof Error && error.message === "Anoman request was cancelled."), "pre-stage cancellation exposes only its bounded typed provider-cancellation outcome");
    worker = createWorker(); await worker.start();
    // Explicitly submit the existing idempotency identity to the fresh real
    // pg-boss worker.  This observes successor recovery without depending on
    // the abandoned worker's retry scheduler after orderly shutdown.
    await enqueue("cancellation", "atlas.semantic.extract");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.cancellation]))[0]?.status === "completed", "fresh worker pre-stage retry");
    assert.equal(accepted.get(executions.cancellation), 1, "only the fresh worker may accept a pre-stage-cancelled execution");
    assert.ok(providerCallCount >= providerBeforeCancellation + 2, "pre-stage cancellation permits at-least-once provider execution by the fresh worker");

    // This stop happens while the real result route is in flight, after the
    // immutable replay row exists. The fresh worker must redeliver that row
    // rather than invoke Anoman a second time.
    const providerBeforePostStageStop = providerCallCount;
    await enqueue("stopPostStage", "atlas.semantic.extract");
    await waitFor(async () => stopPostStageDeliveryStarted && (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.stopPostStage]))[0]?.count === 1, "active post-stage delivery boundary");
    const stoppedReplay = await replayFor(keys.stopPostStage);
    await worker.stop();
    const stoppedEffect = await effectFor(keys.stopPostStage);
    const replayAfterStop = await replayFor(keys.stopPostStage);
    assert.equal(await lifecycleFor(executions.stopPostStage), "running", "the active stop cannot complete Atlas before successor delivery");
    assert.equal(stoppedEffect?.status, "pending", "the active stop returns the fenced effect to retryable state");
    assert.ok(stoppedEffect?.lease_owner, "the stopped claimant is identified in the Bridge lease ledger");
    assert.ok(Number(stoppedEffect?.lease_generation) >= 1, "the stopped claimant has a Bridge lease generation");
    assert.deepEqual(replayAfterStop?.validated_envelope, stoppedReplay?.validated_envelope, "the replay envelope identity survives the active worker stop");
    assert.ok(replayAfterStop?.lease_owner, "the retained replay preserves its staging owner");
    assert.ok(Number(replayAfterStop?.lease_generation) >= 1, "the retained replay preserves its staging generation");
    assertRedacted(executions.stopPostStage, stoppedEffect?.last_error);
    await assertQueuedJobRedacted(executions.stopPostStage);
    assert.ok(assertThrownErrorsRedacted(executions.stopPostStage).length > 0, "the actual interrupted-delivery thrown error is captured and checked");
    worker = createWorker(); await worker.start();
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [keys.stopPostStage]))[0]?.status === "completed", "fresh worker post-stage replay completion");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [keys.stopPostStage]))[0]?.count === 0, "fresh worker post-stage replay cleanup");
    assert.equal(providerCallCount, providerBeforePostStageStop + 1, "post-stage stop reuses the immutable provider result");
    assert.equal(providerCalls.get(executions.stopPostStage), 1, "post-stage recovery never calls the provider twice");
    assert.equal(accepted.get(executions.stopPostStage), 1, "post-stage stop creates one Atlas logical effect");
    assert.equal(failed.get(executions.stopPostStage) ?? 0, 0, "post-stage stop has no terminal failure handoff");
    assert.equal(await lifecycleFor(executions.stopPostStage), "completed", "the successor advances Atlas only after replay delivery");
    const stopEffect = await effectFor(keys.stopPostStage);
    assert.equal(stopEffect?.status, "completed", "the successor fences logical completion");
    assert.ok(stopEffect?.lease_owner, "the completed successor has a lease owner");
    assert.ok(Number(stopEffect?.lease_generation) >= 1, "the completed successor has a lease generation");
    assertRedacted(executions.stopPostStage, stopEffect?.last_error);

    // A second execution may not replace a staged winner that owns the same
    // Bridge idempotency identity. The real pg-boss path records the conflict
    // without a loser provider call or a stale cleanup of the winner.
    const callsBeforeConflict = providerCallCount;
    await enqueue("conflictWinner", "atlas.semantic.extract", conflictKey);
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [conflictKey]))[0]?.count === 1, "immutable conflicting-stage winner");
    const winnerReplay = await replayFor(conflictKey);
    await enqueue("conflictLoser", "atlas.semantic.extract", conflictKey);
    await waitFor(async () => Boolean((await bridge.unsafe("SELECT last_error FROM bridge.background_effects WHERE idempotency_key=$1", [conflictKey]))[0]?.last_error), "conflicting idempotency rejection");
    assert.equal(providerCallCount, callsBeforeConflict + 1, "only the staged winner reaches Anoman");
    assert.equal(providerCalls.get(executions.conflictWinner), 1, "winner A reaches the provider exactly once");
    assert.equal(providerCalls.get(executions.conflictLoser) ?? 0, 0, "loser B never reaches the provider");
    assert.deepEqual((await replayFor(conflictKey))?.validated_envelope, winnerReplay?.validated_envelope, "the losing execution cannot replace the immutable envelope");
    assert.equal(accepted.get(executions.conflictLoser) ?? 0, 0, "the losing execution has no logical Atlas effect");
    assert.equal(failed.get(executions.conflictLoser) ?? 0, 0, "the losing execution has no terminal failure handoff");
    assert.equal(await lifecycleFor(executions.conflictWinner), "running", "winner A remains in the Atlas delivery lifecycle while its replay is retained");
    assert.equal(await lifecycleFor(executions.conflictLoser), "queued", "loser B cannot enter the Atlas lifecycle through the conflicting Bridge key");
    const conflictEffect = await effectFor(conflictKey);
    assert.equal(conflictEffect?.execution_id, executions.conflictWinner, "the Bridge effect remains owned by winner A");
    assert.equal(conflictEffect?.status, "pending", "the unavailable winner remains replayable, not completed");
    assert.ok(conflictEffect?.lease_owner, "the retained winner records its lease owner");
    assert.ok(Number(conflictEffect?.lease_generation) >= 1, "the retained winner records its fence generation");
    assert.ok(winnerReplay?.lease_owner, "the immutable winner replay retains its stage owner");
    assert.ok(Number(winnerReplay?.lease_generation) >= 1, "the immutable winner replay retains its stage generation");
    assertRedacted(executions.conflictWinner, conflictEffect?.last_error);
    conflictDeliveryUnavailable = false;
    await enqueue("conflictWinner", "atlas.semantic.extract", conflictKey);
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [conflictKey]))[0]?.status === "completed", "winner-only conflict recovery");
    await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [conflictKey]))[0]?.count === 0, "winner-only conflict cleanup");
    assert.equal(accepted.get(executions.conflictWinner), 1, "only the immutable winner completes");
    assert.equal(failed.get(executions.conflictWinner) ?? 0, 0, "winner recovery never terminally fails the staged result");
    assert.equal(await lifecycleFor(executions.conflictWinner), "completed", "winner recovery completes the original Atlas execution");
    const recoveredConflictEffect = await effectFor(conflictKey);
    assert.equal(recoveredConflictEffect?.status, "completed", "only the recovered winner fences completion");
    assert.ok(recoveredConflictEffect?.lease_owner, "the recovered winner has a completion owner");
    assert.ok(Number(recoveredConflictEffect?.lease_generation) >= 1, "the recovered winner has a completion generation");
    assertRedacted(executions.conflictWinner, recoveredConflictEffect?.last_error);
    await assertQueuedJobRedacted(executions.conflictWinner);
    await assertQueuedJobRedacted(executions.conflictLoser);
    assert.ok(assertThrownErrorsRedacted(executions.conflictWinner).length > 0, "the actual failed winner delivery error is captured and checked during conflict recovery");
    assertThrownErrorsRedacted(executions.conflictLoser);
  } finally {
    await worker?.stop().catch(() => undefined);
    await atlasApp.close().catch(() => undefined);
    await anomanApp.close().catch(() => undefined);
    await admin.unsafe(`DROP TRIGGER IF EXISTS ${completionFault}_trigger ON bridge.background_effects`).catch(() => undefined);
    await admin.unsafe(`DROP FUNCTION IF EXISTS ${completionFault}_fn()`).catch(() => undefined);
    await admin.unsafe(`DROP SEQUENCE IF EXISTS ${completionFault}`).catch(() => undefined);
    await admin.unsafe(`DROP TRIGGER IF EXISTS ${cleanupFault}_trigger ON bridge.semantic_result_delivery`).catch(() => undefined);
    await admin.unsafe(`DROP FUNCTION IF EXISTS ${cleanupFault}_fn()`).catch(() => undefined);
    await admin.unsafe(`DROP SEQUENCE IF EXISTS ${cleanupFault}`).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.semantic_result_delivery WHERE idempotency_key = ANY($1::text[])", [[...Object.values(keys), conflictKey]]).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key = ANY($1::text[])", [[...Object.values(keys), conflictKey]]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.semantic_execution_context WHERE execution_id = ANY($1::text[])", [Object.values(executions)]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.semantic_execution WHERE id = ANY($1::text[])", [Object.values(executions)]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.document_perception_derived_manifest WHERE execution_id = ANY($1::text[])", [Object.values(resources).map((resource) => resource.perception)]).catch(() => undefined);
    for (const resource of Object.values(resources)) {
      await atlas.unsafe("DELETE FROM atlas.normalized_document_cache WHERE cache_key=$1", [resource.cache]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [resource.perception]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.extraction_bundle_document WHERE bundle_id=$1", [resource.bundle]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1", [resource.bundle]).catch(() => undefined);
      await atlas.unsafe("DELETE FROM atlas.document WHERE id=$1", [resource.document]).catch(() => undefined);
    }
    await atlas.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [workspace]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.workspace WHERE id=$1", [master]).catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined);
    await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined);
    await Promise.all([admin.end(), atlas.end(), bridge.end()]);
  }
});
