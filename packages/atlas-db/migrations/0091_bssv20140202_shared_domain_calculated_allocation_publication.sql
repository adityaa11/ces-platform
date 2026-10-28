-- BSS-V2-014-02-02: publish a candidate immutable shared-domain plan.  This
-- supersedes the single-route effective-policy publisher, but deliberately
-- does not activate the candidate: activation remains owned by the parent
-- BSS-V2-014 cutover gate.

CREATE TABLE bridge.calculated_class_process_allocation (
  quota_domain_id text NOT NULL,
  desired_profile_version text NOT NULL,
  allocation_version text NOT NULL CHECK (allocation_version = 'v1'),
  effective_mask jsonb NOT NULL CHECK (jsonb_typeof(effective_mask) = 'array'),
  allocation jsonb NOT NULL CHECK (jsonb_typeof(allocation) = 'object'),
  allocation_fingerprint text NOT NULL CHECK (length(allocation_fingerprint) = 32),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (quota_domain_id, desired_profile_version),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile(quota_domain_id, profile_version) ON DELETE RESTRICT
);

CREATE TABLE bridge.desired_admission_profile_route_binding_v2 (
  quota_domain_id text NOT NULL,
  desired_profile_version text NOT NULL,
  route_id text NOT NULL,
  authority_version bigint NOT NULL,
  provider_capacity_profile_version text NOT NULL,
  effective_mask jsonb NOT NULL CHECK (jsonb_typeof(effective_mask) = 'array'),
  allocation_version text NOT NULL CHECK (allocation_version = 'v1'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (quota_domain_id, desired_profile_version, route_id),
  UNIQUE (quota_domain_id, desired_profile_version, authority_version),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile(quota_domain_id, profile_version) ON DELETE RESTRICT,
  FOREIGN KEY (authority_version)
    REFERENCES bridge.qualified_provider_route_authority(authority_version) ON DELETE RESTRICT
);

CREATE TABLE bridge.desired_admission_profile_candidate (
  quota_domain_id text NOT NULL,
  candidate_activation_revision bigint NOT NULL CHECK (candidate_activation_revision > 0),
  desired_profile_version text NOT NULL,
  effective_input_fingerprint text NOT NULL CHECK (length(effective_input_fingerprint) = 32),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (quota_domain_id, candidate_activation_revision),
  UNIQUE (quota_domain_id, desired_profile_version),
  UNIQUE (quota_domain_id, effective_input_fingerprint),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile(quota_domain_id, profile_version) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION bridge.reject_shared_domain_publication_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'shared-domain desired-plan publication is append-only; publish a successor candidate';
END;
$$;

CREATE TRIGGER calculated_class_process_allocation_immutable
  BEFORE UPDATE OR DELETE ON bridge.calculated_class_process_allocation
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_shared_domain_publication_mutation();
CREATE TRIGGER desired_admission_profile_route_binding_v2_immutable
  BEFORE UPDATE OR DELETE ON bridge.desired_admission_profile_route_binding_v2
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_shared_domain_publication_mutation();
CREATE TRIGGER desired_admission_profile_candidate_immutable
  BEFORE UPDATE OR DELETE ON bridge.desired_admission_profile_candidate
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_shared_domain_publication_mutation();

CREATE FUNCTION bridge.publish_shared_domain_calculated_desired_admission_profile(
  p_quota_domain_id text,
  p_expected_activation_revision bigint,
  p_provider_capacity_profile_version text,
  p_planner_version text,
  p_effective_from timestamptz,
  p_profile jsonb,
  p_inputs jsonb,
  p_route_authorities jsonb,
  p_calculated_allocation jsonb
) RETURNS TABLE (
  status text,
  desired_profile_version text,
  candidate_activation_revision bigint,
  effective_input_fingerprint text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bridge AS $$
DECLARE
  v_current record;
  v_capacity bridge.provider_capacity_profile;
  v_authority bridge.qualified_provider_route_authority;
  v_input jsonb;
  v_route jsonb;
  v_process bridge.provider_process_profile;
  v_workload bridge.workload_envelope_profile;
  v_policy jsonb;
  v_effective_mask jsonb;
  v_candidate record;
  v_fingerprint text;
  v_profile_version text;
  v_candidate_revision bigint;
  v_route_id text;
  v_authority_version bigint;
BEGIN
  IF p_quota_domain_id IS NULL OR btrim(p_quota_domain_id) = ''
    OR p_provider_capacity_profile_version IS NULL OR btrim(p_provider_capacity_profile_version) = ''
    OR p_planner_version IS NULL OR btrim(p_planner_version) = ''
    OR p_effective_from IS NULL OR jsonb_typeof(p_profile) <> 'object'
    OR jsonb_typeof(p_inputs) <> 'array' OR jsonb_array_length(p_inputs) = 0
    OR jsonb_typeof(p_route_authorities) <> 'array' OR jsonb_array_length(p_route_authorities) = 0
    OR jsonb_typeof(p_calculated_allocation) <> 'object' THEN
    RAISE EXCEPTION 'shared-domain publication requires complete candidate input, route authorities, and calculated allocation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 0));
  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_provider_capacity_profile_version
    FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'shared-domain publication capacity profile is missing'; END IF;

  IF p_profile->>'quotaDomainId' IS DISTINCT FROM p_quota_domain_id
    OR p_profile->>'providerCapacityProfileVersion' IS DISTINCT FROM p_provider_capacity_profile_version
    OR p_profile->>'plannerVersion' IS DISTINCT FROM p_planner_version
    OR p_profile->>'effectiveFrom' IS DISTINCT FROM p_effective_from::text THEN
    RAISE EXCEPTION 'shared-domain candidate is not bound to its exact domain, capacity profile, planner, and effective time';
  END IF;

  IF p_calculated_allocation->>'allocationVersion' IS DISTINCT FROM 'v1'
    OR jsonb_typeof(p_calculated_allocation->'effectiveMask') <> 'array'
    OR jsonb_typeof(p_calculated_allocation->'processBaselines') <> 'object' THEN
    RAISE EXCEPTION 'shared-domain publication requires CalculatedClassProcessAllocation/v1';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_route_authorities) route
    WHERE jsonb_typeof(route) <> 'object'
      OR route->>'routeId' IS NULL OR btrim(route->>'routeId') = ''
      OR route->>'authorityVersion' IS NULL
      OR route->>'authorityVersion' !~ '^[0-9]+$'
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_route_authorities) route
    GROUP BY route->>'routeId' HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'shared-domain publication has a duplicate or incomplete canonical route binding'; END IF;

  FOR v_route IN SELECT value FROM jsonb_array_elements(p_route_authorities) ORDER BY value->>'routeId' LOOP
    v_route_id := v_route->>'routeId';
    v_authority_version := (v_route->>'authorityVersion')::bigint;
    SELECT * INTO v_authority FROM bridge.qualified_provider_route_authority
      WHERE authority_version = v_authority_version AND authority_kind = 'qualified_v1' FOR KEY SHARE;
    IF NOT FOUND OR v_authority.route_id <> v_route_id OR v_authority.quota_domain_id <> p_quota_domain_id
      OR NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_capacity.associated_routes) route
        WHERE route->>'routeId' = v_authority.route_id
          AND route->>'providerId' = v_authority.provider_id
          AND route->>'modelOrProcessorId' = v_authority.model_or_processor_id
          AND route->>'adapterVersion' = v_authority.adapter_version
          AND route->>'qualificationRef' = v_authority.qualification_ref
          AND route->>'qualificationVersion' = v_authority.qualification_version
          AND route->>'capability' = v_authority.capability
      ) THEN RAISE EXCEPTION 'shared-domain publication received a stale, foreign, or non-qualified route authority'; END IF;

    v_policy := bridge.derive_effective_enforcement_policy(
      p_quota_domain_id, p_provider_capacity_profile_version, v_authority.route_id
    );
    SELECT COALESCE(jsonb_agg(name ORDER BY ordinal), '[]'::jsonb) INTO v_effective_mask
      FROM (VALUES ('rpm', 1), ('tpm', 2), ('rpd', 3), ('concurrency', 4)) AS known(name, ordinal)
      WHERE v_policy->'dimensions'->name->>'mode' = 'enforced';
    IF p_calculated_allocation->'effectiveMask' IS DISTINCT FROM v_effective_mask THEN
      RAISE EXCEPTION 'shared-domain publication calculated allocation has a different effective mask';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_inputs) input
      JOIN bridge.provider_process_profile process ON process.process_id = input->>'processId'
        AND process.profile_version = input->>'processProfileVersion'
      WHERE process.active
        AND process.eligible_route_ids @> jsonb_build_array(v_authority.route_id)
    ) THEN RAISE EXCEPTION 'shared-domain publication route is inactive or has no active qualified process'; END IF;
  END LOOP;

  FOR v_input IN SELECT value FROM jsonb_array_elements(p_inputs) ORDER BY value->>'processId', value->>'processProfileVersion' LOOP
    IF jsonb_typeof(v_input) <> 'object'
      OR NOT (v_input ? 'processId' AND v_input ? 'processProfileVersion' AND v_input ? 'workloadId' AND v_input ? 'workloadProfileVersion') THEN
      RAISE EXCEPTION 'shared-domain publication input is incomplete';
    END IF;
    SELECT * INTO v_process FROM bridge.provider_process_profile
      WHERE process_id = v_input->>'processId' AND profile_version = v_input->>'processProfileVersion' FOR KEY SHARE;
    SELECT * INTO v_workload FROM bridge.workload_envelope_profile
      WHERE workload_id = v_input->>'workloadId' AND profile_version = v_input->>'workloadProfileVersion' FOR KEY SHARE;
    IF NOT FOUND OR NOT v_process.active OR NOT v_workload.active
      OR v_process.workload_id <> v_workload.workload_id
      OR v_process.workload_profile_version <> v_workload.profile_version
      OR v_workload.quota_accounting_policy_id IS DISTINCT FROM v_capacity.quota_accounting_policy_id
      OR NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_route_authorities) route
        WHERE v_process.eligible_route_ids @> jsonb_build_array(route->>'routeId')
      ) THEN RAISE EXCEPTION 'shared-domain publication input is not an active qualified process/workload/route binding'; END IF;
  END LOOP;

  SELECT md5(jsonb_build_object(
    'quotaDomainId', p_quota_domain_id,
    'capacityProfileVersion', p_provider_capacity_profile_version,
    'plannerVersion', p_planner_version,
    'effectiveFrom', p_effective_from,
    'profile', p_profile,
    'inputs', (SELECT jsonb_agg(value ORDER BY value->>'processId', value->>'processProfileVersion') FROM jsonb_array_elements(p_inputs)),
    'routeAuthorities', (SELECT jsonb_agg(value ORDER BY value->>'routeId', (value->>'authorityVersion')::bigint) FROM jsonb_array_elements(p_route_authorities)),
    'calculatedAllocation', p_calculated_allocation
  )::text) INTO v_fingerprint;
  v_profile_version := 'shared-domain-v2-' || v_fingerprint;

  SELECT * INTO v_current FROM bridge.active_desired_admission_profile WHERE quota_domain_id = p_quota_domain_id FOR KEY SHARE;
  SELECT * INTO v_candidate FROM bridge.desired_admission_profile_candidate
    WHERE quota_domain_id = p_quota_domain_id AND effective_input_fingerprint = v_fingerprint;
  IF FOUND THEN
    RETURN QUERY SELECT 'unchanged'::text, v_candidate.desired_profile_version, v_candidate.candidate_activation_revision, v_fingerprint;
    RETURN;
  END IF;
  IF (v_current.activation_revision IS NULL AND p_expected_activation_revision IS NOT NULL)
    OR (v_current.activation_revision IS NOT NULL AND p_expected_activation_revision IS DISTINCT FROM v_current.activation_revision) THEN
    RETURN QUERY SELECT 'stale'::text, NULL::text, NULL::bigint, v_fingerprint;
    RETURN;
  END IF;

  INSERT INTO bridge.desired_admission_profile(quota_domain_id, profile_version, provider_capacity_profile_version, planner_version, effective_from, profile)
  VALUES (p_quota_domain_id, v_profile_version, p_provider_capacity_profile_version, p_planner_version, p_effective_from,
    p_profile || jsonb_build_object('effectiveInputFingerprint', v_fingerprint, 'successorPublication', 'shared_domain_calculated_allocation/v2', 'calculatedAllocationVersion', 'v1'));
  FOR v_input IN SELECT value FROM jsonb_array_elements(p_inputs) LOOP
    INSERT INTO bridge.desired_admission_profile_input(quota_domain_id, desired_profile_version, process_id, process_profile_version, workload_id, workload_profile_version)
    VALUES (p_quota_domain_id, v_profile_version, v_input->>'processId', v_input->>'processProfileVersion', v_input->>'workloadId', v_input->>'workloadProfileVersion');
  END LOOP;
  INSERT INTO bridge.calculated_class_process_allocation(quota_domain_id, desired_profile_version, allocation_version, effective_mask, allocation, allocation_fingerprint)
  VALUES (p_quota_domain_id, v_profile_version, 'v1', p_calculated_allocation->'effectiveMask', p_calculated_allocation, md5(p_calculated_allocation::text));
  FOR v_route IN SELECT value FROM jsonb_array_elements(p_route_authorities) LOOP
    INSERT INTO bridge.desired_admission_profile_route_binding_v2(quota_domain_id, desired_profile_version, route_id, authority_version, provider_capacity_profile_version, effective_mask, allocation_version)
    VALUES (p_quota_domain_id, v_profile_version, v_route->>'routeId', (v_route->>'authorityVersion')::bigint, p_provider_capacity_profile_version, p_calculated_allocation->'effectiveMask', 'v1');
  END LOOP;
  SELECT COALESCE(max(candidate_activation_revision), 0) + 1 INTO v_candidate_revision
    FROM bridge.desired_admission_profile_candidate WHERE quota_domain_id = p_quota_domain_id;
  INSERT INTO bridge.desired_admission_profile_candidate(quota_domain_id, candidate_activation_revision, desired_profile_version, effective_input_fingerprint)
  VALUES (p_quota_domain_id, v_candidate_revision, v_profile_version, v_fingerprint);
  RETURN QUERY SELECT 'published'::text, v_profile_version, v_candidate_revision, v_fingerprint;
