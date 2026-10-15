import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-005-04 publishes immutable desired profiles with atomic versioned cutover", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const admin = postgres(databaseUrl!, { max: 1 }); const bridge = postgres(bridgeUrl.toString(), { max: 1 }); const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const domain = `desired-profile-${Date.now()}`;
  const profile = (version: string, capacityVersion: string, effectiveFrom: string) => bridge.unsafe(
    "INSERT INTO bridge.desired_admission_profile (quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES ($1,$2,$3,'planner-v1',$4,jsonb_build_object('quotaDomainId',$1::text,'profileVersion',$2::text,'providerCapacityProfileVersion',$3::text,'plannerVersion','planner-v1'))",
    [domain, version, capacityVersion, effectiveFrom],
  );
  const input = (version: string) => bridge.unsafe(
    "INSERT INTO bridge.desired_admission_profile_input (quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES ($1,$2,$1,'v1',$1,'v1')",
    [domain, version],
  );
  try {
    await bridge.unsafe("BEGIN");
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile (quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES ($1,'capacity-v1','account','[{\"routeId\":\"route-a\",\"providerId\":\"anoman\"}]','{}','{}','quota-v1','provider_docs','provider-docs://limits','v1',now(),now()), ($1,'capacity-v2','account','[{\"routeId\":\"route-a\",\"providerId\":\"anoman\"}]','{}','{}','quota-v2','operator_config','operator://limits','v2',now(),now() + interval '1 hour')", [domain]);
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile (workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES ($1,'v1',true,'[\"semantic\"]','{}','{}','quota-v1','{}','{}')", [domain]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile (process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES ($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',false,'[]',$1,'v1')", [domain]);
    await profile("plan-v1", "capacity-v1", "2026-10-15T00:00:00.000Z"); await input("plan-v1");
    const [first] = await bridge.unsafe("SELECT * FROM bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    assert.equal(first.activation_revision, "1");
    const [resolvedFirst] = await bridge.unsafe("SELECT * FROM bridge.resolve_active_desired_admission_profile($1)", [domain]);
    assert.deepEqual({ version: resolvedFirst.desired_profile_version, revision: resolvedFirst.activation_revision, capacity: resolvedFirst.provider_capacity_profile_version }, { version: "plan-v1", revision: "1", capacity: "capacity-v1" });
    await bridge.unsafe("SAVEPOINT immutable_profile");
    await assert.rejects(() => bridge.unsafe("UPDATE bridge.desired_admission_profile SET planner_version='changed' WHERE quota_domain_id=$1 AND profile_version='plan-v1'", [domain]), /immutable/);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT immutable_profile");
    await bridge.unsafe("SAVEPOINT missing_profile");
    await assert.rejects(() => bridge.unsafe("SELECT * FROM bridge.activate_desired_admission_profile($1,'missing')", [domain]), /missing/);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT missing_profile");
    await bridge.unsafe("SAVEPOINT missing_capacity");
    await assert.rejects(() => profile("invalid-plan", "missing-capacity", "2026-10-15T02:00:00.000Z"), /foreign key/i);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT missing_capacity");
    assert.equal((await bridge.unsafe("SELECT desired_profile_version FROM bridge.active_desired_admission_profile WHERE quota_domain_id=$1", [domain]))[0].desired_profile_version, "plan-v1");
    await profile("plan-v2", "capacity-v2", "2026-10-15T01:00:00.000Z"); await input("plan-v2");
    const [beforeJobs] = await admin.unsafe("SELECT count(*)::integer AS count FROM pgboss.job");
    const [second] = await bridge.unsafe("SELECT * FROM bridge.activate_desired_admission_profile($1,'plan-v2')", [domain]);
    assert.equal(second.activation_revision, "2");
    assert.deepEqual(
      Array.from(await bridge.unsafe("SELECT desired_profile_version,activation_revision,effective_from FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1 ORDER BY activation_revision", [domain])),
      [{ desired_profile_version: "plan-v1", activation_revision: "1", effective_from: new Date("2026-10-15T00:00:00.000Z") }, { desired_profile_version: "plan-v2", activation_revision: "2", effective_from: new Date("2026-10-15T01:00:00.000Z") }],
    );
    const [afterJobs] = await admin.unsafe("SELECT count(*)::integer AS count FROM pgboss.job");
    assert.equal(afterJobs.count, beforeJobs.count, "publication must not enqueue provider work");
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.resolve_active_desired_admission_profile($1)", [domain]), /permission denied/i);
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([admin.end(), bridge.end(), atlas.end()]);
  }
});
