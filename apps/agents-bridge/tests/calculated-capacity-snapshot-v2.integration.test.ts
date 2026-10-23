import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.js";
import { createCapacityPlanningSnapshotReader, type CapacityPlanningSnapshotPrincipal } from "../src/capacity-planning-snapshot.js";
import { TestRuntime } from "../src/runtime.js";

const databaseUrl = process.env.DATABASE_URL;

test("RC-01403-01..05 qualifies a calculated v2 candidate through the sole authenticated reader", { skip: !databaseUrl }, async () => {
  const suffix = `calculated-capacity-v2-${Date.now()}`;
  const domain = `${suffix}-anoman`;
  const processId = `${suffix}-process`;
  const workloadId = `${suffix}-workload`;
  const routeId = `${suffix}-route`;
  const effectiveFrom = "2026-10-23 00:00:00+00";
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const admin = postgres(databaseUrl!, { max: 1 });
  const principal: CapacityPlanningSnapshotPrincipal = { principalId: `${suffix}-reader`, quotaDomainId: domain, processId, processProfileVersion: "v1", routeId, serviceClass: "background", prospective: false, qualificationVersion: "v2" };
  const principals = new Map<string, CapacityPlanningSnapshotPrincipal>([
    [`${suffix}-credential`, principal],
    [`${suffix}-foreign`, { ...principal, quotaDomainId: `${domain}-foreign` }],
    [`${suffix}-route-mismatch`, { ...principal, routeId: `${routeId}-other` }],
  ]);
  const reader = createCapacityPlanningSnapshotReader(
    { executeSql: async (statement, values) => ({ rows: await bridge.unsafe(statement, values as never[]) }) },
    { authenticate: (credential) => principals.get(credential) ?? null },
  );
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "calculated-capacity-v2-fixture", capacityPlanningSnapshotReader: reader });
  const counters = async () => (await admin.unsafe(`SELECT
    (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$1) AS attempts,
    (SELECT count(*)::int FROM bridge.provider_work_reservation reservation JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS reservations,
    (SELECT count(*)::int FROM bridge.provider_quota_window_state WHERE quota_domain_id=$1) AS window_mutations,
    (SELECT count(*)::int FROM pgboss.job) AS jobs,
    (SELECT count(*)::int FROM bridge.provider_transport_claim claim JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS transports`, [domain]))[0];
  try {
    await bridge.unsafe("BEGIN");
    const route = { routeId, providerId: "anoman", modelOrProcessorId: "gemini-2.5-flash", adapterVersion: "anoman-adapter-v1", qualificationRef: `qualification://${suffix}`, qualificationVersion: "v1", capability: "atlas.semantic.extract" };
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'capacity-v1','anoman',$2::jsonb,$3::jsonb,$4::jsonb,'quota-v1','provider_api','fixture://anoman','v1',clock_timestamp(),$5::timestamptz)", [domain, [route], { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } }, { rpm: { kind: "fixed_window" }, tpm: { kind: "fixed_window" }, rpd: { kind: "unknown" } }, effectiveFrom]);
    const approvalRef = `${suffix}-rpd-approval`;
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'capacity-v1',$3,'anoman-policy','v1',$4::jsonb,'fixture',clock_timestamp())", [approvalRef, domain, routeId, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,$3,'anoman-policy','v1',$4,$5::jsonb,$6::timestamptz)", [domain, "capacity-v1", routeId, approvalRef, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef }, concurrency: { mode: "enforced", limitSource: "provider" } }, effectiveFrom]);
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]'::jsonb,$2::jsonb,$3::jsonb,'quota-v1',$4::jsonb,$5::jsonb)", [workloadId, { identity: `${suffix}-bound`, version: "v1", maxRequestBytes: 10_000, maxInputTokens: 4_000, maxContextTokens: 4_500 }, { identity: `${suffix}-estimator`, version: "v2" }, { policyId: `${suffix}-output`, policyVersion: "v1", maxOutputTokens: 500 }, { policyId: `${suffix}-safety`, policyVersion: "v1" }]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}'::jsonb,$2::jsonb,true,$3::jsonb,$4,'v1')", [processId, { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: `${suffix}-cap` }, hardInteractiveProtection: { policyId: `${suffix}-protection`, policyVersion: "v1" } }, [routeId], workloadId]);
    const [authority] = await bridge.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [routeId, domain, route.providerId, route.modelOrProcessorId, route.adapterVersion, route.qualificationRef, route.qualificationVersion, route.capability]);
    const allocation = { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], classTotals: { background: { rpm: 14, tpm: 28_000, concurrency: 17 } }, processes: [{ processId, profileVersion: "v1", serviceClass: "background", normalizedWeight: { numerator: 1, denominator: 1 }, baseline: { rpm: 14, tpm: 28_000, concurrency: 17 }, cap: { tpm: 28_000 } }] };
    const profile = { quotaDomainId: domain, providerCapacityProfileVersion: "capacity-v1", plannerVersion: "weighted-v1", effectiveFrom };
    const [candidate] = await bridge.unsafe("SELECT * FROM bridge.publish_shared_domain_calculated_desired_admission_profile($1,$2,$3,$4,$5::timestamptz,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb)", [domain, null, "capacity-v1", "weighted-v1", effectiveFrom, profile, [{ processId, processProfileVersion: "v1", workloadId, workloadProfileVersion: "v1" }], [{ routeId, authorityVersion: String(authority.authority_version) }], allocation]);
    const before = await counters();
    const direct = await bridge.unsafe("SELECT bridge.read_capacity_planning_snapshot($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS snapshot", [domain, processId, "v1", routeId, "background", false, 500, 250, 100, true]);
    assert.equal((direct[0].snapshot as { apiVersion: string }).apiVersion, "CapacityPlanningSnapshot/v2");
    const response = await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot?requestBytes=500&inputTokens=250&outputTokens=100", headers: { authorization: `Bearer ${suffix}-credential` } });
    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body) as Record<string, any>;
    assert.deepEqual({ apiVersion: body.apiVersion, status: body.status, readIsNotAdmissionPermit: body.readIsNotAdmissionPermit }, { apiVersion: "CapacityPlanningSnapshot/v2", status: "qualified", readIsNotAdmissionPermit: true });
    assert.deepEqual(body.identity, { quotaDomainId: domain, processId, processProfileVersion: "v1", processKind: "semantic", capability: "atlas.semantic.extract", serviceClass: "background", routeId, providerId: "anoman", modelOrProcessorId: "gemini-2.5-flash", adapterVersion: "anoman-adapter-v1", qualificationRef: `qualification://${suffix}`, qualificationVersion: "v1", authorityVersion: Number(authority.authority_version) });
    assert.deepEqual(body.allocation, { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], baseline: { rpm: 14, tpm: 28_000, concurrency: 17 }, normalizedWeight: { numerator: 1, denominator: 1 }, cap: { tpm: 28_000 }, allocationFingerprint: body.allocation.allocationFingerprint });
    assert.equal(body.revisions.candidateActivationRevision, Number(candidate.candidate_activation_revision));
    assert.equal(body.qualification.productionActive, false, "isolated qualification does not activate the production reader");
    assert.deepEqual(body.policyProvenance.dimensions.rpd, { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef }, "approved unknown RPD remains provenance only");
    assert.ok(!Object.hasOwn(body.allocation.baseline, "rpd"), "the unknown RPD has no numeric allocation");
    assert.equal(body.sizing.maxEligibleCompleteRequestTokens, 4_500);
    assert.equal(body.borrowing.runtimeOnly, true);
    assert.match(body.canonicalFingerprint, /^[a-f0-9]{32}$/);
    assert.deepEqual(await counters(), before, "v2 reads create no attempts, reservations, window mutations, jobs, or transports");

    const oversized = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot?requestBytes=10001&inputTokens=4000&outputTokens=501", headers: { authorization: `Bearer ${suffix}-credential` } })).body);
    assert.deepEqual({ apiVersion: oversized.apiVersion, status: oversized.status, reason: oversized.reason }, { apiVersion: "CapacityPlanningSnapshot/v2", status: "unfit", reason: "complete_request_exceeds_qualified_bound" });
    const foreign = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: `Bearer ${suffix}-foreign` } })).body);
    assert.equal(foreign.status, "stale");
    const mismatchedRoute = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: `Bearer ${suffix}-route-mismatch` } })).body);
    assert.equal(mismatchedRoute.status, "inactive");
    await bridge.unsafe("SAVEPOINT premature_activation");
    await assert.rejects(() => bridge.unsafe("SELECT * FROM bridge.activate_desired_admission_profile($1,$2)", [domain, candidate.desired_profile_version]), /parent cutover gate/i);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT premature_activation");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.active_desired_admission_profile WHERE quota_domain_id=$1", [domain]))[0].count, 0, "premature activation cannot change the active reader");
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,'capacity-v1',$2,'anoman-policy','v1',$3,'fixture')", [domain, routeId, `${suffix}-revoked`]);
    const revoked = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: `Bearer ${suffix}-credential` } })).body);
    assert.equal(revoked.status, "stale", "revoked policy fails closed without numeric fallback");
    assert.deepEqual(await counters(), before, "all negative reads remain zero-effect");
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([app.close(), bridge.end(), admin.end()]);
  }
});

test("RC-01403-05 keeps one endpoint and excludes IDSER implementation", () => {
  const appSource = readFileSync(new URL("../src/app.ts", import.meta.url), "utf8");
  const readerSource = readFileSync(new URL("../src/capacity-planning-snapshot.ts", import.meta.url), "utf8");
  assert.equal((appSource.match(/\/v1\/capacity-planning-snapshot/g) ?? []).length, 1, "only the existing planning-reader endpoint is registered");
  assert.doesNotMatch(readerSource, /idser|provider-work-admission|createJob|transport/iu);
});
