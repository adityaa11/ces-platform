import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-03 fences feedback, conserves unknown usage, clamps pressure, and converges plans", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  let sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `feedback-${Date.now()}`;
  const route = "qualified-route";
  let committed = false;
  const profile = (version: string) => ({ usableGlobalCapacity: { rpm: 2, tpm: 20, rpd: 2, concurrency: 1 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundLanes: [{ processId: `${domain}-background`, profileVersion: "v1", normalizedWeight: 1 }] });
  const deadline = () => new Date(Date.now() + 120_000).toISOString();
  const register = (id: string, attempt = 1) => sql.unsafe("SELECT bridge.register_provider_work_attempt($1,$2,$3,$4,'v1','fairness',$5,'plan-v1',1,$6,$6)", [id, attempt, domain, `${domain}-interactive`, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, deadline()]);
  const admit = async (id: string, attempt = 1) => (await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,$2)", [id, attempt]))[0];
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','account',$2,'{}','{}','quota','provider_docs','ref','v1',now(),now()),($1,'cap-v2','account',$2,'{}','{}','quota','operator_config','ref','v2',now(),now())", [domain, [{ routeId: route }]]);
    for (const [processId, serviceClass] of [[`${domain}-interactive`, "interactive"], [`${domain}-background`, "background"]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [processId]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','cap',$2,'{}','{}',true,'[]',$1,'v1')", [processId, serviceClass]);
    }
    for (const version of ["plan-v1", "plan-v2"]) {
      await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,$2,$3,'planner',now(),$4)", [domain, version, version === "plan-v1" ? "cap-v1" : "cap-v2", profile(version)]);
      for (const processId of [`${domain}-interactive`, `${domain}-background`]) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,$2,$3,'v1',$3,'v1')", [domain, version, processId]);
    }
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);

    // Actual usage is recorded once: request/day remain counted while TPM is refunded to actual usage and concurrency is released.
    await register(`${domain}-actual`); const actual = await admit(`${domain}-actual`); assert.equal(actual.decision, "admitted");
    await sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [actual.reservation_id]);
    const [first] = await sql.unsafe("SELECT bridge.reconcile_provider_work_outcome($1,1,$2,true,$3) AS result", [`${domain}-actual`, `${domain}-feedback-actual`, { tpm: 5 }]);
    assert.equal(first.result.status, "reconciled_actual");
    const [duplicate] = await sql.unsafe("SELECT bridge.reconcile_provider_work_outcome($1,1,$2,true,$3) AS result", [`${domain}-actual`, `${domain}-feedback-actual`, { tpm: 5 }]);
    assert.equal(duplicate.result.status, "duplicate");
    const [held] = await sql.unsafe("SELECT held_resource_envelope FROM bridge.provider_runtime_usage_hold WHERE reservation_id=$1", [actual.reservation_id]);
    assert.deepEqual(held.held_resource_envelope, { rpm: 1, tpm: 5, rpd: 1, concurrency: 0 });

    // A definitely untransmitted dispatch releases every resource; uncertain transport retains the full reservation except concurrency.
    await register(`${domain}-untransmitted`); const untransmitted = await admit(`${domain}-untransmitted`); await sql.unsafe("SELECT bridge.reconcile_provider_work_outcome($1,1,$2,false,NULL)", [`${domain}-untransmitted`, `${domain}-feedback-untransmitted`]);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_runtime_usage_hold WHERE reservation_id=$1", [untransmitted.reservation_id]))[0].count, 0);
    await register(`${domain}-unknown`, 1); const unknown = await admit(`${domain}-unknown`); await sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [unknown.reservation_id]); await sql.unsafe("SELECT bridge.reconcile_provider_work_outcome($1,1,$2,true,NULL)", [`${domain}-unknown`, `${domain}-feedback-unknown`]);
    const [unknownHold] = await sql.unsafe("SELECT held_resource_envelope,reason,release_not_before FROM bridge.provider_runtime_usage_hold WHERE reservation_id=$1", [unknown.reservation_id]);
    assert.deepEqual(unknownHold.held_resource_envelope, { rpm: 1, tpm: 10, rpd: 1, concurrency: 0 }); assert.equal(unknownHold.reason, "unknown_usage"); assert.equal(unknownHold.release_not_before, null);

    // Trusted lower-limit feedback only reduces the named domain/dimension; an unknown 429 instead creates a bounded durable hold.
    await sql.unsafe("SELECT bridge.record_provider_runtime_pressure($1,$2,$3,'tpm',0,NULL,now()+interval '10 minutes')", [`${domain}-feedback-clamp`, domain, route]);
    await register(`${domain}-clamped`); assert.equal((await admit(`${domain}-clamped`)).decision, "unavailable");
    assert.deepEqual((await sql.unsafe("SELECT bridge.provider_runtime_effective_capacity('unrelated-domain',$1) AS capacity", [profile("unrelated").usableGlobalCapacity]))[0].capacity, profile("unrelated").usableGlobalCapacity, "a domain-local clamp cannot reduce another domain");
    await sql.unsafe("SAVEPOINT wrong_domain_feedback"); await assert.rejects(() => sql.unsafe("SELECT bridge.record_provider_runtime_pressure('wrong-domain',$1,'wrong-route','tpm',1,NULL,NULL)", [domain]), /not associated/i); await sql.unsafe("ROLLBACK TO SAVEPOINT wrong_domain_feedback");
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','background',$4,'plan-v1',1,NULL,$5)", [`${domain}-background-waiting`, domain, `${domain}-background`, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, deadline()]);
    await sql.unsafe("SELECT bridge.record_unknown_provider_pressure($1,$2,$3,60)", [`${domain}-feedback-429`, domain, route]);
    assert.equal((await sql.unsafe("SELECT bridge.provider_runtime_admission_blocked($1) AS blocked", [domain]))[0].blocked, true);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.admit_next_provider_work_attempt($1)", [domain]))[0].count, 0, "bounded cooldown leaves background work waiting with zero transport");

    // Activation rebases only waiting work, preserves the already reconciled reservation's old identity, and records one wakeup/epoch.
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','structural',$4,'plan-v1',1,$5,$5)", [`${domain}-structurally-unfit`, domain, `${domain}-interactive`, { rpm: 1, tpm: 99, rpd: 1, concurrency: 1 }, deadline()]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v2')", [domain]);
    const [waiting] = await sql.unsafe("SELECT desired_profile_version,activation_revision FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [`${domain}-clamped`]);
    assert.deepEqual(waiting, { desired_profile_version: "plan-v2", activation_revision: "2" });
    const [historic] = await sql.unsafe("SELECT desired_profile_version,activation_revision FROM bridge.provider_work_reservation WHERE reservation_id=$1", [actual.reservation_id]);
    assert.deepEqual(historic, { desired_profile_version: "plan-v1", activation_revision: "1" });
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_request WHERE quota_domain_id=$1 AND wakeup_key='plan:2'", [domain]))[0].count, 1);
    assert.equal((await sql.unsafe("SELECT fairness_epoch FROM bridge.provider_admission_domain_state WHERE quota_domain_id=$1", [domain]))[0].fairness_epoch, "plan-v2:2");
    assert.equal((await sql.unsafe("SELECT state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [`${domain}-structurally-unfit`]))[0].state, "terminal");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_replan_request WHERE logical_work_id=$1", [`${domain}-structurally-unfit`]))[0].count, 1);
    await sql.unsafe("SELECT bridge.request_provider_capacity_revision($1,$2,$3,'tpm',1,'provider_api','provider://limits/v2',now())", [`${domain}-qualified-policy`, domain, route]);
    assert.equal((await sql.unsafe("SELECT desired_profile_version FROM bridge.active_desired_admission_profile WHERE quota_domain_id=$1", [domain]))[0].desired_profile_version, "plan-v2", "runtime feedback cannot publish a BSS-V2-005 plan");
    await sql.unsafe("COMMIT"); committed = true; await sql.end();

    // A new connection observes the persisted pressure/usage state (restart safety).
    sql = postgres(bridgeUrl.toString(), { max: 1 });
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_runtime_pressure WHERE quota_domain_id=$1", [domain]))[0].count, 2);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_runtime_usage_hold WHERE quota_domain_id=$1 AND released_at IS NULL", [domain]))[0].count, 2);
  } finally { if (!committed) await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});
