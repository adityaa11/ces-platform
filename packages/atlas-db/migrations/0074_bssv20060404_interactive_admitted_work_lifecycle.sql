-- BSS-V2-006-04-04: expose the existing generic admission/claim path to an
-- independently authenticated interactive consumer.  Service class, route,
-- quota domain and process remain server-selected by the principal binding.

CREATE OR REPLACE FUNCTION bridge.provider_work_admission_v1_outcome(
  p_logical_work_id text, p_attempt_number integer
) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state', CASE
    WHEN work.cancellation_requested_at IS NOT NULL THEN 'terminal_cancelled'
    WHEN work.state='waiting' THEN 'waiting'
    WHEN work.state='reserved' THEN 'reserved'
    WHEN work.state IN ('dispatched','transport_may_have_started') THEN 'dispatched_or_may_have_started'
    WHEN work.state='terminal' THEN 'terminal_cancelled'
    WHEN feedback.transport_disposition='may_have_started' THEN 'dispatched_or_may_have_started'
    WHEN feedback.normalized_feedback->>'operationalOutcome'='success' THEN 'terminal_success'
    WHEN feedback.normalized_feedback->>'operationalOutcome'='rate_limited' THEN 'pressure_limited'
    ELSE 'terminal_provider_failure' END,
    'logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id,'jobId',dispatch.job_id))
  FROM bridge.provider_work_attempt work
  LEFT JOIN bridge.provider_work_reservation reservation ON reservation.logical_work_id=work.logical_work_id AND reservation.attempt_number=work.attempt_number
  LEFT JOIN bridge.provider_work_dispatch dispatch ON dispatch.reservation_id=reservation.reservation_id
  LEFT JOIN bridge.provider_operational_feedback_event feedback ON feedback.reservation_id=reservation.reservation_id
  WHERE work.logical_work_id=p_logical_work_id AND work.attempt_number=p_attempt_number ORDER BY reservation.created_at DESC NULLS LAST LIMIT 1
$$;

CREATE OR REPLACE FUNCTION bridge.admit_provider_work_admission_v1(
  p_principal_id text, p_quota_domain_id text, p_process_id text,
  p_process_profile_version text, p_route_id text, p_service_class text,
  p_logical_work_id text, p_attempt_number integer, p_idempotency_key text,
  p_payload_reference text, p_payload_hash text, p_request jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE existing bridge.provider_work_admission_v1; existing_work bridge.provider_work_attempt;
  constraint_snapshot jsonb; admitted record; active_plan jsonb; expected_revision text;
  envelope jsonb; deadline_epoch numeric; admission_deadline timestamptz; execution_deadline timestamptz;
BEGIN
  IF p_service_class NOT IN ('background','interactive') OR jsonb_typeof(p_request)<>'object'
    OR length(trim(COALESCE(p_principal_id,'')))=0 OR length(trim(COALESCE(p_logical_work_id,'')))=0
    OR p_attempt_number<1 OR length(trim(COALESCE(p_idempotency_key,'')))=0
    OR length(trim(COALESCE(p_payload_reference,'')))=0 OR length(trim(COALESCE(p_payload_hash,'')))=0 THEN
    RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
  END IF;
  envelope:=p_request->'requestResourceEnvelope';
  expected_revision:=p_request->>'expectedEffectiveConstraintRevision';
  IF jsonb_typeof(envelope)<>'object' OR expected_revision IS NULL
    OR NOT (envelope ?& ARRAY['rpm','tpm','rpd','concurrency'])
    OR EXISTS (SELECT 1 FROM jsonb_each(envelope) item WHERE item.key NOT IN ('rpm','tpm','rpd','concurrency') OR jsonb_typeof(item.value)<>'number' OR (item.value::text)::numeric<1 OR (item.value::text)::numeric<>trunc((item.value::text)::numeric)) THEN
    RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
  END IF;
  IF p_service_class='interactive' THEN
    IF jsonb_typeof(p_request->'deadlineEpochMilliseconds')<>'number' THEN
      RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
    END IF;
    BEGIN
      deadline_epoch:=(p_request->>'deadlineEpochMilliseconds')::numeric;
      IF deadline_epoch<1 OR deadline_epoch<>trunc(deadline_epoch) THEN RAISE EXCEPTION 'invalid interactive deadline'; END IF;
      execution_deadline:=to_timestamp(deadline_epoch / 1000);
      admission_deadline:=execution_deadline;
    EXCEPTION WHEN others THEN
      RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
    END;
    IF execution_deadline<=clock_timestamp() THEN
      RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
    END IF;
  ELSE
    admission_deadline:=NULL;
    execution_deadline:=clock_timestamp()+interval '1 hour';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_principal_id||':'||p_idempotency_key, 60402));
  SELECT * INTO existing FROM bridge.provider_work_admission_v1 WHERE principal_id=p_principal_id AND idempotency_key=p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    SELECT * INTO existing_work FROM bridge.provider_work_attempt WHERE logical_work_id=existing.logical_work_id AND attempt_number=existing.attempt_number;
    IF existing.logical_work_id<>p_logical_work_id OR existing.attempt_number<>p_attempt_number
      OR existing.payload_reference<>p_payload_reference OR existing.payload_hash<>p_payload_hash
      OR existing.request_resource_envelope<>envelope
      OR (p_service_class='interactive' AND existing_work.execution_deadline_at IS DISTINCT FROM execution_deadline) THEN
      RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
    END IF;
    RETURN bridge.provider_work_admission_v1_outcome(existing.logical_work_id,existing.attempt_number);
  END IF;
  IF EXISTS (SELECT 1 FROM bridge.provider_work_admission_v1 WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number) THEN
    RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
  END IF;
  constraint_snapshot:=bridge.read_runtime_capacity_constraint(p_quota_domain_id,p_process_id,p_process_profile_version,p_route_id,p_service_class);
  IF constraint_snapshot->>'effectiveConstraintRevision' IS DISTINCT FROM expected_revision THEN
    RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
  END IF;
  IF constraint_snapshot->>'reason'='temporarily_pressure_blocked' THEN
    RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','pressure_limited');
  END IF;
  IF constraint_snapshot->>'reason'<>'eligible_in_principle' THEN
    RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
  END IF;
  active_plan:=constraint_snapshot->'plan';
  PERFORM bridge.register_provider_work_attempt(p_logical_work_id,p_attempt_number,p_quota_domain_id,p_process_id,p_process_profile_version,p_principal_id,envelope,active_plan->>'desiredProfileVersion',(active_plan->>'activationRevision')::bigint,admission_deadline,execution_deadline);
  PERFORM bridge.bind_provider_work_route(p_logical_work_id,p_attempt_number,p_route_id);
  INSERT INTO bridge.provider_work_admission_v1(logical_work_id,attempt_number,principal_id,idempotency_key,payload_reference,payload_hash,request_resource_envelope)
    VALUES(p_logical_work_id,p_attempt_number,p_principal_id,p_idempotency_key,p_payload_reference,p_payload_hash,envelope);
  SELECT * INTO admitted FROM bridge.admit_route_aware_provider_work_attempt(p_logical_work_id,p_attempt_number,p_service_class);
  IF admitted.decision='admitted' THEN RETURN bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number); END IF;
  IF admitted.decision='pressure_limited' THEN RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','pressure_limited','logicalWorkId',p_logical_work_id,'attemptNumber',p_attempt_number); END IF;
  -- A synchronous interactive request never becomes orphaned waiting work.
  IF p_service_class='interactive' THEN PERFORM bridge.cancel_provider_work_attempt(p_logical_work_id,p_attempt_number,CASE WHEN admitted.decision='deadline_expired' THEN 'deadline_expired' ELSE 'admission_unfit' END); END IF;
  RETURN bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number);
