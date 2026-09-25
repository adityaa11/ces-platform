import { readFile } from "node:fs/promises";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const replacements = {
  "{{ATLAS_APP_PASSWORD}}": process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only",
  "{{AGENTS_BRIDGE_PASSWORD}}": process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only",
};
const migrations = ["0000_bss003_boundaries", "0001_bss004_better_auth", "0002_bss006_pgboss", "0003_bss009_document_perception", "0004_bss006_atomic_idempotency_amendment", "0005_bss009_atlas_perception_authority", "0006_bss009_bridge_result_replay", "0007_pcc001_atlas_project_domain", "0008_pcc001_document_workspace_integrity"];
const readMigration = async (name) => {
  let migration = await readFile(new URL(`../migrations/${name}.sql`, import.meta.url), "utf8");
  for (const [token, value] of Object.entries(replacements)) migration = migration.replaceAll(token, value.replaceAll("'", "''"));
  return migration;
};
const getAppliedMigrations = async () => {
  const [{ exists }] = await sql`SELECT to_regclass('atlas.schema_migrations') IS NOT NULL AS exists`;
  if (!exists) return new Set();
  const rows = await sql`SELECT name FROM atlas.schema_migrations`;
  return new Set(rows.map(({ name }) => String(name)));
};
const sql = postgres(connectionString, { max: 1 });
try {
  const applied = await getAppliedMigrations();
  if (process.argv.includes("--check")) {
    const missing = migrations.filter((name) => !applied.has(name));
    if (missing.length) throw new Error(`${missing.join(", ")} have not been applied`);
    console.log("Atlas database migration check passed");
  } else {
    const pending = migrations.filter((name) => !applied.has(name));
    for (const name of pending) {
      await sql.unsafe(await readMigration(name));
      applied.add(name);
    }
    console.log(pending.length ? `Atlas database migrations applied: ${pending.join(", ")}` : "Atlas database migrations already up to date");
  }
} finally { await sql.end(); }
