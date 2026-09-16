import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import postgres from "postgres";
import { BridgeProviderError } from "../src/providers/mistral.ts";
import { createAtlasPerceptionClients } from "../src/atlas-perception-client.ts";
import { runDocumentPerception } from "../src/document-perception-worker.ts";
import { createPerceptionInternalRoutes, PerceptionSourceGrantIssuer, type DocumentPerceptionRequest, type NormalizedDocument, type PerceptionExecutionInput } from "@atlas/core";
import { PostgresPerceptionAuthority } from "@atlas/db";
import { LocalFilesystemDocumentStore } from "@atlas/document-store";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const serviceCredential = "service-credential-that-is-at-least-32-bytes-long";
const capabilityIdentity = "mistral-ocr:test-negative-matrix";

type Fixture = {
  readonly input: PerceptionExecutionInput;
  readonly request: DocumentPerceptionRequest;
};

function resultFor(request: DocumentPerceptionRequest, text = "Synthetic negative-matrix PDF text"): NormalizedDocument {
  return {
    version: "v1",
    executionId: request.executionId,
    artifactId: request.artifact.id,
    sourceSha256: request.artifact.sourceSha256,
    perception: request.perception,
    provider: { name: "mistral", processor: "ocr-qualified", executionId: request.executionId, processedAt: "2026-09-16T00:00:00.000Z" },
    pages: [{ number: 1, textBlocks: [{ id: "block-1", text }], tables: [], visualRegions: [] }],
  };
}

