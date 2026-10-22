-- 0091 replaces the historical activation function.  Existing installations
-- have already recorded that migration, so carry its return-column shadowing
-- repair forward rather than requiring a migration-history rewrite.
DO $fix$
DECLARE function_definition text;
BEGIN
  SELECT pg_get_functiondef('bridge.activate_desired_admission_profile(text,text)'::regprocedure) INTO function_definition;
  function_definition := replace(
    function_definition,
    'max(activation_revision)',
    'max(activation.activation_revision)'
  );
  function_definition := replace(
    function_definition,
    'FROM bridge.desired_admission_profile_activation WHERE quota_domain_id=p_quota_domain_id;',
    'FROM bridge.desired_admission_profile_activation AS activation WHERE activation.quota_domain_id=p_quota_domain_id;'
  );
  EXECUTE function_definition;
END;
$fix$;

INSERT INTO atlas.schema_migrations(name) VALUES('0096_bssv20140202_activation_revision_resolution') ON CONFLICT DO NOTHING;
