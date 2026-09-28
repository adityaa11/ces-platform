-- IDSER-004: cancellation is a persisted terminal semantic-execution state.
ALTER TABLE atlas.semantic_execution DROP CONSTRAINT semantic_execution_lifecycle_check;
ALTER TABLE atlas.semantic_execution ADD CONSTRAINT semantic_execution_lifecycle_check CHECK (lifecycle IN ('queued','running','completed','failed','cancelled'));
INSERT INTO atlas.schema_migrations (name) VALUES ('0016_idser004_cancelled_semantic_execution') ON CONFLICT DO NOTHING;
