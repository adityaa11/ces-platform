-- BSS-V2-006-05-02 CFC: the public publication boundary must reject a
-- caller-supplied excluded dimension everywhere it can affect persisted
-- planning/fairness state, not only in the three top-level capacity vectors.

CREATE OR REPLACE FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(
  p_quota_domain_id text,
  p_expected_activation_revision bigint,
  p_provider_capacity_profile_version text,
  p_route_id text,
  p_planner_version text,
  p_effective_from timestamptz,
  p_profile jsonb,
  p_inputs jsonb
) RETURNS TABLE (status text, desired_profile_version text, activation_revision bigint, effective_input_fingerprint text)
LANGUAGE plpgsql AS $$
DECLARE
  v_policy jsonb;
  v_eligible jsonb;
  v_lane jsonb;
  v_vector jsonb;
  v_vector_name text;
  v_dimension text;
BEGIN
  IF p_effective_from IS NULL OR jsonb_typeof(p_profile) <> 'object' THEN
    RAISE EXCEPTION 'effective-policy desired-plan publication requires complete qualified effective input';
  END IF;

  -- Keep the nested persisted shape just as exact-keyed to the server-derived
  -- effective mask as the v1 function's top-level capacity vectors.
  v_policy := bridge.derive_effective_enforcement_policy(
    p_quota_domain_id, p_provider_capacity_profile_version, p_route_id
  );
  SELECT COALESCE(jsonb_agg(name ORDER BY ordinal), '[]'::jsonb) INTO v_eligible
  FROM (VALUES ('rpm', 1), ('tpm', 2), ('rpd', 3), ('concurrency', 4)) AS known(name, ordinal)
  WHERE v_policy->'dimensions'->name->>'mode' = 'enforced';
  IF jsonb_typeof(p_profile->'backgroundLanes') <> 'array' THEN
    RAISE EXCEPTION 'desired plan background lanes are not a canonical array';
  END IF;

  FOR v_lane IN SELECT value FROM jsonb_array_elements(p_profile->'backgroundLanes') LOOP
    IF jsonb_typeof(v_lane) <> 'object'
      OR NOT (v_lane ? 'planningCost')
      OR jsonb_typeof(v_lane->'planningCost') <> 'object'
      OR NOT (v_lane ? 'dominantResourceCost')
      OR jsonb_typeof(v_lane->'dominantResourceCost') <> 'number'
      OR (v_lane->>'dominantResourceCost')::numeric < 0
      OR EXISTS (
        SELECT 1 FROM jsonb_object_keys(v_lane) AS key
        WHERE key NOT IN (
          'processId', 'profileVersion', 'workloadProfile', 'normalizedWeight',
          'mayBorrowIdleCapacity', 'capPolicyId', 'cap', 'planningCost', 'dominantResourceCost'
        )
      ) THEN
      RAISE EXCEPTION 'desired plan background lane is not a canonical capacity/fairness representation';
    END IF;

    FOREACH v_vector_name IN ARRAY ARRAY['cap', 'planningCost'] LOOP
      IF v_lane ? v_vector_name THEN
        v_vector := v_lane->v_vector_name;
        IF jsonb_typeof(v_vector) <> 'object'
          OR EXISTS (SELECT 1 FROM jsonb_object_keys(v_vector) AS key WHERE NOT (v_eligible ? key)) THEN
          RAISE EXCEPTION 'desired plan background lane % contains non-eligible dimensions in %', v_lane->>'processId', v_vector_name;
        END IF;
        FOREACH v_dimension IN ARRAY ARRAY['rpm', 'tpm', 'rpd', 'concurrency'] LOOP
          IF v_policy->'dimensions'->v_dimension->>'mode' = 'enforced' THEN
            IF jsonb_typeof(v_vector->v_dimension) <> 'number' THEN
              RAISE EXCEPTION 'desired plan background lane % lacks numeric enforced dimension % in %', v_lane->>'processId', v_dimension, v_vector_name;
            END IF;
          ELSIF v_vector ? v_dimension THEN
            RAISE EXCEPTION 'desired plan background lane % fabricates a numeric bound for not-enforced dimension % in %', v_lane->>'processId', v_dimension, v_vector_name;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT * FROM bridge.publish_effective_policy_converged_desired_admission_profile_v1(
    p_quota_domain_id, p_expected_activation_revision, p_provider_capacity_profile_version, p_route_id,
    p_planner_version, p_effective_from,
    jsonb_set(p_profile, '{effectiveFrom}', to_jsonb(p_effective_from::text), true), p_inputs
  );
END;
$$;

ALTER FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0081_bssv20060502_effective_plan_nested_vector_validation') ON CONFLICT DO NOTHING;
