import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.js";
import { createCapacityPlanningSnapshotReader, type CapacityPlanningSnapshotPrincipal } from "../src/capacity-planning-snapshot.js";
import { TestRuntime } from "../src/runtime.js";

const databaseUrl = process.env.DATABASE_URL;

test("RC-00605-08 exposes an authenticated Anoman planning snapshot with zero operational effects", { skip: !databaseUrl }, async () => {
  const suffix = `effective-capacity-snapshot-${Date.now()}`;
  const processId = `${suffix}-process`;
  const workloadId = `${suffix}-workload`;
  const principal = { credential: `${suffix}-credential`, principalId: `${suffix}-reader`, quotaDomainId: "anoman-shared-prod", processId, processProfileVersion: "v1", routeId: "anoman-semantic", serviceClass: "background" as const, prospective: true };
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const admin = postgres(databaseUrl!, { max: 1 });
  const principals = new Map<string, CapacityPlanningSnapshotPrincipal>([
    [principal.credential, principal],
    [`${suffix}-foreign`, { ...principal, quotaDomainId: "foreign-domain" }],
  ]);
  const reader = createCapacityPlanningSnapshotReader(
    { executeSql: async (statement, values) => ({ rows: await bridge.unsafe(statement, values as never[]) }) },
    { authenticate: (credential) => principals.get(credential) ?? null },
  );
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "effective-capacity-snapshot-fixture", capacityPlanningSnapshotReader: reader });
  const counters = async () => {
    const [row] = await admin.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id='anoman-shared-prod') AS attempts,
      (SELECT count(*)::int FROM bridge.provider_work_reservation reservation JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id='anoman-shared-prod') AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch dispatch JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id='anoman-shared-prod') AS jobs,
      (SELECT count(*)::int FROM bridge.provider_transport_claim claim JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id='anoman-shared-prod') AS sends,
      (SELECT count(*)::int FROM bridge.provider_quota_window_state WHERE quota_domain_id='anoman-shared-prod') AS quota_mutations`);
    return row;
  };
  try {
    await bridge.unsafe("BEGIN");
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',false,'[\"semantic\"]'::jsonb,$2::jsonb,$3::jsonb,'anoman-quota-v1',$4::jsonb,$5::jsonb)", [workloadId, { identity: "anoman-prospective-bound", version: "v1", maxRequestBytes: 10_000, maxInputTokens: 4_000 }, { identity: "anoman-prospective-estimator", version: "v2", media: { identity: "anoman-prospective-media", version: "v1" } }, { policyId: "anoman-output", policyVersion: "v1", maxOutputTokens: 100 }, { policyId: "anoman-safety", policyVersion: "v1" }]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}'::jsonb,$2::jsonb,false,'[\"anoman-semantic\"]'::jsonb,$3,'v1')", [processId, { background: { weight: 1, mayBorrowIdleCapacity: false }, hardInteractiveProtection: { policyId: "anoman-reserve", policyVersion: "v1" } }, workloadId]);
    const before = await counters();
    const response = await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot?prospective=true&requestBytes=100&inputTokens=100", headers: { authorization: `Bearer ${principal.credential}` } });
    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body) as Record<string, any>;
    assert.equal(body.apiVersion, "CapacityPlanningSnapshot/v1");
    assert.equal(body.status, "inactive");
    assert.equal(body.reason, "prospective_planning_only");
    assert.equal(body.readIsNotAdmissionPermit, true);
    assert.equal(body.source.providerCapacityProfileVersion, "2026-10-18.1");
    assert.deepEqual(body.enforcement.dimensions.rpd, { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: "anoman-rpd-not-published-approval-2026-10-18" });
    assert.equal(body.workload.structuralBound.maxInputTokens, 4_000);
    assert.equal(body.workload.estimator.version, "v2");
    assert.equal(body.plan, null, "a prospective read cannot promote an inactive route into an active plan");
    assert.deepEqual(await counters(), before, "the production reader must be non-inert: no attempts, reservations, jobs, sends, or quota mutations");
    const oversized = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot?prospective=true&requestBytes=10001", headers: { authorization: `Bearer ${principal.credential}` } })).body);
    assert.equal(oversized.status, "unfit");
    assert.equal(JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: "Bearer forged" } })).body).status, "inactive");
    assert.notEqual(JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: `Bearer ${suffix}-foreign` } })).body).status, "qualified");
    assert.deepEqual(await counters(), before, "negative reads are also zero-effect");
    await assert.rejects(() => atlas.unsafe("SELECT bridge.read_capacity_planning_snapshot($1,$2,$3,$4,$5,$6,$7,$8)", [principal.quotaDomainId, processId, "v1", principal.routeId, principal.serviceClass, true, 1, 1]), /permission denied/i);
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([app.close(), bridge.end(), atlas.end(), admin.end()]);
  }
});
