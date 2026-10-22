import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { planDesiredAdmissionProfile } from "../src/capacity-planner.ts";
import { createProductionBridgeWorker } from "../src/production-worker-composition.ts";
import { TestRuntime } from "../src/runtime.ts";
import { providerAdmittedExecutionQueue, providerWakeupQueue } from "../src/worker.ts";

const databaseUrl = process.env.DATABASE_URL;
const deliveryTimeoutMilliseconds = 10_000;
const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function waitForWakeup(sql: postgres.Sql, jobId: string, domain: string, key: string) {
  const deadline = Date.now() + deliveryTimeoutMilliseconds;
  while (Date.now() < deadline) {
    const [job] = await sql.unsafe("SELECT state FROM pgboss.job WHERE id=$1", [jobId]);
    const [dispatch] = await sql.unsafe("SELECT claimed_at IS NOT NULL AS claimed FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key=$2", [domain, key]);
    if (job?.state === "completed" && dispatch?.claimed) return;
    await sleep(25);
  }
  const [job] = await sql.unsafe("SELECT state,retry_count,retry_limit,output FROM pgboss.job WHERE id=$1", [jobId]);
  const [dispatch] = await sql.unsafe("SELECT claimed_at FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key=$2", [domain, key]);
  assert.fail(`wakeup delivery did not converge: ${JSON.stringify({ job, dispatch })}`);
}

