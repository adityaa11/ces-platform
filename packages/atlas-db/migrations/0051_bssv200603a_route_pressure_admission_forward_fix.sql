-- BSS-V2-006-03A-03: recovery is matching and monotonic. It cannot create or
-- raise a numeric clamp, and it cannot clear another route/domain incident.
CREATE OR REPLACE FUNCTION bridge.recover_provider_pressure_incident(
  p_quota_domain_id text, p_route_id text, p_feedback_id text, p_scope_kind text,
  p_dimension_id text DEFAULT NULL, p_window_identity text DEFAULT NULL,
  p_observation_trust text DEFAULT 'untrusted', p_observed_at timestamptz DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE incident bridge.provider_operational_pressure_incident;
BEGIN
  IF p_observation_trust<>'qualified' OR p_observed_at IS NULL OR p_observed_at>clock_timestamp() OR p_feedback_id IS NULL OR length(trim(p_feedback_id))=0 OR p_scope_kind NOT IN ('route','domain') THEN RAISE EXCEPTION 'pressure recovery is not trusted'; END IF;
  SELECT * INTO incident FROM bridge.provider_operational_pressure_incident i WHERE i.quota_domain_id=p_quota_domain_id AND i.route_id IS NOT DISTINCT FROM CASE WHEN p_scope_kind='domain' THEN NULL ELSE p_route_id END AND i.scope_kind=p_scope_kind AND i.dimension_id IS NOT DISTINCT FROM p_dimension_id AND i.window_identity IS NOT DISTINCT FROM p_window_identity AND i.recovered_at IS NULL FOR UPDATE;
  IF NOT FOUND OR p_observed_at<incident.created_at THEN RETURN false; END IF;
  UPDATE bridge.provider_operational_pressure_incident SET recovered_at=clock_timestamp(),recovery_feedback_id=p_feedback_id,updated_at=clock_timestamp() WHERE incident_id=incident.incident_id AND recovered_at IS NULL;
  RETURN FOUND;
END;
$$;
ALTER FUNCTION bridge.recover_provider_pressure_incident(text,text,text,text,text,text,text,timestamptz) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.recover_provider_pressure_incident(text,text,text,text,text,text,text,timestamptz) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.recover_provider_pressure_incident(text,text,text,text,text,text,text,timestamptz) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0051_bssv200603a_route_pressure_admission_forward_fix') ON CONFLICT DO NOTHING;
