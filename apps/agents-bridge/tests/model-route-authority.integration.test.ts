import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import postgres from "postgres";
import { bindProviderWorkRouteFromResolver, type QualifiedRouteResolver } from "../src/provider-operational-runtime.ts";
import { createRouteRegistry, RouteResolutionError } from "../src/route-registry.ts";

const databaseUrl = process.env.DATABASE_URL;

const qualifiedRoute = (routeId: string) => ({
  routeId,
  capability: "atlas.chat.default" as const,
  providerId: "fixture-provider",
  modelOrProcessorId: "fixture-model-v1",
  adapterVersion: "fixture-adapter-v1",
  qualificationRef: "qualification://model-route-authority-fixture",
  qualificationVersion: "fixture-qualification-v1",
  workClass: "interactive",
  enabled: true,
});

test("BSS-V2-014-02-01 publishes one complete immutable authority version and rejects SQL substitutions", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const sql = postgres(bridgeUrl.toString(), { max: 1 });
  const domain = `model-route-authority-${Date.now()}`;
  const route = `${domain}-route`;
  const counts = async () => (await sql.unsafe(`
    SELECT
      (SELECT count(*)::int FROM bridge.provider_work_attempt WHERE quota_domain_id=$1) AS attempts,
      (SELECT count(*)::int FROM bridge.provider_work_reservation reservation JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS reservations,
      (SELECT count(*)::int FROM bridge.provider_work_dispatch dispatch JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS dispatches,
      (SELECT count(*)::int FROM bridge.provider_transport_claim claim JOIN bridge.provider_work_attempt work USING(logical_work_id,attempt_number) WHERE work.quota_domain_id=$1) AS claims
  `, [domain]))[0];
  const publish = (input = qualifiedRoute(route)) => sql.unsafe(
    "SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)",
    [input.routeId, domain, input.providerId, input.modelOrProcessorId, input.adapterVersion, input.qualificationRef, input.qualificationVersion, input.capability],
  );
  const rejectsAtBoundary = async (name: string, action: () => Promise<unknown>, expected: RegExp) => {
    await sql.unsafe(`SAVEPOINT ${name}`);
    await assert.rejects(action, expected);
    await sql.unsafe(`ROLLBACK TO SAVEPOINT ${name}`);
  };
  try {
    await sql.unsafe("BEGIN");
    await sql.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,'v1','fixture-provider',$2::jsonb,'{}'::jsonb,'{}'::jsonb,'operator_config','fixture','v1',now(),now())", [domain, [
      qualifiedRoute(route),
      { ...qualifiedRoute(route), modelOrProcessorId: "fixture-model-v2" },
    ]]);

    const [first] = await publish();
    assert.deepEqual({
      routeId: first.route_id,
      quotaDomainId: first.quota_domain_id,
      providerId: first.provider_id,
      modelOrProcessorId: first.model_or_processor_id,
      adapterVersion: first.adapter_version,
      qualificationRef: first.qualification_ref,
      qualificationVersion: first.qualification_version,
      capability: first.capability,
    }, {
      routeId: route,
      quotaDomainId: domain,
      providerId: "fixture-provider",
      modelOrProcessorId: "fixture-model-v1",
      adapterVersion: "fixture-adapter-v1",
      qualificationRef: "qualification://model-route-authority-fixture",
      qualificationVersion: "fixture-qualification-v1",
      capability: "atlas.chat.default",
    });
    assert.match(String(first.authority_version), /^\d+$/u);

    const authorityHistory = async () => sql.unsafe(
      "SELECT authority_version, route_id, quota_domain_id, provider_id, model_or_processor_id, adapter_version, qualification_ref, qualification_version, capability FROM bridge.qualified_provider_route_authority WHERE authority_kind='qualified_v1' AND route_id=$1 ORDER BY authority_version",
      [route],
    );
    const historyBeforeForgedPublication = await authorityHistory();
    await rejectsAtBoundary("forged_complete_tuple", () => publish({
      ...qualifiedRoute(route),
      modelOrProcessorId: "forged-model",
      adapterVersion: "forged-adapter",
      qualificationRef: "qualification://forged",
      qualificationVersion: "forged-v1",
    }), /foreign, revoked, or mismatched.*non-qualified/i);
    assert.deepEqual(await authorityHistory(), historyBeforeForgedPublication, "a rejected complete forged tuple cannot create or mutate authority history");

    const runtimePublisherCalls: Array<readonly unknown[] | undefined> = [];
    const nonQualifiedRuntimeResolver: QualifiedRouteResolver = { resolve: () => ({ ...qualifiedRoute(route), modelOrProcessorId: "forged-model" }) };
    await rejectsAtBoundary("runtime_non_qualified_tuple", () => bindProviderWorkRouteFromResolver({
      executeSql: async (query: string, values?: readonly unknown[]) => {
        if (!query.includes("publish_qualified_provider_route_authority")) return { rows: [{ capability: "atlas.chat.default", quota_domain_id: domain }] };
        runtimePublisherCalls.push(values);
        return { rows: await sql.unsafe(query, values as never) };
      },
    } as never, nonQualifiedRuntimeResolver, { logicalWorkId: "non-qualified", attemptNumber: 1 }), /foreign, revoked, or mismatched.*non-qualified/i);
    assert.deepEqual(runtimePublisherCalls, [[route, domain, "fixture-provider", "forged-model", "fixture-adapter-v1", "qualification://model-route-authority-fixture", "fixture-qualification-v1", "atlas.chat.default"]]);
    assert.deepEqual(await authorityHistory(), historyBeforeForgedPublication, "a runtime-publisher rejection cannot create or mutate authority history");

    const [sameTuple] = await publish();
    assert.equal(String(sameTuple.authority_version), String(first.authority_version), "a stale duplicate cannot mint or overwrite an authority version");
    const [successor] = await publish({ ...qualifiedRoute(route), modelOrProcessorId: "fixture-model-v2" });
    assert.notEqual(String(successor.authority_version), String(first.authority_version), "a changed qualified tuple is a separate append-only authority version");
    assert.equal(Number((await sql.unsafe("SELECT count(*)::int AS count FROM bridge.qualified_provider_route_authority WHERE authority_kind='qualified_v1' AND route_id=$1", [route]))[0].count), 2);

    await rejectsAtBoundary("forged_provider", () => publish({ ...qualifiedRoute(route), providerId: "forged-provider" }), /foreign, revoked, or mismatched/i);
    await rejectsAtBoundary("foreign_domain", () => sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route, `${domain}-foreign`, "fixture-provider", "fixture-model-v1", "fixture-adapter-v1", "qualification://model-route-authority-fixture", "fixture-qualification-v1", "atlas.chat.default"]), /foreign, revoked, or mismatched/i);
    await rejectsAtBoundary("incomplete_model", () => sql.unsafe("SELECT * FROM bridge.publish_qualified_provider_route_authority($1,$2,$3,$4,$5,$6,$7,$8)", [route, domain, "fixture-provider", "", "fixture-adapter-v1", "qualification://model-route-authority-fixture", "fixture-qualification-v1", "atlas.chat.default"]), /incomplete/i);
    await rejectsAtBoundary("immutable_history", () => sql.unsafe("UPDATE bridge.qualified_provider_route_authority SET model_or_processor_id='forged' WHERE authority_version=$1", [first.authority_version]), /permission denied|append-only/i);
    assert.deepEqual(await counts(), { attempts: 0, reservations: 0, dispatches: 0, claims: 0 });
  } finally {
    await sql.unsafe("ROLLBACK").catch(() => undefined);
    await sql.end();
  }
});

