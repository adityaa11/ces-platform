import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
test("Agents Bridge cannot write trusted Atlas state while Atlas can", { skip }, async () => {
  const admin = postgres(databaseUrl, { max: 1 });
  const bridgeUrl = new URL(databaseUrl); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  try {
    await admin.unsafe("CREATE TABLE IF NOT EXISTS atlas.boundary_probe (id integer PRIMARY KEY)");
    await admin.unsafe("GRANT INSERT, UPDATE, DELETE, SELECT ON atlas.boundary_probe TO atlas_app");
    await assert.rejects(() => bridge.unsafe("INSERT INTO atlas.boundary_probe VALUES (1)"), /permission denied/i);
    await atlas.unsafe("INSERT INTO atlas.boundary_probe VALUES (1) ON CONFLICT DO NOTHING");
  } finally {
    await admin.unsafe("DROP TABLE IF EXISTS atlas.boundary_probe");
    await Promise.all([admin.end(), bridge.end(), atlas.end()]);
  }
});
