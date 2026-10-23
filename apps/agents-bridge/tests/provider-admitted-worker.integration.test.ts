import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { bindProviderWorkRouteFromResolver } from "../src/provider-operational-runtime.ts";
import { TestRuntime } from "../src/runtime.ts";
import { createRouteRegistry } from "../src/route-registry.ts";
import { createBackgroundWorker, providerAdmittedExecutionQueue } from "../src/worker.ts";
import { createProductionBridgeWorker } from "../src/production-worker-composition.ts";

const databaseUrl = process.env.DATABASE_URL;
// pg-boss polling is the durable delivery mechanism for this queue.  Keep
// enough room for a scheduling turn on a busy local PostgreSQL instance; this
// does not alter the worker's delivery contract or add a notification path.
const deliveryTimeoutMilliseconds = 10_000;

const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function readDeliverySnapshot(sql: postgres.Sql, worker: ReturnType<typeof createBackgroundWorker>, jobId: string, reservationId: string, work: string) {
  const [job] = await sql.unsafe("SELECT state, created_on, start_after, started_on, completed_on, retry_count, retry_limit FROM pgboss.job WHERE id=$1", [jobId]);
  const [queue] = await sql.unsafe("SELECT name, policy, retry_limit, retry_delay, expire_seconds, notify FROM pgboss.queue WHERE name=$1", [providerAdmittedExecutionQueue]);
  const [attempt] = await sql.unsafe("SELECT state, terminal_reason FROM bridge.provider_work_attempt WHERE logical_work_id=$1 AND attempt_number=1", [work]);
  const [claims] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim WHERE reservation_id=$1", [reservationId]);
  const [outcomes] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_operational_feedback_event WHERE reservation_id=$1", [reservationId]);
  const [producerConnection] = await sql.unsafe("SELECT current_database() AS database, current_user AS role, current_schema() AS schema, current_setting('search_path') AS search_path");
  const workerConnection = await worker.boss.getDb().executeSql("SELECT current_database() AS database, current_user AS role, current_schema() AS schema, current_setting('search_path') AS search_path");
  const workerRegistration = worker.boss.getWipData().filter((entry) => entry.name === providerAdmittedExecutionQueue)
    .map((entry) => ({ name: entry.name, state: entry.state, pollingIntervalSeconds: entry.options.pollingIntervalSeconds, localConcurrency: entry.options.localConcurrency, lastFetchedOn: entry.lastFetchedOn, lastError: entry.lastError?.message ?? null }));
  return { job, queue, attempt, claims: claims.count, outcomes: outcomes.count, producerConnection, workerConnection: workerConnection.rows[0], workerRegistration };
}

async function waitForDurableDelivery(sql: postgres.Sql, worker: ReturnType<typeof createBackgroundWorker>, jobId: string, reservationId: string, work: string) {
  const deadline = Date.now() + deliveryTimeoutMilliseconds;
  let snapshot = await readDeliverySnapshot(sql, worker, jobId, reservationId, work);
  while (Date.now() < deadline) {
    if (snapshot.job?.state === "completed" && snapshot.claims === 1 && snapshot.outcomes === 1 && snapshot.attempt?.state === "reconciled") return snapshot;
    await sleep(25);
    snapshot = await readDeliverySnapshot(sql, worker, jobId, reservationId, work);
  }
  assert.fail(`admitted worker did not durably reconcile within ${deliveryTimeoutMilliseconds}ms: ${JSON.stringify(snapshot)}`);
}

async function waitForRejectedReplay(sql: postgres.Sql, jobId: string) {
  const deadline = Date.now() + deliveryTimeoutMilliseconds;
  while (Date.now() < deadline) {
    const [job] = await sql.unsafe("SELECT state FROM pgboss.job WHERE id=$1", [jobId]);
    if (job?.state === "failed") return;
    await sleep(25);
  }
  assert.fail(`duplicate admitted-job replay did not fail within ${deliveryTimeoutMilliseconds}ms`);
}

