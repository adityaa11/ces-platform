-- BSS-V2-006-01 CFC: close immutable identity, policy, wakeup, and attempt fences.

CREATE OR REPLACE FUNCTION bridge.provider_work_metadata_is_safe(p_value jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(p_value) = 'object'
    AND p_value::text !~* '"[^"\\]*(prompt|source|question|authorization|credential|secret|connection)[^"\\]*"[[:space:]]*:';
$$;

CREATE OR REPLACE FUNCTION bridge.register_provider_work_attempt(
  p_logical_work_id text, p_attempt_number integer, p_quota_domain_id text,
  p_process_id text, p_process_profile_version text, p_fairness_key text,
  p_request_resource_envelope jsonb, p_desired_profile_version text,
  p_activation_revision bigint, p_admission_deadline_at timestamptz DEFAULT NULL,
  p_execution_deadline_at timestamptz DEFAULT NULL
) RETURNS bridge.provider_work_attempt LANGUAGE plpgsql AS $$
DECLARE registered bridge.provider_work_attempt; expected_service_class text;
BEGIN
  IF NOT bridge.provider_work_metadata_is_safe(p_request_resource_envelope) THEN
    RAISE EXCEPTION 'provider work metadata must not contain content, credentials, or connection identifiers';
  END IF;
  SELECT service_class INTO expected_service_class FROM bridge.provider_process_profile
    WHERE process_id=p_process_id AND profile_version=p_process_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider process profile is missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id) active
    WHERE active.desired_profile_version=p_desired_profile_version AND active.activation_revision=p_activation_revision) THEN
    RAISE EXCEPTION 'provider work must reference the active desired admission profile revision';
  END IF;
  INSERT INTO bridge.provider_work_attempt (logical_work_id,attempt_number,quota_domain_id,process_id,process_profile_version,fairness_key,service_class,request_resource_envelope,desired_profile_version,activation_revision,admission_deadline_at,execution_deadline_at)
    VALUES (p_logical_work_id,p_attempt_number,p_quota_domain_id,p_process_id,p_process_profile_version,p_fairness_key,expected_service_class,p_request_resource_envelope,p_desired_profile_version,p_activation_revision,p_admission_deadline_at,p_execution_deadline_at)
    ON CONFLICT (logical_work_id,attempt_number) DO NOTHING;
  SELECT * INTO registered FROM bridge.provider_work_attempt WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
  IF registered.quota_domain_id IS DISTINCT FROM p_quota_domain_id OR registered.process_id IS DISTINCT FROM p_process_id
    OR registered.process_profile_version IS DISTINCT FROM p_process_profile_version OR registered.fairness_key IS DISTINCT FROM p_fairness_key
    OR registered.service_class IS DISTINCT FROM expected_service_class OR registered.request_resource_envelope IS DISTINCT FROM p_request_resource_envelope
    OR registered.desired_profile_version IS DISTINCT FROM p_desired_profile_version OR registered.activation_revision IS DISTINCT FROM p_activation_revision
    OR registered.admission_deadline_at IS DISTINCT FROM p_admission_deadline_at OR registered.execution_deadline_at IS DISTINCT FROM p_execution_deadline_at THEN
    RAISE EXCEPTION 'provider work identity conflicts with an existing attempt';
  END IF;
  RETURN registered;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.put_provider_quota_window_state(
  p_quota_domain_id text, p_dimension_id text, p_window_state jsonb,
  p_reset_semantics_known boolean DEFAULT false, p_reset_at timestamptz DEFAULT NULL
) RETURNS bridge.provider_quota_window_state LANGUAGE plpgsql AS $$
DECLARE active record; policy jsonb; result bridge.provider_quota_window_state;
BEGIN
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'active desired admission profile is required'; END IF;
  SELECT window_policies -> p_dimension_id INTO policy FROM bridge.provider_capacity_profile
    WHERE quota_domain_id=p_quota_domain_id AND profile_version=active.provider_capacity_profile_version;
  IF policy IS NULL OR jsonb_typeof(policy) <> 'object' OR COALESCE(policy ->> 'kind','') NOT IN ('fixed','fixed_window','rolling','refill') THEN
    RAISE EXCEPTION 'provider quota window policy is missing or has unknown reset semantics';
  END IF;
  IF p_reset_at IS NOT NULL AND NOT p_reset_semantics_known THEN RAISE EXCEPTION 'reset timestamp requires known reset semantics'; END IF;
  INSERT INTO bridge.provider_quota_window_state (quota_domain_id,desired_profile_version,activation_revision,provider_capacity_profile_version,dimension_id,window_policy_identity,window_state,reset_semantics_known,reset_at)
    VALUES (p_quota_domain_id,active.desired_profile_version,active.activation_revision,active.provider_capacity_profile_version,p_dimension_id,policy,p_window_state,p_reset_semantics_known,p_reset_at)
  ON CONFLICT (quota_domain_id,desired_profile_version,activation_revision,dimension_id) DO UPDATE SET
    window_state=EXCLUDED.window_state, reset_semantics_known=EXCLUDED.reset_semantics_known, reset_at=EXCLUDED.reset_at, updated_at=now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.validate_provider_quota_window_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE active record; policy jsonb;
