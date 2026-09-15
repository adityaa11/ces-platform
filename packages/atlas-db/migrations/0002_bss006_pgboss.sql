-- BSS-006 reserves PostgreSQL-backed queue infrastructure for the Bridge role.
CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION agents_bridge;
ALTER SCHEMA pgboss OWNER TO agents_bridge;
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO agents_bridge', current_database());
END $$;

-- Atlas may enqueue work through pg-boss functions, but cannot manage queue tables.
GRANT USAGE ON SCHEMA pgboss TO atlas_app;
ALTER DEFAULT PRIVILEGES FOR ROLE agents_bridge IN SCHEMA pgboss REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE agents_bridge IN SCHEMA pgboss GRANT EXECUTE ON FUNCTIONS TO atlas_app;

-- Durable idempotency effects are Bridge runtime state, never trusted Atlas state.
CREATE TABLE IF NOT EXISTS bridge.background_effects (
  idempotency_key text PRIMARY KEY,
  execution_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bridge.background_effects OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.background_effects FROM PUBLIC, atlas_app;

INSERT INTO atlas.schema_migrations (name) VALUES ('0002_bss006_pgboss') ON CONFLICT DO NOTHING;
