-- BSS-V2-014-02-01: the route-keyed 03A row is historical migration input,
-- not a complete authority.  Successor rows retain the resolver-qualified
-- route/model tuple and receive a publisher-assigned immutable version.
ALTER TABLE bridge.qualified_provider_route_authority
  DROP CONSTRAINT IF EXISTS qualified_provider_route_authority_pkey;

ALTER TABLE bridge.qualified_provider_route_authority
  ADD COLUMN IF NOT EXISTS authority_version bigint GENERATED ALWAYS AS IDENTITY,
  ADD COLUMN IF NOT EXISTS quota_domain_id text,
  ADD COLUMN IF NOT EXISTS provider_id text,
  ADD COLUMN IF NOT EXISTS model_or_processor_id text,
  ADD COLUMN IF NOT EXISTS qualification_ref text,
  ADD COLUMN IF NOT EXISTS authority_kind text NOT NULL DEFAULT 'legacy_incomplete'
    CHECK (authority_kind IN ('legacy_incomplete', 'qualified_v1'));

ALTER TABLE bridge.qualified_provider_route_authority
  ADD CONSTRAINT qualified_provider_route_authority_pkey PRIMARY KEY (authority_version);

CREATE UNIQUE INDEX IF NOT EXISTS qualified_provider_route_authority_complete_identity
  ON bridge.qualified_provider_route_authority(
    route_id, quota_domain_id, provider_id, model_or_processor_id,
    adapter_version, qualification_ref, qualification_version
  ) WHERE authority_kind = 'qualified_v1';

CREATE OR REPLACE FUNCTION bridge.reject_qualified_provider_route_authority_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'qualified provider route authority is append-only; publish a successor authority version';
END;
$$;

DROP TRIGGER IF EXISTS qualified_provider_route_authority_immutable
  ON bridge.qualified_provider_route_authority;
CREATE TRIGGER qualified_provider_route_authority_immutable
  BEFORE UPDATE OR DELETE ON bridge.qualified_provider_route_authority
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_qualified_provider_route_authority_mutation();

DROP FUNCTION IF EXISTS bridge.publish_qualified_provider_route_authority(text,text,text,text);

CREATE FUNCTION bridge.publish_qualified_provider_route_authority(
  p_route_id text,
  p_quota_domain_id text,
  p_provider_id text,
  p_model_or_processor_id text,
  p_adapter_version text,
  p_qualification_ref text,
  p_qualification_version text,
  p_capability text
)
RETURNS TABLE(
  authority_version bigint,
  route_id text,
  quota_domain_id text,
  provider_id text,
  model_or_processor_id text,
  adapter_version text,
  qualification_ref text,
  qualification_version text,
  capability text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, bridge
AS $$
DECLARE existing bridge.qualified_provider_route_authority;
BEGIN
  IF p_route_id IS NULL OR p_quota_domain_id IS NULL OR p_provider_id IS NULL
    OR p_model_or_processor_id IS NULL OR p_adapter_version IS NULL
    OR p_qualification_ref IS NULL OR p_qualification_version IS NULL OR p_capability IS NULL
    OR btrim(p_route_id) = '' OR btrim(p_quota_domain_id) = '' OR btrim(p_provider_id) = ''
    OR btrim(p_model_or_processor_id) = '' OR btrim(p_adapter_version) = ''
    OR btrim(p_qualification_ref) = '' OR btrim(p_qualification_version) = '' OR btrim(p_capability) = '' THEN
    RAISE EXCEPTION 'qualified route authority is incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM bridge.provider_capacity_profile capacity,
           jsonb_array_elements(capacity.associated_routes) associated_route
     WHERE capacity.quota_domain_id = p_quota_domain_id
       AND capacity.provider_account_alias = p_provider_id
       AND (associated_route #>> '{}' = p_route_id OR associated_route ->> 'routeId' = p_route_id)
  ) THEN
    RAISE EXCEPTION 'qualified route authority is foreign, revoked, or mismatched for its quota domain';
  END IF;

  SELECT authority.* INTO existing
    FROM bridge.qualified_provider_route_authority authority
   WHERE authority.authority_kind = 'qualified_v1'
     AND authority.route_id = p_route_id
     AND authority.quota_domain_id = p_quota_domain_id
     AND authority.provider_id = p_provider_id
     AND authority.model_or_processor_id = p_model_or_processor_id
     AND authority.adapter_version = p_adapter_version
     AND authority.qualification_ref = p_qualification_ref
     AND authority.qualification_version = p_qualification_version;

  IF NOT FOUND THEN
    INSERT INTO bridge.qualified_provider_route_authority(
      route_id, capability, adapter_version, qualification_version,
      quota_domain_id, provider_id, model_or_processor_id, qualification_ref, authority_kind
    ) VALUES (
      p_route_id, p_capability, p_adapter_version, p_qualification_version,
      p_quota_domain_id, p_provider_id, p_model_or_processor_id, p_qualification_ref, 'qualified_v1'
    ) RETURNING * INTO existing;
  ELSIF existing.capability <> p_capability THEN
    RAISE EXCEPTION 'qualified route authority capability mismatches the immutable published tuple';
  END IF;

  RETURN QUERY SELECT
    existing.authority_version, existing.route_id, existing.quota_domain_id,
    existing.provider_id, existing.model_or_processor_id, existing.adapter_version,
    existing.qualification_ref, existing.qualification_version, existing.capability;
END;
$$;

ALTER TABLE bridge.qualified_provider_route_authority OWNER TO atlas;
ALTER FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text,text,text,text,text) OWNER TO atlas;
REVOKE ALL ON TABLE bridge.qualified_provider_route_authority FROM PUBLIC, atlas_app, agents_bridge;
GRANT SELECT ON TABLE bridge.qualified_provider_route_authority TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text,text,text,text,text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text,text,text,text,text) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0088_bssv20140201_model_bound_route_authority') ON CONFLICT DO NOTHING;
