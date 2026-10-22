import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-03A-05 admits background through the route-aware authority without consuming interactive reserve", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `03a05-${Date.now()}`;
  const route = `${domain}-route`;
  const processes = { interactive: `${domain}-interactive`, a: `${domain}-a`, b: `${domain}-b` };
  const profile = {
    usableGlobalCapacity: { rpm: 4, tpm: 40, rpd: 4, concurrency: 2 },
    hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 },
    backgroundCapacity: { rpm: 3, tpm: 30, rpd: 3, concurrency: 1 },
    backgroundLanes: [
      { processId: processes.a, profileVersion: "v1", normalizedWeight: .5 },
      { processId: processes.b, profileVersion: "v1", normalizedWeight: .5 },
    ],
  };
  const envelope = { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 };
  const register = async (work: string, processId: string, key: string, executionDeadline = "now()+interval '1 hour'") => {
    await sql.unsafe(`SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1',$4,$5,'plan-v1',1,now()+interval '1 hour',${executionDeadline})`, [work, domain, processId, key, envelope]);
    await sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [work, route]);
  };
  const dispatchCount = async (work: string) => (await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [work]))[0].count;
  const finish = async (work: string, reservationId: string) => {
    await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [reservationId]);
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{
      feedbackId: `${work}-feedback`, reservationId, attemptId: `${work}:1`, routeId: route, quotaDomainId: domain,
      desiredProfileVersion: "plan-v1", qualificationVersion: "qualification-v1", observationSource: "qualified_adapter",
      observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 },
    }]);
  };
  try {
    for (const [name, serviceClass] of [[processes.interactive, "interactive"], [processes.a, "background"], [processes.b, "background"]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [name]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default',$2,'{}','{}',true,$3,$1,'v1')", [name, serviceClass, [route]]);
    }
    const policies = { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 4 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 40 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 4 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 2 } };
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,'{}',$3,'quota','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], policies]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2)", [domain, profile]);
    for (const processId of Object.values(processes)) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$2,'v1')", [domain, processId]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'fixture','fixture-model-v1','adapter-v1','qualification://fixture','qualification-v1','atlas.chat.default')", [route, domain]);

    const firstBackground = `${domain}-background-a`;
    await register(firstBackground, processes.a, "a-1");
    const [first] = await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]);
    assert.equal(first.logical_work_id, firstBackground);
    await finish(firstBackground, first.reservation_id);
    await sql.end();

    const restarted = postgres(bridgeUrl.toString(), { max: 1 });
    try {
      const [durableFairness] = await restarted.unsafe("SELECT count(*)::int AS lanes, max(last_admission_turn)::text AS last_turn FROM bridge.provider_admission_lane_state WHERE quota_domain_id=$1", [domain]);
      assert.deepEqual(durableFairness, { lanes: 1, last_turn: "1" }, "background fairness is durable after a fresh database connection");
      const secondBackground = `${domain}-background-b`;
      await restarted.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','b-1',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [secondBackground, domain, processes.b, envelope]);
      await restarted.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [secondBackground, route]);
      const [second] = await restarted.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]);
      assert.equal(second.logical_work_id, secondBackground, "the durable fair selector continues through the common authority");

      const protectedInteractive = `${domain}-protected-interactive`;
      await restarted.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','interactive',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [protectedInteractive, domain, processes.interactive, envelope]);
      await restarted.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [protectedInteractive, route]);
      const [interactive] = await restarted.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [protectedInteractive]);
      assert.equal(interactive.decision, "admitted", "one admitted background reservation cannot borrow protected interactive headroom");

      const full = `${domain}-full-background`;
      await restarted.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','full',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [full, domain, processes.a, envelope]);
      await restarted.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [full, route]);
      const [fullDecision] = await restarted.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [full]);
      assert.equal(fullDecision.decision, "unavailable");
      assert.equal((await restarted.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [full]))[0].count, 0, "full concurrency creates no late background send");

      const cancelled = `${domain}-cancelled-background`;
      await restarted.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','cancelled',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [cancelled, domain, processes.a, envelope]);
      await restarted.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [cancelled, route]);
      await restarted.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'fixture_cancelled')", [cancelled]);
      assert.equal((await restarted.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [cancelled]))[0].decision, "unavailable");
      assert.equal((await restarted.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [cancelled]))[0].count, 0, "cancelled background work has no late send");

      const expired = `${domain}-expired-background`;
      await restarted.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','expired',$4,'plan-v1',1,now()-interval '1 second',now()-interval '1 second')", [expired, domain, processes.a, envelope]);
      await restarted.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [expired, route]);
      assert.equal((await restarted.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [expired]))[0].decision, "deadline_expired");
      assert.equal((await restarted.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [expired]))[0].count, 0, "expired background work has no late send");

      await restarted.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,7,60)", [`${domain}-policy`, domain]);
      await restarted.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'route','qualified','rpm',$4,NULL)", [domain, route, `${domain}-pressure`, `${domain}-rpm`]);
      const pressured = `${domain}-pressured-background`;
      await restarted.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','pressured',$4,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [pressured, domain, processes.b, envelope]);
      await restarted.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [pressured, route]);
      assert.equal((await restarted.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [pressured]))[0].decision, "pressure_limited");
      assert.equal((await restarted.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [pressured]))[0].count, 0, "route pressure creates no late background send");
    } finally {
      // This test does not start a worker: remove its durable fixture jobs so
      // they cannot be consumed by a later production-worker test.
      await restarted.unsafe("DELETE FROM pgboss.job WHERE data->>'logicalWorkId' LIKE $1", [`${domain}%`]);
      await restarted.end();
    }
  } finally { await sql.end().catch(() => undefined); }
});
