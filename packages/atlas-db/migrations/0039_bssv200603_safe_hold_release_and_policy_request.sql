-- BSS-V2-006-03: a runtime observation can request (but never publish) a
-- durable BSS-V2-005 capacity revision, and retained usage can leave only at
-- a known, observed safe window boundary.
CREATE TABLE bridge.provider_capacity_revision_request (
  request_id text PRIMARY KEY CHECK (length(trim(request_id)) > 0), quota_domain_id text NOT NULL, route_id text NOT NULL,
  dimension_id text NOT NULL CHECK (dimension_id IN ('rpm','tpm','rpd','concurrency')), lower_limit numeric NOT NULL CHECK (lower_limit >= 0),
  qualified_source text NOT NULL CHECK (qualified_source IN ('provider_api','provider_docs','operator_policy')), source_ref text NOT NULL CHECK (length(trim(source_ref)) > 0),
  observed_at timestamptz NOT NULL, requested_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION bridge.release_provider_runtime_usage_hold(p_reservation_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE hold bridge.provider_runtime_usage_hold;
BEGIN
  SELECT * INTO hold FROM bridge.provider_runtime_usage_hold WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'runtime usage hold is missing'; END IF;
  IF hold.released_at IS NOT NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.provider_quota_window_state state WHERE state.quota_domain_id=hold.quota_domain_id AND state.reset_semantics_known AND state.reset_at IS NOT NULL AND state.reset_at <= now()) THEN RAISE EXCEPTION 'runtime usage hold has no observed safe window boundary'; END IF;
  UPDATE bridge.provider_runtime_usage_hold SET released_at=now() WHERE reservation_id=p_reservation_id;
END;
$$;
CREATE OR REPLACE FUNCTION bridge.request_provider_capacity_revision(p_request_id text,p_quota_domain_id text,p_route_id text,p_dimension_id text,p_lower_limit numeric,p_qualified_source text,p_source_ref text,p_observed_at timestamptz)
RETURNS bridge.provider_capacity_revision_request LANGUAGE plpgsql AS $$
DECLARE active record; result bridge.provider_capacity_revision_request;
BEGIN
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id); IF NOT FOUND THEN RAISE EXCEPTION 'active desired admission profile is required'; END IF;
  IF p_dimension_id NOT IN ('rpm','tpm','rpd','concurrency') OR p_lower_limit < 0 OR p_qualified_source NOT IN ('provider_api','provider_docs','operator_policy') OR p_source_ref IS NULL OR length(trim(p_source_ref))=0 OR p_observed_at IS NULL THEN RAISE EXCEPTION 'capacity revision request is not qualified'; END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.provider_capacity_profile c,jsonb_array_elements(c.associated_routes) route WHERE c.quota_domain_id=p_quota_domain_id AND c.profile_version=active.provider_capacity_profile_version AND route->>'routeId'=p_route_id) THEN RAISE EXCEPTION 'capacity revision route is not associated with the active quota domain'; END IF;
  INSERT INTO bridge.provider_capacity_revision_request(request_id,quota_domain_id,route_id,dimension_id,lower_limit,qualified_source,source_ref,observed_at) VALUES(p_request_id,p_quota_domain_id,p_route_id,p_dimension_id,p_lower_limit,p_qualified_source,p_source_ref,p_observed_at) ON CONFLICT(request_id) DO NOTHING RETURNING * INTO result;
  IF NOT FOUND THEN SELECT * INTO result FROM bridge.provider_capacity_revision_request WHERE request_id=p_request_id; IF result.quota_domain_id<>p_quota_domain_id OR result.route_id<>p_route_id OR result.dimension_id<>p_dimension_id OR result.lower_limit<>p_lower_limit THEN RAISE EXCEPTION 'capacity revision request identity conflicts'; END IF; END IF;
  RETURN result;
END;
$$;
ALTER TABLE bridge.provider_capacity_revision_request OWNER TO agents_bridge;
ALTER FUNCTION bridge.release_provider_runtime_usage_hold(uuid) OWNER TO agents_bridge;
ALTER FUNCTION bridge.request_provider_capacity_revision(text,text,text,text,numeric,text,text,timestamptz) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_capacity_revision_request FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.release_provider_runtime_usage_hold(uuid),bridge.request_provider_capacity_revision(text,text,text,text,numeric,text,text,timestamptz) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.release_provider_runtime_usage_hold(uuid),bridge.request_provider_capacity_revision(text,text,text,text,numeric,text,text,timestamptz) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0039_bssv200603_safe_hold_release_and_policy_request') ON CONFLICT DO NOTHING;
