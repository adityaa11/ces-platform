-- Forward-only composed-runtime closure for BSS-V2-006-03A-06.
--
-- Route binding is an authorization fence, not an ordinary capacity miss.
-- Keep both service-class entrypoints on the shared 03A-05 authority while
-- rejecting an unbound attempt before it can create a reservation or job.
CREATE OR REPLACE FUNCTION bridge.admit_route_aware_provider_work_attempt(
  p_logical_work_id text, p_attempt_number integer, p_expected_service_class text DEFAULT NULL
) RETURNS TABLE(decision text,logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE domain_id text; active record; profile jsonb; work bridge.provider_work_attempt;
  binding bridge.provider_work_route_binding; used jsonb; clamped_global jsonb; limit_vector jsonb;
  reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  SELECT w0.quota_domain_id INTO domain_id FROM bridge.provider_work_attempt w0
    WHERE w0.logical_work_id=p_logical_work_id AND w0.attempt_number=p_attempt_number;
  IF NOT FOUND THEN RETURN QUERY SELECT 'unavailable'::text,p_logical_work_id,p_attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(domain_id, 602));
  SELECT * INTO work FROM bridge.provider_work_attempt w0 WHERE w0.logical_work_id=p_logical_work_id AND w0.attempt_number=p_attempt_number FOR UPDATE;
  IF p_expected_service_class IS NOT NULL AND work.service_class<>p_expected_service_class THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF work.state<>'waiting' OR work.cancellation_requested_at IS NOT NULL THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF (work.admission_deadline_at IS NOT NULL AND work.admission_deadline_at<=clock_timestamp()) OR (work.execution_deadline_at IS NOT NULL AND work.execution_deadline_at<=clock_timestamp()) THEN RETURN QUERY SELECT 'deadline_expired'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  SELECT * INTO binding FROM bridge.provider_work_route_binding b WHERE b.logical_work_id=work.logical_work_id AND b.attempt_number=work.attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work route binding is required before reservation'; END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR work.desired_profile_version<>active.desired_profile_version OR work.activation_revision<>active.activation_revision THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF bridge.provider_pressure_blocks_admission(work.quota_domain_id,binding.selected_route_id,false) THEN RETURN QUERY SELECT 'pressure_limited'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  profile:=active.profile;
  IF NOT (profile ? 'usableGlobalCapacity' AND profile ? 'hardInteractiveReserve' AND profile ? 'backgroundCapacity') THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  BEGIN used:=bridge.current_provider_operational_usage(work.quota_domain_id,active.provider_capacity_profile_version); EXCEPTION WHEN others THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END;
  clamped_global:=bridge.apply_domain_pressure_clamps(work.quota_domain_id,used,profile->'usableGlobalCapacity');
  limit_vector:=CASE WHEN work.service_class='background' THEN bridge.background_admission_capacity(profile,used,clamped_global) ELSE clamped_global END;
  IF NOT bridge.admission_vector_fits(used,work.request_resource_envelope,limit_vector) THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  UPDATE bridge.provider_work_attempt w0 SET state='reserved',state_version=state_version+1,updated_at=clock_timestamp() WHERE w0.logical_work_id=work.logical_work_id AND w0.attempt_number=work.attempt_number;
  INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES(work.logical_work_id,work.attempt_number,work.desired_profile_version,work.activation_revision,work.request_resource_envelope) RETURNING * INTO reservation;
  PERFORM bridge.reserve_provider_operational_windows(reservation.reservation_id);
  INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id),'short',work.logical_work_id||':'||work.attempt_number) RETURNING id INTO dispatch_job;
  INSERT INTO bridge.provider_work_dispatch VALUES(work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job);
  UPDATE bridge.provider_work_attempt w0 SET state='dispatched',state_version=state_version+1,updated_at=clock_timestamp() WHERE w0.logical_work_id=work.logical_work_id AND w0.attempt_number=work.attempt_number;
  RETURN QUERY SELECT 'admitted'::text,work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;
ALTER FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0066_bssv200603a_missing_route_binding_closure') ON CONFLICT DO NOTHING;
