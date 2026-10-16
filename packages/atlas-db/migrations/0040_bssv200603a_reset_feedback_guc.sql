-- The function-local GUC is not permitted for the restricted Bridge role.
-- Fresh source uses an unambiguous local name; this restores normal execution
-- for existing installations pending the function body forward replacement.
ALTER FUNCTION bridge.ingest_provider_operational_feedback(jsonb) RESET plpgsql.variable_conflict;
INSERT INTO atlas.schema_migrations(name) VALUES('0040_bssv200603a_reset_feedback_guc') ON CONFLICT DO NOTHING;
