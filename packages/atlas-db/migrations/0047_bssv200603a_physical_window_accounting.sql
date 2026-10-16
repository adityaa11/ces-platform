-- BSS-V2-006-03A: physical-window accounting.  Charges belong to a canonical
-- quota domain/window, never to a route or a desired-plan revision.

CREATE TABLE IF NOT EXISTS bridge.provider_window_usage_ledger (
  reservation_id uuid NOT NULL REFERENCES bridge.provider_work_reservation(reservation_id) ON DELETE RESTRICT,
  quota_domain_id text NOT NULL CHECK (length(trim(quota_domain_id)) > 0),
  provider_capacity_profile_version text NOT NULL CHECK (length(trim(provider_capacity_profile_version)) > 0),
  dimension_id text NOT NULL CHECK (dimension_id IN ('rpm','tpm','rpd','concurrency')),
  window_identity text NOT NULL CHECK (length(trim(window_identity)) > 0),
  window_starts_at timestamptz NOT NULL,
  window_ends_at timestamptz NOT NULL CHECK (window_ends_at > window_starts_at),
  window_policy jsonb NOT NULL CHECK (jsonb_typeof(window_policy) = 'object'),
  held_units numeric NOT NULL DEFAULT 0 CHECK (held_units >= 0),
  spent_units numeric NOT NULL DEFAULT 0 CHECK (spent_units >= 0),
  deficit_units numeric NOT NULL DEFAULT 0 CHECK (deficit_units >= 0),
  state text NOT NULL CHECK (state IN ('held_unknown','settled','released')),
  PRIMARY KEY (reservation_id, dimension_id, window_identity)
);

CREATE INDEX IF NOT EXISTS provider_window_usage_ledger_domain_window_idx
  ON bridge.provider_window_usage_ledger(quota_domain_id, dimension_id, window_ends_at);

