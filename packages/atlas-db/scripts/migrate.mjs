import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { PgBoss } from "pg-boss";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const replacements = {
  "{{ATLAS_APP_PASSWORD}}": process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only",
  "{{AGENTS_BRIDGE_PASSWORD}}": process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only",
};
const migrations = ["0000_bss003_boundaries", "0001_bss004_better_auth", "0002_bss006_pgboss", "0003_bss009_document_perception", "0004_bss006_atomic_idempotency_amendment", "0005_bss009_atlas_perception_authority", "0006_bss009_bridge_result_replay", "0007_pcc001_atlas_project_domain", "0008_pcc001_document_workspace_integrity", "0009_idser001_domain_persistence_foundation", "0010_idser001_manifest_trigger_fix", "0011_idser001_manifest_trigger_delete_fix", "0012_idser001_bundle_document_cleanup", "0013_idser001_scope_and_lifecycle_remediation", "0014_idser001_cross_scope_reference_integrity", "0015_idser004_semantic_context_authority", "0016_idser004_cancelled_semantic_execution", "0017_idser005_semantic_replay_fencing", "0018_idser006_candidate_identity_map", "0019_idser007_reconciliation_retrieval", "0020_idser008_bundle_completion_lifecycle", "0021_idser012_staged_perception_admission", "0022_idser012_perceived_terminal", "0023_bssv200501_provider_capacity_catalogue", "0024_idser012_derived_assets", "0025_rel03_semantic_composite_stage", "0026_semantic_qualified_deferred_acceptance", "0027_semantic_stepwise_delivery_handoff", "0028_bssv200502_process_workload_catalogue", "0029_bssv200504_desired_admission_profile_publication", "0030_bssv200601_provider_work_reservation_window_foundation", "0031_bssv200601_closure_remediation", "0032_bssv200601_redaction_metadata_fix", "0033_bssv200601_window_transition_and_restart_fence", "0034_bssv200601_metadata_validator_forward_fix", "0035_bssv200602_fair_admission_atomic_dispatch", "0036_bssv200602_cfc_fair_admission_closure"];
migrations.push("0037_bssv200603a_route_bound_operational_runtime");
migrations.push("0038_bssv200603a_claim_identity_forward_fix");
migrations.push("0038_bssv200603a_legacy_route_binding_closure");
migrations.push("0047_bssv200603a_physical_window_accounting");
migrations.push("0048_bssv200603a_interactive_physical_window_admission");
// These compatibility corrections belong to exact-window reconciliation.
// Keep them ahead of the separately authorized pressure/wakeup migrations.
migrations.push("0052_bssv200603a_legacy_admission_compatibility");
migrations.push("0053_bssv200603a_legacy_window_reservation_compatibility");
migrations.push("0054_bssv200603a_legacy_usage_compatibility");
migrations.push("0049_bssv200603a_pressure_wakeup_convergence");
migrations.push("0057_bssv200603a_wakeup_schema_convergence");
migrations.push("0050_bssv200603a_route_pressure_admission");
migrations.push("0051_bssv200603a_route_pressure_admission_forward_fix");
migrations.push("0051_bssv200603a_pressure_cfc_closure");
migrations.push("0056_bssv200603a_post_cooldown_domain_pressure_clamp");
migrations.push("0055_bssv200603a_durable_wakeup_consumer");
migrations.push("0058_bssv200603a_pressure_signature_convergence");
migrations.push("0059_bssv200603a_pressure_nullability_convergence");
migrations.push("0060_bssv200603a_pressure_policy_shape_convergence");
migrations.push("0061_bssv200603a_pressure_runtime_convergence");
migrations.push("0062_bssv200603a_wakeup_fairness_convergence");
migrations.push("0063_bssv200603a_background_route_aware_admission");
migrations.push("0064_bssv200603a_background_route_aware_admission_forward_fix");
migrations.push("0065_bssv200603a_background_route_aware_lookup_fix");
migrations.push("0066_bssv200603a_missing_route_binding_closure");
migrations.push("0067_bssv20050503_authorized_desired_plan_convergence");
migrations.push("0068_bssv20060401_runtime_capacity_constraint_read");
migrations.push("0069_bssv20060402_provider_work_admission_boundary");
migrations.push("0070_bssv20060402_pre_send_cancellation_forward_fix");
migrations.push("0071_bssv20060403_operational_outcome_feedback_projection");
migrations.push("0072_bssv20060403_cancelled_reservation_release");
migrations.push("0073_bssv20060403_legacy_feedback_reason_compatibility");
migrations.push("0074_bssv20060404_interactive_admitted_work_lifecycle");
migrations.push("0075_bssv20060405_constraint_convergence_structural_replan_projection");
migrations.push("0076_bssv200501_anoman_capacity_profile");
migrations.push("0077_bssv20060501_authorized_enforcement_policy_provenance");
migrations.push("0078_bssv20060502_effective_plan_publication_convergence");
migrations.push("0079_bssv20060502_effective_plan_timestamp_canonicalization");
migrations.push("0080_bssv20060502_effective_plan_canonicalizer_execute");
migrations.push("0081_bssv20060502_effective_plan_nested_vector_validation");
migrations.push("0082_bssv20060503_authenticated_effective_capacity_snapshot");
migrations.push("0083_bssv20060504_policy_aware_runtime_admission_fairness");
migrations.push("0084_bssv20060505_policy_revision_operational_recovery");
migrations.push("0085_idser012_immutable_semantic_corpus_plan");
migrations.push("0086_idser012_immutable_semantic_corpus_plan_cfc");
migrations.push("0087_idser012_semantic_multimodal_reconstruction_policy_binding");
migrations.push("0088_bssv20140201_model_bound_route_authority");
migrations.push("0089_bssv20140201_authority_publisher_lookup_fix");
migrations.push("0090_bssv20140201_qualified_tuple_publication_guard");
migrations.push("0091_bssv20140202_shared_domain_calculated_allocation_publication");
migrations.push("0092_bssv20140202_publication_fixture_observation");
migrations.push("0093_bssv20140202_candidate_fingerprint_resolution");
migrations.push("0094_bssv20140202_candidate_revision_resolution");
migrations.push("0095_bssv20140202_activation_gate_column_resolution");
migrations.push("0096_bssv20140202_activation_revision_resolution");
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
const initializePgBoss = async () => {
  const bridgeUrl = new URL(connectionString);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = replacements["{{AGENTS_BRIDGE_PASSWORD}}"];
  const boss = new PgBoss({
    connectionString: bridgeUrl.toString(),
    schema: "pgboss",
    application_name: "atlas-db-migrate-pgboss-bootstrap",
    migrate: true,
    createSchema: false,
    schedule: false,
    max: 2,
  });
  try {
    await boss.start();
  } finally {
    await boss.stop({ graceful: false }).catch(() => undefined);
  }
};
try {
  const applied = await getAppliedMigrations();
  if (process.argv.includes("--check")) {
    const missing = migrations.filter((name) => !applied.has(name));
    if (missing.length) throw new Error(`${missing.join(", ")} have not been applied`);
    console.log("Atlas database migration check passed");
  } else {
    const pending = migrations.filter((name) => !applied.has(name));
    for (const name of pending) {
      // 0035 is the first Atlas migration that calls pg-boss SQL directly.
      // A pristine database has only the schema/role from 0002 at this point;
      // initialize pg-boss as its owning Bridge role before applying it.
      if (name === "0035_bssv200602_fair_admission_atomic_dispatch") await initializePgBoss();
      await sql.unsafe(await readMigration(name));
      applied.add(name);
    }
    console.log(pending.length ? `Atlas database migrations applied: ${pending.join(", ")}` : "Atlas database migrations already up to date");
  }
} finally { await sql.end(); }
