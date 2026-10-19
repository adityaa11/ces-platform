import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.js";
import { createCapacityPlanningSnapshotReader, type CapacityPlanningSnapshotPrincipal } from "../src/capacity-planning-snapshot.js";
import { createIdserProspectiveCapacitySnapshotConsumer } from "../src/idser-prospective-capacity-snapshot.js";
import { proposeStructuralFitCorpusPartition } from "../src/idser-structural-fit-corpus-partition.js";
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
    [`${suffix}-missing-policy`, { ...principal, quotaDomainId: `${suffix}-missing-policy` }],
    [`${suffix}-unavailable-policy`, { ...principal, quotaDomainId: `${suffix}-unavailable-policy` }],
  ]);
  const reader = createCapacityPlanningSnapshotReader(
    { executeSql: async (statement, values) => ({ rows: await bridge.unsafe(statement, values as never[]) }) },
    { authenticate: (credential) => principals.get(credential) ?? null },
  );
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "effective-capacity-snapshot-fixture", capacityPlanningSnapshotReader: reader });
  const counters = async (quotaDomainId = "anoman-shared-prod") => {
    const [row] = await admin.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_work_reservation reservation JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch dispatch JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS jobs,
      (SELECT count(*)::int FROM bridge.provider_transport_claim claim JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS sends,
      (SELECT count(*)::int FROM bridge.provider_quota_window_state WHERE quota_domain_id=$1) AS quota_mutations`, [quotaDomainId]);
    return row;
  };
  const durableSideEffects = async () => (await admin.unsafe(`SELECT
    (SELECT count(*)::int FROM bridge.provider_capacity_profile) AS capacity_profiles,
    (SELECT count(*)::int FROM bridge.provider_enforcement_policy) AS enforcement_policies,
    (SELECT count(*)::int FROM bridge.provider_process_profile) AS process_profiles,
    (SELECT count(*)::int FROM bridge.workload_envelope_profile) AS workload_profiles,
    (SELECT count(*)::int FROM bridge.desired_admission_profile) AS admission_plans,
    (SELECT count(*)::int FROM bridge.semantic_result_delivery) AS semantic_deliveries,
    (SELECT count(*)::int FROM atlas.semantic_execution) AS semantic_executions,
    (SELECT count(*)::int FROM atlas.semantic_extraction_result) AS semantic_results,
    (SELECT count(*)::int FROM atlas.semantic_reconciliation_result) AS reconciliation_results,
    (SELECT count(*)::int FROM pgboss.job) AS durable_jobs`))[0];
  try {
    await bridge.unsafe("BEGIN");
    for (const domain of [`${suffix}-missing-policy`, `${suffix}-unavailable-policy`]) {
      await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'v1','fixture','[{\"routeId\":\"anoman-semantic\",\"providerId\":\"fixture\"}]'::jsonb,'{\"rpm\":{\"state\":\"known\",\"value\":1},\"tpm\":{\"state\":\"known\",\"value\":1},\"rpd\":{\"state\":\"unknown\"},\"concurrency\":{\"state\":\"known\",\"value\":1}}'::jsonb,'{\"rpm\":{\"kind\":\"fixed_window\"},\"tpm\":{\"kind\":\"fixed_window\"},\"rpd\":{\"kind\":\"unknown\"}}'::jsonb,'fixture','provider_api','fixture://capacity','v1',clock_timestamp(),clock_timestamp())", [domain]);
    }
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'v1','anoman-semantic','fixture-policy','v1','{\"rpd\":{\"providerState\":\"unknown\",\"reason\":\"not_published\"}}'::jsonb,'test',clock_timestamp())", [`${suffix}-unavailable-approval`, `${suffix}-unavailable-policy`]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'v1','anoman-semantic','fixture-policy','v1',$2,$3::jsonb,clock_timestamp())", [`${suffix}-unavailable-policy`, `${suffix}-unavailable-approval`, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-unavailable-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } }]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,'v1','anoman-semantic','fixture-policy','v1',$2,'test')", [`${suffix}-unavailable-policy`, `${suffix}-unavailable-revocation`]);
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',false,'[\"semantic\"]'::jsonb,$2::jsonb,$3::jsonb,'anoman-quota-v1',$4::jsonb,$5::jsonb)", [workloadId, { identity: "anoman-prospective-bound", version: "v1", maxRequestBytes: 100_000, maxInputTokens: 40_000, maxPromptBytes: 90_000, maxContextTokens: 40_100 }, { identity: "anoman-prospective-estimator", version: "v2", media: { identity: "anoman-prospective-media", version: "v1" } }, { policyId: "anoman-output", policyVersion: "v1", maxOutputTokens: 100 }, { policyId: "anoman-safety", policyVersion: "v1" }]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}'::jsonb,$2::jsonb,false,'[\"anoman-semantic\"]'::jsonb,$3,'v1')", [processId, { background: { weight: 1, mayBorrowIdleCapacity: false }, hardInteractiveProtection: { policyId: "anoman-reserve", policyVersion: "v1" } }, workloadId]);
    const before = await counters();
    const beforeDurableSideEffects = await durableSideEffects();
    const response = await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot?prospective=true&requestBytes=100&inputTokens=100", headers: { authorization: `Bearer ${principal.credential}` } });
    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body) as Record<string, any>;
    assert.equal(body.apiVersion, "CapacityPlanningSnapshot/v1");
    assert.equal(body.status, "inactive");
    assert.equal(body.reason, "prospective_planning_only");
    assert.equal(body.readIsNotAdmissionPermit, true);
    assert.deepEqual(body.source, {
      quotaDomainId: "anoman-shared-prod", providerCapacityProfileVersion: "2026-10-18.1", capacitySource: "provider_api",
      sourceRef: "provider-dashboard://anoman/account/limits", sourceVersion: "2026-10-18",
      limits: { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } },
      windowPolicies: { rpm: { policyId: "anoman-rpm-v1", policyVersion: "v1", source: "provider_api", kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { policyId: "anoman-tpm-v1", policyVersion: "v1", source: "provider_api", kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { policyId: "anoman-rpd-unknown-v1", policyVersion: "v1", source: "provider_api", kind: "unknown" } },
    });
    assert.deepEqual(body.enforcement, {
      apiVersion: "EffectiveEnforcementPolicy/v1", quotaDomainId: "anoman-shared-prod", providerCapacityProfileVersion: "2026-10-18.1", routeId: "anoman-semantic", policyId: "capacity-dimension-enforcement", policyVersion: "anoman-v1", effectiveFrom: "2026-10-18T00:00:00+00:00",
      providerProfileProvenance: { capacitySource: "provider_api", sourceRef: "provider-dashboard://anoman/account/limits", sourceVersion: "2026-10-18" },
      dimensions: {
        rpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 20, windowPolicy: { policyId: "anoman-rpm-v1", policyVersion: "v1", source: "provider_api", kind: "fixed_window", parameters: { windowSeconds: 60 } } },
        tpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 40_000, windowPolicy: { policyId: "anoman-tpm-v1", policyVersion: "v1", source: "provider_api", kind: "fixed_window", parameters: { windowSeconds: 60 } } },
        rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: "anoman-rpd-not-published-approval-2026-10-18" },
        concurrency: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 25, windowPolicy: null },
      },
    });
    assert.deepEqual(body.process, { id: processId, profileVersion: "v1", serviceClass: "background", active: false });
    assert.deepEqual(body.workload, { id: workloadId, profileVersion: "v1", active: false, structuralBound: { identity: "anoman-prospective-bound", version: "v1", maxRequestBytes: 100_000, maxInputTokens: 40_000, maxPromptBytes: 90_000, maxContextTokens: 40_100 }, estimator: { identity: "anoman-prospective-estimator", version: "v2", media: { identity: "anoman-prospective-media", version: "v1" } }, outputReservation: { policyId: "anoman-output", policyVersion: "v1", maxOutputTokens: 100 }, safetyPolicy: { policyId: "anoman-safety", policyVersion: "v1" } });
    assert.equal(body.plan, null, "a prospective read cannot promote an inactive route into an active plan");
    const idserConsumer = createIdserProspectiveCapacitySnapshotConsumer({ reader, serverCredential: principal.credential });
    const idserSnapshot = await idserConsumer.read({ requestBytes: 100, inputTokens: 100, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 100, dayUnits: 1, concurrencyUnits: 1 } });
    assert.deepEqual(idserSnapshot.requestResourceEnvelope, { requestUnits: 1, tokenUnits: 100, dayUnits: 1, concurrencyUnits: 1 }, "positive day demand stays demand when BSS authorizes unknown/not-enforced RPD");
    assert.deepEqual(idserSnapshot.eligibleDimensions, ["rpm", "tpm", "concurrency"], "the Anoman unknown/not-enforced RPD is excluded from the BSS provider mask");
    assert.equal(idserSnapshot.plan, null, "the IDSER consumer retains the planning read as non-admission evidence");
    assert.ok(Object.isFrozen(idserSnapshot), "the accepted structural-policy snapshot is immutable");
    const structuralProposal = await proposeStructuralFitCorpusPartition({
      acceptedDocument: {
        scope: { projectId: "fixture-project", workspaceId: "fixture-workspace", bundleId: "fixture-bundle", documentId: "fixture-document" },
        source: { documentId: "fixture-document", sourceSha256: "a".repeat(64) }, rel: { state: "unavailable" },
        normalizedDocument: {
          version: "v1", executionId: "fixture-execution", artifactId: "fixture-document", sourceSha256: "a".repeat(64),
          perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
          provider: { name: "docling", processor: "pdf", executionId: "fixture-execution", processedAt: "2026-10-19T00:00:00.000Z" },
          pages: [{ number: 1, textBlocks: [{ id: "source", text: "A source-grounded structural-fit fixture." }], tables: [], visualRegions: [] }],
        }, media: [],
      } as any,
      estimatorConfiguration: {
        estimator: { identity: "anoman-prospective-estimator", version: "v2" }, configuration: { identity: "anoman-prospective-accounting", version: "v1" },
        inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: 100,
        requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 },
      },
      capacityConsumer: idserConsumer,
    });
    assert.equal(structuralProposal.disposition, "READY", "the proposal composes the real authenticated prospective BSS reader with conservative demand");
    if (structuralProposal.disposition === "READY") {
      assert.deepEqual(structuralProposal.batches.map((batch) => batch.ownedLocators.map((locator) => locator.locatorId)), [["source"]]);
      assert.deepEqual(structuralProposal.eligibleDimensions, ["rpm", "tpm", "concurrency"]);
      assert.equal(structuralProposal.requestResourceEnvelope.dayUnits, 1, "unknown/not-enforced RPD preserves day demand without fabricating a provider limit");
    }
    assert.deepEqual(await counters(), before, "the production reader must be non-inert: no attempts, reservations, jobs, sends, or quota mutations");
    assert.deepEqual(await durableSideEffects(), beforeDurableSideEffects, "IDSER planning reads do not write BSS profiles/plans, durable jobs, semantic results, or reconciliation state");
    const oversized = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot?prospective=true&requestBytes=100001", headers: { authorization: `Bearer ${principal.credential}` } })).body);
    assert.equal(oversized.status, "unfit");
    assert.equal(JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: "Bearer forged" } })).body).status, "inactive");
    assert.notEqual(JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: `Bearer ${suffix}-foreign` } })).body).status, "qualified");
    const unauthenticated = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot" })).body);
    assert.deepEqual(unauthenticated, { apiVersion: "CapacityPlanningSnapshot/v1", status: "inactive", reason: "inactive_or_unauthorized", readIsNotAdmissionPermit: true });
    const missingPolicy = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: `Bearer ${suffix}-missing-policy` } })).body);
    assert.deepEqual(missingPolicy, { apiVersion: "CapacityPlanningSnapshot/v1", status: "stale", reason: "effective_policy_missing", readIsNotAdmissionPermit: true });
    const unavailablePolicy = JSON.parse((await app.inject({ method: "GET", url: "/v1/capacity-planning-snapshot", headers: { authorization: `Bearer ${suffix}-unavailable-policy` } })).body);
    assert.deepEqual(unavailablePolicy, { apiVersion: "CapacityPlanningSnapshot/v1", status: "stale", reason: "effective_policy_unavailable", readIsNotAdmissionPermit: true });
    assert.deepEqual(await counters(), before, "negative reads are also zero-effect");
    assert.deepEqual(await durableSideEffects(), beforeDurableSideEffects, "rejected snapshot reads are also zero-effect");
    assert.deepEqual(await counters(`${suffix}-missing-policy`), { attempts: 0, reservations: 0, jobs: 0, sends: 0, quota_mutations: 0 }, "missing-policy reads are zero-effect");
    assert.deepEqual(await counters(`${suffix}-unavailable-policy`), { attempts: 0, reservations: 0, jobs: 0, sends: 0, quota_mutations: 0 }, "unavailable-policy reads are zero-effect");
    await assert.rejects(() => atlas.unsafe("SELECT bridge.read_capacity_planning_snapshot($1,$2,$3,$4,$5,$6,$7,$8)", [principal.quotaDomainId, processId, "v1", principal.routeId, principal.serviceClass, true, 1, 1]), /permission denied/i);
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([app.close(), bridge.end(), atlas.end(), admin.end()]);
  }
});