CREATE OR REPLACE FUNCTION bridge.reserve_provider_operational_windows(p_reservation_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE reservation bridge.provider_work_reservation; work bridge.provider_work_attempt;
  binding bridge.provider_work_route_binding; active record; capacity bridge.provider_capacity_profile;
  dimension text; policy jsonb; seconds numeric; starts_at timestamptz; ends_at timestamptz; identity text; held numeric;
BEGIN
  SELECT * INTO reservation FROM bridge.provider_work_reservation WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation is missing'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=reservation.logical_work_id AND attempt_number=reservation.attempt_number;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation has no immutable selected route'; END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR active.desired_profile_version<>work.desired_profile_version OR active.activation_revision<>work.activation_revision THEN
    RAISE EXCEPTION 'provider reservation is not attributable to the active desired admission revision';
  END IF;
  SELECT * INTO capacity FROM bridge.provider_capacity_profile WHERE quota_domain_id=work.quota_domain_id AND profile_version=binding.provider_capacity_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation capacity policy is missing'; END IF;
  FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
    policy:=capacity.window_policies->dimension;
    IF jsonb_typeof(policy)<>'object' OR policy->>'kind'<>'fixed' OR jsonb_typeof(policy->'windowSeconds')<>'number' THEN
      RAISE EXCEPTION 'provider window policy is not a qualified fixed boundary for %',dimension;
    END IF;
    seconds:=(policy->>'windowSeconds')::numeric;
    IF seconds<=0 OR seconds<>trunc(seconds) THEN RAISE EXCEPTION 'provider window policy has an invalid fixed boundary'; END IF;
    starts_at:=to_timestamp(floor(extract(epoch FROM clock_timestamp())/seconds)*seconds);
    ends_at:=starts_at+make_interval(secs=>seconds::integer);
    identity:=work.quota_domain_id||':'||dimension||':'||md5(policy::text)||':'||extract(epoch FROM starts_at)::bigint;
    held:=COALESCE((reservation.request_resource_envelope->>dimension)::numeric,0);
    INSERT INTO bridge.provider_window_usage_ledger(reservation_id,quota_domain_id,provider_capacity_profile_version,dimension_id,window_identity,window_starts_at,window_ends_at,window_policy,held_units,spent_units,deficit_units,state)
      VALUES(reservation.reservation_id,work.quota_domain_id,binding.provider_capacity_profile_version,dimension,identity,starts_at,ends_at,policy,held,0,0,'held_unknown')
    ON CONFLICT(reservation_id,dimension_id,window_identity) DO NOTHING;
  END LOOP;
END;
$$;

-- Return all non-expired physical liabilities.  A plan revision cannot make
-- an old liability disappear: incompatible active policy is deliberately a
-- closed admission result, not a conversion to a fresh plan ledger.
CREATE OR REPLACE FUNCTION bridge.current_provider_operational_usage(p_quota_domain_id text, p_capacity_profile_version text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE capacity bridge.provider_capacity_profile; dimension text; policy jsonb; mismatch boolean;
BEGIN
  SELECT * INTO capacity FROM bridge.provider_capacity_profile WHERE quota_domain_id=p_quota_domain_id AND profile_version=p_capacity_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'active provider capacity policy is missing'; END IF;
  FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
    policy:=capacity.window_policies->dimension;
    IF jsonb_typeof(policy)<>'object' OR policy->>'kind'<>'fixed' OR jsonb_typeof(policy->'windowSeconds')<>'number' THEN
      RAISE EXCEPTION 'active provider window policy is not qualified';
    END IF;
    SELECT EXISTS(SELECT 1 FROM bridge.provider_window_usage_ledger l WHERE l.quota_domain_id=p_quota_domain_id AND l.dimension_id=dimension AND l.window_ends_at>clock_timestamp() AND l.window_policy IS DISTINCT FROM policy) INTO mismatch;
    IF mismatch THEN RAISE EXCEPTION 'nonexpired provider liability has an incompatible window policy'; END IF;
  END LOOP;
  RETURN jsonb_build_object(
    'rpm',COALESCE((SELECT sum(GREATEST(held_units,spent_units)) FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=p_quota_domain_id AND dimension_id='rpm' AND window_ends_at>clock_timestamp()),0),
    'tpm',COALESCE((SELECT sum(GREATEST(held_units,spent_units)) FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=p_quota_domain_id AND dimension_id='tpm' AND window_ends_at>clock_timestamp()),0),
    'rpd',COALESCE((SELECT sum(GREATEST(held_units,spent_units)) FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=p_quota_domain_id AND dimension_id='rpd' AND window_ends_at>clock_timestamp()),0),
    'concurrency',COALESCE((SELECT sum(GREATEST(held_units,spent_units)) FROM bridge.provider_window_usage_ledger WHERE quota_domain_id=p_quota_domain_id AND dimension_id='concurrency' AND window_ends_at>clock_timestamp()),0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION bridge.ingest_provider_operational_feedback(p_feedback jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE reservation bridge.provider_work_reservation; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding; prior bridge.provider_operational_feedback_event;
  v_feedback_id text; disposition text; fingerprint text; usage jsonb; dimension text; actual numeric;
BEGIN
  IF jsonb_typeof(p_feedback) <> 'object' OR p_feedback ?| ARRAY['raw','headers','body','prompt','source','credential','authorization','secret','token'] THEN RAISE EXCEPTION 'operational feedback must be bounded and redacted'; END IF;
  v_feedback_id:=p_feedback->>'feedbackId'; disposition:=p_feedback->>'transportDisposition';
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
    UPDATE bridge.provider_work_reservation SET state='released',released_at=now() WHERE reservation_id=reservation.reservation_id AND state='live';
    UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason='definitely_untransmitted',state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
    RETURN jsonb_build_object('status','released_untransmitted','reservationId',reservation.reservation_id);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM bridge.provider_window_usage_ledger WHERE reservation_id=reservation.reservation_id) THEN PERFORM bridge.reserve_provider_operational_windows(reservation.reservation_id); END IF;
  FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
    IF disposition='terminal_confirmed' AND dimension='concurrency' THEN
      UPDATE bridge.provider_window_usage_ledger SET held_units=0,spent_units=0,state='settled' WHERE reservation_id=reservation.reservation_id AND dimension_id=dimension;
    ELSIF dimension IN ('rpm','rpd') THEN
      UPDATE bridge.provider_window_usage_ledger SET spent_units=GREATEST(held_units,1),held_units=0,state=CASE WHEN disposition='terminal_confirmed' THEN 'settled' ELSE 'held_unknown' END WHERE reservation_id=reservation.reservation_id AND dimension_id=dimension;
    ELSIF dimension='tpm' AND disposition='terminal_confirmed' AND usage ? dimension THEN
      actual:=(usage->>dimension)::numeric;
      UPDATE bridge.provider_window_usage_ledger SET deficit_units=GREATEST(0,actual-held_units),spent_units=actual,held_units=0,state='settled' WHERE reservation_id=reservation.reservation_id AND dimension_id=dimension;
    END IF;
  END LOOP;
  UPDATE bridge.provider_work_reservation SET state=CASE WHEN disposition='terminal_confirmed' THEN 'released' ELSE 'consumed_unknown' END,released_at=now() WHERE reservation_id=reservation.reservation_id AND state='live';
  UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason=CASE WHEN disposition='terminal_confirmed' THEN 'reconciled_operational_feedback' ELSE 'transport_completion_unknown' END,state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  RETURN jsonb_build_object('status',CASE WHEN disposition='terminal_confirmed' THEN 'reconciled' ELSE 'unknown_held' END,'reservationId',reservation.reservation_id);
END;
$$;

ALTER FUNCTION bridge.reserve_provider_operational_windows(uuid) OWNER TO agents_bridge;
ALTER FUNCTION bridge.current_provider_operational_usage(text,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.ingest_provider_operational_feedback(jsonb) OWNER TO agents_bridge;
ALTER TABLE bridge.provider_window_usage_ledger OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_window_usage_ledger FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.reserve_provider_operational_windows(uuid),bridge.current_provider_operational_usage(text,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.reserve_provider_operational_windows(uuid),bridge.current_provider_operational_usage(text,text),bridge.ingest_provider_operational_feedback(jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0047_bssv200603a_physical_window_accounting') ON CONFLICT DO NOTHING;
