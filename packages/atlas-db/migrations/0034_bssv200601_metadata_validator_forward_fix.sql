-- BSS-V2-006-01 CK-001.b: forward-only correction for installations that recorded 0032.
CREATE OR REPLACE FUNCTION bridge.provider_work_metadata_is_safe(p_value jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE metadata_key text; metadata_value jsonb;
BEGIN
  IF jsonb_typeof(p_value) <> 'object' THEN RETURN false; END IF;
  FOR metadata_key, metadata_value IN SELECT key, value FROM jsonb_each(p_value) LOOP
    IF metadata_key ~* '(prompt|source|question|authorization|credential|secret|connection)' THEN RETURN false; END IF;
    IF jsonb_typeof(metadata_value) = 'object' THEN
      IF NOT bridge.provider_work_metadata_is_safe(metadata_value) THEN RETURN false; END IF;
    ELSIF jsonb_typeof(metadata_value) NOT IN ('number', 'boolean', 'null') THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$$;
ALTER FUNCTION bridge.provider_work_metadata_is_safe(jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.provider_work_metadata_is_safe(jsonb) FROM PUBLIC, atlas_app;
INSERT INTO atlas.schema_migrations (name) VALUES ('0034_bssv200601_metadata_validator_forward_fix') ON CONFLICT DO NOTHING;
