import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.ts";
import { createProductionBridgeWorker } from "../src/production-worker-composition.ts";
import { createProviderWorkAdmissionService } from "../src/provider-work-admission.ts";
import { createRuntimeCapacityConstraintReader } from "../src/runtime-capacity-constraint.ts";
import { TestRuntime } from "../src/runtime.ts";

const databaseUrl = process.env.DATABASE_URL;
const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function eventually(read: () => Promise<boolean>, description: string) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) { if (await read()) return; await sleep(25); }
  assert.fail(description);
}

async function waitForWakeupConvergence(sql: postgres.Sql, domain: string, key: string) {
  await eventually(async () => {
    const [row] = await sql.unsafe(`SELECT dispatch.claimed_at IS NOT NULL AS claimed, job.state
      FROM bridge.provider_work_wakeup_dispatch dispatch
      JOIN pgboss.job job ON job.id=dispatch.job_id
      WHERE dispatch.quota_domain_id=$1 AND dispatch.wakeup_key=$2`, [domain, key]);
    return row?.claimed === true && row?.state === "completed";
  }, `the durable ${key} wakeup must converge before historical identity is observed`);
}

test("RC-BSSV2-00604-04/05/07/08 projects conservative convergence and a versioned consumer replan", { skip: !databaseUrl }, async () => {
  const suffix = `constraint-convergence-${Date.now()}`;
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
  const sends = new Map<string, number>();
  let historicalWork: string | undefined;
  let releaseHistoricalTransport: (() => void) | undefined;
  let historicalTransportClaimed = false;
  const createWorker = () => createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(), documentPerception: async () => undefined, semantic: async () => undefined,
    providerPayloadAdapter: { hydrate: async (input) => ({ ...input }) },
    providerOutboundTransport: async ({ payloadReference }) => {
      const logicalWorkId = typeof payloadReference === "object" && payloadReference !== null && "logicalWorkId" in payloadReference ? String(payloadReference.logicalWorkId) : String(payloadReference);
      const sendCount = (sends.get(logicalWorkId) ?? 0) + 1;
      sends.set(logicalWorkId, sendCount);
      if (logicalWorkId === historicalWork) {
        historicalTransportClaimed = true;
        await new Promise<void>((resolve) => { releaseHistoricalTransport = resolve; });
      }
      return { feedbackId: `${suffix}-feedback-${logicalWorkId}-${sendCount}`, transportDisposition: "terminal_confirmed" as const, operationalOutcome: "success" as const, usage: { rpm: 1, tpm: 1, rpd: 1 } };
    },
  });
  let worker = createWorker();
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "constraint-convergence-fixture", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });
  const windows = { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } };
  const profile = (limit: number, backgroundLimit: number) => ({ usableGlobalCapacity: { rpm: limit, tpm: limit, rpd: limit, concurrency: limit }, hardInteractiveReserve: { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: backgroundLimit, tpm: backgroundLimit, rpd: backgroundLimit, concurrency: backgroundLimit }, backgroundLanes: [] });
  try {
    for (const [version, limit] of [["cap-v1", 10], ["cap-v2", 1], ["cap-v3", 10]] as const) {
      await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3::jsonb,$4::jsonb,$5::jsonb,'quota-v1','qualified_observation','fixture',$2,now(),now())", [domain, version, [{ routeId: route }], { rpm: { state: "known", value: limit }, tpm: { state: "known", value: limit }, rpd: { state: "known", value: limit }, concurrency: { state: "known", value: limit } }, windows]);
    }
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]',$2::jsonb,'{}','quota-v1','{}','{}')", [`${processId}-workload`, { maxRequestBytes: 1000, maxInputTokens: 10 }]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',true,$2::jsonb,$3,'v1')", [processId, [route], `${processId}-workload`]);
    await sql.unsafe("SELECT bridge.publish_qualified_provider_route_authority($1,'atlas.semantic.extract','adapter-v1','qualified-v1')", [route]);
    for (const [planVersion, capacityVersion, activeProfile] of [["plan-v1", "cap-v1", profile(10, 1)], ["plan-v2", "cap-v2", profile(1, 1)], ["plan-v3", "cap-v3", profile(10, 10)]] as const) {
      await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,$2,$3,'fixture',now(),$4::jsonb)", [domain, planVersion, capacityVersion, activeProfile]);
      await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,$2,$3,'v1',$4,'v1')", [domain, planVersion, processId, `${processId}-workload`]);
    }
    await worker.start();
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}',true,now()+interval '1 hour')", [domain, dimension, windows]);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const read = async () => (await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json()) as Record<string, any>;
    const post = async (body: unknown) => (await (await fetch(`${base}/v1/provider-work-admissions`, { method: "POST", headers: { authorization: `Bearer ${principal.credential}`, "content-type": "application/json" }, body: JSON.stringify(body) })).json()) as Record<string, any>;
    const outcome = async (logicalWorkId: string) => (await (await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(logicalWorkId)}/1`, { headers: { authorization: `Bearer ${principal.credential}` } })).json()) as Record<string, any>;
    const assertQualifiedClamp = async (dimension: "rpm" | "tpm" | "rpd") => {
      const window = `${suffix}-trusted-${dimension}-window`;
      await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'domain','qualified',$4,$5,2)", [domain, route, `${suffix}-trusted-${dimension}-low`, dimension, window]);
      const clamped = await read();
      assert.equal(clamped.effectiveCapacity[dimension], 2, `a trusted ${dimension.toUpperCase()} observation immediately lowers the public effective ceiling`);
      await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'domain','qualified',$4,$5,100)", [domain, route, `${suffix}-trusted-${dimension}-high`, dimension, window]);
      assert.equal((await read()).effectiveCapacity[dimension], 2, `a later higher ${dimension.toUpperCase()} observation cannot raise BSS-005 capacity`);
      assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'domain',$4,$5,'qualified',clock_timestamp()) AS recovered", [domain, route, `${suffix}-trusted-${dimension}-recovery`, dimension, window]))[0].recovered, true);
      const recovered = await read();
      assert.equal(recovered.reason, "eligible_in_principle");
      assert.equal(recovered.effectiveCapacity[dimension], 10, `only matched ${dimension.toUpperCase()} recovery returns the ceiling to the active BSS-005 plan`);
    };

    const initial = await read();
    assert.equal(initial.reason, "eligible_in_principle");
    assert.deepEqual(initial.effectiveCapacity, { rpm: 10, tpm: 10, rpd: 10, concurrency: 10 }, "the public ceiling begins at the active BSS-005 plan");
    const structuralWork = `${suffix}-immutable-work`;
    assert.equal((await post({ logicalWorkId: structuralWork, attemptNumber: 1, idempotencyKey: `${structuralWork}-key`, payloadReference: `${structuralWork}-payload`, payloadHash: "a".repeat(64), requestResourceEnvelope: { rpm: 2, tpm: 2, rpd: 2, concurrency: 2 }, expectedEffectiveConstraintRevision: initial.effectiveConstraintRevision })).state, "waiting", "the public command creates durable, unsent work when background capacity cannot yet fit it");
    assert.equal(sends.get(structuralWork) ?? 0, 0);
    await sql.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,30,60)", [`${suffix}-pressure`, domain]);
    await assertQualifiedClamp("rpm");
    await assertQualifiedClamp("tpm");
    await assertQualifiedClamp("rpd");
    historicalWork = `${suffix}-historical-inflight`;
    const historicalAdmission = await post({ logicalWorkId: historicalWork, attemptNumber: 1, idempotencyKey: `${historicalWork}-key`, payloadReference: `${historicalWork}-payload`, payloadHash: "d".repeat(64), requestResourceEnvelope: { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, expectedEffectiveConstraintRevision: initial.effectiveConstraintRevision });
    assert.equal(historicalAdmission.state, "dispatched_or_may_have_started", "the authenticated admission boundary establishes the pre-existing historical reservation");
    await eventually(async () => historicalTransportClaimed, "the historical reservation must be claimed by the real worker before plan activation");
    assert.equal(sends.get(historicalWork), 1, "the historical reservation has exactly one real in-flight transport claim before plan activation");

    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v2')", [domain]);
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v2',2,'cap-v2',$2,($3::jsonb)->$2,'{}',true,now()+interval '1 hour')", [domain, dimension, windows]);
    await eventually(async () => (await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_admission_convergence_intent WHERE logical_work_id=$1 AND intent_kind='capacity_revision_request'", [structuralWork]))[0].count === 1, "the real activation wakeup must create one structural convergence intent");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:2'", [domain]))[0].count, 1, "the lower plan activation owns one deduplicated wakeup");
    assert.deepEqual((await sql.unsafe("SELECT fairness_epoch,virtual_time,next_turn FROM bridge.provider_admission_domain_state WHERE quota_domain_id=$1", [domain]))[0], { fairness_epoch: "plan-v2:2", virtual_time: "0", next_turn: "1" }, "activation rebases the durable fairness epoch without preempting historical work");
    const downgraded = await read();
    assert.deepEqual(downgraded.effectiveCapacity, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, "a lower authorized plan immediately bounds the public runtime observation");
    const replan = await outcome(structuralWork);
    assert.equal(replan.state, "consumer_replan_required");
    assert.deepEqual(replan.consumerReplan, { apiVersion: "ConsumerReplanRequired/v1", reason: "immutable_active_plan_capacity_downgrade", sourceDesiredProfileVersion: "plan-v1", sourceActivationRevision: 1, requiredDesiredProfileVersion: "plan-v2", requiredActivationRevision: 2 });
    assert.equal(sends.get(structuralWork) ?? 0, 0, "a structural outcome never truncates, splits, or sends immutable consumer work");

    const foreignDomain = `${suffix}-foreign-domain`;
    const foreignRoute = `${suffix}-foreign-route`;
    await sql.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,30,60)", [`${suffix}-foreign-pressure`, foreignDomain]);
    const eligibleControl = await read();
    const controlWork = `${suffix}-eligible-control`;
    assert.equal((await post({ logicalWorkId: controlWork, attemptNumber: 1, idempotencyKey: `${controlWork}-key`, payloadReference: `${controlWork}-payload`, payloadHash: "c".repeat(64), requestResourceEnvelope: { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, expectedEffectiveConstraintRevision: eligibleControl.effectiveConstraintRevision })).state, "waiting", "the otherwise eligible public control enters its ordinary admission outcome without foreign feedback");
    await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'domain','qualified','rpm',$4,2)", [foreignDomain, foreignRoute, `${suffix}-foreign-qualified`, `${suffix}-foreign-window`]);
    assert.deepEqual(await read(), eligibleControl, "foreign-domain feedback leaves an otherwise eligible public control unchanged");
    assert.equal((await outcome(controlWork)).state, "waiting", "foreign-domain feedback cannot alter the control admission outcome");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'domain','rpm',$4,'qualified',clock_timestamp()-interval '1 day') AS recovered", [foreignDomain, foreignRoute, `${suffix}-foreign-stale`, `${suffix}-foreign-window`]))[0].recovered, false, "stale foreign-domain feedback cannot release a newer incident");
    assert.deepEqual(await read(), eligibleControl, "foreign-domain stale feedback leaves the public control constraint and admission eligibility unchanged");
    assert.equal((await outcome(controlWork)).state, "waiting", "stale foreign-domain feedback cannot alter the control admission outcome");
    await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'route','untrusted','rpm',$4,NULL)", [domain, route, `${suffix}-429`, `${suffix}-window`]);
    assert.equal((await read()).reason, "temporarily_pressure_blocked", "ambiguous 429 projects only a transient conservative hold");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route','rpm',$4,'qualified',clock_timestamp()-interval '1 day') AS recovered", [domain, route, `${suffix}-stale-recovery`, `${suffix}-window`]))[0].recovered, false, "stale recovery feedback cannot release current pressure");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route','rpm',$4,'qualified',clock_timestamp()) AS recovered", [domain, route, `${suffix}-recovery`, `${suffix}-window`]))[0].recovered, true);

    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v3')", [domain]);
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v3',3,'cap-v3',$2,($3::jsonb)->$2,'{}',true,now()+interval '1 hour')", [domain, dimension, windows]);
    await eventually(async () => (await read()).plan.activationRevision === 3, "the public read must observe the separately activated increase");
    await waitForWakeupConvergence(sql, domain, "active-plan:3");
    const increased = await read();
    assert.deepEqual(increased.effectiveCapacity, { rpm: 10, tpm: 10, rpd: 10, concurrency: 10 });
    const historicalIdentity = (await sql.unsafe(`SELECT work.desired_profile_version,work.activation_revision::text AS activation_revision,work.state,
      reservation.reservation_id::text AS reservation_id,reservation.desired_profile_version AS reservation_profile_version,
      reservation.activation_revision::text AS reservation_activation_revision,reservation.state AS reservation_state
      FROM bridge.provider_work_attempt work
      JOIN bridge.provider_work_reservation reservation USING(logical_work_id,attempt_number)
      WHERE work.logical_work_id=$1`, [historicalWork]))[0];
    assert.ok(typeof historicalIdentity.reservation_id === "string", "the admitted historical work persists a reservation identity");
    assert.deepEqual({ ...historicalIdentity, reservation_id: undefined }, { desired_profile_version: "plan-v1", activation_revision: "1", state: "transport_may_have_started", reservation_profile_version: "plan-v1", reservation_activation_revision: "1", reservation_state: "live", reservation_id: undefined }, "the converged plan-3 wakeup preserves the real historical reservation identity and live liability");
    const restartWindow = `${suffix}-restart-rpm-window`;
    await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'domain','qualified','rpm',$4,1)", [domain, route, `${suffix}-restart-rpm-low`, restartWindow]);
    const clampedBeforeRestart = (await read()).effectiveCapacity.rpm;
    assert.ok(clampedBeforeRestart <= 2, "the numeric clamp remains conservative while the historical liability is live");
    await worker.stop();
    worker = createWorker();
    await worker.start();
    const restarted = await read();
    assert.equal(restarted.plan.activationRevision, 3, "the ordinary worker restart preserves the active plan revision");
    assert.equal(restarted.effectiveCapacity.rpm, clampedBeforeRestart, "the ordinary worker restart preserves the conservative numeric clamp");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:3'", [domain]))[0].count, 1, "restart cannot duplicate the activated-plan wakeup");
    assert.deepEqual((await sql.unsafe(`SELECT work.desired_profile_version,work.activation_revision::text AS activation_revision,work.state,
      reservation.reservation_id::text AS reservation_id,reservation.desired_profile_version AS reservation_profile_version,
      reservation.activation_revision::text AS reservation_activation_revision,reservation.state AS reservation_state
      FROM bridge.provider_work_attempt work
      JOIN bridge.provider_work_reservation reservation USING(logical_work_id,attempt_number)
      WHERE work.logical_work_id=$1`, [historicalWork]))[0], historicalIdentity, "restart retains the historical immutable reservation identity and live liability");
    assert.equal(sends.get(historicalWork), 1, "restart cannot create a duplicate historical send");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'domain','rpm',$4,'qualified',clock_timestamp()) AS recovered", [domain, route, `${suffix}-restart-rpm-recovery`, restartWindow]))[0].recovered, true);
    const futureWork = `${suffix}-future-work`;
    assert.equal((await post({ logicalWorkId: futureWork, attemptNumber: 1, idempotencyKey: `${futureWork}-key`, payloadReference: `${futureWork}-payload`, payloadHash: "b".repeat(64), requestResourceEnvelope: { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, expectedEffectiveConstraintRevision: increased.effectiveConstraintRevision })).state, "dispatched_or_may_have_started");
    await eventually(async () => (sends.get(futureWork) ?? 0) === 1, "only the newly eligible, versioned future work may send");
    assert.equal(sends.get(futureWork), 1);
  } finally { releaseHistoricalTransport?.(); await worker.stop().catch(() => undefined); await app.close(); await sql.end(); }
});
