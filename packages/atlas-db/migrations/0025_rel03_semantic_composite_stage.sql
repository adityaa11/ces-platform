-- REL-03-DURABLE-001: Bridge-owned immutable recovery material, never trusted Atlas state.
CREATE TABLE IF NOT EXISTS bridge.semantic_composite_stage (
  idempotency_key text PRIMARY KEY,
  execution_id text NOT NULL,
  lease_owner text NOT NULL,
  lease_generation integer NOT NULL CHECK (lease_generation > 0),
  source_snapshot jsonb NOT NULL CHECK (jsonb_typeof(source_snapshot) = 'object'),
  profile_identity jsonb NOT NULL CHECK (jsonb_typeof(profile_identity) = 'object'),
  request_identity jsonb NOT NULL CHECK (jsonb_typeof(request_identity) = 'object'),
  canonical_result jsonb CHECK (canonical_result IS NULL OR jsonb_typeof(canonical_result) = 'object'),
  provisional_relationship_revisions jsonb NOT NULL CHECK (jsonb_typeof(provisional_relationship_revisions) = 'array'),
  provisional_sidecar jsonb NOT NULL CHECK (jsonb_typeof(provisional_sidecar) = 'object'),
  composite_hash text NOT NULL CHECK (composite_hash ~ '^[a-f0-9]{64}$'),
  revision_set_hash text NOT NULL CHECK (revision_set_hash ~ '^[a-f0-9]{64}$'),
  sidecar_hash text NOT NULL CHECK (sidecar_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bridge.semantic_composite_stage OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.semantic_composite_stage FROM PUBLIC, atlas_app;
INSERT INTO atlas.schema_migrations (name) VALUES ('0025_rel03_semantic_composite_stage') ON CONFLICT DO NOTHING;
