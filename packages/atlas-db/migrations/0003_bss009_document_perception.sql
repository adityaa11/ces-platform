-- BSS-009 operational state is Atlas-owned. The Bridge retains no direct
-- privilege to grant redemption, source bytes, normalized output, or cache rows.
CREATE TABLE IF NOT EXISTS atlas.document_perception_execution (
  id text PRIMARY KEY,
  artifact_id text NOT NULL,
  document_storage_key text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  mime_type text NOT NULL CHECK (mime_type = 'application/pdf'),
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 20971520),
  contract_version text NOT NULL,
  state text NOT NULL CHECK (state IN ('queued', 'fetching_source', 'perceiving', 'normalizing', 'delivering_result', 'completed', 'failed', 'cancelled')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atlas.document_perception_source_grant (
  grant_id text PRIMARY KEY,
  execution_id text NOT NULL REFERENCES atlas.document_perception_execution(id) ON DELETE CASCADE,
  artifact_id text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  mime_type text NOT NULL CHECK (mime_type = 'application/pdf'),
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 20971520),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE TABLE IF NOT EXISTS atlas.normalized_document_cache (
  cache_key text PRIMARY KEY,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  contract_version text NOT NULL,
  capability text NOT NULL CHECK (capability = 'atlas.document.perceive'),
  normalized_document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  invalidated_at timestamptz
);

CREATE INDEX IF NOT EXISTS document_perception_execution_source_idx ON atlas.document_perception_execution (source_sha256, contract_version);
CREATE INDEX IF NOT EXISTS document_perception_source_grant_execution_idx ON atlas.document_perception_source_grant (execution_id, expires_at);

ALTER TABLE atlas.document_perception_execution OWNER TO atlas_app;
ALTER TABLE atlas.document_perception_source_grant OWNER TO atlas_app;
ALTER TABLE atlas.normalized_document_cache OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.document_perception_execution, atlas.document_perception_source_grant, atlas.normalized_document_cache FROM PUBLIC, agents_bridge;

INSERT INTO atlas.schema_migrations (name) VALUES ('0003_bss009_document_perception') ON CONFLICT DO NOTHING;
