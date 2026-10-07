import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
test("BSS-V2-005-01 persists immutable Bridge-owned, secret-free capacity versions", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 }); const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const domain = `capacity-test-${Date.now()}`;
  try {
    await bridge.unsafe("BEGIN");
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile (quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES ($1,'v1','account-alias', '[{\"routeId\":\"semantic-a\",\"providerId\":\"anoman\"}]', '{\"rpm\":{\"state\":\"known\",\"value\":60}}', '{\"rpm\":{\"kind\":\"fixed_window\"}}', 'quota-v1','provider_docs','provider-docs://limits','2026-10',now(),now())", [domain]);
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile (quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,quota_accounting_policy_id,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES ($1,'v2','account-alias', '[{\"routeId\":\"semantic-a\",\"providerId\":\"anoman\"}]', '{\"rpm\":{\"state\":\"zero\"}}', '{\"rpm\":{\"kind\":\"fixed_window\"}}', 'quota-v2','operator_config','operator://capacity','2',now(),now())", [domain]);
    assert.equal((await bridge.unsafe("SELECT count(*)::integer AS count FROM bridge.provider_capacity_profile WHERE quota_domain_id=$1", [domain]))[0].count, 2);
    await assert.rejects(() => atlas.unsafe("SELECT * FROM bridge.provider_capacity_profile"), /permission denied/i);
    await assert.rejects(() => bridge.unsafe("UPDATE bridge.provider_capacity_profile SET source_ref='changed' WHERE quota_domain_id=$1 AND profile_version='v1'", [domain]), /immutable/);
  } finally { await bridge.unsafe("ROLLBACK"); await Promise.all([bridge.end(), atlas.end()]); }
});
