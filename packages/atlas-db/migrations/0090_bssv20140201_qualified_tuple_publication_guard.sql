-- The publisher is callable by the Bridge role, so its durable boundary must
-- compare every submitted identity field with the immutable capacity-profile
-- association instead of accepting a merely non-empty tuple.
CREATE OR REPLACE FUNCTION bridge.publish_qualified_provider_route_authority(
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
       AND associated_route ->> 'routeId' = p_route_id
       AND associated_route ->> 'providerId' = p_provider_id
       AND associated_route ->> 'modelOrProcessorId' = p_model_or_processor_id
       AND associated_route ->> 'adapterVersion' = p_adapter_version
       AND associated_route ->> 'qualificationRef' = p_qualification_ref
       AND associated_route ->> 'qualificationVersion' = p_qualification_version
       AND associated_route ->> 'capability' = p_capability
  ) THEN
    RAISE EXCEPTION 'qualified route authority is foreign, revoked, or mismatched for its quota domain; non-qualified identity is rejected';
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

ALTER FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text,text,text,text,text) OWNER TO atlas;
REVOKE ALL ON FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text,text,text,text,text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text,text,text,text,text) TO agents_bridge;
-- The protected publisher runs as the dedicated Atlas ownership role.  It may
-- read the immutable capacity association, but receives no write access to
-- that Bridge-owned catalogue.
GRANT USAGE ON SCHEMA bridge TO atlas;
GRANT SELECT ON TABLE bridge.provider_capacity_profile TO atlas;

INSERT INTO atlas.schema_migrations(name) VALUES('0090_bssv20140201_qualified_tuple_publication_guard') ON CONFLICT DO NOTHING;
