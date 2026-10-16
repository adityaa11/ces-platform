-- BSS-V2-006-03A-03: cooldown expiration permits a bounded probe but is not
-- recovery. Keep every unrecovered qualified domain observation in the
-- conservative capacity calculation until matching recovery is recorded.
CREATE OR REPLACE FUNCTION bridge.apply_domain_pressure_clamps(
  p_quota_domain_id text, p_used jsonb, p_capacity jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb := p_capacity; incident record; current_capacity numeric; used_units numeric;
BEGIN
  FOR incident IN SELECT dimension_id,numeric_remaining_units FROM bridge.provider_operational_pressure_incident
    WHERE quota_domain_id=p_quota_domain_id AND scope_kind='domain' AND recovered_at IS NULL
      AND numeric_remaining_units IS NOT NULL LOOP
    current_capacity := (result->>incident.dimension_id)::numeric;
    used_units := COALESCE((p_used->>incident.dimension_id)::numeric,0);
    result := jsonb_set(result, ARRAY[incident.dimension_id], to_jsonb(LEAST(current_capacity,used_units+incident.numeric_remaining_units)));
  END LOOP;
  RETURN result;
END;
$$;

ALTER FUNCTION bridge.apply_domain_pressure_clamps(text,jsonb,jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.apply_domain_pressure_clamps(text,jsonb,jsonb) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.apply_domain_pressure_clamps(text,jsonb,jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0056_bssv200603a_post_cooldown_domain_pressure_clamp') ON CONFLICT DO NOTHING;
