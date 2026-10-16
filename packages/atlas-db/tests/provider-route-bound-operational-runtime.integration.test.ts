import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";
import { bindProviderWorkRouteFromResolver } from "../../../apps/agents-bridge/src/provider-operational-runtime.ts";
import { createRouteRegistry } from "../../../apps/agents-bridge/src/route-registry.ts";

const databaseUrl = process.env.DATABASE_URL;

const routeResolver = (routeId: string) => createRouteRegistry([{
  routeId,
  capability: "atlas.chat.default",
  providerId: "fixture",
  modelOrProcessorId: "fixture-model",
  adapterVersion: "adapter-v1",
  qualificationVersion: "qualification-v1",
  qualificationRef: "qualification://03a-fixture",
  workClass: "interactive",
  enabled: true,
}], "development", new Set(["fixture"]));

async function bindFromResolver(sql: postgres.Sql, routeId: string, work: string) {
  await bindProviderWorkRouteFromResolver({
    executeSql: async (query: string, values?: readonly unknown[]) => ({ rows: await sql.unsafe(query, values as unknown[] | undefined) }),
  }, routeResolver(routeId), { logicalWorkId: work, attemptNumber: 1 });
}

test("BSS-V2-006-03A binds the selected route before admission and fences terminal feedback", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `03a-route-${Date.now()}`; const route = `${domain}-route`; const work = `${domain}-work`;
  const profile = { usableGlobalCapacity: { rpm: 2, tpm: 20, rpd: 2, concurrency: 1 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundLanes: [] };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,'{}',$3,'quota','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 2 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 20 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 2 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 1 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [`${domain}-workload`]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default','interactive','{}','{}',true,$2,$3,'v1')", [`${domain}-process`, [route], `${domain}-workload`]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, `${domain}-process`, `${domain}-workload`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 minute',now()+interval '1 minute')", [work, domain, `${domain}-process`, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }]);
    await sql.unsafe("SAVEPOINT removed_legacy_binding");
    await assert.rejects(() => sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,'forged','atlas.chat.default','adapter-v1','qualification-v1')", [work]), /does not exist/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT removed_legacy_binding");
    await bindFromResolver(sql, route, work);
    const [admitted] = await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [work]);
    assert.equal(admitted.decision, "admitted");
    const [claim] = await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1) AS claimed", [admitted.reservation_id]);
    assert.equal(claim.claimed.routeId, route);
    await sql.unsafe("SAVEPOINT duplicate_claim"); await assert.rejects(() => sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [admitted.reservation_id]), /already authorized/i); await sql.unsafe("ROLLBACK TO SAVEPOINT duplicate_claim");
    const feedback = { feedbackId: `${domain}-feedback`, reservationId: admitted.reservation_id, attemptId: `${work}:1`, routeId: route, quotaDomainId: domain, desiredProfileVersion: "plan-v1", qualificationVersion: "qualification-v1", observationSource: "qualified_adapter", observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 } };
    await sql.unsafe("SAVEPOINT untrusted_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${domain}-untrusted`, observationTrust: "untrusted" }]), /not qualified/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT untrusted_feedback");
    await sql.unsafe("SAVEPOINT raw_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${domain}-raw`, raw: "forbidden" }]), /redacted/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT raw_feedback");
    await sql.unsafe("SAVEPOINT stale_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${domain}-stale`, observedAt: "1970-01-01T00:00:00.000Z" }]), /stale/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT stale_feedback");
    await sql.unsafe("SAVEPOINT unbounded_feedback");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ ...feedback, feedbackId: `${domain}-unbounded`, unexpected: "forbidden" }]), /unsupported field/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT unbounded_feedback");
    const [first] = await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb) AS result", [feedback]);
    assert.equal(first.result.status, "reconciled");
    const [duplicate] = await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb) AS result", [feedback]);
    assert.equal(duplicate.result.status, "duplicate");
    const rows = await sql.unsafe("SELECT dimension_id,spent_units,deficit_units,state FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [admitted.reservation_id]);
    assert.deepEqual(rows.map((row) => [row.dimension_id, row.spent_units, row.deficit_units, row.state]), [["concurrency", "0", "0", "settled"], ["rpd", "1", "0", "settled"], ["rpm", "1", "0", "settled"], ["tpm", "5", "0", "settled"]]);
    await sql.unsafe("COMMIT");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});

