import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("Scope 01B fresh installer leaves the BSS authority boundary unconfigured and least-privileged", { skip: !databaseUrl }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  try {
    const [roles] = await admin.unsafe(`
      SELECT
        (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'atlas') AS atlas_can_login,
        (SELECT rolsuper FROM pg_roles WHERE rolname = 'atlas') AS atlas_is_superuser,
        (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'atlas_app') AS atlas_app_can_login,
        (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'agents_bridge') AS agents_bridge_can_login
    `);
    assert.deepEqual(roles, {
      atlas_can_login: false,
      atlas_is_superuser: false,
      atlas_app_can_login: true,
      agents_bridge_can_login: true,
    });

    const [seed] = await admin.unsafe(`
      SELECT quota_domain_id, profile_version, provider_account_alias, associated_routes
      FROM bridge.provider_capacity_profile
    `);
    assert.deepEqual(seed, {
      quota_domain_id: "anoman-shared-prod",
      profile_version: "2026-10-18.1",
      provider_account_alias: "anoman-atlas-free-account",
      associated_routes: [{ routeId: "anoman-semantic", providerId: "anoman" }],
    });

    const [counts] = await admin.unsafe(`
      SELECT
        (SELECT count(*)::int FROM bridge.provider_enforcement_policy_approval) AS approvals,
        (SELECT count(*)::int FROM bridge.provider_enforcement_policy) AS policies,
        (SELECT count(*)::int FROM bridge.provider_enforcement_policy_revocation) AS revocations,
        (SELECT count(*)::int FROM bridge.qualified_provider_route_authority) AS route_authorities,
        (SELECT count(*)::int FROM bridge.provider_process_profile) AS process_profiles,
        (SELECT count(*)::int FROM bridge.workload_envelope_profile) AS workload_profiles,
        (SELECT count(*)::int FROM bridge.desired_admission_profile) AS desired_profiles,
        (SELECT count(*)::int FROM bridge.calculated_class_process_allocation) AS allocations,
        (SELECT count(*)::int FROM bridge.desired_admission_profile_candidate) AS candidates,
        (SELECT count(*)::int FROM bridge.desired_admission_profile_activation) AS activations,
        (SELECT count(*)::int FROM bridge.active_desired_admission_profile) AS active_profiles,
        (SELECT count(*)::int FROM bridge.provider_work_attempt) AS work_attempts,
        (SELECT count(*)::int FROM bridge.provider_work_reservation) AS reservations
    `);
    assert.deepEqual(counts, {
      approvals: 0, policies: 0, revocations: 0, route_authorities: 0,
      process_profiles: 0, workload_profiles: 0, desired_profiles: 0,
      allocations: 0, candidates: 0, activations: 0, active_profiles: 0,
      work_attempts: 0, reservations: 0,
    });

    const owners = await admin.unsafe(`
      SELECT c.relname, pg_get_userbyid(c.relowner) AS owner
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'bridge'
        AND c.relname IN ('qualified_provider_route_authority', 'calculated_class_process_allocation', 'desired_admission_profile_route_binding_v2', 'desired_admission_profile_candidate')
      ORDER BY c.relname
    `);
    assert.deepEqual(Array.from(owners), [
      { relname: "calculated_class_process_allocation", owner: "atlas" },
      { relname: "desired_admission_profile_candidate", owner: "atlas" },
      { relname: "desired_admission_profile_route_binding_v2", owner: "atlas" },
      { relname: "qualified_provider_route_authority", owner: "atlas" },
    ]);

    const functions = await admin.unsafe(`
      SELECT p.proname, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS security_definer
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'bridge'
        AND p.proname IN ('publish_qualified_provider_route_authority', 'publish_shared_domain_calculated_desired_admission_profile', 'activate_desired_admission_profile')
      ORDER BY p.proname
    `);
    assert.deepEqual(Array.from(functions), [
      { proname: "activate_desired_admission_profile", owner: "agents_bridge", security_definer: false },
      { proname: "publish_qualified_provider_route_authority", owner: "atlas", security_definer: true },
      { proname: "publish_shared_domain_calculated_desired_admission_profile", owner: "atlas", security_definer: true },
    ]);

    const [privileges] = await admin.unsafe(`
      SELECT
        has_table_privilege('agents_bridge', 'bridge.qualified_provider_route_authority', 'INSERT') AS bridge_can_insert_route_authority,
        has_table_privilege('agents_bridge', 'bridge.calculated_class_process_allocation', 'INSERT') AS bridge_can_insert_allocation,
        has_function_privilege('agents_bridge', 'bridge.publish_qualified_provider_route_authority(text,text,text,text,text,text,text,text)', 'EXECUTE') AS bridge_can_publish_route_authority,
        has_function_privilege('agents_bridge', 'bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamp with time zone,jsonb,jsonb,jsonb,jsonb)', 'EXECUTE') AS bridge_can_publish_candidate
    `);
    assert.deepEqual(privileges, {
      bridge_can_insert_route_authority: false,
      bridge_can_insert_allocation: false,
      bridge_can_publish_route_authority: true,
      bridge_can_publish_candidate: true,
    });

    await assert.rejects(
      () => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy('anoman-shared-prod','2026-10-18.1','anoman-semantic')"),
      /authorized enforcement policy is missing or stale/,
    );
    const [snapshot] = await bridge.unsafe("SELECT bridge.read_capacity_planning_snapshot('anoman-shared-prod','missing','v1','anoman-semantic','background',false,1,1,1,true) AS value");
    assert.deepEqual(snapshot.value, {
      apiVersion: "CapacityPlanningSnapshot/v2",
      status: "stale",
      reason: "calculated_candidate_missing",
      readIsNotAdmissionPermit: true,
    });
  } finally {
    await Promise.all([admin.end(), bridge.end()]);
  }
});