test("the Compose PostgreSQL perception authority rejects the complete negative matrix without trusted completion", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 2 });
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 4 });
  const bridge = postgres(bridgeUrl.toString(), { max: 4 });
  const sourceRoot = await mkdtemp(join(tmpdir(), "atlas-perception-negative-"));
  const store = new LocalFilesystemDocumentStore(sourceRoot);
  const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer(serviceCredential));
  const routes = createPerceptionInternalRoutes({ authority, sources: store, serviceCredential, maximumSourceBytes: 20 * 1024 * 1024, maximumResultBytes: 10 * 1024 * 1024 });
  const executionIds: string[] = [];

  const makeFixture = async (label: string): Promise<Fixture> => {
    const bytes = new Uint8Array(Buffer.from("%PDF-negative-" + label + "%"));
    const stored = await store.put({ bytes, mediaType: "application/pdf" });
    const input: PerceptionExecutionInput = {
      executionId: "negative-" + label + "-" + randomUUID(),
      artifactId: "artifact-" + label + "-" + randomUUID(),
      storageKey: stored.storageKey,
      sourceSha256: createHash("sha256").update(bytes).digest("hex"),
      mimeType: "application/pdf",
      byteSize: bytes.byteLength,
      idempotencyKey: "negative-" + label + "-" + randomUUID(),
      capabilityIdentity,
    };
    const request = await authority.create(input);
    executionIds.push(input.executionId);
    return { input, request };
  };

  const clientsFor = () => createAtlasPerceptionClients({
    baseUrl: "http://atlas.test",
    sourcePath: "/internal/perception/source",
    resultPath: "/internal/perception/result",
    serviceCredential,
    maximumSourceBytes: 20 * 1024 * 1024,
    maximumResultBytes: 10 * 1024 * 1024,
    timeoutMilliseconds: 5_000,
  }, async (url, init) => {
    const headers = init?.headers as Record<string, string>;
    const credential = headers.authorization?.replace(/^Bearer /u, "");
    const body = JSON.parse(String(init?.body));
    if (url.endsWith("/source")) {
      const response = await routes.redeem(credential, body);
      return new Response(response.body instanceof Uint8Array ? response.body : JSON.stringify(response.body), { status: response.status, headers: { "content-type": response.contentType } });
    }
    const response = await routes.deliver(credential, body.request, body.result);
    return new Response(response.status === 204 ? null : JSON.stringify(response.body), { status: response.status, headers: { "content-type": response.contentType } });
  });

  const assertNoTrustedCompletion = async (fixture: Fixture, label: string): Promise<void> => {
    const state = (await admin.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [fixture.input.executionId]))[0]?.state;
    assert.notEqual(state, "completed", label + " must not complete Atlas execution");
    const cache = (await admin.unsafe("SELECT count(*)::int AS count FROM atlas.normalized_document_cache WHERE source_sha256=$1 AND capability_identity=$2 AND invalidated_at IS NULL", [fixture.input.sourceSha256, capabilityIdentity]))[0]?.count;
    assert.equal(cache, 0, label + " must not create an active normalized cache entry");
    const replay = (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1", [fixture.input.idempotencyKey]))[0]?.count;
    assert.equal(replay, 0, label + " must not persist replay output before a successful result handoff");
  };

  try {
    const expired = await makeFixture("expired");
    const tamperedGrant = expired.request.source.grant.replace(/^./u, expired.request.source.grant.startsWith("a") ? "b" : "a");
    assert.equal((await routes.redeem(serviceCredential, { ...expired.request, source: { grant: tamperedGrant } })).status, 400);
    await admin.unsafe("UPDATE atlas.document_perception_source_grant SET expires_at=now()-interval '1 second' WHERE grant_id=$1", [expired.request.source.grant.split(".", 1)[0]]);
    assert.equal((await routes.redeem(serviceCredential, expired.request)).status, 400);
    await assertNoTrustedCompletion(expired, "expired/tampered grant");

    const identity = await makeFixture("identity");
    assert.equal((await routes.redeem(serviceCredential, { ...identity.request, executionId: "wrong-execution" })).status, 400);
    assert.equal((await routes.redeem(serviceCredential, { ...identity.request, artifact: { ...identity.request.artifact, id: "wrong-artifact" } })).status, 400);
    assert.equal((await routes.redeem(serviceCredential, { ...identity.request, artifact: { ...identity.request.artifact, sourceSha256: "b".repeat(64) } })).status, 400);
    assert.equal((await routes.redeem(serviceCredential, { ...identity.request, artifact: { ...identity.request.artifact, byteSize: identity.request.artifact.byteSize + 1 } })).status, 400);
    assert.equal((await routes.redeem(serviceCredential, { ...identity.request, artifact: { ...identity.request.artifact, mimeType: "text/plain" as never } })).status, 400);
    await assertNoTrustedCompletion(identity, "identity/hash/size/MIME mismatch");

    const stale = await makeFixture("stale");
    await admin.unsafe("UPDATE atlas.document_perception_execution SET state='cancelled' WHERE id=$1", [stale.input.executionId]);
    assert.equal((await routes.deliver(serviceCredential, stale.request, resultFor(stale.request))).status, 400);
    await assertNoTrustedCompletion(stale, "stale result");

    const invalid = await makeFixture("invalid");
    assert.equal((await routes.deliver(serviceCredential, invalid.request, { ...resultFor(invalid.request), pages: [] })).status, 400);
    await assertNoTrustedCompletion(invalid, "invalid normalized result");

    for (const [label, provider, expected] of [
      ["provider-failure", { perceive: async () => { throw new Error("synthetic provider failure"); } }, /synthetic provider failure/u],
      ["timeout", { perceive: async () => { throw new BridgeProviderError("timeout", "synthetic provider timeout"); } }, /synthetic provider timeout/u],
    ] as const) {
      const fixture = await makeFixture(label);
      const clients = clientsFor();
      await assert.rejects(() => runDocumentPerception(fixture.request, provider as never, clients.source, clients.results, new AbortController().signal), expected);
      await assertNoTrustedCompletion(fixture, label);
    }

    const cancelled = await makeFixture("cancelled");
    const cancellation = new AbortController();
    const cancellationProvider = {
      perceive: async () => {
        cancellation.abort();
        return { providerResult: { pages: [{ index: 0, markdown: "late result" }] }, provenance: { provider: "mistral" as const, model: "ocr-qualified", endpoint: "/v1/ocr" as const, latencyMilliseconds: 1, attempt: 1 } };
      },
    };
    await assert.rejects(() => runDocumentPerception(cancelled.request, cancellationProvider as never, clientsFor().source, clientsFor().results, cancellation.signal), /cancelled/u);
    await assertNoTrustedCompletion(cancelled, "cancellation");

    const malformedProvider = await makeFixture("malformed-provider");
    const malformed = {
      perceive: async () => ({ providerResult: { pages: [{ index: 0, images: [{ assetRef: "https://provider.example/private.png" }] }] }, provenance: { provider: "mistral" as const, model: "ocr-qualified", endpoint: "/v1/ocr" as const, latencyMilliseconds: 1, attempt: 1 } }),
    };
    await assert.rejects(() => runDocumentPerception(malformedProvider.request, malformed as never, clientsFor().source, clientsFor().results, new AbortController().signal), /Invalid normalized document/u);
    await assertNoTrustedCompletion(malformedProvider, "invalid provider normalization");

    const cacheFailure = await makeFixture("cache-failure");
    const cacheFault = "pcf_" + randomUUID().replace(/-/gu, "").slice(0, 16);
    await admin.unsafe("CREATE SEQUENCE atlas." + cacheFault + " START 1");
    await admin.unsafe("CREATE FUNCTION " + cacheFault + "_fn() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$ BEGIN IF nextval('atlas." + cacheFault + "') = 1 THEN RAISE EXCEPTION 'synthetic cache write failure'; END IF; RETURN NEW; END $$");
    await admin.unsafe("CREATE TRIGGER " + cacheFault + "_trigger BEFORE INSERT ON atlas.normalized_document_cache FOR EACH ROW EXECUTE FUNCTION " + cacheFault + "_fn()");
    try {
      assert.equal((await routes.deliver(serviceCredential, cacheFailure.request, resultFor(cacheFailure.request))).status, 400);
      await assertNoTrustedCompletion(cacheFailure, "cache-write failure");
    } finally {
      await admin.unsafe("DROP TRIGGER IF EXISTS " + cacheFault + "_trigger ON atlas.normalized_document_cache").catch(() => undefined);
      await admin.unsafe("DROP FUNCTION IF EXISTS " + cacheFault + "_fn()").catch(() => undefined);
      await admin.unsafe("DROP SEQUENCE IF EXISTS atlas." + cacheFault).catch(() => undefined);
    }
  } finally {
    for (const executionId of executionIds) await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]).catch(() => undefined);
    await Promise.all([admin.end(), atlas.end(), bridge.end()]);
    await rm(sourceRoot, { recursive: true, force: true });
  }
});
