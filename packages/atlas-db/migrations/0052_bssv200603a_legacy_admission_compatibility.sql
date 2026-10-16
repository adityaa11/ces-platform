-- 006-01/02 retain their admission-only contract.  An old unbound attempt
-- can still be atomically reserved/dispatched, but it can never cross the
-- 03A worker transport claim (which requires an immutable route binding).
-- This compatibility replacement deliberately has no pressure or wakeup
-- policy: those are owned by the following 03A ticket.
CREATE OR REPLACE FUNCTION bridge.require_provider_work_route_before_reservation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- An empty eligible-route set is the accepted 006-01/02 generic path.  It
  -- remains unclaimable by the 03A worker; route-capable work must retain the
  -- predecessor's resolver binding before it can reserve.
  IF NOT EXISTS (
    SELECT 1 FROM bridge.provider_work_route_binding
    WHERE logical_work_id=NEW.logical_work_id AND attempt_number=NEW.attempt_number
  ) AND EXISTS (
    SELECT 1 FROM bridge.provider_work_attempt work
    JOIN bridge.provider_process_profile process
      ON (process.process_id,process.profile_version)=(work.process_id,work.process_profile_version)
    WHERE work.logical_work_id=NEW.logical_work_id AND work.attempt_number=NEW.attempt_number
      AND process.eligible_route_ids <> '[]'::jsonb
  ) THEN
    RAISE EXCEPTION 'provider work requires a server-qualified route binding before reservation';
  END IF;
  RETURN NEW;
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
  PERFORM pg_advisory_xact_lock(hashtextextended(work.quota_domain_id, 602));
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  profile:=active.profile;
  BEGIN used:=bridge.current_provider_operational_usage(work.quota_domain_id,active.provider_capacity_profile_version); EXCEPTION WHEN others THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END;
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
REVOKE ALL ON FUNCTION bridge.admit_interactive_provider_work_attempt(text,integer) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_interactive_provider_work_attempt(text,integer) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0052_bssv200603a_legacy_admission_compatibility') ON CONFLICT DO NOTHING;
