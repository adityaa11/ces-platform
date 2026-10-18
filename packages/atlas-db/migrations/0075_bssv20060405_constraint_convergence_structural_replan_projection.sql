-- BSS-V2-006-04-05: project the already-owned 03A/005 convergence facts to
-- authenticated consumers.  This migration neither publishes BSS-005 policy
-- nor rewrites immutable work; it only makes the existing durable intent and
-- conservative runtime clamp observable at the public 006-04 boundary.

CREATE OR REPLACE FUNCTION bridge.read_runtime_capacity_constraint(
  p_quota_domain_id text,
  p_process_id text,
  p_process_profile_version text,
  p_route_id text,
  p_service_class text
) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  active record;
  process_profile bridge.provider_process_profile;
  plan_input record;
  capacity bridge.provider_capacity_profile;
  qualified_route bridge.qualified_provider_route_authority;
  window_count integer;
  unknown_windows boolean;
  pressure_blocked boolean;
  unavailable_pressure boolean;
  cooldown timestamptz;
  clamp_dimensions jsonb;
  window_status jsonb;
  constraint_revision text;
  effective_capacity jsonb;
  used_capacity jsonb;
  accounting_available boolean := false;
  reason text := 'unknown_policy_blocked';
  structural_status text := 'unknown';
  transient_status text := 'unknown';
