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
  const classFillProcess = `${suffix}-class-fill`;
  const classCandidateProcess = `${suffix}-class-candidate`;
  const reserveFillProcess = `${suffix}-reserve-fill`;
  const reserveCandidateProcess = `${suffix}-reserve-candidate`;
  const interactiveFillProcess = `${suffix}-interactive-fill`;
  const interactiveCandidateProcess = `${suffix}-interactive-candidate`;
  const workloadId = (process: string) => `${process}-workload`;
  const identity = { routeId: route, providerId: "anoman", modelOrProcessorId: "fixture-model", adapterVersion: "adapter-v2", qualificationRef: `qualification://${suffix}`, qualificationVersion: "qualified-v2", capability: "atlas.semantic.extract" as const };
  const resolver = createRouteRegistry([{ ...identity, workClass: "background", enabled: true }], "development", new Set(["anoman"]));
  const profile = { usableGlobalCapacity: { rpm: 10, tpm: 100, concurrency: 10 }, hardInteractiveReserve: { rpm: 2, tpm: 20, concurrency: 2 }, backgroundCapacity: { rpm: 8, tpm: 80, concurrency: 8 }, backgroundLanes: [{ processId, profileVersion: "v1", normalizedWeight: 1 }] };
  const allocation = { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], classAllocations: { background: { rpm: 12, tpm: 120, concurrency: 12 }, interactive: { rpm: 5, tpm: 50, concurrency: 5 } }, processes: [
    { processId, profileVersion: "v1", serviceClass: "background", baseline: { rpm: 2, tpm: 20, concurrency: 2 }, cap: { rpm: 4, tpm: 40, concurrency: 4 } },
    { processId: classFillProcess, profileVersion: "v1", serviceClass: "interactive", baseline: { rpm: 4, tpm: 40, concurrency: 4 }, cap: { rpm: 4, tpm: 40, concurrency: 4 } },
    { processId: classCandidateProcess, profileVersion: "v1", serviceClass: "interactive", baseline: { rpm: 2, tpm: 20, concurrency: 2 }, cap: { rpm: 2, tpm: 20, concurrency: 2 } },
    { processId: reserveFillProcess, profileVersion: "v1", serviceClass: "background", baseline: { rpm: 7, tpm: 70, concurrency: 7 }, cap: { rpm: 7, tpm: 70, concurrency: 7 } },
    { processId: reserveCandidateProcess, profileVersion: "v1", serviceClass: "background", baseline: { rpm: 2, tpm: 20, concurrency: 2 }, cap: { rpm: 2, tpm: 20, concurrency: 2 } },
    { processId: interactiveFillProcess, profileVersion: "v1", serviceClass: "interactive", baseline: { rpm: 2, tpm: 20, concurrency: 2 }, cap: { rpm: 2, tpm: 20, concurrency: 2 } },
    { processId: interactiveCandidateProcess, profileVersion: "v1", serviceClass: "interactive", baseline: { rpm: 2, tpm: 20, concurrency: 2 }, cap: { rpm: 2, tpm: 20, concurrency: 2 } },
  ] };
  const exec = { executeSql: async (query: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(query, values as unknown[] | undefined) }) };
  const bind = (logicalWorkId: string) => bindProviderWorkRouteFromResolver(exec, resolver, { logicalWorkId, attemptNumber: 1 });
  const register = async (logicalWorkId: string, targetProcess: string, envelope: object) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4::jsonb,'plan-v2',1,clock_timestamp()+interval '1 hour',clock_timestamp()+interval '1 hour')", [logicalWorkId, domain, targetProcess, envelope]);
    await bind(logicalWorkId);
  };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v2','anoman',$2::jsonb,$3::jsonb,$4::jsonb,'provider_api','fixture','v2',clock_timestamp(),clock_timestamp())", [domain, [identity], { rpm: { state: "known", value: 10 }, tpm: { state: "known", value: 100 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 10 } }, { rpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { kind: "unknown" }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v2',$3,'policy','v2',$4::jsonb,'fixture',clock_timestamp())", [`${suffix}-approval`, domain, route, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v2',$2,'policy','v2',$3,$4::jsonb,clock_timestamp())", [domain, route, `${suffix}-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } }]);
    for (const targetProcess of allocation.processes) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','{}','{}')", [workloadId(targetProcess.processId)]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic',$2,$3,'{}','{}',true,$4::jsonb,$5,'v1')", [targetProcess.processId, identity.capability, targetProcess.serviceClass, [route], workloadId(targetProcess.processId)]);
    }
    const [authority] = await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route, domain, identity.providerId, identity.modelOrProcessorId, identity.adapterVersion, identity.qualificationRef, identity.qualificationVersion, identity.capability]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v2','cap-v2','weighted-v2',clock_timestamp(),$2::jsonb)", [domain, profile]);
    for (const targetProcess of allocation.processes) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v2',$2,'v1',$3,'v1')", [domain, targetProcess.processId, workloadId(targetProcess.processId)]);
    const [effective] = await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v2',$2) AS policy", [domain, route]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v2','cap-v2',$2,'policy','v2',$3::jsonb)", [domain, route, effective.policy]);
    await sql.unsafe("INSERT INTO bridge.calculated_class_process_allocation(quota_domain_id,desired_profile_version,allocation_version,effective_mask,allocation,allocation_fingerprint) VALUES($1,'plan-v2','v1',$2::jsonb,$3::jsonb,md5($3::jsonb::text))", [domain, allocation.effectiveMask, allocation]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_route_binding_v2(quota_domain_id,desired_profile_version,route_id,authority_version,provider_capacity_profile_version,effective_mask,allocation_version) VALUES($1,'plan-v2',$2,$3,'cap-v2',$4::jsonb,'v1')", [domain, route, authority.authority_version, allocation.effectiveMask]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_activation(quota_domain_id,activation_revision,desired_profile_version,effective_from) VALUES($1,1,'plan-v2',clock_timestamp())", [domain]);
    await sql.unsafe("INSERT INTO bridge.active_desired_admission_profile(quota_domain_id,desired_profile_version,activation_revision,effective_from) VALUES($1,'plan-v2',1,clock_timestamp())", [domain]);

    const admittedWork = `${suffix}-within-baseline`;
    await register(admittedWork, processId, { rpm: 1, tpm: 10, concurrency: 1 });
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

    const artifacts = async (logicalWorkId: string) => (await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) reservations,(SELECT count(*)::int FROM bridge.provider_window_usage_ledger ledger JOIN bridge.provider_work_reservation reservation USING(reservation_id) WHERE reservation.logical_work_id=$1) ledgers,(SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) dispatches,(SELECT count(*)::int FROM pgboss.job WHERE data->>'logicalWorkId'=$1) jobs,(SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id=$1) claims", [logicalWorkId]))[0];
    const reject = async (name: string, targetProcess: string, serviceClass: string, envelope: object) => {
      const work = `${suffix}-${name}`;
      await register(work, targetProcess, envelope);
      const [result] = await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,$2)", [work, serviceClass]);
      assert.equal(result.decision, "unavailable", `${name} is denied by the existing locked admission transaction`);
      assert.deepEqual(await artifacts(work), { reservations: 0, ledgers: 0, dispatches: 0, jobs: 0, claims: 0 }, `${name} creates no reservation, ledger, job, transport claim, or provider send`);
    };

    // CK-001.a: exact saturation vectors exercise the independent process
    // dimensions and preserve a zero operational delta on every denial.
    await reject("tpm-baseline", processId, "background", { rpm: 1, tpm: 21, concurrency: 1 });
    await reject("concurrency-baseline", processId, "background", { rpm: 1, tpm: 1, concurrency: 2 });
    await reject("explicit-cap", processId, "background", { rpm: 4, tpm: 1, concurrency: 1 });

    await sql.unsafe("SAVEPOINT class_pool_matrix");
    const classFill = `${suffix}-class-fill`;
    await register(classFill, classFillProcess, { rpm: 4, tpm: 40, concurrency: 4 });
    assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'interactive')", [classFill]))[0].decision, "admitted", "the class-pool matrix starts with an exact within-process fill");
    await reject("class-pool", classCandidateProcess, "interactive", { rpm: 2, tpm: 20, concurrency: 2 });
    await sql.unsafe("ROLLBACK TO SAVEPOINT class_pool_matrix");

    await sql.unsafe("SAVEPOINT protected_and_physical_matrix");
    const reserveFill = `${suffix}-reserve-fill`;
    await register(reserveFill, reserveFillProcess, { rpm: 7, tpm: 70, concurrency: 7 });
    assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [reserveFill]))[0].decision, "admitted", "background use reaches its non-lendable interactive reserve boundary");
    await reject("protected-interactive-reserve", reserveCandidateProcess, "background", { rpm: 1, tpm: 1, concurrency: 1 });

    const interactiveFill = `${suffix}-interactive-fill`;
    await register(interactiveFill, interactiveFillProcess, { rpm: 2, tpm: 20, concurrency: 2 });
    assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'interactive')", [interactiveFill]))[0].decision, "admitted", "the protected interactive reserve remains available to interactive work");
    await reject("physical-domain-quota", interactiveCandidateProcess, "interactive", { rpm: 1, tpm: 1, concurrency: 1 });
    await sql.unsafe("ROLLBACK TO SAVEPOINT protected_and_physical_matrix");

    // CK-001.c: the approved Anoman exclusion is positive-only.  Each broken
    // approval shape is rejected before any operational artifact is created.
    const rejectBrokenApproval = async (name: string, breakApproval: () => Promise<unknown>) => {
      const savepoint = name.replaceAll("-", "_");
      await sql.unsafe(`SAVEPOINT ${savepoint}`);
      await breakApproval();
      await reject(name, reserveCandidateProcess, "background", { rpm: 1, tpm: 1, concurrency: 1 });
      await sql.unsafe(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    };
    await rejectBrokenApproval("missing-rpd-approval", async () => {
      await sql.unsafe("ALTER TABLE bridge.provider_enforcement_policy DISABLE TRIGGER ALL");
      await sql.unsafe("UPDATE bridge.provider_enforcement_policy SET approval_ref=$3 WHERE quota_domain_id=$1 AND provider_capacity_profile_version='cap-v2' AND route_id=$2", [domain, route, `${suffix}-missing-approval`]);
    });
    await rejectBrokenApproval("revoked-rpd-approval", () => sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,'cap-v2',$2,'policy','v2',$3,'fixture')", [domain, route, `${suffix}-revoked-approval`]));
    await rejectBrokenApproval("mismatched-rpd-approval", async () => {
      await sql.unsafe("ALTER TABLE bridge.provider_enforcement_policy_approval DISABLE TRIGGER provider_enforcement_policy_approval_immutable");
      await sql.unsafe("UPDATE bridge.provider_enforcement_policy_approval SET permitted_unknown_dimensions='{\"rpd\":{\"providerState\":\"unknown\",\"reason\":\"wrong_reason\"}}'::jsonb WHERE approval_ref=$1", [`${suffix}-approval`]);
    });

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
