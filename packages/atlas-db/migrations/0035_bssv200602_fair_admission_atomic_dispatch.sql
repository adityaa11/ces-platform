-- BSS-V2-006-02: durable fair admission and one-attempt pg-boss dispatch.
-- The DB transaction is the sole authority for selection, reservation and enqueue.

ALTER TABLE bridge.provider_work_attempt DROP CONSTRAINT IF EXISTS provider_work_attempt_state_check;
ALTER TABLE bridge.provider_work_attempt ADD CONSTRAINT provider_work_attempt_state_check
  CHECK (state IN ('waiting','reserved','dispatched','transport_may_have_started','terminal','reconciled'));

CREATE TABLE bridge.provider_admission_lane_state (
  quota_domain_id text NOT NULL, fairness_epoch text NOT NULL,
  process_id text NOT NULL, process_profile_version text NOT NULL,
  virtual_usage numeric NOT NULL DEFAULT 0 CHECK (virtual_usage >= 0),
  last_admission_turn bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (quota_domain_id,fairness_epoch,process_id,process_profile_version)
);
CREATE TABLE bridge.provider_admission_key_state (
  quota_domain_id text NOT NULL, fairness_epoch text NOT NULL,
  process_id text NOT NULL, process_profile_version text NOT NULL, fairness_key text NOT NULL,
  last_admission_turn bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (quota_domain_id,fairness_epoch,process_id,process_profile_version,fairness_key)
);
CREATE TABLE bridge.provider_admission_domain_state (
  quota_domain_id text PRIMARY KEY, fairness_epoch text NOT NULL,
  virtual_time numeric NOT NULL DEFAULT 0 CHECK (virtual_time >= 0),
  next_turn bigint NOT NULL DEFAULT 1 CHECK (next_turn > 0)
);
CREATE TABLE bridge.provider_work_dispatch (
  logical_work_id text NOT NULL, attempt_number integer NOT NULL, reservation_id uuid NOT NULL UNIQUE,
  job_id uuid NOT NULL UNIQUE, dispatched_at timestamptz NOT NULL DEFAULT now(), transport_claimed_at timestamptz,
  PRIMARY KEY (logical_work_id,attempt_number),
  FOREIGN KEY (logical_work_id,attempt_number) REFERENCES bridge.provider_work_attempt(logical_work_id,attempt_number),
  FOREIGN KEY (reservation_id) REFERENCES bridge.provider_work_reservation(reservation_id)
);

