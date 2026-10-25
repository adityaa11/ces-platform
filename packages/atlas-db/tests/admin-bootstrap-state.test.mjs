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

    const [{ canDelete }] = await atlasApp`
      SELECT has_table_privilege(current_user, 'atlas.admin_bootstrap_state', 'DELETE') AS "canDelete"
    `;
    assert.equal(canDelete, false, "the Atlas application cannot delete the durable marker");

    const migrationMarkers = await admin`
      SELECT name
      FROM atlas.schema_migrations
      WHERE name IN ('0109_aa001_admin_authority_and_bootstrap_state', '0110_aa001_bootstrap_reservation_fence', '0111_aa001_bootstrap_conflict_and_sealed_fence')
      ORDER BY name
    `;
    assert.deepEqual(migrationMarkers.map(({ name }) => name), [
      "0109_aa001_admin_authority_and_bootstrap_state",
      "0110_aa001_bootstrap_reservation_fence",
      "0111_aa001_bootstrap_conflict_and_sealed_fence",
    ]);

    const [{ canUpdate }] = await atlasApp`
      SELECT has_table_privilege(current_user, 'atlas.admin_bootstrap_state', 'UPDATE') AS "canUpdate"
    `;
    assert.equal(canUpdate, true, "the Atlas application can coordinate bootstrap state");
    const [{ canReconcile }] = await atlasApp`
      SELECT has_function_privilege(current_user, 'atlas.assert_admin_bootstrap_reconciliation_safe()'::regprocedure, 'EXECUTE') AS "canReconcile"
    `;
    assert.equal(canReconcile, true, "the Atlas application can invoke the bootstrap reconciliation guard");
    await atlasApp`SELECT atlas.assert_admin_bootstrap_reconciliation_safe()`;
    const [{ canRead }] = await bridge`
      SELECT has_table_privilege(current_user, 'atlas.admin_bootstrap_state', 'SELECT') AS "canRead"
    `;
    assert.equal(canRead, false, "Agents Bridge cannot inspect or mutate bootstrap state");

    await admin.begin(async (transaction) => {
      const fixtureUserId = `aa001-conflict-${Date.now()}`;
      await transaction`
        DELETE FROM atlas.admin_bootstrap_state
        WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
      await transaction`
        INSERT INTO auth."user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
        VALUES (${fixtureUserId}, ${fixtureUserId}, ${`${fixtureUserId}@example.test`}, false, 'admin', now(), now())
      `;
      await transaction.unsafe("SAVEPOINT missing_marker_conflict");
      await assert.rejects(
        () => transaction`SELECT atlas.assert_admin_bootstrap_reconciliation_safe()`,
        /Atlas admin bootstrap conflict: marker missing while an admin identity exists/,
        "a missing marker with a persisted admin identity fails closed",
      );
      await transaction.unsafe("ROLLBACK TO SAVEPOINT missing_marker_conflict");
      const [{ adminCount }] = await transaction`
        SELECT count(*)::integer AS "adminCount" FROM auth."user" WHERE role = 'admin'
      `;
      assert.equal(adminCount, 1, "the conflict check creates or authorizes no second admin");
      throw new Error("AA-001 conflict fixture rollback");
    }).catch((error) => {
      if (error.message !== "AA-001 conflict fixture rollback") throw error;
    });

    await atlasApp.unsafe("BEGIN");
    try {
      await atlasApp`
        UPDATE atlas.admin_bootstrap_state
        SET state = 'RESERVED', attempt_id = 'aa001-attempt-a', attempt_email = 'attempt-a@example.test', reserved_at = now()
        WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
      await atlasApp.unsafe("SAVEPOINT hostile_sealing_attempt");
      await assert.rejects(
        () => atlasApp`
          UPDATE atlas.admin_bootstrap_state
          SET state = 'SEALED', attempt_id = 'aa001-attempt-b', attempt_email = 'attempt-b@example.test', initial_user_id = 'not-used', sealed_at = now()
          WHERE bootstrap_key = 'atlas-platform-super-admin'
        `,
        /reserved Atlas admin bootstrap state belongs to its original attempt/,
        "a hostile attempt cannot seal another attempt's reservation",
      );
      await atlasApp.unsafe("ROLLBACK TO SAVEPOINT hostile_sealing_attempt");
      const [reservation] = await atlasApp`
        SELECT state, attempt_id, attempt_email
        FROM atlas.admin_bootstrap_state
        WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
      assert.deepEqual(reservation, {
        state: 'RESERVED', attempt_id: 'aa001-attempt-a', attempt_email: 'attempt-a@example.test',
      }, "the durable reservation remains owned by the original attempt");
    } finally {
      await atlasApp.unsafe("ROLLBACK").catch(() => undefined);
    }

    await atlasApp.unsafe("BEGIN");
    try {
      const fixtureUserId = `aa001-sealed-${Date.now()}`;
      await atlasApp`
        INSERT INTO auth."user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
        VALUES (${fixtureUserId}, ${fixtureUserId}, ${`${fixtureUserId}@example.test`}, false, 'admin', now(), now())
      `;
      await atlasApp`
        UPDATE atlas.admin_bootstrap_state
        SET state = 'RESERVED', attempt_id = 'aa001-sealed-attempt', attempt_email = 'sealed@example.test', reserved_at = now()
        WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
      await atlasApp`
        UPDATE atlas.admin_bootstrap_state
        SET state = 'SEALED', initial_user_id = ${fixtureUserId}, sealed_at = now()
        WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
      await atlasApp.unsafe("SAVEPOINT sealed_marker_delete");
      await assert.rejects(
        () => atlasApp`DELETE FROM atlas.admin_bootstrap_state WHERE bootstrap_key = 'atlas-platform-super-admin'`,
        /permission denied/i,
        "the application cannot delete a sealed marker",
      );
      await atlasApp.unsafe("ROLLBACK TO SAVEPOINT sealed_marker_delete");
      const [sealedMarker] = await atlasApp`
        SELECT state FROM atlas.admin_bootstrap_state WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
      assert.equal(sealedMarker?.state, 'SEALED', "the sealed marker remains present after deletion is rejected");
    } finally {
      await atlasApp.unsafe("ROLLBACK").catch(() => undefined);
    }
  } finally {
    await Promise.all([admin.end(), atlasApp.end(), bridge.end()]);
  }
});
