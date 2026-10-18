-- BSS-V2-006-05-01: BSS-V2-005 owns this planning-only policy seam.  It is
-- deliberately separate from the immutable provider catalogue and does not
-- publish a desired plan, activate a route, or alter runtime admission.

CREATE TABLE IF NOT EXISTS bridge.provider_enforcement_policy_approval (
  approval_ref text PRIMARY KEY CHECK (length(trim(approval_ref)) > 0),
  quota_domain_id text NOT NULL CHECK (length(trim(quota_domain_id)) > 0),
  provider_capacity_profile_version text NOT NULL CHECK (length(trim(provider_capacity_profile_version)) > 0),
  route_id text NOT NULL CHECK (length(trim(route_id)) > 0),
  policy_id text NOT NULL CHECK (length(trim(policy_id)) > 0),
  policy_version text NOT NULL CHECK (length(trim(policy_version)) > 0),
  permitted_unknown_dimensions jsonb NOT NULL CHECK (jsonb_typeof(permitted_unknown_dimensions) = 'object'),
  approved_by text NOT NULL CHECK (length(trim(approved_by)) > 0),
  approved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version),
  FOREIGN KEY (quota_domain_id, provider_capacity_profile_version)
    REFERENCES bridge.provider_capacity_profile(quota_domain_id, profile_version) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bridge.provider_enforcement_policy (
  quota_domain_id text NOT NULL CHECK (length(trim(quota_domain_id)) > 0),
  provider_capacity_profile_version text NOT NULL CHECK (length(trim(provider_capacity_profile_version)) > 0),
  route_id text NOT NULL CHECK (length(trim(route_id)) > 0),
  policy_id text NOT NULL CHECK (length(trim(policy_id)) > 0),
  policy_version text NOT NULL CHECK (length(trim(policy_version)) > 0),
  approval_ref text NOT NULL REFERENCES bridge.provider_enforcement_policy_approval(approval_ref) ON DELETE RESTRICT,
  dimensions jsonb NOT NULL CHECK (jsonb_typeof(dimensions) = 'object'),
  effective_from timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version),
  UNIQUE (quota_domain_id, provider_capacity_profile_version, route_id, effective_from),
  FOREIGN KEY (quota_domain_id, provider_capacity_profile_version)
    REFERENCES bridge.provider_capacity_profile(quota_domain_id, profile_version) ON DELETE RESTRICT
);

-- Revocation is append-only: a revoked immutable authorization never falls
-- back to a prior policy, because that would silently re-authorize a mask.
CREATE TABLE IF NOT EXISTS bridge.provider_enforcement_policy_revocation (
  quota_domain_id text NOT NULL,
  provider_capacity_profile_version text NOT NULL,
  route_id text NOT NULL,
  policy_id text NOT NULL,
  policy_version text NOT NULL,
  revocation_ref text NOT NULL CHECK (length(trim(revocation_ref)) > 0),
  revoked_by text NOT NULL CHECK (length(trim(revoked_by)) > 0),
  revoked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version),
  UNIQUE (revocation_ref),
  FOREIGN KEY (quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version)
    REFERENCES bridge.provider_enforcement_policy(quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version)
    ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION bridge.reject_provider_enforcement_policy_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'provider enforcement policy provenance is immutable; publish a new policy version or append a revocation';
END;
$$;

DROP TRIGGER IF EXISTS provider_enforcement_policy_approval_immutable ON bridge.provider_enforcement_policy_approval;
CREATE TRIGGER provider_enforcement_policy_approval_immutable BEFORE UPDATE OR DELETE ON bridge.provider_enforcement_policy_approval
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_provider_enforcement_policy_mutation();
DROP TRIGGER IF EXISTS provider_enforcement_policy_immutable ON bridge.provider_enforcement_policy;
CREATE TRIGGER provider_enforcement_policy_immutable BEFORE UPDATE OR DELETE ON bridge.provider_enforcement_policy
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_provider_enforcement_policy_mutation();
DROP TRIGGER IF EXISTS provider_enforcement_policy_revocation_immutable ON bridge.provider_enforcement_policy_revocation;
CREATE TRIGGER provider_enforcement_policy_revocation_immutable BEFORE UPDATE OR DELETE ON bridge.provider_enforcement_policy_revocation
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_provider_enforcement_policy_mutation();

-- All routes sharing an immutable profile must have the same mask.  A caller
-- can select a route, but cannot select a weaker domain-wide enforcement set.
CREATE OR REPLACE FUNCTION bridge.reject_conflicting_provider_enforcement_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bridge.provider_enforcement_policy existing
      WHERE existing.quota_domain_id = NEW.quota_domain_id
        AND existing.provider_capacity_profile_version = NEW.provider_capacity_profile_version
        AND existing.dimensions IS DISTINCT FROM NEW.dimensions
  ) THEN
    RAISE EXCEPTION 'conflicting enforcement dimensions for one quota domain/profile are forbidden';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_enforcement_policy_domain_mask_consistent ON bridge.provider_enforcement_policy;
