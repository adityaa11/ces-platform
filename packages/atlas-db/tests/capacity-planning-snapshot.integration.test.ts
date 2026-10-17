import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

type Result = Readonly<{ status: "qualified" | "inactive" | "unknown" | "unfit" | "stale"; reason?: string; snapshot?: Record<string, unknown> }>;
type Binding = Readonly<{
  principal: string; credential: string; processId: string; capability: string; routeId: string; serviceClass: "background" | "interactive"; prospective?: boolean;
}>;

const semantic: Binding = {
  principal: "fixture.capacity-planning.semantic-reader/v1", credential: "fixture-semantic-reader-credential-v1",
  processId: "semantic:v1", capability: "atlas.semantic.extract", routeId: "shared-route", serviceClass: "background", prospective: true,
};
const chat: Binding = {
  principal: "fixture.capacity-planning.chat-reader/v1", credential: "fixture-chat-reader-credential-v1",
  processId: "chat:v1", capability: "atlas.chat.default", routeId: "chat-route", serviceClass: "interactive",
};

/**
 * Test-only authenticated boundary. The fixture owns the Bridge connection;
 * the two fake consumers have only opaque credentials and returned snapshots.
 */
class CapacityPlanningSnapshotV1Fixture {
  constructor(private readonly bridge: ReturnType<typeof postgres>, private readonly domain: string) {}

  async read(credential: string, assertions: Partial<Pick<Binding, "processId" | "routeId" | "serviceClass">> & { activationRevision?: string; intent?: string } = {}): Promise<Result> {
    const binding = [semantic, chat].find((candidate) => candidate.credential === credential);
    if (!binding) return { status: "inactive", reason: "unauthorized_principal" };
    if (assertions.intent && assertions.intent !== "planning_read") return { status: "inactive", reason: "planning_snapshot_is_not_dispatch" };
    if (assertions.processId && assertions.processId !== binding.processId || assertions.routeId && assertions.routeId !== binding.routeId || assertions.serviceClass && assertions.serviceClass !== binding.serviceClass) {
      return { status: "inactive", reason: "server_binding_assertion_mismatch" };
    }
    const active = await this.bridge.unsafe("SELECT * FROM bridge.resolve_active_desired_admission_profile($1)", [this.domain]);
    if (!active[0]) return { status: "stale", reason: "active_plan_missing" };
    if (assertions.activationRevision && assertions.activationRevision !== String(active[0].activation_revision)) return { status: "stale", reason: "activation_revision_stale" };
    const capacity = await this.bridge.unsafe("SELECT * FROM bridge.provider_capacity_profile WHERE quota_domain_id=$1 AND profile_version=$2", [this.domain, active[0].provider_capacity_profile_version]);
    const process = await this.bridge.unsafe("SELECT * FROM bridge.provider_process_profile WHERE process_id=$1 AND profile_version='v1'", [binding.processId]);
    const workload = process[0] && await this.bridge.unsafe("SELECT * FROM bridge.workload_envelope_profile WHERE workload_id=$1 AND profile_version=$2", [process[0].workload_id, process[0].workload_profile_version]);
    if (!capacity[0] || !process[0] || !workload?.[0] || !process[0].active || !workload[0].active) return { status: "inactive", reason: "unqualified_or_inactive_policy" };
    const routes = capacity[0].associated_routes as readonly { routeId: string; providerId: string }[];
    if (!routes.some((route) => route.routeId === binding.routeId) || !(process[0].eligible_route_ids as readonly string[]).includes(binding.routeId) || process[0].capability !== binding.capability) return { status: "inactive", reason: "route_or_capability_unqualified" };
    const limits = capacity[0].limits as Record<string, { state: string; value?: number }>;
    if (Object.values(limits).some((dimension) => dimension.state === "unknown")) return { status: "unknown", reason: "required_quota_dimension_unknown" };
    if (Object.values(limits).some((dimension) => dimension.state === "zero" || dimension.value === 0)) return { status: "unfit", reason: "required_quota_dimension_zero" };
    return {
      status: "qualified",
      snapshot: {
        apiVersion: "CapacityPlanningSnapshot/v1", principal: binding.principal,
        registry: { id: "server-processes", version: "v1" },
        process: { id: process[0].process_id, profileVersion: process[0].profile_version, capability: process[0].capability, serviceClass: process[0].service_class, eligibleRouteIds: process[0].eligible_route_ids },
        workload: { id: workload[0].workload_id, profileVersion: workload[0].profile_version, structuralBound: workload[0].structural_bound, estimator: workload[0].estimator, outputReservation: workload[0].output_reservation, safetyPolicy: workload[0].safety_policy, quotaAccountingPolicyId: workload[0].quota_accounting_policy_id },
        quotaDomain: this.domain, route: binding.routeId, capacity: { profileVersion: capacity[0].profile_version, limits, windowPolicies: capacity[0].window_policies, quotaAccountingPolicyId: capacity[0].quota_accounting_policy_id },
        plan: { profileVersion: active[0].desired_profile_version, activationRevision: String(active[0].activation_revision), plannerVersion: active[0].planner_version, effectiveFrom: active[0].effective_from, policy: active[0].profile },
      },
    };
  }

