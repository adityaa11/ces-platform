-- BSS-V2-014-04-02: keep the established domain-locked admission, reservation,
-- pg-boss dispatch, and transport-claim path, while making a v2 desired-plan
-- binding the immutable authority for that path.  This adds no scheduler,
-- reservation family, resolver, or provider transport.

ALTER TABLE bridge.provider_work_route_binding
  ADD COLUMN IF NOT EXISTS authority_version bigint,
  ADD COLUMN IF NOT EXISTS provider_id text,
  ADD COLUMN IF NOT EXISTS model_or_processor_id text,
  ADD COLUMN IF NOT EXISTS qualification_ref text;

CREATE OR REPLACE FUNCTION bridge.require_v2_provider_work_authority(
  p_logical_work_id text,
  p_attempt_number integer
) RETURNS bridge.provider_work_route_binding LANGUAGE plpgsql AS $$
DECLARE work bridge.provider_work_attempt;
  binding bridge.provider_work_route_binding;
  plan_binding bridge.desired_admission_profile_route_binding_v2;
  authority bridge.qualified_provider_route_authority;
BEGIN
  SELECT * INTO work FROM bridge.provider_work_attempt
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work authority has no attempt'; END IF;
  SELECT * INTO binding FROM bridge.provider_work_route_binding
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work authority has no immutable binding'; END IF;

  -- Historical plans retain their original fixed identity.  A calculated v2
  -- plan must use the complete v2 tuple; it cannot fall back to the legacy
  -- route-only binding representation.
  IF NOT EXISTS (SELECT 1 FROM bridge.calculated_class_process_allocation a
    WHERE a.quota_domain_id=work.quota_domain_id
      AND a.desired_profile_version=work.desired_profile_version) THEN
    RETURN binding;
  END IF;

  SELECT * INTO plan_binding FROM bridge.desired_admission_profile_route_binding_v2
    WHERE quota_domain_id=work.quota_domain_id
      AND desired_profile_version=work.desired_profile_version
      AND route_id=binding.selected_route_id;
  SELECT * INTO authority FROM bridge.qualified_provider_route_authority
    WHERE authority_version=binding.authority_version AND authority_kind='qualified_v1';
  IF NOT FOUND OR plan_binding.authority_version IS DISTINCT FROM binding.authority_version
    OR plan_binding.provider_capacity_profile_version IS DISTINCT FROM binding.provider_capacity_profile_version
    OR authority.route_id IS DISTINCT FROM binding.selected_route_id
    OR authority.quota_domain_id IS DISTINCT FROM work.quota_domain_id
    OR authority.provider_id IS DISTINCT FROM binding.provider_id
    OR authority.model_or_processor_id IS DISTINCT FROM binding.model_or_processor_id
    OR authority.adapter_version IS DISTINCT FROM binding.adapter_version
    OR authority.qualification_ref IS DISTINCT FROM binding.qualification_ref
    OR authority.qualification_version IS DISTINCT FROM binding.qualification_version
    OR authority.capability IS DISTINCT FROM binding.capability
    OR NOT EXISTS (
      SELECT 1 FROM bridge.provider_capacity_profile capacity,
        jsonb_array_elements(capacity.associated_routes) route
      WHERE capacity.quota_domain_id=work.quota_domain_id
        AND capacity.profile_version=plan_binding.provider_capacity_profile_version
        AND route->>'routeId'=authority.route_id
        AND route->>'providerId'=authority.provider_id
        AND route->>'modelOrProcessorId'=authority.model_or_processor_id
        AND route->>'adapterVersion'=authority.adapter_version
        AND route->>'qualificationRef'=authority.qualification_ref
        AND route->>'qualificationVersion'=authority.qualification_version
        AND route->>'capability'=authority.capability
    ) THEN
    RAISE EXCEPTION 'provider work authority is stale, forged, revoked, mismatched, or incomplete';
  END IF;
  RETURN binding;
END;
$$;

-- The resolver/publication sub-operation belongs to -02-01.  This later
-- attempt-binding sub-operation receives only its immutable authority version.
DROP FUNCTION IF EXISTS bridge.bind_provider_work_route(text,integer,text);
CREATE OR REPLACE FUNCTION bridge.bind_provider_work_route(
  p_logical_work_id text, p_attempt_number integer, p_authority_version bigint
) RETURNS bridge.provider_work_route_binding LANGUAGE plpgsql AS $$
DECLARE work bridge.provider_work_attempt;
  authority bridge.qualified_provider_route_authority;
  plan_binding bridge.desired_admission_profile_route_binding_v2;
  desired bridge.desired_admission_profile;
  binding bridge.provider_work_route_binding;
