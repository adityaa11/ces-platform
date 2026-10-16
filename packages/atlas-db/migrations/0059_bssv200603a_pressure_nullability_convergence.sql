-- The pre-final 0049 table required a configured policy even for the
-- deliberate fail-closed no-policy case.  Match the approved 03A-03 shape so
-- that missing policy remains a durable route hold rather than a write error.
ALTER TABLE bridge.provider_operational_pressure_incident
  ALTER COLUMN safety_policy_id DROP NOT NULL,
  ALTER COLUMN safety_policy_version DROP NOT NULL,
  ALTER COLUMN probe_eligibility_deadline DROP NOT NULL;

INSERT INTO atlas.schema_migrations(name) VALUES('0059_bssv200603a_pressure_nullability_convergence') ON CONFLICT DO NOTHING;