END;
$$;

-- The two former public functions are the retired single-route publisher.
-- Drop rather than leave an overload or role-granted compatibility callable.
DROP FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile(text,bigint,text,text,text,timestamptz,jsonb,jsonb);
DROP FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile_v1(text,bigint,text,text,text,timestamptz,jsonb,jsonb);

-- Preserve the existing activation mechanism for historical plans, but fence
-- this successor until the parent-owned 03/04/05 production cutover exists.
CREATE OR REPLACE FUNCTION bridge.activate_desired_admission_profile(
  p_quota_domain_id text,
  p_desired_profile_version text
) RETURNS TABLE (quota_domain_id text, desired_profile_version text, activation_revision bigint, effective_from timestamptz)
LANGUAGE plpgsql AS $$
DECLARE profile_effective_from timestamptz; next_revision bigint; profile jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 0));
  SELECT effective_from, profile INTO profile_effective_from, profile FROM bridge.desired_admission_profile
    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_desired_profile_version FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'desired admission profile %:% is missing', p_quota_domain_id, p_desired_profile_version; END IF;
  IF profile->>'successorPublication' = 'shared_domain_calculated_allocation/v2' THEN
    RAISE EXCEPTION 'shared-domain successor activation is blocked until the BSS-V2-014 parent cutover gate';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.desired_admission_profile_input i JOIN bridge.provider_process_profile p ON (p.process_id,p.profile_version)=(i.process_id,i.process_profile_version) JOIN bridge.workload_envelope_profile w ON (w.workload_id,w.profile_version)=(i.workload_id,i.workload_profile_version) WHERE i.quota_domain_id=p_quota_domain_id AND i.desired_profile_version=p_desired_profile_version) THEN
    RAISE EXCEPTION 'desired admission profile %:% has no valid version-bound process/workload inputs', p_quota_domain_id, p_desired_profile_version;
  END IF;
  IF EXISTS (SELECT 1 FROM bridge.desired_admission_profile_activation activation WHERE activation.quota_domain_id=p_quota_domain_id AND activation.desired_profile_version=p_desired_profile_version) THEN RAISE EXCEPTION 'desired admission profile %:% was already activated', p_quota_domain_id,p_desired_profile_version; END IF;
  SELECT COALESCE(max(activation.activation_revision),0)+1 INTO next_revision
    FROM bridge.desired_admission_profile_activation AS activation
    WHERE activation.quota_domain_id = p_quota_domain_id;
  INSERT INTO bridge.desired_admission_profile_activation(quota_domain_id,activation_revision,desired_profile_version,effective_from) VALUES(p_quota_domain_id,next_revision,p_desired_profile_version,profile_effective_from);
  INSERT INTO bridge.active_desired_admission_profile(quota_domain_id,desired_profile_version,activation_revision,effective_from) VALUES(p_quota_domain_id,p_desired_profile_version,next_revision,profile_effective_from)
    ON CONFLICT ON CONSTRAINT active_desired_admission_profile_pkey DO UPDATE SET desired_profile_version=EXCLUDED.desired_profile_version,activation_revision=EXCLUDED.activation_revision,effective_from=EXCLUDED.effective_from,activated_at=now();
  RETURN QUERY SELECT p_quota_domain_id,p_desired_profile_version,next_revision,profile_effective_from;
