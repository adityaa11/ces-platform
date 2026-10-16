-- Existing 0037 installations compiled the ingress with a local feedback_id
-- name that shadows its table column. Resolve the stored function under the
-- intended variable rule; fresh installs also receive the renamed variable.
ALTER FUNCTION bridge.ingest_provider_operational_feedback(jsonb) SET plpgsql.variable_conflict = 'use_variable';
INSERT INTO atlas.schema_migrations(name) VALUES('0039_bssv200603a_feedback_variable_conflict_forward_fix') ON CONFLICT DO NOTHING;
