-- SEM-CUTOVER-007A: one immutable stepwise composite and its optional
-- Semantic V1 delivery must commit together.  The projection contains only
-- validated adapter provenance, never raw provider content or media bytes.
ALTER TABLE bridge.semantic_composite_stage
  ADD COLUMN IF NOT EXISTS provider_provenance jsonb,
  ADD COLUMN IF NOT EXISTS delivery_binding_hash text;

ALTER TABLE bridge.semantic_composite_stage
  ADD CONSTRAINT semantic_composite_provider_provenance_shape
  CHECK (provider_provenance IS NULL OR jsonb_typeof(provider_provenance) = 'object');
ALTER TABLE bridge.semantic_composite_stage
  ADD CONSTRAINT semantic_composite_delivery_binding_shape
  CHECK (delivery_binding_hash IS NULL OR delivery_binding_hash ~ '^[a-f0-9]{64}$');

ALTER TABLE bridge.semantic_result_delivery
  ADD COLUMN IF NOT EXISTS composite_hash text,
  ADD COLUMN IF NOT EXISTS delivery_binding_hash text;
ALTER TABLE bridge.semantic_result_delivery
  ADD CONSTRAINT semantic_delivery_composite_hash_shape
  CHECK (composite_hash IS NULL OR composite_hash ~ '^[a-f0-9]{64}$');
ALTER TABLE bridge.semantic_result_delivery
  ADD CONSTRAINT semantic_delivery_binding_hash_shape
  CHECK (delivery_binding_hash IS NULL OR delivery_binding_hash ~ '^[a-f0-9]{64}$');

INSERT INTO atlas.schema_migrations (name) VALUES ('0027_semantic_stepwise_delivery_handoff') ON CONFLICT DO NOTHING;