BEGIN
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(NEW.quota_domain_id);
  IF NOT FOUND OR NEW.desired_profile_version <> active.desired_profile_version OR NEW.activation_revision <> active.activation_revision
    OR NEW.provider_capacity_profile_version <> active.provider_capacity_profile_version THEN
    RAISE EXCEPTION 'quota window state must reference the active desired admission profile';
  END IF;
  SELECT window_policies -> NEW.dimension_id INTO policy FROM bridge.provider_capacity_profile
    WHERE quota_domain_id=NEW.quota_domain_id AND profile_version=active.provider_capacity_profile_version;
  IF policy IS NULL OR jsonb_typeof(policy) <> 'object' OR COALESCE(policy ->> 'kind','') NOT IN ('fixed','fixed_window','rolling','refill')
    OR NEW.window_policy_identity IS DISTINCT FROM policy THEN
    RAISE EXCEPTION 'quota window state must use the exact known active window policy';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS provider_quota_window_state_valid ON bridge.provider_quota_window_state;
CREATE TRIGGER provider_quota_window_state_valid BEFORE INSERT OR UPDATE ON bridge.provider_quota_window_state
  FOR EACH ROW EXECUTE FUNCTION bridge.validate_provider_quota_window_state();

CREATE OR REPLACE FUNCTION bridge.reserve_provider_work_attempt(p_logical_work_id text, p_attempt_number integer)
RETURNS bridge.provider_work_reservation LANGUAGE plpgsql AS $$
DECLARE v_work bridge.provider_work_attempt; v_reservation bridge.provider_work_reservation;
BEGIN
  UPDATE bridge.provider_work_attempt SET state='reserved', state_version=state_version+1, updated_at=now()
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='waiting'
      AND (admission_deadline_at IS NULL OR admission_deadline_at > now())
      AND (execution_deadline_at IS NULL OR execution_deadline_at > now()) AND cancellation_requested_at IS NULL
    RETURNING * INTO v_work;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt is not reservable'; END IF;
  INSERT INTO bridge.provider_work_reservation (logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope)
    VALUES (v_work.logical_work_id,v_work.attempt_number,v_work.desired_profile_version,v_work.activation_revision,v_work.request_resource_envelope)
    RETURNING * INTO v_reservation;
  RETURN v_reservation;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.mark_provider_work_transport_may_have_started(p_logical_work_id text, p_attempt_number integer, p_expected_state_version bigint)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bridge.provider_work_attempt SET state='transport_may_have_started', state_version=state_version+1, updated_at=now()
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='reserved' AND state_version=p_expected_state_version
      AND cancellation_requested_at IS NULL AND (execution_deadline_at IS NULL OR execution_deadline_at > now());
  IF NOT FOUND THEN RAISE EXCEPTION 'reserved provider work attempt is stale, cancelled, or expired'; END IF;
END;
$$;
DROP FUNCTION IF EXISTS bridge.mark_provider_work_transport_may_have_started(text,integer);

