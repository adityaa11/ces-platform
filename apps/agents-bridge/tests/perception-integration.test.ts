import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import postgres from "postgres";
import { createPerceptionInternalRoutes, PerceptionSourceGrantIssuer } from "@atlas/core";
import type { NormalizedDocument } from "@atlas/contracts";
import { PostgresPerceptionAuthority } from "@atlas/db";
import { LocalFilesystemDocumentStore } from "@atlas/document-store";
import { createAtlasPerceptionClients } from "../src/atlas-perception-client.ts";
import { documentPerceptionQueue } from "../src/perception-job.ts";
import { runDocumentPerception } from "../src/document-perception-worker.ts";
import { createPerceptionResultReplay } from "../src/perception-result-replay.ts";
import { createBackgroundWorker } from "../src/worker.ts";
import type { WorkerConfig } from "../src/worker-config.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const waitFor = async (predicate: () => Promise<boolean>, timeoutMs = 15_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the perception integration state.");
};

test("the queued PDF perception path crosses Atlas authority and completes idempotently", { skip }, async () => {
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 2 });
  const bridge = postgres(bridgeUrl.toString(), { max: 4 });
  const sourceRoot = await mkdtemp(join(tmpdir(), "atlas-perception-integration-"));
  const store = new LocalFilesystemDocumentStore(sourceRoot);
  const serviceCredential = "service-credential-that-is-at-least-32-bytes-long";
  const bytes = new Uint8Array(Buffer.from("%PDF-synthetic-atlas-perception%"));
  const stored = await store.put({ bytes, mediaType: "application/pdf" });
  const executionId = `perception-integration-${randomUUID()}`;
  const artifactId = `artifact-${randomUUID()}`;
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  const input = { executionId, artifactId, storageKey: stored.storageKey, sourceSha256, mimeType: "application/pdf" as const, byteSize: bytes.byteLength, idempotencyKey: `perception-integration-${randomUUID()}`, capabilityIdentity: "mistral-ocr:test-config" };
  const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer(serviceCredential));
  const request = await authority.create(input);
  const routes = createPerceptionInternalRoutes({ authority, sources: store, serviceCredential, maximumSourceBytes: 20 * 1024 * 1024, maximumResultBytes: 10 * 1024 * 1024 });
  let delivered: NormalizedDocument | undefined;
  let droppedAcknowledgement = false;
  const clients = createAtlasPerceptionClients({ baseUrl: "http://atlas.test", sourcePath: "/internal/perception/source", resultPath: "/internal/perception/result", serviceCredential, maximumSourceBytes: 20 * 1024 * 1024, maximumResultBytes: 10 * 1024 * 1024, timeoutMilliseconds: 5_000 }, async (url, init) => {
    const headers = init?.headers as Record<string, string>;
    const credential = headers.authorization?.replace(/^Bearer /u, "");
    const body = JSON.parse(String(init?.body));
    if (url.endsWith("/source")) {
      const response = await routes.redeem(credential, body);
      return new Response(response.body instanceof Uint8Array ? response.body : JSON.stringify(response.body), { status: response.status, headers: { "content-type": response.contentType } });
    }
    delivered = body.result as NormalizedDocument;
    const response = await routes.deliver(credential, body.request, body.result);
    if (!droppedAcknowledgement) {
      droppedAcknowledgement = true;
      return new Response(JSON.stringify({ error: "synthetic acknowledgement loss" }), { status: 503, headers: { "content-type": "application/json" } });
    }
    return new Response(response.status === 204 ? null : JSON.stringify(response.body), { status: response.status, headers: { "content-type": response.contentType } });
  });
  const providerCalls: number[] = [];
  const provider = {
    async perceive(inputValue: { readonly bytes: Uint8Array; readonly mimeType: string }, signal: AbortSignal) {
      assert.equal(inputValue.mimeType, "application/pdf");
      assert.deepEqual([...inputValue.bytes], [...bytes]);
      providerCalls.push(Date.now());
      if (providerCalls.length === 1) throw new Error("synthetic provider retry");
      if (signal.aborted) throw new Error("synthetic cancellation");
      return {
        providerResult: { pages: [{ index: 0, markdown: "Synthetic PDF text", images: [{ id: "figure-1", label: "diagram", bbox: [1, 2, 11, 22], assetRef: "derived/integration/figure-1.png" }] }] },
        provenance: { provider: "mistral" as const, model: "ocr-qualified", endpoint: "/v1/ocr" as const, latencyMilliseconds: 1, attempt: 1 },
      };
    },
  };
  const queueName = `atlas-perception-integration-${randomUUID()}`;
  const perceptionQueueName = `${documentPerceptionQueue}-test-${randomUUID()}`;
  const config: WorkerConfig = { databaseUrl: bridgeUrl.toString(), concurrency: 1, timeoutSeconds: 5, retryLimit: 1, retryDelaySeconds: 1, shutdownTimeoutMilliseconds: 1_000 };
  const worker = createBackgroundWorker(config, { async *execute() { yield { type: "complete" as const }; } }, queueName, async (queuedRequest, signal, context) => {
    const store = createPerceptionResultReplay(context.database);
    await runDocumentPerception(queuedRequest, provider as never, clients.source, clients.results, signal, { idempotencyKey: context.idempotencyKey, store });
  }, perceptionQueueName);
  try {
    assert.equal((await routes.redeem("wrong-credential", request)).status, 401);
    assert.equal((await routes.redeem(serviceCredential, { ...request, executionId: "wrong-execution" })).status, 400);
    await worker.start();
    await worker.boss.send(perceptionQueueName, { idempotencyKey: input.idempotencyKey, request }, { singletonKey: input.idempotencyKey });
    await waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [executionId]))[0]?.state === "completed");
    await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [input.idempotencyKey]))[0]?.status === "completed");
    assert.equal(providerCalls.length, 2, "provider failure retries once; the lost acknowledgement replays staged output without a third provider call");
    assert.ok(delivered);
    assert.equal(delivered?.pages[0]?.number, 1);
    assert.equal(delivered?.pages[0]?.textBlocks[0]?.text, "Synthetic PDF text");
    assert.equal(delivered?.pages[0]?.visualRegions[0]?.assetRef, "derived/integration/figure-1.png");

    const cacheRows = await atlas.unsafe("SELECT normalized_document, derived_assets FROM atlas.normalized_document_cache WHERE source_sha256=$1 AND capability_identity=$2 AND invalidated_at IS NULL", [sourceSha256, input.capabilityIdentity]);
    assert.equal(cacheRows.length, 1);
    const derivedAssets = typeof cacheRows[0]?.derived_assets === "string" ? JSON.parse(cacheRows[0].derived_assets) : cacheRows[0]?.derived_assets;
    assert.deepEqual(derivedAssets, ["derived/integration/figure-1.png"]);
    assert.equal((await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [input.idempotencyKey]))[0]?.status, "completed");
    assert.equal((await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1", [input.idempotencyKey]))[0]?.count, 0, "the replay outbox is removed only after the successful acknowledgement");
    const queuedRows = await bridge.unsafe("SELECT data::text AS data FROM pgboss.job WHERE name=$1", [perceptionQueueName]);
    assert.ok(queuedRows.length >= 1);
    assert.ok(queuedRows.every((row) => !String(row.data).includes("%PDF-synthetic") && !String(row.data).includes(stored.storageKey)));

    assert.equal((await routes.deliver(serviceCredential, request, delivered)).status, 204, "acknowledgement replay must remain idempotent");
    await authority.invalidateCache({ sourceSha256, perception: request.perception, capabilityIdentity: input.capabilityIdentity });
    assert.equal(await authority.getCached({ sourceSha256, perception: request.perception, capabilityIdentity: input.capabilityIdentity }), undefined);
  } finally {
    await worker.stop().catch(() => undefined);
    await atlas.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key=$1", [input.idempotencyKey]).catch(() => undefined);
    await bridge.unsafe("DELETE FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1", [input.idempotencyKey]).catch(() => undefined);
    await Promise.all([atlas.end(), bridge.end()]);
    await rm(sourceRoot, { recursive: true, force: true });
  }
});
