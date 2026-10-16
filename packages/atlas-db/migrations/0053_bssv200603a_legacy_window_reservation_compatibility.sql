-- Physical-window rows belong only to route-bound 03A attempts.  Preserve
-- the approved predecessor's reservation-only path; it is still unclaimable
-- by the 03A transport worker without a route binding.
CREATE OR REPLACE FUNCTION bridge.reserve_provider_operational_windows(p_reservation_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE reservation bridge.provider_work_reservation; work bridge.provider_work_attempt;
  binding bridge.provider_work_route_binding; active record; capacity bridge.provider_capacity_profile;
  dimension text; policy jsonb; seconds numeric; starts_at timestamptz; ends_at timestamptz; identity text; held numeric;
BEGIN
  SELECT * INTO reservation FROM bridge.provider_work_reservation WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation is missing'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=reservation.logical_work_id AND attempt_number=reservation.attempt_number;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(work.quota_domain_id);
  IF NOT FOUND OR active.desired_profile_version<>work.desired_profile_version OR active.activation_revision<>work.activation_revision THEN RAISE EXCEPTION 'provider reservation is not attributable to the active desired admission revision'; END IF;
  SELECT * INTO capacity FROM bridge.provider_capacity_profile WHERE quota_domain_id=work.quota_domain_id AND profile_version=binding.provider_capacity_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider reservation capacity policy is missing'; END IF;
  FOR dimension IN SELECT unnest(ARRAY['rpm','tpm','rpd','concurrency']) LOOP
    policy:=capacity.window_policies->dimension;
    IF jsonb_typeof(policy)<>'object' OR policy->>'kind'<>'fixed' OR jsonb_typeof(policy->'windowSeconds')<>'number' THEN RAISE EXCEPTION 'provider window policy is not a qualified fixed boundary for %',dimension; END IF;
    seconds:=(policy->>'windowSeconds')::numeric;
    IF seconds<=0 OR seconds<>trunc(seconds) THEN RAISE EXCEPTION 'provider window policy has an invalid fixed boundary'; END IF;
    starts_at:=to_timestamp(floor(extract(epoch FROM clock_timestamp())/seconds)*seconds); ends_at:=starts_at+make_interval(secs=>seconds::integer);
    identity:=work.quota_domain_id||':'||dimension||':'||md5(policy::text)||':'||extract(epoch FROM starts_at)::bigint;
    held:=COALESCE((reservation.request_resource_envelope->>dimension)::numeric,0);
    INSERT INTO bridge.provider_window_usage_ledger(reservation_id,quota_domain_id,provider_capacity_profile_version,dimension_id,window_identity,window_starts_at,window_ends_at,window_policy,held_units,spent_units,deficit_units,state)
      VALUES(reservation.reservation_id,work.quota_domain_id,binding.provider_capacity_profile_version,dimension,identity,starts_at,ends_at,policy,held,0,0,'held_unknown') ON CONFLICT(reservation_id,dimension_id,window_identity) DO NOTHING;
  END LOOP;
END;
$$;
ALTER FUNCTION bridge.reserve_provider_operational_windows(uuid) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.reserve_provider_operational_windows(uuid) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.reserve_provider_operational_windows(uuid) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0053_bssv200603a_legacy_window_reservation_compatibility') ON CONFLICT DO NOTHING;
