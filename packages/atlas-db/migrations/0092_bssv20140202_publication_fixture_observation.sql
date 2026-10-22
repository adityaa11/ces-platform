-- The existing Bridge-owned plan tables are observable by the publication
-- harness.  These immutable successor records need the same narrowly scoped
-- read capability; mutation remains owner-only and no application role gains
-- table access.
GRANT SELECT ON bridge.calculated_class_process_allocation,
  bridge.desired_admission_profile_route_binding_v2,
  bridge.desired_admission_profile_candidate TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0092_bssv20140202_publication_fixture_observation') ON CONFLICT DO NOTHING;
