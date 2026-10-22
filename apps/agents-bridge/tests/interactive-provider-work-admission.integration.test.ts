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

async function eventually<T>(read: () => Promise<T>, predicate: (value: T) => boolean, description: string): Promise<T> {
  const deadline = Date.now() + 10_000;
  let value = await read();
  while (Date.now() < deadline && !predicate(value)) { await sleep(25); value = await read(); }
  assert.ok(predicate(value), `${description}: ${JSON.stringify(value)}`);
  return value;
}

test("RC-BSSV2-00604-09/10/12b use the generic admission claim path for an interactive fixture", { skip: !databaseUrl }, async () => {
  const suffix = `interactive-admission-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const route = `${suffix}-interactive-route`;
  const backgroundRoute = `${suffix}-background-route`;
  const backgroundProcess = `${suffix}-background-process`;
  const interactiveProcess = `${suffix}-interactive-process`;
  const backgroundPrincipal = { credential: `${suffix}-background-credential`, principalId: `${suffix}-background-consumer`, quotaDomainId: domain, processId: backgroundProcess, processProfileVersion: "v1", routeId: backgroundRoute, serviceClass: "background" as const };
  const interactivePrincipal = { credential: `${suffix}-interactive-credential`, principalId: `${suffix}-interactive-consumer`, quotaDomainId: domain, processId: interactiveProcess, processProfileVersion: "v1", routeId: route, serviceClass: "interactive" as const };
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 2 });
  const database = { executeSql: async (statement: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(statement, values as unknown[] | undefined) }) };
  const authenticator = { authenticate: (credential: string) => credential === backgroundPrincipal.credential ? backgroundPrincipal : credential === interactivePrincipal.credential ? interactivePrincipal : null };
  const admission = createProviderWorkAdmissionService(database, authenticator);
  const reader = createRuntimeCapacityConstraintReader(database, authenticator);
  const sends = new Map<string, number>();
  const blocked = new Map<string, { started: () => void; release: () => void; startedPromise: Promise<void>; releasePromise: Promise<void> }>();
  const createWorker = () => createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(), documentPerception: async () => undefined, semantic: async () => undefined,
    providerPayloadAdapter: { hydrate: async (input) => ({ logicalWorkId: input.logicalWorkId, attemptNumber: input.attemptNumber, opaqueReference: input.payloadReference }) },
    providerOutboundTransport: async (input) => {
      const payload = input.payloadReference as { logicalWorkId: string };
      sends.set(payload.logicalWorkId, (sends.get(payload.logicalWorkId) ?? 0) + 1);
      const gate = blocked.get(payload.logicalWorkId);
      if (gate) { gate.started(); await gate.releasePromise; return { feedbackId: `${suffix}-late-429`, transportDisposition: "terminal_confirmed" as const, operationalOutcome: "rate_limited" as const, usage: { rpm: 1, tpm: 5, rpd: 1 } }; }
      return { feedbackId: `${suffix}-${payload.logicalWorkId}`, transportDisposition: "terminal_confirmed" as const, operationalOutcome: "success" as const, usage: { rpm: 1, tpm: 5, rpd: 1 } };
    },
  });
  let worker = createWorker();
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "interactive-admission-fixture", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });
  try {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,'{}'::jsonb,$3::jsonb,'quota-v1','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }, { routeId: backgroundRoute }], { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    const profile = { usableGlobalCapacity: { rpm: 10, tpm: 100, rpd: 10, concurrency: 10 }, hardInteractiveReserve: { rpm: 9, tpm: 90, rpd: 9, concurrency: 9 }, backgroundCapacity: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundLanes: [] };
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2::jsonb)", [domain, profile]);
    for (const [processId, kind, capability, serviceClass, processRoute] of [[backgroundProcess, "semantic", "atlas.semantic.extract", "background", backgroundRoute], [interactiveProcess, "chat", "atlas.chat.default", "interactive", route]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,jsonb_build_array($2::text),'{}','{}','quota-v1','{}','{}')", [`${processId}-workload`, kind]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1',$2,$3,$4,'{}','{}',true,jsonb_build_array($5::text),$6,'v1')", [processId, kind, capability, serviceClass, processRoute, `${processId}-workload`]);
      await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, processId, `${processId}-workload`]);
    }
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'fixture','fixture-model-v1','adapter-v1','qualification://fixture','qualified-v1',$3)", [route, domain, "atlas.chat.default"]);
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'fixture','fixture-model-v1','adapter-v1','qualification://fixture','qualified-v1',$3)", [backgroundRoute, domain, "atlas.semantic.extract"]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    const windows = { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } };
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}'::jsonb,true,now()+interval '1 hour')", [domain, dimension, windows]);
    await sql.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,7,60)", [`${suffix}-pressure`, domain]);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const constraint = async (credential: string) => (await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${credential}` } })).json()) as { effectiveConstraintRevision: string; reason: string };
    const post = async (credential: string, body: unknown) => (await (await fetch(`${base}/v1/provider-work-admissions`, { method: "POST", headers: { authorization: `Bearer ${credential}`, "content-type": "application/json" }, body: JSON.stringify(body) })).json()) as ProviderWorkAdmissionOutcome;
    const outcome = async (credential: string, logicalWorkId: string, attemptNumber = 1) => (await (await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(logicalWorkId)}/${attemptNumber}`, { headers: { authorization: `Bearer ${credential}` } })).json()) as ProviderWorkAdmissionOutcome;
    const cancel = async (credential: string, logicalWorkId: string, attemptNumber = 1) => (await (await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(logicalWorkId)}/${attemptNumber}/cancel`, { method: "POST", headers: { authorization: `Bearer ${credential}` } })).json()) as ProviderWorkAdmissionOutcome;
    const backgroundConstraint = await constraint(backgroundPrincipal.credential);
    const backgroundWork = `${suffix}-saturated-background`;
    const envelope = { rpm: 1, tpm: 5, rpd: 1, concurrency: 1 };
    assert.equal((await post(backgroundPrincipal.credential, { logicalWorkId: backgroundWork, attemptNumber: 1, idempotencyKey: `${backgroundWork}-key`, payloadReference: `${backgroundWork}-payload`, payloadHash: "a".repeat(64), requestResourceEnvelope: envelope, expectedEffectiveConstraintRevision: backgroundConstraint.effectiveConstraintRevision })).state, "dispatched_or_may_have_started");

    const interactiveConstraint = await constraint(interactivePrincipal.credential);
    const protectedWork = `${suffix}-protected-interactive`;
    const protectedAdmission = await post(interactivePrincipal.credential, { logicalWorkId: protectedWork, attemptNumber: 1, idempotencyKey: `${protectedWork}-key`, payloadReference: `${protectedWork}-payload`, payloadHash: "b".repeat(64), requestResourceEnvelope: envelope, expectedEffectiveConstraintRevision: interactiveConstraint.effectiveConstraintRevision, deadlineEpochMilliseconds: Date.now() + 30_000, serviceClass: "background" });
    assert.equal(protectedAdmission.state, "dispatched_or_may_have_started", "interactive capacity remains available behind saturated background");
    assert.deepEqual((await sql.unsafe("SELECT quota_domain_id,process_id,service_class FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [protectedWork]))[0], { quota_domain_id: domain, process_id: interactiveProcess, service_class: "interactive" }, "server binding ignores caller class and domain selection");
    const unfitWork = `${suffix}-unfit-interactive`;
    const unfit = await post(interactivePrincipal.credential, { logicalWorkId: unfitWork, attemptNumber: 1, idempotencyKey: `${unfitWork}-key`, payloadReference: `${unfitWork}-payload`, payloadHash: "c".repeat(64), requestResourceEnvelope: { rpm: 10, tpm: 100, rpd: 10, concurrency: 10 }, expectedEffectiveConstraintRevision: interactiveConstraint.effectiveConstraintRevision, deadlineEpochMilliseconds: Date.now() + 30_000 });
    assert.equal(unfit.state, "terminal_cancelled", "unfit interactive work receives a bounded non-success outcome");
    assert.deepEqual((await sql.unsafe("SELECT state, count(d.job_id)::int AS jobs FROM bridge.provider_work_attempt w LEFT JOIN bridge.provider_work_dispatch d USING(logical_work_id,attempt_number) WHERE w.logical_work_id=$1 GROUP BY state", [unfitWork]))[0], { state: "terminal", jobs: 0 }, "unfit interactive work cannot create a late delivery");

    await worker.start();
    await eventually(async () => sends.get(backgroundWork) ?? 0, (count) => count === 1, "background fixture sends once");
    await eventually(async () => sends.get(protectedWork) ?? 0, (count) => count === 1, "protected interactive fixture uses the same claimed sender once");
    await worker.stop();

    const expiredWork = `${suffix}-expired-before-claim`;
    const expiredConstraint = await constraint(interactivePrincipal.credential);
    assert.equal((await post(interactivePrincipal.credential, { logicalWorkId: expiredWork, attemptNumber: 1, idempotencyKey: `${expiredWork}-key`, payloadReference: `${expiredWork}-payload`, payloadHash: "d".repeat(64), requestResourceEnvelope: envelope, expectedEffectiveConstraintRevision: expiredConstraint.effectiveConstraintRevision, deadlineEpochMilliseconds: Date.now() + 100 })).state, "dispatched_or_may_have_started");
    await sleep(150);
    worker = createWorker(); await worker.start();
    await eventually(() => outcome(interactivePrincipal.credential, expiredWork), (value) => value.state === "terminal_cancelled", "expired work settles after a fresh worker claims its durable job");
    assert.equal(sends.get(expiredWork) ?? 0, 0, "expired work has no late outbound call after restart");
    assert.deepEqual((await sql.unsafe("SELECT count(c.reservation_id)::int AS claims, count(*) FILTER (WHERE r.state='released')::int AS released FROM bridge.provider_transport_claim c RIGHT JOIN bridge.provider_work_reservation r USING(reservation_id) WHERE r.logical_work_id=$1", [expiredWork]))[0], { claims: 0, released: 1 }, "expired work releases its unsent reservation without a claim");

    await worker.stop();
    const cancelledWork = `${suffix}-cancel-before-claim`;
    const cancelledConstraint = await constraint(interactivePrincipal.credential);
    assert.equal((await post(interactivePrincipal.credential, { logicalWorkId: cancelledWork, attemptNumber: 1, idempotencyKey: `${cancelledWork}-key`, payloadReference: `${cancelledWork}-payload`, payloadHash: "e".repeat(64), requestResourceEnvelope: envelope, expectedEffectiveConstraintRevision: cancelledConstraint.effectiveConstraintRevision, deadlineEpochMilliseconds: Date.now() + 30_000 })).state, "dispatched_or_may_have_started");
    assert.equal((await cancel(interactivePrincipal.credential, cancelledWork)).state, "terminal_cancelled");
    worker = createWorker(); await worker.start();
    await sleep(100);
    assert.equal(sends.get(cancelledWork) ?? 0, 0, "a late queue delivery after cancellation cannot claim or send");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS claims FROM bridge.provider_transport_claim c JOIN bridge.provider_work_reservation r USING(reservation_id) WHERE r.logical_work_id=$1", [cancelledWork]))[0].claims, 0);

    const midRunWork = `${suffix}-cancel-mid-run-429`;
    let started!: () => void; let release!: () => void;
    const startedPromise = new Promise<void>((resolve) => { started = resolve; });
    const releasePromise = new Promise<void>((resolve) => { release = resolve; });
    blocked.set(midRunWork, { started, release, startedPromise, releasePromise });
    const midRunConstraint = await constraint(interactivePrincipal.credential);
    assert.equal((await post(interactivePrincipal.credential, { logicalWorkId: midRunWork, attemptNumber: 1, idempotencyKey: `${midRunWork}-key`, payloadReference: `${midRunWork}-payload`, payloadHash: "f".repeat(64), requestResourceEnvelope: envelope, expectedEffectiveConstraintRevision: midRunConstraint.effectiveConstraintRevision, deadlineEpochMilliseconds: Date.now() + 30_000 })).state, "dispatched_or_may_have_started");
    await startedPromise;
    assert.equal(sends.get(midRunWork), 1, "mid-run fixture has exactly one claimed outbound send before cancellation");
    assert.equal((await cancel(interactivePrincipal.credential, midRunWork)).state, "terminal_cancelled");
    release();
    await eventually(async () => Number((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_operational_feedback_event f JOIN bridge.provider_work_reservation r USING(reservation_id) WHERE r.logical_work_id=$1", [midRunWork]))[0]?.count), (count) => count === 1, "late 429 is durably accounted once");
    assert.equal((await outcome(interactivePrincipal.credential, midRunWork)).state, "terminal_cancelled", "late provider feedback cannot resurrect a cancelled interactive caller");
    assert.deepEqual((await sql.unsafe("SELECT l.state, held_units::text AS held, spent_units::text AS spent FROM bridge.provider_window_usage_ledger l JOIN bridge.provider_work_reservation r USING(reservation_id) WHERE r.logical_work_id=$1 AND dimension_id='rpm'", [midRunWork]))[0], { state: "settled", held: "0", spent: "1" }, "late 429 settles possible transmitted usage instead of refunding it");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$1 AND recovered_at IS NULL", [domain]))[0].count, 1, "late 429 keeps its scoped pressure accounting");
    assert.equal(sends.get(midRunWork), 1, "cancellation and late acknowledgement cannot double-dispatch the reservation");
  } finally { await worker.stop().catch(() => undefined); await app.close(); await sql.end(); }
});
