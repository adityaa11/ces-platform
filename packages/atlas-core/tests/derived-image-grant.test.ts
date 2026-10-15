import assert from "node:assert/strict";
import test from "node:test";
import { DerivedImageGrantIssuer, type DerivedImageGrantAuthority, type DerivedImageGrantScope } from "../src/index.ts";

const scope: DerivedImageGrantScope = {
  serviceIdentity: "atlas.semantic-hydrator/v1",
  projectId: "project-a",
  workspaceId: "workspace-a",
  documentId: "document-a",
  perceptionExecutionId: "perception-a",
  sourceSha256: "a".repeat(64),
  profile: "atlas-stepwise-multimodal-v031",
  pageNumber: 2,
  locatorId: "figure-a",
  assetRef: "derived/11111111-1111-4111-8111-111111111111",
  manifestSha256: "b".repeat(64),
  mediaType: "image/png",
  imageSha256: "c".repeat(64),
  width: 1,
  height: 1,
  byteLength: 1,
  authorization: { kind: "semantic_execution", executionId: "semantic-execution-a" },
};

class FakeAuthority implements DerivedImageGrantAuthority {
  current = true;
  calls = 0;
  constructor(private readonly expected: DerivedImageGrantScope) {}
  async assertAuthorized(actual: DerivedImageGrantScope): Promise<void> {
    this.calls += 1;
    if (!this.current) throw new Error("Semantic execution is no longer current.");
    assert.deepEqual(actual, this.expected, "foreign tenant/project/document/profile/execution cannot be authorized");
  }
}

class BlockingAuthority implements DerivedImageGrantAuthority {
  calls = 0;
  readonly entered: Promise<void>;
  readonly #release: Promise<void>;
  #enter!: () => void;
  #unblock!: () => void;

