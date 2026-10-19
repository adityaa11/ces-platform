import assert from "node:assert/strict";
import test from "node:test";
import { proposeStructuralFitCorpusPartition } from "../src/idser-structural-fit-corpus-partition.ts";
import { IdserProspectiveCapacitySnapshotError } from "../src/idser-prospective-capacity-snapshot.ts";

const sha = "a".repeat(64);
const configuration = () => ({
  estimator: { identity: "anoman-semantic-complete-request", version: "v1" },
  configuration: { identity: "anoman-semantic-request-accounting", version: "v1" },
  inputBytesPerToken: 4,
  framingAllowanceBytes: 0,
  requestByteSafetyMargin: 0,
  inputTokenSafetyMargin: 0,
  reservedOutputTokens: 1,
  requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 },
});
const accepted = (texts = ["a", "b", "c"]) => ({
  scope: { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document" },
  source: { documentId: "document", sourceSha256: sha }, rel: { state: "unavailable" as const },
  normalizedDocument: { version: "v1" as const, executionId: "execution", artifactId: "document", sourceSha256: sha, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "docling", processor: "pdf", executionId: "execution", processedAt: "2026-10-19T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: texts.map((text, index) => ({ id: `text-${index + 1}`, text })), tables: [], visualRegions: [] }] },
  media: [],
});

const snapshot = (sourceVersion = "v1") => ({
  apiVersion: "CapacityPlanningSnapshot/v1" as const, status: "inactive" as const, reason: "prospective_planning_only" as const, view: "prospective-planning-only" as const, readIsNotAdmissionPermit: true as const, plan: null,
  source: { quotaDomainId: "anoman", providerCapacityProfileVersion: "v1", capacitySource: "provider_api", sourceRef: "provider://limits", sourceVersion, limits: { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } } },
  enforcement: { apiVersion: "EffectiveEnforcementPolicy/v1", quotaDomainId: "anoman", providerCapacityProfileVersion: "v1", routeId: "anoman-semantic", policyId: "capacity-policy", policyVersion: "v1", providerProfileProvenance: { capacitySource: "provider_api", sourceRef: "provider://limits", sourceVersion }, dimensions: { rpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 20 }, tpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 40_000 }, rpd: { mode: "not_enforced", providerState: "unknown", approvalRef: "approved-rpd-unknown" }, concurrency: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 25 } } },
  process: { id: "semantic", profileVersion: "v1", serviceClass: "background", active: false },
  workload: { id: "semantic-workload", profileVersion: "v1", active: false, structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 100_000, maxInputTokens: 100_000, maxPromptBytes: 100_000, maxContextTokens: 100_010 }, estimator: { identity: "anoman-semantic-complete-request", version: "v1" }, outputReservation: { policyId: "semantic-output", policyVersion: "v1", maxOutputTokens: 10 }, safetyPolicy: { policyId: "semantic-safety", policyVersion: "v1" } },
  eligibleDimensions: ["rpm", "tpm", "concurrency"] as const,
  requestResourceEnvelope: { requestUnits: 1, tokenUnits: 1, dayUnits: 1, concurrencyUnits: 1 },
});

