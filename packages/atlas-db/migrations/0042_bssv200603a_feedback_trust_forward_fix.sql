-- The feedback event is the single mutation gate.  Validate its provenance
-- and observation time before an ingress can persist accounting state.  The
-- values are Bridge-local normalized facts, never vendor headers or bodies.
CREATE OR REPLACE FUNCTION bridge.validate_provider_operational_feedback_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.normalized_feedback->>'observationSource' <> 'qualified_adapter'
    OR NEW.normalized_feedback->>'observationTrust' <> 'qualified' THEN
    RAISE EXCEPTION 'operational feedback source is not qualified';
  END IF;
  IF NEW.normalized_feedback->>'observedAt' IS NULL THEN
    RAISE EXCEPTION 'operational feedback freshness is missing';
  END IF;
  BEGIN
    PERFORM (NEW.normalized_feedback->>'observedAt')::timestamptz;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'operational feedback freshness is invalid';
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_operational_feedback_event_valid ON bridge.provider_operational_feedback_event;
CREATE TRIGGER provider_operational_feedback_event_valid
  BEFORE INSERT ON bridge.provider_operational_feedback_event
  FOR EACH ROW EXECUTE FUNCTION bridge.validate_provider_operational_feedback_event();

ALTER FUNCTION bridge.validate_provider_operational_feedback_event() OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.validate_provider_operational_feedback_event() FROM PUBLIC,atlas_app;
INSERT INTO atlas.schema_migrations(name) VALUES('0042_bssv200603a_feedback_trust_forward_fix') ON CONFLICT DO NOTHING;
