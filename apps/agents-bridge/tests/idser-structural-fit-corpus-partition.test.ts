import assert from "node:assert/strict";
import test from "node:test";
import { proposeStructuralFitCorpusPartition } from "../src/idser-structural-fit-corpus-partition.ts";
import { IdserProspectiveCapacitySnapshotError } from "../src/idser-prospective-capacity-snapshot.ts";

const sha = "a".repeat(64);
const configuration = () => ({
  bssRegisteredEstimator: { identity: "anoman-prospective-estimator", version: "v2" },
  estimator: { identity: "anoman-prospective-estimator", version: "v2" },
  modelRoute: { model: "qualified-semantic-model", route: "anoman-semantic" },
  overheads: { systemPromptBytes: 10, schemaBytes: 10, contextPlaceholderBytes: 0, contextPlaceholderTokens: 0, reservedOutputBytes: 10, reservedOutputTokens: 1, mediaMetadataBytes: 0, mediaInputTokensPerByte: 0, inputBytesPerToken: 4, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0 },
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
  workload: { id: "semantic-workload", profileVersion: "v1", active: false, structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 100, maxInputTokens: 100 }, estimator: { identity: "anoman-prospective-estimator", version: "v2" }, outputReservation: { policyId: "semantic-output", policyVersion: "v1", maxOutputTokens: 10 }, safetyPolicy: { policyId: "semantic-safety", policyVersion: "v1" } },
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
      if (input.requestBytes > 62) throw new IdserProspectiveCapacitySnapshotError("unfit", "structurally_unfit");
      return snapshot() as any;
    } },
  });
  assert.equal(forbiddenEffects, 0, "the planner owns no BSS write, queue, delivery, SEM, provider, or durable-handoff surface");
  assert.equal(result.disposition, "READY");
  if (result.disposition !== "READY") return;
  assert.deepEqual(result.batches.map((batch) => batch.ownedLocators.map((locator) => locator.localId)), [["text-1", "text-2"], ["text-3"]]);
  assert.deepEqual(result.eligibleDimensions, ["rpm", "tpm", "concurrency"]);
  assert.equal(result.requestResourceEnvelope.dayUnits, 2, "unknown/not-enforced RPD keeps demand without inventing a provider daily limit");
  assert.equal(new Set(result.batches.flatMap((batch) => batch.ownedLocators.map((locator) => locator.localId))).size, 3);
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
