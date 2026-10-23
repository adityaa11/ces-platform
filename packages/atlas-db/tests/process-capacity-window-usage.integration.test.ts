import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-014-04-01 derives exact per-process window usage from the reservation ledger", { skip: !databaseUrl }, async () => {
  const url = new URL(databaseUrl!);
  url.username = "agents_bridge";
  url.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(url.toString(), { max: 1 });
  const domain = `process-window-usage-${Date.now()}`;
  const route = `${domain}-route`;
  const processId = `${domain}-process`;
  const workloadId = `${domain}-workload`;
  const envelope = { rpm: 1, tpm: 10, rpd: 999_999, concurrency: 1 };
  const profile = {
    usableGlobalCapacity: { rpm: 20, tpm: 200, concurrency: 25 },
    hardInteractiveReserve: { rpm: 1, tpm: 1, concurrency: 1 },
    backgroundCapacity: { rpm: 19, tpm: 199, concurrency: 24 },
    backgroundLanes: [{ processId, profileVersion: "v1", normalizedWeight: 1 }],
  };
  const windows = {
    rpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } },
    tpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } },
    rpd: { kind: "unknown" },
    concurrency: { kind: "fixed", windowSeconds: 60 },
  };
  const read = async () => sql.unsafe("SELECT * FROM bridge.read_process_capacity_window_usage_v1($1)", [domain]);
  const feedback = (id: string, reservationId: string, disposition: "may_have_started" | "terminal_confirmed", usage?: object) => ({
    feedbackId: `${id}-feedback`, reservationId, attemptId: `${id}:1`, routeId: route, quotaDomainId: domain,
    desiredProfileVersion: "plan-v1", qualificationVersion: "qualified", observationSource: "qualified_adapter",
    observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: disposition,
    operationalOutcome: disposition === "terminal_confirmed" ? "success" : "provider_failure", ...(usage ? { usage } : {}),
  });
  const admit = async (id: string, attempt = 1) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,$2,$3,$4,'v1','fixture',$5::jsonb,'plan-v1',1,NULL,now()+interval '1 hour')", [id, attempt, domain, processId, envelope]);
    await sql.unsafe("SELECT bridge.bind_provider_work_route($1,$2,$3)", [id, attempt, route]);
    const [result] = await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,$2,'background')", [id, attempt]);
    assert.equal(result.decision, "admitted");
    return result.reservation_id as string;
  };

  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','anoman',$2::jsonb,$3::jsonb,$4::jsonb,'quota','provider_api','fixture','v1',now(),now())", [domain, [{ routeId: route, providerId: "anoman", modelOrProcessorId: "fixture-model", adapterVersion: "adapter", qualificationRef: "qualification://fixture", qualificationVersion: "qualified", capability: "atlas.semantic.extract" }], { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 200 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } }, windows]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v1',$3,'policy','v1',$4::jsonb,'fixture',now())", [`${domain}-rpd-approval`, domain, route, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v1',$2,'policy','v1',$3,$4::jsonb,now())", [domain, route, `${domain}-rpd-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${domain}-rpd-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota','{}','{}')", [workloadId]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',true,$2::jsonb,$3,'v1')", [processId, [route], workloadId]);
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'anoman','fixture-model','adapter','qualification://fixture','qualified','atlas.semantic.extract')", [route, domain]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2::jsonb)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, processId, workloadId]);
    const [effective] = await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v1',$2) AS policy", [domain, route]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v1','cap-v1',$2,'policy','v1',$3::jsonb)", [domain, route, effective.policy]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);

    const completed = `${domain}-completed`;
    const completedReservation = await admit(completed);
    let rows = await read();
    assert.deepEqual(rows.map((row) => row.dimension_id), ["concurrency", "rpm", "tpm"], "WCA-15 exclusion produces no RPD process or provider-window row");
    assert.ok(rows.every((row) => row.api_version === "ProcessCapacityWindowUsage/v1" && row.process_id === processId && row.process_profile_version === "v1" && row.desired_profile_version === "plan-v1" && String(row.activation_revision) === "1" && row.reservation_id === completedReservation && row.window_is_open), "every read-derived row retains reservation, exact process/profile, plan, window, and dimension identity");
    await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [completedReservation]);
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [feedback(completed, completedReservation, "terminal_confirmed", { tpm: 12 })]);
    rows = await read();
    assert.deepEqual(rows.filter((row) => row.reservation_id === completedReservation).map((row) => ({ dimension: row.dimension_id, held: row.held_units, spent: row.spent_units, state: row.state })), [
      { dimension: "concurrency", held: "0", spent: "0", state: "settled" }, { dimension: "rpm", held: "0", spent: "1", state: "settled" }, { dimension: "tpm", held: "0", spent: "12", state: "settled" },
    ], "completion retains spent TPM until the physical window resets and releases only the concurrency seat");

    const cancelled = `${domain}-cancelled`;
    const cancelledReservation = await admit(cancelled);
    assert.equal((await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'fixture_cancel') AS result", [cancelled]))[0].result, "released_before_transport");
    assert.ok((await read()).filter((row) => row.reservation_id === cancelledReservation).every((row) => row.held_units === "0" && row.spent_units === "0" && row.state === "released"), "cancellation releases held usage through the authoritative lifecycle");

    const unknown = `${domain}-ack-loss`;
    const unknownReservation = await admit(unknown);
    await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [unknownReservation]);
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [feedback(unknown, unknownReservation, "may_have_started")]);
    assert.ok((await read()).filter((row) => row.reservation_id === unknownReservation).some((row) => row.dimension_id === "tpm" && row.held_units === "10" && row.spent_units === "0" && row.state === "held_unknown"), "ack loss conservatively retains unknown TPM usage");
    const retryReservation = await admit(unknown, 2);
    assert.notEqual(retryReservation, unknownReservation, "a retry receives a new reservation identity without rewriting the first attempt");

    const [reconciled] = await sql.unsafe("SELECT jsonb_object_agg(dimension_id,units) AS value FROM (SELECT dimension_id,sum(GREATEST(held_units,spent_units)) AS units FROM bridge.read_process_capacity_window_usage_v1($1) WHERE window_is_open GROUP BY dimension_id) usage", [domain]);
    const [domainUsage] = await sql.unsafe("SELECT bridge.current_provider_operational_usage($1,'cap-v1',ARRAY['rpm','tpm','concurrency']) AS value", [domain]);
    assert.deepEqual(reconciled.value, domainUsage.value, "process projection reconciles exactly to the existing domain held/spent ledger");
    await sql.unsafe("UPDATE bridge.provider_window_usage_ledger SET window_ends_at=clock_timestamp()-interval '1 second' WHERE reservation_id=$1", [completedReservation]);
    assert.ok((await read()).filter((row) => row.reservation_id === completedReservation).every((row) => !row.window_is_open), "window reset/expiry changes the read-derived eligibility without rewriting spent history");

    const [inventory] = await sql.unsafe("SELECT to_regclass('bridge.process_capacity_window_usage_v1') AS projection_table, (SELECT count(*)::int FROM pg_proc WHERE pronamespace='bridge'::regnamespace AND proname='read_process_capacity_window_usage_v1') AS readers, (SELECT count(*)::int FROM pg_trigger WHERE tgrelid='bridge.provider_window_usage_ledger'::regclass AND NOT tgisinternal AND tgname ILIKE '%process_capacity%') AS projection_triggers");
    assert.deepEqual(inventory, { projection_table: null, readers: 1, projection_triggers: 0 }, "the projection adds no table, writer, trigger, worker, counter, or second ledger");

    await sql.unsafe("SAVEPOINT missing_identity");
    await sql.unsafe("DELETE FROM bridge.provider_work_route_binding WHERE logical_work_id=$1 AND attempt_number=1", [unknown]);
    await assert.rejects(read, /missing, stale, or foreign authoritative identity/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT missing_identity");
    await sql.unsafe("SAVEPOINT foreign_identity");
    await sql.unsafe("UPDATE bridge.provider_window_usage_ledger SET quota_domain_id=$2 WHERE reservation_id=$1", [retryReservation, `${domain}-foreign`]);
    await assert.rejects(() => sql.unsafe("SELECT * FROM bridge.read_process_capacity_window_usage_v1($1)", [`${domain}-foreign`]), /missing, stale, or foreign authoritative identity/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT foreign_identity");
    await sql.unsafe("SAVEPOINT duplicate_identity");
    await assert.rejects(() => sql.unsafe("INSERT INTO bridge.provider_window_usage_ledger SELECT * FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 LIMIT 1", [retryReservation]), /duplicate key/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT duplicate_identity");
    assert.equal((await read()).length, 12, "negative identity checks leave no partial projection row");
  } finally {
    await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
