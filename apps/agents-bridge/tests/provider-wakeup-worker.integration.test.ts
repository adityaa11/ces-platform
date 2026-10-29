import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createProductionBridgeWorker } from "../src/production-worker-composition.ts";
import { TestRuntime } from "../src/runtime.ts";
import { createBackgroundWorker, providerWakeupQueue } from "../src/worker.ts";

const databaseUrl = process.env.DATABASE_URL;
const deliveryTimeoutMilliseconds = 10_000;
const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function waitForWakeup(sql: postgres.Sql, jobId: string, domain: string, key: string, expectedIntents: number) {
  const deadline = Date.now() + deliveryTimeoutMilliseconds;
  while (Date.now() < deadline) {
    const [job] = await sql.unsafe("SELECT state FROM pgboss.job WHERE id=$1", [jobId]);
    const [dispatch] = await sql.unsafe("SELECT claimed_at IS NOT NULL AS claimed FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key=$2", [domain, key]);
    const [intents] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_admission_convergence_intent WHERE quota_domain_id=$1", [domain]);
    if (job?.state === "completed" && dispatch?.claimed && intents?.count === expectedIntents) return;
    await sleep(25);
  }
  const [job] = await sql.unsafe("SELECT state,retry_count,retry_limit,output FROM pgboss.job WHERE id=$1", [jobId]);
  const [dispatch] = await sql.unsafe("SELECT claimed_at FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key=$2", [domain, key]);
  const [intents] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_admission_convergence_intent WHERE quota_domain_id=$1", [domain]);
  assert.fail(`wakeup delivery did not converge: ${JSON.stringify({ job, dispatch, intents })}`);
}

function worker(databaseUrl: string) {
  return createProductionBridgeWorker({
    config: { databaseUrl, backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(),
    documentPerception: async () => undefined,
    semantic: async () => undefined,
    providerOutboundTransport: async () => { throw new Error("the wakeup fixture must not call admitted transport"); },
  });
}

test("BSS-V2-006-03A-04 consumes activation wakeups through the production pg-boss worker and remains replay-safe across restart", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = `03a04-worker-${Date.now()}`;
  const domain = suffix;
  const processId = `${suffix}-process`;
  const workload = `${suffix}-workload`;
  const waiting = `${suffix}-waiting`;
  const inflight = `${suffix}-inflight`;
  const route = `${suffix}-route`;
  const capacityPolicy = { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 10 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 20 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 10 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 2 } };
  const plan = (tpm: number) => ({ usableGlobalCapacity: { rpm: 10, tpm, rpd: 10, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 9, tpm: Math.max(0, tpm - 1), rpd: 9, concurrency: 1 }, backgroundLanes: [] });
  const addPlan = async (version: string, capacityVersion: string, profile: object) => {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3,'{}',$4,'operator_config','fixture',$2,now(),now())", [domain, capacityVersion, [{ routeId: route }], capacityPolicy]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,$2,$3,'fixture',now(),$4)", [domain, version, capacityVersion, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,$2,$3,'v1',$4,'v1')", [domain, version, processId, workload]);
  };
  let first = worker(bridgeUrl.toString());
  let second: ReturnType<typeof createBackgroundWorker> | undefined;
  try {
    await first.start();
    const registration = first.boss.getWipData().filter((entry) => entry.name === providerWakeupQueue);
    assert.equal(registration.length, 1, "production composition must register the wakeup consumer");
    assert.equal(registration[0]?.state, "active", "wakeup consumer must be active before activation");

    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','{}','{}')", [workload]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default','interactive','{}','{}',true,'[]',$2,'v1')", [processId, workload]);
    await addPlan("plan-v1", "cap-v1", plan(20));
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    const [firstDispatch] = await sql.unsafe("SELECT job_id FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:1'", [domain]);
    await waitForWakeup(sql, firstDispatch.job_id, domain, "active-plan:1", 0);

    for (const [work, envelope] of [[waiting, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }], [inflight, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]] as const) {
      await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [work, domain, processId, envelope]);
    }
    await sql.unsafe("UPDATE bridge.provider_work_attempt SET state='reserved' WHERE logical_work_id=$1", [inflight]);
    await sql.unsafe("INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES($1,1,'plan-v1',1,$2)", [inflight, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]);

    await addPlan("plan-v2", "cap-v2", plan(5));
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v2')", [domain]);
    const [activationDispatch] = await sql.unsafe("SELECT job_id FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:2'", [domain]);
    const [activationJobs] = await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$1 AND data->>'quotaDomainId'=$2 AND data->>'wakeupKey'='active-plan:2'", [providerWakeupQueue, domain]);
    assert.equal(activationJobs.count, 1, "v1→v2 activation creates exactly one durable wakeup dispatch");
    await waitForWakeup(sql, activationDispatch.job_id, domain, "active-plan:2", 1);
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [waiting]))[0], { desired_profile_version: "plan-v2", activation_revision: "2", state: "waiting" });
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [inflight]))[0], { desired_profile_version: "plan-v1", activation_revision: "1", state: "reserved" });

    await first.stop();
    second = worker(bridgeUrl.toString());
    await second.start();
    const replayJobId = await second.boss.send(providerWakeupQueue, { quotaDomainId: domain, wakeupKey: "active-plan:2" });
    assert.ok(replayJobId, "restart fixture must enqueue a duplicate durable delivery");
    await waitForWakeup(sql, replayJobId as string, domain, "active-plan:2", 1);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_admission_convergence_intent WHERE quota_domain_id=$1", [domain]))[0].count, 1, "duplicate delivery after restart cannot mint a second effective intent");
  } finally {
    await first.stop().catch(() => undefined);
    await second?.stop().catch(() => undefined);
    await sql.end();
  }
});
