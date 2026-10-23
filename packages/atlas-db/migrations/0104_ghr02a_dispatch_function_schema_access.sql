-- GHR-02A follow-up: schema usage is required to invoke the intentionally
-- narrow read function; it grants no table or write privilege.
GRANT USAGE ON SCHEMA atlas TO agents_bridge;
REVOKE ALL ON TABLE atlas.generic_handoff_route_policy, atlas.generic_handoff_intent FROM agents_bridge;
GRANT EXECUTE ON FUNCTION atlas.read_generic_handoff_dispatch_v1(text) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0104_ghr02a_dispatch_function_schema_access') ON CONFLICT DO NOTHING;