END;
$$;

ALTER TABLE bridge.calculated_class_process_allocation OWNER TO atlas;
ALTER TABLE bridge.desired_admission_profile_route_binding_v2 OWNER TO atlas;
ALTER TABLE bridge.desired_admission_profile_candidate OWNER TO atlas;
ALTER FUNCTION bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb,jsonb,jsonb) OWNER TO atlas;
ALTER FUNCTION bridge.activate_desired_admission_profile(text,text) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.calculated_class_process_allocation, bridge.desired_admission_profile_route_binding_v2, bridge.desired_admission_profile_candidate FROM PUBLIC, atlas_app, agents_bridge;
REVOKE ALL ON FUNCTION bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb,jsonb,jsonb) TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.activate_desired_admission_profile(text,text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.activate_desired_admission_profile(text,text) TO agents_bridge;
-- Candidate publication is SECURITY DEFINER under the protected Atlas owner.
-- Grant only the Bridge-owned predecessor reads and the two durable plan
-- writes required by that single transaction; protected allocation, binding,
-- candidate and route-authority tables remain owned by atlas.
-- FOR KEY SHARE requires UPDATE privilege in PostgreSQL, even though this
-- function does not issue UPDATE statements.  It is granted solely to the
-- NOLOGIN definer role so its immutable predecessor reads retain their
-- transaction fence.
GRANT SELECT, UPDATE ON TABLE bridge.provider_capacity_profile, bridge.provider_process_profile,
  bridge.workload_envelope_profile, bridge.active_desired_admission_profile,
  bridge.desired_admission_profile, bridge.desired_admission_profile_input TO atlas;
GRANT INSERT ON TABLE bridge.desired_admission_profile,
  bridge.desired_admission_profile_input TO atlas;
GRANT EXECUTE ON FUNCTION bridge.derive_effective_enforcement_policy(text,text,text) TO atlas;

INSERT INTO atlas.schema_migrations(name) VALUES('0091_bssv20140202_shared_domain_calculated_allocation_publication') ON CONFLICT DO NOTHING;
