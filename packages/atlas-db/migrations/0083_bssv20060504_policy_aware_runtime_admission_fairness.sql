-- BSS-V2-006-05-04: runtime admission consumes the immutable effective
-- policy published by BSS-V2-005.  A not-enforced dimension has no runtime
-- vector entry, window, ledger row, denominator, or optimistic default.

CREATE OR REPLACE FUNCTION bridge.effective_admission_dimensions(
  p_quota_domain_id text, p_desired_profile_version text, p_profile jsonb
) RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE binding bridge.desired_admission_profile_policy_binding; policy jsonb;
  dimensions text[]; vector_name text; vector jsonb;
BEGIN
  SELECT * INTO binding FROM bridge.desired_admission_profile_policy_binding
    WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=p_desired_profile_version;
  IF FOUND THEN
    policy:=bridge.derive_effective_enforcement_policy(
      binding.quota_domain_id,binding.provider_capacity_profile_version,binding.route_id
    );
    IF policy IS DISTINCT FROM binding.effective_policy
      OR policy->>'policyId' IS DISTINCT FROM binding.policy_id
      OR policy->>'policyVersion' IS DISTINCT FROM binding.policy_version THEN
      RAISE EXCEPTION 'active effective admission policy is stale, revoked, or inconsistent';
    END IF;
    SELECT array_agg(name ORDER BY ordinal) INTO dimensions
      FROM (VALUES ('rpm',1),('tpm',2),('rpd',3),('concurrency',4)) known(name,ordinal)
      WHERE policy->'dimensions'->name->>'mode'='enforced';
  ELSE
    -- Historical approved plans predate policy bindings.  Their compatible
    -- representation remains the exact established four-dimensional shape.
    dimensions:=ARRAY['rpm','tpm','rpd','concurrency'];
  END IF;
  IF COALESCE(cardinality(dimensions),0)=0 THEN
    RAISE EXCEPTION 'effective admission policy has no enforced dimensions';
  END IF;
  FOREACH vector_name IN ARRAY ARRAY['usableGlobalCapacity','hardInteractiveReserve','backgroundCapacity'] LOOP
    vector:=p_profile->vector_name;
    IF jsonb_typeof(vector)<>'object'
      OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(vector) key)
        IS DISTINCT FROM (SELECT array_agg(key ORDER BY key) FROM unnest(dimensions) key)
      OR EXISTS (SELECT 1 FROM jsonb_each(vector) item WHERE jsonb_typeof(item.value)<>'number' OR (item.value::text)::numeric<0) THEN
      RAISE EXCEPTION 'active desired admission profile is not exact-keyed to its effective policy';
    END IF;
  END LOOP;
  RETURN dimensions;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.admission_vector_fits(p_used jsonb, p_next jsonb, p_limit jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(p_used)='object' AND jsonb_typeof(p_next)='object'
    AND jsonb_typeof(p_limit)='object' AND p_limit<>'{}'::jsonb
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_each(p_limit) limit_value
      WHERE limit_value.key NOT IN ('rpm','tpm','rpd','concurrency')
        OR jsonb_typeof(limit_value.value)<>'number'
        OR (limit_value.value::text)::numeric<=0
        OR COALESCE((p_used->>limit_value.key)::numeric,0)
          + COALESCE((p_next->>limit_value.key)::numeric,0) > (limit_value.value::text)::numeric
    );
$$;

CREATE OR REPLACE FUNCTION bridge.background_admission_capacity(
  p_profile jsonb, p_used jsonb, p_clamped_global jsonb
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_object_agg(dimension,
    LEAST((p_profile->'backgroundCapacity'->>dimension)::numeric,
      GREATEST(0,(p_clamped_global->>dimension)::numeric-(p_profile->'hardInteractiveReserve'->>dimension)::numeric)
  )),'{}'::jsonb)
  FROM jsonb_object_keys(p_clamped_global) dimension
  WHERE p_profile->'backgroundCapacity' ? dimension
    AND p_profile->'hardInteractiveReserve' ? dimension;