test("BSS-V2-006-03A retains exact physical-window usage and blocks a later over-capacity admission", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `03a-accounting-${Date.now()}`; const route = `${domain}-route`; const processId = `${domain}-process`; const workload = `${domain}-workload`;
  const profile = { usableGlobalCapacity: { rpm: 2, tpm: 20, rpd: 2, concurrency: 1 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundLanes: [] };
  const capacityPolicy = { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 2 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 20 }, rpd: { kind: "fixed", windowSeconds: 86400, limitUnits: 2 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 1 } };
  const register = async (work: string, tpm: number) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 minute',now()+interval '1 minute')", [work, domain, processId, { rpm: 1, tpm, rpd: 1, concurrency: 1 }]);
    await bindFromResolver(sql, route, work);
    return (await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [work]))[0];
  };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,'{}',$3,'quota','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], capacityPolicy]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [workload]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default','interactive','{}','{}',true,$2,$3,'v1')", [processId, [route], workload]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, processId, workload]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    const first = await register(`${domain}-first`, 10);
    assert.equal(first.decision, "admitted");
    await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [first.reservation_id]);
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ feedbackId: `${domain}-under`, reservationId: first.reservation_id, attemptId: `${domain}-first:1`, routeId: route, quotaDomainId: domain, desiredProfileVersion: "plan-v1", qualificationVersion: "qualification-v1", observationSource: "qualified_adapter", observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 5, rpd: 1 } }]);
    const ledger = await sql.unsafe("SELECT dimension_id,held_units,spent_units,deficit_units,state,window_starts_at IS NOT NULL AS physical_start,window_ends_at>window_starts_at AS physical_end FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [first.reservation_id]);
    assert.deepEqual(ledger.map((row) => [row.dimension_id, row.held_units, row.spent_units, row.deficit_units, row.state, row.physical_start, row.physical_end]), [["concurrency", "0", "0", "0", "settled", true, true], ["rpd", "0", "1", "0", "settled", true, true], ["rpm", "0", "1", "0", "settled", true, true], ["tpm", "0", "5", "0", "settled", true, true]]);
    const second = await register(`${domain}-second`, 16);
    assert.equal(second.decision, "unavailable", "the exact retained 5 TPM charge must leave less than the requested 16 TPM");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v2','fixture',$2,'{}',$3,'quota','operator_config','fixture','v2',now(),now())", [domain, [{ routeId: route }], capacityPolicy]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v2','cap-v2','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v2',$2,'v1',$3,'v1')", [domain, processId, workload]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v2')", [domain]);
    const [compatibleUsage] = await sql.unsafe("SELECT bridge.current_provider_operational_usage($1,'cap-v2') AS usage", [domain]);
    assert.equal(compatibleUsage.usage.tpm, 5, "a compatible activation must carry the old physical liability exactly once");
    const incompatiblePolicy = { ...capacityPolicy, tpm: { kind: "fixed", windowSeconds: 120, limitUnits: 20 } };
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v3','fixture',$2,'{}',$3,'quota','operator_config','fixture','v3',now(),now())", [domain, [{ routeId: route }], incompatiblePolicy]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v3','cap-v3','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v3',$2,'v1',$3,'v1')", [domain, processId, workload]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v3')", [domain]);
    const incompatibleWork = `${domain}-incompatible`;
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v3',3,now()+interval '1 minute',now()+interval '1 minute')", [incompatibleWork, domain, processId, { rpm: 1, tpm: 1, rpd: 1, concurrency: 1 }]);
    await bindFromResolver(sql, route, incompatibleWork);
    const [incompatibleAdmission] = await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [incompatibleWork]);
    assert.equal(incompatibleAdmission.decision, "unavailable", "an incompatible physical-window policy must fail closed while old liability is unexpired");
    await sql.unsafe("COMMIT");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});

