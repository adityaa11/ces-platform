-- BSS-V2-006-01 CK-002.a/CK-003.b: policy-derived window transitions and restart-safe fences.
CREATE OR REPLACE FUNCTION bridge.advance_provider_quota_window_state(
  p_quota_domain_id text, p_dimension_id text, p_observed_at timestamptz DEFAULT now()
) RETURNS bridge.provider_quota_window_state LANGUAGE plpgsql AS $$
DECLARE active record; policy jsonb; current_state bridge.provider_quota_window_state;
  kind text; window_seconds numeric; limit_units numeric; refill_units numeric; refill_seconds numeric;
  next_state jsonb; next_reset_at timestamptz; window_start timestamptz; elapsed_steps bigint;
  event_value jsonb; retained_events jsonb := '[]'::jsonb; retained_count integer := 0;
BEGIN
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'active desired admission profile is required'; END IF;
  SELECT window_policies -> p_dimension_id INTO policy FROM bridge.provider_capacity_profile
    WHERE quota_domain_id=p_quota_domain_id AND profile_version=active.provider_capacity_profile_version;
  kind := policy ->> 'kind';
  IF policy IS NULL OR jsonb_typeof(policy) <> 'object' OR kind NOT IN ('fixed', 'fixed_window', 'rolling', 'refill') THEN
    RAISE EXCEPTION 'provider quota window policy is missing or has unknown reset semantics';
  END IF;
  SELECT * INTO current_state FROM bridge.provider_quota_window_state
    WHERE quota_domain_id=p_quota_domain_id AND desired_profile_version=active.desired_profile_version
      AND activation_revision=active.activation_revision AND dimension_id=p_dimension_id FOR UPDATE;

  IF kind IN ('fixed', 'fixed_window') THEN
    window_seconds := (policy ->> 'windowSeconds')::numeric; limit_units := (policy ->> 'limitUnits')::numeric;
    IF window_seconds IS NULL OR window_seconds <= 0 OR limit_units IS NULL OR limit_units < 0 THEN RAISE EXCEPTION 'fixed window policy is incomplete'; END IF;
    window_start := to_timestamp(floor(extract(epoch FROM p_observed_at) / window_seconds) * window_seconds);
    next_reset_at := window_start + make_interval(secs => window_seconds::double precision);
    IF NOT FOUND OR current_state.reset_at IS NULL OR current_state.reset_at <= p_observed_at THEN
      next_state := jsonb_build_object('remaining', limit_units, 'windowStartedAt', window_start);
    ELSE
      next_state := current_state.window_state;
      next_reset_at := current_state.reset_at;
    END IF;
  ELSIF kind = 'rolling' THEN
    window_seconds := (policy ->> 'windowSeconds')::numeric; limit_units := (policy ->> 'limitUnits')::numeric;
    IF window_seconds IS NULL OR window_seconds <= 0 OR limit_units IS NULL OR limit_units < 0 THEN RAISE EXCEPTION 'rolling window policy is incomplete'; END IF;
    IF FOUND AND jsonb_typeof(COALESCE(current_state.window_state -> 'requestStartedAt', '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'rolling window state is invalid'; END IF;
    FOR event_value IN SELECT value FROM jsonb_array_elements(COALESCE(current_state.window_state -> 'requestStartedAt', '[]'::jsonb)) LOOP
      IF jsonb_typeof(event_value) <> 'string' THEN RAISE EXCEPTION 'rolling window state is invalid'; END IF;
      BEGIN
        IF trim(both '"' FROM event_value::text)::timestamptz > p_observed_at - make_interval(secs => window_seconds::double precision) THEN
          retained_events := retained_events || jsonb_build_array(event_value); retained_count := retained_count + 1;
        END IF;
      EXCEPTION WHEN others THEN RAISE EXCEPTION 'rolling window state is invalid'; END;
    END LOOP;
    next_state := jsonb_build_object('requestStartedAt', retained_events, 'remaining', GREATEST(0, limit_units - retained_count));
    next_reset_at := p_observed_at + make_interval(secs => window_seconds::double precision);
  ELSE
    limit_units := (policy ->> 'limitUnits')::numeric; refill_units := (policy ->> 'refillUnits')::numeric; refill_seconds := (policy ->> 'refillIntervalSeconds')::numeric;
    IF limit_units IS NULL OR limit_units < 0 OR refill_units IS NULL OR refill_units < 0 OR refill_seconds IS NULL OR refill_seconds <= 0 THEN RAISE EXCEPTION 'refill window policy is incomplete'; END IF;
    IF NOT FOUND THEN
      next_state := jsonb_build_object('remaining', limit_units); next_reset_at := p_observed_at + make_interval(secs => refill_seconds::double precision);
    ELSIF NOT current_state.reset_semantics_known OR current_state.reset_at IS NULL OR jsonb_typeof(current_state.window_state -> 'remaining') <> 'number' THEN
      RAISE EXCEPTION 'refill window state is missing known reset semantics';
    ELSE
      elapsed_steps := GREATEST(0, floor(extract(epoch FROM p_observed_at - current_state.reset_at) / refill_seconds)::bigint + 1);
      next_state := jsonb_build_object('remaining', LEAST(limit_units, (current_state.window_state ->> 'remaining')::numeric + elapsed_steps * refill_units));
      next_reset_at := current_state.reset_at + make_interval(secs => (elapsed_steps * refill_seconds)::double precision);
    END IF;
  END IF;
  RETURN bridge.put_provider_quota_window_state(p_quota_domain_id,p_dimension_id,next_state,true,next_reset_at);
END;
$$;
ALTER FUNCTION bridge.advance_provider_quota_window_state(text,text,timestamptz) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.advance_provider_quota_window_state(text,text,timestamptz) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.advance_provider_quota_window_state(text,text,timestamptz) TO agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0033_bssv200601_window_transition_and_restart_fence') ON CONFLICT DO NOTHING;
