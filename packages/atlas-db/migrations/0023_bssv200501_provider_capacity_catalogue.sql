-- BSS-V2-005-01: capacity planning is Bridge operational state, not Atlas truth.
CREATE TABLE IF NOT EXISTS bridge.provider_capacity_profile (
  quota_domain_id text NOT NULL CHECK (length(trim(quota_domain_id)) > 0),
  profile_version text NOT NULL CHECK (length(trim(profile_version)) > 0),
  provider_account_alias text NOT NULL CHECK (length(trim(provider_account_alias)) > 0),
  associated_routes jsonb NOT NULL CHECK (jsonb_typeof(associated_routes) = 'array' AND jsonb_array_length(associated_routes) > 0),
  limits jsonb NOT NULL CHECK (jsonb_typeof(limits) = 'object'),
  window_policies jsonb NOT NULL CHECK (jsonb_typeof(window_policies) = 'object'),
  quota_accounting_policy_id text NOT NULL CHECK (length(trim(quota_accounting_policy_id)) > 0),
  capacity_source text NOT NULL CHECK (capacity_source IN ('provider_api', 'provider_docs', 'operator_config', 'qualified_observation')),
  source_ref text NOT NULL CHECK (length(trim(source_ref)) > 0),
  source_version text NOT NULL CHECK (length(trim(source_version)) > 0),
  observed_at timestamptz NOT NULL,
  effective_from timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quota_domain_id, profile_version)
);

CREATE OR REPLACE FUNCTION bridge.reject_provider_capacity_profile_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'bridge.provider_capacity_profile is immutable; publish a new profile_version';
END;
$$;

DROP TRIGGER IF EXISTS provider_capacity_profile_immutable ON bridge.provider_capacity_profile;
CREATE TRIGGER provider_capacity_profile_immutable BEFORE UPDATE OR DELETE ON bridge.provider_capacity_profile
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_provider_capacity_profile_mutation();

ALTER TABLE bridge.provider_capacity_profile OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_capacity_profile FROM PUBLIC, atlas_app;
INSERT INTO atlas.schema_migrations (name) VALUES ('0023_bssv200501_provider_capacity_catalogue') ON CONFLICT DO NOTHING;
