-- Forward-only convergence for an upgraded schema that recorded an older
-- 0049 pressure function before the qualified observation signature settled.
-- This preserves the approved 03A-03 policy semantics and lets 03A-04 prove
-- that transient pressure does not create a convergence intent.
CREATE OR REPLACE FUNCTION bridge.record_provider_429_pressure(
  p_quota_domain_id text, p_route_id text, p_feedback_id text,
  p_retry_after_seconds numeric DEFAULT NULL, p_scope_kind text DEFAULT 'route', p_observation_trust text DEFAULT 'untrusted',
  p_dimension_id text DEFAULT NULL, p_window_identity text DEFAULT NULL, p_remaining_units numeric DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE policy bridge.runtime_pressure_safety_policy; seconds integer; v_incident_key text; created uuid; trusted_domain_numeric boolean;
BEGIN
  IF p_quota_domain_id IS NULL OR length(trim(p_quota_domain_id))=0 OR p_route_id IS NULL OR length(trim(p_route_id))=0 OR p_feedback_id IS NULL OR length(trim(p_feedback_id))=0 THEN RAISE EXCEPTION 'pressure identity is invalid'; END IF;
  IF p_scope_kind NOT IN ('route','domain') THEN RAISE EXCEPTION 'pressure scope is invalid'; END IF;
  IF p_dimension_id IS NOT NULL AND p_dimension_id NOT IN ('rpm','tpm','rpd','concurrency') THEN RAISE EXCEPTION 'pressure dimension is invalid'; END IF;
  SELECT * INTO policy FROM bridge.runtime_pressure_safety_policy WHERE quota_domain_id=p_quota_domain_id AND active AND (route_id=p_route_id OR route_id IS NULL) ORDER BY CASE WHEN route_id=p_route_id THEN 0 ELSE 1 END LIMIT 1;
  v_incident_key:=md5(concat_ws(':',p_scope_kind,p_quota_domain_id,CASE WHEN p_scope_kind='domain' THEN '' ELSE p_route_id END,COALESCE(p_dimension_id,''),COALESCE(p_window_identity,'')));
  trusted_domain_numeric:=p_scope_kind='domain' AND p_observation_trust='qualified' AND p_dimension_id IS NOT NULL AND p_window_identity IS NOT NULL AND p_remaining_units IS NOT NULL AND p_remaining_units>=0;
  IF NOT FOUND THEN
    INSERT INTO bridge.provider_operational_pressure_incident(quota_domain_id,route_id,incident_key,policy_available,scope_kind,dimension_id,window_identity,numeric_remaining_units,cooldown_until,probe_eligibility_deadline)
      VALUES(p_quota_domain_id,p_route_id,v_incident_key,false,'route',p_dimension_id,p_window_identity,NULL,'infinity',NULL)
      ON CONFLICT (quota_domain_id,route_id,incident_key) DO NOTHING RETURNING incident_id INTO created;
    IF created IS NULL THEN SELECT i.incident_id INTO created FROM bridge.provider_operational_pressure_incident i WHERE i.quota_domain_id=p_quota_domain_id AND i.route_id=p_route_id AND i.incident_key=v_incident_key; END IF;
    RETURN created;
  END IF;
  IF p_retry_after_seconds IS NOT NULL AND p_retry_after_seconds>0 AND p_retry_after_seconds=trunc(p_retry_after_seconds) AND p_retry_after_seconds<=policy.maximum_accepted_retry_after_seconds THEN seconds:=p_retry_after_seconds::integer; ELSE seconds:=policy.metadata_free_cooldown_seconds; END IF;
  INSERT INTO bridge.provider_operational_pressure_incident(quota_domain_id,route_id,incident_key,safety_policy_id,safety_policy_version,policy_available,scope_kind,dimension_id,window_identity,numeric_remaining_units,cooldown_until,probe_eligibility_deadline)
    VALUES(p_quota_domain_id,CASE WHEN p_scope_kind='domain' THEN NULL ELSE p_route_id END,v_incident_key,policy.policy_id,policy.version,true,p_scope_kind,p_dimension_id,p_window_identity,CASE WHEN trusted_domain_numeric THEN p_remaining_units ELSE NULL END,clock_timestamp()+make_interval(secs=>seconds),clock_timestamp()+make_interval(secs=>policy.probe_eligibility_seconds))
    ON CONFLICT (quota_domain_id,route_id,incident_key) DO UPDATE SET
      numeric_remaining_units=CASE WHEN EXCLUDED.numeric_remaining_units IS NULL THEN bridge.provider_operational_pressure_incident.numeric_remaining_units WHEN bridge.provider_operational_pressure_incident.numeric_remaining_units IS NULL THEN EXCLUDED.numeric_remaining_units ELSE LEAST(bridge.provider_operational_pressure_incident.numeric_remaining_units,EXCLUDED.numeric_remaining_units) END,
      updated_at=clock_timestamp() WHERE bridge.provider_operational_pressure_incident.recovered_at IS NULL
    RETURNING incident_id INTO created;
  IF created IS NULL THEN SELECT i.incident_id INTO created FROM bridge.provider_operational_pressure_incident i WHERE i.quota_domain_id=p_quota_domain_id AND i.route_id IS NOT DISTINCT FROM CASE WHEN p_scope_kind='domain' THEN NULL ELSE p_route_id END AND i.incident_key=v_incident_key; END IF;
  RETURN created;
END;
$$;

ALTER FUNCTION bridge.record_provider_429_pressure(text,text,text,numeric,text,text,text,text,numeric) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.record_provider_429_pressure(text,text,text,numeric,text,text,text,text,numeric) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.record_provider_429_pressure(text,text,text,numeric,text,text,text,text,numeric) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0058_bssv200603a_pressure_signature_convergence') ON CONFLICT DO NOTHING;
