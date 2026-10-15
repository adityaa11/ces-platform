-- BSS-V2-006-03: normalized outcome fence, conservative runtime feedback and
-- plan-convergence state. This is Bridge operational state, never BSS-V2-007.

CREATE TABLE bridge.provider_runtime_usage_hold (
  reservation_id uuid PRIMARY KEY REFERENCES bridge.provider_work_reservation(reservation_id) ON DELETE RESTRICT,
  quota_domain_id text NOT NULL,
  held_resource_envelope jsonb NOT NULL CHECK (jsonb_typeof(held_resource_envelope) = 'object'),
  release_not_before timestamptz,
  reason text NOT NULL CHECK (reason IN ('actual_usage','unknown_usage')),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

CREATE TABLE bridge.provider_work_outcome_reconciliation (
  reservation_id uuid PRIMARY KEY REFERENCES bridge.provider_work_reservation(reservation_id) ON DELETE RESTRICT,
  feedback_id text NOT NULL UNIQUE CHECK (length(trim(feedback_id)) > 0),
  transport_may_have_started boolean NOT NULL,
  trustworthy_usage jsonb,
  reconciled_at timestamptz NOT NULL DEFAULT now(),
  CHECK (trustworthy_usage IS NULL OR jsonb_typeof(trustworthy_usage) = 'object')
);

CREATE TABLE bridge.provider_runtime_pressure (
  feedback_id text PRIMARY KEY CHECK (length(trim(feedback_id)) > 0),
  quota_domain_id text NOT NULL,
  route_id text,
  dimension_id text CHECK (dimension_id IS NULL OR dimension_id IN ('rpm','tpm','rpd','concurrency')),
  lower_limit numeric CHECK (lower_limit IS NULL OR lower_limit >= 0),
  cooldown_until timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK (lower_limit IS NOT NULL OR cooldown_until IS NOT NULL),
  CHECK (expires_at IS NULL OR expires_at >= observed_at)
);
CREATE INDEX provider_runtime_pressure_active_idx ON bridge.provider_runtime_pressure(quota_domain_id, expires_at, cooldown_until);

CREATE OR REPLACE FUNCTION bridge.provider_runtime_used_capacity(p_quota_domain_id text)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'rpm', COALESCE(sum((source.envelope->>'rpm')::numeric),0),
    'tpm', COALESCE(sum((source.envelope->>'tpm')::numeric),0),
    'rpd', COALESCE(sum((source.envelope->>'rpd')::numeric),0),
    'concurrency', COALESCE(sum((source.envelope->>'concurrency')::numeric),0)
  )
  FROM (
    SELECT r.request_resource_envelope AS envelope
      FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number)
      WHERE w.quota_domain_id=p_quota_domain_id AND r.state='live'
    UNION ALL
    SELECT h.held_resource_envelope AS envelope FROM bridge.provider_runtime_usage_hold h
      WHERE h.quota_domain_id=p_quota_domain_id AND h.released_at IS NULL
        AND (h.release_not_before IS NULL OR h.release_not_before > now())
  ) source;
$$;

