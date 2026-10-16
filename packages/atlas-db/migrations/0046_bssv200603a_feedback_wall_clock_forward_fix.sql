-- `now()` is transaction-scoped in PostgreSQL.  Feedback can be observed
-- after a long-lived admission transaction began, so use a wall-clock read
-- for the future-observation fence without relaxing stale-event rejection.
CREATE OR REPLACE FUNCTION bridge.validate_provider_operational_feedback_event()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE observed_at timestamptz; reservation_created_at timestamptz;
BEGIN
  IF NEW.normalized_feedback->>'observationSource' <> 'qualified_adapter'
    OR NEW.normalized_feedback->>'observationTrust' <> 'qualified' THEN
    RAISE EXCEPTION 'operational feedback source is not qualified';
  END IF;
  IF NEW.normalized_feedback->>'observedAt' IS NULL THEN
    RAISE EXCEPTION 'operational feedback freshness is missing';
  END IF;
  BEGIN
    observed_at := (NEW.normalized_feedback->>'observedAt')::timestamptz;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'operational feedback freshness is invalid';
  END;
  IF observed_at > clock_timestamp() THEN
    RAISE EXCEPTION 'operational feedback observation is in the future';
  END IF;
  SELECT created_at INTO reservation_created_at
    FROM bridge.provider_work_reservation WHERE reservation_id=NEW.reservation_id;
  IF reservation_created_at IS NULL OR observed_at < reservation_created_at THEN
    RAISE EXCEPTION 'operational feedback observation is stale';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(NEW.normalized_feedback) key
    WHERE key NOT IN (
      'feedbackId','reservationId','attemptId','routeId','quotaDomainId',
      'desiredProfileVersion','qualificationVersion','observationSource',
      'observationTrust','observedAt','transportDisposition','usage'
    )
  ) THEN
    RAISE EXCEPTION 'operational feedback contains an unsupported field';
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION bridge.validate_provider_operational_feedback_event() OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.validate_provider_operational_feedback_event() FROM PUBLIC,atlas_app;
INSERT INTO atlas.schema_migrations(name) VALUES('0046_bssv200603a_feedback_wall_clock_forward_fix') ON CONFLICT DO NOTHING;
