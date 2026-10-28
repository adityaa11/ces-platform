-- BSS-003 establishes ownership and permissions only. Atlas domain tables are deferred.
-- `atlas` is an ownership role for protected BSS authority objects; it is not
-- the Atlas application identity and must exist before later migrations assign
-- ownership to it.  The migration connection remains the provisioning role.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'atlas') THEN
    CREATE ROLE atlas NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS atlas;
CREATE SCHEMA IF NOT EXISTS bridge;

-- Migration metadata is infrastructure, not an Atlas domain model.
CREATE TABLE IF NOT EXISTS atlas.schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'atlas_app') THEN
    CREATE ROLE atlas_app LOGIN PASSWORD '{{ATLAS_APP_PASSWORD}}';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'agents_bridge') THEN
    CREATE ROLE agents_bridge LOGIN PASSWORD '{{AGENTS_BRIDGE_PASSWORD}}';
  END IF;
END $$;

GRANT USAGE, CREATE ON SCHEMA auth, atlas TO atlas_app;
GRANT USAGE, CREATE ON SCHEMA bridge TO agents_bridge;
-- Bridge receives no privileges on the trusted Atlas namespace.
REVOKE ALL ON SCHEMA atlas FROM agents_bridge;
REVOKE ALL ON ALL TABLES IN SCHEMA atlas FROM agents_bridge;
ALTER DEFAULT PRIVILEGES IN SCHEMA atlas REVOKE ALL ON TABLES FROM agents_bridge;

INSERT INTO atlas.schema_migrations (name) VALUES ('0000_bss003_boundaries') ON CONFLICT DO NOTHING;
