import { readFile } from "node:fs/promises";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const replacements = {
  "{{ATLAS_APP_PASSWORD}}": process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only",
  "{{AGENTS_BRIDGE_PASSWORD}}": process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only",
};
const migrations = ["0000_bss003_boundaries", "0001_bss004_better_auth", "0002_bss006_pgboss"];
const readMigration = async (name) => {
  let migration = await readFile(new URL(`../migrations/${name}.sql`, import.meta.url), "utf8");
  for (const [token, value] of Object.entries(replacements)) migration = migration.replaceAll(token, value.replaceAll("'", "''"));
  return migration;
};
const sql = postgres(connectionString, { max: 1 });
try {
  if (process.argv.includes("--check")) {
    for (const name of migrations) {
      const [{ exists }] = await sql`SELECT EXISTS (SELECT 1 FROM atlas.schema_migrations WHERE name = ${name}) AS exists`;
      if (!exists) throw new Error(`${name} has not been applied`);
    }
    console.log("Atlas database migration check passed");
  } else {
    for (const name of migrations) await sql.unsafe(await readMigration(name));
    console.log("Atlas database migrations applied");
  }
} finally { await sql.end(); }