CREATE OR REPLACE FUNCTION bridge.cancel_provider_work_attempt(p_logical_work_id text, p_attempt_number integer, p_reason text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_work bridge.provider_work_attempt;
BEGIN
  SELECT * INTO v_work FROM bridge.provider_work_attempt WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt is missing'; END IF;
  IF v_work.state='waiting' THEN
    UPDATE bridge.provider_work_attempt SET state='terminal',terminal_reason=p_reason,cancellation_requested_at=now(),state_version=state_version+1,updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'terminal_without_reservation';
  ELSIF v_work.state='reserved' THEN
    UPDATE bridge.provider_work_reservation SET state='released',released_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='live';
    UPDATE bridge.provider_work_attempt SET state='terminal',terminal_reason=p_reason,cancellation_requested_at=now(),state_version=state_version+1,updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'released_before_transport';
  ELSIF v_work.state='transport_may_have_started' THEN
    UPDATE bridge.provider_work_reservation SET state='consumed_unknown',released_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='live';
    UPDATE bridge.provider_work_attempt SET state='terminal',terminal_reason=p_reason,cancellation_requested_at=now(),state_version=state_version+1,updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN 'transport_usage_remains_unknown';
  END IF;
  RETURN v_work.state;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.reconcile_provider_work_attempt(p_logical_work_id text, p_attempt_number integer, p_expected_state_version bigint)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bridge.provider_work_attempt SET state='reconciled',state_version=state_version+1,updated_at=now()
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number AND state='terminal' AND state_version=p_expected_state_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'terminal provider work attempt is stale or cannot be reconciled'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.request_provider_work_wakeup(p_quota_domain_id text, p_wakeup_key text, p_requested_for timestamptz, p_desired_profile_version text DEFAULT NULL, p_activation_revision bigint DEFAULT NULL)
RETURNS bridge.provider_work_wakeup_request LANGUAGE plpgsql AS $$
DECLARE active record; result bridge.provider_work_wakeup_request;
BEGIN
  IF (p_desired_profile_version IS NULL) <> (p_activation_revision IS NULL) THEN RAISE EXCEPTION 'plan revision must be supplied together'; END IF;
  IF p_desired_profile_version IS NOT NULL THEN
    SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
    IF NOT FOUND OR active.desired_profile_version <> p_desired_profile_version OR active.activation_revision <> p_activation_revision THEN
      RAISE EXCEPTION 'wakeup must reference the active desired admission profile revision';
    END IF;
  END IF;
  INSERT INTO bridge.provider_work_wakeup_request (quota_domain_id,wakeup_key,requested_for,desired_profile_version,activation_revision)
    VALUES (p_quota_domain_id,p_wakeup_key,p_requested_for,p_desired_profile_version,p_activation_revision)
  ON CONFLICT (quota_domain_id,wakeup_key) DO UPDATE SET requested_for=LEAST(bridge.provider_work_wakeup_request.requested_for,EXCLUDED.requested_for),
    desired_profile_version=COALESCE(EXCLUDED.desired_profile_version,bridge.provider_work_wakeup_request.desired_profile_version),
    activation_revision=COALESCE(EXCLUDED.activation_revision,bridge.provider_work_wakeup_request.activation_revision),updated_at=now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

ALTER FUNCTION bridge.provider_work_metadata_is_safe(jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.put_provider_quota_window_state(text,text,jsonb,boolean,timestamptz) OWNER TO agents_bridge;
ALTER FUNCTION bridge.mark_provider_work_transport_may_have_started(text,integer,bigint) OWNER TO agents_bridge;
ALTER FUNCTION bridge.reconcile_provider_work_attempt(text,integer,bigint) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.provider_work_metadata_is_safe(jsonb), bridge.put_provider_quota_window_state(text,text,jsonb,boolean,timestamptz), bridge.mark_provider_work_transport_may_have_started(text,integer,bigint), bridge.reconcile_provider_work_attempt(text,integer,bigint) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.put_provider_quota_window_state(text,text,jsonb,boolean,timestamptz), bridge.mark_provider_work_transport_may_have_started(text,integer,bigint), bridge.reconcile_provider_work_attempt(text,integer,bigint) TO agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0031_bssv200601_closure_remediation') ON CONFLICT DO NOTHING;
