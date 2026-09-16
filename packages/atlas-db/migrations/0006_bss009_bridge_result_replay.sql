-- BSS-009-02: Bridge may durably retain a normalized result only until Atlas
-- acknowledges it. This makes acknowledgement loss replayable without
-- rereading the source or invoking a provider a second time.
CREATE TABLE IF NOT EXISTS bridge.document_perception_result_delivery (
  idempotency_key text PRIMARY KEY,
  execution_id text NOT NULL,
  normalized_result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(normalized_result) = 'object')
);
ALTER TABLE bridge.document_perception_result_delivery OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.document_perception_result_delivery FROM PUBLIC, atlas_app;

INSERT INTO atlas.schema_migrations (name) VALUES ('0006_bss009_bridge_result_replay') ON CONFLICT DO NOTHING;