BEGIN
  IF p_quota_domain_id IS NULL OR p_process_id IS NULL
    OR p_process_profile_version IS NULL OR p_route_id IS NULL
    OR p_service_class NOT IN ('background', 'interactive') THEN
    RETURN jsonb_build_object('apiVersion', 'RuntimeCapacityConstraint/v1',
      'reason', 'inactive_or_unauthorized', 'structuralStatus', 'inactive',
      'transientStatus', 'blocked', 'eligible', jsonb_build_object('background', false, 'interactive', false),
      'readIsNotSendPermit', true);
  END IF;

  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('apiVersion', 'RuntimeCapacityConstraint/v1',
      'reason', 'inactive_or_unauthorized', 'structuralStatus', 'inactive',
      'transientStatus', 'blocked', 'eligible', jsonb_build_object('background', false, 'interactive', false),
      'readIsNotSendPermit', true);
  END IF;

  SELECT * INTO process_profile FROM bridge.provider_process_profile
    WHERE process_id=p_process_id AND profile_version=p_process_profile_version;
  SELECT * INTO plan_input FROM bridge.desired_admission_profile_input
    WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version
      AND process_id=p_process_id AND process_profile_version=p_process_profile_version;
  SELECT * INTO capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id=p_quota_domain_id AND profile_version=active.provider_capacity_profile_version;
  SELECT * INTO qualified_route FROM bridge.qualified_provider_route_authority WHERE route_id=p_route_id;

  IF NOT FOUND OR process_profile.process_id IS NULL OR plan_input.process_id IS NULL
    OR NOT process_profile.active OR process_profile.service_class<>p_service_class
    OR NOT (process_profile.eligible_route_ids @> jsonb_build_array(p_route_id))
    OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(capacity.associated_routes) route WHERE route->>'routeId'=p_route_id)
    OR qualified_route.route_id IS NULL OR qualified_route.capability<>process_profile.capability THEN
    RETURN jsonb_build_object('apiVersion', 'RuntimeCapacityConstraint/v1',
      'reason', 'inactive_or_unauthorized', 'structuralStatus', 'inactive',
      'transientStatus', 'blocked', 'eligible', jsonb_build_object('background', false, 'interactive', false),
      'readIsNotSendPermit', true);
  END IF;

  IF jsonb_typeof(active.profile) <> 'object'
    OR NOT (active.profile ? 'usableGlobalCapacity' AND active.profile ? 'hardInteractiveReserve' AND active.profile ? 'backgroundCapacity')
    OR EXISTS (SELECT 1 FROM jsonb_each(active.profile->'usableGlobalCapacity') vector
               WHERE jsonb_typeof(vector.value)<>'number' OR (vector.value::text)::numeric<=0) THEN
    structural_status := 'unfit';
    transient_status := 'blocked';
    reason := 'structurally_unfit';
    effective_capacity := '{}'::jsonb;
  ELSE
    structural_status := 'qualified';
    effective_capacity := active.profile->'usableGlobalCapacity';
    BEGIN
      used_capacity := bridge.current_provider_operational_usage(p_quota_domain_id, active.provider_capacity_profile_version);
      effective_capacity := bridge.apply_domain_pressure_clamps(p_quota_domain_id, used_capacity, effective_capacity);
      accounting_available := true;
    EXCEPTION WHEN others THEN
      -- An unavailable live accounting surface cannot be represented as an
      -- optimistic capacity value or become an admission hint.
      effective_capacity := '{}'::jsonb;
      transient_status := 'unknown';
      reason := 'unknown_policy_blocked';
    END;
    SELECT count(*), bool_or(NOT reset_semantics_known OR reset_at IS NULL)
      INTO window_count, unknown_windows
      FROM bridge.provider_quota_window_state
      WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version
        AND activation_revision=active.activation_revision
        AND provider_capacity_profile_version=active.provider_capacity_profile_version
        AND dimension_id IN ('rpm','tpm','rpd','concurrency');
    SELECT COALESCE(jsonb_object_agg(dimension_id, jsonb_build_object(
      'state', CASE WHEN reset_semantics_known AND reset_at IS NOT NULL THEN 'known' ELSE 'unknown' END,
      'resetAt', CASE WHEN reset_semantics_known THEN reset_at ELSE NULL END
    )), '{}'::jsonb) INTO window_status
      FROM bridge.provider_quota_window_state
      WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version
        AND activation_revision=active.activation_revision
        AND provider_capacity_profile_version=active.provider_capacity_profile_version
        AND dimension_id IN ('rpm','tpm','rpd','concurrency');
    SELECT EXISTS(SELECT 1 FROM bridge.provider_operational_pressure_incident incident
      WHERE incident.quota_domain_id=p_quota_domain_id AND incident.recovered_at IS NULL
        AND (incident.scope_kind='domain' OR incident.route_id=p_route_id)
        AND NOT incident.policy_available),
      EXISTS(SELECT 1 FROM bridge.provider_operational_pressure_incident incident
      WHERE incident.quota_domain_id=p_quota_domain_id AND incident.recovered_at IS NULL
        AND (incident.scope_kind='domain' OR incident.route_id=p_route_id)
        AND incident.policy_available AND clock_timestamp()<incident.cooldown_until),
      max(incident.cooldown_until),
      COALESCE(jsonb_agg(DISTINCT incident.dimension_id) FILTER (WHERE incident.dimension_id IS NOT NULL), '[]'::jsonb)
      INTO unavailable_pressure, pressure_blocked, cooldown, clamp_dimensions
      FROM bridge.provider_operational_pressure_incident incident
      WHERE incident.quota_domain_id=p_quota_domain_id AND incident.recovered_at IS NULL
        AND (incident.scope_kind='domain' OR incident.route_id=p_route_id);
    IF accounting_available THEN
      IF window_count<>4 OR COALESCE(unknown_windows, true) OR unavailable_pressure THEN
        transient_status := 'unknown'; reason := 'unknown_policy_blocked';
      ELSIF pressure_blocked THEN
        transient_status := 'pressure_blocked'; reason := 'temporarily_pressure_blocked';
      ELSE
        transient_status := 'eligible_in_principle'; reason := 'eligible_in_principle';
      END IF;
    END IF;
  END IF;

  SELECT md5(jsonb_build_object(
    'activationRevision', active.activation_revision,
    'desiredProfileVersion', active.desired_profile_version,
    'effectiveCapacity', effective_capacity,
    'windowRevision', COALESCE((SELECT max(updated_at)::text FROM bridge.provider_quota_window_state
      WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version
        AND activation_revision=active.activation_revision), 'none'),
    'pressureRevision', COALESCE((SELECT max(updated_at)::text FROM bridge.provider_operational_pressure_incident
      WHERE quota_domain_id=p_quota_domain_id AND recovered_at IS NULL
        AND (scope_kind='domain' OR route_id=p_route_id)), 'none')
  )::text) INTO constraint_revision;

  RETURN jsonb_build_object(
    'apiVersion', 'RuntimeCapacityConstraint/v1',
    'identity', jsonb_build_object('processId', p_process_id, 'processProfileVersion', p_process_profile_version,
      'routeId', p_route_id, 'quotaDomainId', p_quota_domain_id, 'serviceClass', p_service_class),
    'plan', jsonb_build_object('desiredProfileVersion', active.desired_profile_version,
      'activationRevision', active.activation_revision, 'policyRevision', active.planner_version),
    'effectiveConstraintRevision', constraint_revision,
    'effectiveCapacity', effective_capacity,
    'structuralStatus', structural_status,
    'transientStatus', transient_status,
    'reason', reason,
    'safeWindow', COALESCE(window_status, '{}'::jsonb),
    'cooldown', jsonb_build_object('active', COALESCE(pressure_blocked, false), 'until', cooldown),
    'clamp', jsonb_build_object('active', jsonb_array_length(COALESCE(clamp_dimensions, '[]'::jsonb))>0, 'dimensions', COALESCE(clamp_dimensions, '[]'::jsonb)),
    'eligible', jsonb_build_object('background', reason='eligible_in_principle' AND active.profile ? 'backgroundCapacity',
      'interactive', reason='eligible_in_principle' AND active.profile ? 'hardInteractiveReserve'),
    'readIsNotSendPermit', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION bridge.provider_work_admission_v1_outcome(p_logical_work_id text, p_attempt_number integer)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'apiVersion','ProviderWorkAdmission/v1',
    'state', CASE
      WHEN work.cancellation_requested_at IS NOT NULL THEN 'terminal_cancelled'
      WHEN intent.intent_kind IS NOT NULL THEN 'consumer_replan_required'
      WHEN work.state='waiting' THEN 'waiting'
      WHEN work.state='reserved' THEN 'reserved'
      WHEN work.state IN ('dispatched','transport_may_have_started') THEN 'dispatched_or_may_have_started'
      WHEN work.state='terminal' THEN 'terminal_cancelled'
      WHEN feedback.transport_disposition='may_have_started' THEN 'dispatched_or_may_have_started'
      WHEN feedback.normalized_feedback->>'operationalOutcome'='success' THEN 'terminal_success'
      WHEN feedback.normalized_feedback->>'operationalOutcome'='rate_limited' THEN 'pressure_limited'
      ELSE 'terminal_provider_failure' END,
    'logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,
    'reservationId',reservation.reservation_id,'jobId',dispatch.job_id,
    'consumerReplan', CASE WHEN intent.intent_kind IS NOT NULL THEN jsonb_build_object(
      'apiVersion','ConsumerReplanRequired/v1',
      'reason',intent.provenance->>'reason',
      'sourceDesiredProfileVersion',intent.source_desired_profile_version,
      'sourceActivationRevision',intent.source_activation_revision,
      'requiredDesiredProfileVersion',intent.active_desired_profile_version,
      'requiredActivationRevision',intent.active_activation_revision
    ) END
  ))
  FROM bridge.provider_work_attempt work
  LEFT JOIN LATERAL (
    SELECT * FROM bridge.provider_admission_convergence_intent
    WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number
      AND intent_kind IN ('owner_replan_required','capacity_revision_request')
    ORDER BY created_at DESC LIMIT 1
  ) intent ON true
  LEFT JOIN bridge.provider_work_reservation reservation ON reservation.logical_work_id=work.logical_work_id AND reservation.attempt_number=work.attempt_number
  LEFT JOIN bridge.provider_work_dispatch dispatch ON dispatch.reservation_id=reservation.reservation_id
  LEFT JOIN bridge.provider_operational_feedback_event feedback ON feedback.reservation_id=reservation.reservation_id
  WHERE work.logical_work_id=p_logical_work_id AND work.attempt_number=p_attempt_number
  ORDER BY reservation.created_at DESC NULLS LAST LIMIT 1
$$;

ALTER FUNCTION bridge.read_runtime_capacity_constraint(text,text,text,text,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.provider_work_admission_v1_outcome(text,integer) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.read_runtime_capacity_constraint(text,text,text,text,text),bridge.provider_work_admission_v1_outcome(text,integer) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.read_runtime_capacity_constraint(text,text,text,text,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0075_bssv20060405_constraint_convergence_structural_replan_projection') ON CONFLICT DO NOTHING;
