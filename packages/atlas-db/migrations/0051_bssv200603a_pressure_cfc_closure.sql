-- CFC closure for BSS-V2-006-03A-03: domain-qualified pressure is a numeric
-- admission clamp, while only ambiguous route pressure is a direct route hold.
-- Domain identities include a NULL route ID, so stabilize legacy rows before
-- enforcing NULL-aware uniqueness for the canonical incident owner.
WITH duplicate_groups AS (
  SELECT quota_domain_id, route_id, incident_key,
    (array_agg(incident_id ORDER BY incident_id::text))[1] AS canonical_incident_id,
    array_agg(incident_id) AS incident_ids,
    min(numeric_remaining_units) FILTER (WHERE numeric_remaining_units IS NOT NULL) AS lowest_remaining_units,
    max(cooldown_until) AS latest_cooldown_until,
    max(probe_eligibility_deadline) AS latest_probe_eligibility_deadline,
    min(probe_claimed_at) FILTER (WHERE probe_claimed_at IS NOT NULL) AS first_probe_claimed_at,
    bool_and(recovered_at IS NOT NULL) AS all_recovered,
    min(recovered_at) FILTER (WHERE recovered_at IS NOT NULL) AS first_recovered_at,
    min(recovery_feedback_id) FILTER (WHERE recovery_feedback_id IS NOT NULL) AS recovery_feedback_id,
    max(updated_at) AS latest_updated_at
  FROM bridge.provider_operational_pressure_incident
  GROUP BY quota_domain_id, route_id, incident_key
  HAVING count(*) > 1
), consolidated AS (
  UPDATE bridge.provider_operational_pressure_incident incident
  SET numeric_remaining_units = groups.lowest_remaining_units,
    cooldown_until = groups.latest_cooldown_until,
    probe_eligibility_deadline = groups.latest_probe_eligibility_deadline,
    probe_claimed_at = groups.first_probe_claimed_at,
    recovered_at = CASE WHEN groups.all_recovered THEN groups.first_recovered_at ELSE NULL END,
    recovery_feedback_id = CASE WHEN groups.all_recovered THEN groups.recovery_feedback_id ELSE NULL END,
    updated_at = groups.latest_updated_at
  FROM duplicate_groups groups
  WHERE incident.incident_id = groups.canonical_incident_id
)
DELETE FROM bridge.provider_operational_pressure_incident incident
USING duplicate_groups groups
WHERE incident.incident_id = ANY(groups.incident_ids)
  AND incident.incident_id <> groups.canonical_incident_id;

ALTER TABLE bridge.provider_operational_pressure_incident
  ADD CONSTRAINT provider_operational_pressure_incident_stable_identity_key
  UNIQUE NULLS NOT DISTINCT (quota_domain_id, route_id, incident_key);

CREATE OR REPLACE FUNCTION bridge.provider_pressure_blocks_admission(p_quota_domain_id text, p_route_id text, p_for_probe boolean DEFAULT false)
RETURNS boolean LANGUAGE sql AS $$
  SELECT EXISTS (SELECT 1 FROM bridge.provider_operational_pressure_incident i
    WHERE i.quota_domain_id=p_quota_domain_id AND i.scope_kind='route' AND i.route_id=p_route_id
      AND i.recovered_at IS NULL AND (clock_timestamp()<i.cooldown_until OR NOT p_for_probe OR NOT i.policy_available OR i.probe_claimed_at IS NOT NULL OR clock_timestamp()>i.probe_eligibility_deadline))
$$;

ALTER FUNCTION bridge.provider_pressure_blocks_admission(text,text,boolean) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.provider_pressure_blocks_admission(text,text,boolean) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.provider_pressure_blocks_admission(text,text,boolean) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0051_bssv200603a_pressure_cfc_closure') ON CONFLICT DO NOTHING;
