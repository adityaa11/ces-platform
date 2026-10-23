-- BSS-V2-014-04-03: a background process may temporarily exceed its own
-- baseline only by consuming a peer's presently unused background entitlement.
-- This stays inside the existing domain-lock / reservation transaction; it
-- neither modifies the immutable plan nor introduces a scheduler or queue.

CREATE OR REPLACE FUNCTION bridge.v2_background_borrowing_eligible(
  p_work bridge.provider_work_attempt
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  active record; limits jsonb; dimensions text[]; process_used jsonb;
  class_used jsonb; lane jsonb; peer jsonb; peer_used jsonb;
  lender_idle jsonb := '{}'::jsonb; dimension text; available numeric;
  required numeric; has_waiting_demand boolean;
BEGIN
  IF p_work.service_class <> 'background' THEN RETURN true; END IF;
  limits := bridge.v2_process_admission_limits(p_work);
  IF limits IS NULL THEN RETURN true; END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_work.quota_domain_id);
  IF NOT FOUND OR p_work.desired_profile_version <> active.desired_profile_version
    OR p_work.activation_revision <> active.activation_revision THEN
    RETURN false;
  END IF;
  SELECT array_agg(value ORDER BY value) INTO dimensions
    FROM jsonb_array_elements_text(limits->'dimensions');
  SELECT COALESCE(jsonb_object_agg(dimension_id,units),'{}'::jsonb) INTO process_used
    FROM (SELECT dimension_id,sum(GREATEST(held_units,spent_units)) units
      FROM bridge.read_process_capacity_window_usage_v1(p_work.quota_domain_id)
      WHERE process_id=p_work.process_id AND process_profile_version=p_work.process_profile_version
        AND window_is_open GROUP BY dimension_id) usage;
  IF bridge.admission_vector_fits(process_used,p_work.request_resource_envelope,limits->'baseline') THEN
    RETURN true;
  END IF;
  SELECT entry INTO lane FROM jsonb_array_elements(COALESCE(active.profile->'backgroundLanes','[]'::jsonb)) entry
    WHERE entry->>'processId'=p_work.process_id AND entry->>'profileVersion'=p_work.process_profile_version;
  IF COALESCE((lane->>'mayBorrowIdleCapacity')::boolean,false) IS NOT TRUE
    OR NOT bridge.admission_vector_fits(process_used,p_work.request_resource_envelope,limits->'cap') THEN
    RETURN false;
  END IF;
  SELECT COALESCE(jsonb_object_agg(dimension_id,units),'{}'::jsonb) INTO class_used
    FROM (SELECT projection.dimension_id,sum(GREATEST(projection.held_units,projection.spent_units)) units
      FROM bridge.read_process_capacity_window_usage_v1(p_work.quota_domain_id) projection
      JOIN bridge.provider_work_reservation reservation ON reservation.reservation_id=projection.reservation_id
      JOIN bridge.provider_work_attempt prior
        ON (prior.logical_work_id,prior.attempt_number)=(reservation.logical_work_id,reservation.attempt_number)
      WHERE prior.service_class='background' AND projection.window_is_open
      GROUP BY projection.dimension_id) usage;
  IF NOT bridge.admission_vector_fits(class_used,p_work.request_resource_envelope,limits->'classPool') THEN
    RETURN false;
  END IF;
  FOR peer IN SELECT value FROM jsonb_array_elements(COALESCE((SELECT allocation FROM bridge.calculated_class_process_allocation
      WHERE quota_domain_id=p_work.quota_domain_id AND desired_profile_version=p_work.desired_profile_version)->'processes','[]'::jsonb)) value
    WHERE value->>'serviceClass'='background'
      AND (value->>'processId',value->>'profileVersion') IS DISTINCT FROM (p_work.process_id,p_work.process_profile_version)
  LOOP
    SELECT EXISTS(SELECT 1 FROM bridge.provider_work_attempt waiting
      JOIN bridge.provider_work_route_binding binding
        ON (binding.logical_work_id,binding.attempt_number)=(waiting.logical_work_id,waiting.attempt_number)
      WHERE waiting.quota_domain_id=p_work.quota_domain_id
        AND waiting.desired_profile_version=p_work.desired_profile_version
        AND waiting.activation_revision=p_work.activation_revision
        AND waiting.process_id=peer->>'processId'
        AND waiting.process_profile_version=peer->>'profileVersion'
        AND waiting.service_class='background' AND waiting.state='waiting'
        AND waiting.cancellation_requested_at IS NULL
        AND (waiting.admission_deadline_at IS NULL OR waiting.admission_deadline_at>clock_timestamp())
        AND (waiting.execution_deadline_at IS NULL OR waiting.execution_deadline_at>clock_timestamp()))
      INTO has_waiting_demand;
    IF has_waiting_demand THEN CONTINUE; END IF;
    SELECT COALESCE(jsonb_object_agg(dimension_id,units),'{}'::jsonb) INTO peer_used
      FROM (SELECT dimension_id,sum(GREATEST(held_units,spent_units)) units
        FROM bridge.read_process_capacity_window_usage_v1(p_work.quota_domain_id)
        WHERE process_id=peer->>'processId' AND process_profile_version=peer->>'profileVersion'
          AND window_is_open GROUP BY dimension_id) usage;
    FOREACH dimension IN ARRAY dimensions LOOP
      available := GREATEST(COALESCE((peer->'baseline'->>dimension)::numeric,0) - COALESCE((peer_used->>dimension)::numeric,0),0);
      lender_idle := jsonb_set(lender_idle,ARRAY[dimension],to_jsonb(COALESCE((lender_idle->>dimension)::numeric,0)+available));
    END LOOP;
  END LOOP;
  FOREACH dimension IN ARRAY dimensions LOOP
    required := GREATEST(COALESCE((process_used->>dimension)::numeric,0)+COALESCE((p_work.request_resource_envelope->>dimension)::numeric,0)-COALESCE((limits->'baseline'->>dimension)::numeric,0),0);
    IF required > COALESCE((lender_idle->>dimension)::numeric,0) THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.admit_route_aware_provider_work_attempt(
  p_logical_work_id text,p_attempt_number integer,p_expected_service_class text DEFAULT NULL
) RETURNS TABLE(decision text,logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE domain_id text; active record; profile jsonb; work bridge.provider_work_attempt;
  binding bridge.provider_work_route_binding; limits jsonb; dimensions text[]; used jsonb; process_used jsonb; class_used jsonb;
  clamped_global jsonb; limit_vector jsonb; reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  SELECT attempt.quota_domain_id INTO domain_id FROM bridge.provider_work_attempt attempt
    WHERE attempt.logical_work_id=p_logical_work_id AND attempt.attempt_number=p_attempt_number;
  IF NOT FOUND THEN RETURN QUERY SELECT 'unavailable',p_logical_work_id,p_attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(domain_id,602));
  SELECT * INTO work FROM bridge.provider_work_attempt attempt WHERE attempt.logical_work_id=p_logical_work_id AND attempt.attempt_number=p_attempt_number FOR UPDATE;
  IF (p_expected_service_class IS NOT NULL AND work.service_class<>p_expected_service_class)
    OR work.state<>'waiting' OR work.cancellation_requested_at IS NOT NULL THEN
    RETURN QUERY SELECT 'unavailable',work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  IF (work.admission_deadline_at IS NOT NULL AND work.admission_deadline_at<=clock_timestamp())
    OR (work.execution_deadline_at IS NOT NULL AND work.execution_deadline_at<=clock_timestamp()) THEN
    RETURN QUERY SELECT 'deadline_expired',work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  BEGIN SELECT * INTO binding FROM bridge.require_v2_provider_work_authority(work.logical_work_id,work.attempt_number); EXCEPTION WHEN others THEN
    RETURN QUERY SELECT 'unavailable',work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR work.desired_profile_version<>active.desired_profile_version OR work.activation_revision<>active.activation_revision
    OR bridge.provider_pressure_blocks_admission(work.quota_domain_id,binding.selected_route_id,false) THEN
    RETURN QUERY SELECT 'unavailable',work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  profile:=active.profile;
  BEGIN
    dimensions:=bridge.effective_admission_dimensions(work.quota_domain_id,active.desired_profile_version,profile);
    used:=bridge.current_provider_operational_usage(work.quota_domain_id,active.provider_capacity_profile_version,dimensions);
    limits:=bridge.v2_process_admission_limits(work);
    IF limits IS NOT NULL THEN
      SELECT COALESCE(jsonb_object_agg(dimension_id,units),'{}'::jsonb) INTO process_used
        FROM (SELECT dimension_id,sum(GREATEST(held_units,spent_units)) units
          FROM bridge.read_process_capacity_window_usage_v1(work.quota_domain_id)
          WHERE process_id=work.process_id AND process_profile_version=work.process_profile_version
            AND window_is_open GROUP BY dimension_id) usage;
      SELECT COALESCE(jsonb_object_agg(dimension_id,units),'{}'::jsonb) INTO class_used
        FROM (SELECT projection.dimension_id,sum(GREATEST(projection.held_units,projection.spent_units)) units
          FROM bridge.read_process_capacity_window_usage_v1(work.quota_domain_id) projection
          JOIN bridge.provider_work_reservation prior_reservation
            ON prior_reservation.reservation_id=projection.reservation_id
          JOIN bridge.provider_work_attempt prior
            ON (prior.logical_work_id,prior.attempt_number)=(prior_reservation.logical_work_id,prior_reservation.attempt_number)
          WHERE prior.service_class=work.service_class AND projection.window_is_open GROUP BY projection.dimension_id) usage;
      IF NOT bridge.admission_vector_fits(process_used,work.request_resource_envelope,limits->'cap')
        OR NOT bridge.admission_vector_fits(class_used,work.request_resource_envelope,limits->'classPool')
        OR (work.service_class <> 'background' AND NOT bridge.admission_vector_fits(process_used,work.request_resource_envelope,limits->'baseline'))
        OR (work.service_class = 'background' AND NOT bridge.v2_background_borrowing_eligible(work)) THEN
        RETURN QUERY SELECT 'unavailable',work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
      END IF;
    END IF;
  EXCEPTION WHEN others THEN
    RETURN QUERY SELECT 'unavailable',work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END;
  clamped_global:=bridge.apply_domain_pressure_clamps(work.quota_domain_id,used,profile->'usableGlobalCapacity');
  limit_vector:=CASE WHEN work.service_class='background' THEN bridge.background_admission_capacity(profile,used,clamped_global) ELSE clamped_global END;
  IF NOT bridge.admission_vector_fits(used,work.request_resource_envelope,limit_vector) THEN
    RETURN QUERY SELECT 'unavailable',work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN;
  END IF;
  UPDATE bridge.provider_work_attempt attempt SET state='reserved',state_version=attempt.state_version+1,updated_at=clock_timestamp()
    WHERE attempt.logical_work_id=work.logical_work_id AND attempt.attempt_number=work.attempt_number;
  INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope)
    VALUES(work.logical_work_id,work.attempt_number,work.desired_profile_version,work.activation_revision,work.request_resource_envelope) RETURNING * INTO reservation;
  PERFORM bridge.reserve_provider_operational_windows(reservation.reservation_id);
  INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id),'short',work.logical_work_id||':'||work.attempt_number) RETURNING id INTO dispatch_job;
  INSERT INTO bridge.provider_work_dispatch VALUES(work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job);
  UPDATE bridge.provider_work_attempt attempt SET state='dispatched',state_version=state_version+1,updated_at=clock_timestamp()
    WHERE attempt.logical_work_id=work.logical_work_id AND attempt.attempt_number=work.attempt_number;
  RETURN QUERY SELECT 'admitted',work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;