BEGIN
  SELECT * INTO work FROM bridge.provider_work_attempt
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND OR work.state<>'waiting' THEN RAISE EXCEPTION 'only a waiting provider work attempt may bind authority'; END IF;
  SELECT * INTO authority FROM bridge.qualified_provider_route_authority
    WHERE authority_version=p_authority_version AND authority_kind='qualified_v1';
  IF NOT FOUND OR authority.quota_domain_id<>work.quota_domain_id THEN
    RAISE EXCEPTION 'provider work binding authority is missing or foreign';
  END IF;
  SELECT * INTO plan_binding FROM bridge.desired_admission_profile_route_binding_v2
    WHERE quota_domain_id=work.quota_domain_id AND desired_profile_version=work.desired_profile_version
      AND authority_version=authority.authority_version AND route_id=authority.route_id;
  SELECT * INTO desired FROM bridge.desired_admission_profile
    WHERE quota_domain_id=work.quota_domain_id AND profile_version=work.desired_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work has no desired admission profile'; END IF;
  IF EXISTS (SELECT 1 FROM bridge.calculated_class_process_allocation a
    WHERE a.quota_domain_id=work.quota_domain_id AND a.desired_profile_version=work.desired_profile_version)
    AND plan_binding.authority_version IS NULL THEN
    RAISE EXCEPTION 'provider work authority is not pinned by its immutable desired plan';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.provider_process_profile process
    WHERE process.process_id=work.process_id AND process.profile_version=work.process_profile_version
      AND process.capability=authority.capability
      AND process.eligible_route_ids @> jsonb_build_array(authority.route_id)) THEN
    RAISE EXCEPTION 'provider work authority is not eligible for the server-authorized process';
  END IF;
  INSERT INTO bridge.provider_work_route_binding(
    logical_work_id,attempt_number,selected_route_id,capability,adapter_version,
    qualification_version,provider_capacity_profile_version,authority_version,
    provider_id,model_or_processor_id,qualification_ref
  ) VALUES (
    p_logical_work_id,p_attempt_number,authority.route_id,authority.capability,
    authority.adapter_version,authority.qualification_version,
    COALESCE(plan_binding.provider_capacity_profile_version,desired.provider_capacity_profile_version),authority.authority_version,
    authority.provider_id,authority.model_or_processor_id,authority.qualification_ref
  ) ON CONFLICT(logical_work_id,attempt_number) DO NOTHING RETURNING * INTO binding;
  IF NOT FOUND THEN
    SELECT * INTO binding FROM bridge.provider_work_route_binding
      WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    PERFORM bridge.require_v2_provider_work_authority(p_logical_work_id,p_attempt_number);
  END IF;
  RETURN binding;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.require_provider_work_route_before_reservation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM bridge.require_v2_provider_work_authority(NEW.logical_work_id,NEW.attempt_number);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.v2_process_admission_limits(
  p_work bridge.provider_work_attempt
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE allocation jsonb; entry jsonb; dimensions text[]; baseline jsonb; cap jsonb; class_pool jsonb;
BEGIN
  SELECT a.allocation INTO allocation FROM bridge.calculated_class_process_allocation a
    WHERE a.quota_domain_id=p_work.quota_domain_id
      AND a.desired_profile_version=p_work.desired_profile_version;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT array_agg(value ORDER BY value) INTO dimensions FROM jsonb_array_elements_text(allocation->'effectiveMask');
  SELECT value INTO entry FROM jsonb_array_elements(COALESCE(allocation->'processes','[]'::jsonb))
    WHERE value->>'processId'=p_work.process_id
      AND value->>'profileVersion'=p_work.process_profile_version;
  baseline:=COALESCE(entry->'baseline',allocation->'processBaselines'->p_work.process_id);
  cap:=COALESCE(entry->'cap',baseline);
  class_pool:=COALESCE(allocation->'classAllocations'->p_work.service_class,allocation->'classTotals'->p_work.service_class);
  IF baseline IS NULL OR cap IS NULL OR class_pool IS NULL OR COALESCE(cardinality(dimensions),0)=0
    OR EXISTS (SELECT 1 FROM unnest(dimensions) d
      WHERE jsonb_typeof(baseline->d)<>'number' OR jsonb_typeof(cap->d)<>'number'
        OR jsonb_typeof(class_pool->d)<>'number'
        OR (baseline->>d)::numeric<=0 OR (cap->>d)::numeric<=0
        OR (baseline->>d)::numeric>(cap->>d)::numeric) THEN
    RAISE EXCEPTION 'calculated process allocation has no exact baseline, cap, or class pool';
  END IF;
  RETURN jsonb_build_object('dimensions',to_jsonb(dimensions),'baseline',baseline,'cap',cap,'classPool',class_pool);
END;
$$;

CREATE OR REPLACE FUNCTION bridge.admit_route_aware_provider_work_attempt(
  p_logical_work_id text,p_attempt_number integer,p_expected_service_class text DEFAULT NULL
) RETURNS TABLE(decision text,logical_work_id text,attempt_number integer,reservation_id uuid,job_id uuid) LANGUAGE plpgsql AS $$
DECLARE domain_id text; active record; profile jsonb; work bridge.provider_work_attempt;
  binding bridge.provider_work_route_binding; limits jsonb; dimensions text[]; used jsonb;
  process_used jsonb; class_used jsonb; clamped_global jsonb; limit_vector jsonb;
  reservation bridge.provider_work_reservation; dispatch_job uuid;
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
      IF NOT bridge.admission_vector_fits(process_used,work.request_resource_envelope,limits->'baseline')
        OR NOT bridge.admission_vector_fits(process_used,work.request_resource_envelope,limits->'cap')
        OR NOT bridge.admission_vector_fits(class_used,work.request_resource_envelope,limits->'classPool') THEN
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
  UPDATE bridge.provider_work_attempt attempt SET state='dispatched',state_version=attempt.state_version+1,updated_at=clock_timestamp()
    WHERE attempt.logical_work_id=work.logical_work_id AND attempt.attempt_number=work.attempt_number;
  RETURN QUERY SELECT 'admitted',work.logical_work_id,work.attempt_number,reservation.reservation_id,dispatch_job;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.claim_provider_admitted_transport(p_reservation_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE dispatch bridge.provider_work_dispatch; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding;
BEGIN
  SELECT * INTO dispatch FROM bridge.provider_work_dispatch WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'admitted provider dispatch is missing'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=dispatch.logical_work_id AND attempt_number=dispatch.attempt_number FOR UPDATE;
  SELECT * INTO binding FROM bridge.require_v2_provider_work_authority(work.logical_work_id,work.attempt_number);
  INSERT INTO bridge.provider_transport_claim(reservation_id,logical_work_id,attempt_number) VALUES(p_reservation_id,dispatch.logical_work_id,dispatch.attempt_number) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation already authorized an outbound attempt'; END IF;
  UPDATE bridge.provider_work_attempt SET state='transport_may_have_started',state_version=state_version+1,updated_at=clock_timestamp()
    WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number AND state='dispatched'
      AND cancellation_requested_at IS NULL AND (execution_deadline_at IS NULL OR execution_deadline_at>clock_timestamp());
  IF NOT FOUND THEN RAISE EXCEPTION 'dispatched provider work is stale, cancelled, or expired'; END IF;
  UPDATE bridge.provider_work_dispatch SET transport_claimed_at=clock_timestamp() WHERE reservation_id=p_reservation_id AND transport_claimed_at IS NULL;
  RETURN jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',p_reservation_id,
    'routeId',binding.selected_route_id,'capability',binding.capability,'adapterVersion',binding.adapter_version,
    'qualificationVersion',binding.qualification_version,'quotaDomainId',work.quota_domain_id,'desiredProfileVersion',work.desired_profile_version,
    'authorityVersion',binding.authority_version,'providerId',binding.provider_id,'modelOrProcessorId',binding.model_or_processor_id,'qualificationRef',binding.qualification_ref);
END;
$$;

ALTER FUNCTION bridge.require_v2_provider_work_authority(text,integer) OWNER TO agents_bridge;
ALTER FUNCTION bridge.bind_provider_work_route(text,integer,bigint) OWNER TO agents_bridge;
ALTER FUNCTION bridge.require_provider_work_route_before_reservation() OWNER TO agents_bridge;
ALTER FUNCTION bridge.v2_process_admission_limits(bridge.provider_work_attempt) OWNER TO agents_bridge;
ALTER FUNCTION bridge.admit_route_aware_provider_work_attempt(text,integer,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.claim_provider_admitted_transport(uuid) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.require_v2_provider_work_authority(text,integer),bridge.bind_provider_work_route(text,integer,bigint),bridge.v2_process_admission_limits(bridge.provider_work_attempt),bridge.admit_route_aware_provider_work_attempt(text,integer,text),bridge.claim_provider_admitted_transport(uuid) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.bind_provider_work_route(text,integer,bigint),bridge.admit_route_aware_provider_work_attempt(text,integer,text),bridge.claim_provider_admitted_transport(uuid) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0100_bssv20140402_atomic_process_baseline_enforcement') ON CONFLICT DO NOTHING;
