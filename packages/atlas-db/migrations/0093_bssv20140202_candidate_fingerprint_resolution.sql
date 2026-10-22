-- Keep the 02-02 public return field while qualifying the candidate-table
-- lookup.  PL/pgSQL otherwise sees the return-field name and the immutable
-- table column as ambiguous before any candidate can be written.
DO $fix$
DECLARE function_definition text;
BEGIN
  SELECT pg_get_functiondef(
    'bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamp with time zone,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) INTO function_definition;
  function_definition := replace(
    function_definition,
    'FROM bridge.desired_admission_profile_candidate' || E'\n    WHERE quota_domain_id = p_quota_domain_id AND effective_input_fingerprint = v_fingerprint',
    'FROM bridge.desired_admission_profile_candidate candidate' || E'\n    WHERE candidate.quota_domain_id = p_quota_domain_id AND candidate.effective_input_fingerprint = v_fingerprint'
  );
  EXECUTE function_definition;
END;
$fix$;

INSERT INTO atlas.schema_migrations(name) VALUES('0093_bssv20140202_candidate_fingerprint_resolution') ON CONFLICT DO NOTHING;
