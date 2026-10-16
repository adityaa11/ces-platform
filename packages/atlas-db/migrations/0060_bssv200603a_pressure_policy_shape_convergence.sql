-- A pre-final local policy table carried an unrelated mandatory disposition
-- column.  The finalized 03A-03 policy is fail-closed by its own persisted
-- fields and has no such input, so preserve legacy values while allowing the
-- registered policy insert shape.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'bridge'
      AND table_name = 'runtime_pressure_safety_policy'
      AND column_name = 'blocked_disposition'
  ) THEN
    ALTER TABLE bridge.runtime_pressure_safety_policy
      ALTER COLUMN blocked_disposition DROP NOT NULL;
  END IF;
END;
$$;

INSERT INTO atlas.schema_migrations(name) VALUES('0060_bssv200603a_pressure_policy_shape_convergence') ON CONFLICT DO NOTHING;
