-- Preserve the 03A terminal-reason vocabulary for legacy normalized feedback
-- that predates the optional 006-04-03 operationalOutcome discriminator.
CREATE OR REPLACE FUNCTION bridge.restore_legacy_provider_feedback_reason()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.terminal_reason='reconciled_provider_failure' AND EXISTS (
    SELECT 1 FROM bridge.provider_work_reservation reservation
    JOIN bridge.provider_operational_feedback_event feedback USING(reservation_id)
    WHERE reservation.logical_work_id=NEW.logical_work_id AND reservation.attempt_number=NEW.attempt_number
      AND feedback.transport_disposition='terminal_confirmed'
      AND NOT (feedback.normalized_feedback ? 'operationalOutcome')
  ) THEN
    UPDATE bridge.provider_work_attempt SET terminal_reason='reconciled_operational_feedback'
      WHERE logical_work_id=NEW.logical_work_id AND attempt_number=NEW.attempt_number;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS provider_work_attempt_legacy_feedback_reason ON bridge.provider_work_attempt;
CREATE TRIGGER provider_work_attempt_legacy_feedback_reason
  AFTER UPDATE OF terminal_reason ON bridge.provider_work_attempt
  FOR EACH ROW WHEN (NEW.terminal_reason='reconciled_provider_failure')
  EXECUTE FUNCTION bridge.restore_legacy_provider_feedback_reason();
ALTER FUNCTION bridge.restore_legacy_provider_feedback_reason() OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.restore_legacy_provider_feedback_reason() FROM PUBLIC,atlas_app;
INSERT INTO atlas.schema_migrations(name) VALUES('0073_bssv20060403_legacy_feedback_reason_compatibility') ON CONFLICT DO NOTHING;
