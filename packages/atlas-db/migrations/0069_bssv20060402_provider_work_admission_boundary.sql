-- BSS-V2-006-04-02: authenticated external admission is a narrow facade over
-- the approved 03A reservation/dispatch/claim lane. Payload metadata remains
-- opaque to BSS and is never placed in the pg-boss job or feedback tables.
CREATE TABLE IF NOT EXISTS bridge.provider_work_admission_v1 (
  logical_work_id text NOT NULL,
  attempt_number integer NOT NULL,
  principal_id text NOT NULL CHECK (length(trim(principal_id)) > 0),
  idempotency_key text NOT NULL CHECK (length(trim(idempotency_key)) > 0),
  payload_reference text NOT NULL CHECK (length(trim(payload_reference)) > 0),
  payload_hash text NOT NULL CHECK (length(trim(payload_hash)) > 0),
  request_resource_envelope jsonb NOT NULL CHECK (jsonb_typeof(request_resource_envelope)='object'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (logical_work_id, attempt_number),
  UNIQUE (principal_id, idempotency_key),
  FOREIGN KEY (logical_work_id, attempt_number)
    REFERENCES bridge.provider_work_attempt(logical_work_id, attempt_number) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION bridge.provider_work_admission_v1_outcome(
  p_logical_work_id text, p_attempt_number integer
) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'apiVersion', 'ProviderWorkAdmission/v1',
    'state', CASE work.state
      WHEN 'waiting' THEN 'waiting'
      WHEN 'reserved' THEN 'reserved'
      WHEN 'dispatched' THEN 'dispatched_or_may_have_started'
      WHEN 'transport_may_have_started' THEN 'dispatched_or_may_have_started'
      WHEN 'terminal' THEN 'terminal_cancelled'
      WHEN 'reconciled' THEN 'terminal_provider_failure'
      ELSE 'policy_or_resource_unfit' END,
    'logicalWorkId', work.logical_work_id,
    'attemptNumber', work.attempt_number,
    'reservationId', reservation.reservation_id,
    'jobId', dispatch.job_id
  ))
  FROM bridge.provider_work_attempt work
  LEFT JOIN bridge.provider_work_reservation reservation
    ON reservation.logical_work_id=work.logical_work_id AND reservation.attempt_number=work.attempt_number
  LEFT JOIN bridge.provider_work_dispatch dispatch ON dispatch.reservation_id=reservation.reservation_id
  WHERE work.logical_work_id=p_logical_work_id AND work.attempt_number=p_attempt_number
  ORDER BY reservation.created_at DESC NULLS LAST LIMIT 1
$$;

CREATE OR REPLACE FUNCTION bridge.admit_provider_work_admission_v1(
  p_principal_id text, p_quota_domain_id text, p_process_id text,
  p_process_profile_version text, p_route_id text, p_service_class text,
  p_logical_work_id text, p_attempt_number integer, p_idempotency_key text,
  p_payload_reference text, p_payload_hash text, p_request jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE existing bridge.provider_work_admission_v1; constraint_snapshot jsonb;
  admitted record; active_plan jsonb; expected_revision text; envelope jsonb;
BEGIN
  IF p_service_class<>'background' OR jsonb_typeof(p_request)<>'object'
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
  PERFORM pg_advisory_xact_lock(hashtextextended(p_principal_id||':'||p_idempotency_key, 60402));
  SELECT * INTO existing FROM bridge.provider_work_admission_v1
    WHERE principal_id=p_principal_id AND idempotency_key=p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF existing.logical_work_id<>p_logical_work_id OR existing.attempt_number<>p_attempt_number
      OR existing.payload_reference<>p_payload_reference OR existing.payload_hash<>p_payload_hash
      OR existing.request_resource_envelope<>envelope THEN
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
  PERFORM bridge.register_provider_work_attempt(p_logical_work_id,p_attempt_number,p_quota_domain_id,p_process_id,p_process_profile_version,p_principal_id,envelope,active_plan->>'desiredProfileVersion',(active_plan->>'activationRevision')::bigint,NULL,clock_timestamp()+interval '1 hour');
  PERFORM bridge.bind_provider_work_route(p_logical_work_id,p_attempt_number,p_route_id);
  INSERT INTO bridge.provider_work_admission_v1(logical_work_id,attempt_number,principal_id,idempotency_key,payload_reference,payload_hash,request_resource_envelope)
    VALUES(p_logical_work_id,p_attempt_number,p_principal_id,p_idempotency_key,p_payload_reference,p_payload_hash,envelope);
  SELECT * INTO admitted FROM bridge.admit_route_aware_provider_work_attempt(p_logical_work_id,p_attempt_number,'background');
  IF admitted.decision='admitted' THEN RETURN bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number); END IF;
  IF admitted.decision='pressure_limited' THEN RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','pressure_limited','logicalWorkId',p_logical_work_id,'attemptNumber',p_attempt_number); END IF;
  RETURN bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number);
END;
$$;

CREATE OR REPLACE FUNCTION bridge.cancel_provider_work_admission_v1(
  p_principal_id text, p_logical_work_id text, p_attempt_number integer
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE admission bridge.provider_work_admission_v1;
BEGIN
  SELECT * INTO admission FROM bridge.provider_work_admission_v1 WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND OR admission.principal_id<>p_principal_id THEN RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit'); END IF;
  PERFORM bridge.cancel_provider_work_attempt(p_logical_work_id,p_attempt_number,'cancelled_before_send');
  RETURN bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number);
END;
$$;

-- The payload adapter is invoked only after the 03A claim transaction has
-- marked transport as may-have-started. It receives opaque identifiers only.
CREATE OR REPLACE FUNCTION bridge.read_claimed_provider_work_admission_payload_v1(p_reservation_id uuid)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('logicalWorkId',admission.logical_work_id,'attemptNumber',admission.attempt_number,
    'payloadReference',admission.payload_reference,'payloadHash',admission.payload_hash)
  FROM bridge.provider_work_admission_v1 admission
  JOIN bridge.provider_work_reservation reservation ON reservation.logical_work_id=admission.logical_work_id AND reservation.attempt_number=admission.attempt_number
  JOIN bridge.provider_transport_claim claim ON claim.reservation_id=reservation.reservation_id
  WHERE reservation.reservation_id=p_reservation_id
$$;

ALTER TABLE bridge.provider_work_admission_v1 OWNER TO agents_bridge;
ALTER FUNCTION bridge.provider_work_admission_v1_outcome(text,integer) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_provider_work_admission_v1(text,text,text,text,text,text,text,integer,text,text,text,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.cancel_provider_work_admission_v1(text,text,integer) OWNER TO agents_bridge;
ALTER FUNCTION bridge.read_claimed_provider_work_admission_payload_v1(uuid) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_work_admission_v1 FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.provider_work_admission_v1_outcome(text,integer),bridge.admit_provider_work_admission_v1(text,text,text,text,text,text,text,integer,text,text,text,jsonb),bridge.cancel_provider_work_admission_v1(text,text,integer),bridge.read_claimed_provider_work_admission_payload_v1(uuid) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_provider_work_admission_v1(text,text,text,text,text,text,text,integer,text,text,text,jsonb),bridge.cancel_provider_work_admission_v1(text,text,integer),bridge.read_claimed_provider_work_admission_payload_v1(uuid) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0069_bssv20060402_provider_work_admission_boundary') ON CONFLICT DO NOTHING;