test("BSS-V2-006-03A retains overuse deficits in the physical TPM window", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `03a-overuse-${Date.now()}`; const route = `${domain}-route`; const processId = `${domain}-process`; const workload = `${domain}-workload`;
  const profile = { usableGlobalCapacity: { rpm: 3, tpm: 20, rpd: 3, concurrency: 1 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 2, tpm: 10, rpd: 2, concurrency: 1 }, backgroundLanes: [] };
  const registerAndAdmit = async (work: string, tpm: number) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 minute',now()+interval '1 minute')", [work, domain, processId, { rpm: 1, tpm, rpd: 1, concurrency: 1 }]);
    await bindFromResolver(sql, route, work);
    return (await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [work]))[0];
  };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,'{}',$3,'quota','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 3 }, tpm: { kind: "fixed", windowSeconds: 60, limitUnits: 20 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 3 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 1 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [workload]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default','interactive','{}','{}',true,$2,$3,'v1')", [processId, [route], workload]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, processId, workload]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);

    const overused = await registerAndAdmit(`${domain}-overused`, 10);
    assert.equal(overused.decision, "admitted");
    await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [overused.reservation_id]);
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ feedbackId: `${domain}-overuse-feedback`, reservationId: overused.reservation_id, attemptId: `${domain}-overused:1`, routeId: route, quotaDomainId: domain, desiredProfileVersion: "plan-v1", qualificationVersion: "qualification-v1", observationSource: "qualified_adapter", observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: "terminal_confirmed", usage: { rpm: 1, tpm: 25, rpd: 1 } }]);
    const [tpm] = await sql.unsafe("SELECT held_units,spent_units,deficit_units,state FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 AND dimension_id='tpm'", [overused.reservation_id]);
    assert.deepEqual(tpm, { held_units: "0", spent_units: "25", deficit_units: "15", state: "settled" });
    const denied = await registerAndAdmit(`${domain}-blocked-by-deficit`, 1);
    assert.equal(denied.decision, "unavailable", "the persisted overuse must block later admission in the same physical TPM window");

    await sql.unsafe("ROLLBACK");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});

