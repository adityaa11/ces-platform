import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
test("BSS-V2-005-02 persists immutable Bridge-owned process and workload versions", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 }); const atlas = postgres(atlasUrl.toString(), { max: 1 }); const id = `process-workload-${Date.now()}`;
  try {
    await bridge.unsafe("BEGIN");
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile (workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES ($1,'v1',true,'[\"semantic\"]','{}','{}','quota-v1','{}','{}')", [id]);
    await bridge.unsafe("INSERT INTO bridge.workload_envelope_profile (workload_id,profile_version,active,compatible_process_kinds,structural_bound,estimator,quota_accounting_policy_id,output_reservation,safety_policy) VALUES ($1,'v2',false,'[\"semantic\"]','{}','{}','quota-v2','{}','{}')", [id]);
    await bridge.unsafe("INSERT INTO bridge.provider_process_profile (process_id,profile_version,process_kind,capability,service_class,fairness_scope,allocation_policy,active,eligible_route_ids,workload_id,workload_profile_version) VALUES ($1,'v1','semantic','atlas.semantic.extract','background','{}','{}',false,'[]',$1,'v1')", [id]);
    assert.equal((await bridge.unsafe("SELECT count(*)::integer AS count FROM bridge.workload_envelope_profile WHERE workload_id=$1", [id]))[0].count, 2);
    assert.equal((await bridge.unsafe("SELECT workload_profile_version FROM bridge.provider_process_profile WHERE process_id=$1 AND profile_version='v1'", [id]))[0].workload_profile_version, "v1");
    await assert.rejects(() => bridge.unsafe("UPDATE bridge.workload_envelope_profile SET active=false WHERE workload_id=$1 AND profile_version='v1'", [id]), /immutable/);
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.provider_process_profile"), /permission denied/i);
  } finally { await bridge.unsafe("ROLLBACK"); await Promise.all([bridge.end(), atlas.end()]); }
});
