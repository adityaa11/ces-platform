-- Human-authorized IDSER-001 follow-up CFC: bind index and relationship targets to full owning scope.
ALTER TABLE atlas.semantic_candidate ADD CONSTRAINT semantic_candidate_scope_key UNIQUE (id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.knowledge_index DROP CONSTRAINT knowledge_index_candidate_scope_fkey;
ALTER TABLE atlas.knowledge_index ADD CONSTRAINT knowledge_index_candidate_scope_fkey FOREIGN KEY (semantic_candidate_id, project_id, workspace_id, bundle_id, document_id) REFERENCES atlas.semantic_candidate(id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.reconciliation_relationship DROP CONSTRAINT reconciliation_relationship_target_semantic_id_fkey;
ALTER TABLE atlas.reconciliation_relationship ADD CONSTRAINT reconciliation_relationship_target_scope_fkey FOREIGN KEY (target_semantic_id, project_id, workspace_id, bundle_id) REFERENCES atlas.knowledge_index(semantic_id, project_id, workspace_id, bundle_id);
INSERT INTO atlas.schema_migrations (name) VALUES ('0014_idser001_cross_scope_reference_integrity') ON CONFLICT DO NOTHING;
