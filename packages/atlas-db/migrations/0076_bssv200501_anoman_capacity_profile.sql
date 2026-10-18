-- Canonical current Anoman account limits supplied from the provider dashboard.
-- The dashboard does not publish a daily quota, so rpd remains unknown.
ALTER TABLE bridge.provider_capacity_profile
  ADD COLUMN IF NOT EXISTS active_key_count integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'bridge.provider_capacity_profile'::regclass
      AND conname = 'provider_capacity_profile_active_key_count_positive'
  ) THEN
    ALTER TABLE bridge.provider_capacity_profile
      ADD CONSTRAINT provider_capacity_profile_active_key_count_positive CHECK (active_key_count > 0);
  END IF;
END;
$$;

INSERT INTO bridge.provider_capacity_profile (
  quota_domain_id,
  profile_version,
  provider_account_alias,
  active_key_count,
  associated_routes,
  limits,
  window_policies,
  quota_accounting_policy_id,
  capacity_source,
  source_ref,
  source_version,
  observed_at,
  effective_from
)
VALUES (
  'anoman-shared-prod',
  '2026-10-18.1',
  'anoman-atlas-free-account',
  1,
  '[{"routeId":"anoman-semantic","providerId":"anoman"}]'::jsonb,
  '{"rpm":{"state":"known","value":20},"tpm":{"state":"known","value":40000},"rpd":{"state":"unknown"},"concurrency":{"state":"known","value":25}}'::jsonb,
  '{"rpm":{"policyId":"anoman-rpm-v1","policyVersion":"v1","source":"provider_api","kind":"fixed_window","parameters":{"windowSeconds":60}},"tpm":{"policyId":"anoman-tpm-v1","policyVersion":"v1","source":"provider_api","kind":"fixed_window","parameters":{"windowSeconds":60}},"rpd":{"policyId":"anoman-rpd-unknown-v1","policyVersion":"v1","source":"provider_api","kind":"unknown"}}'::jsonb,
  'anoman-quota-tokens-v1',
  'provider_api',
  'provider-dashboard://anoman/account/limits',
  '2026-10-18',
  '2026-10-18T00:00:00Z',
  '2026-10-18T00:00:00Z'
)
ON CONFLICT (quota_domain_id, profile_version) DO NOTHING;

INSERT INTO atlas.schema_migrations (name)
VALUES ('0076_bssv200501_anoman_capacity_profile')
ON CONFLICT DO NOTHING;