test("BSS-V2-014-02-01 keeps publication on the existing resolver/runtime seam", async () => {
  const route = qualifiedRoute("runtime-publication-route");
  const resolver = createRouteRegistry([route], "development", new Set(["fixture-provider"]));
  const calls: Array<{ query: string; values?: readonly unknown[] }> = [];
  const database = {
    executeSql: async (query: string, values?: readonly unknown[]) => {
      calls.push({ query, values });
      if (calls.length === 1) return { rows: [{ capability: "atlas.chat.default", quota_domain_id: "runtime-domain" }] };
      if (calls.length === 2) return { rows: [{ authority_version: "42", route_id: route.routeId, quota_domain_id: "runtime-domain", provider_id: route.providerId, model_or_processor_id: route.modelOrProcessorId, adapter_version: route.adapterVersion, qualification_ref: route.qualificationRef, qualification_version: route.qualificationVersion, capability: route.capability }] };
      return { rows: [] };
    },
  };
  const authority = await bindProviderWorkRouteFromResolver(database as never, resolver, { logicalWorkId: "runtime-work", attemptNumber: 1 });
  assert.deepEqual(authority, { authorityVersion: "42", routeId: route.routeId, quotaDomainId: "runtime-domain", providerId: route.providerId, modelOrProcessorId: route.modelOrProcessorId, adapterVersion: route.adapterVersion, qualificationRef: route.qualificationRef, qualificationVersion: route.qualificationVersion });
  assert.deepEqual(calls[1].values, [route.routeId, "runtime-domain", route.providerId, route.modelOrProcessorId, route.adapterVersion, route.qualificationRef, route.qualificationVersion, route.capability]);

  const noPublicationCalls: Array<string> = [];
  const forgedResolver: QualifiedRouteResolver = { resolve: () => ({ ...route, capability: "atlas.semantic.extract" }) };
  await assert.rejects(() => bindProviderWorkRouteFromResolver({ executeSql: async (query: string) => { noPublicationCalls.push(query); return { rows: [{ capability: "atlas.chat.default", quota_domain_id: "runtime-domain" }] }; } } as never, forgedResolver, { logicalWorkId: "forged", attemptNumber: 1 }), /mismatched capability/i);
  assert.equal(noPublicationCalls.length, 1, "a forged resolver result cannot reach publication");

  const revoked = createRouteRegistry([{ ...route, enabled: false }], "development", new Set(["fixture-provider"]));
  assert.throws(() => revoked.resolve(route.capability), RouteResolutionError);
  const expired = createRouteRegistry([{ ...route, effectiveUntil: "2000-01-01T00:00:00.000Z" }], "development", new Set(["fixture-provider"]));
  assert.throws(() => expired.resolve(route.capability), RouteResolutionError);

  const [runtimeSource, initialMigrationSource, remediationMigrationSource] = await Promise.all([
    readFile(new URL("../src/provider-operational-runtime.ts", import.meta.url), "utf8"),
    readFile(new URL("../../../packages/atlas-db/migrations/0088_bssv20140201_model_bound_route_authority.sql", import.meta.url), "utf8"),
    readFile(new URL("../../../packages/atlas-db/migrations/0090_bssv20140201_qualified_tuple_publication_guard.sql", import.meta.url), "utf8"),
  ]);
  assert.match(runtimeSource, /QualifiedRouteResolver/);
  assert.match(runtimeSource, /publish_qualified_provider_route_authority\(\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8\)/);
  for (const migrationSource of [initialMigrationSource, remediationMigrationSource]) {
    assert.doesNotMatch(migrationSource, /CREATE (?:OR REPLACE )?FUNCTION bridge\.bind_provider_work_route/u, "this ticket does not alter the later binding owner");
    assert.doesNotMatch(migrationSource, /provider_work_reservation|provider_transport_claim|provider_work_dispatch/u, "this ticket has no reservation, claim, or transport effect");
  }
});
