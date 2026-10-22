import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.ts";
import { createProductionBridgeWorker } from "../src/production-worker-composition.ts";
import { createProviderWorkAdmissionService, type ProviderWorkAdmissionOutcome } from "../src/provider-work-admission.ts";
import { createRuntimeCapacityConstraintReader, type RuntimeCapacityConstraintPrincipal } from "../src/runtime-capacity-constraint.ts";
import { TestRuntime } from "../src/runtime.ts";

const databaseUrl = process.env.DATABASE_URL;
const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function eventually<T>(read: () => Promise<T>, predicate: (value: T) => boolean, description: string): Promise<T> {
  const deadline = Date.now() + 10_000;
  let value = await read();
  while (Date.now() < deadline && !predicate(value)) { await sleep(25); value = await read(); }
  assert.ok(predicate(value), `${description}: ${JSON.stringify(value)}`);
  return value;
}

test("RC-BSSV2-00604-02/06/15/16 compose three generic consumers through one claimed send lane", { skip: !databaseUrl }, async () => {
  const suffix = `generic-consumer-closure-${Date.now()}`;
  const sharedDomain = `${suffix}-shared`;
  const isolatedDomain = `${suffix}-isolated`;
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 2 });

  type Principal = RuntimeCapacityConstraintPrincipal & Readonly<{ principalId: string }>;
  const principal = (name: string, quotaDomainId: string, processKind: "semantic" | "chat" | "reconciliation", serviceClass: "background" | "interactive"): Principal => ({
    credential: `${suffix}-${name}-credential`, principalId: `${suffix}-${name}-consumer`, quotaDomainId,
    processId: `${suffix}-${name}-process`, processProfileVersion: "v1", routeId: `${suffix}-${name}-route`, serviceClass,
  });
  const semantic = principal("semantic-like", sharedDomain, "semantic", "background");
  const interactive = principal("interactive-like", sharedDomain, "chat", "interactive");
  const reconciliation = principal("reconciliation-like", sharedDomain, "reconciliation", "background");
  const isolatedReconciliation = principal("isolated-reconciliation-like", isolatedDomain, "reconciliation", "background");
  const processKinds = new Map<string, "semantic" | "chat" | "reconciliation">([
    [semantic.processId, "semantic"], [interactive.processId, "chat"], [reconciliation.processId, "reconciliation"], [isolatedReconciliation.processId, "reconciliation"],
  ]);
  const principals = new Map<string, Principal>([...([semantic, interactive, reconciliation, isolatedReconciliation] as const).map((value) => [value.credential, value])]);
  const database = { executeSql: async (statement: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(statement, values as unknown[] | undefined) }) };
  const authenticator = { authenticate: (credential: string) => principals.get(credential) ?? null };
  const admission = createProviderWorkAdmissionService(database, authenticator);
  const reader = createRuntimeCapacityConstraintReader(database, authenticator);
  const transportSends = new Map<string, number>();
  const directSends = new Map<string, number>([["semantic", 0], ["interactive", 0], ["reconciliation", 0]]);
  const ackLossWork = `${suffix}-isolated-ack-loss`;
  const envelopes = {
    requestHeavy: { rpm: 2, tpm: 5, rpd: 1, concurrency: 1 },
    tokenHeavy: { rpm: 1, tpm: 20, rpd: 1, concurrency: 1 },
    protectedInteractive: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 },
  } as const;

  const createWorker = () => createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(), documentPerception: async () => undefined, semantic: async () => undefined,
    providerPayloadAdapter: { hydrate: async (input) => {
      const [claim] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim WHERE logical_work_id=$1 AND attempt_number=$2", [input.logicalWorkId, input.attemptNumber]);
      assert.equal(claim.count, 1, "the generic payload adapter is fenced behind one durable claim");
      return { logicalWorkId: input.logicalWorkId, attemptNumber: input.attemptNumber, opaqueReference: input.payloadReference, hash: input.payloadHash };
    } },
    providerOutboundTransport: async (input) => {
      const payload = input.payloadReference as { logicalWorkId: string; attemptNumber: number; opaqueReference: string; hash: string };
      assert.match(payload.logicalWorkId, new RegExp(`^${suffix}`), "the send port receives the opaque claimed identity only");
      transportSends.set(`${payload.logicalWorkId}:${payload.attemptNumber}`, (transportSends.get(`${payload.logicalWorkId}:${payload.attemptNumber}`) ?? 0) + 1);
      if (payload.logicalWorkId === ackLossWork && payload.attemptNumber === 1) throw new Error("deterministic acknowledgement loss after possible transport start");
      return { feedbackId: `${suffix}-feedback-${payload.logicalWorkId}-${payload.attemptNumber}`, transportDisposition: "terminal_confirmed" as const, operationalOutcome: "success" as const, usage: { rpm: 1, tpm: 5, rpd: 1 } };
    },
  });
  let worker = createWorker();
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "generic-multi-consumer-closure", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });

  const configureDomain = async (domain: string, members: readonly Principal[], capacity: number) => {
    const routes = members.map((member) => ({ routeId: member.routeId }));
    const profile = {
      usableGlobalCapacity: { rpm: 20, tpm: 200, rpd: 20, concurrency: capacity },
      hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 },
      backgroundCapacity: { rpm: 19, tpm: 190, rpd: 19, concurrency: Math.max(1, capacity - 1) },
      backgroundLanes: members.filter((member) => member.serviceClass === "background").map((member) => ({ processId: member.processId, profileVersion: "v1", normalizedWeight: .5, mayBorrowIdleCapacity: true, capPolicyId: "fixture-borrow-v1" })),
    };
    const windows = { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } };
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,'{}'::jsonb,$3::jsonb,'quota-v1','operator_config','fixture','v1',now(),now())", [domain, routes, windows]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2::jsonb)", [domain, profile]);
    for (const member of members) {
      const kind = processKinds.get(member.processId)!;
      const capability = kind === "semantic" ? "atlas.semantic.extract" : kind === "chat" ? "atlas.chat.default" : "atlas.semantic.reconcile";
      const workload = `${member.processId}-workload`;
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,jsonb_build_array($2::text),'{}'::jsonb,'{}'::jsonb,'quota-v1','{}'::jsonb,'{}'::jsonb)", [workload, kind]);
      const fairnessScope = member.serviceClass === "background" ? { fairnessKey: `${member.processId}-key`, domain: "shared-composition" } : { fairnessKey: `${member.processId}-key`, protected: true };
      const allocationPolicy = member.serviceClass === "background" ? { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "fixture-borrow-v1" } } : { hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } };
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1',$2,$3,$4,$5::jsonb,$6::jsonb,true,jsonb_build_array($7::text),$8,'v1')", [member.processId, kind, capability, member.serviceClass, fairnessScope, allocationPolicy, member.routeId, workload]);
      await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, member.processId, workload]);
      await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'fixture','fixture-model-v1','adapter-v1','qualification://fixture','qualified-v1',$3)", [member.routeId, domain, capability]);
    }
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}'::jsonb,true,now()+interval '1 hour')", [domain, dimension, windows]);
  };

  try {
    await configureDomain(sharedDomain, [semantic, interactive, reconciliation], 3);
    await configureDomain(isolatedDomain, [isolatedReconciliation], 3);
    await assert.rejects(() => sql.unsafe("SELECT count(*) FROM atlas.project"), /permission denied/i, "the Bridge role cannot read or mutate Atlas truth");
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const constraint = async (member: Principal) => (await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${member.credential}` } })).json()) as { reason: string; effectiveConstraintRevision: string };
    const post = async (member: Principal, logicalWorkId: string, attemptNumber: number, opaqueReference: string, hash: string, requestResourceEnvelope: Readonly<Record<string, number>>, idempotencyKey = `${logicalWorkId}-attempt-${attemptNumber}`) => {
      const current = await constraint(member);
      assert.equal(current.reason, "eligible_in_principle", `${member.processId}: a public read is bounded eligibility, not a send permit`);
      return (await (await fetch(`${base}/v1/provider-work-admissions`, { method: "POST", headers: { authorization: `Bearer ${member.credential}`, "content-type": "application/json" }, body: JSON.stringify({ logicalWorkId, attemptNumber, idempotencyKey, payloadReference: opaqueReference, payloadHash: hash, requestResourceEnvelope, expectedEffectiveConstraintRevision: current.effectiveConstraintRevision, ...(member.serviceClass === "interactive" ? { deadlineEpochMilliseconds: Date.now() + 30_000 } : {}) }) })).json()) as ProviderWorkAdmissionOutcome;
    };
    const replay = async (member: Principal, logicalWorkId: string, attemptNumber: number) => (await (await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(logicalWorkId)}/${attemptNumber}`, { headers: { authorization: `Bearer ${member.credential}` } })).json()) as ProviderWorkAdmissionOutcome;
    const cancel = async (member: Principal, logicalWorkId: string, attemptNumber: number) => (await (await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(logicalWorkId)}/${attemptNumber}/cancel`, { method: "POST", headers: { authorization: `Bearer ${member.credential}` } })).json()) as ProviderWorkAdmissionOutcome;

    // Request-heavy semantic work and token-heavy reconciliation work occupy distinct fair lanes while interactive capacity remains protected.
    const semanticWork = `${suffix}-semantic`;
    const reconciliationWork = `${suffix}-reconciliation`;
    const interactiveWork = `${suffix}-interactive`;
    const forbiddenDirectSend = (consumer: string) => () => { directSends.set(consumer, (directSends.get(consumer) ?? 0) + 1); assert.fail(`${consumer} attempted to bypass the claimed transport port`); };
    const semanticFixture = { submit: () => post(semantic, semanticWork, 1, `${suffix}:semantic:opaque`, "a".repeat(64), envelopes.requestHeavy), directSend: forbiddenDirectSend("semantic"), outcome: (value: ProviderWorkAdmissionOutcome) => ({ consumer: "semantic", state: value.state }) };
    const interactiveFixture = { submit: () => post(interactive, interactiveWork, 1, `${suffix}:interactive:opaque`, "b".repeat(64), envelopes.protectedInteractive), directSend: forbiddenDirectSend("interactive"), outcome: (value: ProviderWorkAdmissionOutcome) => ({ consumer: "interactive", state: value.state }) };
    const reconciliationFixture = { submit: () => post(reconciliation, reconciliationWork, 1, `${suffix}:reconciliation:opaque`, "c".repeat(64), envelopes.tokenHeavy), directSend: forbiddenDirectSend("reconciliation"), outcome: (value: ProviderWorkAdmissionOutcome) => ({ consumer: "reconciliation", state: value.state }) };
    const admitted = [await semanticFixture.submit(), await reconciliationFixture.submit(), await interactiveFixture.submit()];
    for (const value of admitted) assert.equal(value.state, "dispatched_or_may_have_started", "all three independent consumers use the one server-authorized admission port");
    assert.deepEqual(admitted.map((value) => value.reservationId).filter(Boolean).length, 3, "shared-domain contention creates three non-inert durable reservations");
    assert.deepEqual(admitted.map((value) => value.jobId).filter(Boolean).length, 3, "shared-domain contention creates three non-inert pg-boss jobs");
    assert.deepEqual([semanticFixture.outcome(admitted[0]), reconciliationFixture.outcome(admitted[1]), interactiveFixture.outcome(admitted[2])].map((value) => value.consumer).sort(), ["interactive", "reconciliation", "semantic"], "each consumer owns an independent outcome handler");
    const fairness = await sql.unsafe("SELECT process_id, fairness_key, request_resource_envelope FROM bridge.provider_work_attempt WHERE logical_work_id IN ($1,$2) ORDER BY process_id", [semanticWork, reconciliationWork]);
    assert.deepEqual(fairness.map((row) => [row.process_id, row.fairness_key, row.request_resource_envelope]), [[reconciliation.processId, reconciliation.principalId, envelopes.tokenHeavy], [semantic.processId, semantic.principalId, envelopes.requestHeavy]], "distinct fairness keys preserve request-heavy and token-heavy public consumer contracts");
    const [plannedFairness] = await sql.unsafe("SELECT profile->'backgroundLanes' AS lanes FROM bridge.desired_admission_profile WHERE quota_domain_id=$1 AND profile_version='plan-v1'", [sharedDomain]);
    assert.deepEqual(plannedFairness.lanes.map((lane: { processId: string; mayBorrowIdleCapacity: boolean }) => [lane.processId, lane.mayBorrowIdleCapacity]).sort(), [[reconciliation.processId, true], [semantic.processId, true]].sort(), "the shared profile admits both fair background lanes to borrow only idle capacity while interactive capacity remains protected");

    const replayed = await post(semantic, semanticWork, 1, `${suffix}:semantic:opaque`, "a".repeat(64), envelopes.requestHeavy);
    assert.deepEqual(replayed, admitted[0], "exact public replay returns the original semantic-like durable identity");
    const beforeStale = transportSends.get(`${semanticWork}:1`) ?? 0;
    assert.equal((await post(semantic, semanticWork, 1, `${suffix}:semantic:opaque`, "d".repeat(64), envelopes.requestHeavy)).state, "policy_or_resource_unfit", "a stale or changed opaque payload cannot create a second send");
    assert.equal(transportSends.get(`${semanticWork}:1`) ?? 0, beforeStale, "stale payload denial leaves claimed transport count unchanged");
    const cancelledWork = `${suffix}-cancelled-reconciliation`;
    const cancelled = await post(reconciliation, cancelledWork, 1, `${suffix}:cancelled:opaque`, "e".repeat(64), envelopes.tokenHeavy);
    assert.equal(cancelled.state, "waiting", "saturation leaves a background work item durable and unsent");
    assert.equal((await cancel(reconciliation, cancelledWork, 1)).state, "terminal_cancelled", "public cancellation closes waiting work before a send claim");

    await worker.start();
    for (const work of [semanticWork, reconciliationWork, interactiveWork]) await eventually(async () => transportSends.get(`${work}:1`) ?? 0, (count) => count === 1, `${work}: exactly one claimed generic transport send`);
    assert.deepEqual([...directSends.values()], [0, 0, 0], "no consumer-specific direct adapter send is available");
    assert.equal(transportSends.get(`${cancelledWork}:1`) ?? 0, 0, "cancelled work has no late transport send");
    const beforeReplayAfterSend = transportSends.get(`${semanticWork}:1`) ?? 0;
    const replayAfterSend = await replay(semantic, semanticWork, 1);
    assert.deepEqual([replayAfterSend.logicalWorkId, replayAfterSend.attemptNumber, replayAfterSend.reservationId, replayAfterSend.jobId], [admitted[0].logicalWorkId, admitted[0].attemptNumber, admitted[0].reservationId, admitted[0].jobId], "replay after the original send preserves the public attempt identity even after terminal feedback");
    assert.equal(transportSends.get(`${semanticWork}:1`) ?? 0, beforeReplayAfterSend, "replay after send cannot duplicate claimed transport");
    const [sharedUsageBeforeIsolated] = await sql.unsafe("SELECT bridge.current_provider_operational_usage($1,'cap-v1') AS usage", [sharedDomain]);

    // A distinct reconciliation-like identity in an isolated domain must compose without changing the shared-domain limiter, transport, feedback, or schema.
    const isolated = await post(isolatedReconciliation, ackLossWork, 1, `${suffix}:isolated:opaque`, "f".repeat(64), envelopes.tokenHeavy);
    assert.equal(isolated.state, "dispatched_or_may_have_started");
    await eventually(async () => transportSends.get(`${ackLossWork}:1`) ?? 0, (count) => count === 1, "ack-loss work has exactly one possible outbound attempt");
    await eventually(async () => replay(isolatedReconciliation, ackLossWork, 1), (value) => value.state === "dispatched_or_may_have_started", "ack-loss outcome remains conservatively replayable");
    await worker.stop();
    worker = createWorker(); await worker.start();
    assert.deepEqual(await replay(isolatedReconciliation, ackLossWork, 1), await replay(isolatedReconciliation, ackLossWork, 1), "restart preserves the same public attempt identity");
    assert.equal(transportSends.get(`${ackLossWork}:1`), 1, "restart cannot duplicate a claimed ack-loss send");
    const retry = await post(isolatedReconciliation, ackLossWork, 2, `${suffix}:isolated:retry:opaque`, "0".repeat(64), envelopes.tokenHeavy);
    assert.equal(retry.state, "dispatched_or_may_have_started", "retry is an explicit new attempt through the unchanged public interface");
    assert.notEqual(retry.reservationId, isolated.reservationId, "the explicit retry receives a new durable reservation");
    await eventually(async () => transportSends.get(`${ackLossWork}:2`) ?? 0, (count) => count === 1, "the explicit retry has its own once-only send");
    const sharedUsage = await sql.unsafe("SELECT quota_domain_id, count(*)::int AS ledgers, sum(spent_units)::text AS spent FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=$1 GROUP BY quota_domain_id", [sharedDomain]);
    const [sharedUsageAfterIsolated] = await sql.unsafe("SELECT bridge.current_provider_operational_usage($1,'cap-v1') AS usage", [sharedDomain]);
    const isolatedUsage = await sql.unsafe("SELECT quota_domain_id, reservation_id::text, dimension_id, held_units, spent_units, state FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [isolated.reservationId]);
    assert.deepEqual(isolatedUsage.map((row) => [row.dimension_id, Number(row.held_units) + Number(row.spent_units), row.state]), [["concurrency", 1, "held_unknown"], ["rpd", 1, "held_unknown"], ["rpm", 1, "held_unknown"], ["tpm", 20, "held_unknown"]], "ack loss persists the exact conservative isolated-domain usage vector instead of permitting a duplicate send");
    assert.equal(sharedUsage.length, 1, "shared-domain usage is persisted independently of the isolated reconciliation attempt");
    assert.deepEqual(sharedUsageAfterIsolated.usage, sharedUsageBeforeIsolated.usage, "isolated reconciliation accounting leaves the shared-domain usage vector unchanged");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=$1 AND reservation_id=$2", [sharedDomain, isolated.reservationId]))[0].count, 0, "isolated conservative usage cannot create a shared-domain accounting delta");

    const [counts] = await sql.unsafe(`SELECT
      (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id LIKE $1) AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id LIKE $1) AS jobs,
      (SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id LIKE $1) AS claims,
      (SELECT count(*)::int FROM bridge.provider_operational_feedback_event feedback JOIN bridge.provider_work_reservation reservation USING(reservation_id) WHERE reservation.logical_work_id LIKE $1) AS feedback,
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE logical_work_id LIKE $1) AS outcomes,
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$2) AS shared_domain_attempts,
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$3) AS isolated_domain_attempts`, [`${suffix}%`, sharedDomain, isolatedDomain]);
    assert.ok(counts.reservations >= 5 && counts.jobs >= 5 && counts.claims >= 5 && counts.feedback >= 4 && counts.outcomes >= 6, `all terminal counters are non-inert: ${JSON.stringify(counts)}`);
    assert.deepEqual({ shared: counts.shared_domain_attempts, isolated: counts.isolated_domain_attempts }, { shared: 4, isolated: 2 }, "the isolated domain contributes only its own attempts");
    const [noSpecialization] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_admission_v1 admission WHERE logical_work_id LIKE $1 AND (to_jsonb(admission) ?| ARRAY['semanticBatchId','normalizedDocument','source_results','reconciliation_fields'])", [`${suffix}%`]);
    assert.equal(noSpecialization.count, 0, "generic admission metadata contains no semantic or reconciliation specialization");
  } finally {
    await worker.stop().catch(() => undefined);
    await Promise.all([app.close(), sql.end()]);
  }
});