-- Do not let a currently demanding lender be skipped by the established fair
-- selector merely because an earlier borrower would otherwise be considered.
CREATE OR REPLACE FUNCTION bridge.admit_next_provider_work_attempt(p_quota_domain_id text)
RETURNS TABLE(logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE active record; profile jsonb; epoch text; candidate bridge.provider_work_attempt; dimensions text[]; used jsonb; clamped_global jsonb; background_limit jsonb; lane jsonb; weight numeric; dominant numeric; domain_state bridge.provider_admission_domain_state; admitted record;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id,602)); SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'active desired admission profile is required'; END IF; profile:=active.profile;
  dimensions:=bridge.effective_admission_dimensions(p_quota_domain_id,active.desired_profile_version,profile); epoch:=active.desired_profile_version||':'||active.activation_revision;
  INSERT INTO bridge.provider_admission_domain_state(quota_domain_id,fairness_epoch) VALUES(p_quota_domain_id,epoch) ON CONFLICT(quota_domain_id) DO UPDATE SET fairness_epoch=EXCLUDED.fairness_epoch,virtual_time=CASE WHEN bridge.provider_admission_domain_state.fairness_epoch<>EXCLUDED.fairness_epoch THEN 0 ELSE bridge.provider_admission_domain_state.virtual_time END;
  SELECT * INTO domain_state FROM bridge.provider_admission_domain_state WHERE quota_domain_id=p_quota_domain_id FOR UPDATE;
  BEGIN used:=bridge.current_provider_operational_usage(p_quota_domain_id,active.provider_capacity_profile_version,dimensions); EXCEPTION WHEN others THEN RETURN; END;
  clamped_global:=bridge.apply_domain_pressure_clamps(p_quota_domain_id,used,profile->'usableGlobalCapacity'); background_limit:=bridge.background_admission_capacity(profile,used,clamped_global);
  SELECT w.* INTO candidate FROM bridge.provider_work_attempt w JOIN bridge.provider_work_route_binding b USING(logical_work_id,attempt_number)
    WHERE w.quota_domain_id=p_quota_domain_id AND w.desired_profile_version=active.desired_profile_version AND w.activation_revision=active.activation_revision AND w.state='waiting' AND w.service_class='interactive' AND w.cancellation_requested_at IS NULL AND (w.admission_deadline_at IS NULL OR w.admission_deadline_at>clock_timestamp()) AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>clock_timestamp()) AND NOT bridge.provider_pressure_blocks_admission(w.quota_domain_id,b.selected_route_id,false) AND bridge.admission_vector_fits(used,w.request_resource_envelope,clamped_global) ORDER BY w.admission_deadline_at NULLS LAST,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE OF w SKIP LOCKED;
  IF NOT FOUND THEN
    SELECT w.* INTO candidate FROM bridge.provider_work_attempt w JOIN bridge.provider_work_route_binding b USING(logical_work_id,attempt_number) JOIN LATERAL (SELECT e FROM jsonb_array_elements(profile->'backgroundLanes') e WHERE e->>'processId'=w.process_id AND e->>'profileVersion'=w.process_profile_version) l ON true LEFT JOIN bridge.provider_admission_key_state ks ON(ks.quota_domain_id=w.quota_domain_id AND ks.fairness_epoch=epoch AND ks.process_id=w.process_id AND ks.process_profile_version=w.process_profile_version AND ks.fairness_key=w.fairness_key) LEFT JOIN bridge.provider_admission_lane_state ls ON(ls.quota_domain_id=w.quota_domain_id AND ls.fairness_epoch=epoch AND ls.process_id=w.process_id AND ls.process_profile_version=w.process_profile_version)
      WHERE w.quota_domain_id=p_quota_domain_id AND w.desired_profile_version=active.desired_profile_version AND w.activation_revision=active.activation_revision AND w.state='waiting' AND w.service_class='background' AND w.cancellation_requested_at IS NULL AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>clock_timestamp()) AND NOT bridge.provider_pressure_blocks_admission(w.quota_domain_id,b.selected_route_id,false) AND bridge.admission_vector_fits(used,w.request_resource_envelope,background_limit) AND bridge.v2_background_borrowing_eligible(w) AND COALESCE(ks.last_admission_turn,0)=(SELECT min(COALESCE(k2.last_admission_turn,0)) FROM bridge.provider_work_attempt w2 LEFT JOIN bridge.provider_admission_key_state k2 ON(k2.quota_domain_id=w2.quota_domain_id AND k2.fairness_epoch=epoch AND k2.process_id=w2.process_id AND k2.process_profile_version=w2.process_profile_version AND k2.fairness_key=w2.fairness_key) WHERE w2.quota_domain_id=w.quota_domain_id AND w2.process_id=w.process_id AND w2.process_profile_version=w.process_profile_version AND w2.desired_profile_version=active.desired_profile_version AND w2.activation_revision=active.activation_revision AND w2.state='waiting' AND w2.service_class='background') ORDER BY COALESCE(ls.virtual_usage,domain_state.virtual_time)/NULLIF((l.e->>'normalizedWeight')::numeric,0),w.fairness_key,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE OF w SKIP LOCKED;
  END IF;
  IF NOT FOUND THEN RETURN; END IF; SELECT * INTO admitted FROM bridge.admit_route_aware_provider_work_attempt(candidate.logical_work_id,candidate.attempt_number,NULL); IF admitted.decision<>'admitted' THEN RETURN; END IF;
  IF candidate.service_class='background' THEN
    SELECT e INTO lane FROM jsonb_array_elements(profile->'backgroundLanes') e WHERE e->>'processId'=candidate.process_id AND e->>'profileVersion'=candidate.process_profile_version; weight:=(lane->>'normalizedWeight')::numeric;
    SELECT max(COALESCE((candidate.request_resource_envelope->>dimension)::numeric,0)/NULLIF((background_limit->>dimension)::numeric,0)) INTO dominant FROM unnest(dimensions) dimension;
    INSERT INTO bridge.provider_admission_lane_state(quota_domain_id,fairness_epoch,process_id,process_profile_version,virtual_usage,last_admission_turn) VALUES(p_quota_domain_id,epoch,candidate.process_id,candidate.process_profile_version,domain_state.virtual_time+dominant/weight,domain_state.next_turn) ON CONFLICT(quota_domain_id,fairness_epoch,process_id,process_profile_version) DO UPDATE SET virtual_usage=GREATEST(bridge.provider_admission_lane_state.virtual_usage,domain_state.virtual_time)+dominant/weight,last_admission_turn=domain_state.next_turn;
    INSERT INTO bridge.provider_admission_key_state VALUES(p_quota_domain_id,epoch,candidate.process_id,candidate.process_profile_version,candidate.fairness_key,domain_state.next_turn) ON CONFLICT(quota_domain_id,fairness_epoch,process_id,process_profile_version,fairness_key) DO UPDATE SET last_admission_turn=EXCLUDED.last_admission_turn;
    UPDATE bridge.provider_admission_domain_state SET virtual_time=GREATEST(virtual_time,domain_state.virtual_time+dominant/weight),next_turn=next_turn+1 WHERE quota_domain_id=p_quota_domain_id;
  END IF;
  RETURN QUERY SELECT admitted.logical_work_id,admitted.attempt_number,admitted.reservation_id,admitted.job_id;
END;
$$;

ALTER FUNCTION bridge.v2_background_borrowing_eligible(bridge.provider_work_attempt) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_next_provider_work_attempt(text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.v2_background_borrowing_eligible(bridge.provider_work_attempt),bridge.admit_route_aware_provider_work_attempt(text,integer,text),bridge.admit_next_provider_work_attempt(text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text),bridge.admit_next_provider_work_attempt(text) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0101_bssv20140403_background_idle_borrowing') ON CONFLICT DO NOTHING;
