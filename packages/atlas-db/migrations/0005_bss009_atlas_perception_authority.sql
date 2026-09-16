-- BSS-009-01: all perception operational data is Atlas-owned.  The Bridge is
-- deliberately denied this schema and accesses it only through authenticated
-- Atlas routes.
ALTER TABLE atlas.document_perception_execution
  ADD COLUMN IF NOT EXISTS capability_identity text NOT NULL DEFAULT 'atlas.document.perceive:v1';
ALTER TABLE atlas.document_perception_execution
  ADD COLUMN IF NOT EXISTS completion_fingerprint text;
ALTER TABLE atlas.normalized_document_cache
  ADD COLUMN IF NOT EXISTS capability_identity text NOT NULL DEFAULT 'atlas.document.perceive:v1';
ALTER TABLE atlas.normalized_document_cache
  ADD COLUMN IF NOT EXISTS derived_assets jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS normalized_document_cache_identity_idx
  ON atlas.normalized_document_cache (source_sha256, contract_version, capability, capability_identity)
  WHERE invalidated_at IS NULL;

CREATE TABLE IF NOT EXISTS atlas.document_perception_derived_asset (
  id text PRIMARY KEY,
  cache_key text NOT NULL REFERENCES atlas.normalized_document_cache(cache_key) ON DELETE CASCADE,
  asset_ref text NOT NULL CHECK (asset_ref ~ '^derived/'),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (cache_key, asset_ref)
);

ALTER TABLE atlas.document_perception_derived_asset OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.document_perception_derived_asset FROM PUBLIC, agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0005_bss009_atlas_perception_authority') ON CONFLICT DO NOTHING;
