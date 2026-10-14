-- SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE: Atlas-owned reviewable deferral.
CREATE TABLE IF NOT EXISTS atlas.semantic_deferred_acceptance (
  execution_id text PRIMARY KEY REFERENCES atlas.semantic_execution(id) ON DELETE CASCADE,
  project_id text NOT NULL, workspace_id text NOT NULL, bundle_id text NOT NULL, document_id text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  outcome text NOT NULL CHECK (outcome IN ('partial_accepted','qualified_deferred')),
  composite_hash text NOT NULL CHECK (composite_hash ~ '^[a-f0-9]{64}$'),
  relationship_revision_set_hash text NOT NULL CHECK (relationship_revision_set_hash ~ '^[a-f0-9]{64}$'),
  provisional_sidecar_hash text NOT NULL CHECK (provisional_sidecar_hash ~ '^[a-f0-9]{64}$'),
  deferred_coverage jsonb NOT NULL CHECK (jsonb_typeof(deferred_coverage)='array'),
  coverage_hash text NOT NULL CHECK (coverage_hash ~ '^[a-f0-9]{64}$'),
  completion_fingerprint text NOT NULL CHECK (completion_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (bundle_id, document_id) REFERENCES atlas.extraction_bundle_document(bundle_id, document_id)
);
ALTER TABLE atlas.semantic_deferred_acceptance OWNER TO atlas_app;
REVOKE ALL ON atlas.semantic_deferred_acceptance FROM PUBLIC, agents_bridge;
DO $$ DECLARE item record; BEGIN FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='atlas.extraction_bundle'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%state%' LOOP EXECUTE format('ALTER TABLE atlas.extraction_bundle DROP CONSTRAINT %I', item.conname); END LOOP; END $$;
ALTER TABLE atlas.extraction_bundle ADD CONSTRAINT extraction_bundle_state_check CHECK ((state IN ('waiting','processing','ready_for_review','needs_attention','qualified_deferred')) AND ((state='waiting' AND started_at IS NULL AND completed_at IS NULL) OR (state='processing' AND started_at IS NOT NULL AND completed_at IS NULL) OR (state IN ('ready_for_review','qualified_deferred') AND completed_at IS NOT NULL AND completed_document_count <= expected_document_count) OR state='needs_attention'));
DO $$ DECLARE item record; BEGIN FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='atlas.extraction_bundle_document'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%state%' LOOP EXECUTE format('ALTER TABLE atlas.extraction_bundle_document DROP CONSTRAINT %I', item.conname); END LOOP; END $$;
ALTER TABLE atlas.extraction_bundle_document ADD CONSTRAINT extraction_bundle_document_state_check CHECK ((state IN ('pending','perception_queued','perceiving','perceived','extracting','reconciling','completed','qualified_deferred','needs_attention')) AND ((state='pending' AND started_at IS NULL AND completed_at IS NULL) OR (state IN ('completed','qualified_deferred') AND completed_at IS NOT NULL) OR state NOT IN ('pending','completed','qualified_deferred')));
INSERT INTO atlas.schema_migrations (name) VALUES ('0026_semantic_qualified_deferred_acceptance') ON CONFLICT DO NOTHING;
