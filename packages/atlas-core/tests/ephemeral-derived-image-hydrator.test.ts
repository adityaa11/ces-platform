import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { DerivedImageGrantIssuer, EphemeralDerivedImageHydrator, createDerivedImageManifestSha256, type DerivedImageAssetReader, type DerivedImageGrantAuthority, type DerivedImageGrantScope, type DerivedImageManifest } from "../src/index.ts";

const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gL+ZK2mXQAAAABJRU5ErkJggg==", "base64"));
const baseManifest = {
  projectId: "project-a",
  workspaceId: "workspace-a",
  documentId: "document-a",
  perceptionExecutionId: "perception-a",
  sourceSha256: "a".repeat(64),
  profile: "atlas-stepwise-multimodal-v031",
  pageNumber: 2,
  locatorId: "figure-a",
  assetRef: "derived/11111111-1111-4111-8111-111111111111",
  mediaType: "image/png" as const,
  width: 1,
  height: 1,
  byteLength: png.byteLength,
  sha256: createHash("sha256").update(png).digest("hex"),
};
const manifest: DerivedImageManifest = { ...baseManifest, manifestSha256: createDerivedImageManifestSha256(baseManifest) };
const scope: DerivedImageGrantScope = {
  serviceIdentity: "atlas.semantic-hydrator/v1",
  projectId: "project-a",
  workspaceId: "workspace-a",
  documentId: manifest.documentId,
  perceptionExecutionId: manifest.perceptionExecutionId,
  sourceSha256: manifest.sourceSha256,
  profile: manifest.profile,
  pageNumber: manifest.pageNumber,
  locatorId: manifest.locatorId,
  assetRef: manifest.assetRef,
  manifestSha256: manifest.manifestSha256,
  mediaType: manifest.mediaType,
  imageSha256: manifest.sha256,
  width: manifest.width,
  height: manifest.height,
  byteLength: manifest.byteLength,
  authorization: { kind: "semantic_execution", executionId: "semantic-execution-a" },
};

class FakeGrantAuthority implements DerivedImageGrantAuthority {
  calls = 0;
  async assertAuthorized(actual: DerivedImageGrantScope): Promise<void> {
    this.calls += 1;
    assert.deepEqual(actual, scope, "only the exact approved service scope is authorized");
  }
}

class FakeAssets implements DerivedImageAssetReader {
  calls = 0;
  readonly effects = { externalProviderAttempts: 0, semanticJobs: 0, perceptionJobs: 0, reservations: 0, persistenceWrites: 0 };
  constructor(private readonly result: { readonly manifest: DerivedImageManifest; readonly bytes: Uint8Array } = { manifest, bytes: png }) {}
  async read(actual: DerivedImageGrantScope, signal: AbortSignal): Promise<{ readonly manifest: DerivedImageManifest; readonly bytes: Uint8Array }> {
    this.calls += 1;
    assert.deepEqual(actual, scope, "the reader receives only the redeemed scope, never a key or browser credential");
    if (signal.aborted) throw new Error("reader cancelled");
    return this.result;
  }
}

async function issuedHydrator(assets = new FakeAssets(), now: () => number = () => 1_000) {
  const authority = new FakeGrantAuthority();
  const grants = new DerivedImageGrantIssuer("s".repeat(32), scope.serviceIdentity, now);
  const issued = await grants.issue(scope, authority, 100);
  return { authority, assets, grants, issued, hydrator: new EphemeralDerivedImageHydrator(grants, authority, assets) };
}

test("verified ephemeral hydration returns one bounded PNG without durable side effects", async () => {
  const { authority, assets, issued, hydrator } = await issuedHydrator();
  const image = await hydrator.hydrate({ grant: issued.grant, replayFenceId: issued.replayFenceId, scope }, new AbortController().signal);

  assert.deepEqual(image, { mediaType: "image/png", width: 1, height: 1, byteLength: png.byteLength, sha256: manifest.sha256, bytes: png });
  assert.equal(authority.calls, 2, "the grant is rechecked immediately before the one-time read");
  assert.equal(assets.calls, 1);
  assert.deepEqual(assets.effects, { externalProviderAttempts: 0, semanticJobs: 0, perceptionJobs: 0, reservations: 0, persistenceWrites: 0 });
});

