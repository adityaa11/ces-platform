-- BSS-V2-006-05-05: activation wakeups are a policy-revalidation boundary.
-- A claimed wakeup may never rebase waiting work onto a policy that is now
-- stale, revoked, or otherwise unqualified.  Reserved/claimed work is not
-- selected by this function and therefore retains its immutable plan and
-- physical-window liability.
CREATE OR REPLACE FUNCTION bridge.consume_active_plan_wakeup(
  p_quota_domain_id text, p_wakeup_key text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE claimed jsonb; active record; rebased_count integer := 0;
  owner_intents integer := 0; capacity_intents integer := 0;
BEGIN
  claimed := bridge.claim_provider_work_wakeup(p_quota_domain_id, p_wakeup_key);
  IF claimed IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'rebasedWaitingWork', 0, 'ownerReplanIntents', 0, 'capacityRevisionIntents', 0);
  END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND
     OR active.desired_profile_version <> claimed->>'desiredProfileVersion'
     OR active.activation_revision <> (claimed->>'activationRevision')::bigint THEN
    RETURN jsonb_build_object('claimed', true, 'staleActivation', true, 'rebasedWaitingWork', 0, 'ownerReplanIntents', 0, 'capacityRevisionIntents', 0);
  END IF;

  -- This invokes the immutable BSS-005 binding and checks its exact active
  -- policy against the active profile vectors.  It does not mint, publish, or
  -- repair policy.  A later qualified activation owns any future rebase.
  BEGIN
    PERFORM bridge.effective_admission_dimensions(
      p_quota_domain_id, active.desired_profile_version, active.profile
    );
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('claimed', true, 'staleActivation', false,
      'policyBlocked', true, 'rebasedWaitingWork', 0,
      'ownerReplanIntents', 0, 'capacityRevisionIntents', 0);
  END;

  INSERT INTO bridge.provider_admission_convergence_intent(
    intent_kind, quota_domain_id, logical_work_id, attempt_number,
    source_desired_profile_version, source_activation_revision,
    active_desired_profile_version, active_activation_revision, provenance
  )
  SELECT 'owner_replan_required', work.quota_domain_id, work.logical_work_id, work.attempt_number,
    work.desired_profile_version, work.activation_revision,
    active.desired_profile_version, active.activation_revision,
    jsonb_build_object('reason', 'immutable_process_or_workload_input_not_in_active_plan',
      'sourceDesiredProfileVersion', work.desired_profile_version,
      'sourceActivationRevision', work.activation_revision,
      'activeDesiredProfileVersion', active.desired_profile_version,
      'activeActivationRevision', active.activation_revision,
      'processId', work.process_id, 'processProfileVersion', work.process_profile_version)
  FROM bridge.provider_work_attempt work
  WHERE work.quota_domain_id = p_quota_domain_id AND work.state = 'waiting'
    AND (work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision)
    AND NOT EXISTS (
      SELECT 1 FROM bridge.desired_admission_profile_input input
      JOIN bridge.provider_process_profile process
        ON (process.process_id, process.profile_version) = (input.process_id, input.process_profile_version)
      WHERE input.quota_domain_id = active.quota_domain_id
        AND input.desired_profile_version = active.desired_profile_version
        AND input.process_id = work.process_id
        AND input.process_profile_version = work.process_profile_version
        AND process.workload_id = input.workload_id
        AND process.workload_profile_version = input.workload_profile_version
    )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS owner_intents = ROW_COUNT;

  INSERT INTO bridge.provider_admission_convergence_intent(
    intent_kind, quota_domain_id, logical_work_id, attempt_number,
    source_desired_profile_version, source_activation_revision,
    active_desired_profile_version, active_activation_revision, provenance
  )
  SELECT 'capacity_revision_request', work.quota_domain_id, work.logical_work_id, work.attempt_number,
    work.desired_profile_version, work.activation_revision,
    active.desired_profile_version, active.activation_revision,
    jsonb_build_object('reason', 'immutable_active_plan_capacity_downgrade',
      'sourceDesiredProfileVersion', work.desired_profile_version,
      'sourceActivationRevision', work.activation_revision,
      'activeDesiredProfileVersion', active.desired_profile_version,
      'activeActivationRevision', active.activation_revision)
  FROM bridge.provider_work_attempt work
  JOIN bridge.desired_admission_profile source_plan
    ON (source_plan.quota_domain_id, source_plan.profile_version) = (work.quota_domain_id, work.desired_profile_version)
  WHERE work.quota_domain_id = p_quota_domain_id AND work.state = 'waiting'
    AND (work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision)
    AND bridge.admission_vector_fits('{}'::jsonb, work.request_resource_envelope, source_plan.profile->'usableGlobalCapacity')
    AND NOT bridge.admission_vector_fits('{}'::jsonb, work.request_resource_envelope, active.profile->'usableGlobalCapacity')
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS capacity_intents = ROW_COUNT;

  UPDATE bridge.provider_work_attempt work
    SET desired_profile_version = active.desired_profile_version,
        activation_revision = active.activation_revision,
        state_version = work.state_version + 1,
        updated_at = clock_timestamp()
  WHERE work.quota_domain_id = p_quota_domain_id AND work.state = 'waiting'
    AND (work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision)
    AND EXISTS (
      SELECT 1 FROM bridge.desired_admission_profile_input input
      JOIN bridge.provider_process_profile process
        ON (process.process_id, process.profile_version) = (input.process_id, input.process_profile_version)
      WHERE input.quota_domain_id = active.quota_domain_id
        AND input.desired_profile_version = active.desired_profile_version
        AND input.process_id = work.process_id
        AND input.process_profile_version = work.process_profile_version
        AND process.workload_id = input.workload_id
        AND process.workload_profile_version = input.workload_profile_version
    );
  GET DIAGNOSTICS rebased_count = ROW_COUNT;
  INSERT INTO bridge.provider_admission_domain_state(quota_domain_id,fairness_epoch,virtual_time,next_turn)
    VALUES (p_quota_domain_id,active.desired_profile_version||':'||active.activation_revision,0,1)
  ON CONFLICT(quota_domain_id) DO UPDATE SET
    fairness_epoch=EXCLUDED.fairness_epoch,
    virtual_time=0,
    next_turn=1;
  RETURN jsonb_build_object('claimed', true, 'staleActivation', false,
    'rebasedWaitingWork', rebased_count, 'ownerReplanIntents', owner_intents,
    'capacityRevisionIntents', capacity_intents);
END;
$$;

ALTER FUNCTION bridge.consume_active_plan_wakeup(text,text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.consume_active_plan_wakeup(text,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.consume_active_plan_wakeup(text,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0084_bssv20060505_policy_revision_operational_recovery') ON CONFLICT DO NOTHING;
