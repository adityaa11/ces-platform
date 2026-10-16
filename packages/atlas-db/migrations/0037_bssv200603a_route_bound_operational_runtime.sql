-- BSS-V2-006-03A: Bridge-owned route binding, admitted transport fence and
-- normalized operational feedback. This adds no consumer-facing API.

CREATE TABLE IF NOT EXISTS bridge.provider_work_route_binding (
  logical_work_id text NOT NULL, attempt_number integer NOT NULL,
  selected_route_id text NOT NULL CHECK (length(trim(selected_route_id)) > 0),
  capability text NOT NULL CHECK (length(trim(capability)) > 0),
  adapter_version text NOT NULL CHECK (length(trim(adapter_version)) > 0),
  qualification_version text NOT NULL CHECK (length(trim(qualification_version)) > 0),
  provider_capacity_profile_version text NOT NULL CHECK (length(trim(provider_capacity_profile_version)) > 0),
  bound_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (logical_work_id, attempt_number),
  FOREIGN KEY (logical_work_id, attempt_number) REFERENCES bridge.provider_work_attempt(logical_work_id, attempt_number) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS bridge.provider_transport_claim (
  reservation_id uuid PRIMARY KEY REFERENCES bridge.provider_work_reservation(reservation_id) ON DELETE RESTRICT,
  logical_work_id text NOT NULL, attempt_number integer NOT NULL, claimed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (logical_work_id, attempt_number) REFERENCES bridge.provider_work_attempt(logical_work_id, attempt_number) ON DELETE RESTRICT,
  UNIQUE (logical_work_id, attempt_number)
);
CREATE TABLE IF NOT EXISTS bridge.provider_operational_feedback_event (
  feedback_id text PRIMARY KEY CHECK (length(trim(feedback_id)) > 0),
  reservation_id uuid NOT NULL REFERENCES bridge.provider_work_reservation(reservation_id) ON DELETE RESTRICT,
  payload_fingerprint text NOT NULL CHECK (length(payload_fingerprint) = 32),
  transport_disposition text NOT NULL CHECK (transport_disposition IN ('definitely_not_sent', 'may_have_started', 'terminal_confirmed')),
  normalized_feedback jsonb NOT NULL CHECK (jsonb_typeof(normalized_feedback) = 'object'), received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id)
);
-- Exact physical-window settlement is deliberately owned by 03A-02.  This
-- slice persists only the redacted terminal envelope that its successor uses.

CREATE OR REPLACE FUNCTION bridge.bind_provider_work_route(p_logical_work_id text, p_attempt_number integer, p_selected_route_id text, p_capability text, p_adapter_version text, p_qualification_version text)
RETURNS bridge.provider_work_route_binding LANGUAGE plpgsql AS $$
DECLARE work bridge.provider_work_attempt; active record; binding bridge.provider_work_route_binding;
BEGIN
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND OR work.state <> 'waiting' THEN RAISE EXCEPTION 'only a waiting provider work attempt may bind a selected route'; END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR active.desired_profile_version <> work.desired_profile_version OR active.activation_revision <> work.activation_revision THEN RAISE EXCEPTION 'provider work is not bound to the active admission revision'; END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.provider_process_profile p WHERE p.process_id=work.process_id AND p.profile_version=work.process_profile_version AND p.capability=p_capability AND p.eligible_route_ids @> jsonb_build_array(p_selected_route_id)) THEN RAISE EXCEPTION 'selected route is not eligible for the server-authorized provider process'; END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.provider_capacity_profile c, jsonb_array_elements(c.associated_routes) r WHERE c.quota_domain_id=work.quota_domain_id AND c.profile_version=active.provider_capacity_profile_version AND (r #>> '{}'=p_selected_route_id OR r->>'routeId'=p_selected_route_id)) THEN RAISE EXCEPTION 'selected route is not associated with the canonical quota domain'; END IF;
  INSERT INTO bridge.provider_work_route_binding(logical_work_id,attempt_number,selected_route_id,capability,adapter_version,qualification_version,provider_capacity_profile_version)
    VALUES(p_logical_work_id,p_attempt_number,p_selected_route_id,p_capability,p_adapter_version,p_qualification_version,active.provider_capacity_profile_version)
  ON CONFLICT(logical_work_id,attempt_number) DO NOTHING RETURNING * INTO binding;
  IF NOT FOUND THEN
    SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    IF binding.selected_route_id<>p_selected_route_id OR binding.capability<>p_capability OR binding.adapter_version<>p_adapter_version OR binding.qualification_version<>p_qualification_version THEN RAISE EXCEPTION 'selected route binding conflicts with immutable attempt identity'; END IF;
  END IF;
  RETURN binding;
END;
$$;

-- Both 006-02 admission functions insert a reservation before their pg-boss
-- job.  Enforce the route fence at that shared durable boundary so an
-- unbound, forged, or contradictory route can never create either artifact.
CREATE OR REPLACE FUNCTION bridge.require_provider_work_route_before_reservation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bridge.provider_work_route_binding
    WHERE logical_work_id=NEW.logical_work_id AND attempt_number=NEW.attempt_number
  ) THEN
    RAISE EXCEPTION 'provider work requires a server-qualified route binding before reservation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_work_route_before_reservation ON bridge.provider_work_reservation;
