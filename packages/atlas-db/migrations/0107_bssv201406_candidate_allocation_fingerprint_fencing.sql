-- BSS-V2-014-06 CFC: reject corrupted immutable candidate/allocation digest
-- rows before the authenticated v2 reader exposes any qualified data.

CREATE OR REPLACE FUNCTION bridge.read_capacity_planning_snapshot(
  p_quota_domain_id text, p_process_id text, p_process_profile_version text,
  p_route_id text, p_service_class text, p_prospective boolean,
  p_request_bytes bigint, p_input_tokens bigint, p_output_tokens bigint,
  p_qualification_v2 boolean
) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_candidate record; v_active record; v_capacity bridge.provider_capacity_profile;
  v_process bridge.provider_process_profile; v_workload bridge.workload_envelope_profile;
  v_authority bridge.qualified_provider_route_authority;
  v_binding bridge.desired_admission_profile_route_binding_v2;
  v_allocation bridge.calculated_class_process_allocation; v_effective jsonb;
  v_process_allocation jsonb; v_baseline jsonb; v_structural jsonb; v_output jsonb;
  v_required_dimension text; v_fingerprint text; v_complete_tokens bigint;
BEGIN
  IF NOT COALESCE(p_qualification_v2, false) THEN
    RETURN bridge.read_capacity_planning_snapshot(p_quota_domain_id,p_process_id,p_process_profile_version,p_route_id,p_service_class,p_prospective,p_request_bytes,p_input_tokens);
  END IF;
  IF p_quota_domain_id IS NULL OR btrim(p_quota_domain_id) = '' OR p_process_id IS NULL OR btrim(p_process_id) = ''
    OR p_process_profile_version IS NULL OR btrim(p_process_profile_version) = '' OR p_route_id IS NULL OR btrim(p_route_id) = ''
    OR p_service_class NOT IN ('background','interactive') OR p_prospective
    OR (p_request_bytes IS NOT NULL AND p_request_bytes < 0) OR (p_input_tokens IS NOT NULL AND p_input_tokens < 0)
    OR (p_output_tokens IS NOT NULL AND p_output_tokens < 0) THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','inactive','reason','invalid_server_binding','readIsNotAdmissionPermit',true);
  END IF;

  -- An active v2 pointer wins over a newer candidate, but it is usable only
  -- when the exact activation row and immutable candidate record agree.
  SELECT active.desired_profile_version, active.activation_revision,
         desired.profile->>'successorPublication' = 'shared_domain_calculated_allocation/v2' AS is_v2
    INTO v_active
    FROM bridge.active_desired_admission_profile active
    JOIN bridge.desired_admission_profile desired ON (desired.quota_domain_id,desired.profile_version)=(active.quota_domain_id,active.desired_profile_version)
   WHERE active.quota_domain_id=p_quota_domain_id;
  IF FOUND AND v_active.is_v2 THEN
    SELECT candidate.candidate_activation_revision, desired.profile_version, desired.provider_capacity_profile_version,
           desired.planner_version, desired.effective_from, desired.profile, candidate.effective_input_fingerprint,
           v_active.activation_revision AS active_activation_revision, true AS production_active
      INTO v_candidate
      FROM bridge.desired_admission_profile_candidate candidate
      JOIN bridge.desired_admission_profile desired ON (desired.quota_domain_id,desired.profile_version)=(candidate.quota_domain_id,candidate.desired_profile_version)
      JOIN bridge.desired_admission_profile_activation activation ON (activation.quota_domain_id,activation.desired_profile_version,activation.activation_revision)=(p_quota_domain_id,v_active.desired_profile_version,v_active.activation_revision)
     WHERE candidate.quota_domain_id=p_quota_domain_id AND candidate.desired_profile_version=v_active.desired_profile_version;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','active_profile_binding_missing','readIsNotAdmissionPermit',true);
    END IF;
  ELSE
    SELECT candidate.candidate_activation_revision, desired.profile_version, desired.provider_capacity_profile_version,
           desired.planner_version, desired.effective_from, desired.profile, candidate.effective_input_fingerprint,
           NULL::bigint AS active_activation_revision, false AS production_active
      INTO v_candidate
      FROM bridge.desired_admission_profile_candidate candidate
      JOIN bridge.desired_admission_profile desired ON (desired.quota_domain_id,desired.profile_version)=(candidate.quota_domain_id,candidate.desired_profile_version)
     WHERE candidate.quota_domain_id=p_quota_domain_id
     ORDER BY candidate.candidate_activation_revision DESC LIMIT 1;
    IF NOT FOUND OR v_candidate.profile->>'successorPublication' IS DISTINCT FROM 'shared_domain_calculated_allocation/v2' THEN
      RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','calculated_candidate_missing','readIsNotAdmissionPermit',true);
    END IF;
  END IF;

  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile WHERE quota_domain_id=p_quota_domain_id AND profile_version=v_candidate.provider_capacity_profile_version;
  SELECT * INTO v_process FROM bridge.provider_process_profile WHERE process_id=p_process_id AND profile_version=p_process_profile_version;
  IF FOUND THEN SELECT * INTO v_workload FROM bridge.workload_envelope_profile WHERE workload_id=v_process.workload_id AND profile_version=v_process.workload_profile_version; END IF;
  IF v_capacity IS NULL OR v_process IS NULL OR v_workload IS NULL OR NOT v_process.active OR NOT v_workload.active
    OR v_process.service_class IS DISTINCT FROM p_service_class OR NOT (v_process.eligible_route_ids @> jsonb_build_array(p_route_id))
    OR NOT EXISTS (SELECT 1 FROM bridge.desired_admission_profile_input input WHERE input.quota_domain_id=p_quota_domain_id AND input.desired_profile_version=v_candidate.profile_version AND input.process_id=p_process_id AND input.process_profile_version=p_process_profile_version AND input.workload_id=v_workload.workload_id AND input.workload_profile_version=v_workload.profile_version) THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','inactive','reason','server_binding_unqualified','readIsNotAdmissionPermit',true);
  END IF;
  SELECT binding.* INTO v_binding FROM bridge.desired_admission_profile_route_binding_v2 binding WHERE binding.quota_domain_id=p_quota_domain_id AND binding.desired_profile_version=v_candidate.profile_version AND binding.route_id=p_route_id AND binding.provider_capacity_profile_version=v_candidate.provider_capacity_profile_version;
  IF NOT FOUND THEN RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','route_binding_missing','readIsNotAdmissionPermit',true); END IF;
  SELECT * INTO v_authority FROM bridge.qualified_provider_route_authority WHERE authority_version=v_binding.authority_version AND authority_kind='qualified_v1';
  IF NOT FOUND OR v_authority.quota_domain_id IS DISTINCT FROM p_quota_domain_id OR v_authority.route_id IS DISTINCT FROM p_route_id OR v_authority.capability IS DISTINCT FROM v_process.capability OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_capacity.associated_routes) route WHERE route->>'routeId'=v_authority.route_id AND route->>'providerId'=v_authority.provider_id AND route->>'modelOrProcessorId'=v_authority.model_or_processor_id AND route->>'adapterVersion'=v_authority.adapter_version AND route->>'qualificationRef'=v_authority.qualification_ref AND route->>'qualificationVersion'=v_authority.qualification_version AND route->>'capability'=v_authority.capability) THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','route_authority_mismatch','readIsNotAdmissionPermit',true);
  END IF;
  BEGIN v_effective:=bridge.derive_effective_enforcement_policy(p_quota_domain_id,v_capacity.profile_version,p_route_id); EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','effective_policy_unavailable','readIsNotAdmissionPermit',true); END;
  IF v_effective->>'providerCapacityProfileVersion' IS DISTINCT FROM v_capacity.profile_version OR v_binding.effective_mask IS DISTINCT FROM (SELECT COALESCE(jsonb_agg(name ORDER BY ordinal),'[]'::jsonb) FROM (VALUES ('rpm',1),('tpm',2),('rpd',3),('concurrency',4)) AS dimension(name,ordinal) WHERE v_effective->'dimensions'->name->>'mode'='enforced') THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','effective_policy_mismatch','readIsNotAdmissionPermit',true);
  END IF;
  SELECT * INTO v_allocation FROM bridge.calculated_class_process_allocation WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=v_candidate.profile_version;
  IF NOT FOUND OR v_allocation.effective_mask IS DISTINCT FROM v_binding.effective_mask THEN RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','calculated_allocation_missing','readIsNotAdmissionPermit',true); END IF;
  IF v_candidate.effective_input_fingerprint IS DISTINCT FROM v_candidate.profile->>'effectiveInputFingerprint'
    OR v_allocation.allocation_fingerprint IS DISTINCT FROM md5(v_allocation.allocation::text) THEN
    RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','candidate_allocation_fingerprint_mismatch','readIsNotAdmissionPermit',true);
  END IF;
  SELECT item INTO v_process_allocation FROM jsonb_array_elements(v_allocation.allocation->'processes') item WHERE item->>'processId'=p_process_id AND item->>'profileVersion'=p_process_profile_version AND item->>'serviceClass'=p_service_class;
  v_baseline:=v_process_allocation->'baseline';
  IF v_process_allocation IS NULL OR jsonb_typeof(v_baseline)<>'object' OR jsonb_typeof(v_process_allocation->'normalizedWeight')<>'object' OR COALESCE((v_process_allocation->'normalizedWeight'->>'numerator')::bigint,0)<=0 OR COALESCE((v_process_allocation->'normalizedWeight'->>'denominator')::bigint,0)<=0 THEN RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','unfit','reason','process_allocation_unfit','readIsNotAdmissionPermit',true); END IF;
  FOR v_required_dimension IN SELECT jsonb_array_elements_text(v_binding.effective_mask) LOOP
    IF (v_baseline->>v_required_dimension) !~ '^[0-9]+$' OR (v_baseline->>v_required_dimension)::bigint<=0 THEN RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','unfit','reason','process_baseline_unfit','readIsNotAdmissionPermit',true); END IF;
  END LOOP;
  v_structural:=v_workload.structural_bound; v_output:=v_workload.output_reservation;
  IF jsonb_typeof(v_structural)<>'object' OR jsonb_typeof(v_output)<>'object' OR NULLIF(v_structural->>'identity','') IS NULL OR NULLIF(v_structural->>'version','') IS NULL OR NULLIF(v_workload.estimator->>'identity','') IS NULL OR NULLIF(v_workload.estimator->>'version','') IS NULL OR NULLIF(v_workload.safety_policy->>'policyId','') IS NULL OR NULLIF(v_workload.safety_policy->>'policyVersion','') IS NULL OR COALESCE(v_structural->>'maxRequestBytes','') !~ '^[0-9]+$' OR COALESCE(v_structural->>'maxInputTokens','') !~ '^[0-9]+$' OR COALESCE(v_structural->>'maxContextTokens','') !~ '^[0-9]+$' OR COALESCE(v_output->>'maxOutputTokens','') !~ '^[0-9]+$' THEN RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','stale','reason','required_structural_bound_missing','readIsNotAdmissionPermit',true); END IF;
  v_complete_tokens:=COALESCE(p_input_tokens,0)+COALESCE(p_output_tokens,0);
  IF (p_request_bytes IS NOT NULL AND p_request_bytes>(v_structural->>'maxRequestBytes')::bigint) OR (p_input_tokens IS NOT NULL AND p_input_tokens>(v_structural->>'maxInputTokens')::bigint) OR (p_output_tokens IS NOT NULL AND p_output_tokens>(v_output->>'maxOutputTokens')::bigint) OR v_complete_tokens>(v_structural->>'maxContextTokens')::bigint OR v_complete_tokens>(v_baseline->>'tpm')::bigint THEN RETURN jsonb_build_object('apiVersion','CapacityPlanningSnapshot/v2','status','unfit','reason','complete_request_exceeds_qualified_bound','readIsNotAdmissionPermit',true); END IF;
  v_fingerprint:=md5(jsonb_build_object('candidate',v_candidate.effective_input_fingerprint,'allocation',v_allocation.allocation_fingerprint,'authorityVersion',v_authority.authority_version,'workloadVersion',v_workload.profile_version,'effectiveMask',v_binding.effective_mask)::text);
  RETURN jsonb_build_object(
    'apiVersion','CapacityPlanningSnapshot/v2','status','qualified','reason','qualified_calculated_capacity','readIsNotAdmissionPermit',true,
    'identity',jsonb_build_object('quotaDomainId',p_quota_domain_id,'processId',v_process.process_id,'processProfileVersion',v_process.profile_version,'processKind',v_process.process_kind,'capability',v_process.capability,'serviceClass',v_process.service_class,'routeId',v_authority.route_id,'providerId',v_authority.provider_id,'modelOrProcessorId',v_authority.model_or_processor_id,'adapterVersion',v_authority.adapter_version,'qualificationRef',v_authority.qualification_ref,'qualificationVersion',v_authority.qualification_version,'authorityVersion',v_authority.authority_version),
    'revisions',jsonb_build_object('providerCapacityProfileVersion',v_capacity.profile_version,'policyId',v_effective->>'policyId','policyVersion',v_effective->>'policyVersion','desiredProfileVersion',v_candidate.profile_version,'candidateActivationRevision',v_candidate.candidate_activation_revision,'processProfileVersion',v_process.profile_version,'workloadProfileVersion',v_workload.profile_version,'estimator',v_workload.estimator,'safetyPolicy',v_workload.safety_policy),
    'allocation',jsonb_build_object('allocationVersion',v_allocation.allocation_version,'effectiveMask',v_binding.effective_mask,'baseline',v_baseline,'normalizedWeight',v_process_allocation->'normalizedWeight','cap',v_process_allocation->'cap','allocationFingerprint',v_allocation.allocation_fingerprint),
    'sizing',jsonb_build_object('maxEligibleCompleteRequestTokens',LEAST((v_baseline->>'tpm')::bigint,(v_structural->>'maxContextTokens')::bigint),'maxEligibleInputTokens',(v_structural->>'maxInputTokens')::bigint,'maxRequestBytes',(v_structural->>'maxRequestBytes')::bigint,'maxContextTokens',(v_structural->>'maxContextTokens')::bigint,'maxOutputTokens',(v_output->>'maxOutputTokens')::bigint,'structuralBound',v_structural,'outputReservation',v_output,'estimator',v_workload.estimator,'safetyPolicy',v_workload.safety_policy),
    'borrowing',jsonb_build_object('mayBorrowIdleCapacity',COALESCE((v_process.allocation_policy->'background'->>'mayBorrowIdleCapacity')::boolean,false),'sameBackgroundClass',v_process.service_class='background','runtimeOnly',true),
    'policyProvenance',v_effective,'canonicalFingerprint',v_fingerprint,
    'qualification',jsonb_strip_nulls(jsonb_build_object('candidateActivationRevision',v_candidate.candidate_activation_revision,'activationRevision',v_candidate.active_activation_revision,'productionActive',v_candidate.production_active,'isolated',NOT v_candidate.production_active))
  );
END;
$$;

ALTER FUNCTION bridge.read_capacity_planning_snapshot(text,text,text,text,text,boolean,bigint,bigint,bigint,boolean) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.read_capacity_planning_snapshot(text,text,text,text,text,boolean,bigint,bigint,bigint,boolean) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.read_capacity_planning_snapshot(text,text,text,text,text,boolean,bigint,bigint,bigint,boolean) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0107_bssv201406_candidate_allocation_fingerprint_fencing') ON CONFLICT DO NOTHING;
