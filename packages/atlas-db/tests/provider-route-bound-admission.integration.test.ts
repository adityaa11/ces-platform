import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { bindProviderWorkRouteFromResolver } from "../../../apps/agents-bridge/src/provider-operational-runtime.ts";
import { createRouteRegistry } from "../../../apps/agents-bridge/src/route-registry.ts";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-03A-01 binds a qualified server route before reservation and accepts only redacted feedback", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const suffix = `03a-route-${Date.now()}`;
  const route = `${suffix}-route`;
  const work = `${suffix}-work`;
  const profile = { usableGlobalCapacity: { rpm: 2, tpm: 20, rpd: 2, concurrency: 1 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundLanes: [] };
  const resolver = createRouteRegistry([{ routeId: route, capability: "atlas.chat.default", providerId: "fixture", modelOrProcessorId: "fixture-model", adapterVersion: "adapter-v1", qualificationVersion: "qualification-v1", qualificationRef: "qualification://03a-fixture", workClass: "interactive", enabled: true }], "development", new Set(["fixture"]));
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,'{}',$3,'quota','operator_config','fixture','v1',now(),now())", [suffix, [{ routeId: route }], { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 2 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 20 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 2 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 1 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [`${suffix}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default','interactive','{}','{}',true,$2,$3,'v1')", [`${suffix}-process`, [route], `${suffix}-workload`]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2)", [suffix, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [suffix, `${suffix}-process`, `${suffix}-workload`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [suffix]);
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 minute',now()+interval '1 minute')", [work, suffix, `${suffix}-process`, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }]);
    await sql.unsafe("SAVEPOINT missing_route_binding");
    await assert.rejects(() => sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [work]), /route binding/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT missing_route_binding");
    const artifacts = async () => ({
      reservations: Number((await sql.unsafe("SELECT count(*)::integer AS count FROM bridge.provider_work_reservation WHERE logical_work_id=$1", [work]))[0].count),
      jobs: Number((await sql.unsafe("SELECT count(*)::integer AS count FROM pgboss.job WHERE data->>'logicalWorkId'=$1", [work]))[0].count),
      claims: Number((await sql.unsafe("SELECT count(*)::integer AS count FROM bridge.provider_transport_claim WHERE logical_work_id=$1", [work]))[0].count),
    });
    await sql.unsafe("SAVEPOINT forged_route");
    await assert.rejects(() => sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [work, "forged-route"]), /not published|eligible|associated/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT forged_route");
    assert.deepEqual(await artifacts(), { reservations: 0, jobs: 0, claims: 0 });
    await bindProviderWorkRouteFromResolver({ executeSql: async (query, values) => ({ rows: await sql.unsafe(query, values as unknown[] | undefined) }) }, resolver, { logicalWorkId: work, attemptNumber: 1 });
    await sql.unsafe("SAVEPOINT contradictory_binding");
    await assert.rejects(() => sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [work, "client-chosen-route"]), /not published|conflicts/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT contradictory_binding");
    const [admitted] = await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [work]);
    assert.equal(admitted.decision, "admitted");
    const [claim] = await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1) AS claimed", [admitted.reservation_id]);
    assert.equal(claim.claimed.routeId, route);
    const feedback = { feedbackId: `${suffix}-feedback`, reservationId: admitted.reservation_id, attemptId: `${work}:1`, routeId: route, quotaDomainId: suffix, desiredProfileVersion: "plan-v1", qualificationVersion: "qualification-v1", observationSource: "qualified_adapter", observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: "terminal_confirmed" };
    await sql.unsafe("SAVEPOINT untrusted_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${suffix}-untrusted`, observationTrust: "untrusted" }]), /qualified/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT untrusted_feedback");
    await sql.unsafe("SAVEPOINT stale_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${suffix}-stale`, observedAt: "1970-01-01T00:00:00.000Z" }]), /stale/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT stale_feedback");
    await sql.unsafe("SAVEPOINT wrong_route_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${suffix}-wrong-route`, routeId: "forged" }]), /route, domain, plan, or qualification/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT wrong_route_feedback");
    await sql.unsafe("SAVEPOINT raw_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${suffix}-raw`, raw: "forbidden" }]), /redacted/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT raw_feedback");
    await sql.unsafe("SAVEPOINT unknown_feedback_field");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${suffix}-unknown`, unsupported: "forbidden" }]), /unsupported field/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT unknown_feedback_field");
    const [first] = await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb) AS result", [feedback]);
    assert.equal(first.result.status, "reconciled");
    const [duplicate] = await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb) AS result", [feedback]);
    assert.equal(duplicate.result.status, "duplicate");
    await sql.unsafe("SAVEPOINT conflicting_duplicate");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, routeId: "conflict" }]), /identity conflicts|route, domain/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT conflicting_duplicate");
    const [event] = await sql.unsafe("SELECT normalized_feedback->>'raw' AS raw FROM bridge.provider_operational_feedback_event WHERE reservation_id=$1", [admitted.reservation_id]);
    assert.equal(event.raw, null);
  } finally {
    await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});
