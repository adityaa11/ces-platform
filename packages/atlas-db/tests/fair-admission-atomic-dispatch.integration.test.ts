import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-02 CFC closes fair admission and atomic dispatch oracles", { skip: !databaseUrl }, async () => {
  const url = new URL(databaseUrl!); url.username = "agents_bridge"; url.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(url.toString(), { max: 1 });
  const domain = `fair-cfc-${Date.now()}`;
  const route = `${domain}-route`;
  const profile = { usableGlobalCapacity: { rpm: 4, tpm: 40, rpd: 4, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 3, tpm: 30, rpd: 3, concurrency: 1 }, backgroundLanes: [{ processId: `${domain}-a`, profileVersion: "v1", normalizedWeight: .5 }, { processId: `${domain}-b`, profileVersion: "v1", normalizedWeight: .25 }, { processId: `${domain}-c`, profileVersion: "v1", normalizedWeight: .25 }] };
  const physicalWindows = { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 4 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 40 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 4 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 2 } };
  const future = () => new Date(Date.now() + 60_000).toISOString();
  const vector = (dimension: string, value: number) => ({ rpm: 0, tpm: 0, rpd: 0, concurrency: 0, [dimension]: value });
  const addProcess = async (id: string, serviceClass: "interactive" | "background") => {
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [id]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','cap',$2,'{}','{}',true,$3,$1,'v1')", [id, serviceClass, [route]]);
  };
  const register = async (id: string, process: string, key: string, envelope = { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, deadline = future(), attempt = 1) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,$2,$3,$4,'v1',$5,$6,'plan-v1',1,$7,$7)", [id, attempt, domain, process, key, envelope, deadline]);
    await sql.unsafe("SELECT bridge.bind_provider_work_route($1,$2,$3)", [id, attempt, route]);
  };
  const admit = async () => { const rows = await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]); assert.equal(rows.length, 1); return rows[0]; };
  const decision = async (id: string, attempt = 1) => (await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,$2)", [id, attempt]))[0];
  const finish = async (row: { reservation_id: string; logical_work_id: string; attempt_number: number }, sent = false) => {
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{
      feedbackId: `${row.logical_work_id}:${row.attempt_number}:finish`, reservationId: row.reservation_id,
      attemptId: `${row.logical_work_id}:${row.attempt_number}`, routeId: route, quotaDomainId: domain,
      desiredProfileVersion: "plan-v1", qualificationVersion: "qualification-v1", observationSource: "qualified_adapter",
      observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: sent ? "terminal_confirmed" : "definitely_not_sent",
      ...(sent ? { usage: { rpm: 1, tpm: 1, rpd: 1 } } : {}),
    }]);
  };
  const dispatches = async (id: string, attempt = 1) => (await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1 AND attempt_number=$2", [id, attempt]))[0].count;
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','account',$2,'{}',$3,'quota','provider_docs','ref','v1',now(),now())", [domain, [{ routeId: route }], physicalWindows]);
    for (const [id, service] of [[`${domain}-interactive`, "interactive"], [`${domain}-a`, "background"], [`${domain}-b`, "background"], [`${domain}-c`, "background"]] as const) await addProcess(id, service);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','planner',now(),$2)", [domain, profile]);
    for (const process of [`${domain}-interactive`, `${domain}-a`, `${domain}-b`, `${domain}-c`]) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$2,'v1')", [domain, process]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'account','fixture-model-v1','adapter-v1','qualification://fixture','qualification-v1','cap')", [route, domain]);

    // CK-002.a: each capacity dimension independently denies one more request with zero dispatch.
    for (const [dimension, limit] of Object.entries(profile.usableGlobalCapacity)) {
      const first = `${domain}-full-${dimension}`, denied = `${domain}-denied-${dimension}`;
      await register(first, `${domain}-interactive`, `I-${dimension}`, vector(dimension, limit));
      const accepted = await decision(first); assert.equal(accepted.decision, "admitted");
      await register(denied, `${domain}-interactive`, `I-denied-${dimension}`, vector(dimension, 1));
      assert.equal((await decision(denied)).decision, "unavailable"); assert.equal(await dispatches(denied), 0);
      await finish(accepted); await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'capacity_cleanup')", [denied]);
    }
    // Background has a large backlog but can consume only its capacity; the full protected interactive vector remains usable.
    for (let i = 0; i < 5; i++) await register(`${domain}-backlog-${i}`, `${domain}-a`, `backlog-${i}`);
    const background = await admit(); await register(`${domain}-protected`, `${domain}-interactive`, "protected");
    const protectedResult = await decision(`${domain}-protected`); assert.equal(protectedResult.decision, "admitted");
    for (let i = 1; i < 5; i++) assert.equal(await dispatches(`${domain}-backlog-${i}`), 0);
    await finish(background); await finish(protectedResult); for (let i = 1; i < 5; i++) await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'backlog_cleanup')", [`${domain}-backlog-${i}`]);

    // CK-001.a: an idle lane is persisted at the current domain baseline before its reactivated selection is used.
    await register(`${domain}-a-first`, `${domain}-a`, "A-old"); await finish(await admit());
    await register(`${domain}-b-advance`, `${domain}-b`, "B-advance"); await finish(await admit());
    const [{ virtual_time: baseline }] = await sql.unsafe("SELECT virtual_time FROM bridge.provider_admission_domain_state WHERE quota_domain_id=$1", [domain]);
    await register(`${domain}-a-reactivated`, `${domain}-a`, "A-reactivated"); await register(`${domain}-b-competing`, `${domain}-b`, "B-competing");
    const reactivated = await admit(); assert.equal(reactivated.logical_work_id, `${domain}-a-reactivated`);
    const [{ virtual_usage }] = await sql.unsafe("SELECT virtual_usage FROM bridge.provider_admission_lane_state WHERE quota_domain_id=$1 AND process_id=$2", [domain, `${domain}-a`]);
    assert.ok(Number(virtual_usage) >= Number(baseline)); await finish(reactivated); await finish(await admit());

    // CK-002.b: key rotation, weighted heavy/light fairness, elastic borrowing, and fitting work against an unfit competitor.
    for (const [id, process, key, envelope] of [["a-large", "a", "A-large", { rpm: 1, tpm: 20, rpd: 1, concurrency: 1 }], ["a-small", "a", "A-small", { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }], ["b-small", "b", "B-small", { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }], ["c-small", "c", "C-small", { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]] as const) await register(`${domain}-${id}`, `${domain}-${process}`, key, envelope);
    const turns: string[] = []; for (let i = 0; i < 4; i++) { const row = await admit(); turns.push(row.logical_work_id); await finish(row); }
    for (const id of ["a-large", "a-small", "b-small", "c-small"]) assert.ok(turns.some((turn) => turn.endsWith(id)), `fairness omitted ${id}: ${turns.join(",")}`);
    await register(`${domain}-sole`, `${domain}-a`, "sole", { rpm: 3, tpm: 30, rpd: 3, concurrency: 1 }); const sole = await admit(); assert.equal(sole.logical_work_id, `${domain}-sole`); await finish(sole);
    await register(`${domain}-unfit`, `${domain}-a`, "unfit", { rpm: 4, tpm: 1, rpd: 1, concurrency: 1 }); await register(`${domain}-fitting`, `${domain}-b`, "fitting"); const fitting = await admit(); assert.equal(fitting.logical_work_id, `${domain}-fitting`); await finish(fitting); await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'unfit_cleanup')", [`${domain}-unfit`]);

    // CK-002.c: injected failure at each atomic step leaves no reservation, job, or dispatch behind.
    for (const [name, table, operation] of [["attempt", "bridge.provider_work_attempt", "UPDATE"], ["reservation", "bridge.provider_work_reservation", "INSERT"], ["job", "pgboss.job", "INSERT"], ["dispatch", "bridge.provider_work_dispatch", "INSERT"]]) {
      const id = `${domain}-fault-${name}`; await register(id, `${domain}-interactive`, `fault-${name}`); await sql.unsafe(`SAVEPOINT fault_${name}`);
      await sql.unsafe("CREATE OR REPLACE FUNCTION pg_temp.fail_bss_cfc() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected CFC failure'; END; $$");
      await sql.unsafe(`CREATE TRIGGER fail_bss_cfc_${name} BEFORE ${operation} ON ${table} FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_bss_cfc()`);
      await assert.rejects(() => decision(id), /injected CFC failure/); await sql.unsafe(`ROLLBACK TO SAVEPOINT fault_${name}`);
      const [counts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) AS reservations,(SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) AS dispatches,(SELECT count(*)::int FROM pgboss.job WHERE data->>'logicalWorkId'=$1) AS jobs", [id]);
      assert.deepEqual(counts, { reservations: 0, dispatches: 0, jobs: 0 }); await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'fault_cleanup')", [id]);
    }
    // A worker replay cannot transport twice, and retry needs a new explicit attempt and reservation.
    const retry = `${domain}-retry`; await register(retry, `${domain}-interactive`, "retry"); const first = await decision(retry); await sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [first.reservation_id]); await sql.unsafe("SAVEPOINT duplicate_transport"); await assert.rejects(() => sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [first.reservation_id]), /already authorized/); await sql.unsafe("ROLLBACK TO SAVEPOINT duplicate_transport"); assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain])).length, 0);
    await finish(first, true);
    await register(retry, `${domain}-interactive`, "retry", undefined, future(), 2); const second = await decision(retry, 2); assert.notEqual(second.reservation_id, first.reservation_id); await sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [second.reservation_id]); assert.equal(await dispatches(retry), 1); assert.equal(await dispatches(retry, 2), 1); await finish(second, true);

    // CK-002.d: caller-facing bounded decisions and all protected-capacity negative cases have zero late transport.
    const expired = `${domain}-expired`; await register(expired, `${domain}-interactive`, "expired", undefined, new Date(Date.now() - 1_000).toISOString()); assert.equal((await decision(expired)).decision, "deadline_expired");
    const cancelled = `${domain}-cancelled`; await register(cancelled, `${domain}-interactive`, "cancelled"); await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'caller_cancelled')", [cancelled]); assert.equal((await decision(cancelled)).decision, "unavailable");
    const forged = `${domain}-forged`; await register(forged, `${domain}-a`, "forged"); assert.equal((await sql.unsafe("SELECT service_class FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [forged]))[0].service_class, "background"); assert.equal((await decision(forged)).decision, "unavailable"); await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'forged_cleanup')", [forged]);
    const fullBackground = `${domain}-full-background`; await register(fullBackground, `${domain}-a`, "full", { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }); const fullBackgroundRow = await admit(); const fullConcurrency = `${domain}-interactive-full-concurrency`; await register(fullConcurrency, `${domain}-interactive`, "full-concurrency", { rpm: 1, tpm: 1, rpd: 1, concurrency: 2 }); assert.equal((await decision(fullConcurrency)).decision, "unavailable"); await finish(fullBackgroundRow);
    const stale = `${domain}-stale`; await register(stale, `${domain}-interactive`, "stale"); await sql.unsafe("UPDATE bridge.provider_work_attempt SET activation_revision=999 WHERE logical_work_id=$1", [stale]); assert.equal((await decision(stale)).decision, "unavailable");
    for (const id of [expired, cancelled, forged, fullConcurrency, stale]) assert.equal(await dispatches(id), 0, `${id} must have zero late transport`);
    await sql.unsafe("ROLLBACK"); assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id LIKE $1", [`${domain}%`]))[0].count, 0);
  } finally { await sql.end(); }
});
