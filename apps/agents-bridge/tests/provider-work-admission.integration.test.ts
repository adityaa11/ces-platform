import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.ts";
import { createProductionBridgeWorker } from "../src/production-worker-composition.ts";
import { createProviderWorkAdmissionService, type ProviderWorkAdmissionOutcome } from "../src/provider-work-admission.ts";
import { createRuntimeCapacityConstraintReader } from "../src/runtime-capacity-constraint.ts";
import { TestRuntime } from "../src/runtime.ts";

const databaseUrl = process.env.DATABASE_URL;
const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

test("RC-BSSV2-00604-01/12a/14a drive authenticated background admission through one claimed 03A send", { skip: !databaseUrl }, async () => {
  const suffix = `provider-work-admission-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const route = `${suffix}-route`;
  const processId = `${suffix}-process`;
  const principal = { credential: `${suffix}-credential`, principalId: `${suffix}-consumer`, quotaDomainId: domain, processId, processProfileVersion: "v1", routeId: route, serviceClass: "background" as const };
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 2 });
  const database = { executeSql: async (statement: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(statement, values as unknown[] | undefined) }) };
  const authenticator = { authenticate: (credential: string) => credential === principal.credential ? principal : null };
  const reader = createRuntimeCapacityConstraintReader(database, authenticator);
  const admission = createProviderWorkAdmissionService(database, authenticator);
  let sends = 0;
  let payloadHydrations = 0;
  let directAdapterSends = 0;
  const outboundPayloads: unknown[] = [];
  const worker = createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(), documentPerception: async () => undefined, semantic: async () => undefined,
    providerPayloadAdapter: { hydrate: async (input) => {
      const [claim] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim WHERE logical_work_id=$1 AND attempt_number=$2", [input.logicalWorkId, input.attemptNumber]);
      assert.equal(claim.count, 1, "payload hydration is fenced behind the durable claim");
      payloadHydrations += 1;
      return { opaqueReference: input.payloadReference, hash: input.payloadHash };
    } },
    providerOutboundTransport: async (input) => {
      assert.deepEqual(input.payloadReference, { opaqueReference: `${suffix}-payload`, hash: "a".repeat(64) });
      outboundPayloads.push(input.payloadReference);
      sends += 1;
      return { feedbackId: `${suffix}-feedback-${sends}`, transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 } };
    },
  });
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "provider-work-admission-fixture", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });
  try {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,'{}'::jsonb,$3::jsonb,'quota-v1','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota-v1','{}','{}')", [`${processId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',true,$2::jsonb,$3,'v1')", [processId, [route], `${processId}-workload`]);
    await sql.unsafe("SELECT bridge.publish_qualified_provider_route_authority($1,'atlas.semantic.extract','adapter-v1','qualified-v1')", [route]);
    const profile = { usableGlobalCapacity: { rpm: 10, tpm: 100, rpd: 10, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 9, tpm: 90, rpd: 9, concurrency: 1 }, backgroundLanes: [] };
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2::jsonb)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, processId, `${processId}-workload`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    const windows = { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } };
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}'::jsonb,true,now()+interval '1 hour')", [domain, dimension, windows]);

    // Prior interrupted local fixtures must not be claimed by this worker.
    await sql.unsafe("DELETE FROM pgboss.job WHERE data->>'logicalWorkId' LIKE 'provider-work-admission-%'");
    await app.listen({ host: "127.0.0.1", port: 0 });
    await worker.start();
    const address = app.server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const constraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string; reason: string };
    assert.equal(constraint.reason, "eligible_in_principle");
    const request = { logicalWorkId: `${suffix}-work`, attemptNumber: 1, idempotencyKey: `${suffix}-idempotency`, payloadReference: `${suffix}-payload`, payloadHash: "a".repeat(64), requestResourceEnvelope: { rpm: 1, tpm: 5, rpd: 1, concurrency: 1 }, expectedEffectiveConstraintRevision: constraint.effectiveConstraintRevision };
    const post = async (body: unknown) => (await fetch(`${base}/v1/provider-work-admissions`, { method: "POST", headers: { authorization: `Bearer ${principal.credential}`, "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<ProviderWorkAdmissionOutcome>;
    // This independent semantic-like background fixture knows only the public
    // versioned HTTP boundary. Its direct-adapter counter is a prohibited-path
    // observation: registration must not call it.
    const semanticLikeBackgroundConsumer = {
      register: async (body: unknown) => post(body),
      directAdapterSend: async () => { directAdapterSends += 1; },
    };
    const accepted = await semanticLikeBackgroundConsumer.register(request);
    assert.equal(accepted.apiVersion, "ProviderWorkAdmission/v1");
    assert.equal(accepted.state, "dispatched_or_may_have_started");
    assert.equal(accepted.logicalWorkId, request.logicalWorkId);
    assert.equal(accepted.attemptNumber, request.attemptNumber);
    assert.ok(accepted.reservationId, "the API outcome identifies the durable reservation");
    assert.ok(accepted.jobId, "the API outcome identifies the pg-boss dispatch");
    const replay = await semanticLikeBackgroundConsumer.register(request);
    assert.equal(replay.state, "dispatched_or_may_have_started", "exact replay returns its durable identity without a new reservation");
    assert.deepEqual(replay, accepted, "replay returns the same typed durable identity");
    assert.equal(await post({ ...request, payloadHash: "b".repeat(64) }).then((result) => result.state), "policy_or_resource_unfit", "payload hash is immutable under an idempotency key");
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && sends !== 1) await sleep(25);
    assert.equal(sends, 1, "the only fake outbound call follows one durable reservation, job, and claim");
    assert.equal(payloadHydrations, 1);
    assert.deepEqual(outboundPayloads, [{ opaqueReference: `${suffix}-payload`, hash: "a".repeat(64) }], "the claimed lane makes the one permitted generic outbound send");
    assert.equal(directAdapterSends, 0, "the semantic-like consumer made zero direct adapter sends");
    const [positive] = await sql.unsafe(`SELECT work.logical_work_id,work.attempt_number,
      reservation.reservation_id,dispatch.job_id,claim.reservation_id AS claim_reservation_id,
      job.id AS boss_job_id,job.data AS boss_job_data
      FROM bridge.provider_work_attempt work
      JOIN bridge.provider_work_reservation reservation USING(logical_work_id,attempt_number)
      JOIN bridge.provider_work_dispatch dispatch USING(logical_work_id,attempt_number,reservation_id)
      JOIN pgboss.job job ON job.id=dispatch.job_id
      JOIN bridge.provider_transport_claim claim USING(reservation_id)
      WHERE work.logical_work_id=$1 AND work.attempt_number=$2`, [request.logicalWorkId, request.attemptNumber]);
    assert.deepEqual(positive, {
      logical_work_id: accepted.logicalWorkId,
      attempt_number: accepted.attemptNumber,
      reservation_id: accepted.reservationId,
      job_id: accepted.jobId,
      claim_reservation_id: accepted.reservationId,
      boss_job_id: accepted.jobId,
      boss_job_data: { logicalWorkId: accepted.logicalWorkId, attemptNumber: accepted.attemptNumber, reservationId: accepted.reservationId },
    }, "one API identity maps exactly to one work, reservation, pg-boss job, claim, and fake send");
    const [positiveCounts] = await sql.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE logical_work_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) AS dispatches,
      (SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id=$1) AS claims`, [request.logicalWorkId]);
    assert.deepEqual(positiveCounts, { attempts: 1, reservations: 1, dispatches: 1, claims: 1 }, "replay and hash conflict add no durable identity to the admitted work");

    await worker.stop();
    const cancelled = { ...request, logicalWorkId: `${suffix}-cancelled`, idempotencyKey: `${suffix}-cancelled-key`, attemptNumber: 2 };
    assert.equal((await post(cancelled)).state, "dispatched_or_may_have_started");
    assert.equal((await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(cancelled.logicalWorkId)}/2/cancel`, { method: "POST", headers: { authorization: `Bearer ${principal.credential}` } })).status, 200);
    assert.equal((await sql.unsafe("SELECT state FROM bridge.provider_work_attempt WHERE logical_work_id=$1 AND attempt_number=2", [cancelled.logicalWorkId]))[0].state, "terminal", "pre-send cancellation reaches the durable attempt before a worker can claim it");
    assert.equal(sends, 1, "the cancelled work has zero transport sends");
    assert.equal(directAdapterSends, 0, "the cancelled work also has zero direct adapter sends");
    const [cancelledCounts] = await sql.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE logical_work_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) AS dispatches,
      (SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id=$1) AS claims`, [cancelled.logicalWorkId]);
    assert.deepEqual(cancelledCounts, { attempts: 1, reservations: 1, dispatches: 1, claims: 0 }, "pre-send cancellation creates no claim or send identity");
    const stale = await post({ ...request, logicalWorkId: `${suffix}-stale`, idempotencyKey: `${suffix}-stale-key`, attemptNumber: 3, expectedEffectiveConstraintRevision: "stale" });
    assert.equal(stale.state, "policy_or_resource_unfit");
    const [staleCounts] = await sql.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE logical_work_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) AS dispatches,
      (SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id=$1) AS claims`, [`${suffix}-stale`]);
    assert.deepEqual(staleCounts, { attempts: 0, reservations: 0, dispatches: 0, claims: 0 }, "stale read-to-admit input creates no durable or transport identity");
    assert.equal(sends, 1, "stale admission has zero transport sends");
    assert.equal(directAdapterSends, 0, "replay, conflict, stale, and cancellation have zero direct adapter sends");
  } finally { await worker.stop().catch(() => undefined); await app.close(); await sql.end(); }
});