CREATE OR REPLACE FUNCTION bridge.provider_runtime_effective_capacity(p_quota_domain_id text, p_configured jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE result jsonb := p_configured; pressure record; configured numeric; dimension text;
BEGIN
  IF jsonb_typeof(p_configured) <> 'object' THEN RAISE EXCEPTION 'configured capacity must be an object'; END IF;
  FOR pressure IN SELECT * FROM bridge.provider_runtime_pressure
    WHERE quota_domain_id=p_quota_domain_id AND (expires_at IS NULL OR expires_at > now()) AND lower_limit IS NOT NULL LOOP
    IF pressure.dimension_id IS NULL THEN
      -- An ambiguous dimension has no numeric authority: hold the domain safely.
      FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
        result := jsonb_set(result, ARRAY[dimension], '0'::jsonb, true);
      END LOOP;
    ELSE
      configured := COALESCE((result->>pressure.dimension_id)::numeric, 0);
      result := jsonb_set(result, ARRAY[pressure.dimension_id], to_jsonb(LEAST(configured, pressure.lower_limit)), true);
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.provider_runtime_admission_blocked(p_quota_domain_id text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM bridge.provider_runtime_pressure
    WHERE quota_domain_id=p_quota_domain_id AND cooldown_until > now() AND (expires_at IS NULL OR expires_at > now()));
$$;

CREATE OR REPLACE FUNCTION bridge.record_provider_runtime_pressure(
  p_feedback_id text, p_quota_domain_id text, p_route_id text, p_dimension_id text DEFAULT NULL,
  p_lower_limit numeric DEFAULT NULL, p_retry_after_seconds integer DEFAULT NULL, p_expires_at timestamptz DEFAULT NULL
) RETURNS bridge.provider_runtime_pressure LANGUAGE plpgsql AS $$
DECLARE active record; result bridge.provider_runtime_pressure; cooldown timestamptz;
BEGIN
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'active desired admission profile is required'; END IF;
  IF p_route_id IS NULL OR NOT EXISTS (SELECT 1 FROM bridge.provider_capacity_profile c, jsonb_array_elements(c.associated_routes) route
    WHERE c.quota_domain_id=p_quota_domain_id AND c.profile_version=active.provider_capacity_profile_version AND route->>'routeId'=p_route_id) THEN
    RAISE EXCEPTION 'provider feedback route is not associated with the active quota domain';
  END IF;
  IF p_dimension_id IS NOT NULL AND p_dimension_id NOT IN ('rpm','tpm','rpd','concurrency') THEN RAISE EXCEPTION 'provider feedback dimension is invalid'; END IF;
  IF p_lower_limit IS NOT NULL AND (p_lower_limit < 0 OR p_dimension_id IS NULL) THEN RAISE EXCEPTION 'numeric lower limit requires a known non-negative dimension'; END IF;
  IF p_retry_after_seconds IS NOT NULL AND (p_retry_after_seconds < 0 OR p_retry_after_seconds > 3600) THEN RAISE EXCEPTION 'Retry-After is outside the bounded runtime range'; END IF;
  IF p_lower_limit IS NULL AND p_retry_after_seconds IS NULL THEN RAISE EXCEPTION 'pressure feedback has no usable bounded signal'; END IF;
  cooldown := CASE WHEN p_retry_after_seconds IS NULL THEN NULL ELSE now() + make_interval(secs=>p_retry_after_seconds) END;
  INSERT INTO bridge.provider_runtime_pressure(feedback_id,quota_domain_id,route_id,dimension_id,lower_limit,cooldown_until,expires_at)
    VALUES(p_feedback_id,p_quota_domain_id,p_route_id,p_dimension_id,p_lower_limit,cooldown,p_expires_at)
    ON CONFLICT(feedback_id) DO NOTHING RETURNING * INTO result;
  IF NOT FOUND THEN SELECT * INTO result FROM bridge.provider_runtime_pressure WHERE feedback_id=p_feedback_id;
    IF result.quota_domain_id<>p_quota_domain_id OR result.route_id IS DISTINCT FROM p_route_id OR result.dimension_id IS DISTINCT FROM p_dimension_id OR result.lower_limit IS DISTINCT FROM p_lower_limit THEN RAISE EXCEPTION 'feedback identity conflicts with prior pressure'; END IF;
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.record_unknown_provider_pressure(
  p_feedback_id text, p_quota_domain_id text, p_route_id text, p_cooldown_seconds integer DEFAULT 60
) RETURNS bridge.provider_runtime_pressure LANGUAGE plpgsql AS $$
BEGIN
  IF p_cooldown_seconds < 1 OR p_cooldown_seconds > 300 THEN RAISE EXCEPTION 'unknown pressure cooldown must be bounded'; END IF;
  -- Null dimension/lower-limit deliberately records only a bounded cooldown;
  -- it never fabricates a limit from an ambiguous 429 response.
  RETURN bridge.record_provider_runtime_pressure(p_feedback_id,p_quota_domain_id,p_route_id,NULL,NULL,p_cooldown_seconds,now()+make_interval(secs=>p_cooldown_seconds));
END;
$$;

CREATE OR REPLACE FUNCTION bridge.reconcile_provider_work_outcome(
  p_logical_work_id text, p_attempt_number integer, p_feedback_id text,
  p_transport_may_have_started boolean, p_trustworthy_usage jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE work bridge.provider_work_attempt; reservation bridge.provider_work_reservation; prior bridge.provider_work_outcome_reconciliation;
  held jsonb; actual_tpm numeric;
BEGIN
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt is missing'; END IF;
  SELECT * INTO reservation FROM bridge.provider_work_reservation WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work reservation is missing'; END IF;
  SELECT * INTO prior FROM bridge.provider_work_outcome_reconciliation WHERE feedback_id=p_feedback_id;
  IF FOUND THEN
    IF prior.reservation_id<>reservation.reservation_id THEN RAISE EXCEPTION 'feedback identity belongs to another reservation'; END IF;
    RETURN jsonb_build_object('status','duplicate','reservationId',reservation.reservation_id);
  END IF;
  IF p_trustworthy_usage IS NOT NULL AND (jsonb_typeof(p_trustworthy_usage)<>'object' OR p_trustworthy_usage ?| ARRAY['prompt','source','authorization','credential','secret','raw']) THEN RAISE EXCEPTION 'usage must be normalized operational metadata'; END IF;
  IF p_trustworthy_usage IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_each(p_trustworthy_usage) e WHERE e.key NOT IN ('rpm','tpm','rpd') OR jsonb_typeof(e.value)<>'number' OR (e.value::text)::numeric < 0) THEN RAISE EXCEPTION 'usage has an invalid resource dimension'; END IF;
  INSERT INTO bridge.provider_work_outcome_reconciliation(reservation_id,feedback_id,transport_may_have_started,trustworthy_usage) VALUES(reservation.reservation_id,p_feedback_id,p_transport_may_have_started,p_trustworthy_usage);
  IF NOT p_transport_may_have_started THEN
    UPDATE bridge.provider_work_reservation SET state='released',released_at=now() WHERE reservation_id=reservation.reservation_id AND state='live';
    UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason='definitely_untransmitted',state_version=state_version+1,updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    RETURN jsonb_build_object('status','released_untransmitted','reservationId',reservation.reservation_id);
  END IF;
  actual_tpm := CASE WHEN p_trustworthy_usage IS NULL THEN NULL ELSE COALESCE((p_trustworthy_usage->>'tpm')::numeric,0) END;
  held := jsonb_build_object('rpm',COALESCE((reservation.request_resource_envelope->>'rpm')::numeric,0),'rpd',COALESCE((reservation.request_resource_envelope->>'rpd')::numeric,0),'tpm',COALESCE(actual_tpm,COALESCE((reservation.request_resource_envelope->>'tpm')::numeric,0)),'concurrency',0);
  INSERT INTO bridge.provider_runtime_usage_hold(reservation_id,quota_domain_id,held_resource_envelope,reason)
    VALUES(reservation.reservation_id,work.quota_domain_id,held,CASE WHEN p_trustworthy_usage IS NULL THEN 'unknown_usage' ELSE 'actual_usage' END);
  UPDATE bridge.provider_work_reservation SET state=CASE WHEN p_trustworthy_usage IS NULL THEN 'consumed_unknown' ELSE 'released' END,released_at=now() WHERE reservation_id=reservation.reservation_id AND state='live';
  UPDATE bridge.provider_work_attempt SET state='reconciled',terminal_reason=CASE WHEN p_trustworthy_usage IS NULL THEN 'transport_usage_unknown' ELSE 'reconciled_actual_usage' END,state_version=state_version+1,updated_at=now() WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
  RETURN jsonb_build_object('status',CASE WHEN p_trustworthy_usage IS NULL THEN 'held_unknown' ELSE 'reconciled_actual' END,'reservationId',reservation.reservation_id,'held',held);
END;
$$;

CREATE OR REPLACE FUNCTION bridge.rebase_provider_work_on_plan_activation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE epoch text;
BEGIN
  UPDATE bridge.provider_work_attempt SET desired_profile_version=NEW.desired_profile_version,activation_revision=NEW.activation_revision,state_version=state_version+1,updated_at=now()
    WHERE quota_domain_id=NEW.quota_domain_id AND state='waiting';
  epoch := NEW.desired_profile_version || ':' || NEW.activation_revision;
  INSERT INTO bridge.provider_admission_domain_state(quota_domain_id,fairness_epoch,virtual_time,next_turn) VALUES(NEW.quota_domain_id,epoch,0,1)
    ON CONFLICT(quota_domain_id) DO UPDATE SET fairness_epoch=EXCLUDED.fairness_epoch,virtual_time=0,next_turn=1;
  INSERT INTO bridge.provider_work_wakeup_request(quota_domain_id,wakeup_key,requested_for,desired_profile_version,activation_revision)
    VALUES(NEW.quota_domain_id,'plan:'||NEW.activation_revision,now(),NEW.desired_profile_version,NEW.activation_revision)
    ON CONFLICT(quota_domain_id,wakeup_key) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS provider_work_plan_convergence ON bridge.active_desired_admission_profile;
CREATE TRIGGER provider_work_plan_convergence AFTER INSERT OR UPDATE ON bridge.active_desired_admission_profile
  FOR EACH ROW EXECUTE FUNCTION bridge.rebase_provider_work_on_plan_activation();

-- Fold runtime pressure and retained accounted usage into both existing BSS-V2-006-02 admission paths.
CREATE OR REPLACE FUNCTION bridge.admit_next_provider_work_attempt(p_quota_domain_id text)
RETURNS TABLE(logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
#variable_conflict use_column
DECLARE active record; profile jsonb; epoch text; candidate bridge.provider_work_attempt; used jsonb; lane jsonb; weight numeric; dominant numeric; domain_state bridge.provider_admission_domain_state; reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id,602)); SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id); IF NOT FOUND THEN RAISE EXCEPTION 'active desired admission profile is required'; END IF;
  IF bridge.provider_runtime_admission_blocked(p_quota_domain_id) THEN RETURN; END IF;
  profile:=active.profile; profile:=jsonb_set(jsonb_set(profile,'{usableGlobalCapacity}',bridge.provider_runtime_effective_capacity(p_quota_domain_id,profile->'usableGlobalCapacity')),'{backgroundCapacity}',bridge.provider_runtime_effective_capacity(p_quota_domain_id,profile->'backgroundCapacity'));
  epoch:=active.desired_profile_version||':'||active.activation_revision; INSERT INTO bridge.provider_admission_domain_state(quota_domain_id,fairness_epoch) VALUES(p_quota_domain_id,epoch) ON CONFLICT(quota_domain_id) DO UPDATE SET fairness_epoch=EXCLUDED.fairness_epoch,virtual_time=CASE WHEN bridge.provider_admission_domain_state.fairness_epoch<>EXCLUDED.fairness_epoch THEN 0 ELSE bridge.provider_admission_domain_state.virtual_time END;
  SELECT * INTO domain_state FROM bridge.provider_admission_domain_state WHERE quota_domain_id=p_quota_domain_id FOR UPDATE; used:=bridge.provider_runtime_used_capacity(p_quota_domain_id);
  SELECT * INTO candidate FROM bridge.provider_work_attempt w WHERE w.quota_domain_id=p_quota_domain_id AND w.desired_profile_version=active.desired_profile_version AND w.activation_revision=active.activation_revision AND w.state='waiting' AND w.service_class='interactive' AND w.cancellation_requested_at IS NULL AND (w.admission_deadline_at IS NULL OR w.admission_deadline_at>now()) AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>now()) AND bridge.admission_vector_fits(used,w.request_resource_envelope,profile->'usableGlobalCapacity') ORDER BY w.admission_deadline_at NULLS LAST,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN SELECT w.* INTO candidate FROM bridge.provider_work_attempt w JOIN LATERAL (SELECT e FROM jsonb_array_elements(profile->'backgroundLanes') e WHERE e->>'processId'=w.process_id AND e->>'profileVersion'=w.process_profile_version) l ON true LEFT JOIN bridge.provider_admission_key_state ks ON(ks.quota_domain_id=w.quota_domain_id AND ks.fairness_epoch=epoch AND ks.process_id=w.process_id AND ks.process_profile_version=w.process_profile_version AND ks.fairness_key=w.fairness_key) LEFT JOIN bridge.provider_admission_lane_state ls ON(ls.quota_domain_id=w.quota_domain_id AND ls.fairness_epoch=epoch AND ls.process_id=w.process_id AND ls.process_profile_version=w.process_profile_version) WHERE w.quota_domain_id=p_quota_domain_id AND w.desired_profile_version=active.desired_profile_version AND w.activation_revision=active.activation_revision AND w.state='waiting' AND w.service_class='background' AND w.cancellation_requested_at IS NULL AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>now()) AND bridge.admission_vector_fits(used,w.request_resource_envelope,profile->'backgroundCapacity') AND COALESCE(ks.last_admission_turn,0)=(SELECT min(COALESCE(k2.last_admission_turn,0)) FROM bridge.provider_work_attempt w2 LEFT JOIN bridge.provider_admission_key_state k2 ON(k2.quota_domain_id=w2.quota_domain_id AND k2.fairness_epoch=epoch AND k2.process_id=w2.process_id AND k2.process_profile_version=w2.process_profile_version AND k2.fairness_key=w2.fairness_key) WHERE w2.quota_domain_id=w.quota_domain_id AND w2.process_id=w.process_id AND w2.process_profile_version=w.process_profile_version AND w2.desired_profile_version=active.desired_profile_version AND w2.activation_revision=active.activation_revision AND w2.state='waiting' AND w2.service_class='background') ORDER BY GREATEST(COALESCE(ls.virtual_usage,domain_state.virtual_time),domain_state.virtual_time)/NULLIF((l.e->>'normalizedWeight')::numeric,0),w.fairness_key,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE OF w SKIP LOCKED; END IF;
  IF NOT FOUND THEN RETURN; END IF; UPDATE bridge.provider_work_attempt SET state='reserved',state_version=state_version+1,updated_at=now() WHERE logical_work_id=candidate.logical_work_id AND attempt_number=candidate.attempt_number; INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES(candidate.logical_work_id,candidate.attempt_number,candidate.desired_profile_version,candidate.activation_revision,candidate.request_resource_envelope) RETURNING * INTO reservation;
  IF candidate.service_class='background' THEN SELECT e INTO lane FROM jsonb_array_elements(profile->'backgroundLanes') e WHERE e->>'processId'=candidate.process_id AND e->>'profileVersion'=candidate.process_profile_version; weight:=(lane->>'normalizedWeight')::numeric; dominant:=GREATEST(COALESCE((candidate.request_resource_envelope->>'rpm')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'rpm')::numeric,0),COALESCE((candidate.request_resource_envelope->>'tpm')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'tpm')::numeric,0),COALESCE((candidate.request_resource_envelope->>'rpd')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'rpd')::numeric,0),COALESCE((candidate.request_resource_envelope->>'concurrency')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'concurrency')::numeric,0)); INSERT INTO bridge.provider_admission_lane_state(quota_domain_id,fairness_epoch,process_id,process_profile_version,virtual_usage,last_admission_turn) VALUES(p_quota_domain_id,epoch,candidate.process_id,candidate.process_profile_version,domain_state.virtual_time+dominant/weight,domain_state.next_turn) ON CONFLICT(quota_domain_id,fairness_epoch,process_id,process_profile_version) DO UPDATE SET virtual_usage=GREATEST(bridge.provider_admission_lane_state.virtual_usage,domain_state.virtual_time)+dominant/weight,last_admission_turn=domain_state.next_turn; INSERT INTO bridge.provider_admission_key_state VALUES(p_quota_domain_id,epoch,candidate.process_id,candidate.process_profile_version,candidate.fairness_key,domain_state.next_turn) ON CONFLICT(quota_domain_id,fairness_epoch,process_id,process_profile_version,fairness_key) DO UPDATE SET last_admission_turn=EXCLUDED.last_admission_turn; UPDATE bridge.provider_admission_domain_state SET virtual_time=GREATEST(virtual_time,domain_state.virtual_time+dominant/weight),next_turn=next_turn+1 WHERE quota_domain_id=p_quota_domain_id; END IF;
  INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',candidate.logical_work_id,'attemptNumber',candidate.attempt_number,'reservationId',reservation.reservation_id),'short',candidate.logical_work_id||':'||candidate.attempt_number) RETURNING id INTO dispatch_job; INSERT INTO bridge.provider_work_dispatch VALUES(candidate.logical_work_id,candidate.attempt_number,reservation.reservation_id,dispatch_job); UPDATE bridge.provider_work_attempt SET state='dispatched',state_version=state_version+1,updated_at=now() WHERE logical_work_id=candidate.logical_work_id AND attempt_number=candidate.attempt_number; RETURN QUERY SELECT candidate.logical_work_id,candidate.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.admit_interactive_provider_work_attempt(p_logical_work_id text,p_attempt_number integer)
