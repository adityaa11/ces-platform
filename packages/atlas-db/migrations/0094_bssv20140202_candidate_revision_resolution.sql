-- The candidate revision is also a public result field.  Qualify the
-- aggregate source so candidate creation remains deterministic under
-- PL/pgSQL's return-variable namespace.
DO $fix$
DECLARE function_definition text;
BEGIN
  SELECT pg_get_functiondef(
    'bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamp with time zone,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) INTO function_definition;
  function_definition := replace(
    function_definition,
    'SELECT COALESCE(max(candidate_activation_revision), 0) + 1 INTO v_candidate_revision' || E'\n    FROM bridge.desired_admission_profile_candidate WHERE quota_domain_id = p_quota_domain_id',
    'SELECT COALESCE(max(candidate.candidate_activation_revision), 0) + 1 INTO v_candidate_revision' || E'\n    FROM bridge.desired_admission_profile_candidate candidate WHERE candidate.quota_domain_id = p_quota_domain_id'
  );
  EXECUTE function_definition;
END;
$fix$;

INSERT INTO atlas.schema_migrations(name) VALUES('0094_bssv20140202_candidate_revision_resolution') ON CONFLICT DO NOTHING;
