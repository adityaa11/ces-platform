-- IDSER-012-01-01: staged bundles are deliberately opt-in.  Existing bundles
-- remain legacy and cannot be selected by the new local-capacity gate.
ALTER TABLE atlas.extraction_bundle
  ADD COLUMN IF NOT EXISTS perception_admission_policy text;
ALTER TABLE atlas.extraction_bundle
  ADD CONSTRAINT extraction_bundle_perception_admission_policy_check
  CHECK (perception_admission_policy IS NULL OR perception_admission_policy = 'staged-fair-local-v1');
ALTER TABLE atlas.extraction_bundle
  ADD COLUMN IF NOT EXISTS last_perception_admission_turn bigint;

CREATE TABLE IF NOT EXISTS atlas.perception_admission_gate (
  gate_key text PRIMARY KEY CHECK (gate_key = 'staged-fair-local-v1'),
  next_turn bigint NOT NULL DEFAULT 1 CHECK (next_turn > 0)
);
INSERT INTO atlas.perception_admission_gate (gate_key) VALUES ('staged-fair-local-v1') ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS extraction_bundle_staged_admission_idx
  ON atlas.extraction_bundle (perception_admission_policy, last_perception_admission_turn, id)
  WHERE perception_admission_policy = 'staged-fair-local-v1';
CREATE INDEX IF NOT EXISTS extraction_bundle_document_staged_pending_idx
  ON atlas.extraction_bundle_document (bundle_id, sequence)
  WHERE state = 'pending';

ALTER TABLE atlas.perception_admission_gate OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.perception_admission_gate FROM PUBLIC, agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0021_idser012_staged_perception_admission') ON CONFLICT DO NOTHING;
