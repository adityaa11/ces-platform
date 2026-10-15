import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-02 admits fairly, protects interactive capacity, and fences one fake transport", { skip: !databaseUrl }, async () => {
  const url = new URL(databaseUrl!); url.username = "agents_bridge"; url.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(url.toString(), { max: 1 });
  const domain = `fair-${Date.now()}`;
  const profile = { usableGlobalCapacity: { rpm: 4, tpm: 40, rpd: 4, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 3, tpm: 30, rpd: 3, concurrency: 1 }, backgroundLanes: [{ processId: `${domain}-a`, profileVersion: "v1", normalizedWeight: .5 }, { processId: `${domain}-b`, profileVersion: "v1", normalizedWeight: .25 }, { processId: `${domain}-c`, profileVersion: "v1", normalizedWeight: .25 }] };
  const deadline = new Date(Date.now() + 60_000).toISOString();
  const addProcess = async (id: string, serviceClass: "interactive" | "background") => {
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [id]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','cap',$2,'{}','{}',true,'[]',$1,'v1')", [id, serviceClass]);
  };
  const register = (id: string, process: string, key: string, envelope = { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, expires = deadline) => sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1',$4,$5,'plan-v1',1,$6,$6)", [id, domain, process, key, envelope, expires]);
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','account','[{\"routeId\":\"r\"}]','{}','{}','quota','provider_docs','ref','v1',now(),now())", [domain]);
    await addProcess(`${domain}-interactive`, "interactive"); await addProcess(`${domain}-a`, "background"); await addProcess(`${domain}-b`, "background"); await addProcess(`${domain}-c`, "background");
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','planner',now(),$2)", [domain, profile]);
    for (const process of [`${domain}-interactive`, `${domain}-a`, `${domain}-b`, `${domain}-c`]) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$2,'v1')", [domain, process]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);

    // RC-01/02/07: saturated background cannot consume the reserve; interactive bypasses it.
    await register(`${domain}-bg1`, `${domain}-a`, "A");
    const [bg] = await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]); assert.ok(bg.reservation_id);
    await register(`${domain}-interactive`, `${domain}-interactive`, "I");
    const [interactive] = await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]); assert.equal(interactive.logical_work_id, `${domain}-interactive`);
    await sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [interactive.reservation_id]);
    await sql.unsafe("SAVEPOINT duplicate_transport");
    await assert.rejects(() => sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [interactive.reservation_id]), /already authorized/);
    await sql.unsafe("ROLLBACK TO SAVEPOINT duplicate_transport");
    await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'test_complete')", [`${domain}-interactive`]);
    await register(`${domain}-too-much`, `${domain}-interactive`, "I2", { rpm: 1, tpm: 1, rpd: 1, concurrency: 2 });
    assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain])).length, 0);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [`${domain}-too-much`]))[0].count, 0);
    await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'test_cleanup')", [`${domain}-too-much`]);

    // RC-03/04: durable keys rotate A/B/C; a late lane rebases rather than inheriting idle-credit.
    await sql.unsafe("UPDATE bridge.provider_work_reservation SET state='released',released_at=now() WHERE logical_work_id IN ($1,$2)", [`${domain}-bg1`, `${domain}-interactive`]);
    await sql.unsafe("UPDATE bridge.provider_work_attempt SET state='terminal',terminal_reason='done' WHERE logical_work_id IN ($1,$2)", [`${domain}-bg1`, `${domain}-interactive`]);
    await register(`${domain}-a2`, `${domain}-a`, "A"); await register(`${domain}-a3`, `${domain}-a`, "A2"); await register(`${domain}-b1`, `${domain}-b`, "B"); await register(`${domain}-c1`, `${domain}-c`, "C");
    const turns: string[] = []; for (let i = 0; i < 4; i++) { const [row] = await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]); turns.push(row.logical_work_id); await sql.unsafe("UPDATE bridge.provider_work_reservation SET state='released',released_at=now() WHERE reservation_id=$1", [row.reservation_id]); await sql.unsafe("UPDATE bridge.provider_work_attempt SET state='terminal',terminal_reason='done' WHERE logical_work_id=$1", [row.logical_work_id]); }
    assert.ok(turns.some((id) => id.endsWith("b1")) && turns.some((id) => id.endsWith("c1")), `light lanes must not starve behind A: ${turns.join(",")}`);
    const [late] = await sql.unsafe("SELECT virtual_usage > 0 AS rebased FROM bridge.provider_admission_lane_state WHERE quota_domain_id=$1 AND process_id=$2", [domain, `${domain}-b`]); assert.equal(late.rebased, true);

    // RC-05/06/08: commit produces reservation/state/job together; same fence cannot double-send.
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='bridge-provider-admitted-execution-v1' AND data->>'logicalWorkId'=$1", [`${domain}-interactive`]))[0].count, 1);
    await register(`${domain}-expired`, `${domain}-interactive`, "expired", { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, new Date(Date.now() - 1_000).toISOString());
    assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain])).length, 0);
    await sql.unsafe("ROLLBACK");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id LIKE $1", [`${domain}%`]))[0].count, 0, "rollback leaves no admitted dispatch");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});
