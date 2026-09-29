-- IDSER-008: the original bootstrap constraint predates review-ready state.
-- `workspace_state_check` is the authoritative replacement introduced by
-- IDSER-001; retaining both prevents the atomic completion transition.
ALTER TABLE atlas.workspace DROP CONSTRAINT IF EXISTS workspace_check;
INSERT INTO atlas.schema_migrations (name) VALUES ('0020_idser008_bundle_completion_lifecycle') ON CONFLICT DO NOTHING;
