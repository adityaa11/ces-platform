import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import {
  anthropicLikeSchemaOnlyDescriptor,
  openAiLikeSchemaOnlyDescriptor,
  parseSchemaOnlyProviderCapacityDescriptor,
} from "./fixtures/provider-capacity-descriptor-schema.fixture.js";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-05-06 keeps future descriptors data-only and preserves known four-dimension admission", { skip: !databaseUrl }, async () => {
  const url = new URL(databaseUrl!);
  url.username = "agents_bridge";
  url.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(url.toString(), { max: 1 });
  const suffix = `provider-neutral-${Date.now()}`;
  const fourDimensions = { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "enforced", limitSource: "provider" }, concurrency: { mode: "enforced", limitSource: "provider" } };
  const knownLimits = { rpm: { state: "known", value: 4 }, tpm: { state: "known", value: 40 }, rpd: { state: "known", value: 2 }, concurrency: { state: "known", value: 2 } };
  const windows = { rpm: { kind: "fixed_window", windowSeconds: 60 }, tpm: { kind: "fixed_window", windowSeconds: 60 }, rpd: { kind: "fixed_window", windowSeconds: 86_400 }, concurrency: { kind: "fixed", windowSeconds: 60 } };
  const operationalCounts = async (domain: string) => (await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$1) attempts,(SELECT count(*)::int FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) reservations,(SELECT count(*)::int FROM bridge.provider_work_dispatch d JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) dispatches,(SELECT count(*)::int FROM bridge.provider_transport_claim t JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) transports", [domain]))[0];
  const insertCapacity = async (domain: string, routes: string[], limits: object = knownLimits) => {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','schema-only-fixture',$2::jsonb,$3::jsonb,$4::jsonb,'provider_docs','fixture://schema-only','v1',now(),now())", [domain, routes.map((routeId) => ({ routeId })), limits, windows]);
  };
  const insertPolicy = async (domain: string, route: string, approvalRef: string, dimensions: object = fourDimensions) => {
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v1',$3,'fixture-policy','v1','{}'::jsonb,'fixture',now())", [approvalRef, domain, route]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v1',$2,'fixture-policy','v1',$3,$4::jsonb,now())", [domain, route, approvalRef, dimensions]);
  };

  try {
    await sql.unsafe("BEGIN");

    // RC-00605-09: these fixture descriptors carry vocabulary only. They
    // cannot name a live provider, route, credential, or activation boundary.
    assert.deepEqual(parseSchemaOnlyProviderCapacityDescriptor(openAiLikeSchemaOnlyDescriptor), openAiLikeSchemaOnlyDescriptor);
    assert.deepEqual(parseSchemaOnlyProviderCapacityDescriptor(anthropicLikeSchemaOnlyDescriptor), anthropicLikeSchemaOnlyDescriptor);
    assert.throws(() => parseSchemaOnlyProviderCapacityDescriptor({ ...anthropicLikeSchemaOnlyDescriptor, dimensions: [...anthropicLikeSchemaOnlyDescriptor.dimensions, { ...anthropicLikeSchemaOnlyDescriptor.dimensions[0], id: "tokens_per_minute" }] }), /split input\/output/);
    assert.throws(() => parseSchemaOnlyProviderCapacityDescriptor({ ...openAiLikeSchemaOnlyDescriptor, fixtureKind: "live" }), /invalid schema-only/);

    // An attempted live profile with an unsupported fifth dimension fails at
    // the existing exact-four-dimension policy boundary before a plan, permit,
    // dispatch, or transport can exist.
    const unsupportedDomain = `${suffix}-unsupported`;
    const unsupportedRoute = `${unsupportedDomain}-route`;
    await insertCapacity(unsupportedDomain, [unsupportedRoute], { ...knownLimits, input_tokens_per_minute: { state: "known", value: 10 } });
    await insertPolicy(unsupportedDomain, unsupportedRoute, `${unsupportedDomain}-approval`);
    await sql.unsafe("SAVEPOINT unsupported_live_descriptor");
    await assert.rejects(() => sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v1',$2)", [unsupportedDomain, unsupportedRoute]), /unsupported or incomplete dimension set/);
    await sql.unsafe("ROLLBACK TO SAVEPOINT unsupported_live_descriptor");
    assert.deepEqual(await operationalCounts(unsupportedDomain), { attempts: 0, reservations: 0, dispatches: 0, transports: 0 });

    // RC-00605-07: an alternate route in one shared quota domain cannot install
    // a contradictory mask, while another domain has an independent policy.
    const sharedDomain = `${suffix}-shared`;
    const sharedRouteA = `${sharedDomain}-a`;
    const sharedRouteB = `${sharedDomain}-b`;
    await insertCapacity(sharedDomain, [sharedRouteA, sharedRouteB]);
    await insertPolicy(sharedDomain, sharedRouteA, `${sharedDomain}-approval-a`);
    await sql.unsafe("SAVEPOINT contradictory_shared_mask");
    await assert.rejects(() => insertPolicy(sharedDomain, sharedRouteB, `${sharedDomain}-approval-b`, { ...fourDimensions, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${sharedDomain}-approval-b` } }), /conflicting enforcement dimensions/);
    await sql.unsafe("ROLLBACK TO SAVEPOINT contradictory_shared_mask");
    assert.equal((await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v1',$2) AS policy", [sharedDomain, sharedRouteA]))[0].policy.dimensions.rpd.mode, "enforced");
    assert.deepEqual(await operationalCounts(sharedDomain), { attempts: 0, reservations: 0, dispatches: 0, transports: 0 });

    const independentDomain = `${suffix}-independent`;
    const independentRoute = `${independentDomain}-route`;
    await insertCapacity(independentDomain, [independentRoute]);
    await insertPolicy(independentDomain, independentRoute, `${independentDomain}-approval`);
    assert.equal((await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v1',$2) AS policy", [independentDomain, independentRoute]))[0].policy.quotaDomainId, independentDomain);

    // RC-00605-07 / RC-00605-10: the historical no-policy-binding four-known
    // shape remains exact. Its daily RPD window has a known, matching reset and
    // RPD saturation rejects a second request without a transport claim.
    const knownDomain = `${suffix}-known-rpd`;
    const knownRoute = `${knownDomain}-route`;
    const processId = `${knownDomain}-interactive`;
    const resetAt = "2030-01-02T00:00:00.000Z";
    const profile = { usableGlobalCapacity: { rpm: 4, tpm: 40, rpd: 2, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 3, tpm: 39, rpd: 1, concurrency: 1 }, backgroundLanes: [] };
    await insertCapacity(knownDomain, [knownRoute]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb)", [`${processId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','fixture-capability','interactive','{}'::jsonb,'{}'::jsonb,true,$2::jsonb,$3,'v1')", [processId, [knownRoute], `${processId}-workload`]);
    await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'schema-only-fixture','fixture-model-v1','fixture-adapter','qualification://fixture','fixture-qualified','fixture-capability')", [knownRoute, knownDomain]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','historical-four-known',now(),$2::jsonb)", [knownDomain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [knownDomain, processId, `${processId}-workload`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [knownDomain]);
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) {
      await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}'::jsonb,true,$4::timestamptz)", [knownDomain, dimension, windows, resetAt]);
    }
    const constraint = (await sql.unsafe("SELECT bridge.read_runtime_capacity_constraint($1,$2,'v1',$3,'interactive') AS constraint", [knownDomain, processId, knownRoute]))[0].constraint;
    assert.deepEqual(constraint.effectiveDimensions, ["rpm", "tpm", "rpd", "concurrency"]);
    assert.equal(constraint.reason, "eligible_in_principle");
    assert.equal(new Date(constraint.safeWindow.rpd.resetAt).toISOString(), resetAt);
    const admit = async (id: string, rpd: number) => (await sql.unsafe("SELECT bridge.admit_provider_work_admission_v1($1,$2,$3,'v1',$4,'interactive',$5,1,$6,'opaque',$7,$8::jsonb) AS outcome", [`${knownDomain}-principal`, knownDomain, processId, knownRoute, id, `${id}-key`, "a".repeat(64), { requestResourceEnvelope: { rpm: 1, tpm: 1, rpd, concurrency: 1 }, expectedEffectiveConstraintRevision: constraint.effectiveConstraintRevision, deadlineEpochMilliseconds: Date.now() + 60_000 }]))[0].outcome;
    assert.equal((await admit(`${knownDomain}-fills-rpd`, 2)).state, "dispatched_or_may_have_started");
    const beforeDenied = await operationalCounts(knownDomain);
    assert.notEqual((await admit(`${knownDomain}-rpd-denied`, 1)).state, "dispatched_or_may_have_started");
    assert.deepEqual(await operationalCounts(knownDomain), { ...beforeDenied, attempts: beforeDenied.attempts + 1 });
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim t JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1", [knownDomain]))[0].count, 0);
  } finally {
    await sql.unsafe("ROLLBACK");
    await sql.end();
  }
});