$$;

CREATE OR REPLACE FUNCTION bridge.current_provider_operational_usage(
  p_quota_domain_id text, p_capacity_profile_version text, p_dimensions text[]
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE capacity bridge.provider_capacity_profile; dimension text; policy jsonb;
  mismatch boolean; result jsonb:='{}'::jsonb; physical numeric; legacy numeric;
BEGIN
  IF COALESCE(cardinality(p_dimensions),0)=0 OR EXISTS(SELECT 1 FROM unnest(p_dimensions) d WHERE d NOT IN ('rpm','tpm','rpd','concurrency')) THEN
    RAISE EXCEPTION 'operational usage requires a nonempty known effective dimension set';
  END IF;
  SELECT * INTO capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id=p_quota_domain_id AND profile_version=p_capacity_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'active provider capacity policy is missing'; END IF;
  FOREACH dimension IN ARRAY p_dimensions LOOP
    policy:=capacity.window_policies->dimension;
    IF dimension='concurrency' AND policy IS NULL THEN
      -- Concurrency is still a real enforced seat, but has no fictitious
      -- provider reset requirement.
      policy:=jsonb_build_object('kind','fixed','windowSeconds',60);
    END IF;
    IF jsonb_typeof(policy)<>'object' OR policy->>'kind' NOT IN ('fixed','fixed_window')
      OR COALESCE(policy->'windowSeconds',policy->'parameters'->'windowSeconds') IS NULL
      OR jsonb_typeof(COALESCE(policy->'windowSeconds',policy->'parameters'->'windowSeconds'))<>'number' THEN
      RAISE EXCEPTION 'active provider window policy is not qualified for %',dimension;
    END IF;
    SELECT EXISTS(SELECT 1 FROM bridge.provider_window_usage_ledger l
      WHERE l.quota_domain_id=p_quota_domain_id AND l.dimension_id=dimension
        AND l.window_ends_at>clock_timestamp() AND l.window_policy IS DISTINCT FROM policy) INTO mismatch;
    IF mismatch THEN RAISE EXCEPTION 'nonexpired provider liability has an incompatible window policy'; END IF;
    SELECT COALESCE(sum(GREATEST(l.held_units,l.spent_units)),0) INTO physical
      FROM bridge.provider_window_usage_ledger l WHERE l.quota_domain_id=p_quota_domain_id
        AND l.dimension_id=dimension AND l.window_ends_at>clock_timestamp();
    SELECT COALESCE(sum(COALESCE((r.request_resource_envelope->>dimension)::numeric,0)),0) INTO legacy
      FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number)
      WHERE w.quota_domain_id=p_quota_domain_id AND r.state='live'
        AND NOT EXISTS (SELECT 1 FROM bridge.provider_window_usage_ledger l WHERE l.reservation_id=r.reservation_id);
    result:=result||jsonb_build_object(dimension,physical+legacy);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.current_provider_operational_usage(p_quota_domain_id text, p_capacity_profile_version text)
RETURNS jsonb LANGUAGE sql AS $$
  SELECT bridge.current_provider_operational_usage($1,$2,ARRAY['rpm','tpm','rpd','concurrency']);
$$;

