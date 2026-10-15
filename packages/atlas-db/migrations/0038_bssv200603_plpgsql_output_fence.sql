-- Recompile the 006-03 admission functions on installations that received the
-- initial migration before its explicit output-column conflict fence. Fresh
-- installs already carry the directive in 0037 and are intentionally unchanged.
DO $$
DECLARE definition text; target regprocedure;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'bridge.admit_next_provider_work_attempt(text)'::regprocedure,
    'bridge.admit_interactive_provider_work_attempt(text,integer)'::regprocedure
  ] LOOP
    SELECT pg_get_functiondef(target) INTO definition;
    IF position('#variable_conflict' IN definition) = 0 THEN
      definition := replace(definition, 'AS $function$' || E'\n', 'AS $function$' || E'\n#variable_conflict use_column\n');
      EXECUTE definition;
    END IF;
  END LOOP;
END;
$$;
INSERT INTO atlas.schema_migrations(name) VALUES('0038_bssv200603_plpgsql_output_fence') ON CONFLICT DO NOTHING;
