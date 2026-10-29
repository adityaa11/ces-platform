-- BSS-QAP-001 R1: retain legacy metadata during the rolling writer cutover,
-- while allowing new capacity and workload records to omit it.  The two
-- supported publishers intentionally retain all non-ID qualification,
-- identity, authority, and activation protections below.

ALTER TABLE bridge.provider_capacity_profile
  ALTER COLUMN quota_accounting_policy_id DROP NOT NULL;
ALTER TABLE bridge.workload_envelope_profile
  ALTER COLUMN quota_accounting_policy_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION bridge.publish_converged_desired_admission_profile(
  p_quota_domain_id text,
  p_expected_activation_revision bigint,
  p_provider_capacity_profile_version text,
  p_planner_version text,
  p_effective_from timestamptz,
  p_profile jsonb,
  p_inputs jsonb
) RETURNS TABLE (
  status text,
  desired_profile_version text,
  activation_revision bigint,
  effective_input_fingerprint text
) LANGUAGE plpgsql AS $$
DECLARE
  v_current record;
  v_capacity bridge.provider_capacity_profile;
  v_fingerprint text;
  v_profile_version text;
  v_existing bridge.desired_admission_profile_convergence;
  v_input jsonb;
  v_process bridge.provider_process_profile;
  v_workload bridge.workload_envelope_profile;
  v_activation record;
