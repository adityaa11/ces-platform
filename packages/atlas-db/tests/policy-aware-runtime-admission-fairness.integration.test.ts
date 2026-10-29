import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-05-04/05 proves masked admission, policy-revision recovery, and scoped 429 handling", { skip: !databaseUrl }, async () => {
  const suffix = `policy-runtime-${Date.now()}`;
  const url = new URL(databaseUrl!); url.username = "agents_bridge"; url.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(url.toString(), { max: 1 });
  const dimensions = { rpm: { mode: "enforced", limitSource: "provider" }, tpm: { mode: "enforced", limitSource: "provider" }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: `${suffix}-approval` }, concurrency: { mode: "enforced", limitSource: "provider" } };
  const windowPolicies = { rpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { kind: "unknown" }, concurrency: { kind: "fixed", windowSeconds: 60 } };
  const future = () => new Date(Date.now() + 60_000).toISOString();
  const envelope = (patch: Partial<{ rpm: number; tpm: number; concurrency: number }> = {}) => ({ rpm: 1, tpm: 1, rpd: 999_999, concurrency: 1, ...patch });

  const setup = async (name: string, capacity = { rpm: 2, tpm: 20, concurrency: 2 }, bindPolicy = true) => {
    const domain = `${suffix}-${name}`, route = `${domain}-route`;
    const routeAuthority = {
      routeId: route,
      providerId: "fixture",
      modelOrProcessorId: "fixture-model-v1",
      adapterVersion: "adapter",
      qualificationRef: "qualification://fixture",
      qualificationVersion: "qualified",
      capability: "atlas.semantic.extract",
    };
    const processes = { backgroundA: `${domain}-background-a`, backgroundB: `${domain}-background-b`, backgroundC: `${domain}-background-c`, interactive: `${domain}-interactive` };
    const profile = {
      usableGlobalCapacity: capacity,
      hardInteractiveReserve: { rpm: 1, tpm: 1, concurrency: 1 },
      backgroundCapacity: { rpm: Math.max(0, capacity.rpm - 1), tpm: Math.max(0, capacity.tpm - 1), concurrency: Math.max(0, capacity.concurrency - 1) },
      backgroundLanes: [
        { processId: processes.backgroundA, profileVersion: "v1", normalizedWeight: .5 },
        { processId: processes.backgroundB, profileVersion: "v1", normalizedWeight: .25 },
        { processId: processes.backgroundC, profileVersion: "v1", normalizedWeight: .25 },
      ],
    };
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'cap-v1','fixture',$2::jsonb,$3::jsonb,$4::jsonb,'provider_api','fixture','v1',now(),now())", [domain, [routeAuthority], { rpm: { state: "known", value: capacity.rpm }, tpm: { state: "known", value: capacity.tpm }, rpd: { state: "unknown" }, concurrency: { state: "known", value: capacity.concurrency } }, windowPolicies]);
    if (bindPolicy) {
      await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,'cap-v1',$3,'policy','v1',$4::jsonb,'fixture',now())", [`${domain}-approval`, domain, route, { rpd: { providerState: "unknown", reason: "not_published" } }]);
      const policy = { ...dimensions, rpd: { ...dimensions.rpd, approvalRef: `${domain}-approval` } };
      await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,'cap-v1',$2,'policy','v1',$3,$4::jsonb,now())", [domain, route, `${domain}-approval`, policy]);
    }
    for (const [id, service] of [[processes.backgroundA, "background"], [processes.backgroundB, "background"], [processes.backgroundC, "background"], [processes.interactive, "interactive"]] as const) {
      await sql.unsafe("INSERT INTO bridge.workload_envelope_profile(workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,output_reservation,safety_policy) VALUES($1,'v1',true,'[\"semantic\"]','{}','{}','{}','{}')", [`${id}-workload`]);
      await sql.unsafe("INSERT INTO bridge.provider_process_profile(process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES($1,'v1','semantic','atlas.semantic.extract',$2,'{}','{}',true,$3::jsonb,$4,'v1')", [id, service, [route], `${id}-workload`]);
    }
    const [publishedAuthority] = await sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,'fixture','fixture-model-v1','adapter','qualification://fixture','qualified','atlas.semantic.extract')", [route, domain]);
    const authorityVersion = BigInt(publishedAuthority.authority_version);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v1','cap-v1','planner',now(),$2::jsonb)", [domain, profile]);
    for (const id of Object.values(processes)) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v1',$2,'v1',$3,'v1')", [domain, id, `${id}-workload`]);
    if (bindPolicy) {
      const effective = (await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v1',$2) AS policy", [domain, route]))[0].policy;
      await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v1','cap-v1',$2,'policy','v1',$3::jsonb)", [domain, route, effective]);
    }
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v1')", [domain]);
    for (const dimension of ["rpm", "tpm", "concurrency"]) await sql.unsafe("INSERT INTO bridge.provider_quota_window_state(quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at) VALUES($1,'plan-v1',1,'cap-v1',$2,($3::jsonb)->$2,'{}',true,now()+interval '1 hour')", [domain, dimension, windowPolicies]);
    return { domain, route, authorityVersion, processes, capacity };
  };

  const read = async (fixture: Awaited<ReturnType<typeof setup>>, process: string, service: "background" | "interactive") => (await sql.unsafe("SELECT bridge.read_runtime_capacity_constraint($1,$2,'v1',$3,$4) AS value", [fixture.domain, process, fixture.route, service]))[0].value;
  const operationalCounts = async (domain: string) => {
    const [row] = await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) reservations,(SELECT count(*)::int FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=$1) ledgers,(SELECT count(*)::int FROM bridge.provider_work_dispatch d JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) dispatches,(SELECT count(*)::int FROM pgboss.job j JOIN bridge.provider_work_dispatch d ON d.job_id=j.id JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) jobs,(SELECT count(*)::int FROM bridge.provider_transport_claim t JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) claims", [domain]);
    return row;
  };
  const allCounts = async (domain: string) => {
    const [row] = await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$1) attempts,(SELECT count(*)::int FROM bridge.provider_work_admission_v1 a JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) admissions,(SELECT count(*)::int FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) reservations,(SELECT count(*)::int FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=$1) ledgers,(SELECT count(*)::int FROM bridge.provider_work_dispatch d JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) dispatches,(SELECT count(*)::int FROM pgboss.job j JOIN bridge.provider_work_dispatch d ON d.job_id=j.id JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) jobs,(SELECT count(*)::int FROM bridge.provider_transport_claim t JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number) WHERE w.quota_domain_id=$1) claims", [domain]);
    return row;
  };
  const publicAdmit = async (fixture: Awaited<ReturnType<typeof setup>>, id: string, process: string, service: "background" | "interactive", requestEnvelope: ReturnType<typeof envelope>, expectedRevision: string | undefined) => {
    const request = { requestResourceEnvelope: requestEnvelope, expectedEffectiveConstraintRevision: expectedRevision, ...(service === "interactive" ? { deadlineEpochMilliseconds: Date.now() + 60_000 } : {}) };
    return (await sql.unsafe("SELECT bridge.admit_provider_work_admission_v1($1,$2,$3,'v1',$4,$5,$6,1,$7,'opaque-payload',$8,$9::jsonb) AS outcome", [`${fixture.domain}-principal`, fixture.domain, process, fixture.route, service, id, `${id}-key`, "a".repeat(64), request]))[0].outcome;
  };
  const register = async (fixture: Awaited<ReturnType<typeof setup>>, id: string, process: string, key: string, requestEnvelope = envelope()) => {
    await sql.unsafe("SELECT bridge.register_provider_work_attempt($1,1,$2,$3,'v1',$4,$5::jsonb,'plan-v1',1,$6,$6)", [id, fixture.domain, process, key, requestEnvelope, future()]);
    await sql.unsafe("SELECT bridge.bind_provider_work_route($1,1,$2)", [id, fixture.authorityVersion]);
  };
  const release = async (fixture: Awaited<ReturnType<typeof setup>>, row: { reservation_id?: string; reservationId?: string; logical_work_id?: string; logicalWorkId?: string; attempt_number?: number; attemptNumber?: number }) => {
    const reservationId = row.reservation_id ?? row.reservationId;
    const logicalWorkId = row.logical_work_id ?? row.logicalWorkId;
    const attemptNumber = row.attempt_number ?? row.attemptNumber;
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ feedbackId: `${logicalWorkId}:${attemptNumber}:release`, reservationId, attemptId: `${logicalWorkId}:${attemptNumber}`, routeId: fixture.route, quotaDomainId: fixture.domain, desiredProfileVersion: "plan-v1", qualificationVersion: "qualified", observationSource: "qualified_adapter", observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: "definitely_not_sent" }]);
  };

  try {
    await sql.unsafe("BEGIN");

    // CK-001.a / CK-002.b: each selected dimension fits independently, then
    // alone saturates with zero operational delta. Every admitted reservation
    // has exactly the three selected ledger dimensions and one held seat.
    for (const [dimension, capacity] of [["rpm", { rpm: 1, tpm: 20, concurrency: 2 }], ["tpm", { rpm: 2, tpm: 1, concurrency: 2 }], ["concurrency", { rpm: 2, tpm: 20, concurrency: 1 }]] as const) {
      const fixture = await setup(`saturate-${dimension}`, capacity);
      const constraint = await read(fixture, fixture.processes.interactive, "interactive");
      assert.equal(constraint.reason, "eligible_in_principle");
      assert.deepEqual(constraint.effectiveDimensions, ["rpm", "tpm", "concurrency"]);
      assert.equal("rpd" in constraint.effectiveCapacity, false); assert.equal("rpd" in constraint.safeWindow, false);
      const admitted = await publicAdmit(fixture, `${fixture.domain}-fits`, fixture.processes.interactive, "interactive", envelope({ [dimension]: capacity[dimension] }), constraint.effectiveConstraintRevision);
      assert.equal(admitted.state, "dispatched_or_may_have_started", `${dimension} independently fits through ProviderWorkAdmission/v1`);
      const ledger = await sql.unsafe("SELECT dimension_id,held_units FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [admitted.reservationId]);
      assert.deepEqual(ledger.map((row) => ({ dimension_id: row.dimension_id, held_units: row.held_units })), [["concurrency", "1"], ["rpm", String(dimension === "rpm" ? capacity.rpm : 1)], ["tpm", String(dimension === "tpm" ? capacity.tpm : 1)]].map(([dimension_id, held_units]) => ({ dimension_id, held_units })), "only selected dimensions receive exact physical liabilities");
      const before = await operationalCounts(fixture.domain);
      const denied = await publicAdmit(fixture, `${fixture.domain}-denied`, fixture.processes.interactive, "interactive", envelope(), constraint.effectiveConstraintRevision);
      assert.notEqual(denied.state, "dispatched_or_may_have_started", `${dimension} saturation is fail-closed`);
      assert.deepEqual(await operationalCounts(fixture.domain), before, `${dimension} denial creates no reservation, ledger, dispatch, or transport claim`);
    }

    // CK-001.b: neither a missing binding nor a revoked/nonactive binding can
    // turn the public read/admission path into an operational permit.
    for (const [name, revoke] of [["missing-policy", false], ["revoked-policy", true]] as const) {
      const fixture = await setup(name, { rpm: 2, tpm: 20, concurrency: 2 }, revoke);
      if (revoke) await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,'cap-v1',$2,'policy','v1',$3,'fixture')", [fixture.domain, fixture.route, `${fixture.domain}-revoked`]);
      const constraint = await read(fixture, fixture.processes.interactive, "interactive");
      assert.equal(constraint.reason, "unknown_policy_blocked", `${name} runtime read fails closed`);
      const before = await allCounts(fixture.domain);
      const result = await publicAdmit(fixture, `${fixture.domain}-blocked`, fixture.processes.interactive, "interactive", envelope(), "no-effective-constraint-revision");
      assert.equal(result.state, "policy_or_resource_unfit", `${name} public admission is unavailable`);
      assert.deepEqual(await allCounts(fixture.domain), before, `${name} produces no attempt, reservation, job, dispatch, ledger, or claim`);
    }

    // CK-002.a: the same three-dimensional qualified domain records fair
    // multi-lane selection, weighted dominant cost, background borrowing, and
    // an interactive admission protected by the non-lendable reserve.
    const fair = await setup("fairness", { rpm: 4, tpm: 40, concurrency: 4 });
    for (const [id, process, key, requestEnvelope] of [
      ["a-heavy", fair.processes.backgroundA, "a", envelope({ tpm: 20 })],
      ["z-follow", fair.processes.backgroundA, "a", envelope({ tpm: 1 })],
      ["b-small", fair.processes.backgroundB, "b", envelope()],
      ["c-small", fair.processes.backgroundC, "c", envelope()],
    ] as const) await register(fair, `${fair.domain}-${id}`, process, key, requestEnvelope);
    const turns: string[] = [];
    for (let i = 0; i < 4; i++) { const [admitted] = await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [fair.domain]); assert.ok(admitted); turns.push(admitted.logical_work_id); await release(fair, admitted); }
    assert.deepEqual(turns, [`${fair.domain}-a-heavy`, `${fair.domain}-z-follow`, `${fair.domain}-b-small`, `${fair.domain}-c-small`], "durable masked lanes preserve deterministic weighted ordering for differentiated demand");
    const laneState = await sql.unsafe("SELECT process_id,virtual_usage,last_admission_turn FROM bridge.provider_admission_lane_state WHERE quota_domain_id=$1 ORDER BY process_id", [fair.domain]);
    assert.equal(laneState.length, 3); assert.ok(laneState.every((row) => Number(row.virtual_usage) > 0 && Number(row.last_admission_turn) > 0), "masked RPM/TPM/concurrency demand advances durable weighted lane cost without an RPD term");
    await register(fair, `${fair.domain}-borrow`, fair.processes.backgroundA, "borrow", envelope({ rpm: 3, tpm: 30 }));
    const [borrowed] = await sql.unsafe("SELECT * FROM bridge.admit_next_provider_work_attempt($1)", [fair.domain]); assert.equal(borrowed.logical_work_id, `${fair.domain}-borrow`);
    const protectedRead = await read(fair, fair.processes.interactive, "interactive");
    const protectedAdmission = await publicAdmit(fair, `${fair.domain}-protected`, fair.processes.interactive, "interactive", envelope({ tpm: 5 }), protectedRead.effectiveConstraintRevision);
    assert.equal(protectedAdmission.state, "dispatched_or_may_have_started", "interactive reserve remains available while background borrows its permitted capacity");
    assert.deepEqual((await sql.unsafe("SELECT dimension_id FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [protectedAdmission.reservationId])).map((row) => row.dimension_id), ["concurrency", "rpm", "tpm"], "RPD never enters masked fairness liabilities");
    await release(fair, borrowed); await release(fair, protectedAdmission);

    // CK-002.b: a failure at every admission transaction step rolls back the
    // masked route's reservation, physical ledger, job, dispatch, and claim.
    for (const [name, table, operation] of [["attempt", "bridge.provider_work_attempt", "UPDATE"], ["reservation", "bridge.provider_work_reservation", "INSERT"], ["job", "pgboss.job", "INSERT"], ["dispatch", "bridge.provider_work_dispatch", "INSERT"]] as const) {
      const id = `${fair.domain}-fault-${name}`; await register(fair, id, fair.processes.interactive, `fault-${name}`);
      await sql.unsafe(`SAVEPOINT masked_fault_${name}`);
      await sql.unsafe("CREATE OR REPLACE FUNCTION pg_temp.fail_masked_cfc() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected masked admission failure'; END; $$");
      await sql.unsafe(`CREATE TRIGGER fail_masked_cfc_${name} BEFORE ${operation} ON ${table} FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_masked_cfc()`);
      await assert.rejects(() => sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [id]), /injected masked admission failure/);
      await sql.unsafe(`ROLLBACK TO SAVEPOINT masked_fault_${name}`);
      const [artifacts] = await sql.unsafe("SELECT (SELECT count(*)::int FROM bridge.provider_work_reservation WHERE logical_work_id=$1) reservations,(SELECT count(*)::int FROM bridge.provider_window_usage_ledger l JOIN bridge.provider_work_reservation r ON r.reservation_id=l.reservation_id WHERE r.logical_work_id=$1) ledgers,(SELECT count(*)::int FROM bridge.provider_work_dispatch WHERE logical_work_id=$1) dispatches,(SELECT count(*)::int FROM pgboss.job WHERE data->>'logicalWorkId'=$1) jobs,(SELECT count(*)::int FROM bridge.provider_transport_claim WHERE logical_work_id=$1) claims", [id]);
      assert.deepEqual(artifacts, { reservations: 0, ledgers: 0, dispatches: 0, jobs: 0, claims: 0 }, `${name} failure is atomic on the masked path`);
      await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'masked_fault_cleanup')", [id]);
    }

    // BSS-V2-006-05-05 / RC-00605-05: a wakeup is a policy-revalidation
    // boundary.  Revoking the policy after a replacement plan is activated
    // cannot relabel waiting work or create a new send, while an already
    // claimed reservation keeps its original immutable plan and three actual
    // physical liabilities.
    const revision = await setup("policy-revision", { rpm: 4, tpm: 40, concurrency: 2 });
    const revisionRead = await read(revision, revision.processes.interactive, "interactive");
    const oldFlight = await publicAdmit(revision, `${revision.domain}-old-flight`, revision.processes.interactive, "interactive", envelope(), revisionRead.effectiveConstraintRevision);
    assert.equal(oldFlight.state, "dispatched_or_may_have_started");
    await sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [oldFlight.reservationId]);
    await register(revision, `${revision.domain}-waiting`, revision.processes.interactive, "waiting");
    await register(revision, `${revision.domain}-cancelled`, revision.processes.interactive, "cancelled");
    await sql.unsafe("SELECT bridge.cancel_provider_work_attempt($1,1,'caller_cancelled')", [`${revision.domain}-cancelled`]);

    const [{ policy: revisionPolicy }] = await sql.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'cap-v1',$2) AS policy", [revision.domain, revision.route]);
    const [revisionPlan] = await sql.unsafe("SELECT profile FROM bridge.desired_admission_profile WHERE quota_domain_id=$1 AND profile_version='plan-v1'", [revision.domain]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile(quota_domain_id,profile_version,provider_capacity_profile_version,planner_version,effective_from,profile) VALUES($1,'plan-v2','cap-v1','planner-revision',now(),$2::jsonb)", [revision.domain, revisionPlan.profile]);
    for (const processId of Object.values(revision.processes)) await sql.unsafe("INSERT INTO bridge.desired_admission_profile_input(quota_domain_id,desired_profile_version,process_id,process_profile_version,workload_id,workload_profile_version) VALUES($1,'plan-v2',$2,'v1',$3,'v1')", [revision.domain, processId, `${processId}-workload`]);
    await sql.unsafe("INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id,desired_profile_version,provider_capacity_profile_version,route_id,policy_id,policy_version,effective_policy) VALUES($1,'plan-v2','cap-v1',$2,'policy','v1',$3::jsonb)", [revision.domain, revision.route, revisionPolicy]);
    await sql.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,'cap-v1',$2,'policy','v1',$3,'fixture')", [revision.domain, revision.route, `${revision.domain}-revoked`]);
    await sql.unsafe("SELECT bridge.activate_desired_admission_profile($1,'plan-v2')", [revision.domain]);
    const [blockedWakeup] = await sql.unsafe("SELECT bridge.consume_active_plan_wakeup($1,'active-plan:2') AS result", [revision.domain]);
    assert.deepEqual(blockedWakeup.result, { claimed: true, staleActivation: false, policyBlocked: true, rebasedWaitingWork: 0, ownerReplanIntents: 0, capacityRevisionIntents: 0 });
    const [wakeupReplay] = await sql.unsafe("SELECT bridge.consume_active_plan_wakeup($1,'active-plan:2') AS result", [revision.domain]);
    assert.equal(wakeupReplay.result.claimed, false, "at-least-once wakeup replay cannot mint a second rebase");
    assert.deepEqual((await sql.unsafe("SELECT desired_profile_version,activation_revision,state FROM bridge.provider_work_attempt WHERE logical_work_id=$1", [`${revision.domain}-waiting`]))[0], { desired_profile_version: "plan-v1", activation_revision: "1", state: "waiting" }, "revoked policy leaves waiting work blocked on its original revision");
    assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [`${revision.domain}-waiting`]))[0].decision, "unavailable", "stale policy cannot create a new reservation or send");
    assert.equal((await sql.unsafe("SELECT * FROM bridge.admit_interactive_provider_work_attempt($1,1)", [`${revision.domain}-cancelled`]))[0].decision, "unavailable", "cancellation remains a zero-send terminal fence");
    assert.deepEqual((await sql.unsafe("SELECT work.desired_profile_version,work.activation_revision,reservation.desired_profile_version AS reservation_profile,reservation.activation_revision AS reservation_revision,reservation.state FROM bridge.provider_work_attempt work JOIN bridge.provider_work_reservation reservation USING(logical_work_id,attempt_number) WHERE work.logical_work_id=$1", [`${revision.domain}-old-flight`]))[0], { desired_profile_version: "plan-v1", activation_revision: "1", reservation_profile: "plan-v1", reservation_revision: "1", state: "live" }, "claimed historical work retains its original policy liability");
    assert.deepEqual((await sql.unsafe("SELECT dimension_id FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [oldFlight.reservationId])).map((row) => row.dimension_id), ["concurrency", "rpm", "tpm"], "historical masked liability is not relabeled or given an RPD row");

    // RC-00605-06: ambiguous 429 is only a route-scoped pressure event.  It
    // consumes the normal cooldown/probe/recovery seam, never invents a daily
    // RPD value, and cannot publish a desired plan.
    const pressure = await setup("masked-429", { rpm: 4, tpm: 40, concurrency: 2 });
    await sql.unsafe("INSERT INTO bridge.runtime_pressure_safety_policy(policy_id,version,quota_domain_id,maximum_accepted_retry_after_seconds,metadata_free_cooldown_seconds,probe_eligibility_seconds) VALUES($1,'v1',$2,60,7,60)", [`${pressure.domain}-pressure`, pressure.domain]);
    const pressureRead = await read(pressure, pressure.processes.interactive, "interactive");
    const pressureWork = await publicAdmit(pressure, `${pressure.domain}-rate-limited`, pressure.processes.interactive, "interactive", envelope(), pressureRead.effectiveConstraintRevision);
    assert.equal(pressureWork.state, "dispatched_or_may_have_started");
    await sql.unsafe("SELECT bridge.claim_fake_provider_transport($1)", [pressureWork.reservationId]);
    await sql.unsafe("SELECT bridge.ingest_provider_operational_feedback($1::jsonb)", [{ feedbackId: `${pressure.domain}-429`, reservationId: pressureWork.reservationId, attemptId: `${pressure.domain}-rate-limited:1`, routeId: pressure.route, quotaDomainId: pressure.domain, desiredProfileVersion: "plan-v1", qualificationVersion: "qualified", observationSource: "qualified_adapter", observationTrust: "qualified", observedAt: new Date().toISOString(), transportDisposition: "terminal_confirmed", operationalOutcome: "rate_limited", retryAfterSeconds: 2 }]);
    assert.deepEqual((await sql.unsafe("SELECT scope_kind,route_id,dimension_id,numeric_remaining_units,policy_available FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=$1", [pressure.domain]))[0], { scope_kind: "route", route_id: pressure.route, dimension_id: null, numeric_remaining_units: null, policy_available: true }, "ambiguous 429 remains a scoped hold rather than an invented RPD quota");
    assert.equal((await read(pressure, pressure.processes.interactive, "interactive")).reason, "temporarily_pressure_blocked", "the public constraint surfaces the scoped cooldown");
    assert.deepEqual((await sql.unsafe("SELECT dimension_id FROM bridge.provider_window_usage_ledger WHERE reservation_id=$1 ORDER BY dimension_id", [pressureWork.reservationId])).map((row) => row.dimension_id), ["concurrency", "rpm", "tpm"], "429 feedback cannot fabricate a daily RPD ledger");
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.desired_admission_profile WHERE quota_domain_id=$1", [pressure.domain]))[0].count, 1, "feedback cannot publish a new capacity plan");
    assert.equal((await sql.unsafe("SELECT bridge.recover_provider_pressure_incident($1,$2,$3,'route',NULL,NULL,'qualified',clock_timestamp()) AS recovered", [pressure.domain, pressure.route, `${pressure.domain}-recovered`]))[0].recovered, true, "only the existing matching recovery clears the scoped hold");
  } finally { await sql.unsafe("ROLLBACK").catch(() => undefined); await sql.end(); }
});