async function waitForClaimedOutcome(sql: postgres.Sql, worker: ReturnType<typeof createBackgroundWorker>, jobId: string, reservationId: string, work: string) {
  const deadline = Date.now() + deliveryTimeoutMilliseconds;
  let snapshot = await readDeliverySnapshot(sql, worker, jobId, reservationId, work);
  while (Date.now() < deadline) {
    if (snapshot.claims === 1 && snapshot.outcomes === 1 && snapshot.attempt?.state === "reconciled") return snapshot;
    await sleep(25);
    snapshot = await readDeliverySnapshot(sql, worker, jobId, reservationId, work);
  }
  assert.fail(`crash-after-claim fixture did not persist its durable outcome within ${deliveryTimeoutMilliseconds}ms: ${JSON.stringify(snapshot)}`);
}

async function waitForWakeupConsumption(sql: postgres.Sql, jobId: string, domain: string, wakeupKey: string) {
  const deadline = Date.now() + deliveryTimeoutMilliseconds;
  while (Date.now() < deadline) {
    const [job] = await sql.unsafe("SELECT state FROM pgboss.job WHERE id=$1", [jobId]);
    const [dispatch] = await sql.unsafe("SELECT claimed_at FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key=$2", [domain, wakeupKey]);
    if (job?.state === "completed" && dispatch?.claimed_at) return;
    await sleep(25);
  }
  assert.fail(`active-plan wakeup was not consumed by the real worker within ${deliveryTimeoutMilliseconds}ms`);
}

