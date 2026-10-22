import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const effectiveFrom = "2026-10-22 00:00:00+00";

test("BSS-V2-014-02-02 publishes one immutable allocation across qualified routes and fences activation", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `shared-domain-publication-${Date.now()}`;
  const routes = ["route-a", "route-b", "route-inactive"].map((routeId, index) => ({
    routeId: `${domain}-${routeId}`, providerId: "fixture-provider", modelOrProcessorId: `fixture-model-${index + 1}`,
    adapterVersion: "fixture-adapter-v1", qualificationRef: `qualification://${routeId}`,
    qualificationVersion: "qualified-v1", capability: "atlas.semantic.extract",
  }));
  const processId = `${domain}-process`;
  const workloadId = `${domain}-workload`;
  const inputs = [{ processId, processProfileVersion: "v1", workloadId, workloadProfileVersion: "v1" }];
  const profile = (plannerVersion = "weighted-v1", capacityProfileVersion = "capacity-v1") => ({
    quotaDomainId: domain, providerCapacityProfileVersion: capacityProfileVersion, plannerVersion, effectiveFrom,
    eligibleDimensions: ["rpm", "tpm", "rpd", "concurrency"],
  });
  const allocation = (revision = "v1") => ({
    allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "rpd", "concurrency"],
    classAllocations: { background: { rpm: 7, tpm: 700, rpd: 70, concurrency: 7 } },
    processBaselines: { [processId]: { revision, rpm: 7, tpm: 700, rpd: 70, concurrency: 7 } },
  });
  const publish = (authorities: unknown, nextProfile = profile(), nextAllocation = allocation()) => sql.unsafe(
    "SELECT * FROM bridge.publish_shared_domain_calculated_desired_admission_profile($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb)",
    [domain, null, "capacity-v1", nextProfile.plannerVersion, effectiveFrom, nextProfile, inputs, authorities, nextAllocation],
  );
  const reject = async (name: string, action: () => Promise<unknown>, expectation: RegExp, expectNoCandidate = true) => {
    await sql.unsafe(`SAVEPOINT ${name}`);
    await assert.rejects(action, expectation);
    await sql.unsafe(`ROLLBACK TO SAVEPOINT ${name}`);
    if (expectNoCandidate) assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_candidate WHERE quota_domain_id=$1", [domain]))[0].count, 0, `${name} creates no candidate`);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1", [domain]))[0].count, 0, `${name} creates no activation`);
  };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe(
      "INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'capacity-v1','fixture-provider',$2::jsonb,$3::jsonb,'{\"rpm\":{\"kind\":\"fixed_window\"},\"tpm\":{\"kind\":\"fixed_window\"},\"rpd\":{\"kind\":\"fixed_window\"}}'::jsonb,'quota-v1','operator_config','fixture://capacity','v1',now(),now())",
      [domain, routes, { rpm: { state: "known", value: 10 }, tpm: { state: "known", value: 1000 }, rpd: { state: "known", value: 100 }, concurrency: { state: "known", value: 10 } }],
    );
    await sql.unsafe(
      "INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'capacity-v2','fixture-provider',$2::jsonb,$3::jsonb,'{\"rpm\":{\"kind\":\"fixed_window\"},\"tpm\":{\"kind\":\"fixed_window\"},\"rpd\":{\"kind\":\"fixed_window\"}}'::jsonb,'quota-v1','operator_config','fixture://capacity','v2',now(),now())",
      [domain, routes, { rpm: { state: "known", value: 11 }, tpm: { state: "known", value: 1100 }, rpd: { state: "known", value: 110 }, concurrency: { state: "known", value: 11 } }],
    );
    for (const route of routes) {
      const approval = `${domain}-${route.routeId}-approval`;
      await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'capacity-v1',$3,'capacity-policy','v1','{}'::jsonb,'fixture',now())", [approval, domain, route.routeId]);
      await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,$3,'capacity-policy','v1',$4,$5::jsonb,$6::timestamptz)", [domain, "capacity-v1", route.routeId, approval, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "enforced", limitSource: "provider" }, concurrency: { mode: "enforced", limitSource: "provider" } }, effectiveFrom]);
    }
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]'::jsonb,'{}'::jsonb,'{}'::jsonb,'quota-v1','{}'::jsonb,'{}'::jsonb)", [workloadId]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}'::jsonb,'{}'::jsonb,true,$2::jsonb,$3,'v1')", [processId, routes.slice(0, 2).map(({ routeId }) => routeId), workloadId]);
    const authorities = [] as Array<{ routeId: string; authorityVersion: string }>;
    for (const route of routes) {
      const [published] = await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route.routeId, domain, route.providerId, route.modelOrProcessorId, route.adapterVersion, route.qualificationRef, route.qualificationVersion, route.capability]);
      authorities.push({ routeId: route.routeId, authorityVersion: String(published.authority_version) });
    }
    const foreignDomain = `${domain}-foreign`;
    const foreignRoute = { ...routes[0]!, routeId: routes[0]!.routeId };
    await sql.unsafe(
      "INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'capacity-v1','fixture-provider',$2::jsonb,$3::jsonb,'{\"rpm\":{\"kind\":\"fixed_window\"},\"tpm\":{\"kind\":\"fixed_window\"},\"rpd\":{\"kind\":\"fixed_window\"}}'::jsonb,'quota-v1','operator_config','fixture://foreign-capacity','v1',now(),now())",
      [foreignDomain, [foreignRoute], { rpm: { state: "known", value: 10 }, tpm: { state: "known", value: 1000 }, rpd: { state: "known", value: 100 }, concurrency: { state: "known", value: 10 } }],
    );
    const [foreignAuthority] = await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [foreignRoute.routeId, foreignDomain, foreignRoute.providerId, foreignRoute.modelOrProcessorId, foreignRoute.adapterVersion, foreignRoute.qualificationRef, foreignRoute.qualificationVersion, foreignRoute.capability]);

    await reject("stale_authority", () => publish([{ routeId: routes[0]!.routeId, authorityVersion: "999999999" }]), /stale, foreign, or non-qualified/i);
    await reject("different_capacity_profile", () => publish(authorities.slice(0, 2), profile("weighted-v1", "capacity-v2")), /not bound to its exact domain, capacity profile, planner, and effective time/i);
    await reject("foreign_domain", () => publish([{ routeId: foreignRoute.routeId, authorityVersion: String(foreignAuthority.authority_version) }]), /stale, foreign, or non-qualified/i);
    await reject("different_mask", () => publish(authorities.slice(0, 2), profile(), { ...allocation(), effectiveMask: ["rpm"] }), /different effective mask/i);
    await reject("duplicate_binding", () => publish([authorities[0], authorities[0]]), /duplicate or incomplete canonical route binding/i);
    await reject("missing_allocation", () => publish(authorities.slice(0, 2), profile(), null as never), /CalculatedClassProcessAllocation\/v1/i);
    await reject("inactive_route", () => publish([authorities[2]]), /inactive or has no active qualified process/i);
    const [first] = await publish(authorities.slice(0, 2));
    assert.deepEqual({ status: first.status, candidate: String(first.candidate_activation_revision) }, { status: "published", candidate: "1" });
    const allocationRows = await sql.unsafe("SELECT allocation_version,effective_mask,allocation,allocation_fingerprint FROM bridge.calculated_class_process_allocation WHERE quota_domain_id=$1 AND desired_profile_version=$2", [domain, first.desired_profile_version]);
    assert.equal(allocationRows.length, 1, "one allocation belongs to the entire desired-plan identity");
    const [expectedFingerprint] = await sql.unsafe("SELECT md5($1::jsonb::text) AS fingerprint", [allocation()]);
    assert.deepEqual(allocationRows[0], { allocation_version: "v1", effective_mask: ["rpm", "tpm", "rpd", "concurrency"], allocation: allocation(), allocation_fingerprint: expectedFingerprint.fingerprint }, "the plan persists the canonical allocation vector and its one shared fingerprint");
    const bindings = await sql.unsafe("SELECT route_id,authority_version,provider_capacity_profile_version,effective_mask,allocation_version FROM bridge.desired_admission_profile_route_binding_v2 WHERE quota_domain_id=$1 AND desired_profile_version=$2 ORDER BY route_id", [domain, first.desired_profile_version]);
    assert.deepEqual(bindings.map((binding) => ({ route: binding.route_id, authority: String(binding.authority_version), capacity: binding.provider_capacity_profile_version, mask: binding.effective_mask, allocation: binding.allocation_version })), authorities.slice(0, 2).map((authority) => ({ route: authority.routeId, authority: authority.authorityVersion, capacity: "capacity-v1", mask: ["rpm", "tpm", "rpd", "concurrency"], allocation: "v1" })));
    await reject("premature_activation", () => sql.unsafe("SELECT * FROM bridge.activate_desired_admission_profile($1,$2)", [domain, first.desired_profile_version]), /parent cutover gate/i, false);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.active_desired_admission_profile WHERE quota_domain_id=$1", [domain]))[0].count, 0, "candidate publication cannot change runtime activation");

    const [second] = await publish(authorities.slice(0, 2), profile("weighted-v2"), allocation("v2"));
    assert.deepEqual({ status: second.status, candidate: String(second.candidate_activation_revision) }, { status: "published", candidate: "2" });
    assert.notEqual(second.desired_profile_version, first.desired_profile_version);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_route_binding_v2 WHERE quota_domain_id=$1", [domain]))[0].count, 4, "revisions preserve prior immutable bindings");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1", [domain]))[0].count, 0, "no revision activates before the parent gate");

    const [inventory] = await sql.unsafe("SELECT to_regprocedure('bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamp with time zone,jsonb,jsonb)') AS old_signature, to_regprocedure('bridge.publish_effective_policy_converged_desired_admission_profile_v1(text,bigint,text,text,text,timestamp with time zone,jsonb,jsonb)') AS old_v1_signature, has_function_privilege('agents_bridge','bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamp with time zone,jsonb,jsonb,jsonb,jsonb)'::regprocedure,'EXECUTE') AS successor_granted");
    assert.deepEqual(inventory, { old_signature: null, old_v1_signature: null, successor_granted: true });
    await assert.rejects(() => sql.unsafe("SELECT * FROM bridge.publish_effective_policy_converged_desired_admission_profile($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)", [domain, null, "capacity-v1", routes[0]!.routeId, "legacy", {}, inputs]), /does not exist/i);
  } finally {
    await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