test("composes the approved reader and estimator into deterministic full-coverage immutable batches", async () => {
  const reads: { requestBytes: number; inputTokens: number }[] = [];
  let forbiddenEffects = 0;
  const result = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted(), estimatorConfiguration: configuration(),
    capacityConsumer: { read: async (input) => {
      reads.push({ requestBytes: input.requestBytes, inputTokens: input.inputTokens });
      if (input.requestBytes > 36_800) throw new IdserProspectiveCapacitySnapshotError("unfit", "structurally_unfit");
      return snapshot() as any;
    } },
  });
  assert.equal(forbiddenEffects, 0, "the planner owns no BSS write, queue, delivery, SEM, provider, or durable-handoff surface");
  assert.equal(result.disposition, "READY", JSON.stringify(result));
  if (result.disposition !== "READY") return;
  assert.deepEqual(result.batches.map((batch) => batch.ownedLocators.map((locator) => locator.locatorId)), [["text-1", "text-2"], ["text-3"]]);
  assert.deepEqual(result.eligibleDimensions, ["rpm", "tpm", "concurrency"]);
  assert.equal(result.requestResourceEnvelope.dayUnits, 2, "unknown/not-enforced RPD keeps demand without inventing a provider daily limit");
  assert.equal(new Set(result.batches.flatMap((batch) => batch.ownedLocators.map((locator) => locator.locatorId))).size, 3);
  assert.equal(result.fitTrace.some((entry) => entry.outcome === "unfit"), true, "the BSS structural rejection caused a deterministic smaller retry");
  assert.deepEqual(reads[0], { requestBytes: 0, inputTokens: 0 }, "the first pinned read is authenticated planning-only structural metadata");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.batches[0]!.ownedLocators), true);

  const knownRpd = snapshot() as any;
  knownRpd.source.limits.rpd = { state: "known", value: 1_000 };
  knownRpd.enforcement.dimensions.rpd = { mode: "enforced", providerState: "known", limitSource: "provider", limit: 1_000 };
  knownRpd.eligibleDimensions = ["rpm", "tpm", "rpd", "concurrency"];
  const knownRpdProposal = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted(["a"]), estimatorConfiguration: configuration(), capacityConsumer: { read: async () => knownRpd },
  });
  assert.equal(knownRpdProposal.disposition, "READY");
  if (knownRpdProposal.disposition === "READY") {
    assert.deepEqual(knownRpdProposal.eligibleDimensions, ["rpm", "tpm", "rpd", "concurrency"]);
    assert.equal((knownRpdProposal.bssSnapshot.enforcement.dimensions as any).rpd.limit, 1_000, "the known RPD policy remains BSS-owned pinned proposal data");
  }
});

test("returns typed no-source and indivisible block results without fabricating a batch", async () => {
  const emptyReads: unknown[] = [];
  const empty = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted([]), estimatorConfiguration: configuration(),
    capacityConsumer: { read: async (input) => { emptyReads.push(input); return snapshot() as any; } },
  });
  assert.deepEqual(empty, { disposition: "NO_ELIGIBLE_SOURCE", reason: "NO_ELIGIBLE_SOURCE", units: [], fitTrace: [] });
  assert.equal(emptyReads.length, 1);

  const indivisible = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted(["this source cannot fit"]), estimatorConfiguration: configuration(),
    capacityConsumer: { read: async (input) => input.requestBytes === 0 ? snapshot() as any : Promise.reject(new IdserProspectiveCapacitySnapshotError("unfit", "structurally_unfit")) },
  });
  assert.equal(indivisible.disposition, "BLOCKED");
  assert.equal(indivisible.reason, "INDIVISIBLE_STRUCTURAL_UNIT");
});

test("keeps visuals as explicit unexamined inventory while valid text remains structurally ready", async () => {
  const withVisual = accepted(["text"]);
  withVisual.normalizedDocument.pages[0]!.visualRegions = [{ id: "figure", label: "A meaningful visual", assetRef: "derived/figure.png" }];
  withVisual.media = [{ pageNumber: 1, locatorId: "figure", assetRef: "derived/figure.png", mediaType: "image/png" as const, sha256: "b".repeat(64), byteLength: 12 }];
  const result = await proposeStructuralFitCorpusPartition({
    acceptedDocument: withVisual as any, estimatorConfiguration: configuration(), capacityConsumer: { read: async () => snapshot() as any },
  });
  assert.equal(result.disposition, "READY");
  if (result.disposition !== "READY") return;
  assert.deepEqual(result.batches.map((batch) => batch.ownedLocators.map((locator) => locator.locatorId)), [["text-1"]]);
  assert.deepEqual(result.units.find((unit) => unit.locator.locatorId === "figure"), {
    locator: { pageNumber: 1, locatorType: "visual_region", locatorId: "figure" }, classification: "unexamined", reason: "image_accounting_unavailable",
  });
});

test("blocks a foreign BSS estimator identity before proposing a structural partition", async () => {
  const foreignRoute = configuration();
  foreignRoute.estimator = { ...foreignRoute.estimator, identity: "foreign-semantic" };
  let reads = 0;
  const result = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted(["a"]), estimatorConfiguration: foreignRoute,
    capacityConsumer: { read: async () => { reads += 1; return snapshot() as any; } },
  });
  assert.deepEqual(result, {
    disposition: "BLOCKED",
    reason: "BSS_CAPACITY_CONSUMER_READ_GAP",
    units: result.units,
    fitTrace: [],
  });
  assert.equal(result.disposition, "BLOCKED");
  assert.equal(result.reason, "BSS_CAPACITY_CONSUMER_READ_GAP");
  assert.equal(reads, 1, "the foreign route cannot reach a candidate fit read or proposal");
});

