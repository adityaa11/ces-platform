-- BSS-V2-006-05-03: the BSS-V2-005 planning reader is the only database
-- projection exposed to consumers.  It returns planning facts, never an
-- admission permit, and is executable only by the Bridge-owned read service.

CREATE OR REPLACE FUNCTION bridge.read_capacity_planning_snapshot(
  p_quota_domain_id text,
  p_process_id text,
  p_process_profile_version text,
  p_route_id text,
  p_service_class text,
  p_prospective boolean DEFAULT false,
  p_request_bytes bigint DEFAULT NULL,
  p_input_tokens bigint DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_policy_row bridge.provider_enforcement_policy;
  v_capacity bridge.provider_capacity_profile;
  v_process bridge.provider_process_profile;
  v_workload bridge.workload_envelope_profile;
  v_active record;
  v_effective jsonb;
  v_status text := 'inactive';
  v_reason text := 'inactive_or_unqualified_plan';
  v_plan jsonb := NULL;
BEGIN
  IF p_quota_domain_id IS NULL OR length(trim(p_quota_domain_id)) = 0
    OR p_process_id IS NULL OR length(trim(p_process_id)) = 0
    OR p_process_profile_version IS NULL OR length(trim(p_process_profile_version)) = 0
    OR p_route_id IS NULL OR length(trim(p_route_id)) = 0
    OR p_service_class NOT IN ('background', 'interactive')
    OR (p_request_bytes IS NOT NULL AND p_request_bytes < 0)
    OR (p_input_tokens IS NOT NULL AND p_input_tokens < 0) THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v1','status','inactive','reason','invalid_server_binding','readIsNotAdmissionPermit',true);
  END IF;

  -- The policy is selected by its immutable effective timestamp.  A caller
  -- cannot nominate a profile/policy version or weaken a domain-wide mask.
  SELECT policy.* INTO v_policy_row
    FROM bridge.provider_enforcement_policy policy
    WHERE policy.quota_domain_id = p_quota_domain_id AND policy.route_id = p_route_id
      AND policy.effective_from <= clock_timestamp()
    ORDER BY policy.effective_from DESC
    LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v1','status','stale','reason','effective_policy_missing','readIsNotAdmissionPermit',true);
  END IF;
  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id = v_policy_row.quota_domain_id AND profile_version = v_policy_row.provider_capacity_profile_version;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v1','status','stale','reason','capacity_profile_missing','readIsNotAdmissionPermit',true);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_each(v_capacity.limits) AS dimension WHERE dimension.value->>'state' = 'zero') THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v1','status','unfit','reason','provider_capacity_zero','readIsNotAdmissionPermit',true);
  END IF;
  BEGIN
    v_effective := bridge.derive_effective_enforcement_policy(v_policy_row.quota_domain_id, v_policy_row.provider_capacity_profile_version, p_route_id);
  EXCEPTION WHEN OTHERS THEN
    -- A missing/revoked/foreign policy and an unknown enforced source fail
    -- closed.  Do not expose a fallback numeric capacity.
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v1','status','stale','reason','effective_policy_unavailable','readIsNotAdmissionPermit',true);
  END;

  SELECT * INTO v_process FROM bridge.provider_process_profile
    WHERE process_id = p_process_id AND profile_version = p_process_profile_version;
  IF FOUND THEN
    SELECT * INTO v_workload FROM bridge.workload_envelope_profile
      WHERE workload_id = v_process.workload_id AND profile_version = v_process.workload_profile_version;
  END IF;
  IF NOT FOUND OR v_process.service_class IS DISTINCT FROM p_service_class
    OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_process.eligible_route_ids) route WHERE route = p_route_id) THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v1','status','inactive','reason','server_binding_unqualified','readIsNotAdmissionPermit',true);
  END IF;

  IF p_prospective THEN
    IF (p_request_bytes IS NOT NULL AND p_request_bytes > COALESCE((v_workload.structural_bound->>'maxRequestBytes')::bigint, -1))
      OR (p_input_tokens IS NOT NULL AND p_input_tokens > COALESCE((v_workload.structural_bound->>'maxInputTokens')::bigint, -1)) THEN
      v_status := 'unfit'; v_reason := 'synthetic_request_exceeds_structural_bound';
    ELSE
      v_status := 'inactive'; v_reason := 'prospective_planning_only';
    END IF;
  ELSE
    SELECT active.desired_profile_version, active.activation_revision, desired.planner_version, desired.effective_from, desired.profile
      INTO v_active
      FROM bridge.active_desired_admission_profile active
      JOIN bridge.desired_admission_profile desired ON (desired.quota_domain_id, desired.profile_version) = (active.quota_domain_id, active.desired_profile_version)
      JOIN bridge.desired_admission_profile_policy_binding binding ON (binding.quota_domain_id, binding.desired_profile_version) = (desired.quota_domain_id, desired.profile_version)
      JOIN bridge.desired_admission_profile_input input ON (input.quota_domain_id, input.desired_profile_version) = (desired.quota_domain_id, desired.profile_version)
      WHERE active.quota_domain_id = p_quota_domain_id
        AND binding.route_id = p_route_id
        AND binding.provider_capacity_profile_version = v_policy_row.provider_capacity_profile_version
        AND binding.policy_id = v_effective->>'policyId' AND binding.policy_version = v_effective->>'policyVersion'
        AND input.process_id = p_process_id AND input.process_profile_version = p_process_profile_version
      LIMIT 1;
    IF FOUND AND v_process.active AND v_workload.active THEN
      v_status := 'qualified'; v_reason := 'qualified_planning_policy';
      v_plan := jsonb_build_object('profileVersion',v_active.desired_profile_version,'activationRevision',v_active.activation_revision,'plannerVersion',v_active.planner_version,'effectiveFrom',v_active.effective_from,'identity',v_active.profile);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'apiVersion','CapacityPlanningSnapshot/v1', 'status',v_status, 'reason',v_reason, 'readIsNotAdmissionPermit',true,
    'source',jsonb_build_object('quotaDomainId',v_capacity.quota_domain_id,'providerCapacityProfileVersion',v_capacity.profile_version,'capacitySource',v_capacity.capacity_source,'sourceRef',v_capacity.source_ref,'sourceVersion',v_capacity.source_version,'limits',v_capacity.limits,'windowPolicies',v_capacity.window_policies),
    'enforcement',v_effective,
    'process',jsonb_build_object('id',v_process.process_id,'profileVersion',v_process.profile_version,'serviceClass',v_process.service_class,'active',v_process.active),
    'workload',jsonb_build_object('id',v_workload.workload_id,'profileVersion',v_workload.profile_version,'active',v_workload.active,'structuralBound',v_workload.structural_bound,'estimator',v_workload.estimator,'outputReservation',v_workload.output_reservation,'safetyPolicy',v_workload.safety_policy),
    'plan',v_plan,
    'view',CASE WHEN p_prospective THEN 'prospective-planning-only' ELSE 'active-planning-read' END
  );
END;
$$;

ALTER FUNCTION bridge.read_capacity_planning_snapshot(text,text,text,text,text,boolean,bigint,bigint) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.read_capacity_planning_snapshot(text,text,text,text,text,boolean,bigint,bigint) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.read_capacity_planning_snapshot(text,text,text,text,text,boolean,bigint,bigint) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0082_bssv20060503_authenticated_effective_capacity_snapshot') ON CONFLICT DO NOTHING;
