-- BSS-V2-006-04-03 projects the approved 03A feedback/accounting/pressure
-- engine through ProviderWorkAdmission/v1.  It adds bounded operational
-- meaning only: no provider body, semantic qualification, or automatic retry.
CREATE OR REPLACE FUNCTION bridge.validate_provider_operational_feedback_event()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE observed_at timestamptz; reservation_created_at timestamptz;
BEGIN
  IF NEW.normalized_feedback->>'observationSource' <> 'qualified_adapter'
    OR NEW.normalized_feedback->>'observationTrust' <> 'qualified' THEN
    RAISE EXCEPTION 'operational feedback source is not qualified';
  END IF;
  IF NEW.normalized_feedback->>'observedAt' IS NULL THEN RAISE EXCEPTION 'operational feedback freshness is missing'; END IF;
  BEGIN observed_at := (NEW.normalized_feedback->>'observedAt')::timestamptz;
  EXCEPTION WHEN others THEN RAISE EXCEPTION 'operational feedback freshness is invalid'; END;
  IF observed_at > clock_timestamp() THEN RAISE EXCEPTION 'operational feedback observation is in the future'; END IF;
  SELECT created_at INTO reservation_created_at FROM bridge.provider_work_reservation WHERE reservation_id=NEW.reservation_id;
  IF reservation_created_at IS NULL OR observed_at < reservation_created_at THEN RAISE EXCEPTION 'operational feedback observation is stale'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(NEW.normalized_feedback) key WHERE key NOT IN (
    'feedbackId','reservationId','attemptId','routeId','quotaDomainId','desiredProfileVersion','qualificationVersion',
    'observationSource','observationTrust','observedAt','transportDisposition','operationalOutcome','retryAfterSeconds','usage'
  )) THEN RAISE EXCEPTION 'operational feedback contains an unsupported field'; END IF;
  IF NEW.normalized_feedback ? 'operationalOutcome'
    AND NEW.normalized_feedback->>'operationalOutcome' NOT IN ('success','provider_failure','rate_limited') THEN
    RAISE EXCEPTION 'operational feedback outcome is invalid';
  END IF;
  IF NEW.normalized_feedback ? 'retryAfterSeconds' AND (
    NEW.normalized_feedback->>'operationalOutcome' <> 'rate_limited'
    OR jsonb_typeof(NEW.normalized_feedback->'retryAfterSeconds') <> 'number'
    OR (NEW.normalized_feedback->>'retryAfterSeconds')::numeric <= 0
    OR (NEW.normalized_feedback->>'retryAfterSeconds')::numeric <> trunc((NEW.normalized_feedback->>'retryAfterSeconds')::numeric)
  ) THEN RAISE EXCEPTION 'operational feedback retry-after is invalid'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.ingest_provider_operational_feedback(p_feedback jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE reservation bridge.provider_work_reservation; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding; prior bridge.provider_operational_feedback_event;
  v_feedback_id text; disposition text; fingerprint text; usage jsonb; dimension text; actual numeric; result_kind text;
BEGIN
  IF jsonb_typeof(p_feedback) <> 'object' OR p_feedback ?| ARRAY['raw','headers','body','prompt','source','credential','authorization','secret','token'] THEN RAISE EXCEPTION 'operational feedback must be bounded and redacted'; END IF;
  v_feedback_id:=p_feedback->>'feedbackId'; disposition:=p_feedback->>'transportDisposition'; result_kind:=p_feedback->>'operationalOutcome';
  IF v_feedback_id IS NULL OR disposition NOT IN ('definitely_not_sent','may_have_started','terminal_confirmed') OR (p_feedback->>'reservationId') IS NULL THEN RAISE EXCEPTION 'operational feedback identity is invalid'; END IF;
  SELECT * INTO reservation FROM bridge.provider_work_reservation WHERE reservation_id=(p_feedback->>'reservationId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'operational feedback reservation is unknown'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=reservation.logical_work_id AND attempt_number=reservation.attempt_number FOR UPDATE;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  IF NOT FOUND OR p_feedback->>'routeId' IS DISTINCT FROM binding.selected_route_id OR p_feedback->>'quotaDomainId' IS DISTINCT FROM work.quota_domain_id OR p_feedback->>'desiredProfileVersion' IS DISTINCT FROM work.desired_profile_version OR p_feedback->>'qualificationVersion' IS DISTINCT FROM binding.qualification_version OR p_feedback->>'attemptId' IS DISTINCT FROM work.logical_work_id||':'||work.attempt_number::text THEN RAISE EXCEPTION 'operational feedback route, domain, plan, qualification, or attempt identity is invalid'; END IF;
  fingerprint:=md5(p_feedback::text); SELECT * INTO prior FROM bridge.provider_operational_feedback_event WHERE feedback_id=v_feedback_id;
  IF FOUND THEN IF prior.reservation_id<>reservation.reservation_id OR prior.payload_fingerprint<>fingerprint THEN RAISE EXCEPTION 'operational feedback identity conflicts with prior payload'; END IF; RETURN jsonb_build_object('status','duplicate','reservationId',reservation.reservation_id); END IF;
  IF EXISTS(SELECT 1 FROM bridge.provider_operational_feedback_event WHERE reservation_id=reservation.reservation_id) THEN RAISE EXCEPTION 'reservation already has a terminal operational feedback event'; END IF;
  usage:=p_feedback->'usage';
  IF usage IS NOT NULL AND (jsonb_typeof(usage)<>'object' OR EXISTS(SELECT 1 FROM jsonb_each(usage) e WHERE e.key NOT IN ('rpm','tpm','rpd') OR jsonb_typeof(e.value)<>'number' OR (e.value::text)::numeric<0)) THEN RAISE EXCEPTION 'operational usage is invalid'; END IF;
  INSERT INTO bridge.provider_operational_feedback_event(feedback_id,reservation_id,payload_fingerprint,transport_disposition,normalized_feedback) VALUES(v_feedback_id,reservation.reservation_id,fingerprint,disposition,p_feedback);
  IF disposition='definitely_not_sent' THEN
    IF EXISTS(SELECT 1 FROM bridge.provider_transport_claim WHERE reservation_id=reservation.reservation_id) THEN RAISE EXCEPTION 'a claimed transport cannot be downgraded to definitely not sent'; END IF;
    UPDATE bridge.provider_window_usage_ledger SET held_units=0,state='released' WHERE reservation_id=reservation.reservation_id;
    UPDATE bridge.provider_work_reservation SET state='released',released_at=clock_timestamp() WHERE reservation_id=reservation.reservation_id AND state='live';
    UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason='definitely_untransmitted',state_version=state_version+1,updated_at=clock_timestamp() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
    RETURN jsonb_build_object('status','released_untransmitted','reservationId',reservation.reservation_id);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM bridge.provider_window_usage_ledger WHERE reservation_id=reservation.reservation_id) THEN PERFORM bridge.reserve_provider_operational_windows(reservation.reservation_id); END IF;
  FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
    IF disposition='terminal_confirmed' AND dimension='concurrency' THEN UPDATE bridge.provider_window_usage_ledger SET held_units=0,spent_units=0,state='settled' WHERE reservation_id=reservation.reservation_id AND dimension_id=dimension;
    ELSIF dimension IN ('rpm','rpd') THEN UPDATE bridge.provider_window_usage_ledger SET spent_units=GREATEST(held_units,1),held_units=0,state=CASE WHEN disposition='terminal_confirmed' THEN 'settled' ELSE 'held_unknown' END WHERE reservation_id=reservation.reservation_id AND dimension_id=dimension;
    ELSIF dimension='tpm' AND disposition='terminal_confirmed' AND usage ? dimension THEN actual:=(usage->>dimension)::numeric; UPDATE bridge.provider_window_usage_ledger SET deficit_units=GREATEST(0,actual-held_units),spent_units=actual,held_units=0,state='settled' WHERE reservation_id=reservation.reservation_id AND dimension_id=dimension;
    END IF;
  END LOOP;
  IF result_kind='rate_limited' THEN
    PERFORM bridge.record_provider_429_pressure(work.quota_domain_id,binding.selected_route_id,v_feedback_id,(p_feedback->>'retryAfterSeconds')::numeric,'route','qualified');
  END IF;
  UPDATE bridge.provider_work_reservation SET state=CASE WHEN disposition='terminal_confirmed' THEN 'released' ELSE 'consumed_unknown' END,released_at=clock_timestamp() WHERE reservation_id=reservation.reservation_id AND state='live';
  UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason=CASE WHEN disposition='terminal_confirmed' AND result_kind='success' THEN 'reconciled_operational_success' WHEN result_kind='rate_limited' THEN 'provider_rate_limited' WHEN disposition='terminal_confirmed' THEN 'reconciled_provider_failure' ELSE 'transport_completion_unknown' END,state_version=state_version+1,updated_at=clock_timestamp() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  RETURN jsonb_build_object('status',CASE WHEN result_kind='rate_limited' THEN 'pressure_limited' WHEN disposition='terminal_confirmed' THEN 'reconciled' ELSE 'unknown_held' END,'reservationId',reservation.reservation_id);
END;
$$;

CREATE OR REPLACE FUNCTION bridge.provider_work_admission_v1_outcome(p_logical_work_id text, p_attempt_number integer)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state', CASE
    WHEN work.state='waiting' THEN 'waiting'
    WHEN work.state='reserved' THEN 'reserved'
    WHEN work.state IN ('dispatched','transport_may_have_started') THEN 'dispatched_or_may_have_started'
    WHEN work.state='terminal' THEN 'terminal_cancelled'
    WHEN feedback.transport_disposition='may_have_started' THEN 'dispatched_or_may_have_started'
    WHEN feedback.normalized_feedback->>'operationalOutcome'='success' THEN 'terminal_success'
    WHEN feedback.normalized_feedback->>'operationalOutcome'='rate_limited' THEN 'pressure_limited'
    ELSE 'terminal_provider_failure' END,
    'logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id,'jobId',dispatch.job_id))
  FROM bridge.provider_work_attempt work
  LEFT JOIN bridge.provider_work_reservation reservation ON reservation.logical_work_id=work.logical_work_id AND reservation.attempt_number=work.attempt_number
  LEFT JOIN bridge.provider_work_dispatch dispatch ON dispatch.reservation_id=reservation.reservation_id
  LEFT JOIN bridge.provider_operational_feedback_event feedback ON feedback.reservation_id=reservation.reservation_id
  WHERE work.logical_work_id=p_logical_work_id AND work.attempt_number=p_attempt_number ORDER BY reservation.created_at DESC NULLS LAST LIMIT 1
$$;

CREATE OR REPLACE FUNCTION bridge.read_provider_work_admission_v1_outcome(p_principal_id text, p_logical_work_id text, p_attempt_number integer)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN EXISTS (SELECT 1 FROM bridge.provider_work_admission_v1 a WHERE a.logical_work_id=p_logical_work_id AND a.attempt_number=p_attempt_number AND a.principal_id=p_principal_id)
    THEN COALESCE(bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number),jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit'))
    ELSE jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit') END
$$;

ALTER FUNCTION bridge.validate_provider_operational_feedback_event() OWNER TO agents_bridge;
ALTER FUNCTION bridge.ingest_provider_operational_feedback(jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.provider_work_admission_v1_outcome(text,integer) OWNER TO agents_bridge;
ALTER FUNCTION bridge.read_provider_work_admission_v1_outcome(text,text,integer) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.read_provider_work_admission_v1_outcome(text,text,integer) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.read_provider_work_admission_v1_outcome(text,text,integer) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0071_bssv20060403_operational_outcome_feedback_projection') ON CONFLICT DO NOTHING;
