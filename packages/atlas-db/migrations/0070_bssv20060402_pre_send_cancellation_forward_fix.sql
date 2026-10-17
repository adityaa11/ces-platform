-- A dispatched pg-boss job is still pre-send until its 03A transport claim.
-- Cancellation must release that reservation and make a later worker claim fail.
CREATE OR REPLACE FUNCTION bridge.cancel_provider_work_attempt(p_logical_work_id text, p_attempt_number integer, p_reason text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_work bridge.provider_work_attempt;
BEGIN
  SELECT * INTO v_work FROM bridge.provider_work_attempt WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt is missing'; END IF;
  IF v_work.state='waiting' THEN
    UPDATE bridge.provider_work_attempt SET state='terminal', terminal_reason=p_reason, cancellation_requested_at=clock_timestamp(), state_version=state_version+1, updated_at=clock_timestamp() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'terminal_without_reservation';
  ELSIF v_work.state IN ('reserved','dispatched') THEN
    UPDATE bridge.provider_work_reservation SET state='released', released_at=clock_timestamp() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='live';
    UPDATE bridge.provider_work_attempt SET state='terminal', terminal_reason=p_reason, cancellation_requested_at=clock_timestamp(), state_version=state_version+1, updated_at=clock_timestamp() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'released_before_transport';
  ELSIF v_work.state='transport_may_have_started' THEN
    UPDATE bridge.provider_work_reservation SET state='consumed_unknown', released_at=clock_timestamp() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='live';
    UPDATE bridge.provider_work_attempt SET cancellation_requested_at=clock_timestamp(), state_version=state_version+1, updated_at=clock_timestamp() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'transport_usage_remains_unknown';
  END IF;
  RETURN v_work.state;
END;
$$;
ALTER FUNCTION bridge.cancel_provider_work_attempt(text,integer,text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.cancel_provider_work_attempt(text,integer,text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.cancel_provider_work_attempt(text,integer,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0070_bssv20060402_pre_send_cancellation_forward_fix') ON CONFLICT DO NOTHING;
