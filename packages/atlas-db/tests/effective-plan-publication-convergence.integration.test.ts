import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { planEffectiveDesiredAdmissionProfile } from "../../../apps/agents-bridge/src/capacity-planner.ts";

const databaseUrl = process.env.DATABASE_URL;

test("RC-00605-02 publishes only a policy-bound eligible plan and converges through the existing durable wakeup", { skip: databaseUrl ? "retired by BSS-V2-014-02-02 shared-domain successor publication" : true }, async () => {
  const suffix = `effective-plan-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const profileVersion = "capacity-v1";
  const excludedProfileVersion = "capacity-v2";
  const route = `${suffix}-route`;
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const knownRpdPolicyDimensions = {
    rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" },
    rpd: { mode: "enforced", limitSource: "provider" },
    concurrency: { mode: "enforced", limitSource: "provider" },
  };
  const knownRpdCapacity = {
    quotaDomainId: domain, profileVersion, nonSecretProviderAccountAlias: "fixture", activeKeyCount: 1,
    associatedRoutes: [{ routeId: route, providerId: "fixture" }],
    limits: { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "known", value: 500 }, concurrency: { state: "known", value: 25 } },
    windowPolicies: { rpm: { policyId: "rpm", policyVersion: "v1", source: "provider_api", kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { policyId: "tpm", policyVersion: "v1", source: "provider_api", kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { policyId: "rpd", policyVersion: "v1", source: "provider_api", kind: "fixed_window", parameters: { windowSeconds: 86400 } } }, capacitySource: "provider_api", sourceRef: "fixture://capacity", sourceVersion: "v1", observedAt: "2026-10-18T00:00:00.000Z", effectiveFrom: "2026-10-18T00:00:00.000Z",
  } as const;
  const excludedRpdCapacity = { ...knownRpdCapacity, profileVersion: excludedProfileVersion, limits: { ...knownRpdCapacity.limits, rpd: { state: "unknown" as const } }, windowPolicies: { ...knownRpdCapacity.windowPolicies, rpd: { policyId: "rpd", policyVersion: "v1", source: "provider_api", kind: "unknown" } } };
  const plan = (capacity: any, effectivePolicy: any, plannerVersion = "planner-v1") => planEffectiveDesiredAdmissionProfile(capacity, [
    { processId: `${suffix}-background`, profileVersion: "v1", serviceClass: "background", active: true, workloadProfile: { workloadId: `${suffix}-background-workload`, profileVersion: "v1" }, allocationPolicy: { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "background-cap" } } },
    { processId: `${suffix}-interactive`, profileVersion: "v1", serviceClass: "interactive", active: true, workloadProfile: { workloadId: `${suffix}-interactive-workload`, profileVersion: "v1" }, allocationPolicy: {} },
  ] as any, [
    { workloadId: `${suffix}-background-workload`, profileVersion: "v1", active: true, structuralBound: { maxInputTokens: 100 }, outputReservation: { maxOutputTokens: 100 } },
    { workloadId: `${suffix}-interactive-workload`, profileVersion: "v1", active: true, structuralBound: { maxInputTokens: 100 }, outputReservation: { maxOutputTokens: 100 } },
  ] as any, {
    plannerVersion, effectiveFrom: "2026-10-18T00:00:00.000Z",
    headroomPolicy: { policyId: "headroom", policyVersion: "v1", reserve: { rpm: 1, tpm: 1_000, rpd: 0, concurrency: 1 } },
    interactiveReserveTargets: [{ processId: `${suffix}-interactive`, profileVersion: "v1", serviceTargetId: "interactive-slo", reserve: { rpm: 2, tpm: 2_000, rpd: 0, concurrency: 2 } }],
  } as any, effectivePolicy);
  const inputs = [
    { processId: `${suffix}-background`, processProfileVersion: "v1", workloadId: `${suffix}-background-workload`, workloadProfileVersion: "v1" },
    { processId: `${suffix}-interactive`, processProfileVersion: "v1", workloadId: `${suffix}-interactive-workload`, workloadProfileVersion: "v1" },
  ];
  const publish = (expected: number | null, capacity: any, policy: any, plannerVersion = "planner-v1") => bridge.unsafe(
    "SELECT * FROM bridge.publish_effective_policy_converged_desired_admission_profile($1,$2,$3,$4,$5,'2026-10-18T00:00:00Z',$6::jsonb,$7::jsonb)",
    [domain, expected, capacity.profileVersion, route, plannerVersion, plan(capacity, policy, plannerVersion), inputs],
  );
  const rejected = async (operation: () => Promise<unknown>, expected: RegExp) => {
    await bridge.unsafe("SAVEPOINT expected_failure"); await assert.rejects(operation, expected); await bridge.unsafe("ROLLBACK TO SAVEPOINT expected_failure");
  };
  try {
    await bridge.unsafe("BEGIN");
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3::jsonb,$4::jsonb,$5::jsonb,'provider_api','fixture://capacity','v1',now(),now())", [domain, profileVersion, knownRpdCapacity.associatedRoutes, knownRpdCapacity.limits, knownRpdCapacity.windowPolicies]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,$3,$4,'capacity-dimension-enforcement','fixture-v1','{}','policy-owner',now())", [`${suffix}-known-approval`, domain, profileVersion, route]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,$3,'capacity-dimension-enforcement','fixture-v1',$4,$5::jsonb,'2026-10-18T00:00:00Z')", [domain, profileVersion, route, `${suffix}-known-approval`, knownRpdPolicyDimensions]);
    const knownPolicy = (await bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3) AS policy", [domain, profileVersion, route]))[0].policy;
    const initial = plan(knownRpdCapacity, knownPolicy);
    assert.deepEqual(initial.eligibleDimensions, ["rpm", "tpm", "rpd", "concurrency"]);
    assert.equal(initial.usableGlobalCapacity.rpd, 500);

    for (const [id, kind, serviceClass, workload] of [[`${suffix}-background`, "semantic", "background", `${suffix}-background-workload`], [`${suffix}-interactive`, "chat", "interactive", `${suffix}-interactive-workload`]] as const) {
      await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',true,$2::jsonb,$3::jsonb,'{\"identity\":\"estimator\",\"version\":\"v1\"}'::jsonb,'{\"policyId\":\"output\",\"policyVersion\":\"v1\",\"maxOutputTokens\":100}'::jsonb,'{\"policyId\":\"safety\",\"policyVersion\":\"v1\"}'::jsonb)", [workload, [kind], { identity: workload, version: "v1", maxRequestBytes: 10_000, maxInputTokens: 100 }]);
      await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1',$2,$3,$4,'{}',$5::jsonb,true,$6::jsonb,$7,'v1')", [id, kind, kind === "chat" ? "atlas.chat.default" : "atlas.semantic.extract", serviceClass, serviceClass === "background" ? { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "background-cap" }, hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } } : { hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } }, [route], workload]);
    }

    const [first] = await publish(null, knownRpdCapacity, knownPolicy);
    assert.deepEqual({ status: first.status, revision: first.activation_revision }, { status: "published", revision: "1" });
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1", [domain]))[0].count, 1);
    const firstProfile = (await bridge.unsafe("SELECT profile FROM bridge.desired_admission_profile WHERE quota_domain_id=$1 AND profile_version=$2", [domain, first.desired_profile_version]))[0].profile;
    const firstActivation = (await bridge.unsafe("SELECT to_jsonb(a) AS activation FROM bridge.desired_admission_profile_activation a WHERE quota_domain_id=$1 AND desired_profile_version=$2", [domain, first.desired_profile_version]))[0].activation;
    const [same] = await publish(null, knownRpdCapacity, knownPolicy);
    assert.deepEqual({ status: same.status, revision: same.activation_revision }, { status: "unchanged", revision: "1" });
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1", [domain]))[0].count, 1);
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1", [domain]))[0].count, 1);

    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3::jsonb,$4::jsonb,$5::jsonb,'provider_api','fixture://capacity','v2',now(),now())", [domain, excludedProfileVersion, excludedRpdCapacity.associatedRoutes, excludedRpdCapacity.limits, excludedRpdCapacity.windowPolicies]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,$3,$4,'capacity-dimension-enforcement','fixture-v2','{\"rpd\":{\"providerState\":\"unknown\",\"reason\":\"not_published\"}}','policy-owner',now())", [`${suffix}-excluded-approval`, domain, excludedProfileVersion, route]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,$3,'capacity-dimension-enforcement','fixture-v2',$4,$5::jsonb,'2026-10-18T00:00:00Z')", [domain, excludedProfileVersion, route, `${suffix}-excluded-approval`, {
      rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" },
      rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-excluded-approval` },
      concurrency: { mode: "enforced", limitSource: "provider" },
    }]);
    const excludedPolicy = (await bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3) AS policy", [domain, excludedProfileVersion, route]))[0].policy;
    const excludedPlan = plan(excludedRpdCapacity, excludedPolicy);
    assert.deepEqual(excludedPlan.eligibleDimensions, ["rpm", "tpm", "concurrency"]);
    assert.ok(!("rpd" in excludedPlan.usableGlobalCapacity));
    assert.equal(excludedPlan.backgroundLanes[0]?.planningCost.rpd, undefined);

    const [changed] = await publish(1, excludedRpdCapacity, excludedPolicy);
    assert.deepEqual({ status: changed.status, revision: changed.activation_revision }, { status: "published", revision: "2" });
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1", [domain]))[0].count, 2);
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_policy_binding WHERE quota_domain_id=$1", [domain]))[0].count, 2);
    assert.notEqual(first.desired_profile_version, changed.desired_profile_version);
    assert.deepEqual((await bridge.unsafe("SELECT profile FROM bridge.desired_admission_profile WHERE quota_domain_id=$1 AND profile_version=$2", [domain, first.desired_profile_version]))[0].profile, firstProfile);
    assert.deepEqual((await bridge.unsafe("SELECT to_jsonb(a) AS activation FROM bridge.desired_admission_profile_activation a WHERE quota_domain_id=$1 AND desired_profile_version=$2", [domain, first.desired_profile_version]))[0].activation, firstActivation);
    const [replayed] = await publish(1, excludedRpdCapacity, excludedPolicy);
    assert.deepEqual({ status: replayed.status, revision: replayed.activation_revision }, { status: "unchanged", revision: "2" });
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1", [domain]))[0].count, 2);
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1", [domain]))[0].count, 2);

    const fabricated = { ...excludedPlan, usableGlobalCapacity: { ...excludedPlan.usableGlobalCapacity, rpd: 1 } };
    const forgedCap = structuredClone(excludedPlan);
    forgedCap.backgroundLanes[0]!.cap = { rpm: 1, tpm: 1, concurrency: 1, rpd: 1 };
    const forgedPlanningCost = structuredClone(excludedPlan);
    forgedPlanningCost.backgroundLanes[0]!.planningCost.rpd = 1;
    const forgedFairnessCost = structuredClone(excludedPlan);
    forgedFairnessCost.backgroundLanes[0]!.fairnessCost = { rpd: 1 };
    const publishProfile = (candidate: unknown) => bridge.unsafe("SELECT * FROM bridge.publish_effective_policy_converged_desired_admission_profile($1,$2,$3,$4,$5,'2026-10-18T00:00:00Z',$6::jsonb,$7::jsonb)", [domain, 2, excludedProfileVersion, route, "planner-v1", candidate, inputs]);
    await rejected(() => publishProfile(fabricated), /fabricates a numeric bound/);
    await rejected(() => publishProfile(forgedCap), /non-eligible dimensions/);
    await rejected(() => publishProfile(forgedPlanningCost), /non-eligible dimensions/);
    await rejected(() => publishProfile(forgedFairnessCost), /canonical capacity\/fairness representation/);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,$2,$3,'capacity-dimension-enforcement','fixture-v2',$4,'policy-owner')", [domain, excludedProfileVersion, route, `${suffix}-revoked`]);
    await rejected(() => publish(2, excludedRpdCapacity, excludedPolicy, "planner-v4"), /revoked/);
    await bridge.unsafe("ROLLBACK");
  } finally { await bridge.end(); }
});
