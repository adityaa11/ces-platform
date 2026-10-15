-- BSS-V2-006-02 CFC: rebase durable idle lanes before selection and expose
-- a bounded, targetted interactive admission decision.

CREATE OR REPLACE FUNCTION bridge.admit_next_provider_work_attempt(p_quota_domain_id text)
RETURNS TABLE(logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE active record; profile jsonb; epoch text; candidate bridge.provider_work_attempt; used jsonb;
  lane jsonb; weight numeric; dominant numeric; domain_state bridge.provider_admission_domain_state;
  reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 602));
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'active desired admission profile is required'; END IF;
  profile := active.profile;
  IF NOT (profile ? 'usableGlobalCapacity' AND profile ? 'hardInteractiveReserve' AND profile ? 'backgroundCapacity') THEN
    RAISE EXCEPTION 'desired admission profile lacks BSS-V2-006-02 resource vectors';
  END IF;
  epoch := active.desired_profile_version || ':' || active.activation_revision;
  INSERT INTO bridge.provider_admission_domain_state(quota_domain_id,fairness_epoch) VALUES(p_quota_domain_id,epoch)
    ON CONFLICT(quota_domain_id) DO UPDATE SET fairness_epoch=EXCLUDED.fairness_epoch,virtual_time=CASE WHEN bridge.provider_admission_domain_state.fairness_epoch<>EXCLUDED.fairness_epoch THEN 0 ELSE bridge.provider_admission_domain_state.virtual_time END;
  SELECT * INTO domain_state FROM bridge.provider_admission_domain_state WHERE quota_domain_id=p_quota_domain_id FOR UPDATE;
  SELECT jsonb_build_object('rpm',COALESCE(sum(COALESCE((r.request_resource_envelope->>'rpm')::numeric,0)),0),'tpm',COALESCE(sum(COALESCE((r.request_resource_envelope->>'tpm')::numeric,0)),0),'rpd',COALESCE(sum(COALESCE((r.request_resource_envelope->>'rpd')::numeric,0)),0),'concurrency',COALESCE(sum(COALESCE((r.request_resource_envelope->>'concurrency')::numeric,0)),0)) INTO used
    FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number)
    WHERE w.quota_domain_id=p_quota_domain_id AND r.state='live';
  SELECT * INTO candidate FROM bridge.provider_work_attempt w WHERE w.quota_domain_id=p_quota_domain_id AND w.desired_profile_version=active.desired_profile_version AND w.activation_revision=active.activation_revision AND w.state='waiting' AND w.service_class='interactive' AND w.cancellation_requested_at IS NULL AND (w.admission_deadline_at IS NULL OR w.admission_deadline_at>now()) AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>now()) AND bridge.admission_vector_fits(used,w.request_resource_envelope,profile->'usableGlobalCapacity') ORDER BY w.admission_deadline_at NULLS LAST,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN
    SELECT w.* INTO candidate FROM bridge.provider_work_attempt w
    JOIN LATERAL (SELECT e FROM jsonb_array_elements(profile->'backgroundLanes') e WHERE e->>'processId'=w.process_id AND e->>'profileVersion'=w.process_profile_version) l ON true
    LEFT JOIN bridge.provider_admission_key_state ks ON (ks.quota_domain_id=w.quota_domain_id AND ks.fairness_epoch=epoch AND ks.process_id=w.process_id AND ks.process_profile_version=w.process_profile_version AND ks.fairness_key=w.fairness_key)
    LEFT JOIN bridge.provider_admission_lane_state ls ON (ls.quota_domain_id=w.quota_domain_id AND ls.fairness_epoch=epoch AND ls.process_id=w.process_id AND ls.process_profile_version=w.process_profile_version)
    WHERE w.quota_domain_id=p_quota_domain_id AND w.desired_profile_version=active.desired_profile_version AND w.activation_revision=active.activation_revision AND w.state='waiting' AND w.service_class='background' AND w.cancellation_requested_at IS NULL AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>now()) AND bridge.admission_vector_fits(used,w.request_resource_envelope,profile->'backgroundCapacity')
      AND COALESCE(ks.last_admission_turn,0)=(SELECT min(COALESCE(k2.last_admission_turn,0)) FROM bridge.provider_work_attempt w2 LEFT JOIN bridge.provider_admission_key_state k2 ON(k2.quota_domain_id=w2.quota_domain_id AND k2.fairness_epoch=epoch AND k2.process_id=w2.process_id AND k2.process_profile_version=w2.process_profile_version AND k2.fairness_key=w2.fairness_key) WHERE w2.quota_domain_id=w.quota_domain_id AND w2.process_id=w.process_id AND w2.process_profile_version=w.process_profile_version AND w2.desired_profile_version=active.desired_profile_version AND w2.activation_revision=active.activation_revision AND w2.state='waiting' AND w2.service_class='background')
    ORDER BY GREATEST(COALESCE(ls.virtual_usage,domain_state.virtual_time),domain_state.virtual_time)/NULLIF((l.e->>'normalizedWeight')::numeric,0),w.fairness_key,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE OF w SKIP LOCKED;
  END IF;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE bridge.provider_work_attempt w SET state='reserved',state_version=state_version+1,updated_at=now() WHERE w.logical_work_id=candidate.logical_work_id AND w.attempt_number=candidate.attempt_number;
  INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES(candidate.logical_work_id,candidate.attempt_number,candidate.desired_profile_version,candidate.activation_revision,candidate.request_resource_envelope) RETURNING * INTO reservation;
  IF candidate.service_class='background' THEN
    SELECT e INTO lane FROM jsonb_array_elements(profile->'backgroundLanes') e WHERE e->>'processId'=candidate.process_id AND e->>'profileVersion'=candidate.process_profile_version;
    weight := (lane->>'normalizedWeight')::numeric;
    dominant := GREATEST(COALESCE((candidate.request_resource_envelope->>'rpm')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'rpm')::numeric,0),COALESCE((candidate.request_resource_envelope->>'tpm')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'tpm')::numeric,0),COALESCE((candidate.request_resource_envelope->>'rpd')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'rpd')::numeric,0),COALESCE((candidate.request_resource_envelope->>'concurrency')::numeric,0)/NULLIF((profile->'backgroundCapacity'->>'concurrency')::numeric,0));
    INSERT INTO bridge.provider_admission_lane_state(quota_domain_id,fairness_epoch,process_id,process_profile_version,virtual_usage,last_admission_turn) VALUES(p_quota_domain_id,epoch,candidate.process_id,candidate.process_profile_version,domain_state.virtual_time+dominant/weight,domain_state.next_turn) ON CONFLICT(quota_domain_id,fairness_epoch,process_id,process_profile_version) DO UPDATE SET virtual_usage=GREATEST(bridge.provider_admission_lane_state.virtual_usage,domain_state.virtual_time)+dominant/weight,last_admission_turn=domain_state.next_turn;
    INSERT INTO bridge.provider_admission_key_state VALUES(p_quota_domain_id,epoch,candidate.process_id,candidate.process_profile_version,candidate.fairness_key,domain_state.next_turn) ON CONFLICT(quota_domain_id,fairness_epoch,process_id,process_profile_version,fairness_key) DO UPDATE SET last_admission_turn=EXCLUDED.last_admission_turn;
    UPDATE bridge.provider_admission_domain_state SET virtual_time=GREATEST(virtual_time,domain_state.virtual_time+dominant/weight),next_turn=next_turn+1 WHERE quota_domain_id=p_quota_domain_id;
  END IF;
  INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',candidate.logical_work_id,'attemptNumber',candidate.attempt_number,'reservationId',reservation.reservation_id),'short',candidate.logical_work_id||':'||candidate.attempt_number) RETURNING id INTO dispatch_job;
  INSERT INTO bridge.provider_work_dispatch VALUES(candidate.logical_work_id,candidate.attempt_number,reservation.reservation_id,dispatch_job);
  UPDATE bridge.provider_work_attempt w SET state='dispatched',state_version=state_version+1,updated_at=now() WHERE w.logical_work_id=candidate.logical_work_id AND w.attempt_number=candidate.attempt_number;
  RETURN QUERY SELECT candidate.logical_work_id,candidate.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.admit_interactive_provider_work_attempt(
  p_logical_work_id text, p_attempt_number integer
) RETURNS TABLE(decision text,logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE active record; profile jsonb; work bridge.provider_work_attempt; used jsonb;
  reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  SELECT w.* INTO work FROM bridge.provider_work_attempt w
    WHERE w.logical_work_id=p_logical_work_id AND w.attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND OR work.service_class <> 'interactive' THEN
    RETURN QUERY SELECT 'unavailable'::text,p_logical_work_id,p_attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  IF work.state <> 'waiting' OR work.cancellation_requested_at IS NOT NULL THEN
    RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  IF (work.admission_deadline_at IS NOT NULL AND work.admission_deadline_at <= now()) OR (work.execution_deadline_at IS NOT NULL AND work.execution_deadline_at <= now()) THEN
    RETURN QUERY SELECT 'deadline_expired'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(work.quota_domain_id, 602));
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision THEN
    RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  profile := active.profile;
  SELECT jsonb_build_object('rpm',COALESCE(sum(COALESCE((r.request_resource_envelope->>'rpm')::numeric,0)),0),'tpm',COALESCE(sum(COALESCE((r.request_resource_envelope->>'tpm')::numeric,0)),0),'rpd',COALESCE(sum(COALESCE((r.request_resource_envelope->>'rpd')::numeric,0)),0),'concurrency',COALESCE(sum(COALESCE((r.request_resource_envelope->>'concurrency')::numeric,0)),0)) INTO used
    FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number)
    WHERE w.quota_domain_id=work.quota_domain_id AND r.state='live';
  IF NOT bridge.admission_vector_fits(used,work.request_resource_envelope,profile->'usableGlobalCapacity') THEN
    RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  UPDATE bridge.provider_work_attempt w SET state='reserved',state_version=w.state_version+1,updated_at=now() WHERE w.logical_work_id=work.logical_work_id AND w.attempt_number=work.attempt_number;
  INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES(work.logical_work_id,work.attempt_number,work.desired_profile_version,work.activation_revision,work.request_resource_envelope) RETURNING * INTO reservation;
  INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id),'short',work.logical_work_id||':'||work.attempt_number) RETURNING id INTO dispatch_job;
  INSERT INTO bridge.provider_work_dispatch VALUES(work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job);
  UPDATE bridge.provider_work_attempt w SET state='dispatched',state_version=w.state_version+1,updated_at=now() WHERE w.logical_work_id=work.logical_work_id AND w.attempt_number=work.attempt_number;
  RETURN QUERY SELECT 'admitted'::text,work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;

ALTER FUNCTION bridge.admit_next_provider_work_attempt(text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_interactive_provider_work_attempt(text,integer) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.admit_next_provider_work_attempt(text),bridge.admit_interactive_provider_work_attempt(text,integer) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_next_provider_work_attempt(text),bridge.admit_interactive_provider_work_attempt(text,integer) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0036_bssv200602_cfc_fair_admission_closure') ON CONFLICT DO NOTHING;
