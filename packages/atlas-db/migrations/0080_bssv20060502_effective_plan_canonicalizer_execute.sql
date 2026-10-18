-- The canonicalizing public function invokes its immutable v1 implementation
-- as the Bridge role; retain that role-only internal execution grant.
GRANT EXECUTE ON FUNCTION bridge.publish_effective_policy_converged_desired_admission_profile_v1(text,bigint,text,text,text,timestamptz,jsonb,jsonb) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0080_bssv20060502_effective_plan_canonicalizer_execute') ON CONFLICT DO NOTHING;
