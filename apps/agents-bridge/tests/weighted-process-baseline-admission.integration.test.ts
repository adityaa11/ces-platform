import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { bindProviderWorkRouteFromResolver } from "../src/provider-operational-runtime.ts";
import { createRouteRegistry } from "../src/route-registry.ts";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-014-04-02 atomically enforces a v2 process baseline and carries the complete authority tuple to claim", { skip: !databaseUrl }, async () => {
  // The immutable v2 plan tables are intentionally not writable by the
  // Bridge role.  This fixture uses the migration owner to seed a frozen plan,
  // then invokes the same SQL admission/claim authority the Bridge may call.
  const sql = postgres(databaseUrl!, { max: 1 });
  const suffix = `weighted-baseline-${Date.now()}`;
  const domain = suffix;
  const route = `${suffix}-route`;
  const processId = `${suffix}-process`;
  const workloadId = `${suffix}-workload`;
  const identity = { routeId: route, providerId: "anoman", modelOrProcessorId: "fixture-model", adapterVersion: "adapter-v2", qualificationRef: `qualification://${suffix}`, qualificationVersion: "qualified-v2", capability: "atlas.semantic.extract" as const };
  const resolver = createRouteRegistry([{ ...identity, workClass: "background", enabled: true }], "development", new Set(["anoman"]));
  const profile = { usableGlobalCapacity: { rpm: 10, tpm: 100, concurrency: 2 }, hardInteractiveReserve: { rpm: 2, tpm: 20, concurrency: 1 }, backgroundCapacity: { rpm: 8, tpm: 80, concurrency: 1 }, backgroundLanes: [{ processId, profileVersion: "v1", normalizedWeight: 1 }] };
  const allocation = { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], classAllocations: { background: { rpm: 8, tpm: 80, concurrency: 1 } }, processes: [{ processId, profileVersion: "v1", serviceClass: "background", baseline: { rpm: 2, tpm: 20, concurrency: 1 }, cap: { rpm: 2, tpm: 20, concurrency: 1 } }] };
  const exec = { executeSql: async (query: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(query, values as unknown[] | undefined) }) };
  const bind = (logicalWorkId: string) => bindProviderWorkRouteFromResolver(exec, resolver, { logicalWorkId, attemptNumber: 1 });
  const register = async (logicalWorkId: string, envelope: object) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4::jsonb,'plan-v2',1,NULL,clock_timestamp()+interval '1 hour')", [logicalWorkId, domain, processId, envelope]);
    await bind(logicalWorkId);
  };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v2','anoman',$2::jsonb,$3::jsonb,$4::jsonb,'quota','provider_api','fixture','v2',clock_timestamp(),clock_timestamp())", [domain, [identity], { rpm: { state: "known", value: 10 }, tpm: { state: "known", value: 100 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 2 } }, { rpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { kind: "unknown" }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v2',$3,'policy','v2',$4::jsonb,'fixture',clock_timestamp())", [`${suffix}-approval`, domain, route, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v2',$2,'policy','v2',$3,$4::jsonb,clock_timestamp())", [domain, route, `${suffix}-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota','{}','{}')", [workloadId]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic',$2,'background','{}','{}',true,$3::jsonb,$4,'v1')", [processId, identity.capability, [route], workloadId]);
    const [authority] = await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route, domain, identity.providerId, identity.modelOrProcessorId, identity.adapterVersion, identity.qualificationRef, identity.qualificationVersion, identity.capability]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v2','cap-v2','weighted-v2',clock_timestamp(),$2::jsonb)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v2',$2,'v1',$3,'v1')", [domain, processId, workloadId]);
    const [effective] = await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v2',$2) AS policy", [domain, route]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v2','cap-v2',$2,'policy','v2',$3::jsonb)", [domain, route, effective.policy]);
    await sql.unsafe("INSERT INTO bridge.calculated_class_process_allocation(quota_domain_id,desired_profile_version,allocation_version,effective_mask,allocation,allocation_fingerprint) VALUES($1,'plan-v2','v1',$2::jsonb,$3::jsonb,md5($3::jsonb::text))", [domain, allocation.effectiveMask, allocation]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_route_binding_v2(quota_domain_id,desired_profile_version,route_id,authority_version,provider_capacity_profile_version,effective_mask,allocation_version) VALUES($1,'plan-v2',$2,$3,'cap-v2',$4::jsonb,'v1')", [domain, route, authority.authority_version, allocation.effectiveMask]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_activation(quota_domain_id,activation_revision,desired_profile_version,effective_from) VALUES($1,1,'plan-v2',clock_timestamp())", [domain]);
    await sql.unsafe("INSERT INTO bridge.active_desired_admission_profile(quota_domain_id,desired_profile_version,activation_revision,effective_from) VALUES($1,'plan-v2',1,clock_timestamp())", [domain]);

    const admittedWork = `${suffix}-within-baseline`;
    await register(admittedWork, { rpm: 1, tpm: 10, concurrency: 1 });
    const [admitted] = await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [admittedWork]);
    assert.equal(admitted.decision, "admitted");
    const [reservationAuthority] = await sql.unsafe(`
      SELECT binding.authority_version, binding.selected_route_id, binding.provider_id,
        binding.model_or_processor_id, binding.adapter_version, binding.qualification_ref,
        binding.qualification_version, reservation.desired_profile_version
      FROM bridge.provider_work_reservation reservation
      JOIN bridge.provider_work_route_binding binding
        ON (binding.logical_work_id,binding.attempt_number)=(reservation.logical_work_id,reservation.attempt_number)
      WHERE reservation.reservation_id=$1`, [admitted.reservation_id]);
    assert.deepEqual({ ...reservationAuthority, authority_version: String(reservationAuthority.authority_version) }, { authority_version: String(authority.authority_version), selected_route_id: route, provider_id: identity.providerId, model_or_processor_id: identity.modelOrProcessorId, adapter_version: identity.adapterVersion, qualification_ref: identity.qualificationRef, qualification_version: identity.qualificationVersion, desired_profile_version: "plan-v2" }, "reservation is fenced by the exact desired-plan authority tuple before any window mutation");
    const [claim] = await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1) AS claimed", [admitted.reservation_id]);
    assert.deepEqual(claim.claimed, { logicalWorkId: admittedWork, attemptNumber: 1, reservationId: admitted.reservation_id, routeId: route, capability: identity.capability, adapterVersion: identity.adapterVersion, qualificationVersion: identity.qualificationVersion, quotaDomainId: domain, desiredProfileVersion: "plan-v2", authorityVersion: Number(authority.authority_version), providerId: identity.providerId, modelOrProcessorId: identity.modelOrProcessorId, qualificationRef: identity.qualificationRef });
    const [rpdRows] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 AND dimension_id='rpd'", [admitted.reservation_id]);
    assert.equal(rpdRows.count, 0, "approved Anoman RPD exclusion creates no admission ledger row");

    const oversized = `${suffix}-above-baseline`;
    await register(oversized, { rpm: 3, tpm: 10, concurrency: 1 });
    const [denied] = await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [oversized]);
    assert.equal(denied.decision, "unavailable");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_reservation WHERE logical_work_id=$1", [oversized]))[0].count, 0, "above-baseline work creates no reservation");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE data->>'logicalWorkId'=$1", [oversized]))[0].count, 0, "above-baseline work creates no send");

    const forged = `${suffix}-forged-authority`;
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4::jsonb,'plan-v2',1,NULL,clock_timestamp()+interval '1 hour')", [forged, domain, processId, { rpm: 1, tpm: 10, concurrency: 1 }]);
    await sql.unsafe("SAVEPOINT forged_authority");
    await assert.rejects(() => sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2::bigint)", [forged, Number(authority.authority_version) + 1]), /missing or foreign|not pinned/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT forged_authority");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_route_binding WHERE logical_work_id=$1", [forged]))[0].count, 0, "forged authority creates no binding, reservation, claim, or send");
    const [inventory] = await sql.unsafe("SELECT to_regprocedure('bridge.bind_provider_work_route(text,integer,text)') AS legacy_binder, to_regprocedure('bridge.bind_provider_work_route(text,integer,bigint)') AS v2_binder");
    assert.equal(inventory.legacy_binder, null);
    assert.ok(inventory.v2_binder);
  } finally {
    await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