test("BSS-V2-006-03A consumes an admitted pg-boss job once and feeds the production ingress", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = `03a-worker-${Date.now()}`;
  const domain = suffix;
  const route = `${suffix}-route`;
  const work = `${suffix}-work`;
  const profile = {
    usableGlobalCapacity: { rpm: 10, tpm: 100, rpd: 10, concurrency: 1 },
    hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 },
    backgroundCapacity: { rpm: 9, tpm: 90, rpd: 9, concurrency: 1 },
    backgroundLanes: [],
  };
  const capacityLimits = {
    rpm: { state: "known", value: 10 },
    tpm: { state: "known", value: 100 },
    rpd: { state: "known", value: 10 },
    concurrency: { state: "known", value: 1 },
  };
  const capacityWindows = {
    rpm: { kind: "fixed", windowSeconds: 60 },
    tpm: { kind: "fixed", windowSeconds: 60 },
    rpd: { kind: "fixed", windowSeconds: 86_400 },
    concurrency: { kind: "fixed", windowSeconds: 60 },
  };
  const enforcedDimensions = {
    rpm: { mode: "enforced", limitSource: "provider" },
    tpm: { mode: "enforced", limitSource: "provider" },
    rpd: { mode: "enforced", limitSource: "provider" },
    concurrency: { mode: "enforced", limitSource: "provider" },
  };
  let sends = 0;
  let crashAfterClaim = false;
  const providerOutboundTransport = async (input: { routeId: string; adapterVersion: string; qualificationVersion: string; authorityVersion: string; providerId: string; modelOrProcessorId: string; qualificationRef: string; payloadReference: { kind: "bss-v2-006-03a-operational-fixture" } }) => {
    assert.equal(input.routeId, route);
    assert.deepEqual({ adapterVersion: input.adapterVersion, qualificationVersion: input.qualificationVersion, authorityVersion: input.authorityVersion, providerId: input.providerId, modelOrProcessorId: input.modelOrProcessorId, qualificationRef: input.qualificationRef }, { adapterVersion: "adapter-v1", qualificationVersion: "qualification-v1", authorityVersion: input.authorityVersion, providerId: "fixture", modelOrProcessorId: "fixture-model", qualificationRef: "qualification://03a-fixture" });
    assert.match(input.authorityVersion, /^\d+$/u);
    assert.equal(input.payloadReference.kind, "bss-v2-006-03a-operational-fixture");
    sends += 1;
    if (crashAfterClaim) {
      crashAfterClaim = false;
      throw new Error("fixture transport crashed after the durable claim");
    }
    return { feedbackId: `${suffix}-feedback-${sends}`, transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 } };
  };
  const routes = createRouteRegistry([{
    routeId: route,
    capability: "atlas.chat.default",
    providerId: "fixture",
    modelOrProcessorId: "fixture-model",
    adapterVersion: "adapter-v1",
    qualificationVersion: "qualification-v1",
    qualificationRef: "qualification://03a-fixture",
    workClass: "interactive",
    enabled: true,
  }], "development", new Set(["fixture"]));
  const createWorker = () => createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(),
    documentPerception: async () => undefined,
    semantic: async () => undefined,
    providerOutboundTransport,
  });
  let worker = createWorker();
  const registerAndBind = async (logicalWorkId: string) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 minute',now()+interval '1 minute')", [logicalWorkId, domain, `${suffix}-process`, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }]);
    await bindProviderWorkRouteFromResolver({
      executeSql: async (query: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(query, values as unknown[] | undefined) }),
    }, routes, { logicalWorkId, attemptNumber: 1 });
  };
  let fixtureCommitted = false;
  try {
    await worker.start();
    const registered = worker.boss.getWipData().filter((entry) => entry.name === providerAdmittedExecutionQueue);
    assert.equal(registered.length, 1, "the admitted execution worker must be registered before fixture admission");
    assert.equal(registered[0]?.state, "active", "the admitted execution worker must be active before fixture admission");
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,$3::jsonb,$4::jsonb,'quota','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route, providerId: "fixture", modelOrProcessorId: "fixture-model", adapterVersion: "adapter-v1", qualificationRef: "qualification://03a-fixture", qualificationVersion: "qualification-v1", capability: "atlas.chat.default" }], capacityLimits, capacityWindows]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v1',$3,'policy','v1','{}'::jsonb,'fixture',now())", [`${suffix}-policy-approval`, domain, route]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v1',$2,'policy','v1',$3,$4::jsonb,now())", [domain, route, `${suffix}-policy-approval`, enforcedDimensions]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [`${suffix}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default','interactive','{}','{}',true,$2,$3,'v1')", [`${suffix}-process`, [route], `${suffix}-workload`]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, `${suffix}-process`, `${suffix}-workload`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 minute',now()+interval '1 minute')", [work, domain, `${suffix}-process`, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }]);
    // Bind inside the admission transaction, while the route itself is still
    // derived exclusively from the same server-owned registry used by Bridge.
    await bindProviderWorkRouteFromResolver({
      executeSql: async (query: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(query, values as unknown[] | undefined) }),
    }, routes, { logicalWorkId: work, attemptNumber: 1 });
    const [admitted] = await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [work]);
    assert.equal(admitted.decision, "admitted");
    const [uncommittedJob] = await sql.unsafe("SELECT state, start_after <= now() AS eligible_now FROM pgboss.job WHERE id=$1", [admitted.job_id]);
    assert.deepEqual(uncommittedJob, { state: "created", eligible_now: true });
    await sql.unsafe("COMMIT");
    fixtureCommitted = true;
    const delivered = await waitForDurableDelivery(sql, worker, admitted.job_id, admitted.reservation_id, work);
    assert.equal(sends, 1);
    assert.equal(delivered.claims, 1);
    assert.equal(delivered.outcomes, 1);
    assert.deepEqual(delivered.attempt, { state: "reconciled", terminal_reason: "reconciled_operational_feedback" });

    const duplicateJobId = await worker.boss.send(providerAdmittedExecutionQueue, { logicalWorkId: work, attemptNumber: 1, reservationId: admitted.reservation_id });
    assert.ok(duplicateJobId, "the duplicate delivery fixture must enqueue the same durable identity");
    await waitForRejectedReplay(sql, duplicateJobId as string);
    assert.equal(sends, 1, "a duplicate delivery or claim replay must not invoke a second outbound send");

    // A replayed terminal feedback event may race an unrelated admission;
    // both ports retain their own durable fence and neither creates a second
    // send for the already reconciled reservation.
    const [storedFeedback] = await sql.unsafe("SELECT normalized_feedback AS feedback FROM bridge.provider_operational_feedback_event WHERE reservation_id=$1", [admitted.reservation_id]);
    const feedbackRaceWork = `${suffix}-feedback-admission-race`;
    await registerAndBind(feedbackRaceWork);
    const feedbackCompetitor = postgres(bridgeUrl.toString(), { max: 1 });
    try {
      const [replayed, racedAdmissionRows] = await Promise.all([
        sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb) AS result", [storedFeedback.feedback]),
        feedbackCompetitor.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [feedbackRaceWork]),
      ]);
      assert.equal(replayed[0].result.status, "duplicate");
      const racedAdmission = racedAdmissionRows[0];
      assert.equal(racedAdmission.decision, "admitted");
      await waitForDurableDelivery(sql, worker, racedAdmission.job_id, racedAdmission.reservation_id, feedbackRaceWork);
    } finally { await feedbackCompetitor.end(); }
    assert.equal(sends, 2, "feedback/admission concurrency cannot replay an already terminal transport");

    // The admission transaction is the only producer. A fault before commit
    // must leave no durable job that a real worker can accidentally send.
    const rolledBackWork = `${suffix}-rollback`;
    await sql.unsafe("BEGIN");
    await registerAndBind(rolledBackWork);
    const [rolledBackAdmission] = await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [rolledBackWork]);
    assert.equal(rolledBackAdmission.decision, "admitted");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE id=$1", [rolledBackAdmission.job_id]))[0].count, 1, "the uncommitted admission has exactly one pending delivery");
    await sql.unsafe("ROLLBACK");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE id=$1", [rolledBackAdmission.job_id]))[0].count, 0, "rollback removes the pending pg-boss delivery before any worker can claim it");

    // Stop the process after transactional admission but before the queue is
    // consumed. A replacement Bridge process must consume that exact durable
    // job once, rather than require a second scheduler or a fresh admission.
    await worker.stop();
    const beforeClaimWork = `${suffix}-restart-before-claim`;
    await registerAndBind(beforeClaimWork);
    const [beforeClaimAdmission] = await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [beforeClaimWork]);
    assert.equal(beforeClaimAdmission.decision, "admitted");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim WHERE reservation_id=$1", [beforeClaimAdmission.reservation_id]))[0].count, 0, "the stopped worker has not claimed the durable transport");
    worker = createWorker();
    await worker.start();
    await waitForDurableDelivery(sql, worker, beforeClaimAdmission.job_id, beforeClaimAdmission.reservation_id, beforeClaimWork);
    assert.equal(sends, 3, "the restarted worker sends the pre-claim durable delivery once");
    const restartedProjection = await sql.unsafe("SELECT * FROM bridge.read_process_capacity_window_usage_v1($1)", [domain]);
    assert.ok(restartedProjection.some((row) => row.reservation_id === beforeClaimAdmission.reservation_id), "the restarted Bridge process leaves its durable reservation visible to the read-derived process projection");
    const [restartedReconciliation] = await sql.unsafe("SELECT jsonb_object_agg(dimension_id,units) AS value FROM (SELECT dimension_id,sum(GREATEST(held_units,spent_units)) AS units FROM bridge.read_process_capacity_window_usage_v1($1) WHERE window_is_open GROUP BY dimension_id) usage", [domain]);
    const [restartedDomainUsage] = await sql.unsafe("SELECT bridge.current_provider_operational_usage($1,'cap-v1',ARRAY['rpm','tpm','rpd','concurrency']) AS value", [domain]);
    assert.deepEqual(restartedReconciliation.value, restartedDomainUsage.value, "after Bridge restart the process projection remains exactly reconciled to the held/spent domain ledger");

    // Competing admission calls serialize through the production SQL fence;
    // the one actual queue delivery is then consumed by the real worker.
    const concurrentWork = `${suffix}-concurrent-admission`;
    await registerAndBind(concurrentWork);
    const competitor = postgres(bridgeUrl.toString(), { max: 1 });
    try {
      const decisions = await Promise.all([
        sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [concurrentWork]),
        competitor.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [concurrentWork]),
      ]);
      const admittedDecisions = decisions.map((rows) => rows[0]).filter((decision) => decision?.decision === "admitted");
      assert.equal(admittedDecisions.length, 1, "concurrent admission creates one reservation and one actual delivery");
      const concurrentAdmission = admittedDecisions[0]!;
      await waitForDurableDelivery(sql, worker, concurrentAdmission.job_id, concurrentAdmission.reservation_id, concurrentWork);
      assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [concurrentWork]))[0].count, 1);
    } finally { await competitor.end(); }
    assert.equal(sends, 4, "concurrent admission cannot produce a second transport send");

    // The production worker also consumes the activation queue. No separate
    // scheduler is involved: activation materializes the pg-boss job and the
    // same Bridge runtime claims its durable wakeup dispatch.
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v2','fixture',$2,$3::jsonb,$4::jsonb,'quota','operator_config','fixture','v2',now(),now())", [domain, [{ routeId: route }], capacityLimits, capacityWindows]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v2',$3,'policy','v1','{}'::jsonb,'fixture',now())", [`${suffix}-policy-approval-v2`, domain, route]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v2',$2,'policy','v1',$3,$4::jsonb,now())", [domain, route, `${suffix}-policy-approval-v2`, enforcedDimensions]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v2','cap-v2','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v2',$2,'v1',$3,'v1')", [domain, `${suffix}-process`, `${suffix}-workload`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v2')", [domain]);
    const wakeupKey = "active-plan:2";
    const [wakeup] = await sql.unsafe("SELECT job_id FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key=$2", [domain, wakeupKey]);
    await waitForWakeupConsumption(sql, wakeup.job_id, domain, wakeupKey);

    const crashWork = `${suffix}-crash-after-claim`;
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v2',2,now()+interval '1 minute',now()+interval '1 minute')", [crashWork, domain, `${suffix}-process`, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }]);
    await bindProviderWorkRouteFromResolver({ executeSql: async (query: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(query, values as unknown[] | undefined) }) }, routes, { logicalWorkId: crashWork, attemptNumber: 1 });
    crashAfterClaim = true;
    const [crashAdmitted] = await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [crashWork]);
    assert.equal(crashAdmitted.decision, "admitted");
    const crashDelivered = await waitForClaimedOutcome(sql, worker, crashAdmitted.job_id, crashAdmitted.reservation_id, crashWork);
    assert.equal(sends, 5, "the fixture must reach the one outbound call before its simulated crash");
    assert.equal(crashDelivered.claims, 1);
    assert.equal(crashDelivered.outcomes, 1, "a crash after claim must persist one may-have-started ingress outcome");
    const crashReplayJobId = await worker.boss.send(providerAdmittedExecutionQueue, { logicalWorkId: crashWork, attemptNumber: 1, reservationId: crashAdmitted.reservation_id });
    assert.ok(crashReplayJobId);
    await waitForRejectedReplay(sql, crashReplayJobId as string);
    assert.equal(sends, 5, "a crash-after-claim replay must not issue another outbound send");

    // Only the Bridge role has the mutation ports. The persisted outcome is
    // itself redacted and content-free, even though the test transport was
    // invoked through the real production composition root.
    const [persisted] = await sql.unsafe("SELECT normalized_feedback AS feedback FROM bridge.provider_operational_feedback_event WHERE reservation_id=$1", [crashAdmitted.reservation_id]);
    for (const forbidden of ["headers", "authorization", "credential", "prompt", "source", "secret", "token", "body"]) {
      assert.equal(Object.hasOwn(persisted.feedback, forbidden), false, `persisted feedback must not retain ${forbidden}`);
    }
    const appUrl = new URL(databaseUrl!);
    appUrl.username = "atlas_app";
    appUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
    const atlasApp = postgres(appUrl.toString(), { max: 1 });
    try {
      await assert.rejects(() => atlasApp.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [crashAdmitted.reservation_id]), /permission denied/i);
      await assert.rejects(() => atlasApp.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ feedbackId: `${suffix}-forged-app-feedback` }]), /permission denied/i);
      await assert.rejects(() => atlasApp.unsafe("SELECT normalized_feedback FROM bridge.provider_operational_feedback_event LIMIT 1"), /permission denied/i);
    } finally { await atlasApp.end(); }
  } finally {
    await worker.stop().catch(() => undefined);
    if (!fixtureCommitted) await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