  constructor(private readonly expected: DerivedImageGrantScope) {
    this.entered = new Promise((resolve) => { this.#enter = resolve; });
    this.#release = new Promise((resolve) => { this.#unblock = resolve; });
  }

  async assertAuthorized(actual: DerivedImageGrantScope): Promise<void> {
    this.calls += 1;
    assert.deepEqual(actual, this.expected, "the authority receives the exact grant scope");
    this.#enter();
    await this.#release;
  }

  release(): void { this.#unblock(); }
}

test("service-only derived-image grants bind every manifest identity and consume one replay fence", async () => {
  const authority = new FakeAuthority(scope);
  const issuer = new DerivedImageGrantIssuer("s".repeat(32), scope.serviceIdentity, () => 1_000);
  const issued = await issuer.issue(scope, authority, 100);
  assert.equal(issued.grant.includes(scope.assetRef), false, "the opaque grant never exposes a storage-like asset reference");
  assert.equal(issued.expiresAt, 1_100);
  assert.deepEqual(await issuer.redeem({ grant: issued.grant, replayFenceId: issued.replayFenceId, scope }, authority), scope);
  await assert.rejects(() => issuer.redeem({ grant: issued.grant, replayFenceId: issued.replayFenceId, scope }, authority), /replay/i);
  assert.equal(authority.calls, 2, "authority is checked at issue and immediately before single-use redemption");
});

test("concurrent redemption claims a replay fence before awaiting authority validation", async () => {
  const issuer = new DerivedImageGrantIssuer("s".repeat(32), scope.serviceIdentity, () => 1_000);
  const issued = await issuer.issue(scope, new FakeAuthority(scope), 100);
  const authority = new BlockingAuthority(scope);
  const redemption = { grant: issued.grant, replayFenceId: issued.replayFenceId, scope };

  const outcomesPromise = Promise.allSettled([
    issuer.redeem(redemption, authority),
    issuer.redeem(redemption, authority),
  ]);
  await authority.entered;
  assert.equal(authority.calls, 1, "the overlapping loser is rejected before reaching asynchronous authority validation");
  authority.release();

  const outcomes = await outcomesPromise;
  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  const rejected = outcomes.filter((outcome): outcome is PromiseRejectedResult => outcome.status === "rejected");
  assert.equal(rejected.length, 1);
  assert.match(String(rejected[0].reason), /replay/i);
  assert.deepEqual(outcomes.find((outcome) => outcome.status === "fulfilled"), { status: "fulfilled", value: scope });
  await assert.rejects(() => issuer.redeem(redemption, authority), /replay/i);
  assert.equal(authority.calls, 1, "neither the concurrent loser nor a later attempt can obtain another authorization outcome");
});

test("failed authority recheck leaves the replay fence consumed", async () => {
  const authority = new FakeAuthority(scope);
  const issuer = new DerivedImageGrantIssuer("s".repeat(32), scope.serviceIdentity, () => 1_000);
  const issued = await issuer.issue(scope, authority, 100);
  const redemption = { grant: issued.grant, replayFenceId: issued.replayFenceId, scope };

  authority.current = false;
  await assert.rejects(() => issuer.redeem(redemption, authority), /no longer current/i);
  authority.current = true;
  await assert.rejects(() => issuer.redeem(redemption, authority), /replay/i);
  assert.equal(authority.calls, 2, "the failed recheck does not reopen the grant for another authorization check");
});

test("a narrowly scoped offline grant is an alternative authority and expires fail-closed", async () => {
  let now = 1_000;
  const offlineScope: DerivedImageGrantScope = { ...scope, authorization: { kind: "offline_grant", offlineGrantId: "offline-grant-a" } };
  const authority = new FakeAuthority(offlineScope);
  const issuer = new DerivedImageGrantIssuer("s".repeat(32), offlineScope.serviceIdentity, () => now);
  const issued = await issuer.issue(offlineScope, authority, 10);
  assert.equal((await issuer.redeem({ grant: issued.grant, replayFenceId: issued.replayFenceId, scope: offlineScope }, authority)).authorization.kind, "offline_grant");
  const expired = await issuer.issue(offlineScope, authority, 10);
  now = 1_010;
  await assert.rejects(() => issuer.redeem({ grant: expired.grant, replayFenceId: expired.replayFenceId, scope: offlineScope }, authority), /expired/i);
});

test("fake authority denies scope, credential, stale, replay, tamper, cookie, and media violations before any media effect", async () => {
  const authority = new FakeAuthority(scope);
  const issuer = new DerivedImageGrantIssuer("s".repeat(32), scope.serviceIdentity, () => 1_000);
  const effects = { mediaAccess: 0, externalProviderAttempts: 0, semanticJobs: 0, perceptionJobs: 0, reservations: 0 };
  const issue = () => issuer.issue(scope, authority, 100);

  const foreign = await issue();
  await assert.rejects(() => issuer.redeem({ grant: foreign.grant, replayFenceId: foreign.replayFenceId, scope: { ...scope, workspaceId: "workspace-b" } }, authority), /scope mismatch/i);
  const wrongProject = await issue();
  await assert.rejects(() => issuer.redeem({ grant: wrongProject.grant, replayFenceId: wrongProject.replayFenceId, scope: { ...scope, projectId: "project-b" } }, authority), /scope mismatch/i);
  const wrongDocument = await issue();
  await assert.rejects(() => issuer.redeem({ grant: wrongDocument.grant, replayFenceId: wrongDocument.replayFenceId, scope: { ...scope, documentId: "document-b" } }, authority), /scope mismatch/i);
  const wrongProfile = await issue();
  await assert.rejects(() => issuer.redeem({ grant: wrongProfile.grant, replayFenceId: wrongProfile.replayFenceId, scope: { ...scope, profile: "profile-b" } }, authority), /scope mismatch/i);
  const wrongExecution = await issue();
  await assert.rejects(() => issuer.redeem({ grant: wrongExecution.grant, replayFenceId: wrongExecution.replayFenceId, scope: { ...scope, authorization: { kind: "semantic_execution", executionId: "semantic-execution-b" } } }, authority), /scope mismatch/i);
  const wrongLocator = await issue();
  await assert.rejects(() => issuer.redeem({ grant: wrongLocator.grant, replayFenceId: wrongLocator.replayFenceId, scope: { ...scope, locatorId: "figure-b" } }, authority), /scope mismatch/i);
  const wrongReference = await issue();
  await assert.rejects(() => issuer.redeem({ grant: wrongReference.grant, replayFenceId: wrongReference.replayFenceId, scope: { ...scope, assetRef: "derived/22222222-2222-4222-8222-222222222222" } }, authority), /scope mismatch/i);
  const tampered = await issue();
  await assert.rejects(() => issuer.redeem({ grant: `${tampered.grant}0`, replayFenceId: tampered.replayFenceId, scope }, authority), /invalid/i);
  await assert.rejects(() => issuer.issue({ ...scope, mediaType: "image/jpeg" }, authority), /unsupported/i);
  await assert.rejects(() => issuer.redeem({ grant: tampered.grant, replayFenceId: tampered.replayFenceId, scope, cookie: "borrowed-user-session" }, authority), /redemption is invalid/i);
  const unauthenticated = await issue();
  await assert.rejects(() => issuer.redeem({ grant: unauthenticated.grant, replayFenceId: unauthenticated.replayFenceId, scope: { ...scope, serviceIdentity: "atlas.untrusted/v1" } }, authority), /unauthorized/i);

  const stale = await issue();
  authority.current = false;
  await assert.rejects(() => issuer.redeem({ grant: stale.grant, replayFenceId: stale.replayFenceId, scope }, authority), /no longer current/i);
  authority.current = true;
  const replay = await issue();
  await issuer.redeem({ grant: replay.grant, replayFenceId: replay.replayFenceId, scope }, authority);
  await assert.rejects(() => issuer.redeem({ grant: replay.grant, replayFenceId: replay.replayFenceId, scope }, authority), /replay/i);

  assert.deepEqual(effects, { mediaAccess: 0, externalProviderAttempts: 0, semanticJobs: 0, perceptionJobs: 0, reservations: 0 });
});
