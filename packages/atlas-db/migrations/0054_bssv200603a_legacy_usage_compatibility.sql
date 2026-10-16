-- Include predecessor live reservations that deliberately have no 03A route
-- binding/physical ledger.  Route-bound work still uses exact physical rows.
CREATE OR REPLACE FUNCTION bridge.current_provider_operational_usage(p_quota_domain_id text, p_capacity_profile_version text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE capacity bridge.provider_capacity_profile; dimension text; policy jsonb; mismatch boolean; result jsonb := '{}'::jsonb; physical numeric; legacy numeric;
BEGIN
  SELECT * INTO capacity FROM bridge.provider_capacity_profile WHERE quota_domain_id=p_quota_domain_id AND profile_version=p_capacity_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'active provider capacity policy is missing'; END IF;
  FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
    policy:=capacity.window_policies->dimension;
    IF jsonb_typeof(policy)<>'object' OR policy->>'kind'<>'fixed' OR jsonb_typeof(policy->'windowSeconds')<>'number' THEN RAISE EXCEPTION 'active provider window policy is not qualified'; END IF;
    SELECT EXISTS(SELECT 1 FROM bridge.provider_window_usage_ledger l WHERE l.quota_domain_id=p_quota_domain_id AND l.dimension_id=dimension AND l.window_ends_at>clock_timestamp() AND l.window_policy IS DISTINCT FROM policy) INTO mismatch;
    IF mismatch THEN RAISE EXCEPTION 'nonexpired provider liability has an incompatible window policy'; END IF;
    SELECT COALESCE(sum(GREATEST(l.held_units,l.spent_units)),0) INTO physical FROM bridge.provider_window_usage_ledger l WHERE l.quota_domain_id=p_quota_domain_id AND l.dimension_id=dimension AND l.window_ends_at>clock_timestamp();
    SELECT COALESCE(sum(COALESCE((r.request_resource_envelope->>dimension)::numeric,0)),0) INTO legacy
      FROM bridge.provider_work_reservation r JOIN bridge.provider_work_attempt w USING(logical_work_id,attempt_number)
      WHERE w.quota_domain_id=p_quota_domain_id AND r.state='live'
        AND NOT EXISTS (SELECT 1 FROM bridge.provider_window_usage_ledger l WHERE l.reservation_id=r.reservation_id);
    result:=result || jsonb_build_object(dimension,physical+legacy);
  END LOOP;
  RETURN result;
END;
$$;
ALTER FUNCTION bridge.current_provider_operational_usage(text,text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.current_provider_operational_usage(text,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.current_provider_operational_usage(text,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0054_bssv200603a_legacy_usage_compatibility') ON CONFLICT DO NOTHING;