test("fails closed for authenticated route-prompt or context-window overages and later reader failures", async () => {
  for (const [name, revise] of [
    ["route prompt", (value: any) => { value.workload.structuralBound.maxPromptBytes = 1; }],
    ["context window", (value: any) => { value.workload.structuralBound.maxContextTokens = 10; }],
  ] as const) {
    const constrained = snapshot() as any;
    revise(constrained);
    const result = await proposeStructuralFitCorpusPartition({
      acceptedDocument: accepted(["a"]), estimatorConfiguration: configuration(), capacityConsumer: { read: async () => constrained },
    });
    assert.equal(result.disposition, "BLOCKED", name);
    assert.equal(result.reason, "INDIVISIBLE_STRUCTURAL_UNIT", name);
    assert.equal(result.fitTrace.at(-1)?.outcome, "unfit", name);
  }

  let calls = 0;
  const unavailable = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted(["a"]), estimatorConfiguration: configuration(),
    capacityConsumer: { read: async () => {
      if (calls++ === 0) return snapshot() as any;
      throw new IdserProspectiveCapacitySnapshotError("reader unavailable");
    } },
  });
  assert.deepEqual(unavailable.disposition, "BLOCKED");
  assert.equal(unavailable.reason, "BSS_CAPACITY_CONSUMER_READ_GAP");
  assert.equal(unavailable.fitTrace.length, 0);
});

test("retains visual inventory when media identity validation fails", async () => {
  const visualDocument = () => {
    const document = accepted(["text"]);
    document.normalizedDocument.pages[0]!.visualRegions = [{ id: "figure", label: "A meaningful visual", assetRef: "derived/figure.png" }];
    document.media = [{ pageNumber: 1, locatorId: "figure", assetRef: "derived/figure.png", mediaType: "image/png" as const, sha256: "b".repeat(64), byteLength: 12 }];
    return document;
  };
  const cases: readonly [string, (document: ReturnType<typeof visualDocument>) => void][] = [
    ["foreign", (document) => { document.media[0]!.assetRef = "derived/foreign.png"; }],
    ["duplicate", (document) => { document.media.push({ ...document.media[0]! }); }],
    ["malformed", (document) => { document.media[0]!.sha256 = "invalid"; }],
  ];
  for (const [name, corrupt] of cases) {
    const document = visualDocument();
    corrupt(document);
    const result = await proposeStructuralFitCorpusPartition({
      acceptedDocument: document as any, estimatorConfiguration: configuration(), capacityConsumer: { read: async () => snapshot() as any },
    });
    assert.equal(result.disposition, "BLOCKED", name);
    assert.equal(result.reason, "SEM_BATCH_ESTIMATOR_GAP", name);
    assert.deepEqual(result.units.find((unit) => unit.locator.locatorId === "figure"), {
      locator: { pageNumber: 1, locatorType: "visual_region", locatorId: "figure" }, classification: "unexamined", reason: "image_accounting_unavailable",
    }, name);
    assert.deepEqual(result.fitTrace, [], name);
  }
});

test("fences changed BSS revisions and emits a new immutable replan instead of mutating a predecessor", async () => {
  let calls = 0;
  const stale = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted(["a"]), estimatorConfiguration: configuration(),
    capacityConsumer: { read: async () => snapshot(calls++ === 0 ? "v1" : "v2") as any },
  });
  assert.equal(stale.disposition, "BLOCKED");
  assert.equal(stale.reason, "STRUCTURAL_REVISION_CHANGED");

  const first = await proposeStructuralFitCorpusPartition({ acceptedDocument: accepted(["a"]), estimatorConfiguration: configuration(), capacityConsumer: { read: async () => snapshot() as any } });
  if (first.disposition !== "READY") throw new Error("fixture should plan");
  const replan = await proposeStructuralFitCorpusPartition({
    acceptedDocument: accepted(["a"]), estimatorConfiguration: configuration(),
    previousProposal: { ...first, sourceHash: "changed-source" },
    capacityConsumer: { read: async () => snapshot() as any },
  });
  assert.equal(replan.disposition, "REPLAN");
  if (replan.disposition !== "REPLAN") return;
  assert.deepEqual(replan.replanPredecessor, { proposalId: first.proposalId, proposalHash: first.proposalHash });
  assert.notEqual(replan.proposalId, first.proposalId);
});