  async readProspective(credential: string, syntheticRequest: { bytes: number; inputTokens: number }): Promise<Result> {
    const binding = [semantic, chat].find((candidate) => candidate.credential === credential);
    if (!binding?.prospective) return { status: "inactive", reason: "prospective_scope_not_granted" };
    const active = await this.read(credential);
    if (active.status !== "qualified") return active;
    const bound = active.snapshot!.workload as { structuralBound: { maxRequestBytes: number; maxInputTokens: number } };
    if (syntheticRequest.bytes > bound.structuralBound.maxRequestBytes || syntheticRequest.inputTokens > bound.structuralBound.maxInputTokens) return { status: "unfit", reason: "synthetic_request_exceeds_structural_bound" };
    return { status: "inactive", reason: "prospective_planning_only", snapshot: { ...active.snapshot, view: "prospective-planning-only", active: false, syntheticRequest } };
  }
}

const capacity = (state: "known" | "unknown" | "zero" = "known") => ({
  rpm: state === "known" ? { state, value: 100 } : { state }, tpm: state === "known" ? { state, value: 10_000 } : { state },
  rpd: state === "known" ? { state, value: 1_000 } : { state }, concurrency: state === "known" ? { state, value: 10 } : { state },
});
const windows = { rpm: { policyId: "rpm", policyVersion: "v1", kind: "fixed_window" }, tpm: { policyId: "tpm", policyVersion: "v1", kind: "fixed_window" }, rpd: { policyId: "rpd", policyVersion: "v1", kind: "daily_calendar" } };
const plan = (version: string) => ({ quotaDomainId: "shared", profileVersion: version, usableGlobalCapacity: { rpm: 90, tpm: 9_000, rpd: 900, concurrency: 9 }, hardInteractiveReserve: { rpm: 20, tpm: 2_000, rpd: 200, concurrency: 2 }, backgroundCapacity: { rpm: 70, tpm: 7_000, rpd: 700, concurrency: 7 }, policyVersion: "planning-policy-v1", activationVersion: version });

