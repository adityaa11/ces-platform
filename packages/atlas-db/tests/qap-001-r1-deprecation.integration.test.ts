import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const sharedPublisher = "bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamp with time zone,jsonb,jsonb,jsonb,jsonb)";
const convergencePublisher = "bridge.publish_converged_desired_admission_profile(text,bigint,text,text,timestamp with time zone,jsonb,jsonb)";

test("BSS-QAP-001 R1 preserves publisher authority and permits ID-free rows", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const admin = postgres(databaseUrl!, { max: 1 });
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `qap-r1-${Date.now()}`;
  const route = `${domain}-route`;
  const processId = `${domain}-process`;
  const workloadId = `${domain}-workload`;
  const effectiveFrom = "2026-10-29 00:00:00+00";
  const limits = { rpm: { state: "known", value: 10 }, tpm: { state: "known", value: 1000 }, rpd: { state: "known", value: 100 }, concurrency: { state: "known", value: 10 } };
  const windows = { rpm: { kind: "fixed_window" }, tpm: { kind: "fixed_window" }, rpd: { kind: "fixed_window" } };
  const inputs = [{ processId, processProfileVersion: "v1", workloadId, workloadProfileVersion: "idfree-v1" }];
  const profile = { quotaDomainId: domain, providerCapacityProfileVersion: "idfree-v1", plannerVersion: "qap-r1", effectiveFrom };
  const allocation = { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "rpd", "concurrency"], processBaselines: { [processId]: { rpm: 10, tpm: 1000, rpd: 100, concurrency: 10 } } };
  try {
    const [catalog] = await admin.unsafe(`
      SELECT
        (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid=$1::regprocedure) AS convergence_owner,
        (SELECT prosecdef FROM pg_proc WHERE oid=$1::regprocedure) AS convergence_definer,
        (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid=$2::regprocedure) AS shared_owner,
        (SELECT prosecdef FROM pg_proc WHERE oid=$2::regprocedure) AS shared_definer,
        has_function_privilege('agents_bridge',$1::regprocedure,'EXECUTE') AS convergence_granted,
        has_function_privilege('agents_bridge',$2::regprocedure,'EXECUTE') AS shared_granted,
        has_function_privilege('public',$1::regprocedure,'EXECUTE') AS convergence_public,
        has_function_privilege('public',$2::regprocedure,'EXECUTE') AS shared_public,
        pg_get_functiondef($1::regprocedure) ILIKE '%pg_advisory_xact_lock%' AS convergence_keeps_lock,
        pg_get_functiondef($2::regprocedure) ILIKE '%derive_effective_enforcement_policy%' AS shared_keeps_effective_policy
    `, [convergencePublisher, sharedPublisher]);
    assert.deepEqual(catalog, {
      convergence_owner: "agents_bridge",
      convergence_definer: false,
      shared_owner: "atlas",
      shared_definer: true,
      convergence_granted: true,
      shared_granted: true,
      convergence_public: false,
      shared_public: false,
      convergence_keeps_lock: true,
      shared_keeps_effective_policy: true,
    });

    await bridge.unsafe("BEGIN");
    // R1-compatible rows omit the deprecated metadata altogether.
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'idfree-v1','fixture',$2::jsonb,$3::jsonb,$4::jsonb,'qualified_observation','fixture://idfree','v1',now(),now())", [domain, [{ routeId: route, providerId: "fixture", modelOrProcessorId: "fixture-model", adapterVersion: "v1", qualificationRef: "qualification://qap-r1", qualificationVersion: "v1", capability: "atlas.semantic.extract" }], limits, windows]);
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'idfree-v1',true,'[\"semantic\"]','{}','{}','{}','{}')", [workloadId]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',true,$2::jsonb,$3,'idfree-v1')", [processId, [route], workloadId]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'idfree-v1',$3,'qap-r1','v1','{}','fixture',now())", [`${domain}-approval`, domain, route]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'idfree-v1',$2,'qap-r1','v1',$3,$4::jsonb,$5::timestamptz)", [domain, route, `${domain}-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "enforced", limitSource: "provider" }, concurrency: { mode: "enforced", limitSource: "provider" } }, effectiveFrom]);
    const [authority] = await bridge.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'fixture','fixture-model','v1','qualification://qap-r1','v1','atlas.semantic.extract')", [route, domain]);

    const [shared] = await bridge.unsafe("SELECT * FROM bridge.publish_shared_domain_calculated_desired_admission_profile($1,NULL,'idfree-v1','qap-r1',$2::timestamptz,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb)", [domain, effectiveFrom, profile, inputs, [{ routeId: route, authorityVersion: String(authority.authority_version) }], allocation]);
    assert.equal(shared.status, "published");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1", [domain]))[0].count, 0, "the candidate publisher must retain its activation fence");
    await bridge.unsafe("SAVEPOINT shared_guard");
    await assert.rejects(
      () => bridge.unsafe("SELECT * FROM bridge.publish_shared_domain_calculated_desired_admission_profile($1,NULL,'idfree-v1','qap-r1',$2::timestamptz,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb)", [domain, effectiveFrom, profile, inputs, [{ routeId: route, authorityVersion: String(authority.authority_version) }], { ...allocation, effectiveMask: ["rpm"] }]),
      /different effective mask/i,
    );
    await bridge.unsafe("ROLLBACK TO SAVEPOINT shared_guard");

    const [converged] = await bridge.unsafe("SELECT * FROM bridge.publish_converged_desired_admission_profile($1,NULL,'idfree-v1','qap-r1',$2::timestamptz,$3::jsonb,$4::jsonb)", [domain, effectiveFrom, profile, inputs]);
    assert.deepEqual({ status: converged.status, revision: converged.activation_revision }, { status: "published", revision: "1" });
    await bridge.unsafe("SAVEPOINT convergence_guard");
    await assert.rejects(
      () => bridge.unsafe("SELECT * FROM bridge.publish_converged_desired_admission_profile($1,1,'missing','qap-r1',$2::timestamptz,$3::jsonb,$4::jsonb)", [domain, effectiveFrom, profile, inputs]),
      /qualified capacity profile.*missing/i,
    );
    await bridge.unsafe("ROLLBACK TO SAVEPOINT convergence_guard");
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([bridge.end(), admin.end()]);
  }
});
