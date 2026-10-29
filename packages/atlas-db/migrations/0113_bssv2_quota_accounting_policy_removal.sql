-- BSS-QAP-003 R3: the R1 nullable compatibility interval and R2 writer
-- cutover are complete.  Remove only the obsolete physical metadata.
BEGIN;

ALTER TABLE bridge.provider_capacity_profile
  DROP COLUMN quota_accounting_policy_id;
ALTER TABLE bridge.workload_envelope_profile
  DROP COLUMN quota_accounting_policy_id;

INSERT INTO atlas.schema_migrations(name)
  VALUES ('0113_bssv2_quota_accounting_policy_removal')
  ON CONFLICT DO NOTHING;

COMMIT;
