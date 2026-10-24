import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.js";
import { createCapacityPlanningSnapshotReader, type CapacityPlanningSnapshotPrincipal } from "../src/capacity-planning-snapshot.js";
import { createIdserCapacityPlanningSnapshotV2Consumer, IdserCapacityPlanningSnapshotV2Error } from "../src/idser-capacity-planning-snapshot-v2.js";
import { TestRuntime } from "../src/runtime.js";

const databaseUrl = process.env.DATABASE_URL;

test("RC-01403-01..05 qualifies a calculated v2 candidate through the sole authenticated reader", { skip: !databaseUrl }, async () => {
  const suffix = `calculated-capacity-v2-${Date.now()}`;
  const domain = `${suffix}-anoman`;
  const processId = `${suffix}-process`;
  const workloadId = `${suffix}-workload`;
  const routeId = `${suffix}-route`;
  const effectiveFrom = "2026-10-23 00:00:00+00";
  const admin = postgres(databaseUrl!, { max: 1 });
  // This fixture creates deliberately inconsistent historical rows to prove
  // the read seam fails closed.  Those mutations must remain transactional and
  // use the privileged test connection because the production tables are
  // append-only by design.
  const bridge = admin;
  const principal: CapacityPlanningSnapshotPrincipal = { principalId: `${suffix}-reader`, quotaDomainId: domain, processId, processProfileVersion: "v1", routeId, serviceClass: "background", prospective: false, qualificationVersion: "v2" };
  const principals = new Map<string, CapacityPlanningSnapshotPrincipal>([
    [`${suffix}-credential`, principal],
    [`${suffix}-foreign`, { ...principal, quotaDomainId: `${domain}-foreign` }],
    [`${suffix}-process-mismatch`, { ...principal, processId: `${processId}-other` }],
    [`${suffix}-class-mismatch`, { ...principal, serviceClass: "interactive" }],
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
  const responseFor = async (credential: string, query = "") => JSON.parse((await app.inject({
    method: "GET",
    url: `/v1/capacity-planning-snapshot${query ? `?${query}` : ""}`,
    headers: { authorization: `Bearer ${credential}` },
  })).body) as Record<string, unknown>;
  try {
    await bridge.unsafe("BEGIN");
    await bridge.unsafe("SET LOCAL session_replication_role = replica");
    const route = { routeId, providerId: "anoman", modelOrProcessorId: "gemini-2.5-flash", adapterVersion: "anoman-adapter-v1", qualificationRef: `qualification://${suffix}`, qualificationVersion: "v1", capability: "atlas.semantic.extract" };
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'capacity-v1','anoman',$2::jsonb,$3::jsonb,$4::jsonb,'quota-v1','provider_api','fixture://anoman','v1',clock_timestamp(),$5::timestamptz)", [domain, [route], { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } }, { rpm: { kind: "fixed_window" }, tpm: { kind: "fixed_window" }, rpd: { kind: "unknown" } }, effectiveFrom]);
    const approvalRef = `${suffix}-rpd-approval`;
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'capacity-v1',$3,'anoman-policy','v1',$4::jsonb,'fixture',clock_timestamp())", [approvalRef, domain, routeId, { rpd: { providerState: "unknown", reason: "not_published" } }]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,$3,'anoman-policy','v1',$4,$5::jsonb,$6::timestamptz)", [domain, "capacity-v1", routeId, approvalRef, { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef }, concurrency: { mode: "enforced", limitSource: "provider" } }, effectiveFrom]);
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]'::jsonb,$2::jsonb,$3::jsonb,'quota-v1',$4::jsonb,$5::jsonb)", [workloadId, { identity: `${suffix}-bound`, version: "v1", maxRequestBytes: 10_000, maxPromptBytes: 9_500, maxInputTokens: 4_000, maxContextTokens: 4_500 }, { identity: `${suffix}-estimator`, version: "v2" }, { policyId: `${suffix}-output`, policyVersion: "v1", maxOutputTokens: 500 }, { policyId: `${suffix}-safety`, policyVersion: "v1" }]);
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
    const [persisted] = await bridge.unsafe(`SELECT
      candidate.desired_profile_version,
      desired.provider_capacity_profile_version,
      candidate.candidate_activation_revision,
      workload.profile_version AS workload_profile_version,
      workload.structural_bound,
      workload.output_reservation,
      workload.estimator,
      workload.safety_policy,
      allocation.allocation_version,
      allocation.allocation_fingerprint,
      allocation.allocation,
      binding.effective_mask,
      bridge.derive_effective_enforcement_policy($1, desired.provider_capacity_profile_version, $2) AS effective_policy,
      md5(jsonb_build_object(
        'candidate', candidate.effective_input_fingerprint,
        'allocation', allocation.allocation_fingerprint,
        'authorityVersion', authority.authority_version,
        'workloadVersion', workload.profile_version,
        'effectiveMask', binding.effective_mask
      )::text) AS canonical_fingerprint
      FROM bridge.desired_admission_profile_candidate candidate
      JOIN bridge.desired_admission_profile desired
        ON (desired.quota_domain_id, desired.profile_version) = (candidate.quota_domain_id, candidate.desired_profile_version)
      JOIN bridge.desired_admission_profile_route_binding_v2 binding
        ON (binding.quota_domain_id, binding.desired_profile_version) = (candidate.quota_domain_id, candidate.desired_profile_version)
      JOIN bridge.qualified_provider_route_authority authority ON authority.authority_version = binding.authority_version
      JOIN bridge.calculated_class_process_allocation allocation
        ON (allocation.quota_domain_id, allocation.desired_profile_version) = (candidate.quota_domain_id, candidate.desired_profile_version)
      JOIN bridge.provider_process_profile process ON (process.process_id, process.profile_version) = ($3, 'v1')
      JOIN bridge.workload_envelope_profile workload ON (workload.workload_id, workload.profile_version) = (process.workload_id, process.workload_profile_version)
      WHERE candidate.quota_domain_id = $1 AND binding.route_id = $2`, [domain, routeId, processId]);
    assert.deepEqual(body.revisions, {
      providerCapacityProfileVersion: persisted.provider_capacity_profile_version,
      policyId: persisted.effective_policy.policyId,
      policyVersion: persisted.effective_policy.policyVersion,
      desiredProfileVersion: persisted.desired_profile_version,
      candidateActivationRevision: Number(persisted.candidate_activation_revision),
      processProfileVersion: "v1",
      workloadProfileVersion: persisted.workload_profile_version,
      estimator: persisted.estimator,
      safetyPolicy: persisted.safety_policy,
    }, "every returned revision is the persisted immutable candidate tuple");
    assert.deepEqual(body.allocation, {
      allocationVersion: persisted.allocation_version,
      effectiveMask: persisted.effective_mask,
      baseline: persisted.allocation.processes[0].baseline,
      normalizedWeight: persisted.allocation.processes[0].normalizedWeight,
      cap: persisted.allocation.processes[0].cap,
      allocationFingerprint: persisted.allocation_fingerprint,
    }, "allocation and effective mask exactly match the persisted calculated allocation");
    assert.deepEqual(body.sizing, {
      maxEligibleCompleteRequestTokens: 4_500,
      maxEligibleInputTokens: Number(persisted.structural_bound.maxInputTokens),
      maxRequestBytes: Number(persisted.structural_bound.maxRequestBytes),
      maxContextTokens: Number(persisted.structural_bound.maxContextTokens),
      maxOutputTokens: Number(persisted.output_reservation.maxOutputTokens),
      structuralBound: persisted.structural_bound,
      outputReservation: persisted.output_reservation,
      estimator: persisted.estimator,
      safetyPolicy: persisted.safety_policy,
    }, "complete-request bounds and pinned identities exactly match the workload profile");
    assert.equal(body.canonicalFingerprint, persisted.canonical_fingerprint, "fingerprint is the canonical persisted candidate/allocation/authority/workload/mask composition");
    assert.equal(body.borrowing.runtimeOnly, true);
    assert.deepEqual(await counters(), before, "v2 reads create no attempts, reservations, window mutations, jobs, or transports");

    const idserConsumer = createIdserCapacityPlanningSnapshotV2Consumer({
      reader,
      serverCredential: `${suffix}-credential`,
      expectedIdentity: { quotaDomainId: domain, processId, processProfileVersion: "v1", routeId, serviceClass: "background" },
    });
    const idserSnapshot = await idserConsumer.read({ requestBytes: 500, inputTokens: 250, reservedOutputTokens: 100, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 350, dayUnits: 1, concurrencyUnits: 1 } });
    assert.equal(idserSnapshot.canonicalFingerprint, persisted.canonical_fingerprint, "the composed IDSER consumer accepts only the exact authenticated BSS v2 candidate");
    assert.equal(idserSnapshot.sizing.maxEligibleCompleteRequestTokens, 4_500, "IDSER receives the complete-request ceiling without TPM/concurrency division");
    assert.equal((idserSnapshot.workload.structuralBound as Record<string, unknown>).maxPromptBytes, 9_500, "the actual qualified reader supplies the prompt-byte bound needed by IDSER");
    assert.deepEqual(await counters(), before, "the composed IDSER read remains side-effect-free");

    const assertConsumerStops = async (label: string, credential = `${suffix}-credential`) => {
      const consumer = createIdserCapacityPlanningSnapshotV2Consumer({
        reader,
        serverCredential: credential,
        expectedIdentity: { quotaDomainId: domain, processId, processProfileVersion: "v1", routeId, serviceClass: "background" },
      });
      await assert.rejects(
        () => consumer.read({ requestBytes: 500, inputTokens: 250, reservedOutputTokens: 100, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 350, dayUnits: 1, concurrencyUnits: 1 } }),
        (error: unknown) => error instanceof IdserCapacityPlanningSnapshotV2Error && (error.disposition === "blocked" || error.disposition === "structurally_unfit"),
        `${label}: the composed consumer returns a typed stop/replan result`,
      );
      assert.deepEqual(await counters(), before, `${label}: composed consumer has no fallback effect`);
    };

    const assertNonQualified = async (label: string, credential = `${suffix}-credential`, query = "") => {
      const snapshot = await responseFor(credential, query);
      assert.equal(snapshot.apiVersion, "CapacityPlanningSnapshot/v2", `${label}: typed v2 result`);
      assert.ok(["inactive", "stale", "unfit", "unknown"].includes(String(snapshot.status)), `${label}: typed non-qualified status`);
      assert.equal(Object.hasOwn(snapshot, "allocation"), false, `${label}: no numeric allocation fallback`);
      assert.equal(Object.hasOwn(snapshot, "sizing"), false, `${label}: no numeric sizing fallback`);
      assert.deepEqual(await counters(), before, `${label}: read remains zero-effect`);
      return snapshot;
    };
    for (const [label, credential] of [
      ["foreign principal", `${suffix}-foreign`],
      ["mismatched process", `${suffix}-process-mismatch`],
      ["mismatched class", `${suffix}-class-mismatch`],
      ["mismatched route", `${suffix}-route-mismatch`],
    ]) await assertNonQualified(label, credential);
    for (const [label, credential] of [
      ["foreign principal", `${suffix}-foreign`],
      ["mismatched process", `${suffix}-process-mismatch`],
      ["mismatched class", `${suffix}-class-mismatch`],
      ["mismatched route", `${suffix}-route-mismatch`],
    ]) await assertConsumerStops(label, credential);
    for (const [label, query] of [
      ["request byte bound", "requestBytes=10001&inputTokens=250&outputTokens=100"],
      ["input bound", "requestBytes=500&inputTokens=4001&outputTokens=100"],
      ["output reservation", "requestBytes=500&inputTokens=250&outputTokens=501"],
      ["context bound", "requestBytes=500&inputTokens=4401&outputTokens=100"],
      ["process TPM baseline", "requestBytes=500&inputTokens=27901&outputTokens=100"],
    ]) {
      const snapshot = await assertNonQualified(label, `${suffix}-credential`, query);
      assert.equal(snapshot.status, "unfit", `${label}: complete demand is typed unfit`);
      assert.equal(snapshot.reason, "complete_request_exceeds_qualified_bound");
    }
    assert.ok(body.sizing.maxEligibleCompleteRequestTokens > body.allocation.baseline.tpm / body.allocation.baseline.concurrency,
      "maximum eligible complete request uses the process baseline, not a per-slot concurrency ceiling");

    const mutateAndReject = async (label: string, statement: string, values: unknown[] = []) => {
      await bridge.unsafe("SAVEPOINT v2_negative");
      await bridge.unsafe(statement, values as never[]);
      await assertNonQualified(label);
      await assertConsumerStops(label);
      await bridge.unsafe("ROLLBACK TO SAVEPOINT v2_negative");
    };
    await mutateAndReject("model mismatch", "UPDATE bridge.provider_capacity_profile SET associated_routes = $1::jsonb WHERE quota_domain_id = $2 AND profile_version = 'capacity-v1'", [[{ ...route, modelOrProcessorId: "other-model" }], domain]);
    await mutateAndReject("stale authority", "UPDATE bridge.desired_admission_profile_route_binding_v2 SET authority_version = authority_version + 1000000 WHERE quota_domain_id = $1 AND desired_profile_version = $2 AND route_id = $3", [domain, candidate.desired_profile_version, routeId]);
    await mutateAndReject("missing allocation", "DELETE FROM bridge.calculated_class_process_allocation WHERE quota_domain_id = $1 AND desired_profile_version = $2", [domain, candidate.desired_profile_version]);
    await mutateAndReject("required structural bound missing", "UPDATE bridge.workload_envelope_profile SET structural_bound = structural_bound - 'maxContextTokens' WHERE workload_id = $1 AND profile_version = 'v1'", [workloadId]);
    await mutateAndReject("route-to-workload version mismatch", "UPDATE bridge.desired_admission_profile_input SET workload_profile_version = 'missing-v1' WHERE quota_domain_id = $1 AND desired_profile_version = $2 AND process_id = $3", [domain, candidate.desired_profile_version, processId]);
    await mutateAndReject("missing Anoman approval", "UPDATE bridge.provider_enforcement_policy SET approval_ref = 'missing-approval' WHERE quota_domain_id = $1 AND route_id = $2", [domain, routeId]);
    await mutateAndReject("mismatched Anoman approval", "UPDATE bridge.provider_enforcement_policy_approval SET route_id = 'other-route' WHERE approval_ref = $1", [approvalRef]);
    await bridge.unsafe("SAVEPOINT premature_activation");
    await assert.rejects(() => bridge.unsafe("SELECT * FROM bridge.activate_desired_admission_profile($1,$2)", [domain, candidate.desired_profile_version]), /parent cutover gate/i);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT premature_activation");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.active_desired_admission_profile WHERE quota_domain_id=$1", [domain]))[0].count, 0, "premature activation cannot change the active reader");
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,'capacity-v1',$2,'anoman-policy','v1',$3,'fixture')", [domain, routeId, `${suffix}-revoked`]);
    await assertNonQualified("revoked policy");
    await assertConsumerStops("revoked policy");
  } finally {
    await bridge.unsafe("ROLLBACK").catch(() => undefined);
    await Promise.all([app.close(), admin.end()]);
  }
});

test("RC-01403-05 keeps one endpoint and excludes IDSER implementation", () => {
  const appSource = readFileSync(new URL("../src/app.ts", import.meta.url), "utf8");
  const readerSource = readFileSync(new URL("../src/capacity-planning-snapshot.ts", import.meta.url), "utf8");
  assert.equal((appSource.match(/\/v1\/capacity-planning-snapshot/g) ?? []).length, 1, "only the existing planning-reader endpoint is registered");
  assert.doesNotMatch(readerSource, /idser|provider-work-admission|createJob|transport/iu);
});
