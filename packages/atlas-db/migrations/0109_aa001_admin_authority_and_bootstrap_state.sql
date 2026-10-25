-- AA-001: Better Auth owns identity/session data; Atlas owns only the
-- first-operator bootstrap coordination marker.
ALTER TABLE auth."user"
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "banReason" text,
  ADD COLUMN IF NOT EXISTS "banExpires" timestamptz;

ALTER TABLE auth."user"
  DROP CONSTRAINT IF EXISTS auth_user_atlas_admin_role_check;
ALTER TABLE auth."user"
  ADD CONSTRAINT auth_user_atlas_admin_role_check CHECK (role IN ('user', 'admin'));

ALTER TABLE auth.session
  ADD COLUMN IF NOT EXISTS "impersonatedBy" text;

CREATE TABLE IF NOT EXISTS atlas.admin_bootstrap_state (
  bootstrap_key text PRIMARY KEY CHECK (bootstrap_key = 'atlas-platform-super-admin'),
  state text NOT NULL CHECK (state IN ('UNINITIALIZED', 'RESERVED', 'SEALED')),
  attempt_id text UNIQUE,
  attempt_email text,
  initial_user_id text REFERENCES auth."user"(id) ON DELETE RESTRICT,
  reserved_at timestamptz,
  sealed_at timestamptz,
  CONSTRAINT admin_bootstrap_state_shape_check CHECK (
    (state = 'UNINITIALIZED'
      AND attempt_id IS NULL
      AND attempt_email IS NULL
      AND initial_user_id IS NULL
      AND reserved_at IS NULL
      AND sealed_at IS NULL)
    OR
    (state = 'RESERVED'
      AND attempt_id IS NOT NULL
      AND attempt_email IS NOT NULL
      AND reserved_at IS NOT NULL
      AND sealed_at IS NULL)
    OR
    (state = 'SEALED'
      AND attempt_id IS NOT NULL
      AND attempt_email IS NOT NULL
      AND initial_user_id IS NOT NULL
      AND reserved_at IS NOT NULL
      AND sealed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS admin_bootstrap_state_initial_user_id_idx
  ON atlas.admin_bootstrap_state (initial_user_id);

-- The marker is created with the migration, so conditional reservation updates
-- have a single durable row to contend for. The later coordinator owns its
-- transition protocol; the database makes reopening a sealed marker impossible.
INSERT INTO atlas.admin_bootstrap_state (bootstrap_key, state)
VALUES ('atlas-platform-super-admin', 'UNINITIALIZED')
ON CONFLICT (bootstrap_key) DO NOTHING;

CREATE OR REPLACE FUNCTION atlas.prevent_admin_bootstrap_reopen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.state = 'SEALED' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'sealed Atlas admin bootstrap state is immutable';
  END IF;

  IF (OLD.state = 'UNINITIALIZED' AND NEW.state NOT IN ('UNINITIALIZED', 'RESERVED'))
    OR (OLD.state = 'RESERVED' AND NEW.state NOT IN ('RESERVED', 'SEALED'))
    OR (OLD.state = 'SEALED' AND NEW.state <> 'SEALED') THEN
    RAISE EXCEPTION 'invalid Atlas admin bootstrap state transition: % to %', OLD.state, NEW.state;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_bootstrap_state_transition_guard ON atlas.admin_bootstrap_state;
CREATE TRIGGER admin_bootstrap_state_transition_guard
  BEFORE UPDATE ON atlas.admin_bootstrap_state
  FOR EACH ROW EXECUTE FUNCTION atlas.prevent_admin_bootstrap_reopen();

GRANT SELECT, INSERT, UPDATE, DELETE ON atlas.admin_bootstrap_state TO atlas_app;
REVOKE ALL ON atlas.admin_bootstrap_state FROM agents_bridge;

INSERT INTO atlas.schema_migrations (name) VALUES ('0109_aa001_admin_authority_and_bootstrap_state') ON CONFLICT DO NOTHING;
