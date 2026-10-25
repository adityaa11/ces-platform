import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("AA-001 bootstrap state is a singleton, secret-free Atlas boundary", { skip }, async () => {
  const admin = postgres(databaseUrl, { max: 1 });
  const appUrl = new URL(databaseUrl);
  appUrl.username = "atlas_app";
  appUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlasApp = postgres(appUrl.toString(), { max: 1 });
  const bridgeUrl = new URL(databaseUrl);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });

  try {
    const columns = await admin`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'atlas' AND table_name = 'admin_bootstrap_state'
      ORDER BY ordinal_position
    `;
    assert.deepEqual(columns.map(({ column_name }) => column_name), [
      "bootstrap_key", "state", "attempt_id", "attempt_email", "initial_user_id", "reserved_at", "sealed_at",
    ]);

    const [marker] = await admin`
      SELECT bootstrap_key, state, attempt_id, attempt_email, initial_user_id, reserved_at, sealed_at
      FROM atlas.admin_bootstrap_state
      WHERE bootstrap_key = 'atlas-platform-super-admin'
    `;
    assert.ok(marker, "the durable singleton bootstrap marker exists");

    const constraints = await admin`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'atlas.admin_bootstrap_state'::regclass
    `;
    const names = new Set(constraints.map(({ conname }) => conname));
    assert.ok(names.has("admin_bootstrap_state_pkey"));
    assert.ok(names.has("admin_bootstrap_state_shape_check"));
    assert.ok(names.has("admin_bootstrap_state_initial_user_id_fkey"));

    const triggers = await admin`
      SELECT tgname
      FROM pg_trigger
      WHERE tgrelid = 'atlas.admin_bootstrap_state'::regclass AND NOT tgisinternal
    `;
    assert.deepEqual(triggers.map(({ tgname }) => tgname), ["admin_bootstrap_state_transition_guard"]);
    const [{ definition }] = await admin`
      SELECT pg_get_functiondef('atlas.prevent_admin_bootstrap_reopen()'::regprocedure) AS definition
    `;
    assert.match(definition, /sealed Atlas admin bootstrap state is immutable/);
    assert.match(definition, /reserved Atlas admin bootstrap state belongs to its original attempt/);

    const migrationMarkers = await admin`
      SELECT name
      FROM atlas.schema_migrations
      WHERE name IN ('0109_aa001_admin_authority_and_bootstrap_state', '0110_aa001_bootstrap_reservation_fence')
      ORDER BY name
    `;
    assert.deepEqual(migrationMarkers.map(({ name }) => name), [
      "0109_aa001_admin_authority_and_bootstrap_state",
      "0110_aa001_bootstrap_reservation_fence",
    ]);

    const [{ canUpdate }] = await atlasApp`
      SELECT has_table_privilege(current_user, 'atlas.admin_bootstrap_state', 'UPDATE') AS "canUpdate"
    `;
    assert.equal(canUpdate, true, "the Atlas application can coordinate bootstrap state");
    const [{ canRead }] = await bridge`
      SELECT has_table_privilege(current_user, 'atlas.admin_bootstrap_state', 'SELECT') AS "canRead"
    `;
    assert.equal(canRead, false, "Agents Bridge cannot inspect or mutate bootstrap state");
  } finally {
    await Promise.all([admin.end(), atlasApp.end(), bridge.end()]);
  }
});