BEGIN
  IF p_quota_domain_id IS NULL OR length(trim(p_quota_domain_id)) = 0
    OR p_provider_capacity_profile_version IS NULL OR length(trim(p_provider_capacity_profile_version)) = 0
    OR p_planner_version IS NULL OR length(trim(p_planner_version)) = 0
    OR p_effective_from IS NULL OR jsonb_typeof(p_profile) <> 'object'
    OR jsonb_typeof(p_inputs) <> 'array' OR jsonb_array_length(p_inputs) = 0 THEN
    RAISE EXCEPTION 'converged desired-plan publication requires complete qualified effective input';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 0));
  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_provider_capacity_profile_version
    FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'qualified capacity profile %:% is missing', p_quota_domain_id, p_provider_capacity_profile_version; END IF;
  IF NOT (v_capacity.limits ?& ARRAY['rpm', 'tpm', 'rpd', 'concurrency']) OR EXISTS (
    SELECT 1 FROM jsonb_each(v_capacity.limits) AS dimension(name, value)
    WHERE value->>'state' <> 'known' OR COALESCE((value->>'value')::numeric, 0) <= 0
  ) THEN RAISE EXCEPTION 'qualified capacity profile must have known non-zero dimensions'; END IF;

  SELECT md5(jsonb_build_object(
    'quotaDomainId', p_quota_domain_id,
    'capacityProfileVersion', p_provider_capacity_profile_version,
    'plannerVersion', p_planner_version,
    'effectiveFrom', p_effective_from,
    'profile', p_profile,
    'inputs', COALESCE((SELECT jsonb_agg(value ORDER BY value->>'processId', value->>'processProfileVersion') FROM jsonb_array_elements(p_inputs)), '[]'::jsonb)
  )::text) INTO v_fingerprint;
  v_profile_version := 'converged-' || v_fingerprint;

  SELECT * INTO v_current FROM bridge.active_desired_admission_profile
    WHERE quota_domain_id = p_quota_domain_id FOR KEY SHARE;
  SELECT c.* INTO v_existing FROM bridge.desired_admission_profile_convergence c
    WHERE c.quota_domain_id = p_quota_domain_id AND c.effective_input_fingerprint = v_fingerprint;
  IF FOUND THEN
    IF v_current.desired_profile_version = v_existing.desired_profile_version THEN
      RETURN QUERY SELECT 'unchanged'::text, v_existing.desired_profile_version, v_current.activation_revision, v_fingerprint;
    ELSE
      RETURN QUERY SELECT 'stale'::text, v_existing.desired_profile_version, v_current.activation_revision, v_fingerprint;
    END IF;
    RETURN;
  END IF;
  IF (v_current.activation_revision IS NULL AND p_expected_activation_revision IS NOT NULL)
    OR (v_current.activation_revision IS NOT NULL AND p_expected_activation_revision IS DISTINCT FROM v_current.activation_revision) THEN
    RETURN QUERY SELECT 'stale'::text, NULL::text, v_current.activation_revision, v_fingerprint;
    RETURN;
  END IF;

  FOR v_input IN SELECT value FROM jsonb_array_elements(p_inputs) ORDER BY value->>'processId', value->>'processProfileVersion' LOOP
    IF jsonb_typeof(v_input) <> 'object'
      OR NOT (v_input ? 'processId' AND v_input ? 'processProfileVersion' AND v_input ? 'workloadId' AND v_input ? 'workloadProfileVersion') THEN
      RAISE EXCEPTION 'converged desired-plan input is incomplete';
    END IF;
    SELECT * INTO v_process FROM bridge.provider_process_profile
      WHERE process_id = v_input->>'processId' AND profile_version = v_input->>'processProfileVersion'
      FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'converged desired-plan input references an unknown process profile'; END IF;
    SELECT * INTO v_workload FROM bridge.workload_envelope_profile
      WHERE workload_id = v_input->>'workloadId' AND profile_version = v_input->>'workloadProfileVersion'
      FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'converged desired-plan input references an unknown workload profile'; END IF;
    IF NOT v_process.active OR NOT v_workload.active
      OR v_process.workload_id <> v_workload.workload_id OR v_process.workload_profile_version <> v_workload.profile_version
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(v_process.eligible_route_ids) process_route(route_id)
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(v_capacity.associated_routes) capacity_route(route)
          WHERE capacity_route.route->>'routeId' = process_route.route_id
        )
      ) THEN
      RAISE EXCEPTION 'converged desired-plan input is not a qualified active process/workload/capacity binding';
    END IF;
  END LOOP;

  INSERT INTO bridge.desired_admission_profile(
    quota_domain_id, profile_version, provider_capacity_profile_version, planner_version, effective_from, profile
  ) VALUES (
    p_quota_domain_id, v_profile_version, p_provider_capacity_profile_version, p_planner_version, p_effective_from,
    p_profile || jsonb_build_object('effectiveInputFingerprint', v_fingerprint)
  );
  FOR v_input IN SELECT value FROM jsonb_array_elements(p_inputs) LOOP
    INSERT INTO bridge.desired_admission_profile_input(
      quota_domain_id, desired_profile_version, process_id, process_profile_version, workload_id, workload_profile_version
    ) VALUES (
      p_quota_domain_id, v_profile_version, v_input->>'processId', v_input->>'processProfileVersion',
      v_input->>'workloadId', v_input->>'workloadProfileVersion'
    );
  END LOOP;
  INSERT INTO bridge.desired_admission_profile_convergence(
    quota_domain_id, effective_input_fingerprint, desired_profile_version, provider_capacity_profile_version,
    planner_version, requested_from_activation_revision
  ) VALUES (
    p_quota_domain_id, v_fingerprint, v_profile_version, p_provider_capacity_profile_version,
    p_planner_version, p_expected_activation_revision
  );
  SELECT * INTO v_activation FROM bridge.activate_desired_admission_profile(p_quota_domain_id, v_profile_version);
  RETURN QUERY SELECT 'published'::text, v_profile_version, v_activation.activation_revision, v_fingerprint;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.publish_shared_domain_calculated_desired_admission_profile(
  p_quota_domain_id text,
  p_expected_activation_revision bigint,
  p_provider_capacity_profile_version text,
  p_planner_version text,
  p_effective_from timestamptz,
  p_profile jsonb,
  p_inputs jsonb,
  p_route_authorities jsonb,
  p_calculated_allocation jsonb
) RETURNS TABLE (
  status text,
  desired_profile_version text,
  candidate_activation_revision bigint,
  effective_input_fingerprint text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bridge AS $$
DECLARE
  v_current record;
  v_capacity bridge.provider_capacity_profile;
  v_authority bridge.qualified_provider_route_authority;
  v_input jsonb;
  v_route jsonb;
  v_process bridge.provider_process_profile;
  v_workload bridge.workload_envelope_profile;
  v_policy jsonb;
  v_effective_mask jsonb;
  v_candidate record;
  v_fingerprint text;
  v_profile_version text;
  v_candidate_revision bigint;
  v_route_id text;
  v_authority_version bigint;
BEGIN
  IF p_quota_domain_id IS NULL OR btrim(p_quota_domain_id) = ''
    OR p_provider_capacity_profile_version IS NULL OR btrim(p_provider_capacity_profile_version) = ''
    OR p_planner_version IS NULL OR btrim(p_planner_version) = ''
    OR p_effective_from IS NULL OR jsonb_typeof(p_profile) <> 'object'
    OR jsonb_typeof(p_inputs) <> 'array' OR jsonb_array_length(p_inputs) = 0
    OR jsonb_typeof(p_route_authorities) <> 'array' OR jsonb_array_length(p_route_authorities) = 0
    OR jsonb_typeof(p_calculated_allocation) <> 'object' THEN
    RAISE EXCEPTION 'shared-domain publication requires complete candidate input, route authorities, and calculated allocation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 0));
  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_provider_capacity_profile_version
    FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'shared-domain publication capacity profile is missing'; END IF;

  IF p_profile->>'quotaDomainId' IS DISTINCT FROM p_quota_domain_id
    OR p_profile->>'providerCapacityProfileVersion' IS DISTINCT FROM p_provider_capacity_profile_version
    OR p_profile->>'plannerVersion' IS DISTINCT FROM p_planner_version
    OR p_profile->>'effectiveFrom' IS DISTINCT FROM p_effective_from::text THEN
    RAISE EXCEPTION 'shared-domain candidate is not bound to its exact domain, capacity profile, planner, and effective time';
  END IF;

  IF p_calculated_allocation->>'allocationVersion' IS DISTINCT FROM 'v1'
    OR jsonb_typeof(p_calculated_allocation->'effectiveMask') <> 'array'
    OR jsonb_typeof(p_calculated_allocation->'processBaselines') <> 'object' THEN
    RAISE EXCEPTION 'shared-domain publication requires CalculatedClassProcessAllocation/v1';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_route_authorities) route
    WHERE jsonb_typeof(route) <> 'object'
      OR route->>'routeId' IS NULL OR btrim(route->>'routeId') = ''
      OR route->>'authorityVersion' IS NULL
      OR route->>'authorityVersion' !~ '^[0-9]+$'
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_route_authorities) route
    GROUP BY route->>'routeId' HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'shared-domain publication has a duplicate or incomplete canonical route binding'; END IF;

  FOR v_route IN SELECT value FROM jsonb_array_elements(p_route_authorities) ORDER BY value->>'routeId' LOOP
    v_route_id := v_route->>'routeId';
    v_authority_version := (v_route->>'authorityVersion')::bigint;
    SELECT * INTO v_authority FROM bridge.qualified_provider_route_authority
      WHERE authority_version = v_authority_version AND authority_kind = 'qualified_v1' FOR KEY SHARE;
    IF NOT FOUND OR v_authority.route_id <> v_route_id OR v_authority.quota_domain_id <> p_quota_domain_id
      OR NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_capacity.associated_routes) route
        WHERE route->>'routeId' = v_authority.route_id
          AND route->>'providerId' = v_authority.provider_id
          AND route->>'modelOrProcessorId' = v_authority.model_or_processor_id
          AND route->>'adapterVersion' = v_authority.adapter_version
          AND route->>'qualificationRef' = v_authority.qualification_ref
          AND route->>'qualificationVersion' = v_authority.qualification_version
          AND route->>'capability' = v_authority.capability
      ) THEN RAISE EXCEPTION 'shared-domain publication received a stale, foreign, or non-qualified route authority'; END IF;

    v_policy := bridge.derive_effective_enforcement_policy(
      p_quota_domain_id, p_provider_capacity_profile_version, v_authority.route_id
    );
    SELECT COALESCE(jsonb_agg(name ORDER BY ordinal), '[]'::jsonb) INTO v_effective_mask
      FROM (VALUES ('rpm', 1), ('tpm', 2), ('rpd', 3), ('concurrency', 4)) AS known(name, ordinal)
      WHERE v_policy->'dimensions'->name->>'mode' = 'enforced';
    IF p_calculated_allocation->'effectiveMask' IS DISTINCT FROM v_effective_mask THEN
      RAISE EXCEPTION 'shared-domain publication calculated allocation has a different effective mask';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_inputs) input
      JOIN bridge.provider_process_profile process ON process.process_id = input->>'processId'
        AND process.profile_version = input->>'processProfileVersion'
      WHERE process.active
        AND process.eligible_route_ids @> jsonb_build_array(v_authority.route_id)
    ) THEN RAISE EXCEPTION 'shared-domain publication route is inactive or has no active qualified process'; END IF;
  END LOOP;

  FOR v_input IN SELECT value FROM jsonb_array_elements(p_inputs) ORDER BY value->>'processId', value->>'processProfileVersion' LOOP
    IF jsonb_typeof(v_input) <> 'object'
      OR NOT (v_input ? 'processId' AND v_input ? 'processProfileVersion' AND v_input ? 'workloadId' AND v_input ? 'workloadProfileVersion') THEN
      RAISE EXCEPTION 'shared-domain publication input is incomplete';
    END IF;
    SELECT * INTO v_process FROM bridge.provider_process_profile
      WHERE process_id = v_input->>'processId' AND profile_version = v_input->>'processProfileVersion' FOR KEY SHARE;
    SELECT * INTO v_workload FROM bridge.workload_envelope_profile
      WHERE workload_id = v_input->>'workloadId' AND profile_version = v_input->>'workloadProfileVersion' FOR KEY SHARE;
    IF NOT FOUND OR NOT v_process.active OR NOT v_workload.active
      OR v_process.workload_id <> v_workload.workload_id
      OR v_process.workload_profile_version <> v_workload.profile_version
      OR NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_route_authorities) route
        WHERE v_process.eligible_route_ids @> jsonb_build_array(route->>'routeId')
      ) THEN RAISE EXCEPTION 'shared-domain publication input is not an active qualified process/workload/route binding'; END IF;
  END LOOP;

  SELECT md5(jsonb_build_object(
    'quotaDomainId', p_quota_domain_id,
    'capacityProfileVersion', p_provider_capacity_profile_version,
    'plannerVersion', p_planner_version,
    'effectiveFrom', p_effective_from,
    'profile', p_profile,
    'inputs', (SELECT jsonb_agg(value ORDER BY value->>'processId', value->>'processProfileVersion') FROM jsonb_array_elements(p_inputs)),
    'routeAuthorities', (SELECT jsonb_agg(value ORDER BY value->>'routeId', (value->>'authorityVersion')::bigint) FROM jsonb_array_elements(p_route_authorities)),
    'calculatedAllocation', p_calculated_allocation
  )::text) INTO v_fingerprint;
  v_profile_version := 'shared-domain-v2-' || v_fingerprint;

  SELECT * INTO v_current FROM bridge.active_desired_admission_profile WHERE quota_domain_id = p_quota_domain_id FOR KEY SHARE;
  SELECT * INTO v_candidate FROM bridge.desired_admission_profile_candidate candidate
    WHERE candidate.quota_domain_id = p_quota_domain_id AND candidate.effective_input_fingerprint = v_fingerprint;
  IF FOUND THEN
    RETURN QUERY SELECT 'unchanged'::text, v_candidate.desired_profile_version, v_candidate.candidate_activation_revision, v_fingerprint;
    RETURN;
  END IF;
  IF (v_current.activation_revision IS NULL AND p_expected_activation_revision IS NOT NULL)
    OR (v_current.activation_revision IS NOT NULL AND p_expected_activation_revision IS DISTINCT FROM v_current.activation_revision) THEN
    RETURN QUERY SELECT 'stale'::text, NULL::text, NULL::bigint, v_fingerprint;
    RETURN;
  END IF;

  INSERT INTO bridge.desired_admission_profile(quota_domain_id, profile_version, provider_capacity_profile_version, planner_version, effective_from, profile)
  VALUES (p_quota_domain_id, v_profile_version, p_provider_capacity_profile_version, p_planner_version, p_effective_from,
    p_profile || jsonb_build_object('effectiveInputFingerprint', v_fingerprint, 'successorPublication', 'shared_domain_calculated_allocation/v2', 'calculatedAllocationVersion', 'v1'));
  FOR v_input IN SELECT value FROM jsonb_array_elements(p_inputs) LOOP
    INSERT INTO bridge.desired_admission_profile_input(quota_domain_id, desired_profile_version, process_id, process_profile_version, workload_id, workload_profile_version)
    VALUES (p_quota_domain_id, v_profile_version, v_input->>'processId', v_input->>'processProfileVersion', v_input->>'workloadId', v_input->>'workloadProfileVersion');
  END LOOP;
  INSERT INTO bridge.calculated_class_process_allocation(quota_domain_id, desired_profile_version, allocation_version, effective_mask, allocation, allocation_fingerprint)
  VALUES (p_quota_domain_id, v_profile_version, 'v1', p_calculated_allocation->'effectiveMask', p_calculated_allocation, md5(p_calculated_allocation::text));
  FOR v_route IN SELECT value FROM jsonb_array_elements(p_route_authorities) LOOP
    INSERT INTO bridge.desired_admission_profile_route_binding_v2(quota_domain_id, desired_profile_version, route_id, authority_version, provider_capacity_profile_version, effective_mask, allocation_version)
    VALUES (p_quota_domain_id, v_profile_version, v_route->>'routeId', (v_route->>'authorityVersion')::bigint, p_provider_capacity_profile_version, p_calculated_allocation->'effectiveMask', 'v1');
  END LOOP;
  SELECT COALESCE(max(candidate.candidate_activation_revision), 0) + 1 INTO v_candidate_revision
    FROM bridge.desired_admission_profile_candidate candidate WHERE candidate.quota_domain_id = p_quota_domain_id;
  INSERT INTO bridge.desired_admission_profile_candidate(quota_domain_id, candidate_activation_revision, desired_profile_version, effective_input_fingerprint)
  VALUES (p_quota_domain_id, v_candidate_revision, v_profile_version, v_fingerprint);
  RETURN QUERY SELECT 'published'::text, v_profile_version, v_candidate_revision, v_fingerprint;
END;
$$;

INSERT INTO atlas.schema_migrations(name) VALUES('0112_bssv2_quota_accounting_policy_deprecation') ON CONFLICT DO NOTHING;