CREATE TRIGGER provider_enforcement_policy_domain_mask_consistent BEFORE INSERT ON bridge.provider_enforcement_policy
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_conflicting_provider_enforcement_policy();

CREATE OR REPLACE FUNCTION bridge.derive_effective_enforcement_policy(
  p_quota_domain_id text,
  p_provider_capacity_profile_version text,
  p_route_id text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  v_capacity bridge.provider_capacity_profile;
  v_policy bridge.provider_enforcement_policy;
  v_approval bridge.provider_enforcement_policy_approval;
  v_dimension record;
  v_rule jsonb;
  v_window jsonb;
  v_effective jsonb := '{}'::jsonb;
BEGIN
  IF p_quota_domain_id IS NULL OR length(trim(p_quota_domain_id)) = 0
    OR p_provider_capacity_profile_version IS NULL OR length(trim(p_provider_capacity_profile_version)) = 0
    OR p_route_id IS NULL OR length(trim(p_route_id)) = 0 THEN
    RAISE EXCEPTION 'effective enforcement policy requires an exact domain, profile version, and route';
  END IF;

  SELECT * INTO v_capacity FROM bridge.provider_capacity_profile
    WHERE quota_domain_id = p_quota_domain_id AND profile_version = p_provider_capacity_profile_version;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_capacity.associated_routes) route
      WHERE route->>'routeId' = p_route_id
  ) THEN
    RAISE EXCEPTION 'capacity profile/domain/route binding is not qualified';
  END IF;

  SELECT policy.* INTO v_policy FROM bridge.provider_enforcement_policy policy
    WHERE policy.quota_domain_id = p_quota_domain_id
      AND policy.provider_capacity_profile_version = p_provider_capacity_profile_version
      AND policy.route_id = p_route_id
      AND policy.effective_from <= clock_timestamp()
    ORDER BY policy.effective_from DESC
    LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'authorized enforcement policy is missing or stale'; END IF;
  IF EXISTS (
    SELECT 1 FROM bridge.provider_enforcement_policy_revocation revoked
      WHERE (revoked.quota_domain_id, revoked.provider_capacity_profile_version, revoked.route_id, revoked.policy_id, revoked.policy_version)
        = (v_policy.quota_domain_id, v_policy.provider_capacity_profile_version, v_policy.route_id, v_policy.policy_id, v_policy.policy_version)
  ) THEN RAISE EXCEPTION 'authorized enforcement policy is revoked'; END IF;

  SELECT * INTO v_approval FROM bridge.provider_enforcement_policy_approval WHERE approval_ref = v_policy.approval_ref;
  IF NOT FOUND
    OR (v_approval.quota_domain_id, v_approval.provider_capacity_profile_version, v_approval.route_id, v_approval.policy_id, v_approval.policy_version)
       IS DISTINCT FROM (v_policy.quota_domain_id, v_policy.provider_capacity_profile_version, v_policy.route_id, v_policy.policy_id, v_policy.policy_version) THEN
    RAISE EXCEPTION 'enforcement policy approval provenance is forged or foreign';
  END IF;
  IF NOT (v_capacity.limits ?& ARRAY['rpm','tpm','rpd','concurrency'])
    OR (SELECT count(*) FROM jsonb_object_keys(v_capacity.limits)) <> 4
    OR (SELECT count(*) FROM jsonb_object_keys(v_policy.dimensions)) <> 4
    OR NOT (v_policy.dimensions ?& ARRAY['rpm','tpm','rpd','concurrency']) THEN
    RAISE EXCEPTION 'provider capacity policy has an unsupported or incomplete dimension set';
  END IF;

  FOR v_dimension IN SELECT key AS name, value AS provider_limit FROM jsonb_each(v_capacity.limits) LOOP
    v_rule := v_policy.dimensions -> v_dimension.name;
    IF jsonb_typeof(v_rule) <> 'object' THEN RAISE EXCEPTION 'enforcement decision for dimension % is malformed', v_dimension.name; END IF;
    IF v_dimension.provider_limit->>'state' = 'known' THEN
      IF jsonb_typeof(v_dimension.provider_limit->'value') <> 'number'
        OR (v_dimension.provider_limit->>'value')::numeric <= 0
        OR v_rule <> jsonb_build_object('mode','enforced','limitSource','provider') THEN
        RAISE EXCEPTION 'known provider dimension % must remain positively enforced', v_dimension.name;
      END IF;
      v_window := v_capacity.window_policies -> v_dimension.name;
      IF v_dimension.name <> 'concurrency' AND (jsonb_typeof(v_window) <> 'object' OR COALESCE(v_window->>'kind','unknown') = 'unknown') THEN
        RAISE EXCEPTION 'enforced provider dimension % has unknown accounting or reset policy', v_dimension.name;
      END IF;
      v_effective := v_effective || jsonb_build_object(v_dimension.name, jsonb_build_object(
        'mode','enforced','providerState','known','limitSource','provider','limit',v_dimension.provider_limit->'value',
        'windowPolicy', CASE WHEN v_window IS NULL THEN NULL ELSE v_window END
      ));
    ELSIF v_dimension.provider_limit->>'state' = 'unknown' THEN
      IF v_rule->>'mode' <> 'not_enforced'
        OR v_rule->>'providerState' <> 'unknown'
        OR v_rule->>'reason' <> 'not_published'
        OR v_rule->>'approvalRef' <> v_approval.approval_ref
        OR v_approval.permitted_unknown_dimensions -> v_dimension.name
          IS DISTINCT FROM jsonb_build_object('providerState','unknown','reason','not_published') THEN
        RAISE EXCEPTION 'unknown provider dimension % lacks its exact authorized exclusion', v_dimension.name;
      END IF;
      v_effective := v_effective || jsonb_build_object(v_dimension.name, jsonb_build_object(
        'mode','not_enforced','providerState','unknown','reason','not_published','approvalRef',v_approval.approval_ref
      ));
    ELSE
      RAISE EXCEPTION 'provider dimension % is unknown, zero, or otherwise unusable', v_dimension.name;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'apiVersion','EffectiveEnforcementPolicy/v1',
    'quotaDomainId',v_policy.quota_domain_id,
    'providerCapacityProfileVersion',v_policy.provider_capacity_profile_version,
    'routeId',v_policy.route_id,
    'policyId',v_policy.policy_id,
    'policyVersion',v_policy.policy_version,
    'effectiveFrom',v_policy.effective_from,
    'providerProfileProvenance',jsonb_build_object('capacitySource',v_capacity.capacity_source,'sourceRef',v_capacity.source_ref,'sourceVersion',v_capacity.source_version),
    'dimensions',v_effective
  );
