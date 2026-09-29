-- IDSER-006: retain the provider-local to Atlas canonical candidate mapping.
CREATE TABLE IF NOT EXISTS atlas.semantic_candidate_identity_map (
  semantic_candidate_id text PRIMARY KEY REFERENCES atlas.semantic_candidate(id) ON DELETE CASCADE,
  canonical_semantic_id text NOT NULL REFERENCES atlas.knowledge_index(semantic_id),
  local_candidate_id text NOT NULL,
  extraction_execution_id text NOT NULL REFERENCES atlas.semantic_execution(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (extraction_execution_id, local_candidate_id),
  UNIQUE (canonical_semantic_id)
);
ALTER TABLE atlas.semantic_candidate_identity_map OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.semantic_candidate_identity_map FROM PUBLIC, agents_bridge;
CREATE INDEX IF NOT EXISTS knowledge_index_scoped_retrieval ON atlas.knowledge_index (project_id, workspace_id, bundle_id, document_id, semantic_key, kind, semantic_id);
CREATE INDEX IF NOT EXISTS semantic_evidence_candidate_lookup ON atlas.semantic_evidence (semantic_candidate_id, page_number, locator_type, locator_id);
INSERT INTO atlas.schema_migrations (name) VALUES ('0018_idser006_candidate_identity_map') ON CONFLICT DO NOTHING;
