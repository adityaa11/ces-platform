-- IDSER-005: semantic replay is owned by the BSS-006 fenced claimant.
ALTER TABLE bridge.semantic_result_delivery ADD COLUMN IF NOT EXISTS lease_owner text;
ALTER TABLE bridge.semantic_result_delivery ADD COLUMN IF NOT EXISTS lease_generation integer;
INSERT INTO atlas.schema_migrations (name) VALUES ('0017_idser005_semantic_replay_fencing') ON CONFLICT DO NOTHING;
