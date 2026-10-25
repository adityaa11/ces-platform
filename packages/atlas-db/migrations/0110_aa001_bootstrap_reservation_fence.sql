-- AA-001: once a reservation exists, only that same attempt may reconcile it.
-- This prevents a second concurrent attempt from replacing the durable owner.
CREATE OR REPLACE FUNCTION atlas.prevent_admin_bootstrap_reopen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.state = 'SEALED' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'sealed Atlas admin bootstrap state is immutable';
  END IF;

  IF OLD.state = 'RESERVED' AND NEW.state = 'RESERVED'
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

INSERT INTO atlas.schema_migrations (name) VALUES ('0110_aa001_bootstrap_reservation_fence') ON CONFLICT DO NOTHING;
