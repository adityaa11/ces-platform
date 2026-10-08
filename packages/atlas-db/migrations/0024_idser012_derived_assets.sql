-- IDSER-012-01-03-02: Atlas, rather than Bridge, owns derived evidence bytes
-- and their identity bindings.  Bytes remain in the configured store; this
-- table contains no binary payload or filesystem path.
CREATE TABLE IF NOT EXISTS atlas.document_perception_derived_manifest (
  id text PRIMARY KEY,
  execution_id text NOT NULL REFERENCES atlas.document_perception_execution(id) ON DELETE RESTRICT,
  artifact_id text NOT NULL REFERENCES atlas.document(id) ON DELETE RESTRICT,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  profile text NOT NULL,
  page_number integer NOT NULL CHECK (page_number > 0),
  locator_id text NOT NULL,
  asset_ref text NOT NULL UNIQUE CHECK (asset_ref ~ '^derived/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  media_type text NOT NULL CHECK (media_type = 'image/png'),
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  verified_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (execution_id, locator_id)
);
CREATE INDEX IF NOT EXISTS document_perception_derived_manifest_artifact_idx
  ON atlas.document_perception_derived_manifest (artifact_id, execution_id);
ALTER TABLE atlas.document_perception_derived_manifest OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.document_perception_derived_manifest FROM PUBLIC, agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0024_idser012_derived_assets') ON CONFLICT DO NOTHING;
