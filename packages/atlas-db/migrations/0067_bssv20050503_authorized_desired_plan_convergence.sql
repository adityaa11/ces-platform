-- BSS-V2-005-05-03: qualified effective-input convergence above the approved
-- 005-04 immutable publication fence. This is deliberately not a runtime
-- admission, wakeup, feedback, or provider-capacity-authoring path.

CREATE TABLE IF NOT EXISTS bridge.desired_admission_profile_convergence (
  quota_domain_id text NOT NULL,
  effective_input_fingerprint text NOT NULL CHECK (length(effective_input_fingerprint) = 32),
  desired_profile_version text NOT NULL,
  provider_capacity_profile_version text NOT NULL,
  planner_version text NOT NULL,
  requested_from_activation_revision bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quota_domain_id, effective_input_fingerprint),
  UNIQUE (quota_domain_id, desired_profile_version),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile (quota_domain_id, profile_version)
    ON DELETE RESTRICT,
  FOREIGN KEY (quota_domain_id, provider_capacity_profile_version)
    REFERENCES bridge.provider_capacity_profile (quota_domain_id, profile_version)
    ON DELETE RESTRICT
);

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

  -- The same domain lock used by the 005-04 activation fence makes stale
  -- callers observable and prevents concurrent publication from losing an
  -- activation revision.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 0));
  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_provider_capacity_profile_version
    FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'qualified capacity profile %:% is missing', p_quota_domain_id, p_provider_capacity_profile_version; END IF;
  IF NOT (v_capacity.limits ?& ARRAY['rpm', 'tpm', 'rpd', 'concurrency']) OR EXISTS (
    SELECT 1 FROM jsonb_each(v_capacity.limits) AS dimension(name, value)
    WHERE value->>'state' <> 'known' OR COALESCE((value->>'value')::numeric, 0) <= 0
  ) THEN RAISE EXCEPTION 'qualified capacity profile must have known non-zero dimensions'; END IF;

  -- Canonical jsonb text and an explicitly sorted input list make identical
  -- effective inputs deterministic independently of caller array order.
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
      -- A prior effective input is historical once another version wins; do
      -- not reactivate it and erase the newer domain decision.
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
      OR v_workload.quota_accounting_policy_id IS DISTINCT FROM v_capacity.quota_accounting_policy_id
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

-- This planning-only observation intentionally creates no 03A intent. A
-- caller is either stale against the immutable active identity or can see an
-- exact structural unfit result for that identity.
CREATE OR REPLACE FUNCTION bridge.resolve_versioned_planning_envelope(
  p_quota_domain_id text,
  p_desired_profile_version text,
  p_activation_revision bigint,
  p_process_id text,
  p_process_profile_version text,
  p_request_bytes bigint,
  p_input_tokens bigint
) RETURNS TABLE (status text, reason text, desired_profile_version text, activation_revision bigint) LANGUAGE plpgsql STABLE AS $$
DECLARE v_active record; v_input record; v_workload bridge.workload_envelope_profile;
BEGIN
  SELECT * INTO v_active FROM bridge.active_desired_admission_profile WHERE quota_domain_id = p_quota_domain_id;
  IF NOT FOUND THEN RETURN QUERY SELECT 'stale'::text, 'active_plan_missing'::text, NULL::text, NULL::bigint; RETURN; END IF;
  IF v_active.desired_profile_version <> p_desired_profile_version OR v_active.activation_revision <> p_activation_revision THEN
    RETURN QUERY SELECT 'stale'::text, 'planning_identity_superseded'::text, v_active.desired_profile_version, v_active.activation_revision; RETURN;
  END IF;
  SELECT i.* INTO v_input FROM bridge.desired_admission_profile_input i
    WHERE i.quota_domain_id = p_quota_domain_id AND i.desired_profile_version = p_desired_profile_version
      AND i.process_id = p_process_id AND i.process_profile_version = p_process_profile_version;
  IF NOT FOUND THEN RETURN QUERY SELECT 'stale'::text, 'process_not_in_active_plan'::text, v_active.desired_profile_version, v_active.activation_revision; RETURN; END IF;
  SELECT * INTO v_workload FROM bridge.workload_envelope_profile
    WHERE workload_id = v_input.workload_id AND profile_version = v_input.workload_profile_version;
  IF p_request_bytes > (v_workload.structural_bound->>'maxRequestBytes')::bigint OR p_input_tokens > (v_workload.structural_bound->>'maxInputTokens')::bigint THEN
    RETURN QUERY SELECT 'unfit'::text, 'request_exceeds_versioned_structural_bound'::text, v_active.desired_profile_version, v_active.activation_revision; RETURN;
  END IF;
  RETURN QUERY SELECT 'qualified'::text, 'within_versioned_structural_bound'::text, v_active.desired_profile_version, v_active.activation_revision;
END;
$$;

ALTER TABLE bridge.desired_admission_profile_convergence OWNER TO agents_bridge;
ALTER FUNCTION bridge.publish_converged_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.resolve_versioned_planning_envelope(text,text,bigint,text,text,bigint,bigint) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.desired_admission_profile_convergence FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.publish_converged_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb), bridge.resolve_versioned_planning_envelope(text,text,bigint,text,text,bigint,bigint) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.publish_converged_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb), bridge.resolve_versioned_planning_envelope(text,text,bigint,text,text,bigint,bigint) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0067_bssv20050503_authorized_desired_plan_convergence') ON CONFLICT DO NOTHING;
