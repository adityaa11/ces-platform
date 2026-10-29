import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-QAP-003 R3 removes only the obsolete quota-accounting-policy columns", { skip: !databaseUrl }, async () => {
  const sql = postgres(databaseUrl!, { max: 1 });
  try {
    const columns = await sql.unsafe(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'bridge'
        AND table_name IN ('provider_capacity_profile', 'workload_envelope_profile')
        AND column_name = 'quota_accounting_policy_id'
      ORDER BY table_name
    `);
    assert.deepEqual(Array.from(columns), []);

    const migrations = await sql.unsafe(`
      SELECT name
      FROM atlas.schema_migrations
      WHERE name = '0113_bssv2_quota_accounting_policy_removal'
    `);
    assert.deepEqual(Array.from(migrations), [{ name: "0113_bssv2_quota_accounting_policy_removal" }]);
  } finally {
    await sql.end();
  }
});
