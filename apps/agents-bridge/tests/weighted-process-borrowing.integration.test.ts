import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-014-04-03 borrows only a proven idle background entitlement under the admission lock", { skip: !databaseUrl }, async () => {
  const sql = postgres(databaseUrl!, { max: 1 });
  const suffix = `weighted-borrow-${Date.now()}`;
  const domain = suffix, route = `${suffix}-route`;
  const borrower = `${suffix}-borrower`, lender = `${suffix}-lender`, interactive = `${suffix}-interactive`;
  const envelope = (units: number) => ({ rpm: units, tpm: units * 10, concurrency: units });
  const future = () => new Date(Date.now() + 3_600_000).toISOString();

  const register = async (id: string, processId: string, units: number, authorityVersion: number) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4::jsonb,'plan-v2',1,$5,$5)", [id, domain, processId, envelope(units), future()]);
    await sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [id, authorityVersion]);
  };
  const admit = async (id: string, serviceClass: "background" | "interactive") => (await sql.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,$2)", [id, serviceClass]))[0];
  const admitNext = async () => (await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [domain]))[0];
  const artifacts = async (id: string) => (await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) reservations,(SELECT count(*)::int FROM bridge.provider_window_usage_ledger ledger JOIN bridge.provider_work_reservation reservation USING(reservation_id) WHERE reservation.logical_work_id=$1) ledgers,(SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) dispatches,(SELECT count(*)::int FROM pgboss.job WHERE data->>'logicalWorkId'=$1) jobs,(SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id=$1) claims", [id]))[0];

  try {
    await sql.unsafe("BEGIN");
    const identity = { routeId: route, providerId: "anoman", modelOrProcessorId: "fixture-model", adapterVersion: "adapter-v2", qualificationRef: `qualification://${suffix}`, qualificationVersion: "qualified-v2", capability: "atlas.semantic.extract" };
    const profile = {
      usableGlobalCapacity: { rpm: 12, tpm: 120, concurrency: 12 },
      hardInteractiveReserve: { rpm: 2, tpm: 20, concurrency: 2 },
      backgroundCapacity: { rpm: 10, tpm: 100, concurrency: 10 },
      backgroundLanes: [
        { processId: borrower, profileVersion: "v1", normalizedWeight: .5, mayBorrowIdleCapacity: true },
        { processId: lender, profileVersion: "v1", normalizedWeight: .5, mayBorrowIdleCapacity: true },
      ],
    };
    const allocation = { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], classAllocations: { background: { rpm: 10, tpm: 100, concurrency: 10 }, interactive: { rpm: 2, tpm: 20, concurrency: 2 } }, processes: [
      { processId: borrower, profileVersion: "v1", serviceClass: "background", baseline: { rpm: 5, tpm: 50, concurrency: 5 }, cap: { rpm: 8, tpm: 80, concurrency: 8 } },
      { processId: lender, profileVersion: "v1", serviceClass: "background", baseline: { rpm: 5, tpm: 50, concurrency: 5 }, cap: { rpm: 8, tpm: 80, concurrency: 8 } },
      { processId: interactive, profileVersion: "v1", serviceClass: "interactive", baseline: { rpm: 2, tpm: 20, concurrency: 2 }, cap: { rpm: 2, tpm: 20, concurrency: 2 } },
    ] };
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v2','anoman',$2::jsonb,$3::jsonb,$4::jsonb,'provider_api','fixture','v2',clock_timestamp(),clock_timestamp())", [domain, [identity], { rpm: { state: "known", value: 12 }, tpm: { state: "known", value: 120 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 12 } }, { rpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { kind: "unknown" }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v2',$3,'policy','v2',$4::jsonb,'fixture',clock_timestamp())", [`${suffix}-approval`, domain, route, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v2',$2,'policy','v2',$3,$4::jsonb,clock_timestamp())", [domain, route, `${suffix}-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } }]);
    for (const [processId, serviceClass] of [[borrower, "background"], [lender, "background"], [interactive, "interactive"]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','{}','{}')", [`${processId}-workload`]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic',$2,$3,'{}','{}',true,$4::jsonb,$5,'v1')", [processId, identity.capability, serviceClass, [route], `${processId}-workload`]);
    }
    const [authority] = await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route, domain, identity.providerId, identity.modelOrProcessorId, identity.adapterVersion, identity.qualificationRef, identity.qualificationVersion, identity.capability]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v2','cap-v2','weighted-v2',clock_timestamp(),$2::jsonb)", [domain, profile]);
    for (const processId of [borrower, lender, interactive]) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v2',$2,'v1',$3,'v1')", [domain, processId, `${processId}-workload`]);
    const [{ policy }] = await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v2',$2) AS policy", [domain, route]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v2','cap-v2',$2,'policy','v2',$3::jsonb)", [domain, route, policy]);
    await sql.unsafe("INSERT INTO bridge.calculated_class_process_allocation(quota_domain_id,desired_profile_version,allocation_version,effective_mask,allocation,allocation_fingerprint) VALUES($1,'plan-v2','v1',$2::jsonb,$3::jsonb,md5($3::jsonb::text))", [domain, allocation.effectiveMask, allocation]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_route_binding_v2(quota_domain_id,desired_profile_version,route_id,authority_version,provider_capacity_profile_version,effective_mask,allocation_version) VALUES($1,'plan-v2',$2,$3,'cap-v2',$4::jsonb,'v1')", [domain, route, authority.authority_version, allocation.effectiveMask]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_activation(quota_domain_id,activation_revision,desired_profile_version,effective_from) VALUES($1,1,'plan-v2',clock_timestamp())", [domain]);
    await sql.unsafe("INSERT INTO bridge.active_desired_admission_profile(quota_domain_id,desired_profile_version,activation_revision,effective_from) VALUES($1,'plan-v2',1,clock_timestamp())", [domain]);
    await sql.unsafe("SAVEPOINT borrowing_matrix");

    await register(`${suffix}-initial`, borrower, 5, authority.authority_version);
    assert.equal((await admit(`${suffix}-initial`, "background")).decision, "admitted");
    await register(`${suffix}-borrowed`, borrower, 2, authority.authority_version);
    assert.equal((await admit(`${suffix}-borrowed`, "background")).decision, "admitted", "a second in-flight borrower includes its held liability and may consume the lender's verified idle share");
    await register(`${suffix}-interactive`, interactive, 2, authority.authority_version);
    assert.equal((await admit(`${suffix}-interactive`, "interactive")).decision, "admitted", "borrowing never consumes interactive protection or headroom");

    await sql.unsafe("SAVEPOINT disabled_borrower");
    await sql.unsafe("ALTER TABLE bridge.desired_admission_profile DISABLE TRIGGER ALL");
    await sql.unsafe("UPDATE bridge.desired_admission_profile SET profile=jsonb_set(profile,'{backgroundLanes,0,mayBorrowIdleCapacity}','false'::jsonb) WHERE quota_domain_id=$1 AND profile_version='plan-v2'", [domain]);
    await register(`${suffix}-disabled`, borrower, 1, authority.authority_version);
    assert.equal((await admit(`${suffix}-disabled`, "background")).decision, "unavailable");
    assert.deepEqual(await artifacts(`${suffix}-disabled`), { reservations: 0, ledgers: 0, dispatches: 0, jobs: 0, claims: 0 });
    await sql.unsafe("ROLLBACK TO SAVEPOINT disabled_borrower");

    await register(`${suffix}-lender-demand`, lender, 1, authority.authority_version);
    await register(`${suffix}-blocked-by-demand`, borrower, 1, authority.authority_version);
    assert.equal((await admit(`${suffix}-blocked-by-demand`, "background")).decision, "unavailable", "an eligible waiting lender retains its own idle entitlement");
    assert.deepEqual(await artifacts(`${suffix}-blocked-by-demand`), { reservations: 0, ledgers: 0, dispatches: 0, jobs: 0, claims: 0 });
    assert.equal((await admit(`${suffix}-lender-demand`, "background")).decision, "admitted", "the lender is subsequently admitted without preempting either borrower");

    await sql.unsafe("ROLLBACK TO SAVEPOINT borrowing_matrix");
    await register(`${suffix}-exhausted-borrower-baseline`, borrower, 5, authority.authority_version);
    assert.equal((await admit(`${suffix}-exhausted-borrower-baseline`, "background")).decision, "admitted");
    await register(`${suffix}-exhausted-lender`, lender, 5, authority.authority_version);
    assert.equal((await admit(`${suffix}-exhausted-lender`, "background")).decision, "admitted", "the peer's entire same-lock baseline is held before the borrow attempt");
    await register(`${suffix}-exhausted-peer-denial`, borrower, 1, authority.authority_version);
    assert.equal((await admit(`${suffix}-exhausted-peer-denial`, "background")).decision, "unavailable", "an exhausted peer has no lendable entitlement");
    assert.deepEqual(await artifacts(`${suffix}-exhausted-peer-denial`), { reservations: 0, ledgers: 0, dispatches: 0, jobs: 0, claims: 0 }, "the exhausted-peer denial creates no reservation, ledger, dispatch, job, or transport claim");

    await sql.unsafe("ROLLBACK TO SAVEPOINT borrowing_matrix");
    await register(`${suffix}-selector-baseline`, borrower, 5, authority.authority_version);
    const borrowerBaseline = await admit(`${suffix}-selector-baseline`, "background");
    assert.equal(borrowerBaseline.decision, "admitted");
    await register(`${suffix}-selector-borrowed`, borrower, 2, authority.authority_version);
    const borrowerBorrowed = await admit(`${suffix}-selector-borrowed`, "background");
    assert.equal(borrowerBorrowed.decision, "admitted");
    const borrowerLiabilities = await sql.unsafe("SELECT reservation_id::text AS reservation_id,request_resource_envelope FROM bridge.provider_work_reservation WHERE reservation_id=$1", [borrowerBorrowed.reservation_id]);
    await register(`${suffix}-selector-borrower`, borrower, 1, authority.authority_version);
    await register(`${suffix}-selector-lender`, lender, 1, authority.authority_version);
    await register(`${suffix}-selector-interactive`, interactive, 2, authority.authority_version);
    const selectedInteractive = await admitNext();
    assert.equal(selectedInteractive.logical_work_id, `${suffix}-selector-interactive`, "the fair selector retains protected interactive priority");
    const selectedLender = await admitNext();
    assert.equal(selectedLender.logical_work_id, `${suffix}-selector-lender`, "the fair selector excludes the above-baseline borrower while the lender is waiting and admits the lender on the next fair turn");
    assert.deepEqual(await sql.unsafe("SELECT reservation_id::text AS reservation_id,request_resource_envelope FROM bridge.provider_work_reservation WHERE reservation_id=$1", [borrowerBorrowed.reservation_id]), borrowerLiabilities, "selector admission neither changes nor preempts the in-flight borrower liability");
    assert.deepEqual(await artifacts(`${suffix}-selector-borrower`), { reservations: 0, ledgers: 0, dispatches: 0, jobs: 0, claims: 0 }, "the excluded above-baseline borrower creates no forbidden reservation or send artifact");
  } finally {
    await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
