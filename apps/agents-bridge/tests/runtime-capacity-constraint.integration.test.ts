import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createRuntimeCapacityConstraintReader, type RuntimeCapacityConstraintPrincipal } from "../src/runtime-capacity-constraint.js";
import { createBridgeApp } from "../src/app.js";
import { TestRuntime } from "../src/runtime.js";

const databaseUrl = process.env.DATABASE_URL;

test("RC-BSSV2-00604-11 exposes an authenticated, conservative runtime read with zero operational deltas", { skip: !databaseUrl }, async () => {
  const suffix = `runtime-constraint-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const background = { credential: `${suffix}-background-credential`, principalId: `${suffix}-background-reader`, quotaDomainId: domain, processId: `${suffix}-background`, processProfileVersion: "v1", routeId: `${suffix}-background-route`, serviceClass: "background" as const };
  const interactive = { credential: `${suffix}-interactive-credential`, principalId: `${suffix}-interactive-reader`, quotaDomainId: domain, processId: `${suffix}-interactive`, processProfileVersion: "v1", routeId: `${suffix}-interactive-route`, serviceClass: "interactive" as const };
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const authorityVersions = new Map<string, number>();
  let sends = 0;
  const principals = new Map<string, RuntimeCapacityConstraintPrincipal>([
    [background.credential, background], [interactive.credential, interactive],
    [`${suffix}-foreign-domain`, { ...background, quotaDomainId: `${suffix}-foreign-domain` }],
    [`${suffix}-forged-class`, { ...background, serviceClass: "interactive" }],
    [`${suffix}-forged-route`, { ...background, routeId: `${suffix}-foreign-route` }],
  ]);
  const reader = createRuntimeCapacityConstraintReader(
    { executeSql: async (statement, values) => ({ rows: await bridge.unsafe(statement, values as never[]) }) },
    { authenticate: (credential) => principals.get(credential) ?? null },
  );
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "runtime-constraint-fixture", runtimeCapacityConstraintReader: reader });
  const counters = async () => {
    const [row] = await bridge.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_work_reservation reservation JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch dispatch JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS jobs,
      (SELECT count(*)::int FROM bridge.provider_transport_claim claim JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS claims,
      (SELECT count(*)::int FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=$1) AS quota_mutations`, [domain]);
    return { ...row, sends };
  };
  try {
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    assert.ok(address && typeof address !== "string");
    const readThroughBridge = async (credential: string, expectedEffectiveConstraintRevision?: string) => {
      const query = expectedEffectiveConstraintRevision === undefined ? "" : `?expectedEffectiveConstraintRevision=${encodeURIComponent(expectedEffectiveConstraintRevision)}`;
      const response = await fetch(`http://127.0.0.1:${address.port}/v1/runtime-capacity-constraint${query}`, { headers: { authorization: `Bearer ${credential}` } });
      assert.equal(response.status, 200);
      return await response.json() as Record<string, unknown>;
    };
    const profile = { usableGlobalCapacity: { rpm: 10, tpm: 100, rpd: 10, concurrency: 2 }, hardInteractiveReserve: { rpm: 2, tpm: 20, rpd: 2, concurrency: 1 }, backgroundCapacity: { rpm: 8, tpm: 80, rpd: 8, concurrency: 1 } };
    const windows = { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } };
    const associatedRoutes = [background, interactive].map((subject) => ({
      routeId: subject.routeId,
      providerId: "fixture",
      modelOrProcessorId: "fixture-model-v1",
      adapterVersion: "adapter-v1",
      qualificationRef: "qualification://fixture",
      qualificationVersion: "qualified-v1",
      capability: subject.serviceClass === "background" ? "atlas.semantic.extract" : "atlas.chat.default",
    }));
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'capacity-v1','fixture',$2::jsonb,'{}'::jsonb,$3::jsonb,'operator_config','fixture','v1',now(),now())", [domain, associatedRoutes, windows]);
    for (const subject of [background, interactive]) {
      const kind = subject.serviceClass === "background" ? "semantic" : "chat";
      const capability = subject.serviceClass === "background" ? "atlas.semantic.extract" : "atlas.chat.default";
      await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',true,$2::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb)", [`${subject.processId}-workload`, [kind]]);
      await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1',$2,$3,$4,'{}'::jsonb,$5::jsonb,true,$6::jsonb,$7,'v1')", [subject.processId, kind, capability, subject.serviceClass, subject.serviceClass === "background" ? { background: { weight: 1, mayBorrowIdleCapacity: false }, hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } } : { hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } }, [subject.routeId], `${subject.processId}-workload`]);
      const [authority] = await bridge.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'fixture','fixture-model-v1','adapter-v1','qualification://fixture','qualified-v1',$3)", [subject.routeId, domain, capability]);
      authorityVersions.set(subject.routeId, Number(authority.authority_version));
    }
    await bridge.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','capacity-v1','planner-v1',now(),$2::jsonb)", [domain, profile]);
    for (const subject of [background, interactive]) await bridge.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, subject.processId, `${subject.processId}-workload`]);
    await bridge.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await bridge.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'capacity-v1',$2,($3::jsonb)->$2,'{}'::jsonb,true,now()+interval '1 hour')", [domain, dimension, windows]);

    // Establish real, non-inert 03A state before the external readers run.
    await bridge.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','baseline',$4::jsonb,'plan-v1',1,now()+interval '1 hour',now()+interval '1 hour')", [`${suffix}-baseline-work`, domain, background.processId, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]);
    await bridge.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2::bigint)", [`${suffix}-baseline-work`, authorityVersions.get(background.routeId)]);
    const [admission] = await bridge.unsafe("SELECT * FROM bridge.admit_route_aware_provider_work_attempt($1,1,'background')", [`${suffix}-baseline-work`]);
    await bridge.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [admission.reservation_id]);
    const before = await counters();
    assert.deepEqual(before, { attempts: 1, reservations: 1, jobs: 1, claims: 1, quota_mutations: 4, sends: 0 }, "the read must be tested against live runtime state, not an inert database");

    // These fake consumers know only an opaque credential and the Bridge URL;
    // identity is resolved by the composed server route, never from request scope.
    const [backgroundRead, interactiveRead] = await Promise.all([readThroughBridge(background.credential), readThroughBridge(interactive.credential)]);
    assert.equal(backgroundRead.reason, "eligible_in_principle");
    assert.equal(interactiveRead.reason, "eligible_in_principle");
    assert.equal(backgroundRead.apiVersion, "RuntimeCapacityConstraint/v1");
    assert.equal(backgroundRead.readIsNotSendPermit, true);
    assert.equal((backgroundRead.eligible as { background: boolean }).background, true);
    assert.equal((interactiveRead.eligible as { interactive: boolean }).interactive, true);
    assert.equal((backgroundRead.plan as { activationRevision: number }).activationRevision, 1);
    assert.match(String(backgroundRead.effectiveConstraintRevision), /^[a-f0-9]{32}$/);
    assert.equal((backgroundRead.safeWindow as Record<string, { state: string }>).rpm?.state, "known");
    assert.equal((backgroundRead.clamp as { active: boolean }).active, false);
    assert.equal("numericRemainingUnits" in backgroundRead, false, "the public projection never exposes raw counters");
    assert.deepEqual(await counters(), before, "a read creates no attempt, reservation, job, claim, send, or quota mutation");

    assert.equal((await readThroughBridge("forged-credential")).reason, "inactive_or_unauthorized");
    assert.equal((await readThroughBridge(`${suffix}-foreign-domain`)).reason, "inactive_or_unauthorized");
    assert.equal((await readThroughBridge(`${suffix}-forged-class`)).reason, "inactive_or_unauthorized");
    assert.equal((await readThroughBridge(`${suffix}-forged-route`)).reason, "inactive_or_unauthorized");
    assert.deepEqual(await counters(), before, "negative reads are equally non-mutating");

    await bridge.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,30,60)", [`${suffix}-policy`, domain]);
    await bridge.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'route','qualified','rpm',$4,NULL)", [domain, background.routeId, `${suffix}-cooldown`, `${suffix}-window`]);
    const cooldownRead = await readThroughBridge(background.credential);
    assert.equal(cooldownRead.reason, "temporarily_pressure_blocked");
    assert.equal((cooldownRead.cooldown as { active: boolean }).active, true);
    assert.equal((await readThroughBridge(background.credential, String(backgroundRead.effectiveConstraintRevision))).reason, "unknown_policy_blocked", "a stale constraint revision never remains eligible");
    await bridge.unsafe("UPDATE bridge.provider_operational_pressure_incident SET recovered_at=clock_timestamp() WHERE quota_domain_id=$1", [domain]);
    await bridge.unsafe("UPDATE bridge.runtime_pressure_safety_policy SET active=false WHERE quota_domain_id=$1", [domain]);
    await bridge.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,30,'route','qualified','tpm',$4,NULL)", [domain, background.routeId, `${suffix}-unavailable`, `${suffix}-unavailable-window`]);
    assert.equal((await readThroughBridge(background.credential)).reason, "unknown_policy_blocked", "unavailable pressure policy fails closed");
    await bridge.unsafe("DELETE FROM bridge.provider_quota_window_state WHERE quota_domain_id=$1 AND dimension_id='tpm'", [domain]);
    assert.equal((await readThroughBridge(background.credential)).reason, "unknown_policy_blocked", "a missing runtime window fails closed");
    await assert.rejects(() => atlas.unsafe("SELECT bridge.read_runtime_capacity_constraint($1,$2,$3,$4,$5)", [domain, background.processId, "v1", background.routeId, "background"]), /permission denied/i);
  } finally {
    await Promise.all([app.close(), bridge.end(), atlas.end()]);
  }
});
