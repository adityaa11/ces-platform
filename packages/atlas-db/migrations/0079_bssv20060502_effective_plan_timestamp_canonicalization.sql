-- Canonicalize the public timestamp spelling at the 05-02 publication
-- boundary.  PostgreSQL's display spelling must not turn an otherwise
-- identical effective policy into a rejection or a distinct plan input.

ALTER FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb)
  RENAME TO publish_effective_policy_converged_desired_admission_profile_v1;

CREATE FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(
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
BEGIN
  IF p_effective_from IS NULL OR jsonb_typeof(p_profile) <> 'object' THEN
    RAISE EXCEPTION 'effective-policy desired-plan publication requires complete qualified effective input';
  END IF;
  RETURN QUERY SELECT * FROM bridge.publish_effective_policy_converged_desired_admission_profile_v1(
    p_quota_domain_id, p_expected_activation_revision, p_provider_capacity_profile_version, p_route_id,
    p_planner_version, p_effective_from,
    jsonb_set(p_profile, '{effectiveFrom}', to_jsonb(p_effective_from::text), true), p_inputs
  );
END;
$$;

ALTER FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile_v1(text,bigint,text,text,text,timestamptz,jsonb,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile_v1(text,bigint,text,text,text,timestamptz,jsonb,jsonb) FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb) TO agents_bridge;
GRANT EXECUTE ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile_v1(text,bigint,text,text,text,timestamptz,jsonb,jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0079_bssv20060502_effective_plan_timestamp_canonicalization') ON CONFLICT DO NOTHING;