test("BSS-V2-006-03A settles mixed usage conservatively and honors the durable claim fence", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `03a-terminal-${Date.now()}`; const route = `${domain}-route`; const processId = `${domain}-process`; const workload = `${domain}-workload`;
  const profile = { usableGlobalCapacity: { rpm: 4, tpm: 30, rpd: 4, concurrency: 2 }, hardInteractiveReserve: { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }, backgroundCapacity: { rpm: 3, tpm: 20, rpd: 3, concurrency: 1 }, backgroundLanes: [] };
  const admit = async (work: string) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1','fixture',$4,'plan-v1',1,now()+interval '1 minute',now()+interval '1 minute')", [work, domain, processId, { rpm: 1, tpm: 10, rpd: 1, concurrency: 1 }]);
    await bindFromResolver(sql, route, work);
    return (await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [work]))[0];
  };
  const feedback = (work: string, reservationId: string, feedbackId: string, transportDisposition: string, usage?: object) => ({
    feedbackId, reservationId, attemptId: `${work}:1`, routeId: route, quotaDomainId: domain, desiredProfileVersion: "plan-v1", qualificationVersion: "qualification-v1", observationSource: "qualified_adapter", observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition, ...(usage ? { usage } : {}),
  });
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2,'{}',$3,'quota','operator_config','fixture','v1',now(),now())", [domain, [{ routeId: route }], { rpm: { kind: "fixed", windowSeconds: 60, limitUnits: 4 }, tpm: { kind: "fixed", windowSeconds: 120, limitUnits: 30 }, rpd: { kind: "fixed", windowSeconds: 86_400, limitUnits: 4 }, concurrency: { kind: "fixed", windowSeconds: 60, limitUnits: 2 } }]);
    await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"chat\"]','{}','{}','quota','{}','{}')", [workload]);
    await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','chat','atlas.chat.default','interactive','{}','{}',true,$2,$3,'v1')", [processId, [route], workload]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','fixture',now(),$2)", [domain, profile]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, processId, workload]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);

    const unsentWork = `${domain}-unsent`; const unsent = await admit(unsentWork);
    assert.equal(unsent.decision, "admitted");
    const [released] = await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb) AS result", [feedback(unsentWork, unsent.reservation_id, `${domain}-unsent`, "definitely_not_sent")]);
    assert.equal(released.result.status, "released_untransmitted");
    const releasedRows = await sql.unsafe("SELECT held_units,spent_units,state FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1", [unsent.reservation_id]);
    assert.ok(releasedRows.every((row) => row.held_units === "0" && row.spent_units === "0" && row.state === "released"));

    const knownWork = `${domain}-known`; const known = await admit(knownWork);
    await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [known.reservation_id]);
    await sql.unsafe("SAVEPOINT claim_fence");
    await assert.rejects(() => sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [feedback(knownWork, known.reservation_id, `${domain}-forged-unsent`, "definitely_not_sent")]), /claimed transport/i);
    await sql.unsafe("ROLLBACK TO SAVEPOINT claim_fence");
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [feedback(knownWork, known.reservation_id, `${domain}-mixed`, "terminal_confirmed", { tpm: 3 })]);
    const mixed = await sql.unsafe("SELECT dimension_id,held_units,spent_units,state,window_ends_at-window_starts_at AS duration FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [known.reservation_id]);
    assert.deepEqual(mixed.map((row) => [row.dimension_id, row.held_units, row.spent_units, row.state]), [["concurrency", "0", "0", "settled"], ["rpd", "0", "1", "settled"], ["rpm", "0", "1", "settled"], ["tpm", "0", "3", "settled"]]);
    assert.deepEqual(mixed.map((row) => [row.dimension_id, row.duration]), [["concurrency", "00:01:00"], ["rpd", "1 day"], ["rpm", "00:01:00"], ["tpm", "00:02:00"]]);

    const unknownWork = `${domain}-unknown`; const unknown = await admit(unknownWork);
    await sql.unsafe("SELECT bridge.claim_provider_admitted_transport($1)", [unknown.reservation_id]);
    const [unknownResult] = await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb) AS result", [feedback(unknownWork, unknown.reservation_id, `${domain}-unknown`, "may_have_started")]);
    assert.equal(unknownResult.result.status, "unknown_held");
    const unknownRows = await sql.unsafe("SELECT dimension_id,held_units,spent_units,state FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [unknown.reservation_id]);
    assert.deepEqual(unknownRows.map((row) => [row.dimension_id, row.held_units, row.spent_units, row.state]), [["concurrency", "1", "0", "held_unknown"], ["rpd", "0", "1", "held_unknown"], ["rpm", "0", "1", "held_unknown"], ["tpm", "10", "0", "held_unknown"]]);
    const [unknownReservation] = await sql.unsafe("SELECT state FROM bridge.provider_work_reservation WHERE reservation_id=$1", [unknown.reservation_id]);
    assert.equal(unknownReservation.state, "consumed_unknown");
    await sql.unsafe("ROLLBACK");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});