CREATE OR REPLACE FUNCTION bridge.reserve_provider_operational_windows(p_reservation_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE reservation bridge.provider_work_reservation; work bridge.provider_work_attempt;
  binding bridge.provider_work_route_binding; active record; capacity bridge.provider_capacity_profile;
  dimensions text[]; dimension text; policy jsonb; seconds numeric; starts_at timestamptz; ends_at timestamptz; identity text; held numeric;
BEGIN
  SELECT * INTO reservation FROM bridge.provider_work_reservation WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation is missing'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=reservation.logical_work_id AND attempt_number=reservation.attempt_number;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation has no immutable selected route'; END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR active.desired_profile_version<>work.desired_profile_version OR active.activation_revision<>work.activation_revision THEN
    RAISE EXCEPTION 'provider reservation is not attributable to the active desired admission revision';
  END IF;
  dimensions:=bridge.effective_admission_dimensions(work.quota_domain_id,active.desired_profile_version,active.profile);
  SELECT * INTO capacity FROM bridge.provider_capacity_profile WHERE quota_domain_id=work.quota_domain_id AND profile_version=binding.provider_capacity_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation capacity policy is missing'; END IF;
  FOREACH dimension IN ARRAY dimensions LOOP
    policy:=capacity.window_policies->dimension;
    IF dimension='concurrency' AND policy IS NULL THEN policy:=jsonb_build_object('kind','fixed','windowSeconds',60); END IF;
    IF jsonb_typeof(policy)<>'object' OR policy->>'kind' NOT IN ('fixed','fixed_window')
      OR COALESCE(policy->'windowSeconds',policy->'parameters'->'windowSeconds') IS NULL
      OR jsonb_typeof(COALESCE(policy->'windowSeconds',policy->'parameters'->'windowSeconds'))<>'number' THEN
      RAISE EXCEPTION 'provider window policy is not a qualified fixed boundary for %',dimension;
    END IF;
    seconds:=COALESCE(policy->>'windowSeconds',policy->'parameters'->>'windowSeconds')::numeric;
    IF seconds<=0 OR seconds<>trunc(seconds) THEN RAISE EXCEPTION 'provider window policy has an invalid fixed boundary'; END IF;
    starts_at:=to_timestamp(floor(extract(epoch FROM clock_timestamp())/seconds)*seconds); ends_at:=starts_at+make_interval(secs=>seconds::integer);
    identity:=work.quota_domain_id||':'||dimension||':'||md5(policy::text)||':'||extract(epoch FROM starts_at)::bigint;
    held:=COALESCE((reservation.request_resource_envelope->>dimension)::numeric,0);
    INSERT INTO bridge.provider_window_usage_ledger(reservation_id,quota_domain_id,provider_capacity_profile_version,dimension_id,window_identity,window_starts_at,window_ends_at,window_policy,held_units,spent_units,deficit_units,state)
      VALUES(reservation.reservation_id,work.quota_domain_id,binding.provider_capacity_profile_version,dimension,identity,starts_at,ends_at,policy,held,0,0,'held_unknown')
    ON CONFLICT(reservation_id,dimension_id,window_identity) DO NOTHING;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.apply_domain_pressure_clamps(p_quota_domain_id text,p_used jsonb,p_capacity jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb:=p_capacity; incident record; current_capacity numeric; used_units numeric;
BEGIN
  FOR incident IN SELECT dimension_id,numeric_remaining_units FROM bridge.provider_operational_pressure_incident
    WHERE quota_domain_id=p_quota_domain_id AND scope_kind='domain' AND recovered_at IS NULL AND numeric_remaining_units IS NOT NULL LOOP
    -- A pressure report for a deliberately non-enforced dimension cannot
    -- fabricate that dimension in the effective runtime vector.
    IF NOT (result ? incident.dimension_id) THEN CONTINUE; END IF;
    current_capacity:=(result->>incident.dimension_id)::numeric; used_units:=COALESCE((p_used->>incident.dimension_id)::numeric,0);
    result:=jsonb_set(result,ARRAY[incident.dimension_id],to_jsonb(LEAST(current_capacity,used_units+incident.numeric_remaining_units)));
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.admit_route_aware_provider_work_attempt(p_logical_work_id text,p_attempt_number integer,p_expected_service_class text DEFAULT NULL)
RETURNS TABLE(decision text,logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE domain_id text; active record; profile jsonb; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding;
  dimensions text[]; used jsonb; clamped_global jsonb; limit_vector jsonb; reservation bridge.provider_work_reservation; dispatch_job uuid;
BEGIN
  SELECT w0.quota_domain_id INTO domain_id FROM bridge.provider_work_attempt w0 WHERE w0.logical_work_id=p_logical_work_id AND w0.attempt_number=p_attempt_number;
  IF NOT FOUND THEN RETURN QUERY SELECT 'unavailable'::text,p_logical_work_id,p_attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(domain_id,602));
  SELECT * INTO work FROM bridge.provider_work_attempt w0 WHERE w0.logical_work_id=p_logical_work_id AND w0.attempt_number=p_attempt_number FOR UPDATE;
  IF p_expected_service_class IS NOT NULL AND work.service_class<>p_expected_service_class OR work.state<>'waiting' OR work.cancellation_requested_at IS NOT NULL THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF (work.admission_deadline_at IS NOT NULL AND work.admission_deadline_at<=clock_timestamp()) OR (work.execution_deadline_at IS NOT NULL AND work.execution_deadline_at<=clock_timestamp()) THEN RETURN QUERY SELECT 'deadline_expired'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  SELECT * INTO binding FROM bridge.provider_work_route_binding b WHERE b.logical_work_id=work.logical_work_id AND b.attempt_number=work.attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work route binding is required before reservation'; END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR work.desired_profile_version<>active.desired_profile_version OR work.activation_revision<>active.activation_revision THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  IF bridge.provider_pressure_blocks_admission(work.quota_domain_id,binding.selected_route_id,false) THEN RETURN QUERY SELECT 'pressure_limited'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  profile:=active.profile;
  BEGIN dimensions:=bridge.effective_admission_dimensions(work.quota_domain_id,active.desired_profile_version,profile); used:=bridge.current_provider_operational_usage(work.quota_domain_id,active.provider_capacity_profile_version,dimensions); EXCEPTION WHEN others THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END;
  clamped_global:=bridge.apply_domain_pressure_clamps(work.quota_domain_id,used,profile->'usableGlobalCapacity');
  limit_vector:=CASE WHEN work.service_class='background' THEN bridge.background_admission_capacity(profile,used,clamped_global) ELSE clamped_global END;
  IF NOT bridge.admission_vector_fits(used,work.request_resource_envelope,limit_vector) THEN RETURN QUERY SELECT 'unavailable'::text,work.logical_work_id,work.attempt_number,NULL::uuid,NULL::uuid; RETURN; END IF;
  UPDATE bridge.provider_work_attempt w0 SET state='reserved',state_version=w0.state_version+1,updated_at=clock_timestamp() WHERE w0.logical_work_id=work.logical_work_id AND w0.attempt_number=work.attempt_number;
  INSERT INTO bridge.provider_work_reservation(logical_work_id,attempt_number,desired_profile_version,activation_revision,request_resource_envelope) VALUES(work.logical_work_id,work.attempt_number,work.desired_profile_version,work.activation_revision,work.request_resource_envelope) RETURNING * INTO reservation;
  PERFORM bridge.reserve_provider_operational_windows(reservation.reservation_id);
  INSERT INTO pgboss.job(name,data,policy,singleton_key) VALUES('bridge-provider-admitted-execution-v1',jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',reservation.reservation_id),'short',work.logical_work_id||':'||work.attempt_number) RETURNING id INTO dispatch_job;
  INSERT INTO bridge.provider_work_dispatch VALUES(work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job);
  UPDATE bridge.provider_work_attempt w0 SET state='dispatched',state_version=w0.state_version+1,updated_at=clock_timestamp() WHERE w0.logical_work_id=work.logical_work_id AND w0.attempt_number=work.attempt_number;
  RETURN QUERY SELECT 'admitted'::text,work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;

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
      WHERE w.quota_domain_id=p_quota_domain_id AND w.desired_profile_version=active.desired_profile_version AND w.activation_revision=active.activation_revision AND w.state='waiting' AND w.service_class='background' AND w.cancellation_requested_at IS NULL AND (w.execution_deadline_at IS NULL OR w.execution_deadline_at>clock_timestamp()) AND NOT bridge.provider_pressure_blocks_admission(w.quota_domain_id,b.selected_route_id,false) AND bridge.admission_vector_fits(used,w.request_resource_envelope,background_limit) AND COALESCE(ks.last_admission_turn,0)=(SELECT min(COALESCE(k2.last_admission_turn,0)) FROM bridge.provider_work_attempt w2 LEFT JOIN bridge.provider_admission_key_state k2 ON(k2.quota_domain_id=w2.quota_domain_id AND k2.fairness_epoch=epoch AND k2.process_id=w2.process_id AND k2.process_profile_version=w2.process_profile_version AND k2.fairness_key=w2.fairness_key) WHERE w2.quota_domain_id=w.quota_domain_id AND w2.process_id=w.process_id AND w2.process_profile_version=w.process_profile_version AND w2.desired_profile_version=active.desired_profile_version AND w2.activation_revision=active.activation_revision AND w2.state='waiting' AND w2.service_class='background') ORDER BY COALESCE(ls.virtual_usage,domain_state.virtual_time)/NULLIF((l.e->>'normalizedWeight')::numeric,0),w.fairness_key,w.logical_work_id,w.attempt_number LIMIT 1 FOR UPDATE OF w SKIP LOCKED;
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

CREATE OR REPLACE FUNCTION bridge.read_runtime_capacity_constraint(p_quota_domain_id text,p_process_id text,p_process_profile_version text,p_route_id text,p_service_class text)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE active record; process_profile bridge.provider_process_profile; plan_input record; capacity bridge.provider_capacity_profile; qualified_route bridge.qualified_provider_route_authority; dimensions text[]; window_count integer; unknown_windows boolean; pressure_blocked boolean; unavailable_pressure boolean; cooldown timestamptz; clamp_dimensions jsonb; window_status jsonb; constraint_revision text; effective_capacity jsonb:='{}'::jsonb; used_capacity jsonb; accounting_available boolean:=false; reason text:='unknown_policy_blocked'; structural_status text:='unknown'; transient_status text:='unknown';
BEGIN
  IF p_quota_domain_id IS NULL OR p_process_id IS NULL OR p_process_profile_version IS NULL OR p_route_id IS NULL OR p_service_class NOT IN ('background','interactive') THEN RETURN jsonb_build_object('apiVersion','RuntimeCapacityConstraint/v1','reason','inactive_or_unauthorized','structuralStatus','inactive','transientStatus','blocked','eligible',jsonb_build_object('background',false,'interactive',false),'readIsNotSendPermit',true); END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id); IF NOT FOUND THEN RETURN jsonb_build_object('apiVersion','RuntimeCapacityConstraint/v1','reason','inactive_or_unauthorized','structuralStatus','inactive','transientStatus','blocked','eligible',jsonb_build_object('background',false,'interactive',false),'readIsNotSendPermit',true); END IF;
  SELECT * INTO process_profile FROM bridge.provider_process_profile WHERE process_id=p_process_id AND profile_version=p_process_profile_version; SELECT * INTO plan_input FROM bridge.desired_admission_profile_input WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version AND process_id=p_process_id AND process_profile_version=p_process_profile_version; SELECT * INTO capacity FROM bridge.provider_capacity_profile WHERE quota_domain_id=p_quota_domain_id AND profile_version=active.provider_capacity_profile_version; SELECT * INTO qualified_route FROM bridge.qualified_provider_route_authority WHERE route_id=p_route_id;
  IF NOT FOUND OR process_profile.process_id IS NULL OR plan_input.process_id IS NULL OR NOT process_profile.active OR process_profile.service_class<>p_service_class OR NOT(process_profile.eligible_route_ids @> jsonb_build_array(p_route_id)) OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(capacity.associated_routes) route WHERE route->>'routeId'=p_route_id) OR qualified_route.route_id IS NULL OR qualified_route.capability<>process_profile.capability THEN RETURN jsonb_build_object('apiVersion','RuntimeCapacityConstraint/v1','reason','inactive_or_unauthorized','structuralStatus','inactive','transientStatus','blocked','eligible',jsonb_build_object('background',false,'interactive',false),'readIsNotSendPermit',true); END IF;
  BEGIN dimensions:=bridge.effective_admission_dimensions(p_quota_domain_id,active.desired_profile_version,active.profile); EXCEPTION WHEN others THEN RETURN jsonb_build_object('apiVersion','RuntimeCapacityConstraint/v1','reason','unknown_policy_blocked','structuralStatus','unknown','transientStatus','blocked','eligible',jsonb_build_object('background',false,'interactive',false),'readIsNotSendPermit',true); END;
  IF EXISTS(SELECT 1 FROM unnest(dimensions) dimension WHERE jsonb_typeof(active.profile->'usableGlobalCapacity'->dimension)<>'number' OR (active.profile->'usableGlobalCapacity'->>dimension)::numeric<=0) THEN structural_status:='unfit'; transient_status:='blocked'; reason:='structurally_unfit'; ELSE structural_status:='qualified'; effective_capacity:=active.profile->'usableGlobalCapacity'; BEGIN used_capacity:=bridge.current_provider_operational_usage(p_quota_domain_id,active.provider_capacity_profile_version,dimensions); effective_capacity:=bridge.apply_domain_pressure_clamps(p_quota_domain_id,used_capacity,effective_capacity); accounting_available:=true; EXCEPTION WHEN others THEN effective_capacity:='{}'::jsonb; transient_status:='unknown'; reason:='unknown_policy_blocked'; END;
    SELECT count(*),bool_or(NOT reset_semantics_known OR reset_at IS NULL) INTO window_count,unknown_windows FROM bridge.provider_quota_window_state WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version AND activation_revision=active.activation_revision AND provider_capacity_profile_version=active.provider_capacity_profile_version AND dimension_id=ANY(dimensions);
    SELECT COALESCE(jsonb_object_agg(dimension_id,jsonb_build_object('state',CASE WHEN reset_semantics_known AND reset_at IS NOT NULL THEN 'known' ELSE 'unknown' END,'resetAt',CASE WHEN reset_semantics_known THEN reset_at ELSE NULL END)),'{}'::jsonb) INTO window_status FROM bridge.provider_quota_window_state WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version AND activation_revision=active.activation_revision AND provider_capacity_profile_version=active.provider_capacity_profile_version AND dimension_id=ANY(dimensions);
    SELECT EXISTS(SELECT 1 FROM bridge.provider_operational_pressure_incident incident WHERE incident.quota_domain_id=p_quota_domain_id AND incident.recovered_at IS NULL AND (incident.scope_kind='domain' OR incident.route_id=p_route_id) AND (incident.dimension_id IS NULL OR incident.dimension_id=ANY(dimensions)) AND NOT incident.policy_available),EXISTS(SELECT 1 FROM bridge.provider_operational_pressure_incident incident WHERE incident.quota_domain_id=p_quota_domain_id AND incident.recovered_at IS NULL AND (incident.scope_kind='domain' OR incident.route_id=p_route_id) AND (incident.dimension_id IS NULL OR incident.dimension_id=ANY(dimensions)) AND incident.policy_available AND clock_timestamp()<incident.cooldown_until),max(incident.cooldown_until),COALESCE(jsonb_agg(DISTINCT incident.dimension_id) FILTER(WHERE incident.dimension_id=ANY(dimensions)),'[]'::jsonb) INTO unavailable_pressure,pressure_blocked,cooldown,clamp_dimensions FROM bridge.provider_operational_pressure_incident incident WHERE incident.quota_domain_id=p_quota_domain_id AND incident.recovered_at IS NULL AND (incident.scope_kind='domain' OR incident.route_id=p_route_id) AND (incident.dimension_id IS NULL OR incident.dimension_id=ANY(dimensions));
    IF accounting_available THEN IF window_count<>cardinality(dimensions) OR COALESCE(unknown_windows,true) OR unavailable_pressure THEN transient_status:='unknown'; reason:='unknown_policy_blocked'; ELSIF pressure_blocked THEN transient_status:='pressure_blocked'; reason:='temporarily_pressure_blocked'; ELSE transient_status:='eligible_in_principle'; reason:='eligible_in_principle'; END IF; END IF;
  END IF;
  SELECT md5(jsonb_build_object('activationRevision',active.activation_revision,'desiredProfileVersion',active.desired_profile_version,'effectiveDimensions',dimensions,'effectiveCapacity',effective_capacity,'windowRevision',COALESCE((SELECT max(updated_at)::text FROM bridge.provider_quota_window_state WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version AND activation_revision=active.activation_revision),'none'),'pressureRevision',COALESCE((SELECT max(updated_at)::text FROM bridge.provider_operational_pressure_incident WHERE quota_domain_id=p_quota_domain_id AND recovered_at IS NULL AND (scope_kind='domain' OR route_id=p_route_id)),'none'))::text) INTO constraint_revision;
  RETURN jsonb_build_object('apiVersion','RuntimeCapacityConstraint/v1','identity',jsonb_build_object('processId',p_process_id,'processProfileVersion',p_process_profile_version,'routeId',p_route_id,'quotaDomainId',p_quota_domain_id,'serviceClass',p_service_class),'plan',jsonb_build_object('desiredProfileVersion',active.desired_profile_version,'activationRevision',active.activation_revision,'policyRevision',active.planner_version),'effectiveDimensions',to_jsonb(dimensions),'effectiveConstraintRevision',constraint_revision,'effectiveCapacity',effective_capacity,'structuralStatus',structural_status,'transientStatus',transient_status,'reason',reason,'safeWindow',COALESCE(window_status,'{}'::jsonb),'cooldown',jsonb_build_object('active',COALESCE(pressure_blocked,false),'until',cooldown),'clamp',jsonb_build_object('active',jsonb_array_length(COALESCE(clamp_dimensions,'[]'::jsonb))>0,'dimensions',COALESCE(clamp_dimensions,'[]'::jsonb)),'eligible',jsonb_build_object('background',reason='eligible_in_principle' AND active.profile ? 'backgroundCapacity','interactive',reason='eligible_in_principle' AND active.profile ? 'hardInteractiveReserve'),'readIsNotSendPermit',true);
END;
$$;

ALTER FUNCTION bridge.effective_admission_dimensions(text,text,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admission_vector_fits(jsonb,jsonb,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.background_admission_capacity(jsonb,jsonb,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.current_provider_operational_usage(text,text,text[]) OWNER TO agents_bridge;
ALTER FUNCTION bridge.current_provider_operational_usage(text,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.reserve_provider_operational_windows(uuid) OWNER TO agents_bridge;
ALTER FUNCTION bridge.apply_domain_pressure_clamps(text,jsonb,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_next_provider_work_attempt(text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.read_runtime_capacity_constraint(text,text,text,text,text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.effective_admission_dimensions(text,text,jsonb),bridge.admission_vector_fits(jsonb,jsonb,jsonb),bridge.background_admission_capacity(jsonb,jsonb,jsonb),bridge.current_provider_operational_usage(text,text,text[]),bridge.current_provider_operational_usage(text,text),bridge.reserve_provider_operational_windows(uuid),bridge.apply_domain_pressure_clamps(text,jsonb,jsonb),bridge.admit_route_aware_provider_work_attempt(text,integer,text),bridge.admit_next_provider_work_attempt(text),bridge.read_runtime_capacity_constraint(text,text,text,text,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text),bridge.admit_next_provider_work_attempt(text),bridge.read_runtime_capacity_constraint(text,text,text,text,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0083_bssv20060504_policy_aware_runtime_admission_fairness') ON CONFLICT DO NOTHING;
