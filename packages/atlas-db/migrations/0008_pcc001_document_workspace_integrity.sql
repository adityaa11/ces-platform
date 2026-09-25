-- PCC-001 remediation: a document's workspace must belong to its project.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_project_id_id_key' AND conrelid = 'atlas.workspace'::regclass) THEN
    ALTER TABLE atlas.workspace
      ADD CONSTRAINT workspace_project_id_id_key UNIQUE (project_id, id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_project_workspace_fkey' AND conrelid = 'atlas.document'::regclass) THEN
    ALTER TABLE atlas.document
      ADD CONSTRAINT document_project_workspace_fkey
      FOREIGN KEY (project_id, workspace_id)
      REFERENCES atlas.workspace (project_id, id)
      ON DELETE RESTRICT;
  END IF;
END $$;

INSERT INTO atlas.schema_migrations (name) VALUES ('0008_pcc001_document_workspace_integrity') ON CONFLICT DO NOTHING;