END;
$$;

INSERT INTO bridge.provider_enforcement_policy_approval(
  approval_ref, quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version,
  permitted_unknown_dimensions, approved_by, approved_at
) VALUES (
  'anoman-rpd-not-published-approval-2026-10-18', 'anoman-shared-prod', '2026-10-18.1', 'anoman-semantic',
  'capacity-dimension-enforcement', 'anoman-v1',
  '{"rpd":{"providerState":"unknown","reason":"not_published"}}'::jsonb,
  'bss-v2-005-policy-owner', '2026-10-18T00:00:00Z'
) ON CONFLICT (approval_ref) DO NOTHING;

INSERT INTO bridge.provider_enforcement_policy(
  quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version, approval_ref, dimensions, effective_from
) VALUES (
  'anoman-shared-prod', '2026-10-18.1', 'anoman-semantic', 'capacity-dimension-enforcement', 'anoman-v1',
  'anoman-rpd-not-published-approval-2026-10-18',
  '{"rpm":{"mode":"enforced","limitSource":"provider"},"tpm":{"mode":"enforced","limitSource":"provider"},"rpd":{"mode":"not_enforced","providerState":"unknown","reason":"not_published","approvalRef":"anoman-rpd-not-published-approval-2026-10-18"},"concurrency":{"mode":"enforced","limitSource":"provider"}}'::jsonb,
  '2026-10-18T00:00:00Z'
) ON CONFLICT (quota_domain_id, provider_capacity_profile_version, route_id, policy_id, policy_version) DO NOTHING;

ALTER TABLE bridge.provider_enforcement_policy_approval OWNER TO agents_bridge;
ALTER TABLE bridge.provider_enforcement_policy OWNER TO agents_bridge;
ALTER TABLE bridge.provider_enforcement_policy_revocation OWNER TO agents_bridge;
ALTER FUNCTION bridge.reject_provider_enforcement_policy_mutation() OWNER TO agents_bridge;
ALTER FUNCTION bridge.reject_conflicting_provider_enforcement_policy() OWNER TO agents_bridge;
ALTER FUNCTION bridge.derive_effective_enforcement_policy(text,text,text) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_enforcement_policy_approval, bridge.provider_enforcement_policy, bridge.provider_enforcement_policy_revocation FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.derive_effective_enforcement_policy(text,text,text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.derive_effective_enforcement_policy(text,text,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0077_bssv20060501_authorized_enforcement_policy_provenance') ON CONFLICT DO NOTHING;
