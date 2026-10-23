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
  const secondaryRoute = `${suffix}-secondary-route`;
  const routeAuthority = { routeId: route, providerId: "fixture", modelOrProcessorId: "fixture-model-v1", adapterVersion: "adapter-v1", qualificationRef: "qualification://fixture", qualificationVersion: "qualified-v1", capability: "atlas.semantic.extract" };
  const secondaryRouteAuthority = { routeId: secondaryRoute, providerId: "fixture", modelOrProcessorId: "fixture-model-v1", adapterVersion: "adapter-v1", qualificationRef: "qualification://fixture", qualificationVersion: "qualified-v1", capability: "atlas.document.perceive" };
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
  const transportFailures = new Map<string, "ack_loss" | "timeout">();
  const transportOutcomes: Array<{ operationalOutcome?: "success" | "provider_failure" | "rate_limited"; retryAfterSeconds?: number }> = [];
  const outboundPayloads: Array<{ logicalWorkId: string; attemptNumber: number; payloadReference: unknown }> = [];
  const sendsByAttempt = new Map<string, number>();
  const createWorker = () => createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(), documentPerception: async () => undefined, semantic: async () => undefined,
    providerPayloadAdapter: { hydrate: async (input) => {
      const [claim] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim WHERE logical_work_id=$1 AND attempt_number=$2", [input.logicalWorkId, input.attemptNumber]);
      assert.equal(claim.count, 1, "payload hydration is fenced behind the durable claim");
      payloadHydrations += 1;
      return { logicalWorkId: input.logicalWorkId, attemptNumber: input.attemptNumber, opaqueReference: input.payloadReference, hash: input.payloadHash };
    } },
    providerOutboundTransport: async (input) => {
      const payloadReference = input.payloadReference as { logicalWorkId: string; attemptNumber: number; opaqueReference: string; hash: string };
      assert.equal(typeof payloadReference.logicalWorkId, "string");
      assert.deepEqual(payloadReference, { logicalWorkId: payloadReference.logicalWorkId, attemptNumber: payloadReference.attemptNumber, opaqueReference: `${suffix}-payload`, hash: "a".repeat(64) });
      const logicalWorkId = payloadReference.logicalWorkId;
      const attemptKey = `${logicalWorkId}:${payloadReference.attemptNumber}`;
      outboundPayloads.push({ logicalWorkId, attemptNumber: payloadReference.attemptNumber, payloadReference: input.payloadReference });
      sendsByAttempt.set(attemptKey, (sendsByAttempt.get(attemptKey) ?? 0) + 1);
      sends += 1;
      const failure = transportFailures.get(logicalWorkId);
      if (failure) {
        transportFailures.delete(logicalWorkId);
        throw new Error(`fixture deterministic ${failure === "timeout" ? "transport timeout" : "ack loss"} after possible transport start`);
      }
      const feedback = transportOutcomes.shift() ?? { operationalOutcome: "success" as const };
      return { feedbackId: `${suffix}-feedback-${sends}`, transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 }, ...feedback };
    },
  });
  let worker = createWorker();
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "provider-work-admission-fixture", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });
  try {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,'{}'::jsonb,$3::jsonb,'quota-v1','operator_config','fixture','v1',now(),now())", [domain, [routeAuthority, secondaryRouteAuthority], { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota-v1','{}','{}')", [`${processId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',true,$2::jsonb,$3,'v1')", [processId, [route], `${processId}-workload`]);
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route, domain, routeAuthority.providerId, routeAuthority.modelOrProcessorId, routeAuthority.adapterVersion, routeAuthority.qualificationRef, routeAuthority.qualificationVersion, routeAuthority.capability]);
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [secondaryRoute, domain, secondaryRouteAuthority.providerId, secondaryRouteAuthority.modelOrProcessorId, secondaryRouteAuthority.adapterVersion, secondaryRouteAuthority.qualificationRef, secondaryRouteAuthority.qualificationVersion, secondaryRouteAuthority.capability]);
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
    const outcome = async (logicalWorkId: string, attemptNumber: number) => (await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(logicalWorkId)}/${attemptNumber}`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as Promise<ProviderWorkAdmissionOutcome>;
    const assertDurableCase = async (input: Readonly<{
      label: string;
      logicalWorkId: string;
      attemptNumber: number;
      reservationId: string;
      jobId: string;
      publicState: ProviderWorkAdmissionOutcome["state"];
      sends: number;
      claims: number;
      feedback?: Readonly<{ disposition: "terminal_confirmed" | "may_have_started"; operationalOutcome?: "success" | "provider_failure" | "rate_limited" }>;
      ledger: Readonly<Record<string, Readonly<{ state: string; heldUnits: string; spentUnits: string }>>>;
    }>) => {
      const publicOutcome = await outcome(input.logicalWorkId, input.attemptNumber);
      assert.equal(publicOutcome.state, input.publicState, `${input.label}: public admission outcome is durable`);
      assert.equal(publicOutcome.reservationId, input.reservationId, `${input.label}: public outcome retains its reservation identity`);
      assert.equal(publicOutcome.jobId, input.jobId, `${input.label}: public outcome retains its pg-boss dispatch identity`);
      const [chain] = await sql.unsafe(`SELECT
        work.logical_work_id, work.attempt_number, reservation.reservation_id,
        dispatch.job_id, reservation.state AS reservation_state,
        (SELECT count(*)::int FROM bridge.provider_transport_claim WHERE reservation_id=reservation.reservation_id) AS claims,
        (SELECT count(*)::int FROM bridge.provider_operational_feedback_event WHERE reservation_id=reservation.reservation_id) AS feedback_events
        FROM bridge.provider_work_attempt work
        JOIN bridge.provider_work_reservation reservation USING(logical_work_id,attempt_number)
        JOIN bridge.provider_work_dispatch dispatch USING(logical_work_id,attempt_number,reservation_id)
        WHERE work.logical_work_id=$1 AND work.attempt_number=$2`, [input.logicalWorkId, input.attemptNumber]);
      assert.deepEqual({
        logical_work_id: chain.logical_work_id,
        attempt_number: chain.attempt_number,
        reservation_id: chain.reservation_id,
        job_id: chain.job_id,
        claims: chain.claims,
        feedback_events: chain.feedback_events,
      }, {
        logical_work_id: input.logicalWorkId,
        attempt_number: input.attemptNumber,
        reservation_id: input.reservationId,
        job_id: input.jobId,
        claims: input.claims,
        feedback_events: input.feedback ? 1 : 0,
      }, `${input.label}: logical work, reservation, pg-boss job, claim, and feedback rows remain correlated`);
      assert.equal(sendsByAttempt.get(`${input.logicalWorkId}:${input.attemptNumber}`) ?? 0, input.sends, `${input.label}: fake outbound sends remain once-only`);
      const feedbackRows = await sql.unsafe(`SELECT transport_disposition, normalized_feedback->>'operationalOutcome' AS operational_outcome
        FROM bridge.provider_operational_feedback_event WHERE reservation_id=$1`, [input.reservationId]);
      assert.deepEqual(Array.from(feedbackRows), input.feedback ? [{ transport_disposition: input.feedback.disposition, operational_outcome: input.feedback.operationalOutcome ?? null }] : [], `${input.label}: normalized feedback row is bounded and exact`);
      const ledgerRows = await sql.unsafe(`SELECT dimension_id, state, held_units::text AS held_units, spent_units::text AS spent_units
        FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id`, [input.reservationId]);
      assert.deepEqual(Object.fromEntries(ledgerRows.map((row) => [row.dimension_id, { state: row.state, heldUnits: row.held_units, spentUnits: row.spent_units }])), input.ledger, `${input.label}: durable per-dimension usage ledger is exact`);
      return { chain, ledgerRows };
    };
    const settledUsageLedger = {
      concurrency: { state: "settled", heldUnits: "0", spentUnits: "0" },
      rpd: { state: "settled", heldUnits: "0", spentUnits: "1" },
      rpm: { state: "settled", heldUnits: "0", spentUnits: "1" },
      tpm: { state: "settled", heldUnits: "0", spentUnits: "5" },
    };
    // This independent semantic-like background fixture knows only the public
    // versioned HTTP boundary. Its direct-adapter counter is a prohibited-path
    // observation: registration must not call it.
    const semanticLikeBackgroundConsumer = {
      register: async (body: unknown) => post(body),
      directAdapterSend: async () => { directAdapterSends += 1; },
      qualifyProviderOutput: (providerOutput: string) => {
        try {
          JSON.parse(providerOutput);
          return { state: "qualified" as const };
        } catch {
          // This is deliberately consumer-owned.  BSS received no provider
          // body and therefore cannot reinterpret a qualification failure as
          // a provider-pressure or retry signal.
          return { state: "consumer_qualification_failure" as const, reason: "malformed_output" as const };
        }
      },
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
    assert.equal((await outcome(request.logicalWorkId, 1)).state, "terminal_success", "the public outcome projects the redacted operational success, not provider content");
    assert.equal(payloadHydrations, 1);
    assert.deepEqual(outboundPayloads.map(({ payloadReference }) => payloadReference), [{ logicalWorkId: request.logicalWorkId, attemptNumber: 1, opaqueReference: `${suffix}-payload`, hash: "a".repeat(64) }], "the claimed lane makes the one permitted generic outbound send");
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
    await assertDurableCase({
      label: "exact-success",
      logicalWorkId: request.logicalWorkId,
      attemptNumber: 1,
      reservationId: accepted.reservationId!,
      jobId: accepted.jobId!,
      publicState: "terminal_success",
      sends: 1,
      claims: 1,
      feedback: { disposition: "terminal_confirmed", operationalOutcome: "success" },
      ledger: {
        concurrency: { state: "settled", heldUnits: "0", spentUnits: "0" },
        rpd: { state: "settled", heldUnits: "0", spentUnits: "1" },
        rpm: { state: "settled", heldUnits: "0", spentUnits: "1" },
        tpm: { state: "settled", heldUnits: "0", spentUnits: "5" },
      },
    });
    const malformedQualification = semanticLikeBackgroundConsumer.qualifyProviderOutput("{");
    assert.deepEqual(malformedQualification, { state: "consumer_qualification_failure", reason: "malformed_output" }, "a malformed semantic-like output is returned only by the consumer qualification seam");
    assert.equal((await outcome(request.logicalWorkId, 1)).state, "terminal_success", "consumer qualification never relabels a successful BSS operational outcome");
    assert.deepEqual((await sql.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE logical_work_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$2) AS pressure_incidents`, [request.logicalWorkId, domain]))[0], { attempts: 1, pressure_incidents: 0 }, "malformed consumer output creates neither a BSS retry attempt nor BSS pressure");

    await worker.stop();
    const cancelled = { ...request, logicalWorkId: `${suffix}-cancelled`, idempotencyKey: `${suffix}-cancelled-key`, attemptNumber: 2 };
    const cancelledAdmission = await post(cancelled);
    assert.equal(cancelledAdmission.state, "dispatched_or_may_have_started");
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
    await assertDurableCase({
      label: "pre-send-cancellation",
      logicalWorkId: cancelled.logicalWorkId,
      attemptNumber: 2,
      reservationId: cancelledAdmission.reservationId!,
      jobId: cancelledAdmission.jobId!,
      publicState: "terminal_cancelled",
      sends: 0,
      claims: 0,
      ledger: {
        concurrency: { state: "released", heldUnits: "0", spentUnits: "0" },
        rpd: { state: "released", heldUnits: "0", spentUnits: "0" },
        rpm: { state: "released", heldUnits: "0", spentUnits: "0" },
        tpm: { state: "released", heldUnits: "0", spentUnits: "0" },
      },
    });
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

    await sql.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,7,60)", [`${suffix}-pressure-policy`, domain]);
    await worker.start();
    transportOutcomes.push({ operationalOutcome: "provider_failure" });
    const providerFailureConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const providerFailure = { ...request, logicalWorkId: `${suffix}-provider-failure`, idempotencyKey: `${suffix}-provider-failure-key`, expectedEffectiveConstraintRevision: providerFailureConstraint.effectiveConstraintRevision };
    assert.equal((await post(providerFailure)).state, "dispatched_or_may_have_started");
    const providerFailureDeadline = Date.now() + 10_000;
    while (Date.now() < providerFailureDeadline && sends !== 2) await sleep(25);
    let providerFailureOutcome = await outcome(providerFailure.logicalWorkId, 1);
    while (Date.now() < providerFailureDeadline && providerFailureOutcome.state !== "terminal_provider_failure") { await sleep(25); providerFailureOutcome = await outcome(providerFailure.logicalWorkId, 1); }
    assert.equal(providerFailureOutcome.state, "terminal_provider_failure", "a typed provider failure projects without creating BSS pressure or an implicit retry");
    assert.deepEqual((await sql.unsafe(`SELECT
      normalized_feedback->>'operationalOutcome' AS operational_outcome,
      (SELECT count(*)::int FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$2) AS pressure_incidents
      FROM bridge.provider_operational_feedback_event
      WHERE reservation_id=$1`, [providerFailureOutcome.reservationId, domain]))[0], { operational_outcome: "provider_failure", pressure_incidents: 0 }, "provider failure retains a redacted durable feedback outcome only");
    await assertDurableCase({ label: "provider-failure", logicalWorkId: providerFailure.logicalWorkId, attemptNumber: 1, reservationId: providerFailureOutcome.reservationId!, jobId: providerFailureOutcome.jobId!, publicState: "terminal_provider_failure", sends: 1, claims: 1, feedback: { disposition: "terminal_confirmed", operationalOutcome: "provider_failure" }, ledger: settledUsageLedger });
    // A 429 without Retry-After is also a provider operational result, but
    // must use the approved metadata-free cooldown rather than inventing a
    // recursive retry or interpreting provider output.
    transportOutcomes.push({ operationalOutcome: "rate_limited" });
    const metadataFreeConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const metadataFree = { ...request, logicalWorkId: `${suffix}-metadata-free-429`, idempotencyKey: `${suffix}-metadata-free-429-key`, expectedEffectiveConstraintRevision: metadataFreeConstraint.effectiveConstraintRevision };
    const metadataFreeAdmission = await post(metadataFree);
    assert.equal(metadataFreeAdmission.state, "dispatched_or_may_have_started");
    const metadataFreeDeadline = Date.now() + 10_000;
    while (Date.now() < metadataFreeDeadline && sends !== 3) await sleep(25);
    let metadataFreeOutcome = await outcome(metadataFree.logicalWorkId, 1);
    while (Date.now() < metadataFreeDeadline && metadataFreeOutcome.state !== "pressure_limited") { await sleep(25); metadataFreeOutcome = await outcome(metadataFree.logicalWorkId, 1); }
    assert.equal(metadataFreeOutcome.state, "pressure_limited");
    const [metadataFreePressure] = await sql.unsafe(`SELECT
      cooldown_until > clock_timestamp() AS active,
      extract(epoch FROM cooldown_until-clock_timestamp())::int AS seconds,
      normalized_feedback ? 'retryAfterSeconds' AS has_retry_after
      FROM bridge.provider_operational_pressure_incident pressure
      JOIN bridge.provider_operational_feedback_event feedback ON feedback.feedback_id=$2
      WHERE pressure.quota_domain_id=$1 AND pressure.recovered_at IS NULL`, [domain, `${suffix}-feedback-3`]);
    assert.deepEqual({ active: metadataFreePressure.active, has_retry_after: metadataFreePressure.has_retry_after }, { active: true, has_retry_after: false }, "metadata-free 429 persists redacted pressure without invented Retry-After metadata");
    assert.ok(metadataFreePressure.seconds <= 7 && metadataFreePressure.seconds >= 4, "metadata-free 429 uses the approved conservative cooldown");
    const metadataFreeBlockedConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    assert.equal((await post({ ...metadataFree, attemptNumber: 2, idempotencyKey: `${suffix}-metadata-free-429-retry`, expectedEffectiveConstraintRevision: metadataFreeBlockedConstraint.effectiveConstraintRevision })).state, "pressure_limited", "BSS does not recursively retry a metadata-free 429");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [metadataFree.logicalWorkId]))[0].count, 1, "pressure rejection reserves no implicit retry attempt");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route',NULL,NULL,'qualified',clock_timestamp()) AS recovered", [domain, route, `${suffix}-metadata-free-recovery`]))[0].recovered, true);
    assert.deepEqual((await sql.unsafe("SELECT recovered_at IS NOT NULL AS recovered, recovery_feedback_id FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$1 AND route_id=$2", [domain, route]))[0], { recovered: true, recovery_feedback_id: `${suffix}-metadata-free-recovery` }, "metadata-free 429 records its matched durable pressure recovery");
    const metadataFreeRetryConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const metadataFreeRetry = await post({ ...metadataFree, attemptNumber: 2, idempotencyKey: `${suffix}-metadata-free-429-retry`, expectedEffectiveConstraintRevision: metadataFreeRetryConstraint.effectiveConstraintRevision });
    assert.equal(metadataFreeRetry.state, "dispatched_or_may_have_started");
    const metadataFreeRetryDeadline = Date.now() + 10_000;
    while (Date.now() < metadataFreeRetryDeadline && sends !== 4) await sleep(25);
    assert.equal((await outcome(metadataFree.logicalWorkId, 2)).state, "terminal_success");
    assert.notEqual(metadataFreeRetry.reservationId, metadataFreeAdmission.reservationId, "metadata-free recovery retry receives a distinct explicit reservation");
    await assertDurableCase({ label: "metadata-free-429", logicalWorkId: metadataFree.logicalWorkId, attemptNumber: 1, reservationId: metadataFreeAdmission.reservationId!, jobId: metadataFreeAdmission.jobId!, publicState: "pressure_limited", sends: 1, claims: 1, feedback: { disposition: "terminal_confirmed", operationalOutcome: "rate_limited" }, ledger: settledUsageLedger });
    await assertDurableCase({ label: "metadata-free-explicit-retry", logicalWorkId: metadataFree.logicalWorkId, attemptNumber: 2, reservationId: metadataFreeRetry.reservationId!, jobId: metadataFreeRetry.jobId!, publicState: "terminal_success", sends: 1, claims: 1, feedback: { disposition: "terminal_confirmed", operationalOutcome: "success" }, ledger: settledUsageLedger });

    // A separate qualified route lets the same isolated Bridge fixture prove
    // the independent Retry-After path without reopening the recovered
    // metadata-free incident.
    const rateProcessId = `${suffix}-rate-process`;
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota-v1','{}','{}')", [`${rateProcessId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.document.perceive','background','{}','{}',true,$2::jsonb,$3,'v1')", [rateProcessId, [secondaryRoute], `${rateProcessId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, rateProcessId, `${rateProcessId}-workload`]);
    principal.processId = rateProcessId;
    principal.routeId = secondaryRoute;
    transportOutcomes.push({ operationalOutcome: "rate_limited", retryAfterSeconds: 12 });
    const rateConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const rateLimited = { ...request, logicalWorkId: `${suffix}-rate-limited`, idempotencyKey: `${suffix}-rate-limited-key`, expectedEffectiveConstraintRevision: rateConstraint.effectiveConstraintRevision };
    const rateAdmission = await post(rateLimited);
    assert.equal(rateAdmission.state, "dispatched_or_may_have_started");
    const rateDeadline = Date.now() + 10_000;
    while (Date.now() < rateDeadline && sends !== 5) await sleep(25);
    let rateOutcome = await outcome(rateLimited.logicalWorkId, 1);
    while (Date.now() < rateDeadline && rateOutcome.state !== "pressure_limited") { await sleep(25); rateOutcome = await outcome(rateLimited.logicalWorkId, 1); }
    assert.equal(rateOutcome.state, "pressure_limited");
    const [pressure] = await sql.unsafe("SELECT cooldown_until > clock_timestamp() AS active, extract(epoch FROM cooldown_until-clock_timestamp())::int AS seconds FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$1 AND recovered_at IS NULL", [domain]);
    assert.equal(pressure.active, true);
    assert.ok(pressure.seconds <= 12 && pressure.seconds >= 9, "usable Retry-After bounds the durable cooldown");
    await worker.stop();
    worker = createWorker();
    await worker.start();
    assert.equal((await outcome(rateLimited.logicalWorkId, 1)).state, "pressure_limited", "restart preserves the operational outcome");
    const blockedConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    assert.equal((await post({ ...rateLimited, attemptNumber: 2, idempotencyKey: `${suffix}-rate-retry`, expectedEffectiveConstraintRevision: blockedConstraint.effectiveConstraintRevision })).state, "pressure_limited", "BSS never recursively retries a rate outcome");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route',NULL,NULL,'qualified',clock_timestamp()) AS recovered", [domain, secondaryRoute, `${suffix}-recovery`]))[0].recovered, true);
    assert.deepEqual((await sql.unsafe("SELECT recovered_at IS NOT NULL AS recovered, recovery_feedback_id FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$1 AND route_id=$2", [domain, secondaryRoute]))[0], { recovered: true, recovery_feedback_id: `${suffix}-recovery` }, "Retry-After 429 records its matched durable pressure recovery");
    const retryConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const retry = await post({ ...rateLimited, attemptNumber: 2, idempotencyKey: `${suffix}-rate-retry`, expectedEffectiveConstraintRevision: retryConstraint.effectiveConstraintRevision });
    assert.equal(retry.state, "dispatched_or_may_have_started");
    const retryDeadline = Date.now() + 10_000;
    while (Date.now() < retryDeadline && sends !== 6) await sleep(25);
    assert.equal((await outcome(rateLimited.logicalWorkId, 2)).state, "terminal_success");
    assert.notEqual(retry.reservationId, rateAdmission.reservationId, "retry has a distinct explicit reservation");
    await assertDurableCase({ label: "retry-after-429", logicalWorkId: rateLimited.logicalWorkId, attemptNumber: 1, reservationId: rateAdmission.reservationId!, jobId: rateAdmission.jobId!, publicState: "pressure_limited", sends: 1, claims: 1, feedback: { disposition: "terminal_confirmed", operationalOutcome: "rate_limited" }, ledger: settledUsageLedger });
    await assertDurableCase({ label: "retry-after-explicit-retry", logicalWorkId: rateLimited.logicalWorkId, attemptNumber: 2, reservationId: retry.reservationId!, jobId: retry.jobId!, publicState: "terminal_success", sends: 1, claims: 1, feedback: { disposition: "terminal_confirmed", operationalOutcome: "success" }, ledger: settledUsageLedger });

    // A named timeout after the durable claim means the transport acknowledgement
    // is lost. It is conservative: it consumes or retains unknown capacity and
    // remains a replayable may-have-started outcome. A fresh production worker
    // must not issue another send.
    const unknownConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const timeout = { ...request, logicalWorkId: `${suffix}-timeout-ack-loss`, idempotencyKey: `${suffix}-timeout-ack-loss`, expectedEffectiveConstraintRevision: unknownConstraint.effectiveConstraintRevision };
    transportFailures.set(timeout.logicalWorkId, "timeout");
    const unknown = await post(timeout);
    assert.equal(unknown.state, "dispatched_or_may_have_started");
    const unknownDeadline = Date.now() + 10_000;
    while (Date.now() < unknownDeadline && sends !== 7) await sleep(25);
    const timeoutFeedbackDeadline = Date.now() + 10_000;
    while (Date.now() < timeoutFeedbackDeadline && (await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_operational_feedback_event WHERE reservation_id=$1", [unknown.reservationId]))[0].count !== 1) await sleep(25);
    await worker.stop();
    worker = createWorker();
    await worker.start();
    const timeoutReplay = await post(timeout);
    assert.deepEqual(timeoutReplay, unknown, "timeout replay retains the original durable API identity after fresh-worker restart");
    await assertDurableCase({
      label: "timeout-ack-loss-unknown-after-restart",
      logicalWorkId: timeout.logicalWorkId,
      attemptNumber: 1,
      reservationId: unknown.reservationId!,
      jobId: unknown.jobId!,
      publicState: "dispatched_or_may_have_started",
      sends: 1,
      claims: 1,
      feedback: { disposition: "may_have_started" },
      ledger: {
        concurrency: { state: "held_unknown", heldUnits: "1", spentUnits: "0" },
        rpd: { state: "held_unknown", heldUnits: "0", spentUnits: "1" },
        rpm: { state: "held_unknown", heldUnits: "0", spentUnits: "1" },
        tpm: { state: "held_unknown", heldUnits: "5", spentUnits: "0" },
      },
    });

  } finally { await worker.stop().catch(() => undefined); await app.close(); await sql.end(); }
});

test("RC-00606-02 authority matrix admits only the immutable calculated-v2 route binding", { skip: !databaseUrl }, async () => {
  const sql = postgres(databaseUrl!, { max: 1 });
  const suffix = `public-admission-authority-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const route = `${suffix}-route`;
  const processId = `${suffix}-process`;
  const identity = { routeId: route, providerId: "fixture", modelOrProcessorId: "fixture-model-v2", adapterVersion: "adapter-v2", qualificationRef: `qualification://${suffix}`, qualificationVersion: "qualified-v2", capability: "atlas.semantic.extract" };
  const principal = { credential: `${suffix}-credential`, principalId: `${suffix}-consumer`, quotaDomainId: domain, processId, processProfileVersion: "v1", routeId: route, serviceClass: "background" as const };
  const database = { executeSql: async (statement: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(statement, values as unknown[] | undefined) }) };
  const authenticator = { authenticate: (credential: string) => credential === principal.credential ? principal : null };
  const reader = createRuntimeCapacityConstraintReader(database, authenticator);
  const admission = createProviderWorkAdmissionService(database, authenticator);
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "public-admission-authority-fixture", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });
  try {
    await sql.unsafe("BEGIN");
    const profile = { usableGlobalCapacity: { rpm: 10, tpm: 100, concurrency: 10 }, hardInteractiveReserve: { rpm: 1, tpm: 10, concurrency: 1 }, backgroundCapacity: { rpm: 9, tpm: 90, concurrency: 9 }, backgroundLanes: [] };
    const allocation = { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], classAllocations: { background: { rpm: 10, tpm: 100, concurrency: 10 } }, processes: [{ processId, profileVersion: "v1", serviceClass: "background", baseline: { rpm: 5, tpm: 50, concurrency: 5 }, cap: { rpm: 5, tpm: 50, concurrency: 5 }, normalizedWeight: { numerator: 1, denominator: 1 } }] };
    const windowPolicies = { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "unknown" }, concurrency: { kind: "fixed", windowSeconds: 60 } };
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v2','fixture',$2::jsonb,$3::jsonb,$4::jsonb,'quota','provider_api','fixture','v2',clock_timestamp(),clock_timestamp())", [domain, [identity], { rpm: { state: "known", value: 10 }, tpm: { state: "known", value: 100 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 10 } }, windowPolicies]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v2',$3,'policy','v2',$4::jsonb,'fixture',clock_timestamp())", [`${suffix}-approval`, domain, route, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v2',$2,'policy','v2',$3,$4::jsonb,clock_timestamp())", [domain, route, `${suffix}-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota','{}','{}')", [`${processId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic',$2,'background','{}','{}',true,$3::jsonb,$4,'v1')", [processId, identity.capability, [route], `${processId}-workload`]);
    const [authority] = await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route, domain, identity.providerId, identity.modelOrProcessorId, identity.adapterVersion, identity.qualificationRef, identity.qualificationVersion, identity.capability]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v2','cap-v2','fixture',clock_timestamp(),$2::jsonb)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v2',$2,'v1',$3,'v1')", [domain, processId, `${processId}-workload`]);
    const [{ policy }] = await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v2',$2) AS policy", [domain, route]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v2','cap-v2',$2,'policy','v2',$3::jsonb)", [domain, route, policy]);
    await sql.unsafe("INSERT INTO bridge.calculated_class_process_allocation(quota_domain_id,desired_profile_version,allocation_version,effective_mask,allocation,allocation_fingerprint) VALUES($1,'plan-v2','v1',$2::jsonb,$3::jsonb,md5($3::jsonb::text))", [domain, allocation.effectiveMask, allocation]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_route_binding_v2(quota_domain_id,desired_profile_version,route_id,authority_version,provider_capacity_profile_version,effective_mask,allocation_version) VALUES($1,'plan-v2',$2,$3,'cap-v2',$4::jsonb,'v1')", [domain, route, authority.authority_version, allocation.effectiveMask]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_activation(quota_domain_id,activation_revision,desired_profile_version,effective_from) VALUES($1,1,'plan-v2',clock_timestamp())", [domain]);
    await sql.unsafe("INSERT INTO bridge.active_desired_admission_profile(quota_domain_id,desired_profile_version,activation_revision,effective_from) VALUES($1,'plan-v2',1,clock_timestamp())", [domain]);
    for (const dimension of ["rpm", "tpm", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v2',1,'cap-v2',$2,($3::jsonb)->$2,'{}'::jsonb,true,clock_timestamp()+interval '1 hour')", [domain, dimension, windowPolicies]);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const constraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string; reason: string };
    assert.equal(constraint.reason, "eligible_in_principle");
    const post = async (logicalWorkId: string) => (await fetch(`${base}/v1/provider-work-admissions`, { method: "POST", headers: { authorization: `Bearer ${principal.credential}`, "content-type": "application/json" }, body: JSON.stringify({ logicalWorkId, attemptNumber: 1, idempotencyKey: `${logicalWorkId}-key`, payloadReference: `${logicalWorkId}-payload`, payloadHash: "a".repeat(64), requestResourceEnvelope: { rpm: 1, tpm: 5, rpd: 1, concurrency: 1 }, expectedEffectiveConstraintRevision: constraint.effectiveConstraintRevision }) })).json() as Promise<ProviderWorkAdmissionOutcome>;
    const accepted = await post(`${suffix}-positive`);
    assert.equal(accepted.state, "dispatched_or_may_have_started", "the public API admits a calculated-v2 plan only through its exact binding");
    assert.deepEqual((await sql.unsafe("SELECT to_regprocedure('bridge.bind_provider_work_route(text,integer,text)') AS legacy_binder,to_regprocedure('bridge.bind_provider_work_route(text,integer,bigint)') AS bigint_binder"))[0], { legacy_binder: null, bigint_binder: "bridge.bind_provider_work_route(text,integer,bigint)" }, "the cutover retains only the established bigint binder");
    assert.deepEqual((await sql.unsafe("SELECT authority_version,selected_route_id,provider_id,model_or_processor_id,adapter_version,qualification_ref,qualification_version,capability FROM bridge.provider_work_route_binding WHERE logical_work_id=$1", [`${suffix}-positive`]))[0], { authority_version: authority.authority_version, selected_route_id: route, provider_id: identity.providerId, model_or_processor_id: identity.modelOrProcessorId, adapter_version: identity.adapterVersion, qualification_ref: identity.qualificationRef, qualification_version: identity.qualificationVersion, capability: identity.capability }, "the durable binding carries exactly the publisher-issued bigint and complete tuple");
    const assertZeroArtifacts = async (logicalWorkId: string) => assert.deepEqual((await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) reservations,(SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) dispatches,(SELECT count(*)::int FROM pgboss.job WHERE data->>'logicalWorkId'=$1) jobs,(SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id=$1) claims", [logicalWorkId]))[0], { reservations: 0, dispatches: 0, jobs: 0, claims: 0 }, `${logicalWorkId} creates no reservation, dispatch, pg-boss job, transport claim, or transport artifact`);
    const reject = async (label: string, mutate: () => Promise<unknown>) => {
      const work = `${suffix}-${label}`;
      const savepoint = `authority_${label.replaceAll("-", "_")}`;
      await sql.unsafe(`SAVEPOINT ${savepoint}`);
      await mutate();
      assert.equal((await post(work)).state, "policy_or_resource_unfit", `${label} is rejected by the public API before admission`);
      await assertZeroArtifacts(work);
      await sql.unsafe(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    };
    await reject("missing", async () => { await sql.unsafe("ALTER TABLE bridge.desired_admission_profile_route_binding_v2 DISABLE TRIGGER ALL"); await sql.unsafe("DELETE FROM bridge.desired_admission_profile_route_binding_v2 WHERE quota_domain_id=$1 AND desired_profile_version='plan-v2'", [domain]); });
    await reject("foreign", async () => { await sql.unsafe("ALTER TABLE bridge.qualified_provider_route_authority DISABLE TRIGGER ALL"); await sql.unsafe("UPDATE bridge.qualified_provider_route_authority SET quota_domain_id=$2 WHERE authority_version=$1", [authority.authority_version, `${domain}-foreign`]); });
    await reject("revoked", async () => { await sql.unsafe("ALTER TABLE bridge.qualified_provider_route_authority DISABLE TRIGGER ALL"); await sql.unsafe("UPDATE bridge.qualified_provider_route_authority SET authority_kind='legacy_incomplete' WHERE authority_version=$1", [authority.authority_version]); });
    await reject("stale", async () => { await sql.unsafe("ALTER TABLE bridge.provider_capacity_profile DISABLE TRIGGER ALL"); await sql.unsafe("UPDATE bridge.provider_capacity_profile SET associated_routes=$2::jsonb WHERE quota_domain_id=$1 AND profile_version='cap-v2'", [domain, [{ ...identity, qualificationVersion: "stale" }]]); });
    await reject("mismatched", async () => { await sql.unsafe("ALTER TABLE bridge.qualified_provider_route_authority DISABLE TRIGGER ALL"); await sql.unsafe("UPDATE bridge.qualified_provider_route_authority SET model_or_processor_id='wrong-model' WHERE authority_version=$1", [authority.authority_version]); });
    await reject("incomplete", async () => { await sql.unsafe("ALTER TABLE bridge.provider_capacity_profile DISABLE TRIGGER ALL"); await sql.unsafe("UPDATE bridge.provider_capacity_profile SET associated_routes=$2::jsonb WHERE quota_domain_id=$1 AND profile_version='cap-v2'", [domain, [{ routeId: route }]]); });
    await reject("ambiguous-historical", async () => {
      await sql.unsafe("ALTER TABLE bridge.calculated_class_process_allocation DISABLE TRIGGER ALL");
      await sql.unsafe("DELETE FROM bridge.calculated_class_process_allocation WHERE quota_domain_id=$1 AND desired_profile_version='plan-v2'", [domain]);
      await sql.unsafe("DROP INDEX bridge.qualified_provider_route_authority_complete_identity");
      await sql.unsafe("ALTER TABLE bridge.qualified_provider_route_authority DISABLE TRIGGER ALL");
      await sql.unsafe("INSERT INTO bridge.qualified_provider_route_authority(route_id,capability,adapter_version,qualification_version,quota_domain_id,provider_id,model_or_processor_id,qualification_ref,authority_kind) SELECT route_id,capability,adapter_version,qualification_version,quota_domain_id,provider_id,model_or_processor_id,qualification_ref,authority_kind FROM bridge.qualified_provider_route_authority WHERE authority_version=$1", [authority.authority_version]);
    });
  } finally {
    await app.close().catch(() => undefined);
    await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
