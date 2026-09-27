-- IDSER-004: reconciliation selection is snapshotted by the owning execution.
CREATE TABLE IF NOT EXISTS atlas.semantic_execution_context (
  execution_id text PRIMARY KEY REFERENCES atlas.semantic_execution(id) ON DELETE CASCADE,
  context_json jsonb NOT NULL CHECK (jsonb_typeof(context_json) = 'object'),
  context_fingerprint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE atlas.semantic_execution_context OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.semantic_execution_context FROM PUBLIC, agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0015_idser004_semantic_context_authority') ON CONFLICT DO NOTHING;
