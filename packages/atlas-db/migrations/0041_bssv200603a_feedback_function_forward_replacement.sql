-- Existing installations can retain an older feedback function body despite
-- having applied the 03A schema migrations.  Replace it forward-only with the
-- route-bound body; unlike the legacy body this uses an unambiguous local
-- feedback identity and therefore does not depend on plpgsql conflict GUCs.
CREATE OR REPLACE FUNCTION bridge.ingest_provider_operational_feedback(p_feedback jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE reservation bridge.provider_work_reservation; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding; prior bridge.provider_operational_feedback_event;
  v_feedback_id text; disposition text; fingerprint text; usage jsonb; dimension text; units numeric; held numeric; profile_version text;
BEGIN
  IF jsonb_typeof(p_feedback) <> 'object' OR p_feedback ?| ARRAY['raw','headers','body','prompt','source','credential','authorization','secret','token'] THEN RAISE EXCEPTION 'operational feedback must be bounded and redacted'; END IF;
  v_feedback_id:=p_feedback->>'feedbackId'; disposition:=p_feedback->>'transportDisposition';
  IF v_feedback_id IS NULL OR disposition NOT IN ('definitely_not_sent','may_have_started','terminal_confirmed') OR (p_feedback->>'reservationId') IS NULL THEN RAISE EXCEPTION 'operational feedback identity is invalid'; END IF;
  SELECT * INTO reservation FROM bridge.provider_work_reservation WHERE reservation_id=(p_feedback->>'reservationId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'operational feedback reservation is unknown'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=reservation.logical_work_id AND attempt_number=reservation.attempt_number FOR UPDATE;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  IF NOT FOUND OR p_feedback->>'routeId' IS DISTINCT FROM binding.selected_route_id OR p_feedback->>'quotaDomainId' IS DISTINCT FROM work.quota_domain_id OR p_feedback->>'desiredProfileVersion' IS DISTINCT FROM work.desired_profile_version OR p_feedback->>'qualificationVersion' IS DISTINCT FROM binding.qualification_version THEN RAISE EXCEPTION 'operational feedback route, domain, plan, or qualification identity is invalid'; END IF;
  IF p_feedback->>'attemptId' IS DISTINCT FROM work.logical_work_id || ':' || work.attempt_number::text THEN RAISE EXCEPTION 'operational feedback attempt identity is invalid'; END IF;
  fingerprint:=md5(p_feedback::text); SELECT * INTO prior FROM bridge.provider_operational_feedback_event WHERE feedback_id=v_feedback_id;
  IF FOUND THEN IF prior.reservation_id<>reservation.reservation_id OR prior.payload_fingerprint<>fingerprint THEN RAISE EXCEPTION 'operational feedback identity conflicts with prior payload'; END IF; RETURN jsonb_build_object('status','duplicate','reservationId',reservation.reservation_id); END IF;
  IF EXISTS(SELECT 1 FROM bridge.provider_operational_feedback_event WHERE reservation_id=reservation.reservation_id) THEN RAISE EXCEPTION 'reservation already has a terminal operational feedback event'; END IF;
  usage:=p_feedback->'usage';
  IF usage IS NOT NULL AND (jsonb_typeof(usage)<>'object' OR EXISTS(SELECT 1 FROM jsonb_each(usage) e WHERE e.key NOT IN ('rpm','tpm','rpd') OR jsonb_typeof(e.value)<>'number' OR (e.value::text)::numeric<0)) THEN RAISE EXCEPTION 'operational usage is invalid'; END IF;
  INSERT INTO bridge.provider_operational_feedback_event(feedback_id,reservation_id,payload_fingerprint,transport_disposition,normalized_feedback) VALUES(v_feedback_id,reservation.reservation_id,fingerprint,disposition,p_feedback);
  IF disposition='definitely_not_sent' THEN
    IF EXISTS(SELECT 1 FROM bridge.provider_transport_claim WHERE reservation_id=reservation.reservation_id) THEN RAISE EXCEPTION 'a claimed transport cannot be downgraded to definitely not sent'; END IF;
    UPDATE bridge.provider_work_reservation SET state='released',released_at=now() WHERE reservation_id=reservation.reservation_id AND state='live';
    UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason='definitely_untransmitted',state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
    RETURN jsonb_build_object('status','released_untransmitted','reservationId',reservation.reservation_id);
  END IF;
  profile_version:=binding.provider_capacity_profile_version;
  FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
    held:=COALESCE((reservation.request_resource_envelope->>dimension)::numeric,0); units:=CASE WHEN usage ? dimension THEN (usage->>dimension)::numeric ELSE held END;
    INSERT INTO bridge.provider_window_usage_ledger(reservation_id,quota_domain_id,provider_capacity_profile_version,dimension_id,window_identity,held_units,spent_units,deficit_units,state) VALUES(reservation.reservation_id,work.quota_domain_id,profile_version,dimension,work.desired_profile_version||':'||dimension,CASE WHEN usage ? dimension THEN 0 ELSE held END,CASE WHEN dimension='concurrency' AND disposition='terminal_confirmed' THEN 0 ELSE units END,GREATEST(0,units-held),CASE WHEN disposition='terminal_confirmed' AND (usage ? dimension OR dimension='concurrency') THEN 'settled' ELSE 'held_unknown' END);
  END LOOP;
  UPDATE bridge.provider_work_reservation SET state=CASE WHEN disposition='terminal_confirmed' THEN 'released' ELSE 'consumed_unknown' END,released_at=now() WHERE reservation_id=reservation.reservation_id AND state='live';
  UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason=CASE WHEN disposition='terminal_confirmed' THEN 'reconciled_operational_feedback' ELSE 'transport_completion_unknown' END,state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  RETURN jsonb_build_object('status',CASE WHEN disposition='terminal_confirmed' THEN 'reconciled' ELSE 'unknown_held' END,'reservationId',reservation.reservation_id);
END;
$$;

ALTER FUNCTION bridge.ingest_provider_operational_feedback(jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.ingest_provider_operational_feedback(jsonb) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.ingest_provider_operational_feedback(jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0041_bssv200603a_feedback_function_forward_replacement') ON CONFLICT DO NOTHING;