RETURNS TABLE(decision text,logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
#variable_conflict use_column
DECLARE active record; profile jsonb; work bridge.provider_work_attempt; used jsonb; reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  SELECT w.* INTO work FROM bridge.provider_work_attempt w WHERE w.logical_work_id=p_logical_work_id AND w.attempt_number=p_attempt_number FOR UPDATE; IF NOT FOUND OR work.service_class<>'interactive' OR work.state<>'waiting' OR work.cancellation_requested_at IS NOT NULL THEN RETURN QUERY SELECT 'unavailable'::text,p_logical_work_id,p_attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF (work.admission_deadline_at IS NOT NULL AND work.admission_deadline_at<=now()) OR (work.execution_deadline_at IS NOT NULL AND work.execution_deadline_at<=now()) THEN RETURN QUERY SELECT 'deadline_expired'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(work.quota_domain_id,602)); SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id); IF NOT FOUND OR work.desired_profile_version<>active.desired_profile_version OR work.activation_revision<>active.activation_revision OR bridge.provider_runtime_admission_blocked(work.quota_domain_id) THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  profile:=jsonb_set(active.profile,'{usableGlobalCapacity}',bridge.provider_runtime_effective_capacity(work.quota_domain_id,active.profile->'usableGlobalCapacity')); used:=bridge.provider_runtime_used_capacity(work.quota_domain_id); IF NOT bridge.admission_vector_fits(used,work.request_resource_envelope,profile->'usableGlobalCapacity') THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  UPDATE bridge.provider_work_attempt SET state='reserved',state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number; INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES(work.logical_work_id,work.attempt_number,work.desired_profile_version,work.activation_revision,work.request_resource_envelope) RETURNING * INTO reservation; INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id),'short',work.logical_work_id||':'||work.attempt_number) RETURNING id INTO dispatch_job; INSERT INTO bridge.provider_work_dispatch VALUES(work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job); UPDATE bridge.provider_work_attempt SET state='dispatched',state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number; RETURN QUERY SELECT 'admitted'::text,work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;