CREATE TRIGGER provider_work_route_before_reservation
  BEFORE INSERT ON bridge.provider_work_reservation
  FOR EACH ROW EXECUTE FUNCTION bridge.require_provider_work_route_before_reservation();

CREATE OR REPLACE FUNCTION bridge.claim_provider_admitted_transport(p_reservation_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE dispatch bridge.provider_work_dispatch; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding;
BEGIN
  SELECT * INTO dispatch FROM bridge.provider_work_dispatch WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'admitted provider dispatch is missing'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=dispatch.logical_work_id AND attempt_number=dispatch.attempt_number FOR UPDATE;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=dispatch.logical_work_id AND attempt_number=dispatch.attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'admitted provider dispatch has no immutable selected route'; END IF;
  INSERT INTO bridge.provider_transport_claim(reservation_id,logical_work_id,attempt_number) VALUES(p_reservation_id,dispatch.logical_work_id,dispatch.attempt_number) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation already authorized an outbound attempt'; END IF;
  UPDATE bridge.provider_work_attempt SET state='transport_may_have_started',state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number AND state='dispatched' AND cancellation_requested_at IS NULL AND (execution_deadline_at IS NULL OR execution_deadline_at>now());
  IF NOT FOUND THEN RAISE EXCEPTION 'dispatched provider work is stale, cancelled, or expired'; END IF;
  UPDATE bridge.provider_work_dispatch SET transport_claimed_at=now() WHERE reservation_id=p_reservation_id AND transport_claimed_at IS NULL;
  RETURN jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',p_reservation_id,'routeId',binding.selected_route_id,'capability',binding.capability,'adapterVersion',binding.adapter_version,'qualificationVersion',binding.qualification_version,'quotaDomainId',work.quota_domain_id,'desiredProfileVersion',work.desired_profile_version);
END;
$$;

CREATE OR REPLACE FUNCTION bridge.ingest_provider_operational_feedback(p_feedback jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE reservation bridge.provider_work_reservation; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding; prior bridge.provider_operational_feedback_event;
  v_feedback_id text; disposition text; fingerprint text; usage jsonb;
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
  UPDATE bridge.provider_work_reservation SET state=CASE WHEN disposition='terminal_confirmed' THEN 'released' ELSE 'consumed_unknown' END,released_at=now() WHERE reservation_id=reservation.reservation_id AND state='live';
  UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason=CASE WHEN disposition='terminal_confirmed' THEN 'reconciled_operational_feedback' ELSE 'transport_completion_unknown' END,state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  RETURN jsonb_build_object('status',CASE WHEN disposition='terminal_confirmed' THEN 'reconciled' ELSE 'unknown_held' END,'reservationId',reservation.reservation_id);
END;
$$;

ALTER TABLE bridge.provider_work_route_binding OWNER TO agents_bridge;
ALTER TABLE bridge.provider_transport_claim OWNER TO agents_bridge;
ALTER TABLE bridge.provider_operational_feedback_event OWNER TO agents_bridge;

CREATE OR REPLACE FUNCTION bridge.validate_provider_operational_feedback_event()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE observed_at timestamptz; reservation_created_at timestamptz;
BEGIN
  IF NEW.normalized_feedback->>'observationSource' <> 'qualified_adapter'
    OR NEW.normalized_feedback->>'observationTrust' <> 'qualified' THEN
    RAISE EXCEPTION 'operational feedback source is not qualified';
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

DROP TRIGGER IF EXISTS provider_operational_feedback_event_valid ON bridge.provider_operational_feedback_event;
CREATE TRIGGER provider_operational_feedback_event_valid
  BEFORE INSERT ON bridge.provider_operational_feedback_event
  FOR EACH ROW EXECUTE FUNCTION bridge.validate_provider_operational_feedback_event();

ALTER FUNCTION bridge.validate_provider_operational_feedback_event() OWNER TO agents_bridge;
ALTER FUNCTION bridge.bind_provider_work_route(text,integer,text,text,text,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.claim_provider_admitted_transport(uuid) OWNER TO agents_bridge;
ALTER FUNCTION bridge.ingest_provider_operational_feedback(jsonb) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_work_route_binding,bridge.provider_transport_claim,bridge.provider_operational_feedback_event FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.bind_provider_work_route(text,integer,text,text,text,text),bridge.claim_provider_admitted_transport(uuid),bridge.ingest_provider_operational_feedback(jsonb),bridge.require_provider_work_route_before_reservation(),bridge.validate_provider_operational_feedback_event() FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.bind_provider_work_route(text,integer,text,text,text,text),bridge.claim_provider_admitted_transport(uuid),bridge.ingest_provider_operational_feedback(jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0037_bssv200603a_route_bound_operational_runtime') ON CONFLICT DO NOTHING;