test("BSS-V2-005-05-04 routes qualified process and capacity revisions through the real durable wakeup worker exactly once", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = `00505-04-${Date.now()}`;
  const domain = `${suffix}-domain`;
  const semantic = `${suffix}-semantic`;
  const chat = `${suffix}-chat`;
  const semanticWorkload = `${suffix}-semantic-workload`;
  const chatWorkload = `${suffix}-chat-workload`;
  const waiting = `${suffix}-waiting`;
  const capacityWaiting = `${suffix}-capacity-waiting`;
  const inflight = `${suffix}-inflight`;
  const semanticRoute = `${suffix}-semantic-route`;
  const chatRoute = `${suffix}-chat-route`;
  let outboundSends = 0;
  const worker = createProductionBridgeWorker({
    config: { databaseUrl: bridgeUrl.toString(), backgroundConcurrency: 1, perceptionConcurrency: 1, timeoutSeconds: 5, retryLimit: 0, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 },
    runtime: new TestRuntime(),
    documentPerception: async () => undefined,
    semantic: async () => undefined,
    providerOutboundTransport: async () => { outboundSends += 1; throw new Error("planning convergence must never send to a provider"); },
  });
  const limits = (tpm: number) => ({
    rpm: { state: "known", value: 100 }, tpm: { state: "known", value: tpm },
    rpd: { state: "known", value: 1_000 }, concurrency: { state: "known", value: 10 },
  });
  const windows = {
    rpm: { policyId: "rpm", policyVersion: "v1", kind: "fixed_window" },
    tpm: { policyId: "tpm", policyVersion: "v1", kind: "fixed_window" },
    rpd: { policyId: "rpd", policyVersion: "v1", kind: "daily_calendar" },
  };
  const profile = (capacityVersion: string, semanticVersion: string, semanticTokens: number) => planDesiredAdmissionProfile(
    { quotaDomainId: domain, profileVersion: capacityVersion, limits: limits(capacityVersion === "capacity-v2" ? 5_000 : 10_000) },
    [
      { processId: semantic, profileVersion: semanticVersion, serviceClass: "background", active: true, workloadProfile: { workloadId: semanticWorkload, profileVersion: semanticVersion }, allocationPolicy: { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "semantic-cap" } } },
      { processId: chat, profileVersion: "v1", serviceClass: "interactive", active: true, workloadProfile: { workloadId: chatWorkload, profileVersion: "v1" }, allocationPolicy: {} },
    ] as any,
    [
      { workloadId: semanticWorkload, profileVersion: semanticVersion, active: true, structuralBound: { maxInputTokens: semanticTokens }, outputReservation: { maxOutputTokens: 100 } },
      { workloadId: chatWorkload, profileVersion: "v1", active: true, structuralBound: { maxInputTokens: 500 }, outputReservation: { maxOutputTokens: 100 } },
    ] as any,
    { plannerVersion: "planner-v1", effectiveFrom: "2026-10-17T00:00:00.000Z", headroomPolicy: { policyId: "headroom", policyVersion: "v1", reserve: { rpm: 10, tpm: 1_000, rpd: 100, concurrency: 1 } }, interactiveReserveTargets: [{ processId: chat, profileVersion: "v1", serviceTargetId: "chat-slo", reserve: { rpm: 20, tpm: 2_000, rpd: 200, concurrency: 2 } }] } as any,
  );
  const inputs = (semanticVersion: string) => [
    { processId: semantic, processProfileVersion: semanticVersion, workloadId: semanticWorkload, workloadProfileVersion: semanticVersion },
    { processId: chat, processProfileVersion: "v1", workloadId: chatWorkload, workloadProfileVersion: "v1" },
  ];
  const qualifiedRoutes = [
    { routeId: semanticRoute, providerId: "fixture", modelOrProcessorId: "fixture-semantic-model", adapterVersion: "fixture-adapter-v1", qualificationRef: "qualification://fixture-semantic", qualificationVersion: "fixture-v1", capability: "atlas.semantic.extract" },
    { routeId: chatRoute, providerId: "fixture", modelOrProcessorId: "fixture-chat-model", adapterVersion: "fixture-adapter-v1", qualificationRef: "qualification://fixture-chat", qualificationVersion: "fixture-v1", capability: "atlas.chat.default" },
  ];
  const publish = (expectedRevision: number | null, capacityVersion: string, semanticVersion: string, semanticTokens: number) => sql.unsafe(
    "SELECT * FROM bridge.publish_converged_desired_admission_profile($1,$2,$3,'planner-v1','2026-10-17T00:00:00.000Z',$4::jsonb,$5::jsonb)",
    [domain, expectedRevision, capacityVersion, profile(capacityVersion, semanticVersion, semanticTokens), inputs(semanticVersion)],
  );
  try {
    await worker.start();
    assert.equal(worker.boss.getWipData().filter((entry) => entry.name === providerWakeupQueue && entry.state === "active").length, 1, "the production composition must own exactly one active wakeup consumer");

    for (const [version, tpm] of [["capacity-v1", 10_000], ["capacity-v2", 5_000]] as const) {
      await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3::jsonb,$4::jsonb,$5::jsonb,'quota-v1','qualified_observation','fixture://qualified-capacity',$2,now(),now())", [domain, version, qualifiedRoutes, limits(tpm), windows]);
    }
    for (const [workloadId, version, tokens, kinds] of [[semanticWorkload, "v1", 4_000, ["semantic"]], [semanticWorkload, "v2", 100, ["semantic"]], [chatWorkload, "v1", 500, ["chat"]]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,$2,true,$3::jsonb,$4::jsonb,'{\"identity\":\"estimator\",\"version\":\"v1\"}'::jsonb,'quota-v1','{\"policyId\":\"output\",\"policyVersion\":\"v1\",\"maxOutputTokens\":100}'::jsonb,'{\"policyId\":\"safety\",\"policyVersion\":\"v1\"}'::jsonb)", [workloadId, version, kinds, { identity: `${workloadId}-${version}`, version, maxRequestBytes: 10_000, maxInputTokens: tokens }]);
    }
    const addProcess = (processId: string, version: string, kind: string, serviceClass: string, route: string, workloadId: string, workloadVersion: string) => sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,$2,$3,$4,$5,'{}',$6::jsonb,true,$7::jsonb,$8,$9)", [processId, version, kind, kind === "chat" ? "atlas.chat.default" : "atlas.semantic.extract", serviceClass, serviceClass === "background" ? { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "semantic-cap" }, hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } } : { hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } }, [route], workloadId, workloadVersion]);
    await addProcess(semantic, "v1", "semantic", "background", semanticRoute, semanticWorkload, "v1");
    await addProcess(semantic, "v2", "semantic", "background", semanticRoute, semanticWorkload, "v2");
    await addProcess(chat, "v1", "chat", "interactive", chatRoute, chatWorkload, "v1");
    for (const route of qualifiedRoutes) {
      await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route.routeId, domain, route.providerId, route.modelOrProcessorId, route.adapterVersion, route.qualificationRef, route.qualificationVersion, route.capability]);
    }

    const [initial] = await publish(null, "capacity-v1", "v1", 4_000);
    assert.deepEqual({ status: initial.status, revision: initial.activation_revision }, { status: "published", revision: "1" });
    const [initialDispatch] = await sql.unsafe("SELECT job_id FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:1'", [domain]);
    await waitForWakeup(sql, initialDispatch.job_id, domain, "active-plan:1");

    for (const [work, envelope] of [[waiting, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }], [inflight, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]] as const) {
      await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,$5,1,now()+interval '1 hour',now()+interval '1 hour')", [work, domain, semantic, envelope, initial.desired_profile_version]);
      await sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [work, semanticRoute]);
    }
    await sql.unsafe("UPDATE bridge.provider_work_attempt SET state='reserved' WHERE logical_work_id=$1", [inflight]);
    await sql.unsafe("INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES($1,1,$2,1,$3)", [inflight, initial.desired_profile_version, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]);

    // An already-qualified v2 process/workload policy is an effective planning
    // input change. It must use the same 005-04 activation trigger and worker.
    const [processRevision] = await publish(1, "capacity-v1", "v2", 100);
    assert.deepEqual({ status: processRevision.status, revision: processRevision.activation_revision }, { status: "published", revision: "2" });
    const [processDispatch] = await sql.unsafe("SELECT job_id FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:2'", [domain]);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$1 AND data->>'quotaDomainId'=$2 AND data->>'wakeupKey'='active-plan:2'", [providerWakeupQueue, domain]))[0].count, 1, "a process-policy activation creates one durable delivery");
    await waitForWakeup(sql, processDispatch.job_id, domain, "active-plan:2");
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [waiting]))[0], { desired_profile_version: initial.desired_profile_version, activation_revision: "1", state: "waiting" }, "a waiting attempt whose exact immutable process membership changed is held for its owner rather than silently rebound");
    assert.deepEqual((await sql.unsafe("SELECT intent_kind FROM bridge.provider_admission_convergence_intent WHERE quota_domain_id=$1", [domain])).map((row) => row.intent_kind), ["owner_replan_required"], "the real worker preserves the existing membership-based owner replan intent");
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [inflight]))[0], { desired_profile_version: initial.desired_profile_version, activation_revision: "1", state: "reserved" }, "an in-flight reservation retains its historical plan identity");
    assert.deepEqual((await sql.unsafe("SELECT fairness_epoch,virtual_time,next_turn FROM bridge.provider_admission_domain_state WHERE quota_domain_id=$1", [domain]))[0], { fairness_epoch: `${processRevision.desired_profile_version}:2`, virtual_time: "0", next_turn: "1" }, "wakeup consumption starts the activation's fairness epoch");

    const [identical] = await publish(2, "capacity-v1", "v2", 100);
    assert.deepEqual({ status: identical.status, revision: identical.activation_revision }, { status: "unchanged", revision: "2" });
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1", [domain]))[0].count, 2, "identical effective input cannot publish or wake again");
    const replayJob = await worker.boss.send(providerWakeupQueue, { quotaDomainId: domain, wakeupKey: "active-plan:2" });
    assert.ok(replayJob, "the real worker must accept a replayed durable delivery");
    await waitForWakeup(sql, replayJob as string, domain, "active-plan:2");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:2' AND claimed_at IS NOT NULL", [domain]))[0].count, 1, "replay has no second effective wakeup claim");

    // This waiting attempt already has the exact v2 membership. The lower
    // capacity revision must revalidate it under the new active plan instead
    // of rewriting the historical v1 work above.
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v2','fixture',$4,$5,2,now()+interval '1 hour',now()+interval '1 hour')", [capacityWaiting, domain, semantic, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, processRevision.desired_profile_version]);
    await sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [capacityWaiting, semanticRoute]);

    // A separately provenance-bound, lower capacity profile uses the same
    // publication fence and the same real worker; it is not a 03A intent.
    const [capacityRevision] = await publish(2, "capacity-v2", "v2", 100);
    assert.deepEqual({ status: capacityRevision.status, revision: capacityRevision.activation_revision }, { status: "published", revision: "3" });
    const [capacityDispatch] = await sql.unsafe("SELECT job_id FROM bridge.provider_work_wakeup_dispatch WHERE quota_domain_id=$1 AND wakeup_key='active-plan:3'", [domain]);
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$1 AND data->>'quotaDomainId'=$2 AND data->>'wakeupKey'='active-plan:3'", [providerWakeupQueue, domain]))[0].count, 1, "a qualified capacity revision creates one durable delivery");
    await waitForWakeup(sql, capacityDispatch.job_id, domain, "active-plan:3");
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [capacityWaiting]))[0], { desired_profile_version: capacityRevision.desired_profile_version, activation_revision: "3", state: "waiting" }, "an exact-membership waiting attempt is revalidated through the lower-capacity activation");
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [inflight]))[0], { desired_profile_version: initial.desired_profile_version, activation_revision: "1", state: "reserved" }, "capacity convergence cannot rewrite an in-flight reservation liability");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name=$1 AND data->>'quotaDomainId'=$2", [providerAdmittedExecutionQueue, domain]))[0].count, 0, "plan convergence must not enqueue provider work");
    assert.equal(outboundSends, 0, "plan convergence must not send to a provider");
  } finally {
    await worker.stop().catch(() => undefined);
    await sql.end();
  }
});