ALTER TABLE bridge.provider_runtime_usage_hold OWNER TO agents_bridge;
ALTER TABLE bridge.provider_work_outcome_reconciliation OWNER TO agents_bridge;
ALTER TABLE bridge.provider_runtime_pressure OWNER TO agents_bridge;
ALTER FUNCTION bridge.provider_runtime_used_capacity(text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.provider_runtime_effective_capacity(text,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.provider_runtime_admission_blocked(text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.record_provider_runtime_pressure(text,text,text,text,numeric,integer,timestamptz) OWNER TO agents_bridge;
ALTER FUNCTION bridge.record_unknown_provider_pressure(text,text,text,integer) OWNER TO agents_bridge;
ALTER FUNCTION bridge.reconcile_provider_work_outcome(text,integer,text,boolean,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_next_provider_work_attempt(text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_interactive_provider_work_attempt(text,integer) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_runtime_usage_hold,bridge.provider_work_outcome_reconciliation,bridge.provider_runtime_pressure FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.provider_runtime_used_capacity(text),bridge.provider_runtime_effective_capacity(text,jsonb),bridge.provider_runtime_admission_blocked(text),bridge.record_provider_runtime_pressure(text,text,text,text,numeric,integer,timestamptz),bridge.record_unknown_provider_pressure(text,text,text,integer),bridge.reconcile_provider_work_outcome(text,integer,text,boolean,jsonb) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.provider_runtime_used_capacity(text),bridge.record_provider_runtime_pressure(text,text,text,text,numeric,integer,timestamptz),bridge.record_unknown_provider_pressure(text,text,text,integer),bridge.reconcile_provider_work_outcome(text,integer,text,boolean,jsonb),bridge.admit_next_provider_work_attempt(text),bridge.admit_interactive_provider_work_attempt(text,integer) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0037_bssv200603_feedback_pressure_plan_convergence') ON CONFLICT DO NOTHING;
