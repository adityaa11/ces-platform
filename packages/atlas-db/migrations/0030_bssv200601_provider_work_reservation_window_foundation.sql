-- BSS-V2-006-01: Bridge-owned durable provider-work foundation.
-- This migration intentionally contains no admission ordering, provider transport,
-- or background broker. pg-boss remains the sole job broker.

CREATE TABLE IF NOT EXISTS bridge.provider_work_attempt (
  logical_work_id text NOT NULL CHECK (length(trim(logical_work_id)) > 0),
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  quota_domain_id text NOT NULL CHECK (length(trim(quota_domain_id)) > 0),
  process_id text NOT NULL CHECK (length(trim(process_id)) > 0),
  process_profile_version text NOT NULL CHECK (length(trim(process_profile_version)) > 0),
  fairness_key text NOT NULL CHECK (length(trim(fairness_key)) > 0),
  service_class text NOT NULL CHECK (service_class IN ('interactive', 'background')),
  request_resource_envelope jsonb NOT NULL CHECK (jsonb_typeof(request_resource_envelope) = 'object'),
  desired_profile_version text NOT NULL CHECK (length(trim(desired_profile_version)) > 0),
  activation_revision bigint NOT NULL CHECK (activation_revision > 0),
  state text NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting', 'reserved', 'transport_may_have_started', 'terminal', 'reconciled')),
  admission_deadline_at timestamptz,
  execution_deadline_at timestamptz,
  cancellation_requested_at timestamptz,
  terminal_reason text,
  state_version bigint NOT NULL DEFAULT 1 CHECK (state_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (logical_work_id, attempt_number),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile (quota_domain_id, profile_version) ON DELETE RESTRICT,
  FOREIGN KEY (process_id, process_profile_version)
    REFERENCES bridge.provider_process_profile (process_id, profile_version) ON DELETE RESTRICT,
  CHECK ((service_class <> 'interactive') OR admission_deadline_at IS NOT NULL),
  CHECK ((state <> 'terminal') OR terminal_reason IS NOT NULL)
);

-- One row can authorize at most one still-live reservation. Historical rows
-- remain attributable to their exact plan even after a later plan cutover.
CREATE TABLE IF NOT EXISTS bridge.provider_work_reservation (
  reservation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logical_work_id text NOT NULL,
  attempt_number integer NOT NULL,
  desired_profile_version text NOT NULL,
  activation_revision bigint NOT NULL CHECK (activation_revision > 0),
  request_resource_envelope jsonb NOT NULL CHECK (jsonb_typeof(request_resource_envelope) = 'object'),
  state text NOT NULL DEFAULT 'live' CHECK (state IN ('live', 'released', 'consumed_unknown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  FOREIGN KEY (logical_work_id, attempt_number)
    REFERENCES bridge.provider_work_attempt (logical_work_id, attempt_number) ON DELETE RESTRICT,
  CHECK ((state = 'live' AND released_at IS NULL) OR (state <> 'live' AND released_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS provider_work_reservation_one_live_attempt
  ON bridge.provider_work_reservation (logical_work_id, attempt_number) WHERE state = 'live';

-- Runtime quota state preserves the exact policy identity selected by the
-- active DesiredAdmissionProfile. It stores observed state only; it does not
-- infer a refill when reset semantics are unknown.
CREATE TABLE IF NOT EXISTS bridge.provider_quota_window_state (
  quota_domain_id text NOT NULL,
  desired_profile_version text NOT NULL,
  activation_revision bigint NOT NULL CHECK (activation_revision > 0),
  provider_capacity_profile_version text NOT NULL,
  dimension_id text NOT NULL CHECK (length(trim(dimension_id)) > 0),
  window_policy_identity jsonb NOT NULL CHECK (jsonb_typeof(window_policy_identity) = 'object'),
  window_state jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(window_state) = 'object'),
  in_flight_count integer NOT NULL DEFAULT 0 CHECK (in_flight_count >= 0),
  cooldown_until timestamptz,
  reset_at timestamptz,
  reset_semantics_known boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quota_domain_id, desired_profile_version, activation_revision, dimension_id),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile (quota_domain_id, profile_version) ON DELETE RESTRICT,
  CHECK (reset_semantics_known OR reset_at IS NULL)
);

-- This is a durable deduplication intent, not another scheduler or broker.
-- A Bridge worker attaches it to the existing pg-boss queue with the same key.
CREATE TABLE IF NOT EXISTS bridge.provider_work_wakeup_request (
  quota_domain_id text NOT NULL,
  wakeup_key text NOT NULL CHECK (length(trim(wakeup_key)) > 0),
  requested_for timestamptz NOT NULL,
  desired_profile_version text,
  activation_revision bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quota_domain_id, wakeup_key),
  CHECK ((desired_profile_version IS NULL AND activation_revision IS NULL) OR (desired_profile_version IS NOT NULL AND activation_revision IS NOT NULL))
);

CREATE OR REPLACE FUNCTION bridge.register_provider_work_attempt(
  p_logical_work_id text, p_attempt_number integer, p_quota_domain_id text,
  p_process_id text, p_process_profile_version text, p_fairness_key text,
  p_request_resource_envelope jsonb, p_desired_profile_version text,
  p_activation_revision bigint, p_admission_deadline_at timestamptz DEFAULT NULL,
  p_execution_deadline_at timestamptz DEFAULT NULL
) RETURNS bridge.provider_work_attempt LANGUAGE plpgsql AS $$
DECLARE registered bridge.provider_work_attempt;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id) active
    WHERE active.desired_profile_version = p_desired_profile_version AND active.activation_revision = p_activation_revision
  ) THEN RAISE EXCEPTION 'provider work must reference the active desired admission profile revision'; END IF;
  INSERT INTO bridge.provider_work_attempt (logical_work_id,attempt_number,quota_domain_id,process_id,process_profile_version,fairness_key,service_class,request_resource_envelope,desired_profile_version,activation_revision,admission_deadline_at,execution_deadline_at)
    SELECT p_logical_work_id,p_attempt_number,p_quota_domain_id,p_process_id,p_process_profile_version,p_fairness_key,process.service_class,p_request_resource_envelope,p_desired_profile_version,p_activation_revision,p_admission_deadline_at,p_execution_deadline_at
    FROM bridge.provider_process_profile process
    WHERE process.process_id=p_process_id AND process.profile_version=p_process_profile_version
  ON CONFLICT (logical_work_id,attempt_number) DO NOTHING;
  SELECT * INTO registered FROM bridge.provider_work_attempt WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider process profile is missing'; END IF;
  IF registered.quota_domain_id <> p_quota_domain_id OR registered.desired_profile_version <> p_desired_profile_version OR registered.activation_revision <> p_activation_revision THEN
    RAISE EXCEPTION 'provider work identity conflicts with an existing attempt';
  END IF;
  RETURN registered;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.reserve_provider_work_attempt(p_logical_work_id text, p_attempt_number integer)
RETURNS bridge.provider_work_reservation LANGUAGE plpgsql AS $$
DECLARE v_work bridge.provider_work_attempt; v_reservation bridge.provider_work_reservation;
BEGIN
  UPDATE bridge.provider_work_attempt SET state='reserved', state_version=state_version+1, updated_at=now()
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='waiting'
      AND (admission_deadline_at IS NULL OR admission_deadline_at > now()) AND cancellation_requested_at IS NULL
    RETURNING * INTO v_work;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt is not reservable'; END IF;
  INSERT INTO bridge.provider_work_reservation (logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope)
    VALUES (v_work.logical_work_id,v_work.attempt_number,v_work.desired_profile_version,v_work.activation_revision,v_work.request_resource_envelope)
    ON CONFLICT DO NOTHING RETURNING * INTO v_reservation;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt already has a live reservation'; END IF;
  RETURN v_reservation;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.mark_provider_work_transport_may_have_started(p_logical_work_id text, p_attempt_number integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bridge.provider_work_attempt SET state='transport_may_have_started', state_version=state_version+1, updated_at=now()
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='reserved';
  IF NOT FOUND THEN RAISE EXCEPTION 'only a reserved provider work attempt may start transport'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.cancel_provider_work_attempt(p_logical_work_id text, p_attempt_number integer, p_reason text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_work bridge.provider_work_attempt;
BEGIN
  SELECT * INTO v_work FROM bridge.provider_work_attempt WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt is missing'; END IF;
  IF v_work.state='waiting' THEN
    UPDATE bridge.provider_work_attempt SET state='terminal', terminal_reason=p_reason, cancellation_requested_at=now(), state_version=state_version+1, updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'terminal_without_reservation';
  ELSIF v_work.state='reserved' THEN
    UPDATE bridge.provider_work_reservation SET state='released', released_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='live';
    UPDATE bridge.provider_work_attempt SET state='terminal', terminal_reason=p_reason, cancellation_requested_at=now(), state_version=state_version+1, updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'released_before_transport';
  ELSIF v_work.state='transport_may_have_started' THEN
    UPDATE bridge.provider_work_reservation SET state='consumed_unknown', released_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='live';
    UPDATE bridge.provider_work_attempt SET cancellation_requested_at=now(), state_version=state_version+1, updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'transport_usage_remains_unknown';
  END IF;
  RETURN v_work.state;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.request_provider_work_wakeup(p_quota_domain_id text, p_wakeup_key text, p_requested_for timestamptz, p_desired_profile_version text DEFAULT NULL, p_activation_revision bigint DEFAULT NULL)
RETURNS bridge.provider_work_wakeup_request LANGUAGE sql AS $$
  INSERT INTO bridge.provider_work_wakeup_request (quota_domain_id,wakeup_key,requested_for,desired_profile_version,activation_revision)
  VALUES (p_quota_domain_id,p_wakeup_key,p_requested_for,p_desired_profile_version,p_activation_revision)
  ON CONFLICT (quota_domain_id,wakeup_key) DO UPDATE SET
    requested_for=LEAST(bridge.provider_work_wakeup_request.requested_for,EXCLUDED.requested_for),
    desired_profile_version=COALESCE(EXCLUDED.desired_profile_version,bridge.provider_work_wakeup_request.desired_profile_version),
    activation_revision=COALESCE(EXCLUDED.activation_revision,bridge.provider_work_wakeup_request.activation_revision), updated_at=now()
  RETURNING *;
$$;

ALTER TABLE bridge.provider_work_attempt OWNER TO agents_bridge;
ALTER TABLE bridge.provider_work_reservation OWNER TO agents_bridge;
ALTER TABLE bridge.provider_quota_window_state OWNER TO agents_bridge;
ALTER TABLE bridge.provider_work_wakeup_request OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_work_attempt, bridge.provider_work_reservation, bridge.provider_quota_window_state, bridge.provider_work_wakeup_request FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.register_provider_work_attempt(text,integer,text,text,text,text,jsonb,text,bigint,timestamptz,timestamptz), bridge.reserve_provider_work_attempt(text,integer), bridge.mark_provider_work_transport_may_have_started(text,integer), bridge.cancel_provider_work_attempt(text,integer,text), bridge.request_provider_work_wakeup(text,text,timestamptz,text,bigint) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.register_provider_work_attempt(text,integer,text,text,text,text,jsonb,text,bigint,timestamptz,timestamptz), bridge.reserve_provider_work_attempt(text,integer), bridge.mark_provider_work_transport_may_have_started(text,integer), bridge.cancel_provider_work_attempt(text,integer,text), bridge.request_provider_work_wakeup(text,text,timestamptz,text,bigint) TO agents_bridge;

INSERT INTO atlas.schema_migrations (name) VALUES ('0030_bssv200601_provider_work_reservation_window_foundation') ON CONFLICT DO NOTHING;
