-- BSS-V2-014-04-01: a read-derived per-process view of the existing physical
-- reservation/window ledger.  This is deliberately not a second ledger: it
-- has no table, trigger, writer, counter, or lifecycle of its own.

CREATE OR REPLACE FUNCTION bridge.read_process_capacity_window_usage_v1(
  p_quota_domain_id text
) RETURNS TABLE(
  api_version text,
  reservation_id uuid,
  quota_domain_id text,
  desired_profile_version text,
  activation_revision bigint,
  process_id text,
  process_profile_version text,
  provider_capacity_profile_version text,
  dimension_id text,
  window_identity text,
  window_starts_at timestamptz,
  window_ends_at timestamptz,
  window_is_open boolean,
  held_units numeric,
  spent_units numeric,
  deficit_units numeric,
  state text
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  IF length(trim(COALESCE(p_quota_domain_id, ''))) = 0 THEN
    RAISE EXCEPTION 'process capacity window usage requires a quota domain identity';
  END IF;

  -- Fail closed instead of silently emitting a partial per-process projection
  -- if authoritative rows no longer form the same reservation/route/plan
  -- identity that owns the physical liability.
  IF EXISTS (
    SELECT 1
    FROM bridge.provider_window_usage_ledger ledger
    LEFT JOIN bridge.provider_work_reservation reservation
      ON reservation.reservation_id = ledger.reservation_id
    LEFT JOIN bridge.provider_work_attempt work
      ON work.logical_work_id = reservation.logical_work_id
     AND work.attempt_number = reservation.attempt_number
    LEFT JOIN bridge.provider_work_route_binding binding
      ON binding.logical_work_id = work.logical_work_id
     AND binding.attempt_number = work.attempt_number
    LEFT JOIN bridge.desired_admission_profile plan
      ON plan.quota_domain_id = work.quota_domain_id
     AND plan.profile_version = reservation.desired_profile_version
    LEFT JOIN bridge.provider_process_profile process
      ON process.process_id = work.process_id
     AND process.profile_version = work.process_profile_version
    WHERE ledger.quota_domain_id = p_quota_domain_id
      AND (
        reservation.reservation_id IS NULL
        OR work.logical_work_id IS NULL
        OR binding.logical_work_id IS NULL
        OR plan.quota_domain_id IS NULL
        OR process.process_id IS NULL
        OR ledger.quota_domain_id <> work.quota_domain_id
        OR reservation.desired_profile_version <> work.desired_profile_version
        OR reservation.activation_revision <> work.activation_revision
        OR ledger.provider_capacity_profile_version <> binding.provider_capacity_profile_version
      )
  ) THEN
    RAISE EXCEPTION 'process capacity window usage has a missing, stale, or foreign authoritative identity';
  END IF;

  -- The physical ledger primary key is the projection identity as well.  Keep
  -- the guard explicit so a future DDL change cannot make duplicate projection
  -- rows appear silently.
  IF EXISTS (
    SELECT 1
    FROM bridge.provider_window_usage_ledger ledger
    WHERE ledger.quota_domain_id = p_quota_domain_id
    GROUP BY ledger.reservation_id, ledger.dimension_id, ledger.window_identity
    HAVING count(*) <> 1
  ) THEN
    RAISE EXCEPTION 'process capacity window usage has a duplicate projection identity';
  END IF;

  RETURN QUERY
  SELECT
    'ProcessCapacityWindowUsage/v1'::text,
    ledger.reservation_id,
    ledger.quota_domain_id,
    reservation.desired_profile_version,
    reservation.activation_revision,
    work.process_id,
    work.process_profile_version,
    ledger.provider_capacity_profile_version,
    ledger.dimension_id,
    ledger.window_identity,
    ledger.window_starts_at,
    ledger.window_ends_at,
    ledger.window_ends_at > clock_timestamp(),
    ledger.held_units,
    ledger.spent_units,
    ledger.deficit_units,
    ledger.state
  FROM bridge.provider_window_usage_ledger ledger
  JOIN bridge.provider_work_reservation reservation
    ON reservation.reservation_id = ledger.reservation_id
  JOIN bridge.provider_work_attempt work
    ON work.logical_work_id = reservation.logical_work_id
   AND work.attempt_number = reservation.attempt_number
  WHERE ledger.quota_domain_id = p_quota_domain_id
  ORDER BY ledger.window_ends_at, ledger.reservation_id, ledger.dimension_id;
END;
$$;

ALTER FUNCTION bridge.read_process_capacity_window_usage_v1(text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.read_process_capacity_window_usage_v1(text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.read_process_capacity_window_usage_v1(text) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name)
VALUES ('0098_bssv20140401_process_capacity_window_usage_projection')
ON CONFLICT DO NOTHING;
