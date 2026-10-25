-- AA-001 CFC: preserve reservation ownership through sealing, make the
-- application marker non-deletable, and expose the fail-closed reconciliation
-- check that later bootstrap coordination must invoke before provisioning.
CREATE OR REPLACE FUNCTION atlas.prevent_admin_bootstrap_reopen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.state = 'SEALED' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'sealed Atlas admin bootstrap state is immutable';
  END IF;

  IF OLD.state = 'RESERVED'
    AND (NEW.attempt_id IS DISTINCT FROM OLD.attempt_id
      OR NEW.attempt_email IS DISTINCT FROM OLD.attempt_email) THEN
    RAISE EXCEPTION 'reserved Atlas admin bootstrap state belongs to its original attempt';
  END IF;

  IF (OLD.state = 'UNINITIALIZED' AND NEW.state NOT IN ('UNINITIALIZED', 'RESERVED'))
    OR (OLD.state = 'RESERVED' AND NEW.state NOT IN ('RESERVED', 'SEALED'))
    OR (OLD.state = 'SEALED' AND NEW.state <> 'SEALED') THEN
    RAISE EXCEPTION 'invalid Atlas admin bootstrap state transition: % to %', OLD.state, NEW.state;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION atlas.assert_admin_bootstrap_reconciliation_safe()
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, atlas, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM atlas.admin_bootstrap_state
    WHERE bootstrap_key = 'atlas-platform-super-admin'
  ) AND EXISTS (
    SELECT 1
    FROM auth."user"
    WHERE role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Atlas admin bootstrap conflict: marker missing while an admin identity exists';
  END IF;
END;
$$;

REVOKE DELETE ON atlas.admin_bootstrap_state FROM atlas_app;
REVOKE ALL ON FUNCTION atlas.assert_admin_bootstrap_reconciliation_safe() FROM PUBLIC, agents_bridge;
GRANT EXECUTE ON FUNCTION atlas.assert_admin_bootstrap_reconciliation_safe() TO atlas_app;

INSERT INTO atlas.schema_migrations (name) VALUES ('0111_aa001_bootstrap_conflict_and_sealed_fence') ON CONFLICT DO NOTHING;
