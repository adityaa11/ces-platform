-- BSS-V2-006-06: the public admission consumer resolves the one published
-- bigint authority inside its existing transaction.  It deliberately adds no
-- endpoint, binder overload, queue, scheduler, reservation, or send lane.
CREATE OR REPLACE FUNCTION bridge.admit_provider_work_admission_v1(
  p_principal_id text, p_quota_domain_id text, p_process_id text,
  p_process_profile_version text, p_route_id text, p_service_class text,
  p_logical_work_id text, p_attempt_number integer, p_idempotency_key text,
  p_payload_reference text, p_payload_hash text, p_request jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE existing bridge.provider_work_admission_v1; existing_work bridge.provider_work_attempt;
  constraint_snapshot jsonb; admitted record; active_plan jsonb; expected_revision text;
  envelope jsonb; deadline_epoch numeric; admission_deadline timestamptz; execution_deadline timestamptz;
  authority_versions bigint[]; authority_version bigint;
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
  -- Calculated v2 plans may resolve only their exact immutable route binding.
  -- Historical plans retain their bigint binder path, but require one complete
  -- publisher record matching the active capacity-associated route tuple.
  IF EXISTS (SELECT 1 FROM bridge.calculated_class_process_allocation allocation
    WHERE allocation.quota_domain_id=p_quota_domain_id
      AND allocation.desired_profile_version=active_plan->>'desiredProfileVersion') THEN
    SELECT array_agg(binding.authority_version ORDER BY binding.authority_version) INTO authority_versions
      FROM bridge.desired_admission_profile_route_binding_v2 binding
      JOIN bridge.qualified_provider_route_authority authority
        ON authority.authority_version=binding.authority_version AND authority.authority_kind='qualified_v1'
      JOIN bridge.desired_admission_profile desired
        ON (desired.quota_domain_id,desired.profile_version)=(binding.quota_domain_id,binding.desired_profile_version)
      JOIN bridge.provider_capacity_profile capacity
        ON (capacity.quota_domain_id,capacity.profile_version)=(desired.quota_domain_id,desired.provider_capacity_profile_version)
      JOIN bridge.provider_process_profile process
        ON (process.process_id,process.profile_version)=(p_process_id,p_process_profile_version)
      JOIN bridge.desired_admission_profile_input input
        ON (input.quota_domain_id,input.desired_profile_version,input.process_id,input.process_profile_version)
         =(desired.quota_domain_id,desired.profile_version,process.process_id,process.profile_version)
     WHERE binding.quota_domain_id=p_quota_domain_id
       AND binding.desired_profile_version=active_plan->>'desiredProfileVersion'
       AND binding.route_id=p_route_id
       AND binding.provider_capacity_profile_version=desired.provider_capacity_profile_version
       AND authority.quota_domain_id=p_quota_domain_id
       AND authority.route_id=p_route_id
       AND authority.capability=process.capability
       AND process.active AND process.service_class=p_service_class
       AND process.eligible_route_ids @> jsonb_build_array(p_route_id)
       AND EXISTS (SELECT 1 FROM jsonb_array_elements(capacity.associated_routes) route
         WHERE route->>'routeId'=authority.route_id
           AND route->>'providerId'=authority.provider_id
           AND route->>'modelOrProcessorId'=authority.model_or_processor_id
           AND route->>'adapterVersion'=authority.adapter_version
           AND route->>'qualificationRef'=authority.qualification_ref
           AND route->>'qualificationVersion'=authority.qualification_version
           AND route->>'capability'=authority.capability);
  ELSE
    SELECT array_agg(authority.authority_version ORDER BY authority.authority_version) INTO authority_versions
      FROM bridge.qualified_provider_route_authority authority
      JOIN bridge.desired_admission_profile desired
        ON (desired.quota_domain_id,desired.profile_version)=(p_quota_domain_id,active_plan->>'desiredProfileVersion')
      JOIN bridge.provider_capacity_profile capacity
        ON (capacity.quota_domain_id,capacity.profile_version)=(desired.quota_domain_id,desired.provider_capacity_profile_version)
      JOIN bridge.provider_process_profile process
        ON (process.process_id,process.profile_version)=(p_process_id,p_process_profile_version)
      JOIN bridge.desired_admission_profile_input input
        ON (input.quota_domain_id,input.desired_profile_version,input.process_id,input.process_profile_version)
         =(desired.quota_domain_id,desired.profile_version,process.process_id,process.profile_version)
     WHERE authority.authority_kind='qualified_v1'
       AND authority.quota_domain_id=p_quota_domain_id
       AND authority.route_id=p_route_id
       AND authority.capability=process.capability
       AND process.active AND process.service_class=p_service_class
       AND process.eligible_route_ids @> jsonb_build_array(p_route_id)
       AND EXISTS (SELECT 1 FROM jsonb_array_elements(capacity.associated_routes) route
         WHERE route->>'routeId'=authority.route_id
           AND route->>'providerId'=authority.provider_id
           AND route->>'modelOrProcessorId'=authority.model_or_processor_id
           AND route->>'adapterVersion'=authority.adapter_version
           AND route->>'qualificationRef'=authority.qualification_ref
           AND route->>'qualificationVersion'=authority.qualification_version
           AND route->>'capability'=authority.capability);
  END IF;
  IF COALESCE(cardinality(authority_versions),0)<>1 THEN
    RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','policy_or_resource_unfit');
  END IF;
  authority_version:=authority_versions[1];

  PERFORM bridge.register_provider_work_attempt(p_logical_work_id,p_attempt_number,p_quota_domain_id,p_process_id,p_process_profile_version,p_principal_id,envelope,active_plan->>'desiredProfileVersion',(active_plan->>'activationRevision')::bigint,admission_deadline,execution_deadline);
  PERFORM bridge.bind_provider_work_route(p_logical_work_id,p_attempt_number,authority_version);
  INSERT INTO bridge.provider_work_admission_v1(logical_work_id,attempt_number,principal_id,idempotency_key,payload_reference,payload_hash,request_resource_envelope)
    VALUES(p_logical_work_id,p_attempt_number,p_principal_id,p_idempotency_key,p_payload_reference,p_payload_hash,envelope);
  SELECT * INTO admitted FROM bridge.admit_route_aware_provider_work_attempt(p_logical_work_id,p_attempt_number,p_service_class);
  IF admitted.decision='admitted' THEN RETURN bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number); END IF;
  IF admitted.decision='pressure_limited' THEN RETURN jsonb_build_object('apiVersion','ProviderWorkAdmission/v1','state','pressure_limited','logicalWorkId',p_logical_work_id,'attemptNumber',p_attempt_number); END IF;
  IF p_service_class='interactive' THEN PERFORM bridge.cancel_provider_work_attempt(p_logical_work_id,p_attempt_number,CASE WHEN admitted.decision='deadline_expired' THEN 'deadline_expired' ELSE 'admission_unfit' END); END IF;
  RETURN bridge.provider_work_admission_v1_outcome(p_logical_work_id,p_attempt_number);
END;
$$;

ALTER FUNCTION bridge.admit_provider_work_admission_v1(text,text,text,text,text,text,text,integer,text,text,text,jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.admit_provider_work_admission_v1(text,text,text,text,text,text,text,integer,text,text,text,jsonb) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_provider_work_admission_v1(text,text,text,text,text,text,text,integer,text,text,text,jsonb) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0102_bssv200606_public_admission_authority_cutover') ON CONFLICT DO NOTHING;
