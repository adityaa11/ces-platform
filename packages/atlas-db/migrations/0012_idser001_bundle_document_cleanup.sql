-- IDSER-001 amendment: project/document cleanup must not strand a bundle member.
ALTER TABLE atlas.extraction_bundle_document DROP CONSTRAINT extraction_bundle_document_document_id_fkey;
ALTER TABLE atlas.extraction_bundle_document ADD CONSTRAINT extraction_bundle_document_document_id_fkey FOREIGN KEY (document_id) REFERENCES atlas.document(id) ON DELETE CASCADE;
INSERT INTO atlas.schema_migrations (name) VALUES ('0012_idser001_bundle_document_cleanup') ON CONFLICT DO NOTHING;
