import { readFile } from "node:fs/promises";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const replacements = {
  "{{ATLAS_APP_PASSWORD}}": process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only",
  "{{AGENTS_BRIDGE_PASSWORD}}": process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only",
};
const migrations = ["0000_bss003_boundaries", "0001_bss004_better_auth", "0002_bss006_pgboss", "0003_bss009_document_perception", "0004_bss006_atomic_idempotency_amendment", "0005_bss009_atlas_perception_authority", "0006_bss009_bridge_result_replay", "0007_pcc001_atlas_project_domain", "0008_pcc001_document_workspace_integrity", "0009_idser001_domain_persistence_foundation", "0010_idser001_manifest_trigger_fix", "0011_idser001_manifest_trigger_delete_fix", "0012_idser001_bundle_document_cleanup", "0013_idser001_scope_and_lifecycle_remediation", "0014_idser001_cross_scope_reference_integrity", "0015_idser004_semantic_context_authority", "0016_idser004_cancelled_semantic_execution", "0017_idser005_semantic_replay_fencing", "0018_idser006_candidate_identity_map", "0019_idser007_reconciliation_retrieval", "0020_idser008_bundle_completion_lifecycle", "0021_idser012_staged_perception_admission", "0022_idser012_perceived_terminal", "0023_bssv200501_provider_capacity_catalogue", "0024_idser012_derived_assets", "0025_rel03_semantic_composite_stage", "0026_semantic_qualified_deferred_acceptance", "0027_semantic_stepwise_delivery_handoff", "0028_bssv200502_process_workload_catalogue", "0029_bssv200504_desired_admission_profile_publication", "0030_bssv200601_provider_work_reservation_window_foundation", "0031_bssv200601_closure_remediation", "0032_bssv200601_redaction_metadata_fix", "0033_bssv200601_window_transition_and_restart_fence", "0034_bssv200601_metadata_validator_forward_fix", "0035_bssv200602_fair_admission_atomic_dispatch", "0036_bssv200602_cfc_fair_admission_closure", "0037_bssv200603_feedback_pressure_plan_convergence", "0038_bssv200603_plpgsql_output_fence", "0039_bssv200603_safe_hold_release_and_policy_request", "0040_bssv200603_structural_replan_request"];
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
