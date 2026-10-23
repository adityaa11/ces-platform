import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("GHR-03B keeps Atlas issuance read-only and confines delivery state to Bridge", async () => {
  const migration = await readFile(new URL("../migrations/0105_ghr03b_bridge_delivery.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE bridge\.generic_handoff_delivery/);
  assert.match(migration, /ALTER TABLE bridge\.generic_handoff_delivery OWNER TO agents_bridge/);
  assert.match(migration, /REVOKE ALL ON TABLE bridge\.generic_handoff_delivery FROM PUBLIC, atlas_app/);
  assert.match(migration, /is_generic_handoff_dispatch_policy_active_v1/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION atlas\.is_generic_handoff_dispatch_policy_active_v1\(jsonb\) TO agents_bridge/);
  assert.doesNotMatch(migration, /GRANT .*generic_handoff_(intent|route_policy).*TO agents_bridge/);
  assert.doesNotMatch(migration, /INSERT INTO atlas\.generic_handoff_(intent|route_policy)/);
});