test("hydration fails closed for missing, corrupt, mismatched, oversized, and expired retained assets", async () => {
  const cases: readonly [string, { readonly manifest: DerivedImageManifest; readonly bytes: Uint8Array } | undefined][] = [
    ["missing file", undefined],
    ["hash corruption", { manifest, bytes: Uint8Array.from([...png, 0]) }],
    ["wrong dimensions", { manifest: { ...manifest, width: 2, manifestSha256: createDerivedImageManifestSha256({ ...baseManifest, width: 2 }) }, bytes: png }],
    ["wrong source", { manifest: { ...manifest, sourceSha256: "b".repeat(64), manifestSha256: createDerivedImageManifestSha256({ ...baseManifest, sourceSha256: "b".repeat(64) }) }, bytes: png }],
    ["wrong media type", { manifest: { ...manifest, mediaType: "image/jpeg" as never }, bytes: png }],
    ["oversized payload", { manifest: { ...manifest, byteLength: 10 * 1024 * 1024 + 1, sha256: createHash("sha256").update(new Uint8Array(10 * 1024 * 1024 + 1)).digest("hex"), manifestSha256: createDerivedImageManifestSha256({ ...baseManifest, byteLength: 10 * 1024 * 1024 + 1, sha256: createHash("sha256").update(new Uint8Array(10 * 1024 * 1024 + 1)).digest("hex") }) }, bytes: new Uint8Array(10 * 1024 * 1024 + 1) }],
  ];

  for (const [label, result] of cases) {
    const assets: DerivedImageAssetReader = result ? new FakeAssets(result) : { read: async () => { throw new Error("file not found"); } };
    const { issued, hydrator } = await issuedHydrator(assets as FakeAssets);
    await assert.rejects(() => hydrator.hydrate({ grant: issued.grant, replayFenceId: issued.replayFenceId, scope }, new AbortController().signal), /Ephemeral image hydration failed/, label);
  }

  let now = 1_000;
  const { issued, hydrator } = await issuedHydrator(new FakeAssets(), () => now);
  now = 1_100;
  await assert.rejects(() => hydrator.hydrate({ grant: issued.grant, replayFenceId: issued.replayFenceId, scope }, new AbortController().signal), /Ephemeral image hydration failed/, "expired grants do not reach storage");
});

test("duplicate, restart, and cancellation paths never read a second image or create work", async () => {
  const { authority, assets, grants, issued, hydrator } = await issuedHydrator();
  const redemption = { grant: issued.grant, replayFenceId: issued.replayFenceId, scope };
  await hydrator.hydrate(redemption, new AbortController().signal);
  await assert.rejects(() => hydrator.hydrate(redemption, new AbortController().signal), /Ephemeral image hydration failed/, "duplicate read is replay-blocked before storage");
  assert.equal(assets.calls, 1);

  const restarted = new EphemeralDerivedImageHydrator(new DerivedImageGrantIssuer("s".repeat(32), scope.serviceIdentity, () => 1_000), authority, assets);
  await assert.rejects(() => restarted.hydrate(redemption, new AbortController().signal), /Ephemeral image hydration failed/, "a restart cannot reconstruct an in-memory grant");
  assert.equal(assets.calls, 1, "restart denial never opens retained bytes");

  const second = await grants.issue(scope, authority, 100);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(() => hydrator.hydrate({ grant: second.grant, replayFenceId: second.replayFenceId, scope }, controller.signal), /cancelled/, "an already-aborted request cannot consume a grant or read bytes");
  assert.equal(assets.calls, 1);
  await hydrator.hydrate({ grant: second.grant, replayFenceId: second.replayFenceId, scope }, new AbortController().signal);
  assert.equal(assets.calls, 2, "the pre-abort did not mint state or consume the one-time grant");
  assert.deepEqual(assets.effects, { externalProviderAttempts: 0, semanticJobs: 0, perceptionJobs: 0, reservations: 0, persistenceWrites: 0 });
});