END;
$$;

CREATE OR REPLACE FUNCTION bridge.claim_provider_admitted_transport(p_reservation_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE dispatch bridge.provider_work_dispatch; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding;
BEGIN
  SELECT * INTO dispatch FROM bridge.provider_work_dispatch WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'admitted provider dispatch is missing'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=dispatch.logical_work_id AND attempt_number=dispatch.attempt_number FOR UPDATE;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=dispatch.logical_work_id AND attempt_number=dispatch.attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'admitted provider dispatch has no immutable selected route'; END IF;
  IF work.cancellation_requested_at IS NOT NULL THEN RETURN NULL; END IF;
  IF work.execution_deadline_at IS NOT NULL AND work.execution_deadline_at<=clock_timestamp() THEN
    PERFORM bridge.cancel_provider_work_attempt(work.logical_work_id,work.attempt_number,'deadline_expired');
    RETURN NULL;
  END IF;
  INSERT INTO bridge.provider_transport_claim(reservation_id,logical_work_id,attempt_number) VALUES(p_reservation_id,dispatch.logical_work_id,dispatch.attempt_number) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation already authorized an outbound attempt'; END IF;
  UPDATE bridge.provider_work_attempt SET state='transport_may_have_started',state_version=state_version+1,updated_at=clock_timestamp() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number AND state='dispatched' AND cancellation_requested_at IS NULL AND (execution_deadline_at IS NULL OR execution_deadline_at>clock_timestamp());
  IF NOT FOUND THEN RAISE EXCEPTION 'dispatched provider work is stale, cancelled, or expired'; END IF;
  UPDATE bridge.provider_work_dispatch SET transport_claimed_at=clock_timestamp() WHERE reservation_id=p_reservation_id AND transport_claimed_at IS NULL;
  RETURN jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',p_reservation_id,'routeId',binding.selected_route_id,'capability',binding.capability,'adapterVersion',binding.adapter_version,'qualificationVersion',binding.qualification_version,'quotaDomainId',work.quota_domain_id,'desiredProfileVersion',work.desired_profile_version);
END;
$$;

ALTER FUNCTION bridge.provider_work_admission_v1_outcome(text,integer) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_provider_work_admission_v1(text,text,text,text,text,text,text,integer,text,text,text,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.claim_provider_admitted_transport(uuid) OWNER TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0074_bssv20060404_interactive_admitted_work_lifecycle') ON CONFLICT DO NOTHING;
