-- BSS-V2-006-03A-03: Bridge-owned pressure facts.  This migration deliberately
-- excludes wakeups, plan publication, and replan intents (03A-04 ownership).
CREATE TABLE IF NOT EXISTS bridge.runtime_pressure_safety_policy (
  policy_id text NOT NULL CHECK (length(trim(policy_id)) > 0),
  version text NOT NULL CHECK (length(trim(version)) > 0),
  quota_domain_id text NOT NULL CHECK (length(trim(quota_domain_id)) > 0),
  route_id text,
  maximum_accepted_retry_after_seconds integer NOT NULL CHECK (maximum_accepted_retry_after_seconds > 0),
  metadata_free_cooldown_seconds integer NOT NULL CHECK (metadata_free_cooldown_seconds > 0),
  probe_eligibility_seconds integer NOT NULL CHECK (probe_eligibility_seconds > 0),
  active boolean NOT NULL DEFAULT true,
  configured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (policy_id, version),
  UNIQUE NULLS NOT DISTINCT (quota_domain_id, route_id, active) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE IF NOT EXISTS bridge.provider_operational_pressure_incident (
  incident_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quota_domain_id text NOT NULL,
  route_id text,
  incident_key text NOT NULL CHECK (length(trim(incident_key)) > 0),
  safety_policy_id text,
  safety_policy_version text,
  policy_available boolean NOT NULL,
  scope_kind text NOT NULL CHECK (scope_kind IN ('domain','route')),
  dimension_id text CHECK (dimension_id IN ('rpm','tpm','rpd','concurrency')),
  window_identity text,
  numeric_remaining_units numeric CHECK (numeric_remaining_units IS NULL OR numeric_remaining_units >= 0),
  cooldown_until timestamptz NOT NULL,
  probe_eligibility_deadline timestamptz,
  probe_claimed_at timestamptz,
  recovered_at timestamptz,
  recovery_feedback_id text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (quota_domain_id, route_id, incident_key),
  FOREIGN KEY (safety_policy_id, safety_policy_version) REFERENCES bridge.runtime_pressure_safety_policy(policy_id, version) ON DELETE RESTRICT,
  CHECK ((policy_available AND safety_policy_id IS NOT NULL AND safety_policy_version IS NOT NULL) OR (NOT policy_available AND safety_policy_id IS NULL AND safety_policy_version IS NULL)),
  CHECK ((scope_kind = 'domain' AND route_id IS NULL) OR (scope_kind = 'route' AND route_id IS NOT NULL)),
  CHECK ((policy_available AND probe_eligibility_deadline IS NOT NULL) OR (NOT policy_available AND probe_eligibility_deadline IS NULL))
);

CREATE OR REPLACE FUNCTION bridge.provider_pressure_blocks_admission(p_quota_domain_id text, p_route_id text, p_for_probe boolean DEFAULT false)
RETURNS boolean LANGUAGE sql AS $$
  SELECT EXISTS (SELECT 1 FROM bridge.provider_operational_pressure_incident i
    WHERE i.quota_domain_id=p_quota_domain_id AND (i.scope_kind='domain' OR i.route_id=p_route_id)
      AND i.recovered_at IS NULL AND (clock_timestamp()<i.cooldown_until OR NOT p_for_probe OR NOT i.policy_available OR i.probe_claimed_at IS NOT NULL OR clock_timestamp()>i.probe_eligibility_deadline))
$$;

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

CREATE OR REPLACE FUNCTION bridge.claim_provider_pressure_probe(p_quota_domain_id text, p_route_id text)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE v_incident_id uuid;
BEGIN
  SELECT i.incident_id INTO v_incident_id FROM bridge.provider_operational_pressure_incident i WHERE i.quota_domain_id=p_quota_domain_id AND (i.scope_kind='domain' OR i.route_id=p_route_id) AND i.recovered_at IS NULL AND i.policy_available AND i.cooldown_until<=clock_timestamp() AND i.probe_eligibility_deadline>=clock_timestamp() AND i.probe_claimed_at IS NULL ORDER BY i.created_at FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE bridge.provider_operational_pressure_incident SET probe_claimed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE incident_id=v_incident_id AND probe_claimed_at IS NULL;
  RETURN FOUND;
END;
$$;

ALTER TABLE bridge.runtime_pressure_safety_policy OWNER TO agents_bridge;
ALTER TABLE bridge.provider_operational_pressure_incident OWNER TO agents_bridge;
ALTER FUNCTION bridge.provider_pressure_blocks_admission(text,text,boolean) OWNER TO agents_bridge;
ALTER FUNCTION bridge.record_provider_429_pressure(text,text,text,numeric,text,text,text,text,numeric) OWNER TO agents_bridge;
ALTER FUNCTION bridge.claim_provider_pressure_probe(text,text) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.runtime_pressure_safety_policy,bridge.provider_operational_pressure_incident FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.provider_pressure_blocks_admission(text,text,boolean),bridge.record_provider_429_pressure(text,text,text,numeric,text,text,text,text,numeric),bridge.claim_provider_pressure_probe(text,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.provider_pressure_blocks_admission(text,text,boolean),bridge.record_provider_429_pressure(text,text,text,numeric,text,text,text,text,numeric),bridge.claim_provider_pressure_probe(text,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0049_bssv200603a_pressure_wakeup_convergence') ON CONFLICT DO NOTHING;
