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
  let throwAfterSend = false;
  const transportOutcomes: Array<{ operationalOutcome?: "success" | "provider_failure" | "rate_limited"; retryAfterSeconds?: number }> = [];
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
      if (throwAfterSend) { throwAfterSend = false; throw new Error("fixture ack lost after possible transport start"); }
      const feedback = transportOutcomes.shift() ?? { operationalOutcome: "success" as const };
      return { feedbackId: `${suffix}-feedback-${sends}`, transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 }, ...feedback };
    },
  });
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "provider-work-admission-fixture", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });
  try {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,'{}'::jsonb,$3::jsonb,'quota-v1','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }, { routeId: secondaryRoute }], { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota-v1','{}','{}')", [`${processId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',true,$2::jsonb,$3,'v1')", [processId, [route], `${processId}-workload`]);
    await sql.unsafe("SELECT bridge.publish_qualified_provider_route_authority($1,'atlas.semantic.extract','adapter-v1','qualified-v1')", [route]);
    await sql.unsafe("SELECT bridge.publish_qualified_provider_route_authority($1,'atlas.document.perceive','adapter-v1','qualified-v1')", [secondaryRoute]);
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
    const malformedQualification = semanticLikeBackgroundConsumer.qualifyProviderOutput("{");
    assert.deepEqual(malformedQualification, { state: "consumer_qualification_failure", reason: "malformed_output" }, "a malformed semantic-like output is returned only by the consumer qualification seam");
    assert.equal((await outcome(request.logicalWorkId, 1)).state, "terminal_success", "consumer qualification never relabels a successful BSS operational outcome");
    assert.deepEqual((await sql.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE logical_work_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$2) AS pressure_incidents`, [request.logicalWorkId, domain]))[0], { attempts: 1, pressure_incidents: 0 }, "malformed consumer output creates neither a BSS retry attempt nor BSS pressure");

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
    const metadataFreeRetryConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const metadataFreeRetry = await post({ ...metadataFree, attemptNumber: 2, idempotencyKey: `${suffix}-metadata-free-429-retry`, expectedEffectiveConstraintRevision: metadataFreeRetryConstraint.effectiveConstraintRevision });
    assert.equal(metadataFreeRetry.state, "dispatched_or_may_have_started");
    const metadataFreeRetryDeadline = Date.now() + 10_000;
    while (Date.now() < metadataFreeRetryDeadline && sends !== 4) await sleep(25);
    assert.equal((await outcome(metadataFree.logicalWorkId, 2)).state, "terminal_success");
    assert.notEqual(metadataFreeRetry.reservationId, metadataFreeAdmission.reservationId, "metadata-free recovery retry receives a distinct explicit reservation");

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
    await worker.start();
    assert.equal((await outcome(rateLimited.logicalWorkId, 1)).state, "pressure_limited", "restart preserves the operational outcome");
    const blockedConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    assert.equal((await post({ ...rateLimited, attemptNumber: 2, idempotencyKey: `${suffix}-rate-retry`, expectedEffectiveConstraintRevision: blockedConstraint.effectiveConstraintRevision })).state, "pressure_limited", "BSS never recursively retries a rate outcome");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route',NULL,NULL,'qualified',clock_timestamp()) AS recovered", [domain, secondaryRoute, `${suffix}-recovery`]))[0].recovered, true);
    const retryConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const retry = await post({ ...rateLimited, attemptNumber: 2, idempotencyKey: `${suffix}-rate-retry`, expectedEffectiveConstraintRevision: retryConstraint.effectiveConstraintRevision });
    assert.equal(retry.state, "dispatched_or_may_have_started");
    const retryDeadline = Date.now() + 10_000;
    while (Date.now() < retryDeadline && sends !== 6) await sleep(25);
    assert.equal((await outcome(rateLimited.logicalWorkId, 2)).state, "terminal_success");
    assert.notEqual(retry.reservationId, rateAdmission.reservationId, "retry has a distinct explicit reservation");

    // A post-send ack loss is conservative: it consumes/holds the unknown
    // usage and remains a replayable may-have-started outcome. A new attempt
    // would still have to traverse the explicit admission boundary.
    throwAfterSend = true;
    const unknownConstraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string };
    const unknown = await post({ ...request, logicalWorkId: `${suffix}-ack-loss`, idempotencyKey: `${suffix}-ack-loss`, expectedEffectiveConstraintRevision: unknownConstraint.effectiveConstraintRevision });
    assert.equal(unknown.state, "dispatched_or_may_have_started");
    const unknownDeadline = Date.now() + 10_000;
    while (Date.now() < unknownDeadline && sends !== 7) await sleep(25);
    assert.equal((await outcome(`${suffix}-ack-loss`, 1)).state, "dispatched_or_may_have_started");
    assert.deepEqual((await sql.unsafe("SELECT state,held_units,spent_units FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 AND dimension_id='tpm'", [unknown.reservationId]))[0], { state: "held_unknown", held_units: "5", spent_units: "0" }, "ack loss is conservative unknown usage, never an optimistic refund");

  } finally { await worker.stop().catch(() => undefined); await app.close(); await sql.end(); }
});
