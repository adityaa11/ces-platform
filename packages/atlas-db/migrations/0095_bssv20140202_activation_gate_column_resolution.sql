-- The activation return shape already exposes effective_from.  Qualify the
-- gated profile lookup so the rejection is reached before any mutable state.
DO $fix$
DECLARE function_definition text;
BEGIN
  SELECT pg_get_functiondef('bridge.activate_desired_admission_profile(text,text)'::regprocedure) INTO function_definition;
  function_definition := replace(
    function_definition,
    'SELECT effective_from, profile INTO profile_effective_from, profile FROM bridge.desired_admission_profile' || E'\n    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_desired_profile_version FOR KEY SHARE',
    'SELECT desired.effective_from, desired.profile INTO profile_effective_from, profile FROM bridge.desired_admission_profile desired' || E'\n    WHERE desired.quota_domain_id = p_quota_domain_id AND desired.profile_version = p_desired_profile_version FOR KEY SHARE'
  );
  EXECUTE function_definition;
END;
$fix$;

INSERT INTO atlas.schema_migrations(name) VALUES('0095_bssv20140202_activation_gate_column_resolution') ON CONFLICT DO NOTHING;