CREATE OR REPLACE FUNCTION bridge.admission_vector_fits(p_used jsonb, p_next jsonb, p_limit jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE((p_used->>'rpm')::numeric,0)+COALESCE((p_next->>'rpm')::numeric,0) <= (p_limit->>'rpm')::numeric
     AND COALESCE((p_used->>'tpm')::numeric,0)+COALESCE((p_next->>'tpm')::numeric,0) <= (p_limit->>'tpm')::numeric
     AND COALESCE((p_used->>'rpd')::numeric,0)+COALESCE((p_next->>'rpd')::numeric,0) <= (p_limit->>'rpd')::numeric
     AND COALESCE((p_used->>'concurrency')::numeric,0)+COALESCE((p_next->>'concurrency')::numeric,0) <= (p_limit->>'concurrency')::numeric;
$$;

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
  -- Interactive is selected before all background fairness and consumes only global capacity.
  SELECT * INTO candidate FROM bridge.provider_work_attempt w WHERE w.quota_domain_id=p_quota_domain_id AND w.state='waiting' AND w.service_class='interactive' AND w.cancellation_requested_at IS NULL AND (w.admission_deadline_at IS NULL OR w.admission_deadline_at>now()) AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>now()) AND bridge.admission_vector_fits(used,w.request_resource_envelope,profile->'usableGlobalCapacity') ORDER BY w.admission_deadline_at NULLS LAST,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN
    -- A lane's selected key is durable LRA, then its weighted dominant virtual usage.
    SELECT w.* INTO candidate FROM bridge.provider_work_attempt w
    JOIN LATERAL (SELECT e FROM jsonb_array_elements(profile->'backgroundLanes') e WHERE e->>'processId'=w.process_id AND e->>'profileVersion'=w.process_profile_version) l ON true
    LEFT JOIN bridge.provider_admission_key_state ks ON (ks.quota_domain_id=w.quota_domain_id AND ks.fairness_epoch=epoch AND ks.process_id=w.process_id AND ks.process_profile_version=w.process_profile_version AND ks.fairness_key=w.fairness_key)
    LEFT JOIN bridge.provider_admission_lane_state ls ON (ls.quota_domain_id=w.quota_domain_id AND ls.fairness_epoch=epoch AND ls.process_id=w.process_id AND ls.process_profile_version=w.process_profile_version)
    WHERE w.quota_domain_id=p_quota_domain_id AND w.state='waiting' AND w.service_class='background' AND w.cancellation_requested_at IS NULL AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>now()) AND bridge.admission_vector_fits(used,w.request_resource_envelope,profile->'backgroundCapacity')
      AND COALESCE(ks.last_admission_turn,0)=(SELECT min(COALESCE(k2.last_admission_turn,0)) FROM bridge.provider_work_attempt w2 LEFT JOIN bridge.provider_admission_key_state k2 ON(k2.quota_domain_id=w2.quota_domain_id AND k2.fairness_epoch=epoch AND k2.process_id=w2.process_id AND k2.process_profile_version=w2.process_profile_version AND k2.fairness_key=w2.fairness_key) WHERE w2.quota_domain_id=w.quota_domain_id AND w2.process_id=w.process_id AND w2.process_profile_version=w.process_profile_version AND w2.state='waiting' AND w2.service_class='background')
    ORDER BY COALESCE(ls.virtual_usage,domain_state.virtual_time)/NULLIF((l.e->>'normalizedWeight')::numeric,0),w.fairness_key,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE OF w SKIP LOCKED;
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

CREATE OR REPLACE FUNCTION bridge.claim_fake_provider_transport(p_reservation_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE d bridge.provider_work_dispatch;
BEGIN
  SELECT * INTO d FROM bridge.provider_work_dispatch WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND OR d.transport_claimed_at IS NOT NULL THEN RAISE EXCEPTION 'reservation already authorized an outbound attempt'; END IF;
  UPDATE bridge.provider_work_attempt SET state='transport_may_have_started',state_version=state_version+1,updated_at=now() WHERE logical_work_id=d.logical_work_id AND attempt_number=d.attempt_number AND state='dispatched' AND cancellation_requested_at IS NULL AND (execution_deadline_at IS NULL OR execution_deadline_at>now());
  IF NOT FOUND THEN RAISE EXCEPTION 'dispatched provider work is stale, cancelled, or expired'; END IF;
  UPDATE bridge.provider_work_dispatch SET transport_claimed_at=now() WHERE reservation_id=p_reservation_id;
END;
$$;

SELECT pgboss.create_queue('bridge-provider-admitted-execution-v1','{"policy":"short"}'::jsonb);
ALTER TABLE bridge.provider_admission_lane_state OWNER TO agents_bridge;
ALTER TABLE bridge.provider_admission_key_state OWNER TO agents_bridge;
ALTER TABLE bridge.provider_admission_domain_state OWNER TO agents_bridge;
ALTER TABLE bridge.provider_work_dispatch OWNER TO agents_bridge;
ALTER FUNCTION bridge.admission_vector_fits(jsonb,jsonb,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_next_provider_work_attempt(text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.claim_fake_provider_transport(uuid) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_admission_lane_state,bridge.provider_admission_key_state,bridge.provider_admission_domain_state,bridge.provider_work_dispatch FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.admission_vector_fits(jsonb,jsonb,jsonb),bridge.admit_next_provider_work_attempt(text),bridge.claim_fake_provider_transport(uuid) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_next_provider_work_attempt(text),bridge.claim_fake_provider_transport(uuid) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0035_bssv200602_fair_admission_atomic_dispatch') ON CONFLICT DO NOTHING;
