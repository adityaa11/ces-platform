-- Route-scoped incidents are checked by the existing targeted admission
-- authority before it creates a reservation/job.  A pressure hold is thus a
-- bounded unavailable result, never a retry loop or an unreserved send.
-- Only qualified domain-scoped observations may lower the one canonical
-- domain vector. Route holds deliberately never appear in this calculation.
CREATE OR REPLACE FUNCTION bridge.apply_domain_pressure_clamps(
  p_quota_domain_id text, p_used jsonb, p_capacity jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb := p_capacity; incident record; current_capacity numeric; used_units numeric;
BEGIN
  FOR incident IN SELECT dimension_id,numeric_remaining_units FROM bridge.provider_operational_pressure_incident
    WHERE quota_domain_id=p_quota_domain_id AND scope_kind='domain' AND recovered_at IS NULL
      AND cooldown_until>clock_timestamp() AND numeric_remaining_units IS NOT NULL LOOP
    current_capacity := (result->>incident.dimension_id)::numeric;
    used_units := COALESCE((p_used->>incident.dimension_id)::numeric,0);
    result := jsonb_set(result, ARRAY[incident.dimension_id], to_jsonb(LEAST(current_capacity,used_units+incident.numeric_remaining_units)));
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.admit_interactive_provider_work_attempt(
  p_logical_work_id text, p_attempt_number integer
) RETURNS TABLE(decision text,logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE active record; profile jsonb; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding; used jsonb;
  reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  SELECT w.* INTO work FROM bridge.provider_work_attempt w WHERE w.logical_work_id=p_logical_work_id AND w.attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND OR work.service_class <> 'interactive' THEN RETURN QUERY SELECT 'unavailable'::text,p_logical_work_id,p_attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF work.state <> 'waiting' OR work.cancellation_requested_at IS NOT NULL THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF (work.admission_deadline_at IS NOT NULL AND work.admission_deadline_at <= clock_timestamp()) OR (work.execution_deadline_at IS NOT NULL AND work.execution_deadline_at <= clock_timestamp()) THEN RETURN QUERY SELECT 'deadline_expired'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  SELECT b.* INTO binding FROM bridge.provider_work_route_binding b WHERE b.logical_work_id=work.logical_work_id AND b.attempt_number=work.attempt_number;
  IF NOT FOUND THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(work.quota_domain_id, 602));
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF bridge.provider_pressure_blocks_admission(work.quota_domain_id,binding.selected_route_id,false) THEN RETURN QUERY SELECT 'pressure_limited'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  profile:=active.profile;
  BEGIN used:=bridge.current_provider_operational_usage(work.quota_domain_id,active.provider_capacity_profile_version); EXCEPTION WHEN others THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END;
  profile:=jsonb_set(profile,'{usableGlobalCapacity}',bridge.apply_domain_pressure_clamps(work.quota_domain_id,used,profile->'usableGlobalCapacity'));
  IF NOT bridge.admission_vector_fits(used,work.request_resource_envelope,profile->'usableGlobalCapacity') THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  UPDATE bridge.provider_work_attempt w SET state='reserved',state_version=w.state_version+1,updated_at=clock_timestamp() WHERE w.logical_work_id=work.logical_work_id AND w.attempt_number=work.attempt_number;
  INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES(work.logical_work_id,work.attempt_number,work.desired_profile_version,work.activation_revision,work.request_resource_envelope) RETURNING * INTO reservation;
  PERFORM bridge.reserve_provider_operational_windows(reservation.reservation_id);
  INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id),'short',work.logical_work_id||':'||work.attempt_number) RETURNING id INTO dispatch_job;
  INSERT INTO bridge.provider_work_dispatch VALUES(work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job);
  UPDATE bridge.provider_work_attempt w SET state='dispatched',state_version=w.state_version+1,updated_at=clock_timestamp() WHERE w.logical_work_id=work.logical_work_id AND w.attempt_number=work.attempt_number;
  RETURN QUERY SELECT 'admitted'::text,work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;
ALTER FUNCTION bridge.admit_interactive_provider_work_attempt(text,integer) OWNER TO agents_bridge;
ALTER FUNCTION bridge.apply_domain_pressure_clamps(text,jsonb,jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.admit_interactive_provider_work_attempt(text,integer) FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.apply_domain_pressure_clamps(text,jsonb,jsonb) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_interactive_provider_work_attempt(text,integer) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0050_bssv200603a_route_pressure_admission') ON CONFLICT DO NOTHING;
