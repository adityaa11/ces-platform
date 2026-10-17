import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { createBridgeApp } from "../src/app.ts";
import { createProductionBridgeWorker } from "../src/production-worker-composition.ts";
import { createProviderWorkAdmissionService } from "../src/provider-work-admission.ts";
import { createRuntimeCapacityConstraintReader } from "../src/runtime-capacity-constraint.ts";
import { TestRuntime } from "../src/runtime.ts";

const databaseUrl = process.env.DATABASE_URL;
const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

test("RC-BSSV2-00604-01/12a/14a drive authenticated background admission through one claimed 03A send", { skip: !databaseUrl }, async () => {
  const suffix = `provider-work-admission-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const route = `${suffix}-route`;
  const processId = `${suffix}-process`;
  const principal = { credential: `${suffix}-credential`, principalId: `${suffix}-consumer`, quotaDomainId: domain, processId, processProfileVersion: "v1", routeId: route, serviceClass: "background" as const };
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 2 });
  const database = { executeSql: async (statement: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(statement, values as unknown[] | undefined) }) };
  const authenticator = { authenticate: (credential: string) => credential === principal.credential ? principal : null };
  const reader = createRuntimeCapacityConstraintReader(database, authenticator);
  const admission = createProviderWorkAdmissionService(database, authenticator);
  let sends = 0;
  let payloadHydrations = 0;
  const worker = createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(), documentPerception: async () => undefined, semantic: async () => undefined,
    providerPayloadAdapter: { hydrate: async (input) => {
      const [claim] = await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim WHERE logical_work_id=$1 AND attempt_number=$2", [input.logicalWorkId, input.attemptNumber]);
      assert.equal(claim.count, 1, "payload hydration is fenced behind the durable claim");
      payloadHydrations += 1;
      return { opaqueReference: input.payloadReference, hash: input.payloadHash };
    } },
    providerOutboundTransport: async (input) => {
      assert.deepEqual(input.payloadReference, { opaqueReference: `${suffix}-payload`, hash: "a".repeat(64) });
      sends += 1;
      return { feedbackId: `${suffix}-feedback-${sends}`, transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 } };
    },
  });
  const app = createBridgeApp({ runtime: new TestRuntime(), version: "provider-work-admission-fixture", runtimeCapacityConstraintReader: reader, providerWorkAdmissionService: admission });
  try {
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,'{}'::jsonb,$3::jsonb,'quota-v1','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','quota-v1','{}','{}')", [`${processId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',true,$2::jsonb,$3,'v1')", [processId, [route], `${processId}-workload`]);
    await sql.unsafe("SELECT bridge.publish_qualified_provider_route_authority($1,'atlas.semantic.extract','adapter-v1','qualified-v1')", [route]);
    const profile = { usableGlobalCapacity: { rpm: 10, tpm: 100, rpd: 10, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 9, tpm: 90, rpd: 9, concurrency: 1 }, backgroundLanes: [] };
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2::jsonb)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, processId, `${processId}-workload`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    const windows = { rpm: { kind: "fixed", windowSeconds: 60 }, tpm: { kind: "fixed", windowSeconds: 60 }, rpd: { kind: "fixed", windowSeconds: 60 }, concurrency: { kind: "fixed", windowSeconds: 60 } };
    for (const dimension of ["rpm", "tpm", "rpd", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}'::jsonb,true,now()+interval '1 hour')", [domain, dimension, windows]);

    // Prior interrupted local fixtures must not be claimed by this worker.
    await sql.unsafe("DELETE FROM pgboss.job WHERE data->>'logicalWorkId' LIKE 'provider-work-admission-%'");
    await app.listen({ host: "127.0.0.1", port: 0 });
    await worker.start();
    const address = app.server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const constraint = await (await fetch(`${base}/v1/runtime-capacity-constraint`, { headers: { authorization: `Bearer ${principal.credential}` } })).json() as { effectiveConstraintRevision: string; reason: string };
    assert.equal(constraint.reason, "eligible_in_principle");
    const request = { logicalWorkId: `${suffix}-work`, attemptNumber: 1, idempotencyKey: `${suffix}-idempotency`, payloadReference: `${suffix}-payload`, payloadHash: "a".repeat(64), requestResourceEnvelope: { rpm: 1, tpm: 5, rpd: 1, concurrency: 1 }, expectedEffectiveConstraintRevision: constraint.effectiveConstraintRevision };
    const post = async (body: unknown) => (await fetch(`${base}/v1/provider-work-admissions`, { method: "POST", headers: { authorization: `Bearer ${principal.credential}`, "content-type": "application/json" }, body: JSON.stringify(body) })).json() as Promise<Record<string, unknown>>;
    const directAccepted = await admission.admit(principal.credential, request);
    assert.equal(directAccepted.state, "dispatched_or_may_have_started");
    const accepted = await post(request);
    assert.equal(accepted.state, "dispatched_or_may_have_started");
    assert.equal(await post(request).then((result) => result.state), "dispatched_or_may_have_started", "exact replay returns its durable identity without a new reservation");
    assert.equal(await post({ ...request, payloadHash: "b".repeat(64) }).then((result) => result.state), "policy_or_resource_unfit", "payload hash is immutable under an idempotency key");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_reservation WHERE logical_work_id=$1", [request.logicalWorkId]))[0].count, 1);
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && sends !== 1) await sleep(25);
    assert.equal(sends, 1, "the only fake outbound call follows one durable reservation, job, and claim");
    assert.equal(payloadHydrations, 1);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_transport_claim WHERE logical_work_id=$1", [request.logicalWorkId]))[0].count, 1);

    await worker.stop();
    const cancelled = { ...request, logicalWorkId: `${suffix}-cancelled`, idempotencyKey: `${suffix}-cancelled-key`, attemptNumber: 2 };
    assert.equal((await post(cancelled)).state, "dispatched_or_may_have_started");
    assert.equal((await fetch(`${base}/v1/provider-work-admissions/${encodeURIComponent(cancelled.logicalWorkId)}/2/cancel`, { method: "POST", headers: { authorization: `Bearer ${principal.credential}` } })).status, 200);
    assert.equal((await sql.unsafe("SELECT state FROM bridge.provider_work_attempt WHERE logical_work_id=$1 AND attempt_number=2", [cancelled.logicalWorkId]))[0].state, "terminal", "pre-send cancellation reaches the durable attempt before a worker can claim it");
    assert.equal(sends, 1, "the cancelled work has zero transport sends");
    const stale = await post({ ...request, logicalWorkId: `${suffix}-stale`, idempotencyKey: `${suffix}-stale-key`, attemptNumber: 3, expectedEffectiveConstraintRevision: "stale" });
    assert.equal(stale.state, "policy_or_resource_unfit");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [`${suffix}-stale`]))[0].count, 0, "stale read-to-admit input creates no attempt or reservation");
  } finally { await worker.stop().catch(() => undefined); await app.close(); await sql.end(); }
});
