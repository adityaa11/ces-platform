import { readFile } from "node:fs/promises";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const replacements = {
  "{{ATLAS_APP_PASSWORD}}": process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only",
  "{{AGENTS_BRIDGE_PASSWORD}}": process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only",
};
let migration = await readFile(new URL("../migrations/0000_bss003_boundaries.sql", import.meta.url), "utf8");
for (const [token, value] of Object.entries(replacements)) migration = migration.replaceAll(token, value.replaceAll("'", "''"));
const sql = postgres(connectionString, { max: 1 });
try {
  if (process.argv.includes("--check")) {
    const [{ exists }] = await sql`SELECT EXISTS (SELECT 1 FROM atlas.schema_migrations WHERE name = '0000_bss003_boundaries') AS exists`;
    if (!exists) throw new Error("BSS-003 migration has not been applied");
    console.log("BSS-003 migration boundary check passed");
  } else {
    await sql.unsafe(migration);
    console.log("BSS-003 migration applied");
  }
} finally { await sql.end(); }
