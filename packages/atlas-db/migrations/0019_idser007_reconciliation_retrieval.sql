-- IDSER-007: deterministic incoming-neighborhood retrieval and bounded traversal.
CREATE INDEX IF NOT EXISTS knowledge_index_reconciliation_scope ON atlas.knowledge_index (project_id, workspace_id, bundle_id, semantic_key, kind, document_id, semantic_id);
CREATE INDEX IF NOT EXISTS extraction_bundle_document_sequence_scope ON atlas.extraction_bundle_document (bundle_id, sequence, state, project_id, workspace_id, document_id);
CREATE INDEX IF NOT EXISTS reconciliation_relationship_traversal ON atlas.reconciliation_relationship (project_id, workspace_id, bundle_id, source_semantic_id, id);
CREATE INDEX IF NOT EXISTS reconciliation_relationship_target_traversal ON atlas.reconciliation_relationship (project_id, workspace_id, bundle_id, target_semantic_id, id) WHERE target_semantic_id IS NOT NULL;
INSERT INTO atlas.schema_migrations (name) VALUES ('0019_idser007_reconciliation_retrieval') ON CONFLICT DO NOTHING;
