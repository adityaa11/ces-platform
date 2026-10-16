import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-03A-04 deduplicates activation wakeups and emits only bounded convergence intents", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `03a04-${Date.now()}`;
  const processA = `${domain}-process-a`; const processB = `${domain}-process-b`;
  const workloadA = `${domain}-workload-a`; const workloadB = `${domain}-workload-b`;
  const capacityPolicy = { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 10 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 20 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 10 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 2 } };
  const plan = (tpm: number) => ({ usableGlobalCapacity: { rpm: 10, tpm, rpd: 10, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 9, tpm: Math.max(0, tpm - 1), rpd: 9, concurrency: 1 }, backgroundLanes: [] });
  const addPlan = async (version: string, capacityVersion: string, profile: object, inputs: readonly [string, string][]) => {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3,'{}',$4,'quota','operator_config','fixture',$2,now(),now())", [domain, capacityVersion, [{ routeId: `${domain}-route` }], capacityPolicy]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,$2,$3,'fixture',now(),$4)", [domain, version, capacityVersion, profile]);
    for (const [processId, workloadId] of inputs) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,$2,$3,'v1',$4,'v1')", [domain, version, processId, workloadId]);
  };
  try {
    await sql.unsafe("BEGIN");
    for (const [processId, workloadId, capability] of [[processA, workloadA, "atlas.chat.default"], [processB, workloadB, "atlas.chat.deep"]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [workloadId]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat',$2,'interactive','{}','{}',true,'[]',$3,'v1')", [processId, capability, workloadId]);
    }
    await addPlan("plan-v1", "cap-v1", plan(20), [[processA, workloadA]]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fair-wait',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [`${domain}-waiting`, domain, processA, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }]);
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fair-flight',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [`${domain}-inflight`, domain, processA, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]);
    await sql.unsafe("UPDATE bridge.provider_work_attempt SET state='reserved' WHERE logical_work_id=$1", [`${domain}-inflight`]);
    await sql.unsafe("INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES($1,1,'plan-v1',1,$2)", [`${domain}-inflight`, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]);

    await addPlan("plan-v2", "cap-v2", plan(5), [[processA, workloadA]]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v2')", [domain]);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:2'", [domain]))[0].count, 1, "one activation has one durable pg-boss dispatch identity");
    const [first] = await sql.unsafe("SELECT bridge.consume_active_plan_wakeup($1,'active-plan:2') AS result", [domain]);
    assert.deepEqual(first.result, { claimed: true, staleActivation: false, rebasedWaitingWork: 1, ownerReplanIntents: 0, capacityRevisionIntents: 1 });
    const [replay] = await sql.unsafe("SELECT bridge.consume_active_plan_wakeup($1,'active-plan:2') AS result", [domain]);
    assert.equal(replay.result.claimed, false, "a replay cannot re-dispatch or mint another intent");
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [`${domain}-waiting`]))[0], { desired_profile_version: "plan-v2", activation_revision: "2", state: "waiting" });
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [`${domain}-inflight`]))[0], { desired_profile_version: "plan-v1", activation_revision: "1", state: "reserved" });
    await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,1,'route','qualified','rpm',$4,NULL)", [domain, `${domain}-route`, `${domain}-transient`, `${domain}-rpm`]);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_admission_convergence_intent WHERE quota_domain_id=$1", [domain]))[0].count, 1, "transient pressure cannot create a convergence intent");

    await addPlan("plan-v3", "cap-v3", plan(5), [[processB, workloadB]]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v3')", [domain]);
    const [third] = await sql.unsafe("SELECT bridge.consume_active_plan_wakeup($1,'active-plan:3') AS result", [domain]);
    assert.equal(third.result.ownerReplanIntents, 1);
    assert.equal(third.result.capacityRevisionIntents, 0);
    assert.deepEqual((await sql.unsafe("SELECT intent_kind FROM bridge.provider_admission_convergence_intent WHERE quota_domain_id=$1 ORDER BY intent_kind", [domain])).map((row) => row.intent_kind), ["capacity_revision_request", "owner_replan_required"]);
    await sql.unsafe("ROLLBACK");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});
