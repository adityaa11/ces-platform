-- BSS-V2-006-01 CK-001.b: retain numeric resource metadata while rejecting content/secrets.
CREATE OR REPLACE FUNCTION bridge.provider_work_metadata_is_safe(p_value jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(p_value) = 'object'
    AND p_value::text !~* '"[^"\\]*(prompt|source|question|authorization|credential|secret|connection)[^"\\]*"[[:space:]]*:';
$$;
ALTER FUNCTION bridge.provider_work_metadata_is_safe(jsonb) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.provider_work_metadata_is_safe(jsonb) FROM PUBLIC, atlas_app;
INSERT INTO atlas.schema_migrations (name) VALUES ('0032_bssv200601_redaction_metadata_fix') ON CONFLICT DO NOTHING;
