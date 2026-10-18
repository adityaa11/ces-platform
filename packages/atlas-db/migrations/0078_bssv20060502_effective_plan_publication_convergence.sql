-- BSS-V2-006-05-02: BSS-V2-005 publishes an immutable desired plan only from
-- the server-derived effective enforcement policy.  This remains a planning
-- and activation seam; it neither grants runtime admission nor adds a wakeup
-- mechanism.

CREATE TABLE IF NOT EXISTS bridge.desired_admission_profile_policy_binding (
  quota_domain_id text NOT NULL,
  desired_profile_version text NOT NULL,
  provider_capacity_profile_version text NOT NULL,
  route_id text NOT NULL,
  policy_id text NOT NULL,
  policy_version text NOT NULL,
  effective_policy jsonb NOT NULL CHECK (jsonb_typeof(effective_policy) = 'object'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (quota_domain_id, desired_profile_version),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile(quota_domain_id, profile_version) ON DELETE RESTRICT,
  FOREIGN KEY (quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version)
    REFERENCES bridge.provider_enforcement_policy(quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version)
    ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(
  p_quota_domain_id text,
  p_expected_activation_revision bigint,
  p_provider_capacity_profile_version text,
  p_route_id text,
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
  v_policy jsonb;
  v_fingerprint text;
  v_profile_version text;
  v_existing bridge.desired_admission_profile_convergence;
  v_input jsonb;
  v_process bridge.provider_process_profile;
  v_workload bridge.workload_envelope_profile;
  v_activation record;
  v_eligible jsonb;
  v_dimension text;
  v_limit numeric;
  v_usable numeric;
  v_reserve numeric;
  v_background numeric;
BEGIN
  IF p_quota_domain_id IS NULL OR length(trim(p_quota_domain_id)) = 0
    OR p_provider_capacity_profile_version IS NULL OR length(trim(p_provider_capacity_profile_version)) = 0
    OR p_route_id IS NULL OR length(trim(p_route_id)) = 0
    OR p_planner_version IS NULL OR length(trim(p_planner_version)) = 0
    OR p_effective_from IS NULL OR jsonb_typeof(p_profile) <> 'object'
    OR jsonb_typeof(p_inputs) <> 'array' OR jsonb_array_length(p_inputs) = 0 THEN
    RAISE EXCEPTION 'effective-policy desired-plan publication requires complete qualified effective input';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 0));
  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_provider_capacity_profile_version
    FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'qualified capacity profile %:% is missing', p_quota_domain_id, p_provider_capacity_profile_version; END IF;

  -- This call is deliberately before fingerprint lookup: a revoked or stale
  -- policy cannot replay an already-known plan into a future activation.
  v_policy := bridge.derive_effective_enforcement_policy(p_quota_domain_id, p_provider_capacity_profile_version, p_route_id);
  IF p_profile->'effectiveEnforcementPolicy' IS DISTINCT FROM v_policy
    OR p_profile->>'quotaDomainId' IS DISTINCT FROM p_quota_domain_id
    OR p_profile->>'providerCapacityProfileVersion' IS DISTINCT FROM p_provider_capacity_profile_version
    OR p_profile->>'plannerVersion' IS DISTINCT FROM p_planner_version
    OR p_profile->>'effectiveFrom' IS DISTINCT FROM p_effective_from::text THEN
    RAISE EXCEPTION 'desired plan is not bound to the exact effective policy and planner identity';
  END IF;

  SELECT COALESCE(jsonb_agg(name ORDER BY ordinal), '[]'::jsonb) INTO v_eligible
  FROM (VALUES ('rpm', 1), ('tpm', 2), ('rpd', 3), ('concurrency', 4)) AS known(name, ordinal)
  WHERE v_policy->'dimensions'->name->>'mode' = 'enforced';
  IF p_profile->'eligibleDimensions' IS DISTINCT FROM v_eligible THEN
    RAISE EXCEPTION 'desired plan eligible dimensions are not the canonical effective mask';
  END IF;

  -- There is no numeric representation for a not-enforced dimension. Every
  -- numeric vector is exact-keyed to the server-derived eligible mask, and
  -- each preserved bound is positive, source-bounded, and arithmetically
  -- consistent with hard interactive protection.
  FOREACH v_dimension IN ARRAY ARRAY['rpm','tpm','rpd','concurrency'] LOOP
    IF v_policy->'dimensions'->v_dimension->>'mode' = 'enforced' THEN
      IF jsonb_typeof(p_profile->'usableGlobalCapacity'->v_dimension) <> 'number'
        OR jsonb_typeof(p_profile->'hardInteractiveReserve'->v_dimension) <> 'number'
        OR jsonb_typeof(p_profile->'backgroundCapacity'->v_dimension) <> 'number' THEN
        RAISE EXCEPTION 'desired plan lacks numeric enforced dimension %', v_dimension;
      END IF;
      v_limit := (v_policy->'dimensions'->v_dimension->>'limit')::numeric;
      v_usable := (p_profile->'usableGlobalCapacity'->>v_dimension)::numeric;
      v_reserve := (p_profile->'hardInteractiveReserve'->>v_dimension)::numeric;
      v_background := (p_profile->'backgroundCapacity'->>v_dimension)::numeric;
      IF v_limit <= 0 OR v_usable <= 0 OR v_reserve < 0 OR v_background < 0
        OR v_usable > v_limit OR v_usable - v_reserve <> v_background THEN
        RAISE EXCEPTION 'desired plan has invalid eligible capacity arithmetic for %', v_dimension;
      END IF;
    ELSIF (p_profile->'usableGlobalCapacity' ? v_dimension)
       OR (p_profile->'hardInteractiveReserve' ? v_dimension)
       OR (p_profile->'backgroundCapacity' ? v_dimension) THEN
      RAISE EXCEPTION 'desired plan fabricates a numeric bound for not-enforced dimension %', v_dimension;
    END IF;
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_profile->'usableGlobalCapacity') key WHERE NOT (v_eligible ? key)
    UNION ALL SELECT 1 FROM jsonb_object_keys(p_profile->'hardInteractiveReserve') key WHERE NOT (v_eligible ? key)
    UNION ALL SELECT 1 FROM jsonb_object_keys(p_profile->'backgroundCapacity') key WHERE NOT (v_eligible ? key)
  ) THEN RAISE EXCEPTION 'desired plan capacity vectors contain non-eligible dimensions'; END IF;

  SELECT md5(jsonb_build_object(
    'quotaDomainId', p_quota_domain_id,
    'capacityProfileVersion', p_provider_capacity_profile_version,
    'effectivePolicy', v_policy,
    'plannerVersion', p_planner_version,
    'effectiveFrom', p_effective_from,
    'profile', p_profile,
    'inputs', COALESCE((SELECT jsonb_agg(value ORDER BY value->>'processId', value->>'processProfileVersion') FROM jsonb_array_elements(p_inputs)), '[]'::jsonb)
  )::text) INTO v_fingerprint;
  v_profile_version := 'effective-policy-' || v_fingerprint;

  SELECT * INTO v_current FROM bridge.active_desired_admission_profile WHERE quota_domain_id = p_quota_domain_id FOR KEY SHARE;
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
    IF jsonb_typeof(v_input) <> 'object' OR NOT (v_input ? 'processId' AND v_input ? 'processProfileVersion' AND v_input ? 'workloadId' AND v_input ? 'workloadProfileVersion') THEN
      RAISE EXCEPTION 'effective-policy desired-plan input is incomplete';
    END IF;
    SELECT * INTO v_process FROM bridge.provider_process_profile WHERE process_id = v_input->>'processId' AND profile_version = v_input->>'processProfileVersion' FOR KEY SHARE;
    SELECT * INTO v_workload FROM bridge.workload_envelope_profile WHERE workload_id = v_input->>'workloadId' AND profile_version = v_input->>'workloadProfileVersion' FOR KEY SHARE;
    IF NOT FOUND OR NOT v_process.active OR NOT v_workload.active
      OR v_process.workload_id <> v_workload.workload_id OR v_process.workload_profile_version <> v_workload.profile_version
      OR v_workload.quota_accounting_policy_id IS DISTINCT FROM v_capacity.quota_accounting_policy_id
      OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_process.eligible_route_ids) routes(route_id) WHERE routes.route_id = p_route_id) THEN
      RAISE EXCEPTION 'effective-policy desired-plan input is not a qualified active process/workload/route binding';
    END IF;
  END LOOP;

  INSERT INTO bridge.desired_admission_profile(quota_domain_id, profile_version, provider_capacity_profile_version, planner_version, effective_from, profile)
    VALUES (p_quota_domain_id, v_profile_version, p_provider_capacity_profile_version, p_planner_version, p_effective_from, p_profile || jsonb_build_object('effectiveInputFingerprint', v_fingerprint));
  FOR v_input IN SELECT value FROM jsonb_array_elements(p_inputs) LOOP
    INSERT INTO bridge.desired_admission_profile_input(quota_domain_id, desired_profile_version, process_id, process_profile_version, workload_id, workload_profile_version)
      VALUES (p_quota_domain_id, v_profile_version, v_input->>'processId', v_input->>'processProfileVersion', v_input->>'workloadId', v_input->>'workloadProfileVersion');
  END LOOP;
  INSERT INTO bridge.desired_admission_profile_policy_binding(quota_domain_id, desired_profile_version, provider_capacity_profile_version, route_id, policy_id, policy_version, effective_policy)
    VALUES (p_quota_domain_id, v_profile_version, p_provider_capacity_profile_version, p_route_id, v_policy->>'policyId', v_policy->>'policyVersion', v_policy);
  INSERT INTO bridge.desired_admission_profile_convergence(quota_domain_id, effective_input_fingerprint, desired_profile_version, provider_capacity_profile_version, planner_version, requested_from_activation_revision)
    VALUES (p_quota_domain_id, v_fingerprint, v_profile_version, p_provider_capacity_profile_version, p_planner_version, p_expected_activation_revision);
  SELECT * INTO v_activation FROM bridge.activate_desired_admission_profile(p_quota_domain_id, v_profile_version);
  RETURN QUERY SELECT 'published'::text, v_profile_version, v_activation.activation_revision, v_fingerprint;
END;
$$;

ALTER TABLE bridge.desired_admission_profile_policy_binding OWNER TO agents_bridge;
ALTER FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.desired_admission_profile_policy_binding FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0078_bssv20060502_effective_plan_publication_convergence') ON CONFLICT DO NOTHING;