test("BSS-V2-006-03A-03 fences scoped pressure, consumes one probe, and permits only matching recovery", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `03a-pressure-${Date.now()}`; const routeA = `${domain}-a`; const routeB = `${domain}-b`;
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,1,60)", [`${domain}-policy`, domain]);
    const [routeIncident] = await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,1,'route','qualified','rpm',$4,NULL) AS incident", [domain, routeA, `${domain}-429`, `${domain}-rpm`]);
    const [routeReplay] = await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,1,'route','qualified','rpm',$4,NULL) AS incident", [domain, routeA, `${domain}-429-replay`, `${domain}-rpm`]);
    assert.equal(routeReplay.incident, routeIncident.incident, "a repeated 429 retains one stable route incident");
    const [routeBlocked] = await sql.unsafe("SELECT bridge.provider_pressure_blocks_admission($1,$2) AS blocked", [domain, routeA]);
    const [otherRoute] = await sql.unsafe("SELECT bridge.provider_pressure_blocks_admission($1,$2) AS blocked", [domain, routeB]);
    assert.equal(routeBlocked.blocked, true); assert.equal(otherRoute.blocked, false, "route-only pressure cannot become a shared numeric/domain hold");
    await sql.unsafe("UPDATE bridge.provider_operational_pressure_incident SET cooldown_until=clock_timestamp()-interval '1 second' WHERE incident_id=$1", [routeIncident.incident]);
    const [firstProbe] = await sql.unsafe("SELECT bridge.claim_provider_pressure_probe($1,$2) AS claimed", [domain, routeA]);
    const [secondProbe] = await sql.unsafe("SELECT bridge.claim_provider_pressure_probe($1,$2) AS claimed", [domain, routeA]);
    assert.equal(firstProbe.claimed, true); assert.equal(secondProbe.claimed, false, "the persisted incident has exactly one probe budget");
    const [unrelatedRecovery] = await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route','rpm',$4,'qualified',clock_timestamp()) AS recovered", [domain, routeB, `${domain}-wrong-recovery`, `${domain}-rpm`]);
    assert.equal(unrelatedRecovery.recovered, false);
    const [recovered] = await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route','rpm',$4,'qualified',clock_timestamp()) AS recovered", [domain, routeA, `${domain}-recovery`, `${domain}-rpm`]);
    assert.equal(recovered.recovered, true);
    const [domainIncident] = await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,1,'domain','qualified','tpm',$4,3) AS incident", [domain, routeA, `${domain}-domain-429`, `${domain}-tpm`]);
    const [clamped] = await sql.unsafe("SELECT bridge.apply_domain_pressure_clamps($1,$2::jsonb,$3::jsonb) AS capacity", [domain, { rpm: 1, tpm: 7, rpd: 1, concurrency: 1 }, { rpm: 10, tpm: 20, rpd: 10, concurrency: 2 }]);
    assert.equal(clamped.capacity.tpm, 10, "trusted remaining capacity lowers the sole shared-domain ceiling");
    await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,1,'domain','qualified','tpm',$4,99)", [domain, routeA, `${domain}-higher`, `${domain}-tpm`]);
    const [stillClamped] = await sql.unsafe("SELECT bridge.apply_domain_pressure_clamps($1,$2::jsonb,$3::jsonb) AS capacity", [domain, { rpm: 1, tpm: 7, rpd: 1, concurrency: 1 }, { rpm: 10, tpm: 20, rpd: 10, concurrency: 2 }]);
    assert.equal(stillClamped.capacity.tpm, 10, "higher later feedback cannot raise a clamp");
    const missingDomain = `${domain}-missing`;
    await sql.unsafe("SELECT bridge.record_provider_429_pressure($1,$2,$3,1,'domain','qualified','rpm',$4,1)", [missingDomain, `${missingDomain}-route`, `${missingDomain}-429`, `${missingDomain}-rpm`]);
    const [missingBlocked] = await sql.unsafe("SELECT bridge.provider_pressure_blocks_admission($1,$2) AS blocked", [missingDomain, `${missingDomain}-route`]);
    const [missingProbe] = await sql.unsafe("SELECT bridge.claim_provider_pressure_probe($1,$2) AS claimed", [missingDomain, `${missingDomain}-route`]);
    assert.equal(missingBlocked.blocked, true); assert.equal(missingProbe.claimed, false, "missing operator policy fails closed without a probe");
    await sql.unsafe("ROLLBACK");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});
