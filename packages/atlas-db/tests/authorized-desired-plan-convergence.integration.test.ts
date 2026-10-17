import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { planDesiredAdmissionProfile } from "../../../apps/agents-bridge/src/capacity-planner.ts";

const databaseUrl = process.env.DATABASE_URL;

const limits = (tpm: number) => ({
  rpm: { state: "known", value: 100 }, tpm: { state: "known", value: tpm },
  rpd: { state: "known", value: 1_000 }, concurrency: { state: "known", value: 10 },
});
const windows = { rpm: { policyId: "rpm", policyVersion: "v1", kind: "fixed_window" }, tpm: { policyId: "tpm", policyVersion: "v1", kind: "fixed_window" }, rpd: { policyId: "rpd", policyVersion: "v1", kind: "daily_calendar" } };

test("RC-00505-03a/07a/08 converge qualified effective inputs without runtime policy", { skip: !databaseUrl }, async () => {
  const suffix = `convergence-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const admin = postgres(databaseUrl!, { max: 1 });
  const profile = (capacityVersion: string, semanticVersion: string, semanticTokens: number) => planDesiredAdmissionProfile(
    { quotaDomainId: domain, profileVersion: capacityVersion, limits: limits(capacityVersion === "capacity-v2" ? 5_000 : 10_000) },
    [
      { processId: `${suffix}-semantic`, profileVersion: semanticVersion, serviceClass: "background", active: true, workloadProfile: { workloadId: `${suffix}-semantic-workload`, profileVersion: semanticVersion }, allocationPolicy: { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "semantic-cap" } } },
      { processId: `${suffix}-chat`, profileVersion: "v1", serviceClass: "interactive", active: true, workloadProfile: { workloadId: `${suffix}-chat-workload`, profileVersion: "v1" }, allocationPolicy: {} },
    ] as any,
    [
      { workloadId: `${suffix}-semantic-workload`, profileVersion: semanticVersion, active: true, structuralBound: { maxInputTokens: semanticTokens }, outputReservation: { maxOutputTokens: 100 } },
      { workloadId: `${suffix}-chat-workload`, profileVersion: "v1", active: true, structuralBound: { maxInputTokens: 500 }, outputReservation: { maxOutputTokens: 100 } },
    ] as any,
    { plannerVersion: "planner-v1", effectiveFrom: "2026-10-17T00:00:00.000Z", headroomPolicy: { policyId: "headroom", policyVersion: "v1", reserve: { rpm: 10, tpm: 1_000, rpd: 100, concurrency: 1 } }, interactiveReserveTargets: [{ processId: `${suffix}-chat`, profileVersion: "v1", serviceTargetId: "chat-slo", reserve: { rpm: 20, tpm: 2_000, rpd: 200, concurrency: 2 } }] } as any,
  );
  const inputs = (semanticVersion: string) => [
    { processId: `${suffix}-semantic`, processProfileVersion: semanticVersion, workloadId: `${suffix}-semantic-workload`, workloadProfileVersion: semanticVersion },
    { processId: `${suffix}-chat`, processProfileVersion: "v1", workloadId: `${suffix}-chat-workload`, workloadProfileVersion: "v1" },
  ];
  const publish = (expected: number | null, capacityVersion: string, semanticVersion: string, semanticTokens: number) => bridge.unsafe(
    "SELECT * FROM bridge.publish_converged_desired_admission_profile($1,$2,$3,'planner-v1','2026-10-17T00:00:00.000Z',$4::jsonb,$5::jsonb)",
    [domain, expected, capacityVersion, profile(capacityVersion, semanticVersion, semanticTokens), inputs(semanticVersion)],
  );
  try {
    await bridge.unsafe("BEGIN");
    for (const [version, tpm] of [["capacity-v1", 10_000], ["capacity-v2", 5_000], ["capacity-v3", 7_000], ["capacity-v4", 8_000]] as const) {
      await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3::jsonb,$4::jsonb,$5::jsonb,'quota-v1','qualified_observation','fixture://qualified-capacity',$2,now(),now())", [domain, version, [{ routeId: "semantic-route", providerId: "anoman" }, { routeId: "chat-route", providerId: "anoman" }], limits(tpm), windows]);
    }
    for (const [workloadId, version, tokens, kinds] of [[`${suffix}-semantic-workload`, "v1", 4_000, ["semantic"]], [`${suffix}-semantic-workload`, "v2", 100, ["semantic"]], [`${suffix}-chat-workload`, "v1", 500, ["chat"]]] as const) {
      await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,$2,true,$3::jsonb,$4::jsonb,'{\"identity\":\"estimator\",\"version\":\"v1\"}'::jsonb,'quota-v1','{\"policyId\":\"output\",\"policyVersion\":\"v1\",\"maxOutputTokens\":100}'::jsonb,'{\"policyId\":\"safety\",\"policyVersion\":\"v1\"}'::jsonb)", [workloadId, version, kinds, { identity: `${workloadId}-${version}`, version, maxRequestBytes: 10_000, maxInputTokens: tokens }]);
    }
    const insertProcess = (id: string, version: string, kind: string, serviceClass: string, route: string, workload: string, workloadVersion: string) => bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,$2,$3,$4,$5,'{}',$6::jsonb,true,$7::jsonb,$8,$9)", [id, version, kind, kind === "chat" ? "atlas.chat.default" : "atlas.semantic.extract", serviceClass, serviceClass === "background" ? { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "semantic-cap" }, hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } } : { hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } }, [route], workload, workloadVersion]);
    await insertProcess(`${suffix}-semantic`, "v1", "semantic", "background", "semantic-route", `${suffix}-semantic-workload`, "v1");
    await insertProcess(`${suffix}-semantic`, "v2", "semantic", "background", "semantic-route", `${suffix}-semantic-workload`, "v2");
    await insertProcess(`${suffix}-chat`, "v1", "chat", "interactive", "chat-route", `${suffix}-chat-workload`, "v1");
    // A registered eligible profile alone is not activation authority.
    await insertProcess(`${suffix}-unselected`, "v1", "semantic", "background", "semantic-route", `${suffix}-semantic-workload`, "v1");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.active_desired_admission_profile WHERE quota_domain_id=$1", [domain]))[0].count, 0);

    const [first] = await publish(null, "capacity-v1", "v1", 4_000);
    assert.equal(first.status, "published"); assert.equal(first.activation_revision, "1");
    const [same] = await bridge.unsafe("SELECT * FROM bridge.publish_converged_desired_admission_profile($1,$2,$3,'planner-v1','2026-10-17T00:00:00.000Z',$4::jsonb,$5::jsonb)", [domain, null, "capacity-v1", profile("capacity-v1", "v1", 4_000), inputs("v1").reverse()]);
    assert.deepEqual({ status: same.status, revision: same.activation_revision }, { status: "unchanged", revision: "1" });
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1", [domain]))[0].count, 1);

    const [lower] = await publish(1, "capacity-v2", "v2", 100);
    assert.equal(lower.status, "published"); assert.equal(lower.activation_revision, "2");
    assert.deepEqual((await bridge.unsafe("SELECT status,reason FROM bridge.resolve_versioned_planning_envelope($1,$2,1,$3,'v1',100,100)", [domain, first.desired_profile_version, `${suffix}-semantic`]))[0], { status: "stale", reason: "planning_identity_superseded" });
    assert.deepEqual((await bridge.unsafe("SELECT status,reason FROM bridge.resolve_versioned_planning_envelope($1,$2,2,$3,'v2',100,101)", [domain, lower.desired_profile_version, `${suffix}-semantic`]))[0], { status: "unfit", reason: "request_exceeds_versioned_structural_bound" });
    assert.deepEqual((await bridge.unsafe("SELECT status,reason FROM bridge.resolve_versioned_planning_envelope($1,$2,2,$3,'v1',100,100)", [domain, lower.desired_profile_version, `${suffix}-chat`]))[0], { status: "qualified", reason: "within_versioned_structural_bound" });
    await bridge.unsafe("SAVEPOINT operational_intent_is_not_capacity");
    await assert.rejects(() => publish(2, "capacity_revision_request", "v2", 100), /qualified capacity profile.*missing/i);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT operational_intent_is_not_capacity");

    const [beforeAttempts] = await admin.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_attempt WHERE quota_domain_id=$1", [domain]);
    const concurrent = await Promise.all([publish(2, "capacity-v3", "v2", 100), publish(2, "capacity-v4", "v2", 100)]);
    assert.deepEqual(concurrent.map(([row]) => row.status).sort(), ["published", "stale"]);
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=$1", [domain]))[0].count, 3);
    const [afterAttempts] = await admin.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_attempt WHERE quota_domain_id=$1", [domain]);
    assert.equal(afterAttempts.count, beforeAttempts.count, "planning convergence must not create runtime attempts");
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([bridge.end(), admin.end()]);
  }
});
