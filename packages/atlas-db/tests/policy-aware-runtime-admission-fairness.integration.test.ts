import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("RC-00605-03/04 admit only the policy-selected Anoman-like dimensions", { skip: !databaseUrl }, async () => {
  const suffix = `policy-runtime-${Date.now()}`;
  const domain = `${suffix}-domain`, route = `${suffix}-route`;
  const url = new URL(databaseUrl!); url.username = "agents_bridge"; url.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(url.toString(), { max: 1 });
  const dimensions = { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } };
  const profile = { usableGlobalCapacity: { rpm: 2, tpm: 20, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 10, concurrency: 1 }, backgroundCapacity: { rpm: 1, tpm: 10, concurrency: 1 }, backgroundLanes: [{ processId: `${suffix}-background-a`, profileVersion: "v1", normalizedWeight: 1 }, { processId: `${suffix}-background-b`, profileVersion: "v1", normalizedWeight: 1 }] };
  const future = () => new Date(Date.now() + 60_000).toISOString();
  const register = async (id: string, process: string, serviceClass: "background" | "interactive", envelope = { rpm: 1, tpm: 5, rpd: 999_999, concurrency: 1 }) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1',$4,$5::jsonb,'plan-v1',1,$6,$6)", [id, domain, process, `${id}-key`, envelope, future()]);
    await sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [id, route]);
    if (serviceClass === "interactive") return (await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [id]))[0];
    return (await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]))[0];
  };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,$3::jsonb,$4::jsonb,'quota','provider_api','fixture','v1',now(),now())", [domain, [{ routeId: route }], { rpm: { state: "known", value: 2 }, tpm: { state: "known", value: 20 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 2 } }, { rpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { kind: "unknown" }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v1',$3,'policy','v1',$4::jsonb,'fixture',now())", [`${suffix}-approval`, domain, route, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v1',$2,'policy','v1',$3,$4::jsonb,now())", [domain, route, `${suffix}-approval`, dimensions]);
    const effective = (await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v1',$2) AS policy", [domain, route]))[0].policy;
    for (const [id, service, capability] of [[`${suffix}-background-a`, "background", "atlas.semantic.extract"], [`${suffix}-background-b`, "background", "atlas.semantic.extract"], [`${suffix}-interactive`, "interactive", "atlas.semantic.extract"]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota','{}','{}')", [`${id}-workload`]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic',$2,$3,'{}','{}',true,$4::jsonb,$5,'v1')", [id, capability, service, [route], `${id}-workload`]);
    }
    await sql.unsafe("SELECT bridge.publish_qualified_provider_route_authority($1,'atlas.semantic.extract','adapter','qualified')", [route]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','planner',now(),$2::jsonb)", [domain, profile]);
    for (const id of [`${suffix}-background-a`, `${suffix}-background-b`, `${suffix}-interactive`]) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, id, `${id}-workload`]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v1','cap-v1',$2,'policy','v1',$3::jsonb)", [domain, route, effective]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    for (const dimension of ["rpm", "tpm", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}',true,now()+interval '1 hour')", [domain, dimension, { rpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);

    const read = (await sql.unsafe("SELECT bridge.read_runtime_capacity_constraint($1,$2,'v1',$3,'background') AS value", [domain, `${suffix}-background-a`, route]))[0].value;
    assert.equal(read.reason, "eligible_in_principle"); assert.deepEqual(read.effectiveDimensions, ["rpm", "tpm", "concurrency"]); assert.equal("rpd" in read.effectiveCapacity, false); assert.equal("rpd" in read.safeWindow, false);
    const background = (await sql.unsafe("SELECT bridge.admit_provider_work_admission_v1($1,$2,$3,'v1',$4,'background',$5,1,$6,'opaque-payload',$7,$8::jsonb) AS outcome", [
      `${suffix}-principal`, domain, `${suffix}-background-a`, route, `${suffix}-bg-a`, `${suffix}-bg-a-key`, "a".repeat(64), { requestResourceEnvelope: { rpm: 1, tpm: 5, rpd: 999_999, concurrency: 1 }, expectedEffectiveConstraintRevision: read.effectiveConstraintRevision },
    ]))[0].outcome;
    assert.equal(background.state, "dispatched_or_may_have_started", "the public ProviderWorkAdmission/v1 boundary admits policy-qualified work"); assert.ok(background.reservationId);
    const interactive = await register(`${suffix}-interactive`, `${suffix}-interactive`, "interactive"); assert.ok(interactive.reservation_id, "hard interactive reserve remains available while background borrows only its share");
    await register(`${suffix}-bg-b`, `${suffix}-background-b`, "background");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_dispatch WHERE logical_work_id=$1", [`${suffix}-bg-b`]))[0].count, 0, "saturated RPM/TPM/concurrency produces no send");
    const ledgers = await sql.unsafe("SELECT dimension_id FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [background.reservationId]);
    assert.deepEqual(ledgers.map((row) => row.dimension_id), ["concurrency", "rpm", "tpm"], "omitted RPD creates no fabricated runtime liability");
    await sql.unsafe("ROLLBACK");
  } finally { await sql.end(); }
});