test("RC-00505-10/11 authenticate two server-bound planning readers without admission side effects", { skip: !databaseUrl }, async () => {
  const suffix = `capacity-snapshot-${Date.now()}`;
  const domain = `${suffix}-shared`;
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 }); const atlas = postgres(atlasUrl.toString(), { max: 1 }); const admin = postgres(databaseUrl!, { max: 1 });
  // These are transaction-scoped immutable fixture identities; rollback keeps
  // their server-authorized `semantic:v1` / `chat:v1` names isolated.
  const processId = (binding: Binding) => binding.processId;
  try {
    await bridge.unsafe("BEGIN");
    for (const version of ["v1", "zero-v1", "unknown-v1"]) await bridge.unsafe(
      "INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture-account',$3::jsonb,$4::jsonb,$5::jsonb,'quota-v1','operator_config','fixture://capacity',$2,now(),now())",
      [domain, version, [{ routeId: "shared-route", providerId: "anoman" }, { routeId: "chat-route", providerId: "anoman" }], capacity(version === "zero-v1" ? "zero" : version === "unknown-v1" ? "unknown" : "known"), windows],
    );
    for (const binding of [semantic, chat]) {
      const id = processId(binding); const workloadId = `${id}-workload`;
      await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,$2::jsonb,$3::jsonb,$4::jsonb,'quota-v1',$5::jsonb,$6::jsonb)", [workloadId, [binding.processId.startsWith("semantic") ? "semantic" : "chat"], { identity: `${binding.processId}-bound`, version: "v1", maxRequestBytes: 10_000, maxInputTokens: binding === semantic ? 4_000 : 500 }, { identity: `${binding.processId}-estimator`, version: "v2" }, { policyId: `${binding.processId}-output`, policyVersion: "v1", maxOutputTokens: 100 }, { policyId: `${binding.processId}-safety`, policyVersion: "v1" }]);
      await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1',$2,$3,$4,'{}',$5::jsonb,true,$6::jsonb,$7,'v1')", [id, binding.processId.startsWith("semantic") ? "semantic" : "chat", binding.capability, binding.serviceClass, binding.serviceClass === "background" ? { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "semantic-cap" }, hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } } : { hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } }, [binding.routeId], workloadId]);
    }
    for (const version of ["plan-v1", "plan-zero", "plan-unknown"]) {
      const capacityVersion = version === "plan-zero" ? "zero-v1" : version === "plan-unknown" ? "unknown-v1" : "v1";
      await bridge.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,$2,$3,'planner-v1',now(),$4::jsonb)", [domain, version, capacityVersion, plan(version)]);
      for (const binding of [semantic, chat]) await bridge.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,$2,$3,'v1',$4,'v1')", [domain, version, processId(binding), `${processId(binding)}-workload`]);
    }
    await bridge.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    const fixture = new CapacityPlanningSnapshotV1Fixture(bridge, domain);
    // Exact frozen shared capacity association and independently qualified capability pairs.
    const routes = await bridge.unsafe("SELECT associated_routes FROM bridge.provider_capacity_profile WHERE quota_domain_id=$1 AND profile_version='v1'", [domain]);
    assert.deepEqual(routes[0].associated_routes.map((route: { routeId: string }) => route.routeId).sort(), ["chat-route", "shared-route"]);
    const [beforeProviderJobs] = await admin.unsafe("SELECT count(*)::integer AS count FROM pgboss.job WHERE name='bridge-provider-admitted-execution-v1'");
    const semanticRead = await fixture.read(semantic.credential); const chatRead = await fixture.read(chat.credential);
    assert.equal(semanticRead.status, "qualified"); assert.equal(chatRead.status, "qualified");
    assert.equal(semanticRead.snapshot!.apiVersion, chatRead.snapshot!.apiVersion);
    assert.equal((semanticRead.snapshot!.plan as { activationRevision: string }).activationRevision, (chatRead.snapshot!.plan as { activationRevision: string }).activationRevision);
    assert.equal((semanticRead.snapshot!.process as { serviceClass: string }).serviceClass, "background"); assert.equal((chatRead.snapshot!.process as { serviceClass: string }).serviceClass, "interactive");
    assert.match(JSON.stringify(semanticRead.snapshot), /semantic:v1-estimator/); assert.match(JSON.stringify(chatRead.snapshot), /chat:v1-estimator/);
    assert.equal((await fixture.read(semantic.credential, { routeId: "chat-route" })).reason, "server_binding_assertion_mismatch");
    assert.equal((await fixture.read(semantic.credential, { serviceClass: "interactive" })).reason, "server_binding_assertion_mismatch");
    assert.equal((await fixture.read("forged-credential")).reason, "unauthorized_principal");
    assert.equal((await fixture.read(semantic.credential, { activationRevision: "0" })).status, "stale");
    assert.equal((await fixture.read(semantic.credential, { intent: "dispatch" })).reason, "planning_snapshot_is_not_dispatch");
    const prospective = await fixture.readProspective(semantic.credential, { bytes: 100, inputTokens: 100 });
    assert.deepEqual({ status: prospective.status, reason: prospective.reason, view: prospective.snapshot?.view }, { status: "inactive", reason: "prospective_planning_only", view: "prospective-planning-only" });
    assert.equal((await fixture.readProspective(chat.credential, { bytes: 100, inputTokens: 100 })).reason, "prospective_scope_not_granted");
    assert.equal((await fixture.readProspective(semantic.credential, { bytes: 10_001, inputTokens: 100 })).status, "unfit");
    const [afterProviderJobs] = await admin.unsafe("SELECT count(*)::integer AS count FROM pgboss.job WHERE name='bridge-provider-admitted-execution-v1'");
    assert.equal(afterProviderJobs.count, beforeProviderJobs.count, "planning reads must not enqueue provider jobs");
    await bridge.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-zero')", [domain]); assert.deepEqual(await fixture.read(semantic.credential), { status: "unfit", reason: "required_quota_dimension_zero" });
    await bridge.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-unknown')", [domain]); assert.deepEqual(await fixture.read(semantic.credential), { status: "unknown", reason: "required_quota_dimension_unknown" });
    await bridge.unsafe("DELETE FROM bridge.active_desired_admission_profile WHERE quota_domain_id=$1", [domain]); assert.deepEqual(await fixture.read(semantic.credential), { status: "stale", reason: "active_plan_missing" });
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.resolve_active_desired_admission_profile($1)", [domain]), /permission denied/i);
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.provider_capacity_profile WHERE quota_domain_id=$1", [domain]), /permission denied/i);
    const [counters] = await admin.unsafe("SELECT (SELECT count(*)::integer FROM bridge.provider_work_attempt WHERE quota_domain_id=$1) attempts, (SELECT count(*)::integer FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) reservations, (SELECT count(*)::integer FROM bridge.provider_work_dispatch d JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) provider_jobs, (SELECT count(*)::integer FROM bridge.provider_transport_claim t JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) transports, (SELECT count(*)::integer FROM bridge.provider_quota_window_state WHERE quota_domain_id=$1) quota_mutations", [domain]);
    assert.deepEqual(counters, { attempts: 0, reservations: 0, provider_jobs: 0, transports: 0, quota_mutations: 0 });
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([admin.end(), bridge.end(), atlas.end()]);
  }
});
