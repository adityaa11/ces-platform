-- BSS-V2-005-02: immutable Bridge-owned operational process/workload references.
CREATE TABLE IF NOT EXISTS bridge.provider_process_profile (
  process_id text NOT NULL CHECK (length(trim(process_id)) > 0),
  profile_version text NOT NULL CHECK (length(trim(profile_version)) > 0),
  process_kind text NOT NULL CHECK (process_kind IN ('semantic', 'reconciliation', 'chat', 'ces', 'addendum')),
  capability text NOT NULL CHECK (length(trim(capability)) > 0),
  service_class text NOT NULL CHECK (service_class IN ('interactive', 'background')),
  fairness_scope jsonb NOT NULL CHECK (jsonb_typeof(fairness_scope) = 'object'),
  allocation_policy jsonb NOT NULL CHECK (jsonb_typeof(allocation_policy) = 'object'),
  active boolean NOT NULL,
  eligible_route_ids jsonb NOT NULL CHECK (jsonb_typeof(eligible_route_ids) = 'array'),
  workload_id text NOT NULL CHECK (length(trim(workload_id)) > 0),
  workload_profile_version text NOT NULL CHECK (length(trim(workload_profile_version)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (process_id, profile_version)
);

CREATE TABLE IF NOT EXISTS bridge.workload_envelope_profile (
  workload_id text NOT NULL CHECK (length(trim(workload_id)) > 0),
  profile_version text NOT NULL CHECK (length(trim(profile_version)) > 0),
  active boolean NOT NULL,
  compatible_process_kinds jsonb NOT NULL CHECK (jsonb_typeof(compatible_process_kinds) = 'array' AND jsonb_array_length(compatible_process_kinds) > 0),
  structural_bound jsonb NOT NULL CHECK (jsonb_typeof(structural_bound) = 'object'),
  estimator jsonb NOT NULL CHECK (jsonb_typeof(estimator) = 'object'),
  quota_accounting_policy_id text NOT NULL CHECK (length(trim(quota_accounting_policy_id)) > 0),
  output_reservation jsonb NOT NULL CHECK (jsonb_typeof(output_reservation) = 'object'),
  safety_policy jsonb NOT NULL CHECK (jsonb_typeof(safety_policy) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workload_id, profile_version)
);

CREATE OR REPLACE FUNCTION bridge.reject_process_workload_profile_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'bridge process/workload profiles are immutable; publish a new profile_version';
END;
$$;

DROP TRIGGER IF EXISTS provider_process_profile_immutable ON bridge.provider_process_profile;
CREATE TRIGGER provider_process_profile_immutable BEFORE UPDATE OR DELETE ON bridge.provider_process_profile
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_process_workload_profile_mutation();
DROP TRIGGER IF EXISTS workload_envelope_profile_immutable ON bridge.workload_envelope_profile;
CREATE TRIGGER workload_envelope_profile_immutable BEFORE UPDATE OR DELETE ON bridge.workload_envelope_profile
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_process_workload_profile_mutation();

ALTER TABLE bridge.provider_process_profile OWNER TO agents_bridge;
ALTER TABLE bridge.workload_envelope_profile OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_process_profile, bridge.workload_envelope_profile FROM PUBLIC, atlas_app;
INSERT INTO atlas.schema_migrations (name) VALUES ('0028_bssv200502_process_workload_catalogue') ON CONFLICT DO NOTHING;
