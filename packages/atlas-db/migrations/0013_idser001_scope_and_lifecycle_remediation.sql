-- CFC IDSER-001: keep manifests immutable after start without freezing member lifecycle.
CREATE OR REPLACE FUNCTION atlas.assert_bundle_manifest_mutable() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bundle_state text; bundle_id_value text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.bundle_id = OLD.bundle_id AND NEW.document_id = OLD.document_id AND NEW.sequence = OLD.sequence THEN RETURN NEW; END IF;
  bundle_id_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.bundle_id ELSE NEW.bundle_id END;
  SELECT state INTO bundle_state FROM atlas.extraction_bundle WHERE id = bundle_id_value;
  IF bundle_state IS NOT NULL AND bundle_state <> 'waiting' THEN RAISE EXCEPTION 'extraction bundle manifest is immutable after processing starts'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

ALTER TABLE atlas.extraction_bundle ADD CONSTRAINT extraction_bundle_scope_key UNIQUE (id, project_id, workspace_id);
ALTER TABLE atlas.document ADD CONSTRAINT document_project_workspace_id_key UNIQUE (project_id, workspace_id, id);
ALTER TABLE atlas.extraction_bundle_document ADD COLUMN project_id text, ADD COLUMN workspace_id text;
UPDATE atlas.extraction_bundle_document member SET project_id=bundle.project_id, workspace_id=bundle.workspace_id FROM atlas.extraction_bundle bundle WHERE bundle.id=member.bundle_id;
ALTER TABLE atlas.extraction_bundle_document ALTER COLUMN project_id SET NOT NULL, ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE atlas.extraction_bundle_document ADD CONSTRAINT extraction_bundle_document_bundle_scope_fkey FOREIGN KEY (bundle_id, project_id, workspace_id) REFERENCES atlas.extraction_bundle(id, project_id, workspace_id);
ALTER TABLE atlas.extraction_bundle_document ADD CONSTRAINT extraction_bundle_document_document_scope_fkey FOREIGN KEY (project_id, workspace_id, document_id) REFERENCES atlas.document(project_id, workspace_id, id);
ALTER TABLE atlas.extraction_bundle_document ADD CONSTRAINT extraction_bundle_document_scope_key UNIQUE (bundle_id, document_id, project_id, workspace_id);

ALTER TABLE atlas.semantic_execution ADD CONSTRAINT semantic_execution_member_scope_fkey FOREIGN KEY (bundle_id, document_id, project_id, workspace_id) REFERENCES atlas.extraction_bundle_document(bundle_id, document_id, project_id, workspace_id);
ALTER TABLE atlas.semantic_execution ADD CONSTRAINT semantic_execution_scope_key UNIQUE (id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.semantic_extraction_result ADD CONSTRAINT semantic_extraction_result_execution_scope_fkey FOREIGN KEY (execution_id, project_id, workspace_id, bundle_id, document_id) REFERENCES atlas.semantic_execution(id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.semantic_extraction_result ADD CONSTRAINT semantic_extraction_result_scope_key UNIQUE (id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.semantic_candidate ADD CONSTRAINT semantic_candidate_result_scope_fkey FOREIGN KEY (extraction_result_id, project_id, workspace_id, bundle_id, document_id) REFERENCES atlas.semantic_extraction_result(id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.semantic_candidate ADD CONSTRAINT semantic_candidate_document_key UNIQUE (id, document_id);
ALTER TABLE atlas.semantic_evidence ADD CONSTRAINT semantic_evidence_candidate_document_fkey FOREIGN KEY (semantic_candidate_id, document_id) REFERENCES atlas.semantic_candidate(id, document_id);
ALTER TABLE atlas.knowledge_index ADD CONSTRAINT knowledge_index_candidate_scope_fkey FOREIGN KEY (semantic_candidate_id) REFERENCES atlas.semantic_candidate(id);
ALTER TABLE atlas.knowledge_index ADD CONSTRAINT knowledge_index_scope_key UNIQUE (semantic_id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.knowledge_index ADD CONSTRAINT knowledge_index_bundle_scope_key UNIQUE (semantic_id, project_id, workspace_id, bundle_id);
ALTER TABLE atlas.semantic_reconciliation_result ADD CONSTRAINT semantic_reconciliation_result_execution_scope_fkey FOREIGN KEY (execution_id, project_id, workspace_id, bundle_id, current_document_id) REFERENCES atlas.semantic_execution(id, project_id, workspace_id, bundle_id, document_id);
ALTER TABLE atlas.semantic_reconciliation_result ADD CONSTRAINT semantic_reconciliation_result_scope_key UNIQUE (id, project_id, workspace_id, bundle_id);
ALTER TABLE atlas.reconciliation_relationship ADD CONSTRAINT reconciliation_relationship_result_scope_fkey FOREIGN KEY (reconciliation_result_id, project_id, workspace_id, bundle_id) REFERENCES atlas.semantic_reconciliation_result(id, project_id, workspace_id, bundle_id);
ALTER TABLE atlas.reconciliation_relationship ADD CONSTRAINT reconciliation_relationship_source_scope_fkey FOREIGN KEY (source_semantic_id, project_id, workspace_id, bundle_id) REFERENCES atlas.knowledge_index(semantic_id, project_id, workspace_id, bundle_id);
INSERT INTO atlas.schema_migrations (name) VALUES ('0013_idser001_scope_and_lifecycle_remediation') ON CONFLICT DO NOTHING;
