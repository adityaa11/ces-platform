-- Narrow BSS-006 amendment: pg-boss delivers work; Bridge owns short-lived
-- claim/lease/fencing and completion transactions for logical effects.
ALTER TABLE bridge.background_effects ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE bridge.background_effects ADD COLUMN IF NOT EXISTS lease_owner text;
ALTER TABLE bridge.background_effects ADD COLUMN IF NOT EXISTS lease_generation integer NOT NULL DEFAULT 0;
ALTER TABLE bridge.background_effects ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz;
ALTER TABLE bridge.background_effects ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE bridge.background_effects ADD COLUMN IF NOT EXISTS last_error text;
DO $$
BEGIN
  ALTER TABLE bridge.background_effects
    ADD CONSTRAINT background_effects_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
INSERT INTO atlas.schema_migrations (name) VALUES ('0004_bss006_atomic_idempotency_amendment') ON CONFLICT DO NOTHING;
