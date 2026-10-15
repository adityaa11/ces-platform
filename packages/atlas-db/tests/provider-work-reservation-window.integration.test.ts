import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-01 persists idempotent work, fenced reservations, exact windows, cancellation and deduplicated wakeups", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 }); const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const domain = `provider-work-${Date.now()}`;
  const work = (logicalWorkId: string, attempt: number, deadline: string | null = null) => bridge.unsafe(
    "SELECT (bridge.register_provider_work_attempt($1,$2,$3,$3,'v1','fairness-a','{}',$4,1,$5,NULL)).*",
    [logicalWorkId, attempt, domain, "plan-v1", deadline],
  );
  try {
    await bridge.unsafe("BEGIN");
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile (quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES ($1,'capacity-v1','account','[{\"routeId\":\"route-a\"}]','{}','{\"requests\":{\"kind\":\"fixed\"}}','quota-v1','provider_docs','provider-docs://limits','v1',now(),now())", [domain]);
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile (workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES ($1,'v1',true,'[\"chat\"]','{}','{}','quota-v1','{}','{}')", [domain]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile (process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES ($1,'v1','chat','atlas.chat.respond','interactive','{}','{}',true,'[]',$1,'v1')", [domain]);
    await bridge.unsafe("INSERT INTO bridge.desired_admission_profile (quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES ($1,'plan-v1','capacity-v1','planner-v1',now(),'{}')", [domain]);
    await bridge.unsafe("INSERT INTO bridge.desired_admission_profile_input (quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES ($1,'plan-v1',$1,'v1',$1,'v1')", [domain]);
    await bridge.unsafe("SELECT * FROM bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);

    const deadline = new Date(Date.now() + 60_000).toISOString();
    await work("interactive-1", 1, deadline); await work("interactive-1", 1, deadline);
    assert.equal((await bridge.unsafe("SELECT count(*)::integer AS count FROM bridge.provider_work_attempt WHERE logical_work_id='interactive-1'"))[0].count, 1);
    const [registered] = await bridge.unsafe("SELECT state,admission_deadline_at > now() AS deadline_is_future,cancellation_requested_at IS NULL AS not_cancelled,(state <> 'waiting' OR (admission_deadline_at IS NOT NULL AND admission_deadline_at <= now()) OR cancellation_requested_at IS NOT NULL) AS blocked FROM bridge.provider_work_attempt WHERE logical_work_id='interactive-1'");
    assert.deepEqual({ state: registered.state, deadlineIsFuture: registered.deadline_is_future, notCancelled: registered.not_cancelled, blocked: registered.blocked }, { state: "waiting", deadlineIsFuture: true, notCancelled: true, blocked: false });
    const [reservationResult] = await bridge.unsafe("SELECT row_to_json(bridge.reserve_provider_work_attempt('interactive-1',1)) AS reservation");
    assert.equal(reservationResult.reservation.desired_profile_version, "plan-v1");
    await bridge.unsafe("SAVEPOINT duplicate_reservation");
    await assert.rejects(() => bridge.unsafe("SELECT bridge.reserve_provider_work_attempt('interactive-1',1)"), /not reservable|live reservation/);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT duplicate_reservation");
    await bridge.unsafe("SELECT bridge.mark_provider_work_transport_may_have_started('interactive-1',1)");
    assert.equal((await bridge.unsafe("SELECT bridge.cancel_provider_work_attempt('interactive-1',1,'caller_cancelled') AS result"))[0].result, "transport_usage_remains_unknown");
    assert.equal((await bridge.unsafe("SELECT state FROM bridge.provider_work_reservation WHERE logical_work_id='interactive-1'"))[0].state, "consumed_unknown");

    await work("interactive-2", 1, deadline);
    assert.equal((await bridge.unsafe("SELECT bridge.cancel_provider_work_attempt('interactive-2',1,'expired') AS result"))[0].result, "terminal_without_reservation");
    assert.equal((await bridge.unsafe("SELECT count(*)::integer AS count FROM bridge.provider_work_reservation WHERE logical_work_id='interactive-2'"))[0].count, 0);
    await bridge.unsafe("SAVEPOINT expired_reservation");
    await assert.rejects(() => bridge.unsafe("SELECT bridge.reserve_provider_work_attempt('interactive-2',1)"), /not reservable/);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT expired_reservation");

    await bridge.unsafe("INSERT INTO bridge.provider_quota_window_state (quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state) VALUES ($1,'plan-v1',1,'capacity-v1','requests','{\"kind\":\"fixed\"}','{\"remaining\":4}')", [domain]);
    const [window] = await bridge.unsafe("SELECT reset_semantics_known,reset_at,window_state FROM bridge.provider_quota_window_state WHERE quota_domain_id=$1", [domain]);
    assert.deepEqual({ known: window.reset_semantics_known, reset: window.reset_at, state: window.window_state }, { known: false, reset: null, state: { remaining: 4 } });
    await bridge.unsafe("SAVEPOINT unknown_reset");
    await assert.rejects(() => bridge.unsafe("UPDATE bridge.provider_quota_window_state SET reset_at=now() WHERE quota_domain_id=$1", [domain]), /check constraint/i);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT unknown_reset");

    await bridge.unsafe("SELECT * FROM bridge.request_provider_work_wakeup($1,'window:requests',now() + interval '5 minutes','plan-v1',1)", [domain]);
    await bridge.unsafe("SELECT * FROM bridge.request_provider_work_wakeup($1,'window:requests',now() + interval '10 minutes','plan-v1',1)", [domain]);
    assert.equal((await bridge.unsafe("SELECT count(*)::integer AS count FROM bridge.provider_work_wakeup_request WHERE quota_domain_id=$1", [domain]))[0].count, 1);
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.provider_work_attempt"), /permission denied/i);
    await assert.rejects(() => atlas.unsafe("SELECT bridge.reserve_provider_work_attempt('interactive-1',1)"), /permission denied/i);
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([bridge.end(), atlas.end()]);
  }
});
