-- IDSER-012-01-02: accepted staged perception is terminal for this phase.
-- Preserve the bundle in processing while recording a durable, non-semantic
-- member lifecycle state; later tickets own semantic_ready and completion.
ALTER TABLE atlas.extraction_bundle_document
  DROP CONSTRAINT IF EXISTS extraction_bundle_document_state_check;
ALTER TABLE atlas.extraction_bundle_document
  ADD CONSTRAINT extraction_bundle_document_state_check
  CHECK (state IN ('pending','perception_queued','perceiving','perceived','extracting','reconciling','completed','needs_attention'));

INSERT INTO atlas.schema_migrations (name)
VALUES ('0022_idser012_perceived_terminal') ON CONFLICT DO NOTHING;
