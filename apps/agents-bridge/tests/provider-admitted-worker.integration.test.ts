import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { bindProviderWorkRouteFromResolver, createProviderAdmittedExecutionHandler } from "../src/provider-operational-runtime.ts";
import { TestRuntime } from "../src/runtime.ts";
import { createRouteRegistry } from "../src/route-registry.ts";
import { createBackgroundWorker, providerAdmittedExecutionQueue } from "../src/worker.ts";

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
    usableGlobalCapacity: { rpm: 2, tpm: 20, rpd: 2, concurrency: 1 },
    hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 },
    backgroundCapacity: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 },
    backgroundLanes: [],
  };
  let sends = 0;
  const admittedHandler = createProviderAdmittedExecutionHandler(async (input) => {
    assert.equal(input.routeId, route);
    assert.equal(input.payloadReference.kind, "bss-v2-006-03a-operational-fixture");
    sends += 1;
    return { feedbackId: `${suffix}-feedback`, transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 } };
  });
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
  const worker = createBackgroundWorker(
    { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    new TestRuntime(),
    undefined,
    undefined,
    undefined,
    undefined,
    admittedHandler,
  );
  let fixtureCommitted = false;
  try {
    await worker.start();
    const registered = worker.boss.getWipData().filter((entry) => entry.name === providerAdmittedExecutionQueue);
    assert.equal(registered.length, 1, "the admitted execution worker must be registered before fixture admission");
    assert.equal(registered[0]?.state, "active", "the admitted execution worker must be active before fixture admission");
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,'{}',$3,'quota','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 2 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 20 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 2 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 1 } }]);
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
  } finally {
    await worker.stop().catch(() => undefined);
    if (!fixtureCommitted) await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
